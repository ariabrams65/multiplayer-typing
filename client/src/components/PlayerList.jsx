import styles from "./PlayerList.module.css"

export default function PlayerList({ players, playerFinished }) {
  return (
    <ol id={styles['player-list']}>
      {players.map(p => (
        <li key={p.id} className={`${styles.player} ${playerFinished(p.id) ? styles.finished : ''}`} style={{ backgroundColor: p.color }}>
          <span>{p.username}</span>
          <span>{Math.round(p.wpm)}</span>
        </li>
      ))}
    </ol>
  );
}