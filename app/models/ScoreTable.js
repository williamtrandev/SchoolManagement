const { Double } = require('mongodb');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var scoreSchema = new Schema({
	score15Minute: Double,
	score45Minute: Double,
	scoreMidTerm: Double,
	scoreFinalTerm: Double,
	assignment: {
		type: Schema.Types.ObjectId,
		ref: 'Assignment'
	},
	termResult: {
		type: Schema.Types.ObjectId,
		ref: 'TermResult'
	}
})

module.exports = mongoose.model('ScoreTable', scoreSchema);                