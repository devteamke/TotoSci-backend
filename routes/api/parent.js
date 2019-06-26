const mongoose = require('mongoose');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = mongoose.model('Users');
const Student = mongoose.model('Students');
const Middleware = require('../../Middleware/index');
const Course = mongoose.model("Courses");
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
	"/all_courses",
	passport.authenticate("jwt", { session: false }),
	Middleware.isParent,
	(req, res, next) => {
		const { body } = req;
		const { user } = req;
		let st = [{ role: "parent" }];
		let ft = {};
		//console.log(body, user);

		if (body.query) {
			ft = {
				$or: [
					{ name: { $regex: body.query, $options: "i" } },
					{ description: { $regex: body.query, $options: "i" } },

					{ charge: { $regex: body.query, $options: "i" } }
				]
			};
		}

		// 	//console.log('[filter]', ft);
		// //console.log('[type]', st);
		let aggregate = Course.aggregate()
			.match(ft)
			.lookup({
				from: "users",
				let: { userId: "$addedBy" },
				pipeline: [
					{ $addFields: { userId: { $toObjectId: "$userId" } } },
					{ $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
					{ $project: { fname: 1, lname: 1, email: 1, role: 1 } }
				],

				as: "addedBy"
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
	"/my_students",
	passport.authenticate("jwt", { session: false }),
	Middleware.isParent,
	async(req, res, next) => {
		const { body } = req;
		const { user } = req;

		let ft = {};

		if (body.query) {
			ft = {
				$and: [
					{ parent: user._id },
					{
						$or: [{ fname: { $regex: body.query, $options: "i" } },

							{ lname: { $regex: body.query, $options: "i" } }
						]
					}
				]
			};
		}
		else {
			ft = {
				parent: user._id
			};
		}
		console.log(ft)
		try {
			let myStudents = await Student.aggregate([{
					$match: ft,
				},
				{ //console.log(studentId)
					$lookup: {
						from: "classes",
						let: { studentId: "$_id" },
						pipeline: [
							{ $addFields: { studentId: { $toObjectId: "$studentId" } } },
							{ $match: { $expr: { $in: ["$$studentId", "$students"] } } },
							{ $project: { name: 1, duration: 1, start_time: 1, trainer: 1, day: 1, course: 1, } }
						],

						as: "class"
					}
				},

				{
					$lookup: {
						from: "schools",
						let: { schoolId: "$school" },
						pipeline: [
							{ $addFields: { schoolId: { $toObjectId: "$schoolId" } } },
							{ $match: { $expr: { $eq: ["$_id", "$$schoolId"] } } },
							{ $project: { name: 1, county: 1, sub_county: 1 } }
						],

						as: "school"
					}
				},
				{
					$lookup: {
						from: "users",
						let: { userId: "$addedBy" },
						pipeline: [
							{ $addFields: { userId: { $toObjectId: "$userId" } } },
							{ $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
							{ $project: { fname: 1, lname: 1, email: 1, role: 1 } }
						],

						as: "addedBy"
					}
				}
			])
			console.log(myStudents);
			let mStudents = myStudents.map((each, i) => {
				return { ...each, key: i };
			});

			console.log(mStudents.school)
			console.log(mStudents.class)
			res.status(200).json({ success: true, result: mStudents });


		}
		catch (err) {
			console.log(err)
		}



	}
);

/**
 * Endpoint for fetching courses registered to a given student
 **/

router.post(
	"/fetch_course",
	passport.authenticate("jwt", { session: false }),
	Middleware.isParent,
	async(req, res, next) => {
		const { body } = req;
		const { user } = req;
		let coursesId = [];
		//console.log('Course Id received', body);
		body.coursesId.map((each) => {
			let mapId = mongoose.Types.ObjectId(each);
			coursesId.push(mapId)
		});

		Course.find({ '_id': { $in: coursesId } })
			.then((result) => {
				//console.log(result)
				result = result.map((each) => {
					delete each.__v;
					each.__v = undefined

					return each.toObject();
				})
				//console.log('Removed _v', result)
				res.json({
					success: true,
					result: result
				});
			})
			.catch(err => console.log(err));
	}
);
/**
 * Endpoint for fetching courses registered to a given student
 **/

router.post(
	"/fetch_trainer",
	passport.authenticate("jwt", { session: false }),
	Middleware.isParent,
	async(req, res, next) => {
		const { body } = req;
		const { user } = req;
		let trainerId = [];
		console.log('Course Id received', body);
		body.trainersId.map((each) => {
			let mapId = mongoose.Types.ObjectId(each);
			trainerId.push(mapId)
		});

		User.find({ '_id': { $in: trainerId } })
			.then((result) => {
				//console.log(result)
				result = result.map((each) => {
					delete each.__v;
					each.__v = undefined

					return each.toObject();
				})
				console.log('Removed _v', result)
				res.json({
					success: true,
					result: result
				});
			})
			.catch(err => console.log(err));
	}
);
/**
 *Endpoint fo getting a paginated list of all users, *should only be accessible by admin and also omit the current user requesting *
 **/
router.post('/all', passport.authenticate('jwt', { session: false }), Middleware.isTrainer, (req, res, next) => {
	const { body } = req;
	const { user } = req;
	let st = [

		{ role: 'parent' },

		{ role: 'trainer' },

		{ role: 'instructor' },
	];
	let ft = {};

	if (body.query) {
		ft = {
			$or: [
				{ 'email': { '$regex': body.query, '$options': 'i' } },
				{ 'fname': { '$regex': body.query, '$options': 'i' } },
				{ 'role': { '$regex': body.query, '$options': 'i' } },
				{ 'status': { '$regex': body.query, '$options': 'i' } },
				{ 'oname': { '$regex': body.query, '$options': 'i' } },

			]
		};
	}






	// 	console.log('[filter]', ft);
	// console.log('[type]', st);
	let aggregate = User.aggregate().match({
			$and: [{
					$or: st

				},
				ft,
				{
					_id: { $ne: user._id }
				}

			]

		}).lookup({
			from: 'users',
			let: { "userId": "$addedBy" },
			pipeline: [
				{ "$addFields": { "userId": { "$toObjectId": "$userId" } } },
				{ "$match": { "$expr": { "$eq": ["$_id", "$$userId"] } } },
				{ $project: { fname: 1, lname: 1 } }
			],


			as: 'addedBy'
		})
		.project({
			password: 0,
			isSetUp: 0
		}, );

	User.aggregatePaginate(
			aggregate, {
				page: body.page,
				limit: body.limit
			}
		)
		.then((result) => {
			console.log('[results]', result);
			res.status(200).json({ success: true, result: result });
		})
		.catch((err) => { console.log(err) });
});


/**
 *Endpoint for changing subordinates password
 **/

router.patch('/password', passport.authenticate('jwt', { session: false }), Middleware.isTrainer, (req, res, next) => {
	const { body } = req;
	const _id = body._id;
	let password = body.password;

	bcrypt.genSalt(10, (err, salt) => {
		if (err) console.error('There was an error', err);
		else {
			bcrypt.hash(password, salt, (err, hash) => {
				if (err) return res.json({ success: false, message: 'Failed to update password!' });
				else {
					User.findOneAndUpdate({ _id: _id }, { password: hash }, { new: true, projection: { password: 0 } })
						.then((user) => {
							console.log('{new}', user);

							res.json({ success: true, message: 'User password updated!' });
						})
						.catch((err) => res.json({ success: false, message: 'Failed to update password!' }));
				}
			});
		}
	});




});


/**
*Endpoint for changing subordinates profile

**/


router.patch('/save_profile', passport.authenticate('jwt', { session: false }), Middleware.isManager, (req, res, next) => {
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
		.then((newUser) => {
			console.log('{new}', newUser);
			newUser = newUser.toObject();
			res.json({ success: true, user: newUser, message: 'User info updated!' });
		})
		.catch((err) => console.log(err));


});



module.exports = router;
