const axios = require('axios');
const safePromise = require('./safe-promise');
const moment = require('moment-timezone');

async function fetchStockslist(scanner, token) {
  let config = {
    method: 'POST',
    maxBodyLength: Infinity,
    url: 'https://chartink.com/screener/process',
    headers: {
      cookie: token.cookie,
      'x-csrf-token': token.csrfToken,
    },
    data: scanner.scanClause,
  };
  const [error, result] = await safePromise(axios.request(config));

  if (error && error.response && error.response.data && error.response.data.message) {
    throw new Error(error.response.data.message);
  }

  let scrapedArr = result.data.data;

  const indianTime = moment.tz(new Date(), 'Asia/Kolkata');
  const formattedIndianTime = indianTime.format('HH:mm');
  scrapedArr = scrapedArr.map((stock) => {
    return {
      name: stock.name,
      symbol: stock.nsecode,
      price: stock.close,
      change: stock.per_chg,
      time: formattedIndianTime,
    };
  });

  return scrapedArr;
}

module.exports = fetchStockslist;
