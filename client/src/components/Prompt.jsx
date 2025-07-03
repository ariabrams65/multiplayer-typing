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
    const style = {};
    if (isMyCaret(i)) {
      style.color = "rgb(226, 226, 226)"
      style.borderRadius = "3px";
      style.backgroundColor = getMyPlayersColor()
      style.textShadow = "0 0 5px black"
    } 
    if (isOtherPlayersCaret(i)) {
      style.textDecoration = "underline";
      style.textUnderlinePosition = "under";
      style.textDecorationThickness = "4px";
      style.textDecorationColor = getOtherPlayersColor(i)
      // style.borderRadius = "3px";
      // style.boxShadow = `0 0 6px ${getOtherPlayersColor(i)}`
    }
    return style;
  }

  function isMyCaret(i) {
    return players.some(p => p.id === myId && p.index === i);
  }

  function isOtherPlayersCaret(i) {
    return players.some(p => p.id !== myId && p.index === i);
  }

  function getMyPlayersColor() {
    return players.find(p => p.id === myId).color;
  }

  function getOtherPlayersColor(i) {
    return players.find(p => p.id !== myId && p.index === i)?.color;
  }
  return <div id={styles.prompt}>{chars}</div>;
}