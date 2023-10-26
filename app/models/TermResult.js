var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var termResultSchema = new Schema({
	comment: String,
	academicPerformance: String,
	conduct: String,
	is1stSemester: Boolean,
	scoreTables: [{ type: Schema.Types.ObjectId, ref: 'ScoreTable' }]
})

module.exports = mongoose.model('TermResult', termResultSchema);
