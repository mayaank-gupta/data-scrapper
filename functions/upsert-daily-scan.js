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

  // select yesterdays data
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0

  const yesterdaysExistingData = await DailyScanDataModel.findOne({
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
    await DailyScanDataModel.create(dailyScanPayload);
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
        ![
          ...yesterdaysExistingTickerList,
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
    yesterdaysExistingTickerList.length &&
    !todaysExistingTickerList.length
  ) {
    const newStocksList = tickerList.filter(
      (item) => !yesterdaysExistingTickerList.includes(item)
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
    !yesterdaysExistingTickerList.length &&
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
