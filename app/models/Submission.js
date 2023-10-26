var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var submissionSchema = new Schema({
	imagePath: [String],
	score: Number,
	exercise: {
		type: Schema.Types.ObjectId,
		ref: 'Exercise'
	}
});

module.exports = mongoose.model('Submission', submissionSchema);
