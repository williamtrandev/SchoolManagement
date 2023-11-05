const fileUpload = require('express-fileupload');
function uploadFileMiddleware() {
	return fileUpload();
}

module.exports = uploadFileMiddleware;