const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const morgan = require("morgan");
const path = require("path");
const exphbs = require("express-handlebars");
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const flash = require('connect-flash');
const route = require('./routes');
const setupDB = require('./app/utils/db');

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
app.use(flash());
app.use(cors());
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

setupDB();
// routes
route(app);

const PORT = process.env.PORT || 6001;
app.listen(PORT, () => console.log(`Server Port: ${PORT}`));