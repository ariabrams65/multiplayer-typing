import { useEffect, useState, useRef } from 'react'
import './App.css'

function App() {
  const [username] = useState(generateUsername());
  const [prompt, setPrompt] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [players, setPlayers] = useState([]);
  const [connected, setConnected] = useState(false);

  const [index, setIndex] = useState(0);
  const indexRef = useRef(index);
  useEffect(() => {
    indexRef.current = index;
  }, [index])

  const ws = useRef(null);
  const id = useRef(null);
  const finished = useRef(false);
  const started = useRef(false);
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8080/join?username=${username}`);
    ws.current.onopen = () => {
      setConnected(true);
    }
    ws.current.onclose = () => {
      setConnected(false);
    }
    ws.current.onmessage = (e) => {
      handleMessage(JSON.parse(e.data));
    }
    return () => {
      ws.current.close();
    }
  }, [username]);

  function handleMessage(msg) {
    switch (msg.type) {
      case 'id':
        id.current = msg.data.id;
        break;
      case 'prompt':
        setPrompt(msg.data.text);
        break;
      case 'joined':
        setPlayers(prev => {
          return [...prev, {
            id: msg.data.id,
            username: msg.data.username,
            index: 0,
            wpm: 0
          }];
        });
        break;
      case 'removed':
        setPlayers(prev => {
          return prev.filter(player => player.id !== msg.data.id);
        });
        break;
      case 'countdown':
        if (msg.data.time === 0) {
          started.current = true;
        }
        setCountdown(msg.data.time);
        break;
      case 'progress':
        setPlayers(prev => {
          return prev.map((player) => {
            if (player.id === msg.data.id) {
              player.index = msg.data.index;
              player.wpm = msg.data.wpm;
            }
            return player;
          });
        });
        break;
    }
  }

  function handleInput(e) {
    if (!started.current) {
      e.target.value = '';
      return;
    }
    if (finished.current) return;
    const input = e.target.value;
    const newIndex = firstDiffIndex(input, prompt);
    if (newIndex === -1) {
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
      <p>Connected: {connected.toString()}</p>
      <p>Username: {username}</p>
      <p>Countdown: {countdown}</p>
      <ul>
        {players.map(p => (
          <li key={p.username}>
            {p.username} - ID: {p.id} - Index: {p.index} - WPM: {p.wpm}
          </li>
        ))}
      </ul>
      <p>Prompt: {prompt}</p>
      <input
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
//thaa  | this is a test
function firstDiffIndex(a, b) {
  const minLength = Math.min(a.length, b.length);
  for (let i = 0; i < minLength; i++) {
    if (a[i] !== b[i]) {
      return i
    }
  }
  if (a.length != b.length) {
    return minLength;
  }
  return -1;
}



export default App
