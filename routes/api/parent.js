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

		// 	//console.log('[filter]', ft);
		// //console.log('[type]', st);

		// return
		let aggregate = Student.aggregate()
			.match(ft)

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
				//console.log(err);
			});
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
