var mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');
var Schema = mongoose.Schema;

var subjectSchema = new Schema({
	name: String,
	slug: { type: String, slug: 'name', unique: true },
	assignments: [{ type: Schema.Types.ObjectId, ref: 'Assignment' }]
})

mongoose.plugin(slug);

module.exports = mongoose.model('Subject', subjectSchema);
