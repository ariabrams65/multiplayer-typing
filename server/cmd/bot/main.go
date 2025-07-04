package main

import (
	"flag"
	"log"
	"strconv"

	"github.com/ariabrams65/multiplayer-typing/server/internal/game"
)

func main() {
	cmd := flag.String("bots", "", "")
	flag.Parse()
	num, err := strconv.Atoi(*cmd)
	if err != nil {
		log.Println("Failed to parse args: ", err)
	}
	game.SpawnBots(num)

	//block forever
	select {}
}
