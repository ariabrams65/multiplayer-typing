package game

import (
	"encoding/json"
	"log"
	"math/rand"
	"net/url"
	"time"

	"github.com/gorilla/websocket"
)

type readServerMessage struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

type bot struct {
	url    string
	conn   *websocket.Conn
	cancel chan struct{}
	wpm    int
}

func newBot(wpm int) *bot {
	u := url.URL{Scheme: "ws", Host: "localhost:8080", Path: "/join", RawQuery: "username=BOT"}
	return &bot{
		url: u.String(),
		wpm: wpm,
	}
}

func (bot *bot) run() {
	for {
		conn, _, err := websocket.DefaultDialer.Dial(bot.url, nil)
		if err != nil {
			log.Println("Bot failed to connect to server: ", err)
			return
		}
		bot.conn = conn
		defer bot.conn.Close()
		var promptLength int
		for {
			var msg readServerMessage
			err := conn.ReadJSON(&msg)
			if err != nil {
				return
			}
			if msg.Type == "prompt" {
				var pMsg promptMessage
				json.Unmarshal([]byte(msg.Data), &pMsg)
				promptLength = len(pMsg.Text)
			}
			if msg.Type == "countdown" {
				var cdMsg countdownMessage
				json.Unmarshal([]byte(msg.Data), &cdMsg)
				if cdMsg.Time == 0 {
					break
				}
			}
		}
		bot.startTyping(promptLength)
		time.Sleep(time.Duration(rand.Intn(30)) * time.Second)
		bot.conn.Close()
	}
}

func (bot *bot) startTyping(length int) {
	log.Println("started typing")
	index := 0
	cps := (float64(bot.wpm) / 60) * 5
	ticker := time.NewTicker(time.Second / time.Duration(cps))
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if rand.Intn(25) == 0 {
				time.Sleep(time.Duration(rand.Intn(1500)) * time.Millisecond)
			}
			err := bot.conn.WriteJSON(clientProgressMessage{
				Index: index,
			})
			if err != nil {
				log.Println("Bot failed to write to server")
				return
			}
			index++
			if index == length+1 {
				return
			}
		case <-bot.cancel:
			return
		}
	}
}

func (bot *bot) cancelBot() {
	close(bot.cancel)
}

func SpawnBots(num int) {
	for range num {
		num := rand.Intn(90) + 30
		bot := newBot(num)
		go bot.run()
	}
}
