'use strict';
//index文档就绪入口
$(document).ready(function(){
    //显示前30个
    var loadIndex=0;
    showMovie(loadIndex,30);
    loadIndex+=30;
    //延迟加载图片
    $('.lazyload').lazyload({
        effect : "fadeIn"
    });
    $('.lazyload').on("load",function(){
        //为加载出来的图片添加.thumb类
        if ($(this).attr('src')!="/img/loading.gif") {
            $(this).addClass('thumb');
            $(this).removeClass('lazyload');
        }
        waterfall();
    });
     //点击跳转到详情页面
    $(".movie-box").click(function(){
          window.open($(this).data('detail'));
    });
    //监听窗口改变事件
    window.onresize=function () {
        $(window).scroll();
        waterfall();
    };
    //监视窗口滑块变动
    $(window).scroll(function(){
        var scrollTop = $(this).scrollTop();
        var scrollHeight = $(document).height();
        var windowHeight = $(this).height();
        // console.log(scrollTop,scrollHeight,windowHeight);
        //滑块到低端加载瀑布流
        if(scrollTop + windowHeight == scrollHeight){
// 　　　　    alert("you are in the bottom");
            // console.log('loadIndex:%d',loadIndex);
            showMovie(loadIndex,4);
            loadIndex+=4;
        }
        //滑块不在顶端显示top按钮
        if (scrollTop) {
            $("#to-top").removeClass("hide");
            $("#to-top").css({opacity:0});
            $("#to-top").css({
                "top":(windowHeight-$("#to-top").outerHeight()-2)+"px",
                "left":($(this).width()-$("#to-top").outerWidth()-2)+"px"
            });
            $("#to-top").animate({
                opacity:0,
                opacity:50,
                opacity:100
            },1000);
        }else{
            $("#to-top").addClass("hide");
        }
    });
    //注册跳转到顶部函数
    $("#to-top").click(function(){
        $("body,html").animate({scrollTop:'0'},1000);
    });
    //注册查找按钮点击事件
    $("#search").click(function(){
        var query=$("#query").val().trim();
        if (query) {
            // alert(query);
            location="/?q="+encodeURI(query);
        }else{
            alert("please input something!");
        }
        event.preventDefault();
    });
    //注册rss按钮
    $("#rss1").click(function(){
        window.open("/feed");
    });
    $("#rss2").click(function(){
        window.open("/feed/mo");
    });
    //rss按钮鼠标悬停提示
    $('.rss').mouseover(function(){
        var rss=$(this);
        rss.html(rss.data('title'));
    });
    //rss按钮鼠标离开事件，还原显示
    $('.rss').mouseout(function(){
        var rss=$(this);
        rss.html("<i class='fa fa-rss'><i>");
    });
});
function showMovie(index,num){
    var boxs=$(".movie-box");
    var hasNew=false;
    for(var i=index;i<boxs.length && i<index+num && $(boxs[i]).hasClass('hide');i++){
        $(boxs[i]).removeClass("hide");
        $(boxs[i]).animate({
            opacity:0,
            opacity:20,
            opacity:40,
            opacity:60,
            opacity:80,
            opacity:100
        },1000);
        hasNew=true;
        // console.log("movie-box %d 出现",i);
    }
    hasNew && waterfall();
}
//瀑布流
function waterfall(){
    var boxs= $(".movie-box:not(.hide)");
    var outWidth=$(".container").width();
    // console.log("outWidth:%d",outWidth);
    if(outWidth<=768){
        var col=1;
    }else{
        var col=4;
    }
    var boxWidth=parseInt((outWidth-(col+1)*10)/col);
    // console.log("boxWidth:%d",boxWidth);
    //设置所有盒子的宽
    boxs.css({width:boxWidth});
    //设置最左边的盒子left
    var leftBoxSelector=".movie-box:not(.hide):nth-child("+col+"n-"+String(col-1)+")";
    // console.log('leftBoxSelector:%s',leftBoxSelector);
    $(leftBoxSelector).css({left:10});
    for(var i =0; i<boxs.length;i++){
        // console.log(boxWidth,boxs[i].offsetWidth);
        var offset=i % col;
        //设置左边
        if(offset){
            boxs[i].style.left=(boxs[i-1].offsetLeft+boxWidth+10)+"px";
            // $(boxs[i]).css({left:$(boxs[i-1]).position().left+boxWidth+10});
        }else{
            // $(boxs[i]).css({left:10});
        }
        //设置第二排以后顶部坐标
        if(i>col-1){
            // console.log(boxs[i-col].offsetTop+boxs[i-col].offsetHeight);
            boxs[i].style.top=(boxs[i-col].offsetTop+boxs[i-col].offsetHeight+10)+"px";
            // $(boxs[i]).css({top:$(boxs[i-col]).position().top+$(boxs[i-col]).outerHeight()+10});
        }
    }
    //隐藏结果提示框，如果有结果的话，没有结果是不会执行本函数的
    $('#result').fadeOut(2000);
    // console.log("movie-box-outerWidth:%d",$(".movie-box").outerWidth());
    // console.log("movie-box-width:%d",$(".movie-box").width());
}