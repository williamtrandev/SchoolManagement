var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var timeTableSchema = new Schema({
	name: String,
	isUsed: {
		type: Boolean,
		default: false,
	},
	schedules: [{ type: Schema.Types.ObjectId, ref: 'Schedule' }],
})

module.exports = mongoose.model('TimeTable', timeTableSchema);
