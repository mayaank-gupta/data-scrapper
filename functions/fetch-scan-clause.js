const chromium = require('chrome-aws-lambda');
const models = require('../models');
const ScannersModel = models.scanners;

const safePromise = require('./safe-promise');

async function fetchScanClause(scanners) {
  let browser;
  try {
    console.log('fetchScanClause Executed!');
    if (Array.isArray(scanners) && scanners.length) {
      browser = await chromium.puppeteer.launch({
        args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: 'new',
        ignoreHTTPSErrors: true,
      });

      for (let scanner of scanners) {
        console.log('Running scanner_name:', scanner.name);
        const page = await browser.newPage();

        await page.setRequestInterception(true);

        let requestData = null;

        // Listen for requests
        page.on('request', (request) => {
          if (request.url().includes('chartink.com/screener/process')) {
            requestData = {
              method: request.method(),
              url: request.url(),
              postData: request.postData(), // Get the POST data
              headers: request.headers(),
              cookies: request.cookies,
            };
          }
          request.continue();
        });

        const [visitError] = await safePromise(
          page.goto(scanner.link, {
            waitUntil: 'networkidle2',
          })
        );

        if (visitError) {
          await page.reload();
        }

        // update the scan clause
        const scanClause = requestData.postData;
        // update todays data
        await ScannersModel.update(
          {
            scanClause,
          },
          {
            where: {
              id: scanner.id,
            },
          }
        );

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

module.exports = fetchScanClause;
