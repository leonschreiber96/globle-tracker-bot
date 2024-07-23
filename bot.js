const TelegramBot = require('node-telegram-bot-api');
const auth = require('./sheets-auth');
const {google} = require('googleapis');
const { get } = require('request');
require('dotenv').config(); // Load environment variables from .env file

const msgRegex = /🌎 (\w{3} \d+, \d{4}) 🌍\n🔥 \d+ \| Avg. Guesses: [\d\.]+\n([⬛🟦🟪🟩🟨🟥🟧⬜🟫\n]+) = (\d+)\n\nh?t?t?p?s?:?\/?\/?(globle.*).com\n#globle.*/;
const sheetId = process.env.SHEET_ID;
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const adminChatId = process.env.ADMIN_CHAT_ID;


async function getData(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'Database',
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }
  
  return rows.slice(1).map(row => {
    const [name, date, game, guesses, guessCount] = row;
    return {name, date: new Date(date), game, guesses, guessCount: +guessCount};
  });
}

async function saveGame(newGame, auth) {
  try {
    const sheets = google.sheets({version: 'v4', auth});
    // Save data to Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Database',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [newGame.name, newGame.date, newGame.game, newGame.guesses, newGame.guessCount, newGame.solvedTime]
        ]
      }
    });
  } catch (err) {
    console.error(err);
    bot.sendMessage(adminChatId, `Error saving game: \`\`\`${newGame}\`\`\``);
  }
}

let saveLock = false;

auth.authorize().then((token) => {  
  bot.on('message', async (message) => {
    const matchesRegex = message.text.match(msgRegex);
    if (!matchesRegex) {
      console.log("no match");
      bot.sendMessage(adminChatId, `Game did not match regex: \`\`\`${message.text}\`\`\``);
      return;
    }
    
    const groups = matchesRegex.slice(1);
    const date = groups[0];
    const guesses = groups[1];
    const guessCount = +groups[2];
    const game = groups[3];
    const solvedTime = message.date;

    let name = ""
    if (message.forward_from) {
      name = (message.forward_from.first_name || "") + " " + (message.forward_from.last_name || "");
      if (!name.trim()) {
        name = message.forward_from.username;
      }
    } else {
      name = (message.from.first_name || "") + " " + (message.from.last_name || "");
      if (!name.trim()) {
        name = message.from.username;
      } 
    }

    const newGame = { name, date, game, guesses, guessCount, solvedTime };

    while (saveLock) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    saveLock = true;
    saveGame(newGame, token).then(() => {
      saveLock = false;
    });
  });
}).catch(console.error);