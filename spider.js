var eventproxy = require('eventproxy')
var getContent=require('./lib/getcontent')
var bangoDB=require('./lib/bangodb')
var bangodb=new bangoDB()
var baseurl='https://avso.pw/ja/page/'	//页面基础地址
var urlCount=0	//开始页面计数
//解析传递过来的最大页面参数
var params=process.argv.splice(2)
var urlCountMax=params[0] || 2	//结束页面
var intervalDetail=params[2] || 60	//详情页面间隔*秒
var intervalPage=params[1] || 3600	//主页面间隔*秒
bangodb.connect()
bangodb.getLastPage(function(last){
	console.log("上次抓取到页面："+last)
	console.log("抓取最大页面："+urlCountMax)
	console.log("主页面间隔："+intervalPage+"秒")
	console.log("详情页面间隔："+intervalDetail+"秒")
	urlCount=Number(last)
	bangodb.disConnect()
	beginSpider()
})
function beginSpider(){
	if (urlCount>=urlCountMax) urlCount=0
	var page=urlCount+1
	var targetUrl=baseurl+page
	urlCount++
	getContent(targetUrl,function($){
	//成功会传递回来一个cheerio对象，可以像jquery一样操作dom
	console.time(targetUrl+'抓取时间')
	var movies=[]
	$(".item").each(function(){
		var movie={
			url:$(this).find('.movie-box').attr('href'),
			title:$(this).find('img').attr('title'),
			code:$(this).find('date').eq(0).text(),
			date:$(this).find('date').eq(1).text()
		}
		movies.push(movie)
	})
	//注册代理事件，等movie全部抓取完毕才触发
	var ep=new eventproxy()
	ep.all('spider.end',function(mvs){
		// console.log(mvs)
		console.log(targetUrl+'抓取数量：%d',mvs.length)
		console.timeEnd(targetUrl+'抓取时间')
		console.time(targetUrl+'写入时间')
		//写入数据库
		bangodb.connect()
		bangodb.add(mvs,function(res){
			//一次数据抓取流程全部完毕后执行本回调
			res=res[res.length-1]
			console.log(targetUrl+"成功：%s",res.success)
			console.log(targetUrl+"失败：%s",res.fail)
			console.log(targetUrl+"重复：%s",res.repeat)
			console.timeEnd(targetUrl+'写入时间')
			//写入刷新日志
			bangodb.writeLog(targetUrl,res.success)
			bangodb.disConnect()
			setTimeout(beginSpider,intervalPage*1000)
		})
	})
	var mvs=[]
	var mvCount=0
	function next(){
		//抓取详情页面
		getContent(movies[mvCount].url,function($){
			var mv=movies[mvCount]
			mv.img=$('.bigImage').attr('href')
			//时间单位为分，需要替换掉多余字符
			mv.time=$('.info p').eq(2).text().replace('収録時間:','').replace('分','').trim()
			mv.maker=$('.info p').eq(4).find('a').text()
			mv.series=$('.info p').eq(6).find('a').text()
			mv.tags=[]
			//遍历出分类标签
			$('.info .genre').find('a').each(function(){
				mv.tags.push($(this).text())
			})
			mvs.push(mv)
			mvCount++
			if (mvCount==movies.length) {
				//最后一个链接遍历完成
				ep.emit('spider.end',mvs)
			}else{
				setTimeout(next,intervalDetail*1000)
			}
		},function(url){
			//抓取详情页面失败
			mvCount++
			if (mvCount==movies.length) {
				//最后一个链接遍历完成
				ep.emit('spider.end',mvs)
			}else{
				setTimeout(next,intervalDetail*1000)
			}
		})
	}
	setTimeout(next,intervalDetail*1000)
},function(url){
	//抓取主页面失败
	setTimeout(beginSpider,intervalPage*1000)
})
}