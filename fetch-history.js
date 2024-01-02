const puppeteer = require("puppeteer");
const moment = require("moment-timezone");
const axios = require("axios");
const sendMessage = require("./send_message");
const fs = require("fs");
const filePath = "fetch-history.json";

function epochToIST(epochTime) {
  return moment.utc(epochTime).tz("Asia/Kolkata").format("YYYY-MM-DD");
}
let browser;
(async () => {
  browser = await puppeteer.launch({
    headless: "new",
    timeout: 0,
  });
})();

const stockUrl = `https://stock-daily-price.vercel.app/get_stock_data`;

async function fetchData(scanners) {
  try {
    console.log("fetchHistory Executed!");
    if (Array.isArray(scanners) && scanners.length) {
      for (let scanner of scanners) {
        const page = await browser.newPage();
        await page.goto(scanner.url);
        let finalObject = [];
        let addedElements = [];
        // Intercept and log responses
        page.on("response", (response) => {
          if (response.url().includes("backtest/process")) {
            response.text().then(async (body) => {
              const parsedJson = JSON.parse(body);
              if (Array.isArray(parsedJson.metaData) && parsedJson.metaData.length) {
                if (parsedJson.metaData[0]["tradeTimes"].length >= 20) {
                  const lastResponseElement = parsedJson.aggregatedStockList[parsedJson.aggregatedStockList.length - 1].filter(
                    (el, j) => j % 3 === 0
                  );
                  let last20Responses = parsedJson.aggregatedStockList.slice(-11, -1);
                  finalObject = last20Responses.flatMap((element, i) => last20Responses[i].filter((el, j) => j % 3 === 0));
                  finalObject = [...new Set(finalObject)];
                  addedElements = lastResponseElement.filter((item) => !finalObject.includes(item));
                  if (addedElements.length) {
                    axios({
                      method: "post",
                      url: stockUrl,
                      data: {
                        symbols: addedElements.map((el) => `${el}.NS`),
                      },
                    }).then(async (response) => {
                      if (response.data) {
                        let formattedMessage = [];
                        addedElements.forEach((el) => {
                          if (Object.keys(response.data).includes(el)) {
                            formattedMessage.push([`\n${el} >>> ${response.data[el]["close"]}`]);
                          }
                        });

                        const message = `<b>${scanners[scanner.id].name}</b>\n\n<b>New Added:</b> <i>${formattedMessage.join(
                          ""
                        )}</i>\n\n<b>Time:</b> <i>${moment().utcOffset("+05:30").format("YYYY-MM-DD HH:mm A")}</i>\n`;
                        await sendMessage(message);
                      }
                    });
                  }
                }
              }
            });
          }
        });

        // Close the browser
        await browser.close();
      }
    }
  } catch (err) {
    console.log(err);
  }
}
module.exports = fetchData;
