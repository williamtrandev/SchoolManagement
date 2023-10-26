var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var announcementSchema = new Schema({
	title: String, 
	message: String,
	assignment: {
		type: Schema.Types.ObjectId,
		ref: 'Assignment'
	}
}, {
	timestamps: true,
});

module.exports = mongoose.model('Announcement', announcementSchema);
