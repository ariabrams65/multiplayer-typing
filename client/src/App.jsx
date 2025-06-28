import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/join?username=Jack');
    ws.onmessage = (e) => {
      setMessages((prev => [...prev, e.data]))
    }
    return () => {
      ws.close();
    }
  }, []);

  return (
    <ul>
      {messages.map((msg, i) => (
        <li key={i}>{msg}</li>
      ))}
    </ul>
  )
}

function Players() {
  return (
    <div>Players</div>
  )
}

function Prompt() {
  return (
    <div>Prompt</div>
  )
}


export default App
