const moment = require("moment-timezone");
const { Op } = require("sequelize");

const sendMessage = require("../send_message");
const safePromise = require("./safe-promise");
const concurrentlyFetchPrice = require("./concurrently-fetch-price");
const models = require("../models");
const NewDailyScanDataModel = models.new_daily_scan_data;

function calculateStocks(stockPrice, investmentAmount) {
  if (typeof stockPrice !== "number" || typeof investmentAmount !== "number" || stockPrice <= 0 || investmentAmount <= 0) {
    return "Invalid input. Please provide valid positive numbers.";
  }
  if (investmentAmount <= stockPrice) {
    return 1;
  }
  const numberOfStocks = Math.round(investmentAmount / stockPrice);
  return numberOfStocks;
}

async function generateDailyReport() {
  const today = moment().format("YYYY-MM-DD");
  let tomorrow = moment().add(1, "days").format("YYYY-MM-DD");
  const dailyData = await NewDailyScanDataModel.findAll({
    raw: true,
    include: [
      {
        model: models.scanners,
        required: false,
      },
    ],
    where: {
      createdDate: {
        [Op.gte]: today, // Greater than or equal to today
        [Op.lt]: tomorrow, // Less than tomorrow
      },
    },
  });
  const chunkSize = 20;
  const concurrencyLimit = 10;
  for (let data of dailyData) {
    if (data.tickerList && data.tickerList.length) {
      let totalInvestment = 0;
      let totalValue = 0;
      let symbolsList = data.tickerList.map((el) => `${el.name}.NS`);
      const [sError, sResult] = await safePromise(concurrentlyFetchPrice(symbolsList, chunkSize, concurrencyLimit));
      if (sError) {
        console.log("Latest price error", sError);
        throw new Error("Unable to fetch data");
      }
      const combinedData = data.tickerList
        .map((ticker) => {
          const closingData = sResult[ticker.name];
          if (closingData) {
            const numberOfStocks = calculateStocks(+ticker.price, 3000);
            const investmentAmount = numberOfStocks * +ticker.price;
            totalInvestment += investmentAmount;
            const latestInvestment = numberOfStocks * +closingData.close;
            totalValue += latestInvestment;
            return `${ticker.time}: ${ticker.name} - ${ticker.price} \n Close: ${closingData.close} - Change: <b>[${(
              ((closingData.close - ticker.price) / ticker.price) *
              100
            ).toFixed(2)}%]</b> \n Investment: ${investmentAmount.toFixed(2)} - Now: ${latestInvestment.toFixed(2)}`;
          }
          return null;
        })
        .filter(Boolean);
      const message = `<b>${
        data["scanner.name"]
      }</b>\n\n<b>Daily Report:</b>\n====================\nTotal Investment: ${totalInvestment.toFixed(
        2
      )}\nTotal Value: ${totalValue.toFixed(2)}\nPercentage Change: <b>${(((totalValue - totalInvestment) / totalInvestment) * 100).toFixed(
        2
      )}</b>\n\n<b>Time:</b> <i>${moment().utcOffset("+05:30").format("YYYY-MM-DD HH:mm A")}</i>\n`;
      await sendMessage(message);
      (totalInvestment = 0), (totalValue = 0);
    }
  }
}

module.exports = generateDailyReport;
