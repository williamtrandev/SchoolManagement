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
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Excel = require('exceljs');
const { ROLES, TYPE_VIOLATION, POINT_VIOLATION } = require('../constants');
const { sendMailToUser } = require('../utils/mail');

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
			const teacher = await Teacher.findOne({ email: email });
			if (!teacher) return res.status(400).json({ msg: "Teacher does not exist. " });

			const isMatch = await bcrypt.compare(password, teacher.password);
			if (!isMatch) return res.status(400).json({ msg: "Invalid credentials. " });

			const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET);
			delete teacher.password;
			res.cookie('jwt', token, { maxAge: 60 * 60 * 24, httpOnly: true });
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
					student.parents.push(savedDad._id);
					student.parents.push(savedMom._id);
					student.studentClasses.push(savedStudentClass._id);
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
		res.render('data', { layout: 'manager_layout' });
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
		const schedules = await Schedule.find()
			.populate({
				path: 'assignments',
				match: { year: year._id }, // Sử dụng match để tìm theo year của assignment
			})
			.lean();
		console.log(schedules);
		res.render('timeTable', {
			layout: 'manager_layout', title: 'Thời khóa biểu',
			classes, schedules, activePhancong: 'active'
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
				.populate({
					path: 'termResults',
					match: { year: year._id }
				}).lean();
			console.log(students);
		} catch (err) {
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
}


module.exports = new AdminController;