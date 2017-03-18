var express=require('express')
var bangoDB=require('./lib/bangodb')
var feed=require('./lib/feed')
var moment=require('moment')
var bangodb=new bangoDB()
var app=express()
app.use(express.static('public'))
app.set("views","./views")
app.set("view engine","jade")
//首页索引路由
app.get("/",function(request,response){
	console.log('访问根目录 from %s',getClientIp(request))
    bangodb.connect()
    bangodb.get(3000,function(res){
        response.render('index',{title:"NoCodes × "+res.length,items:res})
        bangodb.disConnect()
    })
})
//番号详情页面
app.get("/bango/:code",function(request,response){
    console.log("请求 %s 详情页面",request.params.code)
    bangodb.connect()
    bangodb.searchByCode(request.params.code,function(res){
        if (res.length) {
            response.render('bango',{title:res[0].title,item:res[0]})
            bangodb.disConnect()
        }else{
            response.status(404).end()
        }
    })
})
//rss订阅路由
app.get("/feed",function(request,response){
	bangodb.connect()
	bangodb.get(1000,function(res){
		console.log('feed from %s',getClientIp(request))
		var link=request.protocol+"://bango.nocode.site"
		var xml=feed('rss-bango',link+'/feed','subscribe xx',res)
		response.append('Content-Type','application/xml;charset=utf-8')
		response.send(xml)
		bangodb.disConnect()
	})
})
var server=app.listen(1111,function(){
	var host=server.address().address
	var port=server.address().port
	console.log('成功在端口%s启动web服务器',port)
})
function getClientIp (req) {
    var ipAddress
    var forwardIpStr = req.headers['x-forwarded-for']
    if (forwardIpStr) {
        var forwardIp = forwardIpStr.split(',')
        ipAddress = forwardIp[0]
    }
    if (!ipAddress) {
        ipAddress = req.connection.remoteAdress
    }
    if (!ipAddress) {
        ipAddress = req.socket.remoteAdress
    }
    if (!ipAddress) {
        if (req.connection.socket) {
            ipAddress = req.connection.socket.remoteAdress
        }
        else if (req.headers['remote_addr']) {
            ipAddress = req.headers['remote_addr']
        }
        else if (req.headers['client_ip']) {
            ipAddress = req.headers['client_ip']
        }
        else {
            ipAddress = req.ip
        }

    }
    return ipAddress
}