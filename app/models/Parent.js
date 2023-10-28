var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var parentSchema = new Schema({
	name: String,
	job: String,
	phone: String,
	email: String,
});

module.exports = mongoose.model('Parent', parentSchema);
