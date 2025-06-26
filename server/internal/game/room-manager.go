package game

import (
	"log"

	"github.com/gorilla/websocket"
)

type roomManagerEvent interface {
	rmEventType() string
}

type joinRoomEvent struct {
	username string
	conn     *websocket.Conn
}

func (e joinRoomEvent) rmEventType() string {
	return "join-room"
}

type deleteRoomEvent struct {
	id string
}

func (e deleteRoomEvent) rmEventType() string {
	return "delete-room"
}

type RoomManager struct {
	rooms map[string]*room
	inbox chan roomManagerEvent
}

// Potentially needs a lock if multiple goroutines access
func NewRoomManager() *RoomManager {
	return &RoomManager{
		rooms: make(map[string]*room),
		inbox: make(chan roomManagerEvent),
	}
}

func (rm *RoomManager) Run() {
	for event := range rm.inbox {
		switch e := event.(type) {
		case joinRoomEvent:
			rm.handleJoinRoomEvent(e)
		case deleteRoomEvent:
			rm.handleDeleteRoomEvent(e)
		default:
			log.Println("Unkown room manager event type")
		}
	}
}

func (rm *RoomManager) handleJoinRoomEvent(event joinRoomEvent) {
	room := rm.getRoom()
	room.addPlayer(event.username, event.conn)
}

func (rm *RoomManager) handleDeleteRoomEvent(event deleteRoomEvent) {
	delete(rm.rooms, event.id)
	close(rm.rooms[event.id].inbox)
}

func (rm *RoomManager) getRoom() *room {
	//TODO: Implement heuristic for determining what room to place new player in
	if len(rm.rooms) == 0 {
		room := newRoom(rm)
		go room.run()
		rm.rooms[room.id] = room
	}
	var room *room
	for _, r := range rm.rooms {
		room = r
		break
	}
	return room
}

func (rm *RoomManager) Join(username string, conn *websocket.Conn) {
	rm.inbox <- joinRoomEvent{username, conn}
}

func (rm *RoomManager) deleteRoom(id string) {
	rm.inbox <- deleteRoomEvent{id}
}
