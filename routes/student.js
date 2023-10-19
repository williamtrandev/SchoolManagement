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

router.get('/register', (req, res) => {
	res.render('studentRegister');
});

router.post('/register', studentController.register);

module.exports = router;
