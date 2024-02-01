const moment = require("moment-timezone");
const sendMessage = require("../send_message");

function calculateStocks(stockPrice, investmentAmount) {
  if (typeof stockPrice !== "number" || typeof investmentAmount !== "number" || stockPrice <= 0 || investmentAmount <= 0) {
    return "Invalid input. Please provide valid positive numbers.";
  }

  if (investmentAmount <= stockPrice) {
    return 1;
  }

  const numberOfStocks = Math.floor(investmentAmount / stockPrice);
  return numberOfStocks;
}

async function formatAndSendMessage(scannerName, newElements) {
  if (!newElements || (newElements && !newElements.length)) {
    return;
  }

  newElements = newElements.map((stock) => {
    return `<b>${stock.name}</b> >>> ${stock.price} | StocksCount: ${calculateStocks(+stock.price, 3000)}`;
  });

  const message = `<b>${scannerName}</b>\n\n<b>New Added:</b>\n<i>${newElements.join("\n")}</i>\n\n<b>Time:</b> <i>${moment()
    .utcOffset("+05:30")
    .format("YYYY-MM-DD HH:mm A")}</i>\n`;

  return await sendMessage(message);
}
module.exports = formatAndSendMessage;
