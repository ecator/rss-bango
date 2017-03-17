var express=require('express')
var bangoDB=require('./lib/bangodb')
var feed=require('./lib/feed')
var moment=require('moment')
var app=express()
app.use(express.static('public'))
app.get("/",function(request,response){
	console.log('访问根目录 from %s',getClientIp(request))
	response.send('hello world')
})
app.get("/feed",function(request,response){
	var bangodb=new bangoDB()
	bangodb.connect()
	bangodb.get(1000,function(res){
		console.log('feed from %s',getClientIp(request))
		var link=request.protocol+"://"+request.hostname+":"+server.address().port
		var xml=feed('rss-bango',link+'/feed','subscribe xx',res)
		response.append('Content-Type','application/xml;charset=utf-8')
		response.send(xml)
		bangodb.disConnect()
	})
})
var server=app.listen(21111,function(){
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