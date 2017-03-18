'use strict';
var express=require('express');
var bangoDB=require('./lib/bangodb');
var feed=require('./lib/feed');
var ipdb=require('./lib/ipdb/ip');
var moment=require('moment');
var config=require("config");
var fs=require('fs');
var bangodb=new bangoDB();
var app=express();
app.use(express.static('public'));
app.set("views","./views");
app.set("view engine","jade");
//加载IP数据库
ipdb.load("./lib/ipdb/17monipdb.dat")
//定义路由
//默认处理中间件,用于判断来源IP地址
app.use(function(request,response,next){
    var ipres=ipdb.findSync(getClientIp(request));
    console.log(moment().format('YYYY-MM-DD HH:mm:ss')+"\t"+request.url+"\t"+getClientIp(request)+"\t"+ipres.join(","));
    //开发环境绕过检测
    if (process.env.NODE_ENV=="development") {
        next();
    }else if (ipres.length) {
            if (ipres[0]=="中国") {
                //国内IP禁止访问
                response.status(403);
                next("来源为国内IP");
            }else{
                //国外IP允许访问
                next();
            }
        }else{
            //没有结果也禁止
            response.status(403);
            next("没有找到结果");
        }
});
//首页索引路由
app.get("/",function(request,response){
    bangodb.connect();
    bangodb.get(3000,function(res){
        response.locals.torrentkittyBase=config.get("torrentkittyBase");
        response.render('index',{title:"bango × "+res.length,items:res});
        bangodb.disConnect();
    });
});
//番号详情页面
app.get("/bango/:code",function(request,response){
    bangodb.connect();
    bangodb.searchByCode(request.params.code,function(res){
        if (res.length) {
            response.locals.torrentkittyBase=config.get("torrentkittyBase");
            response.render('bango',{title:res[0].title,item:res[0]});
            bangodb.disConnect();
        }else{
            response.status(404).end();
        }
    });
});
//rss订阅路由
app.get("/feed",function(request,response){
	bangodb.connect();
	bangodb.get(1000,function(res){
		var xml=feed('rss-bango','subscribe xx',res);
		response.append('Content-Type','application/xml;charset=utf-8');
		response.send(xml);
		bangodb.disConnect();
	});
});
//定义错误处理
app.use(function(err, req, res, next) {
  console.error(err);
  res.status(404).send(fs.readFileSync('./public/404.html').toString());
});
var server=app.listen(config.get("port"),"127.0.0.1",function(){
	var host=server.address().address;
	var port=server.address().port;
	console.log('成功在 %s:%s 启动web服务器\n当前环境：%s',host,port,process.env.NODE_ENV);
});
function getClientIp (req) {
    var ipAddress;
    var forwardIpStr = req.headers['x-forwarded-for'];
    if (forwardIpStr) {
        var forwardIp = forwardIpStr.split(',');
        ipAddress = forwardIp[0];
    }
    if (!ipAddress) {
        ipAddress = req.connection.remoteAdress;
    }
    if (!ipAddress) {
        ipAddress = req.socket.remoteAdress;
    }
    if (!ipAddress) {
        if (req.connection.socket) {
            ipAddress = req.connection.socket.remoteAdress;
        }
        else if (req.headers['remote_addr']) {
            ipAddress = req.headers['remote_addr'];
        }
        else if (req.headers['client_ip']) {
            ipAddress = req.headers['client_ip'];
        }
        else {
            ipAddress = req.ip;
        }

    }
    return ipAddress;
}