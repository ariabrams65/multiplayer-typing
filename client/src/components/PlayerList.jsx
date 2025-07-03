import styles from "./PlayerList.module.css"

export default function PlayerList({ players, myId, prompt }) {
  function computeStyle(player) {
    const percent = (player.index / prompt.length) * 100;
    return {
      background: `linear-gradient(to right, rgba(0, 0, 0, 0.3) ${percent}%, rgba(0, 0, 0, 0) ${percent}%), ${player.color}`
    }
  }

  players.sort((a, b) => {
    if (a.id === myId) {
      return -1;
    } else if (b.id === myId) {
      return 1;
    }
    return 0;
  });
  return (
    <ol id={styles['player-list']}>
      {players.map(p => (
        <li key={p.id} className={`${styles.player} ${p.place === 1 ? styles.first : ''}`} style={computeStyle(p)}>
          <span>{p.username}{p.id === myId && " (You)"}</span>
          <span>{Math.round(p.wpm)} WPM</span>
        </li>
      ))}
    </ol>
  );
}