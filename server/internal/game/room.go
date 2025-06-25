package game

type room struct {
	players   map[string]*player
	broadcast chan message
	join      chan *player
}

func newRoom() *room {
	return &room{
		players:   make(map[string]*player),
		broadcast: make(chan message),
		join:      make(chan *player),
	}
}

func (room *room) run() {
	for {
		select {
		case msg := <-room.broadcast:
			for _, player := range room.players {
				player.send(msg)
			}
		case player := <-room.join:
			room.players[player.id] = player
		}
	}
}

func (room *room) addPlayer(player *player) {
	room.join <- player
}
