const moment = require("moment-timezone");
const { Op } = require("sequelize");

const sendMessage = require("../send_message");
const safePromise = require("./safe-promise");
const concurrentlyFetchPrice = require("./concurrently-fetch-price");
const models = require("../models");
const NewDailyScanDataModel = models.new_daily_scan_data;

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
            return `${ticker.time}: ${ticker.name} - ${ticker.price} | Close: ${closingData.close} - ${(
              ((closingData.close - ticker.price) / ticker.price) *
              100
            ).toFixed(2)}%`;
          }
          return null;
        })
        .filter(Boolean);
      const message = `<b>${data['scanner.name']}</b>\n\n<b>Daily Report:</b>\n<i>${combinedData.join("\n")}</i>\n\n<b>Time:</b> <i>${moment()
        .utcOffset("+05:30")
        .format("YYYY-MM-DD HH:mm A")}</i>\n`;
      return await sendMessage(message);
    }
  }
}

module.exports = generateDailyReport;
