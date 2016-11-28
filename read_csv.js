var csv = require("fast-csv");
 
var preparedSpeakers = {};
var prepSpeechColumn = -1;
var prepEvalColumn = -1;

csv
 .fromPath("TMChapterMeetingAgenda20-Oct-2016.csv")
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