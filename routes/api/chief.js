const mongoose = require('mongoose');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = mongoose.model('Users');
const Student = mongoose.model('Students');
const Course = mongoose.model('Courses');
const Message = mongoose.model('Messages');
const Parent = mongoose.model('Parents');
const Class = mongoose.model('Class');
const School = mongoose.model('Schools');
const Conversation = mongoose.model('Conversations');
const Middleware = require('../../Middleware/index');
const Validator = require('validator');
const Nodemailer = require('nodemailer');
const Lowercase = require('lower-case');
const xoauth2 = require('xoauth2');
const generator = require('generate-password');
const uniqid = require('uniqid');
const assert = require('assert');
const Helpers = require('../../helpers/index');
//const Invoice = require("nodeice");
const ObjectId = mongoose.Types.ObjectId;
const fs = require('fs'),
  pdf = require('html-pdf'),
  path = require('path'),
  ejs = require('ejs');
/**
 *Endpoint for registering admins *should allow checking if email was sent*
 **/
router.post(
  '/register',
  passport.authenticate('jwt', { session: false }),
  Middleware.isChief,
  async (req, res, next) => {
    let { body } = req;

    //console.log(body);
    //const p=Lowercase(...body);
    if (body.role == 'trainer') {
      let school = await School.findById(body.school);
      body = { ...body, county: school.county, sub_county: school.sub_county };
      //console.log("[trainer body]", body);
    }
    //return res.send("err");
    let password = generator.generate({
      length: 8,
      numbers: true,
      upercase: true,
      symbol: true
    });
    let sendpasssword = password;

    User.findOne({
      $or: [{ email: body.email }]
    }).then(user => {
      if (user) {
        return res
          .status(200)
          .json({ success: false, message: 'Email is  already use!' });
      } else {
        const newUser = new User({
          ...body,

          addedBy: req.user._id,
          password: password
        });

        bcrypt.genSalt(10, (err, salt) => {
          if (err) console.error('There was an error', err);
          else {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) console.error('There was an error', err);
              else {
                newUser.password = hash;
                newUser.save().then(user => {
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
                      refreshToken:
                        '1/0qI_HzCYp26oqIfL49fuRVnayfAwf7VrOfav7ZK9IQs'
                    }
                  });
                  let as;
                  as =
                    user.role.indexOf('-') > 0
                      ? Helpers.capitalize(
                          user.role.split('-')[0] +
                            ' ' +
                            Helpers.capitalize(user.role.split('-')[1])
                        )
                      : Helpers.capitalize(user.role);

                  let mailOptions = {
                    to: user.email,
                    from: 'devteamke2018@gmail.com',
                    subject: 'TotoSci Academy',
                    html:
                      '<h4>Hello ' +
                      Helpers.capitalize(user.fname) +
                      ',</h4>  You have been  added to TotoSci Academy  as a ' +
                      as +
                      '<p>Login with the following details: ' +
                      '<p><b>Email</b>: ' +
                      user.email +
                      '</p><p> <b>Password</b>: ' +
                      sendpasssword +
                      '</p>'
                  };
                  smtpTransport.sendMail(mailOptions, (err, info) => {
                    if (err) {
                      return res
                        .status(400)
                        .json({ success: false, message: err.message });
                    } else {
                      return res.status(200).json({
                        success: true,
                        message:
                          'Registration successful.An email has been sent to the new user for login details!'
                      });
                    }
                  });
                });
              }
            });
          }
        });
      }
    });
  }
);

/**
 *Endpoint for adding parent to student already registered *should allow checking if email was sent*
 **/

router.post(
  '/add_parent',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    const { body, user } = req;
    console.log(body);

    let newUser = {
      ...body.parent
    };
    if (body.existing) {
      Student.findOneAndUpdate(
        { _id: body._id },
        { parent: body.parent },
        {
          new: true
        }
      )
        .then(newUser => {
          console.log('New Student', newUser);
          newSchool = newUser.toObject();
          res.status(200).json({
            success: true,
            user: newSchool,
            message: 'User details updated!'
          });
        })
        .catch(err => console.log(err));
    } else {
      let password = generator.generate({
        length: 8,
        numbers: true,
        upercase: true,
        symbol: true
      });
      let sendpasssword = password;

      User.findOne({
        $or: [{ email: body.parent.email }]
      }).then(user => {
        if (user) {
          return res
            .status(200)
            .json({ success: false, message: 'Email is  already use!' });
        } else {
          const newUser = new User({
            ...body.parent,
            role: 'parent',
            addedBy: req.user._id,
            password: password
          });

          bcrypt.genSalt(10, (err, salt) => {
            if (err) console.error('There was an error', err);
            else {
              bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) console.error('There was an error', err);
                else {
                  newUser.password = hash;
                  newUser.save().then(async user => {
                    await Student.findOneAndUpdate(
                      { _id: body._id },
                      { parent: user._id },
                      {
                        new: true
                      }
                    );

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
                        refreshToken:
                          '1/0qI_HzCYp26oqIfL49fuRVnayfAwf7VrOfav7ZK9IQs'
                      }
                    });
                    let as;
                    as =
                      user.role.indexOf('-') > 0
                        ? Helpers.capitalize(
                            user.role.split('-')[0] +
                              ' ' +
                              Helpers.capitalize(user.role.split('-')[1])
                          )
                        : Helpers.capitalize(user.role);

                    let mailOptions = {
                      to: user.email,
                      from: 'devteamke2018@gmail.com',
                      subject: 'TotoSci Academy',
                      html:
                        '<h4>Hello ' +
                        Helpers.capitalize(user.fname) +
                        ',</h4>  You have been  added to TotoSci Academy  as a ' +
                        as +
                        '<p>Login with the following details: ' +
                        '<p><b>Email</b>: ' +
                        user.email +
                        '</p><p> <b>Password</b>: ' +
                        sendpasssword +
                        '</p>'
                    };
                    smtpTransport.sendMail(mailOptions, (err, info) => {
                      if (err) {
                        return res
                          .status(400)
                          .json({ success: false, message: err.message });
                      } else {
                        return res.status(200).json({
                          success: true,
                          message: 'Details successfully updated!'
                        });
                      }
                    });
                  });
                }
              });
            }
          });
        }
      });
    }
  }
);
/**
 *Endpoint for registering parent and student *should allow checking if email was sent*
 **/

router.post(
  '/new_student',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    const { body } = req;
    console.log('[new_student body ]', body);

    let student = {
      fname: body.studentFname,
      lname: body.studentLname,
      school: body.school,
      gender: body.gender,
      admissionNumber: body.admNo,
      DOB: body.DOB,
      isSponsored: body.isSponsored
    };

    let parent = {
      fname: body.parentFname,
      lname: body.parentLname,
      gender: body.parentGender,
      email: body.email,
      role: 'parent',
      phone_number: body.phone_number
    };
    //  console.log('[parent to create]', parent);

    //const p=Lowercase(...body);
    //ddd

    let password = generator.generate({
      length: 8,
      numbers: true,
      upercase: true,
      symbol: true
    });
    let sendpasssword = password;
    let session = null;

    let collections = mongoose.connections[0].collections;
    let names = [];

    Object.keys(collections).forEach(function(k) {
      names.push(k);
    });

    if (!names.includes('parents')) {
      Parent.createCollection();
    }

    await Student.createCollection();
    if (!names.includes('students')) {
    }

    Promise.resolve()
      .then(() => User.startSession())
      .then(_session => {
        session = _session;
        session.startTransaction();
      })
      .then(() => {
        if (body.isSponsored || (body.addLater && !body.existingParent)) {
          return;
        } else if (body.existingParent) {
          return User.findById(body.existingParent).session(session);
        } else {
          //Create parent
          return User.findOne({
            email: body.email
          })

            .then(user => {
              if (user) {
                throw new Error('Email  already in use');
              } else {
                let password = sendpasssword;

                return bcrypt.genSalt(10).then(salt => {
                  return { salt, password };
                });
              }
            })
            .then(obj => {
              return bcrypt.hash(obj.password, obj.salt).then(hash => {
                return User.create(
                  [
                    {
                      ...parent,

                      addedBy: req.user._id,
                      password: hash
                    }
                  ],
                  { session: session }
                ).then(saved => {
                  return saved;
                });
              });
            });
        }
      })

      .then(async user => {
        //Create new student
        console.log('createdParent', user);

        if (Array.isArray(user)) {
          user = user[0];
        }
        let password = null;
        if (body.mode == 'school-based') {
          (password = body.admNo),
            Promise.resolve()
              .then(() => {
                return bcrypt.genSalt(10).then(salt => {
                  return { salt, password };
                });
              })
              .then(obj => {
                return bcrypt.hash(password, obj.salt).then(hash => {
                  password = hash;
                });
              });
        }
        let schoolCode = await School.findOne({ _id: body.school });
        schoolCode = schoolCode.school_code;
        return Student.create(
          [
            {
              ...student,
              refID:
                body.mode == 'school-based'
                  ? 'TS' + schoolCode + body.admNo
                  : 'TSHHRand',
              username: body.admNo,
              password,
              parent: user ? user._id : null,
              addedBy: req.user._id
            }
          ],
          { session: session }
        ).then(student => {
          return { student: student, parent: user };
        });
      })
      .then(obj => {
        //add Student_id to parent
        if (body.isSponsored || (body.addLater && !body.existingParent)) {
          return { student: obj.student };
        }
        //get parent session

        //get student session

        //console.log("[createdStudent ID ]", obj.student);
        //console.log("[created###Parent]", obj.parent);
        if (Array.isArray(obj.parent)) {
          obj.parent[0].students.push(obj.student[0]._id);

          return obj.parent[0]
            .save()

            .then(parent => {
              return { parent, student };
            });
        } else {
          obj.parent.students.push(obj.student[0]._id);

          return obj.parent
            .save()

            .then(parent => {
              return { parent, student };
            });
        }
      })
      .then(obj => {
        //create parent account
        //console.log("[created student]", obj.student);
        if (
          body.isSponsored ||
          body.existingParent ||
          (body.addLater && !body.existingParent)
        ) {
          return { student: obj.student };
        }
        return Parent.create(
          [
            {
              pId: obj.parent._id
            }
          ],
          { session: session }
        ).then(() => {
          return {
            parent: obj.parent,
            student: obj.student /* parent account*/
          };
        });
        // //console.log("ParrentAcc", parentAcc);
        // //console.log(obj);
      })
      .then(obj => {
        // Create student fee
        if (obj.student.isSponsored) {
          return { student: obj.student };
        }
        return {
          parent: obj.parent,
          student: obj.student /* student account*/
        };
      })

      .then(obj => {
        console.log('[obj on send]', obj);
        //send email
        if (body.isSponsored || body.existingParent || body.addLater) {
          session.commitTransaction();
          return res.status(200).json({
            success: true,
            message: 'Registration of new student was successful'
          });
        }

        const user = obj.parent;
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
        let as;
        as =
          user.role.indexOf('-') > 0
            ? Helpers.capitalize(
                user.role.split('-')[0] +
                  ' ' +
                  Helpers.capitalize(user.role.split('-')[1])
              )
            : Helpers.capitalize(user.role);

        let mailOptions = {
          to: user.email,
          from: 'devteamke2018@gmail.com',
          subject: 'TotoSci Academy',
          html:
            '<h4>Hello ' +
            Helpers.capitalize(user.fname) +
            ',</h4>  You have been  added to TotoSci Academy  as a ' +
            as +
            '<p>Login with the following details: ' +
            '<p><b>Email</b>: ' +
            user.email +
            '</p><p> <b>Password</b>: ' +
            sendpasssword +
            '</p>'
        };
        smtpTransport.sendMail(mailOptions, (err, info) => {
          if (err) {
            return res
              .status(400)
              .json({ success: false, message: err.message });
          } else {
            session.commitTransaction();
            return res.status(200).json({
              success: true,
              message: 'Registration of new student was successful'
            });
          }
        });
      })
      .catch(err => {
        session.abortTransaction();
        console.log(err);
        //console.log(err.message);
        if (err.message == 'email in use') {
          return res
            .status(200)
            .json({ success: false, message: 'Email is  already use!' });
        } else {
          return res.status(200).json({ success: false, message: err.message });
        }
      });
  }
);
/**
 *Endpoint for fetching adding new course *
 **/
router.post(
  '/new_course',
  passport.authenticate('jwt', { session: false }),

  (req, res, next) => {
    const { body } = req;
    const { user } = req;
    //console.log(body);

    Course.findOne({ name: { $regex: body.name, $options: 'i' } })
      .then(foundcourse => {
        if (foundcourse) {
          return res
            .status(403)
            .json({ success: false, message: 'Course already exists' });
        } else {
          let newCourse = new Course({
            ...body,
            addedBy: user._id
          });
          newCourse.save();
          return res
            .status(200)
            .json({ success: true, message: 'New Course added successfully ' });
        }
      })

      .catch(err => {
        //console.log(err);
        return res.status(400).json({ success: false, message: err.message });
      });
  }
);
/**
 *Endpoint for adding new school
 **/

router.post(
  '/new_school',
  passport.authenticate('jwt', { session: false }),

  (req, res, next) => {
    const { body } = req;
    const { user } = req;
    let school = body[0];
    let contact = body[1];
    if (contact) {
      console.log(contact);
    }
    let password = generator.generate({
      length: 8,
      numbers: true,
      upercase: true,
      symbol: true
    });
    let sendpasssword = password;
    school.name = Helpers.kebab(school.name);

    School.findOne({ name: { $regex: school.name, $options: 'i' } })
      .then(foundschool => {
        if (foundschool) {
          return res
            .status(403)
            .json({ success: false, message: 'School already exists' });
        } else {
          let newSchool = new School({
            ...school,
            addedBy: user._id
          });
          newSchool.save();
          return newSchool;
        }
      })
      .then(school => {
        if (school.school_type == 'school-based') {
          User.findOne({
            $or: [{ email: contact.email }]
          }).then(user => {
            if (user) {
              School.findOneAndDelete({ name: school.name }).then();
              return res
                .status(200)
                .json({ success: false, message: 'Email is  already use!' });
            } else {
              const newUser = new User({
                ...contact,

                addedBy: req.user._id,
                password: password,
                role: 'trainer'
              });

              bcrypt.genSalt(10, (err, salt) => {
                if (err) console.error('There was an error', err);
                else {
                  bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) console.error('There was an error', err);
                    else {
                      newUser.password = hash;
                      newUser.save().then(user => {
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
                            refreshToken:
                              '1/0qI_HzCYp26oqIfL49fuRVnayfAwf7VrOfav7ZK9IQs'
                          }
                        });
                        let as;
                        as =
                          user.role.indexOf('-') > 0
                            ? Helpers.capitalize(
                                user.role.split('-')[0] +
                                  ' ' +
                                  Helpers.capitalize(user.role.split('-')[1])
                              )
                            : Helpers.capitalize(user.role);

                        let mailOptions = {
                          to: user.email,
                          from: 'devteamke2018@gmail.com',
                          subject: 'TotoSci Academy',
                          html:
                            '<h4>Hello ' +
                            Helpers.capitalize(user.fname) +
                            ',</h4>  You have been  added to TotoSci Academy  as a ' +
                            as +
                            '<p>Login with the following details: ' +
                            '<p><b>Email</b>: ' +
                            user.email +
                            '</p><p> <b>Password</b>: ' +
                            sendpasssword +
                            '</p>'
                        };
                        smtpTransport.sendMail(mailOptions, (err, info) => {
                          if (err) {
                            return res
                              .status(400)
                              .json({ success: false, message: err.message });
                          } else {
                            return res.status(200).json({
                              success: true,
                              message:
                                'Registration successful.An email has been sent to the new user for login details!'
                            });
                          }
                        });
                      });
                    }
                  });
                }
              });
            }
          });
        } else {
          return res.status(403).json({
            success: false,
            message: 'School registered successfully'
          });
        }
      })

      .catch(err => {
        //console.log(err);
        return res.status(400).json({ success: false, message: err.message });
      });
  }
);
/**
Endpoint for fetcging courses **/

router.post(
  '/all_courses',
  passport.authenticate('jwt', { session: false }),
  Middleware.isChief,
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
 *Endpoint for fetching parents *
 **/
router.post(
  '/search_parent',
  passport.authenticate('jwt', { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;

    User.find({
      $and: [
        { role: 'parent' },
        {
          $or: [
            { email: { $regex: body.query, $options: 'i' } },
            { fname: { $regex: body.query, $options: 'i' } },

            { lname: { $regex: body.query, $options: 'i' } }
          ]
        }
      ]
    })
      .then(result => {
        return result.map(each => {
          return Helpers.parseUser(each);
        });
        //console.log("[results]", result);
      })
      .then(result => {
        res.status(200).json({ success: true, parents: result });
      })
      .catch(err => {
        //console.log(err);
      });
  }
);

/**
 *Endpoint fo getting a paginated list of all users, *should only be accessible by admin and also omit the current user requesting *
 **/
router.post(
  '/all',
  passport.authenticate('jwt', { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;
    let st = [{ role: 'trainer' }, { role: 'instructor' }];

    let ft = {};

    if (body.query) {
      ft = {
        $or: [
          { email: { $regex: body.query, $options: 'i' } },
          { fname: { $regex: body.query, $options: 'i' } },
          { role: { $regex: body.query, $options: 'i' } },
          { status: { $regex: body.query, $options: 'i' } },
          { lname: { $regex: body.query, $options: 'i' } },
          { sub_county: { $regex: body.query, $options: 'i' } }
        ]
      };
    }

    let aggregate = User.aggregate()
      .match({
        $and: [
          { $or: st },
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
        // console.log("[results]", result);
        res.status(200).json({ success: true, result: result });
      })
      .catch(err => {
        //console.log(err);
      });
  }
);
/**
 *Endpoint for getting a paginated list of all students
 **/
router.post(
  '/all_students',
  passport.authenticate('jwt', { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;

    let ft = {};
    const { sorter } = body;
    const { filters } = body;
    console.log('[filter]', filters);

    let sort = { createdAt: -1 };
    //Sorting
    if (sorter) {
      sort = { [sorter.field]: sorter.order == 'ascend' ? 1 : -1 };
    }

    //filtering
    let filter = {};
    if (filters) {
      let filterKeys = Object.keys(filters);
      filterKeys = filterKeys.map(key => {
        let incArray = filters[key];
     incArray =   incArray.map((each)=>{
       if(each.length ==  '5d028b8808bfd305857b78d5'.length){
        return mongoose.Types.ObjectId(each)
       }else {
         return each
       }
      
        })
        let obj = { $in: incArray };

        if (incArray.length > 0) {
          filter[key] = obj;
        }

        // console.log('[obj]', returnObj);
      });
    }
    console.log('[ filter obj]', filter);
    //Searching
    if (body.query) {
      ft = {
        $or: [
          { fname: { $regex: body.query, $options: 'i' } },

          { lname: { $regex: body.query, $options: 'i' } }
        ]
      };
    }

    // 	//console.log('[filter]', ft);
    // //console.log('[type]', st);
    let aggregate = Student.aggregate()
      .match({
        $and: [ft, filter]
      })
      .sort(sort)
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
      })
      .lookup({
        from: 'users',
        let: { pId: '$parent' },
        pipeline: [
          { $addFields: { pId: { $toObjectId: '$pId' } } },
          { $match: { $expr: { $eq: ['$_id', '$$pId'] } } },
          { $project: { fname: 1, lname: 1, email: 1, phone: 1 } }
        ],

        as: 'parent'
      })
      .lookup({
        from: 'schools',
        let: { schoolId: '$school' },
        pipeline: [
          { $addFields: { schoolId: { $toObjectId: '$schoolId' } } },
          { $match: { $expr: { $eq: ['$_id', '$$schoolId'] } } },
          { $project: { name: 1, county: 1, sub_county: 1 } }
        ],

        as: 'school'
      });

    Student.aggregatePaginate(aggregate, {
      page: body.page,
      limit: body.limit
    })
      .then(result => {
    
        //console.log("[results]", result);
        res.status(200).json({ success: true, students: result });
      })
      .catch(err => {
        console.log(err);
        res.json({ success: false, message: err.message });
      });
  }
);

/**
 *Endpoint for getting a paginated list of all schools
 **/
router.post(
  '/all_schools',
  passport.authenticate('jwt', { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;
  
    let ft = {};

    if (body.query) {
      body.query = Helpers.kebab(body.query);
      ft = {
        $or: [
          { name: { $regex: body.query, $options: 'i' } },
          { county: { $regex: body.query, $options: 'i' } },

          { sub_county: { $regex: body.query, $options: 'i' } }
        ]
      };
    }

    // 	//console.log('[filter]', ft);
    // //console.log('[type]', st);
    let aggregate = School.aggregate()
      .match(ft)

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

    School.aggregatePaginate(aggregate, {
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
 *Endpoint for fetching schools for forms s
 **/
router.post(
  '/fetch_schools',
  passport.authenticate('jwt', { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;
    Promise.resolve()
      .then(() => {
        //find normal
        return School.find();
      })

      .then(async schools => {
        //console.log('[normal schools]', schools);
        //find other
        let schoolBased = await School.find({ school_type: 'school-based' });

        // console.log('[schoolBased schools]', schoolBased);
        res.status(200).json({ success: true, schools: schools, schoolBased });
      })
      .catch(err => {
        console.log(err);
      });
  }
);

/**
*Endpoint for updating users

**/

router.patch(
  '/update_user',
  passport.authenticate('jwt', { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;

    let _user = {
      fname: body.fname,
      lname: body.lname,
      county: body.county,
      sub_county: body.sub_county
    };
    console.log(body);

    User.findOneAndUpdate({ _id: body._id }, _user, {
      new: true
    })
      .then(newUser => {
        console.log('New School', newUser);
        newSchool = newUser.toObject();
        res.status(200).json({
          success: true,
          user: newSchool,
          message: 'User details updated!'
        });
      })
      .catch(err => console.log(err));
  }
);
/**
*Endpoint forsending Invoice

**/

router.get('/send_invoice', async (req, res, next) => {
  const { body } = req;
  const { user } = req;

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
  let exists = await fs.existsSync('Invoices' + '/invoice.pdf');
  if (exists) {
    await fs.unlinkSync('Invoices' + '/invoice.pdf');
    //console.log("deleted");
  }

  var today = new Date();
  var time = today.getHours();
  let min = today.getMinutes();
  let m = today.getSeconds();
  let compiled = await ejs.compile(
    fs.readFileSync('views' + '/invoice.ejs', 'utf8')
  );
  var html = await compiled({ email: 'kipkogeichirchir2@gmail.com' });
  let pdfOptions = {
    format: 'Letter',
    orientation: 'landscape'
  };
  await pdf
    .create(html, pdfOptions)
    .toFile('Invoices' + '/invoice' + time + min + m + '.pdf', err => {
      if (err) {
        console.log(err);
      } else {
        console.log('pdf done');
      }
    });

  let mailOptions = {
    to: 'kipkogeichirchir2@gmail.com',
    from: 'devteamke2018@gmail.com',
    subject: 'TotoSci Academy',
    attachments: [{ path: 'Invoices' + '/invoice.pdf' }]
  };
  smtpTransport.sendMail(mailOptions, async (err, info) => {
    if (err) {
      console.log('At send', err);
      return res.status(400).json({ success: false, message: err.message });
    } else {
      //console.log("success");

      res.render('invoice');
      // await fs.unlinkSync("Invoices" + "/invoice.pdf");
      return res.status(200).json({
        success: true,
        message: 'Registration of new student was successful'
      });
    }
  });
});
/**
*Endpoint for changing School details

**/

router.patch(
  '/update_school',
  passport.authenticate('jwt', { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;

    let school = {
      name: Helpers.kebab(body.name),
      county: body.county,
      sub_county: body.sub_county
    };
    //console.log(body);

    School.findOneAndUpdate({ _id: body._id }, school, {
      new: true
    })
      .then(newSchool => {
        //console.log("New School", newSchool);
        newSchool = newSchool.toObject();
        res.status(200).json({
          success: true,
          school: newSchool,
          message: 'School details updated!'
        });
      })
      .catch(err => console.log(err));
  }
);
/**
*Endpoint for changing students profile

**/
router.patch(
  '/student_save_info',
  passport.authenticate('jwt', { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    console.log(body);

    // //console.log("[student]", student2);
    Student.findOneAndUpdate(
      { _id: body._id },
      { school: body.school, fname: body.fname, lname: body.lname },
      {
        new: true,
        projection: { password: 0, __v: 0 }
      }
    )
      .then(updatedStudent => {
        return School.findById(updatedStudent.school).then(school => {
          //console.log("found school", school);
          let arr = [];
          arr[0] = school._doc;
          updatedStudent.toObject();
          updatedStudent = { ...updatedStudent._doc, school: arr };
          return updatedStudent;
        });
      })

      .then(updatedStudent => {
        //console.log("{new}", updatedStudent);

        res.json({
          success: true,
          student: updatedStudent,
          message: 'Student info updated!'
        });
      })
      .catch(err => console.log(err));
  }
);

/**
 *Endpoint for changing Course details
 **/

router.patch(
  '/update_course',
  passport.authenticate('jwt', { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;

    let course = {
      name: body.name,
      charge: body.charge,
      description: body.description
    };
    //console.log(body);

    Course.findOneAndUpdate({ _id: body._id }, course, {
      new: true
    })
      .then(newCourse => {
        //console.log("New Course", newCourse);
        newCourse = newCourse.toObject();
        res.json({
          success: true,
          course: newCourse,
          message: 'Course details updated!'
        });
      })
      .catch(err => console.log(err));
  }
);
/**
 *Endpoint for deleting Course
 **/

router.delete(
  '/delete_course',
  passport.authenticate('jwt', { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;

    console.log(body);

    Course.findOneAndDelete({ _id: body._id })
      .then(newCourse => {
        //console.log("New Course", newCourse);
        // newCourse = newCourse.toObject();
        res.json({
          success: true,

          message: 'Course deleted successfully!'
        });
      })
      .catch(err => console.log(err));
  }
);
/**
*
* Endpoint for removing instructors 

**/

router.delete(
  '/remove_student',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    const { body } = req;
    console.log('body', body);

    let id = body._id;

    Class.findOneAndUpdate(
      { students: { $in: body._id } },
      { $pull: { instructors: id } },
      { new: true }
    )
      .then(() => {
        Student.findOneAndDelete({ _id: id }).then(deletedStud => {
          res.json({
            success: true,

            message: 'Student removed successfully'
          });
        });
      })
      //  console.log("students", students);

      .catch(err => {
        console.log(err);
        res.json({ success: false, message: err.message });
      });
  }
);

router.delete(
  '/remove_user',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    const { body } = req;
    console.log('body', body);
    let id = body._id;
    if (body.role == 'chief-trainer') {
      return res.json({
        success: false,
        message: 'You are not permitted for the operation'
      });
    }
    User.findOneAndDelete({ _id: body._id })
      .then(deletedUser => {
        if (body.role == 'instructor') {
          Class.updateMany(
            { instructors: { $in: [body._id] } },
            { $pull: { instructors: id } }
          );
        } else if (body.role == 'trainer') {
          Class.updateMany(
            { trainer: body._id },
            { $pull: { instructors: id } }
          );
        } else {
          return;
        }
        res.json({
          success: true,

          message: 'User removed successfully'
        });
      })

      .catch(err => {
        console.log(err);
        res.json({ success: false, message: err.message });
      });
  }
);

/**
 *Endpoint for changing subordinates password
 **/

router.patch(
  '/password',
  passport.authenticate('jwt', { session: false }),
  Middleware.isChief,
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
                //console.log("{new}", user);

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
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    let user2 = { ...body };
    console.log(req.body);

    delete user2._id;

    //console.log("[user]", user);
    User.findOneAndUpdate({ _id: body._id }, user2, {
      new: true,
      projection: { password: 0, __v: 0 }
    })
      .then(newUser => {
        //console.log("{new}", newUser);
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
*Endpoint for fetching instructors for assigning

**/

router.post(
  '/fetch_instructors',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    const { body } = req;
    console.log('body', body);
    try {
      let trainer = await User.findOne({ _id: body.trainer });
      console.log(trainer);
      let ids = trainer.instructors.map(each => {
        return mongoose.Types.ObjectId(each._id);
      });
      //Not in the class
      console.log('ids', ids);
      let instructors = await User.find({
        $and: [
          {
            _id: {
              $nin: ids
            }
          },
          { role: 'instructor' }
        ]
      });

      instructors = instructors.map((each, i) => {
        return { ...each._doc, key: i };
      });
      console.log('students', instructors);
      res.json({ success: true, instructors });
    } catch (err) {
      console.log(err);
      res.json({ success: false, message: err.message });
    }
  }
);

/**
*
* Endpoint for assigning instructor to a  trainer

**/

router.post(
  '/assign_instructor_to_trainer',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    return;
    const { body } = req;
    try {
      let ids = body.instructors.map(each => {
        return mongoose.Types.ObjectId(each._id);
      });

      let newTrainer = User.findOneAndUpdate(
        { _id: body.trainer },
        { $push: { instructors: { $each: ids } } },
        { new: true }
      );
      // ids = newClass.students.map(each => {
      //   return mongoose.Types.ObjectId(each._id);
      // });
      let instructors = await User.find({
        $and: [
          {
            _id: {
              $in: newTrainer.instructors
            }
          },
          { role: 'instructor' }
        ]
      });
      instructors = instructors.map((each, i) => {
        return { ...each._doc, key: i };
      });
      console.log('new class', newTrainer);
      //  console.log("students", students);
      res.json({
        success: true,
        instructors: instructors,
        newTrainer: newTrainer._doc,
        message: 'Instructor(s) added successfully'
      });
    } catch (err) {
      console.log(err);
      res.json({ success: false, message: err.message });
    }
  }
);

/**
 *Endpoint for recipients*
 **/
router.post(
  '/search_recipient',
  passport.authenticate('jwt', { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;

    User.find({
      $and: [
        {
          $or: [
            { email: { $regex: body.query, $options: 'i' } },
            { fname: { $regex: body.query, $options: 'i' } },

            { lname: { $regex: body.query, $options: 'i' } }
          ]
        },
        {
          _id: { $ne: req.user._id }
        }
      ]
    })
      .then(result => {
        return result.map(each => {
          return Helpers.parseUser(each);
        });
        //console.log("[results]", result);
      })
      .then(result => {
        res.status(200).json({ success: true, parents: result });
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
  Middleware.isChief,
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
        console.log('participants', each.participantsFull[1]);
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
          each.recipient =
            Helpers.capitalize(each.participantsFull[1].role) + 's';
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

/**
 *Endpoint for fetching students for invoice *
 **/
router.post(
  '/fetch_invoiced_students',
  passport.authenticate('jwt', { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;

    let ft = {};

    if (body.query) {
      ft = {
        $and: [
          {
            isSponsored: false
          },
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
        isSponsored: false
      };
    }

    // 	//console.log('[filter]', ft);
    // //console.log('[type]', st);
    let aggregate = Student.aggregate()
      .match(ft)

      .lookup({
        from: 'users',
        let: { pId: '$parent' },
        pipeline: [
          { $addFields: { pId: { $toObjectId: '$pId' } } },
          { $match: { $expr: { $eq: ['$_id', '$$pId'] } } },
          {
            $project: {
              fname: 1,
              lname: 1,
              email: 1,
              phone_number: 1,
              salutation: 1
            }
          }
        ],

        as: 'parent'
      })
      .lookup({
        from: 'schools',
        let: { schoolId: '$school' },
        pipeline: [
          { $addFields: { schoolId: { $toObjectId: '$schoolId' } } },
          { $match: { $expr: { $eq: ['$_id', '$$schoolId'] } } },
          { $project: { name: 1, county: 1, sub_county: 1 } }
        ],

        as: 'school'
      });

    Student.aggregatePaginate(aggregate, {
      page: body.page,
      limit: body.limit
    })
      .then(result => {
        //console.log("[results]", result);
        res.status(200).json({ success: true, students: result });
      })
      .catch(err => {
        //console.log(err);
      });
  }
);
module.exports = router;
