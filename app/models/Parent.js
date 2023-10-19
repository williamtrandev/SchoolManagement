var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var parentSchema = new Schema({
	name: String,
	job: String,
	phone: String,
	email: String,
	student: {
		type: Schema.Types.ObjectId,
		ref: 'Student',
	}
});

module.exports = mongoose.model('Parent', parentSchema);
