const mongoose = require("mongoose");
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = mongoose.model("Users");
const Student = mongoose.model("Students");
const Course = mongoose.model("Courses");
const Class = mongoose.model("Class");
const Attendance = mongoose.model("Attendance");
const Feedback = mongoose.model("Feedback");
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
        //console.log("[results]", result);
        res.status(200).json({ success: true, result: result });
      })
      .catch(err => {
        console.log(err);
      });
  }
);
/**
 *Endpoint for adding new class
 **/
router.post(
  "/new_class",
  passport.authenticate("jwt", { session: false }),

  (req, res, next) => {
    const { body } = req;
    const { user } = req;
    console.log(body);
    body.name = Helpers.kebab(body.name);

    Class.findOne({ name: { $regex: body.name, $options: "i" } })
      .then(foundclass => {
        if (foundclass) {
          return res
            .status(403)
            .json({ success: false, message: "Class already exists" });
        } else {
          let newSchool = new Class({
            ...body,
            trainer: user._id
          });
          console.log(newSchool);

          newSchool.save();
          return res
            .status(200)
            .json({ success: true, message: "New class added successfully " });
        }
      })

      .catch(err => {
        console.log(err);
        return res.status(400).json({ success: false, message: err.message });
      });
  }
);

/**
 *Endpoint fo getting a paginated list of all class
 **/
router.post(
  "/all_classes",
  passport.authenticate("jwt", { session: false }),

  (req, res, next) => {
    const { body } = req;
    const { user } = req;

    let ft = {};

    if (body.query) {
      body.query = Helpers.kebab(body.query);
      ft = {
        $or: [
          { name: { $regex: body.query, $options: "i" } },
          { course: { $regex: body.query, $options: "i" } },

          { day: { $regex: body.query, $options: "i" } }
        ]
      };
    }

    // 	//console.log('[filter]', ft);
    // //console.log('[type]', st);
    let aggregate = Class.aggregate()
      .match({ $and: [{ trainer: user._id }, ft] })

      .lookup({
        from: "users",
        let: { userId: "$trainer" },
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
        from: "courses",
        let: { courseId: "$course" },
        pipeline: [
          { $addFields: { courseId: { $toObjectId: "$courseId" } } },
          { $match: { $expr: { $eq: ["$_id", "$$courseId"] } } },
          { $project: { name: 1 } }
        ],

        as: "courseName"
      });

    Class.aggregatePaginate(aggregate, {
      page: body.page,
      limit: body.limit
    })
      .then(result => {
        console.log("[results]", result);
        res.status(200).json({ success: true, result: result });
      })
      .catch(err => {
        //console.log(err);
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

/**
*Endpoint for fetching courses

**/

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
/**
*Endpoint for fetching students for adding

**/

router.post(
  "/fetch_students",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { body } = req;
    console.log("body", body);
    try {
      let ids = body._class.students.map(each => {
        return mongoose.Types.ObjectId(each);
      });
      //Not in the class
      console.log("ids", ids);
      let students;

      if (!body.inClass) {
        students = await Student.find({
          _id: {
            $nin: ids
          }
        });
      } else {
        students = await Student.find({
          _id: {
            $in: ids
          }
        });
      }
      students = students.map((each, i) => {
        return { ...each._doc, key: i };
      });
      console.log("students", students);
      res.json({ success: true, students });
    } catch (err) {
      console.log(err);
      res.json({ success: false, message: err.message });
    }
  }
);

/**
*
* Endpoint for adding students to class

**/

router.post(
  "/add_students_to_class",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { body } = req;
    try {
      let ids = body.students.map(each => {
        return mongoose.Types.ObjectId(each._id);
      });

      let newClass = await Class.findOneAndUpdate(
        { _id: body.class_id },
        { $push: { students: { $each: ids } } },
        { new: true }
      );
      ids = newClass.students.map(each => {
        return mongoose.Types.ObjectId(each._id);
      });
      let students = await Student.find({
        _id: {
          $in: ids
        }
      });
      students = students.map((each, i) => {
        return { ...each._doc, key: i };
      });
      console.log("new class", newClass);
      //  console.log("students", students);
      res.json({
        success: true,
        students: students,
        newClass: newClass._doc,
        message: "Students added successfully"
      });
    } catch (err) {
      console.log(err);
      res.json({ success: false, message: err.message });
    }
  }
);
/**
*
* Endpoint for removing students from class 

**/

router.post(
  "/remove_students",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { body } = req;
    try {
      let ids = body.students.map(each => {
        return mongoose.Types.ObjectId(each._id);
      });

      let newClass = await Class.findOneAndUpdate(
        { _id: body.class_id },
        { $pull: { students: { $in: ids } } },
        { new: true }
      );
      ids = newClass.students.map(each => {
        return mongoose.Types.ObjectId(each._id);
      });
      let students = await Student.find({
        _id: {
          $in: ids
        }
      });
      students = students.map((each, i) => {
        return { ...each._doc, key: i };
      });
      console.log("new class", newClass);
      //  console.log("students", students);
      res.json({
        success: true,
        students: students,
        newClass: newClass._doc,
        message: "Students removed successfully"
      });
    } catch (err) {
      console.log(err);
      res.json({ success: false, message: err.message });
    }
  }
);
/**
*
* Endpoint for marking attendance

**/

router.post(
  "/mark_attendance",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { body } = req;
    try {
      let present = body.students.map(each => {
        // console.log("each", each._id);
        return each._id;
      });

      // let class_ids = body._class.students.map(each => {
      //   return each;
      // });
      // Get absent
      //   let absent = class_ids.filter(x => !attended_ids.includes(x));

      console.log("attended:", present.length);
      // console.log("class:", class_ids.length);

      const { values } = body;
      console.log("[values]", values);
      let attendance = {
        ...values,
        _class: body._class._id,
        present
      };

      let savedAtt = await Attendance.create(attendance);
      console.log("saved", savedAtt);
      res.json({
        success: true,

        message: "Attendance  updated successfully"
      });
      // let newClass = await Class.findOneAndUpdate(
      //   { _id: body.class_id },
      //   { $pull: { students: { $in: ids } } },
      //   { new: true }
      // );
      // ids = newClass.students.map(each => {
      //   return mongoose.Types.ObjectId(each._id);
      // });
      // let students = await Student.find({
      //   _id: {
      //     $in: ids
      //   }
      // });
      // students = students.map((each, i) => {
      //   return { ...each._doc, key: i };
      // });
      // console.log("new class", newClass);
      // //  console.log("students", students);
      // res.json({
      //   success: true,
      //   students: students,
      //   newClass: newClass._doc,
      //   message: "Students removed successfully"
      // });
    } catch (err) {
      console.log(err);
      res.json({ success: false, message: err.message });
    }
  }
);
/**
*
* Endpoint for fetching attendance

**/

router.post(
  "/fetch_attendance",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { body } = req;
    try {
      let ids = body._class.students.map(each => {
        return mongoose.Types.ObjectId(each);
      });
      let lessons = await Attendance.find({ _class: body._class._id }).sort({
        createdAt: 1
      });
      let students = await Student.find({
        _id: {
          $in: ids
        }
      });
      //console.log("[ lessons ]", lessons);
      console.log("[ students ]", students.length);
      let attendance = [];
      students.map((student, i) => {
        let data = {
          key: i,
          _id: student._id,
          name:
            Helpers.capitalize(student.fname) +
            " " +
            Helpers.capitalize(student.lname)
        };
        let l = {};
        lessons.map((lesson, i) => {
          //console.log(lesson.present.indexOf(student._id) > 0);
          if (lesson.present.indexOf(student._id) > -1) {
            //attended
            l[i + 1] = "<b>true</b>";
          } else {
            //missed
            l[i + 1] = false;
          }
        });
        data = { ...data, ...l };
        attendance.push(data);
      });
      console.log("[ attendance ]", attendance);
      let columnsA = [];
      if (attendance.length > 0) {
        let keys = Object.keys(attendance[0]);

        keys.map(key => {
          let e = {};
          if (key == "key") {
            return;
          }
          if (key == "_id") {
            return;
          }
          if (key == "name") {
            return;
            columnsA.unshift({
              title: "Name",
              dataIndex: key
            });
            return;
          }
          columnsA.push({
            title: "Lesson " + key,
            dataIndex: key
          });
        });
        console.log(columnsA);
      }

      res.json({
        success: true,
        attendance,
        columnsA,
        message: "Attendance  fetched successfully"
      });
    } catch (err) {
      console.log(err);
      res.json({ success: false, message: err.message });
    }
  }
);

/**
*Endpoint for fetching instructors for adding

**/

router.post(
  "/fetch_instructors",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { body } = req;
    console.log("body", body);
    try {
      let ids = body._class.instructors.map(each => {
        return mongoose.Types.ObjectId(each);
      });
      //Not in the class
      console.log("ids", ids);
      let instructors = await User.find({
        $and: [
          {
            _id: {
              $nin: ids
            }
          },
          { role: "instructor" }
        ]
      });

      instructors = instructors.map((each, i) => {
        return { ...each._doc, key: i };
      });
      console.log("students", instructors);
      res.json({ success: true, instructors });
    } catch (err) {
      console.log(err);
      res.json({ success: false, message: err.message });
    }
  }
);
/**
*Endpoint for fetching instructors for adding

**/

router.post(
  "/fetch_instructor_class",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { body } = req;
    // console.log("body", body);
    try {
      let id = body._id;
      //Not in the class
      console.log("ids", id);
      let classes = await Class.find({ instructors: { $in: [id] } });

      //console.log("Classes", classes);

      classes = classes.map((each, i) => {
        return { ...each._doc, key: i };
      });
      console.log("Classes", classes);
      res.json({ success: true, _class: classes });
    } catch (err) {
      console.log(err);
      res.json({ success: false, message: err.message });
    }
  }
);
/**
*Endpoint for fetching instructors for in class

**/

router.post(
  "/fetch_class_instructors",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { body } = req;
    console.log("body", body);
    try {
      let ids = body._class.instructors.map(each => {
        return mongoose.Types.ObjectId(each);
      });
      //in the class
      console.log("ids", ids);
      let instructors = await User.find({
        $and: [
          {
            _id: {
              $in: ids
            }
          },
          { role: "instructor" }
        ]
      });

      // instructors = instructors.map((each, i) => {
      //   return { ...each._doc, key: i };
      // });
      //console.log("students", instructors);
      res.json({ success: true, instructors });
    } catch (err) {
      console.log(err);
      res.json({ success: false, message: err.message });
    }
  }
);

/**
*
* Endpoint for adding instructors to class

**/

router.post(
  "/add_instructors_to_class",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { body } = req;
    try {
      let ids = body.instructors.map(each => {
        return mongoose.Types.ObjectId(each._id);
      });

      let newClass = await Class.findOneAndUpdate(
        { _id: body.class_id },
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
              $in: newClass.instructors
            }
          },
          { role: "instructor" }
        ]
      });
      instructors = instructors.map((each, i) => {
        return { ...each._doc, key: i };
      });
      console.log("new class", newClass);
      //  console.log("students", students);
      res.json({
        success: true,
        instructors: instructors,
        newClass: newClass._doc,
        message: "Instructor(s) added successfully"
      });
    } catch (err) {
      console.log(err);
      res.json({ success: false, message: err.message });
    }
  }
);
/**
*
* Endpoint for removing instructors 

**/

router.post(
  "/remove_instructor",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { body } = req;
    console.log("body", body);
    try {
      let id = body.instructor._id;

      let newClass = await Class.findOneAndUpdate(
        { _id: body.class_id },
        { $pull: { instructors: id } },
        { new: true }
      );
      // ids = newClass.students.map(each => {
      //   return mongoose.Types.ObjectId(each._id);
      // });
      // let students = await Student.find({
      //   _id: {
      //     $in: ids
      //   }
      // });
      // students = students.map((each, i) => {
      //   return { ...each._doc, key: i };
      // });
      let ids = newClass.instructors.map(each => {
        return mongoose.Types.ObjectId(each);
      });
      //in the class
      console.log("ids", ids);
      let instructors = await User.find({
        $and: [
          {
            _id: {
              $in: ids
            }
          },
          { role: "instructor" }
        ]
      });
      console.log("new class", newClass);
      //  console.log("students", students);
      res.json({
        success: true,
        instructors: instructors,
        newClass: newClass._doc,
        message: "Instructor removed successfully"
      });
    } catch (err) {
      console.log(err);
      res.json({ success: false, message: err.message });
    }
  }
);
/*
*
* Endpoint for fetching feed back, lessons and wether the students attended

**/

router.post(
  "/fetch_feed_attendance",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { body } = req;
    let student = body.student;
    try {
      let lessons = await Attendance.find({ _class: body._class._id }).sort({
        createdAt: 1
      });

      //console.log("[ lessons ]", lessons);

      let data = {
        _id: student._id,
        name:
          Helpers.capitalize(student.fname) +
          " " +
          Helpers.capitalize(student.lname)
      };
      let l = {};
      let larr = [];
      lessons.map((lesson, i) => {
        //console.log(lesson.present.indexOf(student._id) > 0);

        if (lesson.present.indexOf(student._id) > -1) {
          //attended
          l[i + 1] = i + 1 + "true";
        } else {
          //missed
          l[i + 1] = i + 1 + "false";
        }
        larr.push(l[i + 1]);
      });
      data = { ...data, ...l };
      let feedback = await Feedback.find({
        student: student._id,
        _class: body._class._id
      })
        .populate({ path: "addedBy", select: "fname lname" })
        .sort({
          createdAt: -1
        });
      console.log("feedback", feedback);
      res.json({
        success: true,
        attendance: larr,
        feedback: feedback,
        message: "Attendance  fetched successfully"
      });
    } catch (err) {
      console.log(err);
      res.json({ success: false, message: err.message });
    }
  }
);
module.exports = router;
Array.prototype.diff = function(a) {
  return this.filter(function(i) {
    return a.indexOf(i) < 0;
  });
};
