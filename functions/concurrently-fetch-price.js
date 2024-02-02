const pLimit = require('p-limit');
const safePromise = require('./safe-promise');
const fetchSymbolsPrice = require("./fetch-symbols-price");

async function concurrentlyFetchPrice(symbolsList, chunkSize, concurrencyLimit) {
    const chunkArray = (arr, size) =>
      Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
      );
  
    const limit = pLimit(concurrencyLimit);
    let allPrices = {};
  
    async function fetchAndMergePrices(array) {
      const [sError, sResult] = await safePromise(fetchSymbolsPrice(array));
      if (sError) {
        console.log('Latest price error', sError);
        return null;
      }
      return sResult;
    }
  
    const arrayOfArrays = chunkArray(symbolsList, chunkSize);
  
    await Promise.all(
      arrayOfArrays.map(async (array) => {
        const sResult = await limit(() => fetchAndMergePrices(array));
        if (sResult) {
          allPrices = { ...allPrices, ...sResult };
        }
      })
    );
  
    return allPrices;
  }

  module.exports = concurrentlyFetchPrice;