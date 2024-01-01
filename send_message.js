require("dotenv").config();
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");
const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.CHAT_ID;
const bot = new TelegramBot(token, { polling: false });

async function sendMessage(message) {
  const messageText = message;
  const chatIdsArray = chatId.split(",");
  for (let userId of chatIdsArray) {
    bot
      .sendMessage(userId, messageText, { parse_mode: "HTML" })
      .then(() => {})
      .catch((error) => {
        console.error("Error sending message to the bot itself:", error);
      });
  }
}

module.exports = sendMessage;
