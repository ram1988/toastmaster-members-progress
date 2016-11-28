var mysql = require('mysql');

var box = mysql.createConnection({
	host     : env.OPENSHIFT_MYSQL_DB_HOST,
	user     : 'adminhVTwJRq',
	password : 'S-8Sys5i3f8G',
	database : 'tmclubmanager'
});

console.log('DB connection successful'+box);