'use strict';
//index文档就绪入口

$(document).ready(function(){
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
    });
     //点击跳转到详情页面
    $(".lazyload").click(function(){
          window.open($(this).data('detail'));
    });
});