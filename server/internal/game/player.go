package game

import (
	"log"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type player struct {
	id       string
	username string
	room     *room
	conn     *websocket.Conn
	send     chan serverMessage
	index    int
	wpm      float64
}

func newPlayer(username string, conn *websocket.Conn, room *room) *player {
	return &player{
		id:       uuid.NewString(),
		username: username,
		room:     room,
		conn:     conn,
		send:     make(chan serverMessage),
		index:    0,
		wpm:      0,
	}
}

func (player *player) run() {
	go player.runReadLoop()
	go player.runWriteLoop()
}

func (player *player) runReadLoop() {
	defer player.conn.Close()
	for {
		var msg clientProgressMessage
		err := player.conn.ReadJSON(&msg)
		if err != nil {
			player.room.removePlayer(player.id)
			log.Println("player.read:", err)
			return
		}
		player.room.updatePlayerProgress(player.id, msg.Index)
	}
}

// not sure if this needs to be a blocking loop. Why can't we just call a function to write to the connection?
// Could be because this could lead to issues in the future where multiple go routines are trying to send messages
// over the webscoket at the same time
func (player *player) runWriteLoop() {
	for msg := range player.send {
		err := player.conn.WriteJSON(msg)
		if err != nil {
			log.Println("player.write:", err)
			player.conn.Close()
		}
	}
}

func (player *player) sendMsg(msg serverMessage) {
	player.send <- msg
}
