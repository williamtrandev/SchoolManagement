module.exports = {
	ifEquals: function (arg1, arg2, options) {
		return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
	},
	announcementDateFormat: function (dateStr) {
		const date = new Date(dateStr);
		const year = date.getFullYear();
		let month = date.getMonth() + 1;
		if (month < 10) {
			month = '0' + month;
		}
		let day = date.getDate();
		if (day < 10) {
			day = '0' + day;
		}
		let hour = date.getHours();
		if (hour < 10) {
			hour = '0' + hour;
		}
		let minute = date.getMinutes();
		if (minute < 10) {
			minute = '0' + minute;
		}
		return `${day}/${month}/${year} ${hour}:${minute}`;
	},
	ifEqualsYear: function (year) {
		const currentYear = new Date().getFullYear();
		return (year == currentYear);
	},
	increasement: function (num) {
		return num + 1;
	},
	charAt: function(strInput, index) {
		return strInput.charAt(index);
	},
	json: function (arr) {
		return JSON.stringify(arr);
	},
	length: function (arr) {
		return arr.length;
	},
	ifArray: function (a, arr) {
		if (a) {
			return JSON.stringify(arr);
		}
		return '';
	},
}