const teacherRouter = require('./teacher');
function route(app) {
	app.use('/teacher', teacherRouter);

}


module.exports = route;