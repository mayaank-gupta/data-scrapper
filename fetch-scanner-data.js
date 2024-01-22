const chromium = require('chrome-aws-lambda');
const models = require('./models');
const ScannersModel = models.scanners;

const scrapStockslist = require("./functions/scrap-stocks-list");
const insertNewSymbol = require('./functions/insert-new-symbol');
const upsertNewDailyScan = require("./functions/upsert-new-daily-scan");
const upsertDailyScan = require("./functions/upsert-daily-scan");
const formatAndSendMessage= require("./functions/format-and-send-message");

async function fetchScannersData(scanners) {
  let browser;
  try {
    console.log('fetchScannersData Executed!');
    const allRecords = await ScannersModel.findAll({ raw: true });
    if (Array.isArray(scanners) && scanners.length) {
      browser = await chromium.puppeteer.launch({
        args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: true,
        ignoreHTTPSErrors: true,
      });

      for (let scanner of allRecords) {
        const page = await browser.newPage();
        // scrap the stock list
        const scrapedStockList = await scrapStockslist(scanner, page);

        // create the new symbol if not exist in the symbols table also fetch the fincode when creating (symbol = stock)
        const tickerList = await insertNewSymbol(scrapedStockList);

        // upsert new Table
        const newElements = await upsertNewDailyScan(scanner.id, scrapedStockList);

        // upsert old Table
        // it contains only ids
        const newElementsFromOldTables = await upsertDailyScan(scanner.id, tickerList);

        console.log("newElements", newElements);

        // if we want to check wiht newElementsFromOldTables then fetch the symbols table
        // currently we are cheking new table
        await formatAndSendMessage(scanner.name, newElements);

        await page.close();
      }
    }
  } catch (err) {
    console.log(err);
  } finally {
    if (browser !== null && typeof browser === 'object') {
      await browser.close();
    }
  }
}

module.exports = fetchScannersData;
