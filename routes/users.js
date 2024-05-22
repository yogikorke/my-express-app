const express = require('express');
const router = express.Router();
const getPaginatedUsers = require('../controllers/getPaginatedUsers');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');

const uri = 'mongodb://localhost:27017';

router.get('/', async (req, res) => {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('tinderApp');

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
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  } finally {
    await client.close();
  }
});

module.exports = router;
