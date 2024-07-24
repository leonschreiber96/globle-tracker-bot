import puppeteer from 'puppeteer';
import CountryInfo from './countryInfo.js';
import { GameType, Guess, SolvingStrategy } from './solving.js';
import { Country } from './geo.js';

export default class GameSolver {
  private browser?: puppeteer.Browser;
  private page?: puppeteer.Page;
  private globleUrls: Record<GameType, string> = {
    globle: "https://globle-game.com/practice",
    globleCapitals: "https://globle-capitals.com/game/",
  };

  private guesses: Guess[] = [];
  private borders: CountryInfo[] = [];

  constructor(geoData: CountryInfo[]) {
    this.borders = geoData;
  }

  public async launchBrowser(game: GameType, headless = true) {
    this.browser = await puppeteer.launch({ headless: headless });
    this.page = await this.browser.newPage();
    await this.page.goto(this.globleUrls[game], { waitUntil: 'networkidle2' });
  }

  public async closeBrowser() {
    await this.browser?.close();
  }

  public async solve(strategy: SolvingStrategy) {
    if (!this.browser || !this.page) {
      console.error('Browser or page not initialized');
      return;
    }

    const solution = await this.playGame(strategy);
    console.log(`Solution found after ${this.guesses.length} guesses: ${solution}`);
  }

  private async guessCountry(country: string) {
    try {
      const countryInput = await this.page?.waitForSelector('input', { visible: true, timeout: 5000 });

      if (!countryInput) {
        console.error('Country input not found');
        return;
      }

      await countryInput.click({ clickCount: 3 }); // Select all text for easier replacement
      await countryInput.type(country);
      await this.page?.keyboard.press('Enter');
    } catch (error) {
      console.error(`Failed to input country: ${country}`, error);
    }
  }

  private async getClosestBorder() {
    try {
      // Wait for the span element to appear on the page
      const closestBorderElement = await this.page?.waitForSelector('span[data-i18n="Game8"]', { visible: true, timeout: 10000 });
      if (closestBorderElement) {
        const fullText = await this.page?.evaluate(el => el.parentElement?.innerText, closestBorderElement);

        if (!fullText) {
          console.error('Closest border text not found');
          return null;
        }

        const closestBorder = +fullText.split(':')[1].replaceAll(",", "").trim();
        return closestBorder;
      } else {
        console.error('Closest border element not found');
        return null;
      }
    } catch (error) {
      console.error('Failed to get closest border', error);
      return null;
    }
  }

  private logGuess(country: string, closestBorder: number | null) {
    if (this.guesses.some(g => g.closestBorder === closestBorder)) {
      this.guesses.push({ id: this.guesses.length, country, closestBorder: null });
    } else {
      this.guesses.push({ id: this.guesses.length, country, closestBorder });
    }
  }

  private async isSolutionFound() {
    try {
      // Check if there is a paragraph with the specific text indicating the solution is found
      const solutionElement = await this.page?.evaluate(() => {
        const paragraphs = Array.from(document.querySelectorAll('p'));
        return paragraphs.some(p => p.innerText.includes("The Mystery Country is"));
      });
      return solutionElement;
    } catch (error) {
      console.error('Failed to check for solution', error);
      return false;
    }
  }

  private async playGame(strategy: SolvingStrategy) {
    const initialGuess = strategy.initialGuess(this.borders);
    await this.guessCountry(initialGuess);
    const closestBorder = await this.getClosestBorder();
    this.logGuess(initialGuess, closestBorder);
    const solution = await this.isSolutionFound();

    if (solution) {
      return initialGuess;
    }

    console.log(`Guess 1: ${initialGuess}`);

    while (!solution) {
      const nextGuess = strategy.nextGuess(this.guesses, this.borders);
      await this.guessCountry(nextGuess);
      const closestBorder = await this.getClosestBorder();
      this.logGuess(nextGuess, closestBorder);
      const solution = await this.isSolutionFound();
      if (solution) {
        return nextGuess;
      }
    }
  }
}