import { useState, useEffect, useRef } from "react";
import { firstDiffIndex } from "../utils";

import Prompt from "./Prompt";
import PlayerList from "./PlayerList";

import styles from "./Game.module.css"

export default function Game() {
  const [prompt, setPrompt] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [players, setPlayers] = useState([]);
  const [myId, setMyId] = useState(null);
  const [input, setInput] = useState('');

  const countdownRef = useRef(countdown);
  const ws = useRef(null);
  const inputRef = useRef(null)

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8080/join?username=GUEST`);
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
        countdownRef.current = data.time;
        break;
      }
      case 'progress': {
        setPlayers(prev => {
          return prev.map((player) => {
            if (player.id === data.id) {
              if (data.id === myId) {
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

  return (
    <>
      <div id={styles['game']} onClick={() => inputRef.current?.focus()}>
        <p id={styles.status}>{gameStatus}</p>
        <Prompt input={input} prompt={prompt} players={players} myId={myId} />
        <PlayerList players={players} />
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
      />
    </>
  );
}
