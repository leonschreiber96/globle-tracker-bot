import GlobleBot from "./bot.js";
import GameSolver from "./gameSolver.js";
import CONFIG from "./appConfig.js";
import { CircleSolvingStrategy, RandomSolvingStrategy } from "./solving.js";
import countryData from "../data/minimizedCountries.json" with { type: "json" };
import CountryInfo from "./countryInfo.js";

import { minimumBoundingCircle, Point } from "./geo.js";
import lux from "../afghanistan.json" with { type: "json" };
const points = lux.minimizedPoints.map(p => ({ x: p.lat, y: p.lng }));
const circle = minimumBoundingCircle(points);

console.log(`Center: (${circle?.center.x}, ${circle?.center.y}), Radius: ${circle?.radius} km`);


if (!CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.SHEET_ID || !CONFIG.ADMIN_CHAT_ID) {
   console.error("Missing environment variables. Please make sure you have TELEGRAM_BOT_TOKEN, SHEET_ID and ADMIN_CHAT_ID set in your .env file.");
   process.exit(1);
}

// const bot = new GlobleBot(CONFIG.TELEGRAM_BOT_TOKEN, CONFIG.ADMIN_CHAT_ID);
// bot.start();

// while console.readkey() != "q", play
while (true) {
   const solver = new GameSolver(countryData as CountryInfo[]);
   const strategy = new CircleSolvingStrategy();
   await solver.launchBrowser("globle", true);
   await solver.solve(strategy);
   await solver.closeBrowser();

// Wait for a keypress to continue
   console.log('Press any key to continue or "q" to quit');
   const key = await new Promise(resolve => process.stdin.once('data', data => resolve(data.toString().trim())));
   if (key === "q") {
      break;
   }
}
