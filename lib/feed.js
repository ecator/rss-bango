var moment=require('moment')
var url=require('url')
function biuldxml(title,link,description,items){
	var torrentkittyBase="https://www.torrentkitty.tv/search/"
	var head="<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
	head+="<rss xmlns:content=\"http://purl.org/rss/1.0/modules/content/\" xmlns:atom=\"http://www.w3.org/2005/Atom\" version=\"2.0\">"
	head+="<channel><atom:link href=\""+link+"\" rel=\"self\" type=\"application/rss+xml\" />"
	head+="<title>"+title+"</title>"
	head+="<link>"+link+"</link>"
	head+="<description>"+description+"</description>"
	var foot="</channel></rss>"
	var body=''
	for(var i=0;i<items.length;i++){
		var des="<h3>"+items[i].title+"</h3><p><img src=\""+items[i].img+"\" alt=\""+items[i].title+"\"></p><p>code:<a href=\""+torrentkittyBase+items[i].code+"/\" target='_blank'>"+items[i].code+"</a></p><p>time:"+items[i].time+"min</p><p>maker:"+items[i].maker+"</p><p>series:"+items[i].series+"</p><p>tags:"+items[i].tag+"</p>"
		//Thu, 01 Jan 1970 08:00:00 +0800
		var pubDate=moment(items[i].date,"YYYY-MM-DD").format('ddd, DD MMM YYYY 00:00:00 +0800')
		body+="<item><title>"+items[i].title+"</title><link>"+items[i].url+"</link><description><![CDATA["+des+"]]></description><pubDate>"+pubDate+"</pubDate><guid>"+url.resolve(link,"../bango/"+items[i].code)+"</guid></item>"
	}
	return head+body+foot
}
module.exports=biuldxml