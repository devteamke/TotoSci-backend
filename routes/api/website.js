const mongoose = require('mongoose');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = mongoose.model('Users');
const Contact = mongoose.model('Contact');

const Helpers = require('../../helpers/index');
//
const ObjectId = mongoose.Types.ObjectId;
//Add middlware isAdmin,

/**
 *Endpoint contact us *should allow checking if email was sent*
 **/

router.post(
  '/contact_us',

  async (req, res, next) => {
    const { body } = req;
    try {
      console.log('[contact data]', body);
      // throw newError('haha');
      let newContact = await Contact.create({ ...body });
      //Send email notification

      console.log('newContact', newContact);
      res.json({ success: true });
    } catch (err) {
      res.json({ success: false, message: 'An error occured!' });
    }
  }
);

module.exports = router;
