import { firstDiffIndex } from "../utils";

import styles from "./Prompt.module.css"

export default function Prompt({ input, prompt, players, myId }) {
  const firstDiff = firstDiffIndex(input, prompt);
  const chars = [];

  for (let i = 0; i < firstDiff; i++) {
    chars.push(
      <span key={`c-${i}`} className={styles.correct} style={computeStyle(i)}>
        {prompt[i]}
      </span>
    );
  }

  for (let i = firstDiff; i < input.length; i++) {
    const value = input[i] != ' ' ? input[i] : '_';
    chars.push(
      <span key={`i-${i}`} className={styles.incorrect}>
        {value}
      </span>
    );
  }

  for (let i = firstDiff; i < prompt.length; i++) {
    chars.push(
      <span key={`u-${i}`} className={styles.pending} style={computeStyle(i)}>
        {prompt[i]}
      </span>
    );
  }

  function computeStyle(i) {
    let style;
    if (isMyCaret(i)) {
      style = {
        "border-radius": "2px",
        backgroundColor: getPlayersColor(i)
      };
    } else if (isOtherPlayersCaret(i)) {
      style = {
        "text-decoration": "underline",
        "text-decoration-color": getPlayersColor(i)
      };
    } else {
      style = null;
    }
    return style;
  }

  function isMyCaret(i) {
    return players.some(p => p.id === myId && p.index === i);
  }

  function isOtherPlayersCaret(i) {
    return players.some(p => p.id !== myId && p.index === i);
  }

  function getPlayersColor(index) {
    let color = null;
    for (const p of players) {
      if (p.index === index) {
        if (p.id === myId) {
          return p.color;
        }
        color = p.color;
      }
    }
    return color;
  }
  return <div id={styles.prompt}>{chars}</div>;
}