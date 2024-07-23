import puppeteer from 'puppeteer';
import countries from "../data/countries.json" with { type: "json"};

const invalidCountries = [
  "Senkakus",
  "Koualou",
  "Demchok",
  "Sanafir & Tiran Is.",
  "Kalapani",
  "Siachen-Saltoro",
  "Gaza Strip",
  "Antarctica",
  "Aksai Chin",
  "Falkland Islands (UK)",
  "No Man's Land",
  "Spratly Is",
  "Paracel Is"
];
const wronglyNamedCountriesMapping = {
  "Trinidad & Tobago": "Trinidad and Tobago",
  "St Vincent & the Grenadines": "St. Vin. and Gren.",
  "Micronesia, Fed States of": "Micronesia",
  "St Kitts & Nevis": "St. Kitts and Nevis",
  "Bahamas, The": "Bahamas",
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
  "Antigua & Barbuda": "Antigua and Barb.",
  "Korea, South": "South Korea",
  "Korea, North": "North Korea",
  "Gambia, The": "Gambia",
  "Sao Tome & Principe": "São Tomé and Príncipe",
};
type GameType = 'globle' | 'globleCapitals';

export default class GameSolver {
  private browser?: puppeteer.Browser;
  private page?: puppeteer.Page;
  private guesses: { country: string, closestBorder: number; }[] = [];
  private globleUrls: Record<GameType, string> = {
    globle: "https://globle-game.com/game",
    globleCapitals: "https://globle-capitals.com/game/",
  };

  async launchBrowser(game: GameType, headless = true) {
    this.browser = await puppeteer.launch({ headless: headless });
    this.page = await this.browser.newPage();
    await this.page.goto(this.globleUrls[game], { waitUntil: 'networkidle2' });
  }

  public async closeBrowser() {
    await this.browser?.close();
  }

  async solve() {
    if (!this.browser || !this.page) {
      console.error('Browser or page not initialized');
      return;
    }

    const solution = await this.playGame();
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

  private logGuess(country: string, closestBorder: number) {
    this.guesses.push({ country, closestBorder });
  }

  private shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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

  private async playGame() {
    for (const country of this.shuffleArray(countries)) {
      await this.guessCountry(country.name);
      const closestBorder = await this.getClosestBorder();
      if (closestBorder !== null) {
        const minimumBorderDist = Math.min(...this.guesses.map(g => g.closestBorder));
        if (closestBorder < minimumBorderDist) {
          console.log("Warmer! Guessed: ", country, " with closest border: ", closestBorder);
        }
        this.logGuess(country, closestBorder);
      } else {
        console.log(`Failed to get closest border for ${country}`);
      }
      const solution = await this.isSolutionFound();
      if (solution) {
        return country;
      }
    }
  }
}