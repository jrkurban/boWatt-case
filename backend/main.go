package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"instagram-clone/rest"
	"instagram-clone/ws"
	"time"
)

func main() {
	// 1. Setup Hub & Worker
	hub := ws.NewHub()
	go hub.Run()
	rest.StartWorker(hub)

	// 2. Setup Router
	r := gin.Default()

	// 3. CORS Configuration (Allow React Frontend)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 4. Routes
	r.Static("/uploads", "./uploads") // Serve images

	api := r.Group("/api")
	{
		api.GET("/images", rest.GetImages)
		api.POST("/uploads", rest.HandleUpload)
	}

	// Websocket Endpoint
	r.GET("/ws", func(c *gin.Context) {
		conn, err := ws.Upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			return
		}
		hub.Register <- conn
	})

	r.Run(":8080")
}
