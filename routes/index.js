const teacherRouter = require('./teacher');
const studentRouter = require('./student');
function route(app) {
	app.use('/teacher', teacherRouter);
	app.use('/student', studentRouter);
}


module.exports = route;