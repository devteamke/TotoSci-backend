const mongoose = require('mongoose');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = mongoose.model('Users');
const path = require('path');
const Student = mongoose.model('Students');
const Course = mongoose.model('Courses');
const Conversation = mongoose.model('Conversations');
const Message = mongoose.model('Messages');
const uniqid = require('uniqid');
const Middleware = require('../../Middleware/index');
const Nodemailer = require('nodemailer');
const xoauth2 = require('xoauth2');
const generator = require('generate-password');
const Helpers = require('../../helpers/index');
const fs = require('fs');
//form upload
const formidable = require('formidable');

/**
 *Endpoint for loging in, requires checking if user is active ...*
 **/
router.post('/login', (req, res, next) => {
  const { body } = req;

  if (!body.email) {
    return res.status(422).json({
      errors: {
        email: 'is required'
      }
    });
  }

  if (!body.password) {
    return res.status(422).json({
      errors: {
        password: 'is required'
      }
    });
  }
  let email = body.email;
  let password = body.password;
  let errors = {};
  User.findOne({ email }).then(user => {
    if (!user) {
      return res
        .status(200)
        .json({ success: false, message: 'Incorrect email or password!' });
    }
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        if (user.status !== 'active')
          return res
            .status(200)
            .json({ success: false, message: 'Your account was suspended!' });
        const payload = parseUser(user._doc);

        jwt.sign(
          payload,
          'secret',
          {
            expiresIn: 90000
          },
          (err, token) => {
            if (err) console.error('There is some error in token', err);
            else {
              res.json({
                success: true,
                token: `Bearer ${token}`,

                message: 'You have successfully logged in'
              });
            }
          }
        );
      } else {
        return res
          .status(200)
          .json({ success: false, message: 'Incorrect username or password!' });
      }
    });
  });
});

/**
 *Endpoit for a user completing their profile
 **/
router.post(
  '/complete_profile',
  passport.authenticate('jwt', { session: false }),
  (req, res, next) => {
    const { user } = req;
    const { body } = req;

    User.findById(user._id)
      .then(found => {
        found.salutation = body.salutation ? body.salutation.toLowerCase() : '';
        found.residence = body.residence;
        found.idNumber = body.idNumber;
        found.isSetUp = true;
        found.phone_number.alt = body.alt_phone_number;

        return found;
      })
      .then(found => {
        return found.save();
      })
      .then(saved => {
        const payload = Helpers.parseUser(saved);

        jwt.sign(
          payload,
          'secret',
          {
            expiresIn: 90000
          },
          (err, token) => {
            if (err) console.error('There is some error in token', err);
            else {
              res.json({
                success: true,
                messageg: 'Profile Updated',
                user: Helpers.parseUser(saved),
                token: `Bearer ${token}`
              });
            }
          }
        );
      })
      .catch(err => console.log(err));
  }
);

/**
 *Endpoint for new user *Is here for postmant usage, should be deleted before putting to production*
 **/

router.post('/new', (req, res, next) => {
  const { body } = req;

  if (!body.email) {
    return res.status(422).json({
      errors: {
        email: 'is required'
      }
    });
  }

  if (!body.password) {
    return res.status(422).json({
      errors: {
        password: 'is required'
      }
    });
  }
  if (!body.role) {
    return res.status(422).json({
      errors: {
        role: 'is required'
      }
    });
  }

  if (!body.password) {
    return res.status(422).json({
      errors: {
        password: 'is required'
      }
    });
  }
  if (!body.password_2) {
    return res.status(422).json({
      errors: {
        password_2: 'is required'
      }
    });
  }
  if (body.password != body.password_2) {
    return res.status(422).json({
      errors: {
        password: 'Passwords do not match'
      }
    });
  }

  User.findOne({
    email: body.email
  })
    .then(user => {
      if (user) {
        return res
          .status(200)
          .json({ success: false, message: 'Username already exists' });
      } else {
        const newUser = new User({
          username: body.username,
          email: body.email,
          role: body.role,
          password: body.password
        });

        bcrypt.genSalt(10, (err, salt) => {
          if (err) console.error('There was an error', err);
          else {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) console.error('There was an error', err);
              else {
                newUser.password = hash;
                newUser.save().then(user => {
                  user = user.toObject();
                  delete user.password;
                  const payload = {
                    id: user._id,
                    username: user.username,
                    role: user.role,
                    email: user.email,
                    isSetUp: user.isSetUp
                  };
                  jwt.sign(
                    payload,
                    'secret',
                    {
                      expiresIn: 90000
                    },
                    (err, token) => {
                      if (err)
                        console.error('There is some error in token', err);
                      else {
                        res.json({
                          success: true,
                          token: `Bearer ${token}`,

                          message: 'User added succe'
                        });
                      }
                    }
                  );
                });
              }
            });
          }
        });
      }
    })
    .catch(err => {
      console.log(err);
    });
});

/**
 *Endpoint for deleting users, should be moved to admin, and modified so that an admin cannot delete themself accidentally*
 **/
router.post(
  '/remove',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { body } = req;
    const { user } = req;
    //console.log(user);
    //return
    if (user.role == 'admin') {
      User.find({ email: body.email }).remove(err => {
        if (err) {
          return res.status(400).json({ success: false, message: err.message });
        } else {
          return res
            .status(200)
            .json({ success: true, message: 'User Successfully removed' });
        }
      });
    } else if (user.role == 'principal') {
      User.findById(body.id).then(founduser => {
        //console.log(founduser);

        if (founduser.role == 'admin') {
          return res.status(400).json({
            success: false,
            message: 'You are unauthorized to remove the admin'
          });
        } else {
          founduser.remove(() => {
            return res
              .status(200)
              .json({ success: true, message: 'User Successfully removed' });
          });
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'You are unauthorized to perform the action'
      });
    }
  }
);

/**
 *Endpoint for fetching user profile, remain incase needed for future use*
 **/
router.post(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    User.findById(req.user.id)
      .then(user => {
        user = user.toObject();
        delete user.password;
        delete user.updatedAt;
        delete user.__v;
        delete user.role;
        console.log(user);
        res.json({ success: true, message: 'Query successful', user: user });
      })
      .catch(err => {
        console.log(err);
      });
  }
);

/**
 *Endpoint for upadting user profile, *Should be modified to allow greater client side control*
 **/
router.post(
  '/update_profile',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { body } = req;
    console.log('[data of request]', req.body);
    User.findOneAndUpdate(
      { _id: req.user.id },
      {
        email: body.email,
        fname: body.fname,
        lname: body.lname,
        phone_number: body.phone_number
      },
      { new: true }
    )
      .then(user => {
        user = user.toObject();
        delete user.password;
        delete user.updatedAt;
        delete user.__v;
        delete user.role;
        console.log(user);
        res.json({ success: true, message: 'Query successful', user: user });
      })
      .catch(err => {
        console.log(err);
      });
  }
);

/**
 *Endpoint for a user to change their password*
 **/
router.post(
  '/update_password',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { body } = req;
    const { user } = req;

    let email = user.email;
    let password = body.opass;
    console.log(user);

    let errors = {};
    User.findOne({ email }).then(user => {
      if (!user) {
        return res
          .status(200)
          .json({ success: false, message: 'Failed to update password!' });
      }

      bcrypt.compare(password, user.password).then(isMatch => {
        if (isMatch) {
          bcrypt.genSalt(10, (err, salt) => {
            if (err) console.error('There was an error', err);
            else {
              bcrypt.hash(body.newpass, salt, (err, hash) => {
                if (err) console.error('There was an error', err);
                else {
                  user.password = hash;
                  user.save().then(user => {
                    return res.status(200).json({
                      success: true,
                      message: 'Password updated successfully'
                    });
                  });
                }
              });
            }
          });
        } else {
          return res
            .status(200)
            .json({ success: false, message: 'Old password is invalid!' });
        }
      });
    });
  }
);
/**
 *Endpoint for new auth token, may be usefull in refresh tokens, or after profile change*
 **/
router.post(
  '/new_token',
  passport.authenticate('jwt', { session: false }),
  (req, res, next) => {
    const { user } = req;
    const { body } = req;
    console.log('[user in new token request]');

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      isSetUp: user.isSetUp
    };
    jwt.sign(
      payload,
      'secret',
      {
        expiresIn: 90000
      },
      (err, token) => {
        if (err) console.error('There is some error in token', err);
        else {
          res.json({
            success: true,
            token: `Bearer ${token}`,
            user_id: user._id,
            message: 'new token recieved'
          });
        }
      }
    );
  }
);
/**
 *Endpoint for fetching dashboard data
 **/
router.post(
  '/dash_data',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    const { user } = req;
    const { body } = req;
    try {
      let students = await Student.find().countDocuments();
      let students_male = await Student.find({
        gender: 'male'
      }).countDocuments();
      let students_female = await Student.find({
        gender: 'female'
      }).countDocuments();
      let trainers = await User.find({ role: 'trainer' }).countDocuments();
      let trainers_male = await User.find({
        role: 'trainer',
        gender: 'male'
      }).countDocuments();
      let trainers_female = await User.find({
        role: 'trainer',
        gender: 'female'
      }).countDocuments();
      let instructors = await User.find({
        role: 'instructor'
      }).countDocuments();
      let instructors_male = await User.find({
        role: 'instructor',
        gender: 'male'
      }).countDocuments();
      let instructors_female = await User.find({
        role: 'instructor',
        gender: 'female'
      }).countDocuments();
      let courses = await Course.find({}).countDocuments();
      let studentsRegistrations = await Student.aggregate([
        {
          $project: {
            month: { $month: '$createdAt' }
          }
        },
        {
          $group: {
            _id: '$month',
            count: { $sum: 1 }
          }
        }
      ]);
      let studentsRegistrationsF = await Student.aggregate([
        { $match: { gender: 'female' } },
        {
          $project: {
            month: { $month: '$createdAt' }
          }
        },
        {
          $group: {
            _id: '$month',
            count: { $sum: 1 }
          }
        }
      ]);
      let studentsRegistrationsM = await Student.aggregate([
        { $match: { gender: 'male' } },
        {
          $project: {
            month: { $month: '$createdAt' }
          }
        },
        {
          $group: {
            _id: '$month',
            count: { $sum: 1 }
          }
        }
      ]);
      // const month = [
      //   "January",
      //   "February",
      //   "March",
      //   "April",
      //   "May",
      //   "June",
      //   "July",
      //   "August",
      //   "September",
      //   "October",
      //   "November",
      //   "December"
      // ];
      const month = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sept',
        'Oct',
        'Nov',
        'Dec'
      ];

      let getMonthData = new Promise((resolve, reject) => {
        let count = 0;
        let month2 = studentsRegistrations[0]._id;
        for (let i = 0; i <= 6; i++) {
          //   console.log(i, studentsRegistrations[i]);
          if (studentsRegistrations[i] !== undefined) {
            studentsRegistrations[i] = {
              x: month[month2 - 1],
              y: studentsRegistrations[i].count
            };
          } else if (studentsRegistrations[i] == undefined) {
            let j = i;
            studentsRegistrations.push({
              x: month[month2 - 1],
              y: 0
            });
          }
          if (month2 == 1) {
            month2 = 13;
          }
          if (count == 6) {
            resolve();
            break;
          }
          count++;
          month2--;
        }
      });
      let getMonthDataM = new Promise((resolve, reject) => {
        let count = 0;
        let month2 = studentsRegistrationsM[0]._id;
        for (let i = 0; i <= 6; i++) {
          //   console.log(i, studentsRegistrations[i]);
          if (studentsRegistrationsM[i] !== undefined) {
            studentsRegistrationsM[i] = {
              x: month[month2 - 1],
              y: studentsRegistrationsM[i].count
            };
          } else if (studentsRegistrationsM[i] == undefined) {
            let j = i;
            studentsRegistrationsM.push({
              x: month[month2 - 1],
              y: 0
            });
          }
          if (month2 == 1) {
            month2 = 13;
          }
          if (count == 6) {
            resolve();
            break;
          }
          count++;
          month2--;
        }
      });
      let getMonthDataF = new Promise((resolve, reject) => {
        let count = 0;
        let month2 = studentsRegistrationsF[0]._id;
        for (let i = 0; i <= 6; i++) {
          //   console.log(i, studentsRegistrations[i]);
          if (studentsRegistrationsF[i] !== undefined) {
            studentsRegistrationsF[i] = {
              x: month[month2 - 1],
              y: studentsRegistrationsF[i].count
            };
          } else if (studentsRegistrationsF[i] == undefined) {
            let j = i;
            studentsRegistrationsF.push({
              x: month[month2 - 1],
              y: 0
            });
          }
          if (month2 == 1) {
            month2 = 13;
          }
          if (count == 6) {
            resolve();
            break;
          }
          count++;
          month2--;
        }
      });

      if (studentsRegistrations.length > 0) {
        await getMonthData;
      }
      if (studentsRegistrationsM.length > 0) {
        await getMonthDataM;
      }
      if (studentsRegistrationsF.length > 0) {
        await getMonthDataF;
      }
      await getMonthDataM;
      await getMonthDataF;
      // console.log("students no", students);
      // console.log("trainers", trainers);
      // console.log("instructors", instructors);
      // console.log("courses", courses);

      // console.log("student registrations", studentsRegistrations);
      // console.log("student registrationsM", studentsRegistrationsM);
      // console.log("student registrationsF", studentsRegistrationsF);
      res.json({
        success: true,
        students,
        students_male,
        students_female,
        trainers,
        trainers_male,
        trainers_female,
        instructors,
        instructors_male,
        instructors_female,
        courses,
        studentsRegistrations,
        studentsRegistrationsM,
        studentsRegistrationsF
      });
    } catch (err) {
      console.log(err);
    }
  }
);

/**
 *Endpoint for setting  reset token.*
 **/
router.post('/resetToken', (req, res, next) => {
  const { body } = req;

  if (!body.email) {
    return res.status(422).json({
      errors: {
        email: 'is required'
      }
    });
  }
  let token = generator.generate({
    length: 12,
    numbers: true,
    upercase: true,
    symbol: true
  });
  let expires = new Date();
  console.log(expires.getHours());
  expires.setHours(expires.getHours() + 1);
  console.log(expires.getHours());
  User.findOneAndUpdate(
    { email: body.email },
    { reset: { token, expires: expires } }
  )
    .then(user => {
      const smtpTransport = Nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          type: 'OAuth2',
          user: 'devteamke2018@gmail.com',
          clientId:
            '719159077041-5ritn1ir75ic87p1gjo37c7gr5ko197m.apps.googleusercontent.com',
          clientSecret: 'I5wZkEJ--0dNg5slemh7R33Z',
          refreshToken: '1/0qI_HzCYp26oqIfL49fuRVnayfAwf7VrOfav7ZK9IQs'
        }
      });

      let mailOptions = {
        to: user.email,
        from: 'devteamke2018@gmail.com',
        subject: 'Password Reset',
        html:
          '<h4>Dear sir/madam,</h4>  Click the link below to reset your password. ' +
          '<p>Link:<b> https://school-system-ajske.run.goorm.io/reset/' +
          token +
          '</b> ' +
          '<p> If you did not request a password reset ignore this email.'
      };
      smtpTransport.sendMail(mailOptions, (err, info) => {
        if (err) {
          return res.status(400).json({ success: false, message: err.message });
        } else {
          return res.json({
            success: true,
            message:
              'Reset link sent, check your email address, \n It expires in an hour !'
          });
        }
      });
    })
    .catch(err => {
      console.log(err);
    });
});
/**
 *Endpoint for checking if reset token is valid.*
 **/

router.post('/checkingToken', (req, res, next) => {
  const { body } = req;
  const now = new Date();
  User.findOne({ 'reset.token': body.token, 'reset.expires': { $gt: now } })
    .then(user => {
      console.log('[user from token]', user);

      if (user) {
        res.json({ success: true, _id: user._id });
      } else {
        res.json({ success: false, message: 'Invalid or expired reset token' });
      }
    })
    .catch(err => console.log(err));
});

/**
 *Endpoint for reseting password*
 **/

router.post('/resetPassword', (req, res, next) => {
  const { body } = req;
  let password = body.password;
  User.findOne({ 'reset.token': body.token })
    .then(user => {
      console.log('[user from token]', user);

      if (user) {
        bcrypt.genSalt(10, (err, salt) => {
          if (err) console.error('There was an error', err);
          else {
            bcrypt.hash(password, salt, (err, hash) => {
              if (err)
                return res.json({
                  success: false,
                  message: 'Failed to reset your password!'
                });
              else {
                user.password = hash;
                user.reset = {};
                user
                  .save()
                  .then(() => {
                    res.json({
                      success: true,
                      message: 'Your password reset was successful!'
                    });
                  })
                  .catch(err =>
                    res.json({
                      success: false,
                      message: 'Failed to reset your password!'
                    })
                  );
              }
            });
          }
        });
      } else {
        res.json({ success: false, message: 'Invalid or expired reset token' });
      }
    })
    .catch(err => console.log(err));
});
/*returns all users */

// router.get('/all', (req, res, next) => {
//     return res.send('all');
//   return User.find()
//     .sort({ createdAt: 'descending' })
//     .then((users) => res.json({ users: users.map(user=> user.toJSON()),success:true }))
//     .catch(next);
// });
// /*Fectch a single user*/
// router.get('/:id', (req, res, next) => {
//   return User.find({_id:req.params.id})
//     .sort({ createdAt: 'descending' })
//     .then((users) => res.json({ users: users.map(user=> user.toJSON()),success:true }))
//     .catch(next);
// });

// router.param('id', (req, res, next, id) => {
//   return User.findById(id, (err, user) => {
//     if(err) {
//       return res.sendStatus(404);
//     } else if(user) {
//       req.user = user;
//       return next();
//     }
//   }).catch(next);
// });

// router.get('/:id', (req, res, next) => {
//   return res.json({
//     user: req.user.toJSON(),
//   });
// });
// router.get('/policy', (req, res, next) => {

//   return res.render("policy.ejs");
// });

// router.patch('/:id', (req, res, next) => {
//   const { body } = req;

//   if(typeof body.title !== 'undefined') {
//     req.article.title = body.title;
//   }

//   if(typeof body.author !== 'undefined') {
//     req.article.author = body.author;
//   }

//   if(typeof body.body !== 'undefined') {
//     req.article.body = body.body;
//   }

//   return req.article.save()
//     .then(() => res.json({ article: req.article.toJSON() }))
//     .catch(next);
// });

// router.delete('/:id', (req, res, next) => {
//   return User.findByIdAndRemove(req.article._id)
//     .then(() => res.sendStatus(200))
//     .catch(next);
// });

/**
 *Endpoint for fetching dashboard data
 **/
router.post(
  '/send_message',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    const { user } = req;
    const { body } = req;
    const session = await Conversation.startSession();
    session.startTransaction();
    //console.log('session', session);
    try {
      // const opts = { session };
      //  console.log('body', body);

      let conversation = null;
      if (body.type == 'individual') {
        if (Array.isArray(body.to)) {
          //create a new conversation for each,
          let newConversations = [];
          body.to.map(each => {
            let individualConversation = {
              subject: body.subject,
              type: body.type,
              participants: [each._id, req.user._id],
              lastMessage: {
                content: body.message,
                sender: req.user._id,
                read: false
              },
              addedBy: req.user._id
            };
            newConversations.push(individualConversation);
          });

          let savedNewConversations = await Conversation.create(
            newConversations,
            { session: session }
          );
          console.log('saved new before error');
          // console.log('[saved newConversations]:', savedNewConversations);
          //for attachments
          let attachments = [];
          if (body.attachments) {
            if (body.attachments.length > 0) {
              body.attachments.map(each => {
                //move file to  uploads
                if (each.response) {
                  const source = fs.createReadStream(each.response.url);
                  const dest = fs.createWriteStream(
                    path.join(
                      __dirname + '/../../public/uploads/' + each.response.file
                    )
                  );

                  source.on('error', err => {
                    throw newError(err);
                  });
                  source.pipe(dest);
                  //create file objects
                  let newAttachment = {
                    name: each.name,
                    type: each.type,
                    file: each.response.file,
                    size: each.size
                  };
                  attachments.push(newAttachment);
                }
              });
            }
          }

          //create a new message for each
          let newMessages = [];
          savedNewConversations.map(each => {
            let eachMessage = {
              sender: req.user._id,
              content: body.message,
              conversation: each._id,
              attachments: attachments
            };
            newMessages.push(eachMessage);
          });

          savedNewMessages = await Message.create(newMessages, {
            session: session
          });
          console.log('[saved newMessages]:', savedNewMessages);
          await Promise.all(
            savedNewConversations.map(async each => {
              console.log('each conversation', each);
              let to;

              if (each.participants[0] == each.addedBy) {
                to = each.participants[1];
              } else {
                to = each.participants[0];
              }
              console.log('to id:] ', to);
              let singleEmit = await Conversation.find({
                $and: [
                  {
                    participants: { $in: to }
                  },
                  {
                    'lastMessage.sender': { $ne: to }
                  },
                  {
                    'lastMessage.read': false
                  }
                ]
              })
                .session(session)
                .populate('participants', 'fname lname role')
                .sort({ updatedAt: -1 })
                .limit(10);
              console.log('single emit', singleEmit);
              req.io.sockets.to(to).emit('updateNotifications', singleEmit);
              return new Promise((resolve, reject) => {
                resolve();
              });
            })
          );
          //throw new Error('hehe');
        } else {
          //check if recipient is valid
          let recipient = await User.findOne({ _id: body.to });
          conversation = await Conversation.findOne({
            $and: [
              { participants: { $all: [body.to, req.user._id] } },
              { subject: body.subject }
            ]
          });
          //create new  conversation and use that to create new message
          if (!conversation) {
            conversation = await Conversation.create(
              {
                subject: body.subject,
                type: body.type,
                participants: [body.to, req.user._id],
                lastMessage: {
                  content: body.message,
                  sender: req.user._id,
                  read: false
                },
                addedBy: req.user._id
              },
              { session: session }
            );
            // console.log('new Conversation', conversation);
            // console.log('new Conversation', req.io);
            //req.io.join(conversation[0]._id);
          } else {
            conversation.lastMessage = {
              content: body.message,
              sender: req.user._id,
              read: false
            };

            await conversation.save();
          }
        }
      } else if (body.type == 'broadcast') {
        let recipients = await User.find({ role: body.to });
        recipients = recipients.map(each => {
          return mongoose.Types.ObjectId(each._id);
        });

        console.log(recipients);
        recipients.push(req.user._id);
        conversation = await Conversation.findOne({
          $and: [
            { participants: { $all: recipients } },
            { subject: body.subject }
          ]
        });
        //create new  conversation and use that to create new message
        if (!conversation) {
          conversation = await Conversation.create(
            {
              subject: body.subject,
              type: body.type,
              participants: recipients,
              lastMessage: {
                content: body.message,
                sender: req.user._id,
                read: false
              },
              addedBy: req.user._id
            },
            { session: session }
          );
        } else {
          conversation.lastMessage = {
            content: body.message,
            sender: req.user._id,
            read: false
          };

          await conversation.save();
        }
      }
      //if body.to is not array
      if (!Array.isArray(body.to)) {
        //for attachments
        let attachments = [];
        if (body.attachments) {
          if (body.attachments.length > 0) {
            body.attachments.map(each => {
              //move file to  uploads
              if (each.response) {
                const source = fs.createReadStream(each.response.url);
                const dest = fs.createWriteStream(
                  path.join(
                    __dirname + '/../../public/uploads/' + each.response.file
                  )
                );

                source.on('error', err => {
                  throw newError(err);
                });
                source.pipe(dest);
                //create file objects
                let newAttachment = {
                  name: each.name,
                  type: each.type,
                  file: each.response.file,
                  size: each.size
                };
                attachments.push(newAttachment);
              }
            });
          }
        }

        console.log('attachments', attachments);
        //  throw new Error('haha');
        //Check if conversation exists depending on type

        console.log('conversation', conversation);
        let newMessage;
        if (Array.isArray(conversation)) {
          newMessage = await Message.create(
            {
              sender: req.user._id,
              content: body.message,
              conversation: conversation[0]._id,
              attachments: attachments
            },
            { session: session }
          );
        } else {
          newMessage = await Message.create(
            {
              sender: req.user._id,
              content: body.message,
              conversation: conversation._id,
              attachments: attachments
            },
            { session: session }
          );
        }

        //console.log('new Message', newMessage);

        //if existing use existing id to create message

        if (body.type == 'individual') {
          console.log('sending To', body.to);
          req.io.sockets.to(body.to).emit('newMessage', newMessage);
          req.io.sockets.to(req.user._id).emit('newMessage', newMessage);
        }

        //Emit to recipient
        if (body.type == 'individual') {
          //update notifications for recipient
          let conversations = await Conversation.find({
            $and: [
              {
                participants: { $in: body.to }
              },
              {
                'lastMessage.sender': { $ne: body.to }
              },
              {
                'lastMessage.read': false
              }
            ]
          })
            .populate('participants', 'fname lname role')
            .sort({ updatedAt: -1 })
            .limit(10);

          req.io.sockets.to(body.to).emit('updateNotifications', conversations);
        } else if (body.type == 'broadcast') {
          // //Emit to all  new broadcast
          // let broadcasts = await Conversation.find({
          //   $and: [
          //     {
          //       participants: { $all: recipients }
          //     },
          //     {
          //       'lastMessage.sender': { $ne: body.to }
          //     },
          //     {
          //       'lastMessage.read': false
          //     }
          //   ]
          // })
          //   .populate('participants', 'fname lname role')
          //   .sort({ updatedAt: -1 })
          //   .limit(10);
          // req.io.sockets.to(body.to).emit('newBroadCast', broadcasts);
        }
      }

      await session.commitTransaction();
      session.endSession();
      res.json({
        success: true,
        message: 'Your message was sent successfully'
      });
    } catch (err) {
      console.log(err.message);
      await session.abortTransaction();
      //  session.endSession();
      if (err.message.includes('Cast to ObjectId failed for value')) {
        res.json({
          success: false,
          message:
            'Invalid recipient, ensure you have selected from autocomplete'
        });
      }
      res.json({ success: false, message: err.message });
    }
  }
);
/**
 *Endpoint for fetching conversation messages and update notifications
 **/
router.post(
  '/fetch_conversation_messages',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    const { user } = req;
    const { body } = req;
    try {
      console.log('body ', body);

      //Save new message
      let messages = await Message.find({
        conversation: body.conversation
      });
      //Update read
      let conversation = await Conversation.findOneAndUpdate(
        { _id: body.conversation },
        { 'lastMessage.read': true }
      );
      console.log('conversation', conversation);
      //find and emit unopened converstations
      let conversations = await Conversation.find({
        $and: [
          {
            participants: { $in: req.user._id }
          },
          {
            'lastMessage.sender': { $ne: req.user._id }
          },
          {
            'lastMessage.read': false
          }
        ]
      })
        .populate('participants', 'fname lname role')
        .sort({ createAt: -1 })
        .limit(10);
      req.io.sockets
        .to(req.user._id)
        .emit('updateNotifications', conversations);

      //Update messages to read
      let updateMessages = await Message.update(
        { conversation: body.conversation, sender: { $ne: req.user._id } },
        { read: true },
        { multi: true }
      );
      //console.log('fetched Messages', messages);
      //req.io.sockets.emit('newMessage', newMessage);
      res.json({
        success: true,
        message: 'haha',
        messages: messages
      });
    } catch (err) {
      console.log(err.message);

      res.json({ success: false, message: err.message });
    }
  }
);

/**
 *Endpoint for sending messages reply
 **/
router.post(
  '/send_message_reply',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    const { user } = req;
    const { body } = req;
    try {
      console.log('body ', body);

      //find and update converstation

      let conversation = await Conversation.findOneAndUpdate(
        { _id: body.conversation._id },
        {
          lastMessage: {
            content: body.message,
            sender: req.user._id,
            read: false
          }
        }
      );

      //Save new message
      let newMessage = await Message.create({
        sender: req.user._id,
        content: body.message,
        conversation: conversation._id
      });
      req.io.sockets.to(req.user._id).emit('newMessage', newMessage);
      //update notifications for recipient
      let recipient;
      if (typeof body.conversation.participants[0] !== 'string') {
        if (body.conversation.participants[0]._id == req.user._id) {
          recipient = body.conversation.participants[1]._id;
        } else {
          recipient = body.conversation.participants[0]._id;
        }
      } else {
        if (body.conversation.participants[0] == req.user._id) {
          recipient = body.conversation.participants[1];
        } else {
          recipient = body.conversation.participants[0];
        }
      }

      let conversations = await Conversation.find({
        $and: [
          {
            participants: { $in: recipient }
          },
          {
            'lastMessage.sender': { $ne: recipient }
          },
          {
            'lastMessage.read': false
          }
        ]
      })
        .populate('participants', 'fname lname role')
        .sort({ updatedAt: -1 })
        .limit(10);

      //Emit to recipient
      if (body.conversation.type == 'individual') {
        console.log(
          'recipient',
          recipient,
          'conversations',
          conversations.length
        );
        /**Should revisit this later */
        // req.io.sockets.to(recipient).emit('newMessage', newMessage);
        req.io.sockets.to(recipient).emit('updateNotifications', conversations);
      }
      res.json({
        success: true,
        message: 'Your message was sent successfully',
        newMessage
      });
    } catch (err) {
      console.log(err.message);

      res.json({ success: false, message: err.message });
    }
  }
);

/**
 *Endpoint for fetching notifications
 **/
router.post(
  '/fetch_notifications',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    const { user } = req;
    const { body } = req;
    try {
      //console.log("body  notifitications", body);
      //find conversations of indiviatial which i am a participant,
      //check if that converstation I was not the sender of the last unread message
      //{ $ne: req.user._id }
      let messages = await Conversation.find({
        $and: [
          {
            participants: { $in: req.user._id }
          },
          {
            'lastMessage.sender': { $ne: req.user._id }
          },
          {
            'lastMessage.read': false
          }
        ]
      })
        .populate('participants', 'fname lname role')
        .sort({ updatedAt: -1 })
        .limit(10);
      let individual = [];
      let broadcasts = [];

      //console.log(conversations);
      res.json({
        success: true,
        message: 'notifications fetched',
        messages: messages
      });
    } catch (err) {
      console.log(err.message);

      res.json({ success: false, message: err.message });
    }
  }
);
/**
 *Endpoint for uploading attachments
 **/
router.post(
  '/upload',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    let newFileName;
    new formidable.IncomingForm()
      .parse(req)
      .on('fileBegin', (name, file) => {
        console.log('file ext ', path.extname(file.name));
        newFileName = uniqid('file_') + path.extname(file.name);
        console.log('old path', file.path);
        file.path =
          path.join(__dirname + '/../../public/uploads/tmp/') + newFileName;
      })
      .on('file', (name, file) => {
        console.log('Uploaded file', name, file);
        res.json({
          name: file.name,
          status: 'done',
          url: file.path,
          file: newFileName
        });
      });

    // });
  }
);
const parseUser = user => {
  if (user.role == 'admin') {
    delete user.students;
    delete user.trainers;
    delete user.instructors;
    delete user.courses;
  }
  delete user.password;
  delete user.__v;
  return user;
};
module.exports = router;
