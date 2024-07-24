import CountryInfo from "./countryInfo.js";
import { Country, isPointInCircle } from "./geo.js";
import { minimumBoundingCircle } from "./geo.js";

export type Guess = { id: number, country: string, closestBorder: number | null; };
export type GameType = 'globle' | 'globleCapitals';

export abstract class SolvingStrategy {
  abstract initialGuess<T extends CountryInfo>(countries: T[]): string;
  abstract nextGuess(previousGuesses: Guess[], countries: CountryInfo[]): string;
}

export class RandomSolvingStrategy extends SolvingStrategy {
  initialGuess<T extends CountryInfo>(countries: T[]): string {
    return countries[Math.floor(Math.random() * countries.length)].metadata.name;
  }

  nextGuess(previousGuesses: Guess[], countries: CountryInfo[]): string {
    let c = countries.filter((country) => !previousGuesses.some(guess => guess.country === country.metadata.name));
    const retVal = c[Math.floor(Math.random() * countries.length)]
    return retVal.metadata.name;
  }
}

export class CircleSolvingStrategy extends SolvingStrategy {

  private shuffleArray<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  initialGuess<T extends CountryInfo>(countries: T[]): string {
    // select one of 5 smallest countries in europe randomly
    const europe = countries.filter(c => c.metadata.region === "Europe");
    const sorted = europe.sort((a, b) => a.minimizedPoints.length - b.minimizedPoints.length);
    const smallestCountries = sorted.slice(0, 5);
    return this.shuffleArray(smallestCountries)[Math.floor(Math.random() * 5)].metadata.name;
  }

  nextGuess(previousGuesses: Guess[], countries: CountryInfo[]): string {
    let bestGuess = this.getBestGuess(previousGuesses);
    let country = this.shuffleArray(countries).find(c => bestGuess.country === c.metadata.name);
    let circle = minimumBoundingCircle(country!.minimizedPoints.map(p => ({ x: p.lat * 110.574, y: p.lng * 111.32 * Math.cos(p.lat * (Math.PI / 180)) })));
    
    const failedGuesses: Guess[] = [];
    while (!circle) {
      failedGuesses.push(bestGuess);
      bestGuess = this.getBestGuess(previousGuesses.filter(g => !failedGuesses.includes(g)));
      country = this.shuffleArray(countries).find(c => bestGuess.country === c.metadata.name);
      circle = minimumBoundingCircle(country!.minimizedPoints.map(p => ({ x: p.lat * 110.574, y: p.lng * 111.32 * Math.cos(p.lat * (Math.PI / 180)) })));

      if (country?.metadata.name === "Ukraine") {
        console.log(`Circle Ukraine: ${circle}`);
      }
    }

    console.log(`${country?.metadata.name}: (${circle!.center.x}, ${circle!.center.y}) → r = ${circle!.radius}`);

    // Increase the circle radius to include the best guess yet
    circle.radius += bestGuess.closestBorder!;

    // let x = false;
    const notGuessedCountries = countries.filter(c => !previousGuesses.some(g => g.country === c.metadata.name));
    for (const c of notGuessedCountries) {
      const anyPointInsideCircle = c.minimizedPoints.some(p => {
        const point = { x: p.lat * 110.574, y: p.lng*111.32*Math.cos(p.lat*(Math.PI/180)) };
        // if (!x) {
        //   console.log(`${c.metadata.name}: (${point.x}, ${point.y}) for ${circle.center.x}, ${circle.center.y} and ${circle.radius}`);
        // }
        // x = true;
        return isPointInCircle(point, circle!);
      });
      if (anyPointInsideCircle) {
        return c.metadata.name;
      }
    }

    throw new Error('No country found inside the circle');
  }

  private getBestGuess(guesses: Guess[]) {
    // get guesses where closestBorder is not null
    let closestBorderGuesses = guesses.filter(g => g.closestBorder !== null);
    // get where it is minimal (can be multiple)
    let min = Math.min(...closestBorderGuesses.map(g => g.closestBorder!));
    let bestGuesses = closestBorderGuesses.filter(g => g.closestBorder === min);
    // return the first one (that is the one that actually achieved the minimal closestBorder)
    return bestGuesses[0];
  }
}