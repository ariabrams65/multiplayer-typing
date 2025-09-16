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

keybr has smooth underline

player could join after game starts which would cause them to never get the 0 countdown

-----
I've been bitten by the naive broadcast implementation. A few notes from my own experience:

If a remote client isn't reading from their websockets, the writer goroutine will hang and stop consuming from its channel. You want to make sure there's a decent buffer on that channel to avoid the multiplexer hanging sending to that channel (if that happens, everyone stops getting messages). Even then, if a client hangs around long enough without consuming from their channel it will eventually fill up, so you'll want to wrap sends in a select statement and decide what to do if you can't send (drop messages? Disconnect clients? Depends on your use case).

-----


I think its freezing with lots of players because the room is waiting to write to the send channel and the player isn't reading from it. Need to fiture out how to delete player when read json fails without crashing server

sometimes game starts when only 1 players is in lobby. Seems to happen after HMR maybe