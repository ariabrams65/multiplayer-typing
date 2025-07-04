package game

// server messages
type serverMessage struct {
	Type string `json:"type"`
	Data any    `json:"data"`
}
type idMessage struct {
	Id string `json:"id"`
}

func newIdMessage(id string) serverMessage {
	return serverMessage{
		Type: "id",
		Data: idMessage{
			Id: id,
		},
	}
}

type promptMessage struct {
	Text string `json:"text"`
}

func newPromptMessage(text string) serverMessage {
	return serverMessage{
		Type: "prompt",
		Data: promptMessage{
			Text: text,
		},
	}
}

type playerProgressMessage struct {
	Id    string  `json:"id"`
	Index int     `json:"index"`
	Wpm   float64 `json:"wpm"`
}

func newPlayerProgressMessage(id string, index int, wpm float64) serverMessage {
	return serverMessage{
		Type: "progress",
		Data: playerProgressMessage{
			Id:    id,
			Index: index,
			Wpm:   wpm,
		},
	}
}

type playerJoinedMessage struct {
	Username string `json:"username"`
	Id       string `json:"id"`
	Color    string `json:"color"`
}

func newPlayerJoinedMessage(username string, id string, color string) serverMessage {
	return serverMessage{
		Type: "joined",
		Data: playerJoinedMessage{
			Username: username,
			Id:       id,
			Color:    color,
		},
	}
}

type playerLeftMessage struct {
	Id string `json:"id"`
}

func newPlayerLeftMessage(id string) serverMessage {
	return serverMessage{
		Type: "removed",
		Data: playerLeftMessage{
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

type wpmMessage struct {
	Id  string  `json:"id"`
	Wpm float64 `json:"wpm"`
}

func newWpmMessage(id string, wpm float64) serverMessage {
	return serverMessage{
		Type: "wpm",
		Data: wpmMessage{
			Id:  id,
			Wpm: wpm,
		},
	}
}

type playerFinishedMessage struct {
	Id    string `json:"id"`
	Place int    `json:"place"`
}

func newPlayerFinishedMessage(id string, place int) serverMessage {
	return serverMessage{
		Type: "finished",
		Data: playerFinishedMessage{
			Id:    id,
			Place: place,
		},
	}
}

// client messages
type clientProgressMessage struct {
	Index int `json:"index"`
}
