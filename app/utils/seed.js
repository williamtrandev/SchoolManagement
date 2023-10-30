const { ROLES } = require('../constants');
const Teacher = require('../models/Teacher');
const bcrypt = require('bcrypt');
const setupDB = require('./db');

const args = process.argv.slice(2);
const email = args[0];
const password = args[1];

const seedDB = async () => {
	try {
		if (!email || !password) throw new Error('missing arguments');

		const admin = new Teacher({
			email,
			password,
			role: ROLES.Admin
		});

		const existingUser = await Teacher.findOne({ email: admin.email });
		console.log('existingUser', existingUser);
		if (existingUser) throw new Error('user collection is seeded!');
		const hashedPassword = await bcrypt.hash(admin.password, 10);
		admin.password = hashedPassword;

		await admin.save();

		console.log(('seed db finished'));
	} catch (error) {
		console.log('error while seeding database');
		console.log(error);
		return null;
	}
};

(async () => {
	await setupDB().then(async () => {
		await seedDB();
	});
})();