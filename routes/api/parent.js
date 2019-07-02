const mongoose = require('mongoose');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = mongoose.model('Users');
const Student = mongoose.model('Students');
const Class = mongoose.model('Class');
const Attendance = mongoose.model('Attendance');
const Course = mongoose.model('Courses');
const Conversation = mongoose.model('Conversations');
const Message = mongoose.model('Messages');
const Middleware = require('../../Middleware/index');
const Validator = require('validator');
const Nodemailer = require('nodemailer');
const Lowercase = require('lower-case');
const xoauth2 = require('xoauth2');
const generator = require('generate-password');

const Helpers = require('../../helpers/index');
//
const ObjectId = mongoose.Types.ObjectId;
//Add middlware isAdmin,

router.post(
  '/all_courses',
  passport.authenticate('jwt', { session: false }),
  Middleware.isParent,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;
    let st = [{ role: 'parent' }];
    let ft = {};
    //console.log(body, user);

    if (body.query) {
      ft = {
        $or: [
          { name: { $regex: body.query, $options: 'i' } },
          { description: { $regex: body.query, $options: 'i' } },

          { charge: { $regex: body.query, $options: 'i' } }
        ]
      };
    }

    // 	//console.log('[filter]', ft);
    // //console.log('[type]', st);
    let aggregate = Course.aggregate()
      .match(ft)
      .lookup({
        from: 'users',
        let: { userId: '$addedBy' },
        pipeline: [
          { $addFields: { userId: { $toObjectId: '$userId' } } },
          { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
          { $project: { fname: 1, lname: 1, email: 1, role: 1 } }
        ],

        as: 'addedBy'
      });

    Course.aggregatePaginate(aggregate, {
      page: body.page,
      limit: body.limit
    })
      .then(result => {
        //console.log("[results]", result);
        res.status(200).json({ success: true, result: result });
      })
      .catch(err => {
        //console.log(err);
      });
  }
);
/**
 * Endpoint for fetching students for specific parent
 **/
router.post(
  '/my_students',
  passport.authenticate('jwt', { session: false }),
  Middleware.isParent,
  async (req, res, next) => {
    const { body } = req;
    const { user } = req;

    let ft = {};

    if (body.query) {
      ft = {
        $and: [
          { parent: user._id },
          {
            $or: [
              { fname: { $regex: body.query, $options: 'i' } },

              { lname: { $regex: body.query, $options: 'i' } }
            ]
          }
        ]
      };
    } else {
      ft = {
        parent: user._id
      };
    }
    console.log(ft);
    try {
      let myStudents = await Student.aggregate([
        {
          $match: ft
        },
        {
          //console.log(studentId)
          $lookup: {
            from: 'classes',
            let: { studentId: '$_id' },
            pipeline: [
              { $addFields: { studentId: { $toObjectId: '$studentId' } } },
              { $match: { $expr: { $in: ['$$studentId', '$students'] } } },
              {
                $project: {
                  name: 1,
                  duration: 1,
                  start_time: 1,
                  trainer: 1,
                  day: 1,
                  course: 1
                }
              }
            ],

            as: 'class'
          }
        },

        {
          $lookup: {
            from: 'schools',
            let: { schoolId: '$school' },
            pipeline: [
              { $addFields: { schoolId: { $toObjectId: '$schoolId' } } },
              { $match: { $expr: { $eq: ['$_id', '$$schoolId'] } } },
              { $project: { name: 1, county: 1, sub_county: 1 } }
            ],

            as: 'school'
          }
        },
        {
          $lookup: {
            from: 'users',
            let: { userId: '$addedBy' },
            pipeline: [
              { $addFields: { userId: { $toObjectId: '$userId' } } },
              { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
              { $project: { fname: 1, lname: 1, email: 1, role: 1 } }
            ],

            as: 'addedBy'
          }
        }
      ]);
      //console.log(myStudents);
      let mStudents = myStudents.map((each, i) => {
        return { ...each, key: i };
      });

      res.status(200).json({ success: true, result: mStudents });
    } catch (err) {
      console.log(err);
    }
  }
);

/**
 * Endpoint for fetching courses registered to a given student
 **/

router.post(
  '/fetch_course',
  passport.authenticate('jwt', { session: false }),
  Middleware.isParent,
  async (req, res, next) => {
    const { body } = req;
    const { user } = req;
    //console.log(body);
    let ft = {
      students: { $in: [mongoose.Types.ObjectId(body.studentId)] }
    };
    try {
      let classes = await Class.aggregate([
        {
          $match: ft
        }
      ])
        .project({
          __v: 0
        })

        .lookup({
          from: 'courses',
          let: { courseId: '$course' },
          pipeline: [
            { $addFields: { courseId: { $toObjectId: '$courseId' } } },
            { $match: { $expr: { $eq: ['$_id', '$$courseId'] } } },
            { $project: { name: 1, description: 1, charge: 1 } }
          ],

          as: 'course'
        })
        .lookup({
          from: 'users',
          let: { userId: '$trainer' },
          pipeline: [
            { $addFields: { userId: { $toObjectId: '$userId' } } },
            { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
            {
              $project: { fname: 1, lname: 1, email: 1, phone_number: 1 }
            }
          ],

          as: 'trainer'
        })
        .lookup({
          from: 'attendances',
          let: { classId: '$_id' },
          pipeline: [
            { $addFields: { classId: { $toObjectId: '$classId' } } },
            { $match: { $expr: { $eq: ['$_class', '$$classId'] } } },
            { $project: { week: 1, remarks: 1, lesson_time: 1 } }
          ],

          as: 'attendance'
        });
      classes = classes.map((each, i) => {
        each.attendance.map((atn, j) => {
          each.attendance[j] = { ...atn, ident: i };
        });
        //console.log(each.attendance);
        return { ...each, key: i };
      });
      //console.log(classes);

      res.status(200).json({ success: true, result: classes });
    } catch (err) {
      console.log(err);
    }
  }
);
/**

/**
 *Endpoint fo getting a paginated list of all users, *should only be accessible by admin and also omit the current user requesting *
 **/
router.post(
  '/all',
  passport.authenticate('jwt', { session: false }),
  Middleware.isTrainer,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;
    let st = [{ role: 'parent' }, { role: 'trainer' }, { role: 'instructor' }];
    let ft = {};

    if (body.query) {
      ft = {
        $or: [
          { email: { $regex: body.query, $options: 'i' } },
          { fname: { $regex: body.query, $options: 'i' } },
          { role: { $regex: body.query, $options: 'i' } },
          { status: { $regex: body.query, $options: 'i' } },
          { oname: { $regex: body.query, $options: 'i' } }
        ]
      };
    }

    // 	console.log('[filter]', ft);
    // console.log('[type]', st);
    let aggregate = User.aggregate()
      .match({
        $and: [
          {
            $or: st
          },
          ft,
          {
            _id: { $ne: user._id }
          }
        ]
      })
      .lookup({
        from: 'users',
        let: { userId: '$addedBy' },
        pipeline: [
          { $addFields: { userId: { $toObjectId: '$userId' } } },
          { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
          { $project: { fname: 1, lname: 1 } }
        ],

        as: 'addedBy'
      })
      .project({
        password: 0,
        isSetUp: 0
      });

    User.aggregatePaginate(aggregate, {
      page: body.page,
      limit: body.limit
    })
      .then(result => {
        console.log('[results]', result);
        res.status(200).json({ success: true, result: result });
      })
      .catch(err => {
        console.log(err);
      });
  }
);

/**
 *Endpoint for changing subordinates password
 **/

router.patch(
  '/password',
  passport.authenticate('jwt', { session: false }),
  Middleware.isTrainer,
  (req, res, next) => {
    const { body } = req;
    const _id = body._id;
    let password = body.password;

    bcrypt.genSalt(10, (err, salt) => {
      if (err) console.error('There was an error', err);
      else {
        bcrypt.hash(password, salt, (err, hash) => {
          if (err)
            return res.json({
              success: false,
              message: 'Failed to update password!'
            });
          else {
            User.findOneAndUpdate(
              { _id: _id },
              { password: hash },
              { new: true, projection: { password: 0 } }
            )
              .then(user => {
                console.log('{new}', user);

                res.json({ success: true, message: 'User password updated!' });
              })
              .catch(err =>
                res.json({
                  success: false,
                  message: 'Failed to update password!'
                })
              );
          }
        });
      }
    });
  }
);

/**
*Endpoint for changing subordinates profile

**/

router.patch(
  '/save_profile',
  passport.authenticate('jwt', { session: false }),
  Middleware.isManager,
  (req, res, next) => {
    const { user } = req.body;
    let user2 = { ...user };

    delete user2.createdAt;
    delete user2.createdAt;
    delete user2._id;
    delete user2.__v;
    console.log('[user]', user);
    User.findOneAndUpdate({ _id: user._id }, user2, {
      new: true,
      projection: { password: 0, __v: 0 }
    })
      .then(newUser => {
        console.log('{new}', newUser);
        newUser = newUser.toObject();
        res.json({
          success: true,
          user: newUser,
          message: 'User info updated!'
        });
      })
      .catch(err => console.log(err));
  }
);
/**
 *Endpoint for recipients*
 **/
router.post(
  '/fetch_recipients',
  passport.authenticate('jwt', { session: false }),
  Middleware.isParent,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;
    console.log('currentInstructor', user._id);
    User.find({
      $or: [{ role:'chief-trainer'}]
    })
      .then(result => {
        console.log('[results]', result);
        return result.map(each => {
          return Helpers.parseUser(each);
        });
      })
      .then(result => {
        res.status(200).json({ success: true, result });
      })
      .catch(err => {
        //console.log(err);
      });
  }
);

/**
 *Endpoint for fetching  conversations*
 **/
router.post(
  '/fetch_messages',
  passport.authenticate('jwt', { session: false }),
  Middleware.isParent,
  async (req, res, next) => {
    const { body } = req;
    const { user } = req;

    try {
      let conversations = await Conversation.aggregate([
        {
          $match: {
            participants: { $in: [req.user._id] }
          }
        },
        {
          $lookup: {
            from: 'users',
            let: { participants: '$participants' },
            pipeline: [
              { $addFields: { participants: '$participants' } },
              { $match: { $expr: { $in: ['$_id', '$$participants'] } } },
              { $project: { fname: 1, lname: 1, role: 1 } }
            ],

            as: 'participantsFull'
          }
        },
        { $sort: { createdAt: -1 } }
      ]);
      //Get last message, split into types, get receiver if its to individual
      let individual = [];
      let broadcasts = [];
      conversations = conversations.map(each => {
        if (each.type == 'individual') {
          if (
            each.participantsFull[0]._id.toString() == req.user._id.toString()
          ) {
            each.recipient =
              Helpers.capitalize(each.participantsFull[1].fname) +
              ' ' +
              Helpers.capitalize(each.participantsFull[1].lname) +
              ' -(' +
              Helpers.capitalize(each.participantsFull[1].role) +
              ')';
          } else {
            each.recipient =
              Helpers.capitalize(each.participantsFull[0].fname) +
              ' ' +
              Helpers.capitalize(each.participantsFull[0].lname) +
              ' -(' +
              Helpers.capitalize(each.participantsFull[0].role) +
              ')';
          }
          individual.push(each);
        } else {
          each.recipient = Helpers.capitalize(each.participantsFull[0].role);
          broadcasts.push(each);
        }

        return each;
      });
      let plusUnread = await Promise.all(
        conversations.map(each => {
          return new Promise((resolve, reject) => {
            Message.find({
              conversation: each._id,
              read: false,
              sender: { $ne: req.user._id }
            })
              .count()
              .then(count => {
                console.log(count);
                each.unread = count;
                resolve(each);
              });
          });
        })
      );
      // console.log('plusUnread', plusUnread);
      res.json({
        success: true,
        conversations: plusUnread,
        individual,
        broadcasts
      });
    } catch (err) {
      console.log(err);
      res.json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
