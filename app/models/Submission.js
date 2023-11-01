var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var submissionSchema = new Schema({
	imagePath: [Object],
	score: Number,
	student: {
		type: Schema.Types.ObjectId,
		ref: 'Student'
	},
	exercise: {
		type: Schema.Types.ObjectId,
		ref: 'Exercise'
	}
});

module.exports = mongoose.model('Submission', submissionSchema);
