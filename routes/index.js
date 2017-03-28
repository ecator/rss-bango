'use strict';
var express=require('express');
var bangoDB=require('../lib/bangodb');
var moment=require("moment");
var config=require("config");
var log4js=require('log4js');
var timer=require("../lib/timer");
var router=express.Router();
var bangodb=new bangoDB();
var logger=log4js.getLogger('index');
router.get("/",function(request,response){
	response.locals.torrentkittyBase=config.get("torrentkittyBase");
	// 判断请求参数
	if (request.query.t) {
		//按标签搜索
		var tags=request.query.t.split(' ');
		bangodb.connect();
			bangodb.searchByTag("detail",tags,function(res1){
				bangodb.searchByTag("detail_mo",tags,function(res2){
					var res=sortByTime(res1,res2);
					response.render("index",{query:request.query.t,title:"bango - "+request.query.t,items:res});
					bangodb.disConnect();
				});
			});
	}else if (request.query.q) {
		//搜索
		var query=request.query.q.split(" ");
		bangodb.connect();
		bangodb.searchAll("detail",query,function(res1){
			bangodb.searchAll("detail_mo",query,function(res2){
				var res=sortByTime(res1,res2);
				response.render("index",{query:request.query.q,title:"bango - "+request.query.q,items:res});
				bangodb.disConnect();
			});
		});
	}else{
	    bangodb.connect();
    	bangodb.get(5000,'detail',function(res1){
    		bangodb.get(5000,"detail_mo",function(res2){
    			var res=sortByTime(res1,res2);
    			// console.log(res);
    			response.render('index',{query:"",title:"bango",items:res});
        		bangodb.disConnect();
    		});
    	});	
	}
});
//根据查询结果的date降序排序，前提是两个数组已经是降序
function sortByTime(arr1,arr2){
	var length=arr1.length+arr2.length;
	var re=[];
	var sortflag='sortflag'+moment().format('x');
	timer.set(sortflag);
	for(var i=0,m=0;i<arr1.length || m<arr2.length;){
		//判断是否超出下标
		if (!arr1[i]) {
			re.push(arr2[m]);
			m++;
			continue;
		}else if (!arr2[m]) {
			re.push(arr1[i]);
			i++;
			continue;
		}
		//比较两个降序数组，谁大就先加入到re数组中
		if (getTimestamp(arr1[i].date)>getTimestamp(arr2[m].date)) {
			re.push(arr1[i]);
			i++;
		}else{
			re.push(arr2[m]);
			m++;
		}
	}
	logger.info('排序'+length+'个项目完毕，耗时：%s',timer.get(sortflag,true));
	return re;

}
//时间字符串转换成时间戳
function getTimestamp(date,format){
	format=format || "YYYY-MM-DD";
	var re=moment(date,format).format("X");
	return re;
}
module.exports=router;