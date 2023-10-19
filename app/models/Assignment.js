var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var assignmentSchema = new Schema({
	teacher: { 
		type: Schema.Types.ObjectId,
		ref: 'Teacher'      
	},
	subject: {
		type: Schema.Types.ObjectId,
		ref: 'Subject'
	},
	year: {
		type: Schema.Types.ObjectId,
		ref: 'Year'
	}
})

module.exports = mongoose.model('Assignment', assignmentSchema);                