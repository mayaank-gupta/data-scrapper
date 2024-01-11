const chromium = require("chrome-aws-lambda");

async function test() {
  let result = null;
  let browser = null;

  try {
    browser = await chromium.puppeteer.launch({
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: false,
      ignoreHTTPSErrors: true,
    });

    let page = await browser.newPage();

    await page.goto("https://google.com");

    result = await page.waitForNetworkIdle();
    console.log(result)
  } catch (error) {
    console.log(error)
    return error;
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

  return result;
}

test();
