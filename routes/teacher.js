const express = require('express');
const router = express.Router();
const verifyToken = require("../app/middlewares/verifyTokenTeacher");
const fileUpload = require('../app/middlewares/fileUpload');
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
router.post('/announcement', verifyToken, teacherController.newAnnouncement);
router.put('/announcement/:id', verifyToken, teacherController.updateAnnouncement);
router.delete('/announcement/:id', verifyToken, teacherController.deleteAnnouncement);
router.post('/exercise', verifyToken, teacherController.newExercise);
router.put('/exercise/:id', verifyToken, teacherController.updateExercise);
router.delete('/exercise/:id', verifyToken, teacherController.deleteExercise);
router.get('/classroom/:assignmentId/grading/:exerciseId', verifyToken, teacherController.gradingPage);
router.post('/grading/:id', verifyToken, teacherController.completeGrading);
router.get('/classroom/:id/scores', verifyToken, teacherController.scorePage);
router.post('/export-to-excel', teacherController.exportToExcel);
router.post('/classroom/:id/import-score-excel', fileUpload(), teacherController.importExcel);
router.get('/attendance/', verifyToken, teacherController.attendancePage);
router.get('/information', verifyToken, teacherController.informationPage);

module.exports = router;
