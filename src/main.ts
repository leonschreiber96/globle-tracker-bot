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

const bot = new GlobleBot(CONFIG.TELEGRAM_BOT_TOKEN, CONFIG.ADMIN_CHAT_ID);
bot.start();

async function findSolution() {
   try {
      const solver = new GameSolver(countryData as CountryInfo[]);
      const strategy = new CircleSolvingStrategy();
      await solver.launchBrowser("globle", false);
      const solution = await solver.solve(strategy);
      await solver.closeBrowser();
      console.log(`Solution found after ${solution.guesses.length} guesses: ${solution.solution}`);
      return solution;
   } catch (error) {
      console.error("Failed to find solution", error);
      return null;
   }
}

// findSolution();

// while (true) {
//    while (!findSolution()) { 

//    }

// // Wait for a keypress to continue
//    console.log('Press any key to continue or "q" to quit');
//    const key = await new Promise(resolve => process.stdin.once('data', data => resolve(data.toString().trim())));
//    if (key === "q") {
//       break;
//    }
// }
