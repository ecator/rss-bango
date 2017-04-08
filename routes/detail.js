var express=require("express");
var router=express.Router();
var bangoDB=require("../lib/bangodb");
var config=require("config");
var bangodb=new bangoDB();

router.get("/:code",function(request,response,next){
    bangodb.connect();
    bangodb.searchByCode(request.params.code,"detail",function(res){
        if (res.length) {
            response.locals.searchBase=config.get("searchBase");
            response.locals.home=config.get("home");
            response.render('detail',{title:"bango - "+res[0].title,item:res[0]});
            bangodb.disConnect();
        }else{
            next('没有找到番号：'+request.params.code);
        }
    });
});
router.get("/",function(req,res,next){
    next("没有输入查询番号");
});
module.exports=router;