const jwt = require("jsonwebtoken");

const verifyToken = async (req, res, next) => {
	try {
		let token = req.cookies.jwt;

		if (!token) {
			// return res.status(403).send("Access Denied");
			return res.redirect('/admin/login');
		}
		const verified = jwt.verify(token, process.env.JWT_SECRET);
		req.user = verified;
		next();
	} catch (err) {
		return res.redirect('/admin/login');
	}
};

module.exports = verifyToken;
