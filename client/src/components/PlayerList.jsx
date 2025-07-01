
export default function PlayerList({ players, playerFinished }) {
  return (
    <>
      <p>Players:</p>
      <ul>
        {players.map(p => (
          <li key={p.id} style={{ backgroundColor: p.color }}>
            {p.username} - WPM: {Math.round(p.wpm)} - {playerFinished(p.id) && "FINISHED"}
          </li>
        ))}
      </ul>
    </>
  );
}