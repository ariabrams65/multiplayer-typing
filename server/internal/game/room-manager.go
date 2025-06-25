package game

import "github.com/gorilla/websocket"

type RoomManager struct {
	rooms []*room
}

// Potentially needs a lock if multiple goroutines access
func NewRoomManager() *RoomManager {
	return &RoomManager{
		rooms: make([]*room, 0),
	}
}

func (rm *RoomManager) getRoom() *room {
	if len(rm.rooms) == 0 {
		room := newRoom()
		go room.run()
		rm.rooms = append(rm.rooms, room)
	}
	return rm.rooms[0]
}

func (rm *RoomManager) Join(username string, conn *websocket.Conn) {
	room := rm.getRoom()
	player := newPlayer(username, conn)
	room.addPlayer(player)
}
