const express = require('express');
const router = express.Router();
const studentController = require("../app/controllers/StudentController");
const verifyToken = require("../app/middlewares/verifyTokenStudent");
const flash = require("../app/middlewares/flash");
const upload = require("../app/middlewares/upload");

router.get('/', verifyToken, studentController.home);

router.get('/login', flash, (req, res) => {
	let token = req.cookies.jwt;
	if (token) {
		res.redirect('/student');
	} else {
		res.render('studentLogin');
	}
});

router.post('/login', studentController.login);

router.get('/logout', studentController.logout);

router.get('/learning/:slug', verifyToken, studentController.learningPage);

router.get('/exercises', verifyToken, studentController.exercisesPage);

router.post('/exercise-submit/:id', upload.array('files', 10), studentController.exerciseSubmit);

router.get('/learning-result', verifyToken, studentController.learningResultPage);

router.get('/register', (req, res) => {
	res.render('studentRegister');
});

// router.post('/register', studentController.register);

// router.post('/subject', studentController.insertSubject);
// router.post('/assignment', studentController.insertAssignment);
// router.post('/announcement', studentController.insertAnnouncement);
// router.post('/exercise', studentController.insertExercise);
// router.post('/year', studentController.insertYear);
// router.post('/studentclass', studentController.insertStudentClass)
// router.post('/class', studentController.insertClass);
// router.put('/', studentController.changeCurrentClass);
// router.put('/exercise', studentController.changeExerciseDeadline);

module.exports = router;
