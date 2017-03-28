'use strict';
var mysql=require('mysql');
var eventproxy=require('eventproxy');
var moment=require('moment');
var Config=require('config');
var log4js=require('log4js');
var logger=log4js.getLogger("bangoDB");
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
	add(data,table,callback){
		if(data instanceof Array){
			var ep=eventproxy()
			//定义回调函数参数
			var callbackParam={success:0,fail:0,repeat:0};
			ep.after('added',data.length,callback);
			(function next(i,that){
				//首先查询是否存在
				if (i>=data.length) return;
				that.connection.query("select * from "+table+" where code=?",[data[i].code],function(err,res){
						if (err) {
							//查询失败
							logger.error(err);
							callbackParam.fail++;
							ep.emit('added',callbackParam);
							next(++i,that);
						}else if (res.length) {
							//重复数据，不插入
							logger.warn('已有 %s 数据，跳过',res[0].code);
							callbackParam.repeat++;
							ep.emit('added',callbackParam);
							next(++i,that);
						}else{
							//没有数据，开始插入
							switch(table){
								case 'detail':
									var sql="insert into detail values(?,?,?,?,?,?,?,?)";
									var param=[data[i].code,data[i].title,data[i].url,data[i].img,data[i].time,data[i].maker,data[i].tags.join(','),data[i].date];
									break;
								case 'detail_mo':
									var sql="insert into detail_mo values(?,?,?,?,?,?,?,?,?)";
									var param=[data[i].code,data[i].title,data[i].url,data[i].img,data[i].pre.join(','),data[i].time,data[i].maker,data[i].tags.join(','),data[i].date];
									break;
							}
							that.connection.query(sql,param,function(err,res){
								if (err) {
									//写入失败
									logger.error(err);
									callbackParam.fail++;
								}else{
									//写入成功
									// console.log(res);
									callbackParam.success++;
								}
								ep.emit('added',callbackParam);
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
	get(limit,table,callback){
		this.connection.query("select * from "+table+" order by date desc limit "+limit,function(err,res){
			if (err) {
				logger.error(err);
			}else{
				callback(res);
			}
		})
	}
	//记录刷新日志
	writeLog(url,count,callback){
		var refresh_time=this.getTime()
		this.connection.query("insert into log set refresh_time=?,url=?,count=?",[refresh_time,url,count],function(err,res){
			if (err) {
				logger.error(err);
			}else{
				logger.info('刷新%s记录日志成功',url);
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
	getLastPage(baseurl,callback){
		this.connection.query("select * from log where url like ? order by id desc limit 1",[baseurl+'%'],function(err,res){
			if (err) {
				logger.error(err);
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
	searchByCode(code,table,callback){
		var that=this;
		this.connection.query("select * from "+table+" where code = ?",[code],function(err,res){
			if (err) {
				logger.error(err);
			}else if(table=="detail" && !res.length){
				//没有在detail表中查询到，查询detail_mo表
				that.searchByCode(code,"detail_mo",callback);
			}else{
				callback(res);
			}
		});
	}
	//按照tag字段查找
	searchByTag(table,tags,callback){
		var sql="SELECT * FROM "+table+" ";
		//拼接查询参数
		for (var i =0;i<tags.length;i++){
			if(i){
				sql+="AND CONCAT_WS(',',',',tag,',') like '%,"+tags[i]+",%' ";
			}else{
				sql+="where CONCAT_WS(',',',',tag,',') like '%," +tags[i]+",%' ";
			}
		}
		sql+="order by date desc";
		this.connection.query(sql,function(err,res){
			if (err) {
				logger.error(err);
			}else{
				callback(res);
			}
		});
	}
	//按照条件搜索所有表
	searchAll(table,query,callback){
		var sql="SELECT * FROM "+table+" ";
		//拼接条件
		for (var i = 0; i < query.length; i++) {
			if (i) {
				sql+="AND CONCAT_WS(',',code,title,date,tag,maker) LIKE '%"+query[i]+"%' ";
			}else{
				sql+="WHERE CONCAT_WS(',',code,title,date,tag,maker) LIKE '%"+query[i]+"%' ";
			}
		}
		sql+="order by date desc";
		this.connection.query(sql,function(err,res){
			if (err) {
				logger.error(err);
			}else{
				callback(res);
			}
		})
	}
	//获取所有表的tag
	getTags(callback){
		var that=this;
		this.connection.query("select tag from detail",function(err1,res1){
			if (err1) {
				logger.error(err1);
			}else{
				that.connection.query("select tag from detail_mo",function(err2,res2){
					if (err2) {
						logger.error(err2);
					}else{
						var tmp1=Array.prototype.concat.call(res1,res2);
						var tmp2=[];
						//去除空白标签
						for(var i=0 ; i<tmp1.length;i++){
							if (tmp1[i].tag) {
								tmp2.push(tmp1[i].tag);
							}
						}
						//按照字符编码排序
						var tmp3=tmp2.join(',').split(',').sort();
						var res=[];
						//去除重复
						for (var i = 0; i < tmp3.length; i++) {
							if(i && res[res.length-1]!=tmp3[i]){
								// console.log('加入标签：%s',tmp3[i]);
								res.push(tmp3[i]);
							}else if(i==0){
								// console.log('加入标签：%s',tmp3[i]);
								res.push(tmp3[i]);
							}
						}
						callback(res);
					}
				});
			}
		});
	}
}
module.exports=bangoDB;
