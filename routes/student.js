const express = require('express');
const router = express.Router();
const studentController = require("../app/controllers/studentController");
const verifyToken = require("../app/middlewares/verifyTokenStudent");
const flash = require("../app/middlewares/flash");
const upload = require("../app/middlewares/upload");

router.get('/', verifyToken, studentController.home);

router.get('/login', (req, res) => {
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
router.post('/submission/:id', upload.array('files', 10), studentController.exerciseSubmit);
router.delete('/submission/:id', studentController.exerciseUnsubmit);
router.get('/learning-result', verifyToken, studentController.learningResultPage);
router.get('/information', verifyToken, studentController.informationPage);

module.exports = router;
