package game

import "github.com/gorilla/websocket"

type roomEvent interface {
	eventType() string
}

type playerProgressEvent struct {
	player *player
}

func (e playerProgressEvent) eventType() string {
	return "player-progress-event"
}

type playerJoinedEvent struct {
	player *player
}

func (e playerJoinedEvent) eventType() string {
	return "player-joined-event"
}

type room struct {
	players map[string]*player
	text    string
	inbox   chan roomEvent
}

func newRoom() *room {
	return &room{
		players: make(map[string]*player),
		text:    generateText(),
		inbox:   make(chan roomEvent),
	}
}

func (room *room) run() {
	for event := range room.inbox {
		switch e := event.(type) {
		case playerProgressEvent:
			room.handlePlayerProgress(e)
		case playerJoinedEvent:
			room.handlePlayerJoined(e)
		}
	}
}

func (room *room) handlePlayerProgress(event playerProgressEvent) {
	for _, player := range room.players {
		player.sendMsg(newPlayerProgressMessage(
			event.player.username,
			event.player.id,
			event.player.index,
		))
	}
}

func (room *room) handlePlayerJoined(event playerJoinedEvent) {
	room.players[event.player.id] = event.player
	go event.player.runReadLoop(room.inbox)
	go event.player.runWriteLoop()
}

func (room *room) addPlayer(username string, conn *websocket.Conn) {
	room.inbox <- playerJoinedEvent{newPlayer(username, conn)}
}

func generateText() string {
	return "This is a test."
}
