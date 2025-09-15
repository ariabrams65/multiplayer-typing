import { useState, useEffect, useRef } from "react";
import { firstDiffIndex } from "../utils";

import Prompt from "./Prompt";
import PlayerList from "./PlayerList";

import styles from "./Game.module.css"

const API_WS_URL = import.meta.env.VITE_WS_URL

export default function Game() {
  const [prompt, setPrompt] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [players, setPlayers] = useState([]);
  const [myId, setMyId] = useState(null);
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(true);
  const [connected, setConnected] = useState(true);

  const ws = useRef(null);
  const inputRef = useRef(null)

  useEffect(() => {
    ws.current = new WebSocket(`${API_WS_URL}?username=GUEST`);
    ws.current.onopen = () => {
      setConnected(true)
    }
    ws.current.onmessage = (e) => {
      handleMessage(JSON.parse(e.data));
    }
    ws.current.onerror = () => {
      setConnected(false)
    }
    ws.current.onclose = () => {
      setConnected(false)
    }
    return () => {
      ws.current.close();
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Enter") {
          location.reload();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []); 

  if (!connected) {
    return <p>Connection to server failed</p>
  }

  function handleMessage(msg) {
    const data = msg.data;
    switch (msg.type) {
      case 'id': {
        setMyId(data.id);
        break;
      }
      case 'prompt': {
        setPrompt(data.text);
        break;
      }
      case 'joined': {
        setPlayers(prev => {
          return [...prev, {
            id: data.id,
            username: data.username,
            color: data.color,
            index: 0,
            wpm: 0
          }];
        });
        break;
      }
      case 'removed': {
        setPlayers(prev => prev.filter(p => p.id !== data.id || p.place));
        break;
      }
      case 'countdown': {
        setCountdown(data.time);
        break;
      }
      case 'progress': {
        setPlayers(prev => {
          return prev.map((player) => {
            if (player.id === data.id) {
              if (data.id === myId) {
                console.log("index: ", player.index)
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
      }
      case 'wpm': {
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
      case 'finished': {
        setPlayers(prev => {
          return prev.map((player) => {
            if (player.id === data.id) {
              return {
                ...player,
                place: data.place
              };
            }
            return player;
          });
        })
      }
    }
  }

  function handleInput(e) {
    if (players.find(p => p.id === myId).place || countdown !== 0) return;
    setInput(e.target.value);
    const newIndex = firstDiffIndex(e.target.value, prompt);
    const currentIndex = players.find(p => p.id === myId).index;
    if (newIndex <= currentIndex + 1 && newIndex !== currentIndex) {
      console.log(`sending index: ${newIndex}`);
      ws.current.send(JSON.stringify({ index: newIndex }));
      setPlayers(prev => {
        return prev.map((player) => {
          if (player.id === myId) {
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

  let gameStatus;
  if (countdown === null) {
    gameStatus = "Waiting for players to join..." ;
  } else if (countdown !== 0) {
    gameStatus = countdown;
  } else {
    gameStatus = "";
  }

  function handleClick() {
    inputRef.current.focus();
    setFocused(true);
  }

  return (
    <>
      <div id={styles['game']} onClick={handleClick}>
        <p id={styles.status}>{gameStatus}</p>
        <Prompt input={input} prompt={prompt} players={players} myId={myId} focused={focused}/>
        <PlayerList players={players} myId={myId} prompt={prompt}/>
        <p id={styles['info']}>Press {"<Enter>"} to restart</p>
      </div>
      <input
        value={input}
        ref={inputRef}
        type="text"
        onChange={handleInput}
        autoFocus
        spellCheck={false}
        autoComplete="off"
        id={styles['hidden-input']}
        onBlur={() => setFocused(false)}
      />
    </>
  );
}
