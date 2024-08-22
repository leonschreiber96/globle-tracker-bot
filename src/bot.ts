import TelegramBot from 'node-telegram-bot-api';
import GlobleGame from './globleGame.js';
// import { saveGame } from './sheetsAccess.js';
import supabase from "./supabaseClient.js";

export default class GlobleBot {
  private bot: TelegramBot;
  private adminChatId: string;
  private msgRegex = /🌎 (\w{3} \d+, \d{4}) 🌍\n🔥 \d+ \| Avg. Guesses: [\d\.]+\n([⬛🟦🟪🟩🟨🟥🟧⬜🟫\n]+) = (\d+)\n\nh?t?t?p?s?:?\/?\/?(globle.*).com\n#globle.*/;
  
  constructor(token: string, adminChatId: string) {
    this.bot = new TelegramBot(token, { polling: true });
    this.adminChatId = adminChatId;
  }

  public async start() {
    this.bot.on('message', async (message) => {
      const game = await this.extractGame(message);

      if (game === null) {
        await this.bot.sendMessage(this.adminChatId, `Game did not match regex: \`\`\`${message.text}\`\`\``);
        return;
      }

      await supabase.from("games").insert([game]);
    });

    console.log("Bot started");
  }

  private async extractGame(message: TelegramBot.Message): Promise<GlobleGame | null> {
    const matchesRegex = message.text?.match(this.msgRegex);
    if (!matchesRegex) {
      console.log("no match");
      return null
    }
    
    const groups = matchesRegex.slice(1);
    // const date = groups[0]!;
    const guesses = groups[1]!;
    // const guessCount = +groups[2]!;
    const game = groups[3]!; 
    const solvedTime = +message.date;

    let name = ""
    if (message.forward_from) {
      name = (message.forward_from.first_name || "") + " " + (message.forward_from.last_name || "");
      if (!name.trim()) {
        name = message.forward_from.username || "";
      }
    } else {
      name = (message.from?.first_name || "") + " " + (message.from?.last_name || "");
      if (!name.trim()) {
        name = message.from?.username || "";
      } 
    }

    return { player: name, timestamp: solvedTime ? new Date(solvedTime * 1000).toISOString() : new Date().toISOString(), guesses, game_type: game };
  };
}