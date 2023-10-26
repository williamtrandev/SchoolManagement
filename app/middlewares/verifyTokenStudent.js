const jwt = require("jsonwebtoken");

const verifyToken = async (req, res, next) => {
	try {
		let token = req.cookies.jwt;

		if (!token) {
			// return res.status(403).send("Access Denied");
			return res.redirect('/student/login');
		}
		const verified = jwt.verify(token, process.env.JWT_SECRET);
		req.user = verified;
		req.session.student = verified.student;
		next();
	} catch (err) {
		return res.json(err);
	}
};

module.exports = verifyToken;
