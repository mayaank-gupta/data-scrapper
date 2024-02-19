const chromium = require('chrome-aws-lambda');
const models = require('../models');
const TokenssModel = models.tokens;

const safePromise = require('./safe-promise');

async function updateToken(scanner) {
  let browser;
  try {
    console.log('updateToken Executed!');
    browser = await chromium.puppeteer.launch({
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: 'new',
      ignoreHTTPSErrors: true,
    });

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

    const payload = {
      cookie: requestData.headers.cookie,
      csrfToken: requestData.headers['x-csrf-token'],
    };

    // update todays data
    await TokenssModel.update(payload, {
      where: {
        id: 1,
      },
    });

    await page.close();

    return [payload];
  } catch (err) {
    console.log(err);
  } finally {
    if (browser !== null && typeof browser === 'object') {
      await browser.close();
    }
  }
}

module.exports = updateToken;
