import { firstDiffIndex } from "../utils";

import styles from "./Prompt.module.css"

export default function Prompt({ input, prompt, players, myId }) {
  const firstDiff = firstDiffIndex(input, prompt);
  const chars = [];

  for (let i = 0; i < firstDiff; i++) {
    chars.push(
      <span key={`c-${i}`} className={`${styles.correct} ${styles.caret}`} style={{ backgroundColor: getBackgroundColor(i)}}>
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
      <span key={`u-${i}`} className={`${styles.pending} ${styles.caret}`} style={{ backgroundColor: getBackgroundColor(i)}}>
        {prompt[i]}
      </span>
    );
  }

  function getBackgroundColor(index) {
    let color = '#ffffff00';
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