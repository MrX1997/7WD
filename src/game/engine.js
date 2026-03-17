import {
  AGE_LAYOUTS,
  AGE_ONE_CARDS,
  AGE_TWO_CARDS,
  AGE_THREE_CARDS,
  ALL_CARDS_BY_ID,
  GODS,
  GODS_BY_ID,
  GUILD_CARDS,
  MYTHOLOGIES,
  MYTHOLOGIES_BY_ID,
  CLASSIC_PLAYER_COLORS,
  CLASSIC_PLAYER_COLOR_BY_ID,
  CLASSIC_WONDERS,
  CLASSIC_WONDERS_BY_ID,
  PROGRESS_BY_ID,
  PROGRESS_TOKENS,
  RESOURCE_LABELS,
  RESOURCE_ORDER,
  RULES_REFERENCE,
  RULES_REFERENCE_CLASSIC,
  SCIENCE_SYMBOLS,
  TYPE_META,
} from "./data.js";

const PLAYER_NAMES = ["Player 1", "Player 2"];
const SUMMONING_DIE_SIDES = 6;
const GOD_BUILD_REQUIREMENTS = [1, 2, 4, 6];
const AGE_WIN_POINTS = [0, 2, 5, 10];
const AGE_MILITARY_POINTS = [0, 2, 5, 10];
const MILITARY_CAPITAL = 9;
const LOOT_THRESHOLDS = [
  { position: 2, penalty: 2 },
  { position: 5, penalty: 5 },
];
const CLASSIC_ORDER = ["first", "second", "second", "first", "second", "first", "first", "second"];
const CLASSIC_RESOURCE_LABELS = {
  wood: "Wood",
  clay: "Clay",
  stone: "Stone",
  glass: "Glass",
  papyrus: "Papyrus",
  coins: "Coins",
};
const CLASSIC_TYPE_META = {
  raw: { label: "Raw Resource", className: "raw" },
  manufactured: { label: "Special Resource", className: "manufactured" },
  civilian: { label: "Civilian", className: "civilian" },
  science: { label: "Science", className: "science" },
  commerce: { label: "Commerce", className: "commerce" },
  summoning: { label: "Military", className: "summoning" },
  guild: { label: "Guild", className: "guild" },
};
const CLASSIC_IMAGE_KEY_OVERRIDES = {
  "glass-blower": "glassblower",
};

function shuffle(values, randomFn) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFn() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function formatResourceCost(cost, labels = RESOURCE_LABELS) {
  const parts = RESOURCE_ORDER.flatMap((resource) => {
    const count = cost?.[resource] ?? 0;
    return count ? [`${count} ${labels[resource]}`] : [];
  });
  return parts.length ? parts.join(", ") : "Free";
}

function serializeResourceCost(cost = {}) {
  return RESOURCE_ORDER
    .filter((resource) => Number(cost?.[resource] ?? 0) > 0)
    .map((resource) => ({ resource, count: Number(cost[resource]) }));
}

function serializeProduction(cardLike) {
  const produced = [];
  if (cardLike?.produces) {
    Object.entries(cardLike.produces).forEach(([resource, count]) => {
      if (Number(count) > 0) {
        produced.push({ resource, count: Number(count) });
      }
    });
  }
  if (cardLike?.producesChoice?.length) {
    cardLike.producesChoice.forEach((resource) => {
      produced.push({ resource, count: 1, choice: true });
    });
  }
  return produced;
}

function getModeValue(modeOrState) {
  if (typeof modeOrState === "string") {
    return modeOrState;
  }
  return modeOrState?.mode ?? "mythical";
}

function getResourceLabels(modeOrState) {
  return getModeValue(modeOrState) === "classic"
    ? CLASSIC_RESOURCE_LABELS
    : { ...RESOURCE_LABELS, coins: "Coins" };
}

function getTypeMetaForMode(modeOrState) {
  return getModeValue(modeOrState) === "classic" ? CLASSIC_TYPE_META : TYPE_META;
}

function getCardImageKey(cardId) {
  return CLASSIC_IMAGE_KEY_OVERRIDES[cardId] ?? cardId.replaceAll("-", "_");
}

function titleCaseFromId(id) {
  const smallWords = new Set(["of", "the", "and"]);
  return id
    .split("-")
    .map((part, index) => {
      if (index > 0 && smallWords.has(part)) {
        return part;
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function toClassicText(value) {
  return String(value ?? "")
    .replaceAll("Sacred Timber", "Wood")
    .replaceAll("Primordial Clay", "Clay")
    .replaceAll("Ancient Stone", "Stone")
    .replaceAll("Crystal Relic", "Glass")
    .replaceAll("Sacred Scroll", "Papyrus")
    .replaceAll("summoning power", "military strength")
    .replaceAll("Summoning", "Military")
    .replaceAll("summoning", "military")
    .replaceAll("Invocation Circle", "Military Building")
    .replaceAll("Pilgrimage", "Commercial")
    .replaceAll("Mysticism", "Scientific")
    .replaceAll("Temple", "Civilian")
    .replaceAll("completed cult", "built wonder")
    .replaceAll("domain", "city");
}

function getCardDisplayName(card, modeOrState) {
  if (getModeValue(modeOrState) === "classic") {
    return titleCaseFromId(card.id);
  }
  return card.name;
}

function getCardDisplayDescription(card, modeOrState) {
  if (getModeValue(modeOrState) === "classic") {
    return toClassicText(card.description);
  }
  return card.description;
}

function countResourceUnits(cost = {}) {
  return RESOURCE_ORDER.reduce((sum, resource) => sum + Number(cost?.[resource] ?? 0), 0);
}

function cloneMap(input = {}) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value]));
}

function createPlayer(index) {
  return {
    id: index,
    name: PLAYER_NAMES[index],
    mythologyId: null,
    colorId: null,
    coins: 7,
    builtCardIds: [],
    progressIds: [],
    gods: [],
    wonders: [],
    claimedSciencePairs: [],
    bonusProduction: Object.fromEntries(RESOURCE_ORDER.map((resource) => [resource, 0])),
    bonusProductionSources: Object.fromEntries(RESOURCE_ORDER.map((resource) => [resource, []])),
    bonusPoints: 0,
    nextAgeSummoningBonus: 0,
    summoningWins: 0,
  };
}

function createGodPool(mythologyId, randomFn) {
  const mythology = MYTHOLOGIES_BY_ID[mythologyId];
  const pairChoice = mythology.randomPair?.length ? shuffle(mythology.randomPair, randomFn)[0] : null;
  return [...mythology.gods, ...(pairChoice ? [pairChoice] : [])];
}

function createWonderDraft(firstPlayer, randomFn) {
  const shuffledWonders = shuffle(CLASSIC_WONDERS.map((wonder) => wonder.id), randomFn).slice(0, 8);
  const batches = [
    shuffledWonders.slice(0, 4),
    shuffledWonders.slice(4, 8),
  ];
  const order = [];
  for (let index = 0; index < 8; index += 1) {
    const tag = CLASSIC_ORDER[index] === "first" ? firstPlayer : 1 - firstPlayer;
    order.push(tag);
  }
  return {
    batches,
    offer: [...batches[0]],
    order,
    pickIndex: 0,
    round: 1,
  };
}

function advanceWonderDraft(state) {
  if (!state.wonderDraft) {
    return;
  }
  const { wonderDraft } = state;
  const nextPicker = nextDraftPicker(state);
  if (nextPicker === undefined) {
    state.choice = null;
    state.wonderDraft = null;
    startAge(state, 1, state.startingPlayer);
    return;
  }
  const batchIndex = Math.floor(wonderDraft.pickIndex / 4);
  wonderDraft.round = batchIndex + 1;
  if (!wonderDraft.offer.length && wonderDraft.batches[batchIndex]) {
    wonderDraft.offer = [...wonderDraft.batches[batchIndex]];
  }
  state.choice = createWonderDraftChoice(state);
}

function createColorChoice(playerIndex, state) {
  const taken = new Set(state.players.map((entry) => entry.colorId).filter(Boolean));
  return {
    type: "colorSelect",
    playerIndex,
    title: `${PLAYER_NAMES[playerIndex]} chooses a color`,
    description: `${PLAYER_NAMES[playerIndex]} will define the city color and start the wonder draft.`,
    options: CLASSIC_PLAYER_COLORS.map((color) => color.id).filter((id) => !taken.has(id)),
  };
}

function isClassicMode(state) {
  return state.mode === "classic";
}

function getPlayerTheme(state, playerIndex) {
  const player = state.players[playerIndex];
  if (isClassicMode(state)) {
    return player?.colorId ? CLASSIC_PLAYER_COLOR_BY_ID[player.colorId] : CLASSIC_PLAYER_COLORS[0];
  }
  return player?.mythologyId ? MYTHOLOGIES_BY_ID[player.mythologyId] : MYTHOLOGIES[0];
}

function getWonder(wonderId) {
  return CLASSIC_WONDERS_BY_ID[wonderId];
}

function getBuiltWonders(player) {
  return player.wonders.filter((wonderState) => wonderState.built).map((wonderState) => getWonder(wonderState.id));
}

function getWonderCount(player) {
  return player.wonders.filter((wonderState) => wonderState.built && !wonderState.locked).length;
}

function getUnbuiltWonders(player) {
  return player.wonders.filter((wonderState) => !wonderState.built && !wonderState.locked);
}

function nextDraftPicker(state) {
  if (!state.wonderDraft) {
    return 0;
  }
  return state.wonderDraft.order[state.wonderDraft.pickIndex];
}

function createWonderDraftChoice(state) {
  if (!state.wonderDraft) {
    return null;
  }
  const playerIndex = nextDraftPicker(state);
  if (playerIndex === undefined) {
    return null;
  }
  return {
    type: "wonderDraft",
    playerIndex,
    title: `${PLAYER_NAMES[playerIndex]} drafts a wonder`,
    description: `Set ${state.wonderDraft.round} / 2. Pick one wonder from the open cards.`,
    options: [...state.wonderDraft.offer],
  };
}

function createInitialState(randomFn, mode = "mythical") {
  const shuffledProgress = shuffle(PROGRESS_TOKENS.map((token) => token.id), randomFn);
  const firstPlayer = Math.floor(randomFn() * 2);
  const startingPlayer = Math.floor(randomFn() * 2);
  return {
    started: true,
    phase: "setup",
    age: 0,
    turnNumber: 1,
    mode,
    randomFn,
    firstPlayer,
    startingPlayer,
    mythologyChooser: null,
    colorChooser: null,
    currentPlayer: firstPlayer,
    lastActivePlayer: null,
    players: [createPlayer(0), createPlayer(1)],
    availableProgressIds: shuffledProgress.slice(0, 5),
    setAsideProgressIds: shuffledProgress.slice(5),
    currentAgeSummoning: [0, 0],
    summoningWinners: [],
    pendingDivineActivations: null,
    lastSummoningResolution: null,
    conflictPosition: 0,
    militaryTokensClaimed: {
      "2-right": false,
      "5-right": false,
      "2-left": false,
      "5-left": false,
    },
    wonderDraft: null,
    ageStructure: null,
    discardPile: [],
    selectedSlotId: null,
    cultMode: false,
    wonderMode: false,
    pendingQueue: [],
    choice: null,
    pendingReplay: false,
    animationCue: null,
    animationCounter: 0,
    godsBuiltTotal: 0,
    wondersBuiltTotal: 0,
    winner: null,
    log: mode === "classic"
      ? [`${PLAYER_NAMES[firstPlayer]} chooses a color first for the classic draft.`]
      : ["Roll the gods' dice to decide mythology priority and who opens the duel."],
  };
}

function queueResourceAnimation(state, playerIndex, payload) {
  state.animationCounter += 1;
  state.animationCue = {
    id: state.animationCounter,
    playerIndex,
    ...payload,
  };
}

function maybeQueueProductionAnimation(state, playerIndex, cardLike, beforeProduction, beforeCoins) {
  const fixedProduction = cardLike?.produces
    ? Object.entries(cardLike.produces)
        .filter(([, count]) => Number(count) > 0)
        .map(([resource, count]) => ({ resource, count: Number(count) }))
    : [];

  if (fixedProduction.length) {
    const primary = fixedProduction[0];
    queueResourceAnimation(state, playerIndex, {
      type: primary.resource,
      label: getResourceLabels(state)[primary.resource] ?? primary.resource,
      before: beforeProduction[primary.resource] ?? 0,
      after: (beforeProduction[primary.resource] ?? 0) + primary.count,
      delta: primary.count,
    });
    return;
  }

  if (cardLike?.immediateCoins) {
    queueResourceAnimation(state, playerIndex, {
      type: "coins",
      label: "Coins",
      before: beforeCoins,
      after: beforeCoins + cardLike.immediateCoins,
      delta: cardLike.immediateCoins,
    });
  }
}

function createMythologyChoice(state, playerIndex) {
  const taken = new Set(
    state.players
      .map((player) => player.mythologyId)
      .filter(Boolean),
  );
  return {
    type: "mythologySelect",
    playerIndex,
    title: `${PLAYER_NAMES[playerIndex]} chooses a mythology`,
    description: `${PLAYER_NAMES[state.mythologyChooser ?? playerIndex]} won the opening roll and chooses first. That player will begin Age I second.`,
    options: MYTHOLOGIES.filter((option) => !taken.has(option.id)).map((option) => option.id),
  };
}

function createOpeningRollChoice() {
  return {
    type: "initiativeRoll",
    title: "Cast the opening dice",
    description: "Both players roll 2d6. Highest total chooses a mythology first, but the other player opens Age I.",
    options: ["roll-opening-dice"],
  };
}

function queueDiceAnimation(state, payload) {
  state.animationCounter += 1;
  state.animationCue = {
    id: state.animationCounter,
    kind: "dice",
    ...payload,
  };
}

function resolveOpeningRoll(state) {
  let rolls = [rollTwoDice(state.randomFn), rollTwoDice(state.randomFn)];
  let totals = rolls.map((pair) => pair[0] + pair[1]);
  while (totals[0] === totals[1]) {
    rolls = [rollTwoDice(state.randomFn), rollTwoDice(state.randomFn)];
    totals = rolls.map((pair) => pair[0] + pair[1]);
  }
  const chooser = totals[0] > totals[1] ? 0 : 1;
  const starter = 1 - chooser;
  state.mythologyChooser = chooser;
  state.firstPlayer = starter;
  state.currentPlayer = starter;
  queueDiceAnimation(state, {
    title: "Opening divine cast",
    summary: `${PLAYER_NAMES[chooser]} chooses mythology first. ${PLAYER_NAMES[starter]} will begin Age I.`,
    players: [
      { name: PLAYER_NAMES[0], dice: rolls[0], total: totals[0] },
      { name: PLAYER_NAMES[1], dice: rolls[1], total: totals[1] },
    ],
  });
  state.log.unshift(`${PLAYER_NAMES[chooser]} wins the opening roll ${totals[chooser]} to ${totals[starter]} and chooses mythology first. ${PLAYER_NAMES[starter]} begins Age I.`);
  state.choice = createMythologyChoice(state, chooser);
}

function getCard(cardId) {
  return ALL_CARDS_BY_ID[cardId];
}

function getGod(godId) {
  return GODS_BY_ID[godId];
}

function getGodImage(godId) {
  return `${godId.replaceAll("-", "_")}_god.png`;
}

function getWonderImage(wonderId) {
  const wonder = getWonder(wonderId);
  return wonder?.image ?? `${wonderId.replaceAll("-", "_")}.png`;
}

function getProgress(progressId) {
  return PROGRESS_BY_ID[progressId];
}

function getBuiltCards(player) {
  return player.builtCardIds.map(getCard);
}

function getBuiltGods(player) {
  return player.gods.filter((godState) => godState.built && !godState.locked).map((godState) => getGod(godState.id));
}

function getBuiltWondersFromPlayer(player) {
  return player.wonders.filter((wonderState) => wonderState.built && !wonderState.locked).map((wonderState) => getWonder(wonderState.id));
}

function getOwnedGodState(player, godId) {
  return player.gods.find((godState) => godState.id === godId);
}

function getOwnedWonderState(player, wonderId) {
  return player.wonders.find((wonderState) => wonderState.id === wonderId);
}

function playerHasProgress(player, progressId) {
  return player.progressIds.includes(progressId);
}

function getPlayerColorCount(player, types) {
  return getBuiltCards(player).filter((card) => types.includes(card.type)).length;
}

function getGodCount(player) {
  return player.gods.filter((godState) => godState.built && !godState.locked).length;
}

function getBuiltStructureCount(player) {
  return player.builtCardIds.length;
}

function getNextGodRequirement(player) {
  return GOD_BUILD_REQUIREMENTS[Math.min(getGodCount(player), GOD_BUILD_REQUIREMENTS.length - 1)];
}

function createLayoutSlots(layout, cardIds) {
  const rows = layout.rows;
  const widestRow = rows.reduce((max, row) => Math.max(max, row.count), 0);
  const slots = [];
  let cardIndex = 0;

  rows.forEach((row, rowIndex) => {
    const step = 1.12;
    const offset = ((widestRow - row.count) / 2) * step;

    for (let columnIndex = 0; columnIndex < row.count; columnIndex += 1) {
      slots.push({
        id: `age-slot-${rowIndex}-${columnIndex}`,
        row: rowIndex,
        column: columnIndex,
        x: offset + columnIndex * step,
        y: rowIndex * 108,
        cardId: cardIds[cardIndex],
        accessible: false,
        removed: false,
        hidden: !row.faceUp,
        coveredBy: [],
        covers: [],
      });
      cardIndex += 1;
    }
  });

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const currentRow = slots.filter((slot) => slot.row === rowIndex);
    const previousRow = slots.filter((slot) => slot.row === rowIndex - 1);
    currentRow.forEach((currentSlot) => {
      previousRow.forEach((previousSlot) => {
        if (Math.abs(previousSlot.x - currentSlot.x) < 1.01) {
          if (layout.coverage === "bottom-up") {
            previousSlot.coveredBy.push(currentSlot.id);
            currentSlot.covers.push(previousSlot.id);
          } else {
            currentSlot.coveredBy.push(previousSlot.id);
            previousSlot.covers.push(currentSlot.id);
          }
        }
      });
    });
  }

  return slots;
}

function buildAgeDeck(age, randomFn) {
  if (age === 1) {
    return shuffle(AGE_ONE_CARDS.map((card) => card.id), randomFn).slice(0, 20);
  }
  if (age === 2) {
    return shuffle(AGE_TWO_CARDS.map((card) => card.id), randomFn).slice(0, 20);
  }
  const ageCards = shuffle(AGE_THREE_CARDS.map((card) => card.id), randomFn).slice(0, 17);
  const guildCards = shuffle(GUILD_CARDS.map((card) => card.id), randomFn).slice(0, 3);
  return shuffle([...ageCards, ...guildCards], randomFn);
}

function refreshAccessibility(state) {
  if (!state.ageStructure) {
    return;
  }

  state.ageStructure.slots.forEach((slot) => {
    if (slot.removed) {
      slot.accessible = false;
      return;
    }
    const blocked = slot.coveredBy.some((slotId) => {
      const covering = state.ageStructure.slots.find((entry) => entry.id === slotId);
      return covering && !covering.removed;
    });
    slot.accessible = !blocked;
    if (slot.accessible) {
      slot.hidden = false;
    }
  });
}

function getFixedProduction(player, mode = "mythical") {
  const fixed = Object.fromEntries(RESOURCE_ORDER.map((resource) => [resource, 0]));
  const trade = Object.fromEntries(RESOURCE_ORDER.map((resource) => [resource, 0]));
  const flexible = [];

  RESOURCE_ORDER.forEach((resource) => {
    fixed[resource] += player.bonusProduction?.[resource] ?? 0;
  });

  getBuiltCards(player).forEach((card) => {
    if (card.produces) {
      Object.entries(card.produces).forEach(([resource, amount]) => {
        fixed[resource] += amount;
        if (card.type === "raw" || card.type === "manufactured") {
          trade[resource] += amount;
        }
      });
    }
    if (card.producesChoice) {
      flexible.push(card.producesChoice);
    }
  });

  if (mode === "classic") {
    getBuiltWonders(player).forEach((wonder) => {
      if (wonder.produces) {
        Object.entries(wonder.produces).forEach(([resource, amount]) => {
          fixed[resource] += amount;
        });
      }
      if (wonder.producesChoice) {
        flexible.push(wonder.producesChoice);
      }
    });
  } else {
    getBuiltGods(player).forEach((god) => {
      if (god.producesChoice) {
        flexible.push(god.producesChoice);
      }
    });
  }

  return { fixed, trade, flexible };
}

function getDiscounts(player) {
  const discounts = Object.fromEntries(RESOURCE_ORDER.map((resource) => [resource, false]));
  getBuiltCards(player).forEach((card) => {
    (card.tradeDiscount ?? []).forEach((resource) => {
      discounts[resource] = true;
    });
  });
  return discounts;
}

function getTradeUnitCost(player, opponent, resource, mode = "mythical") {
  const discounts = getDiscounts(player);
  if (discounts[resource]) {
    return 1;
  }
  const { trade } = getFixedProduction(opponent, mode);
  return 2 + trade[resource];
}

function canUseChain(player, cardLike) {
  return (cardLike.chainFrom ?? []).some((sourceId) => player.builtCardIds.includes(sourceId));
}

function getRebateUnits(player, cardLike, mode) {
  if (mode === "god" && playerHasProgress(player, "architecture")) {
    return 2;
  }
  if (mode === "wonder" && playerHasProgress(player, "architecture")) {
    return 2;
  }
  if (mode === "card" && cardLike.type === "civilian" && playerHasProgress(player, "masonry")) {
    return 2;
  }
  return 0;
}

function evaluateTradeUnits(needMap, rebateUnits, tradePrices) {
  const units = [];
  RESOURCE_ORDER.forEach((resource) => {
    for (let index = 0; index < needMap[resource]; index += 1) {
      units.push({ resource, price: tradePrices[resource] });
    }
  });
  units.sort((left, right) => right.price - left.price);
  const paid = units.slice(rebateUnits);
  const tradeNeeds = Object.fromEntries(RESOURCE_ORDER.map((resource) => [resource, 0]));
  paid.forEach((unit) => {
    tradeNeeds[unit.resource] += 1;
  });
  return {
    tradeCost: paid.reduce((sum, unit) => sum + unit.price, 0),
    tradeNeeds: Object.entries(tradeNeeds)
      .filter(([, count]) => count > 0)
      .map(([resource, count]) => ({ resource, count })),
  };
}

function getProductionSources(player, mode = "mythical") {
  const sources = Object.fromEntries(RESOURCE_ORDER.map((resource) => [resource, []]));

  RESOURCE_ORDER.forEach((resource) => {
    (player.bonusProductionSources?.[resource] ?? []).forEach((entry) => {
      sources[resource].push(entry);
    });
  });

  getBuiltCards(player).forEach((card) => {
    if (card.produces) {
      Object.entries(card.produces).forEach(([resource, amount]) => {
        sources[resource].push({ amount, label: getCardDisplayName(card, mode) });
      });
    }
  });

  if (mode === "classic") {
    getBuiltWonders(player).forEach((wonder) => {
      if (wonder.produces) {
        Object.entries(wonder.produces).forEach(([resource, amount]) => {
          sources[resource].push({ amount, label: wonder.name });
        });
      }
    });
  }

  return sources;
}

function formatResourceSourceSummary(label, value, sources) {
  if (!value) {
    return `${label}: 0`;
  }
  const detail = (sources ?? []).map((entry) => `${entry.amount} from ${entry.label}`).join(", ");
  return `${label}: ${value}${detail ? ` (${detail})` : ""}`;
}

function minimizeTradeCost(required, flexibleSources, rebateUnits, tradePrices) {
  const memo = new Map();

  function keyFor(needMap, choiceIndex) {
    return `${choiceIndex}|${RESOURCE_ORDER.map((resource) => needMap[resource]).join(",")}`;
  }

  function search(needMap, choiceIndex) {
    const key = keyFor(needMap, choiceIndex);
    if (memo.has(key)) {
      return memo.get(key);
    }

    if (choiceIndex >= flexibleSources.length) {
      const result = evaluateTradeUnits(needMap, rebateUnits, tradePrices);
      memo.set(key, result);
      return result;
    }

    let best = search(needMap, choiceIndex + 1);
    flexibleSources[choiceIndex].forEach((resource) => {
      if (needMap[resource] > 0) {
        needMap[resource] -= 1;
        const candidate = search(needMap, choiceIndex + 1);
        if (candidate.tradeCost < best.tradeCost) {
          best = candidate;
        }
        needMap[resource] += 1;
      }
    });

    memo.set(key, best);
    return best;
  }

  return search(cloneMap(required), 0);
}

function formatTradeNeedsSummary(tradeNeeds, mode = "mythical") {
  const labels = getResourceLabels(mode);
  const parts = (tradeNeeds ?? [])
    .filter((entry) => Number(entry.count) > 0)
    .map(({ resource, count }) => `${count} ${labels[resource]}`);
  return parts.length ? `Trade needed: ${parts.join(", ")}` : "No trade needed.";
}

function getTradeNeedRows(state, playerIndex, tradeNeeds) {
  const player = state.players[playerIndex];
  const opponent = state.players[1 - playerIndex];
  const opponentTrade = getFixedProduction(opponent, state.mode).trade;
  const labels = getResourceLabels(state);
  const rows = (tradeNeeds ?? [])
    .filter((entry) => Number(entry.count) > 0)
    .map((entry) => {
      const unitCost = getTradeUnitCost(player, opponent, entry.resource, state.mode);
      const count = Number(entry.count);
      const opponentSupplyModifier = opponentTrade[entry.resource] ?? 0;
      const discounted = Boolean(getDiscounts(player)[entry.resource]);
      return {
        resource: labels[entry.resource] ?? entry.resource,
        count,
        unitCost,
        totalCost: count * unitCost,
        baseCost: discounted ? 1 : 2,
        opponentSupplyModifier: discounted ? 0 : opponentSupplyModifier,
        discounted,
      };
    });
  const totalCost = rows.reduce((sum, row) => sum + row.totalCost, 0);
  return { rows, totalCost };
}

function evaluateConstructionCost(state, playerIndex, cardLike, mode) {
  const player = state.players[playerIndex];
  const opponent = state.players[1 - playerIndex];

  if (mode === "card" && canUseChain(player, cardLike)) {
    return { canAfford: true, total: 0, coinCost: 0, tradeCost: 0, freeByChain: true, label: "for free via chain" };
  }

  const { fixed, flexible } = getFixedProduction(player, state.mode);
  const needed = cloneMap(cardLike.resourceCost ?? cardLike.cost ?? {});
  RESOURCE_ORDER.forEach((resource) => {
    needed[resource] = Math.max(0, (needed[resource] ?? 0) - fixed[resource]);
  });
  const tradePrices = Object.fromEntries(RESOURCE_ORDER.map((resource) => [resource, getTradeUnitCost(player, opponent, resource, state.mode)]));
  const tradePlan = minimizeTradeCost(needed, flexible, getRebateUnits(player, cardLike, mode), tradePrices);
  const tradeCost = tradePlan.tradeCost;
  const coinCost = cardLike.coinCost ?? 0;
  const total = coinCost + tradeCost;
  const labels = getResourceLabels(state);

  return {
    canAfford: player.coins >= total,
    total,
    coinCost,
    tradeCost,
    tradeNeeds: tradePlan.tradeNeeds,
    freeByChain: false,
    label: total === 0
      ? "for free"
      : `${coinCost > 0 ? `${coinCost} ${labels.coins.toLowerCase()}` : ""}${coinCost > 0 && tradeCost > 0 ? " + " : ""}${tradeCost > 0 ? `${tradeCost} trade ${labels.coins.toLowerCase()}` : ""}`.trim(),
  };
}

function evaluateOwnedResourceCoverage(state, playerIndex, cardLike, mode) {
  const player = state.players[playerIndex];
  const { fixed, flexible } = getFixedProduction(player, state.mode);
  const needed = cloneMap(cardLike.resourceCost ?? cardLike.cost ?? {});
  RESOURCE_ORDER.forEach((resource) => {
    needed[resource] = Math.max(0, (needed[resource] ?? 0) - fixed[resource]);
  });
  const placeholderPrices = Object.fromEntries(RESOURCE_ORDER.map((resource) => [resource, 1]));
  const remaining = minimizeTradeCost(needed, flexible, getRebateUnits(player, cardLike, mode), placeholderPrices).tradeCost;
  return {
    totalUnits: countResourceUnits(cardLike.resourceCost ?? cardLike.cost ?? {}),
    ownsAll: remaining === 0,
    missingUnits: remaining,
  };
}

function getScienceCounts(player) {
  const counts = Object.fromEntries(SCIENCE_SYMBOLS.map((symbol) => [symbol, 0]));
  getBuiltCards(player).forEach((card) => {
    if (card.scienceSymbol) {
      counts[card.scienceSymbol] += 1;
    }
  });
  player.progressIds.forEach((progressId) => {
    const token = getProgress(progressId);
    if (token.scienceSymbol) {
      counts[token.scienceSymbol] += 1;
    }
  });
  return counts;
}

function getUniqueScienceCount(player) {
  return Object.values(getScienceCounts(player)).filter((count) => count > 0).length;
}

function getConflictWinner(state) {
  if (state.conflictPosition > 0) {
    return 0;
  }
  if (state.conflictPosition < 0) {
    return 1;
  }
  return null;
}

function getMilitaryEndgamePoints(state, playerIndex) {
  const winner = getConflictWinner(state);
  if (winner === null || winner !== playerIndex) {
    return 0;
  }
  const distance = Math.abs(state.conflictPosition);
  if (distance < 2) {
    return AGE_MILITARY_POINTS[0];
  }
  if (distance < 5) {
    return AGE_MILITARY_POINTS[1];
  }
  if (distance < 9) {
    return AGE_MILITARY_POINTS[2];
  }
  return AGE_MILITARY_POINTS[3];
}

function getNextConflictWinner(playerIndex, base) {
  if (base === 0) {
    return null;
  }
  if (base > 0) {
    return playerIndex === 0 ? 1 : 0;
  }
  if (base < 0) {
    return playerIndex === 0 ? 0 : 1;
  }
  return null;
}

function moveConflict(state, playerIndex, amount) {
  if (!amount || state.winner) {
    return;
  }

  const previous = state.conflictPosition;
  const next = previous + (playerIndex === 0 ? amount : -amount);
  const normalized = Math.max(-MILITARY_CAPITAL, Math.min(MILITARY_CAPITAL, next));
  state.conflictPosition = normalized;

  LOOT_THRESHOLDS.forEach((entry) => {
    const crossedToRight = previous < entry.position && normalized >= entry.position;
    const crossedToLeft = previous > -entry.position && normalized <= -entry.position;
    const rightToken = `${entry.position}-right`;
    const leftToken = `${entry.position}-left`;
    const hasRight = Boolean(state.militaryTokensClaimed[rightToken]);
    const hasLeft = Boolean(state.militaryTokensClaimed[leftToken]);

    if (playerIndex === 0 && crossedToRight && !hasRight) {
      state.militaryTokensClaimed[rightToken] = true;
      state.players[1].coins = Math.max(0, state.players[1].coins - entry.penalty);
      state.log.unshift(`${PLAYER_NAMES[1]} loses ${entry.penalty} coins from military pressure.`);
    }

    if (playerIndex === 1 && crossedToLeft && !hasLeft) {
      state.militaryTokensClaimed[leftToken] = true;
      state.players[0].coins = Math.max(0, state.players[0].coins - entry.penalty);
      state.log.unshift(`${PLAYER_NAMES[0]} loses ${entry.penalty} coins from military pressure.`);
    }
  });

  if (normalized >= MILITARY_CAPITAL) {
    state.winner = {
      type: "military",
      player: 0,
      title: `${PLAYER_NAMES[0]} wins by military supremacy`,
      detail: "The war force reached the enemy's walls in an immediate victory.",
    };
    state.phase = "gameOver";
    return;
  }
  if (normalized <= -MILITARY_CAPITAL) {
    state.winner = {
      type: "military",
      player: 1,
      title: `${PLAYER_NAMES[1]} wins by military supremacy`,
      detail: "The war force reached the enemy's walls in an immediate victory.",
    };
    state.phase = "gameOver";
  }
}

function evaluateYellowIncome(state, playerIndex, card) {
  const player = state.players[playerIndex];
  const opponent = state.players[1 - playerIndex];

  if (!card.yellowIncome) {
    return 0;
  }
  if (card.yellowIncome.source === "self") {
    return card.yellowIncome.amount * getPlayerColorCount(player, card.yellowIncome.colors);
  }
  if (card.yellowIncome.source === "selfIncludingCard") {
    const existing = getPlayerColorCount(player, card.yellowIncome.colors);
    return card.yellowIncome.amount * (existing + (card.yellowIncome.colors.includes(card.type) ? 1 : 0));
  }
  if (card.yellowIncome.source === "gods") {
    return card.yellowIncome.amount * getGodCount(player);
  }
  if (card.yellowIncome.source === "majority") {
    return card.yellowIncome.amount * Math.max(
      getPlayerColorCount(player, card.yellowIncome.colors),
      getPlayerColorCount(opponent, card.yellowIncome.colors),
    );
  }
  return 0;
}

function evaluateGuildImmediateCoins(state, playerIndex, card) {
  if (!card.guildEffect || card.guildEffect.type !== "coinsAndPointsByColor") {
    return 0;
  }
  return card.guildEffect.amount * Math.max(
    getPlayerColorCount(state.players[playerIndex], card.guildEffect.colors),
    getPlayerColorCount(state.players[1 - playerIndex], card.guildEffect.colors),
  );
}

function evaluateGuildScore(state, playerIndex, card) {
  if (!card.guildEffect) {
    return 0;
  }

  const player = state.players[playerIndex];
  const opponent = state.players[1 - playerIndex];

  if (card.guildEffect.type === "coinsAndPointsByColor") {
    return card.guildEffect.amount * Math.max(
      getPlayerColorCount(player, card.guildEffect.colors),
      getPlayerColorCount(opponent, card.guildEffect.colors),
    );
  }
  if (card.guildEffect.type === "pointsByGodMajority") {
    return card.guildEffect.amount * Math.max(getGodCount(player), getGodCount(opponent));
  }
  if (card.guildEffect.type === "pointsByRichestSets") {
    return Math.floor(Math.max(player.coins, opponent.coins) / 3) * card.guildEffect.amount;
  }
  return 0;
}

function getSummoningVictoryPoints(wins) {
  return AGE_WIN_POINTS[Math.max(0, Math.min(3, wins))];
}

function rollDie(randomFn) {
  return 1 + Math.floor(randomFn() * SUMMONING_DIE_SIDES);
}

function rollTwoDice(randomFn) {
  return [rollDie(randomFn), rollDie(randomFn)];
}

function scorePlayer(state, playerIndex) {
  const player = state.players[playerIndex];
  let total = 0;
  let civilianPoints = 0;
  const classic = isClassicMode(state);

  if (classic) {
    total += getMilitaryEndgamePoints(state, playerIndex);
  } else {
    total += getSummoningVictoryPoints(player.summoningWins);
    total += player.bonusPoints;
  }

  getBuiltCards(player).forEach((card) => {
    total += card.points;
    if (card.type === "civilian") {
      civilianPoints += card.points;
    }
    if (card.type === "guild") {
      total += evaluateGuildScore(state, playerIndex, card);
    }
  });

  getBuiltGods(player).forEach((god) => {
    total += god.points;
  });

  if (classic) {
    const builtWonders = getBuiltWondersFromPlayer(player);
    builtWonders.forEach((wonder) => {
      total += wonder?.points ?? 0;
    });
  }

  player.progressIds.forEach((progressId) => {
    total += getProgress(progressId).points;
  });

  if (playerHasProgress(player, "mathematics")) {
    total += player.progressIds.length * 3;
  }

  total += Math.floor(player.coins / 3);
  return { total, civilianPoints };
}

function getScoreBreakdown(state, playerIndex) {
  const player = state.players[playerIndex];
  const classic = isClassicMode(state);
  let buildingPoints = 0;
  let guildPoints = 0;
  let godPoints = 0;
  let progressPoints = 0;

  getBuiltCards(player).forEach((card) => {
    buildingPoints += card.points;
    if (card.type === "guild") {
      guildPoints += evaluateGuildScore(state, playerIndex, card);
    }
  });

  getBuiltGods(player).forEach((god) => {
    godPoints += god.points;
  });

  player.progressIds.forEach((progressId) => {
    progressPoints += getProgress(progressId).points;
  });

  const mathematicsPoints = playerHasProgress(player, "mathematics") ? player.progressIds.length * 3 : 0;
  const summoningPoints = getSummoningVictoryPoints(player.summoningWins);
  const militaryBreakdown = classic ? getMilitaryEndgamePoints(state, playerIndex) : 0;
  const blessingPoints = player.bonusPoints;
  const coinPoints = Math.floor(player.coins / 3);
  const wonderBreakdown = getBuiltWondersFromPlayer(player).reduce((sum, wonder) => sum + (wonder?.points ?? 0), 0);

  const total = buildingPoints
    + guildPoints
    + (classic ? wonderBreakdown : godPoints)
    + progressPoints
    + mathematicsPoints
    + (classic ? militaryBreakdown : summoningPoints)
    + blessingPoints
    + coinPoints;

  return {
    name: player.name,
    total,
    rows: [
      { label: "Buildings", value: buildingPoints },
      { label: "Guilds", value: guildPoints },
      { label: classic ? "Wonders" : "Gods", value: classic ? wonderBreakdown : godPoints },
      { label: "Progress", value: progressPoints },
      { label: "Mathematics", value: mathematicsPoints },
      { label: classic ? "Military" : "Summoning", value: classic ? militaryBreakdown : summoningPoints },
      { label: "Blessings", value: blessingPoints },
      { label: "Coins", value: coinPoints },
    ],
  };
}

function applyEconomyGain(state, playerIndex, tradeCost) {
  const opponent = state.players[1 - playerIndex];
  if (tradeCost > 0 && playerHasProgress(opponent, "economy")) {
    opponent.coins += tradeCost;
    state.log.unshift(`${opponent.name} gains ${tradeCost} coins from Economy.`);
  }
}

function addAgeSummoning(state, playerIndex, amount) {
  state.currentAgeSummoning[playerIndex] += amount;
}

function pushPendingChoice(state, choice) {
  state.pendingQueue.push(choice);
}

function handleScienceChecks(state, playerIndex) {
  const player = state.players[playerIndex];
  const counts = getScienceCounts(player);
  Object.entries(counts)
    .filter(([symbol, count]) => count >= 2 && !player.claimedSciencePairs.includes(symbol))
    .forEach(([symbol]) => {
      player.claimedSciencePairs.push(symbol);
      if (state.availableProgressIds.length) {
        pushPendingChoice(state, {
          type: "progress",
          playerIndex,
          title: `${player.name} formed a science pair`,
          description: "Choose 1 visible progress token.",
          options: [...state.availableProgressIds],
        });
      }
    });

  if (getUniqueScienceCount(player) >= 6) {
    state.winner = {
      type: "science",
      player: playerIndex,
      title: `${player.name} wins by scientific supremacy`,
      detail: `${player.name} collects 6 different science symbols.`,
    };
    state.phase = "gameOver";
  }
}

function applyProgressToken(state, playerIndex, progressId, sourceLabel) {
  const player = state.players[playerIndex];
  const token = getProgress(progressId);

  player.progressIds.push(progressId);
  state.availableProgressIds = state.availableProgressIds.filter((id) => id !== progressId);
  state.setAsideProgressIds = state.setAsideProgressIds.filter((id) => id !== progressId);

  if (token.immediateCoins) {
    player.coins += token.immediateCoins;
  }

  state.log.unshift(`${player.name} claims ${token.name}${sourceLabel ? ` from ${sourceLabel}` : ""}.`);
  if (token.scienceSymbol) {
    handleScienceChecks(state, playerIndex);
  }
}

function applyCardConstruction(state, playerIndex, card, payment) {
  const player = state.players[playerIndex];
  const cardName = getCardDisplayName(card, state);
  const beforeProduction = getFixedProduction(player, state.mode).fixed;
  const beforeCoins = player.coins - payment.total;
  player.coins -= payment.total;
  applyEconomyGain(state, playerIndex, payment.tradeCost);
  player.builtCardIds.push(card.id);

  if (card.immediateCoins) {
    player.coins += card.immediateCoins;
  }

  const yellowIncome = evaluateYellowIncome(state, playerIndex, card);
  if (yellowIncome) {
    player.coins += yellowIncome;
  }

  const guildCoins = evaluateGuildImmediateCoins(state, playerIndex, card);
  if (guildCoins) {
    player.coins += guildCoins;
  }

  if (payment.freeByChain && playerHasProgress(player, "urbanism")) {
    player.coins += 4;
    state.log.unshift(`${player.name} gains 4 coins from Urbanism.`);
  }

  if (isClassicMode(state)) {
    moveConflict(state, playerIndex, card.shields ?? card.summoning ?? 0);
  }

  if (card.summoning && !isClassicMode(state)) {
    const extraSummoning = card.type === "summoning" && playerHasProgress(player, "strategy") ? 1 : 0;
    addAgeSummoning(state, playerIndex, card.summoning + extraSummoning);
  }

  if (card.scienceSymbol) {
    handleScienceChecks(state, playerIndex);
  }

  maybeQueueProductionAnimation(state, playerIndex, card, beforeProduction, beforeCoins);
  state.log.unshift(`${player.name} builds ${cardName} ${payment.label}.`);
}

function queueNextDivineActivation(state) {
  const pending = state.pendingDivineActivations;
  if (!pending || !pending.remainingIds.length) {
    state.pendingDivineActivations = null;
    if (pending?.nextAgeToStart) {
      startAge(state, pending.nextAgeToStart.age, pending.nextAgeToStart.playerIndex);
      return true;
    }
    if (pending?.finalizeAfter) {
      finalizeCivilianVictory(state);
      return true;
    }
    return false;
  }

  state.choice = {
    type: "divineActivation",
    playerIndex: pending.playerIndex,
    title: `${PLAYER_NAMES[pending.playerIndex]} invokes a god`,
    description: "Choose which built god to activate from this ritual victory.",
    options: [...pending.remainingIds],
  };
  return true;
}

function activateGodPower(state, playerIndex, godId) {
  const player = state.players[playerIndex];
  const opponent = state.players[1 - playerIndex];
  const god = getGod(godId);
  const effect = god.activation ?? {};

  if (effect.type === "gainCoins") {
    player.coins += effect.amount;
  } else if (effect.type === "gainProgress") {
    if (state.availableProgressIds.length) {
      pushPendingChoice(state, {
        type: "progress",
        playerIndex,
        title: `${player.name} invokes ${god.name}`,
        description: "Choose 1 visible progress token.",
        options: [...state.availableProgressIds],
      });
    }
  } else if (effect.type === "gainChosenResource") {
    pushPendingChoice(state, {
      type: "divineResource",
      playerIndex,
      title: `${player.name} invokes ${god.name}`,
      description: "Choose 1 resource to add permanently to your domain.",
      options: [...RESOURCE_ORDER],
      amount: 1,
      sourceLabel: god.name,
    });
  } else if (effect.type === "gainChosenResourceAndCoins") {
    player.coins += effect.coins ?? 0;
    pushPendingChoice(state, {
      type: "divineResource",
      playerIndex,
      title: `${player.name} invokes ${god.name}`,
      description: "Choose 1 resource to add permanently to your domain.",
      options: [...RESOURCE_ORDER],
      amount: 1,
      sourceLabel: god.name,
    });
  } else if (effect.type === "destroyBuildings") {
    const targets = opponent.builtCardIds.map(getCard);
    if (targets.length) {
      pushPendingChoice(state, {
        type: "divineDestroy",
        playerIndex,
        title: `${player.name} invokes ${god.name}`,
        description: `Choose a rival building to destroy.${effect.coinLoss ? ` ${opponent.name} also loses ${effect.coinLoss} coins.` : ""}`,
        options: targets.map((card) => card.id),
        remaining: effect.count ?? 1,
        coinLoss: effect.coinLoss ?? 0,
        gainCoins: effect.gainCoins ?? 0,
      });
    } else if (effect.gainCoins) {
      player.coins += effect.gainCoins;
    }
  } else if (effect.type === "stealBuilding") {
    const targets = opponent.builtCardIds.map(getCard);
    if (targets.length) {
      pushPendingChoice(state, {
        type: "stealBuilding",
        playerIndex,
        title: `${player.name} invokes ${god.name}`,
        description: "Choose 1 rival building to steal.",
        options: targets.map((card) => card.id),
      });
    }
  } else if (effect.type === "gainBlessingPoints") {
    player.bonusPoints += effect.amount;
  } else if (effect.type === "nextAgeSummoning") {
    player.nextAgeSummoningBonus += effect.amount;
  } else if (effect.type === "gainProgressOrCoins") {
    if (state.availableProgressIds.length) {
      pushPendingChoice(state, {
        type: "progress",
        playerIndex,
        title: `${player.name} invokes ${god.name}`,
        description: "Choose 1 visible progress token.",
        options: [...state.availableProgressIds],
      });
    } else {
      player.coins += effect.amount ?? 0;
    }
  } else if (effect.type === "stealCoins") {
    const stolen = Math.min(opponent.coins, effect.amount ?? 0);
    opponent.coins -= stolen;
    player.coins += stolen;
  } else if (effect.type === "gainProgressOrPoints") {
    if (state.availableProgressIds.length) {
      pushPendingChoice(state, {
        type: "progress",
        playerIndex,
        title: `${player.name} invokes ${god.name}`,
        description: "Choose 1 visible progress token.",
        options: [...state.availableProgressIds],
      });
    } else {
      player.bonusPoints += effect.points ?? 0;
    }
  } else if (effect.type === "buildFromDiscard") {
    if (state.discardPile.length) {
      pushPendingChoice(state, {
        type: "mausoleum",
        playerIndex,
        title: `${player.name} invokes ${god.name}`,
        description: "Choose 1 discarded card to build for free.",
        options: [...state.discardPile],
      });
    }
  } else if (effect.type === "gainCoinsAndPoints") {
    player.coins += effect.coins ?? 0;
    player.bonusPoints += effect.points ?? 0;
  } else if (effect.type === "gainProgressAndCoins") {
    player.coins += effect.coins ?? 0;
    if (state.availableProgressIds.length) {
      pushPendingChoice(state, {
        type: "progress",
        playerIndex,
        title: `${player.name} invokes ${god.name}`,
        description: "Choose 1 visible progress token.",
        options: [...state.availableProgressIds],
      });
    }
  }

  state.log.unshift(`${player.name} invokes ${god.name}.`);
}

function applyGodConstruction(state, playerIndex, godId, payment) {
  const player = state.players[playerIndex];
  const godState = getOwnedGodState(player, godId);
  const god = getGod(godId);
  const beforeProduction = getFixedProduction(player, state.mode).fixed;
  const beforeCoins = player.coins - payment.total;

  player.coins -= payment.total;
  applyEconomyGain(state, playerIndex, payment.tradeCost);
  godState.built = true;
  state.godsBuiltTotal += 1;
  state.log.unshift(`${player.name} completes the cult of ${god.name} ${payment.label}.`);

  if (state.godsBuiltTotal >= 7) {
    state.players.forEach((cultPlayer) => {
      cultPlayer.gods.forEach((ownedGod) => {
        if (!ownedGod.built) {
          ownedGod.locked = true;
        }
      });
    });
    state.log.unshift("The seventh cult has been completed. The final unbuilt god is sealed away.");
  }

  maybeQueueProductionAnimation(state, playerIndex, god, beforeProduction, beforeCoins);
  return playerHasProgress(player, "theology");
}

function applyWonderConstruction(state, playerIndex, wonderId, payment) {
  const player = state.players[playerIndex];
  const wonderState = getOwnedWonderState(player, wonderId);
  const wonder = getWonder(wonderId);
  if (!wonderState || !wonder) {
    return false;
  }

  const beforeProduction = getFixedProduction(player, state.mode).fixed;
  const beforeCoins = player.coins - payment.total;

  player.coins -= payment.total;
  applyEconomyGain(state, playerIndex, payment.tradeCost);
  wonderState.built = true;
  state.wondersBuiltTotal += 1;
  state.log.unshift(`${player.name} builds the wonder ${wonder.name} ${payment.label}.`);

  if (wonder.shields) {
    moveConflict(state, playerIndex, wonder.shields);
  }

  if (wonder.immediateCoins) {
    player.coins += wonder.immediateCoins;
  }

  if (wonder.opponentCoinLoss) {
    const opponent = state.players[1 - playerIndex];
    opponent.coins = Math.max(0, opponent.coins - wonder.opponentCoinLoss);
  }

  if (wonder.progressFromDiscard && state.availableProgressIds.length) {
    pushPendingChoice(state, {
      type: "progress",
      playerIndex,
      title: `${player.name} builds ${wonder.name}`,
      description: "Choose 1 visible progress token.",
      options: [...state.availableProgressIds],
    });
  } else if (wonder.buildFromDiscard && state.discardPile.length > 0) {
    pushPendingChoice(state, {
      type: "mausoleum",
      playerIndex,
      title: `${player.name} builds ${wonder.name}`,
      description: "Choose 1 discarded card to build for free.",
      options: [...state.discardPile],
    });
  } else if (wonder.destroys) {
    const opponent = state.players[1 - playerIndex];
    const targets = opponent.builtCardIds.map(getCard).filter((entry) => entry && (wonder.destroys === "all" || wonder.destroys === entry.type || entry.type === wonder.destroys));
    if (targets.length) {
      pushPendingChoice(state, {
        type: "destroy",
        playerIndex,
        title: `${player.name} builds ${wonder.name}`,
        description: `Choose one opponent building to destroy.`,
        options: targets.map((entry) => entry.id),
      });
    }
  } else if (wonder.producesChoice) {
    pushPendingChoice(state, {
      type: "wonderResource",
      playerIndex,
      title: `${player.name} builds ${wonder.name}`,
      description: "Choose one permanent resource provided by this wonder.",
      options: [...wonder.producesChoice],
      label: wonder.name,
    });
  }

  if (wonder.replay) {
    maybeQueueProductionAnimation(state, playerIndex, wonder, beforeProduction, beforeCoins);
    return true;
  }

  maybeQueueProductionAnimation(state, playerIndex, wonder, beforeProduction, beforeCoins);
  return false;
}

function removeCardFromStructure(state, slotId, discard = false) {
  const slot = state.ageStructure.slots.find((entry) => entry.id === slotId);
  slot.removed = true;
  if (discard) {
    state.discardPile.push(slot.cardId);
  }
  state.selectedSlotId = null;
  state.cultMode = false;
  state.wonderMode = false;
}

function startAge(state, age, startingPlayer) {
  state.age = age;
  state.phase = "ageTurn";
  state.currentPlayer = startingPlayer;
  state.selectedSlotId = null;
  state.cultMode = false;
  state.wonderMode = false;
  state.currentAgeSummoning = state.players.map((player) => {
    const bonus = player.nextAgeSummoningBonus;
    player.nextAgeSummoningBonus = 0;
    return bonus;
  });
  state.lastSummoningResolution = null;
  state.ageStartingPlayer = startingPlayer;
  state.ageStructure = { slots: createLayoutSlots(AGE_LAYOUTS[age], buildAgeDeck(age, state.randomFn)) };
  refreshAccessibility(state);
  state.log.unshift(`${AGE_LAYOUTS[age].name} begins. ${PLAYER_NAMES[startingPlayer]} plays first.`);
}

function resolveAgeCompletion(state) {
  if (state.age >= 3) {
    finalizeCivilianVictory(state);
    return;
  }

  const nextAge = state.age + 1;
  const winner = getConflictWinner(state);
  const startingPlayer = winner ?? state.startingPlayer ?? state.firstPlayer;
  const reason = winner === null ? "No military edge" : `${PLAYER_NAMES[winner]} controls the battlefield`;
  state.log.unshift(`${AGE_LAYOUTS[state.age].name} ends. ${reason}; ${PLAYER_NAMES[startingPlayer]} begins Age ${nextAge}.`);
  startAge(state, nextAge, startingPlayer);
}

function resolveAgeSummoning(state) {
  const rolls = [rollTwoDice(state.randomFn), rollTwoDice(state.randomFn)];
  const totals = state.currentAgeSummoning.map((value, index) => value + rolls[index][0] + rolls[index][1]);
  let winner = null;
  let tiebreak = "";

  if (totals[0] !== totals[1]) {
    winner = totals[0] > totals[1] ? 0 : 1;
  } else if (state.currentAgeSummoning[0] !== state.currentAgeSummoning[1]) {
    winner = state.currentAgeSummoning[0] > state.currentAgeSummoning[1] ? 0 : 1;
    tiebreak = "Higher base summoning breaks the tie.";
  } else {
    winner = 1 - (state.ageStartingPlayer ?? state.firstPlayer);
    tiebreak = "If totals remain tied, the player who did not start the Age wins the ritual.";
  }

  state.players[winner].summoningWins += 1;
  state.summoningWinners.push({ age: state.age, playerIndex: winner });
  state.lastSummoningResolution = { age: state.age, winner, rolls, totals, tiebreak };
  queueDiceAnimation(state, {
    title: `Age ${state.age} summoning cast`,
    summary: `${PLAYER_NAMES[winner]} wins the ritual and may invoke all built gods.`,
    players: [
      { name: PLAYER_NAMES[0], base: state.currentAgeSummoning[0], dice: rolls[0], total: totals[0] },
      { name: PLAYER_NAMES[1], base: state.currentAgeSummoning[1], dice: rolls[1], total: totals[1] },
    ],
    note: tiebreak,
  });
  state.log.unshift(`${PLAYER_NAMES[winner]} wins the Age ${state.age} summoning ritual (${totals[winner]} to ${totals[1 - winner]}).`);

  const builtGodIds = state.players[winner].gods.filter((godState) => godState.built && !godState.locked).map((godState) => godState.id);
  state.pendingDivineActivations = {
    playerIndex: winner,
    remainingIds: builtGodIds,
    nextAgeToStart: state.age < 3 ? { age: state.age + 1, playerIndex: winner } : null,
    finalizeAfter: state.age >= 3,
  };
}

function buildChoiceView(state, choice) {
  if (!choice) {
    return null;
  }
  const resourceLabels = getResourceLabels(state);
  const typeMeta = getTypeMetaForMode(state);

  if (choice.type === "initiativeRoll") {
    return {
      title: choice.title,
      description: choice.description,
      options: [
        {
          id: "roll-opening-dice",
          title: "Throw the dice",
          detail: "Both players throw 2d6. Highest total chooses a mythology first, but the lower total opens the first Age.",
        },
      ],
    };
  }

  if (choice.type === "colorSelect") {
    return {
      title: choice.title,
      description: choice.description,
      options: choice.options.map((colorId) => {
        const color = CLASSIC_PLAYER_COLOR_BY_ID[colorId];
        return {
          id: color.id,
          title: color.name,
          detail: color.summary,
          swatch: color.panel,
          accent: color.accent,
        };
      }),
    };
  }

  if (choice.type === "wonderDraft") {
    return {
      title: choice.title,
      description: choice.description,
      options: choice.options.map((wonderId) => {
        const wonder = getWonder(wonderId);
        return {
          id: wonder.id,
          title: wonder.name,
          detail: wonder.description,
          image: `../assets/assets_wonders/${getWonderImage(wonder.id)}`,
        };
      }),
    };
  }

  if (choice.type === "mythologySelect") {
    return {
      title: choice.title,
      description: choice.description,
      options: choice.options.map((mythologyId) => {
        const mythology = MYTHOLOGIES_BY_ID[mythologyId];
        return {
          id: mythology.id,
          title: mythology.name,
          detail: mythology.summary,
          swatch: mythology.panel,
          accent: mythology.accent,
          image: mythology.image,
        };
      }),
    };
  }

  if (choice.type === "tradePrompt") {
    return {
      title: choice.title,
      description: choice.description,
      tradeRows: choice.tradeRows ?? [],
      tradeSummary: choice.tradeSummary ?? "",
      options: [
        {
          id: "start-trade",
          title: choice.confirmLabel ?? "Start trade and build",
          detail: choice.confirmDetail ?? `Spend ${choice.payment.total} coins (including trade).`,
        },
        {
          id: "cancel-trade",
          title: "Cancel",
          detail: "Keep this card and choose another action.",
        },
      ],
    };
  }

  if (choice.type === "progress" || choice.type === "greatLibrary") {
    return {
      title: choice.title,
      description: choice.description,
      options: choice.options.map((progressId) => ({
        id: progressId,
        title: getProgress(progressId).name,
        detail: getProgress(progressId).summary,
      })),
    };
  }

  if (choice.type === "destroy" || choice.type === "mausoleum" || choice.type === "divineDestroy" || choice.type === "stealBuilding") {
    return {
      title: choice.title,
      description: choice.description,
      options: choice.options.map((cardId) => ({
        id: cardId,
        title: getCardDisplayName(getCard(cardId), state),
        detail: `${typeMeta[getCard(cardId).type].label}. ${getCardDisplayDescription(getCard(cardId), state)}`,
      })),
    };
  }

  if (choice.type === "divineActivation") {
    return {
      title: choice.title,
      description: choice.description,
      options: choice.options.map((godId) => ({
        id: godId,
        title: getGod(godId).name,
        detail: getGod(godId).description,
      })),
    };
  }

  if (choice.type === "divineResource") {
    return {
      title: choice.title,
      description: choice.description,
      options: choice.options.map((resource) => ({
        id: resource,
        title: resourceLabels[resource],
        detail: `Add 1 permanent ${resourceLabels[resource].toLowerCase()} to your domain.`,
      })),
    };
  }

  if (choice.type === "wonderResource") {
    return {
      title: choice.title,
      description: choice.description,
      options: choice.options.map((resource) => ({
        id: resource,
        title: resourceLabels[resource],
        detail: `Add 1 permanent ${resourceLabels[resource].toLowerCase()} to your domain from this wonder.`,
      })),
    };
  }

  return null;
}

function finalizeCivilianVictory(state) {
  const playerZero = scorePlayer(state, 0);
  const playerOne = scorePlayer(state, 1);

  if (playerZero.total > playerOne.total) {
    state.winner = { type: "civilian", player: 0, title: `${PLAYER_NAMES[0]} wins on points`, detail: `${PLAYER_NAMES[0]} scores ${playerZero.total} to ${playerOne.total}.` };
  } else if (playerOne.total > playerZero.total) {
    state.winner = { type: "civilian", player: 1, title: `${PLAYER_NAMES[1]} wins on points`, detail: `${PLAYER_NAMES[1]} scores ${playerOne.total} to ${playerZero.total}.` };
  } else if (playerZero.civilianPoints > playerOne.civilianPoints) {
    state.winner = { type: "civilian", player: 0, title: `${PLAYER_NAMES[0]} wins the tiebreaker`, detail: `${PLAYER_NAMES[0]} has more blue civilian points.` };
  } else if (playerOne.civilianPoints > playerZero.civilianPoints) {
    state.winner = { type: "civilian", player: 1, title: `${PLAYER_NAMES[1]} wins the tiebreaker`, detail: `${PLAYER_NAMES[1]} has more blue civilian points.` };
  } else {
    state.winner = { type: "civilian", player: null, title: "Shared victory", detail: `Both players finish tied at ${playerZero.total} points.` };
  }

  state.phase = "gameOver";
}

export function getRulesReference(mode = "mythical") {
  return mode === "classic" ? RULES_REFERENCE_CLASSIC : RULES_REFERENCE;
}

export class DuelGame {
  constructor(randomFn = Math.random) {
    this.randomFn = randomFn;
    this.goToMenu();
  }

  getMode() {
    return this.state?.mode ?? "mythical";
  }

  goToMenu() {
    this.state = {
      started: false,
      phase: "menu",
      mode: "mythical",
      age: 0,
      turnNumber: 1,
      currentPlayer: 0,
      players: [createPlayer(0), createPlayer(1)],
      log: [],
      selectedSlotId: null,
      cultMode: false,
      availableProgressIds: [],
      currentAgeSummoning: [0, 0],
      summoningWinners: [],
      animationCue: null,
      animationCounter: 0,
      pendingDivineActivations: null,
      lastSummoningResolution: null,
      winner: null,
      choice: null,
    };
  }

  reset(mode = "mythical") {
    this.state = createInitialState(this.randomFn, mode);
    if (isClassicMode(this.state)) {
      this.state.choice = createColorChoice(this.state.firstPlayer, this.state);
    } else {
      this.state.choice = createOpeningRollChoice();
    }
  }

  clearSelection() {
    if (this.state.phase !== "ageTurn" || this.state.choice) {
      return;
    }
    this.state.selectedSlotId = null;
    this.state.cultMode = false;
  }

  selectCard(slotId) {
    if (this.state.phase !== "ageTurn" || this.state.choice || this.state.winner) {
      return;
    }
    const slot = this.state.ageStructure.slots.find((entry) => entry.id === slotId);
    if (!slot || slot.removed || slot.hidden || !slot.accessible) {
      return;
    }
    this.state.selectedSlotId = slotId;
    this.state.cultMode = false;
  }

  enterCultMode() {
    if (!this.state.selectedSlotId || this.state.choice || this.state.winner) {
      return;
    }
    if (isClassicMode(this.state)) {
      this.state.wonderMode = true;
      return;
    }
    const player = this.state.players[this.state.currentPlayer];
    if (!player.gods.some((godState) => !godState.built && !godState.locked)) {
      return;
    }
    this.state.cultMode = true;
  }

  getSelectedVisibleSlot() {
    if (this.state.phase !== "ageTurn" || this.state.choice || this.state.winner) {
      return null;
    }
    const slot = this.state.ageStructure.slots.find((entry) => entry.id === this.state.selectedSlotId);
    if (!slot || slot.removed || slot.hidden || !slot.accessible) {
      return null;
    }
    return slot;
  }

  buildSelectedCard() {
    const slot = this.getSelectedVisibleSlot();
    if (!slot) {
      return;
    }
    const card = getCard(slot.cardId);
    const cardName = getCardDisplayName(card, this.state);
    const payment = evaluateConstructionCost(this.state, this.state.currentPlayer, card, "card");
    if (!payment.canAfford) {
      return;
    }
    if (payment.tradeCost > 0) {
      const player = this.state.players[this.state.currentPlayer];
      const tradeRows = getTradeNeedRows(this.state, this.state.currentPlayer, payment.tradeNeeds);
      this.state.choice = {
        type: "tradePrompt",
        mode: "card",
        playerIndex: this.state.currentPlayer,
        slotId: slot.id,
        cardId: card.id,
        payment,
        options: ["start-trade", "cancel-trade"],
        title: `${player.name} builds ${cardName}`,
        description: `${cardName} needs trade resources this turn.`,
        tradeRows,
        tradeSummary: formatTradeNeedsSummary(payment.tradeNeeds, this.state.mode),
        confirmLabel: "Start trade and build card",
        confirmDetail: `${cardName} will cost ${payment.label}${tradeRows.totalCost ? `, including ${tradeRows.totalCost} trade ${getResourceLabels(this.state).coins.toLowerCase()}` : ""}.`,
      };
      return;
    }

    removeCardFromStructure(this.state, slot.id, false);
    applyCardConstruction(this.state, this.state.currentPlayer, card, payment);
    this.state.lastActivePlayer = this.state.currentPlayer;
    this.advanceAfterAction(false);
  }

  discardSelectedCard() {
    const slot = this.getSelectedVisibleSlot();
    if (!slot) {
      return;
    }
    const player = this.state.players[this.state.currentPlayer];
    const yellowCount = getBuiltCards(player).filter((card) => card.type === "commerce").length;
    const gained = 2 + yellowCount;

    removeCardFromStructure(this.state, slot.id, true);
    player.coins += gained;
    this.state.lastActivePlayer = this.state.currentPlayer;
    this.state.log.unshift(`${player.name} discards ${getCardDisplayName(getCard(slot.cardId), this.state)} and gains ${gained} ${getResourceLabels(this.state).coins.toLowerCase()}.`);
    this.advanceAfterAction(false);
  }

  buildGodWithSelectedCard(godId) {
    if (isClassicMode(this.state)) {
      this.buildWonderWithSelectedCard(godId);
      return;
    }
    const slot = this.getSelectedVisibleSlot();
    if (!slot) {
      return;
    }
    const player = this.state.players[this.state.currentPlayer];
    const buildingsRequired = getNextGodRequirement(player);
    if (getBuiltStructureCount(player) < buildingsRequired) {
      return;
    }
    const godState = getOwnedGodState(player, godId);
    if (!godState || godState.built || godState.locked) {
      return;
    }
    const god = getGod(godId);
    const payment = evaluateConstructionCost(this.state, this.state.currentPlayer, god, "god");
    if (!payment.canAfford) {
      return;
    }
    if (payment.tradeCost > 0) {
      const player = this.state.players[this.state.currentPlayer];
      const tradeRows = getTradeNeedRows(this.state, this.state.currentPlayer, payment.tradeNeeds);
      this.state.choice = {
        type: "tradePrompt",
        mode: "god",
        playerIndex: this.state.currentPlayer,
        slotId: slot.id,
        godId,
        payment,
        options: ["start-trade", "cancel-trade"],
        title: `${player.name} completes the cult of ${god.name}`,
        description: `${god.name} needs trade resources before completion.`,
        tradeRows,
        tradeSummary: formatTradeNeedsSummary(payment.tradeNeeds, this.state.mode),
        confirmLabel: "Start trade and complete cult",
        confirmDetail: `${god.name} will cost ${payment.label}, including ${tradeRows.totalCost ? `${tradeRows.totalCost} trade coins` : "no trade coins"}.`,
      };
      return;
    }

    removeCardFromStructure(this.state, slot.id, false);
    const replay = applyGodConstruction(this.state, this.state.currentPlayer, godId, payment);
    this.state.lastActivePlayer = this.state.currentPlayer;
    this.advanceAfterAction(replay);
  }

  buildWonderWithSelectedCard(wonderId) {
    const slot = this.getSelectedVisibleSlot();
    if (!slot) {
      return;
    }

    const player = this.state.players[this.state.currentPlayer];
    const wonderState = getOwnedWonderState(player, wonderId);
    if (!wonderState || wonderState.built || wonderState.locked) {
      return;
    }

    const wonder = getWonder(wonderId);
    const payment = evaluateConstructionCost(this.state, this.state.currentPlayer, wonder, "wonder");
    if (!payment.canAfford) {
      return;
    }

    if (payment.tradeCost > 0) {
      const tradeRows = getTradeNeedRows(this.state, this.state.currentPlayer, payment.tradeNeeds);
      this.state.choice = {
        type: "tradePrompt",
        mode: "wonder",
        playerIndex: this.state.currentPlayer,
        slotId: slot.id,
        wonderId,
        payment,
        options: ["start-trade", "cancel-trade"],
        title: `${player.name} builds ${wonder.name}`,
        description: `${wonder.name} needs trade resources before construction.`,
        tradeRows,
        tradeSummary: formatTradeNeedsSummary(payment.tradeNeeds, this.state.mode),
        confirmLabel: "Start trade and build wonder",
        confirmDetail: `${wonder.name} will cost ${payment.label}${tradeRows.totalCost ? `, including ${tradeRows.totalCost} trade ${getResourceLabels(this.state).coins.toLowerCase()}` : ""}.`,
      };
      return;
    }

    removeCardFromStructure(this.state, slot.id, false);
    const replay = applyWonderConstruction(this.state, this.state.currentPlayer, wonderId, payment);
    this.state.lastActivePlayer = this.state.currentPlayer;
    this.advanceAfterAction(replay);
  }

  resolveChoice(choiceId) {
    const choice = this.state.choice;
    if (!choice) {
      return;
    }

    if (choice.type === "initiativeRoll") {
      if (choiceId !== "roll-opening-dice") {
        return;
      }
      resolveOpeningRoll(this.state);
      return;
    }

    if (choice.type === "colorSelect") {
      if (!choice.options.includes(choiceId)) {
        return;
      }
      const player = this.state.players[choice.playerIndex];
      if (!player || player.colorId) {
        return;
      }
      player.colorId = choiceId;
      this.state.log.unshift(`${PLAYER_NAMES[choice.playerIndex]} selects ${CLASSIC_PLAYER_COLOR_BY_ID[choiceId].name} as their city color.`);
      const remainingPlayer = this.state.players.findIndex((entry) => !entry.colorId);
      if (remainingPlayer !== -1) {
        this.state.choice = createColorChoice(remainingPlayer, this.state);
        return;
      }

      this.state.colorChooser = choice.playerIndex;
      this.state.wonderDraft = createWonderDraft(this.state.firstPlayer, this.state.randomFn);
      this.state.choice = createWonderDraftChoice(this.state);
      return;
    }

    if (choice.type === "wonderDraft") {
      if (!choice.options.includes(choiceId)) {
        return;
      }
      const player = this.state.players[choice.playerIndex];
      if (!player || player.wonders.some((entry) => entry.id === choiceId)) {
        return;
      }

      const draft = this.state.wonderDraft;
      if (!draft || !draft.offer.includes(choiceId)) {
        return;
      }

      player.wonders.push({ id: choiceId, built: false, locked: false });
      draft.batches = draft.batches.map((batch) => batch.filter((wonderId) => wonderId !== choiceId));
      draft.offer = draft.offer.filter((wonderId) => wonderId !== choiceId);
      draft.pickIndex += 1;
      this.state.log.unshift(`${PLAYER_NAMES[choice.playerIndex]} drafts ${getWonder(choiceId).name}`);
      advanceWonderDraft(this.state);
      return;
    }

    if (choice.type === "tradePrompt") {
      if (choiceId === "cancel-trade") {
        this.state.choice = null;
        return;
      }
      if (choiceId !== "start-trade") {
        return;
      }

      const slot = this.state.ageStructure.slots.find((entry) => entry.id === choice.slotId);
      if (!slot || slot.removed) {
        this.state.choice = null;
        return;
      }

      if (choice.mode === "god") {
        const god = getGod(choice.godId);
        const targetPlayer = this.state.players[choice.playerIndex];
        const godState = getOwnedGodState(targetPlayer, choice.godId);
        if (getBuiltStructureCount(targetPlayer) < getNextGodRequirement(targetPlayer)) {
          this.state.choice = null;
          return;
        }
        if (!god || !godState || godState.built || godState.locked) {
          this.state.choice = null;
          return;
        }
        const payment = evaluateConstructionCost(this.state, choice.playerIndex, god, "god");
        if (!payment.canAfford) {
          this.state.choice = null;
          return;
        }
        removeCardFromStructure(this.state, choice.slotId, false);
        const replay = applyGodConstruction(this.state, choice.playerIndex, choice.godId, payment);
        this.state.lastActivePlayer = choice.playerIndex;
        this.state.choice = null;
        this.advanceAfterAction(replay);
        return;
      }

      if (choice.mode === "wonder") {
        const wonder = getWonder(choice.wonderId);
        const targetPlayer = this.state.players[choice.playerIndex];
        const wonderState = getOwnedWonderState(targetPlayer, choice.wonderId);
        if (!wonder || !wonderState || wonderState.built || wonderState.locked) {
          this.state.choice = null;
          return;
        }
        const payment = evaluateConstructionCost(this.state, choice.playerIndex, wonder, "wonder");
        if (!payment.canAfford) {
          this.state.choice = null;
          return;
        }
        removeCardFromStructure(this.state, choice.slotId, false);
        const replay = applyWonderConstruction(this.state, choice.playerIndex, choice.wonderId, payment);
        this.state.lastActivePlayer = choice.playerIndex;
        this.state.choice = null;
        this.advanceAfterAction(replay);
        return;
      }

      if (choice.mode === "card") {
        const card = getCard(choice.cardId);
        if (!card) {
          this.state.choice = null;
          return;
        }
        const payment = evaluateConstructionCost(this.state, choice.playerIndex, card, "card");
        if (!payment.canAfford) {
          this.state.choice = null;
          return;
        }
        removeCardFromStructure(this.state, choice.slotId, false);
        applyCardConstruction(this.state, choice.playerIndex, card, payment);
        this.state.lastActivePlayer = choice.playerIndex;
        this.state.choice = null;
        this.advanceAfterAction(false);
        return;
      }

      this.state.choice = null;
      return;
    }

    if (choice.type === "mythologySelect") {
      if (!choice.options.includes(choiceId)) {
        return;
      }

      this.state.players[choice.playerIndex].mythologyId = choiceId;
      this.state.players[choice.playerIndex].gods = createGodPool(choiceId, this.state.randomFn).map((id) => ({ id, built: false, locked: false }));
      this.state.log.unshift(`${PLAYER_NAMES[choice.playerIndex]} pledges to the ${MYTHOLOGIES_BY_ID[choiceId].name} mythology.`);

      const remainingPlayer = this.state.players.findIndex((player) => !player.mythologyId);
      if (remainingPlayer !== -1) {
        this.state.choice = createMythologyChoice(this.state, remainingPlayer);
      } else {
        this.state.choice = null;
        startAge(this.state, 1, this.state.firstPlayer);
      }
      return;
    }

    if (choice.type === "progress" || choice.type === "greatLibrary") {
      if (!choice.options.includes(choiceId)) {
        return;
      }
      applyProgressToken(this.state, choice.playerIndex, choiceId, choice.type === "greatLibrary" ? "The Great Library" : "science");
      this.state.choice = null;
      this.advancePendingResolution();
      return;
    }

    if (choice.type === "destroy") {
      if (!choice.options.includes(choiceId)) {
        return;
      }
      const opponent = this.state.players[1 - choice.playerIndex];
      const removeIndex = opponent.builtCardIds.indexOf(choiceId);
      if (removeIndex !== -1) {
        opponent.builtCardIds.splice(removeIndex, 1);
        this.state.discardPile.push(choiceId);
      }
      this.state.log.unshift(`${this.state.players[choice.playerIndex].name} destroys ${getCardDisplayName(getCard(choiceId), this.state)}.`);
      this.state.choice = null;
      this.advancePendingResolution();
      return;
    }

    if (choice.type === "divineDestroy") {
      if (!choice.options.includes(choiceId)) {
        return;
      }
      const opponent = this.state.players[1 - choice.playerIndex];
      const removeIndex = opponent.builtCardIds.indexOf(choiceId);
      if (removeIndex !== -1) {
        opponent.builtCardIds.splice(removeIndex, 1);
        this.state.discardPile.push(choiceId);
      }
      if (choice.coinLoss) {
        opponent.coins = Math.max(0, opponent.coins - choice.coinLoss);
      }
      if (choice.gainCoins) {
        this.state.players[choice.playerIndex].coins += choice.gainCoins;
      }
      this.state.log.unshift(`${this.state.players[choice.playerIndex].name} destroys ${getCardDisplayName(getCard(choiceId), this.state)} through divine wrath.`);
      this.state.choice = null;
      const remaining = (choice.remaining ?? 1) - 1;
      if (remaining > 0) {
        const remainingTargets = opponent.builtCardIds.map(getCard);
        if (remainingTargets.length) {
          this.state.pendingQueue.unshift({
            ...choice,
            options: remainingTargets.map((card) => card.id),
            remaining,
          });
        }
      }
      this.advancePendingResolution();
      return;
    }

    if (choice.type === "stealBuilding") {
      if (!choice.options.includes(choiceId)) {
        return;
      }
      const player = this.state.players[choice.playerIndex];
      const opponent = this.state.players[1 - choice.playerIndex];
      opponent.builtCardIds = opponent.builtCardIds.filter((id) => id !== choiceId);
      player.builtCardIds.push(choiceId);
      this.state.log.unshift(`${player.name} steals ${getCardDisplayName(getCard(choiceId), this.state)}.`);
      this.state.choice = null;
      this.advancePendingResolution();
      return;
    }

    if (choice.type === "divineResource") {
      if (!choice.options.includes(choiceId)) {
        return;
      }
      this.state.players[choice.playerIndex].bonusProduction[choiceId] += choice.amount ?? 1;
      this.state.players[choice.playerIndex].bonusProductionSources[choiceId].push({
        amount: choice.amount ?? 1,
        label: choice.sourceLabel ?? "Divine favor",
      });
      this.state.log.unshift(`${this.state.players[choice.playerIndex].name} gains permanent ${getResourceLabels(this.state)[choiceId].toLowerCase()} from divine favor.`);
      this.state.choice = null;
      this.advancePendingResolution();
      return;
    }

    if (choice.type === "wonderResource") {
      if (!choice.options.includes(choiceId)) {
        return;
      }
      const player = this.state.players[choice.playerIndex];
      player.bonusProduction[choiceId] += choice.amount ?? 1;
      player.bonusProductionSources[choiceId].push({
        amount: choice.amount ?? 1,
        label: choice.label ?? "Wonder",
      });
      this.state.log.unshift(`${player.name} gains 1 permanent ${getResourceLabels(this.state)[choiceId].toLowerCase()} from a wonder.`);
      this.state.choice = null;
      this.advancePendingResolution();
      return;
    }

    if (choice.type === "divineActivation") {
      if (!choice.options.includes(choiceId)) {
        return;
      }
      activateGodPower(this.state, choice.playerIndex, choiceId);
      this.state.pendingDivineActivations.remainingIds = this.state.pendingDivineActivations.remainingIds.filter((id) => id !== choiceId);
      this.state.choice = null;
      this.advancePendingResolution();
      return;
    }

    if (choice.type === "mausoleum") {
      if (!choice.options.includes(choiceId)) {
        return;
      }
      const player = this.state.players[choice.playerIndex];
      const discardIndex = this.state.discardPile.indexOf(choiceId);
      if (discardIndex !== -1) {
        this.state.discardPile.splice(discardIndex, 1);
      }
      const card = getCard(choiceId);
      player.builtCardIds.push(choiceId);
      if (card.immediateCoins) {
        player.coins += card.immediateCoins;
      }
      const yellowIncome = evaluateYellowIncome(this.state, choice.playerIndex, card);
      if (yellowIncome) {
        player.coins += yellowIncome;
      }
      const guildCoins = evaluateGuildImmediateCoins(this.state, choice.playerIndex, card);
      if (guildCoins) {
        player.coins += guildCoins;
      }
      if (card.summoning) {
        const extraSummoning = card.type === "summoning" && playerHasProgress(player, "strategy") ? 1 : 0;
        addAgeSummoning(this.state, choice.playerIndex, card.summoning + extraSummoning);
      }
      if (card.scienceSymbol) {
        handleScienceChecks(this.state, choice.playerIndex);
      }
      this.state.log.unshift(`${player.name} builds ${getCardDisplayName(card, this.state)} from the discard pile for free.`);
      this.state.choice = null;
      this.advancePendingResolution();
      return;
    }
  }

  advanceAfterAction(replay) {
    refreshAccessibility(this.state);
    this.state.pendingReplay = replay;
    this.advancePendingResolution();
  }

  advancePendingResolution() {
    if (this.state.winner) {
      this.state.phase = "gameOver";
      this.state.choice = null;
      return;
    }
    if (this.state.pendingQueue.length) {
      this.state.choice = this.state.pendingQueue.shift();
      return;
    }
    if (queueNextDivineActivation(this.state)) {
      return;
    }
    this.state.choice = null;
    this.finishTurn();
  }

  finishTurn() {
    if (this.state.winner) {
      this.state.phase = "gameOver";
      return;
    }

    const remainingCards = this.state.ageStructure?.slots.filter((slot) => !slot.removed).length ?? 0;
    const replay = this.state.pendingReplay;
    this.state.pendingReplay = false;

    if (remainingCards === 0) {
      if (isClassicMode(this.state)) {
        resolveAgeCompletion(this.state);
      } else {
        resolveAgeSummoning(this.state);
      }
      this.state.turnNumber += 1;
      this.advancePendingResolution();
      return;
    }

    if (!replay) {
      this.state.currentPlayer = 1 - this.state.currentPlayer;
    } else {
      this.state.log.unshift(`${PLAYER_NAMES[this.state.currentPlayer]} gains another turn.`);
    }

    this.state.turnNumber += 1;
    this.state.phase = "ageTurn";
  }

  getPhaseLabel() {
    if (this.state.winner) {
      return this.state.winner.title;
    }
    if (this.state.choice?.type === "colorSelect") {
      return `${PLAYER_NAMES[this.state.choice.playerIndex]} is choosing a city color.`;
    }
    if (this.state.choice?.type === "wonderDraft") {
      return `${PLAYER_NAMES[this.state.choice.playerIndex]} is drafting a wonder.`;
    }
    if (this.state.choice?.type === "initiativeRoll") {
      return "Throw 2d6 to decide mythology priority.";
    }
    if (this.state.choice?.type === "mythologySelect") {
      return "Choose a mythology before Chaos Duel begins.";
    }
    if (this.state.choice) {
      return this.state.choice.description;
    }
    if (isClassicMode(this.state)) {
      return "Build, discard, or attach cards to your drafted wonders.";
    }
    return "Local hot-seat ritual play with age drafting, cult construction, and summoning resolutions.";
  }

  getBannerText() {
    if (this.state.winner) {
      return this.state.winner.detail;
    }
    if (this.state.choice?.type === "initiativeRoll") {
      return "Highest 2d6 total chooses a mythology first, but the lower total begins Age I.";
    }
    if (this.state.choice?.type === "mythologySelect") {
      return `${PLAYER_NAMES[this.state.choice.playerIndex]} is choosing a mythology.`;
    }
    if (this.state.choice?.type === "colorSelect") {
      return `${PLAYER_NAMES[this.state.choice.playerIndex]} is choosing a city color.`;
    }
    if (this.state.choice?.type === "wonderDraft") {
      return `${PLAYER_NAMES[this.state.choice.playerIndex]} drafts one of the open wonders.`;
    }
    if (this.state.choice) {
      return this.state.choice.description;
    }
    return `${PLAYER_NAMES[this.state.currentPlayer]}'s turn.`;
  }

  getSummoningView() {
    if (isClassicMode(this.state)) {
      const spaces = Array.from({ length: (MILITARY_CAPITAL * 2) + 1 }, (_, index) => {
        const position = index - MILITARY_CAPITAL;
        return {
          position,
          label: position === 0 ? "0" : String(Math.abs(position)),
          isCenter: position === 0,
          isLoot: LOOT_THRESHOLDS.some((entry) => Math.abs(position) === entry.position),
          controlledBy: position < 0 ? 1 : position > 0 ? 0 : null,
          active: this.state.conflictPosition === position,
        };
      });
      return {
        kind: "classic",
        current: [{
          player: "Conflict Position",
          value: this.state.conflictPosition,
        }],
        winners: [],
        pending: [],
        lastResolution: null,
        label: "Military Front",
        track: {
          position: this.state.conflictPosition,
          spaces,
          lootTokens: LOOT_THRESHOLDS.flatMap((entry) => ([
            {
              side: 0,
              position: entry.position,
              penalty: entry.penalty,
              claimed: Boolean(this.state.militaryTokensClaimed[`${entry.position}-right`]),
            },
            {
              side: 1,
              position: -entry.position,
              penalty: entry.penalty,
              claimed: Boolean(this.state.militaryTokensClaimed[`${entry.position}-left`]),
            },
          ])),
          preview: [0, 1].map((playerIndex) => ({
            player: PLAYER_NAMES[playerIndex],
            points: getMilitaryEndgamePoints(this.state, playerIndex),
          })),
        },
      };
    }

    const winnerBadges = this.state.summoningWinners.map((entry) => ({
      label: `Age ${entry.age}: ${PLAYER_NAMES[entry.playerIndex]}`,
    }));
    const pending = this.state.pendingDivineActivations
      ? this.state.pendingDivineActivations.remainingIds.map((godId) => getGod(godId).name)
      : [];
    return {
      current: this.state.currentAgeSummoning.map((value, index) => ({ player: PLAYER_NAMES[index], value })),
      winners: winnerBadges,
      pending,
      lastResolution: this.state.lastSummoningResolution
        ? {
            summary: `${PLAYER_NAMES[this.state.lastSummoningResolution.winner]} won Age ${this.state.lastSummoningResolution.age} (${this.state.lastSummoningResolution.totals[0]} to ${this.state.lastSummoningResolution.totals[1]}).`,
            detail: `Dice ${this.state.lastSummoningResolution.rolls[0].join(" + ")} / ${this.state.lastSummoningResolution.rolls[1].join(" + ")}${this.state.lastSummoningResolution.tiebreak ? `. ${this.state.lastSummoningResolution.tiebreak}` : ""}`,
          }
        : null,
    };
  }

  getCardFooter(card) {
    const labels = getResourceLabels(this.state);
    const displayName = getCardDisplayName(card, this.state);
    const parts = [];
    if (card.points) {
      parts.push(`${card.points} VP`);
    }
    if (card.summoning) {
      parts.push(this.state.mode === "classic" ? `${card.summoning} military` : `${card.summoning} summoning`);
    }
    if (card.immediateCoins) {
      parts.push(`+${card.immediateCoins} ${labels.coins.toLowerCase()}`);
    }
    if (card.scienceSymbol) {
      parts.push(`Science: ${card.scienceSymbol}`);
    }
    if (card.chainFrom?.length) {
      parts.push(`Chain from: ${card.chainFrom.map((id) => {
        const source = getCard(id);
        return source ? getCardDisplayName(source, this.state) : id;
      }).join(", ")}`);
    }
    return parts.join(" | ");
  }

  getSlotView() {
    if (!this.state.ageStructure) {
      return [];
    }
    const activePlayerIndex = Number.isInteger(this.state.choice?.playerIndex) ? this.state.choice.playerIndex : this.state.currentPlayer;
    return this.state.ageStructure.slots
      .filter((slot) => !slot.removed)
      .map((slot) => {
        const hidden = slot.hidden;
        const card = hidden ? null : getCard(slot.cardId);
        const payment = card ? evaluateConstructionCost(this.state, activePlayerIndex, card, "card") : null;
        const ownedCoverage = card ? evaluateOwnedResourceCoverage(this.state, activePlayerIndex, card, "card") : null;
        return {
          id: slot.id,
          cardId: card?.id ?? null,
          hidden,
          accessible: slot.accessible,
          selected: this.state.selectedSlotId === slot.id,
          canClick: slot.accessible && !hidden && this.state.phase === "ageTurn" && !this.state.choice && !this.state.winner,
          left: 8 + slot.x * 13,
          top: slot.y,
          typeClass: card ? getTypeMetaForMode(this.state)[card.type].className : "",
          typeLabel: card ? getTypeMetaForMode(this.state)[card.type].label : "",
          name: card ? getCardDisplayName(card, this.state) : "",
          effect: card ? getCardDisplayDescription(card, this.state) : "",
          imageKey: card ? getCardImageKey(card.id) : "",
          costResources: card ? serializeResourceCost(card.resourceCost) : [],
          producedResources: card ? serializeProduction(card) : [],
          coinCost: card?.coinCost ?? 0,
          points: card?.points ?? 0,
          militaryValue: card?.shields ?? card?.summoning ?? 0,
          scienceSymbol: card?.scienceSymbol ?? null,
          resourceUnits: ownedCoverage?.totalUnits ?? 0,
          ownResourcesCovered: ownedCoverage?.ownsAll ?? true,
          canAfford: payment?.canAfford ?? false,
          cost: card
            ? `Cost: ${card.coinCost ? `${card.coinCost} ${getResourceLabels(this.state).coins.toLowerCase()}${Object.keys(card.resourceCost).length ? " and " : ""}` : ""}${formatResourceCost(card.resourceCost, getResourceLabels(this.state))}`
            : "",
          footer: card ? this.getCardFooter(card) : "",
        };
      });
  }

  getUnbuiltGodView(playerIndex) {
    return this.state.players[playerIndex].gods
      .filter((godState) => !godState.built && !godState.locked)
      .map((godState) => {
        const god = getGod(godState.id);
        const buildingsRequired = getNextGodRequirement(this.state.players[playerIndex]);
        const builtStructures = getBuiltStructureCount(this.state.players[playerIndex]);
        const meetsBuildingRequirement = builtStructures >= buildingsRequired;
        const payment = evaluateConstructionCost(this.state, playerIndex, god, "god");
        const ownedCoverage = evaluateOwnedResourceCoverage(this.state, playerIndex, god, "god");
        return {
          id: god.id,
          name: god.name,
          effect: god.description,
          costLabel: formatResourceCost(god.cost),
          costResources: serializeResourceCost(god.cost),
          producedResources: serializeProduction(god),
          coinCost: god.coinCost ?? 0,
          points: god.points ?? 0,
          resourceUnits: ownedCoverage.totalUnits,
          ownResourcesCovered: ownedCoverage.ownsAll,
          canBuild: payment.canAfford && meetsBuildingRequirement,
          buildingRequirementMet: meetsBuildingRequirement,
          buildingsRequired,
          builtStructures,
          requiresTrade: payment.tradeCost > 0,
          tradeCost: payment.tradeCost,
          tradeSummary: formatTradeNeedsSummary(payment.tradeNeeds, this.state.mode),
        };
      });
  }

  getUnbuiltWonderView(playerIndex) {
    return this.state.players[playerIndex].wonders
      .filter((wonderState) => !wonderState.built && !wonderState.locked)
      .map((wonderState) => {
        const wonder = getWonder(wonderState.id);
        const payment = evaluateConstructionCost(this.state, playerIndex, wonder, "wonder");
        const ownedCoverage = evaluateOwnedResourceCoverage(this.state, playerIndex, wonder, "wonder");
        return {
          id: wonder.id,
          name: wonder.name,
          effect: wonder.description,
          costLabel: formatResourceCost(wonder.cost),
          costResources: serializeResourceCost(wonder.cost),
          producedResources: serializeProduction(wonder),
          coinCost: wonder.coinCost ?? 0,
          points: wonder.points ?? 0,
          resourceUnits: ownedCoverage.totalUnits,
          ownResourcesCovered: ownedCoverage.ownsAll,
          canBuild: payment.canAfford,
          requiresTrade: payment.tradeCost > 0,
          tradeCost: payment.tradeCost,
          tradeSummary: formatTradeNeedsSummary(payment.tradeNeeds, this.state.mode),
          image: getWonderImage(wonder.id),
        };
      });
  }

  getUnbuiltSpecials(playerIndex) {
    return isClassicMode(this.state)
      ? this.getUnbuiltWonderView(playerIndex)
      : this.getUnbuiltGodView(playerIndex);
  }

  getPlayerView(playerIndex) {
    const player = this.state.players[playerIndex];
    const production = getFixedProduction(player, this.state.mode);
    const productionSources = getProductionSources(player, this.state.mode);
    const classicMode = isClassicMode(this.state);
    const theme = getPlayerTheme(this.state, playerIndex);
    const typeMeta = getTypeMetaForMode(this.state);
    const resourceLabels = getResourceLabels(this.state);
    const specialLabel = classicMode ? "Wonders" : "Gods";
    const factionLabel = classicMode ? "Color" : "Mythology";
    const specialDescriptors = classicMode
      ? player.wonders.map((state) => ({ state, descriptor: getWonder(state.id), isWonder: true }))
      : player.gods.map((state) => ({ state, descriptor: getGod(state.id), isWonder: false }));
    const score = scorePlayer(this.state, playerIndex);
    return {
      name: player.name,
      modeLabel: factionLabel,
      mythology: classicMode ? theme.name : (player.mythologyId ? MYTHOLOGIES_BY_ID[player.mythologyId]?.name : null),
      sideLabel: playerIndex === 0 ? (classicMode ? "Left city" : "Left cult") : (classicMode ? "Right city" : "Right cult"),
      isCurrent: playerIndex === this.state.currentPlayer && this.state.phase === "ageTurn" && !this.state.choice && !this.state.winner,
      resources: RESOURCE_ORDER.map((resource) => ({
        resource,
        label: resourceLabels[resource],
        value: production.fixed[resource],
        summary: formatResourceSourceSummary(resourceLabels[resource], production.fixed[resource], productionSources[resource]),
      })),
      coinCount: player.coins,
      stats: [
        { label: "Coins", value: player.coins },
        { label: "Score Preview", value: score.total },
        { label: "Science", value: getUniqueScienceCount(player) },
        { label: classicMode ? "Military" : "Summoning Wins", value: classicMode ? getMilitaryEndgamePoints(this.state, playerIndex) : player.summoningWins },
      ],
      progress: player.progressIds.map((id) => getProgress(id)),
      gods: specialDescriptors.map((entry) => {
        const descriptor = entry.descriptor;
        return {
          id: descriptor?.id ?? entry.state.id,
          name: descriptor?.name ?? entry.state.id,
          image: entry.isWonder ? getWonderImage(descriptor?.id ?? entry.state.id) : getGodImage(descriptor?.id ?? entry.state.id),
          built: entry.state.built,
          locked: entry.state.locked,
          effect: descriptor?.description ?? "",
        };
      }),
      specialLabel,
      builtGodCount: classicMode ? getWonderCount(player) : getGodCount(player),
      builtCards: getBuiltCards(player).map((card) => ({
        id: card.id,
        name: getCardDisplayName(card, this.state),
        typeClass: typeMeta[card.type].className,
        typeLabel: typeMeta[card.type].label,
        detail: `${typeMeta[card.type].label}. ${getCardDisplayDescription(card, this.state)}`,
      })),
    };
  }

  getActionSummary(selectedCard, selectedPayment) {
    if (this.state.winner) {
      return this.state.winner.title;
    }
    if (this.state.choice) {
      return this.state.choice.description;
    }
    const classicMode = isClassicMode(this.state);
    if (!selectedCard) {
      return "Select an accessible card from the shared structure.";
    }
    const selectedName = getCardDisplayName(selectedCard, this.state);
    const coinLabel = getResourceLabels(this.state).coins.toLowerCase();
    const yellowCount = getBuiltCards(this.state.players[this.state.currentPlayer]).filter((card) => card.type === "commerce").length;
    if (selectedPayment.tradeCost > 0) {
      return `${selectedName}: build for ${selectedPayment.label} (${selectedPayment.tradeCost} trade ${coinLabel} required), discard for ${2 + yellowCount} ${coinLabel}, or ${classicMode ? "attach it to a wonder" : "offer it to a god cult"}.`;
    }
    return `${selectedName}: build ${selectedPayment.label}, discard for ${2 + yellowCount} ${coinLabel}, or ${classicMode ? "attach it to a wonder" : "complete a cult"}.`;
  }

  getViewModel() {
    if (!this.state.started) {
      return { started: false };
    }

    const activePlayerIndex = Number.isInteger(this.state.choice?.playerIndex) ? this.state.choice.playerIndex : this.state.currentPlayer;
    const currentPlayer = this.state.players[activePlayerIndex];
    const selectedSlot = this.getSelectedVisibleSlot();
    const selectedCard = selectedSlot ? getCard(selectedSlot.cardId) : null;
    const selectedPayment = selectedCard ? evaluateConstructionCost(this.state, this.state.currentPlayer, selectedCard, "card") : null;
    const activeTheme = getPlayerTheme(this.state, activePlayerIndex);
    const classicMode = isClassicMode(this.state);
    const activePlayerView = currentPlayer ? this.getPlayerView(activePlayerIndex) : null;
    const activeOpponentIndex = 1 - activePlayerIndex;
    const opponentView = this.state.players[activeOpponentIndex] ? this.getPlayerView(activeOpponentIndex) : null;
    const playerViewForPanels = activePlayerView ?? null;

    const turnSummary = activePlayerView ? scorePlayer(this.state, activePlayerIndex) : { total: 0 };

    return {
      started: true,
      phase: this.state.phase,
      phaseLabel: this.getPhaseLabel(),
      mode: this.state.mode,
      theme: {
        background: activeTheme.background,
        panel: activeTheme.panel,
        accent: activeTheme.accent,
      },
      ageLabel: this.state.phase === "setup"
        ? classicMode
          ? "Wonder Draft"
          : "Mythology Setup"
        : this.state.age
          ? AGE_LAYOUTS[this.state.age].name
          : classicMode
            ? "Classical Build"
            : "Ritual Setup",
      turnNumber: this.state.turnNumber,
      currentPlayer: currentPlayer
        ? {
            name: currentPlayer.name,
            mythology: currentPlayer.mythologyId || currentPlayer.colorId ? activeTheme.name : "Unchosen",
            unbuiltGods: this.getUnbuiltSpecials(activePlayerIndex),
            specialLabel: classicMode ? "Wonders" : "Cults",
          }
        : null,
      remainingCards: this.state.ageStructure ? this.state.ageStructure.slots.filter((slot) => !slot.removed).length : 0,
      banner: this.getBannerText(),
      summoning: this.getSummoningView(),
      availableProgress: this.state.availableProgressIds.map((id) => getProgress(id)),
      structureHint: classicMode
        ? "Build, discard, or attach this card to one of your drafted wonders."
        : "Build, discard, or offer the card to one of your available gods. Gods unlock after you have built 1, 2, 4, then 6 buildings.",
      selectionHint: selectedCard ? `${getCardDisplayName(selectedCard, this.state)} selected` : "Select an accessible card.",
      slots: this.getSlotView(),
      actionSummary: this.getActionSummary(selectedCard, selectedPayment),
      selectedCard: selectedCard
        ? {
            id: selectedCard.id,
            name: getCardDisplayName(selectedCard, this.state),
            canBuild: selectedPayment.canAfford,
            buildCostLabel: selectedPayment.label,
            costResources: serializeResourceCost(selectedCard.resourceCost),
            producedResources: serializeProduction(selectedCard),
            coinCost: selectedCard.coinCost ?? 0,
            points: selectedCard.points ?? 0,
            discardIncome: 2 + getBuiltCards(currentPlayer).filter((card) => card.type === "commerce").length,
            requiresTrade: selectedPayment.tradeCost > 0,
            tradeCost: selectedPayment.tradeCost,
            tradeSummary: formatTradeNeedsSummary(selectedPayment.tradeNeeds, this.state.mode),
          }
        : null,
      cultMode: this.state.cultMode,
      turnResourcePanel: currentPlayer
        ? {
            name: currentPlayer.name,
            resources: playerViewForPanels.resources,
            coinCount: currentPlayer.coins,
            victoryPoints: turnSummary.total,
            diplomacyPoints: turnSummary.total,
            militaryPoints: classicMode ? getMilitaryEndgamePoints(this.state, activePlayerIndex) : currentPlayer.summoningWins,
            scienceSymbols: Object.entries(getScienceCounts(currentPlayer))
              .filter(([, count]) => count > 0)
              .map(([symbol, count]) => ({ symbol, count })),
            builtGods: playerViewForPanels.gods.filter((god) => god.built),
            groupedCards: Object.values(
              playerViewForPanels.builtCards.reduce((groups, card) => {
                if (!groups[card.typeClass]) {
                  groups[card.typeClass] = {
                    id: card.typeClass,
                    typeClass: card.typeClass,
                    typeLabel: card.typeLabel,
                    count: 0,
                    cards: [],
                  };
                }
                groups[card.typeClass].count += 1;
                groups[card.typeClass].cards.push(card);
                return groups;
              }, {}),
            ),
            imageMode: this.state.mode,
          }
        : null,
      opponentScorePanel: this.state.players[activeOpponentIndex]
        ? {
            name: this.state.players[activeOpponentIndex].name,
            victoryPoints: (opponentView ? opponentView.stats.find((entry) => entry.label === "Score Preview")?.value : 0) ?? scorePlayer(this.state, activeOpponentIndex).total,
            coins: this.state.players[activeOpponentIndex].coins,
            summoningWins: classicMode
              ? getMilitaryEndgamePoints(this.state, activeOpponentIndex)
              : this.state.players[activeOpponentIndex].summoningWins,
            science: getUniqueScienceCount(this.state.players[activeOpponentIndex]),
          }
        : null,
      players: this.state.players.map((_, index) => this.getPlayerView(index)),
      log: this.state.log.slice(0, 12),
      choiceModal: buildChoiceView(this.state, this.state.choice),
      winnerSummary: this.state.winner ? this.state.players.map((_, index) => getScoreBreakdown(this.state, index)) : null,
      resourceAnimation: this.state.animationCue,
      winner: this.state.winner,
    };
  }
}
