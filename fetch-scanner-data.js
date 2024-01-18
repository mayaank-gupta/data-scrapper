const { Op } = require('sequelize');
const chromium = require('chrome-aws-lambda');
const moment = require('moment-timezone');
const fetchHistoryScanners = require('./fetch-history.json');
const fetchFinCode = require('./utils/fetch-fincode');
const sendMessage = require('./send_message');
const safePromise = (promise) =>
  promise.then((data) => [null, data]).catch((err) => [err]);
const models = require('./models');
const ScannersModel = models.scanners;
const SymbolModel = models.symbol;
const DailyScanDataModel = models.daily_scan_data;
const NewDailyScanDataModel = models.new_daily_scan_data;

function arraysHaveSameElements(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }

  const sortedArr1 = arr1.slice().sort();
  const sortedArr2 = arr2.slice().sort();

  return sortedArr1.every((element, index) => element === sortedArr2[index]);
}

async function scrapStockslist(scannerInput, page) {
  const [visitError] = await safePromise(
    page.goto(scannerInput.link, {
      waitUntil: 'networkidle2',
    })
  );

  if (visitError) {
    await page.reload();
  }

  const [processingWaitError] = await safePromise(
    page.waitForSelector(`#DataTables_Table_0_processing`, {
      hidden: true,
    })
  );

  if (processingWaitError) {
    await page.reload();
    await page.waitForSelector(`#DataTables_Table_0_processing`, {
      hidden: true,
    });
  }

  const textContent = await page.evaluate(() => {
    return document.querySelector('#DataTables_Table_0 > tbody > tr')
      .textContent;
  });

  if (
    [
      `No stocks filtered in the Scan`,
      '1/2/3 minute Realtime Scans are available for Premium members',
    ].includes(textContent)
  ) {
    return;
  }

  const scrapedArr = await page.evaluate(() => {
    const headers = Array.from(
      document.querySelectorAll('#DataTables_Table_0 thead th')
    ).map((th) => th.textContent.trim());

    const rows = Array.from(
      document.querySelectorAll('#DataTables_Table_0 tbody tr')
    );

    return rows.map((row) => {
      const rowData = {};
      const tds = row.querySelectorAll('td');

      for (let i = 0; i < headers.length; i++) {
        rowData[headers[i]] = tds[i].textContent.trim();
      }

      return rowData;
    });
  });

  if (typeof scrapedArr == 'undefined') return;
  if (!Array.isArray(scrapedArr) && !scrapedArr.length) return;

  const normalizedArr = [];
  const ticketList = [];
  let symbolCreate;

  for (const stock of scrapedArr) {
    normalizedArr.push({
      name: stock['Stock Name'],
      symbol: stock['Symbol'],
      price: stock['Price'],
      change: stock['% Chg'],
    });
  }

  for (let symbolData of normalizedArr) {
    const singleSymbolData = await SymbolModel.findOne({
      raw: true,
      where: {
        symbol: symbolData.symbol,
      },
    });

    if (!singleSymbolData) {
      const finCode = await fetchFinCode(symbolData.symbol);

      const payload = {
        symbol: symbolData.symbol,
        stockName: symbolData.name,
        finCode: finCode || null,
      };

      symbolCreate = await SymbolModel.create(payload);
      ticketList.push(+symbolCreate.id);
    } else {
      ticketList.push(+singleSymbolData.id);
    }
  }

  const newTableTickerList = normalizedArr.map((item) => {
    return {
      name: item.symbol,
      price: item.price,
    };
  });

  const newDailyScanPayload = {
    scannerId: scannerInput.id,
    tickerList: newTableTickerList,
  };

  const dailyScanPayload = {
    scannerId: scannerInput.id,
    tickerList: ticketList.sort(),
  };

  if (ticketList.length) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    // Set the start of tomorrow
    tomorrow.setHours(0, 0, 0, 0);
    // Set the end of tomorrow
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);
    //
    const scannerLatestData = await DailyScanDataModel.findOne({
      raw: true,
      where: {
        scannerId: scannerInput.id,
        created_at: {
          [Op.gte]: tomorrow,
          [Op.lt]: endOfTomorrow,
        },
      },
      attributes: ['ticker_list'],
      order: [['created_at', 'DESC']],
    });

    // New Table
    const todayCheck = new Date();
    todayCheck.setHours(0, 0, 0, 0);
    const findTodaysNewScannerData = await NewDailyScanDataModel.findOne({
      raw: true,
      attributes: ['ticker_list'],
      where: {
        scannerId: newDailyScanPayload.scannerId,
        created_at: {
          [Op.and]: {
            [Op.gte]: todayCheck, // Greater than or equal to today
            [Op.lt]: new Date(todayCheck.getTime() + 86400000), // Less than tomorrow (24 hours later)
          },
        },
      },
    });

    if (findTodaysNewScannerData === null) {
      // create new daily scan data
      await NewDailyScanDataModel.create(newDailyScanPayload);
    } else {
      // update existing
      const tickerList = [];

      newDailyScanPayload.tickerList.map((item) => {
        const existingObject = findTodaysNewScannerData.ticker_list.find(
          (obj) => obj.name === item.name
        );

        if (!existingObject) {
          tickerList.push(objectToAdd);
        }
      });

      if (tickerList.length) {
        await NewDailyScanDataModel.update(
          {
            tickerList: [
              ...findTodaysNewScannerData.ticker_list,
              ...tickerList,
            ],
          },
          {
            where: {
              scannerId: newDailyScanPayload.scannerId,
            },
          }
        );
      }
    }


    if (scannerLatestData && scannerLatestData?.ticker_list?.length) {
      if (arraysHaveSameElements(scannerLatestData.ticker_list, ticketList)) {
        return;
      }
      let addedElements = ticketList.filter(
        (item) => !scannerLatestData.ticker_list.includes(item)
      );
      if (addedElements.length) {
        const addedData = await SymbolModel.findAll({
          raw: true,
          where: {
            id: addedElements,
          },
        });
        addedElements = addedData.map((el) => {
          const matchingData = normalizedArr.find(
            (data) => data.symbol === el.symbol
          );
          if (matchingData) {
            return `<b>${el.symbol}</b> >>> ${matchingData.price}`;
          }
          return;
        });
        const message = `<b>${
          scannerInput.name
        }</b>\n\n<b>New Added:</b>\n<i>${addedElements.join(
          '\n'
        )}</i>\n\n<b>Time:</b> <i>${moment()
          .utcOffset('+05:30')
          .format('YYYY-MM-DD HH:mm A')}</i>\n`;

        await sendMessage(message);
        return await DailyScanDataModel.create(dailyScanPayload);
      }
    } else {
      return await DailyScanDataModel.create(dailyScanPayload);
    }
  }
  return;
}

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
        const scrapedStockList = await scrapStockslist(scanner, page);
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
