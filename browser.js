const puppeteer = require('puppeteer');
const geodata = require("./geodata.json");

const invalidCountries = ["Senkakus",
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
  "Paracel Is"]
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

const allCountries = shuffleArray(geodata.features.map(x => x.properties.shapeName))
  .filter(c => !invalidCountries.includes(c))
  .map(c => wronglyNamedCountriesMapping[c] || c);

let browser = undefined;
let page = undefined;

const guesses = [];

async function inputCountry(country) {
  try {
    const countryInput = await page.waitForSelector('input', { visible: true, timeout: 5000 });
    await countryInput.click({ clickCount: 3 }); // Select all text for easier replacement
    await countryInput.type(country);
    await page.keyboard.press('Enter');
  } catch (error) {
    console.error(`Failed to input country: ${country}`, error);
  }
}

async function getClosestBorder() {
  try {
    // Wait for the span element to appear on the page
    const closestBorderElement = await page.waitForSelector('span[data-i18n="Game8"]', { visible: true, timeout: 10000 });
    if (closestBorderElement) {
      const fullText = await page.evaluate(el => el.parentElement.innerText, closestBorderElement);
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

function logGuess(country, closestBorder) {
  guesses.push({ country, closestBorder });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function isCountryNameValid() {
  try {
    // Check if there is a paragraph with the specific text indicating the solution is found
    const invalidCountryText = await page.evaluate(() => {
      const paragraphs = Array.from(document.querySelectorAll('p'));
      return !paragraphs.some(p => p.innerText.includes("Did you mean"));
    });
    return invalidCountryText;
  } catch (error) {
    console.error('Failed to check for country validity', error);
    return false;
  }
}

async function isSolutionFound() {
    try {
    // Check if there is a paragraph with the specific text indicating the solution is found
    const solutionElement = await page.evaluate(() => {
      const paragraphs = Array.from(document.querySelectorAll('p'));
      return paragraphs.some(p => p.innerText.includes("The Mystery Country is"));
    });
    return solutionElement;
  } catch (error) {
    console.error('Failed to check for solution', error);
    return false;
  }
}

async function playGame() {
  for (const country of allCountries) {
    await inputCountry(country);
    const closestBorder = await getClosestBorder();
    if (closestBorder !== null) {
      const minimumBorderDist = Math.min(...guesses.map(g => g.closestBorder));
      if (closestBorder < minimumBorderDist) {
        console.log("Warmer! Guessed: ", country, " with closest border: ", closestBorder);
      }
      logGuess(country, closestBorder);
    } else {
      console.log(`Failed to get closest border for ${country}`);
    }
    const solution = await isSolutionFound();
    if (solution) {
      return country;
    }
  }
}

(async () => {
  try {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();

    await page.goto('https://globle-game.com/game', { waitUntil: 'networkidle2' });

    const solution = await playGame();
    console.log(`Solution found after ${guesses.length} guesses: ${solution}`);

  } catch (error) { 
    console.error('Error in main function:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
