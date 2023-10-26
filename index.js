const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const morgan = require("morgan");
const path = require("path");
const exphbs = require("express-handlebars");
const cookieParser = require("cookie-parser");
const fileUpload = require('express-fileupload');
const sessions = require('express-session');
const route = require('./routes');

dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(sessions({
	secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
	saveUninitialized: true,
	resave: false
}));

app.use(cookieParser());
app.use(cors());
app.use(fileUpload());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, "public")));
app.engine('hbs', exphbs.engine({
	extname: 'hbs',
	defaultLayout: false,
	layoutsDir: __dirname + '/app/views/layouts/',
	partialsDir: __dirname + '/app/views/partials/',
	helpers: require('./helpers/handlebarsHelper'),
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'app/views/pages'));
/* FILE STORAGE */
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "public/img");
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	},
});
const upload = multer({ storage });

// routes
route(app);


const PORT = process.env.PORT || 6001;
mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
	})
	.catch((error) => console.log(`${error} did not connect`));
