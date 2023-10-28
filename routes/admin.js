const express = require('express');
const router = express.Router();
const adminController = require("../app/controllers/adminController");
const verifyToken = require("../app/middlewares/verifyToken");

router.get('/', verifyToken, adminController.home);

router.get('/login', (req, res) => {
	if(!req.cookies.jwt)
		res.render('login');
	else 
		res.redirect('/admin');
});

router.post('/login', adminController.login);

router.get('/register', (req, res) => {
	res.render('register');
});

router.post('/register', adminController.register);

router.get('/logout', adminController.logout);

router.post('/addClass', verifyToken, adminController.addClass);

// router.get('/classes/:grade',  adminController.getClasses);
router.get('/classes/:grade', adminController.getClassesByGrade);

router.get('/class', adminController.getStudentByClass);

router.post('/addStudent/:id', verifyToken, adminController.addIntoClass);

router.post('/checkAttendance', verifyToken, adminController.checkAttendance);

router.get('/students', adminController.profileStudents);

router.get('/classes', adminController.profileClasses);

router.get('/getNoFormTeacher/:id', adminController.getNoFormTeacher);

router.post('/addDataByFile', adminController.addDataByFile);

router.get('/getGradeByYear/:year', adminController.getGradeByYear);

router.get('/data', adminController.data);

router.post('/setTeacher', adminController.setTeacher);

router.get('/teachers', adminController.teachers);
module.exports = router;
