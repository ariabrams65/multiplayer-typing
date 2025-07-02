what happens when last player leaves lobby (before game has started) and another player trys to join before there was a chance to delete the game


Confirm that each state is owned by only 1 goroutine

instead of sending wpm on keypress, send out wpm every second

disable arrow keys in text input

on safari, searching the url before pressing enter loads into game


panic: send on closed channel

Happens with lots of bots:
goroutine 8116 [running]:
github.com/ariabrams65/multiplayer-typing/server/internal/game.(*room).startWpmTicker(0x140000fe510)
        /Users/ariabrams/git/multiplayer-typing/server/internal/game/room.go:109 +0x84
created by github.com/ariabrams65/multiplayer-typing/server/internal/game.(*room).handleCountdownEvent in goroutine 7303
        /Users/ariabrams/git/multiplayer-typing/server/internal/game/room.go:183 +0xa0
exit status 2

room manager directly checks the num players in each room. This can cause race conditions. Send a message to the room to avoid race conditions