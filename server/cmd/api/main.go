package main

import (
	"log"
	"net/http"
	"time"

	"github.com/ariabrams65/multiplayer-typing/server/internal/game"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var rm = game.NewRoomManager()
var upgrader = websocket.Upgrader{
	//Fix to only allow trusted origins
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func main() {
	go rm.Run()

	go func() {
		time.Sleep(time.Second * 3)
		game.SpawnBots(5)
	}()

	router := gin.Default()
	router.GET("/join", joinRoom)
	router.GET("/debug/state", func(c *gin.Context) {
		c.String(http.StatusOK, rm.DumpState())
	})
	router.Run("localhost:8080")
}

func joinRoom(c *gin.Context) {
	w, r := c.Writer, c.Request
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade:", err)
		return
	}
	rm.Join(c.Query("username"), conn)
}
