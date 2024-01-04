const puppeteer = require("puppeteer");

async function run() {
  // Launch browser
  const browser = await puppeteer.launch({
    headless: false,
  });

  try {
    // Open a new page
    const page = await browser.newPage();

    // Navigate to a URL
    const url = "https://google.com";
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForTimeout(5000);

    // Perform other actions on the page if needed
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Run the script
run();
