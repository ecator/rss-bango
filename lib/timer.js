//计时器，通过设置标签返回运行的毫秒数
"use strict";
var flags=[];
//设置标签
function set(flag) {
	var begin=new Date;
	flags[flag]=begin.getTime();
	return flags[flag];
}
//返回标签运行毫秒数
function get(flag,decoration){
	if(flags[flag]){
		var end=new Date;
		var runtime=end.getTime()-flags[flag];
		//显示易读时间
		if (decoration){
			var seconds=runtime/1000;
			if(seconds<1){
				//返回毫秒
				runtime=runtime+'ms';
			}else if(seconds>=1 && seconds<60){
				//返回秒
				runtime=seconds.toFixed(2)+'s';
			}else if(seconds>=60 && seconds <3600){
				//返回分
				seconds=parseInt(seconds);
				var minutes=seconds/60;
				runtime=minutes.toFixed(2)+'mins';
			}else{
				//seconds大于3600的情况，返回小时
				seconds=parseInt(seconds);
				var hours=seconds/3600;
				runtime=hours.toFixed(2)+'h'
			}
		}
		return runtime;
	}else{
		return 0;
	}
}
module.exports.set=set;
module.exports.get=get;