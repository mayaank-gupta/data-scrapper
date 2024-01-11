const puppeteer = require("puppeteer");

let browser;
async function launchBrowser() {
  browser = await puppeteer.launch({
    headless: false,
  });
}

async function fetchCsrfToken(scanners) {
  // Launch browser
  await launchBrowser();
  for (let scanner of scanners) {
    try {
      // Open a new page
      const page = await browser.newPage();
      page.on("response", async (response) => {
        if (response.url().includes("screener/process")) {
          response.text().then(async (body) => {
            const parsedJson = JSON.parse(body);
            
          });
        }
      });
      const url = scanner.url;
      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });

      await page.waitForResponse((response) => response.url().includes("backtest/process"));
      await page.close();
      await page.waitForTimeout(2000);
      // Perform other actions on the page if needed
    } catch (error) {
      console.error("Error:", error);
    }
  }
  await browser.close();
}

// Run the script
module.exports = fetchCsrfToken;
