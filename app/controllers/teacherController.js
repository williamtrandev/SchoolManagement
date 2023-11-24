const Assignment = require('../models/Assignment');
const Teacher = require('../models/Teacher');
const Year = require('../models/Year');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Announcement = require('../models/Announcement');
const Exercise = require('../models/Exercise');
const StudentClass = require('../models/StudentClass');
const Submission = require('../models/Submission');
const ScoreTable = require('../models/ScoreTable');
const Student = require('../models/Student');
const Schedule = require('../models/Schedule');
const TimeTable = require('../models/TimeTable');
const { sendMailNotification } = require('../utils/mail');

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const exceljs = require('exceljs');
const fs = require('fs');
const TermResult = require('../models/TermResult');

class TeacherController {
	async home(req, res) {
		try {
			const teacher = req.session.teacher;
			const currentYear = await Year.findOne({}).sort({ _id: -1 });

			const assignments = await Assignment.find({ teacher: teacher._id, year: currentYear })
				.populate('subject')
				.populate('class')
				.populate('schedules')
				.lean();

			const findTimeTable = await TimeTable.findOne({ isUsed: true });

			const timeTable = [
				{ period: 1, class: [] },
				{ period: 2, class: [] },
				{ period: 3, class: [] },
				{ period: 4, class: [] },
				{ period: 5, class: [] },
				{ period: 6, class: [] },
				{ period: 7, class: [] },
				{ period: 8, class: [] },
				{ period: 9, class: [] },
				{ period: 10, class: [] },
			];

			for (let i = 0; i < assignments.length; i++) {
				const schedules = await Schedule.find({ assignment: assignments[i]._id, timeTable: findTimeTable._id });
				for (let j = 0; j < schedules.length; j++) {
					console.log(schedules[j]);
					const period = schedules[j].period;
					const date = schedules[j].dayOfWeek;
					timeTable[period - 1].class[date - 2] = `${assignments[i].class.name} - ${assignments[i].subject.name}`;
				}
			}

			// if (teacher.class != null) {
			// 	if (timeTable[5].class.length == 0) {
			// 		timeTable[4].class[5] = `${teacher.class.name} - Sinh hoạt lớp`;
			// 	} else {
			// 		timeTable[9].class[5] = 'Sinh hoạt lớp';
			// 	}
			// }

			res.render('teacherHome', {
				layout: 'teacher_layout',
				title: "Trang chủ",
				activeHome: "active",
				teacher,
				assignments,
				timeTable,
			});
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	/* LOGGING IN */
	async login(req, res) {
		try {
			const { email, password } = req.body;
			const teacher = await Teacher.findOne({ email: email }).populate('class').lean();
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
			assignments.sort((a, b) => {
				const regex = /(\d+)([A-Za-z]+)(\d+)/;
				const [, numA, charA, numA2] = a.class.name.match(regex);
				const [, numB, charB, numB2] = b.class.name.match(regex);

				if (charA.localeCompare(charB) !== 0) {
					return charA.localeCompare(charB);
				}

				if (parseInt(numA) !== parseInt(numB)) {
					return parseInt(numA) - parseInt(numB);
				}

				return parseInt(numA2) - parseInt(numB2);
			});
			const assignmentId = req.params.id;

			const assignment = await Assignment.findById(assignmentId)
				.populate('subject')
				.populate('class')
				.populate('announcements')
				.populate({
					path: 'exercises',
					populate: {
						path: 'submissions',
						model: 'Submission',
					}
				}).lean();

			const number = await StudentClass.countDocuments({ class: assignment.class._id });

			let combinedData = [];
			if (assignment.announcements && assignment.exercises) {
				const announcements = assignment.announcements;
				const exercises = assignment.exercises.map(exercise => {
					const submissions = exercise.submissions;
					let count = 0;
					for (let i = 0; i < submissions.length; i++) {
						if (submissions[i].score == null) {
							count++;
						}
					}
					return { ...exercise, notGradedCount: count };
				});

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
				number,
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
			const updatedAssignment = await Assignment.findByIdAndUpdate(assignmentId, { $push: { announcements: savedAnnouncement._id } });
			const findTeacher = await Teacher.findById(updatedAssignment.teacher).lean();
			const students = await Student.find({ currentClass: updatedAssignment.class })
			.populate('parents').lean();
			const parents = [];
			students.forEach(student => {
				student.parents.forEach(parent => {
					parents.push({
						teacher: findTeacher,
						emailParent: parent.email,
					})
				})
			})

			const content = {
				title,
				description: message,
			};
			const teacher = findTeacher.name;
			if (parents.length > 0) {
				sendMailNotification(teacher, content, parents, 'notification');
			}
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

	async gradingPage(req, res) {
		try {
			const teacher = req.session.teacher;
			const currentYear = await Year.findOne({}).sort({ _id: -1 });
			const assignments = await Assignment.find({ teacher: teacher._id, year: currentYear })
				.populate('subject')
				.populate('class')
				.lean();

			const assignmentId = req.params.assignmentId;
			const exerciseId = req.params.exerciseId;

			const assignment = await Assignment.findById(assignmentId)
				.populate('subject')
				.populate('class')
				.lean();

			const studentClass = await StudentClass.find({ class: assignment.class._id })
				.populate({
					path: 'student',
					populate: {
						path: 'submissions',
						match: { exercise: exerciseId },
					}
				})
				.lean();

			const students = studentClass.map(sc => sc.student);
			const submittedStudents = [];
			const notsubmittedStudents = [];
			students.forEach(student => {
				if (student.submissions[0]) {
					submittedStudents.push(student);
				} else {
					notsubmittedStudents.push(student);
				}
			});

			const exercise = await Exercise.findById(exerciseId)
				.populate('submissions')
				.lean();

			const submissions = exercise.submissions;

			let countNotGraded = 0;
			submissions.forEach(submission => {
				if (submission.score == null) {
					countNotGraded++;
				}
			});

			console.log(exercise);

			res.render('teacherGrading', {
				layout: 'teacher_layout',
				title: "Chấm điểm",
				activeClassroom: "active",
				teacher,
				assignment,
				exercise,
				assignments,
				students,
				submittedStudents,
				notsubmittedStudents,
				countNotGraded,
				countSubmitted: submissions.length,
				displayBackToTop: 'd-none',
			});
		} catch (err) {
			console.log(err);
		}
	}

	async completeGrading(req, res) {
		try {
			const exerciseId = req.params.id;
			const table = req.body;
			table.forEach(async line => {
				await Submission.findOneAndUpdate({ exercise: exerciseId, student: line.studentId }, { score: line.score });
			});
			return res.json({ success: 'Lưu điểm thành công' });
		} catch (err) {
			console.log(err);
			return res.json({ error: 'Đã có lỗi xảy ra' });
		}
	}

	async scorePage(req, res) {
		try {
			const teacher = req.session.teacher;
			const currentYear = await Year.findOne({}).sort({ _id: -1 });
			const assignments = await Assignment.find({ teacher: teacher._id, year: currentYear })
				.populate('subject')
				.populate('class')
				.lean();

			const id = req.params.id;
			const assignment = await Assignment.findById(id)
				.populate('subject')
				.populate('class')
				.populate('year')
				.lean();

			const studentClass = await StudentClass.find({ class: assignment.class._id })
				.populate({
					path: 'student',
					model: 'Student',
					populate: {
						path: 'scoreTables',
						match: { assignment: id },
						model: 'ScoreTable'
					}
				})
				.lean();

			const students = studentClass.map(sc => sc.student);
			console.log(students);
			res.render('teacherScores', {
				layout: 'teacher_layout',
				title: "Bảng điểm",
				activeClassroom: "active",
				teacher,
				assignments,
				assignment,
				students,
			});

		} catch (err) {
			console.log(err);
			res.json(err);
		}
	}

	exportToExcel(req, res) {
		// Nhận dữ liệu bảng từ yêu cầu POST
		const subjectSlug = req.body.subject;
		const tableData = req.body.tableData;
		const notNumberSubject = ['giao-duc-the-chat', 'am-nhac', 'my-thuat', 'hoat-dong-trai-nghiem'];
		// Sử dụng exceljs để tạo một workbook và worksheet
		const workbook = new exceljs.Workbook();
		const worksheet = workbook.addWorksheet('Sheet 1');

		// Thêm dữ liệu từ bảng vào worksheet
		for (const row of tableData) {
			worksheet.addRow(row);
		}

		if (notNumberSubject.includes(subjectSlug)) {
			for (let row = 2; row <= tableData.length; row++) {
				worksheet.getCell(`F${row}`).value = {
					formula: `E${row}`,
					result: tableData[row - 1][4],
				};
			}
		} else {
			// Tạo công thức Excel trong cột cuối cùng
			for (let row = 2; row <= tableData.length; row++) {
				worksheet.getCell(`F${row}`).value = {
					formula: `ROUND((C${row} + D${row}*2 + E${row}*3)/6, 1)`,
					result: ((parseFloat(tableData[row - 1][2]) + parseFloat(tableData[row - 1][3]) * 2 + parseFloat(tableData[row - 1][4]) * 3) / 6).toFixed(1),
				};
			}
		}

		// Tạo một tệp Excel tạm thời
		const tempFilePath = 'public/file/temp.xlsx';
		workbook.xlsx.writeFile(tempFilePath)
			.then(() => {
				// Gửi tệp Excel cho người dùng tải về
				res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
				res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
				fs.createReadStream(tempFilePath).pipe(res);

				// Xóa tệp sau khi gửi xong
				res.on('finish', () => {
					fs.unlink(tempFilePath, () => {
						console.log('Deleted temp file');
					});
				});
			})
			.catch(error => {
				console.error(error);
				res.status(500).send('Internal Server Error');
			});
		fs.unlink(tempFilePath, () => { console.log('Deleted temp file') });
	}

	async importExcel(req, res) {
		try {
			const assignmentId = req.params.id;
			const newestYear = await Year.findOne({}).sort({ _id: -1 });
			const excelFile = req.files.file;
			const workbook = new exceljs.Workbook();
			await workbook.xlsx.load(excelFile.data);
			const worksheetData = workbook.getWorksheet(1); // Lấy trang tính toán đầu tiên
			const promiseFunctions = [];

			worksheetData.eachRow((row, rowNumber) => {
				if (rowNumber != 1) {
					const studentId = row.getCell(1).value;
					const scoreFrequent = row.getCell(3).value.result ? row.getCell(3).value.result : row.getCell(3).value;
					const scoreMidTerm = row.getCell(4).value.result ? row.getCell(4).value.result : row.getCell(4).value;
					const scoreFinalTerm = row.getCell(5).value.result ? row.getCell(5).value.result : row.getCell(5).value;

					const promiseFunction = async () => {
						const student = await Student.findOne({ studentId: studentId });
						const termResult = await TermResult.findOne({ student: student._id, year: newestYear }).sort({ _id: -1 });
						const assignment = await Assignment.findById(assignmentId);
						const scoreTable = await ScoreTable.findOneAndUpdate(
							{ assignment: assignmentId, student: student._id },
							{
								scoreFrequent: scoreFrequent,
								scoreMidTerm: scoreMidTerm,
								scoreFinalTerm: scoreFinalTerm,
								assignment: assignmentId,
								student: student._id,
								termResult: termResult._id
							},
							{ new: true, upsert: true }
						);

						if (!student.scoreTables.includes(scoreTable._id)) {
							student.scoreTables.push(scoreTable._id);
							await student.save();
						}

						if (!termResult.scoreTables.includes(scoreTable._id)) {
							termResult.scoreTables.push(scoreTable._id);
							await termResult.save();
						}

						if (!assignment.scoreTables.includes(scoreTable._id)) {
							assignment.scoreTables.push(scoreTable._id);
							await assignment.save();
						}
					};

					promiseFunctions.push(promiseFunction);
				}
			});

			await Promise.all(promiseFunctions.map(func => func()));
			return res.json('Success');
		} catch (err) {
			console.log(err);
			return res.status(500).send('Internal Server Error');
		}
	}

	async attendancePage(req, res) {
		try {
			const teacher = req.session.teacher;
			const currentYear = await Year.findOne({}).sort({ _id: -1 });
			const assignments = await Assignment.find({ teacher: teacher._id, year: currentYear })
				.populate('subject')
				.populate('class')
				.lean();

			const schoolClass = await Class.findById(teacher.class)
				.populate('year')
				.lean();

			const studentClass = await StudentClass.find({ class: schoolClass._id })
				.populate('student')
				.lean();
			console.log(studentClass);
			const students = studentClass.map(sc => sc.student);

			res.render('teacherAttendance', {
				layout: 'teacher_layout',
				activeAttendance: 'active',
				title: 'Điểm danh',
				displayBackToTop: 'd-none',
				teacher,
				assignments,
				schoolClass,
				students,
			});
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	async informationPage(req, res) {
		try {
			const teacher = req.session.teacher;
			const currentYear = await Year.findOne({}).sort({ _id: -1 });
			const assignments = await Assignment.find({ teacher: teacher._id, year: currentYear })
				.populate('subject')
				.populate('class')
				.lean();

			res.render('teacherInformation', {
				layout: 'teacher_layout',
				title: 'Thông tin',
				teacher,
				assignments,
				displayBackToTop: 'd-none',
			});
		} catch (err) {
			res.status(500).json({ error: 'Server error' });
		}
	}

	async changePassword(req, res) {
		try {
			const teacher = req.session.teacher;
			const oldPassword = req.body.oldPassword;
			const newPassword = req.body.newPassword;

			const teacherInfo = await Teacher.findById(teacher._id);

			const isMatch = await bcrypt.compare(oldPassword, teacherInfo.password);
			if (!isMatch) {
				return res.status(401).json({ error: 'Mật khẩu cũ không chính xác' });
			}

			const hashedPassword = await bcrypt.hash(newPassword, 10);

			await Teacher.updateOne({ _id: teacher._id }, { password: hashedPassword });
			return res.json({ success: 'Thay đổi mật khẩu thành công' })

		} catch (err) {
			res.status(500).json({ error: 'Server error' });
		}
	}
}

module.exports = new TeacherController;
