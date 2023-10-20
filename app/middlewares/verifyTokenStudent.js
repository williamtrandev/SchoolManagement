const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const { mongooseToObject } = require("../utils/mongoose");

const verifyToken = async (req, res, next) => {
	try {
		let token = req.cookies.jwt;

		if (!token) {
			// return res.status(403).send("Access Denied");
			return res.redirect('/student/login');
		}
		const verified = jwt.verify(token, process.env.JWT_SECRET);
		req.user = verified;
		const student = await Student.findById(verified.id);
		const studentSaved = mongooseToObject(student);
		studentSaved.password = null;
		req.session.student = studentSaved;
		next();
	} catch (err) {
		return res.json(err);
	}
};

module.exports = verifyToken;
