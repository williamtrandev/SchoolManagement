const { Double } = require('mongodb');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var scoreSchema = new Schema({
	assessmentScore: Double,
	score15Minute: Double,
	score45Minute: Double,
	assignment: {
		type: Schema.Types.ObjectId,
		ref: 'Assignment'
	},
	yearResult: {
		type: Schema.Types.ObjectId,
		ref: 'YearResult'
	}
})

module.exports = mongoose.model('ScoreTable', scoreSchema);                