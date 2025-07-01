import { firstDiffIndex } from "../utils";

export default function Prompt({ input, prompt, players, myId }) {
  const firstDiff = firstDiffIndex(input, prompt);
  const chars = [];

  for (let i = 0; i < firstDiff; i++) {
    chars.push(
      <span key={`c-${i}`} className="correct" style={{ backgroundColor: getBackgroundColor(i)}}>
        {prompt[i]}
      </span>
    );
  }

  for (let i = firstDiff; i < input.length; i++) {
    const value = input[i] != ' ' ? input[i] : '_';
    chars.push(
      <span key={`i-${i}`} className="incorrect">
        {value}
      </span>
    );
  }

  for (let i = firstDiff; i < prompt.length; i++) {
    chars.push(
      <span key={`u-${i}`} className="pending" style={{ backgroundColor: getBackgroundColor(i)}}>
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
  return <div className="prompt">{chars}</div>;
}