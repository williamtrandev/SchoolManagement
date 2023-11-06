const { Double } = require('mongodb');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var scoreSchema = new Schema({
	scoreFrequent: Number,
	scoreMidTerm: Number,
	scoreFinalTerm: Number,
	assignment: {
		type: Schema.Types.ObjectId,
		ref: 'Assignment'
	},
	student: {
		type: Schema.Types.ObjectId,
		ref: 'Student'
	},
	termResult: {
		type: Schema.Types.ObjectId,
		ref: 'TermResult'
	}
})

module.exports = mongoose.model('ScoreTable', scoreSchema);                