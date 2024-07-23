import CountryInfo from "./countryInfo.js";
import { Country } from "./geo.js";

export type Guess = { country: string, closestBorder?: number; };
export type GameType = 'globle' | 'globleCapitals';

export abstract class SolvingStrategy {
  abstract initialGuess<T extends Country | CountryInfo>(countries: T[], selector: (c: T) => string): string;
  abstract nextGuess<T extends Country | CountryInfo>(previousGuesses: Guess[], countries: T[]): string;
}

export class RandomSolvingStrategy extends SolvingStrategy {
  initialGuess<T extends Country | CountryInfo>(countries: T[], selector: (c: T) => string): string {
    return this.nextGuess([], countries);
  }

  nextGuess<T extends Country | CountryInfo>(previousGuesses: Guess[], countries: T[]): string {
    if ("properties" in countries[0]) {
      let c = countries as CountryInfo[];
      c = c.filter(({ properties }) => !previousGuesses.some(g => g.country === properties.shapeName));
      return c[Math.floor(Math.random() * countries.length)].properties.shapeName;
    } else {
      let c = countries as Country[];
      c = c.filter(({ name }) => !previousGuesses.some(g => g.country === name));
      return c[Math.floor(Math.random() * countries.length)].name;
    }
  }
}