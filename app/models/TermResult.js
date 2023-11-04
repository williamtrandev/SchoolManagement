var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var termResultSchema = new Schema({
	comment: String,
	academicPerformance: String,
	conduct: String,
	is1stSemester: Boolean,
	scoreTables: [{ type: Schema.Types.ObjectId, ref: 'ScoreTable' }],
	student: { type: Schema.Types.ObjectId, ref: 'Student' },
	year: { type: Schema.Types.ObjectId, ref: 'Year' }
})

module.exports = mongoose.model('TermResult', termResultSchema);
