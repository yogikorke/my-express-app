var express = require('express');
var router = express.Router();

router.get('/healthcheck', (req, res) => {
    res.status(200).send('OK');
});

module.exports = router;