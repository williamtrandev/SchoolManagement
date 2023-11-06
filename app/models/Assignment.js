var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var assignmentSchema = new Schema({
	teacher: {
		type: Schema.Types.ObjectId,
		ref: 'Teacher'
	},
	subject: {
		type: Schema.Types.ObjectId,
		ref: 'Subject'
	},
	class: {
		type: mongoose.Types.ObjectId,
		ref: 'Class'
	},
	year: {
		type: Schema.Types.ObjectId,
		ref: 'Year'
	},
	teachingTime: [Object],
	announcements: [{ type: Schema.Types.ObjectId, ref: 'Announcement' }],
	exercises: [{ type: Schema.Types.ObjectId, ref: 'Exercise' }],
	schedules: [{ type: Schema.Types.ObjectId, ref: 'Schedule' }],
	scoreTables: [{ type: Schema.Types.ObjectId, ref: 'ScoreTable' }],
})

module.exports = mongoose.model('Assignment', assignmentSchema);                