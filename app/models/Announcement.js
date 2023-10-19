var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var announcementSchema = new Schema({
	title: String, 
	message: String,
	createAt: {
		type: Date,
		default: Date.now()
	},
	assignment: {
		type: Schema.Types.ObjectId,
		ref: 'Assignment'
	}
});

module.exports = mongoose.model('Announcement', announcementSchema);
