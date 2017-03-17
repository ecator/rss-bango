var superagent = require('superagent')
var cheerio = require('cheerio')
function getContent(url,success,fail){
 	superagent.get(url)
 	.end(function (err, res) {
 		if (err) {
 			console.log("抓取%s失败",url)
 			fail(url)
 		}else{
 			console.log('抓取%s成功',url)
 			success(cheerio.load(res.text))
 		}
 	})
 }
module.exports=getContent