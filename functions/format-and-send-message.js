const moment = require('moment-timezone');
const sendMessage = require('../send_message');

async function formatAndSendMessage(scannerName, newElements) {
  if (!newElements ||(newElements && !newElements.length)) {
    return;
  }

  newElements = newElements.map((stock) => {
    return `<b>${stock.name}</b> >>> ${stock.price}`;
  });

  const message = `<b>${scannerName}</b>\n\n<b>New Added:</b>\n<i>${newElements.join(
    '\n'
  )}</i>\n\n<b>Time:</b> <i>${moment()
    .utcOffset('+05:30')
    .format('YYYY-MM-DD HH:mm A')}</i>\n`;

  return await sendMessage(message);
}
module.exports = formatAndSendMessage;
