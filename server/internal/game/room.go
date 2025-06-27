package game

import (
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type roomEvent interface {
	roomEventType() string
}

type playerProgressEvent struct {
	id    string
	index int
}

func (e playerProgressEvent) roomEventType() string {
	return "player-progress"
}

type playerJoinedEvent struct {
	player *player
}

func (e playerJoinedEvent) roomEventType() string {
	return "player-joined"
}

type playerLeftEvent struct {
	id string
}

func (e playerLeftEvent) roomEventType() string {
	return "player-left"
}

type countdownEvent struct {
	time int
}

func (e countdownEvent) roomEventType() string {
	return "countdown"
}

type room struct {
	id                string
	rm                *RoomManager
	players           map[string]*player
	prompt            string
	inbox             chan roomEvent
	gameStarted       bool
	countdownLength   int
	countdownStarted  bool
	numPlayersToStart int
	startTime         time.Time
	cancelCountdown   chan struct{}
}

func newRoom(rm *RoomManager) *room {
	return &room{
		id:                uuid.NewString(),
		rm:                rm,
		players:           make(map[string]*player),
		prompt:            generatePrompt(),
		inbox:             make(chan roomEvent),
		gameStarted:       false,
		countdownLength:   10,
		countdownStarted:  false,
		numPlayersToStart: 2,
		cancelCountdown:   make(chan struct{}),
	}
}

func (room *room) startCountdown() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for i := room.countdownLength; i >= 0; i-- {
		select {
		case <-ticker.C:
			room.inbox <- countdownEvent{i}
		case <-room.cancelCountdown:
			return
		}
	}
}

func (room *room) run() {
	for event := range room.inbox {
		switch e := event.(type) {
		case playerProgressEvent:
			room.handlePlayerProgress(e)
		case playerJoinedEvent:
			room.handlePlayerJoined(e)
		case playerLeftEvent:
			room.handlePlayerLeft(e)
		case countdownEvent:
			room.handleCountdownEvent(e)
		default:
			log.Println("Unkown room event type")
		}
	}
}

func (room *room) handlePlayerProgress(event playerProgressEvent) {
	if room.gameStarted && !room.isPlayerFinished(event.id) {
		player := room.players[event.id]
		player.index = event.index
		player.wpm = calculateWpm(player.index, time.Since(room.startTime).Seconds())
		room.sendToAll(newPlayerProgressMessage(
			player.id,
			player.index,
			player.wpm,
		))
	}
}

func (room *room) handlePlayerJoined(event playerJoinedEvent) {
	event.player.run()
	event.player.sendMsg(newPromptMessage(room.prompt))
	room.sendAllPlayersTo(event.player)
	room.players[event.player.id] = event.player
	room.sendToAll(newPlayerJoinedMessage(
		event.player.username,
		event.player.id,
	))
	if room.shouldStartCountdown() {
		room.countdownStarted = true
		go room.startCountdown()
	}
}

func (room *room) handlePlayerLeft(event playerLeftEvent) {
	close(room.players[event.id].send)
	delete(room.players, event.id)
	if len(room.players) == 0 {
		room.rm.deleteRoom(room.id)
		return
	}
	room.sendToAll(newPlayerLeftMessage(
		event.id,
	))
}

func (room *room) handleCountdownEvent(e countdownEvent) {
	if e.time == 0 {
		room.gameStarted = true
		room.startTime = time.Now()
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

func (room *room) isPlayerFinished(id string) bool {
	return room.players[id].index == len(room.prompt)
}

func (room *room) addPlayer(username string, conn *websocket.Conn) {
	room.inbox <- playerJoinedEvent{newPlayer(username, conn, room)}
}

func (room *room) removePlayer(id string) {
	room.inbox <- playerLeftEvent{id}
}

func (room *room) updatePlayerProgress(id string, index int) {
	room.inbox <- playerProgressEvent{id, index}
}

func (room *room) shouldStartCountdown() bool {
	return len(room.players) == room.numPlayersToStart && !room.countdownStarted
}

func (room *room) cleanup() {
	close(room.inbox)
	close(room.cancelCountdown)
}

func generatePrompt() string {
	return "This is a test."
}

func calculateWpm(characters int, duration float64) float64 {
	return (float64(characters) / 5) * (60 / duration)
}
