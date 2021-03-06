"use strict";
var eventproxy = require('eventproxy');
var getContent=require('./lib/getcontent');
var bangoDB=require('./lib/bangodb');
var timer=require('./lib/timer');
var config=require('config');
var log4js=require('log4js');
var url=require("url");
var bangodb=new bangoDB();
var urlCount=0;	//开始页面计数
//解析传递过来的最大页面参数
var params=process.argv.splice(2);
//结束页面
var urlCountMax=params[0] || 2;
//详情页面间隔*秒
var intervalDetail=params[2] || 60;
//主页面间隔*秒
var intervalPage=params[1] || 3600;
//是否抓取有码网站 mo
if (params[3]=='mo') {
	//页面基础地址
	var baseurl=config.get("baseurl_mo");
	//定义写入数据表名
	var detail_table="detail_mo";
	//定义日志
	var logger=log4js.getLogger('spider-mo');
}else{
	//页面基础地址
	var baseurl=config.get("baseurl");
	//定义写入数据表名
	var detail_table="detail";
	//定义日志
	var logger=log4js.getLogger('spider');
}
bangodb.connect();
bangodb.getLastPage(baseurl,function(last){
	logger.info("上次抓取到页面："+last);
	logger.info("抓取最大页面："+urlCountMax);
	logger.info("主页面间隔："+intervalPage+"秒");
	logger.info("详情页面间隔："+intervalDetail+"秒");
	logger.info("保存数据表："+detail_table);
	urlCount=Number(last);
	bangodb.disConnect();
	beginSpider();
})
function beginSpider(){
	if (urlCount>=urlCountMax) urlCount=0;
	var page=urlCount+1;
	var targetUrl=url.resolve(baseurl,String(page));
	urlCount++;
	getContent(targetUrl,function($){
	//成功会传递回来一个cheerio对象，可以像jquery一样操作dom
	timer.set(targetUrl+'抓取时间');
	var movies=[];
	$(".item").each(function(){
		var movie={
			url:$(this).find('.movie-box').attr('href'),
			title:$(this).find('img').attr('title'),
			code:$(this).find('date').eq(0).text(),
			date:$(this).find('date').eq(1).text()
		};
		movies.push(movie);
	})
	//注册代理事件，等movie全部抓取完毕才触发
	var ep=new eventproxy();
	ep.all('spider.end',function(mvs){
		// console.log(mvs)
		logger.info(targetUrl+'抓取数量：%d',mvs.length);
		logger.info(targetUrl+'抓取时间：%s',timer.get(targetUrl+'抓取时间',true));
		timer.set(targetUrl+'写入时间');
		//写入数据库
		bangodb.connect();
		bangodb.add(mvs,detail_table,function(res){
			//一次数据抓取流程全部完毕后执行本回调
			res=res[res.length-1];
			logger.info(targetUrl+"成功：%s",res.success);
			logger.info(targetUrl+"失败：%s",res.fail);
			logger.info(targetUrl+"重复：%s",res.repeat);
			logger.info(targetUrl+'写入时间：%s',timer.get(targetUrl+'写入时间',true));
			//写入刷新日志
			bangodb.writeLog(targetUrl,res.success);
			bangodb.disConnect();
			setTimeout(beginSpider,intervalPage*1000);
		});
	});
	var mvs=[];
	var mvCount=0;
	function next(){
		//抓取详情页面
		getContent(movies[mvCount].url,function($){
			var mv=movies[mvCount];
			mv.img=$('.bigImage').attr('href');
			//时间单位为分，需要替换掉多余字符
			mv.time=$('.info p').eq(2).text().replace('収録時間:','').replace('分','').trim();
			mv.maker=$('.info p').eq(4).find('a').text();
			mv.tags=[];
			//遍历出分类标签
			$('.info .genre').find('a').each(function(){
				mv.tags.push($(this).text());
			});
			//如果是抓取有码mo网站则遍历出预览图片
			if(params[3]=='mo'){
				mv.pre=[];
				$("#sample-waterfall").find(".sample-box").each(function(){
				mv.pre.push($(this).attr("href"));
			});
			}
			// console.log(mv);
			mvs.push(mv);
			mvCount++;
			if (mvCount==movies.length) {
				//最后一个链接遍历完成
				ep.emit('spider.end',mvs);
			}else{
				setTimeout(next,intervalDetail*1000);
			}
		},function(url){
			//抓取详情页面失败
			mvCount++;
			if (mvCount==movies.length) {
				//最后一个链接遍历完成
				ep.emit('spider.end',mvs);
			}else{
				setTimeout(next,intervalDetail*1000);
			}
		});
	}
	setTimeout(next,intervalDetail*1000);
},function(url){
	//抓取主页面失败
	setTimeout(beginSpider,intervalPage*1000);
});
}