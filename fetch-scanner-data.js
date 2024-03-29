const models = require('./models');
const ScannersModel = models.scanners;
const TokenssModel = models.tokens;

const fetchStockslist = require('./functions/fetch-stocks-list');
const insertNewSymbol = require('./functions/insert-new-symbol');
const upsertNewDailyScan = require('./functions/upsert-new-daily-scan');
const upsertDailyScan = require('./functions/upsert-daily-scan');
const formatAndSendMessage = require('./functions/format-and-send-message');
const sendMessage = require('./send_message');
const safePromise = require('./functions/safe-promise');
const updateToken = require('./functions/update-tokens');

async function fetchScannersData() {
  try {
    console.log('fetchScannersData Executed!');
    const scanners = await ScannersModel.findAll({
      raw: true,
      where: { isActive: true },
    });
    let tokens = await TokenssModel.findAll({ raw: true });

    for (let scanner of scanners) {
      console.log('Running scanner_name:', scanner.name);
      // scrap the stock list

      let [error, scrapedStockList] = await safePromise(
        fetchStockslist(scanner, tokens[0])
      );

      if (error && error.message && error.message == 'CSRF token mismatch.') {
        sendMessage(`<b>ERROR</b> >>> ${error.message}`);
        sendMessage(`<b>UPDATING TOKEN</b>`);
        // update the token by using same scanner
        const tokens = await updateToken(scanner);
        scrapedStockList = await fetchStockslist(scanner, tokens[0]);
      }

      // create the new symbol if not exist in the symbols table also fetch the fincode when creating (symbol = stock)
      const tickerList = await insertNewSymbol(scrapedStockList);

      if (tickerList && Array.isArray(tickerList) && tickerList.length) {
        // upsert new Table
        const newElements = await upsertNewDailyScan(
          scanner.id,
          scrapedStockList
        );

        // upsert old Table
        // it contains only ids
        const newElementsFromOldTables = await upsertDailyScan(
          scanner.id,
          tickerList
        );

        // if we want to check wiht newElementsFromOldTables then fetch the symbols table
        // currently we are cheking new table
        await formatAndSendMessage(scanner.name, newElements);
      }
    }
  } catch (error) {
    console.log('error', error.message);
    sendMessage(`<b>ERROR</b> >>> ${error.message}`);
  }
}

(async () => {
  await fetchScannersData();
})();

// module.exports = fetchScannersData;
