var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var yearResultSchema = new Schema({
	comment: String,
	academicPerformance: String,
	conduct: String,
	is1stSemester: Boolean,
})

module.exports = mongoose.model('YearResult', yearResultSchema);
