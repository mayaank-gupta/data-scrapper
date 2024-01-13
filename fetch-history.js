const chromium = require("chrome-aws-lambda");
const moment = require("moment-timezone");
const axios = require("axios");
const sendMessage = require("./send_message");

let browser = null;
const stockUrl = `https://stock-daily-price.vercel.app/get_stock_data`;

async function fetchData(scanners) {
  try {
    console.log("fetchHistory Executed!");
    if (Array.isArray(scanners) && scanners.length) {
      browser = await chromium.puppeteer.launch({
        args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: "new",
        ignoreHTTPSErrors: true,
      });
      for (let scanner of scanners) {
        const page = await browser.newPage();
        let finalObject = [];
        let addedElements = [];
        // Intercept and log responses
        page.on("response", async (response) => {
          if (response.url().includes("backtest/process")) {
            response
              .text()
              .then(async (body) => {
                const parsedJson = JSON.parse(body);
                if (Array.isArray(parsedJson.metaData) && parsedJson.metaData.length) {
                  if (parsedJson.metaData[0]["tradeTimes"].length >= 20) {
                    const lastResponseElement = parsedJson.aggregatedStockList[parsedJson.aggregatedStockList.length - 1].filter(
                      (el, j) => j % 3 === 0
                    );
                    let last20Responses = parsedJson.aggregatedStockList.slice(-21, -1);
                    finalObject = last20Responses.flatMap((element, i) => last20Responses[i].filter((el, j) => j % 3 === 0));
                    finalObject = [...new Set(finalObject)];
                    addedElements = lastResponseElement.filter((item) => !finalObject.includes(item));
                    console.log("Added Elements", addedElements.length);
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
              })
              .catch((err) => console.error(err));
          }
        });
        await page.goto(scanner.url);
        await page.waitForNetworkIdle();
        await page.close();
      }
    }
  } catch (err) {
    console.log(err);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}
module.exports = fetchData;
