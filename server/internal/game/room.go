package game

import (
	"time"

	"github.com/gorilla/websocket"
)

type roomEvent interface {
	eventType() string
}

type playerProgressEvent struct {
	player *player
}

func (e playerProgressEvent) eventType() string {
	return "player-progress"
}

type playerJoinedEvent struct {
	player *player
}

func (e playerJoinedEvent) eventType() string {
	return "player-joined"
}

type countdownEvent struct {
	time int
}

func (e countdownEvent) eventType() string {
	return "countdown"
}

type room struct {
	players           map[string]*player
	text              string
	inbox             chan roomEvent
	gameStarted       bool
	countdownLength   int
	countdownStarted  bool
	numPlayersToStart int
}

func newRoom() *room {
	return &room{
		players:           make(map[string]*player),
		text:              generateText(),
		inbox:             make(chan roomEvent),
		gameStarted:       false,
		countdownLength:   10,
		countdownStarted:  false,
		numPlayersToStart: 2,
	}
}

func (room *room) startCountdown() {
	room.countdownStarted = true
	ticker := time.NewTicker(1 * time.Second)

	go func() {
		defer ticker.Stop()
		for i := room.countdownLength; i >= 0; i-- {
			room.inbox <- countdownEvent{
				time: i,
			}
			<-ticker.C
		}
	}()
}

func (room *room) run() {
	for event := range room.inbox {
		switch e := event.(type) {
		case playerProgressEvent:
			room.handlePlayerProgress(e)
		case playerJoinedEvent:
			room.handlePlayerJoined(e)
		case countdownEvent:
			room.handleCountdownEvent(e)
		}
	}
}

func (room *room) handlePlayerProgress(event playerProgressEvent) {
	room.sendToAll(newPlayerProgressMessage(
		event.player.username,
		event.player.id,
		event.player.index,
	))
}

func (room *room) handlePlayerJoined(event playerJoinedEvent) {
	event.player.run(room.inbox)
	room.sendAllPlayersTo(event.player)
	room.players[event.player.id] = event.player
	room.sendToAll(newPlayerJoinedMessage(
		event.player.username,
		event.player.id,
	))
	if room.shouldStartCountdown() {
		room.startCountdown()
	}
}

func (room *room) handleCountdownEvent(e countdownEvent) {
	if e.time == 0 {
		room.gameStarted = true
	}
	room.sendToAll(newCountdownMessage(e.time))
}

func (room *room) sendToAll(msg serverMessage) {
	for _, player := range room.players {
		player.sendMsg(msg)
	}
}

func (room *room) sendAllPlayersTo(player *player) {
	for _, p := range room.players {
		player.sendMsg(newPlayerJoinedMessage(
			p.username,
			p.id,
		))
	}
}

func (room *room) addPlayer(username string, conn *websocket.Conn) {
	room.inbox <- playerJoinedEvent{newPlayer(username, conn)}
}

func (room *room) shouldStartCountdown() bool {
	return len(room.players) == room.numPlayersToStart && !room.countdownStarted
}

func generateText() string {
	return "This is a test."
}
