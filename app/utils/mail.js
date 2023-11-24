const nodemailer = require('nodemailer');
const exphbs = require('express-handlebars');
const nodemailerhbs = require('nodemailer-express-handlebars');
require('dotenv').config();

exports.sendMailToUser = async (users, template) => {
	const transporter = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: process.env.MAIL_USER,
			pass: process.env.MAIL_PASS
		}
	});


	const hbs = exphbs.create({
		extname: '.hbs', 
		defaultLayout: false,
	});

	// Template Handlebars cho email body
	transporter.use('compile', nodemailerhbs({
		viewEngine: hbs,
		viewPath: 'app/views/mails',
		extName: '.hbs',
	}));

	for (const user of users) {
		const mailOptions = {
			from: '"ESchool" <trantanthanh2k3lop12@gmail.com>',
			to: user.emailParent,
			subject: 'Thông báo về việc điểm danh',
			template: template, // Tên template
			context: user,
		};

		await transporter.sendMail(mailOptions);
	}
};

exports.sendMailNotification = async (teacher, content, users, template) => {
	const transporter = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: process.env.MAIL_USER,
			pass: process.env.MAIL_PASS
		}
	});


	const hbs = exphbs.create({
		extname: '.hbs',
		defaultLayout: false,
	});

	// Template Handlebars cho email body
	transporter.use('compile', nodemailerhbs({
		viewEngine: hbs,
		viewPath: 'app/views/mails',
		extName: '.hbs',
	}));

	for (const user of users) {
		const mailOptions = {
			from: '"ESchool" <trantanthanh2k3lop12@gmail.com>',
			to: user.emailParent,
			subject: teacher  + " đã đăng một thông báo mới",
			template: template, // Tên template
			context: content,
		};

		await transporter.sendMail(mailOptions);
	}
}