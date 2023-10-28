const adminRouter = require('./admin');
const studentRouter = require('./student');
function route(app) {
	app.use('/admin', adminRouter);
	app.use('/student', studentRouter);
}


module.exports = route;