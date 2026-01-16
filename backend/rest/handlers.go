package rest

import (
	"fmt"
	"image"
	"image/jpeg"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/disintegration/imaging"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"instagram-clone/ws" // Make sure this matches your go.mod name
)

// Data Models
type ImageMeta struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Tags      []string  `json:"tags"`
	URL       string    `json:"url"`
	CreatedAt time.Time `json:"created_at"`
}

type ImageJob struct {
	File     image.Image
	Meta     ImageMeta
	Filename string
}

// In-Memory Database
var ImageStore = []ImageMeta{}

// Job Queue (Bonus Requirement: Queuing for file processing)
var JobQueue = make(chan ImageJob, 100)

// StartWorker processes images in the background
func StartWorker(hub *ws.Hub) {
	go func() {
		fmt.Println("Worker started, waiting for jobs...")
		for job := range JobQueue {
			// 1. Crop and Scale to 512x512
			dstImage := imaging.Fill(job.File, 512, 512, imaging.Center, imaging.Lanczos)

			// 2. Save to disk
			outPath := filepath.Join("uploads", job.Filename)
			f, err := os.Create(outPath)
			if err != nil {
				fmt.Printf("Error creating file: %v\n", err)
				continue
			}

			// Encode as JPEG
			jpeg.Encode(f, dstImage, nil)
			f.Close()

			// 3. Add to store (Prepend to show newest first)
			ImageStore = append([]ImageMeta{job.Meta}, ImageStore...)

			// 4. Notify Frontend via Websocket
			hub.Broadcast <- job.Meta
			fmt.Printf("Processed: %s\n", job.Meta.Title)
		}
	}()
}

// REST Handlers
func GetImages(c *gin.Context) {
	c.JSON(http.StatusOK, ImageStore)
}

func HandleUpload(c *gin.Context) {
	title := c.PostForm("title")
	tags := c.PostFormArray("tags")

	// Retrieve file from form-data
	file, _, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Decode immediately to check validity
	img, _, err := image.Decode(file)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image format"})
		return
	}

	id := uuid.New().String()
	filename := id + ".jpg"

	meta := ImageMeta{
		ID:        id,
		Title:     title,
		Tags:      tags,
		URL:       "http://localhost:8080/uploads/" + filename,
		CreatedAt: time.Now(),
	}

	// Send to Queue (Non-blocking)
	JobQueue <- ImageJob{File: img, Meta: meta, Filename: filename}

	c.JSON(http.StatusAccepted, gin.H{"status": "queued", "id": id})
}
