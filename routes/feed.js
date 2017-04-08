"use strict";
var express=require("express");
var router=express.Router();
var bangoDB=require("../lib/bangodb");
var moment=require('moment');
var url=require('url');
var config=require('config');
var bangodb=new bangoDB();
//无码
router.get("/",function(request,response){
	bangodb.connect();
	bangodb.get(1000,"detail",function(res){
		var xml=biuldxml('bango','subscribe bango',res);
		response.append('Content-Type','application/xml;charset=utf-8');
		response.send(xml);
		bangodb.disConnect();
	});
});
//有码
router.get("/mo",function(request,response){
	bangodb.connect();
	bangodb.get(1000,'detail_mo',function(res){
		var xml=biuldxml('bango-mo','subscribe bango-mo',res);
		response.append('Content-Type','application/xml;charset=utf-8');
		response.send(xml);
		bangodb.disConnect();
	});
});
function biuldxml(title,description,items){
	var searchBase=config.get("searchBase");
	var home=config.get("home");
	var head="<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
	head+="<rss xmlns:content=\"http://purl.org/rss/1.0/modules/content/\" xmlns:atom=\"http://www.w3.org/2005/Atom\" version=\"2.0\">";
	head+="<channel><atom:link href=\""+url.resolve(home,'feed')+"\" rel=\"self\" type=\"application/rss+xml\" />";
	head+="<title>"+title+"</title>";
	head+="<link>"+home+"</link>";
	head+="<description>"+description+"</description>";
	var foot="</channel></rss>";
	var body='';
	//构造item
	for(var i=0;i<items.length;i++){
		var des="<h3>"+items[i].title+"</h3><p><a target=\"_blank\" href=\""+items[i].url+"\"><img src=\""+items[i].img+"\" alt=\""+items[i].title+"\"></a></p><p>code:<a href=\""+url.resolve(searchBase,items[i].code)+"/\" target='_blank'>"+items[i].code+"</a></p><p>time:"+items[i].time+"mins</p><p>maker:"+items[i].maker+"</p><p>tags:"+items[i].tag+"</p>";
		//判断是否有预览图片，并拼接预览图片
		if (items[i].pre) {
			var pres=items[i].pre.split(',');
			des+="<h4>preview</h4>";
			for (var s = 0; s < pres.length; s++) {
				des+="<p><img src=\""+pres[s]+"\"></p>";
			}
		}
		//Thu, 01 Jan 1970 08:00:00 +0800
		var pubDate=moment(items[i].date,"YYYY-MM-DD").format('ddd, DD MMM YYYY 00:00:00 +0800');
		body+="<item><title><![CDATA["+items[i].title+"]]></title><link>"+url.resolve(home,"detail/"+items[i].code)+"</link><description><![CDATA["+des+"]]></description><pubDate>"+pubDate+"</pubDate><guid>"+url.resolve(home,"detail/"+items[i].code)+"</guid></item>";
	}
	return head+body+foot;
}
module.exports=router;