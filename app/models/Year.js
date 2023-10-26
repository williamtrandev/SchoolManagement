var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var yearSchema = new Schema({
	startYear: Number,
	endYear: Number,
	classes: [{ type: Schema.Types.ObjectId, ref: 'Class' }]
})

module.exports = mongoose.model('Year', yearSchema);