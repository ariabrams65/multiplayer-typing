import { useEffect, useState, useRef } from 'react'
import './App.css'

function App() {
  const [username] = useState(generateUsername());
  const [prompt, setPrompt] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [players, setPlayers] = useState([]);
  const [input, setInput] = useState('')
  const [index, setIndex] = useState(0);

  const indexRef = useRef(index);
  const ws = useRef(null);
  const id = useRef(null);
  const finished = useRef(false);
  const started = useRef(false);
  const inputRef = useRef(null)

  useEffect(() => {
    indexRef.current = index;
  }, [index])

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8080/join?username=${username}`);
    ws.current.onmessage = (e) => {
      handleMessage(JSON.parse(e.data));
    }
    return () => {
      ws.current.close();
    }
  }, [username]);

  function handleMessage(msg) {
    const data = msg.data;
    switch (msg.type) {
      case 'id':
        id.current = data.id;
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
            color: getRandomColor()
          }];
        });
        break;
      case 'removed':
        setPlayers(prev => {
          return prev.filter(player => player.id !== data.id);
        });
        break;
      case 'countdown':
        if (data.time === 0) {
          started.current = true;
        }
        setCountdown(data.time);
        break;
      case 'progress':
        setPlayers(prev => {
          return prev.map((player) => {
            if (player.id === data.id) {
              player.index = data.index;
              player.wpm = data.wpm;
            }
            return player;
          });
        });
        break;
    }
  }

  function handleInput(e) {
    if (finished.current || !started.current) return;
    const value = e.target.value;
    setInput(value);
    const newIndex = firstDiffIndex(value, prompt);
    if (newIndex === prompt.length) {
      finished.current = true;
      return;
    }
    if (newIndex <= indexRef.current + 1 && newIndex !== indexRef.current) {
      console.log(`sending index: ${newIndex}`);
      ws.current.send(JSON.stringify({ index: newIndex }));
      setIndex(newIndex);
      indexRef.current = newIndex;
    }
  }

  return (
    <div onClick={() => inputRef.current?.focus()}>
      <p>Username: {username}</p>
      <p>Countdown: {countdown}</p>
      <ul>
        {players.map(p => (
          <li key={p.id}>
            {p.username} - ID: {p.id} - Index: {p.index} - WPM: {p.wpm}
          </li>
        ))}
      </ul>
      <PromptDisplay input={input} prompt={prompt} players={players} />
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

  function getColor(index) {
    const player = players.find(player => player.index === index);
    if (player) {
      return player.color;
    }
    return '#ffffff00'
  }

  for (let i = 0; i < firstDiff; i++) {
    chars.push(
      <span key={`c-${i}`} className="correct" style={{ backgroundColor: getColor(i)}}>
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

  chars.push(
    <span key='current' className="current">
      {prompt[firstDiff]}
    </span>
  )
  

  for (let i = firstDiff + 1; i < prompt.length; i++) {
    chars.push(
      <span key={`u-${i}`} className="pending" style={{ backgroundColor: getColor(i)}}>
        {prompt[i]}
      </span>
    );
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