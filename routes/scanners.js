var express = require('express');
var router = express.Router();

const fetchScanClause = require('../functions/fetch-scan-clause');
const safePromise = require('../functions/safe-promise');

const models = require('../models');
const Scanners = models.scanners;

/* GET home page. */
router.get('/', async function (req, res, next) {
  try {
    const scanners = await Scanners.findAll({ where: { isActive: true } });
    return res.json({ success: true, res: scanners });
  } catch (error) {
    console.log('error', error);
    return res.json({
      success: false,
      message: error.message || 'Check root scanner',
      res: [],
    });
  }
});

router.get('/findById', async function (req, res, next) {
  try {
    const { id } = req.query;

    if (!id) {
      throw new Error('Please pass id in query params!');
    }

    const scanner = await Scanners.findByPk(id);
    return res.json({ success: true, res: scanner });
  } catch (error) {
    console.log('error', error);
    return res.json({
      success: false,
      message: error.message || 'Check findByID',
      res: [],
    });
  }
});

router.post('/upsert', async function (req, res, next) {
  try {
    const payload = req.body;

    if (payload.id) {
      let { name, link, scanClause } = payload;

      await Scanners.update(
        { name, link, scanClause },
        {
          where: {
            id: payload.id,
          },
        }
      );
      return res.json({ success: true, res: payload.id });
    }

    const scanner = await Scanners.create(payload);
    res.json({ success: true, res: scanner.id });

    const [error1] = await safePromise(fetchScanClause([scanner]));

    if (error1) {
      // send it to telegram
    }
  } catch (error) {
    console.log('error', error);
    return res.json({
      success: false,
      message: error.message || 'Check findByID',
      res: [],
    });
  }
});

router.post('/remove', async function (req, res, next) {
  try {
    const { id } = req.query;

    if (!id) {
      throw new Error('Please pass id in query params!');
    }

    await Scanners.update(
      { isActive: false },
      {
        where: {
          id,
        },
      }
    );
    return res.json({ success: true, res: {} });
  } catch (error) {
    console.log('error', error);
    return res.json({
      success: false,
      message: error.message || 'Check remove',
      res: [],
    });
  }
});

router.get('/updateAllScanClause', async function (req, res, next) {
  const [error, scanners] = await safePromise(
    Scanners.findAll({
      raw: true,
      where: { isActive: true },
    })
  );

  if (error) {
    return res.json({
      success: false,
      message: error.message || 'Check updateAllScanClause',
      res: [],
    });
  }

  res.json({
    success: true,
    message: 'updating',
    res: {},
  });

  const [error1] = await safePromise(fetchScanClause(scanners));

  if (error1) {
    // send it to telegram
  }
});

module.exports = router;
