const axios = require("axios");

async function fetchFinCode(symbol) {
  const url = `https://www.moneyworks4me.com/ajax/search?q=${symbol}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.data && response.data.length) {
      return response.data[1].assetcode || "";
    } else {
      return "";
    }
  } catch (error) {
    console.error("fetchFinCode error", error.message);
    throw new Error("Unable to fetch Fin Code");
  }
}

module.exports = fetchFinCode;