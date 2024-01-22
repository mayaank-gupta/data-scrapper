const safePromise = require("./safe-promise");

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
  
    let scrapedArr = await page.evaluate(() => {
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
  
    scrapedArr = scrapedArr.map((stock) => {
      return {
        name: stock['Stock Name'],
        symbol: stock['Symbol'],
        price: stock['Price'],
        change: stock['% Chg'],
      };
    });
  
    return scrapedArr;
  }

  module.exports = scrapStockslist;