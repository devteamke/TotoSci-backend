const mongoose = require("mongoose");
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = mongoose.model("Users");
const Student = mongoose.model("Students");
const Course = mongoose.model("Courses");
const Parent = mongoose.model("Parents");
const School = mongoose.model("Schools");
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

// let names = [];
// let collections = mongoose.connections[0].collections;
// Object.keys(collections).forEach(function(k) {
//   names.push(k);
// });
// console.log("collections", names);
//
/**
 *Endpoint for registering admins *should allow checking if email was sent*
 **/
router.post(
  "/register",
  passport.authenticate("jwt", { session: false }),
  Middleware.isChief,
  async (req, res, next) => {
    let { body } = req;

    console.log(body);
    //const p=Lowercase(...body);
    if (body.role == "trainer") {
      let school = await School.findById(body.school);
      body = { ...body, county: school.county, sub_county: school.sub_county };
      console.log("[trainer body]", body);
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
  async (req, res, next) => {
    const { body } = req;
    console.log("[new_student ]", body);

    let student = {
      fname: body.studentFname,
      lname: body.studentLname,
      school: body.school,
      isSponsored: body.isSponsored
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
    let session = null;

    let collections = mongoose.connections[0].collections;
    let names = [];

    Object.keys(collections).forEach(function(k) {
      names.push(k);
    });

    if (!names.includes("parents")) {
      Parent.createCollection();
    }

    await Student.createCollection();
    if (!names.includes("students")) {
    }

    Promise.resolve()
      .then(() => User.startSession())
      .then(_session => {
        session = _session;
        session.startTransaction();
      })
      .then(() => {
        if (body.isSponsored) {
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
                throw new Error("email in use");
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

      .then(user => {
        //Create new student
        console.log("createdParent", user);

        return Student.create(
          [
            {
              ...student,
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
        if (body.isSponsored) {
          return { student: obj.student };
        }
        //get parent session

        //get student session

        console.log("[createdStudent ID ]", obj.student);
        console.log("[created###Parent]", obj.parent);
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
        console.log("[created student]", obj.student);
        if (body.isSponsored || body.existingParent) {
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
        // console.log("ParrentAcc", parentAcc);
        // console.log(obj);
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
        //send email
        if (body.isSponsored || body.existingParent) {
          session.commitTransaction();
          return res.status(200).json({
            success: true,
            message: "Registration of new student was successful"
          });
        }

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
            session.commitTransaction();
            return res.status(200).json({
              success: true,
              message: "Registration of new student was successful"
            });
          }
        });
      })
      .catch(err => {
        session.abortTransaction();
        console.log(err);
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
 *Endpoint for fetching adding new course *
 **/
router.post(
  "/new_course",
  passport.authenticate("jwt", { session: false }),

  (req, res, next) => {
    const { body } = req;
    const { user } = req;
    console.log(body);

    Course.findOne({ name: { $regex: body.name, $options: "i" } })
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
            .json({ success: true, message: "New Course added successfully " });
        }
      })

      .catch(err => {
        console.log(err);
        return res.status(400).json({ success: false, message: err.message });
      });
  }
);
/**
 *Endpoint for adding new school
 **/

router.post(
  "/new_school",
  passport.authenticate("jwt", { session: false }),

  (req, res, next) => {
    const { body } = req;
    const { user } = req;
    body.name = Helpers.kebab(body.name);

    School.findOne({ name: { $regex: body.name, $options: "i" } })
      .then(foundschool => {
        if (foundschool) {
          return res
            .status(403)
            .json({ success: false, message: "School already exists" });
        } else {
          let newSchool = new School({
            ...body,
            addedBy: user._id
          });
          newSchool.save();
          return res
            .status(200)
            .json({ success: true, message: "New school added successfully " });
        }
      })

      .catch(err => {
        console.log(err);
        return res.status(400).json({ success: false, message: err.message });
      });
  }
);
/**
Endpoint for fetcging courses **/

router.post(
  "/all_courses",
  passport.authenticate("jwt", { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;
    let st = [{ role: "parent" }];
    let ft = {};
    console.log(body, user);

    if (body.query) {
      ft = {
        $or: [
          { name: { $regex: body.query, $options: "i" } },
          { description: { $regex: body.query, $options: "i" } },

          { charge: { $regex: body.query, $options: "i" } }
        ]
      };
    }

    // 	console.log('[filter]', ft);
    // console.log('[type]', st);
    let aggregate = Course.aggregate()
      .match(ft)
      .lookup({
        from: "users",
        let: { userId: "$addedBy" },
        pipeline: [
          { $addFields: { userId: { $toObjectId: "$userId" } } },
          { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
          { $project: { fname: 1, lname: 1 } }
        ],

        as: "addedBy"
      });

    Course.aggregatePaginate(aggregate, {
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
 *Endpoint for fetching parents *
 **/
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
        // console.log("[results]", result);
        res.status(200).json({ success: true, result: result });
      })
      .catch(err => {
        console.log(err);
      });
  }
);
/**
 *Endpoint for getting a paginated list of all students
 **/
router.post(
  "/all_students",
  passport.authenticate("jwt", { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;

    let ft = {};

    if (body.query) {
      ft = {
        $or: [
          { fname: { $regex: body.query, $options: "i" } },

          { lname: { $regex: body.query, $options: "i" } }
        ]
      };
    }

    // 	console.log('[filter]', ft);
    // console.log('[type]', st);
    let aggregate = Student.aggregate()
      .match(ft)
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
      })
      .lookup({
        from: "users",
        let: { pId: "$parent" },
        pipeline: [
          { $addFields: { pId: { $toObjectId: "$pId" } } },
          { $match: { $expr: { $eq: ["$_id", "$$pId"] } } },
          { $project: { fname: 1, lname: 1 } }
        ],

        as: "parent"
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
      });

    Student.aggregatePaginate(aggregate, {
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
 *Endpoint for getting a paginated list of all schools
 **/
router.post(
  "/all_schools",
  passport.authenticate("jwt", { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;

    let ft = {};

    if (body.query) {
      body.query = Helpers.kebab(body.query);
      ft = {
        $or: [
          { name: { $regex: body.query, $options: "i" } },
          { county: { $regex: body.query, $options: "i" } },

          { sub_county: { $regex: body.query, $options: "i" } }
        ]
      };
    }

    // 	console.log('[filter]', ft);
    // console.log('[type]', st);
    let aggregate = School.aggregate()
      .match(ft)

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

    School.aggregatePaginate(aggregate, {
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
 *Endpoint for fetching schools for forms s
 **/
router.post(
  "/fetch_schools",
  passport.authenticate("jwt", { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;

    School.find()
      .then(schools => {
        console.log("found schools", schools);
        res.json({ success: true, schools: schools });
      })
      .catch(err => {
        console.log(err);
      });
  }
);
/**
*Endpoint for changing School details

**/

router.patch(
  "/update_school",
  passport.authenticate("jwt", { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;

    let school = {
      name: Helpers.kebab(body.name),
      county: body.county,
      sub_county: body.sub_county
    };
    console.log(body);

    School.findOneAndUpdate({ _id: body._id }, school, {
      new: true
    })
      .then(newSchool => {
        console.log("New School", newSchool);
        newSchool = newSchool.toObject();
        res.json({
          success: true,
          school: newSchool,
          message: "School details updated!"
        });
      })
      .catch(err => console.log(err));
  }
);
/**
*Endpoint for changing students profile

**/
router.patch(
  "/student_save_info",
  passport.authenticate("jwt", { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    console.log(body);

    // console.log("[student]", student2);
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
          console.log("found school", school);
          let arr = [];
          arr[0] = school._doc;
          updatedStudent.toObject();
          updatedStudent = { ...updatedStudent._doc, school: arr };
          return updatedStudent;
        });
      })

      .then(updatedStudent => {
        console.log("{new}", updatedStudent);

        res.json({
          success: true,
          student: updatedStudent,
          message: "Student info updated!"
        });
      })
      .catch(err => console.log(err));
  }
);

/**
 *Endpoint for changing Course details
 **/

router.patch(
  "/update_course",
  passport.authenticate("jwt", { session: false }),
  Middleware.isChief,
  (req, res, next) => {
    const { body } = req;
    const { user } = req;

    let course = {
      name: body.name,
      charge: body.charge,
      description: body.description
    };
    console.log(body);

    Course.findOneAndUpdate({ _id: body._id }, course, {
      new: true
    })
      .then(newCourse => {
        console.log("New Course", newCourse);
        newCourse = newCourse.toObject();
        res.json({
          success: true,
          course: newCourse,
          message: "Course details updated!"
        });
      })
      .catch(err => console.log(err));
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
