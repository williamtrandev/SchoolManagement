const mongoose = require('mongoose');
require('dotenv').config();
const setupDB = async () => {
	try {
		mongoose
			.connect(process.env.MONGO_URI, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
			})
			.then(() => {
				console.log('Connected to DB');
			})
			.catch((error) => console.log(`${error} did not connect`));
	} catch (err) {
		return null;
	}
}
module.exports = setupDB;