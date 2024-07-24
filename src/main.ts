import GlobleBot from "./bot.js";
import GameSolver from "./gameSolver.js";
import CONFIG from "./appConfig.js";
import { CircleSolvingStrategy, RandomSolvingStrategy } from "./solving.js";
import countryData from "../data/minimizedCountries.json" with { type: "json" };
import CountryInfo from "./countryInfo.js";

if (!CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.SHEET_ID || !CONFIG.ADMIN_CHAT_ID) {
   console.error("Missing environment variables. Please make sure you have TELEGRAM_BOT_TOKEN, SHEET_ID and ADMIN_CHAT_ID set in your .env file.");
   process.exit(1);
}

// const bot = new GlobleBot(CONFIG.TELEGRAM_BOT_TOKEN, CONFIG.ADMIN_CHAT_ID);
// bot.start();
const strategy = new CircleSolvingStrategy();
const solver = new GameSolver(countryData as CountryInfo[]);
await solver.launchBrowser("globle", false);
await solver.solve(strategy);
await solver.closeBrowser();