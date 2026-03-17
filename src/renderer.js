import { DuelGame, getRulesReference } from "./game/engine.js";

const appRoot = document.querySelector("#app");
const game = new DuelGame();

const uiState = {
  openMenu: null,
  openRulesMode: "mythical",
  menuMode: null,
  expandedTypeDeck: null,
  activeAnimation: null,
  lastAnimationId: null,
  animationTimer: null,
};

const TOKEN_META = {
  stone: { label: "Stone", className: "stone" },
  wood: { label: "Wood", className: "wood" },
  clay: { label: "Brick", className: "clay" },
  glass: { label: "Glass", className: "glass" },
  papyrus: { label: "Papyrus", className: "papyrus" },
  coins: { label: "Coins", className: "coins" },
};
const RESOURCE_GIF_MAP = {
  stone: "../assets/gifs/gather_stone.gif",
  wood: "../assets/gifs/gather_wood.gif",
  clay: "../assets/gifs/gather_brick.gif",
  glass: "../assets/gifs/gather_glass.gif",
  papyrus: "../assets/gifs/gather_papyrus.gif",
  coins: "../assets/gifs/gather_coin.gif",
};
const SCIENCE_EMOJI = {
  tablet: "📜",
  gear: "⚙️",
  wheel: "🛞",
  triangle: "🔺",
  quill: "🪶",
  sundial: "☀️",
  astrolabe: "🧭",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getCardImageSrc(imageKey, mode = "mythical") {
  return mode === "classic"
    ? `../assets/assets_buildings_classic/${imageKey}.png`
    : `../assets/assets_buildings/${imageKey}_mythic.png`;
}

function getCivImageSrc(imageKey) {
  return `../assets/civs/${imageKey}`;
}

function getGameScreenAsset(fileName) {
  return `../assets/game_screen/${fileName}`;
}

function getGodImageSrc(imageKey) {
  return `../assets/assets_gods/${imageKey}`;
}

function getWonderImageSrc(imageKey) {
  return `../assets/assets_wonders/${imageKey}`;
}

function renderTokenGlyph(type, index = 0) {
  const meta = TOKEN_META[type] ?? TOKEN_META.stone;
  return `<span class="token-glyph token-${meta.className}" style="--token-index:${index};"></span>`;
}

function renderTokenStack(type, count, options = {}) {
  const meta = TOKEN_META[type] ?? TOKEN_META.stone;
  const safeCount = Math.max(0, Number(count) || 0);
  const visibleCount = type === "coins" ? 1 : safeCount === 0 ? 1 : Math.min(safeCount, 6);
  return `
    <div class="token-stack ${options.compact ? "compact" : ""} ${safeCount === 0 ? "zero" : ""}" title="${safeCount} ${meta.label}">
      <div class="token-stack-glyphs">
        ${Array.from({ length: visibleCount }, (_, index) => renderTokenGlyph(type, index)).join("")}
      </div>
      <span class="token-stack-count">${safeCount}</span>
      ${options.showLabel ? `<span class="token-stack-label">${meta.label}</span>` : ""}
    </div>
  `;
}

function renderResourceCost(entries = [], coinCost = 0, options = {}) {
  const resourceTokens = entries.map((entry) => renderTokenStack(entry.resource, entry.count, { compact: options.compact, showLabel: options.showLabel })).join("");
  const coinTokens = coinCost > 0 ? renderTokenStack("coins", coinCost, { compact: options.compact, showLabel: options.showLabel }) : "";
  if (!resourceTokens && !coinTokens) {
    return `<span class="free-cost">Free</span>`;
  }
  return `<div class="resource-cost ${options.compact ? "compact" : ""}">${resourceTokens}${coinTokens}</div>`;
}

function renderCostCorner(resourceUnits, ownResourcesCovered) {
  if (!resourceUnits) {
    return "";
  }
  return `<span class="cost-corner ${ownResourcesCovered ? "owned" : "missing"}">${resourceUnits}</span>`;
}

function renderProvidedResources(entries = []) {
  if (!entries.length) {
    return "";
  }
  return `
    <div class="provided-resources">
      ${entries.map((entry) => renderTokenStack(entry.resource, entry.count, { compact: true })).join("")}
    </div>
  `;
}

function renderCardMetric(kind, value, label) {
  if (!value) {
    return "";
  }
  const icon = kind === "science"
    ? `<span class="card-metric-emoji">${SCIENCE_EMOJI[value] ?? "✨"}</span>`
    : `<span class="card-metric-icon ${kind}"></span>`;
  return `
    <div class="card-metric ${kind}" title="${label}: ${value}">
      ${icon}
      <span class="card-metric-count">${kind === "science" ? "" : value}</span>
    </div>
  `;
}

function renderCardRightRail(slot, mode = "mythical") {
  const rows = [];
  if (slot.producedResources?.length) {
    rows.push(renderProvidedResources(slot.producedResources));
  }
  if (slot.scienceSymbol) {
    rows.push(renderCardMetric("science", slot.scienceSymbol, "Science symbol"));
  }
  if (slot.militaryValue) {
    rows.push(renderCardMetric("military", slot.militaryValue, mode === "classic" ? "Military shields" : "Summoning"));
  }
  if (slot.points) {
    rows.push(renderCardMetric("diplomacy", slot.points, "Victory points"));
  }
  return rows.join("");
}

function renderWinnerSummary(summary) {
  if (!summary?.length) {
    return "";
  }
  return `
    <section class="winner-summary">
      ${summary.map((player) => `
        <article class="winner-summary-card">
          <strong>${player.name}</strong>
          <span class="winner-total">${player.total} VP</span>
          <div class="winner-breakdown">
            ${player.rows.map((row) => `<span>${row.label}: ${row.value}</span>`).join("")}
          </div>
        </article>
      `).join("")}
    </section>
  `;
}

function clampRows(rawSlots) {
  const rows = new Map();

  rawSlots.forEach((slot) => {
    const rowKey = Math.max(0, Math.round(slot.top / 108));
    const row = rows.get(rowKey) ?? [];
    row.push(slot);
    rows.set(rowKey, row);
  });

  const orderedRows = [...rows.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([, slots]) => [...slots].sort((leftSlot, rightSlot) => leftSlot.left - rightSlot.left));

  const widest = orderedRows.reduce((value, row) => Math.max(value, row.length), 0);
  return { orderedRows, widest };
}

function renderBuiltCardEntry(card) {
  return `
    <article class="drawer-card card-coded ${card.typeClass}">
      <span class="drawer-card-type">${card.typeLabel}</span>
      <strong>${card.name}</strong>
      <span>${card.detail}</span>
    </article>
  `;
}

function toggleMenu(menuName) {
  uiState.openMenu = uiState.openMenu === menuName ? null : menuName;
}

function closeMenus() {
  uiState.openMenu = null;
}

function initShellActions() {
  if (!window.appShell?.onMenuAction) {
    return;
  }

  window.appShell.onMenuAction((action) => {
    if (action === "new-game") {
      closeMenus();
      game.reset(game.getMode());
      render();
      return;
    }

    if (action === "rules") {
      uiState.openRulesMode = game.getMode();
      uiState.openMenu = "rules";
      render();
    }
  });
}

function render() {
  const view = game.getViewModel();
  if (view.started) {
    uiState.menuMode = view.mode;
  }
  syncAnimationCue(view);
  appRoot.innerHTML = view.started ? renderGame(view) : renderMainMenu();
  bindEvents();
}

function renderPlayerBackgrounds(players = []) {
  const sides = [
    { player: players[0], className: "left" },
    { player: players[1], className: "right" },
  ];

  return `
    <div class="player-backdrops" aria-hidden="true">
      ${sides.map(({ player, className }) => {
        if (!player?.mythology?.image) {
          return `<div class="player-backdrop ${className} empty"></div>`;
        }
        return `
          <div
            class="player-backdrop ${className}"
            style="--backdrop-image:url('${getCivImageSrc(player.mythology.image)}'); --backdrop-panel:${player.mythology.panel}; --backdrop-accent:${player.mythology.accent};"
          ></div>
        `;
      }).join("")}
    </div>
  `;
}

function syncAnimationCue(view) {
  const cue = view.resourceAnimation;
  if (!cue || cue.id === uiState.lastAnimationId) {
    return;
  }
  uiState.lastAnimationId = cue.id;
  uiState.activeAnimation = cue;
  if (uiState.animationTimer) {
    clearTimeout(uiState.animationTimer);
  }
  uiState.animationTimer = setTimeout(() => {
    uiState.activeAnimation = null;
    uiState.animationTimer = null;
    render();
  }, 3000);
}

function bindEvents() {
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;

      if (action === "start") {
        closeMenus();
        game.reset(game.getMode());
      } else if (action === "choose-menu-classic") {
        closeMenus();
        uiState.menuMode = "classic";
      } else if (action === "choose-menu-mythical") {
        closeMenus();
        uiState.menuMode = "mythical";
      } else if (action === "quit") {
        window.appShell?.quit();
      } else if (action === "menu") {
        uiState.menuMode = game.getMode();
        game.goToMenu();
        closeMenus();
      } else if (action === "start-mythical") {
        closeMenus();
        uiState.menuMode = "mythical";
        game.reset("mythical");
      } else if (action === "start-classic") {
        closeMenus();
        uiState.menuMode = "classic";
        game.reset("classic");
      } else if (action === "new-game") {
        closeMenus();
        game.reset(game.getMode());
      } else if (action === "new-game-mythical") {
        closeMenus();
        uiState.menuMode = "mythical";
        game.reset("mythical");
      } else if (action === "new-game-classic") {
        closeMenus();
        uiState.menuMode = "classic";
        game.reset("classic");
      } else if (action === "switch-to-classic-menu") {
        game.goToMenu();
        uiState.menuMode = "classic";
        closeMenus();
      } else if (action === "switch-to-mythical-menu") {
        game.goToMenu();
        uiState.menuMode = "mythical";
        closeMenus();
      } else if (action === "select-card") {
        game.selectCard(button.dataset.id);
      } else if (action === "build-card") {
        game.buildSelectedCard();
      } else if (action === "discard-card") {
        game.discardSelectedCard();
      } else if (action === "cancel-selection") {
        game.clearSelection();
        uiState.expandedTypeDeck = null;
      } else if (action === "choose-god") {
        game.buildGodWithSelectedCard(button.dataset.id);
      } else if (action === "choice") {
        game.resolveChoice(button.dataset.id);
      } else if (action === "toggle-type-deck") {
        const deckId = button.dataset.id;
        uiState.expandedTypeDeck = uiState.expandedTypeDeck === deckId ? null : deckId;
      }

      render();
    });
  });

  document.querySelectorAll("[data-menu-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleMenu(button.dataset.menuToggle);
      render();
    });
  });

  document.querySelectorAll("[data-open-menu]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetMenu = button.dataset.openMenu;
      if (targetMenu === "rules-mythical") {
        uiState.openRulesMode = "mythical";
        uiState.openMenu = "rules";
      } else if (targetMenu === "rules-classic") {
        uiState.openRulesMode = "classic";
        uiState.openMenu = "rules";
      } else {
        uiState.openMenu = targetMenu;
      }
      render();
    });
  });

  document.querySelectorAll("[data-close-menu]").forEach((button) => {
    button.addEventListener("click", () => {
      closeMenus();
      render();
    });
  });

  document.querySelectorAll("[data-clear-selection-surface]").forEach((surface) => {
    surface.addEventListener("click", (event) => {
      if (event.target.closest(".card-tile")) {
        return;
      }
      game.clearSelection();
      uiState.expandedTypeDeck = null;
      render();
    });
  });

  document.querySelectorAll("[data-dismiss-animation]").forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target.closest(".resource-animation-card")) {
        return;
      }
      uiState.activeAnimation = null;
      if (uiState.animationTimer) {
        clearTimeout(uiState.animationTimer);
        uiState.animationTimer = null;
      }
      render();
    });
  });
}

function renderTurnResourcePanel(panel) {
  if (!panel) {
    return "";
  }
  const imageMode = panel.imageMode ?? "mythical";
  const militaryLabel = imageMode === "classic" ? "Military" : "Summoning";
  const groupedCards = panel.groupedCards ?? [];
  return `
    <aside class="turn-resource-panel">
      <strong>${panel.name}</strong>
      <div class="turn-panel-stats">
        <span class="turn-vp">VP ${panel.victoryPoints}</span>
      </div>
      ${panel.builtGods?.length ? `
        <div class="turn-god-strip">
          ${panel.builtGods.map((god) => `
            <article class="mini-god-card" title="${god.name}">
              <span class="mini-god-art" style="background-image:url('${getSpecialImageSrc(god.image, imageMode)}');"></span>
              <span class="mini-god-name">${god.name}</span>
            </article>
          `).join("")}
        </div>
      ` : ""}
      <div class="turn-panel-layout">
        <div class="turn-panel-columns">
        <div class="turn-resource-grid">
          <div class="turn-panel-subtitle">Resources</div>
          ${panel.resources.map((resource) => `<div class="turn-resource-entry" title="${escapeHtml(resource.summary)}">${renderTokenStack(resource.resource, resource.value, { showLabel: true })}</div>`).join("")}
          <div class="turn-resource-entry" title="Coins currently in treasury.">${renderTokenStack("coins", panel.coinCount, { showLabel: true })}</div>
        </div>
        <div class="turn-science-grid">
          <div class="turn-panel-subtitle">Science Symbols</div>
          ${panel.scienceSymbols?.length
            ? panel.scienceSymbols.map((entry) => `
              <div class="turn-science-entry" title="${entry.symbol}: ${entry.count}">
                <span class="turn-science-emoji">${SCIENCE_EMOJI[entry.symbol] ?? "✨"}</span>
                <span class="turn-science-label">${entry.symbol}</span>
                <span class="turn-science-count">${entry.count}</span>
              </div>
            `).join("")
            : `<div class="turn-science-empty">No science symbols yet.</div>`}
          <div class="turn-science-entry emphasis">
            <span class="turn-science-emoji">🔺</span>
            <span class="turn-science-label">${militaryLabel}</span>
            <span class="turn-science-count">${panel.militaryPoints}</span>
          </div>
          <div class="turn-science-entry emphasis">
            <span class="turn-science-emoji">◼️</span>
            <span class="turn-science-label">Diplomacy</span>
            <span class="turn-science-count">${panel.diplomacyPoints}</span>
          </div>
        </div>
        ${groupedCards.length ? renderTypeDeckSidebar(groupedCards) : ""}
      </div>
    </aside>
  `;
}

function renderTypeDeckSidebar(groupedCards) {
  return `
    <div class="turn-type-sidebar">
      <div class="turn-panel-subtitle">Owned Decks</div>
      <div class="turn-type-stack">
        ${groupedCards.map((group) => `
          <div class="turn-type-group ${uiState.expandedTypeDeck === group.id ? "expanded" : ""}">
            <button class="turn-type-toggle ${group.typeClass}" data-action="toggle-type-deck" data-id="${group.id}" title="${group.typeLabel}: ${group.count}">
              <span class="turn-type-toggle-label">${group.typeLabel}</span>
              <span class="turn-type-toggle-count">${group.count}</span>
            </button>
            ${uiState.expandedTypeDeck === group.id ? `
              <div class="turn-type-expanded">
                ${group.cards.map((card) => `
                  <article class="turn-type-card ${card.typeClass}">
                    <strong>${card.name}</strong>
                    <span>${card.detail}</span>
                  </article>
                `).join("")}
              </div>
            ` : ""}
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function getSpecialImageSrc(imageKey, mode = "mythical") {
  if (!imageKey) {
    return "";
  }
  if (imageKey.includes("/")) {
    return imageKey;
  }
  return mode === "classic"
    ? getWonderImageSrc(imageKey)
    : getGodImageSrc(imageKey);
}

function renderOpponentScorePanel(panel, mode = "mythical") {
  if (!panel) {
    return "";
  }
  const winsLabel = mode === "classic" ? "Military" : "Ritual Wins";
  return `
    <aside class="opponent-score-panel">
      <strong>${panel.name}</strong>
      <span>VP ${panel.victoryPoints}</span>
      <span>Coins ${panel.coins}</span>
      <span>Science ${panel.science}</span>
      <span>${winsLabel} ${panel.summoningWins}</span>
    </aside>
  `;
}

function renderResourceAnimationOverlay(animation) {
  if (!animation) {
    return "";
  }
  if (animation.kind === "dice") {
    return `
      <div class="resource-animation-overlay" data-dismiss-animation="true">
        <div class="resource-animation-card dice-animation-card">
          <h2>${animation.title}</h2>
          <p>${animation.summary}</p>
          <img class="resource-animation-gif" src="${getGameScreenAsset("godsthrow.gif")}" alt="Dice throw animation">
          <div class="dice-score-grid">
            ${animation.players.map((player) => `
              <article class="dice-score-card">
                <strong>${player.name}</strong>
                <span>Dice: ${player.dice?.join(" + ") ?? player.roll}</span>
                ${Number.isInteger(player.base) ? `<span>Summoning: ${player.base}</span>` : ""}
                <span class="dice-total">Total: ${player.total}</span>
              </article>
            `).join("")}
          </div>
          ${animation.note ? `<span class="dice-note">${animation.note}</span>` : ""}
        </div>
      </div>
    `;
  }
  const gifSrc = RESOURCE_GIF_MAP[animation.type];
  return `
    <div class="resource-animation-overlay" data-dismiss-animation="true">
      <div class="resource-animation-card">
        <h2>${animation.playerIndex === 0 ? "Player 1" : "Player 2"}</h2>
        <p>${animation.label}: ${animation.before} -> ${animation.after}</p>
        <span class="resource-animation-delta">+${animation.delta}</span>
        ${gifSrc ? `<img class="resource-animation-gif" src="${gifSrc}" alt="${animation.label} animation">` : ""}
      </div>
    </div>
  `;
}

function renderMainMenu() {
  if (!uiState.menuMode) {
    return `
      <div class="screen-shell menu-shell">
        <div class="menu-card mode-select-card">
          <div class="mode-select-copy">
            <div class="menu-kicker">Choose Game Mode</div>
            <h1 class="menu-title mode-select-title">Duel Selection</h1>
            <p class="menu-subtitle mode-select-subtitle">Pick the ruleset first, then we will open that mode's menu.</p>
          </div>
          <div class="mode-select-grid">
            <button class="mode-select-option" data-action="choose-menu-classic">
              <strong>Classic</strong>
              <span>Original 7 Wonders Duel flow with color choice, wonder draft, conflict track, and military supremacy.</span>
            </button>
            <button class="mode-select-option" data-action="choose-menu-mythical">
              <strong>Mythical</strong>
              <span>Chaos Duel with mythologies, gods, summoning, cult powers, and ritual resolution.</span>
            </button>
          </div>
          <div class="menu-inline-actions">
            <button class="menu-action danger" data-action="quit">Quit</button>
          </div>
        </div>
      </div>
    `;
  }

  const isClassic = uiState.menuMode === "classic";
  const title = isClassic ? "7 Wonders Duel" : "Chaos Duel";
  const subtitle = isClassic ? "Classic Mode" : "Chaos Duel: Gods Play Dice";
  const kicker = isClassic ? "Classic Civilizations" : "Local Mythology Duel";
  const copy = isClassic
    ? "Start a classic local duel with player color selection, wonder drafting, conflict pressure, and the original victory conditions."
    : "Start a mythic duel with cult construction, summoning rituals, and reusable divine activations.";
  const switchAction = isClassic ? "choose-menu-mythical" : "choose-menu-classic";
  const switchLabel = isClassic ? "Switch to Mythical" : "Switch to Classic";
  const startAction = isClassic ? "start-classic" : "start-mythical";
  const rulesMenu = isClassic ? "rules-classic" : "rules-mythical";

  return `
    <div class="screen-shell menu-shell">
      <div class="menu-card">
        <div class="menu-logo ${isClassic ? "classic-logo" : ""}" ${isClassic ? "" : `style="--logo-image:url('${getGameScreenAsset("gods_title.jpg")}');"`}>
          <div class="menu-kicker">${kicker}</div>
          <h1 class="menu-title">${title}</h1>
          <p class="menu-subtitle">${subtitle}</p>
        </div>
        <p class="menu-copy">${copy}</p>
        <div class="menu-inline-actions">
          <button class="menu-action primary" data-action="${startAction}">New Game</button>
          <button class="menu-action" data-open-menu="${rulesMenu}">Rules</button>
          <button class="menu-action" data-action="${switchAction}">${switchLabel}</button>
          <button class="menu-action danger" data-action="quit">Quit</button>
        </div>
        ${uiState.openMenu === "rules" ? renderRulesDropdown(uiState.menuMode) : ""}
      </div>
    </div>
  `;
}

function renderGame(view) {
  const isClassic = view.mode === "classic";
  const specialTitle = isClassic ? "Wonders" : "God Cults";
  const rulesMenuMode = view.mode === "classic" ? "rules-classic" : "rules-mythical";
  const gameTitle = isClassic ? "7 Wonders Duel" : "Chaos Duel";
  const gameSubtitle = isClassic ? "Classic Mode" : "Chaos Duel: Gods Play Dice";
  const gameKicker = isClassic ? "Classic table" : "Ritual tableau";

  return `
    <div
      class="screen-shell game-shell"
      style="--turn-bg:${view.theme.background}; --turn-panel:${view.theme.panel}; --turn-accent:${view.theme.accent};"
    >
      <header class="top-strip">
        <div>
          <div class="top-strip-logo ${isClassic ? "classic-logo" : ""}" ${isClassic ? "" : `style="--logo-image:url('${getGameScreenAsset("gods_title.jpg")}');"`}>
            <div class="menu-kicker">${gameKicker}</div>
            <h1>${gameTitle}</h1>
            <div class="top-subtitle">${gameSubtitle}</div>
          </div>
          <p>${view.phaseLabel}</p>
        </div>
        <div class="compact-menu-row">
          <span class="state-chip"><strong>Mode:</strong> ${isClassic ? "Classic" : "Mythical"}</span>
          <button class="menu-action" data-menu-toggle="game">Game</button>
          <button class="menu-action" data-menu-toggle="player-0">${view.players[0].name}</button>
          <button class="menu-action" data-menu-toggle="player-1">${view.players[1].name}</button>
          <button class="menu-action" data-menu-toggle="tokens">Tokens</button>
          <button class="menu-action" data-open-menu="${rulesMenuMode}">Rules</button>
          <button class="menu-action" data-menu-toggle="log">Log</button>
          <button class="menu-action" data-action="quit">Quit</button>
        </div>
        <div class="state-band">
          <div class="state-chip"><strong>Age:</strong> ${view.ageLabel}</div>
          <div class="state-chip"><strong>Turn:</strong> ${view.turnNumber}</div>
          <div class="state-chip"><strong>Current:</strong> ${view.currentPlayer?.name ?? "None"}</div>
          <div class="state-chip"><strong>Cards Left:</strong> ${view.remainingCards}</div>
        </div>
        ${renderDropdownContent(view)}
      </header>

      ${view.winner ? `<div class="winner-banner"><strong>${view.winner.title}</strong><span>${view.winner.detail}</span></div>${renderWinnerSummary(view.winnerSummary)}` : ""}

      ${renderStatusStrip(view)}

      <main class="layout-grid">
        <section class="panel cards-panel" data-clear-selection-surface="true">
          <h2>${view.ageLabel}</h2>
          <p>${view.selectionHint}</p>
        ${renderCardRows(view.slots, view.mode)}
      </section>
      </main>

      ${view.selectedCard ? `
      <aside class="panel control-panel">
        <div class="control-panel-head">
          <h3>Selected Card</h3>
        </div>
        <div>
          ${renderSelectedCardPanel(view)}
        </div>

        <div>
          <h4>${specialTitle}</h4>
          <div class="god-strip">
            ${view.currentPlayer?.unbuiltGods.length ? view.currentPlayer.unbuiltGods.map((god) => `
              <button
                class="god-drop ${god.canBuild ? "action-possible" : "action-blocked"}"
                data-action="choose-god"
                data-id="${god.id}"
                ${view.selectedCard && god.canBuild ? "" : "disabled"}
              >
                <span class="god-drop-art" style="background-image:url('${getSpecialImageSrc(god.image, view.mode)}');"></span>
                ${renderCostCorner(god.resourceUnits, god.ownResourcesCovered)}
                ${god.points ? `<span class="vp-badge">${god.points}</span>` : ""}
                <strong>${god.name}</strong>
                <span>${god.effect}</span>
                ${renderResourceCost(god.costResources, god.coinCost, { compact: true })}
                ${renderProvidedResources(god.producedResources)}
                <em>${isClassic
                  ? `${god.requiresTrade ? `Trade ${god.tradeCost}` : god.costLabel} cost`
                  : `${god.buildingRequirementMet ? `${god.requiresTrade ? `Trade ${god.tradeCost}` : god.costLabel} cost` : `Needs ${god.buildingsRequired} buildings (${god.builtStructures}/${god.buildingsRequired})`}`}</em>
              </button>
            `).join("") : `<div class="god-empty">${isClassic ? "All drafted wonders are already built or removed." : "All available gods are already completed or sealed."}</div>`}
          </div>
        </div>
      </aside>
      ` : ""}

      ${view.choiceModal ? renderChoiceModal(view.choiceModal) : ""}
      ${view.selectedCard ? renderTurnResourcePanel(view.turnResourcePanel, view.mode) : ""}
      ${renderResourceAnimationOverlay(uiState.activeAnimation)}
    </div>
  `;
}

function renderStatusStrip(view) {
  if (view.mode === "classic") {
    return renderClassicConflictStrip(view);
  }
  return renderMythicStatusStrip(view);
}

function renderMythicStatusStrip(view) {
  return `
    <section class="summoning-strip">
      <div>
        <strong>${view.banner}</strong>
        <span>${view.structureHint}</span>
      </div>
      <div class="summoning-strip-track">
        <div class="dropdown-grid">
          ${view.summoning.current.map((entry) => `
            <article class="dropdown-card">
              <strong>${entry.player}</strong>
              <span>Age Summoning: ${entry.value}</span>
            </article>
          `).join("")}
        </div>
        <div class="track-labels">
          <span>${view.summoning.winners.map((entry) => entry.label).join(" | ") || "No ritual winners yet"}</span>
        </div>
        <div class="token-pill-row">
          ${view.summoning.pending.length ? view.summoning.pending.map((entry) => `<span class="token-pill">${entry} pending</span>`).join("") : `<span class="token-pill">No divine activations pending</span>`}
        </div>
        ${view.summoning.lastResolution ? `<div class="winner-banner"><strong>${view.summoning.lastResolution.summary}</strong><span>${view.summoning.lastResolution.detail}</span></div>` : ""}
      </div>
    </section>
  `;
}

function renderClassicConflictStrip(view) {
  const track = view.summoning.track;
  return `
    <section class="summoning-strip classic-conflict-strip">
      <div>
        <strong>${view.banner}</strong>
        <span>${view.structureHint}</span>
      </div>
      <div class="summoning-strip-track">
        <div class="classic-conflict-header">
          <span>${view.players[1].name} capital</span>
          <strong>Conflict Track</strong>
          <span>${view.players[0].name} capital</span>
        </div>
        <div class="classic-conflict-map">
          ${track.spaces.map((space) => `
            <div class="conflict-space ${space.isCenter ? "center" : ""} ${space.isLoot ? "loot" : ""} ${space.controlledBy === 0 ? "player-zero" : space.controlledBy === 1 ? "player-one" : ""}">
              <span>${space.label}</span>
              ${space.active ? `<span class="conflict-pawn"></span>` : ""}
            </div>
          `).join("")}
        </div>
        <div class="classic-conflict-summary">
          ${track.preview.map((entry) => `
            <article class="dropdown-card">
              <strong>${entry.player}</strong>
              <span>Military VP: ${entry.points}</span>
            </article>
          `).join("")}
        </div>
        <div class="token-pill-row">
          ${track.lootTokens.map((token) => `
            <span class="token-pill ${token.claimed ? "spent" : ""}">
              ${token.side === 0 ? view.players[1].name : view.players[0].name} ${token.penalty}-coin loss
            </span>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderDropdownContent(view) {
  if (!uiState.openMenu) {
    return "";
  }

  if (uiState.openMenu === "game") {
    const isClassic = view.mode === "classic";
    return `
      <div class="dropdown-sheet">
        <button class="menu-action primary" data-action="${isClassic ? "new-game-classic" : "new-game-mythical"}">New Game</button>
        <button class="menu-action" data-open-menu="${isClassic ? "rules-classic" : "rules-mythical"}">Rules</button>
        <button class="menu-action" data-action="${isClassic ? "switch-to-mythical-menu" : "switch-to-classic-menu"}">${isClassic ? "Switch to Mythical" : "Switch to Classic"}</button>
        <button class="menu-action" data-action="menu">Main Menu</button>
        <button class="menu-action danger" data-close-menu="true">Close</button>
      </div>
    `;
  }

  if (uiState.openMenu === "tokens") {
    return `
      <div class="dropdown-sheet wide">
        <div class="dropdown-header">
          <h3>Visible Progress Tokens</h3>
          <button class="menu-action" data-close-menu="true">Close</button>
        </div>
        <div class="dropdown-grid">
          ${view.availableProgress.map((token) => `
            <article class="dropdown-card token-display">
              <strong>${token.name}</strong>
              <span>${token.summary}</span>
            </article>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (uiState.openMenu === "log") {
    return `
      <div class="dropdown-sheet medium">
        <div class="dropdown-header">
          <h3>Recent Log</h3>
          <button class="menu-action" data-close-menu="true">Close</button>
        </div>
        <ul class="dropdown-log">
          ${view.log.map((entry) => `<li>${entry}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  if (uiState.openMenu === "player-0" || uiState.openMenu === "player-1") {
    const player = view.players[uiState.openMenu === "player-0" ? 0 : 1];
    return renderPlayerDrawer(player);
  }

  if (uiState.openMenu === "rules" || uiState.openMenu === "rules-mythical" || uiState.openMenu === "rules-classic") {
    return renderRulesDropdown(uiState.openRulesMode || "mythical");
  }

  return "";
}

function renderPlayerDrawer(player) {
  const isClassic = player?.modeLabel === "Color";
  const factionTitle = isClassic ? "Color" : "Mythology";
  const factionValue = isClassic ? (player.mythology ?? "Not chosen yet") : (player.mythology?.name ?? player.mythology ?? "Not chosen yet");
  const factionSummary = isClassic ? "" : (player.mythology?.summary ?? "");
  const specialTitle = player.specialLabel ?? "Gods";
  const specialImageMode = isClassic ? "classic" : "mythical";
  const emptySpecialMessage = isClassic ? "Draft wonders first." : "Select a mythology to receive your divine pool.";
  const builtSpecialLabel = isClassic ? "Built wonder" : "Completed cult";
  const emptyBuiltCardsMessage = isClassic
    ? "Build from the structure to develop your city."
    : "Claim cards from the structure to build your domain.";

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
          ${player.builtCards.map((card) => renderBuiltCardEntry(card)).join("") || `<div class="drawer-card"><strong>None yet</strong><span>${emptyBuiltCardsMessage}</span></div>`}
        </div>
      </div>

      <div class="drawer-stack">
        <h4>${specialTitle}</h4>
        <div class="drawer-card-list">
          ${player.gods
            .map((god) => {
              const status = god.built ? builtSpecialLabel : god.locked ? "Sealed" : "Available";
              return `
                <article class="drawer-card">
                  <span class="drawer-god-art" style="background-image:url('${getSpecialImageSrc(god.image, specialImageMode)}');"></span>
                  <strong>${god.name}</strong>
                  <span>${god.effect}</span>
                  <span>${status}</span>
                </article>
              `;
            })
            .join("") || `<div class="drawer-card"><strong>No ${specialTitle.toLowerCase()} yet</strong><span>${emptySpecialMessage}</span></div>`}
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

function renderRulesDropdown(mode = "mythical") {
  const sections = getRulesReference(mode);
  return `
    <div class="dropdown-sheet wide">
      <div class="dropdown-header">
        <h3>Rules Reference</h3>
        <button class="menu-action" data-close-menu="true">Close</button>
      </div>
      <div class="dropdown-grid">
        ${sections.map((section) => `
          <article class="dropdown-card rule">
            <strong>${section.title}</strong>
            ${section.list ? `<ul>${section.list.map((item) => `<li>${item}</li>`).join("")}</ul>` : `<span>${section.body}</span>`}
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

function renderSelectedCardPanel(view) {
  if (!view.selectedCard) {
    const placement = view.mode === "classic" ? "to a wonder" : "to a god";
    return `
      <div class="selected-card empty">
        <strong>No card selected</strong>
        <span>Click a revealed card, then build it, sell it, or offer it ${placement}.</span>
      </div>
    `;
  }

  const buildLabel = view.selectedCard.requiresTrade ? `Build (with trade ${view.selectedCard.tradeCost} coins)` : "Build";
  const buildClass = `action-button ${view.selectedCard.canBuild ? "action-possible primary" : "action-blocked"}`;
  const discardClass = "action-button action-possible";

  return `
    <div class="selected-card live">
      <div class="selected-card-body">
        <strong>${view.selectedCard.name}</strong>
        <span>${view.actionSummary}</span>
        ${renderResourceCost(view.selectedCard.costResources, view.selectedCard.coinCost, { showLabel: true })}
        ${renderProvidedResources(view.selectedCard.producedResources)}
        ${view.selectedCard.requiresTrade ? `<span>${view.selectedCard.tradeSummary}</span>` : ""}
        <span>Sell value: ${view.selectedCard.discardIncome} coins</span>
      </div>
        <div class="selected-actions">
        <button class="${buildClass}" data-action="build-card" ${view.selectedCard.canBuild ? "" : "disabled"}>${buildLabel}</button>
        <button class="${discardClass}" data-action="discard-card">Sell</button>
        <button class="action-button action-possible" data-action="cancel-selection">Clear</button>
      </div>
    </div>
  `;
}

function renderSlot(slot, mode = "mythical") {
  const classes = [
    "card-tile",
    slot.hidden ? "hidden-card" : slot.typeClass,
    slot.accessible ? "accessible" : "",
    slot.selected ? "selected" : "",
  ].filter(Boolean).join(" ");

  return `
    <button
      class="${classes}"
      ${slot.canClick ? `data-action="select-card" data-id="${slot.id}"` : "disabled"}
      ${slot.hidden ? "" : `data-tooltip="${escapeHtml([slot.typeLabel, slot.effect, slot.footer].filter(Boolean).join(" | "))}"`}
      title="${slot.hidden ? "Hidden card" : [slot.typeLabel, slot.effect, slot.footer].filter(Boolean).join(" | ")}"
    >
      ${slot.hidden ? `
        <div class="slot-title">Hidden Card</div>
        <div class="slot-body">
          <div>Clear the row above to reveal this slot.</div>
        </div>
      ` : `
        <span class="card-art" style="background-image:url('${getCardImageSrc(slot.imageKey, mode)}');"></span>
        <div class="card-topline">
          <div class="card-cost-corner">
            ${renderResourceCost(slot.costResources, slot.coinCost, { compact: true })}
          </div>
        </div>
        <div class="slot-title">${slot.name}</div>
        <div class="slot-body-spacer"></div>
        <div class="card-right-rail">
          ${renderCardRightRail(slot, mode)}
        </div>
      `}
    </button>
  `;
}

function renderCardRows(slots, mode = "mythical") {
  const { orderedRows, widest } = clampRows(slots);
  if (!orderedRows.length) {
    return `<div class="empty-card-row">No cards remaining in this age.</div>`;
  }

  return orderedRows
    .map((row) => {
      const gap = Math.max(0, widest - row.length);
      return `
        <div class="slot-row" style="--row-gap:${gap}">
          ${row.map((slot) => renderSlot(slot, mode)).join("")}
        </div>
      `;
    })
    .join("");
}

function renderChoiceModal(modal) {
  const resolveChoiceImage = (option) => {
    if (!option.image) {
      return "";
    }
    if (option.image.includes("/") || option.image.includes("\\")) {
      return option.image;
    }
    return getCivImageSrc(option.image);
  };
  const resolveSwatch = (option) => option.swatch ?? "#b99a72";
  const resolveAccent = (option) => option.accent ?? "#6e4a2c";
  const tradeSummary = modal.tradeRows?.length
    ? `
      <div class="trade-summary">
        <h3>Trade requirement</h3>
        <ul>
          ${modal.tradeRows.map((row) => `<li>${row.count} ${row.resource}: ${row.totalCost} coin${row.totalCost === 1 ? "" : "s"} total (${row.unitCost} each, base ${row.baseCost}, opponent modifier +${row.opponentSupplyModifier}${row.discounted ? ", discounted" : ""})</li>`).join("")}
        </ul>
      </div>
    `
    : "";
  return `
    <div class="choice-overlay">
      <div class="choice-card">
        <h2>${modal.title}</h2>
        <p>${modal.description}</p>
        ${modal.tradeSummary ? `<p class="choice-subtitle">${modal.tradeSummary}</p>` : ""}
        ${tradeSummary}
        <div class="choice-grid">
          ${modal.options.map((option) => `
            <button class="choice-option ${option.image ? "with-art" : ""}" data-action="choice" data-id="${option.id}">
              ${option.image ? `<span class="choice-art" style="--choice-image:url('${resolveChoiceImage(option)}'); --swatch:${resolveSwatch(option)}; --swatch-accent:${resolveAccent(option)};"></span>` : ""}
              ${option.swatch ? `<span class="choice-swatch" style="--swatch:${resolveSwatch(option)}; --swatch-accent:${resolveAccent(option)};"></span>` : ""}
              <strong>${option.title}</strong>
              <span>${option.detail}</span>
            </button>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

initShellActions();
render();
