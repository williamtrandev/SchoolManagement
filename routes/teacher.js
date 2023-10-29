const express = require('express');
const router = express.Router();
const verifyToken = require("../app/middlewares/verifyTokenTeacher");

const adminController = require('../app/controllers/adminController');
const teacherController = require('../app/controllers/teacherController');

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
router.get('/classroom/:id', verifyToken, teacherController.classroomPage);
router.post('/announcement', teacherController.newAnnouncement);

router.post('/insert-assignment', teacherController.insertAssignment);

module.exports = router;
