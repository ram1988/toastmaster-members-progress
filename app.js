const http         = require('http'),
      fs           = require('fs'),
      path         = require('path'),
	  csv          = require("fast-csv"),
      contentTypes = require('./utils/content-types'),
      sysInfo      = require('./utils/sys-info'),
      mysql_manager = require('./utils/mysql_manager'),
	  program_list = require('./utils/program_list'),	 
	  multiparty = require('multiparty'),
	  util = require('util'),
      env          = process.env;


let server = http.createServer(function (req, res) {
  let url = req.url;
  if (url == '/') {
    url += 'index.html';
  }

  // IMPORTANT: Your application HAS to respond to GET /health with status 200
  //            for OpenShift health monitoring

  if (url == '/health') {
    res.writeHead(200);
    res.end();
  } else if(url == '/members') {
	mysql_manager.select_query("SELECT * FROM members", 
							function(rows) {
								res.end(req.method);
							});  
	  
  } 
  else if(url == '/program_list') {
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Cache-Control', 'no-cache, no-store');
		res.end(JSON.stringify(program_list.get_program_list()));	  
  } else if(url == '/members/insert') {
		var params = {
			"id":3,
			"club_name":"IBM",
			"comm_track":"CC",
			"leader_track":"CL",
			"first_name":"ram",
			"last_name":"nar",
			"email":"ss@dd.com"
		};
		mysql_manager.insert_query('INSERT INTO members SET ?', params, 
								function(result) {
									res.end(result);
								});  	  
  } 
  else if(url == '/meeting_agenda/update') {
		var params = [{
			"id":3,
			"time":"IBM",
			"program_name":"CC",
			"appointment_holder":""
		}];
		mysql_manager.insert_query('INSERT INTO meeting_agenda SET ?', params, 
								function(result) {
									res.end(result);
								});  
	  
  } 
  else if (req.url === '/uploadfile1') {
    res.writeHead(200, {'content-type': 'text/html'});
    res.end(
      '<form action="/fileupload_status" enctype="multipart/form-data" method="post">'+
      '<input type="text" name="title"><br>'+
      '<input type="file" name="upload" multiple="multiple"><br>'+
      '<input type="submit" value="Upload">'+
      '</form>'
    );
  }
  /*else if(url == '/program_sheet/upload') {
		var preparedSpeakers = {};
		var prepSpeechColumn = -1;
		var prepEvalColumn = -1;
	  
	  
	    csv.fromPath("TMChapterMeetingAgenda20-Oct-2016.csv")
			 .on("data", function(data){
				 if(prepSpeechColumn != -1) {
					 var speech_title = data[prepSpeechColumn];
					 if(speech_title == "Timer's Report") {
						 prepSpeechColumn = -1;
						 return;
					 }
					 var speaker_name = data[prepSpeechColumn+2];
					 preparedSpeakers[speech_title] = speaker_name;
				 } else {
					 for(var i=0;i<data.length;i++) {
						 if(data[i] == "PREPARED SPEECHES:") {
							  prepSpeechColumn = i;
							  console.log("true");
						 }
					 }
				 }
			 })
			 .on("end", function(){
				 console.log(preparedSpeakers);
				 console.log("done");
			 });
  }*/
  else if (req.url === '/fileupload_status') {
    var form = new multiparty.Form();
	var destPath;
	form.on('field', function(name, value) {
      if (name === 'path') {
        console.info('path-->'+value);
      }
    });
    form.parse(req, function(err, fields, files) {
      if (err) {
        res.writeHead(400, {'content-type': 'text/plain'});
        res.end("invalid request: " + err.message);
        return;
      }
	  var file_name = files.upload[0].path;
	  console.log('file_name-->'+file_name);
	  var preparedSpeakers = [];
	  var prepSpeechColumn = -1;
	  var prepEvalColumn = -1;
	  csv.fromPath(file_name)
			 .on("data", function(data){
				 if(prepSpeechColumn != -1) {
					 var speech_title = data[prepSpeechColumn];
					 if(speech_title == "Timer's Report") {
						 prepSpeechColumn = -1;
						 return;
					 }
					 var speech_project = {};
					 var speaker_name = data[prepSpeechColumn+2];
					 speech_project[speaker_name] = speech_title;
					 preparedSpeakers.push(speech_project);
				 } else {
					 for(var i=0;i<data.length;i++) {
						 if(data[i] == "PREPARED SPEECHES:") {
							  prepSpeechColumn = i;
							  console.log("true");
						 }
					 }
				 }
			 })
			 .on("end", function(){
				  var count = 0;
				  //res.write('received fields:\n\n '+util.inspect(fields));
				  for(var i=0;i<preparedSpeakers.length;i++) {
					  var speaker_details = preparedSpeakers[i];
					  var speaker_details_key = Object.keys(speaker_details)[0];
					  console.log("content-->"+speaker_details_key);
					  var speaker_details_tokens = speaker_details_key.split(",");
					  var speaker_name = speaker_details_tokens[0].trim();
					  var params = [							
							"'"+speaker_name+"'",
							speaker_details_tokens[1]?"'"+speaker_details_tokens[1].trim()+"'":"''", //comm_track
							speaker_details_tokens[2]?"'"+speaker_details_tokens[2].trim()+"'":"''", //leader_track
							"'"+speaker_details[speaker_details_key].trim()+"'",//project name
							"''"//project date - TBI
						];
						
						mysql_manager.invoke_sp("manage_speakers_details", params,
							function(rows) {
								count++;
								if(count == preparedSpeakers.length) {
									res.writeHead(200, {'content-type': 'text/plain'});
									res.end("Successfully Uploaded the file");
								}
							});   
					}
				  //res.end(JSON.stringify(preparedSpeakers));
				  //res.end('received files:\n\n '+util.inspect(files));
			 });
     
    });
  }
  else if(url == '/meeting_agenda/select') {
		mysql_manager.select_query('SELECT * FROM meeting_agenda WHERE id= :id', params, 
								function(result) {
									//process result and send the response
									res.setHeader('Content-Type', 'application/json');
									res.setHeader('Cache-Control', 'no-cache, no-store');
									res.end(JSON.stringify(result));
								});  
	  
  }
  else if (url == '/info/gen' || url == '/info/poll') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.end(JSON.stringify(sysInfo[url.slice(6)]()));
  } else {
    fs.readFile('./static' + url, function (err, data) {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
      } else {
        let ext = path.extname(url).slice(1);
        res.setHeader('Content-Type', contentTypes[ext]);
        if (ext === 'html') {
          res.setHeader('Cache-Control', 'no-cache, no-store');
        }
		
        res.end(data);
      }
    });
  }
});

server.listen(env.NODE_PORT || 3000, env.NODE_IP || 'localhost', function () {
  console.log(`Application worker ${process.pid} started...`);
});
