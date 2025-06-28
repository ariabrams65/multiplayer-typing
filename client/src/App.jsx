import { useEffect, useState, useRef } from 'react'
import './App.css'

function App() {
  const [username] = useState(generateUsername());
  const [prompt, setPrompt] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [players, setPlayers] = useState([]);
  const [connected, setConnected] = useState(false);

  const ws = useRef(null);
  const id = useRef(null);

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
          return prev.filter(player => player.id != msg.data.id);
        });
        break;
      case 'countdown':
        setCountdown(msg.data.time);
        break;
      case 'progress':
        break;
    }
  }



  return (
    <>
      <p>Connected: {connected.toString()}</p>
      <p>Username: {username}</p>
      <p>Countdown: {countdown}</p>
      <p>Prompt: {prompt}</p>
      <ul>
        {players.map(p => (
          <li key={p.username}>
            {p.username} - ID: {p.id} - Index: {p.index} - WPM: {p.wpm}
          </li>
        ))}
      </ul>
    </>
  )
}

function generateUsername() {
  return 'User' + crypto.randomUUID();
}



export default App
