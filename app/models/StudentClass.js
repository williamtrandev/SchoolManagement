var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var studentClassSchema = new Schema({
	student: {
		type: mongoose.Types.ObjectId,
		ref: 'Student'
	},
	class: {
		type: mongoose.Types.ObjectId,
		ref: 'Class'
	},
	violations: [{ type: Schema.Types.ObjectId, ref: 'Violation' }]
})

module.exports = mongoose.model('StudentClass', studentClassSchema);
