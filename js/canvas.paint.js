
var CanvasPaint = function(target,options){
    this.drawflag = false;
    this.canvasWidth = 600;
    this.canvasHeight = 300;
    this.ctx = target[0].getContext('2d');
    this.ctx_temp = null;
    this.$currentCanvas = target;
    this.bufferList = new Array();
    this.defaultOptions = {
        color: '#ff0000',
        size: 1
    }
    this.userOptions = options
    this.options = $.extend(this.defaultOptions, options);
    this.painterPointList = [];
    this.path = [];
    this.init();
}
CanvasPaint.prototype.resetBrush = function(options){
    if(options.color){
        this.ctx.strokeStyle = options.color;    
    }
}
CanvasPaint.prototype.init = function(){
    var $temp_canvas = $("<canvas>");
    $temp_canvas.attr({width: 600,height: 300}).css({position: 'absolute', top: 0, left: 0});
    this.$currentCanvas.after($temp_canvas);
    this.ctx_temp = $temp_canvas[0].getContext('2d');
    this.bufferList.push({
        data: this.ctx.getImageData(0,0,this.canvasWidth,this.canvasHeight),
        status: true
    });
    $temp_canvas.on('touchstart mousedown mouseup mousemove mouseleave mouseout touchstart touchmove touchend touchcancel',{that: this},this.onPaint)
}
CanvasPaint.prototype.onPrevClick = function(){
    var list = this.bufferList;
    var currIndex = 0;
    var beforeIndex = 0;
    var beforeData = [];
    for(var i=0;i<list.length;i++){
        if(list[i].status == true){
            currIndex = i;
            beforeIndex = i-1 >= 0 ? i-1 : 0;
            beforeData = list[beforeIndex];
            list[currIndex].status = false;
            list[beforeIndex].status = true;
            break;
        }
    }
    var renderData = beforeData.data;
    this.ctx.putImageData(renderData,0,0,0,0,this.canvasWidth,this.canvasHeight);
    return false;
}
CanvasPaint.prototype.onNextClick = function(){
    var list = this.bufferList;
    var currIndex = 0;
    var nextIndex = 0;
    var targetData = [];
    for(var i=0;i<list.length;i++){
        if(list[i].status == true){
            currIndex = i;
            nextIndex = i+1 >= list.length-1 ? list.length-1 : i+1;
            targetData = list[nextIndex];
            list[currIndex].status = false;
            list[nextIndex].status = true;
            break;
        }
    }
    var renderData = targetData.data;
    this.ctx.putImageData(renderData,0,0,0,0,this.canvasWidth,this.canvasHeight);
    return false;
}
CanvasPaint.prototype.onClearClick = function(){
    this.ctx.clearRect(0,0,this.canvasWidth,this.canvasHeight);
    this.bufferList.length = 1;
    this.bufferList[0] = {
        data: this.ctx.getImageData(0,0,this.canvasWidth,this.canvasHeight), 
        status: true
    }
    return false;
}
CanvasPaint.prototype.onPaint = function(evt){
    var painter = evt.data.that;
    switch (evt.type) {
        case 'mousedown':
        case 'touchstart':
            painter.drawflag = true;
            var currPos = painter.getCanvasPostion(evt);
            painter.ctx.beginPath();
            painter.ctx.moveTo(currPos.x,currPos.y);
            painter.painterPointList = [];
            painter.painterPointList.push({
                x: currPos.x,
                y: currPos.y      
            });
            var seg = new Segment(new Point(currPos.x, currPos.y));
            painter.path.push(seg);
            break;
        case 'mouseup':
        case 'mouseout':
        case 'mouseleave':
        case 'touchend':
        case 'touchcancel':
            if(painter.drawflag){
                painter.drawflag = false;
                
                if (painter.path.length > 0) {
                    painter.path = simplifyPath(painter.path);
                    painter.ctx_temp.clearRect(0, 0, painter.canvasWidth,painter.canvasHeight);
                    
                    painter.drawPath(painter.ctx, painter.path);
                    painter.path = [];

                    if(isValidArray(painter.bufferList)){
                        for(var k in painter.bufferList){
                            painter.bufferList[k].status = false
                        }
                    }
                    var base64Code = painter.ctx.getImageData(0,0,painter.canvasWidth,painter.canvasHeight);
                    painter.bufferList.push({
                        data: base64Code,
                        status: true
                    })
                }
            }
            break;
        case 'mousemove':
            if (painter.drawflag) {
                var lnt = painter.getCanvasPostion(evt);
                painter.path.push(new Segment(new Point(lnt.x, lnt.y)));
                painter.drawPath(painter.ctx_temp, painter.path);
            }
            break;
    }
}
CanvasPaint.prototype.drawPath = function(ctx, path) {
    var strokeStyle = this.options.color;
    var strokeWidth = this.options.size;
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.beginPath();

    drawSegments(ctx, path, null);
    ctx.stroke();
}
CanvasPaint.prototype.getCanvasPostion = function(evt) {
    var $canvas = this.$currentCanvas;
    var off = $canvas.offset();
    if (isValidArray(evt.originalEvent.changedTouches)) {
        return { x: evt.originalEvent.changedTouches[0].pageX - off.left
            , y: evt.originalEvent.changedTouches[0].pageY - off.top
        }
    } else {
        return { x: evt.originalEvent.pageX - off.left
            , y: evt.originalEvent.pageY - off.top
        }
    }
}
function isValid(value){
  return value != null && typeof value != 'undefined';
}
function isValidArray(arr){
    if (!isValid(arr) || !isValid(arr.length) || arr.length < 1)
    return false;
  return true;
}
$.fn.extend({
    CanvasPaint: function(options) {
        return new CanvasPaint(this,options)
    }
});
