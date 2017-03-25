'use strict';
var express=require('express');
var bangoDB=require('../lib/bangodb');
var bangodb=new bangoDB();
var router=express.Router();

router.get('/',function(request,response){
	bangodb.connect();
	bangodb.getTags(function(res){
		response.render('tags',{title:"bango - tags",labels:res});
	});
})

module.exports=router;