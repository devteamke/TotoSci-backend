const router = require('express').Router();

// router.use('/orders', require('./orders'));
router.use('/social', require('./social'));
router.use('/users', require('./users'));

module.exports = router;