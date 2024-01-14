const chromium = require("chrome-aws-lambda");
const moment = require("moment-timezone");
const fetchHistoryScanners = require("./fetch-history.json");
const safePromise = (promise) => promise.then((data) => [null, data]).catch((err) => [err]);
const models = require("./models");
const ScannersModel = models.scanners;

async function scrapStockslist(url, page) {
  const [visitError] = await safePromise(
    page.goto(url, {
      waitUntil: "networkidle2",
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
    return document.querySelector("#DataTables_Table_0 > tbody > tr").textContent;
  });

  if ([`No stocks filtered in the Scan`, "1/2/3 minute Realtime Scans are available for Premium members"].includes(textContent)) {
    return;
  }

  const scrapedArr = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll("#DataTables_Table_0 thead th")).map((th) => th.textContent.trim());

    const rows = Array.from(document.querySelectorAll("#DataTables_Table_0 tbody tr"));

    return rows.map((row) => {
      const rowData = {};
      const tds = row.querySelectorAll("td");

      for (let i = 0; i < headers.length; i++) {
        rowData[headers[i]] = tds[i].textContent.trim();
      }

      return rowData;
    });
  });

  if (typeof scrapedArr == "undefined") return;
  if (!Array.isArray(scrapedArr) && !scrapedArr.length) return;

  const dateNow = moment().tz("Asia/Kolkata").format();

  const normalizedArr = [];

  for (const stock of scrapedArr) {
    normalizedArr.push({
      name: stock["Stock Name"],
      symbol: stock["Symbol"],
      [dateNow]: {
        price: stock["Price"],
        change: stock["% Chg"],
      },
    });
  }

  return normalizedArr;
}

async function fetchScannersData(scanners) {
  try {
    console.log("fetchScannersData Executed!");

    const allRecords = await ScannersModel.findAll({ raw: true });

    if (Array.isArray(scanners) && scanners.length) {
      browser = await chromium.puppeteer.launch({
        args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: true,
        ignoreHTTPSErrors: true,
      });

      for (let scanner of allRecords) {
        const page = await browser.newPage();
        const scrapedStockList = await scrapStockslist(scanner.link, page);
        console.log("scrapedStockList", scrapedStockList);
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

module.exports = fetchScannersData;
