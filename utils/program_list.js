var program_list = {"Registration and Networking":{"time_limit":10},
"Introductions and Ice Breaking by SAA":{"time_limit":5},
"WELCOME by Toastmaster of the Day":{"time_limit":5},
"Welcome address by the President":{"time_limit":5},
"Break":{"time_limit":10},
"Project Evaluation":{"time_limit":3},
"Timer's Report":{"time_limit":1},
"Voting for the Best Prepared Speaker":{"time_limit":3},
"Voting for the Best Evaluator":{"time_limit":2},
"Table Topics speeches":{"time_limit":15},
"Voting for the Best Table Topics Speaker":{"time_limit":2},
"Ah-counter Report":{"time_limit":3},
"Grammarian Report":{"time_limit":10},
"Award Presentation and Closing Address by Club President":{"time_limit":7},
"Announcement and group photograph":{"time_limit":5},
"Knowledge sharing by Special Guest":{"time_limit":30},
"Successful Club Series":{"time_limit":7}}

var get_program_list = function () {
	return program_list;
} 

module.exports = {get_program_list}