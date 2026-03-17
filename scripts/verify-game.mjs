import { DuelGame } from "../src/game/engine.js";

function createRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function simulate(seed) {
  const random = createRandom(seed);
  const game = new DuelGame(random);
  game.reset();

  let guard = 1200;
  while (!game.state.winner && guard > 0) {
    guard -= 1;

    if (game.state.choice) {
      game.resolveChoice(game.state.choice.options[0]);
      continue;
    }

    if (game.state.phase !== "ageTurn") {
      continue;
    }

    const accessible = game.state.ageStructure.slots.filter((slot) => slot.accessible && !slot.hidden && !slot.removed);
    if (!accessible.length) {
      throw new Error(`No accessible cards found during Age ${game.state.age}.`);
    }

    const slot = accessible[Math.floor(random() * accessible.length)];
    game.selectCard(slot.id);

    const godOptions = game.state.players[game.state.currentPlayer].gods.filter((godState) => !godState.built && !godState.locked);
    const beforeTurn = game.state.turnNumber;

    if (godOptions.length && random() > 0.65) {
      game.buildGodWithSelectedCard(godOptions[0].id);
    }

    if (game.state.turnNumber === beforeTurn) {
      const view = game.getViewModel();
      if (view.selectedCard?.canBuild && random() > 0.3) {
        game.buildSelectedCard();
      } else {
        game.discardSelectedCard();
      }
    }
  }

  if (!game.state.winner) {
    throw new Error(`Simulation ${seed} did not finish before the guard limit.`);
  }

  return {
    seed,
    winner: game.state.winner.title,
    turns: game.state.turnNumber,
    age: game.state.age,
  };
}

const results = [1, 2, 3].map(simulate);
results.forEach((result) => {
  console.log(`seed=${result.seed} winner="${result.winner}" turns=${result.turns} finalAge=${result.age}`);
});
