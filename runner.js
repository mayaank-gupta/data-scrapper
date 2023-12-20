const puppeteer = require("puppeteer");
const moment = require("moment");
const sendMessage = require("./send_message");
const fs = require("fs");
const filePath = "scanners.json";

function arraysEqual(arr1, arr2) {
  return arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);
}

async function fetchData(scanners) {
  try {
    if (Array.isArray(scanners) && scanners.length) {
      for (let scanner of scanners) {
        const browser = await puppeteer.launch({
          headless: "new",
          timeout: 0,
        });
        const page = await browser.newPage();

        // Intercept and log responses
        page.on("response", (response) => {
          if (response.url().includes("screener/process")) {
            response.text().then(async (body) => {
              const parsedJson = JSON.parse(body);
              if (Array.isArray(parsedJson.data) && parsedJson.data.length) {
                const extractedData = parsedJson.data.map((el) => el.nsecode);
                if (!scanners[scanner.id].old_response.length) {
                  scanners[scanner.id].old_response = extractedData;
                  const message = `<b>${scanners[scanner.id].name}</b>\n<b>Stocks:</b> ${extractedData.join(", ")}\n<b>Time:</b> ${moment()
                    .utcOffset("+05:30")
                    .format("YYYY-MM-DD HH:mm A")}\n`;
                  await sendMessage(message);
                } else if (arraysEqual(scanners[scanner.id].old_response, extractedData)) {
                } else {
                  scanners[scanner.id].latest_response = extractedData;
                  const addedElements = scanners[scanner.id].latest_response.filter(
                    (item) => !scanners[scanner.id].old_response.includes(item)
                  );
                  const removedElements = scanners[scanner.id].old_response.filter(
                    (item) => !scanners[scanner.id].latest_response.includes(item)
                  );
                  scanner.old_response = extractedData;
                  const message = `<b>${scanners[scanner.id].name}</b>\n<b>New Added:</b> ${addedElements.join(
                    ", "
                  )}\n<b>Removed:</b> ${removedElements.join(", ")}\n<b>Stocks:</b> ${extractedData.join(", ")}\n<b>Time:</b> ${moment()
                    .utcOffset("+05:30")
                    .format("YYYY-MM-DD HH:mm A")}\n`;
                  await sendMessage(message);
                }
                fs.writeFile(filePath, JSON.stringify(scanners), "utf8", (writeErr) => {
                  if (writeErr) {
                    console.error("Error writing to file:", writeErr);
                  }
                });
              }
            });
          }
        });

        // Navigate to the webpage
        await page.goto(scanner.url);

        // Close the browser
        await browser.close();
      }
    }
  } catch (err) {
    console.log(err);
  }
}
module.exports = fetchData;
