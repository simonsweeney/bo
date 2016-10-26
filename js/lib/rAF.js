// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
	
var funcs = {};

var funcCount = 0;

var frame = false;

var then;

function tick(){
	
	frame = requestAnimationFrame(tick);
	
	var now = Date.now();
	var dT = now - then;
	
	for(var name in funcs){
		if( funcs[name](now, dT) === false ){
			stop(name);
		};
	}
	
	then = now;
	
}

function start(name, fn){
	
	if(!fn){
		fn = name;
		name = Math.random().toString();
	}
	
	if(funcs[name]) return false;
	
	funcs[name] = fn;
	
	funcCount++;
	
	if(!frame){
		then = Date.now();
		frame = requestAnimationFrame(tick);
	}
	
}

function stop(name){
	
	if(name && funcs[name]){
		delete funcs[name];
		funcCount--;
	} else if(!name) {
		funcs = {};
		funcCount = 0;
	}
	
	if( funcCount === 0 ){
		cancelAnimationFrame(frame);
		frame = false;
	}

	
}

module.exports =  {
	start: start,
	stop: stop
}