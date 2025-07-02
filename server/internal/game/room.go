package game

import (
	"log"
	"math/rand"
	"strings"
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

type wpmEvent struct{}

func (e wpmEvent) roomEventType() string {
	return "wpm"
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
	availableColors   []string
	cancel            chan struct{}
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
		availableColors:   []string{"#EB757A", "#DCEB75", "#BB75EB", "#EB75DE", "#7577EB", "#75CFEB", "#75EBCA"},
		cancel:            make(chan struct{}),
	}
}

func (room *room) startCountdown() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for i := room.countdownLength; i >= 0; i-- {
		select {
		case <-ticker.C:
			room.inbox <- countdownEvent{i}
		case <-room.cancel:
			return
		}
	}
}

func (room *room) startWpmTicker() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			room.inbox <- wpmEvent{}
		case <-room.cancel:
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
		case wpmEvent:
			room.handleWpmEvent()
		default:
			log.Println("Unkown room event type")
		}
	}
}

func (room *room) handlePlayerProgress(event playerProgressEvent) {
	if !room.isProgressValid(event.id, event.index) {
		return
	}
	player := room.players[event.id]
	player.index = event.index
	player.wpm = calculateWpm(player.index, time.Since(room.startTime).Seconds())
	room.sendToAll(newPlayerProgressMessage(
		player.id,
		player.index,
		player.wpm,
	))
}

func (room *room) handlePlayerJoined(event playerJoinedEvent) {
	event.player.color = room.getAvailableColor()
	event.player.run()
	event.player.sendMsg(newIdMessage(event.player.id))
	event.player.sendMsg(newPromptMessage(room.prompt))
	room.sendAllPlayersTo(event.player)
	room.players[event.player.id] = event.player
	room.sendToAll(newPlayerJoinedMessage(
		event.player.username,
		event.player.id,
		event.player.color,
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
		go room.startWpmTicker()
	}
	room.sendToAll(newCountdownMessage(e.time))
}

func (room *room) handleWpmEvent() {
	for _, p := range room.players {
		if !room.isPlayerFinished(p.id) {
			p.wpm = calculateWpm(p.index, time.Since(room.startTime).Seconds())
			room.sendToAll(newWpmMessage(p.id, p.wpm))
		}
	}
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
			p.color,
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
	close(room.cancel)
	close(room.inbox)
}

func (room *room) isProgressValid(id string, index int) bool {
	return room.gameStarted &&
		!room.isPlayerFinished(id) &&
		index <= room.players[id].index+1 &&
		index >= 0
}

func (room *room) getAvailableColor() string {
	i := len(room.availableColors) - 1
	color := room.availableColors[i]
	room.availableColors = append(room.availableColors[:i], room.availableColors[i+1:]...)
	return color
}

func generatePrompt() string {
	// defaultPrompt := "Here's to the crazy ones. The misfits. The rebels. The troublemakers. The round pegs in the square holes. The ones who see things differently. They're not fond of rules. And they have no respect for the status quo. You can quote them, disagree with them, glorify or vilify them. About the only thing you can't do is ignore them. Because they change things. They push the human race forward. And while some may see them as the crazy ones, we see genius. Because the people who are crazy enough to think they can change the world, are the ones who do."
	// res, err := http.Get("https://thequoteshub.com/api/")
	// if err != nil {
	// 	log.Print(err)
	// 	return defaultPrompt
	// }
	// defer res.Body.Close()
	// body, err := io.ReadAll(res.Body)
	// if err != nil {
	// 	log.Print(err)
	// 	return defaultPrompt
	// }
	// obj := struct {
	// 	Text string `json:"text"`
	// }{}
	// json.Unmarshal([]byte(body), &obj)
	// return obj.Text
	words := []string{
		"the", "of", "a", "to", "you", "was", "are", "they", "from", "have",
		"one", "what", "were", "there", "your", "their", "said", "do", "many", "some",
		"would", "other", "into", "two", "could", "been", "who", "people", "only", "find",
		"water", "very", "words", "where", "most", "through", "any", "another", "come", "work",
		"word", "does", "put", "different", "again", "old", "great", "should", "Mr.", "give",
		"something", "thought", "both", "often", "together", "don't", "world", "want",
	}
	var result []string
	for i := 0; i < 50; i++ {
		result = append(result, words[rand.Intn(len(words))])
	}
	return strings.Join(result, " ")
}

func calculateWpm(characters int, duration float64) float64 {
	return (float64(characters) / 5) * (60 / duration)
}
