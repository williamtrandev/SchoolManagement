var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var yearSchema = new Schema({
	startYear: Number,
	endYear: Number 
})

module.exports = mongoose.model('Year', yearSchema);