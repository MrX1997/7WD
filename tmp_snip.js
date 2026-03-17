function renderBuiltCardEntry(card) { return `<div>${card.name}</div>`; }
function renderTokenStack(a,b,c) { return ''; }
function getSpecialImageSrc(a,b){return a;}
const player = {modeLabel:'Color', mythology: {name:'x', summary:'y'}, specialLabel:'Wonders', gods:[{name:'A',image:'x',effect:'',built:true,locked:false}], resources:[], coinCount:0, stats:[], builtCards:[]};function renderPlayerDrawer(player) {
  const isClassic = player?.modeLabel === "Color";
  const factionTitle = isClassic ? "Color" : "Mythology";
  const factionValue = isClassic ? (player.mythology ?? "Not chosen yet") : (player.mythology?.name ?? player.mythology ?? "Not chosen yet");
  const factionSummary = isClassic ? "" : (player.mythology?.summary ?? "");
  const specialTitle = player.specialLabel ?? "Gods";

  return `
    <div class="dropdown-sheet wide">
      <div class="dropdown-header">
        <h3>${player.name}</h3>
        <button class="menu-action" data-close-menu="true">Close</button>
      </div>

      <div class="drawer-card">
        <strong>${factionTitle}</strong>
        <span>${factionValue}</span>
        ${factionSummary ? `<span>${factionSummary}</span>` : ""}
      </div>

      <div class="drawer-stack">
        <h4>Constructed Cards</h4>
        <div class="drawer-card-list">
          ${player.builtCards.map((card) => renderBuiltCardEntry(card)).join("") || `<div class="drawer-card"><strong>None yet</strong><span>Claim cards from the structure to build your domain.</span></div>`}
        </div>
      </div>

      <div class="drawer-stack">
        <h4>${specialTitle}</h4>
        <div class="drawer-card-list">
          ${player.gods.map((god) => `
            <article class="drawer-card">
              <span class="drawer-god-art" style="background-image:url('${getSpecialImageSrc(god.image, isClassic ? "classic" : "mythical')}');"></span>
              <strong>${god.name}</strong>
              <span>${god.effect}</span>
              <span>${god.built ? (isClassic ? "Built wonder" : "Completed cult") : god.locked ? "Sealed" : "Available"}</span>
            </article>
          `).join("") || `<div class="drawer-card"><strong>No ${specialTitle.toLowerCase()} yet</strong><span>${isClassic ? "Draft wonders first." : "Select a mythology to receive your divine pool."}</span></div>`}
        </div>
      </div>

      <div class="drawer-grid stats">
        ${player.stats.map((stat) => `<div class="dropdown-card stat"><strong>${stat.label}</strong><span>${stat.value}</span></div>`).join("")}
      </div>

      <div class="drawer-grid resources">
        ${player.resources.map((resource) => `<div class="dropdown-card resource-card">${renderTokenStack(resource.resource, resource.value, { showLabel: true })}</div>`).join("")}
        <div class="dropdown-card resource-card">${renderTokenStack("coins", player.coinCount, { showLabel: true })}</div>
      </div>
    </div>
  `;
}




