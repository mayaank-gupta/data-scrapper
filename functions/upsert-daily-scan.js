const { Op } = require('sequelize');

const models = require('../models');
const DailyScanDataModel = models.daily_scan_data;

async function upsertDailyScan(scannerId, tickerList) {
  tickerList = tickerList.sort();

  const dailyScanPayload = {
    scannerId,
    tickerList,
  };

  // select todays data
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysExistingData = await DailyScanDataModel.findOne({
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
  seventhDay.setDate(seventhDay.getDate() - 1);
  seventhDay.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0

  const seventhDaysExistingData = await DailyScanDataModel.findAll({
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
    await DailyScanDataModel.create(dailyScanPayload);
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
        ![
          ...seventhDaysExistingTickerList,
          ...todaysExistingTickerList,
        ].includes(item)
    );

    if (newStocksList.length) {
      // update todays data
      await DailyScanDataModel.update(
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
      (item) => !seventhDaysExistingTickerList.includes(item)
    );

    if (newStocksList.length) {
      // create todays data
      await DailyScanDataModel.create({
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
      (item) => !todaysExistingTickerList.includes(item)
    );

    if (newStocksList.length) {
      // update todays data
      await DailyScanDataModel.update(
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
    await DailyScanDataModel.create({
      scannerId,
      tickerList,
    });
    return tickerList;
  }
}

module.exports = upsertDailyScan;
