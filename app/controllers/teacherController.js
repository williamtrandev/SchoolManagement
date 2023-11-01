const Assignment = require('../models/Assignment');
const Teacher = require('../models/Teacher');
const Year = require('../models/Year');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Announcement = require('../models/Announcement');
const Exercise = require('../models/Exercise');

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

class TeacherController {
    async home(req, res) {
		try {
			const teacher = req.session.teacher;
			const currentYear = await Year.findOne({}).sort({ _id: -1 });

			const assignments = await Assignment.find({ teacher: teacher._id, year: currentYear })
				.populate('subject')
				.populate('class')
				.lean();
			
			res.render('teacherHome', { 
				layout: 'teacher_layout', 
				title: "Trang chủ", 
				activeHome: "active",
				teacher, 
				assignments,
			});
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	/* LOGGING IN */
	async login(req, res) {
		try {
			const { email, password } = req.body;
			const teacher = await Teacher.findOne({ email: email }).lean();
			if (!teacher) {
				return res.status(404).json({ error: 'Email không tồn tại' });
			}

			const isMatch = await bcrypt.compare(password, teacher.password);
			if (!isMatch) {
				return res.status(401).json({ error: 'Mật khẩu không chính xác' });
			}

			delete teacher.password;
			const token = jwt.sign({ teacher: teacher }, process.env.JWT_SECRET);
			res.cookie('jwt', token, { maxAge: 60 * 60 * 1000, httpOnly: true });
			// req.session.student = student;
			// res.status(200).json({ token, teacher });
			return res.status(200).json({ success: 'Đăng nhập thành công' });
		} catch (err) {
			console.log(err)
			res.redirect('/login');
		}
	};

	logout(req, res) {
		req.session.destroy((err) => {
			if (err) {
				console.error('Lỗi khi xóa session: ' + err);
			}
		});
		// Xóa cookie
		// Lấy danh sách tất cả các cookie trong request
		const cookies = Object.keys(req.cookies);

		// Lặp qua danh sách cookie và xóa chúng
		cookies.forEach(cookieName => {
			res.clearCookie(cookieName);
		});
		// Chuyển về login
		res.redirect('/teacher/login');
	};

	async classroomPage(req, res) {
		try {
			const teacher = req.session.teacher;
			const currentYear = await Year.findOne({}).sort({ _id: -1 });
			const assignments = await Assignment.find({ teacher: teacher._id, year: currentYear })
				.populate('subject')
				.populate('class')
				.lean();

			const assignmentId = req.params.id;

			const assignment = await Assignment.findById(assignmentId)
				.populate('subject')
				.populate('class')
				.populate('announcements')
				.populate('exercises')
				.lean();

			let combinedData = [];
			if (assignment.announcements && assignment.exercises ) {
				const announcements = assignment.announcements;
				const exercises = assignment.exercises;
	
				combinedData = announcements.concat(exercises);
				combinedData.sort((a, b) => b.createdAt - a.createdAt);
			}
			
			res.render('teacherClassroom', { 
				layout: 'teacher_layout', 
				title: "Lớp học", 
				activeClassroom: "active",
				teacher, 
				assignment,
				assignments,
				combinedData,
			});
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	async newAnnouncement(req, res) {
		try {
			const { title, message, assignmentId } = req.body;
			const newAnnouncement = new Announcement({ title, message, assignment: assignmentId });
			const savedAnnouncement = await newAnnouncement.save();
			await Assignment.findByIdAndUpdate(assignmentId, { $push: { announcements: savedAnnouncement._id } });
			return res.json({ success: savedAnnouncement });
		} catch (err) {
			console.log(err);
			return res.json({ error: 'Lưu thông báo không thành công' });
		}
	}

	async updateAnnouncement(req, res) {
		try {
			const id = req.params.id;
			const updatedAnnouncement = await Announcement.findByIdAndUpdate(id, req.body, { new: true });
			return res.json({ success: updatedAnnouncement });
		} catch (err) {
			console.log(err);
			return res.json({ error: 'Chỉnh sửa thông báo không thành công' });
		}
	}

	async deleteAnnouncement(req, res) {
		try {
			const id = req.params.id;
			await Announcement.deleteOne({ _id: id });
			return res.json({ success: 'Xóa thông báo thành công' });
		} catch (err) {
			console.log(err);
			return res.json({ error: 'Không thể xóa thông báo' });
		}
	}

	async newExercise(req, res) {
		try {
			const { title, description, assignmentId, deadline } = req.body;
			const newExercise = new Exercise({ title, description, assignment: assignmentId, deadline, submissions: [] });
			const savedExercise = await newExercise.save();
			await Assignment.findByIdAndUpdate(assignmentId, { $push: { exercises: savedExercise._id } });
			return res.json({ success: savedExercise });
		} catch (err) {
			console.log(err);
			return res.json({ error: 'Lưu bài tập không thành công' });
		}
	}

	async updateExercise(req, res) {
		try {
			const id = req.params.id;
			const updatedExercise = await Exercise.findByIdAndUpdate(id, req.body, { new: true });
			return res.json({ success: updatedExercise });
		} catch (err) {
			console.log(err);
			return res.json({ error: 'Chỉnh sửa bài tập không thành công' });
		}
	}

	async deleteExercise(req, res) {
		try {
			const id = req.params.id;
			await Exercise.deleteOne({ _id: id });
			return res.json({ success: 'Xóa bài tập thành công' });
		} catch (err) {
			console.log(err);
			return res.json({ error: 'Không thể xóa bài tập' });
		}
	}

	async insertAssignment(req, res) {
		const {
			subjectName,
			className,
		} = req.body;
		const subject = await Subject.findOne({name: subjectName});
		const schoolClass = await Class.findOne({name: className});
		const currentYear = await Year.findOne({}).sort({ _id: -1 });

		const newAssignment = new Assignment({
			teacher: '653bc90e0f1874418cb11993', 
			subject, 
			class: schoolClass, 
			year: currentYear, 
			announcements: [],
			exercises: [],
			schedules: [],
			scoreTables: [],
		});
		const savedAssignment = await newAssignment.save();
		res.json(savedAssignment);
	}

}

module.exports = new TeacherController;
