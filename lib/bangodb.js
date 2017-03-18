'use strict';
var mysql=require('mysql');
var eventproxy=require('eventproxy');
var moment=require('moment');
var Config=require('config');
class bangoDB{
	constructor(config){
		this.config=config || Config.get('mysql');
	}
	//连接数据库
	connect(config){
		this.config=config || this.config;
		this.connection = mysql.createConnection(this.config);
		this.connection.connect();
	}
	//断开连接
	disConnect(){
		this.connection.end();
	}
	//插入数据
	add(data,callback){
		if(data instanceof Array){
			var ep=eventproxy()
			//定义回调函数参数
			var callbackParam={success:0,fail:0,repeat:0};
			ep.after('add',data.length,callback);
			(function next(i,that){
				//首先查询是否存在
				if (i>=data.length) return;
				that.connection.query("select * from detail where code=?",[data[i].code],function(err,res){
						if (err) {
							//查询失败
							console.log(err);
							callbackParam.fail++;
							ep.emit('add',callbackParam);
							next(++i,that);
						}else if (res.length) {
							//重复数据，不插入
							console.log('已有 %s 数据，跳过',res[0].code);
							callbackParam.repeat++;
							ep.emit('add',callbackParam);
							next(++i,that);
						}else{
							//没有数据，开始插入
							var sql="insert into detail values(?,?,?,?,?,?,?,?,?)"
							var param=[data[i].code,data[i].title,data[i].url,data[i].img,data[i].time,data[i].maker,data[i].series,data[i].tags.join(','),data[i].date];
							that.connection.query(sql,param,function(err,res){
								if (err) {
									//写入失败
									console.log(err);
									callbackParam.fail++;
								}else{
									//写入成功
									// console.log(res);
									callbackParam.success++;
								}
								ep.emit('add',callbackParam);
								next(++i,that);
							});
						}
				});
			})(0,this);
		}else{
			//转换成数组再递归
			this.add([data]);
		}
	}

	//获取数据
	get(limit,callback){
		this.connection.query("select * from detail order by date desc limit "+limit,function(err,res){
			if (err) {
				console.log(err)
			}else{
				callback(res)
			}
		})
	}
	//记录刷新日志
	writeLog(url,count,callback){
		var refresh_time=this.getTime()
		this.connection.query("insert into log set refresh_time=?,url=?,count=?",[refresh_time,url,count],function(err,res){
			if (err) {
				console.error(err);
			}else{
				console.log('刷新%s记录日志成功',url);
			}
			callback && callback();
		});
	}

	//获取mysql标准时间字符串 2017-03-16 23:32:42
	getTime(format){
		format=format || 'YYYY-MM-D HH:mm:ss';
		return moment().format(format);
	}

	//获取上一次抓取的页面号,将页面号码传入回调函数
	getLastPage(callback){
		this.connection.query("select * from log order by id desc limit 1",function(err,res){
			if (err) {
				console.error(err);
			}else if(res.length){
				var lastUrl=res[0].url;
				var pages=lastUrl.split('/');
				var lastPage=pages.pop();
				callback(lastPage);
			}else{
				callback(0);
			}
		});
	}

	//按照code字段查找
	searchByCode(code,callback){
		this.connection.query("select * from detail where code like ?",[code],function(err,res){
			if (err) {
				console.error(err);
			}else{
				callback(res);
			}
		});
	}
}
module.exports=bangoDB;
