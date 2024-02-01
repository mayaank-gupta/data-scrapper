const fetchFinCode = require('../utils/fetch-fincode');
const models = require('../models');

const SymbolModel = models.symbol;

async function insertNewSymbol(currentSracpedArray) {
  const ticketList = [];
  console.log(currentSracpedArray);
  for (let symbolData of currentSracpedArray) {
    const singleSymbolData = await SymbolModel.findOne({
      raw: true,
      where: {
        symbol: symbolData.symbol,
      },
    });

    if (!singleSymbolData) {
      const finCode = await fetchFinCode(symbolData.symbol);

      const payload = {
        symbol: symbolData.symbol,
        stockName: symbolData.name,
        finCode: finCode || null,
      };

      const symbolCreate = await SymbolModel.create(payload);
      ticketList.push(+symbolCreate.id);
    } else {
      ticketList.push(+singleSymbolData.id);
    }
  }
  return ticketList;
}

module.exports = insertNewSymbol;
