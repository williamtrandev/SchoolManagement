var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var scheduleSchema = new Schema({
	name: String,
	assignments: [{ type: Schema.Types.ObjectId, ref: 'Assignment' }],
})

module.exports = mongoose.model('Schedule', scheduleSchema);
