import { DuelGame, getRulesReference } from "./game/engine.js";

const appRoot = document.querySelector("#app");
const game = new DuelGame();

const uiState = {
  openMenu: null,
  openRulesMode: "mythical",
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
