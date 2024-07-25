import CountryInfo from "./countryInfo.js";
import { Circle, isPointInCircle } from "./geo.js";
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
  private discardedCountries: string[] = [];

  private shuffleArray<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private borderInsideCircle(circle: Circle, country: CountryInfo): boolean {
    return country.minimizedPoints.some(b => isPointInCircle({ x: b.lat, y: b.lng }, circle));
  }

  initialGuess<T extends CountryInfo>(countries: T[]): string {
    // select one of 5 smallest countries in europe randomly
    const europe = countries.filter(c => c.metadata.region === "Europe");
    const sorted = europe.sort((a, b) => a.minimizedPoints.length - b.minimizedPoints.length);
    const smallestCountries = sorted.slice(0, 5);
    return this.shuffleArray(smallestCountries)[Math.floor(Math.random() * 5)].metadata.name;
  }

  nextGuess(previousGuesses: Guess[], countries: CountryInfo[]): string {
    const guessesWithBorders = previousGuesses.filter(g => g.closestBorder !== null).sort((a, b) => a.id! - b.id!);
    const bestGuess = guessesWithBorders.slice(-1)[0]
    const openCandidates = countries.filter(c => !previousGuesses.some(g => g.country === c.metadata.name) && !this.discardedCountries.includes(c.metadata.name));

    // If no guess with closest border is found, return an initial guess
    if (!bestGuess) {
      return this.initialGuess(countries);
    }

    // Calculate the circle for each guess that has a border associated with it
    const circles = guessesWithBorders.map(g => {
      const country = countries.find(c => g.country === c.metadata.name);
      const circle = minimumBoundingCircle(country!.minimizedPoints.map(p => ({ x: p.lat, y: p.lng })));
      if (!circle) {
        return null;
      }
      circle.radius += g.closestBorder!;
      return circle;
    }).filter(c => c !== null) as Circle[];

    let chosenCandidate = undefined;
    let counter = 1

    console.log()
    console.log('-------------------');
    console.log('openCandidates', openCandidates.length);
    console.log('-------------------');
    console.log('Circles (0):')
    for (const circle of circles) {
      console.log(`    (${circle.center.x}, ${circle.center.y}), ${circle.radius}`);
    }

    while (chosenCandidate === undefined && counter < 10) {
      for (const candidate of this.shuffleArray(openCandidates)) {
        
        const allCirclesContainBorder = circles.every(c => this.borderInsideCircle(c, candidate));
        if (!allCirclesContainBorder) {
          this.discardedCountries.push(candidate.metadata.name);
        } else {
          chosenCandidate = candidate;
        }
      }
      circles.forEach(c => {
        c.radius += counter*100;
      });
      console.log(`Circles (${counter}):`)
      for (const circle of circles) {
        console.log(`    (${circle.center.x}, ${circle.center.y}), ${circle.radius}`);
      }
      counter++;
    }

    if (chosenCandidate)
      return chosenCandidate.metadata.name;

    throw new Error('No country found inside the circle');
  }
}