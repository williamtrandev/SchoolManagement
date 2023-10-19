const express = require('express');
const router = express.Router();
const teacherController = require("../app/controllers/teacherController");
const verifyToken = require("../app/middlewares/verifyToken");

router.get('/', verifyToken, teacherController.home);

router.get('/login', (req, res) => { 
	res.render('login');
});

router.post('/login', teacherController.login);

router.get('/register', (req, res) => {
	res.render('register');
});

router.post('/register', teacherController.register);

router.get('/logout', teacherController.logout);

router.post('/addClass', verifyToken, teacherController.addClass);

// router.get('/classes/:grade',  teacherController.getClasses);
router.get('/classes/:grade', verifyToken, teacherController.getClasses);

router.get('/class', verifyToken, teacherController.getStudentByClass);

router.post('/addStudent/:id', verifyToken, teacherController.addIntoClass);

router.post('/checkAttendance', verifyToken, teacherController.checkAttendance);

module.exports = router;
