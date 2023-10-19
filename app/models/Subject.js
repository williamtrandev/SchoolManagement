var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var subjectSchema = new Schema({
	name: String,
	teacher: { 
		type: Schema.Types.ObjectId,
		ref: 'Teacher',
	},
})

module.exports = mongoose.model('Subject', subjectSchema);
