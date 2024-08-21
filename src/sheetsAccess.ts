import GlobleGame from "./globleGame.js";
import authorize from './googleAuth.js';
import { google } from 'googleapis';

const sheetId = process.env.SHEET_ID;

const authToken = await authorize();


export async function saveGame(newGame: GlobleGame) {
   const sheets = google.sheets({version: 'v4', auth: authToken});
   // Save data to Google Sheets
   sheets.spreadsheets.values.append({
   spreadsheetId: sheetId,
   range: 'Database',
   valueInputOption: 'USER_ENTERED',
   requestBody: {
      values: [
         [newGame.name, newGame.date, newGame.game, newGame.guesses, newGame.guessCount, newGame.solvedTime]
      ]
   }
   });
}

// async function getData(auth: AuthClient) {
//   const sheets = google.sheets({version: 'v4', auth});
//   const res = await sheets.spreadsheets.values.get({
//     spreadsheetId: sheetId,
//     range: 'Database',
//   });
//   const rows = res.data.values;
//   if (!rows || rows.length === 0) {
//     console.log('No data found.');
//     return;
//   }
  
//   return rows.slice(1).map(row => {
//     const [name, date, game, guesses, guessCount] = row;
//     return {name, date: new Date(date), game, guesses, guessCount: +guessCount};
//   });
// }