'use strict';
var config=require('config');
var moment=require("moment");
var bangoDB=require('../lib/bangodb');
var bangodb=new bangoDB();
bangodb.connect();
bangodb.getTags(function(res){
	// console.log(res);
	console.log(res.length);
	bangodb.disConnect();
});
// console.log(process.env);