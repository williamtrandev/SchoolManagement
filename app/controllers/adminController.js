const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const Student = require("../models/Student");
const StudentClass = require("../models/StudentClass");
const Parent = require("../models/Parent");
const Year = require("../models/Year");
const Assignment = require("../models/Assignment");
const Subject = require("../models/Subject");
const Violation = require("../models/Violation");
const Schedule = require("../models/Schedule");
const TermResult = require("../models/TermResult");
const ScoreTable = require("../models/ScoreTable");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Excel = require('exceljs');
const { ROLES, TYPE_VIOLATION, POINT_VIOLATION } = require('../constants');
const { sendMailToUser } = require('../utils/mail');
const TimeTable = require("../models/TimeTable");

const workbook = new Excel.Workbook();

sortClass = (a, b) => {
	const regex = /(\d+)([A-Za-z]+)(\d+)/;
	const [, numA, charA, numA2] = a.match(regex);
	const [, numB, charB, numB2] = b.match(regex);

	if (charA.localeCompare(charB) !== 0) {
		return charA.localeCompare(charB);
	}

	if (parseInt(numA) !== parseInt(numB)) {
		return parseInt(numA) - parseInt(numB);
	}

	return parseInt(numA2) - parseInt(numB2);
}


class AdminController {
	home = async (req, res) => {
		res.render('home', { layout: 'manager_layout', title: 'Trang chủ' })
	}
	/* HOME PAGE */
	attendance = async (req, res) => {
		try {
			res.render('attendance', { layout: 'manager_layout', activeHoctap: 'active', title: 'Điểm danh' });
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
			res.redirect('/admin/login');
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	};

	/* LOGGING IN */
	login = async (req, res) => {
		try {
			const { email, password } = req.body;
			const teacher = await Teacher.findOne({ email: email }).lean();
			if (!teacher) return res.status(400).json({ msg: "Teacher does not exist. " });

			const isMatch = await bcrypt.compare(password, teacher.password);
			if (!isMatch) return res.status(400).json({ msg: "Invalid credentials. " });

			delete teacher.password;
			const token = jwt.sign({ teacher: teacher }, process.env.JWT_SECRET);

			res.cookie('jwt', token, { maxAge: 60 * 60 * 1000, httpOnly: true });
			req.session.teacher = teacher;
			res.status(200).json({ token, teacher });
		} catch (err) {
			res.status(500).json({ msg: err });
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
		res.redirect('/admin/login');
	};

	addClass = async (req, res) => {
		try {
			const { name, grade, teacher } = req.body;
			const year = await Year.findOne({}).sort({ _id: -1 });
			const oldClass = await Class.findOne({ name: name, year: year._id });
			if (oldClass) {
				return res.status(409).json({ message: "Class already exists" });
			}
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
			const classFind = await Class.findById(id).lean();

			if (date) {
				const students = await StudentClass.find({ class: id })
					.populate(['student', 'class', 'violations'])
					.lean();
				const filteredStudents = students.map(student => ({
					...student,
					violations: student.violations.filter(violation => violation.date === date)
				}));
				if (classFind.attendance.includes(date)) {
					isAttended = true;
				}
				return res.status(200).json({ students: filteredStudents, isAttended: isAttended });
			} else {
				const students = await StudentClass.find({ class: id })
					.populate(['student', 'class', 'violations'])
					.lean();
				students.sort((a, b) => {
					const studentIdA = a.student.studentId;
					const studentIdB = b.student.studentId;

					return studentIdA.localeCompare(studentIdB);
				});
				console.log(students);
				const returnStudents = students.map(student => {
					const studentInfo = student.student;
					const className = student.class.name;
					return {
						...studentInfo,
						class: className
					}
				});
				//console.log(returnStudents);
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
				address,
				nameDad,
				phoneDad,
				jobDad,
				emailDad,
				nameMom,
				phoneMom,
				jobMom,
				emailMom,
			} = req.body;
			const newStudent = new Student({
				name,
				birthday,
				gender,
				ethnicity: ethnic,
				address
			});
			const savedStudent = await newStudent.save();
			const newStudentClass = new StudentClass({
				student: newStudent._id,
				class: id,
			})
			await newStudentClass.save();
			const dad = new Parent({ name: nameDad, phone: phoneDad, job: jobDad, email: emailDad });
			const mom = new Parent({ name: nameMom, phone: phoneMom, job: jobMom, email: emailMom });
			const savedDad = await dad.save();
			const savedMom = await mom.save();
			savedStudent.parents.push(savedDad._id);
			savedStudent.parents.push(savedMom._id);
			savedStudent.save();
			res.status(200).json(savedStudent);
		} catch (err) {
			res.status(404).json({ message: err });
		}
	}

	editStudent = async (req, res) => {
		try {
			const mssv = req.params.mssv;
			const {
				name,
				birthday,
				gender,
				ethnic,
				address,
				nameDad,
				phoneDad,
				jobDad,
				emailDad,
				nameMom,
				phoneMom,
				jobMom,
				emailMom,
				idClass,
			} = req.body;
			const savedStudent = await Student.findOne({ studentId: mssv });
			// set lại current Class
			const currentClass = savedStudent.currentClass;

			const updatedStudent = await Student.findByIdAndUpdate(savedStudent._id, {
				name, birthday, gender, ethnicity: ethnic, address, currentClass: idClass
			}, { new: true });

			// Xóa studentClass
			const removedStudentClass = await StudentClass.findOneAndRemove({ student: savedStudent._id, class: currentClass });
			// Thêm mới studentClass
			const newStudentClass = new StudentClass({
				student: savedStudent._id,
				class: idClass,
			})
			await newStudentClass.save();
			const parents = savedStudent.parents;
			const updatedDad = await Parent.findByIdAndUpdate(parents[0], {
				name: nameDad, phone: phoneDad, job: jobDad, email: emailDad
			});
			const updateMom = await Parent.findByIdAndUpdate(parents[1], {
				name: nameMom, phone: phoneMom, job: jobMom, email: emailMom
			});
			res.status(200).json(updatedStudent);
		} catch (err) {
			res.status(404).json({ message: err });
		}
	}

	checkAttendance = async (req, res) => {
		try {
			const { data, idClass, updateList, isAttended } = req.body;
			const currentDate = new Date();
			const day = currentDate.getDate(); // Lấy ngày (1-31)
			const month = currentDate.getMonth() + 1; // Lấy tháng (0-11) và cộng thêm 1 để đổi về (1-12)
			const year = currentDate.getFullYear();
			const date = `${year}-${month}-${day}`;
			// Đánh dấu hôm nay đã điểm danh
			await Class.findOneAndUpdate({ _id: idClass }, { $addToSet: { attendance: date } });
			const absentStudentMap = {};
			for (const item of data) {
				// Bản ghi mới
				const studentClass = await StudentClass.findOne({ student: item.student, class: item.class });
				for (const violation of item.violations) {
					let violationType;

					switch (violation.type) {
						case 'ABSENT':
							violationType = TYPE_VIOLATION.Absent;
							break;
						case 'CONDUCT':
							violationType = TYPE_VIOLATION.Conduct;
							break;
						case 'GROOVE':
							violationType = TYPE_VIOLATION.Groove;
							break;
						default:
							// Xử lý mặc định nếu loại vi phạm không khớp
							violationType = TYPE_VIOLATION.Default;
					}

					const newViolation = new Violation({
						type: violationType,
						date: date,
						studentClass: studentClass._id
					});
					const savedViolation = await newViolation.save();
					studentClass.violations.push(savedViolation._id);
					// Mapping các id của student vắng
					absentStudentMap[item.student._id] = studentClass;

					if (violationType === 'ABSENT') {
						const user = await StudentClass.findOne({
							student: item.student, class: item.class
						}).populate({
							path: 'student',
							populate: {
								path: 'parents'
							}
						});
						console.log('users new', user);
						const parents = [];
						user.student.parents.forEach(parent => {
							parents.push({
								name: user.student.name,
								state: 'vắng',
								emailParent: parent.email,
							});
						});
						console.log(parents);
						if (parents.length > 0) {
							sendMailToUser(parents, 'attendance');
						}
					}
				}


				await studentClass.save();
			}

			for (const updateItem of updateList) {
				const studentClass = await StudentClass.findOne({
					student: updateItem.student, class: updateItem.class
				});
				for (const violation of updateItem.violations) {
					let violationType;
					//console.log(violation);
					switch (violation.type) {
						case 'ABSENT':
							violationType = 'ABSENT';
							break;
						case 'CONDUCT':
							violationType = 'CONDUCT';
							break;
						case 'GROOVE':
							violationType = 'GROOVE';
							break;
						default:
							violationType = 'UNKNOWN';
					}
					if (violation.action === 'delete') {
						const findViolation = await Violation.findOne({
							type: violationType,
							date: date,
							studentClass: studentClass._id
						});
						//console.log(findViolation);
						studentClass.violations.pull(findViolation._id);
						//console.log(studentClass.violations);
						await findViolation.deleteOne();
						// absent xóa tức là sửa lại là có mặt -> gửi mail lại là có mặt
						if (violationType === 'ABSENT') {
							const user = await StudentClass.findOne({
								student: updateItem.student, class: updateItem.class
							}).populate({
								path: 'student',
								populate: {
									path: 'parents'
								}
							});
							console.log('users update', user);
							const parents = [];
							user.student.parents.forEach(parent => {
								parents.push({
									name: user.student.name,
									state: 'có mặt',
									emailParent: parent.email,
								});
							});
							console.log(parents);
							if (parents.length > 0) {
								sendMailToUser(parents, 'attendance');
							}
						}
					}

				}
				await studentClass.save();
			};

			// Lần đầu điểm danh thì gửi mail hàng loạt
			if (!isAttended) {
				const students = await StudentClass.find({ class: idClass })
					.populate({
						path: 'student',
						populate: {
							path: 'parents'
						}
					}).lean();
				const users = [];
				students.forEach(user => {
					// Tồn tại trong danh sách vắng thì state = 'vắng'
					let state = 'có mặt';
					if (absentStudentMap[user._id]) {
						state = 'vắng';
					}
					user.student.parents.forEach(parent => {
						users.push({
							name: user.student.name,
							state: state,
							emailParent: parent.email,
						})
					})
				});
				console.log('users first', users)
				if (users.length > 0) {
					sendMailToUser(users, 'attendance');
				}
			}
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
			const classes = await Class.find({ year: yearId }).lean();
			classes.sort((a, b) => {
				const regex = /(\d+)([A-Za-z]+)(\d+)/;
				const [, numA, charA, numA2] = a.name.match(regex);
				const [, numB, charB, numB2] = b.name.match(regex);

				if (charA.localeCompare(charB) !== 0) {
					return charA.localeCompare(charB);
				}

				if (parseInt(numA) !== parseInt(numB)) {
					return parseInt(numA) - parseInt(numB);
				}

				return parseInt(numA2) - parseInt(numB2);
			});
			// Tạo một object chứa 4 mảng class tương ứng với các grade
			const gradesData = {
				6: [],
				7: [],
				8: [],
				9: [],
			};
			classes.forEach(c => {
				if (c.name) gradesData[parseInt(c.name.charAt(0))].push(c);
			});
			console.log(classes);
			res.render('profileStudents', {
				layout: 'manager_layout', years: years,
				classes: classes, grades: gradesData, activeHoso: 'active',
				title: 'Hồ sơ học sinh'
			});
		} catch (err) {
			console.log(err);
			res.status(500).json({ message: err });
		}
	};

	profileClasses = async (req, res) => {
		try {

			const teachers = await Teacher.find().lean();

			res.render('profileClasses', {
				layout: 'manager_layout',
				teachers, activeHoso: 'active', title: 'Hồ sơ lớp'
			});
		} catch (err) {
			console.log(err);
			res.status(500).json({ message: err });
		}
	};

	getClassesByGrade = async (req, res) => {
		try {
			const grade = req.params.grade;
			const classes = await Class.find({ name: { $regex: new RegExp('^' + grade) } })
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
				const regex = /(\d+)([A-Za-z]+)(\d+)/;
				const [, numA, charA, numA2] = a.name.match(regex);
				const [, numB, charB, numB2] = b.name.match(regex);

				if (charA.localeCompare(charB) !== 0) {
					return charA.localeCompare(charB);
				}

				if (parseInt(numA) !== parseInt(numB)) {
					return parseInt(numA) - parseInt(numB);
				}

				return parseInt(numA2) - parseInt(numB2);
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
			res.status(200).json({ formTeacher, noFormTeachers });
		} catch (err) {
			console.log(err);
			res.status(500).json({ message: err });
		}
	};

	addDataByFile = async (req, res) => {
		try {
			const excelFile = req.files.file;
			const newestYear = await Year.findOne({}).sort({ _id: -1 });
			const yearId = newestYear._id;
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
				classPromises.push(async () => {
					const savedClass = await Class.findOneAndUpdate(
						{ name: className, year: yearId },
						{ name: className, year: yearId },
						{ new: true, upsert: true }
					);
					classIdMap[className] = savedClass._id;
				});


			});

			// Chạy insert theo thứ tự
			for (const classPromise of classPromises) {
				await classPromise();
			}
			// Tạo một mảng chứa tất cả các lệnh insert
			const insertPromises = [];

			// Truy cập vào sheet "student"
			const studentSheet = workbook.getWorksheet('Dữ liệu học sinh');
			studentSheet.eachRow(async (row, rowNumber) => {
				if (rowNumber === 1) {
					// Bỏ qua hàng đầu tiên (tiêu đề)
					return;
				}
				// Lấy thông tin sinh viên từ từng cột
				const name = row.getCell(1).value;
				var birthday = row.getCell(2).value;
				console.log(name, birthday);
				const dateParts = birthday.split('/');
				// Chuyển đổi sang định dạng MM/DD/YYYY (hoặc DD/MM/YYYY tùy theo nguồn dữ liệu)
				const formattedDate = `${dateParts[1]}/${dateParts[0]}/${dateParts[2]}`;

				// Tạo đối tượng Date từ chuỗi đã chuyển đổi
				birthday = new Date(formattedDate);
				const gender = row.getCell(3).value === 'Nam' ? 1 : 0;
				const ethnicity = row.getCell(4).value;
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
				// Lấy id của class từ ánh xạ
				const classId = classIdMap[className];
				console.log(classId);
				// Thêm lệnh insert vào mảng
				insertPromises.push(async () => {
					// insert vào student
					const student = await (new Student({ name, birthday, gender, ethnicity, address, currentClass: classId })).save();
					// // insert vào parent
					const savedDad = await (new Parent({ name: dadName, job: dadJob, phone: dadPhone, email: dadEmail, student: student._id })).save();
					const savedMom = await (new Parent({ name: momName, job: momJob, phone: momPhone, email: momEmail, student: student._id })).save();
					// // insert vào classStudent
					const savedStudentClass = await (new StudentClass({ student: student._id, class: classId })).save();
					const newTerm = new TermResult({
						comment: '', academicPerformance: '', conduct: '',
						student: student._id, is1stSemester: true, year: yearId
					});
					const savedTerm = await newTerm.save();
					student.parents.push(savedDad._id);
					student.parents.push(savedMom._id);
					student.studentClasses.push(savedStudentClass._id);
					student.termResults.push(savedTerm._id);
					await student.save();
				});
			});
			// Chạy insert theo thứ tự
			for (const insertPromise of insertPromises) {
				await insertPromise();
			}

			// Truy cập sheet Giáo viên
			const teacherSheet = workbook.getWorksheet('Dữ liệu giáo viên');
			const teacherPromises = [];
			teacherSheet.eachRow((row, rowNumber) => {
				if (rowNumber === 1) {
					// Bỏ qua hàng đầu tiên (tiêu đề)
					return;
				}
				const name = row.getCell(1).value;
				var birthday = row.getCell(2).value;
				console.log(birthday);
				const dateParts = birthday.split('/');
				// Chuyển đổi sang định dạng MM/DD/YYYY (hoặc DD/MM/YYYY tùy theo nguồn dữ liệu)
				const formattedDate = `${dateParts[1]}/${dateParts[0]}/${dateParts[2]}`;

				// Tạo đối tượng Date từ chuỗi đã chuyển đổi
				birthday = new Date(formattedDate);
				const gender = row.getCell(3).value === 'Nam' ? 1 : 0;
				const address = row.getCell(4).value;
				const phone = row.getCell(5).value;
				const email = row.getCell(6).value;
				const group = row.getCell(7).value;
				teacherPromises.push(new Teacher({ name, birthday, gender, address, phone, email, group }).save());
			});
			await Promise.all(teacherPromises);
			return res.status(200).json('success');
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
	data = (req, res) => {
		res.render('data', { layout: 'manager_layout', title: 'Thêm dữ liệu', activeHoso: 'active' });
	}
	setTeacher = async (req, res) => {
		try {
			const { classId, teacherCurr, teacherChange } = req.body;
			console.log('class, curr, change:', classId, teacherCurr, teacherChange);

			const updatedClass = await Class.findOneAndUpdate({ _id: classId }, { teacher: teacherChange }, { new: true });
			const updatedTeacher = await Teacher.findOneAndUpdate({ _id: teacherChange }, { class: classId });
			if (teacherCurr) {
				await Teacher.findOneAndUpdate({ _id: teacherCurr }, { class: null });
			}
			return res.status(200).json({ updatedClass, updatedTeacher });
		} catch (err) {
			console.log(err);
			res.status(500).json({ message: err });
		}
	}
	teachers = (req, res) => {
		res.render('profileTeachers', {
			layout: 'manager_layout', title: 'Thông tin giáo viên',
			activeHoso: 'active'
		});
	}
	addTeacher = async (req, res) => {
		try {
			const { name, birthday, gender, address, phone, email, group } = req.body;
			const newTeacher = await new Teacher({ name, birthday, gender, address, phone, email, group }).save();
			res.status(200).json(newTeacher);
		} catch (err) {
			res.status(500).json({ message: err });
		}
	}
	getTeachersByGroup = async (req, res) => {
		try {
			const teacher = req.session.teacher;
			console.log(teacher);
			const group = req.query.group;
			const teachers = await Teacher.find({ group: group }).select('-password');
			res.status(200).json({ teachers });
		} catch (err) {
			res.status(500).json({ message: err });
		}
	}
	getTeachersByClass = async (req, res) => {
		try {
			const classId = req.params.classId;
			const teachers = await Assignment.find({ class: classId }).populate('teacher').lean();
			res.status(200).json({ teachers });
		} catch (err) {
			res.status(500).json({ message: err });
		}
	}
	updateTeacher = async (req, res) => {
		try {
			const teacherId = req.params.teacherId;
			const { name, group, email, birthday, gender, phone } = req.body;
			const updatedTeacher = await Teacher.findByIdAndUpdate(teacherId,
				{ name: name, group: group, email: email, birthday: birthday, gender: gender, phone: phone },
				{ new: true });
			res.status(200).json(updatedTeacher);
		} catch (err) {
			res.status(500).json({ message: err });
		}
	}
	assignments = async (req, res) => {
		const year = await Year.findOne().sort({ _id: -1 });
		const classes = await Class.find({ year: year._id }).lean();
		classes.sort((a, b) => {
			const regex = /(\d+)([A-Za-z]+)(\d+)/;
			const [, numA, charA, numA2] = a.name.match(regex);
			const [, numB, charB, numB2] = b.name.match(regex);

			if (charA.localeCompare(charB) !== 0) {
				return charA.localeCompare(charB);
			}

			if (parseInt(numA) !== parseInt(numB)) {
				return parseInt(numA) - parseInt(numB);
			}

			return parseInt(numA2) - parseInt(numB2);
		});
		const teachers = await Teacher.find({ role: ROLES.Teacher })
			.populate({
				path: 'assignments',
				match: { year: year._id },
				populate: ['class', 'subject']
			})
			.lean();
		teachers.sort((teacherA, teacherB) => {
			const subjectNameA = teacherA.group; // Assuming each teacher has at least one assignment
			const subjectNameB = teacherB.group;

			// Use localeCompare to compare subject names
			return subjectNameA.localeCompare(subjectNameB);
		});
		console.log(teachers[0]);
		let assignments = {};
		teachers.forEach(teacher => {
			if (!assignments[teacher._id]) {
				assignments[teacher._id] = {};
			}
			teacher.assignments.forEach(assignment => {
				if (!assignments[teacher._id][assignment.subject.name]) {
					assignments[teacher._id][assignment.subject.name] = '';
				}

				const classList = assignments[teacher._id][assignment.subject.name];
				if (classList) {
					const arr = assignments[teacher._id][assignment.subject.name].split(', ');
					console.log(arr);
					arr.push(assignment.class.name);
					arr.sort(sortClass);

					assignments[teacher._id][assignment.subject.name] = arr.join(', ');
				} else {
					assignments[teacher._id][assignment.subject.name] = assignment.class.name;
				}
			});
		});
		console.log(assignments);
		// oldAssignments là obj chứa các lớp mà giáo viên đang dạy
		const combinedTeachers = teachers.map((teacher, index) => ({ teacher: teacher, oldAssignments: assignments[teacher._id] }));
		const subjects = await Subject.find().lean();
		res.render('assignments', {
			layout: 'manager_layout', activePhancong: 'active',
			classes, subjects, teachers: combinedTeachers,
			title: 'Phân công lịch dạy'
		})
	}
	getAllClass = async (req, res) => {
		try {
			const year = await Year.findOne({}).sort({ _id: -1 });
			const classes = await Class.find({ year: year._id })
			.populate({
				path: 'assignments',
				populate: [
					{ path: 'teacher' },
					{ path: 'subject' }
				]
			})
			.lean();
			classes.sort((a, b) => {
				const regex = /(\d+)([A-Za-z]+)(\d+)/;
				const [, numA, charA, numA2] = a.name.match(regex);
				const [, numB, charB, numB2] = b.name.match(regex);

				if (charA.localeCompare(charB) !== 0) {
					return charA.localeCompare(charB);
				}

				if (parseInt(numA) !== parseInt(numB)) {
					return parseInt(numA) - parseInt(numB);
				}

				return parseInt(numA2) - parseInt(numB2);
			});
			console.log(classes);
			return res.status(200).json(classes);
		} catch (err) {
			res.status(500).json({ error: err })
		}
	}
	getAllClassByYear = async (req, res) => {
		try {
			const year = req.params.year;
			const classes = await Class.find({ year: year }).lean();
			return res.status(200).json(classes);
		} catch (err) {
			res.status(500).json({ error: err })
		}
	}
	getAllSubject = async (req, res) => {
		try {
			const subjects = await Subject.find().lean();
			return res.status(200).json(subjects);
		} catch (err) {
			res.status(500).json({ error: err })
		}
	}
	saveAssignments = async (req, res) => {
		try {
			const { data, deleteList } = req.body;
			const year = await Year.findOne().sort({ _id: -1 }).lean();
			deleteList.forEach(async item => {
				const condition = {
					teacher: item.teacherId,
					class: item.classId,
					subject: item.subjectId,
					year: year._id,
				};
				const deletedAssignment = await Assignment.findOneAndRemove(condition);
				await Teacher.findOneAndUpdate({ _id: item.teacherId },
					{ $pull: { assignments: deletedAssignment._id } });
				await Class.findByIdAndUpdate(item.classId, { $pull: { assignments: deletedAssignment._id } })
			});

			data.forEach(async assignmentData => {
				const { teacherId, classId, subjectId } = assignmentData;

				const savedAssignment = await Assignment.findOne({
					teacher: teacherId,
					class: classId,
					subject: subjectId,
					year: year._id,
				});

				if (!savedAssignment) {
					const newAssignment = new Assignment({
						teacher: teacherId,
						class: classId,
						subject: subjectId,
						year: year._id,
					});

					await newAssignment.save();

					await Teacher.findOneAndUpdate(
						{ _id: teacherId },
						{ $push: { assignments: newAssignment._id } }
					);
					await Class.findByIdAndUpdate(classId, { $push: { assignments: newAssignment._id } });
				}
			});

			res.status(200).json('Success');
		} catch (err) {
			res.status(500).json({ error: err });
		}
	}
	timeTable = async (req, res) => {
		const year = await Year.findOne().sort({ _id: -1 });
		const classes = await Class.find({ year: year._id }).lean();
		const timeTables = await TimeTable.find()
			.populate({
				path: 'schedules',
				populate: {
					path: 'assignment',
					match: { year: year._id }, // Sử dụng match để tìm theo year của assignment
				}
			})
			.lean();
		console.log(timeTables);
		res.render('timeTable', {
			layout: 'manager_layout', title: 'Thời khóa biểu',
			classes, timeTables, activePhancong: 'active'
		});
	}
	getScheduleByClass = async (req, res) => {
		try {
			const classId = req.params.classId;
			const schedules = await Schedule.find({ class: classId })
				.populate('assignment')
				.lean();
			res.status(200).json(schedules);
		} catch (err) {
			console.log(err);
			res.status(500).json({ error: err });
		}
	}
	getAssignmentsByClass = async (req, res) => {
		try {
			const classId = req.params.classId;
			const assignments = await Assignment.find({ class: classId })
				.populate(['subject', 'teacher'])
				.lean();
			console.log(assignments);
			res.status(200).json(assignments);
		} catch (err) {
			console.log(err);
			res.status(500).json({ err: err });
		}
	}
	student = async (req, res) => {
		try {
			const mssv = req.params.mssv;
			const findStudent = await Student.findOne({ studentId: mssv })
				.populate(['parents', 'currentClass']).lean();
			res.status(200).json(findStudent);
		} catch (err) {
			res.status(500).json({ err: err });
		}
	}
	rank = async (req, res) => {
		res.render('ranking', {
			layout: 'manager_layout', activeHoctap: 'active',
			title: 'Thi đua tuần',
		});
	}
	getRanking = async (req, res) => {
		try {
			// Tạo một đối tượng Date hiện tại
			const currentDate = new Date();

			// Lấy ngày hiện tại trong tuần (0: Chủ Nhật, 1: Thứ Hai, 2: Thứ Ba, ..., 6: Thứ Bảy)
			const currentDayOfWeek = currentDate.getDay();

			// Lấy ngày đầu tiên của tuần (Chủ Nhật)
			const firstDayOfWeek = new Date(currentDate);
			firstDayOfWeek.setDate(currentDate.getDate() - currentDayOfWeek);

			// Tạo một mảng chứa các ngày trong tuần dưới dạng "year/month/day"
			const daysInWeek = [];
			for (let i = 1; i < 7; i++) {
				const day = new Date(firstDayOfWeek);
				day.setDate(firstDayOfWeek.getDate() + i);
				const year = day.getFullYear();
				const month = String(day.getMonth() + 1).padStart(2, '0'); // Thêm 0 phía trước nếu cần
				const dayOfMonth = String(day.getDate()).padStart(2, '0'); // Thêm 0 phía trước nếu cần
				const formattedDate = `${year}-${month}-${dayOfMonth}`;
				daysInWeek.push(formattedDate);
			}

			const findViolations = await Violation.find({ date: { $in: daysInWeek } })
				.populate({
					path: 'studentClass',
					populate: {
						path: 'student'
					}
				})
				.populate({
					path: 'studentClass',
					populate: {
						path: 'class',
					}
				});;

			// Tạo một đối tượng để gộp vi phạm theo lớp
			const violationsByClass = {};
			const year = await Year.findOne().sort({ _id: -1 }).lean();
			const classes = await Class.find({ year: year._id }).lean();
			classes.forEach(classItem => {
				violationsByClass[classItem.name] = [];
			})
			// Lặp qua danh sách vi phạm và gộp chúng theo lớp
			findViolations.forEach((violation) => {
				if (violation.studentClass) {
					const className = violation.studentClass.class.name;
					violationsByClass[className].push(violation);
				}
			});
			const returnClasses = [];
			Object.keys(violationsByClass).forEach((key) => {
				let point = 100;
				violationsByClass[key].forEach(item => {
					if (item.type === 'ABSENT') {
						point -= POINT_VIOLATION.Absent;
					} else if (item.type === 'CONDUCT'
						|| item.type === 'GROOVE') {
						point -= POINT_VIOLATION.Conduct;
					}
				});
				returnClasses.push({
					name: key,
					point: point,
					violations: violationsByClass[key],
					rank: null,
				})
			});
			returnClasses.sort((a, b) => {
				return b.point - a.point;
			});
			let currentRank = 1; // Bắt đầu với hạng 1
			let numClass = 0;
			for (let i = 0; i < returnClasses.length; i++) {
				numClass++;
				if (i > 0 && returnClasses[i].point !== returnClasses[i - 1].point) {
					// Nếu điểm khác với điểm trước đó, tăng hạng lên
					currentRank++;
					returnClasses[i].rank = numClass;
				} else {
					returnClasses[i].rank = currentRank; // Gán hạng cho lớp
				}
			}
			res.status(200).json(returnClasses);
		} catch (err) {
			res.status(500).json({ err: err });
		}
	}
	newYearPage = (req, res) => {
		res.render('newYear', { layout: 'manager_layout', title: 'Năm học mới', activeCaidat: 'active' });
	}
	startNewYear = async (req, res) => {
		try {
			const currentDate = new Date();
			const year = currentDate.getFullYear();
			const newYear = await new Year({ startYear: year, endYear: year + 1 }).save();
			res.status(200).json(newYear);
		} catch (err) {
			res.status(500).json({ err: err });
		}
	}
	levelUpPage = (req, res) => {
		res.render('levelUp', { layout: 'manager_layout', title: 'Xét lên lớp', activeCaidat: 'active' });
	}
	levelUp = async (req, res) => {
		try {
			const year = await Year.findOne().sort({ _id: -1 });
			const students = await Student.find()
				.populate('currentClass')
				.populate({
					path: 'termResults',
					match: { year: year._id },
					populate: {
						path: 'scoreTables'
					}
				}).lean();
			// const absentMap = {};
			// for(const student of students) {
			// 	const studentClass = await StudentClass.findOne({ 
			// 		student: student._id, class: student.currentClass._id 
			// 	}).lean();
			// 	const numAbsent = await Violation.countDocuments({
			// 		type: TYPE_VIOLATION.Absent, studentClass: studentClass._id
			// 	});
			// 	absentMap[student._id] = numAbsent;
			// }
			// console.log(absentMap);
			// Lấy danh sách studentClass của tất cả học sinh
			const studentIds = students.map(student => student._id);
			const studentClasses = await StudentClass.find({
				student: { $in: studentIds },
				class: { $in: students.map(student => student.currentClass._id) }
			}).lean();

			// Tạo một đối tượng map để lưu trữ số ngày nghỉ của từng học sinh
			const absentMap = {};

			// Tạo một truy vấn để lấy tất cả số ngày nghỉ của các học sinh trong danh sách studentClasses
			const numAbsentList = await Violation.aggregate([
				{
					$match: {
						type: TYPE_VIOLATION.Absent,
						studentClass: { $in: studentClasses.map(studentClass => studentClass._id) }
					}
				},
				{
					$group: {
						_id: "$studentClass",
						numAbsent: { $sum: 1 }
					}
				}
			]);

			// Lưu trữ kết quả vào absentMap, mặc định là 0 cho tất cả học sinh
			students.forEach(student => {
				absentMap[student._id] = 0;
			});
			numAbsentList.forEach(item => {
				const studentClass = studentClasses.find(studentClass => studentClass._id.equals(item._id));
				if (studentClass) {
					const studentId = studentClass.student._id;
					absentMap[studentId] = item.numAbsent;
				}
			});

			//console.log(absentMap);
			const studentsMap = {};
			students.forEach(student => {
				if (!studentsMap[student.currentClass.name]) {
					studentsMap[student.currentClass.name] = [];
				}
				let pointAvg = 0;
				let conduct1;
				let conduct2;
				let academicPerformance1;
				let academicPerformance2;
				let count65 = 0;
				let count8 = 0;
				let count5 = 0;
				let count35 = 0;
				let countL35 = 0;
				let countCD = 0;
				let numSubjectWithPoint;
				student.termResults.forEach(term => {
					numSubjectWithPoint = 0
					let sumPoint = 0;
					let pointWithChar;
					let pointWithChar1;
					let pointWithChar2;
					term.scoreTables.forEach(scoreTable => {
						console.log(scoreTable);
						if (scoreTable.scoreFrequent !== 'Đ' && scoreTable.scoreFrequent !== 'CĐ'
							&& scoreTable.scoreMidTerm !== 'Đ' && scoreTable.scoreMidTerm !== 'CĐ'
							&& scoreTable.scoreFinalTerm !== 'Đ' && scoreTable.scoreFinalTerm !== 'CĐ') {
							numSubjectWithPoint++;
							const avgSubject = (parseFloat(scoreTable.scoreFrequent) + 2 * parseFloat(scoreTable.scoreMidTerm) + 3 * parseFloat(scoreTable.scoreFinalTerm)) / 6;
							if (avgSubject >= 8) {
								count8++;
							} else if (avgSubject >= 6.5) {
								count65++;
							} else if (avgSubject >= 5) {
								count5++;
							} else if (avgSubject >= 3.5) {
								count35++;
							} else {
								countL35++;
							}
							sumPoint += avgSubject;
							// Nếu là điểm chữ
						} else {
							if (scoreTable.scoreFrequent !== 'Đ'
								&& scoreTable.scoreMidTerm !== 'Đ'
								&& scoreTable.scoreFinalTerm !== 'Đ') {
								pointWithChar = 'Đ';
							} else {
								pointWithChar = 'CĐ';
							}
						}
					})
					// Nếu là học kì 2 thì * 2 
					if (!term.is1stSemester) {
						sumPoint *= 2;
						conduct2 = term.conduct;
						academicPerformance2 = term.academicPerformance;
						pointWithChar2 = pointWithChar;
						if (pointWithChar2 === 'CĐ') {
							countCD++;
						}
					} else {
						conduct1 = term.conduct;
						academicPerformance1 = term.academicPerformance;
						pointWithChar1 = pointWithChar;
					}
					pointAvg += sumPoint;
				})
				// Điểm sau khi tính trung bình
				pointAvg /= 3;
				let conduct;
				let academicPerformance;
				const acaMap = {
					'Tốt': 1,
					'Khá': 2,
					'Đạt': 3,
					'Chưa đạt': 4
				}
				// HK2 tốt, HK1 khá trở lên 
				if (acaMap[academicPerformance2] === 1 && acaMap[academicPerformance1] <= 2) {
					conduct = 'Tốt';
					// HK2 Khá, HK1 Đạt trở lên; HK2 Đạt, HK1 Tốt; HK2 Tốt, HK1 Đạt hoặc Chưa đạt.
				} else if (acaMap[academicPerformance2] === 2 && acaMap[academicPerformance1] <= 3 ||
					acaMap[academicPerformance2] === 3 && acaMap[academicPerformance1] === 1 ||
					acaMap[academicPerformance2] === 1 && acaMap[academicPerformance1] >= 3) {
					conduct = 'Khá';
					// HK2 Đạt, HK1 Khá, Đạt hoặc Chưa đạt; HK2 Khá, HK1 Chưa đạt.
				} else if (acaMap[academicPerformance2] === 3 && acaMap[academicPerformance1] >= 2 ||
					acaMap[academicPerformance2] === 2 && acaMap[academicPerformance1] === 4) {
					conduct = 'Đạt';
				} else {
					conduct = 'Chưa đạt';
				}

				// Kq học tập
				if (countCD === 0 && count5 === 0 && count35 === 0 && count8 >= 6) {
					academicPerformance = 'Tốt';
				} else if (countCD === 0 && count35 === 0 && count65 >= 6) {
					academicPerformance = 'Khá';
				} else if (countCD === 1 && count5 >= 6 && countL35 === 0) {
					academicPerformance = 'Đạt';
				} else {
					academicPerformance = 'Chưa đạt';
				}
				let result;
				if (absentMap[student._id] <= 45 && conduct === 'Đạt' && academicPerformance === 'Đạt') {
					result = 'Lên lớp';
				} else {
					result = 'Lưu ban';
				}
				const returnStudent = {
					...student,
					pointAvg: pointAvg.toFixed(2),
					conduct: conduct,
					numAbsent: absentMap[student._id],
					academicPerformance: academicPerformance,
					result: result,
				}
				studentsMap[student.currentClass.name].push(returnStudent);
			})
			console.log(studentsMap);
			res.status(200).json(studentsMap);
		} catch (err) {
			console.log(err);
			res.status(500).json({ err: err });
		}
	}
	studyResult = async (req, res) => {
		const subjects = await Subject.find().lean();
		const years = await Year.find().sort().lean();
		res.render('studyResult', {
			layout: 'manager_layout', title: 'Xem điểm',
			years,
			subjects, activeHoctap: 'active'
		});
	}
	getResult = async (req, res) => {
		try {
			const { classId, term } = req.params;
			console.log(term);
			const students = await Student.find({ currentClass: classId })
				.populate('currentClass')
				.populate({
					path: 'scoreTables',
					populate: {
						path: 'assignment',
						populate: {
							path: 'subject'
						}
					}
				})
				.lean();
			console.log(students);
			res.status(200).json(students);
		} catch (err) {
			console.log(err);
			res.status(500).json({ err: err });
		}
	}
	saveSchedule = async (req, res) => {
		try {
			const { nameTimeTable, schedules } = req.body;
			let newTimeTable = await new TimeTable({ name: nameTimeTable, schedules: [] }).save();
			//const scheduleIds = [];
			const scheduleDocs = schedules.map(schedule => {
				return new Schedule({
					dayOfWeek: schedule.dayOfWeek,
					period: schedule.period,
					assignment: schedule.assignmentId,
					timeTable: newTimeTable._id
				});
			});
			const schedulesInserted = await Schedule.insertMany(scheduleDocs);
			const scheduleIds = schedulesInserted.map(schedule => schedule._id);


			newTimeTable.schedules = scheduleIds;
			await newTimeTable.save();
			res.status(200).json(newTimeTable);
		} catch (error) {
			res.status(500).json({ err: error });
		}
	}
	getTimeTable = async (req, res) => {
		try {
			const id = req.params.id;
			// Lấy các schedules sáng (period <= 5) và lấy thông tin về lớp và assignment
			const morningSchedules = await Schedule.find({
				timeTable: id,
				period: { $lte: 5 }
			}).populate({
				path: 'assignment',
				populate: [{ path: 'class' }, { path: 'subject' }, { path: 'teacher' }],
			}).lean();

			// Lấy các schedules chiều (period > 5) và lấy thông tin về lớp và assignment
			const afternoonSchedules = await Schedule.find({
				timeTable: id,
				period: { $gt: 5 }
			}).populate({
				path: 'assignment',
				populate: [{ path: 'class' }, { path: 'subject' }, { path: 'teacher' }],
			}).lean();

			// Sử dụng Set để loại bỏ lớp trùng lặp cho buổi sáng
			const morningClassNamesSet = new Set(morningSchedules.map(schedule => schedule.assignment.class.name));

			// Sử dụng Set để loại bỏ lớp trùng lặp cho buổi chiều
			const afternoonClassNamesSet = new Set(afternoonSchedules.map(schedule => schedule.assignment.class.name));

			// Chuyển Set thành mảng
			const morningClassNames = [...morningClassNamesSet];
			morningClassNames.sort((a, b) => {
				const regex = /(\d+)([A-Za-z]+)(\d+)/;
				const [, numA, charA, numA2] = a.match(regex);
				const [, numB, charB, numB2] = b.match(regex);

				if (charA.localeCompare(charB) !== 0) {
					return charA.localeCompare(charB);
				}

				if (parseInt(numA) !== parseInt(numB)) {
					return parseInt(numA) - parseInt(numB);
				}

				return parseInt(numA2) - parseInt(numB2);
			});
			const afternoonClassNames = [...afternoonClassNamesSet];
			afternoonClassNames.sort((a, b) => {
				const regex = /(\d+)([A-Za-z]+)(\d+)/;
				const [, numA, charA, numA2] = a.match(regex);
				const [, numB, charB, numB2] = b.match(regex);

				if (charA.localeCompare(charB) !== 0) {
					return charA.localeCompare(charB);
				}

				if (parseInt(numA) !== parseInt(numB)) {
					return parseInt(numA) - parseInt(numB);
				}

				return parseInt(numA2) - parseInt(numB2);
			});
			res.status(200).json({ morningClassNames, afternoonClassNames, morningSchedules, afternoonSchedules });
		} catch (error) {
			console.error(error);
			res.status(500).json({ err: error });
		}
	}
	addTimeTableByExcel = async (req, res) => {
		try {
			const excelFile = req.files.file;
			const classMap = {};
			const scheduleMap = {};
			const scheduleAfMap = {};
			const teachersMap = {};
			const teachersAfMap = {};
			await workbook.xlsx.load(excelFile.data);
			let nameTimeTable;
			const TKBMorningSheet = workbook.getWorksheet('Sáng');
			let preCell = null;
			let newObj = {};
			TKBMorningSheet.eachRow((row, rowNumber) => {
				// Lấy tên thời khóa biểu
				if (rowNumber === 1) {
					nameTimeTable = row.getCell(1).toString();
					// Lấy danh sách class mapping
				} else if (rowNumber === 2) {
					row.eachCell((cell, cellNumber) => {
						if (cellNumber > 2) {
							classMap[cellNumber] = cell.value.toString();
						}
					})
				} else {
					const day = row.getCell(1).value.toString().split(' ').pop();
					const period = row.getCell(2).value.toString();
					const isDiff = period !== preCell;
					preCell = row.getCell(2).value.toString();
					row.eachCell((cell, cellNumber) => {
						if (cellNumber > 2) {
							if (!scheduleMap[`Schedule${day}_${period}`]) {
								scheduleMap[`Schedule${day}_${period}`] = []
							}
							if (!teachersMap[`Teacher${day}_${period}`]) {
								teachersMap[`Teacher${day}_${period}`] = []
							}
							if (isDiff) {
								//console.log('diff', period);
								newObj = {
									subject: cell.value.toString(),
									class: classMap[cellNumber],
									dayOfWeek: day,
									period: period,
								};
								scheduleMap[`Schedule${day}_${period}`].push(newObj);
							} else {
								teachersMap[`Teacher${day}_${period}`].push(cell.value.toString());
							}
						}
					})
				}
			})
			const combinedScheduleMorning = {};

			for (const scheduleKey in scheduleMap) {
				const scheduleItems = scheduleMap[scheduleKey];
				const teacherKey = scheduleKey.replace('Schedule', 'Teacher');
				const teacherItems = teachersMap[teacherKey];
				if (teacherItems) {
					for (let i = 0; i < scheduleItems.length; i++) {
						if (i < teacherItems.length) {
							scheduleItems[i].teacher = teacherItems[i];
						}
					}
				}

				combinedScheduleMorning[scheduleKey] = scheduleItems;
			}
			delete combinedScheduleMorning['Schedule2_1']
			delete combinedScheduleMorning['Schedule7_5']
			let scheduleArray = [];
			for (const key in combinedScheduleMorning) {
				if (Array.isArray(combinedScheduleMorning[key])) {
					scheduleArray = [...scheduleArray, ...combinedScheduleMorning[key]];
				}
			}


			const TKBAfternoonSheet = workbook.getWorksheet('Chiều');
			let preCellAf = null;
			let newObjAf = {};
			TKBAfternoonSheet.eachRow((row, rowNumber) => {
				if (rowNumber === 2) {
					row.eachCell((cell, cellNumber) => {
						if (cellNumber > 2) {
							classMap[cellNumber] = cell.value.toString();
						}
					})
				} else {
					const day = row.getCell(1).value.toString().split(' ').pop();
					const period = row.getCell(2).value.toString();
					const isDiff = period !== preCellAf;
					preCellAf = row.getCell(2).value.toString();
					row.eachCell((cell, cellNumber) => {
						if (cellNumber > 2) {
							if (!scheduleAfMap[`Schedule${day}_${parseInt(period) + 5}`]) {
								scheduleAfMap[`Schedule${day}_${parseInt(period) + 5}`] = []
							}
							if (!teachersAfMap[`Teacher${day}_${parseInt(period) + 5}`]) {
								teachersAfMap[`Teacher${day}_${parseInt(period) + 5}`] = []
							}
							if (isDiff) {
								newObjAf = {
									subject: cell.value.toString(),
									class: classMap[cellNumber],
									dayOfWeek: day,
									period: parseInt(period) + 5,
								};
								scheduleAfMap[`Schedule${day}_${parseInt(period) + 5}`].push(newObjAf);
							} else {
								teachersAfMap[`Teacher${day}_${parseInt(period) + 5}`].push(cell.value.toString());
							}
						}
					})
				}
			})
			const combinedScheduleAfternoon = {};

			for (const scheduleKey in scheduleAfMap) {
				const scheduleItems = scheduleAfMap[scheduleKey];
				const teacherKey = scheduleKey.replace('Schedule', 'Teacher');
				const teacherItems = teachersAfMap[teacherKey];
				if (teacherItems) {
					for (let i = 0; i < scheduleItems.length; i++) {
						if (i < teacherItems.length) {
							scheduleItems[i].teacher = teacherItems[i];
						}
					}
				}

				combinedScheduleAfternoon[scheduleKey] = scheduleItems;
			}
			delete combinedScheduleAfternoon["Schedule2_10"];
			delete combinedScheduleAfternoon["Schedule7_10"];
			for (const key in combinedScheduleAfternoon) {
				if (Array.isArray(combinedScheduleAfternoon[key])) {
					scheduleArray = [...scheduleArray, ...combinedScheduleAfternoon[key]];
				}
			}
			const newTimeTable = await new TimeTable({ name: nameTimeTable, schedules: [] }).save();

			const schedules = [];
			const cache = {};
			await Promise.all(scheduleArray.map(async item => {
				const cacheKey = `${item.teacher}-${item.class}-${item.subject}`;
				const teacherId = await Teacher.findOne({ name: item.teacher });
				const classId = await Class.findOne({ name: item.class });
				const subjectId = await Subject.findOne({ name: item.subject });
				if(!teacherId) {
					console.log(item.teacher);
				}
				if(!classId) {
					console.log(item.class);
				}
				if(!subjectId) {
					console.log(item.subject);
				}
				const findAssignment = await Assignment.findOne({
					teacher: teacherId._id,
					class: classId._id,
					subject: subjectId._id,
				});
				if(!findAssignment) {
					console.log('null with teacher ' + teacherId.name + ' and class ' + classId.name + ' and subject ' + subjectId.name)
				}
				// Lưu kết quả vào bộ đệm
				cache[cacheKey] = findAssignment._id;
				
			}));
			scheduleArray.forEach(item => {
				schedules.push(new Schedule({
					dayOfWeek: item.dayOfWeek,
					period: item.period,
					assignment: cache[`${item.teacher}-${item.class}-${item.subject}`],
					timeTable: newTimeTable._id
				}))
			})
			const savedSchedule = await Schedule.insertMany(schedules);
			const scheduleIds = savedSchedule.map(schedule => schedule._id);
			newTimeTable.schedules = scheduleIds;
			await newTimeTable.save();
			res.status(200).json(newTimeTable);
		} catch (error) {
			console.log(error);
			res.status(500).json({ err: error });
		}
	}
	printResult = async (req, res) => {
		try {
			const subjects = await Subject.find().lean();
		} catch (error) {
			console.log(error);
			res.status(500).json({ err: error });
		}
	}
	newSemester = async (req, res) => {
		try {
			const students = await Student.find().populate('currentClass');
			const newTermResults = students.map(student => {
				return new TermResult({
					comment: '',
					academicPerformance: '',
					conduct: '',
					is1stSemester: false,
					scoreTables: [],
					year: student.currentClass.year,
					student: student._id
				})
			})
			const savedTerm = await TermResult.insertMany(newTermResults);
			const savedMap = {};
			savedTerm.forEach(item => {
				savedMap[item.student] = item._id;
			});
			// Tạo một danh sách cập nhật sử dụng updateMany
			const bulkUpdateOperations = students.map(student => ({
				updateOne: {
					filter: { _id: student._id },
					update: { $push: { termResults: savedMap[student._id] } },
				},
			}));

			// Sử dụng updateMany để cập nhật nhiều học sinh cùng một lúc
			await Student.bulkWrite(bulkUpdateOperations);
			res.status(200).json(savedTerm);
		} catch (error) {
			console.log(error);
			res.status(500).json({ err: error });
		}
	}
}


module.exports = new AdminController;