const express = require('express');
const router = express.Router();
const studentController = require("../app/controllers/studentController");
const verifyToken = require("../app/middlewares/verifyTokenStudent");
const flash = require("../app/middlewares/flash");

router.get('/', verifyToken, studentController.home);

router.get('/login', flash, (req, res) => { 
	res.render('studentLogin');
});

router.post('/login', studentController.login);

router.get('/logout', studentController.logout);

router.get('/learning/:slug', verifyToken, studentController.learning);

router.get('/register', (req, res) => {
	res.render('studentRegister');
});

router.post('/register', studentController.register);

router.post('/subject', studentController.insertSubject);
router.post('/assignment', studentController.insertAssignment);
router.post('/announcement', studentController.insertAnnouncement);
router.post('/year', studentController.insertYear);
router.post('/studentclass', studentController.insertStudentClass)
router.post('/class', studentController.insertClass);

module.exports = router;
