var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var exerciseSchema = new Schema({
	title: String,
	description: String,
	assignment: {
		type: Schema.Types.ObjectId,
		ref: 'Assignment'
	},
	deadline: Date,
}, {
	timestamps: true,
});

module.exports = mongoose.model('Exercise', exerciseSchema);
