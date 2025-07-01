import { useState, useEffect, useRef } from "react";
import { firstDiffIndex, generateUsername } from "../utils";

import Prompt from "./Prompt";
import PlayerList from "./PlayerList";

import styles from "./Game.module.css"

const colors = ['#EB757A', '#DCEB75', '#BB75EB', '#EB75DE', '#7577EB', '#75CFEB', '#75EBCA'];

export default function Game() {
  const [prompt, setPrompt] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [players, setPlayers] = useState([]);
  const [myId, setMyId] = useState(null);
  const [input, setInput] = useState('');

  const ws = useRef(null);
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
        setMyId(data.id);
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
            color: colors.pop()
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
    if (playerFinished(myId) || countdown !== 0) return;
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

  function playerFinished(id) {
    return players.find(p => p.id === id).index === prompt.length;
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
    <div id={styles['game']} onClick={() => inputRef.current?.focus()}>
      <p id={styles.status}>{gameStatus}</p>
      <Prompt input={input} prompt={prompt} players={players} myId={myId} />
      <PlayerList players={players} playerFinished={playerFinished} />
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
    </div>
  )
}
