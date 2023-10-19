var mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
var Schema = mongoose.Schema;

var subjectSchema = new Schema({
	name: String,
	slug: { type: String, slug: 'name', unique: true },
	teacher: { 
		type: Schema.Types.ObjectId,
		ref: 'Teacher',
	},
})

module.exports = mongoose.model('Subject', subjectSchema);
