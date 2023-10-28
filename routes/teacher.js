const express = require('express');
const router = express.Router();
const verifyToken = require("../app/middlewares/verifyTokenTeacher");

router.get('/', verifyToken, teacherController.home);

router.get('/login', (req, res) => {
	let token = req.cookies.jwt;
	if (token) {
		res.redirect('/teacher');
	} else {
		res.render('teacherLogin');
	}
});

router.post('/login', teacherController.login);

router.get('/logout', teacherController.logout);


module.exports = router;
