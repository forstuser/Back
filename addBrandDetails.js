const MySQL = require('mysql');
const config = require("./config/main");
const options = config.DATABASE;
const models = require('./models');
const connection = MySQL.createConnection({
	host: options.host,
	user: options.username,
	password: options.password,
	database: options.database,
	port: options.port
});

if (process.argv.length !== 4) {
	console.log('Usage node addBrandDetails.js <token> <file_in_the_same_directory>');
	process.exit(1);
}

console.log("TOKEN: ", process.argv[2]);
console.log("FILE: ", process.argv[3]);

const TokenNo = process.argv[2];
const brandList = require(process.argv[3]);

function getDateTime() {
	const date = new Date();

	let hour = date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;

	let min = date.getMinutes();
	min = (min < 10 ? "0" : "") + min;

	let sec = date.getSeconds();
	sec = (sec < 10 ? "0" : "") + sec;

	const year = date.getFullYear();

	let month = date.getMonth() + 1;
	month = (month < 10 ? "0" : "") + month;

	let day = date.getDate();
	day = (day < 10 ? "0" : "") + day;

	return year + "-" + month + "-" + day + "-" + hour + ":" + min + ":" + sec;

}

connection.query('SELECT user_id FROM table_token WHERE token_id = "' + TokenNo + '"', (error, token, fields) => {
	if (error) {
		throw error;
	}
	if (token.length > 0) {
		const userID = token[0]['user_id'];
		const nowDate = getDateTime();

		console.log("TOTAL ENTRIES: ", brandList.length);

		const brandDetailPromise = brandList.map((elem) => {
			return models.brandDetails.create({
				brand_id: elem.brand_id,
				contactdetails_type_id: elem.contactdetails_type_id,
				display_name: elem.display_name,
				details: elem.details,
				category_id: elem.category_id,
				status_id: 1
			});
		});

		return Promise.all(brandDetailPromise).then((result) => {
			console.log(result);
			process.exit(0);
		}).catch((err) => {
			console.error(err);
			process.exit(1);
		});
	} else {
		console.error("ERROR!!!");
		process.exit(1);
	}
});