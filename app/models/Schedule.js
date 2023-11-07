var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var scheduleSchema = new Schema({
	dayOfWeek: Number,
	period: Number,
	assignment: { 
		type: Schema.Types.ObjectId, 
		ref: 'Assignment', 
		default: null 
	},
	timeTable: {
		type: Schema.Types.ObjectId,
		ref: 'TimeTable',
		default: null
	}
})

module.exports = mongoose.model('Schedule', scheduleSchema);
