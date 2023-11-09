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
	dateFormat: function (dateStr) {
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
		return `${day} - ${month} - ${year}`;
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

	lengthArray: function(arr) {
		return arr.length;
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
	avgScore: function (scoreTable) {
		if (scoreTable) {
			const avg = ((parseFloat(scoreTable.scoreFrequent) + 2 * parseFloat(scoreTable.scoreMidTerm) + 3 * parseFloat(scoreTable.scoreFinalTerm))/6).toFixed(1)
			if (isNaN(avg)) {
				return scoreTable.scoreFinalTerm;
			} else {
				return avg;
			}
		} else {
			return '';
		}
	},
	avgScoreAll: function (scoreTables) {
		if (scoreTables.length > 1) {
			const avg1 = ((parseFloat(scoreTables[0].scoreFrequent) + 2 * parseFloat(scoreTables[0].scoreMidTerm) + 3 * parseFloat(scoreTables[0].scoreFinalTerm))/6).toFixed(1);
			const avg2 = ((parseFloat(scoreTables[1].scoreFrequent) + 2 * parseFloat(scoreTables[1].scoreMidTerm) + 3 * parseFloat(scoreTables[1].scoreFinalTerm))/6).toFixed(1);
			if (isNaN(avg1) || isNaN(avg2)) {
				return scoreTables[1].scoreFinalTerm;
			} else {
				return (avg1 + avg2 * 2)/3;
			}
		} else {
			return '';
		}
	},
}