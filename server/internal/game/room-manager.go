package game

import (
	"fmt"
	"log"
	"strings"

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
	rooms       map[string]*room
	playerLimit int
	inbox       chan roomManagerEvent
}

// Potentially needs a lock if multiple goroutines access
func NewRoomManager() *RoomManager {
	return &RoomManager{
		rooms:       make(map[string]*room),
		playerLimit: 5,
		inbox:       make(chan roomManagerEvent),
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
	rm.rooms[event.id].cleanup()
	delete(rm.rooms, event.id)
}

func (rm *RoomManager) getRoom() *room {
	for _, room := range rm.rooms {
		if len(room.players) < rm.playerLimit && !room.gameStarted {
			return room
		}
	}
	return rm.createNewRoom()
}

func (rm *RoomManager) Join(username string, conn *websocket.Conn) {
	rm.inbox <- joinRoomEvent{username, conn}
}

func (rm *RoomManager) deleteRoom(id string) {
	rm.inbox <- deleteRoomEvent{id}
}

func (rm *RoomManager) createNewRoom() *room {
	room := newRoom(rm)
	go room.run()
	rm.rooms[room.id] = room
	return room
}

func (rm *RoomManager) DumpState() string {
	var out strings.Builder

	totalPlayers := 0
	for _, room := range rm.rooms {
		totalPlayers += len(room.players)
	}

	out.WriteString("=======================\n")
	fmt.Fprintf(&out, "Total players: %d\n", totalPlayers)
	for _, room := range rm.rooms {
		fmt.Fprintf(&out, "Room: %s\n", room.id)
		fmt.Fprintf(&out, "Game Started: %v\n", room.gameStarted)
		fmt.Fprintf(&out, "Countdown started: %v\n", room.countdownStarted)
		out.WriteString("Players:\n")
		for _, player := range room.players {
			fmt.Fprintf(&out, "  - %s : %d\n", player.username, player.index)
		}
		out.WriteString("\n")
	}
	out.WriteString("=======================\n\n")

	return out.String()
}
