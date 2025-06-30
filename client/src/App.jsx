import { useEffect, useState, useRef } from 'react'
import './App.css'

function App() {
  const [prompt, setPrompt] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [players, setPlayers] = useState([]);
  const [input, setInput] = useState('');

  const ws = useRef(null);
  const myId = useRef(null);
  const inputRef = useRef(null)

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8080/join?username=${generateUsername()}`);
    ws.current.onmessage = (e) => {
      handleMessage(JSON.parse(e.data));
    }
    return () => {
      ws.current.close();
    }
  }, []);

  function handleMessage(msg) {
    const data = msg.data;
    switch (msg.type) {
      case 'id':
        myId.current = data.id;
        break;
      case 'prompt':
        setPrompt(data.text);
        break;
      case 'joined':
        setPlayers(prev => {
          return [...prev, {
            id: data.id,
            username: data.username,
            index: 0,
            wpm: 0,
            color: getRandomColor(),
            mainPlayer: myId.current === data.id
          }];
        });
        break;
      case 'removed':
        setPlayers(prev => {
          return prev.filter(player => player.id !== data.id);
        });
        break;
      case 'countdown':
        setCountdown(data.time);
        break;
      case 'progress':
        setPlayers(prev => {
          return prev.map((player) => {
            if (player.id === data.id) {
              if (data.id === myId.current) {
                return {
                  ...player,
                  wpm: data.wpm
                };
              }
              return {
                ...player,
                index: data.index,
                wpm: data.wpm
              };
            }
            return player;
          });
        });
        break;
      case 'wpm':
        setPlayers(prev => {
          return prev.map((player) => {
            if (player.id === data.id) {
              return {
                ...player,
                wpm: data.wpm
              }
            }
            return player;
          });
        });
        break;
    }
  }

  function handleInput(e) {
    if (playerFinished(myId.current) || !gameStarted()) return;
    setInput(e.target.value);
    const newIndex = firstDiffIndex(e.target.value, prompt);
    const currentIndex = getCurrentIndex();
    if (newIndex <= currentIndex + 1 && newIndex !== currentIndex) {
      console.log(`sending index: ${newIndex}`);
      ws.current.send(JSON.stringify({ index: newIndex }));
      setPlayers(prev => {
        return prev.map((player) => {
          if (player.id === myId.current) {
            return {
              ...player,
              index: newIndex
            }
          }
          return player;
        });
      });
    }
  }

  function gameStarted() {
    return countdown === 0;
  }

  function getCurrentIndex() {
    return players.find(p => p.mainPlayer).index;
  }

  function playerFinished(id) {
    return players.find(p => p.id === id).index === prompt.length;
  }

  let gameStatus;
  if (countdown === null) {
    gameStatus = "Waiting for players to join..." ;
  } else if (!gameStarted()) {
    gameStatus = `Countdown: ${countdown}`;
  } else {
    gameStatus = "Game Started!";
  }

  return (
    <div onClick={() => inputRef.current?.focus()}>
      <p>{gameStatus}</p>
      <PromptDisplay input={input} prompt={prompt} players={players} />
      <p>Players:</p>
      <ul>
        {players.map(p => (
          <li key={p.id} style={{ backgroundColor: p.color }}>
            {p.username} - WPM: {Math.round(p.wpm)} - {playerFinished(p.id) && "FINISHED"}
          </li>
        ))}
      </ul>
      <input
        value={input}
        ref={inputRef}
        type="text"
        onChange={handleInput}
        autoFocus
        spellCheck={false}
        autoComplete="off"
        id="hidden-input"
      />
    </div>
  )
}

function generateUsername() {
  return 'User' + crypto.randomUUID();
}

function PromptDisplay({ input, prompt, players }) {
  const firstDiff = firstDiffIndex(input, prompt);
  const chars = [];

  for (let i = 0; i < firstDiff; i++) {
    chars.push(
      <span key={`c-${i}`} className="correct" style={{ backgroundColor: getBackgroundColor(i)}}>
        {prompt[i]}
      </span>
    );
  }

  for (let i = firstDiff; i < input.length; i++) {
    const value = input[i] != ' ' ? input[i] : '_';
    chars.push(
      <span key={`i-${i}`} className="incorrect">
        {value}
      </span>
    );
  }

  for (let i = firstDiff; i < prompt.length; i++) {
    chars.push(
      <span key={`u-${i}`} className="pending" style={{ backgroundColor: getBackgroundColor(i)}}>
        {prompt[i]}
      </span>
    );
  }

  function getBackgroundColor(index) {
    let color = '#ffffff00';
    for (const p of players) {
      if (p.index === index) {
        if (p.mainPlayer) {
          return p.color;
        }
        color = p.color;
      }
    }
    return color;
  }
  return <div className="prompt">{chars}</div>;
}

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function firstDiffIndex(a, b) {
  const minLength = Math.min(a.length, b.length);
  let i = 0;
  for (; i < minLength; i++) {
    if (a[i] !== b[i]) {
      return i
    }
  }
  return i;
}

export default App