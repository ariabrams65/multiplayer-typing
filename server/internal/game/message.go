package game

// server messages
type serverMessage struct {
	Type string `json:"type"`
	Data any    `json:"data"`
}

type textMessage struct {
	Text string `json:"text"`
}

func newTextMessage(text string) serverMessage {
	return serverMessage{
		Type: "text",
		Data: textMessage{
			Text: text,
		},
	}
}

type playerProgressMessage struct {
	Username string `json:"username"`
	Id       string `json:"id"`
	Index    int    `json:"index"`
}

func newPlayerProgressMessage(username string, id string, index int) serverMessage {
	return serverMessage{
		Type: "progress",
		Data: playerProgressMessage{
			Username: username,
			Id:       id,
			Index:    index,
		},
	}
}

type playerJoinedMessage struct {
	Username string `json:"username"`
	Id       string `json:"id"`
}

func newPlayerJoinedMessage(username string, id string) serverMessage {
	return serverMessage{
		Type: "joined",
		Data: playerJoinedMessage{
			Username: username,
			Id:       id,
		},
	}
}

type playerRemovedMessage struct {
	Id string `json:"id"`
}

func newPlayerRemovedMessage(id string) serverMessage {
	return serverMessage{
		Type: "removed",
		Data: playerRemovedMessage{
			Id: id,
		},
	}
}

type countdownMessage struct {
	Time int `json:"time"`
}

func newCountdownMessage(time int) serverMessage {
	return serverMessage{
		Type: "countdown",
		Data: countdownMessage{
			Time: time,
		},
	}
}

// client messages
type receiveProgressMessage struct {
	Index int `json:"index"`
}
