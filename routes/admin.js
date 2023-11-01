const express = require('express');
const router = express.Router();
const adminController = require("../app/controllers/adminController");
const verifyToken = require("../app/middlewares/verifyToken");

router.get('/', adminController.home);
router.get('/attendance', adminController.attendance);

router.get('/login', (req, res) => {
	if (!req.cookies.jwt)
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

router.post('/addStudent/:id', adminController.addIntoClass);

router.post('/checkAttendance', adminController.checkAttendance);

router.get('/students', adminController.profileStudents);

router.get('/classes', adminController.profileClasses);

router.get('/getNoFormTeacher/:id', adminController.getNoFormTeacher);

router.post('/addDataByFile', adminController.addDataByFile);

router.get('/getGradeByYear/:year', adminController.getGradeByYear);

router.get('/data', adminController.data);

router.post('/setTeacher', adminController.setTeacher);

router.get('/teachers', adminController.teachers);

router.get('/getTeachersByGroup', adminController.getTeachersByGroup);

router.put('/teacher/:teacherId', adminController.updateTeacher);

router.get('/assignments', adminController.assignments);
router.get('/getAllClass', adminController.getAllClass);
router.get('/getAllSubject', adminController.getAllSubject);
router.post('/saveAssignments', adminController.saveAssignments);
router.get('/timeTable', adminController.timeTable);
router.get('/getSchedules/:classId', adminController.getScheduleByClass);
router.get('/getAssignments/:classId', adminController.getAssignmentsByClass);
router.get('/student/:mssv', adminController.student);
router.post('/editStudent/:mssv', adminController.editStudent);
router.get('/rank', adminController.rank);
router.get('/getRanking', adminController.getRanking);
module.exports = router;
