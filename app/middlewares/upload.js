const multer = require("multer");

/* FILE STORAGE */
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "public/upload");
	},
	filename: function (req, file, cb) {
		const studentId = req.session.student._id;
		const exerciseId = req.params.id;
		const filename = `${exerciseId}_${studentId}_${file.originalname}`;
		cb(null, filename);
	},
});
const upload = multer({ storage });

module.exports = upload;
