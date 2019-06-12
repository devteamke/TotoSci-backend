const mongoose = require("mongoose");
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = mongoose.model("Users");
const Student = mongoose.model("Students");
const Course = mongoose.model("Course");
const Parent = mongoose.model("Parents");
const Middleware = require("../../Middleware/index");
const Validator = require("validator");
const Nodemailer = require("nodemailer");
const Lowercase = require("lower-case");
const xoauth2 = require("xoauth2");
const generator = require("generate-password");

const Helpers = require("../../helpers/index");
//
const ObjectId = mongoose.Types.ObjectId;

/**
 *Endpoint for registering admins *should allow checking if email was sent*
 **/
router.post(
  "/register",
  passport.authenticate("jwt", { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;

    console.log(body);
    //const p=Lowercase(...body);

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
          .json({ success: false, message: "Email is  already use!" });
      } else {
        const newUser = new User({
          ...body,

          addedBy: req.user._id,
          password: password
        });

        bcrypt.genSalt(10, (err, salt) => {
          if (err) console.error("There was an error", err);
          else {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) console.error("There was an error", err);
              else {
                newUser.password = hash;
                newUser.save().then(user => {
                  const smtpTransport = Nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 465,
                    secure: true,
                    auth: {
                      type: "OAuth2",
                      user: "devteamke2018@gmail.com",
                      clientId:
                        "719159077041-5ritn1ir75ic87p1gjo37c7gr5ko197m.apps.googleusercontent.com",
                      clientSecret: "I5wZkEJ--0dNg5slemh7R33Z",
                      refreshToken:
                        "1/0qI_HzCYp26oqIfL49fuRVnayfAwf7VrOfav7ZK9IQs"
                    }
                  });
                  let as;
                  as =
                    user.role.indexOf("-") > 0
                      ? Helpers.capitalize(
                          user.role.split("-")[0] +
                            " " +
                            Helpers.capitalize(user.role.split("-")[1])
                        )
                      : Helpers.capitalize(user.role);

                  let mailOptions = {
                    to: user.email,
                    from: "devteamke2018@gmail.com",
                    subject: "TotoSci Academy",
                    html:
                      "<h4>Hello " +
                      Helpers.capitalize(user.fname) +
                      ",</h4>  You have been  added to TotoSci Academy  as a " +
                      as +
                      "<p>Login with the following details: " +
                      "<p><b>Email</b>: " +
                      user.email +
                      "</p><p> <b>Password</b>: " +
                      sendpasssword +
                      "</p>"
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
                          "Registration successful.An email has been sent to the new user for login details!"
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
 *Endpoint for registering parent and student *should allow checking if email was sent*
 **/

router.post(
  "/new_student",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    const { body } = req;
    console.log("[new_student ]", body);

    let student = {
      fname: body.studentFname,
      lname: body.studentLname,
      school: body.school
    };

    let parent = {
      fname: body.parentFname,
      lname: body.parentLname,
      email: body.email,
      role: "parent",
      phone_number: body.phone_number
    };

    //const p=Lowercase(...body);
    //ddd

    let password = generator.generate({
      length: 8,
      numbers: true,
      upercase: true,
      symbol: true
    });
    let sendpasssword = password;

    Promise.resolve()
      .then(() => {
        if (body.existingParent) {
          return User.findById(body.existingParent);
        } else {
          //Create parent
          return User.findOne({
            email: body.email
          })

            .then(user => {
              if (user) {
                throw new Error("email in use");
              } else {
                let newUser = new User({
                  ...parent,

                  addedBy: req.user._id,
                  password: password
                });

                return bcrypt.genSalt(10).then(salt => {
                  return { salt, newUser };
                });
              }
            })
            .then(obj => {
              return bcrypt.hash(obj.newUser.password, obj.salt).then(hash => {
                obj.newUser.password = hash;
                return obj.newUser.save().then(saved => {
                  return saved;
                });
              });
            });
        }
      })

      .then(user => {
        //Create new student
        console.log("createdParent", user);
        const newStudent = new Student({
          ...student,
          parent: user._id || user
        });

        return newStudent.save();
      })
      .then(student => {
        //add Student_id to parent
        console.log("created student", student);
        return User.findById(student.parent).then(parent => {
          parent.students.push(student._id);

          return parent.save().then(parent => {
            return { parent, student };
          });
        });
      })
      .then(obj => {
        //create parent account
        let parentAcc = new Parent({
          pId: obj.parent._id
        });
        parentAcc.save();
        // console.log("ParrentAcc", parentAcc);
        // console.log(obj);
        return { parent: obj.parent, student: obj.student /* parent account*/ };
      })
      .then(obj => {
        // Create student fee
        return {
          parent: obj.parent,
          student: obj.student /* student account*/
        };
      })
      .then(obj => {
        //send email
        const user = obj.parent;
        const smtpTransport = Nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            type: "OAuth2",
            user: "devteamke2018@gmail.com",
            clientId:
              "719159077041-5ritn1ir75ic87p1gjo37c7gr5ko197m.apps.googleusercontent.com",
            clientSecret: "I5wZkEJ--0dNg5slemh7R33Z",
            refreshToken: "1/0qI_HzCYp26oqIfL49fuRVnayfAwf7VrOfav7ZK9IQs"
          }
        });
        let as;
        as =
          user.role.indexOf("-") > 0
            ? Helpers.capitalize(
                user.role.split("-")[0] +
                  " " +
                  Helpers.capitalize(user.role.split("-")[1])
              )
            : Helpers.capitalize(user.role);

        let mailOptions = {
          to: user.email,
          from: "devteamke2018@gmail.com",
          subject: "TotoSci Academy",
          html:
            "<h4>Hello " +
            Helpers.capitalize(user.fname) +
            ",</h4>  You have been  added to TotoSci Academy  as a " +
            as +
            "<p>Login with the following details: " +
            "<p><b>Email</b>: " +
            user.email +
            "</p><p> <b>Password</b>: " +
            sendpasssword +
            "</p>"
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
                "Registration successful.An email has been sent to the new user for login details!"
            });
          }
        });
      })
      .catch(err => {
        console.log(err.message);
        if (err.message == "email in use") {
          return res
            .status(200)
            .json({ success: false, message: "Email is  already use!" });
        }
      });
  }
);
/**
 *Endpoint for fetching parents *
 **/
router.post(
  "/new_course",
  passport.authenticate("jwt", { session: false }),

  (req, res, next) => {
    const { body } = req;
    const { user } = req;

    Course.findOne({ title: body.title })
      .then(foundcourse => {
        if (foundcourse) {
          return res
            .status(403)
            .json({ success: false, message: "Course already exists" });
        } else {
          let newCourse = new Course({
            ...body,
            addedBy: user._id
          });
          newCourse.save();
          return res
            .status(200)
            .json({ success: true, message: "new Course added " });
        }
      })

      .catch(err => {
        console.log(err);
        return res.status(400).json({ success: false, message: err.message });
      });
  }
);

router.post(
  "/search_parent",
  passport.authenticate("jwt", { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;

    User.find({
      $and: [
        { role: "parent" },
        {
          $or: [
            { email: { $regex: body.query, $options: "i" } },
            { fname: { $regex: body.query, $options: "i" } },

            { lname: { $regex: body.query, $options: "i" } }
          ]
        }
      ]
    })
      .then(result => {
        return result.map(each => {
          return Helpers.parseUser(each);
        });
        console.log("[results]", result);
      })
      .then(result => {
        res.status(200).json({ success: true, parents: result });
      })
      .catch(err => {
        console.log(err);
      });
  }
);
/**
 *Endpoint fo getting a paginated list of all users, *should only be accessible by admin and also omit the current user requesting *
 **/
router.post(
  "/all",
  passport.authenticate("jwt", { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;
    let st = [
      { role: "parent" },
      { role: "chief-trainer" },
      { role: "trainer" },

      { role: "instructor" }
    ];
    let ft = {};

    if (body.query) {
      ft = {
        $or: [
          { email: { $regex: body.query, $options: "i" } },
          { fname: { $regex: body.query, $options: "i" } },
          { role: { $regex: body.query, $options: "i" } },
          { status: { $regex: body.query, $options: "i" } },
          { oname: { $regex: body.query, $options: "i" } }
        ]
      };
    }

    // 	console.log('[filter]', ft);
    // console.log('[type]', st);
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
        from: "users",
        let: { userId: "$addedBy" },
        pipeline: [
          { $addFields: { userId: { $toObjectId: "$userId" } } },
          { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
          { $project: { fname: 1, lname: 1 } }
        ],

        as: "addedBy"
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
        console.log("[results]", result);
        res.status(200).json({ success: true, result: result });
      })
      .catch(err => {
        console.log(err);
      });
  }
);
/**
 *Endpoint for getting a paginated list of all parents
 **/
router.post(
  "/all_students",
  passport.authenticate("jwt", { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;
    let st = [{ role: "parent" }];
    let ft = {};

    if (body.query) {
      ft = {
        $or: [
          { email: { $regex: body.query, $options: "i" } },
          { fname: { $regex: body.query, $options: "i" } },
          { role: { $regex: body.query, $options: "i" } },
          { status: { $regex: body.query, $options: "i" } },
          { lname: { $regex: body.query, $options: "i" } }
        ]
      };
    }

    // 	console.log('[filter]', ft);
    // console.log('[type]', st);
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
        from: "users",
        let: { userId: "$addedBy" },
        pipeline: [
          { $addFields: { userId: { $toObjectId: "$userId" } } },
          { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
          { $project: { fname: 1, lname: 1 } }
        ],

        as: "addedBy"
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
        console.log("[results]", result);
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
  "/password",
  passport.authenticate("jwt", { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const _id = body._id;
    let password = body.password;

    bcrypt.genSalt(10, (err, salt) => {
      if (err) console.error("There was an error", err);
      else {
        bcrypt.hash(password, salt, (err, hash) => {
          if (err)
            return res.json({
              success: false,
              message: "Failed to update password!"
            });
          else {
            User.findOneAndUpdate(
              { _id: _id },
              { password: hash },
              { new: true, projection: { password: 0 } }
            )
              .then(user => {
                console.log("{new}", user);

                res.json({ success: true, message: "User password updated!" });
              })
              .catch(err =>
                res.json({
                  success: false,
                  message: "Failed to update password!"
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
  "/save_profile",
  passport.authenticate("jwt", { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { user } = req.body;
    let user2 = { ...user };

    delete user2.createdAt;
    delete user2.createdAt;
    delete user2._id;
    delete user2.__v;
    console.log("[user]", user);
    User.findOneAndUpdate({ _id: user._id }, user2, {
      new: true,
      projection: { password: 0, __v: 0 }
    })
      .then(newUser => {
        console.log("{new}", newUser);
        newUser = newUser.toObject();
        res.json({
          success: true,
          user: newUser,
          message: "User info updated!"
        });
      })
      .catch(err => console.log(err));
  }
);

module.exports = router;
