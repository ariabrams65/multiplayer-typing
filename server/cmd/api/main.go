package main

import (
	"log"

	"github.com/ariabrams65/multiplayer-typing/server/internal/game"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var rm = game.NewRoomManager()
var upgrader = websocket.Upgrader{}

func main() {
	router := gin.Default()
	router.GET("/join", joinRoom)
	router.Run("localhost:8080")
}

func joinRoom(c *gin.Context) {
	w, r := c.Writer, c.Request
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade:", err)
		return
	}
	// defer conn.Close()

	rm.Join(c.Query("username"), conn)
}
