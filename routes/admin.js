const express = require('express');
const router = express.Router();
const adminController = require("../app/controllers/adminController");
const verifyToken = require("../app/middlewares/verifyToken");
const TimeTable = require("../app/models/TimeTable");
const Schedule = require("../app/models/Schedule");

const fileUpload = require('../app/middlewares/fileUpload');

router.get('/', adminController.home);

router.get('/attendance', verifyToken, adminController.attendance);

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

router.post('/addClass', adminController.addClass);

// router.get('/classes/:grade',  adminController.getClasses);
router.get('/classes/:grade', verifyToken, adminController.getClassesByGrade);

router.get('/class', adminController.getStudentByClass);

router.post('/addStudent/:id', adminController.addIntoClass);

router.post('/checkAttendance', adminController.checkAttendance);

router.get('/students', verifyToken, adminController.profileStudents);

router.get('/classes', adminController.profileClasses);

router.get('/getNoFormTeacher/:id', adminController.getNoFormTeacher);

router.post('/addDataByFile', fileUpload(), adminController.addDataByFile);

router.get('/getGradeByYear/:year', adminController.getGradeByYear);

router.get('/data', verifyToken, adminController.data);

router.post('/setTeacher', adminController.setTeacher);

router.post('/teacher', adminController.addTeacher);

router.get('/teachers', verifyToken, adminController.teachers);

router.get('/getTeachersByGroup', adminController.getTeachersByGroup);

router.put('/teacher/:teacherId', adminController.updateTeacher);

router.get('/assignments', verifyToken, adminController.assignments);

router.get('/getAllClass', adminController.getAllClass);

router.get('/getAllClassByYear/:year', adminController.getAllClassByYear);

router.get('/getAllSubject', adminController.getAllSubject);

router.post('/saveAssignments', adminController.saveAssignments);

router.get('/timeTable', verifyToken, adminController.timeTable);

router.post('/addSchedule', adminController.saveSchedule);
router.post('/addTimeTableByExcel', fileUpload(), adminController.addTimeTableByExcel);

router.get('/getTimeTable/:id', adminController.getTimeTable);

router.get('/useTimeTable/:id', adminController.useTimeTable);

router.get('/getSchedules/:classId', adminController.getScheduleByClass);

router.get('/getAssignments/:classId', adminController.getAssignmentsByClass);

router.get('/student/:mssv', adminController.student);

router.post('/editStudent/:mssv', adminController.editStudent);

router.get('/rank', verifyToken, adminController.rank);

router.get('/getRanking', adminController.getRanking);

router.get('/newYear', verifyToken, adminController.newYearPage);

router.get('/levelUp', verifyToken, adminController.levelUpPage);

router.get('/getLevelUp', adminController.levelUp);

router.post('/confirmLevelUp', adminController.confirmLevelUp);

router.get('/studyResult', verifyToken, adminController.studyResult);

router.get('/getResult/:year/:classId/:term', adminController.getResult);

router.get('/printResult', adminController.printResult);

router.get('/startNewSemester', adminController.newSemester);

router.get('/startNewYear', adminController.startNewYear);

router.get('/deleteTimeTable', async (req, res) => {
	const id = `654d0c7bd6fe0f16e33ba30a`;
	await Schedule.deleteMany({ timeTable: id });
	res.status(200).json('ok')
})
module.exports = router;
