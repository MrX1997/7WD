export const RESOURCE_ORDER = ["wood", "clay", "stone", "glass", "papyrus"];
export const RESOURCE_LABELS = {
  wood: "Sacred Timber",
  clay: "Primordial Clay",
  stone: "Ancient Stone",
  glass: "Crystal Relic",
  papyrus: "Sacred Scroll",
};

export const TYPE_META = {
  raw: { label: "Sacred Site", className: "raw" },
  manufactured: { label: "Artifact", className: "manufactured" },
  civilian: { label: "Temple", className: "civilian" },
  science: { label: "Mysticism", className: "science" },
  commerce: { label: "Pilgrimage", className: "commerce" },
  summoning: { label: "Invocation Circle", className: "summoning" },
  guild: { label: "Divine Order", className: "guild" },
};

export const SCIENCE_SYMBOLS = ["tablet", "gear", "wheel", "triangle", "quill", "sundial", "astrolabe"];

export const MYTHOLOGIES = [
  {
    id: "greek",
    name: "Greek",
    summary: "Sapphire-lit rites and precise divine favor.",
    background: "radial-gradient(circle at top, #dff4ff 0%, #72bdf0 42%, #0f4f8f 100%)",
    panel: "#d6efff",
    accent: "#1171cf",
    image: "greek.png",
    gods: ["artemis", "apollo", "athena"],
    randomPair: ["zeus", "hera"],
  },
  {
    id: "nordic",
    name: "Nordic",
    summary: "Ruby runes, fierce vows, and storm-forged omens.",
    background: "radial-gradient(circle at top, #ffe3ea 0%, #d85d79 44%, #7f1136 100%)",
    panel: "#ffe0e8",
    accent: "#c02153",
    image: "nordics.png",
    gods: ["balder", "tyr", "odin"],
    randomPair: ["loki", "thor"],
  },
  {
    id: "americas",
    name: "Americas",
    summary: "Emerald ceremony, storm spirits, and living abundance.",
    background: "radial-gradient(circle at top, #ddfff2 0%, #58d69f 44%, #0d7f5b 100%)",
    panel: "#dcfff0",
    accent: "#11a46e",
    image: "ameri.png",
    gods: ["huracan", "bochica", "great-spirit"],
    randomPair: ["quetzalcoatl", "inti"],
  },
  {
    id: "mesopotamia",
    name: "Mesopotamia",
    summary: "Golden river wisdom, royal rites, and sky-bound authority.",
    background: "radial-gradient(circle at top, #fff4cf 0%, #e1bf4f 44%, #9b6e08 100%)",
    panel: "#fff1c7",
    accent: "#d8a419",
    image: "meso.png",
    gods: ["enki", "enlil", "marduk", "anu"],
  },
];

export const CLASSIC_PLAYER_COLORS = [
  {
    id: "blue",
    name: "Blue",
    summary: "A cool civic palette for a classic city tableau.",
    background: "linear-gradient(135deg, #e2edf6 0%, #6fb4d9 42%, #2c6689 100%)",
    panel: "#d4e9f7",
    accent: "#2d77a4",
  },
  {
    id: "red",
    name: "Red",
    summary: "A bold military palette for an aggressive classic table.",
    background: "linear-gradient(135deg, #f6ded5 0%, #cd6a4f 40%, #7f2f1a 100%)",
    panel: "#f7ded4",
    accent: "#9a2c1b",
  },
  {
    id: "green",
    name: "Green",
    summary: "A balanced classic palette with an earthy strategic feel.",
    background: "linear-gradient(135deg, #dff2de 0%, #3f965b 42%, #1f6e3f 100%)",
    panel: "#d7ecdb",
    accent: "#2b8352",
  },
  {
    id: "purple",
    name: "Purple",
    summary: "A regal classic palette for a more scholarly city theme.",
    background: "linear-gradient(135deg, #f1e3fa 0%, #8d5bbd 42%, #5a2f87 100%)",
    panel: "#eddff7",
    accent: "#6d41a3",
  },
];

export const CLASSIC_PLAYER_COLOR_BY_ID = Object.fromEntries(CLASSIC_PLAYER_COLORS.map((entry) => [entry.id, entry]));

export const MYTHOLOGIES_BY_ID = Object.fromEntries(MYTHOLOGIES.map((entry) => [entry.id, entry]));

export const AGE_LAYOUTS = {
  1: {
    name: "Age I",
    coverage: "bottom-up",
    rows: [
      { count: 2, faceUp: true },
      { count: 3, faceUp: false },
      { count: 4, faceUp: true },
      { count: 5, faceUp: false },
      { count: 6, faceUp: true },
    ],
  },
  2: {
    name: "Age II",
    coverage: "bottom-up",
    rows: [
      { count: 6, faceUp: true },
      { count: 5, faceUp: false },
      { count: 4, faceUp: true },
      { count: 3, faceUp: false },
      { count: 2, faceUp: true },
    ],
  },
  3: {
    name: "Age III",
    coverage: "bottom-up",
    rows: [
      { count: 2, faceUp: true },
      { count: 3, faceUp: false },
      { count: 4, faceUp: true },
      { count: 2, faceUp: false },
      { count: 4, faceUp: true },
      { count: 3, faceUp: false },
      { count: 2, faceUp: true },
    ],
  },
};

function makeCard(id, name, age, type, config = {}) {
  const summoning = config.summoning ?? config.shields ?? 0;
  return {
    id,
    name,
    age,
    type,
    coinCost: config.coinCost ?? 0,
    resourceCost: config.resourceCost ?? {},
    points: config.points ?? 0,
    summoning,
    shields: summoning,
    immediateCoins: config.immediateCoins ?? 0,
    produces: config.produces ?? null,
    producesChoice: config.producesChoice ?? null,
    tradeDiscount: config.tradeDiscount ?? null,
    scienceSymbol: config.scienceSymbol ?? null,
    chainFrom: config.chainFrom ?? [],
    chainTo: config.chainTo ?? [],
    yellowIncome: config.yellowIncome ?? null,
    guildEffect: config.guildEffect ?? null,
    description: config.description ?? "",
  };
}

function makeGod(id, mythology, name, cost, config = {}) {
  const summoning = config.summoning ?? 0;
  return {
    id,
    mythology,
    name,
    cost,
    points: config.points ?? 0,
    summoning,
    shields: summoning,
    immediateCoins: config.immediateCoins ?? 0,
    opponentCoinLoss: config.opponentCoinLoss ?? 0,
    destroys: config.destroys ?? null,
    producesChoice: config.producesChoice ?? null,
    progressFromDiscard: config.progressFromDiscard ?? false,
    buildFromDiscard: config.buildFromDiscard ?? false,
    activation: config.activation ?? null,
    description: config.description ?? "",
  };
}

function makeWonder(id, name, cost, config = {}) {
  return {
    id,
    name,
    cost,
    points: config.points ?? 0,
    shields: config.shields ?? 0,
    replay: config.replay ?? false,
    immediateCoins: config.immediateCoins ?? 0,
    opponentCoinLoss: config.opponentCoinLoss ?? 0,
    destroys: config.destroys ?? null,
    producesChoice: config.producesChoice ?? null,
    progressFromDiscard: config.progressFromDiscard ?? false,
    buildFromDiscard: config.buildFromDiscard ?? false,
    description: config.description ?? "",
    image: config.image ?? `${id}.png`,
  };
}

function makeProgress(id, name, config) {
  return {
    id,
    name,
    summary: config.summary,
    points: config.points ?? 0,
    scienceSymbol: config.scienceSymbol ?? null,
    immediateCoins: config.immediateCoins ?? 0,
    effect: config.effect ?? null,
  };
}

export const AGE_ONE_CARDS = [
  makeCard("lumber-yard", "Grove of the Sacred Timber", 1, "raw", { produces: { wood: 1 }, description: "Produces 1 Sacred Timber." }),
  makeCard("logging-camp", "Forest Shrine of the Ancients", 1, "raw", { coinCost: 1, produces: { wood: 1 }, description: "Produces 1 Sacred Timber." }),
  makeCard("clay-pool", "Pool of Primordial Clay", 1, "raw", { produces: { clay: 1 }, description: "Produces 1 Primordial Clay." }),
  makeCard("clay-pit", "Clay Shrine of the Earth Mother", 1, "raw", { coinCost: 1, produces: { clay: 1 }, description: "Produces 1 Primordial Clay." }),
  makeCard("quarry", "Quarry of the Earth Spirits", 1, "raw", { produces: { stone: 1 }, description: "Produces 1 Ancient Stone." }),
  makeCard("stone-pit", "Stone Shrine of the Titans", 1, "raw", { coinCost: 1, produces: { stone: 1 }, description: "Produces 1 Ancient Stone." }),
  makeCard("glassworks", "Crucible of Crystal Souls", 1, "manufactured", { coinCost: 1, produces: { glass: 1 }, description: "Produces 1 Crystal Relic." }),
  makeCard("press", "Relic Press of the Sacred Oils", 1, "manufactured", { coinCost: 1, produces: { papyrus: 1 }, description: "Produces 1 Sacred Scroll." }),
  makeCard("guard-tower", "Circle of Watchful Spirits", 1, "summoning", { summoning: 1, description: "Gain 1 summoning power this Age." }),
  makeCard("stable", "Circle of the Thunder Steeds", 1, "summoning", { resourceCost: { wood: 1 }, summoning: 1, chainTo: ["horse-breeders"], description: "Gain 1 summoning power this Age." }),
  makeCard("garrison", "Circle of the Iron Legion", 1, "summoning", { resourceCost: { clay: 1 }, summoning: 1, chainTo: ["barracks"], description: "Gain 1 summoning power this Age." }),
  makeCard("palisade", "Circle of the Bone Barrier", 1, "summoning", { coinCost: 2, summoning: 1, chainTo: ["fortifications"], description: "Gain 1 summoning power this Age." }),
  makeCard("workshop", "Rune-Forging Sanctum", 1, "science", { points: 1, scienceSymbol: "triangle", chainTo: ["laboratory"], description: "1 VP and a mystic sigil." }),
  makeCard("apothecary", "Elixir of the Hidden Veil", 1, "science", { points: 1, scienceSymbol: "wheel", chainTo: ["school"], description: "1 VP and a mystic sigil." }),
  makeCard("scriptorium", "Codex of the Ancient Mystics", 1, "science", { coinCost: 2, points: 1, scienceSymbol: "tablet", chainTo: ["library"], description: "1 VP and a mystic sigil." }),
  makeCard("pharmacist", "Keeper of the Serpent Elixir", 1, "science", { coinCost: 2, points: 1, scienceSymbol: "gear", chainTo: ["dispensary"], description: "1 VP and a mystic sigil." }),
  makeCard("theater", "Temple of Prophecy", 1, "civilian", { points: 3, chainTo: ["statue"], description: "Worth 3 victory points." }),
  makeCard("altar", "Temple of First Blood", 1, "civilian", { points: 3, chainTo: ["temple"], description: "Worth 3 victory points." }),
  makeCard("baths", "Sacred Bath of Renewal", 1, "civilian", { resourceCost: { stone: 1 }, points: 3, chainTo: ["aqueduct"], description: "Worth 3 victory points." }),
  makeCard("tavern", "Pilgrim's Hall of Revelry", 1, "commerce", { immediateCoins: 4, description: "Gain 4 coins from pilgrimage." }),
  makeCard("stone-reserve", "Vault of Living Stone", 1, "commerce", { coinCost: 3, tradeDiscount: ["stone"], description: "Buy Ancient Stone for 1 coin each." }),
  makeCard("clay-reserve", "Vault of Sacred Clay", 1, "commerce", { coinCost: 3, tradeDiscount: ["clay"], description: "Buy Primordial Clay for 1 coin each." }),
  makeCard("wood-reserve", "Sacred Timber Vault", 1, "commerce", { coinCost: 3, tradeDiscount: ["wood"], description: "Buy Sacred Timber for 1 coin each." }),
];

export const AGE_TWO_CARDS = [
  makeCard("sawmill", "Mill of the World Tree", 2, "raw", { coinCost: 2, produces: { wood: 2 }, description: "Produces 2 Sacred Timber." }),
  makeCard("brickyard", "Kiln of the Eternal Builders", 2, "raw", { coinCost: 2, produces: { clay: 2 }, description: "Produces 2 Primordial Clay." }),
  makeCard("shelf-quarry", "Cliff of the Stone Ancestors", 2, "raw", { coinCost: 2, produces: { stone: 2 }, description: "Produces 2 Ancient Stone." }),
  makeCard("glass-blower", "Artisan of Spirit Glass", 2, "manufactured", { produces: { glass: 1 }, description: "Produces 1 Crystal Relic." }),
  makeCard("drying-room", "Chamber of Preserved Relics", 2, "manufactured", { produces: { papyrus: 1 }, description: "Produces 1 Sacred Scroll." }),
  makeCard("walls", "Invocation of the Titan Wall", 2, "summoning", { resourceCost: { stone: 3 }, summoning: 2, description: "Gain 2 summoning power this Age." }),
  makeCard("horse-breeders", "Circle of the War Beasts", 2, "summoning", { resourceCost: { clay: 1, wood: 1 }, summoning: 1, chainFrom: ["stable"], chainTo: ["circus"], description: "Gain 1 summoning power this Age." }),
  makeCard("barracks", "Circle of the Warbound", 2, "summoning", { coinCost: 3, summoning: 1, chainFrom: ["garrison"], description: "Gain 1 summoning power this Age." }),
  makeCard("archery-range", "Circle of the Sky Hunters", 2, "summoning", { resourceCost: { stone: 1, wood: 1, papyrus: 1 }, summoning: 2, chainTo: ["siege-workshop"], description: "Gain 2 summoning power this Age." }),
  makeCard("parade-ground", "Circle of the Marching Spirits", 2, "summoning", { resourceCost: { clay: 1, wood: 1, glass: 1 }, summoning: 2, chainTo: ["circus"], description: "Gain 2 summoning power this Age." }),
  makeCard("library", "Library of Lost Gods", 2, "science", { resourceCost: { stone: 1, wood: 1, glass: 1 }, points: 2, scienceSymbol: "tablet", chainFrom: ["scriptorium"], description: "2 VP and a mystic sigil." }),
  makeCard("dispensary", "Sanctuary of Sacred Remedies", 2, "science", { resourceCost: { clay: 2, stone: 1 }, points: 2, scienceSymbol: "gear", chainFrom: ["pharmacist"], description: "2 VP and a mystic sigil." }),
  makeCard("school", "Academy of Hidden Truths", 2, "science", { resourceCost: { wood: 1, papyrus: 1 }, points: 1, scienceSymbol: "quill", chainFrom: ["apothecary"], chainTo: ["study"], description: "1 VP and a mystic sigil." }),
  makeCard("laboratory", "Alchemist's Forbidden Forge", 2, "science", { resourceCost: { clay: 1, glass: 1 }, points: 1, scienceSymbol: "triangle", chainFrom: ["workshop"], chainTo: ["observatory"], description: "1 VP and a mystic sigil." }),
  makeCard("forum", "Pilgrim Market of the Ancients", 2, "commerce", { resourceCost: { clay: 2 }, producesChoice: ["glass", "papyrus"], description: "Produce either 1 Crystal Relic or 1 Sacred Scroll." }),
  makeCard("caravansery", "Caravan of the Sacred Path", 2, "commerce", { coinCost: 2, resourceCost: { glass: 1, papyrus: 1 }, producesChoice: ["wood", "clay", "stone"], description: "Produce either Sacred Timber, Primordial Clay, or Ancient Stone." }),
  makeCard("customs-house", "Gate of Tribute", 2, "commerce", { resourceCost: { wood: 1, papyrus: 1 }, tradeDiscount: ["glass", "papyrus"], description: "Buy Ritual Components for 1 coin each." }),
  makeCard("brewery", "Mead Hall of the Storm Gods", 2, "commerce", { immediateCoins: 6, description: "Gain 6 coins from pilgrimage." }),
  makeCard("tribunal", "Judgement of the Ancestors", 2, "civilian", { resourceCost: { wood: 2, glass: 1 }, points: 5, chainTo: ["courthouse"], description: "Worth 5 victory points." }),
  makeCard("statue", "Idol of the Ascended One", 2, "civilian", { resourceCost: { clay: 2 }, points: 4, chainFrom: ["theater"], chainTo: ["gardens"], description: "Worth 4 victory points." }),
  makeCard("temple", "Sanctum of the Eternal Flame", 2, "civilian", { resourceCost: { wood: 1, clay: 1, glass: 1 }, points: 4, chainFrom: ["altar"], chainTo: ["pantheon"], description: "Worth 4 victory points." }),
  makeCard("aqueduct", "Aqueduct of Celestial Waters", 2, "civilian", { resourceCost: { stone: 3 }, points: 5, chainFrom: ["baths"], description: "Worth 5 victory points." }),
  makeCard("rostrum", "Oracle's Tribunal", 2, "civilian", { resourceCost: { stone: 1, wood: 1 }, points: 4, chainTo: ["senate"], description: "Worth 4 victory points." }),
];

export const AGE_THREE_CARDS = [
  makeCard("arsenal", "Circle of the Endless Armory", 3, "summoning", { resourceCost: { wood: 2, clay: 1, glass: 1 }, summoning: 3, description: "Gain 3 summoning power this Age." }),
  makeCard("fortifications", "Circle of the Unbreakable Gate", 3, "summoning", { resourceCost: { stone: 2, clay: 1, papyrus: 1 }, summoning: 3, chainFrom: ["palisade"], description: "Gain 3 summoning power this Age." }),
  makeCard("siege-workshop", "Circle of Cataclysm", 3, "summoning", { resourceCost: { wood: 2, clay: 1, glass: 1 }, summoning: 3, chainFrom: ["archery-range"], description: "Gain 3 summoning power this Age." }),
  makeCard("circus", "Arena of the Celestial Trials", 3, "summoning", { resourceCost: { stone: 2, clay: 1 }, summoning: 3, chainFrom: ["horse-breeders", "parade-ground"], description: "Gain 3 summoning power this Age." }),
  makeCard("academy", "Tower of Arcane Mastery", 3, "science", { resourceCost: { stone: 1, wood: 1, glass: 1 }, points: 3, scienceSymbol: "sundial", description: "3 VP and a mystic sigil." }),
  makeCard("study", "Chamber of Forbidden Scrolls", 3, "science", { resourceCost: { wood: 2, papyrus: 1 }, points: 3, scienceSymbol: "quill", chainFrom: ["school"], description: "3 VP and a mystic sigil." }),
  makeCard("university", "Citadel of Divine Knowledge", 3, "science", { resourceCost: { wood: 1, glass: 1, papyrus: 1 }, points: 2, scienceSymbol: "wheel", chainFrom: ["library"], description: "2 VP and a mystic sigil." }),
  makeCard("observatory", "Celestial Watchtower", 3, "science", { resourceCost: { stone: 1, glass: 1, papyrus: 1 }, points: 2, scienceSymbol: "astrolabe", chainFrom: ["laboratory"], description: "2 VP and a mystic sigil." }),
  makeCard("chamber-of-commerce", "Chamber of Divine Tribute", 3, "commerce", { coinCost: 3, points: 3, yellowIncome: { source: "self", colors: ["manufactured"], amount: 3 }, description: "Gain 3 coins per Artifact in your domain and score 3 VP." }),
  makeCard("port", "Harbor of Sacred Voyages", 3, "commerce", { coinCost: 2, points: 3, yellowIncome: { source: "self", colors: ["raw"], amount: 2 }, description: "Gain 2 coins per Sacred Site in your domain and score 3 VP." }),
  makeCard("armory", "Circle of Forged Blades", 3, "commerce", { coinCost: 1, points: 3, yellowIncome: { source: "self", colors: ["summoning"], amount: 1 }, description: "Gain 1 coin per Invocation Circle in your domain and score 3 VP." }),
  makeCard("lighthouse", "Beacon of the Guiding Star", 3, "commerce", { resourceCost: { clay: 1, stone: 1 }, points: 3, yellowIncome: { source: "selfIncludingCard", colors: ["commerce"], amount: 1 }, description: "Gain 1 coin per Pilgrimage card in your domain and score 3 VP." }),
  makeCard("arena", "Pilgrimage Arena of Glory", 3, "commerce", { resourceCost: { clay: 1, stone: 1, wood: 1 }, points: 3, yellowIncome: { source: "gods", amount: 2 }, description: "Gain 2 coins per completed cult and score 3 VP." }),
  makeCard("courthouse", "Temple of Sacred Judgment", 3, "civilian", { resourceCost: { clay: 1, wood: 1, glass: 1 }, points: 8, chainFrom: ["tribunal"], description: "Worth 8 victory points." }),
  makeCard("palace", "Throne of the High Gods", 3, "civilian", { resourceCost: { clay: 1, stone: 1, wood: 1, glass: 1, papyrus: 1 }, points: 7, description: "Worth 7 victory points." }),
  makeCard("town-hall", "Council of the Sacred Throne", 3, "civilian", { resourceCost: { stone: 2, clay: 2, wood: 1 }, points: 7, description: "Worth 7 victory points." }),
  makeCard("obelisk", "Obelisk of the Fallen Sky", 3, "civilian", { resourceCost: { stone: 2, glass: 1 }, points: 5, description: "Worth 5 victory points." }),
  makeCard("gardens", "Garden of the Eternal Grove", 3, "civilian", { resourceCost: { clay: 2, wood: 1 }, points: 6, chainFrom: ["statue"], description: "Worth 6 victory points." }),
  makeCard("pantheon", "Hall of the Thousand Gods", 3, "civilian", { resourceCost: { clay: 1, stone: 1, wood: 1, glass: 1, papyrus: 1 }, points: 6, chainFrom: ["temple"], description: "Worth 6 victory points." }),
  makeCard("senate", "Chamber of Divine Law", 3, "civilian", { resourceCost: { clay: 1, wood: 2, papyrus: 1 }, points: 5, chainFrom: ["rostrum"], description: "Worth 5 victory points." }),
];

export const GUILD_CARDS = [
  makeCard("merchants-guild", "Covenant of Golden Pilgrims", 3, "guild", { resourceCost: { clay: 1, stone: 1, wood: 1, glass: 1 }, guildEffect: { type: "coinsAndPointsByColor", colors: ["commerce"], amount: 1 }, description: "Coins and VP equal to the highest Pilgrimage count in one domain." }),
  makeCard("shipowners-guild", "Brotherhood of Ocean Prophets", 3, "guild", { resourceCost: { clay: 1, stone: 1, glass: 1, papyrus: 1 }, guildEffect: { type: "coinsAndPointsByColor", colors: ["raw", "manufactured"], amount: 1 }, description: "Coins and VP equal to the highest Sacred Site plus Artifact count in one domain." }),
  makeCard("builders-guild", "Order of the World Architects", 3, "guild", { resourceCost: { stone: 2, clay: 1, wood: 1, glass: 1 }, guildEffect: { type: "pointsByGodMajority", amount: 2 }, description: "2 VP per completed cult in the domain with the most completed cults." }),
  makeCard("magistrates-guild", "Tribunal of the Sacred Law", 3, "guild", { resourceCost: { wood: 1, stone: 1, clay: 1, papyrus: 1 }, guildEffect: { type: "coinsAndPointsByColor", colors: ["civilian"], amount: 1 }, description: "Coins and VP equal to the highest Temple count in one domain." }),
  makeCard("scientists-guild", "Conclave of the Hidden Truth", 3, "guild", { resourceCost: { clay: 2, wood: 1, glass: 1 }, guildEffect: { type: "coinsAndPointsByColor", colors: ["science"], amount: 1 }, description: "Coins and VP equal to the highest Mysticism count in one domain." }),
  makeCard("moneylenders-guild", "Covenant of the Coin Oracles", 3, "guild", { resourceCost: { stone: 2, wood: 1, papyrus: 1 }, guildEffect: { type: "pointsByRichestSets", amount: 1 }, description: "1 VP per complete set of 3 coins in the richest domain." }),
  makeCard("tacticians-guild", "War Council of the Summoners", 3, "guild", { resourceCost: { stone: 2, clay: 1, glass: 1 }, guildEffect: { type: "coinsAndPointsByColor", colors: ["summoning"], amount: 1 }, description: "Coins and VP equal to the highest Invocation Circle count in one domain." }),
];

export const GODS = [
  makeGod("artemis", "greek", "Artemis", { wood: 2, glass: 1 }, {
    points: 3,
    activation: { type: "gainChosenResource" },
    description: "Choose 1 resource and add it permanently to your cult domain.",
  }),
  makeGod("apollo", "greek", "Apollo", { wood: 2, stone: 1, papyrus: 1 }, {
    points: 3,
    activation: { type: "gainCoins", amount: 5 },
    description: "Gain 5 coins.",
  }),
  makeGod("athena", "greek", "Athena", { clay: 2, glass: 1, papyrus: 1 }, {
    points: 4,
    activation: { type: "gainProgress" },
    description: "Claim 1 visible progress token.",
  }),
  makeGod("zeus", "greek", "Zeus", { clay: 3, glass: 1 }, {
    points: 3,
    activation: { type: "destroyBuildings", count: 2 },
    description: "Destroy 2 rival buildings.",
  }),
  makeGod("hera", "greek", "Hera", { stone: 3, glass: 1 }, {
    points: 3,
    activation: { type: "stealBuilding" },
    description: "Steal 1 rival building.",
  }),
  makeGod("balder", "nordic", "Balder", { wood: 2, clay: 1, glass: 1 }, {
    points: 4,
    activation: { type: "gainBlessingPoints", amount: 4 },
    description: "Gain 4 blessing points for endgame scoring.",
  }),
  makeGod("tyr", "nordic", "Tyr", { stone: 2, wood: 1, papyrus: 1 }, {
    points: 2,
    activation: { type: "nextAgeSummoning", amount: 2 },
    description: "Gain +2 summoning at the next Age ritual.",
  }),
  makeGod("odin", "nordic", "Odin", { stone: 2, glass: 1, papyrus: 1 }, {
    points: 3,
    activation: { type: "gainProgressOrCoins", amount: 3 },
    description: "Claim 1 visible progress token, or gain 3 coins if none remain.",
  }),
  makeGod("loki", "nordic", "Loki", { clay: 2, papyrus: 1 }, {
    points: 2,
    activation: { type: "stealCoins", amount: 4 },
    description: "Steal up to 4 coins from your rival.",
  }),
  makeGod("thor", "nordic", "Thor", { clay: 2, stone: 1, glass: 1 }, {
    points: 3,
    activation: { type: "destroyBuildings", count: 1, gainCoins: 2 },
    description: "Destroy 1 rival building and gain 2 coins.",
  }),
  makeGod("huracan", "americas", "Huracan", { clay: 2, stone: 2, papyrus: 1 }, {
    points: 3,
    activation: { type: "destroyBuildings", count: 1, coinLoss: 3 },
    description: "Destroy 1 rival building and make your rival lose 3 coins.",
  }),
  makeGod("bochica", "americas", "Bochica", { wood: 2, glass: 1, papyrus: 1 }, {
    points: 3,
    activation: { type: "gainProgressOrPoints", points: 3 },
    description: "Claim 1 visible progress token, or gain 3 blessing points if none remain.",
  }),
  makeGod("great-spirit", "americas", "Great Spirit", { stone: 2, clay: 1, wood: 1 }, {
    points: 4,
    activation: { type: "gainChosenResourceAndCoins", coins: 2 },
    description: "Choose 1 resource and add it permanently; also gain 2 coins.",
  }),
  makeGod("quetzalcoatl", "americas", "Quetzalcoatl", { clay: 2, glass: 1, papyrus: 1 }, {
    points: 2,
    activation: { type: "buildFromDiscard" },
    description: "Build 1 discarded card for free.",
  }),
  makeGod("inti", "americas", "Inti", { wood: 2, stone: 1, papyrus: 1 }, {
    points: 3,
    activation: { type: "gainCoins", amount: 8 },
    description: "Gain 8 coins.",
  }),
  makeGod("enki", "mesopotamia", "Enki", { stone: 2, wood: 1, papyrus: 1 }, {
    points: 3,
    activation: { type: "gainChosenResource" },
    description: "Choose 1 resource and add it permanently to your cult domain.",
  }),
  makeGod("enlil", "mesopotamia", "Enlil", { stone: 3, glass: 1 }, {
    points: 3,
    activation: { type: "destroyBuildings", count: 1, coinLoss: 2 },
    description: "Destroy 1 rival building and make your rival lose 2 coins.",
  }),
  makeGod("marduk", "mesopotamia", "Marduk", { clay: 3, glass: 1 }, {
    points: 4,
    activation: { type: "gainCoinsAndPoints", coins: 4, points: 2 },
    description: "Gain 4 coins and 2 blessing points.",
  }),
  makeGod("anu", "mesopotamia", "Anu", { wood: 2, clay: 1, papyrus: 2 }, {
    points: 5,
    activation: { type: "gainProgressAndCoins", coins: 2 },
    description: "Claim 1 visible progress token and gain 2 coins.",
  }),
];

export const GODS_BY_ID = Object.fromEntries(GODS.map((god) => [god.id, god]));
export const CLASSIC_WONDERS = [
  makeWonder("appian-way", "The Appian Way", { clay: 2, stone: 2, papyrus: 1 }, { replay: true, immediateCoins: 3, opponentCoinLoss: 3, points: 3, image: "appian_way.png", description: "Gain 3 coins, make your opponent lose 3 coins, then play again." }),
  makeWonder("circus-maximus", "Circus Maximus", { stone: 3, glass: 1 }, { shields: 1, destroys: "manufactured", points: 3, image: "circus_maximus.png", description: "Destroy one manufactured card in your opponent's city and gain 1 shield." }),
  makeWonder("colossus", "The Colossus", { clay: 3, glass: 1 }, { shields: 2, points: 3, image: "colossus.png", description: "Gain 2 shields." }),
  makeWonder("great-library", "The Great Library", { wood: 2, glass: 1, papyrus: 1 }, { progressFromDiscard: true, points: 4, image: "great_library.png", description: "Choose 1 of 3 set-aside progress tokens." }),
  makeWonder("great-lighthouse", "The Great Lighthouse", { stone: 2, clay: 1, wood: 1 }, { producesChoice: ["wood", "clay", "stone"], points: 4, image: "great_lighthouse.png", description: "Produce 1 raw resource of your choice each turn." }),
  makeWonder("hanging-gardens", "The Hanging Gardens", { wood: 2, glass: 1 }, { replay: true, immediateCoins: 6, points: 3, image: "hanging_gardens.png", description: "Gain 6 coins and play again." }),
  makeWonder("mausoleum", "The Mausoleum", { clay: 2, glass: 1, papyrus: 1 }, { buildFromDiscard: true, points: 2, image: "mausoleum.png", description: "Build 1 discarded card for free." }),
  makeWonder("piraeus", "Piraeus", { stone: 2, wood: 1, papyrus: 1 }, { replay: true, producesChoice: ["glass", "papyrus"], points: 2, image: "piraeus.png", description: "Produce 1 manufactured good of your choice and play again." }),
  makeWonder("pyramids", "The Pyramids", { stone: 3, clay: 2 }, { points: 9, image: "pyramids.png", description: "Worth 9 victory points." }),
  makeWonder("sphinx", "The Sphinx", { clay: 2, stone: 1, glass: 1 }, { replay: true, points: 6, image: "sphinx.png", description: "Play again." }),
  makeWonder("statue-of-zeus", "The Statue of Zeus", { wood: 2, clay: 1, papyrus: 2 }, { shields: 1, destroys: "raw", points: 3, image: "statue_of_zeus.png", description: "Destroy one raw card in your opponent's city and gain 1 shield." }),
  makeWonder("temple-of-artemis", "The Temple of Artemis", { wood: 2, stone: 1, papyrus: 1 }, { replay: true, immediateCoins: 12, points: 5, image: "temple_of_artemis.png", description: "Gain 12 coins and play again." }),
];

export const CLASSIC_WONDERS_BY_ID = Object.fromEntries(CLASSIC_WONDERS.map((wonder) => [wonder.id, wonder]));
export const WONDERS = GODS;
export const WONDERS_BY_ID = GODS_BY_ID;

export const PROGRESS_TOKENS = [
  makeProgress("agriculture", "Abundance", { immediateCoins: 6, points: 4, summary: "Immediately gain 6 coins and score 4 VP." }),
  makeProgress("architecture", "Sacred Architecture", { effect: "architecture", summary: "Your future cults cost 2 fewer resources of your choice." }),
  makeProgress("economy", "Tithe", { effect: "economy", summary: "Gain the coins your rival spends on trading resources." }),
  makeProgress("law", "Cosmic Law", { scienceSymbol: "astrolabe", summary: "Counts as a science sigil." }),
  makeProgress("masonry", "Master Stonecraft", { effect: "masonry", summary: "Your future cult halls cost 2 fewer resources of your choice." }),
  makeProgress("mathematics", "Star Reckoning", { effect: "mathematics", summary: "Score 3 VP per progress token you own at the end of the game." }),
  makeProgress("philosophy", "Mystic Philosophy", { points: 7, summary: "Worth 7 VP." }),
  makeProgress("strategy", "War Chant", { effect: "strategy", summary: "Your future summoning rites gain 1 extra summoning." }),
  makeProgress("theology", "Divine Zeal", { effect: "theology", summary: "Your future cult completions grant another turn." }),
  makeProgress("urbanism", "Sacred Urbanism", { effect: "urbanism", immediateCoins: 6, summary: "Gain 6 coins now and 4 coins whenever you build for free through chaining." }),
];

export const RULES_REFERENCE = [
  {
    title: "Goal",
    body: "Win immediately by science supremacy, or complete the third Age and score the most victory points in Chaos Duel.",
  },
  {
    title: "Turn Flow",
    list: [
      "Choose an accessible card from the shared Age structure.",
      "Build it, discard it for coins, or feed it into one of your available gods to complete that cult.",
      "Reveal any newly accessible face-down cards after your action resolves.",
    ],
  },
  {
    title: "Summoning",
    body: "Invocation Circles grant summoning only for the current Age. At the end of the Age, each player rolls 2 six-sided dice and adds their Age summoning. The higher total wins the ritual and activates each of their built gods once.",
  },
  {
    title: "Trading",
    body: "Missing resources can be bought from the bank. The normal price is 2 coins plus the amount of that resource your rival produces with Sacred Sites and Artifacts. Reserve pilgrimages can drop specific trade costs to 1.",
  },
  {
    title: "Science",
    body: "Each green card provides a science sigil. The second copy of a sigil immediately earns a visible progress token. Collect 6 different sigils to win on the spot.",
  },
  {
    title: "Gods",
    body: "Each player binds to one mythology and receives 4 gods from that pantheon. You may complete cults to those gods during play, but your 1st, 2nd, 3rd, and 4th god require 1, 2, 4, and 6 built structures respectively. Only 7 cults total can be completed across both players.",
  },
  {
    title: "Endgame",
    list: [
      "Score points from buildings, gods, guilds, progress, blessing effects, and every full set of 3 coins in your treasury.",
      "Summoning victories also grant endgame VP based on how many Ages you won ritually.",
      "Ties are broken by blue cult hall points. If those are also tied, the rivals share victory.",
    ],
  },
];

export const RULES_REFERENCE_CLASSIC = [
  {
    title: "Goal",
    body: "Win immediately by military supremacy or scientific supremacy, or finish Age III and score the most victory points.",
  },
  {
    title: "Turn Flow",
    list: [
      "Choose an accessible card from the shared Age structure.",
      "Build it, discard it for coins, or tuck it under one of your drafted wonders to build that wonder.",
      "Reveal any newly accessible face-down cards after your action resolves.",
    ],
  },
  {
    title: "Military",
    body: "Each shield advances the conflict pawn. Crossing key zones can trigger 2-coin and 5-coin looting. Reaching the enemy capital is immediate victory.",
  },
  {
    title: "Trading",
    body: "Missing resources can be bought from the bank. The normal price is 2 coins plus the amount of that resource your rival produces with raw and manufactured cards.",
  },
  {
    title: "Science",
    body: "Each science card provides a symbol. A second of the same symbol lets you claim a visible progress token. Collect 6 different symbols to win on the spot.",
  },
  {
    title: "Wonders",
    body: "Each player drafts 4 wonders. Only 7 wonders can be built during the game. When the seventh is built, the last unbuilt wonder is removed.",
  },
  {
    title: "Endgame",
    list: [
      "Score points from buildings, wonders, progress tokens, and every full set of 3 coins in your treasury.",
      "Military position scores 0, 2, 5, or 10 depending on pawn distance.",
      "Ties are broken by civilian points.",
    ],
  },
];

export const ALL_CARDS = [...AGE_ONE_CARDS, ...AGE_TWO_CARDS, ...AGE_THREE_CARDS, ...GUILD_CARDS];
export const ALL_CARDS_BY_ID = Object.fromEntries(ALL_CARDS.map((card) => [card.id, card]));
export const PROGRESS_BY_ID = Object.fromEntries(PROGRESS_TOKENS.map((token) => [token.id, token]));
