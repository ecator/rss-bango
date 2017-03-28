'use strict';
var log4js=require('log4js');
var superagent = require('superagent');
var cheerio = require('cheerio');
var logger=log4js.getLogger('getcontent');
function getContent(url,success,fail){
 	superagent.get(url)
 	.end(function (err, res) {
 		if (err) {
 			logger.error("抓取%s失败",url)
 			fail(url)
 		}else{
 			logger.info('抓取%s成功',url)
 			success(cheerio.load(res.text))
 		}
 	})
 }
module.exports=getContent