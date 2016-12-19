const http         = require('http'),
      fs           = require('fs'),
      path         = require('path'),
	  url_instance = require('url'),
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

  console.log('Request URL'+url)
  // IMPORTANT: Your application HAS to respond to GET /health with status 200
  //            for OpenShift health monitoring

  if (url == '/health') {
    res.writeHead(200);
    res.end();
  } else if(url.match(/member_progress/)) {
	  //Logic can be tweaked to pass the title and name from front end instead of querying against the DB
	var queryObj = url_instance.parse(url,true).query;
	console.log(queryObj);
	if(queryObj.name){
		var params = {
		   "name": queryObj.name
		}
		mysql_manager.select_param_query("SELECT * FROM members a, members_progress b WHERE a.id=b.member_id AND ?", params, 
								function(rows) {
										
										fs.readFile('./static/memberprogress_status.html', function (err, data) {
											  if (err) {
												res.writeHead(404);
												res.end('Not found');
											  } else {
												res.setHeader('Content-Type', 'text/html');
												res.setHeader('Cache-Control', 'no-cache, no-store');
												var data = new String(data);
												 console.log('the dataa-->'+data);
												var member_record = rows[0];
												data = data.replace("$name$", member_record.name);
												if(member_record.comm_track == "") {
													data = data.replace("$cc_class$", "active");
													data = data.replace("$acb_class$", "");
													data = data.replace("$acs_class$", "");
													data = data.replace("$acg_class$", "");									
												} 
												else if(member_record.comm_track == "CC") {
													data = data.replace("$cc_class$", "previous visited");
													data = data.replace("$acb_class$", "active");
													data = data.replace("$acs_class$", "");
													data = data.replace("$acg_class$", "");									
												} 
												else if(member_record.comm_track == "ACB") {
													data = data.replace("$cc_class$", "visited first");
													data = data.replace("$acb_class$", "previous visited");
													data = data.replace("$acs_class$", "active");
													data = data.replace("$acg_class$", "");
												} 
												else if(member_record.comm_track == "ACS") {
													data = data.replace("$cc_class$", "visited first");
													data = data.replace("$acb_class$", "previous visited");
													data = data.replace("$acs_class$", "previous visited");
													data = data.replace("$acg_class$", "active");
												} 
												else if(member_record.comm_track == "ACG") {
													data = data.replace("$cc_class$", "visited first");
													data = data.replace("$acb_class$", "previous visited");
													data = data.replace("$acs_class$", "previous visited");
													data = data.replace("$acg_class$", "previous visited");
												} 
												
												var project_table_body = "";
												for(var i=0;i<rows.length;i++) {
													project_table_body += "<tr>";
													project_table_body += "<td>"+(i+1)+"</td>";
													project_table_body += "<td>"+rows[i]["project_title"]+"</td>";
													project_table_body += "<td>TBD</td>";
													project_table_body += "<td>"+rows[i]["project_date"]+"</td>";
													project_table_body += "</tr>";
												}
												data = data.replace("$project_table_body$", project_table_body);
												res.write(data.toString());
												res.end();
											  }
										});
								});  
								
	}
  } 
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
	  var project_date = "";
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
						 else if(project_date == "" && data[i].match(/Chapter(\s*)Meeting/g)!=null) {
							  project_date = data[i+2];
							  var tokens = project_date.split(",");
							  var year = new String(tokens[2]).split("(");
							  var date_str = tokens[1]+","+year[0];
							  var date_obj = new Date(date_str);
							  project_date = date_obj.getFullYear()+"-"+(date_obj.getMonth()+1)+"-"+date_obj.getDate();
							  console.log("project date--->"+project_date);
							  break;
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
							"'"+project_date+"'"
						];
						
						mysql_manager.invoke_sp("manage_speakers_details", params,
							function(rows) {
								count++;
								if(count == preparedSpeakers.length) {
									res.writeHead(200, {'content-type': 'text/plain'});
									res.end("Hey!!!Successfully Uploaded the file");
								}
						});   
					}
			 });
     
    });
  }
  else if(url == '/list_members') {
		mysql_manager.select_query('SELECT * FROM members', 
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
