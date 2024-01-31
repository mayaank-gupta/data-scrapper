const { Op } = require('sequelize');

const models = require('../models');
const NewDailyScanDataModel = models.new_daily_scan_data;

async function upsertNewDailyScan(scannerId, tickerList) {
  tickerList = tickerList.map((item) => {
    return {
      name: item.symbol,
      price: item.price,
      time: time,
    };
  });

  const newDailyScanPayload = {
    scannerId,
    tickerList,
  };

  // select todays data
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysExistingData = await NewDailyScanDataModel.findOne({
    raw: true,
    where: {
      scannerId: scannerId,
      createdDate: {
        [Op.gte]: today, // Greater than or equal to today
        [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Less than tomorrow
      },
    },
  });

  // select yesterdays data
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0

  const yesterdaysExistingData = await NewDailyScanDataModel.findOne({
    raw: true,
    where: {
      scannerId: scannerId,
      createdDate: {
        [Op.gte]: yesterday, // Greater than or equal to yesterday
        [Op.lt]: today, // Less than today
      },
    },
  });

  if (yesterdaysExistingData === null && todaysExistingData === null) {
    await NewDailyScanDataModel.create(newDailyScanPayload);
    return tickerList;
  }

  let yesterdaysExistingTickerList = [];
  if (yesterdaysExistingData !== null) {
    yesterdaysExistingTickerList = yesterdaysExistingData.tickerList;
  }

  let todaysExistingTickerList = [];
  if (todaysExistingData !== null) {
    todaysExistingTickerList = todaysExistingData.tickerList;
  }

  // compare with both days and update
  if (yesterdaysExistingTickerList.length && todaysExistingTickerList.length) {
    const newStocksList = tickerList.filter(
      (item) =>
        ![...yesterdaysExistingTickerList, ...todaysExistingTickerList].some(
          (existingItem) => existingItem.name === item.name
        )
    );

    if (newStocksList.length) {
      // update todays data
      await NewDailyScanDataModel.update(
        {
          tickerList: [...todaysExistingTickerList, ...newStocksList],
        },
        {
          where: {
            id: todaysExistingData.id,
          },
        }
      );

      return newStocksList;
    }
  } else if (
    yesterdaysExistingTickerList.length &&
    !todaysExistingTickerList.length
  ) {
    const newStocksList = tickerList.filter(
      (item) =>
        !yesterdaysExistingTickerList.some(
          (existingItem) => existingItem.name === item.name
        )
    );

    if (newStocksList.length) {
      // create todays data
      await NewDailyScanDataModel.create({
        scannerId,
        tickerList: newStocksList,
      });

      return newStocksList;
    }
  } else if (
    !yesterdaysExistingTickerList.length &&
    todaysExistingTickerList.length
  ) {
    // compare with today and update
    const newStocksList = tickerList.filter(
      (item) =>
        !todaysExistingTickerList.some(
          (existingItem) => existingItem.name === item.name
        )
    );

    if (newStocksList.length) {
      // update todays data
      await NewDailyScanDataModel.update(
        {
          tickerList: [...todaysExistingTickerList, ...newStocksList],
        },
        {
          where: {
            id: todaysExistingData.id,
          },
        }
      );

      return newStocksList;
    }
  } else {
    // create todays data
    await NewDailyScanDataModel.create({
      scannerId,
      tickerList,
    });
    return tickerList;
  }
}

module.exports = upsertNewDailyScan;
