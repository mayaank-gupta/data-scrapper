const { Op } = require('sequelize');

const models = require('../models');
const NewDailyScanDataModel = models.new_daily_scan_data;

async function upsertNewDailyScan(scannerId, tickerList) {
  tickerList = tickerList.map((item) => {
    return {
      name: item.symbol,
      price: item.price,
      time: item.time ? item.time : '',
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

  // select seventhDays data
  const seventhDay = new Date();
  seventhDay.setDate(seventhDay.getDate() - 7);
  seventhDay.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0

  const seventhDaysExistingData = await NewDailyScanDataModel.findAll({
    raw: true,
    where: {
      scannerId: scannerId,
      createdDate: {
        [Op.gte]: seventhDay, // Greater than or equal to seventhDay
        [Op.lt]: today, // Less than today
      },
    },
  });

  if (
    (seventhDaysExistingData === null || seventhDaysExistingData.length < 1) &&
    todaysExistingData === null
  ) {
    await NewDailyScanDataModel.create(newDailyScanPayload);
    return tickerList;
  }

  let seventhDaysExistingTickerList = [];
  if (seventhDaysExistingData !== null) {
    // Extract tickerList arrays and merge them into a single array
    let allTickerLists = seventhDaysExistingData
      .map((item) => item.tickerList)
      .flat();

    // Remove duplicates from the array
    allTickerLists = allTickerLists.filter(
      (ticker, index, self) =>
        index === self.findIndex((t) => t.name === ticker.name)
    );

    seventhDaysExistingTickerList = allTickerLists;
  }

  let todaysExistingTickerList = [];
  if (todaysExistingData !== null) {
    todaysExistingTickerList = todaysExistingData.tickerList;
  }

  // compare with both days and update
  if (seventhDaysExistingTickerList.length && todaysExistingTickerList.length) {
    const newStocksList = tickerList.filter(
      (item) =>
        ![...seventhDaysExistingTickerList, ...todaysExistingTickerList].some(
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
    seventhDaysExistingTickerList.length &&
    !todaysExistingTickerList.length
  ) {
    const newStocksList = tickerList.filter(
      (item) =>
        !seventhDaysExistingTickerList.some(
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
    !seventhDaysExistingTickerList.length &&
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
