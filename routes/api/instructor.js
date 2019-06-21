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
      .match({
        $and: [
          ft,
          {
            instructors: { $in: [user._id] }
          }
        ]
      })

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
*Endpoint for fetching students

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
); /**
*
* Endpoint for fetching feed back , lessons and wether the students attended

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
/*
* Endpoint for saving feedback

**/

router.post(
  "/save_feedback",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    const { body } = req;

    try {
      let feedback = {
        _class: body.data.class_id,
        student: body.data.student_id,
        lesson: body.data.lesson,
        remarks: body.data.remarks,
        addedBy: req.user._id
      };

      let savedFeed = await Feedback.create(feedback);
      console.log("saved feedback", savedFeed);
      res.json({
        success: true,

        savedFeed,
        message: "Feedback saved successfully"
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
