const Teacher = require('../models/Teacher');

class TeacherController {
    async home(req, res) {
		try {
			const teacher = req.session.teacher;
			
			res.render('teacherHome', { 
				layout: 'teacher_layout', 
				title: "Trang chủ", 
				activeHome: "active",
				teacher, 
			});
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}



}

module.exports = new TeacherController;
