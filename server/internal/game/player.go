package game

import (
	"log"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type player struct {
	id       string
	username string
	conn     *websocket.Conn
	receive  chan message
	index    int
}

func newPlayer(username string, conn *websocket.Conn) *player {
	return &player{
		id:       uuid.NewString(),
		username: username,
		conn:     conn,
		receive:  make(chan message),
		index:    0,
	}
}

func (player *player) runReadLoop(broadcast chan message) {
	defer player.conn.Close()
	for {
		var msg message
		err := player.conn.ReadJSON(&msg)
		if err != nil {
			log.Println("player.read:", err)
			return
		}
		log.Println(msg)
		broadcast <- msg
	}
}

func (player *player) runWriteLoop() {
	for msg := range player.receive {
		err := player.conn.WriteJSON(msg)
		if err != nil {
			log.Println("player.write:", err)
			player.conn.Close()
		}
	}
}

func (player *player) send(msg message) {
	player.receive <- msg
}
