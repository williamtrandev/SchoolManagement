const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const Student = require("../models/Student");
const StudentClass = require("../models/StudentClass");
const Parent = require("../models/Parent");
const Year = require("../models/Year");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Excel = require('exceljs');

const workbook = new Excel.Workbook();

class TeacherController {
	/* HOME PAGE */
	home = async (req, res) => {
		try {
			res.render('attendance', { layout: 'manager_layout', activeHoctap: 'active' });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	}

	/* REGISTER USER */
	register = async (req, res) => {
		try {
			const {
				name,
				birthday,
				gender,
				address,
				phone,
				email,
				password,
			} = req.body;

			const salt = await bcrypt.genSalt();
			const passwordHash = await bcrypt.hash(password, salt);

			const newTeacher = new Teacher({
				name,
				birthday,
				gender,
				address,
				phone,
				email,
				password: passwordHash,
			});
			const savedTeacher = await newTeacher.save();
			// res.status(201).json(savedTeacher);
			res.redirect('/teacher/login');
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	};

	/* LOGGING IN */
	login = async (req, res) => {
		try {
			const { email, password } = req.body;
			const teacher = await Teacher.findOne({ email: email });
			if (!teacher) return res.status(400).json({ msg: "Teacher does not exist. " });

			const isMatch = await bcrypt.compare(password, teacher.password);
			if (!isMatch) return res.status(400).json({ msg: "Invalid credentials. " });

			const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET);
			delete teacher.password;
			res.cookie('jwt', token, { maxAge: 60 * 60 * 24, httpOnly: true });
			req.session.teacher = teacher;
			// res.status(200).json({ token, teacher });
			res.redirect('/teacher');
		} catch (err) {
			res.redirect('/login');
		}
	};

	logout = (req, res) => {
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

	addClass = async (req, res) => {
		try {
			const { name, grade, teacher } = req.body;
			const oldClass = await Class.findOne({ name: name });
			if (oldClass) {
				return res.status(409).json({ message: "Class already exists" });
			}
			const currentDate = new Date();
			const currentYear = currentDate.getFullYear();
			const year = await Year.findOne({ startYear: currentYear });
			const newClass = new Class({ name, grade, teacher, year: year._id, attendance: [] });
			const savedClass = await newClass.save();
			res.status(200).send(savedClass);
		} catch (err) {
			res.status(500).json({ message: err })
		};
	};


	getStudentByClass = async (req, res) => {
		try {
			const id = req.query.id;
			const date = req.query.date;
			let isAttended = false;
			const classFind = await Class.findOne({ _id: id }).lean();
			const students = await StudentClass.find({ class: id })
				.populate('student')
				.populate('class')
				.lean();
			if (date) {
				if (classFind.attendance.includes(date)) {
					isAttended = true;
				}
				return res.status(200).json({ students: students, isAttended: isAttended });
			} else {
				const returnStudents = students.map(student => {
					const studentInfo = student.student;
					const className = student.class.name;
					return {
						...studentInfo,
						class: className
					}
				});
				console.log(returnStudents);
				return res.status(200).json({ students: returnStudents });
			}



		} catch (err) {
			console.log(err)
			res.status(404).json({ message: err });
		}
	};

	addIntoClass = async (req, res) => {
		try {
			const id = req.params.id;
			const {
				name,
				birthday,
				gender,
				ethnic,
				address
			} = req.body;
			const newStudent = new Student({
				name,
				birthday,
				gender,
				ethnic,
				address
			});
			const savedStudent = await newStudent.save();
			const newStudentClass = new StudentClass({
				student: newStudent._id,
				class: id,
				absentDays: []
			})
			const savedStudentClass = await newStudentClass.save();
			res.status(200).json(savedStudent);
		} catch (err) {
			res.status(404).json({ message: err });
		}
	}

	checkAttendance = async (req, res) => {
		try {
			const { data, idClass } = req.body;
			const currentDate = new Date();
			const day = currentDate.getDate(); // Lấy ngày (1-31)
			const month = currentDate.getMonth() + 1; // Lấy tháng (0-11) và cộng thêm 1 để đổi về (1-12)
			const year = currentDate.getFullYear();
			const date = `${year}-${month}-${day}`;
			await Class.findOneAndUpdate({ _id: idClass }, { $push: { attendance: date } });
			data.forEach(async item => {
				if (!item.restore) {
					// Điểm danh vắng
					const studentClass = await StudentClass.findOne({ student: item.student, class: item.class });
					// Có mặt
					if (!studentClass) {
						const newStudent = new StudentClass({ student: item.student, class: item.class });
						await newStudent.save();
					} else if (item.absent) {
						if (!studentClass.absentDays.includes(date)) {
							studentClass.absentDays.push(date);
							studentClass.save();
						}
					}
				} else {
					const studentClass = await StudentClass.findOne({ student: item.student, class: item.class });
					const idx = studentClass.absentDays.indexOf(date);
					if (idx !== -1) {
						studentClass.absentDays.splice(idx, 1);
					}
					studentClass.save();
				}

			});
			res.status(200).json({ message: "Update successfully" });
		} catch (err) {
			console.log(err);
			res.status(500).json({ message: err });
		}
	};

	profileStudents = async (req, res) => {
		try {
			// Lấy danh sách các năm học
			const years = await Year.find().lean().sort({ startYear: 1 });
			const yearId = years[years.length - 1]._id;
			const classes = await Class.find({ year: yearId }).sort('name').lean();

			// Tạo một object chứa 4 mảng class tương ứng với các grade
			const gradesData = {
				6: [],
				7: [],
				8: [],
				9: [],
			};
			classes.forEach(c => {
				if (c.grade) gradesData[c.grade].push(c);
			});
			res.render('profileStudents', {
				layout: 'manager_layout', years: years,
				classes: classes, grades: gradesData, activeHoso: 'active'
			});
		} catch (err) {
			console.log(err);
			res.status(500).json({ message: err });
		}
	};

	profileClasses = async (req, res) => {
		try {
			const classes = await Class.find()
				.populate('teacher')
				.lean();

			const modifiedClasses = await Promise.all(
				classes.map(async classItem => {
					const numberStudent = await StudentClass.countDocuments({ class: classItem._id });
					const teacherName = classItem.teacher ? classItem.teacher.name : 'Chưa có giáo viên chủ nhiệm';

					return {
						...classItem,
						teacher: teacherName,
						numberStudent
					};
				})
			);
			// sắp xếp dữ liệu theo tên lớp
			modifiedClasses.sort((a, b) => {
				const classA = a.name;
				const classB = b.name;
				// Sử dụng hàm so sánh chuỗi
				return classA.localeCompare(classB);
			});

			const teachers = await Teacher.find().lean();

			res.render('profileClasses', { layout: 'manager_layout', classes: modifiedClasses, teachers, activeHoso: 'active' });
		} catch (err) {
			console.log(err);
			res.status(500).json({ message: err });
		}
	};

	getClassesByGrade = async (req, res) => {
		try {
			const grade = req.params.grade;
			const classes = await Class.find({ grade: grade })
				.populate('teacher')
				.lean();

			const modifiedClasses = await Promise.all(
				classes.map(async classItem => {
					const numberStudent = await StudentClass.countDocuments({ class: classItem._id });
					const teacherName = classItem.teacher ? classItem.teacher.name : 'Chưa có giáo viên chủ nhiệm';

					return {
						...classItem,
						teacher: teacherName,
						numberStudent
					};
				})
			);
			// sắp xếp dữ liệu theo tên lớp
			modifiedClasses.sort((a, b) => {
				const classA = a.name;
				const classB = b.name;
				// Sử dụng hàm so sánh chuỗi
				return classA.localeCompare(classB);
			});
			return res.status(200).json({ classes: modifiedClasses });
		} catch (err) {
			console.log(err);
			res.status(500).json({ message: err });
		}
	};

	// Lấy danh sách các giáo viên chưa được chọn làm chủ nhiệm
	getNoFormTeacher = async (req, res) => {
		try {
			const idClass = req.params.id;
			const formTeacher = await Teacher.findOne({ class: idClass }).lean();
			const noFormTeachers = await Teacher.find({ class: null }).lean();
			console.log(formTeacher);
			console.log(noFormTeachers);
			res.status(200).json({ formTeacher, noFormTeachers });
		} catch (err) {
			console.log(err);
			res.status(500).json({ message: err });
		}
	};

	addStudentByFile = async (req, res) => {
		try {
			const excelFile = req.files.file;
			const currentYear = new Date().getFullYear();
			const year = await Year.findOne({ startYear: currentYear });
			console.log(year);
			const yearId = year._id;
			const classIdMap = {};
			await workbook.xlsx.load(excelFile.data);
			// Truy cập vào sheet "class"
			const classSheet = workbook.getWorksheet('Dữ liệu lớp');
			const classPromises = [];
			classSheet.eachRow((row, rowNumber) => {
				if (rowNumber === 1) {
					return;
				}
				const className = row.getCell(1).value;
				console.log(className);
				// const classPromise = Class.findOneAndUpdate(
				// 	{ name: className, year: yearId },
				// 	{ name: className, year: yearId },
				// 	{ upsert: true }
				// )
				// 	.then((classSaved) => {
				// 		if (classSaved) {
				// 			classIdMap[className] = classSaved._id;
				// 		}
				// 	});
				// classPromises.push(classPromise);
			});

			await Promise.all(classPromises);

			const students = [];
			const parents = [];
			const classStudents = [];
			// Truy cập vào sheet "student"
			const studentSheet = workbook.getWorksheet('Dữ liệu học sinh');
			studentSheet.eachRow((row, rowNumber) => {
				if (rowNumber === 1) {
					// Bỏ qua hàng đầu tiên (tiêu đề)
					return;
				}
				// Lấy thông tin sinh viên từ từng cột
				const name = row.getCell(1).value;
				const birthday = row.getCell(2).value;
				const gender = row.getCell(3).value === 'Nam' ? 1 : 0;
				const ethnic = row.getCell(4).value;
				const address = row.getCell(5).value;
				const className = row.getCell(6).value;
				const dadName = row.getCell(7).value;
				const dadJob = row.getCell(8).value;
				const dadPhone = row.getCell(9).value;
				const dadEmail = row.getCell(10).value;
				const momName = row.getCell(11).value;
				const momJob = row.getCell(12).value;
				const momPhone = row.getCell(13).value;
				const momEmail = row.getCell(14).value;
				console.log(momName, momJob, momPhone, momEmail);
				// Lấy id của class từ ánh xạ
				const classId = classIdMap[className];

				// insert vào student
				// const student = await(new Student({ name, birthday, gender, ethnic, address })).save();
				// // insert vào parent
				// parents.push(new Parent({ name: dadName, job: dadJob, phone: dadPhone, email: dadEmail, student: student._id }));
				// parents.push(new Parent({ name: momName, job: momJob, phone: momPhone, email: momEmail, student: student._id }));
				// // insert vào classStudent
				// classStudents.push(new StudentClass({ student: student._id, class: classId }));

			});

			// Parent.insertMany(parents);
			// StudentClass.insertMany(classStudents);
		} catch (err) {
			console.log(err);
			res.status(500).json({ message: err });
		}
	};

	getGradeByYear = async (req, res) => {
		try {
			const year = req.params.year;
			const classes = await Class.find({ year: year }).sort('name').lean();

			// Tạo một object chứa 4 mảng class tương ứng với các grade
			const gradesData = {
				6: [],
				7: [],
				8: [],
				9: [],
			};
			classes.forEach(c => {
				if (c.grade) gradesData[c.grade].push(c);
			});
			res.status(200).json(classes);
		} catch (err) {
			console.log(err);
			res.status(500).json({ message: err });
		}
	}
}




module.exports = new TeacherController;