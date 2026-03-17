function f(player) {
  const isClassic = true;
  return `${player.gods.map((god) => `
            <span style="background-image:url('${getSpecialImageSrc(god.image, isClassic ? "classic" : "mythical")}');"></span>
            <span>${god.name}</span>
          `).join("")}`;
}
function getSpecialImageSrc(a,b){return a;}
