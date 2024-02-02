const axios = require('axios');
const safePromise = require('./safe-promise');

const url = `https://stock-daily-price.vercel.app/get_stock_data`;

const fetchSymbolsPrice = async (symbolsList) => {
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: url,
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      symbols: symbolsList
    },
  };

  let [error, response] = await safePromise(axios.request(config));
  
  if (error) {
    throw error
  }

  response = response.data;

 return response;
};

module.exports = fetchSymbolsPrice;
