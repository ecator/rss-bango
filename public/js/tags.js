//标签页加载完毕执行
$(document).ready(function(){
	justifyTags();
	//tag被点击事件
	$('.tag').click(function(){
		if($(this).hasClass('btn-success')){
			$(this).removeClass('btn-success');
		}else{
			$(this).addClass('btn-success');
		}
	});

	//按照储存在hash中的标签来标记上次选择的标签
	$('.tag').each(function(){
		var tags=location.hash.replace('#','').split(' ');
		// console.log(tags);
		for(var i=0;i<tags.length;i++){
			if(tags[i]==$(this).text()){
				$(this).addClass('btn-success');
			}
		}
	});
	//查找按钮被单击
	$('#search').click(function(){
		//遍历tags找出被选中的标签
		var tags=[];
		$('.tag').each(function(){
			if($(this).hasClass('btn-success')){
				tags.push($(this).text());
			}
		});
		if(tags.length){
			tags=tags.join(' ');
		}else{
			alert('please check tags you want to search for');
			return;
		}
		// 跳转到首页搜索符合标签的项目
		location.hash=tags;
		location='/?t='+encodeURI(tags);
	});

	//重置按钮单击
	$('#reset').click(function(){
		$('.tag').each(function(){
			$(this).removeClass('btn-success');
		});
	});
	//窗口大小改变
	$(window).resize(function(){
	});
});
//两端对齐标签
function justifyTags(){
	var outWidth=$('.tags').innerWidth();
	var tags=$('.tag');
	for(var i=0;i<tags.length;){
		if($(tags[i]).position().left==0){
			var s=$(tags[i]).outerWidth(true);
			//找出下一个最左边的元素,默认本行最以后一个是最后一个元素
			var rear=tags.length-1;
			for(var m=i+1;m<tags.length;m++){
				if($(tags[m]).position().left==0){
					rear=m-1;
					break;
				}else{
					s+=$(tags[m]).outerWidth(true);
				}
			}
			if(rear-i){
				var offset=parseInt((outWidth-s)/(rear-i));
				for(var m=i+1;m<rear+1;m++){
					if(m==rear){
						//保证最后一个元素对齐
						$(tags[m]).css({left:outWidth-$(tags[m]).position().left-$(tags[m]).outerWidth(true)});
					}{
						$(tags[m]).css({left:offset*(m-i)});
					}
				}
			}else{
				//本行只有一个元素
				var offset=parseInt((outWidth-s)/2);
				$(tags[i]).css({left:offset-parseInt(s)/2});
			}
			i=rear+1;
			continue;
		}
		i++;
	}
}