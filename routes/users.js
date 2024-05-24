const express = require('express');
const router = express.Router();
const getPaginatedUsers = require('../controllers/getPaginatedUsers');
const { ObjectId } = require('mongodb');

router.get('/', async (req, res) => {
  const db = req.app.locals.db;

  // console.log("req.query.userId: ", req.query.userId);

  const currentUser = {
    _id: new ObjectId(req.query.userId),
    agePreference: { min: parseInt(req.query.minAge), max: parseInt(req.query.maxAge) },
    genderPreference: req.query.gender,
    location: { type: 'Point', coordinates: [parseFloat(req.query.lon), parseFloat(req.query.lat)] }
  };

  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;

  try {
    const users = await getPaginatedUsers(db, currentUser, page, pageSize);
    // console.log("users: ", users);
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
