import styles from "./PlayerList.module.css"

export default function PlayerList({ players, playerFinished }) {
  return (
    <ol id={styles['player-list']}>
      {players.map(p => (
        <li key={p.id} className={`${styles.player} ${p.removed ? styles.removed : ''} ${playerFinished(p.id) ? styles.finished : ''}`} style={{ backgroundColor: p.color }}>
          <span>{p.username}</span>
          <span>{Math.round(p.wpm)} WPM</span>
        </li>
      ))}
    </ol>
  );
}