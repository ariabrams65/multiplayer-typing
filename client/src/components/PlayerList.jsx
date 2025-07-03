import styles from "./PlayerList.module.css"

export default function PlayerList({ players, myId }) {
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
        <li key={p.id} className={`${styles.player} ${p.place ? styles.finished : ''} ${p.place === 1 ? styles.first : ''}`} style={{ backgroundColor: p.color }}>
          <span>{p.username}{p.id === myId && " (You)"}</span>
          <span>{Math.round(p.wpm)} WPM</span>
        </li>
      ))}
    </ol>
  );
}