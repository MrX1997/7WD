function f(player){
  const isClassic = true;
  return `${player.gods.map((god) => `
    <article>
      <span>${god.name}</span>
      <span>${isClassic ? 'a' : 'b'}</span>
    </article>
  `).join("") || `<div>${isClassic ? 'X' : 'Y'}</div>`}`;
}
