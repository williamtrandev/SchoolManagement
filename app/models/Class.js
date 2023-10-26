var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var classSchema = new Schema({
	name: String,
	grade: Number,
	teacher: {
		type: Schema.Types.ObjectId,
		ref: 'Teacher',
	},
	year: {
		type: Schema.Types.ObjectId,
		ref: 'Year',
	},
	attendance: [
		{
			type: String, // Ngày điểm danh
		},
	],
	assignments: [{ type: Schema.Types.ObjectId, ref: 'Assignment' }],
	studentClasses: [{ type: Schema.Types.ObjectId, ref: 'StudentClass' }]
});

classSchema.index({ name: 1 });

module.exports = mongoose.model('Class', classSchema);
