const mongoose = require("mongoose");
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = mongoose.model("Users");
const Student = mongoose.model("Students");
const Course = mongoose.model("Courses");
const Class = mongoose.model("Class");
const Middleware = require("../../Middleware/index");
const Validator = require("validator");
const Nodemailer = require("nodemailer");
const Lowercase = require("lower-case");
const xoauth2 = require("xoauth2");
const generator = require("generate-password");
const assert = require("assert");
const Helpers = require("../../helpers/index");
//
const ObjectId = mongoose.Types.ObjectId;
//Add middlware isAdmin,

/**
 *Endpoint for registering admins *should allow checking if email was sent*
 **/
router.post(
  "/register",
  passport.authenticate("jwt", { session: false }),
  Middleware.isTrainer,
  (req, res, next) => {
    let { body } = req;

    console.log(body);
    //const p=Lowercase(...body);

    let password = generator.generate({
      length: 8,
      numbers: true,
      upercase: true,
      symbol: true
    });
    let sendpasssword = password;

    if (body.role == "instructor") {
      console.log("adding instructor");

      body = {
        ...body,
        trainerId: req.user._id,
        county: req.user.county,
        sub_county: req.user.sub_county,
        school: req.user.school
      };
    }
    console.log("[instructor body]", body);

    let session = null;

    Promise.resolve()
      .then(() => User.startSession())
      .then(_session => {
        session = _session;
        session.startTransaction();
      })
      .then(() => {
        //Create instructor
        return User.findOne({
          email: body.email
        })

          .then(user => {
            if (user) {
              throw new Error("Email is already in use");
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
                    ...body,

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
      })
      .then(async instructor => {
        //Add instructor id to created trainer
        console.log("created instructor", instructor);
        return User.findOne({ _id: req.user._id })
          .session(session)
          .then(trainer => {
            trainer.instructors.push(instructor[0]._id);
            return trainer.save().then(() => {
              return { trainer: trainer, instructor };
            });
          });
      })
      .then(obj => {
        console.log("object", obj);
        const user = obj.instructor[0];
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
            throw new Error("An error ocurred");
          } else {
            return;
          }
        });
        return;
      })
      .then(() => {
        session.commitTransaction();
        return res.json({
          success: true,
          message:
            "Registration of new instructor was successful. Login details have been sent to their email address"
        });
      })
      .catch(err => {
        session.abortTransaction();
        console.log(err);
        return res.status(200).json({ success: false, message: err.message });
      });
  }
);

/**
 *Endpoint fo getting a paginated list of all instructors
 **/
router.post(
  "/all_instructors",
  passport.authenticate("jwt", { session: false }),
  Middleware.isTrainer,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;
    let st = [{ role: "instructor" }];
    let ft = {};

    if (body.query) {
      ft = {
        $or: [
          { email: { $regex: body.query, $options: "i" } },
          { fname: { $regex: body.query, $options: "i" } },

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
      .lookup({
        from: "schools",
        let: { schoolId: "$school" },
        pipeline: [
          { $addFields: { schoolId: { $toObjectId: "$schoolId" } } },
          { $match: { $expr: { $eq: ["$_id", "$$schoolId"] } } },
          { $project: { name: 1, county: 1, sub_county: 1 } }
        ],

        as: "school"
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
 *Endpoint fo getting a paginated list of all class
 **/
router.post(
  "/all_classes",
  passport.authenticate("jwt", { session: false }),
  Middleware.isTrainer,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;
    let st = [{ role: "instructor" }];
    let ft = {};

    if (body.query) {
      ft = {
        $or: [
          { name: { $regex: body.query, $options: "i" } },
          { fname: { $regex: body.query, $options: "i" } }
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
      .lookup({
        from: "schools",
        let: { schoolId: "$school" },
        pipeline: [
          { $addFields: { schoolId: { $toObjectId: "$schoolId" } } },
          { $match: { $expr: { $eq: ["$_id", "$$schoolId"] } } },
          { $project: { name: 1, county: 1, sub_county: 1 } }
        ],

        as: "school"
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
  Middleware.isTrainer,
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
  Middleware.isTrainer,
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

router.post(
  "/new_class",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    const { body } = req;

    console.log(body);

    let newClass = {
      name: "",
      start_time: { hour: "", period: "" },
      duration: { hours: "", min: "" },
      day: ""
    };
  }
);

router.post(
  "/fetch_courses",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    Course.find().then(courses => {
      console.log("courses", courses);

      return res.json({
        success: true,
        courses: courses
      });
    });
  }
);

module.exports = router;
