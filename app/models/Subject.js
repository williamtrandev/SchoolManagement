var mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');
var Schema = mongoose.Schema;

var subjectSchema = new Schema({
	name: String,
	teacher: { 
		type: Schema.Types.ObjectId,
		ref: 'Teacher',
	},
	slug: { type: String, slug: 'name', unique: true },
})

mongoose.plugin(slug);

module.exports = mongoose.model('Subject', subjectSchema);
