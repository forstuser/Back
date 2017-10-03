/* jshint esversion: 6 */
'use strict';

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
	console.log('Usage ./ascDataMigrate <token> <file_in_the_same_directory>');
	process.exit(1);
}

console.log("TOKEN: ", process.argv[2]);
console.log("FILE: ", process.argv[3]);

const TokenNo = process.argv[2];
const ascList = require(process.argv[3]);

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
		const userID = token[0].user_id;
		const nowDate = getDateTime();

		console.log("TOTAL ENTRIES: ", ascList.length);

		const ascPromises = [] ;
		ascList.forEach((elem) => {
			if (elem.brand_id) {
				ascPromises.push(models.authorizedServiceCenter.create({
					center_name: elem.center_name,
					brand_id: elem.brand_id,
					address: elem.address,
					address_city: elem.address_city,
					address_state: elem.address_state,
					address_pin_code: elem.address_pin_code,
					latitude: elem.latitude,
					longitude: elem.longitude,
					timings: elem.timings ? elem.timings : null,
					open_days: elem.open_days ? elem.open_days : null,
					created_on: Date.now(),
					updated_on: Date.now(),
					updated_by_user_id: userID,
					status_id: 1
				}));
			}
		});

		return Promise.all(ascPromises).then((result) => {
			const ascDetailsPromise = [];
			ascList.forEach((elem, index) => {
				if (elem.brand_id) {
					if (elem.phone1 !== '' && elem.phone1 !== null && elem.phone1 !== undefined) {
						ascDetailsPromise.push(models.authorizeServiceCenterDetail.create({
							center_id: result[index].center_id,
							contactdetail_type_id: 3,
							display_name: "Contact",
							details: elem.phone1,
							status_id: 1,
							category_id: elem.category_id
						}));
					}

					if (elem.phone2 !== '' && elem.phone2 !== undefined && elem.phone2 !== null) {
						ascDetailsPromise.push(models.authorizeServiceCenterDetail.create({
							center_id: result[index].center_id,
							contactdetail_type_id: 3,
							display_name: "Contact",
							details: elem.phone2,
							status_id: 1,
							category_id: elem.category_id
						}));
					}

					if (elem.phone3 !== '' && elem.phone3 !== undefined && elem.phone3 !== null) {
						ascDetailsPromise.push(models.authorizeServiceCenterDetail.create({
							center_id: result[index].center_id,
							contactdetail_type_id: 3,
							display_name: "Contact",
							details: elem.phone3,
							status_id: 1,
							category_id: elem.category_id
						}));
					}

					if (elem.email1 !== '' && elem.email1 !== null && elem.email1 !== undefined) {
						ascDetailsPromise.push(models.authorizeServiceCenterDetail.create({
							center_id: result[index].center_id,
							contactdetail_type_id: 2,
							display_name: "Email",
							details: elem.email1,
							status_id: 1,
							category_id: elem.category_id
						}));
					}

					if (elem.email2 !== '' && elem.email2 !== null && elem.email2 !== undefined) {
						ascDetailsPromise.push(models.authorizeServiceCenterDetail.create({
							center_id: result[index].center_id,
							contactdetail_type_id: 2,
							display_name: "Email",
							details: elem.email2,
							status_id: 1,
							category_id: elem.category_id
						}));
					}

					if (elem.email3 !== '' && elem.email3 !== null && elem.email3 !== undefined) {
						ascDetailsPromise.push(models.authorizeServiceCenterDetail.create({
							center_id: result[index].center_id,
							contactdetail_type_id: 2,
							display_name: "Email",
							details: elem.email3,
							status_id: 1,
							category_id: elem.category_id
						}));
					}

					if (!elem.phone1 && !elem.phone2 && !elem.phone3) {
						ascDetailsPromise.push(models.authorizeServiceCenterDetail.create({
							center_id: result[index].center_id,
							contactdetail_type_id: 3,
							display_name: "Contact",
							details: '',
							status_id: 1,
							category_id: elem.category_id
						}));
					}

					if (!elem.email1 && !elem.email2 && !elem.email3) {
						ascDetailsPromise.push(models.authorizeServiceCenterDetail.create({
							center_id: result[index].center_id,
							contactdetail_type_id: 2,
							display_name: "Email",
							details: '',
							status_id: 1,
							category_id: elem.category_id
						}));
					}
				}
			});

			return Promise.all(ascDetailsPromise).catch((err) => {
				console.error(err);
				process.exit(1);
			});
		}).then((result) => {
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