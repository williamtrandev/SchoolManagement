var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var scheduleSchema = new Schema({
	date: String,
	period: Number,
	assignment: { 
		type: Schema.Types.ObjectId,
		ref: 'Assignment'
	},
})

module.exports = mongoose.model('Schedule', scheduleSchema);
