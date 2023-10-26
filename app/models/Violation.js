var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var violationSchema = new Schema({
	type: String,
	date: String,
	studentClass: {
		type: Schema.Types.ObjectId,
		ref: 'StudentClass'
	}
})

module.exports = mongoose.model('Violation', violationSchema);