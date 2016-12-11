var env  = process.env;
var mysql = require('mysql');

var getConnection = function() {
	var connection = mysql.createConnection({
		host     : env.OPENSHIFT_MYSQL_DB_HOST,
		user     : 'adminhVTwJRq',
		password : 'S-8Sys5i3f8G',
		database : 'tmclubmanager'
	});
	
	return connection;
}

var select_query = function(query, callback) {
	var connection = getConnection();
	connection.query(query,function(err,rows){
		 if(!err) {
			 callback(rows);
		 }         
		 connection.end();
    });
}

var select_param_query = function(query, values, callback) {
	var connection = getConnection();
	connection.query(query, values, function(err,rows){
		 if(!err) {
			 callback(rows);
		 }         
		 connection.end();
    });
}

var insert_query = function(query, values, callback) {
	var connection = getConnection();
	connection.query(query,values,function(err,result){
		 if (err) {
			return connection.rollback(function() {
			  callback(-1);
			});
		  }  
		  connection.commit(function(err) {
			if (err) {
			  return connection.rollback(function() {
				callback(-1);
			  });
			}
			callback(0);
			connection.end();
		  });
	});
}

var update_query = function(query, values, callback) {
	var connection = getConnection();
	connection.query(query,values,function(err,result){
		 if (err) {
			return connection.rollback(function() {
			  callback(-1);
			});
		  }  
		  connection.commit(function(err) {
			if (err) {
			  return connection.rollback(function() {
				callback(-1);
			  });
			}
			callback(0);
			connection.end();
		  });
	});
}

var invoke_sp = function(sp_name, arglist, callback) {
	var query = "CALL "+sp_name+"(";
	for(var i=0;i<arglist.length;i++) {
		if(i == arglist.length-1) {
			query += arglist[i];
		} else {
			query += (arglist[i]+",");
		}
	}
	query += ")";
	console.log("Executing query-->"+query);
	var connection = getConnection();
	connection.query(query,function(err,rows){
		 console.log("sp error-->"+err);
		 if(!err) {
			 callback(rows);
		 }         
		 connection.end();
    });
}
module.exports = {select_query, select_param_query, insert_query, update_query, invoke_sp}