(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var EventEmitter = require('events');
var Vector2 = require('./vendor/vector2.js');
var Box2 = require('./vendor/box2.js');

var rAF = require('./lib/rAF.js');
var { PREFIXED_TRANSFORM } = require('./lib/utils.js');

var v1 = new Vector2();
var v2 = new Vector2();

var origin = new Vector2();
var deg45 = Math.PI / 4;
var scale = new Vector2( 1, .5 );
var scaleInv = new Vector2( 1, 2 );

module.exports = class Camera extends EventEmitter {
    
    constructor ( element ) {
        
        super();
        
        this.element = element;
        this.center = new Vector2();
        this.viewport = new Box2();
        this.scale = 1;

        window.addEventListener( 'resize', this.setSize.bind(this) );
        
        this.setSize();
        
    }
    
    setSize () {
        
        var size = v1.set( window.innerWidth / this.scale, window.innerHeight / this.scale );
        this.viewport.setFromCenterAndSize( this.center, size );
        
        this.style();
        
    }
    
    setCenter ( v ) {
        
        var d = v1.copy( v ).sub( this.center );
        
        this.center.copy( v );
        
        this.viewport.translate( v );
        
        this.style();
        
    }
    
    moveCenter( x, y ) {
        
        this.setCenter( this.center.clone().add( new Vector2(x, y) ) );
        
    }
    
    setScale ( x ) {
        
        this.scale = x;
        this.setSize();
        
    }
    
    style () {
        
        var x = -this.viewport.min.x * this.scale;
        var y = -this.viewport.min.y * this.scale;
        
        this.element.style[ PREFIXED_TRANSFORM ] = `translate(${x}px, ${y}px) scale(${this.scale})`;
        
    }
    
    viewToWorld( v ) {
        
        return v.clone()
            .multiply( scaleInv )
            .rotateAround( origin, -deg45 );
        
    }
    
    worldToView ( v ) {
        
        return v.clone()
            .rotateAround( origin, deg45 )
            .multiply( scale )
        
    }
    
    screenToWorld ( v ) {
        
        return v.clone()
        
    }
    
    getWorldCenter(){
        
        return this.viewToWorld( this.center );
        
    }
    
    // follow ( thing ) {
        
    //     rAF.stop( 'cameraMove' );
        
    //     rAF.start( 'cameraMove', ( now, dT ) => {
            
    //         var destination = this.worldToView( thing.position );
    //         var next = v1.copy( this.center ).lerp( destination, .04 );
            
    //         this.setCenter( next );
            
    //     });
        
    // }
    
    render( world ) {
        
        var renderObject = object => {
            
            if( object.positionNeedsUpdate ) {
                
                if( object.isSprite ) {
                    
                    var {x, y} = this.worldToView( object.position );
                    var hw = object.size.x / 2;
                    var h = object.size.y;
                    
                    object.spriteElement.style[ PREFIXED_TRANSFORM ] = `translate(${x - hw}px, ${y - h}px)`;
                    
                } else {
                    
                    if( object.element ) {
                        
                        var {x, y} = object.position;
                        
                        object.element.style[ PREFIXED_TRANSFORM ] = `translate(${x}px, ${y}px)`;
                        
                    }
                
                }
            
            }
            
            object.children.forEach( renderObject );
            
        }
        
        world.regions.forEach( renderObject );
        
    }
    
};
},{"./lib/rAF.js":2,"./lib/utils.js":4,"./vendor/box2.js":15,"./vendor/vector2.js":16,"events":19}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
var Vector2 = require('victor');

class Rectangle {
    
    constructor ( position, size ) {
        
        if( position === undefined ) position = new Vector2();
        if( size === undefined ) size = new Vector2();
        
        this.x = position.x;
        this.y = position.y;
        this.w = size.x;
        this.h = size.y;
        this.getRB();
        
    }
    
    getRB () {
        this.r = this.x + this.w;
        this.b = this.y + this.h;
    }
    
    clone() {
        
        return new Rectangle( 
            new Vector2( this.x, this.y ),
            new Vector2( this.r - this.x, this.b - this.y )
        );
        
    }
    
    setPosition( v ) {
        this.x = v.x;
        this.y = v.y;
        this.getRB();
    }
    
    setSize( v ) {
        this.w = v.x;
        this.h = v.y;
        this.getRB();
    }
    
    center(){
        return new Vector2( this.x + this.w / 2, this.y + this.h/2 );
    }
    
    setCenter( v ) {
        
        return this.setPosition( new Vector2( v.x - this.w/2, v.y - this.h/2 ) );
        
    }
    
    containsPoint( v ) {
        
        return v.x >= this.x && v.y >= this.y && v.x < this.r && v.y < this.b;
        
    }
    
    intersectsRect( r ) {
        
        return r.x < this.r &&
           r.r > this.x &&
           r.y < this.b &&
           r.b > this.y;
        
    }
    
    containsRect( r ) {
        
        return this.x < r.x &&
            this.r > r.r &&
            this.y < r.y &&
            this.b > r.b;
        
    }
    
    scale( x ) {
        
        return this.setSizeCenter( new Vector2(
            this.w * x,
            this.h * x
        ))
        
    }
    
    setSizeCenter( v ) {
        
        this.x += (this.w - v.x) / 2;
        this.y += (this.h - v.y) / 2;
        this.w = v.x;
        this.h = v.y;
        this.getRB();
        
    }
    
}

module.exports = Rectangle;
},{"victor":24}],4:[function(require,module,exports){
var Vector2 = require('victor');
var Rectangle = require('./rectangle.js');

var prefixed = require('detectcss').prefixed;

var PREFIXED_TRANSFORM = prefixed('transform');
var PREFIXED_TRANSFORM_ORIGIN = prefixed('transformOrigin');

function getTranslate( x, y ) {
    
    if(y === undefined) {
        y = x.y;
        x = x.x;
    }

    return `translate( ${x}px, ${y}px )`;
    
}

var deg45 = Math.PI / 4;
var scale = new Vector2( 1, .5 );
var scaleInv = new Vector2( 1, 2 );

function worldToView ( v ) {
    
    return v.clone()
        .rotate( deg45 )
        .multiply( scale );
    
}

function viewToWorld ( v ) {
    
    return v.clone()
        .multiply( scaleInv )
        .rotate( -deg45 );
    
}

function worldRectViewBounds ( r ) {
    
    var top = new Vector2( r.x, r.y );
    var left = new Vector2( r.x, r.b );
    var right = new Vector2( r.r, r.y );
    var bottom = new Vector2( r.r, r.b );
    
    top = worldToView(top);
    left = worldToView(left);
    right = worldToView(right);
    bottom = worldToView(bottom);
    
    return new Rectangle(
        new Vector2( left.x, top.y ),
        new Vector2( right.x - left.x, bottom.y - top.y )
    );
    
}

module.exports = {
    PREFIXED_TRANSFORM,
    PREFIXED_TRANSFORM_ORIGIN,
    getTranslate,
    viewToWorld,
    worldToView,
    worldRectViewBounds
}
},{"./rectangle.js":3,"detectcss":20,"victor":24}],5:[function(require,module,exports){
var Camera = require('./camera.js');
var World = require('./world.js');

var data = require('./world.json');

var camera = new Camera( document.querySelector('.camera') )

var context = {
    worldElement: document.querySelector('.world'),
    spritesElement: document.querySelector('.sprites'),
    camera
}

var world = new World( data, context );

var Vector2 = require('./vendor/vector2.js');

camera.render( world );
},{"./camera.js":1,"./vendor/vector2.js":16,"./world.js":18,"./world.json":17}],6:[function(require,module,exports){
var Sprite = require('./sprite.js');

module.exports = class Character extends Sprite {
    
    getName() { return 'character' }
    
}
},{"./sprite.js":12}],7:[function(require,module,exports){
var Thing = require('./thing.js');

module.exports = class Ellipse extends Thing {
    
    getName () { return 'ellipse' }
    
    setStyle ( attrs ) {
        
        super.setStyle( attrs );
        
        this.element.style.borderRadius = '50% 50%';
        
    }
    
}
},{"./thing.js":14}],8:[function(require,module,exports){
var Rect = require('./rect.js');

module.exports = class Image extends Rect {
    
    getName () { return 'image' }
    
}
},{"./rect.js":9}],9:[function(require,module,exports){
var Thing = require('./thing.js');

module.exports = class Rect extends Thing {
    
    getName () { return 'rect' }
    
}
},{"./thing.js":14}],10:[function(require,module,exports){
var Thing = require('./thing.js');

module.exports = class Region extends Thing {
    
    getName () { return 'region' }
    
}
},{"./thing.js":14}],11:[function(require,module,exports){
var Ellipse = require('./ellipse.js');

module.exports = class Song extends Ellipse {
    
    getName () { return 'song' }
    
}
},{"./ellipse.js":7}],12:[function(require,module,exports){
var Thing = require('./thing.js');

module.exports = class Sprite extends Thing {
    
    constructor ( attrs, context ) {
        
        super( attrs, context );
        
        this.isSprite = true;
        this.spriteElement = this.createSpriteElement( attrs );
        this.setSpriteStyle( attrs );
        context.spritesElement.appendChild( this.spriteElement );
        
        this.positionNeedsUpdate = true;
        
    }
    
    createElement() {
        return false;
    }
    
    getDefaults () {
        
        return {
            shadow: true
        }
        
    }
    
    setSpriteStyle ( attrs ) {
        
        this.spriteElement.style.backgroundColor = attrs.color;
        
    }
    
    createSpriteElement ( attrs ) {
        
        var div = document.createElement('div');
        
        div.style.width = attrs.width + 'px';
        div.style.height = attrs.height + 'px';
        
        var classes = attrs.classes || [];
        div.classList.add( 'sprite', 'sprite_' + this.getName(), ...classes );
        
        return div;
        
    }
    
    setPosition(){
        
        super.setPosition(...arguments);
        
        this.positionNeedsUpdate = true;
        
    }
    
}
},{"./thing.js":14}],13:[function(require,module,exports){
var Rect = require('./rect.js');

module.exports = class Text extends Rect {
    
    getName () { return 'text' }
    
    getDefaults () {
        
        return {
            size: 'inherit',
            color: 'inherit',
            font: 'inherit',
            align: 'inherit'
        }
        
    }
    
    createElement ( attrs ) {
        
        var div = super.createElement( attrs );
        div.innerHTML = attrs.content;
        return div;
        
    }
    
    setStyle ( attrs ) {
        
        this.element.style.color = attrs.color;
        this.element.style.fontFamily = attrs.font;
        this.element.style.fontSize = attrs.size + 'px';
        this.element.style.textAlign = attrs.align;
        
    }
    
}
},{"./rect.js":9}],14:[function(require,module,exports){
var EventEmitter = require('events');
var Vector2 = require('../vendor/vector2.js');
var { extend } = require('underscore');
var { PREFIXED_TRANSFORM } = require('../lib/utils.js');

module.exports = class Thing extends EventEmitter {
    
    constructor ( attrs, context ) {
        
        super();
        
        attrs = extend( {}, this.getDefaults(), attrs );

        this.position = new Vector2( attrs.x, attrs.y );
        this.size = new Vector2( attrs.width, attrs.height );
        
        this.children = [];
        this.element = this.createElement( attrs );
        
        if( this.element ) {
            
            this.setStyle( attrs );
            this.positionNeedsUpdate = true;
            context.worldElement.appendChild( this.element );
            
        }
        
    }
    
    getDefaults() { return {} }
    
    getName () { return 'abstract' }
    
    setStyle ( attrs ) {
        
        this.element.style.backgroundColor = attrs.color;
        
    }
    
    createElement ( attrs ) {
        
        var div = document.createElement('div');
        div.style.width = attrs.width + 'px';
        div.style.height = attrs.height + 'px';
        
        var classes = attrs.classes || [];
        
        div.classList.add( 'thing', 'thing_' + this.getName(), ...classes );
        
        return div;
        
    }
    
    setPosition ( v, y ) {
        
        if( y !== undefined ) v = new Vector2(v, y);
        
        this.position.copy( v );
        
        if( this.element ) this.positionNeedsUpdate = true;
        
    }
    
    getTransform() {
        return `translate(${this.position.x}px, ${this.position.y}px)`;
    }
    
    addChildren ( children ) {
        
        this.children = this.children.concat( children );
        
    }
    
    bindToCharacter ( character ) {
        
        this.containsCharacter = false;
        this.visited = false;
        
        character.on( 'move', point => {
            
            var contains = this.containsPoint( point );
            
            if ( contains ) {
                
                if( !this.containsCharacter ) {
                    
                    this.containsCharacter = true;
                    this.emit('characterEnter', point);
                    
                }
                
                this.emit( 'characterMove', point );
                
            } else if( this.containsCharacter ) {
                
                this.containsCharacter = false;
                this.emit('characterLeave', point);
                
            }
            
        });
        
    }
    
    bindToCamera ( camera ) {
        
        this.visible = false;
        this.seen = false;
        
        camera.on( 'move', (viewport, scale) => {
            
            var visible = this.intersectsRect( viewport );
            
            if ( visible ) {
                
                if( !this.visible ) {
                    
                    this.visible = true;
                    this.emit( 'viewEnter', viewport, scale );
                    
                }
                
                this.emit( 'viewChange', viewport, scale );
                
            } else if( !visible && this.visible ) {
                
                this.visible = false;
                this.emit( 'viewLeave', viewport, scale );
                
            }
            
        });
        
    }
    
    containsPoint () { return false }
    
    intersectsRect() { return false }
    
};
},{"../lib/utils.js":4,"../vendor/vector2.js":16,"events":19,"underscore":23}],15:[function(require,module,exports){
var Vector2 = require('./vector2.js');

/**
 * @author bhouston / http://clara.io
 */

function Box2( min, max ) {

	this.min = ( min !== undefined ) ? min : new Vector2( + Infinity, + Infinity );
	this.max = ( max !== undefined ) ? max : new Vector2( - Infinity, - Infinity );

}

Box2.prototype = {

	constructor: Box2,

	set: function ( min, max ) {

		this.min.copy( min );
		this.max.copy( max );

		return this;

	},

	setFromPoints: function ( points ) {

		this.makeEmpty();

		for ( var i = 0, il = points.length; i < il; i ++ ) {

			this.expandByPoint( points[ i ] );

		}

		return this;

	},

	setFromCenterAndSize: function () {

		var v1 = new Vector2();

		return function setFromCenterAndSize( center, size ) {

			var halfSize = v1.copy( size ).multiplyScalar( 0.5 );
			this.min.copy( center ).sub( halfSize );
			this.max.copy( center ).add( halfSize );

			return this;

		};

	}(),

	clone: function () {

		return new this.constructor().copy( this );

	},

	copy: function ( box ) {

		this.min.copy( box.min );
		this.max.copy( box.max );

		return this;

	},

	makeEmpty: function () {

		this.min.x = this.min.y = + Infinity;
		this.max.x = this.max.y = - Infinity;

		return this;

	},

	isEmpty: function () {

		// this is a more robust check for empty than ( volume <= 0 ) because volume can get positive with two negative axes

		return ( this.max.x < this.min.x ) || ( this.max.y < this.min.y );

	},

	getCenter: function ( optionalTarget ) {

		var result = optionalTarget || new Vector2();
		return this.isEmpty() ? result.set( 0, 0 ) : result.addVectors( this.min, this.max ).multiplyScalar( 0.5 );

	},

	getSize: function ( optionalTarget ) {

		var result = optionalTarget || new Vector2();
		return this.isEmpty() ? result.set( 0, 0 ) : result.subVectors( this.max, this.min );

	},

	expandByPoint: function ( point ) {

		this.min.min( point );
		this.max.max( point );

		return this;

	},

	expandByVector: function ( vector ) {

		this.min.sub( vector );
		this.max.add( vector );

		return this;

	},

	expandByScalar: function ( scalar ) {

		this.min.addScalar( - scalar );
		this.max.addScalar( scalar );

		return this;

	},

	containsPoint: function ( point ) {

		if ( point.x < this.min.x || point.x > this.max.x ||
		     point.y < this.min.y || point.y > this.max.y ) {

			return false;

		}

		return true;

	},

	containsBox: function ( box ) {

		if ( ( this.min.x <= box.min.x ) && ( box.max.x <= this.max.x ) &&
		     ( this.min.y <= box.min.y ) && ( box.max.y <= this.max.y ) ) {

			return true;

		}

		return false;

	},

	getParameter: function ( point, optionalTarget ) {

		// This can potentially have a divide by zero if the box
		// has a size dimension of 0.

		var result = optionalTarget || new Vector2();

		return result.set(
			( point.x - this.min.x ) / ( this.max.x - this.min.x ),
			( point.y - this.min.y ) / ( this.max.y - this.min.y )
		);

	},

	intersectsBox: function ( box ) {

		// using 6 splitting planes to rule out intersections.

		if ( box.max.x < this.min.x || box.min.x > this.max.x ||
		     box.max.y < this.min.y || box.min.y > this.max.y ) {

			return false;

		}

		return true;

	},

	clampPoint: function ( point, optionalTarget ) {

		var result = optionalTarget || new Vector2();
		return result.copy( point ).clamp( this.min, this.max );

	},

	distanceToPoint: function () {

		var v1 = new Vector2();

		return function distanceToPoint( point ) {

			var clampedPoint = v1.copy( point ).clamp( this.min, this.max );
			return clampedPoint.sub( point ).length();

		};

	}(),

	intersect: function ( box ) {

		this.min.max( box.min );
		this.max.min( box.max );

		return this;

	},

	union: function ( box ) {

		this.min.min( box.min );
		this.max.max( box.max );

		return this;

	},

	translate: function ( offset ) {

		this.min.add( offset );
		this.max.add( offset );

		return this;

	},

	equals: function ( box ) {

		return box.min.equals( this.min ) && box.max.equals( this.max );

	}

};


module.exports = Box2;
},{"./vector2.js":16}],16:[function(require,module,exports){
/**
 * @author mrdoob / http://mrdoob.com/
 * @author philogb / http://blog.thejit.org/
 * @author egraether / http://egraether.com/
 * @author zz85 / http://www.lab4games.net/zz85/blog
 */

function Vector2( x, y ) {

	this.x = x || 0;
	this.y = y || 0;

}

Vector2.prototype = {

	constructor: Vector2,

	isVector2: true,

	get width() {

		return this.x;

	},

	set width( value ) {

		this.x = value;

	},

	get height() {

		return this.y;

	},

	set height( value ) {

		this.y = value;

	},

	//

	set: function ( x, y ) {

		this.x = x;
		this.y = y;

		return this;

	},

	setScalar: function ( scalar ) {

		this.x = scalar;
		this.y = scalar;

		return this;

	},

	setX: function ( x ) {

		this.x = x;

		return this;

	},

	setY: function ( y ) {

		this.y = y;

		return this;

	},

	setComponent: function ( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			default: throw new Error( 'index is out of range: ' + index );

		}
		
		return this;

	},

	getComponent: function ( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			default: throw new Error( 'index is out of range: ' + index );

		}

	},

	clone: function () {

		return new this.constructor( this.x, this.y );

	},

	copy: function ( v ) {

		this.x = v.x;
		this.y = v.y;

		return this;

	},

	add: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector2: .add() now only accepts one argument. Use .addVectors( a, b ) instead.' );
			return this.addVectors( v, w );

		}

		this.x += v.x;
		this.y += v.y;

		return this;

	},

	addScalar: function ( s ) {

		this.x += s;
		this.y += s;

		return this;

	},

	addVectors: function ( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;

		return this;

	},

	addScaledVector: function ( v, s ) {

		this.x += v.x * s;
		this.y += v.y * s;

		return this;

	},

	sub: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector2: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.' );
			return this.subVectors( v, w );

		}

		this.x -= v.x;
		this.y -= v.y;

		return this;

	},

	subScalar: function ( s ) {

		this.x -= s;
		this.y -= s;

		return this;

	},

	subVectors: function ( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;

		return this;

	},

	multiply: function ( v ) {

		this.x *= v.x;
		this.y *= v.y;

		return this;

	},

	multiplyScalar: function ( scalar ) {

		if ( isFinite( scalar ) ) {

			this.x *= scalar;
			this.y *= scalar;

		} else {

			this.x = 0;
			this.y = 0;

		}

		return this;

	},

	divide: function ( v ) {

		this.x /= v.x;
		this.y /= v.y;

		return this;

	},

	divideScalar: function ( scalar ) {

		return this.multiplyScalar( 1 / scalar );

	},

	min: function ( v ) {

		this.x = Math.min( this.x, v.x );
		this.y = Math.min( this.y, v.y );

		return this;

	},

	max: function ( v ) {

		this.x = Math.max( this.x, v.x );
		this.y = Math.max( this.y, v.y );

		return this;

	},

	clamp: function ( min, max ) {

		// This function assumes min < max, if this assumption isn't true it will not operate correctly

		this.x = Math.max( min.x, Math.min( max.x, this.x ) );
		this.y = Math.max( min.y, Math.min( max.y, this.y ) );

		return this;

	},

	clampScalar: function () {

		var min, max;

		return function clampScalar( minVal, maxVal ) {

			if ( min === undefined ) {

				min = new Vector2();
				max = new Vector2();

			}

			min.set( minVal, minVal );
			max.set( maxVal, maxVal );

			return this.clamp( min, max );

		};

	}(),

	clampLength: function ( min, max ) {

		var length = this.length();

		return this.multiplyScalar( Math.max( min, Math.min( max, length ) ) / length );

	},

	floor: function () {

		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );

		return this;

	},

	ceil: function () {

		this.x = Math.ceil( this.x );
		this.y = Math.ceil( this.y );

		return this;

	},

	round: function () {

		this.x = Math.round( this.x );
		this.y = Math.round( this.y );

		return this;

	},

	roundToZero: function () {

		this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
		this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );

		return this;

	},

	negate: function () {

		this.x = - this.x;
		this.y = - this.y;

		return this;

	},

	dot: function ( v ) {

		return this.x * v.x + this.y * v.y;

	},

	lengthSq: function () {

		return this.x * this.x + this.y * this.y;

	},

	length: function () {

		return Math.sqrt( this.x * this.x + this.y * this.y );

	},

	lengthManhattan: function() {

		return Math.abs( this.x ) + Math.abs( this.y );

	},

	normalize: function () {

		return this.divideScalar( this.length() );

	},

	angle: function () {

		// computes the angle in radians with respect to the positive x-axis

		var angle = Math.atan2( this.y, this.x );

		if ( angle < 0 ) angle += 2 * Math.PI;

		return angle;

	},

	distanceTo: function ( v ) {

		return Math.sqrt( this.distanceToSquared( v ) );

	},

	distanceToSquared: function ( v ) {

		var dx = this.x - v.x, dy = this.y - v.y;
		return dx * dx + dy * dy;

	},

	distanceToManhattan: function ( v ) {

		return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y );

	},

	setLength: function ( length ) {

		return this.multiplyScalar( length / this.length() );

	},

	lerp: function ( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;

		return this;

	},

	lerpVectors: function ( v1, v2, alpha ) {

		return this.subVectors( v2, v1 ).multiplyScalar( alpha ).add( v1 );

	},

	equals: function ( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) );

	},

	fromArray: function ( array, offset ) {

		if ( offset === undefined ) offset = 0;

		this.x = array[ offset ];
		this.y = array[ offset + 1 ];

		return this;

	},

	toArray: function ( array, offset ) {

		if ( array === undefined ) array = [];
		if ( offset === undefined ) offset = 0;

		array[ offset ] = this.x;
		array[ offset + 1 ] = this.y;

		return array;

	},

	fromAttribute: function ( attribute, index, offset ) {

		if ( offset === undefined ) offset = 0;

		index = index * attribute.itemSize + offset;

		this.x = attribute.array[ index ];
		this.y = attribute.array[ index + 1 ];

		return this;

	},

	rotateAround: function ( center, angle ) {

		var c = Math.cos( angle ), s = Math.sin( angle );

		var x = this.x - center.x;
		var y = this.y - center.y;

		this.x = x * c - y * s + center.x;
		this.y = x * s + y * c + center.y;

		return this;

	}

};


module.exports = Vector2;
},{}],17:[function(require,module,exports){
module.exports={"type":"World","attrs":{},"children":[{"type":"Character","attrs":{"x":0,"y":0,"width":50,"height":100,"color":"coral"},"children":[]},{"type":"Region","attrs":{"color":"silver","height":700,"width":700,"x":0,"y":0},"children":[{"type":"Rect","attrs":{"color":"blue","x":140,"y":140,"width":420,"height":420,"z":0},"children":[{"type":"Image","attrs":{"src":["assets/_resized/8D330C67CCE2043_336_336.jpg","assets/_resized/8D330C67CCE2043_168_168.jpg","assets/_resized/8D330C67CCE2043_84_84.jpg","assets/_resized/8D330C67CCE2043_42_42.jpg"],"x":182,"y":182,"width":336,"height":336,"z":0},"children":[]}]},{"type":"Ellipse","attrs":{"color":"red","width":140,"height":140,"x":280,"y":0,"z":1},"children":[]},{"type":"Ellipse","attrs":{"color":"red","width":140,"height":140,"x":560,"y":210,"z":2},"children":[]},{"type":"Ellipse","attrs":{"color":"red","width":140,"height":140,"x":0,"y":280,"z":3},"children":[]},{"type":"Ellipse","attrs":{"color":"red","width":140,"height":140,"x":350,"y":560,"z":4},"children":[]},{"type":"Text","attrs":{"x":574,"y":350,"color":"red","size":350,"content":"\n            b<br/>o\n        ","width":0,"z":5,"height":0},"children":[]},{"type":"Text","attrs":{"x":210,"y":560,"color":"red","size":350,"content":"\n            en\n        ","width":0,"z":6,"height":0},"children":[]},{"type":"Song","attrs":{"src":"assets/thatwasme3.mp3","title":"That Was Me","x":70,"y":70,"width":0,"z":7,"height":0},"children":[]}]},{"type":"Region","attrs":{"color":"white","height":700,"width":700,"x":700,"y":0},"children":[{"type":"Rect","attrs":{"x":756,"y":56,"width":105,"height":560,"z":0},"children":[{"type":"Image","attrs":{"src":["assets/_resized/312B55CFDC924723_105_140.jpg","assets/_resized/312B55CFDC924723_53_70.jpg","assets/_resized/312B55CFDC924723_27_35.jpg","assets/_resized/312B55CFDC924723_14_18.jpg"],"width":105,"height":140,"x":756,"y":56,"z":0},"children":[]},{"type":"Text","attrs":{"x":756,"y":212.8,"width":52.5,"height":84,"size":400,"content":"B","z":1},"children":[]},{"type":"Text","attrs":{"x":808.5,"y":212.8,"width":52.5,"height":84,"size":400,"align":"right","content":"O","z":2},"children":[]},{"type":"Image","attrs":{"src":["assets/_resized/1AF7118B311C49BB_105_140.jpg","assets/_resized/1AF7118B311C49BB_53_70.jpg","assets/_resized/1AF7118B311C49BB_27_35.jpg","assets/_resized/1AF7118B311C49BB_14_18.jpg"],"width":105,"height":140,"y":291.2,"x":756,"z":3},"children":[]},{"type":"Text","attrs":{"y":560,"width":105,"height":56,"size":200,"align":"center","content":"LOVE","x":756,"z":4},"children":[]}]},{"type":"Rect","attrs":{"x":917,"y":56,"width":105,"height":560,"z":1},"children":[{"type":"Image","attrs":{"src":["assets/_resized/312B55CFDC924723_105_140.jpg","assets/_resized/312B55CFDC924723_53_70.jpg","assets/_resized/312B55CFDC924723_27_35.jpg","assets/_resized/312B55CFDC924723_14_18.jpg"],"width":105,"height":140,"x":917,"y":56,"z":0},"children":[]},{"type":"Text","attrs":{"x":917,"y":212.8,"width":52.5,"height":84,"size":400,"content":"E","z":1},"children":[]},{"type":"Text","attrs":{"x":969.5,"y":212.8,"width":52.5,"height":84,"size":400,"align":"right","content":"N","z":2},"children":[]},{"type":"Image","attrs":{"src":["assets/_resized/1AF7118B311C49BB_105_140.jpg","assets/_resized/1AF7118B311C49BB_53_70.jpg","assets/_resized/1AF7118B311C49BB_27_35.jpg","assets/_resized/1AF7118B311C49BB_14_18.jpg"],"width":105,"height":140,"y":291.2,"x":917,"z":3},"children":[]},{"type":"Text","attrs":{"y":560,"width":105,"height":56,"size":200,"align":"center","content":"IN","x":917,"z":4},"children":[]}]},{"type":"Rect","attrs":{"x":1078,"y":56,"width":105,"height":560,"z":2},"children":[{"type":"Image","attrs":{"src":["assets/_resized/312B55CFDC924723_105_140.jpg","assets/_resized/312B55CFDC924723_53_70.jpg","assets/_resized/312B55CFDC924723_27_35.jpg","assets/_resized/312B55CFDC924723_14_18.jpg"],"width":105,"height":140,"x":1078,"y":56,"z":0},"children":[]},{"type":"Text","attrs":{"x":1078,"y":212.8,"width":52.5,"height":84,"size":400,"content":"B","z":1},"children":[]},{"type":"Text","attrs":{"x":1130.5,"y":212.8,"width":52.5,"height":84,"size":400,"align":"right","content":"O","z":2},"children":[]},{"type":"Image","attrs":{"src":["assets/_resized/1AF7118B311C49BB_105_140.jpg","assets/_resized/1AF7118B311C49BB_53_70.jpg","assets/_resized/1AF7118B311C49BB_27_35.jpg","assets/_resized/1AF7118B311C49BB_14_18.jpg"],"width":105,"height":140,"y":291.2,"x":1078,"z":3},"children":[]},{"type":"Text","attrs":{"y":560,"width":105,"height":56,"size":200,"align":"center","content":"A","x":1078,"z":4},"children":[]}]},{"type":"Rect","attrs":{"x":1239,"y":56,"width":105,"height":560,"z":3},"children":[{"type":"Image","attrs":{"src":["assets/_resized/312B55CFDC924723_105_140.jpg","assets/_resized/312B55CFDC924723_53_70.jpg","assets/_resized/312B55CFDC924723_27_35.jpg","assets/_resized/312B55CFDC924723_14_18.jpg"],"width":105,"height":140,"x":1239,"y":56,"z":0},"children":[]},{"type":"Text","attrs":{"x":1239,"y":212.8,"width":52.5,"height":84,"size":400,"content":"E","z":1},"children":[]},{"type":"Text","attrs":{"x":1291.5,"y":212.8,"width":52.5,"height":84,"size":400,"align":"right","content":"N","z":2},"children":[]},{"type":"Image","attrs":{"src":["assets/_resized/1AF7118B311C49BB_105_140.jpg","assets/_resized/1AF7118B311C49BB_53_70.jpg","assets/_resized/1AF7118B311C49BB_27_35.jpg","assets/_resized/1AF7118B311C49BB_14_18.jpg"],"width":105,"height":140,"y":291.2,"x":1239,"z":3},"children":[]},{"type":"Text","attrs":{"y":560,"width":105,"height":56,"size":200,"align":"center","content":"SONG","x":1239,"z":4},"children":[]}]}]},{"type":"Region","attrs":{"color":"#fffdee","height":700,"width":700,"x":1400,"y":0},"children":[{"type":"Rect","attrs":{"x":1414,"y":14,"width":700,"height":560,"z":0},"children":[{"type":"Image","attrs":{"src":["assets/_resized/312B55CFDC924723_350_560.jpg","assets/_resized/312B55CFDC924723_175_280.jpg","assets/_resized/312B55CFDC924723_88_140.jpg","assets/_resized/312B55CFDC924723_44_70.jpg"],"width":350,"height":560,"x":1414,"y":14,"z":0},"children":[]},{"type":"Image","attrs":{"src":["assets/_resized/1AF7118B311C49BB_350_448.jpg","assets/_resized/1AF7118B311C49BB_175_224.jpg","assets/_resized/1AF7118B311C49BB_88_112.jpg","assets/_resized/1AF7118B311C49BB_44_56.jpg"],"width":350,"height":448,"x":1554,"y":182,"z":1},"children":[]}]},{"type":"Ellipse","attrs":{"color":"#e35e33","width":210,"height":210,"x":1820,"y":140,"z":1},"children":[]},{"type":"Song","attrs":{"src":"assets/thatwasme3.mp3","title":"That Was Me","x":2030,"y":630,"width":0,"z":2,"height":0},"children":[]}]},{"type":"Region","attrs":{"color":"#e35e33","height":700,"width":700,"x":2100,"y":0},"children":[{"type":"Rect","attrs":{"x":2114,"y":14,"width":700,"height":560,"z":0},"children":[{"type":"Image","attrs":{"src":["assets/_resized/312B55CFDC924723_350_560.jpg","assets/_resized/312B55CFDC924723_175_280.jpg","assets/_resized/312B55CFDC924723_88_140.jpg","assets/_resized/312B55CFDC924723_44_70.jpg"],"width":350,"height":560,"x":2114,"y":14,"z":0},"children":[]},{"type":"Image","attrs":{"src":["assets/_resized/1AF7118B311C49BB_350_448.jpg","assets/_resized/1AF7118B311C49BB_175_224.jpg","assets/_resized/1AF7118B311C49BB_88_112.jpg","assets/_resized/1AF7118B311C49BB_44_56.jpg"],"width":350,"height":448,"x":2254,"y":182,"z":1},"children":[]}]},{"type":"Ellipse","attrs":{"color":0,"width":210,"height":210,"x":2520,"y":140,"z":1},"children":[]},{"type":"Song","attrs":{"src":"assets/thatwasme3.mp3","title":"That Was Me","x":2730,"y":630,"width":0,"z":2,"height":0},"children":[]}]},{"type":"Region","attrs":{"color":"#e35e33","height":700,"width":700,"x":0,"y":700},"children":[]},{"type":"Region","attrs":{"color":"#e35e33","classes":["tour"],"height":700,"width":700,"x":700,"y":700},"children":[{"type":"Rect","attrs":{"color":"silver","x":700,"y":700,"width":350,"height":489.99999999999994,"z":0},"children":[]},{"type":"Text","attrs":{"color":"#fffdee","x":735,"y":735,"width":630,"height":70,"size":450,"align":"left","content":"15 Septembro 2017","z":1},"children":[]},{"type":"Text","attrs":{"color":"#fffdee","x":735,"y":805,"width":630,"height":70,"size":450,"align":"left","content":"31 Octobur 2017","z":2},"children":[]},{"type":"Text","attrs":{"color":"#fffdee","x":735,"y":875,"width":630,"height":70,"size":450,"align":"left","content":"1 Decembere 2017","z":3},"children":[]},{"type":"Text","attrs":{"color":"#fffdee","x":735,"y":945,"width":630,"height":70,"size":450,"align":"left","content":"5 Janoori 2018","z":4},"children":[]},{"type":"Text","attrs":{"color":"#fffdee","x":735,"y":1015,"width":630,"height":70,"size":450,"align":"left","content":"5 Februare 2018","z":5},"children":[]},{"type":"Text","attrs":{"color":"#fffdee","x":1295,"y":749,"width":70,"height":70,"size":50,"align":"left","content":"The Place<br/>The Country","z":6},"children":[]},{"type":"Text","attrs":{"color":"#fffdee","x":1295,"y":819,"width":70,"height":70,"size":50,"align":"left","content":"The Place<br/>The Country","z":7},"children":[]},{"type":"Text","attrs":{"color":"#fffdee","x":1295,"y":889,"width":70,"height":70,"size":50,"align":"left","content":"The Place<br/>The Country","z":8},"children":[]},{"type":"Text","attrs":{"color":"#fffdee","x":1295,"y":959,"width":70,"height":70,"size":50,"align":"left","content":"The Place<br/>The Country","z":9},"children":[]},{"type":"Text","attrs":{"color":"#fffdee","x":1295,"y":1029,"width":70,"height":70,"size":50,"align":"left","content":"The Place<br/>The Country","z":10},"children":[]}]}]}
},{}],18:[function(require,module,exports){
var Vector2 = require('./vendor/vector2.js');
var Matrix = require('transformation-matrix-js').Matrix;
var { PREFIXED_TRANSFORM } = require('./lib/utils.js');

var types = {
    Region: require('./types/region.js'),
    Rect: require('./types/rect.js'),
    Ellipse: require('./types/ellipse.js'),
    Text: require('./types/text.js'),
    Image: require('./types/image.js'),
    Song: require('./types/song.js'),
    Sprite: require('./types/sprite.js'),
    Character: require('./types/character.js')
}

var matrix = new Matrix();
var SCALE = new Vector2( 1, .5 );

module.exports = class World {
    
    constructor ( config, context ) {
        
        this.element = context.worldElement;
        this.regions = this.create( config.children, context );
        
        this.center = new Vector2();

        //this.regions.forEach( region => this.element.appendChild(region.element) );
        
    }
    
    create ( config, context ) {
        
        return config.map( cfg => {
        
            var Ctor = types[ cfg.type ];
            
            var instance = new Ctor( cfg.attrs, context );
            
            instance.addChildren( this.create( cfg.children, context ) )
            
            return instance;
            
        });
        
    }
    
    find( fn ) {
        
        if( typeof fn === 'string' ) {
            
            fn = x => x === fn;
            
        }
        
        var found = [];
        
        var reducer = (ret, item) => {
            
            if( fn(item) ) ret.push( item );
            
            return item.children.reduce( reducer, ret );
            
        }
        
        return this.regions.reduce( reducer, [] );
        
    }
    
    // rotate( a ) {
        
    //     this.angle = a;
        
    //     var t = 200;
        
    //     var translate = new Matrix().translate( -t, -t );
    //     var rotate = new Matrix().rotateDeg( a );
    //     var translateInv = new Matrix().translate( t, t );
        
    //     matrix
    //         .reset()
    //         //.translate( -t, -t )
    //         .rotate( a )
    //     //     .translate( t, t )
            
    //     console.log( matrix.toCSS() );
        
        
    //     //this.element.style.transformOrigin = '200px 200px'
    //     this.element.style[ PREFIXED_TRANSFORM ] = matrix.toCSS3D();
        
    // }
    
}
},{"./lib/utils.js":4,"./types/character.js":6,"./types/ellipse.js":7,"./types/image.js":8,"./types/rect.js":9,"./types/region.js":10,"./types/song.js":11,"./types/sprite.js":12,"./types/text.js":13,"./vendor/vector2.js":16,"transformation-matrix-js":22}],19:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],20:[function(require,module,exports){
/*
 * detectCSS
 * http://github.amexpub.com/modules/detectCSS
 *
 * Copyright (c) 2013 AmexPub. All rights reserved.
 */

module.exports = require('./lib/detectCSS');

},{"./lib/detectCSS":21}],21:[function(require,module,exports){
/*
 * detectCSS
 * http://github.amexpub.com/modules
 *
 * Copyright (c) 2013 Amex Pub. All rights reserved.
 */

'use strict';

exports.feature = function(style) {
    var b = document.body || document.documentElement;
    var s = b.style;
    var p = style;
    if(typeof s[p] === 'string') {return true; }

    // Tests for vendor specific prop
    var v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'];
    p = p.charAt(0).toUpperCase() + p.substr(1);
    for(var i=0; i<v.length; i++) {
      if(typeof s[v[i] + p] === 'string') { return true; }
    }
    return false;
};

exports.prefixed = function(style){
    var b = document.body || document.documentElement;
    var s = b.style;
    var p = style;
    if(typeof s[p] === 'string') {return p; }

    // Tests for vendor specific prop
    var v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms',''];
    p = p.charAt(0).toUpperCase() + p.substr(1);
    for(var i=0; i<v.length; i++) {
      if(typeof s[v[i] + p] === 'string') { return v[i] + p; }
    }
    return false;
};
},{}],22:[function(require,module,exports){
/*!
	2D Transformation Matrix v2.6.5
	(c) Epistemex.com 2014-2016
	License: MIT, header required.
*/

/* --- To see contributors: please see readme.md and Change.log --- */

/**
 * 2D transformation matrix object initialized with identity matrix.
 *
 * The matrix can synchronize a canvas 2D context by supplying the context
 * as an argument, or later apply current absolute transform to an
 * existing context.
 *
 * To synchronize a DOM element you can use [`toCSS()`]{@link Matrix#toCSS} or [`toCSS3D()`]{@link Matrix#toCSS3D}.
 *
 * @param {CanvasRenderingContext2D} [context] - Optional context to sync with Matrix
 * @prop {number} a - scale x
 * @prop {number} b - shear y
 * @prop {number} c - shear x
 * @prop {number} d - scale y
 * @prop {number} e - translate x
 * @prop {number} f - translate y
 * @prop {CanvasRenderingContext2D|null} [context=null] - set or get current canvas context
 * @constructor
 * @license MIT license (header required)
 * @copyright Epistemex.com 2014-2016
 */
function Matrix(context) {

	var me = this;
	me._t = me.transform;

	me.a = me.d = 1;
	me.b = me.c = me.e = me.f = 0;

	// reset canvas to enable 100% sync.
	if (context)
		(me.context = context).setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * Returns a new matrix that transforms a triangle `t1` into another triangle
 * `t2`, or throws an exception if it is impossible.
 *
 * Note: the method can take both arrays as well as literal objects.
 * Just make sure that both arguments (`t1`, `t2`) are of the same type.
 *
 * @param {{px: number, py: number, qx: number, qy: number, rx: number, ry: number}|Array} t1 - Object or array containing the three points for the triangle.
 * For object use obj.px, obj.py, obj.qx, obj.qy, obj.rx and obj.ry. For arrays provide the points in the order [px, py, qx, qy, rx, ry], or as point array [{x:,y:}, {x:,y:}, {x:,y:}]
 * @param {{px: number, py: number, qx: number, qy: number, rx: number, ry: number}|Array} t2 - See description for t1.
 * @param {CanvasRenderingContext2D} [context] - optional canvas 2D context to use for the matrix
 * @returns {Matrix}
 * @throws Exception is matrix becomes not invertible
 * @static
 */
Matrix.fromTriangles = function(t1, t2, context) {

	var m1 = new Matrix(),
		m2 = new Matrix(context),
		r1, r2, rx1, ry1, rx2, ry2;

	if (Array.isArray(t1)) {
		if (typeof t1[0] === "number") {
			rx1 = t1[4]; ry1 = t1[5]; rx2 = t2[4]; ry2 = t2[5];
			r1 = [t1[0] - rx1, t1[1] - ry1, t1[2] - rx1, t1[3] - ry1, rx1, ry1];
			r2 = [t2[0] - rx2, t2[1] - ry2, t2[2] - rx2, t2[3] - ry2, rx2, ry2]
		}
		else {
			rx1 = t1[2].x; ry1 = t1[2].y; rx2 = t2[2].x; ry2 = t2[2].y;
			r1 = [t1[0].x - rx1, t1[0].y - ry1, t1[1].x - rx1, t1[1].y - ry1, rx1, ry1];
			r2 = [t2[0].x - rx2, t2[0].y - ry2, t2[1].x - rx2, t1[1].y - ry2, rx2, ry2]
		}
	}
	else {
		r1 = [t1.px - t1.rx, t1.py - t1.ry, t1.qx - t1.rx, t1.qy - t1.ry, t1.rx, t1.ry];
		r2 = [t2.px - t2.rx, t2.py - t2.ry, t2.qx - t2.rx, t2.qy - t2.ry, t2.rx, t2.ry]
	}

	m1.setTransform.apply(m1, r1);
	m2.setTransform.apply(m2, r2);

	return m2.multiply(m1.inverse())
};

/**
 * Create a new matrix from a SVGMatrix
 *
 * @param {SVGMatrix} svgMatrix - source SVG Matrix
 * @param {CanvasRenderingContext2D} [context] - optional canvas 2D context to use for the matrix
 * @returns {Matrix}
 * @static
 * @private
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGMatrix|MDN / SVGMatrix}
 */
Matrix.fromSVGMatrix = function(svgMatrix, context) {
	console.warn("Obsolete. Use Matrix.from()");
	return new Matrix(context).multiply(svgMatrix)
};

/**
 * Create a new matrix from a DOMMatrix
 *
 * @param {DOMMatrix} domMatrix - source DOMMatrix
 * @param {CanvasRenderingContext2D} [context] - optional canvas 2D context to use for the matrix
 * @returns {Matrix}
 * @static
 * @private
 * @see {@link https://drafts.fxtf.org/geometry/#dommatrix|MDN / DOMMatrix}
 */
Matrix.fromDOMMatrix = function(domMatrix, context) {
	console.warn("Obsolete. Use Matrix.from()");
	if (!domMatrix.is2D) throw "Cannot use 3D matrix.";
	return new Matrix(context).multiply(domMatrix)
};

/**
 * Create a matrix from a transform list from an SVG shape. The list
 * can be for example baseVal (i.e. `shape.transform.baseVal`).
 *
 * The resulting matrix has all transformations from that list applied
 * in the same order as the list.
 *
 * @param {SVGTransformList} tList - transform list from an SVG shape.
 * @param {CanvasRenderingContext2D} [context] - optional canvas 2D context to use for the matrix
 * @returns {Matrix}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGTransformList|MDN / SVGTransformList}
 */
Matrix.fromSVGTransformList = function(tList, context) {

	var m = new Matrix(context),
		i = 0;

	while(i < tList.length)
		m.multiply(tList[i++].matrix);

	return m
};

/**
 * Create and transform a new matrix based on given matrix values, or
 * provide SVGMatrix or a (2D) DOMMatrix or another instance of a Matrix
 * (in fact, any 2D matrix object using properties a-f can be used as source).
 *
 * @example
 *
 *     var m = Matrix.from(1, 0.2, 0, 2, 120, 97);
 *     var m = Matrix.from(domMatrix, ctx);
 *     var m = Matrix.from(svgMatrix);
 *     var m = Matrix.from(matrix);
 *
 * @param {number|DOMMatrix|SVGMatrix|Matrix} a - number representing a in [a-f], or a Matrix object containing properties a-f
 * @param {number|CanvasRenderingContext2D} [b] - b property if a is not a matrix object, or optional canvas 2D context
 * @param {number} [c]
 * @param {number} [d]
 * @param {number} [e]
 * @param {number} [f]
 * @param {CanvasRenderingContext2D} [context] - optional canvas context to synchronize
 * @returns {Matrix}
 * @static
 */
Matrix.from = function(a, b, c, d, e, f, context) {

	var m = new Matrix(context);

	if (typeof a === "number")
		m.setTransform(a, b, c, d, e, f);

	else {
		if (typeof a.is2D === "boolean" && !a.is2D) throw "Cannot use 3D DOMMatrix.";
		if (b) m.context = b;
		m.multiply(a)
	}

	return m
};

Matrix.prototype = {

	/**
	 * Concatenates transforms of this matrix onto the given child matrix and
	 * returns a new matrix. This instance is used on left side.
	 *
	 * @param {Matrix|SVGMatrix} cm - child matrix to apply concatenation to
	 * @returns {Matrix} - new Matrix instance
	 */
	concat: function(cm) {
		return this.clone().multiply(cm)
	},

	/**
	 * Flips the horizontal values.
	 * @returns {Matrix}
	 */
	flipX: function() {
		return this._t(-1, 0, 0, 1, 0, 0)
	},

	/**
	 * Flips the vertical values.
	 * @returns {Matrix}
	 */
	flipY: function() {
		return this._t(1, 0, 0, -1, 0, 0)
	},

	/**
	 * Reflects incoming (velocity) vector on the normal which will be the
	 * current transformed x axis. Call when a trigger condition is met.
	 *
	 * @param {number} x - vector end point for x (start = 0)
	 * @param {number} y - vector end point for y (start = 0)
	 * @returns {{x: number, y: number}}
	 */
	reflectVector: function(x, y) {

		var v = this.applyToPoint(0, 1),
			d = (v.x * x + v.y * y) * 2;

		x -= d * v.x;
		y -= d * v.y;

		return {x: x, y: y}
	},

	/**
	 * Short-hand to reset current matrix to an identity matrix.
	 * @returns {Matrix}
	 */
	reset: function() {
		return this.setTransform(1, 0, 0, 1, 0, 0)
	},

	/**
	 * Rotates current matrix by angle (accumulative).
	 * @param {number} angle - angle in radians
	 * @returns {Matrix}
	 */
	rotate: function(angle) {
		var cos = Math.cos(angle),
			sin = Math.sin(angle);
		return this._t(cos, sin, -sin, cos, 0, 0)
	},

	/**
	 * Converts a vector given as `x` and `y` to angle, and
	 * rotates (accumulative).
	 * @param x
	 * @param y
	 * @returns {Matrix}
	 */
	rotateFromVector: function(x, y) {
		return this.rotate(Math.atan2(y, x))
	},

	/**
	 * Helper method to make a rotation based on an angle in degrees.
	 * @param {number} angle - angle in degrees
	 * @returns {Matrix}
	 */
	rotateDeg: function(angle) {
		return this.rotate(angle * Math.PI / 180)
	},

	/**
	 * Scales current matrix uniformly and accumulative.
	 * @param {number} f - scale factor for both x and y (1 does nothing)
	 * @returns {Matrix}
	 */
	scaleU: function(f) {
		return this._t(f, 0, 0, f, 0, 0)
	},

	/**
	 * Scales current matrix accumulative.
	 * @param {number} sx - scale factor x (1 does nothing)
	 * @param {number} sy - scale factor y (1 does nothing)
	 * @returns {Matrix}
	 */
	scale: function(sx, sy) {
		return this._t(sx, 0, 0, sy, 0, 0)
	},

	/**
	 * Scales current matrix on x axis accumulative.
	 * @param {number} sx - scale factor x (1 does nothing)
	 * @returns {Matrix}
	 */
	scaleX: function(sx) {
		return this._t(sx, 0, 0, 1, 0, 0)
	},

	/**
	 * Scales current matrix on y axis accumulative.
	 * @param {number} sy - scale factor y (1 does nothing)
	 * @returns {Matrix}
	 */
	scaleY: function(sy) {
		return this._t(1, 0, 0, sy, 0, 0)
	},

	/**
	 * Apply shear to the current matrix accumulative.
	 * @param {number} sx - amount of shear for x
	 * @param {number} sy - amount of shear for y
	 * @returns {Matrix}
	 */
	shear: function(sx, sy) {
		return this._t(1, sy, sx, 1, 0, 0)
	},

	/**
	 * Apply shear for x to the current matrix accumulative.
	 * @param {number} sx - amount of shear for x
	 * @returns {Matrix}
	 */
	shearX: function(sx) {
		return this._t(1, 0, sx, 1, 0, 0)
	},

	/**
	 * Apply shear for y to the current matrix accumulative.
	 * @param {number} sy - amount of shear for y
	 * @returns {Matrix}
	 */
	shearY: function(sy) {
		return this._t(1, sy, 0, 1, 0, 0)
	},

	/**
	 * Apply skew to the current matrix accumulative. Angles in radians.
	 * Also see [`skewDeg()`]{@link Matrix#skewDeg}.
	 * @param {number} ax - angle of skew for x
	 * @param {number} ay - angle of skew for y
	 * @returns {Matrix}
	 */
	skew: function(ax, ay) {
		return this.shear(Math.tan(ax), Math.tan(ay))
	},

	/**
	 * Apply skew to the current matrix accumulative. Angles in degrees.
	 * Also see [`skew()`]{@link Matrix#skew}.
	 * @param {number} ax - angle of skew for x
	 * @param {number} ay - angle of skew for y
	 * @returns {Matrix}
	 */
	skewDeg: function(ax, ay) {
		return this.shear(Math.tan(ax / 180 * Math.PI), Math.tan(ay / 180 * Math.PI))
	},

	/**
	 * Apply skew for x to the current matrix accumulative. Angles in radians.
	 * Also see [`skewDeg()`]{@link Matrix#skewDeg}.
	 * @param {number} ax - angle of skew for x
	 * @returns {Matrix}
	 */
	skewX: function(ax) {
		return this.shearX(Math.tan(ax))
	},

	/**
	 * Apply skew for y to the current matrix accumulative. Angles in radians.
	 * Also see [`skewDeg()`]{@link Matrix#skewDeg}.
	 * @param {number} ay - angle of skew for y
	 * @returns {Matrix}
	 */
	skewY: function(ay) {
		return this.shearY(Math.tan(ay))
	},

	/**
	 * Set current matrix to new absolute matrix.
	 * @param {number} a - scale x
	 * @param {number} b - shear y
	 * @param {number} c - shear x
	 * @param {number} d - scale y
	 * @param {number} e - translate x
	 * @param {number} f - translate y
	 * @returns {Matrix}
	 */
	setTransform: function(a, b, c, d, e, f) {
		var me = this;
		me.a = a;
		me.b = b;
		me.c = c;
		me.d = d;
		me.e = e;
		me.f = f;
		return me._x()
	},

	/**
	 * Translate current matrix accumulative.
	 * @param {number} tx - translation for x
	 * @param {number} ty - translation for y
	 * @returns {Matrix}
	 */
	translate: function(tx, ty) {
		return this._t(1, 0, 0, 1, tx, ty)
	},

	/**
	 * Translate current matrix on x axis accumulative.
	 * @param {number} tx - translation for x
	 * @returns {Matrix}
	 */
	translateX: function(tx) {
		return this._t(1, 0, 0, 1, tx, 0)
	},

	/**
	 * Translate current matrix on y axis accumulative.
	 * @param {number} ty - translation for y
	 * @returns {Matrix}
	 */
	translateY: function(ty) {
		return this._t(1, 0, 0, 1, 0, ty)
	},

	/**
	 * Multiplies current matrix with new matrix values. Also see [`multiply()`]{@link Matrix#multiply}.
	 *
	 * @param {number} a2 - scale x
	 * @param {number} b2 - shear y
	 * @param {number} c2 - shear x
	 * @param {number} d2 - scale y
	 * @param {number} e2 - translate x
	 * @param {number} f2 - translate y
	 * @returns {Matrix}
	 */
	transform: function(a2, b2, c2, d2, e2, f2) {

		var me = this,
			a1 = me.a,
			b1 = me.b,
			c1 = me.c,
			d1 = me.d,
			e1 = me.e,
			f1 = me.f;

		/* matrix order (canvas compatible):
		* ace
		* bdf
		* 001
		*/
		me.a = a1 * a2 + c1 * b2;
		me.b = b1 * a2 + d1 * b2;
		me.c = a1 * c2 + c1 * d2;
		me.d = b1 * c2 + d1 * d2;
		me.e = a1 * e2 + c1 * f2 + e1;
		me.f = b1 * e2 + d1 * f2 + f1;

		return me._x()
	},

	/**
	 * Multiplies current matrix with source matrix.
	 * @param {Matrix|SVGMatrix} m - source matrix to multiply with.
	 * @returns {Matrix}
	 */
	multiply: function(m) {
		return this._t(m.a, m.b, m.c, m.d, m.e, m.f)
	},

	/**
	 * Divide this matrix on input matrix which must be invertible.
	 * @param {Matrix} m - matrix to divide on (divisor)
	 * @throws Exception is input matrix is not invertible
	 * @returns {Matrix}
	 */
	divide: function(m) {

		if (!m.isInvertible())
			throw "Matrix not invertible";

		return this.multiply(m.inverse())
	},

	/**
	 * Divide current matrix on scalar value != 0.
	 * @param {number} d - divisor (can not be 0)
	 * @returns {Matrix}
	 */
	divideScalar: function(d) {

		var me = this;
		me.a /= d;
		me.b /= d;
		me.c /= d;
		me.d /= d;
		me.e /= d;
		me.f /= d;

		return me._x()
	},

	/**
	 * Get an inverse matrix of current matrix. The method returns a new
	 * matrix with values you need to use to get to an identity matrix.
	 * Context from parent matrix is not applied to the returned matrix.
	 *
	 * @param {boolean} [cloneContext=false] - clone current context to resulting matrix
	 * @throws Exception is input matrix is not invertible
	 * @returns {Matrix} - new Matrix instance
	 */
	inverse: function(cloneContext) {

		var me = this,
			m  = new Matrix(cloneContext ? me.context : null),
			dt = me.determinant();

		if (me._q(dt, 0))
			throw "Matrix not invertible.";

		m.a = me.d / dt;
		m.b = -me.b / dt;
		m.c = -me.c / dt;
		m.d = me.a / dt;
		m.e = (me.c * me.f - me.d * me.e) / dt;
		m.f = -(me.a * me.f - me.b * me.e) / dt;

		return m
	},

	/**
	 * Interpolate this matrix with another and produce a new matrix.
	 * `t` is a value in the range [0.0, 1.0] where 0 is this instance and
	 * 1 is equal to the second matrix. The `t` value is not clamped.
	 *
	 * Context from parent matrix is not applied to the returned matrix.
	 *
	 * Note: this interpolation is naive. For animation containing rotation,
	 * shear or skew use the [`interpolateAnim()`]{@link Matrix#interpolateAnim} method instead
	 * to avoid unintended flipping.
	 *
	 * @param {Matrix|SVGMatrix} m2 - the matrix to interpolate with.
	 * @param {number} t - interpolation [0.0, 1.0]
	 * @param {CanvasRenderingContext2D} [context] - optional context to affect
	 * @returns {Matrix} - new Matrix instance with the interpolated result
	 */
	interpolate: function(m2, t, context) {

		var me = this,
			m  = context ? new Matrix(context) : new Matrix();

		m.a = me.a + (m2.a - me.a) * t;
		m.b = me.b + (m2.b - me.b) * t;
		m.c = me.c + (m2.c - me.c) * t;
		m.d = me.d + (m2.d - me.d) * t;
		m.e = me.e + (m2.e - me.e) * t;
		m.f = me.f + (m2.f - me.f) * t;

		return m._x()
	},

	/**
	 * Interpolate this matrix with another and produce a new matrix.
	 * `t` is a value in the range [0.0, 1.0] where 0 is this instance and
	 * 1 is equal to the second matrix. The `t` value is not constrained.
	 *
	 * Context from parent matrix is not applied to the returned matrix.
	 *
	 * To obtain easing `t` can be preprocessed using easing-functions
	 * before being passed to this method.
	 *
	 * Note: this interpolation method uses decomposition which makes
	 * it suitable for animations (in particular where rotation takes
	 * places).
	 *
	 * @param {Matrix} m2 - the matrix to interpolate with.
	 * @param {number} t - interpolation [0.0, 1.0]
	 * @param {CanvasRenderingContext2D} [context] - optional context to affect
	 * @returns {Matrix} - new Matrix instance with the interpolated result
	 */
	interpolateAnim: function(m2, t, context) {

		var m          = new Matrix(context ? context : null),
			d1         = this.decompose(),
			d2         = m2.decompose(),
			t1         = d1.translate,
			t2         = d2.translate,
			s1         = d1.scale,
			rotation   = d1.rotation + (d2.rotation - d1.rotation) * t,
			translateX = t1.x + (t2.x - t1.x) * t,
			translateY = t1.y + (t2.y - t1.y) * t,
			scaleX     = s1.x + (d2.scale.x - s1.x) * t,
			scaleY     = s1.y + (d2.scale.y - s1.y) * t
			;

		// QR order (t-r-s-sk)
		m.translate(translateX, translateY);
		m.rotate(rotation);
		m.scale(scaleX, scaleY);
		//todo test skew scenarios

		return m._x()
	},

	/**
	 * Decompose the current matrix into simple transforms using either
	 * QR (default) or LU decomposition.
	 *
	 * @param {boolean} [useLU=false] - set to true to use LU rather than QR decomposition
	 * @returns {*} - an object containing current decomposed values (translate, rotation, scale, skew)
	 * @see {@link http://www.maths-informatique-jeux.com/blog/frederic/?post/2013/12/01/Decomposition-of-2D-transform-matrices|Adoption based on this code}
	 * @see {@link https://en.wikipedia.org/wiki/QR_decomposition|More on QR decomposition}
	 * @see {@link https://en.wikipedia.org/wiki/LU_decomposition|More on LU decomposition}
	 */
	decompose: function(useLU) {

		var me        = this,
			a         = me.a,
			b         = me.b,
			c         = me.c,
			d         = me.d,
			acos      = Math.acos,
			atan      = Math.atan,
			sqrt      = Math.sqrt,
			pi        = Math.PI,

			translate = {x: me.e, y: me.f},
			rotation  = 0,
			scale     = {x: 1, y: 1},
			skew      = {x: 0, y: 0},

			determ    = a * d - b * c;	// determinant(), skip DRY here...

		if (useLU) {
			if (a) {
				skew = {x: atan(c / a), y: atan(b / a)};
				scale = {x: a, y: determ / a};
			}
			else if (b) {
				rotation = pi * 0.5;
				scale = {x: b, y: determ / b};
				skew.x = atan(d / b);
			}
			else { // a = b = 0
				scale = {x: c, y: d};
				skew.x = pi * 0.25;
			}
		}
		else {
			// Apply the QR-like decomposition.
			if (a || b) {
				var r = sqrt(a * a + b * b);
				rotation = b > 0 ? acos(a / r) : -acos(a / r);
				scale = {x: r, y: determ / r};
				skew.x = atan((a * c + b * d) / (r * r));
			}
			else if (c || d) {
				var s = sqrt(c * c + d * d);
				rotation = pi * 0.5 - (d > 0 ? acos(-c / s) : -acos(c / s));
				scale = {x: determ / s, y: s};
				skew.y = atan((a * c + b * d) / (s * s));
			}
			else { // a = b = c = d = 0
				scale = {x: 0, y: 0};
			}
		}

		return {
			translate: translate,
			rotation : rotation,
			scale    : scale,
			skew     : skew
		}
	},

	/**
	 * Returns the determinant of the current matrix.
	 * @returns {number}
	 */
	determinant: function() {
		return this.a * this.d - this.b * this.c
	},

	/**
	 * Apply current matrix to `x` and `y` of a point.
	 * Returns a point object.
	 *
	 * @param {number} x - value for x
	 * @param {number} y - value for y
	 * @returns {{x: number, y: number}} A new transformed point object
	 */
	applyToPoint: function(x, y) {

		var me = this;

		return {
			x: x * me.a + y * me.c + me.e,
			y: x * me.b + y * me.d + me.f
		}
	},

	/**
	 * Apply current matrix to array with point objects or point pairs.
	 * Returns a new array with points in the same format as the input array.
	 *
	 * A point object is an object literal:
	 *
	 *     {x: x, y: y}
	 *
	 * so an array would contain either:
	 *
	 *     [{x: x1, y: y1}, {x: x2, y: y2}, ... {x: xn, y: yn}]
	 *
	 * or
	 *
	 *     [x1, y1, x2, y2, ... xn, yn]
	 *
	 * @param {Array} points - array with point objects or pairs
	 * @returns {Array} A new array with transformed points
	 */
	applyToArray: function(points) {

		var i = 0, p, l,
			mxPoints = [];

		if (typeof points[0] === 'number') {

			l = points.length;

			while(i < l) {
				p = this.applyToPoint(points[i++], points[i++]);
				mxPoints.push(p.x, p.y);
			}
		}
		else {
			while(p = points[i++]) {
				mxPoints.push(this.applyToPoint(p.x, p.y));
			}
		}

		return mxPoints
	},

	/**
	 * Apply current matrix to a typed array with point pairs. Although
	 * the input array may be an ordinary array, this method is intended
	 * for more performant use where typed arrays are used. The returned
	 * array is regardless always returned as a `Float32Array`.
	 *
	 * @param {*} points - (typed) array with point pairs [x1, y1, ..., xn, yn]
	 * @param {boolean} [use64=false] - use Float64Array instead of Float32Array
	 * @returns {*} A new typed array with transformed points
	 */
	applyToTypedArray: function(points, use64) {

		var i = 0, p,
			l = points.length,
			mxPoints = use64 ? new Float64Array(l) : new Float32Array(l);

		while(i < l) {
			p = this.applyToPoint(points[i], points[i + 1]);
			mxPoints[i++] = p.x;
			mxPoints[i++] = p.y;
		}

		return mxPoints
	},

	/**
	 * Apply to any canvas 2D context object. This does not affect the
	 * context that optionally was referenced in constructor unless it is
	 * the same context.
	 *
	 * @param {CanvasRenderingContext2D} context - target context
	 * @returns {Matrix}
	 */
	applyToContext: function(context) {
		var me = this;
		context.setTransform(me.a, me.b, me.c, me.d, me.e, me.f);
		return me
	},

	/**
	 * Returns true if matrix is an identity matrix (no transforms applied).
	 * @returns {boolean}
	 */
	isIdentity: function() {
		var me = this;
		return me._q(me.a, 1) &&
			me._q(me.b, 0) &&
			me._q(me.c, 0) &&
			me._q(me.d, 1) &&
			me._q(me.e, 0) &&
			me._q(me.f, 0)
	},

	/**
	 * Returns true if matrix is invertible
	 * @returns {boolean}
	 */
	isInvertible: function() {
		return !this._q(this.determinant(), 0)
	},

	/**
	 * The method is intended for situations where scale is accumulated
	 * via multiplications, to detect situations where scale becomes
	 * "trapped" with a value of zero. And in which case scale must be
	 * set explicitly to a non-zero value.
	 *
	 * @returns {boolean}
	 */
	isValid: function() {
		return !(this.a * this.d)
	},

	/**
	 * Compares current matrix with another matrix. Returns true if equal
	 * (within epsilon tolerance).
	 * @param {Matrix|SVGMatrix} m - matrix to compare this matrix with
	 * @returns {boolean}
	 */
	isEqual: function(m) {

		var me = this,
			q = me._q;

		return  q(me.a, m.a) &&
				q(me.b, m.b) &&
				q(me.c, m.c) &&
				q(me.d, m.d) &&
				q(me.e, m.e) &&
				q(me.f, m.f)
	},

	/**
	 * Clones current instance and returning a new matrix.
	 * @param {boolean} [noContext=false] don't clone context reference if true
	 * @returns {Matrix} - a new Matrix instance with identical transformations as this instance
	 */
	clone: function(noContext) {
		return new Matrix(noContext ? null : this.context).multiply(this)
	},

	/**
	 * Returns an array with current matrix values.
	 * @returns {Array}
	 */
	toArray: function() {
		var me = this;
		return [me.a, me.b, me.c, me.d, me.e, me.f]
	},

	/**
	 * Returns a binary typed array, either as 32-bit (default) or
	 * 64-bit.
	 * @param {boolean} [use64=false] chose whether to use 32-bit or 64-bit typed array
	 * @returns {*}
	 */
	toTypedArray: function(use64) {

		var a  = use64 ? new Float64Array(6) : new Float32Array(6),
			me = this;

		a[0] = me.a;
		a[1] = me.b;
		a[2] = me.c;
		a[3] = me.d;
		a[4] = me.e;
		a[5] = me.f;

		return a
	},

	/**
	 * Generates a string that can be used with CSS `transform`.
	 * @example
	 *     element.style.transform = m.toCSS();
	 * @returns {string}
	 */
	toCSS: function() {
		return "matrix(" + this.toArray() + ")"
	},

	/**
	 * Generates a `matrix3d()` string that can be used with CSS `transform`.
	 * Although the matrix is for 2D use you may see performance benefits
	 * on some devices using a 3D CSS transform instead of a 2D.
	 * @example
	 *     element.style.transform = m.toCSS3D();
	 * @returns {string}
	 */
	toCSS3D: function() {
		var me = this;
		return "matrix3d(" + me.a + "," + me.b + ",0,0," + me.c + "," + me.d + ",0,0,0,0,1,0," + me.e + "," + me.f + ",0,1)"
	},

	/**
	 * Returns a JSON compatible string of current matrix.
	 * @returns {string}
	 */
	toJSON: function() {
		var me = this;
		return '{"a":' + me.a + ',"b":' + me.b + ',"c":' + me.c + ',"d":' + me.d + ',"e":' + me.e + ',"f":' + me.f + '}'
	},

	/**
	 * Returns a string with current matrix as comma-separated list.
	 * @param {number} [fixLen=4] - truncate decimal values to number of digits
	 * @returns {string}
	 */
	toString: function(fixLen) {
		var me = this;
		fixLen = fixLen || 4;
		return 	 "a=" + me.a.toFixed(fixLen) +
				" b=" + me.b.toFixed(fixLen) +
				" c=" + me.c.toFixed(fixLen) +
				" d=" + me.d.toFixed(fixLen) +
				" e=" + me.e.toFixed(fixLen) +
				" f=" + me.f.toFixed(fixLen)
	},

	/**
	 * Returns a string with current matrix as comma-separated values
	 * string with line-end (CR+LF).
	 * @returns {string}
	 */
	toCSV: function() {
		return this.toArray().join() + "\r\n"
	},

	/**
	 * Convert current matrix into a `DOMMatrix`. If `DOMMatrix` is not
	 * supported, a `null` is returned.
	 *
	 * @returns {DOMMatrix}
	 * @see {@link https://drafts.fxtf.org/geometry/#dommatrix|MDN / SVGMatrix}
	 */
	toDOMMatrix: function() {
		var m = null;
		if ("DOMMatrix" in window) {
			m = new DOMMatrix();
			m.a = this.a;
			m.b = this.b;
			m.c = this.c;
			m.d = this.d;
			m.e = this.e;
			m.f = this.f;
		}
		return m
	},

	/**
	 * Convert current matrix into a `SVGMatrix`. If `SVGMatrix` is not
	 * supported, a `null` is returned.
	 *
	 * Note: BETA
	 *
	 * @returns {SVGMatrix}
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SVGMatrix|MDN / SVGMatrix}
	 */
	toSVGMatrix: function() {

		// as we can not set transforms directly on SVG matrices we need
		// to decompose our own matrix first:
		var dc = this.decompose(),
			translate = dc.translate,
			scale = dc.scale,
			skew = dc.skew,
			eq = this._q,
			svgMatrix = document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGMatrix();

		if (!svgMatrix) return null;

		// apply transformations in the correct order (see decompose()), QR: translate -> rotate -> scale -> skew
		svgMatrix = svgMatrix.translate(translate.x, translate.y);
		svgMatrix = svgMatrix.rotate(dc.rotation / Math.PI * 180);		// SVGMatrix uses degrees
		svgMatrix = svgMatrix.scaleNonUniform(scale.x, scale.y);

		if (!eq(0, skew.x))
			svgMatrix = svgMatrix.skewX(skew.x);

		if (!eq(0, skew.y))
			svgMatrix = svgMatrix.skewY(skew.y);

		return svgMatrix
	},

	/**
	 * Compares floating point values with some tolerance (epsilon)
	 * @param {number} f1 - float 1
	 * @param {number} f2 - float 2
	 * @returns {boolean}
	 * @private
	 */
	_q: function(f1, f2) {
		return Math.abs(f1 - f2) < 1e-14
	},

	/**
	 * Apply current absolute matrix to context if defined, to sync it.
	 * @returns {Matrix}
	 * @private
	 */
	_x: function() {
		var me = this;
		if (me.context)
			me.context.setTransform(me.a, me.b, me.c, me.d, me.e, me.f);
		return me
	}
};

// Node support
if (typeof exports !== "undefined") exports.Matrix = Matrix;

},{}],23:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],24:[function(require,module,exports){
exports = module.exports = Victor;

/**
 * # Victor - A JavaScript 2D vector class with methods for common vector operations
 */

/**
 * Constructor. Will also work without the `new` keyword
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = Victor(42, 1337);
 *
 * @param {Number} x Value of the x axis
 * @param {Number} y Value of the y axis
 * @return {Victor}
 * @api public
 */
function Victor (x, y) {
	if (!(this instanceof Victor)) {
		return new Victor(x, y);
	}

	/**
	 * The X axis
	 *
	 * ### Examples:
	 *     var vec = new Victor.fromArray(42, 21);
	 *
	 *     vec.x;
	 *     // => 42
	 *
	 * @api public
	 */
	this.x = x || 0;

	/**
	 * The Y axis
	 *
	 * ### Examples:
	 *     var vec = new Victor.fromArray(42, 21);
	 *
	 *     vec.y;
	 *     // => 21
	 *
	 * @api public
	 */
	this.y = y || 0;
};

/**
 * # Static
 */

/**
 * Creates a new instance from an array
 *
 * ### Examples:
 *     var vec = Victor.fromArray([42, 21]);
 *
 *     vec.toString();
 *     // => x:42, y:21
 *
 * @name Victor.fromArray
 * @param {Array} array Array with the x and y values at index 0 and 1 respectively
 * @return {Victor} The new instance
 * @api public
 */
Victor.fromArray = function (arr) {
	return new Victor(arr[0] || 0, arr[1] || 0);
};

/**
 * Creates a new instance from an object
 *
 * ### Examples:
 *     var vec = Victor.fromObject({ x: 42, y: 21 });
 *
 *     vec.toString();
 *     // => x:42, y:21
 *
 * @name Victor.fromObject
 * @param {Object} obj Object with the values for x and y
 * @return {Victor} The new instance
 * @api public
 */
Victor.fromObject = function (obj) {
	return new Victor(obj.x || 0, obj.y || 0);
};

/**
 * # Manipulation
 *
 * These functions are chainable.
 */

/**
 * Adds another vector's X axis to this one
 *
 * ### Examples:
 *     var vec1 = new Victor(10, 10);
 *     var vec2 = new Victor(20, 30);
 *
 *     vec1.addX(vec2);
 *     vec1.toString();
 *     // => x:30, y:10
 *
 * @param {Victor} vector The other vector you want to add to this one
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.addX = function (vec) {
	this.x += vec.x;
	return this;
};

/**
 * Adds another vector's Y axis to this one
 *
 * ### Examples:
 *     var vec1 = new Victor(10, 10);
 *     var vec2 = new Victor(20, 30);
 *
 *     vec1.addY(vec2);
 *     vec1.toString();
 *     // => x:10, y:40
 *
 * @param {Victor} vector The other vector you want to add to this one
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.addY = function (vec) {
	this.y += vec.y;
	return this;
};

/**
 * Adds another vector to this one
 *
 * ### Examples:
 *     var vec1 = new Victor(10, 10);
 *     var vec2 = new Victor(20, 30);
 *
 *     vec1.add(vec2);
 *     vec1.toString();
 *     // => x:30, y:40
 *
 * @param {Victor} vector The other vector you want to add to this one
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.add = function (vec) {
	this.x += vec.x;
	this.y += vec.y;
	return this;
};

/**
 * Adds the given scalar to both vector axis
 *
 * ### Examples:
 *     var vec = new Victor(1, 2);
 *
 *     vec.addScalar(2);
 *     vec.toString();
 *     // => x: 3, y: 4
 *
 * @param {Number} scalar The scalar to add
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.addScalar = function (scalar) {
	this.x += scalar;
	this.y += scalar;
	return this;
};

/**
 * Adds the given scalar to the X axis
 *
 * ### Examples:
 *     var vec = new Victor(1, 2);
 *
 *     vec.addScalarX(2);
 *     vec.toString();
 *     // => x: 3, y: 2
 *
 * @param {Number} scalar The scalar to add
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.addScalarX = function (scalar) {
	this.x += scalar;
	return this;
};

/**
 * Adds the given scalar to the Y axis
 *
 * ### Examples:
 *     var vec = new Victor(1, 2);
 *
 *     vec.addScalarY(2);
 *     vec.toString();
 *     // => x: 1, y: 4
 *
 * @param {Number} scalar The scalar to add
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.addScalarY = function (scalar) {
	this.y += scalar;
	return this;
};

/**
 * Subtracts the X axis of another vector from this one
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(20, 30);
 *
 *     vec1.subtractX(vec2);
 *     vec1.toString();
 *     // => x:80, y:50
 *
 * @param {Victor} vector The other vector you want subtract from this one
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.subtractX = function (vec) {
	this.x -= vec.x;
	return this;
};

/**
 * Subtracts the Y axis of another vector from this one
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(20, 30);
 *
 *     vec1.subtractY(vec2);
 *     vec1.toString();
 *     // => x:100, y:20
 *
 * @param {Victor} vector The other vector you want subtract from this one
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.subtractY = function (vec) {
	this.y -= vec.y;
	return this;
};

/**
 * Subtracts another vector from this one
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(20, 30);
 *
 *     vec1.subtract(vec2);
 *     vec1.toString();
 *     // => x:80, y:20
 *
 * @param {Victor} vector The other vector you want subtract from this one
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.subtract = function (vec) {
	this.x -= vec.x;
	this.y -= vec.y;
	return this;
};

/**
 * Subtracts the given scalar from both axis
 *
 * ### Examples:
 *     var vec = new Victor(100, 200);
 *
 *     vec.subtractScalar(20);
 *     vec.toString();
 *     // => x: 80, y: 180
 *
 * @param {Number} scalar The scalar to subtract
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.subtractScalar = function (scalar) {
	this.x -= scalar;
	this.y -= scalar;
	return this;
};

/**
 * Subtracts the given scalar from the X axis
 *
 * ### Examples:
 *     var vec = new Victor(100, 200);
 *
 *     vec.subtractScalarX(20);
 *     vec.toString();
 *     // => x: 80, y: 200
 *
 * @param {Number} scalar The scalar to subtract
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.subtractScalarX = function (scalar) {
	this.x -= scalar;
	return this;
};

/**
 * Subtracts the given scalar from the Y axis
 *
 * ### Examples:
 *     var vec = new Victor(100, 200);
 *
 *     vec.subtractScalarY(20);
 *     vec.toString();
 *     // => x: 100, y: 180
 *
 * @param {Number} scalar The scalar to subtract
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.subtractScalarY = function (scalar) {
	this.y -= scalar;
	return this;
};

/**
 * Divides the X axis by the x component of given vector
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *     var vec2 = new Victor(2, 0);
 *
 *     vec.divideX(vec2);
 *     vec.toString();
 *     // => x:50, y:50
 *
 * @param {Victor} vector The other vector you want divide by
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.divideX = function (vector) {
	this.x /= vector.x;
	return this;
};

/**
 * Divides the Y axis by the y component of given vector
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *     var vec2 = new Victor(0, 2);
 *
 *     vec.divideY(vec2);
 *     vec.toString();
 *     // => x:100, y:25
 *
 * @param {Victor} vector The other vector you want divide by
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.divideY = function (vector) {
	this.y /= vector.y;
	return this;
};

/**
 * Divides both vector axis by a axis values of given vector
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *     var vec2 = new Victor(2, 2);
 *
 *     vec.divide(vec2);
 *     vec.toString();
 *     // => x:50, y:25
 *
 * @param {Victor} vector The vector to divide by
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.divide = function (vector) {
	this.x /= vector.x;
	this.y /= vector.y;
	return this;
};

/**
 * Divides both vector axis by the given scalar value
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.divideScalar(2);
 *     vec.toString();
 *     // => x:50, y:25
 *
 * @param {Number} The scalar to divide by
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.divideScalar = function (scalar) {
	if (scalar !== 0) {
		this.x /= scalar;
		this.y /= scalar;
	} else {
		this.x = 0;
		this.y = 0;
	}

	return this;
};

/**
 * Divides the X axis by the given scalar value
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.divideScalarX(2);
 *     vec.toString();
 *     // => x:50, y:50
 *
 * @param {Number} The scalar to divide by
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.divideScalarX = function (scalar) {
	if (scalar !== 0) {
		this.x /= scalar;
	} else {
		this.x = 0;
	}
	return this;
};

/**
 * Divides the Y axis by the given scalar value
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.divideScalarY(2);
 *     vec.toString();
 *     // => x:100, y:25
 *
 * @param {Number} The scalar to divide by
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.divideScalarY = function (scalar) {
	if (scalar !== 0) {
		this.y /= scalar;
	} else {
		this.y = 0;
	}
	return this;
};

/**
 * Inverts the X axis
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.invertX();
 *     vec.toString();
 *     // => x:-100, y:50
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.invertX = function () {
	this.x *= -1;
	return this;
};

/**
 * Inverts the Y axis
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.invertY();
 *     vec.toString();
 *     // => x:100, y:-50
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.invertY = function () {
	this.y *= -1;
	return this;
};

/**
 * Inverts both axis
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.invert();
 *     vec.toString();
 *     // => x:-100, y:-50
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.invert = function () {
	this.invertX();
	this.invertY();
	return this;
};

/**
 * Multiplies the X axis by X component of given vector
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *     var vec2 = new Victor(2, 0);
 *
 *     vec.multiplyX(vec2);
 *     vec.toString();
 *     // => x:200, y:50
 *
 * @param {Victor} vector The vector to multiply the axis with
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.multiplyX = function (vector) {
	this.x *= vector.x;
	return this;
};

/**
 * Multiplies the Y axis by Y component of given vector
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *     var vec2 = new Victor(0, 2);
 *
 *     vec.multiplyX(vec2);
 *     vec.toString();
 *     // => x:100, y:100
 *
 * @param {Victor} vector The vector to multiply the axis with
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.multiplyY = function (vector) {
	this.y *= vector.y;
	return this;
};

/**
 * Multiplies both vector axis by values from a given vector
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *     var vec2 = new Victor(2, 2);
 *
 *     vec.multiply(vec2);
 *     vec.toString();
 *     // => x:200, y:100
 *
 * @param {Victor} vector The vector to multiply by
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.multiply = function (vector) {
	this.x *= vector.x;
	this.y *= vector.y;
	return this;
};

/**
 * Multiplies both vector axis by the given scalar value
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.multiplyScalar(2);
 *     vec.toString();
 *     // => x:200, y:100
 *
 * @param {Number} The scalar to multiply by
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.multiplyScalar = function (scalar) {
	this.x *= scalar;
	this.y *= scalar;
	return this;
};

/**
 * Multiplies the X axis by the given scalar
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.multiplyScalarX(2);
 *     vec.toString();
 *     // => x:200, y:50
 *
 * @param {Number} The scalar to multiply the axis with
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.multiplyScalarX = function (scalar) {
	this.x *= scalar;
	return this;
};

/**
 * Multiplies the Y axis by the given scalar
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.multiplyScalarY(2);
 *     vec.toString();
 *     // => x:100, y:100
 *
 * @param {Number} The scalar to multiply the axis with
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.multiplyScalarY = function (scalar) {
	this.y *= scalar;
	return this;
};

/**
 * Normalize
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.normalize = function () {
	var length = this.length();

	if (length === 0) {
		this.x = 1;
		this.y = 0;
	} else {
		this.divide(Victor(length, length));
	}
	return this;
};

Victor.prototype.norm = Victor.prototype.normalize;

/**
 * If the absolute vector axis is greater than `max`, multiplies the axis by `factor`
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.limit(80, 0.9);
 *     vec.toString();
 *     // => x:90, y:50
 *
 * @param {Number} max The maximum value for both x and y axis
 * @param {Number} factor Factor by which the axis are to be multiplied with
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.limit = function (max, factor) {
	if (Math.abs(this.x) > max){ this.x *= factor; }
	if (Math.abs(this.y) > max){ this.y *= factor; }
	return this;
};

/**
 * Randomizes both vector axis with a value between 2 vectors
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.randomize(new Victor(50, 60), new Victor(70, 80`));
 *     vec.toString();
 *     // => x:67, y:73
 *
 * @param {Victor} topLeft first vector
 * @param {Victor} bottomRight second vector
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.randomize = function (topLeft, bottomRight) {
	this.randomizeX(topLeft, bottomRight);
	this.randomizeY(topLeft, bottomRight);

	return this;
};

/**
 * Randomizes the y axis with a value between 2 vectors
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.randomizeX(new Victor(50, 60), new Victor(70, 80`));
 *     vec.toString();
 *     // => x:55, y:50
 *
 * @param {Victor} topLeft first vector
 * @param {Victor} bottomRight second vector
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.randomizeX = function (topLeft, bottomRight) {
	var min = Math.min(topLeft.x, bottomRight.x);
	var max = Math.max(topLeft.x, bottomRight.x);
	this.x = random(min, max);
	return this;
};

/**
 * Randomizes the y axis with a value between 2 vectors
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.randomizeY(new Victor(50, 60), new Victor(70, 80`));
 *     vec.toString();
 *     // => x:100, y:66
 *
 * @param {Victor} topLeft first vector
 * @param {Victor} bottomRight second vector
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.randomizeY = function (topLeft, bottomRight) {
	var min = Math.min(topLeft.y, bottomRight.y);
	var max = Math.max(topLeft.y, bottomRight.y);
	this.y = random(min, max);
	return this;
};

/**
 * Randomly randomizes either axis between 2 vectors
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.randomizeAny(new Victor(50, 60), new Victor(70, 80));
 *     vec.toString();
 *     // => x:100, y:77
 *
 * @param {Victor} topLeft first vector
 * @param {Victor} bottomRight second vector
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.randomizeAny = function (topLeft, bottomRight) {
	if (!! Math.round(Math.random())) {
		this.randomizeX(topLeft, bottomRight);
	} else {
		this.randomizeY(topLeft, bottomRight);
	}
	return this;
};

/**
 * Rounds both axis to an integer value
 *
 * ### Examples:
 *     var vec = new Victor(100.2, 50.9);
 *
 *     vec.unfloat();
 *     vec.toString();
 *     // => x:100, y:51
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.unfloat = function () {
	this.x = Math.round(this.x);
	this.y = Math.round(this.y);
	return this;
};

/**
 * Rounds both axis to a certain precision
 *
 * ### Examples:
 *     var vec = new Victor(100.2, 50.9);
 *
 *     vec.unfloat();
 *     vec.toString();
 *     // => x:100, y:51
 *
 * @param {Number} Precision (default: 8)
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.toFixed = function (precision) {
	if (typeof precision === 'undefined') { precision = 8; }
	this.x = this.x.toFixed(precision);
	this.y = this.y.toFixed(precision);
	return this;
};

/**
 * Performs a linear blend / interpolation of the X axis towards another vector
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 100);
 *     var vec2 = new Victor(200, 200);
 *
 *     vec1.mixX(vec2, 0.5);
 *     vec.toString();
 *     // => x:150, y:100
 *
 * @param {Victor} vector The other vector
 * @param {Number} amount The blend amount (optional, default: 0.5)
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.mixX = function (vec, amount) {
	if (typeof amount === 'undefined') {
		amount = 0.5;
	}

	this.x = (1 - amount) * this.x + amount * vec.x;
	return this;
};

/**
 * Performs a linear blend / interpolation of the Y axis towards another vector
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 100);
 *     var vec2 = new Victor(200, 200);
 *
 *     vec1.mixY(vec2, 0.5);
 *     vec.toString();
 *     // => x:100, y:150
 *
 * @param {Victor} vector The other vector
 * @param {Number} amount The blend amount (optional, default: 0.5)
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.mixY = function (vec, amount) {
	if (typeof amount === 'undefined') {
		amount = 0.5;
	}

	this.y = (1 - amount) * this.y + amount * vec.y;
	return this;
};

/**
 * Performs a linear blend / interpolation towards another vector
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 100);
 *     var vec2 = new Victor(200, 200);
 *
 *     vec1.mix(vec2, 0.5);
 *     vec.toString();
 *     // => x:150, y:150
 *
 * @param {Victor} vector The other vector
 * @param {Number} amount The blend amount (optional, default: 0.5)
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.mix = function (vec, amount) {
	this.mixX(vec, amount);
	this.mixY(vec, amount);
	return this;
};

/**
 * # Products
 */

/**
 * Creates a clone of this vector
 *
 * ### Examples:
 *     var vec1 = new Victor(10, 10);
 *     var vec2 = vec1.clone();
 *
 *     vec2.toString();
 *     // => x:10, y:10
 *
 * @return {Victor} A clone of the vector
 * @api public
 */
Victor.prototype.clone = function () {
	return new Victor(this.x, this.y);
};

/**
 * Copies another vector's X component in to its own
 *
 * ### Examples:
 *     var vec1 = new Victor(10, 10);
 *     var vec2 = new Victor(20, 20);
 *     var vec2 = vec1.copyX(vec1);
 *
 *     vec2.toString();
 *     // => x:20, y:10
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.copyX = function (vec) {
	this.x = vec.x;
	return this;
};

/**
 * Copies another vector's Y component in to its own
 *
 * ### Examples:
 *     var vec1 = new Victor(10, 10);
 *     var vec2 = new Victor(20, 20);
 *     var vec2 = vec1.copyY(vec1);
 *
 *     vec2.toString();
 *     // => x:10, y:20
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.copyY = function (vec) {
	this.y = vec.y;
	return this;
};

/**
 * Copies another vector's X and Y components in to its own
 *
 * ### Examples:
 *     var vec1 = new Victor(10, 10);
 *     var vec2 = new Victor(20, 20);
 *     var vec2 = vec1.copy(vec1);
 *
 *     vec2.toString();
 *     // => x:20, y:20
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.copy = function (vec) {
	this.copyX(vec);
	this.copyY(vec);
	return this;
};

/**
 * Sets the vector to zero (0,0)
 *
 * ### Examples:
 *     var vec1 = new Victor(10, 10);
 *		 var1.zero();
 *     vec1.toString();
 *     // => x:0, y:0
 *
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.zero = function () {
	this.x = this.y = 0;
	return this;
};

/**
 * Calculates the dot product of this vector and another
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(200, 60);
 *
 *     vec1.dot(vec2);
 *     // => 23000
 *
 * @param {Victor} vector The second vector
 * @return {Number} Dot product
 * @api public
 */
Victor.prototype.dot = function (vec2) {
	return this.x * vec2.x + this.y * vec2.y;
};

Victor.prototype.cross = function (vec2) {
	return (this.x * vec2.y ) - (this.y * vec2.x );
};

/**
 * Projects a vector onto another vector, setting itself to the result.
 *
 * ### Examples:
 *     var vec = new Victor(100, 0);
 *     var vec2 = new Victor(100, 100);
 *
 *     vec.projectOnto(vec2);
 *     vec.toString();
 *     // => x:50, y:50
 *
 * @param {Victor} vector The other vector you want to project this vector onto
 * @return {Victor} `this` for chaining capabilities
 * @api public
 */
Victor.prototype.projectOnto = function (vec2) {
    var coeff = ( (this.x * vec2.x)+(this.y * vec2.y) ) / ((vec2.x*vec2.x)+(vec2.y*vec2.y));
    this.x = coeff * vec2.x;
    this.y = coeff * vec2.y;
    return this;
};


Victor.prototype.horizontalAngle = function () {
	return Math.atan2(this.y, this.x);
};

Victor.prototype.horizontalAngleDeg = function () {
	return radian2degrees(this.horizontalAngle());
};

Victor.prototype.verticalAngle = function () {
	return Math.atan2(this.x, this.y);
};

Victor.prototype.verticalAngleDeg = function () {
	return radian2degrees(this.verticalAngle());
};

Victor.prototype.angle = Victor.prototype.horizontalAngle;
Victor.prototype.angleDeg = Victor.prototype.horizontalAngleDeg;
Victor.prototype.direction = Victor.prototype.horizontalAngle;

Victor.prototype.rotate = function (angle) {
	var nx = (this.x * Math.cos(angle)) - (this.y * Math.sin(angle));
	var ny = (this.x * Math.sin(angle)) + (this.y * Math.cos(angle));

	this.x = nx;
	this.y = ny;

	return this;
};

Victor.prototype.rotateDeg = function (angle) {
	angle = degrees2radian(angle);
	return this.rotate(angle);
};

Victor.prototype.rotateTo = function(rotation) {
	return this.rotate(rotation-this.angle());
};

Victor.prototype.rotateToDeg = function(rotation) {
	rotation = degrees2radian(rotation);
	return this.rotateTo(rotation);
};

Victor.prototype.rotateBy = function (rotation) {
	var angle = this.angle() + rotation;

	return this.rotate(angle);
};

Victor.prototype.rotateByDeg = function (rotation) {
	rotation = degrees2radian(rotation);
	return this.rotateBy(rotation);
};

/**
 * Calculates the distance of the X axis between this vector and another
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(200, 60);
 *
 *     vec1.distanceX(vec2);
 *     // => -100
 *
 * @param {Victor} vector The second vector
 * @return {Number} Distance
 * @api public
 */
Victor.prototype.distanceX = function (vec) {
	return this.x - vec.x;
};

/**
 * Same as `distanceX()` but always returns an absolute number
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(200, 60);
 *
 *     vec1.absDistanceX(vec2);
 *     // => 100
 *
 * @param {Victor} vector The second vector
 * @return {Number} Absolute distance
 * @api public
 */
Victor.prototype.absDistanceX = function (vec) {
	return Math.abs(this.distanceX(vec));
};

/**
 * Calculates the distance of the Y axis between this vector and another
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(200, 60);
 *
 *     vec1.distanceY(vec2);
 *     // => -10
 *
 * @param {Victor} vector The second vector
 * @return {Number} Distance
 * @api public
 */
Victor.prototype.distanceY = function (vec) {
	return this.y - vec.y;
};

/**
 * Same as `distanceY()` but always returns an absolute number
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(200, 60);
 *
 *     vec1.distanceY(vec2);
 *     // => 10
 *
 * @param {Victor} vector The second vector
 * @return {Number} Absolute distance
 * @api public
 */
Victor.prototype.absDistanceY = function (vec) {
	return Math.abs(this.distanceY(vec));
};

/**
 * Calculates the euclidean distance between this vector and another
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(200, 60);
 *
 *     vec1.distance(vec2);
 *     // => 100.4987562112089
 *
 * @param {Victor} vector The second vector
 * @return {Number} Distance
 * @api public
 */
Victor.prototype.distance = function (vec) {
	return Math.sqrt(this.distanceSq(vec));
};

/**
 * Calculates the squared euclidean distance between this vector and another
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(200, 60);
 *
 *     vec1.distanceSq(vec2);
 *     // => 10100
 *
 * @param {Victor} vector The second vector
 * @return {Number} Distance
 * @api public
 */
Victor.prototype.distanceSq = function (vec) {
	var dx = this.distanceX(vec),
		dy = this.distanceY(vec);

	return dx * dx + dy * dy;
};

/**
 * Calculates the length or magnitude of the vector
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.length();
 *     // => 111.80339887498948
 *
 * @return {Number} Length / Magnitude
 * @api public
 */
Victor.prototype.length = function () {
	return Math.sqrt(this.lengthSq());
};

/**
 * Squared length / magnitude
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *
 *     vec.lengthSq();
 *     // => 12500
 *
 * @return {Number} Length / Magnitude
 * @api public
 */
Victor.prototype.lengthSq = function () {
	return this.x * this.x + this.y * this.y;
};

Victor.prototype.magnitude = Victor.prototype.length;

/**
 * Returns a true if vector is (0, 0)
 *
 * ### Examples:
 *     var vec = new Victor(100, 50);
 *     vec.zero();
 *
 *     // => true
 *
 * @return {Boolean}
 * @api public
 */
Victor.prototype.isZero = function() {
	return this.x === 0 && this.y === 0;
};

/**
 * Returns a true if this vector is the same as another
 *
 * ### Examples:
 *     var vec1 = new Victor(100, 50);
 *     var vec2 = new Victor(100, 50);
 *     vec1.isEqualTo(vec2);
 *
 *     // => true
 *
 * @return {Boolean}
 * @api public
 */
Victor.prototype.isEqualTo = function(vec2) {
	return this.x === vec2.x && this.y === vec2.y;
};

/**
 * # Utility Methods
 */

/**
 * Returns an string representation of the vector
 *
 * ### Examples:
 *     var vec = new Victor(10, 20);
 *
 *     vec.toString();
 *     // => x:10, y:20
 *
 * @return {String}
 * @api public
 */
Victor.prototype.toString = function () {
	return 'x:' + this.x + ', y:' + this.y;
};

/**
 * Returns an array representation of the vector
 *
 * ### Examples:
 *     var vec = new Victor(10, 20);
 *
 *     vec.toArray();
 *     // => [10, 20]
 *
 * @return {Array}
 * @api public
 */
Victor.prototype.toArray = function () {
	return [ this.x, this.y ];
};

/**
 * Returns an object representation of the vector
 *
 * ### Examples:
 *     var vec = new Victor(10, 20);
 *
 *     vec.toObject();
 *     // => { x: 10, y: 20 }
 *
 * @return {Object}
 * @api public
 */
Victor.prototype.toObject = function () {
	return { x: this.x, y: this.y };
};


var degrees = 180 / Math.PI;

function random (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function radian2degrees (rad) {
	return rad * degrees;
}

function degrees2radian (deg) {
	return deg / degrees;
}

},{}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9jYW1lcmEuanMiLCJqcy9saWIvckFGLmpzIiwianMvbGliL3JlY3RhbmdsZS5qcyIsImpzL2xpYi91dGlscy5qcyIsImpzL21haW4uanMiLCJqcy90eXBlcy9jaGFyYWN0ZXIuanMiLCJqcy90eXBlcy9lbGxpcHNlLmpzIiwianMvdHlwZXMvaW1hZ2UuanMiLCJqcy90eXBlcy9yZWN0LmpzIiwianMvdHlwZXMvcmVnaW9uLmpzIiwianMvdHlwZXMvc29uZy5qcyIsImpzL3R5cGVzL3Nwcml0ZS5qcyIsImpzL3R5cGVzL3RleHQuanMiLCJqcy90eXBlcy90aGluZy5qcyIsImpzL3ZlbmRvci9ib3gyLmpzIiwianMvdmVuZG9yL3ZlY3RvcjIuanMiLCJqcy93b3JsZC5qc29uIiwianMvd29ybGQuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9kZXRlY3Rjc3MvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZGV0ZWN0Y3NzL2xpYi9kZXRlY3RDU1MuanMiLCJub2RlX21vZHVsZXMvdHJhbnNmb3JtYXRpb24tbWF0cml4LWpzL21hdHJpeC5qcyIsIm5vZGVfbW9kdWxlcy91bmRlcnNjb3JlL3VuZGVyc2NvcmUuanMiLCJub2RlX21vZHVsZXMvdmljdG9yL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmVBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbC9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Z0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpO1xudmFyIFZlY3RvcjIgPSByZXF1aXJlKCcuL3ZlbmRvci92ZWN0b3IyLmpzJyk7XG52YXIgQm94MiA9IHJlcXVpcmUoJy4vdmVuZG9yL2JveDIuanMnKTtcblxudmFyIHJBRiA9IHJlcXVpcmUoJy4vbGliL3JBRi5qcycpO1xudmFyIHsgUFJFRklYRURfVFJBTlNGT1JNIH0gPSByZXF1aXJlKCcuL2xpYi91dGlscy5qcycpO1xuXG52YXIgdjEgPSBuZXcgVmVjdG9yMigpO1xudmFyIHYyID0gbmV3IFZlY3RvcjIoKTtcblxudmFyIG9yaWdpbiA9IG5ldyBWZWN0b3IyKCk7XG52YXIgZGVnNDUgPSBNYXRoLlBJIC8gNDtcbnZhciBzY2FsZSA9IG5ldyBWZWN0b3IyKCAxLCAuNSApO1xudmFyIHNjYWxlSW52ID0gbmV3IFZlY3RvcjIoIDEsIDIgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBDYW1lcmEgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICAgIFxuICAgIGNvbnN0cnVjdG9yICggZWxlbWVudCApIHtcbiAgICAgICAgXG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgICB0aGlzLmNlbnRlciA9IG5ldyBWZWN0b3IyKCk7XG4gICAgICAgIHRoaXMudmlld3BvcnQgPSBuZXcgQm94MigpO1xuICAgICAgICB0aGlzLnNjYWxlID0gMTtcblxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ3Jlc2l6ZScsIHRoaXMuc2V0U2l6ZS5iaW5kKHRoaXMpICk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLnNldFNpemUoKTtcbiAgICAgICAgXG4gICAgfVxuICAgIFxuICAgIHNldFNpemUgKCkge1xuICAgICAgICBcbiAgICAgICAgdmFyIHNpemUgPSB2MS5zZXQoIHdpbmRvdy5pbm5lcldpZHRoIC8gdGhpcy5zY2FsZSwgd2luZG93LmlubmVySGVpZ2h0IC8gdGhpcy5zY2FsZSApO1xuICAgICAgICB0aGlzLnZpZXdwb3J0LnNldEZyb21DZW50ZXJBbmRTaXplKCB0aGlzLmNlbnRlciwgc2l6ZSApO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5zdHlsZSgpO1xuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgc2V0Q2VudGVyICggdiApIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBkID0gdjEuY29weSggdiApLnN1YiggdGhpcy5jZW50ZXIgKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuY2VudGVyLmNvcHkoIHYgKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMudmlld3BvcnQudHJhbnNsYXRlKCB2ICk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLnN0eWxlKCk7XG4gICAgICAgIFxuICAgIH1cbiAgICBcbiAgICBtb3ZlQ2VudGVyKCB4LCB5ICkge1xuICAgICAgICBcbiAgICAgICAgdGhpcy5zZXRDZW50ZXIoIHRoaXMuY2VudGVyLmNsb25lKCkuYWRkKCBuZXcgVmVjdG9yMih4LCB5KSApICk7XG4gICAgICAgIFxuICAgIH1cbiAgICBcbiAgICBzZXRTY2FsZSAoIHggKSB7XG4gICAgICAgIFxuICAgICAgICB0aGlzLnNjYWxlID0geDtcbiAgICAgICAgdGhpcy5zZXRTaXplKCk7XG4gICAgICAgIFxuICAgIH1cbiAgICBcbiAgICBzdHlsZSAoKSB7XG4gICAgICAgIFxuICAgICAgICB2YXIgeCA9IC10aGlzLnZpZXdwb3J0Lm1pbi54ICogdGhpcy5zY2FsZTtcbiAgICAgICAgdmFyIHkgPSAtdGhpcy52aWV3cG9ydC5taW4ueSAqIHRoaXMuc2NhbGU7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGVbIFBSRUZJWEVEX1RSQU5TRk9STSBdID0gYHRyYW5zbGF0ZSgke3h9cHgsICR7eX1weCkgc2NhbGUoJHt0aGlzLnNjYWxlfSlgO1xuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgdmlld1RvV29ybGQoIHYgKSB7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdi5jbG9uZSgpXG4gICAgICAgICAgICAubXVsdGlwbHkoIHNjYWxlSW52IClcbiAgICAgICAgICAgIC5yb3RhdGVBcm91bmQoIG9yaWdpbiwgLWRlZzQ1ICk7XG4gICAgICAgIFxuICAgIH1cbiAgICBcbiAgICB3b3JsZFRvVmlldyAoIHYgKSB7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdi5jbG9uZSgpXG4gICAgICAgICAgICAucm90YXRlQXJvdW5kKCBvcmlnaW4sIGRlZzQ1IClcbiAgICAgICAgICAgIC5tdWx0aXBseSggc2NhbGUgKVxuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgc2NyZWVuVG9Xb3JsZCAoIHYgKSB7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdi5jbG9uZSgpXG4gICAgICAgIFxuICAgIH1cbiAgICBcbiAgICBnZXRXb3JsZENlbnRlcigpe1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMudmlld1RvV29ybGQoIHRoaXMuY2VudGVyICk7XG4gICAgICAgIFxuICAgIH1cbiAgICBcbiAgICAvLyBmb2xsb3cgKCB0aGluZyApIHtcbiAgICAgICAgXG4gICAgLy8gICAgIHJBRi5zdG9wKCAnY2FtZXJhTW92ZScgKTtcbiAgICAgICAgXG4gICAgLy8gICAgIHJBRi5zdGFydCggJ2NhbWVyYU1vdmUnLCAoIG5vdywgZFQgKSA9PiB7XG4gICAgICAgICAgICBcbiAgICAvLyAgICAgICAgIHZhciBkZXN0aW5hdGlvbiA9IHRoaXMud29ybGRUb1ZpZXcoIHRoaW5nLnBvc2l0aW9uICk7XG4gICAgLy8gICAgICAgICB2YXIgbmV4dCA9IHYxLmNvcHkoIHRoaXMuY2VudGVyICkubGVycCggZGVzdGluYXRpb24sIC4wNCApO1xuICAgICAgICAgICAgXG4gICAgLy8gICAgICAgICB0aGlzLnNldENlbnRlciggbmV4dCApO1xuICAgICAgICAgICAgXG4gICAgLy8gICAgIH0pO1xuICAgICAgICBcbiAgICAvLyB9XG4gICAgXG4gICAgcmVuZGVyKCB3b3JsZCApIHtcbiAgICAgICAgXG4gICAgICAgIHZhciByZW5kZXJPYmplY3QgPSBvYmplY3QgPT4ge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiggb2JqZWN0LnBvc2l0aW9uTmVlZHNVcGRhdGUgKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYoIG9iamVjdC5pc1Nwcml0ZSApIHtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHZhciB7eCwgeX0gPSB0aGlzLndvcmxkVG9WaWV3KCBvYmplY3QucG9zaXRpb24gKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGh3ID0gb2JqZWN0LnNpemUueCAvIDI7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoID0gb2JqZWN0LnNpemUueTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdC5zcHJpdGVFbGVtZW50LnN0eWxlWyBQUkVGSVhFRF9UUkFOU0ZPUk0gXSA9IGB0cmFuc2xhdGUoJHt4IC0gaHd9cHgsICR7eSAtIGh9cHgpYDtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmKCBvYmplY3QuZWxlbWVudCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHt4LCB5fSA9IG9iamVjdC5wb3NpdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0LmVsZW1lbnQuc3R5bGVbIFBSRUZJWEVEX1RSQU5TRk9STSBdID0gYHRyYW5zbGF0ZSgke3h9cHgsICR7eX1weClgO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgb2JqZWN0LmNoaWxkcmVuLmZvckVhY2goIHJlbmRlck9iamVjdCApO1xuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHdvcmxkLnJlZ2lvbnMuZm9yRWFjaCggcmVuZGVyT2JqZWN0ICk7XG4gICAgICAgIFxuICAgIH1cbiAgICBcbn07IiwiLy8gaHR0cDovL3BhdWxpcmlzaC5jb20vMjAxMS9yZXF1ZXN0YW5pbWF0aW9uZnJhbWUtZm9yLXNtYXJ0LWFuaW1hdGluZy9cbi8vIGh0dHA6Ly9teS5vcGVyYS5jb20vZW1vbGxlci9ibG9nLzIwMTEvMTIvMjAvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1lci1hbmltYXRpbmdcblxuLy8gcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHBvbHlmaWxsIGJ5IEVyaWsgTcO2bGxlci4gZml4ZXMgZnJvbSBQYXVsIElyaXNoIGFuZCBUaW5vIFppamRlbFxuXG4vLyBNSVQgbGljZW5zZVxuXG4oZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxhc3RUaW1lID0gMDtcbiAgICB2YXIgdmVuZG9ycyA9IFsnbXMnLCAnbW96JywgJ3dlYmtpdCcsICdvJ107XG4gICAgZm9yKHZhciB4ID0gMDsgeCA8IHZlbmRvcnMubGVuZ3RoICYmICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lOyArK3gpIHtcbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2ZW5kb3JzW3hdKydSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZlbmRvcnNbeF0rJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ10gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHdpbmRvd1t2ZW5kb3JzW3hdKydDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgICB9XG4gXG4gICAgaWYgKCF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKVxuICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2ssIGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBjdXJyVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgdmFyIHRpbWVUb0NhbGwgPSBNYXRoLm1heCgwLCAxNiAtIChjdXJyVGltZSAtIGxhc3RUaW1lKSk7XG4gICAgICAgICAgICB2YXIgaWQgPSB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2soY3VyclRpbWUgKyB0aW1lVG9DYWxsKTsgfSwgXG4gICAgICAgICAgICAgIHRpbWVUb0NhbGwpO1xuICAgICAgICAgICAgbGFzdFRpbWUgPSBjdXJyVGltZSArIHRpbWVUb0NhbGw7XG4gICAgICAgICAgICByZXR1cm4gaWQ7XG4gICAgICAgIH07XG4gXG4gICAgaWYgKCF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpXG4gICAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoaWQpO1xuICAgICAgICB9O1xufSgpKTtcblx0XG52YXIgZnVuY3MgPSB7fTtcblxudmFyIGZ1bmNDb3VudCA9IDA7XG5cbnZhciBmcmFtZSA9IGZhbHNlO1xuXG52YXIgdGhlbjtcblxuZnVuY3Rpb24gdGljaygpe1xuXHRcblx0ZnJhbWUgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljayk7XG5cdFxuXHR2YXIgbm93ID0gRGF0ZS5ub3coKTtcblx0dmFyIGRUID0gbm93IC0gdGhlbjtcblx0XG5cdGZvcih2YXIgbmFtZSBpbiBmdW5jcyl7XG5cdFx0aWYoIGZ1bmNzW25hbWVdKG5vdywgZFQpID09PSBmYWxzZSApe1xuXHRcdFx0c3RvcChuYW1lKTtcblx0XHR9O1xuXHR9XG5cdFxuXHR0aGVuID0gbm93O1xuXHRcbn1cblxuZnVuY3Rpb24gc3RhcnQobmFtZSwgZm4pe1xuXHRcblx0aWYoIWZuKXtcblx0XHRmbiA9IG5hbWU7XG5cdFx0bmFtZSA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoKTtcblx0fVxuXHRcblx0aWYoZnVuY3NbbmFtZV0pIHJldHVybiBmYWxzZTtcblx0XG5cdGZ1bmNzW25hbWVdID0gZm47XG5cdFxuXHRmdW5jQ291bnQrKztcblx0XG5cdGlmKCFmcmFtZSl7XG5cdFx0dGhlbiA9IERhdGUubm93KCk7XG5cdFx0ZnJhbWUgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljayk7XG5cdH1cblx0XG59XG5cbmZ1bmN0aW9uIHN0b3AobmFtZSl7XG5cdFxuXHRpZihuYW1lICYmIGZ1bmNzW25hbWVdKXtcblx0XHRkZWxldGUgZnVuY3NbbmFtZV07XG5cdFx0ZnVuY0NvdW50LS07XG5cdH0gZWxzZSBpZighbmFtZSkge1xuXHRcdGZ1bmNzID0ge307XG5cdFx0ZnVuY0NvdW50ID0gMDtcblx0fVxuXHRcblx0aWYoIGZ1bmNDb3VudCA9PT0gMCApe1xuXHRcdGNhbmNlbEFuaW1hdGlvbkZyYW1lKGZyYW1lKTtcblx0XHRmcmFtZSA9IGZhbHNlO1xuXHR9XG5cblx0XG59XG5cbm1vZHVsZS5leHBvcnRzID0gIHtcblx0c3RhcnQ6IHN0YXJ0LFxuXHRzdG9wOiBzdG9wXG59IiwidmFyIFZlY3RvcjIgPSByZXF1aXJlKCd2aWN0b3InKTtcblxuY2xhc3MgUmVjdGFuZ2xlIHtcbiAgICBcbiAgICBjb25zdHJ1Y3RvciAoIHBvc2l0aW9uLCBzaXplICkge1xuICAgICAgICBcbiAgICAgICAgaWYoIHBvc2l0aW9uID09PSB1bmRlZmluZWQgKSBwb3NpdGlvbiA9IG5ldyBWZWN0b3IyKCk7XG4gICAgICAgIGlmKCBzaXplID09PSB1bmRlZmluZWQgKSBzaXplID0gbmV3IFZlY3RvcjIoKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMueCA9IHBvc2l0aW9uLng7XG4gICAgICAgIHRoaXMueSA9IHBvc2l0aW9uLnk7XG4gICAgICAgIHRoaXMudyA9IHNpemUueDtcbiAgICAgICAgdGhpcy5oID0gc2l6ZS55O1xuICAgICAgICB0aGlzLmdldFJCKCk7XG4gICAgICAgIFxuICAgIH1cbiAgICBcbiAgICBnZXRSQiAoKSB7XG4gICAgICAgIHRoaXMuciA9IHRoaXMueCArIHRoaXMudztcbiAgICAgICAgdGhpcy5iID0gdGhpcy55ICsgdGhpcy5oO1xuICAgIH1cbiAgICBcbiAgICBjbG9uZSgpIHtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBuZXcgUmVjdGFuZ2xlKCBcbiAgICAgICAgICAgIG5ldyBWZWN0b3IyKCB0aGlzLngsIHRoaXMueSApLFxuICAgICAgICAgICAgbmV3IFZlY3RvcjIoIHRoaXMuciAtIHRoaXMueCwgdGhpcy5iIC0gdGhpcy55IClcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgfVxuICAgIFxuICAgIHNldFBvc2l0aW9uKCB2ICkge1xuICAgICAgICB0aGlzLnggPSB2Lng7XG4gICAgICAgIHRoaXMueSA9IHYueTtcbiAgICAgICAgdGhpcy5nZXRSQigpO1xuICAgIH1cbiAgICBcbiAgICBzZXRTaXplKCB2ICkge1xuICAgICAgICB0aGlzLncgPSB2Lng7XG4gICAgICAgIHRoaXMuaCA9IHYueTtcbiAgICAgICAgdGhpcy5nZXRSQigpO1xuICAgIH1cbiAgICBcbiAgICBjZW50ZXIoKXtcbiAgICAgICAgcmV0dXJuIG5ldyBWZWN0b3IyKCB0aGlzLnggKyB0aGlzLncgLyAyLCB0aGlzLnkgKyB0aGlzLmgvMiApO1xuICAgIH1cbiAgICBcbiAgICBzZXRDZW50ZXIoIHYgKSB7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5zZXRQb3NpdGlvbiggbmV3IFZlY3RvcjIoIHYueCAtIHRoaXMudy8yLCB2LnkgLSB0aGlzLmgvMiApICk7XG4gICAgICAgIFxuICAgIH1cbiAgICBcbiAgICBjb250YWluc1BvaW50KCB2ICkge1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHYueCA+PSB0aGlzLnggJiYgdi55ID49IHRoaXMueSAmJiB2LnggPCB0aGlzLnIgJiYgdi55IDwgdGhpcy5iO1xuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgaW50ZXJzZWN0c1JlY3QoIHIgKSB7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gci54IDwgdGhpcy5yICYmXG4gICAgICAgICAgIHIuciA+IHRoaXMueCAmJlxuICAgICAgICAgICByLnkgPCB0aGlzLmIgJiZcbiAgICAgICAgICAgci5iID4gdGhpcy55O1xuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgY29udGFpbnNSZWN0KCByICkge1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMueCA8IHIueCAmJlxuICAgICAgICAgICAgdGhpcy5yID4gci5yICYmXG4gICAgICAgICAgICB0aGlzLnkgPCByLnkgJiZcbiAgICAgICAgICAgIHRoaXMuYiA+IHIuYjtcbiAgICAgICAgXG4gICAgfVxuICAgIFxuICAgIHNjYWxlKCB4ICkge1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMuc2V0U2l6ZUNlbnRlciggbmV3IFZlY3RvcjIoXG4gICAgICAgICAgICB0aGlzLncgKiB4LFxuICAgICAgICAgICAgdGhpcy5oICogeFxuICAgICAgICApKVxuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgc2V0U2l6ZUNlbnRlciggdiApIHtcbiAgICAgICAgXG4gICAgICAgIHRoaXMueCArPSAodGhpcy53IC0gdi54KSAvIDI7XG4gICAgICAgIHRoaXMueSArPSAodGhpcy5oIC0gdi55KSAvIDI7XG4gICAgICAgIHRoaXMudyA9IHYueDtcbiAgICAgICAgdGhpcy5oID0gdi55O1xuICAgICAgICB0aGlzLmdldFJCKCk7XG4gICAgICAgIFxuICAgIH1cbiAgICBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZWN0YW5nbGU7IiwidmFyIFZlY3RvcjIgPSByZXF1aXJlKCd2aWN0b3InKTtcbnZhciBSZWN0YW5nbGUgPSByZXF1aXJlKCcuL3JlY3RhbmdsZS5qcycpO1xuXG52YXIgcHJlZml4ZWQgPSByZXF1aXJlKCdkZXRlY3Rjc3MnKS5wcmVmaXhlZDtcblxudmFyIFBSRUZJWEVEX1RSQU5TRk9STSA9IHByZWZpeGVkKCd0cmFuc2Zvcm0nKTtcbnZhciBQUkVGSVhFRF9UUkFOU0ZPUk1fT1JJR0lOID0gcHJlZml4ZWQoJ3RyYW5zZm9ybU9yaWdpbicpO1xuXG5mdW5jdGlvbiBnZXRUcmFuc2xhdGUoIHgsIHkgKSB7XG4gICAgXG4gICAgaWYoeSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHkgPSB4Lnk7XG4gICAgICAgIHggPSB4Lng7XG4gICAgfVxuXG4gICAgcmV0dXJuIGB0cmFuc2xhdGUoICR7eH1weCwgJHt5fXB4IClgO1xuICAgIFxufVxuXG52YXIgZGVnNDUgPSBNYXRoLlBJIC8gNDtcbnZhciBzY2FsZSA9IG5ldyBWZWN0b3IyKCAxLCAuNSApO1xudmFyIHNjYWxlSW52ID0gbmV3IFZlY3RvcjIoIDEsIDIgKTtcblxuZnVuY3Rpb24gd29ybGRUb1ZpZXcgKCB2ICkge1xuICAgIFxuICAgIHJldHVybiB2LmNsb25lKClcbiAgICAgICAgLnJvdGF0ZSggZGVnNDUgKVxuICAgICAgICAubXVsdGlwbHkoIHNjYWxlICk7XG4gICAgXG59XG5cbmZ1bmN0aW9uIHZpZXdUb1dvcmxkICggdiApIHtcbiAgICBcbiAgICByZXR1cm4gdi5jbG9uZSgpXG4gICAgICAgIC5tdWx0aXBseSggc2NhbGVJbnYgKVxuICAgICAgICAucm90YXRlKCAtZGVnNDUgKTtcbiAgICBcbn1cblxuZnVuY3Rpb24gd29ybGRSZWN0Vmlld0JvdW5kcyAoIHIgKSB7XG4gICAgXG4gICAgdmFyIHRvcCA9IG5ldyBWZWN0b3IyKCByLngsIHIueSApO1xuICAgIHZhciBsZWZ0ID0gbmV3IFZlY3RvcjIoIHIueCwgci5iICk7XG4gICAgdmFyIHJpZ2h0ID0gbmV3IFZlY3RvcjIoIHIuciwgci55ICk7XG4gICAgdmFyIGJvdHRvbSA9IG5ldyBWZWN0b3IyKCByLnIsIHIuYiApO1xuICAgIFxuICAgIHRvcCA9IHdvcmxkVG9WaWV3KHRvcCk7XG4gICAgbGVmdCA9IHdvcmxkVG9WaWV3KGxlZnQpO1xuICAgIHJpZ2h0ID0gd29ybGRUb1ZpZXcocmlnaHQpO1xuICAgIGJvdHRvbSA9IHdvcmxkVG9WaWV3KGJvdHRvbSk7XG4gICAgXG4gICAgcmV0dXJuIG5ldyBSZWN0YW5nbGUoXG4gICAgICAgIG5ldyBWZWN0b3IyKCBsZWZ0LngsIHRvcC55ICksXG4gICAgICAgIG5ldyBWZWN0b3IyKCByaWdodC54IC0gbGVmdC54LCBib3R0b20ueSAtIHRvcC55IClcbiAgICApO1xuICAgIFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBQUkVGSVhFRF9UUkFOU0ZPUk0sXG4gICAgUFJFRklYRURfVFJBTlNGT1JNX09SSUdJTixcbiAgICBnZXRUcmFuc2xhdGUsXG4gICAgdmlld1RvV29ybGQsXG4gICAgd29ybGRUb1ZpZXcsXG4gICAgd29ybGRSZWN0Vmlld0JvdW5kc1xufSIsInZhciBDYW1lcmEgPSByZXF1aXJlKCcuL2NhbWVyYS5qcycpO1xudmFyIFdvcmxkID0gcmVxdWlyZSgnLi93b3JsZC5qcycpO1xuXG52YXIgZGF0YSA9IHJlcXVpcmUoJy4vd29ybGQuanNvbicpO1xuXG52YXIgY2FtZXJhID0gbmV3IENhbWVyYSggZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmNhbWVyYScpIClcblxudmFyIGNvbnRleHQgPSB7XG4gICAgd29ybGRFbGVtZW50OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcud29ybGQnKSxcbiAgICBzcHJpdGVzRWxlbWVudDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNwcml0ZXMnKSxcbiAgICBjYW1lcmFcbn1cblxudmFyIHdvcmxkID0gbmV3IFdvcmxkKCBkYXRhLCBjb250ZXh0ICk7XG5cbnZhciBWZWN0b3IyID0gcmVxdWlyZSgnLi92ZW5kb3IvdmVjdG9yMi5qcycpO1xuXG5jYW1lcmEucmVuZGVyKCB3b3JsZCApOyIsInZhciBTcHJpdGUgPSByZXF1aXJlKCcuL3Nwcml0ZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIENoYXJhY3RlciBleHRlbmRzIFNwcml0ZSB7XG4gICAgXG4gICAgZ2V0TmFtZSgpIHsgcmV0dXJuICdjaGFyYWN0ZXInIH1cbiAgICBcbn0iLCJ2YXIgVGhpbmcgPSByZXF1aXJlKCcuL3RoaW5nLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRWxsaXBzZSBleHRlbmRzIFRoaW5nIHtcbiAgICBcbiAgICBnZXROYW1lICgpIHsgcmV0dXJuICdlbGxpcHNlJyB9XG4gICAgXG4gICAgc2V0U3R5bGUgKCBhdHRycyApIHtcbiAgICAgICAgXG4gICAgICAgIHN1cGVyLnNldFN0eWxlKCBhdHRycyApO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmJvcmRlclJhZGl1cyA9ICc1MCUgNTAlJztcbiAgICAgICAgXG4gICAgfVxuICAgIFxufSIsInZhciBSZWN0ID0gcmVxdWlyZSgnLi9yZWN0LmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSW1hZ2UgZXh0ZW5kcyBSZWN0IHtcbiAgICBcbiAgICBnZXROYW1lICgpIHsgcmV0dXJuICdpbWFnZScgfVxuICAgIFxufSIsInZhciBUaGluZyA9IHJlcXVpcmUoJy4vdGhpbmcuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZWN0IGV4dGVuZHMgVGhpbmcge1xuICAgIFxuICAgIGdldE5hbWUgKCkgeyByZXR1cm4gJ3JlY3QnIH1cbiAgICBcbn0iLCJ2YXIgVGhpbmcgPSByZXF1aXJlKCcuL3RoaW5nLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVnaW9uIGV4dGVuZHMgVGhpbmcge1xuICAgIFxuICAgIGdldE5hbWUgKCkgeyByZXR1cm4gJ3JlZ2lvbicgfVxuICAgIFxufSIsInZhciBFbGxpcHNlID0gcmVxdWlyZSgnLi9lbGxpcHNlLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU29uZyBleHRlbmRzIEVsbGlwc2Uge1xuICAgIFxuICAgIGdldE5hbWUgKCkgeyByZXR1cm4gJ3NvbmcnIH1cbiAgICBcbn0iLCJ2YXIgVGhpbmcgPSByZXF1aXJlKCcuL3RoaW5nLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgU3ByaXRlIGV4dGVuZHMgVGhpbmcge1xuICAgIFxuICAgIGNvbnN0cnVjdG9yICggYXR0cnMsIGNvbnRleHQgKSB7XG4gICAgICAgIFxuICAgICAgICBzdXBlciggYXR0cnMsIGNvbnRleHQgKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuaXNTcHJpdGUgPSB0cnVlO1xuICAgICAgICB0aGlzLnNwcml0ZUVsZW1lbnQgPSB0aGlzLmNyZWF0ZVNwcml0ZUVsZW1lbnQoIGF0dHJzICk7XG4gICAgICAgIHRoaXMuc2V0U3ByaXRlU3R5bGUoIGF0dHJzICk7XG4gICAgICAgIGNvbnRleHQuc3ByaXRlc0VsZW1lbnQuYXBwZW5kQ2hpbGQoIHRoaXMuc3ByaXRlRWxlbWVudCApO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5wb3NpdGlvbk5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgXG4gICAgfVxuICAgIFxuICAgIGNyZWF0ZUVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgXG4gICAgZ2V0RGVmYXVsdHMgKCkge1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNoYWRvdzogdHJ1ZVxuICAgICAgICB9XG4gICAgICAgIFxuICAgIH1cbiAgICBcbiAgICBzZXRTcHJpdGVTdHlsZSAoIGF0dHJzICkge1xuICAgICAgICBcbiAgICAgICAgdGhpcy5zcHJpdGVFbGVtZW50LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGF0dHJzLmNvbG9yO1xuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlU3ByaXRlRWxlbWVudCAoIGF0dHJzICkge1xuICAgICAgICBcbiAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBcbiAgICAgICAgZGl2LnN0eWxlLndpZHRoID0gYXR0cnMud2lkdGggKyAncHgnO1xuICAgICAgICBkaXYuc3R5bGUuaGVpZ2h0ID0gYXR0cnMuaGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgXG4gICAgICAgIHZhciBjbGFzc2VzID0gYXR0cnMuY2xhc3NlcyB8fCBbXTtcbiAgICAgICAgZGl2LmNsYXNzTGlzdC5hZGQoICdzcHJpdGUnLCAnc3ByaXRlXycgKyB0aGlzLmdldE5hbWUoKSwgLi4uY2xhc3NlcyApO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGRpdjtcbiAgICAgICAgXG4gICAgfVxuICAgIFxuICAgIHNldFBvc2l0aW9uKCl7XG4gICAgICAgIFxuICAgICAgICBzdXBlci5zZXRQb3NpdGlvbiguLi5hcmd1bWVudHMpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5wb3NpdGlvbk5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgXG4gICAgfVxuICAgIFxufSIsInZhciBSZWN0ID0gcmVxdWlyZSgnLi9yZWN0LmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVGV4dCBleHRlbmRzIFJlY3Qge1xuICAgIFxuICAgIGdldE5hbWUgKCkgeyByZXR1cm4gJ3RleHQnIH1cbiAgICBcbiAgICBnZXREZWZhdWx0cyAoKSB7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2l6ZTogJ2luaGVyaXQnLFxuICAgICAgICAgICAgY29sb3I6ICdpbmhlcml0JyxcbiAgICAgICAgICAgIGZvbnQ6ICdpbmhlcml0JyxcbiAgICAgICAgICAgIGFsaWduOiAnaW5oZXJpdCdcbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlRWxlbWVudCAoIGF0dHJzICkge1xuICAgICAgICBcbiAgICAgICAgdmFyIGRpdiA9IHN1cGVyLmNyZWF0ZUVsZW1lbnQoIGF0dHJzICk7XG4gICAgICAgIGRpdi5pbm5lckhUTUwgPSBhdHRycy5jb250ZW50O1xuICAgICAgICByZXR1cm4gZGl2O1xuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgc2V0U3R5bGUgKCBhdHRycyApIHtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5jb2xvciA9IGF0dHJzLmNvbG9yO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZm9udEZhbWlseSA9IGF0dHJzLmZvbnQ7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5mb250U2l6ZSA9IGF0dHJzLnNpemUgKyAncHgnO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUudGV4dEFsaWduID0gYXR0cnMuYWxpZ247XG4gICAgICAgIFxuICAgIH1cbiAgICBcbn0iLCJ2YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJyk7XG52YXIgVmVjdG9yMiA9IHJlcXVpcmUoJy4uL3ZlbmRvci92ZWN0b3IyLmpzJyk7XG52YXIgeyBleHRlbmQgfSA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcbnZhciB7IFBSRUZJWEVEX1RSQU5TRk9STSB9ID0gcmVxdWlyZSgnLi4vbGliL3V0aWxzLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVGhpbmcgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICAgIFxuICAgIGNvbnN0cnVjdG9yICggYXR0cnMsIGNvbnRleHQgKSB7XG4gICAgICAgIFxuICAgICAgICBzdXBlcigpO1xuICAgICAgICBcbiAgICAgICAgYXR0cnMgPSBleHRlbmQoIHt9LCB0aGlzLmdldERlZmF1bHRzKCksIGF0dHJzICk7XG5cbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBWZWN0b3IyKCBhdHRycy54LCBhdHRycy55ICk7XG4gICAgICAgIHRoaXMuc2l6ZSA9IG5ldyBWZWN0b3IyKCBhdHRycy53aWR0aCwgYXR0cnMuaGVpZ2h0ICk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmNoaWxkcmVuID0gW107XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IHRoaXMuY3JlYXRlRWxlbWVudCggYXR0cnMgKTtcbiAgICAgICAgXG4gICAgICAgIGlmKCB0aGlzLmVsZW1lbnQgKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuc2V0U3R5bGUoIGF0dHJzICk7XG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uTmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgICAgICAgICAgY29udGV4dC53b3JsZEVsZW1lbnQuYXBwZW5kQ2hpbGQoIHRoaXMuZWxlbWVudCApO1xuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfVxuICAgIFxuICAgIGdldERlZmF1bHRzKCkgeyByZXR1cm4ge30gfVxuICAgIFxuICAgIGdldE5hbWUgKCkgeyByZXR1cm4gJ2Fic3RyYWN0JyB9XG4gICAgXG4gICAgc2V0U3R5bGUgKCBhdHRycyApIHtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBhdHRycy5jb2xvcjtcbiAgICAgICAgXG4gICAgfVxuICAgIFxuICAgIGNyZWF0ZUVsZW1lbnQgKCBhdHRycyApIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgZGl2LnN0eWxlLndpZHRoID0gYXR0cnMud2lkdGggKyAncHgnO1xuICAgICAgICBkaXYuc3R5bGUuaGVpZ2h0ID0gYXR0cnMuaGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgXG4gICAgICAgIHZhciBjbGFzc2VzID0gYXR0cnMuY2xhc3NlcyB8fCBbXTtcbiAgICAgICAgXG4gICAgICAgIGRpdi5jbGFzc0xpc3QuYWRkKCAndGhpbmcnLCAndGhpbmdfJyArIHRoaXMuZ2V0TmFtZSgpLCAuLi5jbGFzc2VzICk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZGl2O1xuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgc2V0UG9zaXRpb24gKCB2LCB5ICkge1xuICAgICAgICBcbiAgICAgICAgaWYoIHkgIT09IHVuZGVmaW5lZCApIHYgPSBuZXcgVmVjdG9yMih2LCB5KTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMucG9zaXRpb24uY29weSggdiApO1xuICAgICAgICBcbiAgICAgICAgaWYoIHRoaXMuZWxlbWVudCApIHRoaXMucG9zaXRpb25OZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICAgIFxuICAgIH1cbiAgICBcbiAgICBnZXRUcmFuc2Zvcm0oKSB7XG4gICAgICAgIHJldHVybiBgdHJhbnNsYXRlKCR7dGhpcy5wb3NpdGlvbi54fXB4LCAke3RoaXMucG9zaXRpb24ueX1weClgO1xuICAgIH1cbiAgICBcbiAgICBhZGRDaGlsZHJlbiAoIGNoaWxkcmVuICkge1xuICAgICAgICBcbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW4uY29uY2F0KCBjaGlsZHJlbiApO1xuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgYmluZFRvQ2hhcmFjdGVyICggY2hhcmFjdGVyICkge1xuICAgICAgICBcbiAgICAgICAgdGhpcy5jb250YWluc0NoYXJhY3RlciA9IGZhbHNlO1xuICAgICAgICB0aGlzLnZpc2l0ZWQgPSBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIGNoYXJhY3Rlci5vbiggJ21vdmUnLCBwb2ludCA9PiB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBjb250YWlucyA9IHRoaXMuY29udGFpbnNQb2ludCggcG9pbnQgKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCBjb250YWlucyApIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiggIXRoaXMuY29udGFpbnNDaGFyYWN0ZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5zQ2hhcmFjdGVyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdjaGFyYWN0ZXJFbnRlcicsIHBvaW50KTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCggJ2NoYXJhY3Rlck1vdmUnLCBwb2ludCApO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfSBlbHNlIGlmKCB0aGlzLmNvbnRhaW5zQ2hhcmFjdGVyICkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbnNDaGFyYWN0ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2NoYXJhY3RlckxlYXZlJywgcG9pbnQpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgYmluZFRvQ2FtZXJhICggY2FtZXJhICkge1xuICAgICAgICBcbiAgICAgICAgdGhpcy52aXNpYmxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2VlbiA9IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgY2FtZXJhLm9uKCAnbW92ZScsICh2aWV3cG9ydCwgc2NhbGUpID0+IHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHZpc2libGUgPSB0aGlzLmludGVyc2VjdHNSZWN0KCB2aWV3cG9ydCApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoIHZpc2libGUgKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYoICF0aGlzLnZpc2libGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZpc2libGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoICd2aWV3RW50ZXInLCB2aWV3cG9ydCwgc2NhbGUgKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCggJ3ZpZXdDaGFuZ2UnLCB2aWV3cG9ydCwgc2NhbGUgKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gZWxzZSBpZiggIXZpc2libGUgJiYgdGhpcy52aXNpYmxlICkge1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMudmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCggJ3ZpZXdMZWF2ZScsIHZpZXdwb3J0LCBzY2FsZSApO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgY29udGFpbnNQb2ludCAoKSB7IHJldHVybiBmYWxzZSB9XG4gICAgXG4gICAgaW50ZXJzZWN0c1JlY3QoKSB7IHJldHVybiBmYWxzZSB9XG4gICAgXG59OyIsInZhciBWZWN0b3IyID0gcmVxdWlyZSgnLi92ZWN0b3IyLmpzJyk7XG5cbi8qKlxuICogQGF1dGhvciBiaG91c3RvbiAvIGh0dHA6Ly9jbGFyYS5pb1xuICovXG5cbmZ1bmN0aW9uIEJveDIoIG1pbiwgbWF4ICkge1xuXG5cdHRoaXMubWluID0gKCBtaW4gIT09IHVuZGVmaW5lZCApID8gbWluIDogbmV3IFZlY3RvcjIoICsgSW5maW5pdHksICsgSW5maW5pdHkgKTtcblx0dGhpcy5tYXggPSAoIG1heCAhPT0gdW5kZWZpbmVkICkgPyBtYXggOiBuZXcgVmVjdG9yMiggLSBJbmZpbml0eSwgLSBJbmZpbml0eSApO1xuXG59XG5cbkJveDIucHJvdG90eXBlID0ge1xuXG5cdGNvbnN0cnVjdG9yOiBCb3gyLFxuXG5cdHNldDogZnVuY3Rpb24gKCBtaW4sIG1heCApIHtcblxuXHRcdHRoaXMubWluLmNvcHkoIG1pbiApO1xuXHRcdHRoaXMubWF4LmNvcHkoIG1heCApO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRzZXRGcm9tUG9pbnRzOiBmdW5jdGlvbiAoIHBvaW50cyApIHtcblxuXHRcdHRoaXMubWFrZUVtcHR5KCk7XG5cblx0XHRmb3IgKCB2YXIgaSA9IDAsIGlsID0gcG9pbnRzLmxlbmd0aDsgaSA8IGlsOyBpICsrICkge1xuXG5cdFx0XHR0aGlzLmV4cGFuZEJ5UG9pbnQoIHBvaW50c1sgaSBdICk7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdHNldEZyb21DZW50ZXJBbmRTaXplOiBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgdjEgPSBuZXcgVmVjdG9yMigpO1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uIHNldEZyb21DZW50ZXJBbmRTaXplKCBjZW50ZXIsIHNpemUgKSB7XG5cblx0XHRcdHZhciBoYWxmU2l6ZSA9IHYxLmNvcHkoIHNpemUgKS5tdWx0aXBseVNjYWxhciggMC41ICk7XG5cdFx0XHR0aGlzLm1pbi5jb3B5KCBjZW50ZXIgKS5zdWIoIGhhbGZTaXplICk7XG5cdFx0XHR0aGlzLm1heC5jb3B5KCBjZW50ZXIgKS5hZGQoIGhhbGZTaXplICk7XG5cblx0XHRcdHJldHVybiB0aGlzO1xuXG5cdFx0fTtcblxuXHR9KCksXG5cblx0Y2xvbmU6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHJldHVybiBuZXcgdGhpcy5jb25zdHJ1Y3RvcigpLmNvcHkoIHRoaXMgKTtcblxuXHR9LFxuXG5cdGNvcHk6IGZ1bmN0aW9uICggYm94ICkge1xuXG5cdFx0dGhpcy5taW4uY29weSggYm94Lm1pbiApO1xuXHRcdHRoaXMubWF4LmNvcHkoIGJveC5tYXggKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0bWFrZUVtcHR5OiBmdW5jdGlvbiAoKSB7XG5cblx0XHR0aGlzLm1pbi54ID0gdGhpcy5taW4ueSA9ICsgSW5maW5pdHk7XG5cdFx0dGhpcy5tYXgueCA9IHRoaXMubWF4LnkgPSAtIEluZmluaXR5O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRpc0VtcHR5OiBmdW5jdGlvbiAoKSB7XG5cblx0XHQvLyB0aGlzIGlzIGEgbW9yZSByb2J1c3QgY2hlY2sgZm9yIGVtcHR5IHRoYW4gKCB2b2x1bWUgPD0gMCApIGJlY2F1c2Ugdm9sdW1lIGNhbiBnZXQgcG9zaXRpdmUgd2l0aCB0d28gbmVnYXRpdmUgYXhlc1xuXG5cdFx0cmV0dXJuICggdGhpcy5tYXgueCA8IHRoaXMubWluLnggKSB8fCAoIHRoaXMubWF4LnkgPCB0aGlzLm1pbi55ICk7XG5cblx0fSxcblxuXHRnZXRDZW50ZXI6IGZ1bmN0aW9uICggb3B0aW9uYWxUYXJnZXQgKSB7XG5cblx0XHR2YXIgcmVzdWx0ID0gb3B0aW9uYWxUYXJnZXQgfHwgbmV3IFZlY3RvcjIoKTtcblx0XHRyZXR1cm4gdGhpcy5pc0VtcHR5KCkgPyByZXN1bHQuc2V0KCAwLCAwICkgOiByZXN1bHQuYWRkVmVjdG9ycyggdGhpcy5taW4sIHRoaXMubWF4ICkubXVsdGlwbHlTY2FsYXIoIDAuNSApO1xuXG5cdH0sXG5cblx0Z2V0U2l6ZTogZnVuY3Rpb24gKCBvcHRpb25hbFRhcmdldCApIHtcblxuXHRcdHZhciByZXN1bHQgPSBvcHRpb25hbFRhcmdldCB8fCBuZXcgVmVjdG9yMigpO1xuXHRcdHJldHVybiB0aGlzLmlzRW1wdHkoKSA/IHJlc3VsdC5zZXQoIDAsIDAgKSA6IHJlc3VsdC5zdWJWZWN0b3JzKCB0aGlzLm1heCwgdGhpcy5taW4gKTtcblxuXHR9LFxuXG5cdGV4cGFuZEJ5UG9pbnQ6IGZ1bmN0aW9uICggcG9pbnQgKSB7XG5cblx0XHR0aGlzLm1pbi5taW4oIHBvaW50ICk7XG5cdFx0dGhpcy5tYXgubWF4KCBwb2ludCApO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRleHBhbmRCeVZlY3RvcjogZnVuY3Rpb24gKCB2ZWN0b3IgKSB7XG5cblx0XHR0aGlzLm1pbi5zdWIoIHZlY3RvciApO1xuXHRcdHRoaXMubWF4LmFkZCggdmVjdG9yICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGV4cGFuZEJ5U2NhbGFyOiBmdW5jdGlvbiAoIHNjYWxhciApIHtcblxuXHRcdHRoaXMubWluLmFkZFNjYWxhciggLSBzY2FsYXIgKTtcblx0XHR0aGlzLm1heC5hZGRTY2FsYXIoIHNjYWxhciApO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRjb250YWluc1BvaW50OiBmdW5jdGlvbiAoIHBvaW50ICkge1xuXG5cdFx0aWYgKCBwb2ludC54IDwgdGhpcy5taW4ueCB8fCBwb2ludC54ID4gdGhpcy5tYXgueCB8fFxuXHRcdCAgICAgcG9pbnQueSA8IHRoaXMubWluLnkgfHwgcG9pbnQueSA+IHRoaXMubWF4LnkgKSB7XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblxuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXG5cdH0sXG5cblx0Y29udGFpbnNCb3g6IGZ1bmN0aW9uICggYm94ICkge1xuXG5cdFx0aWYgKCAoIHRoaXMubWluLnggPD0gYm94Lm1pbi54ICkgJiYgKCBib3gubWF4LnggPD0gdGhpcy5tYXgueCApICYmXG5cdFx0ICAgICAoIHRoaXMubWluLnkgPD0gYm94Lm1pbi55ICkgJiYgKCBib3gubWF4LnkgPD0gdGhpcy5tYXgueSApICkge1xuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblxuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblxuXHR9LFxuXG5cdGdldFBhcmFtZXRlcjogZnVuY3Rpb24gKCBwb2ludCwgb3B0aW9uYWxUYXJnZXQgKSB7XG5cblx0XHQvLyBUaGlzIGNhbiBwb3RlbnRpYWxseSBoYXZlIGEgZGl2aWRlIGJ5IHplcm8gaWYgdGhlIGJveFxuXHRcdC8vIGhhcyBhIHNpemUgZGltZW5zaW9uIG9mIDAuXG5cblx0XHR2YXIgcmVzdWx0ID0gb3B0aW9uYWxUYXJnZXQgfHwgbmV3IFZlY3RvcjIoKTtcblxuXHRcdHJldHVybiByZXN1bHQuc2V0KFxuXHRcdFx0KCBwb2ludC54IC0gdGhpcy5taW4ueCApIC8gKCB0aGlzLm1heC54IC0gdGhpcy5taW4ueCApLFxuXHRcdFx0KCBwb2ludC55IC0gdGhpcy5taW4ueSApIC8gKCB0aGlzLm1heC55IC0gdGhpcy5taW4ueSApXG5cdFx0KTtcblxuXHR9LFxuXG5cdGludGVyc2VjdHNCb3g6IGZ1bmN0aW9uICggYm94ICkge1xuXG5cdFx0Ly8gdXNpbmcgNiBzcGxpdHRpbmcgcGxhbmVzIHRvIHJ1bGUgb3V0IGludGVyc2VjdGlvbnMuXG5cblx0XHRpZiAoIGJveC5tYXgueCA8IHRoaXMubWluLnggfHwgYm94Lm1pbi54ID4gdGhpcy5tYXgueCB8fFxuXHRcdCAgICAgYm94Lm1heC55IDwgdGhpcy5taW4ueSB8fCBib3gubWluLnkgPiB0aGlzLm1heC55ICkge1xuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblxuXHR9LFxuXG5cdGNsYW1wUG9pbnQ6IGZ1bmN0aW9uICggcG9pbnQsIG9wdGlvbmFsVGFyZ2V0ICkge1xuXG5cdFx0dmFyIHJlc3VsdCA9IG9wdGlvbmFsVGFyZ2V0IHx8IG5ldyBWZWN0b3IyKCk7XG5cdFx0cmV0dXJuIHJlc3VsdC5jb3B5KCBwb2ludCApLmNsYW1wKCB0aGlzLm1pbiwgdGhpcy5tYXggKTtcblxuXHR9LFxuXG5cdGRpc3RhbmNlVG9Qb2ludDogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIHYxID0gbmV3IFZlY3RvcjIoKTtcblxuXHRcdHJldHVybiBmdW5jdGlvbiBkaXN0YW5jZVRvUG9pbnQoIHBvaW50ICkge1xuXG5cdFx0XHR2YXIgY2xhbXBlZFBvaW50ID0gdjEuY29weSggcG9pbnQgKS5jbGFtcCggdGhpcy5taW4sIHRoaXMubWF4ICk7XG5cdFx0XHRyZXR1cm4gY2xhbXBlZFBvaW50LnN1YiggcG9pbnQgKS5sZW5ndGgoKTtcblxuXHRcdH07XG5cblx0fSgpLFxuXG5cdGludGVyc2VjdDogZnVuY3Rpb24gKCBib3ggKSB7XG5cblx0XHR0aGlzLm1pbi5tYXgoIGJveC5taW4gKTtcblx0XHR0aGlzLm1heC5taW4oIGJveC5tYXggKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0dW5pb246IGZ1bmN0aW9uICggYm94ICkge1xuXG5cdFx0dGhpcy5taW4ubWluKCBib3gubWluICk7XG5cdFx0dGhpcy5tYXgubWF4KCBib3gubWF4ICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdHRyYW5zbGF0ZTogZnVuY3Rpb24gKCBvZmZzZXQgKSB7XG5cblx0XHR0aGlzLm1pbi5hZGQoIG9mZnNldCApO1xuXHRcdHRoaXMubWF4LmFkZCggb2Zmc2V0ICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGVxdWFsczogZnVuY3Rpb24gKCBib3ggKSB7XG5cblx0XHRyZXR1cm4gYm94Lm1pbi5lcXVhbHMoIHRoaXMubWluICkgJiYgYm94Lm1heC5lcXVhbHMoIHRoaXMubWF4ICk7XG5cblx0fVxuXG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQm94MjsiLCIvKipcbiAqIEBhdXRob3IgbXJkb29iIC8gaHR0cDovL21yZG9vYi5jb20vXG4gKiBAYXV0aG9yIHBoaWxvZ2IgLyBodHRwOi8vYmxvZy50aGVqaXQub3JnL1xuICogQGF1dGhvciBlZ3JhZXRoZXIgLyBodHRwOi8vZWdyYWV0aGVyLmNvbS9cbiAqIEBhdXRob3Igeno4NSAvIGh0dHA6Ly93d3cubGFiNGdhbWVzLm5ldC96ejg1L2Jsb2dcbiAqL1xuXG5mdW5jdGlvbiBWZWN0b3IyKCB4LCB5ICkge1xuXG5cdHRoaXMueCA9IHggfHwgMDtcblx0dGhpcy55ID0geSB8fCAwO1xuXG59XG5cblZlY3RvcjIucHJvdG90eXBlID0ge1xuXG5cdGNvbnN0cnVjdG9yOiBWZWN0b3IyLFxuXG5cdGlzVmVjdG9yMjogdHJ1ZSxcblxuXHRnZXQgd2lkdGgoKSB7XG5cblx0XHRyZXR1cm4gdGhpcy54O1xuXG5cdH0sXG5cblx0c2V0IHdpZHRoKCB2YWx1ZSApIHtcblxuXHRcdHRoaXMueCA9IHZhbHVlO1xuXG5cdH0sXG5cblx0Z2V0IGhlaWdodCgpIHtcblxuXHRcdHJldHVybiB0aGlzLnk7XG5cblx0fSxcblxuXHRzZXQgaGVpZ2h0KCB2YWx1ZSApIHtcblxuXHRcdHRoaXMueSA9IHZhbHVlO1xuXG5cdH0sXG5cblx0Ly9cblxuXHRzZXQ6IGZ1bmN0aW9uICggeCwgeSApIHtcblxuXHRcdHRoaXMueCA9IHg7XG5cdFx0dGhpcy55ID0geTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0c2V0U2NhbGFyOiBmdW5jdGlvbiAoIHNjYWxhciApIHtcblxuXHRcdHRoaXMueCA9IHNjYWxhcjtcblx0XHR0aGlzLnkgPSBzY2FsYXI7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdHNldFg6IGZ1bmN0aW9uICggeCApIHtcblxuXHRcdHRoaXMueCA9IHg7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdHNldFk6IGZ1bmN0aW9uICggeSApIHtcblxuXHRcdHRoaXMueSA9IHk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdHNldENvbXBvbmVudDogZnVuY3Rpb24gKCBpbmRleCwgdmFsdWUgKSB7XG5cblx0XHRzd2l0Y2ggKCBpbmRleCApIHtcblxuXHRcdFx0Y2FzZSAwOiB0aGlzLnggPSB2YWx1ZTsgYnJlYWs7XG5cdFx0XHRjYXNlIDE6IHRoaXMueSA9IHZhbHVlOyBicmVhaztcblx0XHRcdGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvciggJ2luZGV4IGlzIG91dCBvZiByYW5nZTogJyArIGluZGV4ICk7XG5cblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRnZXRDb21wb25lbnQ6IGZ1bmN0aW9uICggaW5kZXggKSB7XG5cblx0XHRzd2l0Y2ggKCBpbmRleCApIHtcblxuXHRcdFx0Y2FzZSAwOiByZXR1cm4gdGhpcy54O1xuXHRcdFx0Y2FzZSAxOiByZXR1cm4gdGhpcy55O1xuXHRcdFx0ZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCAnaW5kZXggaXMgb3V0IG9mIHJhbmdlOiAnICsgaW5kZXggKTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdGNsb25lOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRyZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IoIHRoaXMueCwgdGhpcy55ICk7XG5cblx0fSxcblxuXHRjb3B5OiBmdW5jdGlvbiAoIHYgKSB7XG5cblx0XHR0aGlzLnggPSB2Lng7XG5cdFx0dGhpcy55ID0gdi55O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRhZGQ6IGZ1bmN0aW9uICggdiwgdyApIHtcblxuXHRcdGlmICggdyAhPT0gdW5kZWZpbmVkICkge1xuXG5cdFx0XHRjb25zb2xlLndhcm4oICdUSFJFRS5WZWN0b3IyOiAuYWRkKCkgbm93IG9ubHkgYWNjZXB0cyBvbmUgYXJndW1lbnQuIFVzZSAuYWRkVmVjdG9ycyggYSwgYiApIGluc3RlYWQuJyApO1xuXHRcdFx0cmV0dXJuIHRoaXMuYWRkVmVjdG9ycyggdiwgdyApO1xuXG5cdFx0fVxuXG5cdFx0dGhpcy54ICs9IHYueDtcblx0XHR0aGlzLnkgKz0gdi55O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRhZGRTY2FsYXI6IGZ1bmN0aW9uICggcyApIHtcblxuXHRcdHRoaXMueCArPSBzO1xuXHRcdHRoaXMueSArPSBzO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRhZGRWZWN0b3JzOiBmdW5jdGlvbiAoIGEsIGIgKSB7XG5cblx0XHR0aGlzLnggPSBhLnggKyBiLng7XG5cdFx0dGhpcy55ID0gYS55ICsgYi55O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRhZGRTY2FsZWRWZWN0b3I6IGZ1bmN0aW9uICggdiwgcyApIHtcblxuXHRcdHRoaXMueCArPSB2LnggKiBzO1xuXHRcdHRoaXMueSArPSB2LnkgKiBzO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRzdWI6IGZ1bmN0aW9uICggdiwgdyApIHtcblxuXHRcdGlmICggdyAhPT0gdW5kZWZpbmVkICkge1xuXG5cdFx0XHRjb25zb2xlLndhcm4oICdUSFJFRS5WZWN0b3IyOiAuc3ViKCkgbm93IG9ubHkgYWNjZXB0cyBvbmUgYXJndW1lbnQuIFVzZSAuc3ViVmVjdG9ycyggYSwgYiApIGluc3RlYWQuJyApO1xuXHRcdFx0cmV0dXJuIHRoaXMuc3ViVmVjdG9ycyggdiwgdyApO1xuXG5cdFx0fVxuXG5cdFx0dGhpcy54IC09IHYueDtcblx0XHR0aGlzLnkgLT0gdi55O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRzdWJTY2FsYXI6IGZ1bmN0aW9uICggcyApIHtcblxuXHRcdHRoaXMueCAtPSBzO1xuXHRcdHRoaXMueSAtPSBzO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRzdWJWZWN0b3JzOiBmdW5jdGlvbiAoIGEsIGIgKSB7XG5cblx0XHR0aGlzLnggPSBhLnggLSBiLng7XG5cdFx0dGhpcy55ID0gYS55IC0gYi55O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRtdWx0aXBseTogZnVuY3Rpb24gKCB2ICkge1xuXG5cdFx0dGhpcy54ICo9IHYueDtcblx0XHR0aGlzLnkgKj0gdi55O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRtdWx0aXBseVNjYWxhcjogZnVuY3Rpb24gKCBzY2FsYXIgKSB7XG5cblx0XHRpZiAoIGlzRmluaXRlKCBzY2FsYXIgKSApIHtcblxuXHRcdFx0dGhpcy54ICo9IHNjYWxhcjtcblx0XHRcdHRoaXMueSAqPSBzY2FsYXI7XG5cblx0XHR9IGVsc2Uge1xuXG5cdFx0XHR0aGlzLnggPSAwO1xuXHRcdFx0dGhpcy55ID0gMDtcblxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0ZGl2aWRlOiBmdW5jdGlvbiAoIHYgKSB7XG5cblx0XHR0aGlzLnggLz0gdi54O1xuXHRcdHRoaXMueSAvPSB2Lnk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGRpdmlkZVNjYWxhcjogZnVuY3Rpb24gKCBzY2FsYXIgKSB7XG5cblx0XHRyZXR1cm4gdGhpcy5tdWx0aXBseVNjYWxhciggMSAvIHNjYWxhciApO1xuXG5cdH0sXG5cblx0bWluOiBmdW5jdGlvbiAoIHYgKSB7XG5cblx0XHR0aGlzLnggPSBNYXRoLm1pbiggdGhpcy54LCB2LnggKTtcblx0XHR0aGlzLnkgPSBNYXRoLm1pbiggdGhpcy55LCB2LnkgKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0bWF4OiBmdW5jdGlvbiAoIHYgKSB7XG5cblx0XHR0aGlzLnggPSBNYXRoLm1heCggdGhpcy54LCB2LnggKTtcblx0XHR0aGlzLnkgPSBNYXRoLm1heCggdGhpcy55LCB2LnkgKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0Y2xhbXA6IGZ1bmN0aW9uICggbWluLCBtYXggKSB7XG5cblx0XHQvLyBUaGlzIGZ1bmN0aW9uIGFzc3VtZXMgbWluIDwgbWF4LCBpZiB0aGlzIGFzc3VtcHRpb24gaXNuJ3QgdHJ1ZSBpdCB3aWxsIG5vdCBvcGVyYXRlIGNvcnJlY3RseVxuXG5cdFx0dGhpcy54ID0gTWF0aC5tYXgoIG1pbi54LCBNYXRoLm1pbiggbWF4LngsIHRoaXMueCApICk7XG5cdFx0dGhpcy55ID0gTWF0aC5tYXgoIG1pbi55LCBNYXRoLm1pbiggbWF4LnksIHRoaXMueSApICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGNsYW1wU2NhbGFyOiBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgbWluLCBtYXg7XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24gY2xhbXBTY2FsYXIoIG1pblZhbCwgbWF4VmFsICkge1xuXG5cdFx0XHRpZiAoIG1pbiA9PT0gdW5kZWZpbmVkICkge1xuXG5cdFx0XHRcdG1pbiA9IG5ldyBWZWN0b3IyKCk7XG5cdFx0XHRcdG1heCA9IG5ldyBWZWN0b3IyKCk7XG5cblx0XHRcdH1cblxuXHRcdFx0bWluLnNldCggbWluVmFsLCBtaW5WYWwgKTtcblx0XHRcdG1heC5zZXQoIG1heFZhbCwgbWF4VmFsICk7XG5cblx0XHRcdHJldHVybiB0aGlzLmNsYW1wKCBtaW4sIG1heCApO1xuXG5cdFx0fTtcblxuXHR9KCksXG5cblx0Y2xhbXBMZW5ndGg6IGZ1bmN0aW9uICggbWluLCBtYXggKSB7XG5cblx0XHR2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGgoKTtcblxuXHRcdHJldHVybiB0aGlzLm11bHRpcGx5U2NhbGFyKCBNYXRoLm1heCggbWluLCBNYXRoLm1pbiggbWF4LCBsZW5ndGggKSApIC8gbGVuZ3RoICk7XG5cblx0fSxcblxuXHRmbG9vcjogZnVuY3Rpb24gKCkge1xuXG5cdFx0dGhpcy54ID0gTWF0aC5mbG9vciggdGhpcy54ICk7XG5cdFx0dGhpcy55ID0gTWF0aC5mbG9vciggdGhpcy55ICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGNlaWw6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHRoaXMueCA9IE1hdGguY2VpbCggdGhpcy54ICk7XG5cdFx0dGhpcy55ID0gTWF0aC5jZWlsKCB0aGlzLnkgKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0cm91bmQ6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHRoaXMueCA9IE1hdGgucm91bmQoIHRoaXMueCApO1xuXHRcdHRoaXMueSA9IE1hdGgucm91bmQoIHRoaXMueSApO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRyb3VuZFRvWmVybzogZnVuY3Rpb24gKCkge1xuXG5cdFx0dGhpcy54ID0gKCB0aGlzLnggPCAwICkgPyBNYXRoLmNlaWwoIHRoaXMueCApIDogTWF0aC5mbG9vciggdGhpcy54ICk7XG5cdFx0dGhpcy55ID0gKCB0aGlzLnkgPCAwICkgPyBNYXRoLmNlaWwoIHRoaXMueSApIDogTWF0aC5mbG9vciggdGhpcy55ICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdG5lZ2F0ZTogZnVuY3Rpb24gKCkge1xuXG5cdFx0dGhpcy54ID0gLSB0aGlzLng7XG5cdFx0dGhpcy55ID0gLSB0aGlzLnk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGRvdDogZnVuY3Rpb24gKCB2ICkge1xuXG5cdFx0cmV0dXJuIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueTtcblxuXHR9LFxuXG5cdGxlbmd0aFNxOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRyZXR1cm4gdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55O1xuXG5cdH0sXG5cblx0bGVuZ3RoOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRyZXR1cm4gTWF0aC5zcXJ0KCB0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnkgKTtcblxuXHR9LFxuXG5cdGxlbmd0aE1hbmhhdHRhbjogZnVuY3Rpb24oKSB7XG5cblx0XHRyZXR1cm4gTWF0aC5hYnMoIHRoaXMueCApICsgTWF0aC5hYnMoIHRoaXMueSApO1xuXG5cdH0sXG5cblx0bm9ybWFsaXplOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRyZXR1cm4gdGhpcy5kaXZpZGVTY2FsYXIoIHRoaXMubGVuZ3RoKCkgKTtcblxuXHR9LFxuXG5cdGFuZ2xlOiBmdW5jdGlvbiAoKSB7XG5cblx0XHQvLyBjb21wdXRlcyB0aGUgYW5nbGUgaW4gcmFkaWFucyB3aXRoIHJlc3BlY3QgdG8gdGhlIHBvc2l0aXZlIHgtYXhpc1xuXG5cdFx0dmFyIGFuZ2xlID0gTWF0aC5hdGFuMiggdGhpcy55LCB0aGlzLnggKTtcblxuXHRcdGlmICggYW5nbGUgPCAwICkgYW5nbGUgKz0gMiAqIE1hdGguUEk7XG5cblx0XHRyZXR1cm4gYW5nbGU7XG5cblx0fSxcblxuXHRkaXN0YW5jZVRvOiBmdW5jdGlvbiAoIHYgKSB7XG5cblx0XHRyZXR1cm4gTWF0aC5zcXJ0KCB0aGlzLmRpc3RhbmNlVG9TcXVhcmVkKCB2ICkgKTtcblxuXHR9LFxuXG5cdGRpc3RhbmNlVG9TcXVhcmVkOiBmdW5jdGlvbiAoIHYgKSB7XG5cblx0XHR2YXIgZHggPSB0aGlzLnggLSB2LngsIGR5ID0gdGhpcy55IC0gdi55O1xuXHRcdHJldHVybiBkeCAqIGR4ICsgZHkgKiBkeTtcblxuXHR9LFxuXG5cdGRpc3RhbmNlVG9NYW5oYXR0YW46IGZ1bmN0aW9uICggdiApIHtcblxuXHRcdHJldHVybiBNYXRoLmFicyggdGhpcy54IC0gdi54ICkgKyBNYXRoLmFicyggdGhpcy55IC0gdi55ICk7XG5cblx0fSxcblxuXHRzZXRMZW5ndGg6IGZ1bmN0aW9uICggbGVuZ3RoICkge1xuXG5cdFx0cmV0dXJuIHRoaXMubXVsdGlwbHlTY2FsYXIoIGxlbmd0aCAvIHRoaXMubGVuZ3RoKCkgKTtcblxuXHR9LFxuXG5cdGxlcnA6IGZ1bmN0aW9uICggdiwgYWxwaGEgKSB7XG5cblx0XHR0aGlzLnggKz0gKCB2LnggLSB0aGlzLnggKSAqIGFscGhhO1xuXHRcdHRoaXMueSArPSAoIHYueSAtIHRoaXMueSApICogYWxwaGE7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGxlcnBWZWN0b3JzOiBmdW5jdGlvbiAoIHYxLCB2MiwgYWxwaGEgKSB7XG5cblx0XHRyZXR1cm4gdGhpcy5zdWJWZWN0b3JzKCB2MiwgdjEgKS5tdWx0aXBseVNjYWxhciggYWxwaGEgKS5hZGQoIHYxICk7XG5cblx0fSxcblxuXHRlcXVhbHM6IGZ1bmN0aW9uICggdiApIHtcblxuXHRcdHJldHVybiAoICggdi54ID09PSB0aGlzLnggKSAmJiAoIHYueSA9PT0gdGhpcy55ICkgKTtcblxuXHR9LFxuXG5cdGZyb21BcnJheTogZnVuY3Rpb24gKCBhcnJheSwgb2Zmc2V0ICkge1xuXG5cdFx0aWYgKCBvZmZzZXQgPT09IHVuZGVmaW5lZCApIG9mZnNldCA9IDA7XG5cblx0XHR0aGlzLnggPSBhcnJheVsgb2Zmc2V0IF07XG5cdFx0dGhpcy55ID0gYXJyYXlbIG9mZnNldCArIDEgXTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0dG9BcnJheTogZnVuY3Rpb24gKCBhcnJheSwgb2Zmc2V0ICkge1xuXG5cdFx0aWYgKCBhcnJheSA9PT0gdW5kZWZpbmVkICkgYXJyYXkgPSBbXTtcblx0XHRpZiAoIG9mZnNldCA9PT0gdW5kZWZpbmVkICkgb2Zmc2V0ID0gMDtcblxuXHRcdGFycmF5WyBvZmZzZXQgXSA9IHRoaXMueDtcblx0XHRhcnJheVsgb2Zmc2V0ICsgMSBdID0gdGhpcy55O1xuXG5cdFx0cmV0dXJuIGFycmF5O1xuXG5cdH0sXG5cblx0ZnJvbUF0dHJpYnV0ZTogZnVuY3Rpb24gKCBhdHRyaWJ1dGUsIGluZGV4LCBvZmZzZXQgKSB7XG5cblx0XHRpZiAoIG9mZnNldCA9PT0gdW5kZWZpbmVkICkgb2Zmc2V0ID0gMDtcblxuXHRcdGluZGV4ID0gaW5kZXggKiBhdHRyaWJ1dGUuaXRlbVNpemUgKyBvZmZzZXQ7XG5cblx0XHR0aGlzLnggPSBhdHRyaWJ1dGUuYXJyYXlbIGluZGV4IF07XG5cdFx0dGhpcy55ID0gYXR0cmlidXRlLmFycmF5WyBpbmRleCArIDEgXTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0cm90YXRlQXJvdW5kOiBmdW5jdGlvbiAoIGNlbnRlciwgYW5nbGUgKSB7XG5cblx0XHR2YXIgYyA9IE1hdGguY29zKCBhbmdsZSApLCBzID0gTWF0aC5zaW4oIGFuZ2xlICk7XG5cblx0XHR2YXIgeCA9IHRoaXMueCAtIGNlbnRlci54O1xuXHRcdHZhciB5ID0gdGhpcy55IC0gY2VudGVyLnk7XG5cblx0XHR0aGlzLnggPSB4ICogYyAtIHkgKiBzICsgY2VudGVyLng7XG5cdFx0dGhpcy55ID0geCAqIHMgKyB5ICogYyArIGNlbnRlci55O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fVxuXG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yMjsiLCJtb2R1bGUuZXhwb3J0cz17XCJ0eXBlXCI6XCJXb3JsZFwiLFwiYXR0cnNcIjp7fSxcImNoaWxkcmVuXCI6W3tcInR5cGVcIjpcIkNoYXJhY3RlclwiLFwiYXR0cnNcIjp7XCJ4XCI6MCxcInlcIjowLFwid2lkdGhcIjo1MCxcImhlaWdodFwiOjEwMCxcImNvbG9yXCI6XCJjb3JhbFwifSxcImNoaWxkcmVuXCI6W119LHtcInR5cGVcIjpcIlJlZ2lvblwiLFwiYXR0cnNcIjp7XCJjb2xvclwiOlwic2lsdmVyXCIsXCJoZWlnaHRcIjo3MDAsXCJ3aWR0aFwiOjcwMCxcInhcIjowLFwieVwiOjB9LFwiY2hpbGRyZW5cIjpbe1widHlwZVwiOlwiUmVjdFwiLFwiYXR0cnNcIjp7XCJjb2xvclwiOlwiYmx1ZVwiLFwieFwiOjE0MCxcInlcIjoxNDAsXCJ3aWR0aFwiOjQyMCxcImhlaWdodFwiOjQyMCxcInpcIjowfSxcImNoaWxkcmVuXCI6W3tcInR5cGVcIjpcIkltYWdlXCIsXCJhdHRyc1wiOntcInNyY1wiOltcImFzc2V0cy9fcmVzaXplZC84RDMzMEM2N0NDRTIwNDNfMzM2XzMzNi5qcGdcIixcImFzc2V0cy9fcmVzaXplZC84RDMzMEM2N0NDRTIwNDNfMTY4XzE2OC5qcGdcIixcImFzc2V0cy9fcmVzaXplZC84RDMzMEM2N0NDRTIwNDNfODRfODQuanBnXCIsXCJhc3NldHMvX3Jlc2l6ZWQvOEQzMzBDNjdDQ0UyMDQzXzQyXzQyLmpwZ1wiXSxcInhcIjoxODIsXCJ5XCI6MTgyLFwid2lkdGhcIjozMzYsXCJoZWlnaHRcIjozMzYsXCJ6XCI6MH0sXCJjaGlsZHJlblwiOltdfV19LHtcInR5cGVcIjpcIkVsbGlwc2VcIixcImF0dHJzXCI6e1wiY29sb3JcIjpcInJlZFwiLFwid2lkdGhcIjoxNDAsXCJoZWlnaHRcIjoxNDAsXCJ4XCI6MjgwLFwieVwiOjAsXCJ6XCI6MX0sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJFbGxpcHNlXCIsXCJhdHRyc1wiOntcImNvbG9yXCI6XCJyZWRcIixcIndpZHRoXCI6MTQwLFwiaGVpZ2h0XCI6MTQwLFwieFwiOjU2MCxcInlcIjoyMTAsXCJ6XCI6Mn0sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJFbGxpcHNlXCIsXCJhdHRyc1wiOntcImNvbG9yXCI6XCJyZWRcIixcIndpZHRoXCI6MTQwLFwiaGVpZ2h0XCI6MTQwLFwieFwiOjAsXCJ5XCI6MjgwLFwielwiOjN9LFwiY2hpbGRyZW5cIjpbXX0se1widHlwZVwiOlwiRWxsaXBzZVwiLFwiYXR0cnNcIjp7XCJjb2xvclwiOlwicmVkXCIsXCJ3aWR0aFwiOjE0MCxcImhlaWdodFwiOjE0MCxcInhcIjozNTAsXCJ5XCI6NTYwLFwielwiOjR9LFwiY2hpbGRyZW5cIjpbXX0se1widHlwZVwiOlwiVGV4dFwiLFwiYXR0cnNcIjp7XCJ4XCI6NTc0LFwieVwiOjM1MCxcImNvbG9yXCI6XCJyZWRcIixcInNpemVcIjozNTAsXCJjb250ZW50XCI6XCJcXG4gICAgICAgICAgICBiPGJyLz5vXFxuICAgICAgICBcIixcIndpZHRoXCI6MCxcInpcIjo1LFwiaGVpZ2h0XCI6MH0sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJUZXh0XCIsXCJhdHRyc1wiOntcInhcIjoyMTAsXCJ5XCI6NTYwLFwiY29sb3JcIjpcInJlZFwiLFwic2l6ZVwiOjM1MCxcImNvbnRlbnRcIjpcIlxcbiAgICAgICAgICAgIGVuXFxuICAgICAgICBcIixcIndpZHRoXCI6MCxcInpcIjo2LFwiaGVpZ2h0XCI6MH0sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJTb25nXCIsXCJhdHRyc1wiOntcInNyY1wiOlwiYXNzZXRzL3RoYXR3YXNtZTMubXAzXCIsXCJ0aXRsZVwiOlwiVGhhdCBXYXMgTWVcIixcInhcIjo3MCxcInlcIjo3MCxcIndpZHRoXCI6MCxcInpcIjo3LFwiaGVpZ2h0XCI6MH0sXCJjaGlsZHJlblwiOltdfV19LHtcInR5cGVcIjpcIlJlZ2lvblwiLFwiYXR0cnNcIjp7XCJjb2xvclwiOlwid2hpdGVcIixcImhlaWdodFwiOjcwMCxcIndpZHRoXCI6NzAwLFwieFwiOjcwMCxcInlcIjowfSxcImNoaWxkcmVuXCI6W3tcInR5cGVcIjpcIlJlY3RcIixcImF0dHJzXCI6e1wieFwiOjc1NixcInlcIjo1NixcIndpZHRoXCI6MTA1LFwiaGVpZ2h0XCI6NTYwLFwielwiOjB9LFwiY2hpbGRyZW5cIjpbe1widHlwZVwiOlwiSW1hZ2VcIixcImF0dHJzXCI6e1wic3JjXCI6W1wiYXNzZXRzL19yZXNpemVkLzMxMkI1NUNGREM5MjQ3MjNfMTA1XzE0MC5qcGdcIixcImFzc2V0cy9fcmVzaXplZC8zMTJCNTVDRkRDOTI0NzIzXzUzXzcwLmpwZ1wiLFwiYXNzZXRzL19yZXNpemVkLzMxMkI1NUNGREM5MjQ3MjNfMjdfMzUuanBnXCIsXCJhc3NldHMvX3Jlc2l6ZWQvMzEyQjU1Q0ZEQzkyNDcyM18xNF8xOC5qcGdcIl0sXCJ3aWR0aFwiOjEwNSxcImhlaWdodFwiOjE0MCxcInhcIjo3NTYsXCJ5XCI6NTYsXCJ6XCI6MH0sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJUZXh0XCIsXCJhdHRyc1wiOntcInhcIjo3NTYsXCJ5XCI6MjEyLjgsXCJ3aWR0aFwiOjUyLjUsXCJoZWlnaHRcIjo4NCxcInNpemVcIjo0MDAsXCJjb250ZW50XCI6XCJCXCIsXCJ6XCI6MX0sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJUZXh0XCIsXCJhdHRyc1wiOntcInhcIjo4MDguNSxcInlcIjoyMTIuOCxcIndpZHRoXCI6NTIuNSxcImhlaWdodFwiOjg0LFwic2l6ZVwiOjQwMCxcImFsaWduXCI6XCJyaWdodFwiLFwiY29udGVudFwiOlwiT1wiLFwielwiOjJ9LFwiY2hpbGRyZW5cIjpbXX0se1widHlwZVwiOlwiSW1hZ2VcIixcImF0dHJzXCI6e1wic3JjXCI6W1wiYXNzZXRzL19yZXNpemVkLzFBRjcxMThCMzExQzQ5QkJfMTA1XzE0MC5qcGdcIixcImFzc2V0cy9fcmVzaXplZC8xQUY3MTE4QjMxMUM0OUJCXzUzXzcwLmpwZ1wiLFwiYXNzZXRzL19yZXNpemVkLzFBRjcxMThCMzExQzQ5QkJfMjdfMzUuanBnXCIsXCJhc3NldHMvX3Jlc2l6ZWQvMUFGNzExOEIzMTFDNDlCQl8xNF8xOC5qcGdcIl0sXCJ3aWR0aFwiOjEwNSxcImhlaWdodFwiOjE0MCxcInlcIjoyOTEuMixcInhcIjo3NTYsXCJ6XCI6M30sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJUZXh0XCIsXCJhdHRyc1wiOntcInlcIjo1NjAsXCJ3aWR0aFwiOjEwNSxcImhlaWdodFwiOjU2LFwic2l6ZVwiOjIwMCxcImFsaWduXCI6XCJjZW50ZXJcIixcImNvbnRlbnRcIjpcIkxPVkVcIixcInhcIjo3NTYsXCJ6XCI6NH0sXCJjaGlsZHJlblwiOltdfV19LHtcInR5cGVcIjpcIlJlY3RcIixcImF0dHJzXCI6e1wieFwiOjkxNyxcInlcIjo1NixcIndpZHRoXCI6MTA1LFwiaGVpZ2h0XCI6NTYwLFwielwiOjF9LFwiY2hpbGRyZW5cIjpbe1widHlwZVwiOlwiSW1hZ2VcIixcImF0dHJzXCI6e1wic3JjXCI6W1wiYXNzZXRzL19yZXNpemVkLzMxMkI1NUNGREM5MjQ3MjNfMTA1XzE0MC5qcGdcIixcImFzc2V0cy9fcmVzaXplZC8zMTJCNTVDRkRDOTI0NzIzXzUzXzcwLmpwZ1wiLFwiYXNzZXRzL19yZXNpemVkLzMxMkI1NUNGREM5MjQ3MjNfMjdfMzUuanBnXCIsXCJhc3NldHMvX3Jlc2l6ZWQvMzEyQjU1Q0ZEQzkyNDcyM18xNF8xOC5qcGdcIl0sXCJ3aWR0aFwiOjEwNSxcImhlaWdodFwiOjE0MCxcInhcIjo5MTcsXCJ5XCI6NTYsXCJ6XCI6MH0sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJUZXh0XCIsXCJhdHRyc1wiOntcInhcIjo5MTcsXCJ5XCI6MjEyLjgsXCJ3aWR0aFwiOjUyLjUsXCJoZWlnaHRcIjo4NCxcInNpemVcIjo0MDAsXCJjb250ZW50XCI6XCJFXCIsXCJ6XCI6MX0sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJUZXh0XCIsXCJhdHRyc1wiOntcInhcIjo5NjkuNSxcInlcIjoyMTIuOCxcIndpZHRoXCI6NTIuNSxcImhlaWdodFwiOjg0LFwic2l6ZVwiOjQwMCxcImFsaWduXCI6XCJyaWdodFwiLFwiY29udGVudFwiOlwiTlwiLFwielwiOjJ9LFwiY2hpbGRyZW5cIjpbXX0se1widHlwZVwiOlwiSW1hZ2VcIixcImF0dHJzXCI6e1wic3JjXCI6W1wiYXNzZXRzL19yZXNpemVkLzFBRjcxMThCMzExQzQ5QkJfMTA1XzE0MC5qcGdcIixcImFzc2V0cy9fcmVzaXplZC8xQUY3MTE4QjMxMUM0OUJCXzUzXzcwLmpwZ1wiLFwiYXNzZXRzL19yZXNpemVkLzFBRjcxMThCMzExQzQ5QkJfMjdfMzUuanBnXCIsXCJhc3NldHMvX3Jlc2l6ZWQvMUFGNzExOEIzMTFDNDlCQl8xNF8xOC5qcGdcIl0sXCJ3aWR0aFwiOjEwNSxcImhlaWdodFwiOjE0MCxcInlcIjoyOTEuMixcInhcIjo5MTcsXCJ6XCI6M30sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJUZXh0XCIsXCJhdHRyc1wiOntcInlcIjo1NjAsXCJ3aWR0aFwiOjEwNSxcImhlaWdodFwiOjU2LFwic2l6ZVwiOjIwMCxcImFsaWduXCI6XCJjZW50ZXJcIixcImNvbnRlbnRcIjpcIklOXCIsXCJ4XCI6OTE3LFwielwiOjR9LFwiY2hpbGRyZW5cIjpbXX1dfSx7XCJ0eXBlXCI6XCJSZWN0XCIsXCJhdHRyc1wiOntcInhcIjoxMDc4LFwieVwiOjU2LFwid2lkdGhcIjoxMDUsXCJoZWlnaHRcIjo1NjAsXCJ6XCI6Mn0sXCJjaGlsZHJlblwiOlt7XCJ0eXBlXCI6XCJJbWFnZVwiLFwiYXR0cnNcIjp7XCJzcmNcIjpbXCJhc3NldHMvX3Jlc2l6ZWQvMzEyQjU1Q0ZEQzkyNDcyM18xMDVfMTQwLmpwZ1wiLFwiYXNzZXRzL19yZXNpemVkLzMxMkI1NUNGREM5MjQ3MjNfNTNfNzAuanBnXCIsXCJhc3NldHMvX3Jlc2l6ZWQvMzEyQjU1Q0ZEQzkyNDcyM18yN18zNS5qcGdcIixcImFzc2V0cy9fcmVzaXplZC8zMTJCNTVDRkRDOTI0NzIzXzE0XzE4LmpwZ1wiXSxcIndpZHRoXCI6MTA1LFwiaGVpZ2h0XCI6MTQwLFwieFwiOjEwNzgsXCJ5XCI6NTYsXCJ6XCI6MH0sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJUZXh0XCIsXCJhdHRyc1wiOntcInhcIjoxMDc4LFwieVwiOjIxMi44LFwid2lkdGhcIjo1Mi41LFwiaGVpZ2h0XCI6ODQsXCJzaXplXCI6NDAwLFwiY29udGVudFwiOlwiQlwiLFwielwiOjF9LFwiY2hpbGRyZW5cIjpbXX0se1widHlwZVwiOlwiVGV4dFwiLFwiYXR0cnNcIjp7XCJ4XCI6MTEzMC41LFwieVwiOjIxMi44LFwid2lkdGhcIjo1Mi41LFwiaGVpZ2h0XCI6ODQsXCJzaXplXCI6NDAwLFwiYWxpZ25cIjpcInJpZ2h0XCIsXCJjb250ZW50XCI6XCJPXCIsXCJ6XCI6Mn0sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJJbWFnZVwiLFwiYXR0cnNcIjp7XCJzcmNcIjpbXCJhc3NldHMvX3Jlc2l6ZWQvMUFGNzExOEIzMTFDNDlCQl8xMDVfMTQwLmpwZ1wiLFwiYXNzZXRzL19yZXNpemVkLzFBRjcxMThCMzExQzQ5QkJfNTNfNzAuanBnXCIsXCJhc3NldHMvX3Jlc2l6ZWQvMUFGNzExOEIzMTFDNDlCQl8yN18zNS5qcGdcIixcImFzc2V0cy9fcmVzaXplZC8xQUY3MTE4QjMxMUM0OUJCXzE0XzE4LmpwZ1wiXSxcIndpZHRoXCI6MTA1LFwiaGVpZ2h0XCI6MTQwLFwieVwiOjI5MS4yLFwieFwiOjEwNzgsXCJ6XCI6M30sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJUZXh0XCIsXCJhdHRyc1wiOntcInlcIjo1NjAsXCJ3aWR0aFwiOjEwNSxcImhlaWdodFwiOjU2LFwic2l6ZVwiOjIwMCxcImFsaWduXCI6XCJjZW50ZXJcIixcImNvbnRlbnRcIjpcIkFcIixcInhcIjoxMDc4LFwielwiOjR9LFwiY2hpbGRyZW5cIjpbXX1dfSx7XCJ0eXBlXCI6XCJSZWN0XCIsXCJhdHRyc1wiOntcInhcIjoxMjM5LFwieVwiOjU2LFwid2lkdGhcIjoxMDUsXCJoZWlnaHRcIjo1NjAsXCJ6XCI6M30sXCJjaGlsZHJlblwiOlt7XCJ0eXBlXCI6XCJJbWFnZVwiLFwiYXR0cnNcIjp7XCJzcmNcIjpbXCJhc3NldHMvX3Jlc2l6ZWQvMzEyQjU1Q0ZEQzkyNDcyM18xMDVfMTQwLmpwZ1wiLFwiYXNzZXRzL19yZXNpemVkLzMxMkI1NUNGREM5MjQ3MjNfNTNfNzAuanBnXCIsXCJhc3NldHMvX3Jlc2l6ZWQvMzEyQjU1Q0ZEQzkyNDcyM18yN18zNS5qcGdcIixcImFzc2V0cy9fcmVzaXplZC8zMTJCNTVDRkRDOTI0NzIzXzE0XzE4LmpwZ1wiXSxcIndpZHRoXCI6MTA1LFwiaGVpZ2h0XCI6MTQwLFwieFwiOjEyMzksXCJ5XCI6NTYsXCJ6XCI6MH0sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJUZXh0XCIsXCJhdHRyc1wiOntcInhcIjoxMjM5LFwieVwiOjIxMi44LFwid2lkdGhcIjo1Mi41LFwiaGVpZ2h0XCI6ODQsXCJzaXplXCI6NDAwLFwiY29udGVudFwiOlwiRVwiLFwielwiOjF9LFwiY2hpbGRyZW5cIjpbXX0se1widHlwZVwiOlwiVGV4dFwiLFwiYXR0cnNcIjp7XCJ4XCI6MTI5MS41LFwieVwiOjIxMi44LFwid2lkdGhcIjo1Mi41LFwiaGVpZ2h0XCI6ODQsXCJzaXplXCI6NDAwLFwiYWxpZ25cIjpcInJpZ2h0XCIsXCJjb250ZW50XCI6XCJOXCIsXCJ6XCI6Mn0sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJJbWFnZVwiLFwiYXR0cnNcIjp7XCJzcmNcIjpbXCJhc3NldHMvX3Jlc2l6ZWQvMUFGNzExOEIzMTFDNDlCQl8xMDVfMTQwLmpwZ1wiLFwiYXNzZXRzL19yZXNpemVkLzFBRjcxMThCMzExQzQ5QkJfNTNfNzAuanBnXCIsXCJhc3NldHMvX3Jlc2l6ZWQvMUFGNzExOEIzMTFDNDlCQl8yN18zNS5qcGdcIixcImFzc2V0cy9fcmVzaXplZC8xQUY3MTE4QjMxMUM0OUJCXzE0XzE4LmpwZ1wiXSxcIndpZHRoXCI6MTA1LFwiaGVpZ2h0XCI6MTQwLFwieVwiOjI5MS4yLFwieFwiOjEyMzksXCJ6XCI6M30sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJUZXh0XCIsXCJhdHRyc1wiOntcInlcIjo1NjAsXCJ3aWR0aFwiOjEwNSxcImhlaWdodFwiOjU2LFwic2l6ZVwiOjIwMCxcImFsaWduXCI6XCJjZW50ZXJcIixcImNvbnRlbnRcIjpcIlNPTkdcIixcInhcIjoxMjM5LFwielwiOjR9LFwiY2hpbGRyZW5cIjpbXX1dfV19LHtcInR5cGVcIjpcIlJlZ2lvblwiLFwiYXR0cnNcIjp7XCJjb2xvclwiOlwiI2ZmZmRlZVwiLFwiaGVpZ2h0XCI6NzAwLFwid2lkdGhcIjo3MDAsXCJ4XCI6MTQwMCxcInlcIjowfSxcImNoaWxkcmVuXCI6W3tcInR5cGVcIjpcIlJlY3RcIixcImF0dHJzXCI6e1wieFwiOjE0MTQsXCJ5XCI6MTQsXCJ3aWR0aFwiOjcwMCxcImhlaWdodFwiOjU2MCxcInpcIjowfSxcImNoaWxkcmVuXCI6W3tcInR5cGVcIjpcIkltYWdlXCIsXCJhdHRyc1wiOntcInNyY1wiOltcImFzc2V0cy9fcmVzaXplZC8zMTJCNTVDRkRDOTI0NzIzXzM1MF81NjAuanBnXCIsXCJhc3NldHMvX3Jlc2l6ZWQvMzEyQjU1Q0ZEQzkyNDcyM18xNzVfMjgwLmpwZ1wiLFwiYXNzZXRzL19yZXNpemVkLzMxMkI1NUNGREM5MjQ3MjNfODhfMTQwLmpwZ1wiLFwiYXNzZXRzL19yZXNpemVkLzMxMkI1NUNGREM5MjQ3MjNfNDRfNzAuanBnXCJdLFwid2lkdGhcIjozNTAsXCJoZWlnaHRcIjo1NjAsXCJ4XCI6MTQxNCxcInlcIjoxNCxcInpcIjowfSxcImNoaWxkcmVuXCI6W119LHtcInR5cGVcIjpcIkltYWdlXCIsXCJhdHRyc1wiOntcInNyY1wiOltcImFzc2V0cy9fcmVzaXplZC8xQUY3MTE4QjMxMUM0OUJCXzM1MF80NDguanBnXCIsXCJhc3NldHMvX3Jlc2l6ZWQvMUFGNzExOEIzMTFDNDlCQl8xNzVfMjI0LmpwZ1wiLFwiYXNzZXRzL19yZXNpemVkLzFBRjcxMThCMzExQzQ5QkJfODhfMTEyLmpwZ1wiLFwiYXNzZXRzL19yZXNpemVkLzFBRjcxMThCMzExQzQ5QkJfNDRfNTYuanBnXCJdLFwid2lkdGhcIjozNTAsXCJoZWlnaHRcIjo0NDgsXCJ4XCI6MTU1NCxcInlcIjoxODIsXCJ6XCI6MX0sXCJjaGlsZHJlblwiOltdfV19LHtcInR5cGVcIjpcIkVsbGlwc2VcIixcImF0dHJzXCI6e1wiY29sb3JcIjpcIiNlMzVlMzNcIixcIndpZHRoXCI6MjEwLFwiaGVpZ2h0XCI6MjEwLFwieFwiOjE4MjAsXCJ5XCI6MTQwLFwielwiOjF9LFwiY2hpbGRyZW5cIjpbXX0se1widHlwZVwiOlwiU29uZ1wiLFwiYXR0cnNcIjp7XCJzcmNcIjpcImFzc2V0cy90aGF0d2FzbWUzLm1wM1wiLFwidGl0bGVcIjpcIlRoYXQgV2FzIE1lXCIsXCJ4XCI6MjAzMCxcInlcIjo2MzAsXCJ3aWR0aFwiOjAsXCJ6XCI6MixcImhlaWdodFwiOjB9LFwiY2hpbGRyZW5cIjpbXX1dfSx7XCJ0eXBlXCI6XCJSZWdpb25cIixcImF0dHJzXCI6e1wiY29sb3JcIjpcIiNlMzVlMzNcIixcImhlaWdodFwiOjcwMCxcIndpZHRoXCI6NzAwLFwieFwiOjIxMDAsXCJ5XCI6MH0sXCJjaGlsZHJlblwiOlt7XCJ0eXBlXCI6XCJSZWN0XCIsXCJhdHRyc1wiOntcInhcIjoyMTE0LFwieVwiOjE0LFwid2lkdGhcIjo3MDAsXCJoZWlnaHRcIjo1NjAsXCJ6XCI6MH0sXCJjaGlsZHJlblwiOlt7XCJ0eXBlXCI6XCJJbWFnZVwiLFwiYXR0cnNcIjp7XCJzcmNcIjpbXCJhc3NldHMvX3Jlc2l6ZWQvMzEyQjU1Q0ZEQzkyNDcyM18zNTBfNTYwLmpwZ1wiLFwiYXNzZXRzL19yZXNpemVkLzMxMkI1NUNGREM5MjQ3MjNfMTc1XzI4MC5qcGdcIixcImFzc2V0cy9fcmVzaXplZC8zMTJCNTVDRkRDOTI0NzIzXzg4XzE0MC5qcGdcIixcImFzc2V0cy9fcmVzaXplZC8zMTJCNTVDRkRDOTI0NzIzXzQ0XzcwLmpwZ1wiXSxcIndpZHRoXCI6MzUwLFwiaGVpZ2h0XCI6NTYwLFwieFwiOjIxMTQsXCJ5XCI6MTQsXCJ6XCI6MH0sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJJbWFnZVwiLFwiYXR0cnNcIjp7XCJzcmNcIjpbXCJhc3NldHMvX3Jlc2l6ZWQvMUFGNzExOEIzMTFDNDlCQl8zNTBfNDQ4LmpwZ1wiLFwiYXNzZXRzL19yZXNpemVkLzFBRjcxMThCMzExQzQ5QkJfMTc1XzIyNC5qcGdcIixcImFzc2V0cy9fcmVzaXplZC8xQUY3MTE4QjMxMUM0OUJCXzg4XzExMi5qcGdcIixcImFzc2V0cy9fcmVzaXplZC8xQUY3MTE4QjMxMUM0OUJCXzQ0XzU2LmpwZ1wiXSxcIndpZHRoXCI6MzUwLFwiaGVpZ2h0XCI6NDQ4LFwieFwiOjIyNTQsXCJ5XCI6MTgyLFwielwiOjF9LFwiY2hpbGRyZW5cIjpbXX1dfSx7XCJ0eXBlXCI6XCJFbGxpcHNlXCIsXCJhdHRyc1wiOntcImNvbG9yXCI6MCxcIndpZHRoXCI6MjEwLFwiaGVpZ2h0XCI6MjEwLFwieFwiOjI1MjAsXCJ5XCI6MTQwLFwielwiOjF9LFwiY2hpbGRyZW5cIjpbXX0se1widHlwZVwiOlwiU29uZ1wiLFwiYXR0cnNcIjp7XCJzcmNcIjpcImFzc2V0cy90aGF0d2FzbWUzLm1wM1wiLFwidGl0bGVcIjpcIlRoYXQgV2FzIE1lXCIsXCJ4XCI6MjczMCxcInlcIjo2MzAsXCJ3aWR0aFwiOjAsXCJ6XCI6MixcImhlaWdodFwiOjB9LFwiY2hpbGRyZW5cIjpbXX1dfSx7XCJ0eXBlXCI6XCJSZWdpb25cIixcImF0dHJzXCI6e1wiY29sb3JcIjpcIiNlMzVlMzNcIixcImhlaWdodFwiOjcwMCxcIndpZHRoXCI6NzAwLFwieFwiOjAsXCJ5XCI6NzAwfSxcImNoaWxkcmVuXCI6W119LHtcInR5cGVcIjpcIlJlZ2lvblwiLFwiYXR0cnNcIjp7XCJjb2xvclwiOlwiI2UzNWUzM1wiLFwiY2xhc3Nlc1wiOltcInRvdXJcIl0sXCJoZWlnaHRcIjo3MDAsXCJ3aWR0aFwiOjcwMCxcInhcIjo3MDAsXCJ5XCI6NzAwfSxcImNoaWxkcmVuXCI6W3tcInR5cGVcIjpcIlJlY3RcIixcImF0dHJzXCI6e1wiY29sb3JcIjpcInNpbHZlclwiLFwieFwiOjcwMCxcInlcIjo3MDAsXCJ3aWR0aFwiOjM1MCxcImhlaWdodFwiOjQ4OS45OTk5OTk5OTk5OTk5NCxcInpcIjowfSxcImNoaWxkcmVuXCI6W119LHtcInR5cGVcIjpcIlRleHRcIixcImF0dHJzXCI6e1wiY29sb3JcIjpcIiNmZmZkZWVcIixcInhcIjo3MzUsXCJ5XCI6NzM1LFwid2lkdGhcIjo2MzAsXCJoZWlnaHRcIjo3MCxcInNpemVcIjo0NTAsXCJhbGlnblwiOlwibGVmdFwiLFwiY29udGVudFwiOlwiMTUgU2VwdGVtYnJvIDIwMTdcIixcInpcIjoxfSxcImNoaWxkcmVuXCI6W119LHtcInR5cGVcIjpcIlRleHRcIixcImF0dHJzXCI6e1wiY29sb3JcIjpcIiNmZmZkZWVcIixcInhcIjo3MzUsXCJ5XCI6ODA1LFwid2lkdGhcIjo2MzAsXCJoZWlnaHRcIjo3MCxcInNpemVcIjo0NTAsXCJhbGlnblwiOlwibGVmdFwiLFwiY29udGVudFwiOlwiMzEgT2N0b2J1ciAyMDE3XCIsXCJ6XCI6Mn0sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJUZXh0XCIsXCJhdHRyc1wiOntcImNvbG9yXCI6XCIjZmZmZGVlXCIsXCJ4XCI6NzM1LFwieVwiOjg3NSxcIndpZHRoXCI6NjMwLFwiaGVpZ2h0XCI6NzAsXCJzaXplXCI6NDUwLFwiYWxpZ25cIjpcImxlZnRcIixcImNvbnRlbnRcIjpcIjEgRGVjZW1iZXJlIDIwMTdcIixcInpcIjozfSxcImNoaWxkcmVuXCI6W119LHtcInR5cGVcIjpcIlRleHRcIixcImF0dHJzXCI6e1wiY29sb3JcIjpcIiNmZmZkZWVcIixcInhcIjo3MzUsXCJ5XCI6OTQ1LFwid2lkdGhcIjo2MzAsXCJoZWlnaHRcIjo3MCxcInNpemVcIjo0NTAsXCJhbGlnblwiOlwibGVmdFwiLFwiY29udGVudFwiOlwiNSBKYW5vb3JpIDIwMThcIixcInpcIjo0fSxcImNoaWxkcmVuXCI6W119LHtcInR5cGVcIjpcIlRleHRcIixcImF0dHJzXCI6e1wiY29sb3JcIjpcIiNmZmZkZWVcIixcInhcIjo3MzUsXCJ5XCI6MTAxNSxcIndpZHRoXCI6NjMwLFwiaGVpZ2h0XCI6NzAsXCJzaXplXCI6NDUwLFwiYWxpZ25cIjpcImxlZnRcIixcImNvbnRlbnRcIjpcIjUgRmVicnVhcmUgMjAxOFwiLFwielwiOjV9LFwiY2hpbGRyZW5cIjpbXX0se1widHlwZVwiOlwiVGV4dFwiLFwiYXR0cnNcIjp7XCJjb2xvclwiOlwiI2ZmZmRlZVwiLFwieFwiOjEyOTUsXCJ5XCI6NzQ5LFwid2lkdGhcIjo3MCxcImhlaWdodFwiOjcwLFwic2l6ZVwiOjUwLFwiYWxpZ25cIjpcImxlZnRcIixcImNvbnRlbnRcIjpcIlRoZSBQbGFjZTxici8+VGhlIENvdW50cnlcIixcInpcIjo2fSxcImNoaWxkcmVuXCI6W119LHtcInR5cGVcIjpcIlRleHRcIixcImF0dHJzXCI6e1wiY29sb3JcIjpcIiNmZmZkZWVcIixcInhcIjoxMjk1LFwieVwiOjgxOSxcIndpZHRoXCI6NzAsXCJoZWlnaHRcIjo3MCxcInNpemVcIjo1MCxcImFsaWduXCI6XCJsZWZ0XCIsXCJjb250ZW50XCI6XCJUaGUgUGxhY2U8YnIvPlRoZSBDb3VudHJ5XCIsXCJ6XCI6N30sXCJjaGlsZHJlblwiOltdfSx7XCJ0eXBlXCI6XCJUZXh0XCIsXCJhdHRyc1wiOntcImNvbG9yXCI6XCIjZmZmZGVlXCIsXCJ4XCI6MTI5NSxcInlcIjo4ODksXCJ3aWR0aFwiOjcwLFwiaGVpZ2h0XCI6NzAsXCJzaXplXCI6NTAsXCJhbGlnblwiOlwibGVmdFwiLFwiY29udGVudFwiOlwiVGhlIFBsYWNlPGJyLz5UaGUgQ291bnRyeVwiLFwielwiOjh9LFwiY2hpbGRyZW5cIjpbXX0se1widHlwZVwiOlwiVGV4dFwiLFwiYXR0cnNcIjp7XCJjb2xvclwiOlwiI2ZmZmRlZVwiLFwieFwiOjEyOTUsXCJ5XCI6OTU5LFwid2lkdGhcIjo3MCxcImhlaWdodFwiOjcwLFwic2l6ZVwiOjUwLFwiYWxpZ25cIjpcImxlZnRcIixcImNvbnRlbnRcIjpcIlRoZSBQbGFjZTxici8+VGhlIENvdW50cnlcIixcInpcIjo5fSxcImNoaWxkcmVuXCI6W119LHtcInR5cGVcIjpcIlRleHRcIixcImF0dHJzXCI6e1wiY29sb3JcIjpcIiNmZmZkZWVcIixcInhcIjoxMjk1LFwieVwiOjEwMjksXCJ3aWR0aFwiOjcwLFwiaGVpZ2h0XCI6NzAsXCJzaXplXCI6NTAsXCJhbGlnblwiOlwibGVmdFwiLFwiY29udGVudFwiOlwiVGhlIFBsYWNlPGJyLz5UaGUgQ291bnRyeVwiLFwielwiOjEwfSxcImNoaWxkcmVuXCI6W119XX1dfSIsInZhciBWZWN0b3IyID0gcmVxdWlyZSgnLi92ZW5kb3IvdmVjdG9yMi5qcycpO1xudmFyIE1hdHJpeCA9IHJlcXVpcmUoJ3RyYW5zZm9ybWF0aW9uLW1hdHJpeC1qcycpLk1hdHJpeDtcbnZhciB7IFBSRUZJWEVEX1RSQU5TRk9STSB9ID0gcmVxdWlyZSgnLi9saWIvdXRpbHMuanMnKTtcblxudmFyIHR5cGVzID0ge1xuICAgIFJlZ2lvbjogcmVxdWlyZSgnLi90eXBlcy9yZWdpb24uanMnKSxcbiAgICBSZWN0OiByZXF1aXJlKCcuL3R5cGVzL3JlY3QuanMnKSxcbiAgICBFbGxpcHNlOiByZXF1aXJlKCcuL3R5cGVzL2VsbGlwc2UuanMnKSxcbiAgICBUZXh0OiByZXF1aXJlKCcuL3R5cGVzL3RleHQuanMnKSxcbiAgICBJbWFnZTogcmVxdWlyZSgnLi90eXBlcy9pbWFnZS5qcycpLFxuICAgIFNvbmc6IHJlcXVpcmUoJy4vdHlwZXMvc29uZy5qcycpLFxuICAgIFNwcml0ZTogcmVxdWlyZSgnLi90eXBlcy9zcHJpdGUuanMnKSxcbiAgICBDaGFyYWN0ZXI6IHJlcXVpcmUoJy4vdHlwZXMvY2hhcmFjdGVyLmpzJylcbn1cblxudmFyIG1hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbnZhciBTQ0FMRSA9IG5ldyBWZWN0b3IyKCAxLCAuNSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFdvcmxkIHtcbiAgICBcbiAgICBjb25zdHJ1Y3RvciAoIGNvbmZpZywgY29udGV4dCApIHtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGNvbnRleHQud29ybGRFbGVtZW50O1xuICAgICAgICB0aGlzLnJlZ2lvbnMgPSB0aGlzLmNyZWF0ZSggY29uZmlnLmNoaWxkcmVuLCBjb250ZXh0ICk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmNlbnRlciA9IG5ldyBWZWN0b3IyKCk7XG5cbiAgICAgICAgLy90aGlzLnJlZ2lvbnMuZm9yRWFjaCggcmVnaW9uID0+IHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChyZWdpb24uZWxlbWVudCkgKTtcbiAgICAgICAgXG4gICAgfVxuICAgIFxuICAgIGNyZWF0ZSAoIGNvbmZpZywgY29udGV4dCApIHtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBjb25maWcubWFwKCBjZmcgPT4ge1xuICAgICAgICBcbiAgICAgICAgICAgIHZhciBDdG9yID0gdHlwZXNbIGNmZy50eXBlIF07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBpbnN0YW5jZSA9IG5ldyBDdG9yKCBjZmcuYXR0cnMsIGNvbnRleHQgKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaW5zdGFuY2UuYWRkQ2hpbGRyZW4oIHRoaXMuY3JlYXRlKCBjZmcuY2hpbGRyZW4sIGNvbnRleHQgKSApXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgfVxuICAgIFxuICAgIGZpbmQoIGZuICkge1xuICAgICAgICBcbiAgICAgICAgaWYoIHR5cGVvZiBmbiA9PT0gJ3N0cmluZycgKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZuID0geCA9PiB4ID09PSBmbjtcbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgZm91bmQgPSBbXTtcbiAgICAgICAgXG4gICAgICAgIHZhciByZWR1Y2VyID0gKHJldCwgaXRlbSkgPT4ge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiggZm4oaXRlbSkgKSByZXQucHVzaCggaXRlbSApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gaXRlbS5jaGlsZHJlbi5yZWR1Y2UoIHJlZHVjZXIsIHJldCApO1xuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lvbnMucmVkdWNlKCByZWR1Y2VyLCBbXSApO1xuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgLy8gcm90YXRlKCBhICkge1xuICAgICAgICBcbiAgICAvLyAgICAgdGhpcy5hbmdsZSA9IGE7XG4gICAgICAgIFxuICAgIC8vICAgICB2YXIgdCA9IDIwMDtcbiAgICAgICAgXG4gICAgLy8gICAgIHZhciB0cmFuc2xhdGUgPSBuZXcgTWF0cml4KCkudHJhbnNsYXRlKCAtdCwgLXQgKTtcbiAgICAvLyAgICAgdmFyIHJvdGF0ZSA9IG5ldyBNYXRyaXgoKS5yb3RhdGVEZWcoIGEgKTtcbiAgICAvLyAgICAgdmFyIHRyYW5zbGF0ZUludiA9IG5ldyBNYXRyaXgoKS50cmFuc2xhdGUoIHQsIHQgKTtcbiAgICAgICAgXG4gICAgLy8gICAgIG1hdHJpeFxuICAgIC8vICAgICAgICAgLnJlc2V0KClcbiAgICAvLyAgICAgICAgIC8vLnRyYW5zbGF0ZSggLXQsIC10IClcbiAgICAvLyAgICAgICAgIC5yb3RhdGUoIGEgKVxuICAgIC8vICAgICAvLyAgICAgLnRyYW5zbGF0ZSggdCwgdCApXG4gICAgICAgICAgICBcbiAgICAvLyAgICAgY29uc29sZS5sb2coIG1hdHJpeC50b0NTUygpICk7XG4gICAgICAgIFxuICAgICAgICBcbiAgICAvLyAgICAgLy90aGlzLmVsZW1lbnQuc3R5bGUudHJhbnNmb3JtT3JpZ2luID0gJzIwMHB4IDIwMHB4J1xuICAgIC8vICAgICB0aGlzLmVsZW1lbnQuc3R5bGVbIFBSRUZJWEVEX1RSQU5TRk9STSBdID0gbWF0cml4LnRvQ1NTM0QoKTtcbiAgICAgICAgXG4gICAgLy8gfVxuICAgIFxufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBBdCBsZWFzdCBnaXZlIHNvbWUga2luZCBvZiBjb250ZXh0IHRvIHRoZSB1c2VyXG4gICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuICgnICsgZXIgKyAnKScpO1xuICAgICAgICBlcnIuY29udGV4dCA9IGVyO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSBpZiAobGlzdGVuZXJzKSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAodGhpcy5fZXZlbnRzKSB7XG4gICAgdmFyIGV2bGlzdGVuZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgICBpZiAoaXNGdW5jdGlvbihldmxpc3RlbmVyKSlcbiAgICAgIHJldHVybiAxO1xuICAgIGVsc2UgaWYgKGV2bGlzdGVuZXIpXG4gICAgICByZXR1cm4gZXZsaXN0ZW5lci5sZW5ndGg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgcmV0dXJuIGVtaXR0ZXIubGlzdGVuZXJDb3VudCh0eXBlKTtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsIi8qXG4gKiBkZXRlY3RDU1NcbiAqIGh0dHA6Ly9naXRodWIuYW1leHB1Yi5jb20vbW9kdWxlcy9kZXRlY3RDU1NcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMgQW1leFB1Yi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL2RldGVjdENTUycpO1xuIiwiLypcbiAqIGRldGVjdENTU1xuICogaHR0cDovL2dpdGh1Yi5hbWV4cHViLmNvbS9tb2R1bGVzXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEzIEFtZXggUHViLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5mZWF0dXJlID0gZnVuY3Rpb24oc3R5bGUpIHtcbiAgICB2YXIgYiA9IGRvY3VtZW50LmJvZHkgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICAgIHZhciBzID0gYi5zdHlsZTtcbiAgICB2YXIgcCA9IHN0eWxlO1xuICAgIGlmKHR5cGVvZiBzW3BdID09PSAnc3RyaW5nJykge3JldHVybiB0cnVlOyB9XG5cbiAgICAvLyBUZXN0cyBmb3IgdmVuZG9yIHNwZWNpZmljIHByb3BcbiAgICB2YXIgdiA9IFsnTW96JywgJ1dlYmtpdCcsICdLaHRtbCcsICdPJywgJ21zJ107XG4gICAgcCA9IHAuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwLnN1YnN0cigxKTtcbiAgICBmb3IodmFyIGk9MDsgaTx2Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZih0eXBlb2Ygc1t2W2ldICsgcF0gPT09ICdzdHJpbmcnKSB7IHJldHVybiB0cnVlOyB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn07XG5cbmV4cG9ydHMucHJlZml4ZWQgPSBmdW5jdGlvbihzdHlsZSl7XG4gICAgdmFyIGIgPSBkb2N1bWVudC5ib2R5IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgICB2YXIgcyA9IGIuc3R5bGU7XG4gICAgdmFyIHAgPSBzdHlsZTtcbiAgICBpZih0eXBlb2Ygc1twXSA9PT0gJ3N0cmluZycpIHtyZXR1cm4gcDsgfVxuXG4gICAgLy8gVGVzdHMgZm9yIHZlbmRvciBzcGVjaWZpYyBwcm9wXG4gICAgdmFyIHYgPSBbJ01veicsICdXZWJraXQnLCAnS2h0bWwnLCAnTycsICdtcycsJyddO1xuICAgIHAgPSBwLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcC5zdWJzdHIoMSk7XG4gICAgZm9yKHZhciBpPTA7IGk8di5sZW5ndGg7IGkrKykge1xuICAgICAgaWYodHlwZW9mIHNbdltpXSArIHBdID09PSAnc3RyaW5nJykgeyByZXR1cm4gdltpXSArIHA7IH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufTsiLCIvKiFcclxuXHQyRCBUcmFuc2Zvcm1hdGlvbiBNYXRyaXggdjIuNi41XHJcblx0KGMpIEVwaXN0ZW1leC5jb20gMjAxNC0yMDE2XHJcblx0TGljZW5zZTogTUlULCBoZWFkZXIgcmVxdWlyZWQuXHJcbiovXHJcblxyXG4vKiAtLS0gVG8gc2VlIGNvbnRyaWJ1dG9yczogcGxlYXNlIHNlZSByZWFkbWUubWQgYW5kIENoYW5nZS5sb2cgLS0tICovXHJcblxyXG4vKipcclxuICogMkQgdHJhbnNmb3JtYXRpb24gbWF0cml4IG9iamVjdCBpbml0aWFsaXplZCB3aXRoIGlkZW50aXR5IG1hdHJpeC5cclxuICpcclxuICogVGhlIG1hdHJpeCBjYW4gc3luY2hyb25pemUgYSBjYW52YXMgMkQgY29udGV4dCBieSBzdXBwbHlpbmcgdGhlIGNvbnRleHRcclxuICogYXMgYW4gYXJndW1lbnQsIG9yIGxhdGVyIGFwcGx5IGN1cnJlbnQgYWJzb2x1dGUgdHJhbnNmb3JtIHRvIGFuXHJcbiAqIGV4aXN0aW5nIGNvbnRleHQuXHJcbiAqXHJcbiAqIFRvIHN5bmNocm9uaXplIGEgRE9NIGVsZW1lbnQgeW91IGNhbiB1c2UgW2B0b0NTUygpYF17QGxpbmsgTWF0cml4I3RvQ1NTfSBvciBbYHRvQ1NTM0QoKWBde0BsaW5rIE1hdHJpeCN0b0NTUzNEfS5cclxuICpcclxuICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IFtjb250ZXh0XSAtIE9wdGlvbmFsIGNvbnRleHQgdG8gc3luYyB3aXRoIE1hdHJpeFxyXG4gKiBAcHJvcCB7bnVtYmVyfSBhIC0gc2NhbGUgeFxyXG4gKiBAcHJvcCB7bnVtYmVyfSBiIC0gc2hlYXIgeVxyXG4gKiBAcHJvcCB7bnVtYmVyfSBjIC0gc2hlYXIgeFxyXG4gKiBAcHJvcCB7bnVtYmVyfSBkIC0gc2NhbGUgeVxyXG4gKiBAcHJvcCB7bnVtYmVyfSBlIC0gdHJhbnNsYXRlIHhcclxuICogQHByb3Age251bWJlcn0gZiAtIHRyYW5zbGF0ZSB5XHJcbiAqIEBwcm9wIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR8bnVsbH0gW2NvbnRleHQ9bnVsbF0gLSBzZXQgb3IgZ2V0IGN1cnJlbnQgY2FudmFzIGNvbnRleHRcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBsaWNlbnNlIE1JVCBsaWNlbnNlIChoZWFkZXIgcmVxdWlyZWQpXHJcbiAqIEBjb3B5cmlnaHQgRXBpc3RlbWV4LmNvbSAyMDE0LTIwMTZcclxuICovXHJcbmZ1bmN0aW9uIE1hdHJpeChjb250ZXh0KSB7XHJcblxyXG5cdHZhciBtZSA9IHRoaXM7XHJcblx0bWUuX3QgPSBtZS50cmFuc2Zvcm07XHJcblxyXG5cdG1lLmEgPSBtZS5kID0gMTtcclxuXHRtZS5iID0gbWUuYyA9IG1lLmUgPSBtZS5mID0gMDtcclxuXHJcblx0Ly8gcmVzZXQgY2FudmFzIHRvIGVuYWJsZSAxMDAlIHN5bmMuXHJcblx0aWYgKGNvbnRleHQpXHJcblx0XHQobWUuY29udGV4dCA9IGNvbnRleHQpLnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgYSBuZXcgbWF0cml4IHRoYXQgdHJhbnNmb3JtcyBhIHRyaWFuZ2xlIGB0MWAgaW50byBhbm90aGVyIHRyaWFuZ2xlXHJcbiAqIGB0MmAsIG9yIHRocm93cyBhbiBleGNlcHRpb24gaWYgaXQgaXMgaW1wb3NzaWJsZS5cclxuICpcclxuICogTm90ZTogdGhlIG1ldGhvZCBjYW4gdGFrZSBib3RoIGFycmF5cyBhcyB3ZWxsIGFzIGxpdGVyYWwgb2JqZWN0cy5cclxuICogSnVzdCBtYWtlIHN1cmUgdGhhdCBib3RoIGFyZ3VtZW50cyAoYHQxYCwgYHQyYCkgYXJlIG9mIHRoZSBzYW1lIHR5cGUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7e3B4OiBudW1iZXIsIHB5OiBudW1iZXIsIHF4OiBudW1iZXIsIHF5OiBudW1iZXIsIHJ4OiBudW1iZXIsIHJ5OiBudW1iZXJ9fEFycmF5fSB0MSAtIE9iamVjdCBvciBhcnJheSBjb250YWluaW5nIHRoZSB0aHJlZSBwb2ludHMgZm9yIHRoZSB0cmlhbmdsZS5cclxuICogRm9yIG9iamVjdCB1c2Ugb2JqLnB4LCBvYmoucHksIG9iai5xeCwgb2JqLnF5LCBvYmoucnggYW5kIG9iai5yeS4gRm9yIGFycmF5cyBwcm92aWRlIHRoZSBwb2ludHMgaW4gdGhlIG9yZGVyIFtweCwgcHksIHF4LCBxeSwgcngsIHJ5XSwgb3IgYXMgcG9pbnQgYXJyYXkgW3t4Oix5On0sIHt4Oix5On0sIHt4Oix5On1dXHJcbiAqIEBwYXJhbSB7e3B4OiBudW1iZXIsIHB5OiBudW1iZXIsIHF4OiBudW1iZXIsIHF5OiBudW1iZXIsIHJ4OiBudW1iZXIsIHJ5OiBudW1iZXJ9fEFycmF5fSB0MiAtIFNlZSBkZXNjcmlwdGlvbiBmb3IgdDEuXHJcbiAqIEBwYXJhbSB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBbY29udGV4dF0gLSBvcHRpb25hbCBjYW52YXMgMkQgY29udGV4dCB0byB1c2UgZm9yIHRoZSBtYXRyaXhcclxuICogQHJldHVybnMge01hdHJpeH1cclxuICogQHRocm93cyBFeGNlcHRpb24gaXMgbWF0cml4IGJlY29tZXMgbm90IGludmVydGlibGVcclxuICogQHN0YXRpY1xyXG4gKi9cclxuTWF0cml4LmZyb21UcmlhbmdsZXMgPSBmdW5jdGlvbih0MSwgdDIsIGNvbnRleHQpIHtcclxuXHJcblx0dmFyIG0xID0gbmV3IE1hdHJpeCgpLFxyXG5cdFx0bTIgPSBuZXcgTWF0cml4KGNvbnRleHQpLFxyXG5cdFx0cjEsIHIyLCByeDEsIHJ5MSwgcngyLCByeTI7XHJcblxyXG5cdGlmIChBcnJheS5pc0FycmF5KHQxKSkge1xyXG5cdFx0aWYgKHR5cGVvZiB0MVswXSA9PT0gXCJudW1iZXJcIikge1xyXG5cdFx0XHRyeDEgPSB0MVs0XTsgcnkxID0gdDFbNV07IHJ4MiA9IHQyWzRdOyByeTIgPSB0Mls1XTtcclxuXHRcdFx0cjEgPSBbdDFbMF0gLSByeDEsIHQxWzFdIC0gcnkxLCB0MVsyXSAtIHJ4MSwgdDFbM10gLSByeTEsIHJ4MSwgcnkxXTtcclxuXHRcdFx0cjIgPSBbdDJbMF0gLSByeDIsIHQyWzFdIC0gcnkyLCB0MlsyXSAtIHJ4MiwgdDJbM10gLSByeTIsIHJ4MiwgcnkyXVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHJ4MSA9IHQxWzJdLng7IHJ5MSA9IHQxWzJdLnk7IHJ4MiA9IHQyWzJdLng7IHJ5MiA9IHQyWzJdLnk7XHJcblx0XHRcdHIxID0gW3QxWzBdLnggLSByeDEsIHQxWzBdLnkgLSByeTEsIHQxWzFdLnggLSByeDEsIHQxWzFdLnkgLSByeTEsIHJ4MSwgcnkxXTtcclxuXHRcdFx0cjIgPSBbdDJbMF0ueCAtIHJ4MiwgdDJbMF0ueSAtIHJ5MiwgdDJbMV0ueCAtIHJ4MiwgdDFbMV0ueSAtIHJ5MiwgcngyLCByeTJdXHJcblx0XHR9XHJcblx0fVxyXG5cdGVsc2Uge1xyXG5cdFx0cjEgPSBbdDEucHggLSB0MS5yeCwgdDEucHkgLSB0MS5yeSwgdDEucXggLSB0MS5yeCwgdDEucXkgLSB0MS5yeSwgdDEucngsIHQxLnJ5XTtcclxuXHRcdHIyID0gW3QyLnB4IC0gdDIucngsIHQyLnB5IC0gdDIucnksIHQyLnF4IC0gdDIucngsIHQyLnF5IC0gdDIucnksIHQyLnJ4LCB0Mi5yeV1cclxuXHR9XHJcblxyXG5cdG0xLnNldFRyYW5zZm9ybS5hcHBseShtMSwgcjEpO1xyXG5cdG0yLnNldFRyYW5zZm9ybS5hcHBseShtMiwgcjIpO1xyXG5cclxuXHRyZXR1cm4gbTIubXVsdGlwbHkobTEuaW52ZXJzZSgpKVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhIG5ldyBtYXRyaXggZnJvbSBhIFNWR01hdHJpeFxyXG4gKlxyXG4gKiBAcGFyYW0ge1NWR01hdHJpeH0gc3ZnTWF0cml4IC0gc291cmNlIFNWRyBNYXRyaXhcclxuICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IFtjb250ZXh0XSAtIG9wdGlvbmFsIGNhbnZhcyAyRCBjb250ZXh0IHRvIHVzZSBmb3IgdGhlIG1hdHJpeFxyXG4gKiBAcmV0dXJucyB7TWF0cml4fVxyXG4gKiBAc3RhdGljXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TVkdNYXRyaXh8TUROIC8gU1ZHTWF0cml4fVxyXG4gKi9cclxuTWF0cml4LmZyb21TVkdNYXRyaXggPSBmdW5jdGlvbihzdmdNYXRyaXgsIGNvbnRleHQpIHtcclxuXHRjb25zb2xlLndhcm4oXCJPYnNvbGV0ZS4gVXNlIE1hdHJpeC5mcm9tKClcIik7XHJcblx0cmV0dXJuIG5ldyBNYXRyaXgoY29udGV4dCkubXVsdGlwbHkoc3ZnTWF0cml4KVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhIG5ldyBtYXRyaXggZnJvbSBhIERPTU1hdHJpeFxyXG4gKlxyXG4gKiBAcGFyYW0ge0RPTU1hdHJpeH0gZG9tTWF0cml4IC0gc291cmNlIERPTU1hdHJpeFxyXG4gKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gW2NvbnRleHRdIC0gb3B0aW9uYWwgY2FudmFzIDJEIGNvbnRleHQgdG8gdXNlIGZvciB0aGUgbWF0cml4XHJcbiAqIEByZXR1cm5zIHtNYXRyaXh9XHJcbiAqIEBzdGF0aWNcclxuICogQHByaXZhdGVcclxuICogQHNlZSB7QGxpbmsgaHR0cHM6Ly9kcmFmdHMuZnh0Zi5vcmcvZ2VvbWV0cnkvI2RvbW1hdHJpeHxNRE4gLyBET01NYXRyaXh9XHJcbiAqL1xyXG5NYXRyaXguZnJvbURPTU1hdHJpeCA9IGZ1bmN0aW9uKGRvbU1hdHJpeCwgY29udGV4dCkge1xyXG5cdGNvbnNvbGUud2FybihcIk9ic29sZXRlLiBVc2UgTWF0cml4LmZyb20oKVwiKTtcclxuXHRpZiAoIWRvbU1hdHJpeC5pczJEKSB0aHJvdyBcIkNhbm5vdCB1c2UgM0QgbWF0cml4LlwiO1xyXG5cdHJldHVybiBuZXcgTWF0cml4KGNvbnRleHQpLm11bHRpcGx5KGRvbU1hdHJpeClcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgYSBtYXRyaXggZnJvbSBhIHRyYW5zZm9ybSBsaXN0IGZyb20gYW4gU1ZHIHNoYXBlLiBUaGUgbGlzdFxyXG4gKiBjYW4gYmUgZm9yIGV4YW1wbGUgYmFzZVZhbCAoaS5lLiBgc2hhcGUudHJhbnNmb3JtLmJhc2VWYWxgKS5cclxuICpcclxuICogVGhlIHJlc3VsdGluZyBtYXRyaXggaGFzIGFsbCB0cmFuc2Zvcm1hdGlvbnMgZnJvbSB0aGF0IGxpc3QgYXBwbGllZFxyXG4gKiBpbiB0aGUgc2FtZSBvcmRlciBhcyB0aGUgbGlzdC5cclxuICpcclxuICogQHBhcmFtIHtTVkdUcmFuc2Zvcm1MaXN0fSB0TGlzdCAtIHRyYW5zZm9ybSBsaXN0IGZyb20gYW4gU1ZHIHNoYXBlLlxyXG4gKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gW2NvbnRleHRdIC0gb3B0aW9uYWwgY2FudmFzIDJEIGNvbnRleHQgdG8gdXNlIGZvciB0aGUgbWF0cml4XHJcbiAqIEByZXR1cm5zIHtNYXRyaXh9XHJcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TVkdUcmFuc2Zvcm1MaXN0fE1ETiAvIFNWR1RyYW5zZm9ybUxpc3R9XHJcbiAqL1xyXG5NYXRyaXguZnJvbVNWR1RyYW5zZm9ybUxpc3QgPSBmdW5jdGlvbih0TGlzdCwgY29udGV4dCkge1xyXG5cclxuXHR2YXIgbSA9IG5ldyBNYXRyaXgoY29udGV4dCksXHJcblx0XHRpID0gMDtcclxuXHJcblx0d2hpbGUoaSA8IHRMaXN0Lmxlbmd0aClcclxuXHRcdG0ubXVsdGlwbHkodExpc3RbaSsrXS5tYXRyaXgpO1xyXG5cclxuXHRyZXR1cm4gbVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhbmQgdHJhbnNmb3JtIGEgbmV3IG1hdHJpeCBiYXNlZCBvbiBnaXZlbiBtYXRyaXggdmFsdWVzLCBvclxyXG4gKiBwcm92aWRlIFNWR01hdHJpeCBvciBhICgyRCkgRE9NTWF0cml4IG9yIGFub3RoZXIgaW5zdGFuY2Ugb2YgYSBNYXRyaXhcclxuICogKGluIGZhY3QsIGFueSAyRCBtYXRyaXggb2JqZWN0IHVzaW5nIHByb3BlcnRpZXMgYS1mIGNhbiBiZSB1c2VkIGFzIHNvdXJjZSkuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqXHJcbiAqICAgICB2YXIgbSA9IE1hdHJpeC5mcm9tKDEsIDAuMiwgMCwgMiwgMTIwLCA5Nyk7XHJcbiAqICAgICB2YXIgbSA9IE1hdHJpeC5mcm9tKGRvbU1hdHJpeCwgY3R4KTtcclxuICogICAgIHZhciBtID0gTWF0cml4LmZyb20oc3ZnTWF0cml4KTtcclxuICogICAgIHZhciBtID0gTWF0cml4LmZyb20obWF0cml4KTtcclxuICpcclxuICogQHBhcmFtIHtudW1iZXJ8RE9NTWF0cml4fFNWR01hdHJpeHxNYXRyaXh9IGEgLSBudW1iZXIgcmVwcmVzZW50aW5nIGEgaW4gW2EtZl0sIG9yIGEgTWF0cml4IG9iamVjdCBjb250YWluaW5nIHByb3BlcnRpZXMgYS1mXHJcbiAqIEBwYXJhbSB7bnVtYmVyfENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gW2JdIC0gYiBwcm9wZXJ0eSBpZiBhIGlzIG5vdCBhIG1hdHJpeCBvYmplY3QsIG9yIG9wdGlvbmFsIGNhbnZhcyAyRCBjb250ZXh0XHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBbY11cclxuICogQHBhcmFtIHtudW1iZXJ9IFtkXVxyXG4gKiBAcGFyYW0ge251bWJlcn0gW2VdXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBbZl1cclxuICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IFtjb250ZXh0XSAtIG9wdGlvbmFsIGNhbnZhcyBjb250ZXh0IHRvIHN5bmNocm9uaXplXHJcbiAqIEByZXR1cm5zIHtNYXRyaXh9XHJcbiAqIEBzdGF0aWNcclxuICovXHJcbk1hdHJpeC5mcm9tID0gZnVuY3Rpb24oYSwgYiwgYywgZCwgZSwgZiwgY29udGV4dCkge1xyXG5cclxuXHR2YXIgbSA9IG5ldyBNYXRyaXgoY29udGV4dCk7XHJcblxyXG5cdGlmICh0eXBlb2YgYSA9PT0gXCJudW1iZXJcIilcclxuXHRcdG0uc2V0VHJhbnNmb3JtKGEsIGIsIGMsIGQsIGUsIGYpO1xyXG5cclxuXHRlbHNlIHtcclxuXHRcdGlmICh0eXBlb2YgYS5pczJEID09PSBcImJvb2xlYW5cIiAmJiAhYS5pczJEKSB0aHJvdyBcIkNhbm5vdCB1c2UgM0QgRE9NTWF0cml4LlwiO1xyXG5cdFx0aWYgKGIpIG0uY29udGV4dCA9IGI7XHJcblx0XHRtLm11bHRpcGx5KGEpXHJcblx0fVxyXG5cclxuXHRyZXR1cm4gbVxyXG59O1xyXG5cclxuTWF0cml4LnByb3RvdHlwZSA9IHtcclxuXHJcblx0LyoqXHJcblx0ICogQ29uY2F0ZW5hdGVzIHRyYW5zZm9ybXMgb2YgdGhpcyBtYXRyaXggb250byB0aGUgZ2l2ZW4gY2hpbGQgbWF0cml4IGFuZFxyXG5cdCAqIHJldHVybnMgYSBuZXcgbWF0cml4LiBUaGlzIGluc3RhbmNlIGlzIHVzZWQgb24gbGVmdCBzaWRlLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHtNYXRyaXh8U1ZHTWF0cml4fSBjbSAtIGNoaWxkIG1hdHJpeCB0byBhcHBseSBjb25jYXRlbmF0aW9uIHRvXHJcblx0ICogQHJldHVybnMge01hdHJpeH0gLSBuZXcgTWF0cml4IGluc3RhbmNlXHJcblx0ICovXHJcblx0Y29uY2F0OiBmdW5jdGlvbihjbSkge1xyXG5cdFx0cmV0dXJuIHRoaXMuY2xvbmUoKS5tdWx0aXBseShjbSlcclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBGbGlwcyB0aGUgaG9yaXpvbnRhbCB2YWx1ZXMuXHJcblx0ICogQHJldHVybnMge01hdHJpeH1cclxuXHQgKi9cclxuXHRmbGlwWDogZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fdCgtMSwgMCwgMCwgMSwgMCwgMClcclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBGbGlwcyB0aGUgdmVydGljYWwgdmFsdWVzLlxyXG5cdCAqIEByZXR1cm5zIHtNYXRyaXh9XHJcblx0ICovXHJcblx0ZmxpcFk6IGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3QoMSwgMCwgMCwgLTEsIDAsIDApXHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogUmVmbGVjdHMgaW5jb21pbmcgKHZlbG9jaXR5KSB2ZWN0b3Igb24gdGhlIG5vcm1hbCB3aGljaCB3aWxsIGJlIHRoZVxyXG5cdCAqIGN1cnJlbnQgdHJhbnNmb3JtZWQgeCBheGlzLiBDYWxsIHdoZW4gYSB0cmlnZ2VyIGNvbmRpdGlvbiBpcyBtZXQuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0ge251bWJlcn0geCAtIHZlY3RvciBlbmQgcG9pbnQgZm9yIHggKHN0YXJ0ID0gMClcclxuXHQgKiBAcGFyYW0ge251bWJlcn0geSAtIHZlY3RvciBlbmQgcG9pbnQgZm9yIHkgKHN0YXJ0ID0gMClcclxuXHQgKiBAcmV0dXJucyB7e3g6IG51bWJlciwgeTogbnVtYmVyfX1cclxuXHQgKi9cclxuXHRyZWZsZWN0VmVjdG9yOiBmdW5jdGlvbih4LCB5KSB7XHJcblxyXG5cdFx0dmFyIHYgPSB0aGlzLmFwcGx5VG9Qb2ludCgwLCAxKSxcclxuXHRcdFx0ZCA9ICh2LnggKiB4ICsgdi55ICogeSkgKiAyO1xyXG5cclxuXHRcdHggLT0gZCAqIHYueDtcclxuXHRcdHkgLT0gZCAqIHYueTtcclxuXHJcblx0XHRyZXR1cm4ge3g6IHgsIHk6IHl9XHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogU2hvcnQtaGFuZCB0byByZXNldCBjdXJyZW50IG1hdHJpeCB0byBhbiBpZGVudGl0eSBtYXRyaXguXHJcblx0ICogQHJldHVybnMge01hdHJpeH1cclxuXHQgKi9cclxuXHRyZXNldDogZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMClcclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBSb3RhdGVzIGN1cnJlbnQgbWF0cml4IGJ5IGFuZ2xlIChhY2N1bXVsYXRpdmUpLlxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBhbmdsZSAtIGFuZ2xlIGluIHJhZGlhbnNcclxuXHQgKiBAcmV0dXJucyB7TWF0cml4fVxyXG5cdCAqL1xyXG5cdHJvdGF0ZTogZnVuY3Rpb24oYW5nbGUpIHtcclxuXHRcdHZhciBjb3MgPSBNYXRoLmNvcyhhbmdsZSksXHJcblx0XHRcdHNpbiA9IE1hdGguc2luKGFuZ2xlKTtcclxuXHRcdHJldHVybiB0aGlzLl90KGNvcywgc2luLCAtc2luLCBjb3MsIDAsIDApXHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogQ29udmVydHMgYSB2ZWN0b3IgZ2l2ZW4gYXMgYHhgIGFuZCBgeWAgdG8gYW5nbGUsIGFuZFxyXG5cdCAqIHJvdGF0ZXMgKGFjY3VtdWxhdGl2ZSkuXHJcblx0ICogQHBhcmFtIHhcclxuXHQgKiBAcGFyYW0geVxyXG5cdCAqIEByZXR1cm5zIHtNYXRyaXh9XHJcblx0ICovXHJcblx0cm90YXRlRnJvbVZlY3RvcjogZnVuY3Rpb24oeCwgeSkge1xyXG5cdFx0cmV0dXJuIHRoaXMucm90YXRlKE1hdGguYXRhbjIoeSwgeCkpXHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogSGVscGVyIG1ldGhvZCB0byBtYWtlIGEgcm90YXRpb24gYmFzZWQgb24gYW4gYW5nbGUgaW4gZGVncmVlcy5cclxuXHQgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUgLSBhbmdsZSBpbiBkZWdyZWVzXHJcblx0ICogQHJldHVybnMge01hdHJpeH1cclxuXHQgKi9cclxuXHRyb3RhdGVEZWc6IGZ1bmN0aW9uKGFuZ2xlKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5yb3RhdGUoYW5nbGUgKiBNYXRoLlBJIC8gMTgwKVxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIFNjYWxlcyBjdXJyZW50IG1hdHJpeCB1bmlmb3JtbHkgYW5kIGFjY3VtdWxhdGl2ZS5cclxuXHQgKiBAcGFyYW0ge251bWJlcn0gZiAtIHNjYWxlIGZhY3RvciBmb3IgYm90aCB4IGFuZCB5ICgxIGRvZXMgbm90aGluZylcclxuXHQgKiBAcmV0dXJucyB7TWF0cml4fVxyXG5cdCAqL1xyXG5cdHNjYWxlVTogZnVuY3Rpb24oZikge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3QoZiwgMCwgMCwgZiwgMCwgMClcclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBTY2FsZXMgY3VycmVudCBtYXRyaXggYWNjdW11bGF0aXZlLlxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBzeCAtIHNjYWxlIGZhY3RvciB4ICgxIGRvZXMgbm90aGluZylcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gc3kgLSBzY2FsZSBmYWN0b3IgeSAoMSBkb2VzIG5vdGhpbmcpXHJcblx0ICogQHJldHVybnMge01hdHJpeH1cclxuXHQgKi9cclxuXHRzY2FsZTogZnVuY3Rpb24oc3gsIHN5KSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fdChzeCwgMCwgMCwgc3ksIDAsIDApXHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogU2NhbGVzIGN1cnJlbnQgbWF0cml4IG9uIHggYXhpcyBhY2N1bXVsYXRpdmUuXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IHN4IC0gc2NhbGUgZmFjdG9yIHggKDEgZG9lcyBub3RoaW5nKVxyXG5cdCAqIEByZXR1cm5zIHtNYXRyaXh9XHJcblx0ICovXHJcblx0c2NhbGVYOiBmdW5jdGlvbihzeCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3Qoc3gsIDAsIDAsIDEsIDAsIDApXHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogU2NhbGVzIGN1cnJlbnQgbWF0cml4IG9uIHkgYXhpcyBhY2N1bXVsYXRpdmUuXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IHN5IC0gc2NhbGUgZmFjdG9yIHkgKDEgZG9lcyBub3RoaW5nKVxyXG5cdCAqIEByZXR1cm5zIHtNYXRyaXh9XHJcblx0ICovXHJcblx0c2NhbGVZOiBmdW5jdGlvbihzeSkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3QoMSwgMCwgMCwgc3ksIDAsIDApXHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogQXBwbHkgc2hlYXIgdG8gdGhlIGN1cnJlbnQgbWF0cml4IGFjY3VtdWxhdGl2ZS5cclxuXHQgKiBAcGFyYW0ge251bWJlcn0gc3ggLSBhbW91bnQgb2Ygc2hlYXIgZm9yIHhcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gc3kgLSBhbW91bnQgb2Ygc2hlYXIgZm9yIHlcclxuXHQgKiBAcmV0dXJucyB7TWF0cml4fVxyXG5cdCAqL1xyXG5cdHNoZWFyOiBmdW5jdGlvbihzeCwgc3kpIHtcclxuXHRcdHJldHVybiB0aGlzLl90KDEsIHN5LCBzeCwgMSwgMCwgMClcclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBBcHBseSBzaGVhciBmb3IgeCB0byB0aGUgY3VycmVudCBtYXRyaXggYWNjdW11bGF0aXZlLlxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBzeCAtIGFtb3VudCBvZiBzaGVhciBmb3IgeFxyXG5cdCAqIEByZXR1cm5zIHtNYXRyaXh9XHJcblx0ICovXHJcblx0c2hlYXJYOiBmdW5jdGlvbihzeCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3QoMSwgMCwgc3gsIDEsIDAsIDApXHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogQXBwbHkgc2hlYXIgZm9yIHkgdG8gdGhlIGN1cnJlbnQgbWF0cml4IGFjY3VtdWxhdGl2ZS5cclxuXHQgKiBAcGFyYW0ge251bWJlcn0gc3kgLSBhbW91bnQgb2Ygc2hlYXIgZm9yIHlcclxuXHQgKiBAcmV0dXJucyB7TWF0cml4fVxyXG5cdCAqL1xyXG5cdHNoZWFyWTogZnVuY3Rpb24oc3kpIHtcclxuXHRcdHJldHVybiB0aGlzLl90KDEsIHN5LCAwLCAxLCAwLCAwKVxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIEFwcGx5IHNrZXcgdG8gdGhlIGN1cnJlbnQgbWF0cml4IGFjY3VtdWxhdGl2ZS4gQW5nbGVzIGluIHJhZGlhbnMuXHJcblx0ICogQWxzbyBzZWUgW2Bza2V3RGVnKClgXXtAbGluayBNYXRyaXgjc2tld0RlZ30uXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IGF4IC0gYW5nbGUgb2Ygc2tldyBmb3IgeFxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBheSAtIGFuZ2xlIG9mIHNrZXcgZm9yIHlcclxuXHQgKiBAcmV0dXJucyB7TWF0cml4fVxyXG5cdCAqL1xyXG5cdHNrZXc6IGZ1bmN0aW9uKGF4LCBheSkge1xyXG5cdFx0cmV0dXJuIHRoaXMuc2hlYXIoTWF0aC50YW4oYXgpLCBNYXRoLnRhbihheSkpXHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogQXBwbHkgc2tldyB0byB0aGUgY3VycmVudCBtYXRyaXggYWNjdW11bGF0aXZlLiBBbmdsZXMgaW4gZGVncmVlcy5cclxuXHQgKiBBbHNvIHNlZSBbYHNrZXcoKWBde0BsaW5rIE1hdHJpeCNza2V3fS5cclxuXHQgKiBAcGFyYW0ge251bWJlcn0gYXggLSBhbmdsZSBvZiBza2V3IGZvciB4XHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IGF5IC0gYW5nbGUgb2Ygc2tldyBmb3IgeVxyXG5cdCAqIEByZXR1cm5zIHtNYXRyaXh9XHJcblx0ICovXHJcblx0c2tld0RlZzogZnVuY3Rpb24oYXgsIGF5KSB7XHJcblx0XHRyZXR1cm4gdGhpcy5zaGVhcihNYXRoLnRhbihheCAvIDE4MCAqIE1hdGguUEkpLCBNYXRoLnRhbihheSAvIDE4MCAqIE1hdGguUEkpKVxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIEFwcGx5IHNrZXcgZm9yIHggdG8gdGhlIGN1cnJlbnQgbWF0cml4IGFjY3VtdWxhdGl2ZS4gQW5nbGVzIGluIHJhZGlhbnMuXHJcblx0ICogQWxzbyBzZWUgW2Bza2V3RGVnKClgXXtAbGluayBNYXRyaXgjc2tld0RlZ30uXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IGF4IC0gYW5nbGUgb2Ygc2tldyBmb3IgeFxyXG5cdCAqIEByZXR1cm5zIHtNYXRyaXh9XHJcblx0ICovXHJcblx0c2tld1g6IGZ1bmN0aW9uKGF4KSB7XHJcblx0XHRyZXR1cm4gdGhpcy5zaGVhclgoTWF0aC50YW4oYXgpKVxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIEFwcGx5IHNrZXcgZm9yIHkgdG8gdGhlIGN1cnJlbnQgbWF0cml4IGFjY3VtdWxhdGl2ZS4gQW5nbGVzIGluIHJhZGlhbnMuXHJcblx0ICogQWxzbyBzZWUgW2Bza2V3RGVnKClgXXtAbGluayBNYXRyaXgjc2tld0RlZ30uXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IGF5IC0gYW5nbGUgb2Ygc2tldyBmb3IgeVxyXG5cdCAqIEByZXR1cm5zIHtNYXRyaXh9XHJcblx0ICovXHJcblx0c2tld1k6IGZ1bmN0aW9uKGF5KSB7XHJcblx0XHRyZXR1cm4gdGhpcy5zaGVhclkoTWF0aC50YW4oYXkpKVxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIFNldCBjdXJyZW50IG1hdHJpeCB0byBuZXcgYWJzb2x1dGUgbWF0cml4LlxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBhIC0gc2NhbGUgeFxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBiIC0gc2hlYXIgeVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBjIC0gc2hlYXIgeFxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBkIC0gc2NhbGUgeVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBlIC0gdHJhbnNsYXRlIHhcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gZiAtIHRyYW5zbGF0ZSB5XHJcblx0ICogQHJldHVybnMge01hdHJpeH1cclxuXHQgKi9cclxuXHRzZXRUcmFuc2Zvcm06IGZ1bmN0aW9uKGEsIGIsIGMsIGQsIGUsIGYpIHtcclxuXHRcdHZhciBtZSA9IHRoaXM7XHJcblx0XHRtZS5hID0gYTtcclxuXHRcdG1lLmIgPSBiO1xyXG5cdFx0bWUuYyA9IGM7XHJcblx0XHRtZS5kID0gZDtcclxuXHRcdG1lLmUgPSBlO1xyXG5cdFx0bWUuZiA9IGY7XHJcblx0XHRyZXR1cm4gbWUuX3goKVxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIFRyYW5zbGF0ZSBjdXJyZW50IG1hdHJpeCBhY2N1bXVsYXRpdmUuXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IHR4IC0gdHJhbnNsYXRpb24gZm9yIHhcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gdHkgLSB0cmFuc2xhdGlvbiBmb3IgeVxyXG5cdCAqIEByZXR1cm5zIHtNYXRyaXh9XHJcblx0ICovXHJcblx0dHJhbnNsYXRlOiBmdW5jdGlvbih0eCwgdHkpIHtcclxuXHRcdHJldHVybiB0aGlzLl90KDEsIDAsIDAsIDEsIHR4LCB0eSlcclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBUcmFuc2xhdGUgY3VycmVudCBtYXRyaXggb24geCBheGlzIGFjY3VtdWxhdGl2ZS5cclxuXHQgKiBAcGFyYW0ge251bWJlcn0gdHggLSB0cmFuc2xhdGlvbiBmb3IgeFxyXG5cdCAqIEByZXR1cm5zIHtNYXRyaXh9XHJcblx0ICovXHJcblx0dHJhbnNsYXRlWDogZnVuY3Rpb24odHgpIHtcclxuXHRcdHJldHVybiB0aGlzLl90KDEsIDAsIDAsIDEsIHR4LCAwKVxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIFRyYW5zbGF0ZSBjdXJyZW50IG1hdHJpeCBvbiB5IGF4aXMgYWNjdW11bGF0aXZlLlxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSB0eSAtIHRyYW5zbGF0aW9uIGZvciB5XHJcblx0ICogQHJldHVybnMge01hdHJpeH1cclxuXHQgKi9cclxuXHR0cmFuc2xhdGVZOiBmdW5jdGlvbih0eSkge1xyXG5cdFx0cmV0dXJuIHRoaXMuX3QoMSwgMCwgMCwgMSwgMCwgdHkpXHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogTXVsdGlwbGllcyBjdXJyZW50IG1hdHJpeCB3aXRoIG5ldyBtYXRyaXggdmFsdWVzLiBBbHNvIHNlZSBbYG11bHRpcGx5KClgXXtAbGluayBNYXRyaXgjbXVsdGlwbHl9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IGEyIC0gc2NhbGUgeFxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBiMiAtIHNoZWFyIHlcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gYzIgLSBzaGVhciB4XHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IGQyIC0gc2NhbGUgeVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBlMiAtIHRyYW5zbGF0ZSB4XHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IGYyIC0gdHJhbnNsYXRlIHlcclxuXHQgKiBAcmV0dXJucyB7TWF0cml4fVxyXG5cdCAqL1xyXG5cdHRyYW5zZm9ybTogZnVuY3Rpb24oYTIsIGIyLCBjMiwgZDIsIGUyLCBmMikge1xyXG5cclxuXHRcdHZhciBtZSA9IHRoaXMsXHJcblx0XHRcdGExID0gbWUuYSxcclxuXHRcdFx0YjEgPSBtZS5iLFxyXG5cdFx0XHRjMSA9IG1lLmMsXHJcblx0XHRcdGQxID0gbWUuZCxcclxuXHRcdFx0ZTEgPSBtZS5lLFxyXG5cdFx0XHRmMSA9IG1lLmY7XHJcblxyXG5cdFx0LyogbWF0cml4IG9yZGVyIChjYW52YXMgY29tcGF0aWJsZSk6XHJcblx0XHQqIGFjZVxyXG5cdFx0KiBiZGZcclxuXHRcdCogMDAxXHJcblx0XHQqL1xyXG5cdFx0bWUuYSA9IGExICogYTIgKyBjMSAqIGIyO1xyXG5cdFx0bWUuYiA9IGIxICogYTIgKyBkMSAqIGIyO1xyXG5cdFx0bWUuYyA9IGExICogYzIgKyBjMSAqIGQyO1xyXG5cdFx0bWUuZCA9IGIxICogYzIgKyBkMSAqIGQyO1xyXG5cdFx0bWUuZSA9IGExICogZTIgKyBjMSAqIGYyICsgZTE7XHJcblx0XHRtZS5mID0gYjEgKiBlMiArIGQxICogZjIgKyBmMTtcclxuXHJcblx0XHRyZXR1cm4gbWUuX3goKVxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIE11bHRpcGxpZXMgY3VycmVudCBtYXRyaXggd2l0aCBzb3VyY2UgbWF0cml4LlxyXG5cdCAqIEBwYXJhbSB7TWF0cml4fFNWR01hdHJpeH0gbSAtIHNvdXJjZSBtYXRyaXggdG8gbXVsdGlwbHkgd2l0aC5cclxuXHQgKiBAcmV0dXJucyB7TWF0cml4fVxyXG5cdCAqL1xyXG5cdG11bHRpcGx5OiBmdW5jdGlvbihtKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5fdChtLmEsIG0uYiwgbS5jLCBtLmQsIG0uZSwgbS5mKVxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIERpdmlkZSB0aGlzIG1hdHJpeCBvbiBpbnB1dCBtYXRyaXggd2hpY2ggbXVzdCBiZSBpbnZlcnRpYmxlLlxyXG5cdCAqIEBwYXJhbSB7TWF0cml4fSBtIC0gbWF0cml4IHRvIGRpdmlkZSBvbiAoZGl2aXNvcilcclxuXHQgKiBAdGhyb3dzIEV4Y2VwdGlvbiBpcyBpbnB1dCBtYXRyaXggaXMgbm90IGludmVydGlibGVcclxuXHQgKiBAcmV0dXJucyB7TWF0cml4fVxyXG5cdCAqL1xyXG5cdGRpdmlkZTogZnVuY3Rpb24obSkge1xyXG5cclxuXHRcdGlmICghbS5pc0ludmVydGlibGUoKSlcclxuXHRcdFx0dGhyb3cgXCJNYXRyaXggbm90IGludmVydGlibGVcIjtcclxuXHJcblx0XHRyZXR1cm4gdGhpcy5tdWx0aXBseShtLmludmVyc2UoKSlcclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBEaXZpZGUgY3VycmVudCBtYXRyaXggb24gc2NhbGFyIHZhbHVlICE9IDAuXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IGQgLSBkaXZpc29yIChjYW4gbm90IGJlIDApXHJcblx0ICogQHJldHVybnMge01hdHJpeH1cclxuXHQgKi9cclxuXHRkaXZpZGVTY2FsYXI6IGZ1bmN0aW9uKGQpIHtcclxuXHJcblx0XHR2YXIgbWUgPSB0aGlzO1xyXG5cdFx0bWUuYSAvPSBkO1xyXG5cdFx0bWUuYiAvPSBkO1xyXG5cdFx0bWUuYyAvPSBkO1xyXG5cdFx0bWUuZCAvPSBkO1xyXG5cdFx0bWUuZSAvPSBkO1xyXG5cdFx0bWUuZiAvPSBkO1xyXG5cclxuXHRcdHJldHVybiBtZS5feCgpXHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogR2V0IGFuIGludmVyc2UgbWF0cml4IG9mIGN1cnJlbnQgbWF0cml4LiBUaGUgbWV0aG9kIHJldHVybnMgYSBuZXdcclxuXHQgKiBtYXRyaXggd2l0aCB2YWx1ZXMgeW91IG5lZWQgdG8gdXNlIHRvIGdldCB0byBhbiBpZGVudGl0eSBtYXRyaXguXHJcblx0ICogQ29udGV4dCBmcm9tIHBhcmVudCBtYXRyaXggaXMgbm90IGFwcGxpZWQgdG8gdGhlIHJldHVybmVkIG1hdHJpeC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW2Nsb25lQ29udGV4dD1mYWxzZV0gLSBjbG9uZSBjdXJyZW50IGNvbnRleHQgdG8gcmVzdWx0aW5nIG1hdHJpeFxyXG5cdCAqIEB0aHJvd3MgRXhjZXB0aW9uIGlzIGlucHV0IG1hdHJpeCBpcyBub3QgaW52ZXJ0aWJsZVxyXG5cdCAqIEByZXR1cm5zIHtNYXRyaXh9IC0gbmV3IE1hdHJpeCBpbnN0YW5jZVxyXG5cdCAqL1xyXG5cdGludmVyc2U6IGZ1bmN0aW9uKGNsb25lQ29udGV4dCkge1xyXG5cclxuXHRcdHZhciBtZSA9IHRoaXMsXHJcblx0XHRcdG0gID0gbmV3IE1hdHJpeChjbG9uZUNvbnRleHQgPyBtZS5jb250ZXh0IDogbnVsbCksXHJcblx0XHRcdGR0ID0gbWUuZGV0ZXJtaW5hbnQoKTtcclxuXHJcblx0XHRpZiAobWUuX3EoZHQsIDApKVxyXG5cdFx0XHR0aHJvdyBcIk1hdHJpeCBub3QgaW52ZXJ0aWJsZS5cIjtcclxuXHJcblx0XHRtLmEgPSBtZS5kIC8gZHQ7XHJcblx0XHRtLmIgPSAtbWUuYiAvIGR0O1xyXG5cdFx0bS5jID0gLW1lLmMgLyBkdDtcclxuXHRcdG0uZCA9IG1lLmEgLyBkdDtcclxuXHRcdG0uZSA9IChtZS5jICogbWUuZiAtIG1lLmQgKiBtZS5lKSAvIGR0O1xyXG5cdFx0bS5mID0gLShtZS5hICogbWUuZiAtIG1lLmIgKiBtZS5lKSAvIGR0O1xyXG5cclxuXHRcdHJldHVybiBtXHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogSW50ZXJwb2xhdGUgdGhpcyBtYXRyaXggd2l0aCBhbm90aGVyIGFuZCBwcm9kdWNlIGEgbmV3IG1hdHJpeC5cclxuXHQgKiBgdGAgaXMgYSB2YWx1ZSBpbiB0aGUgcmFuZ2UgWzAuMCwgMS4wXSB3aGVyZSAwIGlzIHRoaXMgaW5zdGFuY2UgYW5kXHJcblx0ICogMSBpcyBlcXVhbCB0byB0aGUgc2Vjb25kIG1hdHJpeC4gVGhlIGB0YCB2YWx1ZSBpcyBub3QgY2xhbXBlZC5cclxuXHQgKlxyXG5cdCAqIENvbnRleHQgZnJvbSBwYXJlbnQgbWF0cml4IGlzIG5vdCBhcHBsaWVkIHRvIHRoZSByZXR1cm5lZCBtYXRyaXguXHJcblx0ICpcclxuXHQgKiBOb3RlOiB0aGlzIGludGVycG9sYXRpb24gaXMgbmFpdmUuIEZvciBhbmltYXRpb24gY29udGFpbmluZyByb3RhdGlvbixcclxuXHQgKiBzaGVhciBvciBza2V3IHVzZSB0aGUgW2BpbnRlcnBvbGF0ZUFuaW0oKWBde0BsaW5rIE1hdHJpeCNpbnRlcnBvbGF0ZUFuaW19IG1ldGhvZCBpbnN0ZWFkXHJcblx0ICogdG8gYXZvaWQgdW5pbnRlbmRlZCBmbGlwcGluZy5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB7TWF0cml4fFNWR01hdHJpeH0gbTIgLSB0aGUgbWF0cml4IHRvIGludGVycG9sYXRlIHdpdGguXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IHQgLSBpbnRlcnBvbGF0aW9uIFswLjAsIDEuMF1cclxuXHQgKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gW2NvbnRleHRdIC0gb3B0aW9uYWwgY29udGV4dCB0byBhZmZlY3RcclxuXHQgKiBAcmV0dXJucyB7TWF0cml4fSAtIG5ldyBNYXRyaXggaW5zdGFuY2Ugd2l0aCB0aGUgaW50ZXJwb2xhdGVkIHJlc3VsdFxyXG5cdCAqL1xyXG5cdGludGVycG9sYXRlOiBmdW5jdGlvbihtMiwgdCwgY29udGV4dCkge1xyXG5cclxuXHRcdHZhciBtZSA9IHRoaXMsXHJcblx0XHRcdG0gID0gY29udGV4dCA/IG5ldyBNYXRyaXgoY29udGV4dCkgOiBuZXcgTWF0cml4KCk7XHJcblxyXG5cdFx0bS5hID0gbWUuYSArIChtMi5hIC0gbWUuYSkgKiB0O1xyXG5cdFx0bS5iID0gbWUuYiArIChtMi5iIC0gbWUuYikgKiB0O1xyXG5cdFx0bS5jID0gbWUuYyArIChtMi5jIC0gbWUuYykgKiB0O1xyXG5cdFx0bS5kID0gbWUuZCArIChtMi5kIC0gbWUuZCkgKiB0O1xyXG5cdFx0bS5lID0gbWUuZSArIChtMi5lIC0gbWUuZSkgKiB0O1xyXG5cdFx0bS5mID0gbWUuZiArIChtMi5mIC0gbWUuZikgKiB0O1xyXG5cclxuXHRcdHJldHVybiBtLl94KClcclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBJbnRlcnBvbGF0ZSB0aGlzIG1hdHJpeCB3aXRoIGFub3RoZXIgYW5kIHByb2R1Y2UgYSBuZXcgbWF0cml4LlxyXG5cdCAqIGB0YCBpcyBhIHZhbHVlIGluIHRoZSByYW5nZSBbMC4wLCAxLjBdIHdoZXJlIDAgaXMgdGhpcyBpbnN0YW5jZSBhbmRcclxuXHQgKiAxIGlzIGVxdWFsIHRvIHRoZSBzZWNvbmQgbWF0cml4LiBUaGUgYHRgIHZhbHVlIGlzIG5vdCBjb25zdHJhaW5lZC5cclxuXHQgKlxyXG5cdCAqIENvbnRleHQgZnJvbSBwYXJlbnQgbWF0cml4IGlzIG5vdCBhcHBsaWVkIHRvIHRoZSByZXR1cm5lZCBtYXRyaXguXHJcblx0ICpcclxuXHQgKiBUbyBvYnRhaW4gZWFzaW5nIGB0YCBjYW4gYmUgcHJlcHJvY2Vzc2VkIHVzaW5nIGVhc2luZy1mdW5jdGlvbnNcclxuXHQgKiBiZWZvcmUgYmVpbmcgcGFzc2VkIHRvIHRoaXMgbWV0aG9kLlxyXG5cdCAqXHJcblx0ICogTm90ZTogdGhpcyBpbnRlcnBvbGF0aW9uIG1ldGhvZCB1c2VzIGRlY29tcG9zaXRpb24gd2hpY2ggbWFrZXNcclxuXHQgKiBpdCBzdWl0YWJsZSBmb3IgYW5pbWF0aW9ucyAoaW4gcGFydGljdWxhciB3aGVyZSByb3RhdGlvbiB0YWtlc1xyXG5cdCAqIHBsYWNlcykuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0ge01hdHJpeH0gbTIgLSB0aGUgbWF0cml4IHRvIGludGVycG9sYXRlIHdpdGguXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IHQgLSBpbnRlcnBvbGF0aW9uIFswLjAsIDEuMF1cclxuXHQgKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gW2NvbnRleHRdIC0gb3B0aW9uYWwgY29udGV4dCB0byBhZmZlY3RcclxuXHQgKiBAcmV0dXJucyB7TWF0cml4fSAtIG5ldyBNYXRyaXggaW5zdGFuY2Ugd2l0aCB0aGUgaW50ZXJwb2xhdGVkIHJlc3VsdFxyXG5cdCAqL1xyXG5cdGludGVycG9sYXRlQW5pbTogZnVuY3Rpb24obTIsIHQsIGNvbnRleHQpIHtcclxuXHJcblx0XHR2YXIgbSAgICAgICAgICA9IG5ldyBNYXRyaXgoY29udGV4dCA/IGNvbnRleHQgOiBudWxsKSxcclxuXHRcdFx0ZDEgICAgICAgICA9IHRoaXMuZGVjb21wb3NlKCksXHJcblx0XHRcdGQyICAgICAgICAgPSBtMi5kZWNvbXBvc2UoKSxcclxuXHRcdFx0dDEgICAgICAgICA9IGQxLnRyYW5zbGF0ZSxcclxuXHRcdFx0dDIgICAgICAgICA9IGQyLnRyYW5zbGF0ZSxcclxuXHRcdFx0czEgICAgICAgICA9IGQxLnNjYWxlLFxyXG5cdFx0XHRyb3RhdGlvbiAgID0gZDEucm90YXRpb24gKyAoZDIucm90YXRpb24gLSBkMS5yb3RhdGlvbikgKiB0LFxyXG5cdFx0XHR0cmFuc2xhdGVYID0gdDEueCArICh0Mi54IC0gdDEueCkgKiB0LFxyXG5cdFx0XHR0cmFuc2xhdGVZID0gdDEueSArICh0Mi55IC0gdDEueSkgKiB0LFxyXG5cdFx0XHRzY2FsZVggICAgID0gczEueCArIChkMi5zY2FsZS54IC0gczEueCkgKiB0LFxyXG5cdFx0XHRzY2FsZVkgICAgID0gczEueSArIChkMi5zY2FsZS55IC0gczEueSkgKiB0XHJcblx0XHRcdDtcclxuXHJcblx0XHQvLyBRUiBvcmRlciAodC1yLXMtc2spXHJcblx0XHRtLnRyYW5zbGF0ZSh0cmFuc2xhdGVYLCB0cmFuc2xhdGVZKTtcclxuXHRcdG0ucm90YXRlKHJvdGF0aW9uKTtcclxuXHRcdG0uc2NhbGUoc2NhbGVYLCBzY2FsZVkpO1xyXG5cdFx0Ly90b2RvIHRlc3Qgc2tldyBzY2VuYXJpb3NcclxuXHJcblx0XHRyZXR1cm4gbS5feCgpXHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogRGVjb21wb3NlIHRoZSBjdXJyZW50IG1hdHJpeCBpbnRvIHNpbXBsZSB0cmFuc2Zvcm1zIHVzaW5nIGVpdGhlclxyXG5cdCAqIFFSIChkZWZhdWx0KSBvciBMVSBkZWNvbXBvc2l0aW9uLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHtib29sZWFufSBbdXNlTFU9ZmFsc2VdIC0gc2V0IHRvIHRydWUgdG8gdXNlIExVIHJhdGhlciB0aGFuIFFSIGRlY29tcG9zaXRpb25cclxuXHQgKiBAcmV0dXJucyB7Kn0gLSBhbiBvYmplY3QgY29udGFpbmluZyBjdXJyZW50IGRlY29tcG9zZWQgdmFsdWVzICh0cmFuc2xhdGUsIHJvdGF0aW9uLCBzY2FsZSwgc2tldylcclxuXHQgKiBAc2VlIHtAbGluayBodHRwOi8vd3d3Lm1hdGhzLWluZm9ybWF0aXF1ZS1qZXV4LmNvbS9ibG9nL2ZyZWRlcmljLz9wb3N0LzIwMTMvMTIvMDEvRGVjb21wb3NpdGlvbi1vZi0yRC10cmFuc2Zvcm0tbWF0cmljZXN8QWRvcHRpb24gYmFzZWQgb24gdGhpcyBjb2RlfVxyXG5cdCAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1FSX2RlY29tcG9zaXRpb258TW9yZSBvbiBRUiBkZWNvbXBvc2l0aW9ufVxyXG5cdCAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0xVX2RlY29tcG9zaXRpb258TW9yZSBvbiBMVSBkZWNvbXBvc2l0aW9ufVxyXG5cdCAqL1xyXG5cdGRlY29tcG9zZTogZnVuY3Rpb24odXNlTFUpIHtcclxuXHJcblx0XHR2YXIgbWUgICAgICAgID0gdGhpcyxcclxuXHRcdFx0YSAgICAgICAgID0gbWUuYSxcclxuXHRcdFx0YiAgICAgICAgID0gbWUuYixcclxuXHRcdFx0YyAgICAgICAgID0gbWUuYyxcclxuXHRcdFx0ZCAgICAgICAgID0gbWUuZCxcclxuXHRcdFx0YWNvcyAgICAgID0gTWF0aC5hY29zLFxyXG5cdFx0XHRhdGFuICAgICAgPSBNYXRoLmF0YW4sXHJcblx0XHRcdHNxcnQgICAgICA9IE1hdGguc3FydCxcclxuXHRcdFx0cGkgICAgICAgID0gTWF0aC5QSSxcclxuXHJcblx0XHRcdHRyYW5zbGF0ZSA9IHt4OiBtZS5lLCB5OiBtZS5mfSxcclxuXHRcdFx0cm90YXRpb24gID0gMCxcclxuXHRcdFx0c2NhbGUgICAgID0ge3g6IDEsIHk6IDF9LFxyXG5cdFx0XHRza2V3ICAgICAgPSB7eDogMCwgeTogMH0sXHJcblxyXG5cdFx0XHRkZXRlcm0gICAgPSBhICogZCAtIGIgKiBjO1x0Ly8gZGV0ZXJtaW5hbnQoKSwgc2tpcCBEUlkgaGVyZS4uLlxyXG5cclxuXHRcdGlmICh1c2VMVSkge1xyXG5cdFx0XHRpZiAoYSkge1xyXG5cdFx0XHRcdHNrZXcgPSB7eDogYXRhbihjIC8gYSksIHk6IGF0YW4oYiAvIGEpfTtcclxuXHRcdFx0XHRzY2FsZSA9IHt4OiBhLCB5OiBkZXRlcm0gLyBhfTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChiKSB7XHJcblx0XHRcdFx0cm90YXRpb24gPSBwaSAqIDAuNTtcclxuXHRcdFx0XHRzY2FsZSA9IHt4OiBiLCB5OiBkZXRlcm0gLyBifTtcclxuXHRcdFx0XHRza2V3LnggPSBhdGFuKGQgLyBiKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHsgLy8gYSA9IGIgPSAwXHJcblx0XHRcdFx0c2NhbGUgPSB7eDogYywgeTogZH07XHJcblx0XHRcdFx0c2tldy54ID0gcGkgKiAwLjI1O1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Ly8gQXBwbHkgdGhlIFFSLWxpa2UgZGVjb21wb3NpdGlvbi5cclxuXHRcdFx0aWYgKGEgfHwgYikge1xyXG5cdFx0XHRcdHZhciByID0gc3FydChhICogYSArIGIgKiBiKTtcclxuXHRcdFx0XHRyb3RhdGlvbiA9IGIgPiAwID8gYWNvcyhhIC8gcikgOiAtYWNvcyhhIC8gcik7XHJcblx0XHRcdFx0c2NhbGUgPSB7eDogciwgeTogZGV0ZXJtIC8gcn07XHJcblx0XHRcdFx0c2tldy54ID0gYXRhbigoYSAqIGMgKyBiICogZCkgLyAociAqIHIpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChjIHx8IGQpIHtcclxuXHRcdFx0XHR2YXIgcyA9IHNxcnQoYyAqIGMgKyBkICogZCk7XHJcblx0XHRcdFx0cm90YXRpb24gPSBwaSAqIDAuNSAtIChkID4gMCA/IGFjb3MoLWMgLyBzKSA6IC1hY29zKGMgLyBzKSk7XHJcblx0XHRcdFx0c2NhbGUgPSB7eDogZGV0ZXJtIC8gcywgeTogc307XHJcblx0XHRcdFx0c2tldy55ID0gYXRhbigoYSAqIGMgKyBiICogZCkgLyAocyAqIHMpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHsgLy8gYSA9IGIgPSBjID0gZCA9IDBcclxuXHRcdFx0XHRzY2FsZSA9IHt4OiAwLCB5OiAwfTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB7XHJcblx0XHRcdHRyYW5zbGF0ZTogdHJhbnNsYXRlLFxyXG5cdFx0XHRyb3RhdGlvbiA6IHJvdGF0aW9uLFxyXG5cdFx0XHRzY2FsZSAgICA6IHNjYWxlLFxyXG5cdFx0XHRza2V3ICAgICA6IHNrZXdcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBSZXR1cm5zIHRoZSBkZXRlcm1pbmFudCBvZiB0aGUgY3VycmVudCBtYXRyaXguXHJcblx0ICogQHJldHVybnMge251bWJlcn1cclxuXHQgKi9cclxuXHRkZXRlcm1pbmFudDogZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5hICogdGhpcy5kIC0gdGhpcy5iICogdGhpcy5jXHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogQXBwbHkgY3VycmVudCBtYXRyaXggdG8gYHhgIGFuZCBgeWAgb2YgYSBwb2ludC5cclxuXHQgKiBSZXR1cm5zIGEgcG9pbnQgb2JqZWN0LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IHggLSB2YWx1ZSBmb3IgeFxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gdmFsdWUgZm9yIHlcclxuXHQgKiBAcmV0dXJucyB7e3g6IG51bWJlciwgeTogbnVtYmVyfX0gQSBuZXcgdHJhbnNmb3JtZWQgcG9pbnQgb2JqZWN0XHJcblx0ICovXHJcblx0YXBwbHlUb1BvaW50OiBmdW5jdGlvbih4LCB5KSB7XHJcblxyXG5cdFx0dmFyIG1lID0gdGhpcztcclxuXHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHR4OiB4ICogbWUuYSArIHkgKiBtZS5jICsgbWUuZSxcclxuXHRcdFx0eTogeCAqIG1lLmIgKyB5ICogbWUuZCArIG1lLmZcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBBcHBseSBjdXJyZW50IG1hdHJpeCB0byBhcnJheSB3aXRoIHBvaW50IG9iamVjdHMgb3IgcG9pbnQgcGFpcnMuXHJcblx0ICogUmV0dXJucyBhIG5ldyBhcnJheSB3aXRoIHBvaW50cyBpbiB0aGUgc2FtZSBmb3JtYXQgYXMgdGhlIGlucHV0IGFycmF5LlxyXG5cdCAqXHJcblx0ICogQSBwb2ludCBvYmplY3QgaXMgYW4gb2JqZWN0IGxpdGVyYWw6XHJcblx0ICpcclxuXHQgKiAgICAge3g6IHgsIHk6IHl9XHJcblx0ICpcclxuXHQgKiBzbyBhbiBhcnJheSB3b3VsZCBjb250YWluIGVpdGhlcjpcclxuXHQgKlxyXG5cdCAqICAgICBbe3g6IHgxLCB5OiB5MX0sIHt4OiB4MiwgeTogeTJ9LCAuLi4ge3g6IHhuLCB5OiB5bn1dXHJcblx0ICpcclxuXHQgKiBvclxyXG5cdCAqXHJcblx0ICogICAgIFt4MSwgeTEsIHgyLCB5MiwgLi4uIHhuLCB5bl1cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB7QXJyYXl9IHBvaW50cyAtIGFycmF5IHdpdGggcG9pbnQgb2JqZWN0cyBvciBwYWlyc1xyXG5cdCAqIEByZXR1cm5zIHtBcnJheX0gQSBuZXcgYXJyYXkgd2l0aCB0cmFuc2Zvcm1lZCBwb2ludHNcclxuXHQgKi9cclxuXHRhcHBseVRvQXJyYXk6IGZ1bmN0aW9uKHBvaW50cykge1xyXG5cclxuXHRcdHZhciBpID0gMCwgcCwgbCxcclxuXHRcdFx0bXhQb2ludHMgPSBbXTtcclxuXHJcblx0XHRpZiAodHlwZW9mIHBvaW50c1swXSA9PT0gJ251bWJlcicpIHtcclxuXHJcblx0XHRcdGwgPSBwb2ludHMubGVuZ3RoO1xyXG5cclxuXHRcdFx0d2hpbGUoaSA8IGwpIHtcclxuXHRcdFx0XHRwID0gdGhpcy5hcHBseVRvUG9pbnQocG9pbnRzW2krK10sIHBvaW50c1tpKytdKTtcclxuXHRcdFx0XHRteFBvaW50cy5wdXNoKHAueCwgcC55KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHdoaWxlKHAgPSBwb2ludHNbaSsrXSkge1xyXG5cdFx0XHRcdG14UG9pbnRzLnB1c2godGhpcy5hcHBseVRvUG9pbnQocC54LCBwLnkpKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBteFBvaW50c1xyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIEFwcGx5IGN1cnJlbnQgbWF0cml4IHRvIGEgdHlwZWQgYXJyYXkgd2l0aCBwb2ludCBwYWlycy4gQWx0aG91Z2hcclxuXHQgKiB0aGUgaW5wdXQgYXJyYXkgbWF5IGJlIGFuIG9yZGluYXJ5IGFycmF5LCB0aGlzIG1ldGhvZCBpcyBpbnRlbmRlZFxyXG5cdCAqIGZvciBtb3JlIHBlcmZvcm1hbnQgdXNlIHdoZXJlIHR5cGVkIGFycmF5cyBhcmUgdXNlZC4gVGhlIHJldHVybmVkXHJcblx0ICogYXJyYXkgaXMgcmVnYXJkbGVzcyBhbHdheXMgcmV0dXJuZWQgYXMgYSBgRmxvYXQzMkFycmF5YC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB7Kn0gcG9pbnRzIC0gKHR5cGVkKSBhcnJheSB3aXRoIHBvaW50IHBhaXJzIFt4MSwgeTEsIC4uLiwgeG4sIHluXVxyXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW3VzZTY0PWZhbHNlXSAtIHVzZSBGbG9hdDY0QXJyYXkgaW5zdGVhZCBvZiBGbG9hdDMyQXJyYXlcclxuXHQgKiBAcmV0dXJucyB7Kn0gQSBuZXcgdHlwZWQgYXJyYXkgd2l0aCB0cmFuc2Zvcm1lZCBwb2ludHNcclxuXHQgKi9cclxuXHRhcHBseVRvVHlwZWRBcnJheTogZnVuY3Rpb24ocG9pbnRzLCB1c2U2NCkge1xyXG5cclxuXHRcdHZhciBpID0gMCwgcCxcclxuXHRcdFx0bCA9IHBvaW50cy5sZW5ndGgsXHJcblx0XHRcdG14UG9pbnRzID0gdXNlNjQgPyBuZXcgRmxvYXQ2NEFycmF5KGwpIDogbmV3IEZsb2F0MzJBcnJheShsKTtcclxuXHJcblx0XHR3aGlsZShpIDwgbCkge1xyXG5cdFx0XHRwID0gdGhpcy5hcHBseVRvUG9pbnQocG9pbnRzW2ldLCBwb2ludHNbaSArIDFdKTtcclxuXHRcdFx0bXhQb2ludHNbaSsrXSA9IHAueDtcclxuXHRcdFx0bXhQb2ludHNbaSsrXSA9IHAueTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gbXhQb2ludHNcclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBBcHBseSB0byBhbnkgY2FudmFzIDJEIGNvbnRleHQgb2JqZWN0LiBUaGlzIGRvZXMgbm90IGFmZmVjdCB0aGVcclxuXHQgKiBjb250ZXh0IHRoYXQgb3B0aW9uYWxseSB3YXMgcmVmZXJlbmNlZCBpbiBjb25zdHJ1Y3RvciB1bmxlc3MgaXQgaXNcclxuXHQgKiB0aGUgc2FtZSBjb250ZXh0LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGNvbnRleHQgLSB0YXJnZXQgY29udGV4dFxyXG5cdCAqIEByZXR1cm5zIHtNYXRyaXh9XHJcblx0ICovXHJcblx0YXBwbHlUb0NvbnRleHQ6IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuXHRcdHZhciBtZSA9IHRoaXM7XHJcblx0XHRjb250ZXh0LnNldFRyYW5zZm9ybShtZS5hLCBtZS5iLCBtZS5jLCBtZS5kLCBtZS5lLCBtZS5mKTtcclxuXHRcdHJldHVybiBtZVxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIFJldHVybnMgdHJ1ZSBpZiBtYXRyaXggaXMgYW4gaWRlbnRpdHkgbWF0cml4IChubyB0cmFuc2Zvcm1zIGFwcGxpZWQpLlxyXG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxyXG5cdCAqL1xyXG5cdGlzSWRlbnRpdHk6IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIG1lID0gdGhpcztcclxuXHRcdHJldHVybiBtZS5fcShtZS5hLCAxKSAmJlxyXG5cdFx0XHRtZS5fcShtZS5iLCAwKSAmJlxyXG5cdFx0XHRtZS5fcShtZS5jLCAwKSAmJlxyXG5cdFx0XHRtZS5fcShtZS5kLCAxKSAmJlxyXG5cdFx0XHRtZS5fcShtZS5lLCAwKSAmJlxyXG5cdFx0XHRtZS5fcShtZS5mLCAwKVxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIFJldHVybnMgdHJ1ZSBpZiBtYXRyaXggaXMgaW52ZXJ0aWJsZVxyXG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxyXG5cdCAqL1xyXG5cdGlzSW52ZXJ0aWJsZTogZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gIXRoaXMuX3EodGhpcy5kZXRlcm1pbmFudCgpLCAwKVxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIFRoZSBtZXRob2QgaXMgaW50ZW5kZWQgZm9yIHNpdHVhdGlvbnMgd2hlcmUgc2NhbGUgaXMgYWNjdW11bGF0ZWRcclxuXHQgKiB2aWEgbXVsdGlwbGljYXRpb25zLCB0byBkZXRlY3Qgc2l0dWF0aW9ucyB3aGVyZSBzY2FsZSBiZWNvbWVzXHJcblx0ICogXCJ0cmFwcGVkXCIgd2l0aCBhIHZhbHVlIG9mIHplcm8uIEFuZCBpbiB3aGljaCBjYXNlIHNjYWxlIG11c3QgYmVcclxuXHQgKiBzZXQgZXhwbGljaXRseSB0byBhIG5vbi16ZXJvIHZhbHVlLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMge2Jvb2xlYW59XHJcblx0ICovXHJcblx0aXNWYWxpZDogZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gISh0aGlzLmEgKiB0aGlzLmQpXHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogQ29tcGFyZXMgY3VycmVudCBtYXRyaXggd2l0aCBhbm90aGVyIG1hdHJpeC4gUmV0dXJucyB0cnVlIGlmIGVxdWFsXHJcblx0ICogKHdpdGhpbiBlcHNpbG9uIHRvbGVyYW5jZSkuXHJcblx0ICogQHBhcmFtIHtNYXRyaXh8U1ZHTWF0cml4fSBtIC0gbWF0cml4IHRvIGNvbXBhcmUgdGhpcyBtYXRyaXggd2l0aFxyXG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxyXG5cdCAqL1xyXG5cdGlzRXF1YWw6IGZ1bmN0aW9uKG0pIHtcclxuXHJcblx0XHR2YXIgbWUgPSB0aGlzLFxyXG5cdFx0XHRxID0gbWUuX3E7XHJcblxyXG5cdFx0cmV0dXJuICBxKG1lLmEsIG0uYSkgJiZcclxuXHRcdFx0XHRxKG1lLmIsIG0uYikgJiZcclxuXHRcdFx0XHRxKG1lLmMsIG0uYykgJiZcclxuXHRcdFx0XHRxKG1lLmQsIG0uZCkgJiZcclxuXHRcdFx0XHRxKG1lLmUsIG0uZSkgJiZcclxuXHRcdFx0XHRxKG1lLmYsIG0uZilcclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBDbG9uZXMgY3VycmVudCBpbnN0YW5jZSBhbmQgcmV0dXJuaW5nIGEgbmV3IG1hdHJpeC5cclxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IFtub0NvbnRleHQ9ZmFsc2VdIGRvbid0IGNsb25lIGNvbnRleHQgcmVmZXJlbmNlIGlmIHRydWVcclxuXHQgKiBAcmV0dXJucyB7TWF0cml4fSAtIGEgbmV3IE1hdHJpeCBpbnN0YW5jZSB3aXRoIGlkZW50aWNhbCB0cmFuc2Zvcm1hdGlvbnMgYXMgdGhpcyBpbnN0YW5jZVxyXG5cdCAqL1xyXG5cdGNsb25lOiBmdW5jdGlvbihub0NvbnRleHQpIHtcclxuXHRcdHJldHVybiBuZXcgTWF0cml4KG5vQ29udGV4dCA/IG51bGwgOiB0aGlzLmNvbnRleHQpLm11bHRpcGx5KHRoaXMpXHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogUmV0dXJucyBhbiBhcnJheSB3aXRoIGN1cnJlbnQgbWF0cml4IHZhbHVlcy5cclxuXHQgKiBAcmV0dXJucyB7QXJyYXl9XHJcblx0ICovXHJcblx0dG9BcnJheTogZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgbWUgPSB0aGlzO1xyXG5cdFx0cmV0dXJuIFttZS5hLCBtZS5iLCBtZS5jLCBtZS5kLCBtZS5lLCBtZS5mXVxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIFJldHVybnMgYSBiaW5hcnkgdHlwZWQgYXJyYXksIGVpdGhlciBhcyAzMi1iaXQgKGRlZmF1bHQpIG9yXHJcblx0ICogNjQtYml0LlxyXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gW3VzZTY0PWZhbHNlXSBjaG9zZSB3aGV0aGVyIHRvIHVzZSAzMi1iaXQgb3IgNjQtYml0IHR5cGVkIGFycmF5XHJcblx0ICogQHJldHVybnMgeyp9XHJcblx0ICovXHJcblx0dG9UeXBlZEFycmF5OiBmdW5jdGlvbih1c2U2NCkge1xyXG5cclxuXHRcdHZhciBhICA9IHVzZTY0ID8gbmV3IEZsb2F0NjRBcnJheSg2KSA6IG5ldyBGbG9hdDMyQXJyYXkoNiksXHJcblx0XHRcdG1lID0gdGhpcztcclxuXHJcblx0XHRhWzBdID0gbWUuYTtcclxuXHRcdGFbMV0gPSBtZS5iO1xyXG5cdFx0YVsyXSA9IG1lLmM7XHJcblx0XHRhWzNdID0gbWUuZDtcclxuXHRcdGFbNF0gPSBtZS5lO1xyXG5cdFx0YVs1XSA9IG1lLmY7XHJcblxyXG5cdFx0cmV0dXJuIGFcclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBHZW5lcmF0ZXMgYSBzdHJpbmcgdGhhdCBjYW4gYmUgdXNlZCB3aXRoIENTUyBgdHJhbnNmb3JtYC5cclxuXHQgKiBAZXhhbXBsZVxyXG5cdCAqICAgICBlbGVtZW50LnN0eWxlLnRyYW5zZm9ybSA9IG0udG9DU1MoKTtcclxuXHQgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG5cdCAqL1xyXG5cdHRvQ1NTOiBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiBcIm1hdHJpeChcIiArIHRoaXMudG9BcnJheSgpICsgXCIpXCJcclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBHZW5lcmF0ZXMgYSBgbWF0cml4M2QoKWAgc3RyaW5nIHRoYXQgY2FuIGJlIHVzZWQgd2l0aCBDU1MgYHRyYW5zZm9ybWAuXHJcblx0ICogQWx0aG91Z2ggdGhlIG1hdHJpeCBpcyBmb3IgMkQgdXNlIHlvdSBtYXkgc2VlIHBlcmZvcm1hbmNlIGJlbmVmaXRzXHJcblx0ICogb24gc29tZSBkZXZpY2VzIHVzaW5nIGEgM0QgQ1NTIHRyYW5zZm9ybSBpbnN0ZWFkIG9mIGEgMkQuXHJcblx0ICogQGV4YW1wbGVcclxuXHQgKiAgICAgZWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSBtLnRvQ1NTM0QoKTtcclxuXHQgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG5cdCAqL1xyXG5cdHRvQ1NTM0Q6IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIG1lID0gdGhpcztcclxuXHRcdHJldHVybiBcIm1hdHJpeDNkKFwiICsgbWUuYSArIFwiLFwiICsgbWUuYiArIFwiLDAsMCxcIiArIG1lLmMgKyBcIixcIiArIG1lLmQgKyBcIiwwLDAsMCwwLDEsMCxcIiArIG1lLmUgKyBcIixcIiArIG1lLmYgKyBcIiwwLDEpXCJcclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBSZXR1cm5zIGEgSlNPTiBjb21wYXRpYmxlIHN0cmluZyBvZiBjdXJyZW50IG1hdHJpeC5cclxuXHQgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG5cdCAqL1xyXG5cdHRvSlNPTjogZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgbWUgPSB0aGlzO1xyXG5cdFx0cmV0dXJuICd7XCJhXCI6JyArIG1lLmEgKyAnLFwiYlwiOicgKyBtZS5iICsgJyxcImNcIjonICsgbWUuYyArICcsXCJkXCI6JyArIG1lLmQgKyAnLFwiZVwiOicgKyBtZS5lICsgJyxcImZcIjonICsgbWUuZiArICd9J1xyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgd2l0aCBjdXJyZW50IG1hdHJpeCBhcyBjb21tYS1zZXBhcmF0ZWQgbGlzdC5cclxuXHQgKiBAcGFyYW0ge251bWJlcn0gW2ZpeExlbj00XSAtIHRydW5jYXRlIGRlY2ltYWwgdmFsdWVzIHRvIG51bWJlciBvZiBkaWdpdHNcclxuXHQgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG5cdCAqL1xyXG5cdHRvU3RyaW5nOiBmdW5jdGlvbihmaXhMZW4pIHtcclxuXHRcdHZhciBtZSA9IHRoaXM7XHJcblx0XHRmaXhMZW4gPSBmaXhMZW4gfHwgNDtcclxuXHRcdHJldHVybiBcdCBcImE9XCIgKyBtZS5hLnRvRml4ZWQoZml4TGVuKSArXHJcblx0XHRcdFx0XCIgYj1cIiArIG1lLmIudG9GaXhlZChmaXhMZW4pICtcclxuXHRcdFx0XHRcIiBjPVwiICsgbWUuYy50b0ZpeGVkKGZpeExlbikgK1xyXG5cdFx0XHRcdFwiIGQ9XCIgKyBtZS5kLnRvRml4ZWQoZml4TGVuKSArXHJcblx0XHRcdFx0XCIgZT1cIiArIG1lLmUudG9GaXhlZChmaXhMZW4pICtcclxuXHRcdFx0XHRcIiBmPVwiICsgbWUuZi50b0ZpeGVkKGZpeExlbilcclxuXHR9LFxyXG5cclxuXHQvKipcclxuXHQgKiBSZXR1cm5zIGEgc3RyaW5nIHdpdGggY3VycmVudCBtYXRyaXggYXMgY29tbWEtc2VwYXJhdGVkIHZhbHVlc1xyXG5cdCAqIHN0cmluZyB3aXRoIGxpbmUtZW5kIChDUitMRikuXHJcblx0ICogQHJldHVybnMge3N0cmluZ31cclxuXHQgKi9cclxuXHR0b0NTVjogZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gdGhpcy50b0FycmF5KCkuam9pbigpICsgXCJcXHJcXG5cIlxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIENvbnZlcnQgY3VycmVudCBtYXRyaXggaW50byBhIGBET01NYXRyaXhgLiBJZiBgRE9NTWF0cml4YCBpcyBub3RcclxuXHQgKiBzdXBwb3J0ZWQsIGEgYG51bGxgIGlzIHJldHVybmVkLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMge0RPTU1hdHJpeH1cclxuXHQgKiBAc2VlIHtAbGluayBodHRwczovL2RyYWZ0cy5meHRmLm9yZy9nZW9tZXRyeS8jZG9tbWF0cml4fE1ETiAvIFNWR01hdHJpeH1cclxuXHQgKi9cclxuXHR0b0RPTU1hdHJpeDogZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgbSA9IG51bGw7XHJcblx0XHRpZiAoXCJET01NYXRyaXhcIiBpbiB3aW5kb3cpIHtcclxuXHRcdFx0bSA9IG5ldyBET01NYXRyaXgoKTtcclxuXHRcdFx0bS5hID0gdGhpcy5hO1xyXG5cdFx0XHRtLmIgPSB0aGlzLmI7XHJcblx0XHRcdG0uYyA9IHRoaXMuYztcclxuXHRcdFx0bS5kID0gdGhpcy5kO1xyXG5cdFx0XHRtLmUgPSB0aGlzLmU7XHJcblx0XHRcdG0uZiA9IHRoaXMuZjtcclxuXHRcdH1cclxuXHRcdHJldHVybiBtXHJcblx0fSxcclxuXHJcblx0LyoqXHJcblx0ICogQ29udmVydCBjdXJyZW50IG1hdHJpeCBpbnRvIGEgYFNWR01hdHJpeGAuIElmIGBTVkdNYXRyaXhgIGlzIG5vdFxyXG5cdCAqIHN1cHBvcnRlZCwgYSBgbnVsbGAgaXMgcmV0dXJuZWQuXHJcblx0ICpcclxuXHQgKiBOb3RlOiBCRVRBXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyB7U1ZHTWF0cml4fVxyXG5cdCAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TVkdNYXRyaXh8TUROIC8gU1ZHTWF0cml4fVxyXG5cdCAqL1xyXG5cdHRvU1ZHTWF0cml4OiBmdW5jdGlvbigpIHtcclxuXHJcblx0XHQvLyBhcyB3ZSBjYW4gbm90IHNldCB0cmFuc2Zvcm1zIGRpcmVjdGx5IG9uIFNWRyBtYXRyaWNlcyB3ZSBuZWVkXHJcblx0XHQvLyB0byBkZWNvbXBvc2Ugb3VyIG93biBtYXRyaXggZmlyc3Q6XHJcblx0XHR2YXIgZGMgPSB0aGlzLmRlY29tcG9zZSgpLFxyXG5cdFx0XHR0cmFuc2xhdGUgPSBkYy50cmFuc2xhdGUsXHJcblx0XHRcdHNjYWxlID0gZGMuc2NhbGUsXHJcblx0XHRcdHNrZXcgPSBkYy5za2V3LFxyXG5cdFx0XHRlcSA9IHRoaXMuX3EsXHJcblx0XHRcdHN2Z01hdHJpeCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwic3ZnXCIpLmNyZWF0ZVNWR01hdHJpeCgpO1xyXG5cclxuXHRcdGlmICghc3ZnTWF0cml4KSByZXR1cm4gbnVsbDtcclxuXHJcblx0XHQvLyBhcHBseSB0cmFuc2Zvcm1hdGlvbnMgaW4gdGhlIGNvcnJlY3Qgb3JkZXIgKHNlZSBkZWNvbXBvc2UoKSksIFFSOiB0cmFuc2xhdGUgLT4gcm90YXRlIC0+IHNjYWxlIC0+IHNrZXdcclxuXHRcdHN2Z01hdHJpeCA9IHN2Z01hdHJpeC50cmFuc2xhdGUodHJhbnNsYXRlLngsIHRyYW5zbGF0ZS55KTtcclxuXHRcdHN2Z01hdHJpeCA9IHN2Z01hdHJpeC5yb3RhdGUoZGMucm90YXRpb24gLyBNYXRoLlBJICogMTgwKTtcdFx0Ly8gU1ZHTWF0cml4IHVzZXMgZGVncmVlc1xyXG5cdFx0c3ZnTWF0cml4ID0gc3ZnTWF0cml4LnNjYWxlTm9uVW5pZm9ybShzY2FsZS54LCBzY2FsZS55KTtcclxuXHJcblx0XHRpZiAoIWVxKDAsIHNrZXcueCkpXHJcblx0XHRcdHN2Z01hdHJpeCA9IHN2Z01hdHJpeC5za2V3WChza2V3LngpO1xyXG5cclxuXHRcdGlmICghZXEoMCwgc2tldy55KSlcclxuXHRcdFx0c3ZnTWF0cml4ID0gc3ZnTWF0cml4LnNrZXdZKHNrZXcueSk7XHJcblxyXG5cdFx0cmV0dXJuIHN2Z01hdHJpeFxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIENvbXBhcmVzIGZsb2F0aW5nIHBvaW50IHZhbHVlcyB3aXRoIHNvbWUgdG9sZXJhbmNlIChlcHNpbG9uKVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBmMSAtIGZsb2F0IDFcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gZjIgLSBmbG9hdCAyXHJcblx0ICogQHJldHVybnMge2Jvb2xlYW59XHJcblx0ICogQHByaXZhdGVcclxuXHQgKi9cclxuXHRfcTogZnVuY3Rpb24oZjEsIGYyKSB7XHJcblx0XHRyZXR1cm4gTWF0aC5hYnMoZjEgLSBmMikgPCAxZS0xNFxyXG5cdH0sXHJcblxyXG5cdC8qKlxyXG5cdCAqIEFwcGx5IGN1cnJlbnQgYWJzb2x1dGUgbWF0cml4IHRvIGNvbnRleHQgaWYgZGVmaW5lZCwgdG8gc3luYyBpdC5cclxuXHQgKiBAcmV0dXJucyB7TWF0cml4fVxyXG5cdCAqIEBwcml2YXRlXHJcblx0ICovXHJcblx0X3g6IGZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIG1lID0gdGhpcztcclxuXHRcdGlmIChtZS5jb250ZXh0KVxyXG5cdFx0XHRtZS5jb250ZXh0LnNldFRyYW5zZm9ybShtZS5hLCBtZS5iLCBtZS5jLCBtZS5kLCBtZS5lLCBtZS5mKTtcclxuXHRcdHJldHVybiBtZVxyXG5cdH1cclxufTtcclxuXHJcbi8vIE5vZGUgc3VwcG9ydFxyXG5pZiAodHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIGV4cG9ydHMuTWF0cml4ID0gTWF0cml4O1xyXG4iLCIvLyAgICAgVW5kZXJzY29yZS5qcyAxLjguM1xuLy8gICAgIGh0dHA6Ly91bmRlcnNjb3JlanMub3JnXG4vLyAgICAgKGMpIDIwMDktMjAxNSBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuLy8gICAgIFVuZGVyc2NvcmUgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbihmdW5jdGlvbigpIHtcblxuICAvLyBCYXNlbGluZSBzZXR1cFxuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEVzdGFibGlzaCB0aGUgcm9vdCBvYmplY3QsIGB3aW5kb3dgIGluIHRoZSBicm93c2VyLCBvciBgZXhwb3J0c2Agb24gdGhlIHNlcnZlci5cbiAgdmFyIHJvb3QgPSB0aGlzO1xuXG4gIC8vIFNhdmUgdGhlIHByZXZpb3VzIHZhbHVlIG9mIHRoZSBgX2AgdmFyaWFibGUuXG4gIHZhciBwcmV2aW91c1VuZGVyc2NvcmUgPSByb290Ll87XG5cbiAgLy8gU2F2ZSBieXRlcyBpbiB0aGUgbWluaWZpZWQgKGJ1dCBub3QgZ3ppcHBlZCkgdmVyc2lvbjpcbiAgdmFyIEFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGUsIE9ialByb3RvID0gT2JqZWN0LnByb3RvdHlwZSwgRnVuY1Byb3RvID0gRnVuY3Rpb24ucHJvdG90eXBlO1xuXG4gIC8vIENyZWF0ZSBxdWljayByZWZlcmVuY2UgdmFyaWFibGVzIGZvciBzcGVlZCBhY2Nlc3MgdG8gY29yZSBwcm90b3R5cGVzLlxuICB2YXJcbiAgICBwdXNoICAgICAgICAgICAgID0gQXJyYXlQcm90by5wdXNoLFxuICAgIHNsaWNlICAgICAgICAgICAgPSBBcnJheVByb3RvLnNsaWNlLFxuICAgIHRvU3RyaW5nICAgICAgICAgPSBPYmpQcm90by50b1N0cmluZyxcbiAgICBoYXNPd25Qcm9wZXJ0eSAgID0gT2JqUHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbiAgLy8gQWxsICoqRUNNQVNjcmlwdCA1KiogbmF0aXZlIGZ1bmN0aW9uIGltcGxlbWVudGF0aW9ucyB0aGF0IHdlIGhvcGUgdG8gdXNlXG4gIC8vIGFyZSBkZWNsYXJlZCBoZXJlLlxuICB2YXJcbiAgICBuYXRpdmVJc0FycmF5ICAgICAgPSBBcnJheS5pc0FycmF5LFxuICAgIG5hdGl2ZUtleXMgICAgICAgICA9IE9iamVjdC5rZXlzLFxuICAgIG5hdGl2ZUJpbmQgICAgICAgICA9IEZ1bmNQcm90by5iaW5kLFxuICAgIG5hdGl2ZUNyZWF0ZSAgICAgICA9IE9iamVjdC5jcmVhdGU7XG5cbiAgLy8gTmFrZWQgZnVuY3Rpb24gcmVmZXJlbmNlIGZvciBzdXJyb2dhdGUtcHJvdG90eXBlLXN3YXBwaW5nLlxuICB2YXIgQ3RvciA9IGZ1bmN0aW9uKCl7fTtcblxuICAvLyBDcmVhdGUgYSBzYWZlIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yIHVzZSBiZWxvdy5cbiAgdmFyIF8gPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgXykgcmV0dXJuIG9iajtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgXykpIHJldHVybiBuZXcgXyhvYmopO1xuICAgIHRoaXMuX3dyYXBwZWQgPSBvYmo7XG4gIH07XG5cbiAgLy8gRXhwb3J0IHRoZSBVbmRlcnNjb3JlIG9iamVjdCBmb3IgKipOb2RlLmpzKiosIHdpdGhcbiAgLy8gYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgZm9yIHRoZSBvbGQgYHJlcXVpcmUoKWAgQVBJLiBJZiB3ZSdyZSBpblxuICAvLyB0aGUgYnJvd3NlciwgYWRkIGBfYCBhcyBhIGdsb2JhbCBvYmplY3QuXG4gIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IF87XG4gICAgfVxuICAgIGV4cG9ydHMuXyA9IF87XG4gIH0gZWxzZSB7XG4gICAgcm9vdC5fID0gXztcbiAgfVxuXG4gIC8vIEN1cnJlbnQgdmVyc2lvbi5cbiAgXy5WRVJTSU9OID0gJzEuOC4zJztcblxuICAvLyBJbnRlcm5hbCBmdW5jdGlvbiB0aGF0IHJldHVybnMgYW4gZWZmaWNpZW50IChmb3IgY3VycmVudCBlbmdpbmVzKSB2ZXJzaW9uXG4gIC8vIG9mIHRoZSBwYXNzZWQtaW4gY2FsbGJhY2ssIHRvIGJlIHJlcGVhdGVkbHkgYXBwbGllZCBpbiBvdGhlciBVbmRlcnNjb3JlXG4gIC8vIGZ1bmN0aW9ucy5cbiAgdmFyIG9wdGltaXplQ2IgPSBmdW5jdGlvbihmdW5jLCBjb250ZXh0LCBhcmdDb3VudCkge1xuICAgIGlmIChjb250ZXh0ID09PSB2b2lkIDApIHJldHVybiBmdW5jO1xuICAgIHN3aXRjaCAoYXJnQ291bnQgPT0gbnVsbCA/IDMgOiBhcmdDb3VudCkge1xuICAgICAgY2FzZSAxOiByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbChjb250ZXh0LCB2YWx1ZSk7XG4gICAgICB9O1xuICAgICAgY2FzZSAyOiByZXR1cm4gZnVuY3Rpb24odmFsdWUsIG90aGVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmNhbGwoY29udGV4dCwgdmFsdWUsIG90aGVyKTtcbiAgICAgIH07XG4gICAgICBjYXNlIDM6IHJldHVybiBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICAgICAgfTtcbiAgICAgIGNhc2UgNDogcmV0dXJuIGZ1bmN0aW9uKGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbChjb250ZXh0LCBhY2N1bXVsYXRvciwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKTtcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBBIG1vc3RseS1pbnRlcm5hbCBmdW5jdGlvbiB0byBnZW5lcmF0ZSBjYWxsYmFja3MgdGhhdCBjYW4gYmUgYXBwbGllZFxuICAvLyB0byBlYWNoIGVsZW1lbnQgaW4gYSBjb2xsZWN0aW9uLCByZXR1cm5pbmcgdGhlIGRlc2lyZWQgcmVzdWx0IOKAlCBlaXRoZXJcbiAgLy8gaWRlbnRpdHksIGFuIGFyYml0cmFyeSBjYWxsYmFjaywgYSBwcm9wZXJ0eSBtYXRjaGVyLCBvciBhIHByb3BlcnR5IGFjY2Vzc29yLlxuICB2YXIgY2IgPSBmdW5jdGlvbih2YWx1ZSwgY29udGV4dCwgYXJnQ291bnQpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIF8uaWRlbnRpdHk7XG4gICAgaWYgKF8uaXNGdW5jdGlvbih2YWx1ZSkpIHJldHVybiBvcHRpbWl6ZUNiKHZhbHVlLCBjb250ZXh0LCBhcmdDb3VudCk7XG4gICAgaWYgKF8uaXNPYmplY3QodmFsdWUpKSByZXR1cm4gXy5tYXRjaGVyKHZhbHVlKTtcbiAgICByZXR1cm4gXy5wcm9wZXJ0eSh2YWx1ZSk7XG4gIH07XG4gIF8uaXRlcmF0ZWUgPSBmdW5jdGlvbih2YWx1ZSwgY29udGV4dCkge1xuICAgIHJldHVybiBjYih2YWx1ZSwgY29udGV4dCwgSW5maW5pdHkpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIGZvciBjcmVhdGluZyBhc3NpZ25lciBmdW5jdGlvbnMuXG4gIHZhciBjcmVhdGVBc3NpZ25lciA9IGZ1bmN0aW9uKGtleXNGdW5jLCB1bmRlZmluZWRPbmx5KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xuICAgICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICBpZiAobGVuZ3RoIDwgMiB8fCBvYmogPT0gbnVsbCkgcmV0dXJuIG9iajtcbiAgICAgIGZvciAodmFyIGluZGV4ID0gMTsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpbmRleF0sXG4gICAgICAgICAgICBrZXlzID0ga2V5c0Z1bmMoc291cmNlKSxcbiAgICAgICAgICAgIGwgPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgICBpZiAoIXVuZGVmaW5lZE9ubHkgfHwgb2JqW2tleV0gPT09IHZvaWQgMCkgb2JqW2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG9iajtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIGZvciBjcmVhdGluZyBhIG5ldyBvYmplY3QgdGhhdCBpbmhlcml0cyBmcm9tIGFub3RoZXIuXG4gIHZhciBiYXNlQ3JlYXRlID0gZnVuY3Rpb24ocHJvdG90eXBlKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KHByb3RvdHlwZSkpIHJldHVybiB7fTtcbiAgICBpZiAobmF0aXZlQ3JlYXRlKSByZXR1cm4gbmF0aXZlQ3JlYXRlKHByb3RvdHlwZSk7XG4gICAgQ3Rvci5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBDdG9yO1xuICAgIEN0b3IucHJvdG90eXBlID0gbnVsbDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIHZhciBwcm9wZXJ0eSA9IGZ1bmN0aW9uKGtleSkge1xuICAgIHJldHVybiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogPT0gbnVsbCA/IHZvaWQgMCA6IG9ialtrZXldO1xuICAgIH07XG4gIH07XG5cbiAgLy8gSGVscGVyIGZvciBjb2xsZWN0aW9uIG1ldGhvZHMgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYSBjb2xsZWN0aW9uXG4gIC8vIHNob3VsZCBiZSBpdGVyYXRlZCBhcyBhbiBhcnJheSBvciBhcyBhbiBvYmplY3RcbiAgLy8gUmVsYXRlZDogaHR0cDovL3Blb3BsZS5tb3ppbGxhLm9yZy9+am9yZW5kb3JmZi9lczYtZHJhZnQuaHRtbCNzZWMtdG9sZW5ndGhcbiAgLy8gQXZvaWRzIGEgdmVyeSBuYXN0eSBpT1MgOCBKSVQgYnVnIG9uIEFSTS02NC4gIzIwOTRcbiAgdmFyIE1BWF9BUlJBWV9JTkRFWCA9IE1hdGgucG93KDIsIDUzKSAtIDE7XG4gIHZhciBnZXRMZW5ndGggPSBwcm9wZXJ0eSgnbGVuZ3RoJyk7XG4gIHZhciBpc0FycmF5TGlrZSA9IGZ1bmN0aW9uKGNvbGxlY3Rpb24pIHtcbiAgICB2YXIgbGVuZ3RoID0gZ2V0TGVuZ3RoKGNvbGxlY3Rpb24pO1xuICAgIHJldHVybiB0eXBlb2YgbGVuZ3RoID09ICdudW1iZXInICYmIGxlbmd0aCA+PSAwICYmIGxlbmd0aCA8PSBNQVhfQVJSQVlfSU5ERVg7XG4gIH07XG5cbiAgLy8gQ29sbGVjdGlvbiBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBUaGUgY29ybmVyc3RvbmUsIGFuIGBlYWNoYCBpbXBsZW1lbnRhdGlvbiwgYWthIGBmb3JFYWNoYC5cbiAgLy8gSGFuZGxlcyByYXcgb2JqZWN0cyBpbiBhZGRpdGlvbiB0byBhcnJheS1saWtlcy4gVHJlYXRzIGFsbFxuICAvLyBzcGFyc2UgYXJyYXktbGlrZXMgYXMgaWYgdGhleSB3ZXJlIGRlbnNlLlxuICBfLmVhY2ggPSBfLmZvckVhY2ggPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0ZWUgPSBvcHRpbWl6ZUNiKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICB2YXIgaSwgbGVuZ3RoO1xuICAgIGlmIChpc0FycmF5TGlrZShvYmopKSB7XG4gICAgICBmb3IgKGkgPSAwLCBsZW5ndGggPSBvYmoubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaXRlcmF0ZWUob2JqW2ldLCBpLCBvYmopO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgICAgZm9yIChpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpdGVyYXRlZShvYmpba2V5c1tpXV0sIGtleXNbaV0sIG9iaik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSByZXN1bHRzIG9mIGFwcGx5aW5nIHRoZSBpdGVyYXRlZSB0byBlYWNoIGVsZW1lbnQuXG4gIF8ubWFwID0gXy5jb2xsZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGl0ZXJhdGVlID0gY2IoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgIHZhciBrZXlzID0gIWlzQXJyYXlMaWtlKG9iaikgJiYgXy5rZXlzKG9iaiksXG4gICAgICAgIGxlbmd0aCA9IChrZXlzIHx8IG9iaikubGVuZ3RoLFxuICAgICAgICByZXN1bHRzID0gQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICB2YXIgY3VycmVudEtleSA9IGtleXMgPyBrZXlzW2luZGV4XSA6IGluZGV4O1xuICAgICAgcmVzdWx0c1tpbmRleF0gPSBpdGVyYXRlZShvYmpbY3VycmVudEtleV0sIGN1cnJlbnRLZXksIG9iaik7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIENyZWF0ZSBhIHJlZHVjaW5nIGZ1bmN0aW9uIGl0ZXJhdGluZyBsZWZ0IG9yIHJpZ2h0LlxuICBmdW5jdGlvbiBjcmVhdGVSZWR1Y2UoZGlyKSB7XG4gICAgLy8gT3B0aW1pemVkIGl0ZXJhdG9yIGZ1bmN0aW9uIGFzIHVzaW5nIGFyZ3VtZW50cy5sZW5ndGhcbiAgICAvLyBpbiB0aGUgbWFpbiBmdW5jdGlvbiB3aWxsIGRlb3B0aW1pemUgdGhlLCBzZWUgIzE5OTEuXG4gICAgZnVuY3Rpb24gaXRlcmF0b3Iob2JqLCBpdGVyYXRlZSwgbWVtbywga2V5cywgaW5kZXgsIGxlbmd0aCkge1xuICAgICAgZm9yICg7IGluZGV4ID49IDAgJiYgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IGRpcikge1xuICAgICAgICB2YXIgY3VycmVudEtleSA9IGtleXMgPyBrZXlzW2luZGV4XSA6IGluZGV4O1xuICAgICAgICBtZW1vID0gaXRlcmF0ZWUobWVtbywgb2JqW2N1cnJlbnRLZXldLCBjdXJyZW50S2V5LCBvYmopO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1lbW87XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIG1lbW8sIGNvbnRleHQpIHtcbiAgICAgIGl0ZXJhdGVlID0gb3B0aW1pemVDYihpdGVyYXRlZSwgY29udGV4dCwgNCk7XG4gICAgICB2YXIga2V5cyA9ICFpc0FycmF5TGlrZShvYmopICYmIF8ua2V5cyhvYmopLFxuICAgICAgICAgIGxlbmd0aCA9IChrZXlzIHx8IG9iaikubGVuZ3RoLFxuICAgICAgICAgIGluZGV4ID0gZGlyID4gMCA/IDAgOiBsZW5ndGggLSAxO1xuICAgICAgLy8gRGV0ZXJtaW5lIHRoZSBpbml0aWFsIHZhbHVlIGlmIG5vbmUgaXMgcHJvdmlkZWQuXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIHtcbiAgICAgICAgbWVtbyA9IG9ialtrZXlzID8ga2V5c1tpbmRleF0gOiBpbmRleF07XG4gICAgICAgIGluZGV4ICs9IGRpcjtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpdGVyYXRvcihvYmosIGl0ZXJhdGVlLCBtZW1vLCBrZXlzLCBpbmRleCwgbGVuZ3RoKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gKipSZWR1Y2UqKiBidWlsZHMgdXAgYSBzaW5nbGUgcmVzdWx0IGZyb20gYSBsaXN0IG9mIHZhbHVlcywgYWthIGBpbmplY3RgLFxuICAvLyBvciBgZm9sZGxgLlxuICBfLnJlZHVjZSA9IF8uZm9sZGwgPSBfLmluamVjdCA9IGNyZWF0ZVJlZHVjZSgxKTtcblxuICAvLyBUaGUgcmlnaHQtYXNzb2NpYXRpdmUgdmVyc2lvbiBvZiByZWR1Y2UsIGFsc28ga25vd24gYXMgYGZvbGRyYC5cbiAgXy5yZWR1Y2VSaWdodCA9IF8uZm9sZHIgPSBjcmVhdGVSZWR1Y2UoLTEpO1xuXG4gIC8vIFJldHVybiB0aGUgZmlyc3QgdmFsdWUgd2hpY2ggcGFzc2VzIGEgdHJ1dGggdGVzdC4gQWxpYXNlZCBhcyBgZGV0ZWN0YC5cbiAgXy5maW5kID0gXy5kZXRlY3QgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHZhciBrZXk7XG4gICAgaWYgKGlzQXJyYXlMaWtlKG9iaikpIHtcbiAgICAgIGtleSA9IF8uZmluZEluZGV4KG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAga2V5ID0gXy5maW5kS2V5KG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICB9XG4gICAgaWYgKGtleSAhPT0gdm9pZCAwICYmIGtleSAhPT0gLTEpIHJldHVybiBvYmpba2V5XTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYWxsIHRoZSBlbGVtZW50cyB0aGF0IHBhc3MgYSB0cnV0aCB0ZXN0LlxuICAvLyBBbGlhc2VkIGFzIGBzZWxlY3RgLlxuICBfLmZpbHRlciA9IF8uc2VsZWN0ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHByZWRpY2F0ZSA9IGNiKHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAocHJlZGljYXRlKHZhbHVlLCBpbmRleCwgbGlzdCkpIHJlc3VsdHMucHVzaCh2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIGEgdHJ1dGggdGVzdCBmYWlscy5cbiAgXy5yZWplY3QgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHJldHVybiBfLmZpbHRlcihvYmosIF8ubmVnYXRlKGNiKHByZWRpY2F0ZSkpLCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgd2hldGhlciBhbGwgb2YgdGhlIGVsZW1lbnRzIG1hdGNoIGEgdHJ1dGggdGVzdC5cbiAgLy8gQWxpYXNlZCBhcyBgYWxsYC5cbiAgXy5ldmVyeSA9IF8uYWxsID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICBwcmVkaWNhdGUgPSBjYihwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIHZhciBrZXlzID0gIWlzQXJyYXlMaWtlKG9iaikgJiYgXy5rZXlzKG9iaiksXG4gICAgICAgIGxlbmd0aCA9IChrZXlzIHx8IG9iaikubGVuZ3RoO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBjdXJyZW50S2V5ID0ga2V5cyA/IGtleXNbaW5kZXhdIDogaW5kZXg7XG4gICAgICBpZiAoIXByZWRpY2F0ZShvYmpbY3VycmVudEtleV0sIGN1cnJlbnRLZXksIG9iaikpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIGF0IGxlYXN0IG9uZSBlbGVtZW50IGluIHRoZSBvYmplY3QgbWF0Y2hlcyBhIHRydXRoIHRlc3QuXG4gIC8vIEFsaWFzZWQgYXMgYGFueWAuXG4gIF8uc29tZSA9IF8uYW55ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICBwcmVkaWNhdGUgPSBjYihwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIHZhciBrZXlzID0gIWlzQXJyYXlMaWtlKG9iaikgJiYgXy5rZXlzKG9iaiksXG4gICAgICAgIGxlbmd0aCA9IChrZXlzIHx8IG9iaikubGVuZ3RoO1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIHZhciBjdXJyZW50S2V5ID0ga2V5cyA/IGtleXNbaW5kZXhdIDogaW5kZXg7XG4gICAgICBpZiAocHJlZGljYXRlKG9ialtjdXJyZW50S2V5XSwgY3VycmVudEtleSwgb2JqKSkgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgdGhlIGFycmF5IG9yIG9iamVjdCBjb250YWlucyBhIGdpdmVuIGl0ZW0gKHVzaW5nIGA9PT1gKS5cbiAgLy8gQWxpYXNlZCBhcyBgaW5jbHVkZXNgIGFuZCBgaW5jbHVkZWAuXG4gIF8uY29udGFpbnMgPSBfLmluY2x1ZGVzID0gXy5pbmNsdWRlID0gZnVuY3Rpb24ob2JqLCBpdGVtLCBmcm9tSW5kZXgsIGd1YXJkKSB7XG4gICAgaWYgKCFpc0FycmF5TGlrZShvYmopKSBvYmogPSBfLnZhbHVlcyhvYmopO1xuICAgIGlmICh0eXBlb2YgZnJvbUluZGV4ICE9ICdudW1iZXInIHx8IGd1YXJkKSBmcm9tSW5kZXggPSAwO1xuICAgIHJldHVybiBfLmluZGV4T2Yob2JqLCBpdGVtLCBmcm9tSW5kZXgpID49IDA7XG4gIH07XG5cbiAgLy8gSW52b2tlIGEgbWV0aG9kICh3aXRoIGFyZ3VtZW50cykgb24gZXZlcnkgaXRlbSBpbiBhIGNvbGxlY3Rpb24uXG4gIF8uaW52b2tlID0gZnVuY3Rpb24ob2JqLCBtZXRob2QpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICB2YXIgaXNGdW5jID0gXy5pc0Z1bmN0aW9uKG1ldGhvZCk7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHZhciBmdW5jID0gaXNGdW5jID8gbWV0aG9kIDogdmFsdWVbbWV0aG9kXTtcbiAgICAgIHJldHVybiBmdW5jID09IG51bGwgPyBmdW5jIDogZnVuYy5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgbWFwYDogZmV0Y2hpbmcgYSBwcm9wZXJ0eS5cbiAgXy5wbHVjayA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgXy5wcm9wZXJ0eShrZXkpKTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaWx0ZXJgOiBzZWxlY3Rpbmcgb25seSBvYmplY3RzXG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8ud2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzKSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKG9iaiwgXy5tYXRjaGVyKGF0dHJzKSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmluZGA6IGdldHRpbmcgdGhlIGZpcnN0IG9iamVjdFxuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLmZpbmRXaGVyZSA9IGZ1bmN0aW9uKG9iaiwgYXR0cnMpIHtcbiAgICByZXR1cm4gXy5maW5kKG9iaiwgXy5tYXRjaGVyKGF0dHJzKSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtYXhpbXVtIGVsZW1lbnQgKG9yIGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICBfLm1heCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0ID0gLUluZmluaXR5LCBsYXN0Q29tcHV0ZWQgPSAtSW5maW5pdHksXG4gICAgICAgIHZhbHVlLCBjb21wdXRlZDtcbiAgICBpZiAoaXRlcmF0ZWUgPT0gbnVsbCAmJiBvYmogIT0gbnVsbCkge1xuICAgICAgb2JqID0gaXNBcnJheUxpa2Uob2JqKSA/IG9iaiA6IF8udmFsdWVzKG9iaik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhbHVlID0gb2JqW2ldO1xuICAgICAgICBpZiAodmFsdWUgPiByZXN1bHQpIHtcbiAgICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpdGVyYXRlZSA9IGNiKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgICBjb21wdXRlZCA9IGl0ZXJhdGVlKHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgICAgIGlmIChjb21wdXRlZCA+IGxhc3RDb21wdXRlZCB8fCBjb21wdXRlZCA9PT0gLUluZmluaXR5ICYmIHJlc3VsdCA9PT0gLUluZmluaXR5KSB7XG4gICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgICAgbGFzdENvbXB1dGVkID0gY29tcHV0ZWQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWluaW11bSBlbGVtZW50IChvciBlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgXy5taW4gPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdCA9IEluZmluaXR5LCBsYXN0Q29tcHV0ZWQgPSBJbmZpbml0eSxcbiAgICAgICAgdmFsdWUsIGNvbXB1dGVkO1xuICAgIGlmIChpdGVyYXRlZSA9PSBudWxsICYmIG9iaiAhPSBudWxsKSB7XG4gICAgICBvYmogPSBpc0FycmF5TGlrZShvYmopID8gb2JqIDogXy52YWx1ZXMob2JqKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBvYmoubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFsdWUgPSBvYmpbaV07XG4gICAgICAgIGlmICh2YWx1ZSA8IHJlc3VsdCkge1xuICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGl0ZXJhdGVlID0gY2IoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICAgIGNvbXB1dGVkID0gaXRlcmF0ZWUodmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICAgICAgaWYgKGNvbXB1dGVkIDwgbGFzdENvbXB1dGVkIHx8IGNvbXB1dGVkID09PSBJbmZpbml0eSAmJiByZXN1bHQgPT09IEluZmluaXR5KSB7XG4gICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgICAgbGFzdENvbXB1dGVkID0gY29tcHV0ZWQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFNodWZmbGUgYSBjb2xsZWN0aW9uLCB1c2luZyB0aGUgbW9kZXJuIHZlcnNpb24gb2YgdGhlXG4gIC8vIFtGaXNoZXItWWF0ZXMgc2h1ZmZsZV0oaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GaXNoZXLigJNZYXRlc19zaHVmZmxlKS5cbiAgXy5zaHVmZmxlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHNldCA9IGlzQXJyYXlMaWtlKG9iaikgPyBvYmogOiBfLnZhbHVlcyhvYmopO1xuICAgIHZhciBsZW5ndGggPSBzZXQubGVuZ3RoO1xuICAgIHZhciBzaHVmZmxlZCA9IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwLCByYW5kOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgcmFuZCA9IF8ucmFuZG9tKDAsIGluZGV4KTtcbiAgICAgIGlmIChyYW5kICE9PSBpbmRleCkgc2h1ZmZsZWRbaW5kZXhdID0gc2h1ZmZsZWRbcmFuZF07XG4gICAgICBzaHVmZmxlZFtyYW5kXSA9IHNldFtpbmRleF07XG4gICAgfVxuICAgIHJldHVybiBzaHVmZmxlZDtcbiAgfTtcblxuICAvLyBTYW1wbGUgKipuKiogcmFuZG9tIHZhbHVlcyBmcm9tIGEgY29sbGVjdGlvbi5cbiAgLy8gSWYgKipuKiogaXMgbm90IHNwZWNpZmllZCwgcmV0dXJucyBhIHNpbmdsZSByYW5kb20gZWxlbWVudC5cbiAgLy8gVGhlIGludGVybmFsIGBndWFyZGAgYXJndW1lbnQgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgbWFwYC5cbiAgXy5zYW1wbGUgPSBmdW5jdGlvbihvYmosIG4sIGd1YXJkKSB7XG4gICAgaWYgKG4gPT0gbnVsbCB8fCBndWFyZCkge1xuICAgICAgaWYgKCFpc0FycmF5TGlrZShvYmopKSBvYmogPSBfLnZhbHVlcyhvYmopO1xuICAgICAgcmV0dXJuIG9ialtfLnJhbmRvbShvYmoubGVuZ3RoIC0gMSldO1xuICAgIH1cbiAgICByZXR1cm4gXy5zaHVmZmxlKG9iaikuc2xpY2UoMCwgTWF0aC5tYXgoMCwgbikpO1xuICB9O1xuXG4gIC8vIFNvcnQgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiBwcm9kdWNlZCBieSBhbiBpdGVyYXRlZS5cbiAgXy5zb3J0QnkgPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0ZWUgPSBjYihpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgcmV0dXJuIF8ucGx1Y2soXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICBjcml0ZXJpYTogaXRlcmF0ZWUodmFsdWUsIGluZGV4LCBsaXN0KVxuICAgICAgfTtcbiAgICB9KS5zb3J0KGZ1bmN0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWE7XG4gICAgICB2YXIgYiA9IHJpZ2h0LmNyaXRlcmlhO1xuICAgICAgaWYgKGEgIT09IGIpIHtcbiAgICAgICAgaWYgKGEgPiBiIHx8IGEgPT09IHZvaWQgMCkgcmV0dXJuIDE7XG4gICAgICAgIGlmIChhIDwgYiB8fCBiID09PSB2b2lkIDApIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsZWZ0LmluZGV4IC0gcmlnaHQuaW5kZXg7XG4gICAgfSksICd2YWx1ZScpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHVzZWQgZm9yIGFnZ3JlZ2F0ZSBcImdyb3VwIGJ5XCIgb3BlcmF0aW9ucy5cbiAgdmFyIGdyb3VwID0gZnVuY3Rpb24oYmVoYXZpb3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgaXRlcmF0ZWUgPSBjYihpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgICBfLmVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgdmFyIGtleSA9IGl0ZXJhdGVlKHZhbHVlLCBpbmRleCwgb2JqKTtcbiAgICAgICAgYmVoYXZpb3IocmVzdWx0LCB2YWx1ZSwga2V5KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEdyb3VwcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLiBQYXNzIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGVcbiAgLy8gdG8gZ3JvdXAgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjcml0ZXJpb24uXG4gIF8uZ3JvdXBCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwgdmFsdWUsIGtleSkge1xuICAgIGlmIChfLmhhcyhyZXN1bHQsIGtleSkpIHJlc3VsdFtrZXldLnB1c2godmFsdWUpOyBlbHNlIHJlc3VsdFtrZXldID0gW3ZhbHVlXTtcbiAgfSk7XG5cbiAgLy8gSW5kZXhlcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLCBzaW1pbGFyIHRvIGBncm91cEJ5YCwgYnV0IGZvclxuICAvLyB3aGVuIHlvdSBrbm93IHRoYXQgeW91ciBpbmRleCB2YWx1ZXMgd2lsbCBiZSB1bmlxdWUuXG4gIF8uaW5kZXhCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwgdmFsdWUsIGtleSkge1xuICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gIH0pO1xuXG4gIC8vIENvdW50cyBpbnN0YW5jZXMgb2YgYW4gb2JqZWN0IHRoYXQgZ3JvdXAgYnkgYSBjZXJ0YWluIGNyaXRlcmlvbi4gUGFzc1xuICAvLyBlaXRoZXIgYSBzdHJpbmcgYXR0cmlidXRlIHRvIGNvdW50IGJ5LCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGVcbiAgLy8gY3JpdGVyaW9uLlxuICBfLmNvdW50QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIHZhbHVlLCBrZXkpIHtcbiAgICBpZiAoXy5oYXMocmVzdWx0LCBrZXkpKSByZXN1bHRba2V5XSsrOyBlbHNlIHJlc3VsdFtrZXldID0gMTtcbiAgfSk7XG5cbiAgLy8gU2FmZWx5IGNyZWF0ZSBhIHJlYWwsIGxpdmUgYXJyYXkgZnJvbSBhbnl0aGluZyBpdGVyYWJsZS5cbiAgXy50b0FycmF5ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFvYmopIHJldHVybiBbXTtcbiAgICBpZiAoXy5pc0FycmF5KG9iaikpIHJldHVybiBzbGljZS5jYWxsKG9iaik7XG4gICAgaWYgKGlzQXJyYXlMaWtlKG9iaikpIHJldHVybiBfLm1hcChvYmosIF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBfLnZhbHVlcyhvYmopO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbnVtYmVyIG9mIGVsZW1lbnRzIGluIGFuIG9iamVjdC5cbiAgXy5zaXplID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gMDtcbiAgICByZXR1cm4gaXNBcnJheUxpa2Uob2JqKSA/IG9iai5sZW5ndGggOiBfLmtleXMob2JqKS5sZW5ndGg7XG4gIH07XG5cbiAgLy8gU3BsaXQgYSBjb2xsZWN0aW9uIGludG8gdHdvIGFycmF5czogb25lIHdob3NlIGVsZW1lbnRzIGFsbCBzYXRpc2Z5IHRoZSBnaXZlblxuICAvLyBwcmVkaWNhdGUsIGFuZCBvbmUgd2hvc2UgZWxlbWVudHMgYWxsIGRvIG5vdCBzYXRpc2Z5IHRoZSBwcmVkaWNhdGUuXG4gIF8ucGFydGl0aW9uID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICBwcmVkaWNhdGUgPSBjYihwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIHZhciBwYXNzID0gW10sIGZhaWwgPSBbXTtcbiAgICBfLmVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwga2V5LCBvYmopIHtcbiAgICAgIChwcmVkaWNhdGUodmFsdWUsIGtleSwgb2JqKSA/IHBhc3MgOiBmYWlsKS5wdXNoKHZhbHVlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gW3Bhc3MsIGZhaWxdO1xuICB9O1xuXG4gIC8vIEFycmF5IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBHZXQgdGhlIGZpcnN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gdGhlIGZpcnN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS4gQWxpYXNlZCBhcyBgaGVhZGAgYW5kIGB0YWtlYC4gVGhlICoqZ3VhcmQqKiBjaGVja1xuICAvLyBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8uZmlyc3QgPSBfLmhlYWQgPSBfLnRha2UgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICBpZiAobiA9PSBudWxsIHx8IGd1YXJkKSByZXR1cm4gYXJyYXlbMF07XG4gICAgcmV0dXJuIF8uaW5pdGlhbChhcnJheSwgYXJyYXkubGVuZ3RoIC0gbik7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgbGFzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEVzcGVjaWFsbHkgdXNlZnVsIG9uXG4gIC8vIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIGFsbCB0aGUgdmFsdWVzIGluXG4gIC8vIHRoZSBhcnJheSwgZXhjbHVkaW5nIHRoZSBsYXN0IE4uXG4gIF8uaW5pdGlhbCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCAwLCBNYXRoLm1heCgwLCBhcnJheS5sZW5ndGggLSAobiA9PSBudWxsIHx8IGd1YXJkID8gMSA6IG4pKSk7XG4gIH07XG5cbiAgLy8gR2V0IHRoZSBsYXN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gdGhlIGxhc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LlxuICBfLmxhc3QgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICBpZiAobiA9PSBudWxsIHx8IGd1YXJkKSByZXR1cm4gYXJyYXlbYXJyYXkubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIF8ucmVzdChhcnJheSwgTWF0aC5tYXgoMCwgYXJyYXkubGVuZ3RoIC0gbikpO1xuICB9O1xuXG4gIC8vIFJldHVybnMgZXZlcnl0aGluZyBidXQgdGhlIGZpcnN0IGVudHJ5IG9mIHRoZSBhcnJheS4gQWxpYXNlZCBhcyBgdGFpbGAgYW5kIGBkcm9wYC5cbiAgLy8gRXNwZWNpYWxseSB1c2VmdWwgb24gdGhlIGFyZ3VtZW50cyBvYmplY3QuIFBhc3NpbmcgYW4gKipuKiogd2lsbCByZXR1cm5cbiAgLy8gdGhlIHJlc3QgTiB2YWx1ZXMgaW4gdGhlIGFycmF5LlxuICBfLnJlc3QgPSBfLnRhaWwgPSBfLmRyb3AgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgbiA9PSBudWxsIHx8IGd1YXJkID8gMSA6IG4pO1xuICB9O1xuXG4gIC8vIFRyaW0gb3V0IGFsbCBmYWxzeSB2YWx1ZXMgZnJvbSBhbiBhcnJheS5cbiAgXy5jb21wYWN0ID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIF8uaWRlbnRpdHkpO1xuICB9O1xuXG4gIC8vIEludGVybmFsIGltcGxlbWVudGF0aW9uIG9mIGEgcmVjdXJzaXZlIGBmbGF0dGVuYCBmdW5jdGlvbi5cbiAgdmFyIGZsYXR0ZW4gPSBmdW5jdGlvbihpbnB1dCwgc2hhbGxvdywgc3RyaWN0LCBzdGFydEluZGV4KSB7XG4gICAgdmFyIG91dHB1dCA9IFtdLCBpZHggPSAwO1xuICAgIGZvciAodmFyIGkgPSBzdGFydEluZGV4IHx8IDAsIGxlbmd0aCA9IGdldExlbmd0aChpbnB1dCk7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHZhbHVlID0gaW5wdXRbaV07XG4gICAgICBpZiAoaXNBcnJheUxpa2UodmFsdWUpICYmIChfLmlzQXJyYXkodmFsdWUpIHx8IF8uaXNBcmd1bWVudHModmFsdWUpKSkge1xuICAgICAgICAvL2ZsYXR0ZW4gY3VycmVudCBsZXZlbCBvZiBhcnJheSBvciBhcmd1bWVudHMgb2JqZWN0XG4gICAgICAgIGlmICghc2hhbGxvdykgdmFsdWUgPSBmbGF0dGVuKHZhbHVlLCBzaGFsbG93LCBzdHJpY3QpO1xuICAgICAgICB2YXIgaiA9IDAsIGxlbiA9IHZhbHVlLmxlbmd0aDtcbiAgICAgICAgb3V0cHV0Lmxlbmd0aCArPSBsZW47XG4gICAgICAgIHdoaWxlIChqIDwgbGVuKSB7XG4gICAgICAgICAgb3V0cHV0W2lkeCsrXSA9IHZhbHVlW2orK107XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIXN0cmljdCkge1xuICAgICAgICBvdXRwdXRbaWR4KytdID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH07XG5cbiAgLy8gRmxhdHRlbiBvdXQgYW4gYXJyYXksIGVpdGhlciByZWN1cnNpdmVseSAoYnkgZGVmYXVsdCksIG9yIGp1c3Qgb25lIGxldmVsLlxuICBfLmZsYXR0ZW4gPSBmdW5jdGlvbihhcnJheSwgc2hhbGxvdykge1xuICAgIHJldHVybiBmbGF0dGVuKGFycmF5LCBzaGFsbG93LCBmYWxzZSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgdmVyc2lvbiBvZiB0aGUgYXJyYXkgdGhhdCBkb2VzIG5vdCBjb250YWluIHRoZSBzcGVjaWZpZWQgdmFsdWUocykuXG4gIF8ud2l0aG91dCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZGlmZmVyZW5jZShhcnJheSwgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGEgZHVwbGljYXRlLWZyZWUgdmVyc2lvbiBvZiB0aGUgYXJyYXkuIElmIHRoZSBhcnJheSBoYXMgYWxyZWFkeVxuICAvLyBiZWVuIHNvcnRlZCwgeW91IGhhdmUgdGhlIG9wdGlvbiBvZiB1c2luZyBhIGZhc3RlciBhbGdvcml0aG0uXG4gIC8vIEFsaWFzZWQgYXMgYHVuaXF1ZWAuXG4gIF8udW5pcSA9IF8udW5pcXVlID0gZnVuY3Rpb24oYXJyYXksIGlzU29ydGVkLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGlmICghXy5pc0Jvb2xlYW4oaXNTb3J0ZWQpKSB7XG4gICAgICBjb250ZXh0ID0gaXRlcmF0ZWU7XG4gICAgICBpdGVyYXRlZSA9IGlzU29ydGVkO1xuICAgICAgaXNTb3J0ZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGl0ZXJhdGVlICE9IG51bGwpIGl0ZXJhdGVlID0gY2IoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICB2YXIgc2VlbiA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBnZXRMZW5ndGgoYXJyYXkpOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciB2YWx1ZSA9IGFycmF5W2ldLFxuICAgICAgICAgIGNvbXB1dGVkID0gaXRlcmF0ZWUgPyBpdGVyYXRlZSh2YWx1ZSwgaSwgYXJyYXkpIDogdmFsdWU7XG4gICAgICBpZiAoaXNTb3J0ZWQpIHtcbiAgICAgICAgaWYgKCFpIHx8IHNlZW4gIT09IGNvbXB1dGVkKSByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgIHNlZW4gPSBjb21wdXRlZDtcbiAgICAgIH0gZWxzZSBpZiAoaXRlcmF0ZWUpIHtcbiAgICAgICAgaWYgKCFfLmNvbnRhaW5zKHNlZW4sIGNvbXB1dGVkKSkge1xuICAgICAgICAgIHNlZW4ucHVzaChjb21wdXRlZCk7XG4gICAgICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFfLmNvbnRhaW5zKHJlc3VsdCwgdmFsdWUpKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgdGhlIHVuaW9uOiBlYWNoIGRpc3RpbmN0IGVsZW1lbnQgZnJvbSBhbGwgb2ZcbiAgLy8gdGhlIHBhc3NlZC1pbiBhcnJheXMuXG4gIF8udW5pb24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXy51bmlxKGZsYXR0ZW4oYXJndW1lbnRzLCB0cnVlLCB0cnVlKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIGV2ZXJ5IGl0ZW0gc2hhcmVkIGJldHdlZW4gYWxsIHRoZVxuICAvLyBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLmludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIHZhciBhcmdzTGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gZ2V0TGVuZ3RoKGFycmF5KTsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaXRlbSA9IGFycmF5W2ldO1xuICAgICAgaWYgKF8uY29udGFpbnMocmVzdWx0LCBpdGVtKSkgY29udGludWU7XG4gICAgICBmb3IgKHZhciBqID0gMTsgaiA8IGFyZ3NMZW5ndGg7IGorKykge1xuICAgICAgICBpZiAoIV8uY29udGFpbnMoYXJndW1lbnRzW2pdLCBpdGVtKSkgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAoaiA9PT0gYXJnc0xlbmd0aCkgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gVGFrZSB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIG9uZSBhcnJheSBhbmQgYSBudW1iZXIgb2Ygb3RoZXIgYXJyYXlzLlxuICAvLyBPbmx5IHRoZSBlbGVtZW50cyBwcmVzZW50IGluIGp1c3QgdGhlIGZpcnN0IGFycmF5IHdpbGwgcmVtYWluLlxuICBfLmRpZmZlcmVuY2UgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciByZXN0ID0gZmxhdHRlbihhcmd1bWVudHMsIHRydWUsIHRydWUsIDEpO1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgZnVuY3Rpb24odmFsdWUpe1xuICAgICAgcmV0dXJuICFfLmNvbnRhaW5zKHJlc3QsIHZhbHVlKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBaaXAgdG9nZXRoZXIgbXVsdGlwbGUgbGlzdHMgaW50byBhIHNpbmdsZSBhcnJheSAtLSBlbGVtZW50cyB0aGF0IHNoYXJlXG4gIC8vIGFuIGluZGV4IGdvIHRvZ2V0aGVyLlxuICBfLnppcCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfLnVuemlwKGFyZ3VtZW50cyk7XG4gIH07XG5cbiAgLy8gQ29tcGxlbWVudCBvZiBfLnppcC4gVW56aXAgYWNjZXB0cyBhbiBhcnJheSBvZiBhcnJheXMgYW5kIGdyb3Vwc1xuICAvLyBlYWNoIGFycmF5J3MgZWxlbWVudHMgb24gc2hhcmVkIGluZGljZXNcbiAgXy51bnppcCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIGxlbmd0aCA9IGFycmF5ICYmIF8ubWF4KGFycmF5LCBnZXRMZW5ndGgpLmxlbmd0aCB8fCAwO1xuICAgIHZhciByZXN1bHQgPSBBcnJheShsZW5ndGgpO1xuXG4gICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgcmVzdWx0W2luZGV4XSA9IF8ucGx1Y2soYXJyYXksIGluZGV4KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBDb252ZXJ0cyBsaXN0cyBpbnRvIG9iamVjdHMuIFBhc3MgZWl0aGVyIGEgc2luZ2xlIGFycmF5IG9mIGBba2V5LCB2YWx1ZV1gXG4gIC8vIHBhaXJzLCBvciB0d28gcGFyYWxsZWwgYXJyYXlzIG9mIHRoZSBzYW1lIGxlbmd0aCAtLSBvbmUgb2Yga2V5cywgYW5kIG9uZSBvZlxuICAvLyB0aGUgY29ycmVzcG9uZGluZyB2YWx1ZXMuXG4gIF8ub2JqZWN0ID0gZnVuY3Rpb24obGlzdCwgdmFsdWVzKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBnZXRMZW5ndGgobGlzdCk7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHZhbHVlcykge1xuICAgICAgICByZXN1bHRbbGlzdFtpXV0gPSB2YWx1ZXNbaV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRbbGlzdFtpXVswXV0gPSBsaXN0W2ldWzFdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIEdlbmVyYXRvciBmdW5jdGlvbiB0byBjcmVhdGUgdGhlIGZpbmRJbmRleCBhbmQgZmluZExhc3RJbmRleCBmdW5jdGlvbnNcbiAgZnVuY3Rpb24gY3JlYXRlUHJlZGljYXRlSW5kZXhGaW5kZXIoZGlyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGFycmF5LCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHByZWRpY2F0ZSA9IGNiKHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgICB2YXIgbGVuZ3RoID0gZ2V0TGVuZ3RoKGFycmF5KTtcbiAgICAgIHZhciBpbmRleCA9IGRpciA+IDAgPyAwIDogbGVuZ3RoIC0gMTtcbiAgICAgIGZvciAoOyBpbmRleCA+PSAwICYmIGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSBkaXIpIHtcbiAgICAgICAgaWYgKHByZWRpY2F0ZShhcnJheVtpbmRleF0sIGluZGV4LCBhcnJheSkpIHJldHVybiBpbmRleDtcbiAgICAgIH1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9O1xuICB9XG5cbiAgLy8gUmV0dXJucyB0aGUgZmlyc3QgaW5kZXggb24gYW4gYXJyYXktbGlrZSB0aGF0IHBhc3NlcyBhIHByZWRpY2F0ZSB0ZXN0XG4gIF8uZmluZEluZGV4ID0gY3JlYXRlUHJlZGljYXRlSW5kZXhGaW5kZXIoMSk7XG4gIF8uZmluZExhc3RJbmRleCA9IGNyZWF0ZVByZWRpY2F0ZUluZGV4RmluZGVyKC0xKTtcblxuICAvLyBVc2UgYSBjb21wYXJhdG9yIGZ1bmN0aW9uIHRvIGZpZ3VyZSBvdXQgdGhlIHNtYWxsZXN0IGluZGV4IGF0IHdoaWNoXG4gIC8vIGFuIG9iamVjdCBzaG91bGQgYmUgaW5zZXJ0ZWQgc28gYXMgdG8gbWFpbnRhaW4gb3JkZXIuIFVzZXMgYmluYXJ5IHNlYXJjaC5cbiAgXy5zb3J0ZWRJbmRleCA9IGZ1bmN0aW9uKGFycmF5LCBvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0ZWUgPSBjYihpdGVyYXRlZSwgY29udGV4dCwgMSk7XG4gICAgdmFyIHZhbHVlID0gaXRlcmF0ZWUob2JqKTtcbiAgICB2YXIgbG93ID0gMCwgaGlnaCA9IGdldExlbmd0aChhcnJheSk7XG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcbiAgICAgIHZhciBtaWQgPSBNYXRoLmZsb29yKChsb3cgKyBoaWdoKSAvIDIpO1xuICAgICAgaWYgKGl0ZXJhdGVlKGFycmF5W21pZF0pIDwgdmFsdWUpIGxvdyA9IG1pZCArIDE7IGVsc2UgaGlnaCA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvdztcbiAgfTtcblxuICAvLyBHZW5lcmF0b3IgZnVuY3Rpb24gdG8gY3JlYXRlIHRoZSBpbmRleE9mIGFuZCBsYXN0SW5kZXhPZiBmdW5jdGlvbnNcbiAgZnVuY3Rpb24gY3JlYXRlSW5kZXhGaW5kZXIoZGlyLCBwcmVkaWNhdGVGaW5kLCBzb3J0ZWRJbmRleCkge1xuICAgIHJldHVybiBmdW5jdGlvbihhcnJheSwgaXRlbSwgaWR4KSB7XG4gICAgICB2YXIgaSA9IDAsIGxlbmd0aCA9IGdldExlbmd0aChhcnJheSk7XG4gICAgICBpZiAodHlwZW9mIGlkeCA9PSAnbnVtYmVyJykge1xuICAgICAgICBpZiAoZGlyID4gMCkge1xuICAgICAgICAgICAgaSA9IGlkeCA+PSAwID8gaWR4IDogTWF0aC5tYXgoaWR4ICsgbGVuZ3RoLCBpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxlbmd0aCA9IGlkeCA+PSAwID8gTWF0aC5taW4oaWR4ICsgMSwgbGVuZ3RoKSA6IGlkeCArIGxlbmd0aCArIDE7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoc29ydGVkSW5kZXggJiYgaWR4ICYmIGxlbmd0aCkge1xuICAgICAgICBpZHggPSBzb3J0ZWRJbmRleChhcnJheSwgaXRlbSk7XG4gICAgICAgIHJldHVybiBhcnJheVtpZHhdID09PSBpdGVtID8gaWR4IDogLTE7XG4gICAgICB9XG4gICAgICBpZiAoaXRlbSAhPT0gaXRlbSkge1xuICAgICAgICBpZHggPSBwcmVkaWNhdGVGaW5kKHNsaWNlLmNhbGwoYXJyYXksIGksIGxlbmd0aCksIF8uaXNOYU4pO1xuICAgICAgICByZXR1cm4gaWR4ID49IDAgPyBpZHggKyBpIDogLTE7XG4gICAgICB9XG4gICAgICBmb3IgKGlkeCA9IGRpciA+IDAgPyBpIDogbGVuZ3RoIC0gMTsgaWR4ID49IDAgJiYgaWR4IDwgbGVuZ3RoOyBpZHggKz0gZGlyKSB7XG4gICAgICAgIGlmIChhcnJheVtpZHhdID09PSBpdGVtKSByZXR1cm4gaWR4O1xuICAgICAgfVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH07XG4gIH1cblxuICAvLyBSZXR1cm4gdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGFuIGl0ZW0gaW4gYW4gYXJyYXksXG4gIC8vIG9yIC0xIGlmIHRoZSBpdGVtIGlzIG5vdCBpbmNsdWRlZCBpbiB0aGUgYXJyYXkuXG4gIC8vIElmIHRoZSBhcnJheSBpcyBsYXJnZSBhbmQgYWxyZWFkeSBpbiBzb3J0IG9yZGVyLCBwYXNzIGB0cnVlYFxuICAvLyBmb3IgKippc1NvcnRlZCoqIHRvIHVzZSBiaW5hcnkgc2VhcmNoLlxuICBfLmluZGV4T2YgPSBjcmVhdGVJbmRleEZpbmRlcigxLCBfLmZpbmRJbmRleCwgXy5zb3J0ZWRJbmRleCk7XG4gIF8ubGFzdEluZGV4T2YgPSBjcmVhdGVJbmRleEZpbmRlcigtMSwgXy5maW5kTGFzdEluZGV4KTtcblxuICAvLyBHZW5lcmF0ZSBhbiBpbnRlZ2VyIEFycmF5IGNvbnRhaW5pbmcgYW4gYXJpdGhtZXRpYyBwcm9ncmVzc2lvbi4gQSBwb3J0IG9mXG4gIC8vIHRoZSBuYXRpdmUgUHl0aG9uIGByYW5nZSgpYCBmdW5jdGlvbi4gU2VlXG4gIC8vIFt0aGUgUHl0aG9uIGRvY3VtZW50YXRpb25dKGh0dHA6Ly9kb2NzLnB5dGhvbi5vcmcvbGlicmFyeS9mdW5jdGlvbnMuaHRtbCNyYW5nZSkuXG4gIF8ucmFuZ2UgPSBmdW5jdGlvbihzdGFydCwgc3RvcCwgc3RlcCkge1xuICAgIGlmIChzdG9wID09IG51bGwpIHtcbiAgICAgIHN0b3AgPSBzdGFydCB8fCAwO1xuICAgICAgc3RhcnQgPSAwO1xuICAgIH1cbiAgICBzdGVwID0gc3RlcCB8fCAxO1xuXG4gICAgdmFyIGxlbmd0aCA9IE1hdGgubWF4KE1hdGguY2VpbCgoc3RvcCAtIHN0YXJ0KSAvIHN0ZXApLCAwKTtcbiAgICB2YXIgcmFuZ2UgPSBBcnJheShsZW5ndGgpO1xuXG4gICAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgbGVuZ3RoOyBpZHgrKywgc3RhcnQgKz0gc3RlcCkge1xuICAgICAgcmFuZ2VbaWR4XSA9IHN0YXJ0O1xuICAgIH1cblxuICAgIHJldHVybiByYW5nZTtcbiAgfTtcblxuICAvLyBGdW5jdGlvbiAoYWhlbSkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIERldGVybWluZXMgd2hldGhlciB0byBleGVjdXRlIGEgZnVuY3Rpb24gYXMgYSBjb25zdHJ1Y3RvclxuICAvLyBvciBhIG5vcm1hbCBmdW5jdGlvbiB3aXRoIHRoZSBwcm92aWRlZCBhcmd1bWVudHNcbiAgdmFyIGV4ZWN1dGVCb3VuZCA9IGZ1bmN0aW9uKHNvdXJjZUZ1bmMsIGJvdW5kRnVuYywgY29udGV4dCwgY2FsbGluZ0NvbnRleHQsIGFyZ3MpIHtcbiAgICBpZiAoIShjYWxsaW5nQ29udGV4dCBpbnN0YW5jZW9mIGJvdW5kRnVuYykpIHJldHVybiBzb3VyY2VGdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgIHZhciBzZWxmID0gYmFzZUNyZWF0ZShzb3VyY2VGdW5jLnByb3RvdHlwZSk7XG4gICAgdmFyIHJlc3VsdCA9IHNvdXJjZUZ1bmMuYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgaWYgKF8uaXNPYmplY3QocmVzdWx0KSkgcmV0dXJuIHJlc3VsdDtcbiAgICByZXR1cm4gc2VsZjtcbiAgfTtcblxuICAvLyBDcmVhdGUgYSBmdW5jdGlvbiBib3VuZCB0byBhIGdpdmVuIG9iamVjdCAoYXNzaWduaW5nIGB0aGlzYCwgYW5kIGFyZ3VtZW50cyxcbiAgLy8gb3B0aW9uYWxseSkuIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBGdW5jdGlvbi5iaW5kYCBpZlxuICAvLyBhdmFpbGFibGUuXG4gIF8uYmluZCA9IGZ1bmN0aW9uKGZ1bmMsIGNvbnRleHQpIHtcbiAgICBpZiAobmF0aXZlQmluZCAmJiBmdW5jLmJpbmQgPT09IG5hdGl2ZUJpbmQpIHJldHVybiBuYXRpdmVCaW5kLmFwcGx5KGZ1bmMsIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgaWYgKCFfLmlzRnVuY3Rpb24oZnVuYykpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0JpbmQgbXVzdCBiZSBjYWxsZWQgb24gYSBmdW5jdGlvbicpO1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBib3VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4ZWN1dGVCb3VuZChmdW5jLCBib3VuZCwgY29udGV4dCwgdGhpcywgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgfTtcbiAgICByZXR1cm4gYm91bmQ7XG4gIH07XG5cbiAgLy8gUGFydGlhbGx5IGFwcGx5IGEgZnVuY3Rpb24gYnkgY3JlYXRpbmcgYSB2ZXJzaW9uIHRoYXQgaGFzIGhhZCBzb21lIG9mIGl0c1xuICAvLyBhcmd1bWVudHMgcHJlLWZpbGxlZCwgd2l0aG91dCBjaGFuZ2luZyBpdHMgZHluYW1pYyBgdGhpc2AgY29udGV4dC4gXyBhY3RzXG4gIC8vIGFzIGEgcGxhY2Vob2xkZXIsIGFsbG93aW5nIGFueSBjb21iaW5hdGlvbiBvZiBhcmd1bWVudHMgdG8gYmUgcHJlLWZpbGxlZC5cbiAgXy5wYXJ0aWFsID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHZhciBib3VuZEFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgdmFyIGJvdW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcG9zaXRpb24gPSAwLCBsZW5ndGggPSBib3VuZEFyZ3MubGVuZ3RoO1xuICAgICAgdmFyIGFyZ3MgPSBBcnJheShsZW5ndGgpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBhcmdzW2ldID0gYm91bmRBcmdzW2ldID09PSBfID8gYXJndW1lbnRzW3Bvc2l0aW9uKytdIDogYm91bmRBcmdzW2ldO1xuICAgICAgfVxuICAgICAgd2hpbGUgKHBvc2l0aW9uIDwgYXJndW1lbnRzLmxlbmd0aCkgYXJncy5wdXNoKGFyZ3VtZW50c1twb3NpdGlvbisrXSk7XG4gICAgICByZXR1cm4gZXhlY3V0ZUJvdW5kKGZ1bmMsIGJvdW5kLCB0aGlzLCB0aGlzLCBhcmdzKTtcbiAgICB9O1xuICAgIHJldHVybiBib3VuZDtcbiAgfTtcblxuICAvLyBCaW5kIGEgbnVtYmVyIG9mIGFuIG9iamVjdCdzIG1ldGhvZHMgdG8gdGhhdCBvYmplY3QuIFJlbWFpbmluZyBhcmd1bWVudHNcbiAgLy8gYXJlIHRoZSBtZXRob2QgbmFtZXMgdG8gYmUgYm91bmQuIFVzZWZ1bCBmb3IgZW5zdXJpbmcgdGhhdCBhbGwgY2FsbGJhY2tzXG4gIC8vIGRlZmluZWQgb24gYW4gb2JqZWN0IGJlbG9uZyB0byBpdC5cbiAgXy5iaW5kQWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGksIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGgsIGtleTtcbiAgICBpZiAobGVuZ3RoIDw9IDEpIHRocm93IG5ldyBFcnJvcignYmluZEFsbCBtdXN0IGJlIHBhc3NlZCBmdW5jdGlvbiBuYW1lcycpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAga2V5ID0gYXJndW1lbnRzW2ldO1xuICAgICAgb2JqW2tleV0gPSBfLmJpbmQob2JqW2tleV0sIG9iaik7XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gTWVtb2l6ZSBhbiBleHBlbnNpdmUgZnVuY3Rpb24gYnkgc3RvcmluZyBpdHMgcmVzdWx0cy5cbiAgXy5tZW1vaXplID0gZnVuY3Rpb24oZnVuYywgaGFzaGVyKSB7XG4gICAgdmFyIG1lbW9pemUgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHZhciBjYWNoZSA9IG1lbW9pemUuY2FjaGU7XG4gICAgICB2YXIgYWRkcmVzcyA9ICcnICsgKGhhc2hlciA/IGhhc2hlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpIDoga2V5KTtcbiAgICAgIGlmICghXy5oYXMoY2FjaGUsIGFkZHJlc3MpKSBjYWNoZVthZGRyZXNzXSA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBjYWNoZVthZGRyZXNzXTtcbiAgICB9O1xuICAgIG1lbW9pemUuY2FjaGUgPSB7fTtcbiAgICByZXR1cm4gbWVtb2l6ZTtcbiAgfTtcblxuICAvLyBEZWxheXMgYSBmdW5jdGlvbiBmb3IgdGhlIGdpdmVuIG51bWJlciBvZiBtaWxsaXNlY29uZHMsIGFuZCB0aGVuIGNhbGxzXG4gIC8vIGl0IHdpdGggdGhlIGFyZ3VtZW50cyBzdXBwbGllZC5cbiAgXy5kZWxheSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfSwgd2FpdCk7XG4gIH07XG5cbiAgLy8gRGVmZXJzIGEgZnVuY3Rpb24sIHNjaGVkdWxpbmcgaXQgdG8gcnVuIGFmdGVyIHRoZSBjdXJyZW50IGNhbGwgc3RhY2sgaGFzXG4gIC8vIGNsZWFyZWQuXG4gIF8uZGVmZXIgPSBfLnBhcnRpYWwoXy5kZWxheSwgXywgMSk7XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCB3aGVuIGludm9rZWQsIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgYXQgbW9zdCBvbmNlXG4gIC8vIGR1cmluZyBhIGdpdmVuIHdpbmRvdyBvZiB0aW1lLiBOb3JtYWxseSwgdGhlIHRocm90dGxlZCBmdW5jdGlvbiB3aWxsIHJ1blxuICAvLyBhcyBtdWNoIGFzIGl0IGNhbiwgd2l0aG91dCBldmVyIGdvaW5nIG1vcmUgdGhhbiBvbmNlIHBlciBgd2FpdGAgZHVyYXRpb247XG4gIC8vIGJ1dCBpZiB5b3UnZCBsaWtlIHRvIGRpc2FibGUgdGhlIGV4ZWN1dGlvbiBvbiB0aGUgbGVhZGluZyBlZGdlLCBwYXNzXG4gIC8vIGB7bGVhZGluZzogZmFsc2V9YC4gVG8gZGlzYWJsZSBleGVjdXRpb24gb24gdGhlIHRyYWlsaW5nIGVkZ2UsIGRpdHRvLlxuICBfLnRocm90dGxlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICAgIHZhciBjb250ZXh0LCBhcmdzLCByZXN1bHQ7XG4gICAgdmFyIHRpbWVvdXQgPSBudWxsO1xuICAgIHZhciBwcmV2aW91cyA9IDA7XG4gICAgaWYgKCFvcHRpb25zKSBvcHRpb25zID0ge307XG4gICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICBwcmV2aW91cyA9IG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UgPyAwIDogXy5ub3coKTtcbiAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIGlmICghdGltZW91dCkgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5vdyA9IF8ubm93KCk7XG4gICAgICBpZiAoIXByZXZpb3VzICYmIG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UpIHByZXZpb3VzID0gbm93O1xuICAgICAgdmFyIHJlbWFpbmluZyA9IHdhaXQgLSAobm93IC0gcHJldmlvdXMpO1xuICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgaWYgKHJlbWFpbmluZyA8PSAwIHx8IHJlbWFpbmluZyA+IHdhaXQpIHtcbiAgICAgICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcHJldmlvdXMgPSBub3c7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgIGlmICghdGltZW91dCkgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgICAgfSBlbHNlIGlmICghdGltZW91dCAmJiBvcHRpb25zLnRyYWlsaW5nICE9PSBmYWxzZSkge1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgcmVtYWluaW5nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24sIHRoYXQsIGFzIGxvbmcgYXMgaXQgY29udGludWVzIHRvIGJlIGludm9rZWQsIHdpbGwgbm90XG4gIC8vIGJlIHRyaWdnZXJlZC4gVGhlIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGFmdGVyIGl0IHN0b3BzIGJlaW5nIGNhbGxlZCBmb3JcbiAgLy8gTiBtaWxsaXNlY29uZHMuIElmIGBpbW1lZGlhdGVgIGlzIHBhc3NlZCwgdHJpZ2dlciB0aGUgZnVuY3Rpb24gb24gdGhlXG4gIC8vIGxlYWRpbmcgZWRnZSwgaW5zdGVhZCBvZiB0aGUgdHJhaWxpbmcuXG4gIF8uZGVib3VuY2UgPSBmdW5jdGlvbihmdW5jLCB3YWl0LCBpbW1lZGlhdGUpIHtcbiAgICB2YXIgdGltZW91dCwgYXJncywgY29udGV4dCwgdGltZXN0YW1wLCByZXN1bHQ7XG5cbiAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBsYXN0ID0gXy5ub3coKSAtIHRpbWVzdGFtcDtcblxuICAgICAgaWYgKGxhc3QgPCB3YWl0ICYmIGxhc3QgPj0gMCkge1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCAtIGxhc3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgIGlmICghaW1tZWRpYXRlKSB7XG4gICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB0aW1lc3RhbXAgPSBfLm5vdygpO1xuICAgICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgICBpZiAoIXRpbWVvdXQpIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcbiAgICAgIGlmIChjYWxsTm93KSB7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgdGhlIGZpcnN0IGZ1bmN0aW9uIHBhc3NlZCBhcyBhbiBhcmd1bWVudCB0byB0aGUgc2Vjb25kLFxuICAvLyBhbGxvd2luZyB5b3UgdG8gYWRqdXN0IGFyZ3VtZW50cywgcnVuIGNvZGUgYmVmb3JlIGFuZCBhZnRlciwgYW5kXG4gIC8vIGNvbmRpdGlvbmFsbHkgZXhlY3V0ZSB0aGUgb3JpZ2luYWwgZnVuY3Rpb24uXG4gIF8ud3JhcCA9IGZ1bmN0aW9uKGZ1bmMsIHdyYXBwZXIpIHtcbiAgICByZXR1cm4gXy5wYXJ0aWFsKHdyYXBwZXIsIGZ1bmMpO1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBuZWdhdGVkIHZlcnNpb24gb2YgdGhlIHBhc3NlZC1pbiBwcmVkaWNhdGUuXG4gIF8ubmVnYXRlID0gZnVuY3Rpb24ocHJlZGljYXRlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICFwcmVkaWNhdGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGlzIHRoZSBjb21wb3NpdGlvbiBvZiBhIGxpc3Qgb2YgZnVuY3Rpb25zLCBlYWNoXG4gIC8vIGNvbnN1bWluZyB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmdW5jdGlvbiB0aGF0IGZvbGxvd3MuXG4gIF8uY29tcG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgIHZhciBzdGFydCA9IGFyZ3MubGVuZ3RoIC0gMTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaSA9IHN0YXJ0O1xuICAgICAgdmFyIHJlc3VsdCA9IGFyZ3Nbc3RhcnRdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB3aGlsZSAoaS0tKSByZXN1bHQgPSBhcmdzW2ldLmNhbGwodGhpcywgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgb24gYW5kIGFmdGVyIHRoZSBOdGggY2FsbC5cbiAgXy5hZnRlciA9IGZ1bmN0aW9uKHRpbWVzLCBmdW5jKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKC0tdGltZXMgPCAxKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgdXAgdG8gKGJ1dCBub3QgaW5jbHVkaW5nKSB0aGUgTnRoIGNhbGwuXG4gIF8uYmVmb3JlID0gZnVuY3Rpb24odGltZXMsIGZ1bmMpIHtcbiAgICB2YXIgbWVtbztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoLS10aW1lcyA+IDApIHtcbiAgICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aW1lcyA8PSAxKSBmdW5jID0gbnVsbDtcbiAgICAgIHJldHVybiBtZW1vO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCBhdCBtb3N0IG9uZSB0aW1lLCBubyBtYXR0ZXIgaG93XG4gIC8vIG9mdGVuIHlvdSBjYWxsIGl0LiBVc2VmdWwgZm9yIGxhenkgaW5pdGlhbGl6YXRpb24uXG4gIF8ub25jZSA9IF8ucGFydGlhbChfLmJlZm9yZSwgMik7XG5cbiAgLy8gT2JqZWN0IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gS2V5cyBpbiBJRSA8IDkgdGhhdCB3b24ndCBiZSBpdGVyYXRlZCBieSBgZm9yIGtleSBpbiAuLi5gIGFuZCB0aHVzIG1pc3NlZC5cbiAgdmFyIGhhc0VudW1CdWcgPSAhe3RvU3RyaW5nOiBudWxsfS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgndG9TdHJpbmcnKTtcbiAgdmFyIG5vbkVudW1lcmFibGVQcm9wcyA9IFsndmFsdWVPZicsICdpc1Byb3RvdHlwZU9mJywgJ3RvU3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAncHJvcGVydHlJc0VudW1lcmFibGUnLCAnaGFzT3duUHJvcGVydHknLCAndG9Mb2NhbGVTdHJpbmcnXTtcblxuICBmdW5jdGlvbiBjb2xsZWN0Tm9uRW51bVByb3BzKG9iaiwga2V5cykge1xuICAgIHZhciBub25FbnVtSWR4ID0gbm9uRW51bWVyYWJsZVByb3BzLmxlbmd0aDtcbiAgICB2YXIgY29uc3RydWN0b3IgPSBvYmouY29uc3RydWN0b3I7XG4gICAgdmFyIHByb3RvID0gKF8uaXNGdW5jdGlvbihjb25zdHJ1Y3RvcikgJiYgY29uc3RydWN0b3IucHJvdG90eXBlKSB8fCBPYmpQcm90bztcblxuICAgIC8vIENvbnN0cnVjdG9yIGlzIGEgc3BlY2lhbCBjYXNlLlxuICAgIHZhciBwcm9wID0gJ2NvbnN0cnVjdG9yJztcbiAgICBpZiAoXy5oYXMob2JqLCBwcm9wKSAmJiAhXy5jb250YWlucyhrZXlzLCBwcm9wKSkga2V5cy5wdXNoKHByb3ApO1xuXG4gICAgd2hpbGUgKG5vbkVudW1JZHgtLSkge1xuICAgICAgcHJvcCA9IG5vbkVudW1lcmFibGVQcm9wc1tub25FbnVtSWR4XTtcbiAgICAgIGlmIChwcm9wIGluIG9iaiAmJiBvYmpbcHJvcF0gIT09IHByb3RvW3Byb3BdICYmICFfLmNvbnRhaW5zKGtleXMsIHByb3ApKSB7XG4gICAgICAgIGtleXMucHVzaChwcm9wKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBSZXRyaWV2ZSB0aGUgbmFtZXMgb2YgYW4gb2JqZWN0J3Mgb3duIHByb3BlcnRpZXMuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBPYmplY3Qua2V5c2BcbiAgXy5rZXlzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHJldHVybiBbXTtcbiAgICBpZiAobmF0aXZlS2V5cykgcmV0dXJuIG5hdGl2ZUtleXMob2JqKTtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICAgIC8vIEFoZW0sIElFIDwgOS5cbiAgICBpZiAoaGFzRW51bUJ1ZykgY29sbGVjdE5vbkVudW1Qcm9wcyhvYmosIGtleXMpO1xuICAgIHJldHVybiBrZXlzO1xuICB9O1xuXG4gIC8vIFJldHJpZXZlIGFsbCB0aGUgcHJvcGVydHkgbmFtZXMgb2YgYW4gb2JqZWN0LlxuICBfLmFsbEtleXMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkgcmV0dXJuIFtdO1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikga2V5cy5wdXNoKGtleSk7XG4gICAgLy8gQWhlbSwgSUUgPCA5LlxuICAgIGlmIChoYXNFbnVtQnVnKSBjb2xsZWN0Tm9uRW51bVByb3BzKG9iaiwga2V5cyk7XG4gICAgcmV0dXJuIGtleXM7XG4gIH07XG5cbiAgLy8gUmV0cmlldmUgdGhlIHZhbHVlcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICBfLnZhbHVlcyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIHZhciB2YWx1ZXMgPSBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhbHVlc1tpXSA9IG9ialtrZXlzW2ldXTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfTtcblxuICAvLyBSZXR1cm5zIHRoZSByZXN1bHRzIG9mIGFwcGx5aW5nIHRoZSBpdGVyYXRlZSB0byBlYWNoIGVsZW1lbnQgb2YgdGhlIG9iamVjdFxuICAvLyBJbiBjb250cmFzdCB0byBfLm1hcCBpdCByZXR1cm5zIGFuIG9iamVjdFxuICBfLm1hcE9iamVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRlZSA9IGNiKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICB2YXIga2V5cyA9ICBfLmtleXMob2JqKSxcbiAgICAgICAgICBsZW5ndGggPSBrZXlzLmxlbmd0aCxcbiAgICAgICAgICByZXN1bHRzID0ge30sXG4gICAgICAgICAgY3VycmVudEtleTtcbiAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgY3VycmVudEtleSA9IGtleXNbaW5kZXhdO1xuICAgICAgICByZXN1bHRzW2N1cnJlbnRLZXldID0gaXRlcmF0ZWUob2JqW2N1cnJlbnRLZXldLCBjdXJyZW50S2V5LCBvYmopO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gQ29udmVydCBhbiBvYmplY3QgaW50byBhIGxpc3Qgb2YgYFtrZXksIHZhbHVlXWAgcGFpcnMuXG4gIF8ucGFpcnMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIHZhciBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICB2YXIgcGFpcnMgPSBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHBhaXJzW2ldID0gW2tleXNbaV0sIG9ialtrZXlzW2ldXV07XG4gICAgfVxuICAgIHJldHVybiBwYWlycztcbiAgfTtcblxuICAvLyBJbnZlcnQgdGhlIGtleXMgYW5kIHZhbHVlcyBvZiBhbiBvYmplY3QuIFRoZSB2YWx1ZXMgbXVzdCBiZSBzZXJpYWxpemFibGUuXG4gIF8uaW52ZXJ0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdFtvYmpba2V5c1tpXV1dID0ga2V5c1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBzb3J0ZWQgbGlzdCBvZiB0aGUgZnVuY3Rpb24gbmFtZXMgYXZhaWxhYmxlIG9uIHRoZSBvYmplY3QuXG4gIC8vIEFsaWFzZWQgYXMgYG1ldGhvZHNgXG4gIF8uZnVuY3Rpb25zID0gXy5tZXRob2RzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIG5hbWVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbihvYmpba2V5XSkpIG5hbWVzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIG5hbWVzLnNvcnQoKTtcbiAgfTtcblxuICAvLyBFeHRlbmQgYSBnaXZlbiBvYmplY3Qgd2l0aCBhbGwgdGhlIHByb3BlcnRpZXMgaW4gcGFzc2VkLWluIG9iamVjdChzKS5cbiAgXy5leHRlbmQgPSBjcmVhdGVBc3NpZ25lcihfLmFsbEtleXMpO1xuXG4gIC8vIEFzc2lnbnMgYSBnaXZlbiBvYmplY3Qgd2l0aCBhbGwgdGhlIG93biBwcm9wZXJ0aWVzIGluIHRoZSBwYXNzZWQtaW4gb2JqZWN0KHMpXG4gIC8vIChodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9PYmplY3QvYXNzaWduKVxuICBfLmV4dGVuZE93biA9IF8uYXNzaWduID0gY3JlYXRlQXNzaWduZXIoXy5rZXlzKTtcblxuICAvLyBSZXR1cm5zIHRoZSBmaXJzdCBrZXkgb24gYW4gb2JqZWN0IHRoYXQgcGFzc2VzIGEgcHJlZGljYXRlIHRlc3RcbiAgXy5maW5kS2V5ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICBwcmVkaWNhdGUgPSBjYihwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaiksIGtleTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAga2V5ID0ga2V5c1tpXTtcbiAgICAgIGlmIChwcmVkaWNhdGUob2JqW2tleV0sIGtleSwgb2JqKSkgcmV0dXJuIGtleTtcbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IG9ubHkgY29udGFpbmluZyB0aGUgd2hpdGVsaXN0ZWQgcHJvcGVydGllcy5cbiAgXy5waWNrID0gZnVuY3Rpb24ob2JqZWN0LCBvaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0ID0ge30sIG9iaiA9IG9iamVjdCwgaXRlcmF0ZWUsIGtleXM7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChfLmlzRnVuY3Rpb24ob2l0ZXJhdGVlKSkge1xuICAgICAga2V5cyA9IF8uYWxsS2V5cyhvYmopO1xuICAgICAgaXRlcmF0ZWUgPSBvcHRpbWl6ZUNiKG9pdGVyYXRlZSwgY29udGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGtleXMgPSBmbGF0dGVuKGFyZ3VtZW50cywgZmFsc2UsIGZhbHNlLCAxKTtcbiAgICAgIGl0ZXJhdGVlID0gZnVuY3Rpb24odmFsdWUsIGtleSwgb2JqKSB7IHJldHVybiBrZXkgaW4gb2JqOyB9O1xuICAgICAgb2JqID0gT2JqZWN0KG9iaik7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgIHZhciB2YWx1ZSA9IG9ialtrZXldO1xuICAgICAgaWYgKGl0ZXJhdGVlKHZhbHVlLCBrZXksIG9iaikpIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCB3aXRob3V0IHRoZSBibGFja2xpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLm9taXQgPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgaWYgKF8uaXNGdW5jdGlvbihpdGVyYXRlZSkpIHtcbiAgICAgIGl0ZXJhdGVlID0gXy5uZWdhdGUoaXRlcmF0ZWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIga2V5cyA9IF8ubWFwKGZsYXR0ZW4oYXJndW1lbnRzLCBmYWxzZSwgZmFsc2UsIDEpLCBTdHJpbmcpO1xuICAgICAgaXRlcmF0ZWUgPSBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgIHJldHVybiAhXy5jb250YWlucyhrZXlzLCBrZXkpO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIF8ucGljayhvYmosIGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBGaWxsIGluIGEgZ2l2ZW4gb2JqZWN0IHdpdGggZGVmYXVsdCBwcm9wZXJ0aWVzLlxuICBfLmRlZmF1bHRzID0gY3JlYXRlQXNzaWduZXIoXy5hbGxLZXlzLCB0cnVlKTtcblxuICAvLyBDcmVhdGVzIGFuIG9iamVjdCB0aGF0IGluaGVyaXRzIGZyb20gdGhlIGdpdmVuIHByb3RvdHlwZSBvYmplY3QuXG4gIC8vIElmIGFkZGl0aW9uYWwgcHJvcGVydGllcyBhcmUgcHJvdmlkZWQgdGhlbiB0aGV5IHdpbGwgYmUgYWRkZWQgdG8gdGhlXG4gIC8vIGNyZWF0ZWQgb2JqZWN0LlxuICBfLmNyZWF0ZSA9IGZ1bmN0aW9uKHByb3RvdHlwZSwgcHJvcHMpIHtcbiAgICB2YXIgcmVzdWx0ID0gYmFzZUNyZWF0ZShwcm90b3R5cGUpO1xuICAgIGlmIChwcm9wcykgXy5leHRlbmRPd24ocmVzdWx0LCBwcm9wcyk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBDcmVhdGUgYSAoc2hhbGxvdy1jbG9uZWQpIGR1cGxpY2F0ZSBvZiBhbiBvYmplY3QuXG4gIF8uY2xvbmUgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkgcmV0dXJuIG9iajtcbiAgICByZXR1cm4gXy5pc0FycmF5KG9iaikgPyBvYmouc2xpY2UoKSA6IF8uZXh0ZW5kKHt9LCBvYmopO1xuICB9O1xuXG4gIC8vIEludm9rZXMgaW50ZXJjZXB0b3Igd2l0aCB0aGUgb2JqLCBhbmQgdGhlbiByZXR1cm5zIG9iai5cbiAgLy8gVGhlIHByaW1hcnkgcHVycG9zZSBvZiB0aGlzIG1ldGhvZCBpcyB0byBcInRhcCBpbnRvXCIgYSBtZXRob2QgY2hhaW4sIGluXG4gIC8vIG9yZGVyIHRvIHBlcmZvcm0gb3BlcmF0aW9ucyBvbiBpbnRlcm1lZGlhdGUgcmVzdWx0cyB3aXRoaW4gdGhlIGNoYWluLlxuICBfLnRhcCA9IGZ1bmN0aW9uKG9iaiwgaW50ZXJjZXB0b3IpIHtcbiAgICBpbnRlcmNlcHRvcihvYmopO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gUmV0dXJucyB3aGV0aGVyIGFuIG9iamVjdCBoYXMgYSBnaXZlbiBzZXQgb2YgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8uaXNNYXRjaCA9IGZ1bmN0aW9uKG9iamVjdCwgYXR0cnMpIHtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhhdHRycyksIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIGlmIChvYmplY3QgPT0gbnVsbCkgcmV0dXJuICFsZW5ndGg7XG4gICAgdmFyIG9iaiA9IE9iamVjdChvYmplY3QpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgaWYgKGF0dHJzW2tleV0gIT09IG9ialtrZXldIHx8ICEoa2V5IGluIG9iaikpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cblxuICAvLyBJbnRlcm5hbCByZWN1cnNpdmUgY29tcGFyaXNvbiBmdW5jdGlvbiBmb3IgYGlzRXF1YWxgLlxuICB2YXIgZXEgPSBmdW5jdGlvbihhLCBiLCBhU3RhY2ssIGJTdGFjaykge1xuICAgIC8vIElkZW50aWNhbCBvYmplY3RzIGFyZSBlcXVhbC4gYDAgPT09IC0wYCwgYnV0IHRoZXkgYXJlbid0IGlkZW50aWNhbC5cbiAgICAvLyBTZWUgdGhlIFtIYXJtb255IGBlZ2FsYCBwcm9wb3NhbF0oaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9aGFybW9ueTplZ2FsKS5cbiAgICBpZiAoYSA9PT0gYikgcmV0dXJuIGEgIT09IDAgfHwgMSAvIGEgPT09IDEgLyBiO1xuICAgIC8vIEEgc3RyaWN0IGNvbXBhcmlzb24gaXMgbmVjZXNzYXJ5IGJlY2F1c2UgYG51bGwgPT0gdW5kZWZpbmVkYC5cbiAgICBpZiAoYSA9PSBudWxsIHx8IGIgPT0gbnVsbCkgcmV0dXJuIGEgPT09IGI7XG4gICAgLy8gVW53cmFwIGFueSB3cmFwcGVkIG9iamVjdHMuXG4gICAgaWYgKGEgaW5zdGFuY2VvZiBfKSBhID0gYS5fd3JhcHBlZDtcbiAgICBpZiAoYiBpbnN0YW5jZW9mIF8pIGIgPSBiLl93cmFwcGVkO1xuICAgIC8vIENvbXBhcmUgYFtbQ2xhc3NdXWAgbmFtZXMuXG4gICAgdmFyIGNsYXNzTmFtZSA9IHRvU3RyaW5nLmNhbGwoYSk7XG4gICAgaWYgKGNsYXNzTmFtZSAhPT0gdG9TdHJpbmcuY2FsbChiKSkgcmV0dXJuIGZhbHNlO1xuICAgIHN3aXRjaCAoY2xhc3NOYW1lKSB7XG4gICAgICAvLyBTdHJpbmdzLCBudW1iZXJzLCByZWd1bGFyIGV4cHJlc3Npb25zLCBkYXRlcywgYW5kIGJvb2xlYW5zIGFyZSBjb21wYXJlZCBieSB2YWx1ZS5cbiAgICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6XG4gICAgICAvLyBSZWdFeHBzIGFyZSBjb2VyY2VkIHRvIHN0cmluZ3MgZm9yIGNvbXBhcmlzb24gKE5vdGU6ICcnICsgL2EvaSA9PT0gJy9hL2knKVxuICAgICAgY2FzZSAnW29iamVjdCBTdHJpbmddJzpcbiAgICAgICAgLy8gUHJpbWl0aXZlcyBhbmQgdGhlaXIgY29ycmVzcG9uZGluZyBvYmplY3Qgd3JhcHBlcnMgYXJlIGVxdWl2YWxlbnQ7IHRodXMsIGBcIjVcImAgaXNcbiAgICAgICAgLy8gZXF1aXZhbGVudCB0byBgbmV3IFN0cmluZyhcIjVcIilgLlxuICAgICAgICByZXR1cm4gJycgKyBhID09PSAnJyArIGI7XG4gICAgICBjYXNlICdbb2JqZWN0IE51bWJlcl0nOlxuICAgICAgICAvLyBgTmFOYHMgYXJlIGVxdWl2YWxlbnQsIGJ1dCBub24tcmVmbGV4aXZlLlxuICAgICAgICAvLyBPYmplY3QoTmFOKSBpcyBlcXVpdmFsZW50IHRvIE5hTlxuICAgICAgICBpZiAoK2EgIT09ICthKSByZXR1cm4gK2IgIT09ICtiO1xuICAgICAgICAvLyBBbiBgZWdhbGAgY29tcGFyaXNvbiBpcyBwZXJmb3JtZWQgZm9yIG90aGVyIG51bWVyaWMgdmFsdWVzLlxuICAgICAgICByZXR1cm4gK2EgPT09IDAgPyAxIC8gK2EgPT09IDEgLyBiIDogK2EgPT09ICtiO1xuICAgICAgY2FzZSAnW29iamVjdCBEYXRlXSc6XG4gICAgICBjYXNlICdbb2JqZWN0IEJvb2xlYW5dJzpcbiAgICAgICAgLy8gQ29lcmNlIGRhdGVzIGFuZCBib29sZWFucyB0byBudW1lcmljIHByaW1pdGl2ZSB2YWx1ZXMuIERhdGVzIGFyZSBjb21wYXJlZCBieSB0aGVpclxuICAgICAgICAvLyBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnMuIE5vdGUgdGhhdCBpbnZhbGlkIGRhdGVzIHdpdGggbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zXG4gICAgICAgIC8vIG9mIGBOYU5gIGFyZSBub3QgZXF1aXZhbGVudC5cbiAgICAgICAgcmV0dXJuICthID09PSArYjtcbiAgICB9XG5cbiAgICB2YXIgYXJlQXJyYXlzID0gY2xhc3NOYW1lID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgIGlmICghYXJlQXJyYXlzKSB7XG4gICAgICBpZiAodHlwZW9mIGEgIT0gJ29iamVjdCcgfHwgdHlwZW9mIGIgIT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcblxuICAgICAgLy8gT2JqZWN0cyB3aXRoIGRpZmZlcmVudCBjb25zdHJ1Y3RvcnMgYXJlIG5vdCBlcXVpdmFsZW50LCBidXQgYE9iamVjdGBzIG9yIGBBcnJheWBzXG4gICAgICAvLyBmcm9tIGRpZmZlcmVudCBmcmFtZXMgYXJlLlxuICAgICAgdmFyIGFDdG9yID0gYS5jb25zdHJ1Y3RvciwgYkN0b3IgPSBiLmNvbnN0cnVjdG9yO1xuICAgICAgaWYgKGFDdG9yICE9PSBiQ3RvciAmJiAhKF8uaXNGdW5jdGlvbihhQ3RvcikgJiYgYUN0b3IgaW5zdGFuY2VvZiBhQ3RvciAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uaXNGdW5jdGlvbihiQ3RvcikgJiYgYkN0b3IgaW5zdGFuY2VvZiBiQ3RvcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgKCdjb25zdHJ1Y3RvcicgaW4gYSAmJiAnY29uc3RydWN0b3InIGluIGIpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gQXNzdW1lIGVxdWFsaXR5IGZvciBjeWNsaWMgc3RydWN0dXJlcy4gVGhlIGFsZ29yaXRobSBmb3IgZGV0ZWN0aW5nIGN5Y2xpY1xuICAgIC8vIHN0cnVjdHVyZXMgaXMgYWRhcHRlZCBmcm9tIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMsIGFic3RyYWN0IG9wZXJhdGlvbiBgSk9gLlxuXG4gICAgLy8gSW5pdGlhbGl6aW5nIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIC8vIEl0J3MgZG9uZSBoZXJlIHNpbmNlIHdlIG9ubHkgbmVlZCB0aGVtIGZvciBvYmplY3RzIGFuZCBhcnJheXMgY29tcGFyaXNvbi5cbiAgICBhU3RhY2sgPSBhU3RhY2sgfHwgW107XG4gICAgYlN0YWNrID0gYlN0YWNrIHx8IFtdO1xuICAgIHZhciBsZW5ndGggPSBhU3RhY2subGVuZ3RoO1xuICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgLy8gTGluZWFyIHNlYXJjaC4gUGVyZm9ybWFuY2UgaXMgaW52ZXJzZWx5IHByb3BvcnRpb25hbCB0byB0aGUgbnVtYmVyIG9mXG4gICAgICAvLyB1bmlxdWUgbmVzdGVkIHN0cnVjdHVyZXMuXG4gICAgICBpZiAoYVN0YWNrW2xlbmd0aF0gPT09IGEpIHJldHVybiBiU3RhY2tbbGVuZ3RoXSA9PT0gYjtcbiAgICB9XG5cbiAgICAvLyBBZGQgdGhlIGZpcnN0IG9iamVjdCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnB1c2goYSk7XG4gICAgYlN0YWNrLnB1c2goYik7XG5cbiAgICAvLyBSZWN1cnNpdmVseSBjb21wYXJlIG9iamVjdHMgYW5kIGFycmF5cy5cbiAgICBpZiAoYXJlQXJyYXlzKSB7XG4gICAgICAvLyBDb21wYXJlIGFycmF5IGxlbmd0aHMgdG8gZGV0ZXJtaW5lIGlmIGEgZGVlcCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeS5cbiAgICAgIGxlbmd0aCA9IGEubGVuZ3RoO1xuICAgICAgaWYgKGxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICAgIC8vIERlZXAgY29tcGFyZSB0aGUgY29udGVudHMsIGlnbm9yaW5nIG5vbi1udW1lcmljIHByb3BlcnRpZXMuXG4gICAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgICAgaWYgKCFlcShhW2xlbmd0aF0sIGJbbGVuZ3RoXSwgYVN0YWNrLCBiU3RhY2spKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIERlZXAgY29tcGFyZSBvYmplY3RzLlxuICAgICAgdmFyIGtleXMgPSBfLmtleXMoYSksIGtleTtcbiAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgICAgLy8gRW5zdXJlIHRoYXQgYm90aCBvYmplY3RzIGNvbnRhaW4gdGhlIHNhbWUgbnVtYmVyIG9mIHByb3BlcnRpZXMgYmVmb3JlIGNvbXBhcmluZyBkZWVwIGVxdWFsaXR5LlxuICAgICAgaWYgKF8ua2V5cyhiKS5sZW5ndGggIT09IGxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICAgICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAgIC8vIERlZXAgY29tcGFyZSBlYWNoIG1lbWJlclxuICAgICAgICBrZXkgPSBrZXlzW2xlbmd0aF07XG4gICAgICAgIGlmICghKF8uaGFzKGIsIGtleSkgJiYgZXEoYVtrZXldLCBiW2tleV0sIGFTdGFjaywgYlN0YWNrKSkpIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUmVtb3ZlIHRoZSBmaXJzdCBvYmplY3QgZnJvbSB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnBvcCgpO1xuICAgIGJTdGFjay5wb3AoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBQZXJmb3JtIGEgZGVlcCBjb21wYXJpc29uIHRvIGNoZWNrIGlmIHR3byBvYmplY3RzIGFyZSBlcXVhbC5cbiAgXy5pc0VxdWFsID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBlcShhLCBiKTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIGFycmF5LCBzdHJpbmcsIG9yIG9iamVjdCBlbXB0eT9cbiAgLy8gQW4gXCJlbXB0eVwiIG9iamVjdCBoYXMgbm8gZW51bWVyYWJsZSBvd24tcHJvcGVydGllcy5cbiAgXy5pc0VtcHR5ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoaXNBcnJheUxpa2Uob2JqKSAmJiAoXy5pc0FycmF5KG9iaikgfHwgXy5pc1N0cmluZyhvYmopIHx8IF8uaXNBcmd1bWVudHMob2JqKSkpIHJldHVybiBvYmoubGVuZ3RoID09PSAwO1xuICAgIHJldHVybiBfLmtleXMob2JqKS5sZW5ndGggPT09IDA7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIERPTSBlbGVtZW50P1xuICBfLmlzRWxlbWVudCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiAhIShvYmogJiYgb2JqLm5vZGVUeXBlID09PSAxKTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGFuIGFycmF5P1xuICAvLyBEZWxlZ2F0ZXMgdG8gRUNNQTUncyBuYXRpdmUgQXJyYXkuaXNBcnJheVxuICBfLmlzQXJyYXkgPSBuYXRpdmVJc0FycmF5IHx8IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSBhbiBvYmplY3Q/XG4gIF8uaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiBvYmo7XG4gICAgcmV0dXJuIHR5cGUgPT09ICdmdW5jdGlvbicgfHwgdHlwZSA9PT0gJ29iamVjdCcgJiYgISFvYmo7XG4gIH07XG5cbiAgLy8gQWRkIHNvbWUgaXNUeXBlIG1ldGhvZHM6IGlzQXJndW1lbnRzLCBpc0Z1bmN0aW9uLCBpc1N0cmluZywgaXNOdW1iZXIsIGlzRGF0ZSwgaXNSZWdFeHAsIGlzRXJyb3IuXG4gIF8uZWFjaChbJ0FyZ3VtZW50cycsICdGdW5jdGlvbicsICdTdHJpbmcnLCAnTnVtYmVyJywgJ0RhdGUnLCAnUmVnRXhwJywgJ0Vycm9yJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBfWydpcycgKyBuYW1lXSA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgJyArIG5hbWUgKyAnXSc7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gRGVmaW5lIGEgZmFsbGJhY2sgdmVyc2lvbiBvZiB0aGUgbWV0aG9kIGluIGJyb3dzZXJzIChhaGVtLCBJRSA8IDkpLCB3aGVyZVxuICAvLyB0aGVyZSBpc24ndCBhbnkgaW5zcGVjdGFibGUgXCJBcmd1bWVudHNcIiB0eXBlLlxuICBpZiAoIV8uaXNBcmd1bWVudHMoYXJndW1lbnRzKSkge1xuICAgIF8uaXNBcmd1bWVudHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBfLmhhcyhvYmosICdjYWxsZWUnKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gT3B0aW1pemUgYGlzRnVuY3Rpb25gIGlmIGFwcHJvcHJpYXRlLiBXb3JrIGFyb3VuZCBzb21lIHR5cGVvZiBidWdzIGluIG9sZCB2OCxcbiAgLy8gSUUgMTEgKCMxNjIxKSwgYW5kIGluIFNhZmFyaSA4ICgjMTkyOSkuXG4gIGlmICh0eXBlb2YgLy4vICE9ICdmdW5jdGlvbicgJiYgdHlwZW9mIEludDhBcnJheSAhPSAnb2JqZWN0Jykge1xuICAgIF8uaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT0gJ2Z1bmN0aW9uJyB8fCBmYWxzZTtcbiAgICB9O1xuICB9XG5cbiAgLy8gSXMgYSBnaXZlbiBvYmplY3QgYSBmaW5pdGUgbnVtYmVyP1xuICBfLmlzRmluaXRlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIGlzRmluaXRlKG9iaikgJiYgIWlzTmFOKHBhcnNlRmxvYXQob2JqKSk7XG4gIH07XG5cbiAgLy8gSXMgdGhlIGdpdmVuIHZhbHVlIGBOYU5gPyAoTmFOIGlzIHRoZSBvbmx5IG51bWJlciB3aGljaCBkb2VzIG5vdCBlcXVhbCBpdHNlbGYpLlxuICBfLmlzTmFOID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIF8uaXNOdW1iZXIob2JqKSAmJiBvYmogIT09ICtvYmo7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIGJvb2xlYW4/XG4gIF8uaXNCb29sZWFuID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdHJ1ZSB8fCBvYmogPT09IGZhbHNlIHx8IHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQm9vbGVhbl0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgZXF1YWwgdG8gbnVsbD9cbiAgXy5pc051bGwgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSBudWxsO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgdW5kZWZpbmVkP1xuICBfLmlzVW5kZWZpbmVkID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdm9pZCAwO1xuICB9O1xuXG4gIC8vIFNob3J0Y3V0IGZ1bmN0aW9uIGZvciBjaGVja2luZyBpZiBhbiBvYmplY3QgaGFzIGEgZ2l2ZW4gcHJvcGVydHkgZGlyZWN0bHlcbiAgLy8gb24gaXRzZWxmIChpbiBvdGhlciB3b3Jkcywgbm90IG9uIGEgcHJvdG90eXBlKS5cbiAgXy5oYXMgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgIHJldHVybiBvYmogIT0gbnVsbCAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcbiAgfTtcblxuICAvLyBVdGlsaXR5IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJ1biBVbmRlcnNjb3JlLmpzIGluICpub0NvbmZsaWN0KiBtb2RlLCByZXR1cm5pbmcgdGhlIGBfYCB2YXJpYWJsZSB0byBpdHNcbiAgLy8gcHJldmlvdXMgb3duZXIuIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLm5vQ29uZmxpY3QgPSBmdW5jdGlvbigpIHtcbiAgICByb290Ll8gPSBwcmV2aW91c1VuZGVyc2NvcmU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gS2VlcCB0aGUgaWRlbnRpdHkgZnVuY3Rpb24gYXJvdW5kIGZvciBkZWZhdWx0IGl0ZXJhdGVlcy5cbiAgXy5pZGVudGl0eSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuXG4gIC8vIFByZWRpY2F0ZS1nZW5lcmF0aW5nIGZ1bmN0aW9ucy4gT2Z0ZW4gdXNlZnVsIG91dHNpZGUgb2YgVW5kZXJzY29yZS5cbiAgXy5jb25zdGFudCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG4gIH07XG5cbiAgXy5ub29wID0gZnVuY3Rpb24oKXt9O1xuXG4gIF8ucHJvcGVydHkgPSBwcm9wZXJ0eTtcblxuICAvLyBHZW5lcmF0ZXMgYSBmdW5jdGlvbiBmb3IgYSBnaXZlbiBvYmplY3QgdGhhdCByZXR1cm5zIGEgZ2l2ZW4gcHJvcGVydHkuXG4gIF8ucHJvcGVydHlPZiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT0gbnVsbCA/IGZ1bmN0aW9uKCl7fSA6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIG9ialtrZXldO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIHByZWRpY2F0ZSBmb3IgY2hlY2tpbmcgd2hldGhlciBhbiBvYmplY3QgaGFzIGEgZ2l2ZW4gc2V0IG9mXG4gIC8vIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLm1hdGNoZXIgPSBfLm1hdGNoZXMgPSBmdW5jdGlvbihhdHRycykge1xuICAgIGF0dHJzID0gXy5leHRlbmRPd24oe30sIGF0dHJzKTtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gXy5pc01hdGNoKG9iaiwgYXR0cnMpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUnVuIGEgZnVuY3Rpb24gKipuKiogdGltZXMuXG4gIF8udGltZXMgPSBmdW5jdGlvbihuLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIHZhciBhY2N1bSA9IEFycmF5KE1hdGgubWF4KDAsIG4pKTtcbiAgICBpdGVyYXRlZSA9IG9wdGltaXplQ2IoaXRlcmF0ZWUsIGNvbnRleHQsIDEpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSBhY2N1bVtpXSA9IGl0ZXJhdGVlKGkpO1xuICAgIHJldHVybiBhY2N1bTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIG1pbiBhbmQgbWF4IChpbmNsdXNpdmUpLlxuICBfLnJhbmRvbSA9IGZ1bmN0aW9uKG1pbiwgbWF4KSB7XG4gICAgaWYgKG1heCA9PSBudWxsKSB7XG4gICAgICBtYXggPSBtaW47XG4gICAgICBtaW4gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gbWluICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKTtcbiAgfTtcblxuICAvLyBBIChwb3NzaWJseSBmYXN0ZXIpIHdheSB0byBnZXQgdGhlIGN1cnJlbnQgdGltZXN0YW1wIGFzIGFuIGludGVnZXIuXG4gIF8ubm93ID0gRGF0ZS5ub3cgfHwgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICB9O1xuXG4gICAvLyBMaXN0IG9mIEhUTUwgZW50aXRpZXMgZm9yIGVzY2FwaW5nLlxuICB2YXIgZXNjYXBlTWFwID0ge1xuICAgICcmJzogJyZhbXA7JyxcbiAgICAnPCc6ICcmbHQ7JyxcbiAgICAnPic6ICcmZ3Q7JyxcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICBcIidcIjogJyYjeDI3OycsXG4gICAgJ2AnOiAnJiN4NjA7J1xuICB9O1xuICB2YXIgdW5lc2NhcGVNYXAgPSBfLmludmVydChlc2NhcGVNYXApO1xuXG4gIC8vIEZ1bmN0aW9ucyBmb3IgZXNjYXBpbmcgYW5kIHVuZXNjYXBpbmcgc3RyaW5ncyB0by9mcm9tIEhUTUwgaW50ZXJwb2xhdGlvbi5cbiAgdmFyIGNyZWF0ZUVzY2FwZXIgPSBmdW5jdGlvbihtYXApIHtcbiAgICB2YXIgZXNjYXBlciA9IGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICByZXR1cm4gbWFwW21hdGNoXTtcbiAgICB9O1xuICAgIC8vIFJlZ2V4ZXMgZm9yIGlkZW50aWZ5aW5nIGEga2V5IHRoYXQgbmVlZHMgdG8gYmUgZXNjYXBlZFxuICAgIHZhciBzb3VyY2UgPSAnKD86JyArIF8ua2V5cyhtYXApLmpvaW4oJ3wnKSArICcpJztcbiAgICB2YXIgdGVzdFJlZ2V4cCA9IFJlZ0V4cChzb3VyY2UpO1xuICAgIHZhciByZXBsYWNlUmVnZXhwID0gUmVnRXhwKHNvdXJjZSwgJ2cnKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICBzdHJpbmcgPSBzdHJpbmcgPT0gbnVsbCA/ICcnIDogJycgKyBzdHJpbmc7XG4gICAgICByZXR1cm4gdGVzdFJlZ2V4cC50ZXN0KHN0cmluZykgPyBzdHJpbmcucmVwbGFjZShyZXBsYWNlUmVnZXhwLCBlc2NhcGVyKSA6IHN0cmluZztcbiAgICB9O1xuICB9O1xuICBfLmVzY2FwZSA9IGNyZWF0ZUVzY2FwZXIoZXNjYXBlTWFwKTtcbiAgXy51bmVzY2FwZSA9IGNyZWF0ZUVzY2FwZXIodW5lc2NhcGVNYXApO1xuXG4gIC8vIElmIHRoZSB2YWx1ZSBvZiB0aGUgbmFtZWQgYHByb3BlcnR5YCBpcyBhIGZ1bmN0aW9uIHRoZW4gaW52b2tlIGl0IHdpdGggdGhlXG4gIC8vIGBvYmplY3RgIGFzIGNvbnRleHQ7IG90aGVyd2lzZSwgcmV0dXJuIGl0LlxuICBfLnJlc3VsdCA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHksIGZhbGxiYWNrKSB7XG4gICAgdmFyIHZhbHVlID0gb2JqZWN0ID09IG51bGwgPyB2b2lkIDAgOiBvYmplY3RbcHJvcGVydHldO1xuICAgIGlmICh2YWx1ZSA9PT0gdm9pZCAwKSB7XG4gICAgICB2YWx1ZSA9IGZhbGxiYWNrO1xuICAgIH1cbiAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKHZhbHVlKSA/IHZhbHVlLmNhbGwob2JqZWN0KSA6IHZhbHVlO1xuICB9O1xuXG4gIC8vIEdlbmVyYXRlIGEgdW5pcXVlIGludGVnZXIgaWQgKHVuaXF1ZSB3aXRoaW4gdGhlIGVudGlyZSBjbGllbnQgc2Vzc2lvbikuXG4gIC8vIFVzZWZ1bCBmb3IgdGVtcG9yYXJ5IERPTSBpZHMuXG4gIHZhciBpZENvdW50ZXIgPSAwO1xuICBfLnVuaXF1ZUlkID0gZnVuY3Rpb24ocHJlZml4KSB7XG4gICAgdmFyIGlkID0gKytpZENvdW50ZXIgKyAnJztcbiAgICByZXR1cm4gcHJlZml4ID8gcHJlZml4ICsgaWQgOiBpZDtcbiAgfTtcblxuICAvLyBCeSBkZWZhdWx0LCBVbmRlcnNjb3JlIHVzZXMgRVJCLXN0eWxlIHRlbXBsYXRlIGRlbGltaXRlcnMsIGNoYW5nZSB0aGVcbiAgLy8gZm9sbG93aW5nIHRlbXBsYXRlIHNldHRpbmdzIHRvIHVzZSBhbHRlcm5hdGl2ZSBkZWxpbWl0ZXJzLlxuICBfLnRlbXBsYXRlU2V0dGluZ3MgPSB7XG4gICAgZXZhbHVhdGUgICAgOiAvPCUoW1xcc1xcU10rPyklPi9nLFxuICAgIGludGVycG9sYXRlIDogLzwlPShbXFxzXFxTXSs/KSU+L2csXG4gICAgZXNjYXBlICAgICAgOiAvPCUtKFtcXHNcXFNdKz8pJT4vZ1xuICB9O1xuXG4gIC8vIFdoZW4gY3VzdG9taXppbmcgYHRlbXBsYXRlU2V0dGluZ3NgLCBpZiB5b3UgZG9uJ3Qgd2FudCB0byBkZWZpbmUgYW5cbiAgLy8gaW50ZXJwb2xhdGlvbiwgZXZhbHVhdGlvbiBvciBlc2NhcGluZyByZWdleCwgd2UgbmVlZCBvbmUgdGhhdCBpc1xuICAvLyBndWFyYW50ZWVkIG5vdCB0byBtYXRjaC5cbiAgdmFyIG5vTWF0Y2ggPSAvKC4pXi87XG5cbiAgLy8gQ2VydGFpbiBjaGFyYWN0ZXJzIG5lZWQgdG8gYmUgZXNjYXBlZCBzbyB0aGF0IHRoZXkgY2FuIGJlIHB1dCBpbnRvIGFcbiAgLy8gc3RyaW5nIGxpdGVyYWwuXG4gIHZhciBlc2NhcGVzID0ge1xuICAgIFwiJ1wiOiAgICAgIFwiJ1wiLFxuICAgICdcXFxcJzogICAgICdcXFxcJyxcbiAgICAnXFxyJzogICAgICdyJyxcbiAgICAnXFxuJzogICAgICduJyxcbiAgICAnXFx1MjAyOCc6ICd1MjAyOCcsXG4gICAgJ1xcdTIwMjknOiAndTIwMjknXG4gIH07XG5cbiAgdmFyIGVzY2FwZXIgPSAvXFxcXHwnfFxccnxcXG58XFx1MjAyOHxcXHUyMDI5L2c7XG5cbiAgdmFyIGVzY2FwZUNoYXIgPSBmdW5jdGlvbihtYXRjaCkge1xuICAgIHJldHVybiAnXFxcXCcgKyBlc2NhcGVzW21hdGNoXTtcbiAgfTtcblxuICAvLyBKYXZhU2NyaXB0IG1pY3JvLXRlbXBsYXRpbmcsIHNpbWlsYXIgdG8gSm9obiBSZXNpZydzIGltcGxlbWVudGF0aW9uLlxuICAvLyBVbmRlcnNjb3JlIHRlbXBsYXRpbmcgaGFuZGxlcyBhcmJpdHJhcnkgZGVsaW1pdGVycywgcHJlc2VydmVzIHdoaXRlc3BhY2UsXG4gIC8vIGFuZCBjb3JyZWN0bHkgZXNjYXBlcyBxdW90ZXMgd2l0aGluIGludGVycG9sYXRlZCBjb2RlLlxuICAvLyBOQjogYG9sZFNldHRpbmdzYCBvbmx5IGV4aXN0cyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG4gIF8udGVtcGxhdGUgPSBmdW5jdGlvbih0ZXh0LCBzZXR0aW5ncywgb2xkU2V0dGluZ3MpIHtcbiAgICBpZiAoIXNldHRpbmdzICYmIG9sZFNldHRpbmdzKSBzZXR0aW5ncyA9IG9sZFNldHRpbmdzO1xuICAgIHNldHRpbmdzID0gXy5kZWZhdWx0cyh7fSwgc2V0dGluZ3MsIF8udGVtcGxhdGVTZXR0aW5ncyk7XG5cbiAgICAvLyBDb21iaW5lIGRlbGltaXRlcnMgaW50byBvbmUgcmVndWxhciBleHByZXNzaW9uIHZpYSBhbHRlcm5hdGlvbi5cbiAgICB2YXIgbWF0Y2hlciA9IFJlZ0V4cChbXG4gICAgICAoc2V0dGluZ3MuZXNjYXBlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcbiAgICAgIChzZXR0aW5ncy5pbnRlcnBvbGF0ZSB8fCBub01hdGNoKS5zb3VyY2UsXG4gICAgICAoc2V0dGluZ3MuZXZhbHVhdGUgfHwgbm9NYXRjaCkuc291cmNlXG4gICAgXS5qb2luKCd8JykgKyAnfCQnLCAnZycpO1xuXG4gICAgLy8gQ29tcGlsZSB0aGUgdGVtcGxhdGUgc291cmNlLCBlc2NhcGluZyBzdHJpbmcgbGl0ZXJhbHMgYXBwcm9wcmlhdGVseS5cbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHZhciBzb3VyY2UgPSBcIl9fcCs9J1wiO1xuICAgIHRleHQucmVwbGFjZShtYXRjaGVyLCBmdW5jdGlvbihtYXRjaCwgZXNjYXBlLCBpbnRlcnBvbGF0ZSwgZXZhbHVhdGUsIG9mZnNldCkge1xuICAgICAgc291cmNlICs9IHRleHQuc2xpY2UoaW5kZXgsIG9mZnNldCkucmVwbGFjZShlc2NhcGVyLCBlc2NhcGVDaGFyKTtcbiAgICAgIGluZGV4ID0gb2Zmc2V0ICsgbWF0Y2gubGVuZ3RoO1xuXG4gICAgICBpZiAoZXNjYXBlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgZXNjYXBlICsgXCIpKT09bnVsbD8nJzpfLmVzY2FwZShfX3QpKStcXG4nXCI7XG4gICAgICB9IGVsc2UgaWYgKGludGVycG9sYXRlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgaW50ZXJwb2xhdGUgKyBcIikpPT1udWxsPycnOl9fdCkrXFxuJ1wiO1xuICAgICAgfSBlbHNlIGlmIChldmFsdWF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInO1xcblwiICsgZXZhbHVhdGUgKyBcIlxcbl9fcCs9J1wiO1xuICAgICAgfVxuXG4gICAgICAvLyBBZG9iZSBWTXMgbmVlZCB0aGUgbWF0Y2ggcmV0dXJuZWQgdG8gcHJvZHVjZSB0aGUgY29ycmVjdCBvZmZlc3QuXG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG4gICAgc291cmNlICs9IFwiJztcXG5cIjtcblxuICAgIC8vIElmIGEgdmFyaWFibGUgaXMgbm90IHNwZWNpZmllZCwgcGxhY2UgZGF0YSB2YWx1ZXMgaW4gbG9jYWwgc2NvcGUuXG4gICAgaWYgKCFzZXR0aW5ncy52YXJpYWJsZSkgc291cmNlID0gJ3dpdGgob2JqfHx7fSl7XFxuJyArIHNvdXJjZSArICd9XFxuJztcblxuICAgIHNvdXJjZSA9IFwidmFyIF9fdCxfX3A9JycsX19qPUFycmF5LnByb3RvdHlwZS5qb2luLFwiICtcbiAgICAgIFwicHJpbnQ9ZnVuY3Rpb24oKXtfX3ArPV9fai5jYWxsKGFyZ3VtZW50cywnJyk7fTtcXG5cIiArXG4gICAgICBzb3VyY2UgKyAncmV0dXJuIF9fcDtcXG4nO1xuXG4gICAgdHJ5IHtcbiAgICAgIHZhciByZW5kZXIgPSBuZXcgRnVuY3Rpb24oc2V0dGluZ3MudmFyaWFibGUgfHwgJ29iaicsICdfJywgc291cmNlKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuXG4gICAgdmFyIHRlbXBsYXRlID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuIHJlbmRlci5jYWxsKHRoaXMsIGRhdGEsIF8pO1xuICAgIH07XG5cbiAgICAvLyBQcm92aWRlIHRoZSBjb21waWxlZCBzb3VyY2UgYXMgYSBjb252ZW5pZW5jZSBmb3IgcHJlY29tcGlsYXRpb24uXG4gICAgdmFyIGFyZ3VtZW50ID0gc2V0dGluZ3MudmFyaWFibGUgfHwgJ29iaic7XG4gICAgdGVtcGxhdGUuc291cmNlID0gJ2Z1bmN0aW9uKCcgKyBhcmd1bWVudCArICcpe1xcbicgKyBzb3VyY2UgKyAnfSc7XG5cbiAgICByZXR1cm4gdGVtcGxhdGU7XG4gIH07XG5cbiAgLy8gQWRkIGEgXCJjaGFpblwiIGZ1bmN0aW9uLiBTdGFydCBjaGFpbmluZyBhIHdyYXBwZWQgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8uY2hhaW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgaW5zdGFuY2UgPSBfKG9iaik7XG4gICAgaW5zdGFuY2UuX2NoYWluID0gdHJ1ZTtcbiAgICByZXR1cm4gaW5zdGFuY2U7XG4gIH07XG5cbiAgLy8gT09QXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuICAvLyBJZiBVbmRlcnNjb3JlIGlzIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLCBpdCByZXR1cm5zIGEgd3JhcHBlZCBvYmplY3QgdGhhdFxuICAvLyBjYW4gYmUgdXNlZCBPTy1zdHlsZS4gVGhpcyB3cmFwcGVyIGhvbGRzIGFsdGVyZWQgdmVyc2lvbnMgb2YgYWxsIHRoZVxuICAvLyB1bmRlcnNjb3JlIGZ1bmN0aW9ucy4gV3JhcHBlZCBvYmplY3RzIG1heSBiZSBjaGFpbmVkLlxuXG4gIC8vIEhlbHBlciBmdW5jdGlvbiB0byBjb250aW51ZSBjaGFpbmluZyBpbnRlcm1lZGlhdGUgcmVzdWx0cy5cbiAgdmFyIHJlc3VsdCA9IGZ1bmN0aW9uKGluc3RhbmNlLCBvYmopIHtcbiAgICByZXR1cm4gaW5zdGFuY2UuX2NoYWluID8gXyhvYmopLmNoYWluKCkgOiBvYmo7XG4gIH07XG5cbiAgLy8gQWRkIHlvdXIgb3duIGN1c3RvbSBmdW5jdGlvbnMgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLm1peGluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgXy5lYWNoKF8uZnVuY3Rpb25zKG9iaiksIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBmdW5jID0gX1tuYW1lXSA9IG9ialtuYW1lXTtcbiAgICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gW3RoaXMuX3dyYXBwZWRdO1xuICAgICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiByZXN1bHQodGhpcywgZnVuYy5hcHBseShfLCBhcmdzKSk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIEFkZCBhbGwgb2YgdGhlIFVuZGVyc2NvcmUgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyIG9iamVjdC5cbiAgXy5taXhpbihfKTtcblxuICAvLyBBZGQgYWxsIG11dGF0b3IgQXJyYXkgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyLlxuICBfLmVhY2goWydwb3AnLCAncHVzaCcsICdyZXZlcnNlJywgJ3NoaWZ0JywgJ3NvcnQnLCAnc3BsaWNlJywgJ3Vuc2hpZnQnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBtZXRob2QgPSBBcnJheVByb3RvW25hbWVdO1xuICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb2JqID0gdGhpcy5fd3JhcHBlZDtcbiAgICAgIG1ldGhvZC5hcHBseShvYmosIGFyZ3VtZW50cyk7XG4gICAgICBpZiAoKG5hbWUgPT09ICdzaGlmdCcgfHwgbmFtZSA9PT0gJ3NwbGljZScpICYmIG9iai5sZW5ndGggPT09IDApIGRlbGV0ZSBvYmpbMF07XG4gICAgICByZXR1cm4gcmVzdWx0KHRoaXMsIG9iaik7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWRkIGFsbCBhY2Nlc3NvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIF8uZWFjaChbJ2NvbmNhdCcsICdqb2luJywgJ3NsaWNlJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHJlc3VsdCh0aGlzLCBtZXRob2QuYXBwbHkodGhpcy5fd3JhcHBlZCwgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gRXh0cmFjdHMgdGhlIHJlc3VsdCBmcm9tIGEgd3JhcHBlZCBhbmQgY2hhaW5lZCBvYmplY3QuXG4gIF8ucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3dyYXBwZWQ7XG4gIH07XG5cbiAgLy8gUHJvdmlkZSB1bndyYXBwaW5nIHByb3h5IGZvciBzb21lIG1ldGhvZHMgdXNlZCBpbiBlbmdpbmUgb3BlcmF0aW9uc1xuICAvLyBzdWNoIGFzIGFyaXRobWV0aWMgYW5kIEpTT04gc3RyaW5naWZpY2F0aW9uLlxuICBfLnByb3RvdHlwZS52YWx1ZU9mID0gXy5wcm90b3R5cGUudG9KU09OID0gXy5wcm90b3R5cGUudmFsdWU7XG5cbiAgXy5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJycgKyB0aGlzLl93cmFwcGVkO1xuICB9O1xuXG4gIC8vIEFNRCByZWdpc3RyYXRpb24gaGFwcGVucyBhdCB0aGUgZW5kIGZvciBjb21wYXRpYmlsaXR5IHdpdGggQU1EIGxvYWRlcnNcbiAgLy8gdGhhdCBtYXkgbm90IGVuZm9yY2UgbmV4dC10dXJuIHNlbWFudGljcyBvbiBtb2R1bGVzLiBFdmVuIHRob3VnaCBnZW5lcmFsXG4gIC8vIHByYWN0aWNlIGZvciBBTUQgcmVnaXN0cmF0aW9uIGlzIHRvIGJlIGFub255bW91cywgdW5kZXJzY29yZSByZWdpc3RlcnNcbiAgLy8gYXMgYSBuYW1lZCBtb2R1bGUgYmVjYXVzZSwgbGlrZSBqUXVlcnksIGl0IGlzIGEgYmFzZSBsaWJyYXJ5IHRoYXQgaXNcbiAgLy8gcG9wdWxhciBlbm91Z2ggdG8gYmUgYnVuZGxlZCBpbiBhIHRoaXJkIHBhcnR5IGxpYiwgYnV0IG5vdCBiZSBwYXJ0IG9mXG4gIC8vIGFuIEFNRCBsb2FkIHJlcXVlc3QuIFRob3NlIGNhc2VzIGNvdWxkIGdlbmVyYXRlIGFuIGVycm9yIHdoZW4gYW5cbiAgLy8gYW5vbnltb3VzIGRlZmluZSgpIGlzIGNhbGxlZCBvdXRzaWRlIG9mIGEgbG9hZGVyIHJlcXVlc3QuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoJ3VuZGVyc2NvcmUnLCBbXSwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gXztcbiAgICB9KTtcbiAgfVxufS5jYWxsKHRoaXMpKTtcbiIsImV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IFZpY3RvcjtcblxuLyoqXG4gKiAjIFZpY3RvciAtIEEgSmF2YVNjcmlwdCAyRCB2ZWN0b3IgY2xhc3Mgd2l0aCBtZXRob2RzIGZvciBjb21tb24gdmVjdG9yIG9wZXJhdGlvbnNcbiAqL1xuXG4vKipcbiAqIENvbnN0cnVjdG9yLiBXaWxsIGFsc28gd29yayB3aXRob3V0IHRoZSBgbmV3YCBrZXl3b3JkXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMxID0gbmV3IFZpY3RvcigxMDAsIDUwKTtcbiAqICAgICB2YXIgdmVjMiA9IFZpY3Rvcig0MiwgMTMzNyk7XG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggVmFsdWUgb2YgdGhlIHggYXhpc1xuICogQHBhcmFtIHtOdW1iZXJ9IHkgVmFsdWUgb2YgdGhlIHkgYXhpc1xuICogQHJldHVybiB7VmljdG9yfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuZnVuY3Rpb24gVmljdG9yICh4LCB5KSB7XG5cdGlmICghKHRoaXMgaW5zdGFuY2VvZiBWaWN0b3IpKSB7XG5cdFx0cmV0dXJuIG5ldyBWaWN0b3IoeCwgeSk7XG5cdH1cblxuXHQvKipcblx0ICogVGhlIFggYXhpc1xuXHQgKlxuXHQgKiAjIyMgRXhhbXBsZXM6XG5cdCAqICAgICB2YXIgdmVjID0gbmV3IFZpY3Rvci5mcm9tQXJyYXkoNDIsIDIxKTtcblx0ICpcblx0ICogICAgIHZlYy54O1xuXHQgKiAgICAgLy8gPT4gNDJcblx0ICpcblx0ICogQGFwaSBwdWJsaWNcblx0ICovXG5cdHRoaXMueCA9IHggfHwgMDtcblxuXHQvKipcblx0ICogVGhlIFkgYXhpc1xuXHQgKlxuXHQgKiAjIyMgRXhhbXBsZXM6XG5cdCAqICAgICB2YXIgdmVjID0gbmV3IFZpY3Rvci5mcm9tQXJyYXkoNDIsIDIxKTtcblx0ICpcblx0ICogICAgIHZlYy55O1xuXHQgKiAgICAgLy8gPT4gMjFcblx0ICpcblx0ICogQGFwaSBwdWJsaWNcblx0ICovXG5cdHRoaXMueSA9IHkgfHwgMDtcbn07XG5cbi8qKlxuICogIyBTdGF0aWNcbiAqL1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2UgZnJvbSBhbiBhcnJheVxuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjID0gVmljdG9yLmZyb21BcnJheShbNDIsIDIxXSk7XG4gKlxuICogICAgIHZlYy50b1N0cmluZygpO1xuICogICAgIC8vID0+IHg6NDIsIHk6MjFcbiAqXG4gKiBAbmFtZSBWaWN0b3IuZnJvbUFycmF5XG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBBcnJheSB3aXRoIHRoZSB4IGFuZCB5IHZhbHVlcyBhdCBpbmRleCAwIGFuZCAxIHJlc3BlY3RpdmVseVxuICogQHJldHVybiB7VmljdG9yfSBUaGUgbmV3IGluc3RhbmNlXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IuZnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuXHRyZXR1cm4gbmV3IFZpY3RvcihhcnJbMF0gfHwgMCwgYXJyWzFdIHx8IDApO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIGZyb20gYW4gb2JqZWN0XG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMgPSBWaWN0b3IuZnJvbU9iamVjdCh7IHg6IDQyLCB5OiAyMSB9KTtcbiAqXG4gKiAgICAgdmVjLnRvU3RyaW5nKCk7XG4gKiAgICAgLy8gPT4geDo0MiwgeToyMVxuICpcbiAqIEBuYW1lIFZpY3Rvci5mcm9tT2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIE9iamVjdCB3aXRoIHRoZSB2YWx1ZXMgZm9yIHggYW5kIHlcbiAqIEByZXR1cm4ge1ZpY3Rvcn0gVGhlIG5ldyBpbnN0YW5jZVxuICogQGFwaSBwdWJsaWNcbiAqL1xuVmljdG9yLmZyb21PYmplY3QgPSBmdW5jdGlvbiAob2JqKSB7XG5cdHJldHVybiBuZXcgVmljdG9yKG9iai54IHx8IDAsIG9iai55IHx8IDApO1xufTtcblxuLyoqXG4gKiAjIE1hbmlwdWxhdGlvblxuICpcbiAqIFRoZXNlIGZ1bmN0aW9ucyBhcmUgY2hhaW5hYmxlLlxuICovXG5cbi8qKlxuICogQWRkcyBhbm90aGVyIHZlY3RvcidzIFggYXhpcyB0byB0aGlzIG9uZVxuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjMSA9IG5ldyBWaWN0b3IoMTAsIDEwKTtcbiAqICAgICB2YXIgdmVjMiA9IG5ldyBWaWN0b3IoMjAsIDMwKTtcbiAqXG4gKiAgICAgdmVjMS5hZGRYKHZlYzIpO1xuICogICAgIHZlYzEudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjMwLCB5OjEwXG4gKlxuICogQHBhcmFtIHtWaWN0b3J9IHZlY3RvciBUaGUgb3RoZXIgdmVjdG9yIHlvdSB3YW50IHRvIGFkZCB0byB0aGlzIG9uZVxuICogQHJldHVybiB7VmljdG9yfSBgdGhpc2AgZm9yIGNoYWluaW5nIGNhcGFiaWxpdGllc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuVmljdG9yLnByb3RvdHlwZS5hZGRYID0gZnVuY3Rpb24gKHZlYykge1xuXHR0aGlzLnggKz0gdmVjLng7XG5cdHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGRzIGFub3RoZXIgdmVjdG9yJ3MgWSBheGlzIHRvIHRoaXMgb25lXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMxID0gbmV3IFZpY3RvcigxMCwgMTApO1xuICogICAgIHZhciB2ZWMyID0gbmV3IFZpY3RvcigyMCwgMzApO1xuICpcbiAqICAgICB2ZWMxLmFkZFkodmVjMik7XG4gKiAgICAgdmVjMS50b1N0cmluZygpO1xuICogICAgIC8vID0+IHg6MTAsIHk6NDBcbiAqXG4gKiBAcGFyYW0ge1ZpY3Rvcn0gdmVjdG9yIFRoZSBvdGhlciB2ZWN0b3IgeW91IHdhbnQgdG8gYWRkIHRvIHRoaXMgb25lXG4gKiBAcmV0dXJuIHtWaWN0b3J9IGB0aGlzYCBmb3IgY2hhaW5pbmcgY2FwYWJpbGl0aWVzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLmFkZFkgPSBmdW5jdGlvbiAodmVjKSB7XG5cdHRoaXMueSArPSB2ZWMueTtcblx0cmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZHMgYW5vdGhlciB2ZWN0b3IgdG8gdGhpcyBvbmVcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYzEgPSBuZXcgVmljdG9yKDEwLCAxMCk7XG4gKiAgICAgdmFyIHZlYzIgPSBuZXcgVmljdG9yKDIwLCAzMCk7XG4gKlxuICogICAgIHZlYzEuYWRkKHZlYzIpO1xuICogICAgIHZlYzEudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjMwLCB5OjQwXG4gKlxuICogQHBhcmFtIHtWaWN0b3J9IHZlY3RvciBUaGUgb3RoZXIgdmVjdG9yIHlvdSB3YW50IHRvIGFkZCB0byB0aGlzIG9uZVxuICogQHJldHVybiB7VmljdG9yfSBgdGhpc2AgZm9yIGNoYWluaW5nIGNhcGFiaWxpdGllc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuVmljdG9yLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodmVjKSB7XG5cdHRoaXMueCArPSB2ZWMueDtcblx0dGhpcy55ICs9IHZlYy55O1xuXHRyZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkcyB0aGUgZ2l2ZW4gc2NhbGFyIHRvIGJvdGggdmVjdG9yIGF4aXNcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYyA9IG5ldyBWaWN0b3IoMSwgMik7XG4gKlxuICogICAgIHZlYy5hZGRTY2FsYXIoMik7XG4gKiAgICAgdmVjLnRvU3RyaW5nKCk7XG4gKiAgICAgLy8gPT4geDogMywgeTogNFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBzY2FsYXIgVGhlIHNjYWxhciB0byBhZGRcbiAqIEByZXR1cm4ge1ZpY3Rvcn0gYHRoaXNgIGZvciBjaGFpbmluZyBjYXBhYmlsaXRpZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUuYWRkU2NhbGFyID0gZnVuY3Rpb24gKHNjYWxhcikge1xuXHR0aGlzLnggKz0gc2NhbGFyO1xuXHR0aGlzLnkgKz0gc2NhbGFyO1xuXHRyZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkcyB0aGUgZ2l2ZW4gc2NhbGFyIHRvIHRoZSBYIGF4aXNcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYyA9IG5ldyBWaWN0b3IoMSwgMik7XG4gKlxuICogICAgIHZlYy5hZGRTY2FsYXJYKDIpO1xuICogICAgIHZlYy50b1N0cmluZygpO1xuICogICAgIC8vID0+IHg6IDMsIHk6IDJcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gc2NhbGFyIFRoZSBzY2FsYXIgdG8gYWRkXG4gKiBAcmV0dXJuIHtWaWN0b3J9IGB0aGlzYCBmb3IgY2hhaW5pbmcgY2FwYWJpbGl0aWVzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLmFkZFNjYWxhclggPSBmdW5jdGlvbiAoc2NhbGFyKSB7XG5cdHRoaXMueCArPSBzY2FsYXI7XG5cdHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGRzIHRoZSBnaXZlbiBzY2FsYXIgdG8gdGhlIFkgYXhpc1xuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjID0gbmV3IFZpY3RvcigxLCAyKTtcbiAqXG4gKiAgICAgdmVjLmFkZFNjYWxhclkoMik7XG4gKiAgICAgdmVjLnRvU3RyaW5nKCk7XG4gKiAgICAgLy8gPT4geDogMSwgeTogNFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBzY2FsYXIgVGhlIHNjYWxhciB0byBhZGRcbiAqIEByZXR1cm4ge1ZpY3Rvcn0gYHRoaXNgIGZvciBjaGFpbmluZyBjYXBhYmlsaXRpZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUuYWRkU2NhbGFyWSA9IGZ1bmN0aW9uIChzY2FsYXIpIHtcblx0dGhpcy55ICs9IHNjYWxhcjtcblx0cmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFN1YnRyYWN0cyB0aGUgWCBheGlzIG9mIGFub3RoZXIgdmVjdG9yIGZyb20gdGhpcyBvbmVcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYzEgPSBuZXcgVmljdG9yKDEwMCwgNTApO1xuICogICAgIHZhciB2ZWMyID0gbmV3IFZpY3RvcigyMCwgMzApO1xuICpcbiAqICAgICB2ZWMxLnN1YnRyYWN0WCh2ZWMyKTtcbiAqICAgICB2ZWMxLnRvU3RyaW5nKCk7XG4gKiAgICAgLy8gPT4geDo4MCwgeTo1MFxuICpcbiAqIEBwYXJhbSB7VmljdG9yfSB2ZWN0b3IgVGhlIG90aGVyIHZlY3RvciB5b3Ugd2FudCBzdWJ0cmFjdCBmcm9tIHRoaXMgb25lXG4gKiBAcmV0dXJuIHtWaWN0b3J9IGB0aGlzYCBmb3IgY2hhaW5pbmcgY2FwYWJpbGl0aWVzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLnN1YnRyYWN0WCA9IGZ1bmN0aW9uICh2ZWMpIHtcblx0dGhpcy54IC09IHZlYy54O1xuXHRyZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU3VidHJhY3RzIHRoZSBZIGF4aXMgb2YgYW5vdGhlciB2ZWN0b3IgZnJvbSB0aGlzIG9uZVxuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjMSA9IG5ldyBWaWN0b3IoMTAwLCA1MCk7XG4gKiAgICAgdmFyIHZlYzIgPSBuZXcgVmljdG9yKDIwLCAzMCk7XG4gKlxuICogICAgIHZlYzEuc3VidHJhY3RZKHZlYzIpO1xuICogICAgIHZlYzEudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjEwMCwgeToyMFxuICpcbiAqIEBwYXJhbSB7VmljdG9yfSB2ZWN0b3IgVGhlIG90aGVyIHZlY3RvciB5b3Ugd2FudCBzdWJ0cmFjdCBmcm9tIHRoaXMgb25lXG4gKiBAcmV0dXJuIHtWaWN0b3J9IGB0aGlzYCBmb3IgY2hhaW5pbmcgY2FwYWJpbGl0aWVzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLnN1YnRyYWN0WSA9IGZ1bmN0aW9uICh2ZWMpIHtcblx0dGhpcy55IC09IHZlYy55O1xuXHRyZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU3VidHJhY3RzIGFub3RoZXIgdmVjdG9yIGZyb20gdGhpcyBvbmVcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYzEgPSBuZXcgVmljdG9yKDEwMCwgNTApO1xuICogICAgIHZhciB2ZWMyID0gbmV3IFZpY3RvcigyMCwgMzApO1xuICpcbiAqICAgICB2ZWMxLnN1YnRyYWN0KHZlYzIpO1xuICogICAgIHZlYzEudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjgwLCB5OjIwXG4gKlxuICogQHBhcmFtIHtWaWN0b3J9IHZlY3RvciBUaGUgb3RoZXIgdmVjdG9yIHlvdSB3YW50IHN1YnRyYWN0IGZyb20gdGhpcyBvbmVcbiAqIEByZXR1cm4ge1ZpY3Rvcn0gYHRoaXNgIGZvciBjaGFpbmluZyBjYXBhYmlsaXRpZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbiAodmVjKSB7XG5cdHRoaXMueCAtPSB2ZWMueDtcblx0dGhpcy55IC09IHZlYy55O1xuXHRyZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU3VidHJhY3RzIHRoZSBnaXZlbiBzY2FsYXIgZnJvbSBib3RoIGF4aXNcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYyA9IG5ldyBWaWN0b3IoMTAwLCAyMDApO1xuICpcbiAqICAgICB2ZWMuc3VidHJhY3RTY2FsYXIoMjApO1xuICogICAgIHZlYy50b1N0cmluZygpO1xuICogICAgIC8vID0+IHg6IDgwLCB5OiAxODBcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gc2NhbGFyIFRoZSBzY2FsYXIgdG8gc3VidHJhY3RcbiAqIEByZXR1cm4ge1ZpY3Rvcn0gYHRoaXNgIGZvciBjaGFpbmluZyBjYXBhYmlsaXRpZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUuc3VidHJhY3RTY2FsYXIgPSBmdW5jdGlvbiAoc2NhbGFyKSB7XG5cdHRoaXMueCAtPSBzY2FsYXI7XG5cdHRoaXMueSAtPSBzY2FsYXI7XG5cdHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTdWJ0cmFjdHMgdGhlIGdpdmVuIHNjYWxhciBmcm9tIHRoZSBYIGF4aXNcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYyA9IG5ldyBWaWN0b3IoMTAwLCAyMDApO1xuICpcbiAqICAgICB2ZWMuc3VidHJhY3RTY2FsYXJYKDIwKTtcbiAqICAgICB2ZWMudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OiA4MCwgeTogMjAwXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHNjYWxhciBUaGUgc2NhbGFyIHRvIHN1YnRyYWN0XG4gKiBAcmV0dXJuIHtWaWN0b3J9IGB0aGlzYCBmb3IgY2hhaW5pbmcgY2FwYWJpbGl0aWVzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLnN1YnRyYWN0U2NhbGFyWCA9IGZ1bmN0aW9uIChzY2FsYXIpIHtcblx0dGhpcy54IC09IHNjYWxhcjtcblx0cmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFN1YnRyYWN0cyB0aGUgZ2l2ZW4gc2NhbGFyIGZyb20gdGhlIFkgYXhpc1xuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjID0gbmV3IFZpY3RvcigxMDAsIDIwMCk7XG4gKlxuICogICAgIHZlYy5zdWJ0cmFjdFNjYWxhclkoMjApO1xuICogICAgIHZlYy50b1N0cmluZygpO1xuICogICAgIC8vID0+IHg6IDEwMCwgeTogMTgwXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHNjYWxhciBUaGUgc2NhbGFyIHRvIHN1YnRyYWN0XG4gKiBAcmV0dXJuIHtWaWN0b3J9IGB0aGlzYCBmb3IgY2hhaW5pbmcgY2FwYWJpbGl0aWVzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLnN1YnRyYWN0U2NhbGFyWSA9IGZ1bmN0aW9uIChzY2FsYXIpIHtcblx0dGhpcy55IC09IHNjYWxhcjtcblx0cmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIERpdmlkZXMgdGhlIFggYXhpcyBieSB0aGUgeCBjb21wb25lbnQgb2YgZ2l2ZW4gdmVjdG9yXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMgPSBuZXcgVmljdG9yKDEwMCwgNTApO1xuICogICAgIHZhciB2ZWMyID0gbmV3IFZpY3RvcigyLCAwKTtcbiAqXG4gKiAgICAgdmVjLmRpdmlkZVgodmVjMik7XG4gKiAgICAgdmVjLnRvU3RyaW5nKCk7XG4gKiAgICAgLy8gPT4geDo1MCwgeTo1MFxuICpcbiAqIEBwYXJhbSB7VmljdG9yfSB2ZWN0b3IgVGhlIG90aGVyIHZlY3RvciB5b3Ugd2FudCBkaXZpZGUgYnlcbiAqIEByZXR1cm4ge1ZpY3Rvcn0gYHRoaXNgIGZvciBjaGFpbmluZyBjYXBhYmlsaXRpZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUuZGl2aWRlWCA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcblx0dGhpcy54IC89IHZlY3Rvci54O1xuXHRyZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRGl2aWRlcyB0aGUgWSBheGlzIGJ5IHRoZSB5IGNvbXBvbmVudCBvZiBnaXZlbiB2ZWN0b3JcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYyA9IG5ldyBWaWN0b3IoMTAwLCA1MCk7XG4gKiAgICAgdmFyIHZlYzIgPSBuZXcgVmljdG9yKDAsIDIpO1xuICpcbiAqICAgICB2ZWMuZGl2aWRlWSh2ZWMyKTtcbiAqICAgICB2ZWMudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjEwMCwgeToyNVxuICpcbiAqIEBwYXJhbSB7VmljdG9yfSB2ZWN0b3IgVGhlIG90aGVyIHZlY3RvciB5b3Ugd2FudCBkaXZpZGUgYnlcbiAqIEByZXR1cm4ge1ZpY3Rvcn0gYHRoaXNgIGZvciBjaGFpbmluZyBjYXBhYmlsaXRpZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUuZGl2aWRlWSA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcblx0dGhpcy55IC89IHZlY3Rvci55O1xuXHRyZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRGl2aWRlcyBib3RoIHZlY3RvciBheGlzIGJ5IGEgYXhpcyB2YWx1ZXMgb2YgZ2l2ZW4gdmVjdG9yXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMgPSBuZXcgVmljdG9yKDEwMCwgNTApO1xuICogICAgIHZhciB2ZWMyID0gbmV3IFZpY3RvcigyLCAyKTtcbiAqXG4gKiAgICAgdmVjLmRpdmlkZSh2ZWMyKTtcbiAqICAgICB2ZWMudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjUwLCB5OjI1XG4gKlxuICogQHBhcmFtIHtWaWN0b3J9IHZlY3RvciBUaGUgdmVjdG9yIHRvIGRpdmlkZSBieVxuICogQHJldHVybiB7VmljdG9yfSBgdGhpc2AgZm9yIGNoYWluaW5nIGNhcGFiaWxpdGllc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuVmljdG9yLnByb3RvdHlwZS5kaXZpZGUgPSBmdW5jdGlvbiAodmVjdG9yKSB7XG5cdHRoaXMueCAvPSB2ZWN0b3IueDtcblx0dGhpcy55IC89IHZlY3Rvci55O1xuXHRyZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRGl2aWRlcyBib3RoIHZlY3RvciBheGlzIGJ5IHRoZSBnaXZlbiBzY2FsYXIgdmFsdWVcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYyA9IG5ldyBWaWN0b3IoMTAwLCA1MCk7XG4gKlxuICogICAgIHZlYy5kaXZpZGVTY2FsYXIoMik7XG4gKiAgICAgdmVjLnRvU3RyaW5nKCk7XG4gKiAgICAgLy8gPT4geDo1MCwgeToyNVxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBUaGUgc2NhbGFyIHRvIGRpdmlkZSBieVxuICogQHJldHVybiB7VmljdG9yfSBgdGhpc2AgZm9yIGNoYWluaW5nIGNhcGFiaWxpdGllc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuVmljdG9yLnByb3RvdHlwZS5kaXZpZGVTY2FsYXIgPSBmdW5jdGlvbiAoc2NhbGFyKSB7XG5cdGlmIChzY2FsYXIgIT09IDApIHtcblx0XHR0aGlzLnggLz0gc2NhbGFyO1xuXHRcdHRoaXMueSAvPSBzY2FsYXI7XG5cdH0gZWxzZSB7XG5cdFx0dGhpcy54ID0gMDtcblx0XHR0aGlzLnkgPSAwO1xuXHR9XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIERpdmlkZXMgdGhlIFggYXhpcyBieSB0aGUgZ2l2ZW4gc2NhbGFyIHZhbHVlXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMgPSBuZXcgVmljdG9yKDEwMCwgNTApO1xuICpcbiAqICAgICB2ZWMuZGl2aWRlU2NhbGFyWCgyKTtcbiAqICAgICB2ZWMudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjUwLCB5OjUwXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IFRoZSBzY2FsYXIgdG8gZGl2aWRlIGJ5XG4gKiBAcmV0dXJuIHtWaWN0b3J9IGB0aGlzYCBmb3IgY2hhaW5pbmcgY2FwYWJpbGl0aWVzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLmRpdmlkZVNjYWxhclggPSBmdW5jdGlvbiAoc2NhbGFyKSB7XG5cdGlmIChzY2FsYXIgIT09IDApIHtcblx0XHR0aGlzLnggLz0gc2NhbGFyO1xuXHR9IGVsc2Uge1xuXHRcdHRoaXMueCA9IDA7XG5cdH1cblx0cmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIERpdmlkZXMgdGhlIFkgYXhpcyBieSB0aGUgZ2l2ZW4gc2NhbGFyIHZhbHVlXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMgPSBuZXcgVmljdG9yKDEwMCwgNTApO1xuICpcbiAqICAgICB2ZWMuZGl2aWRlU2NhbGFyWSgyKTtcbiAqICAgICB2ZWMudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjEwMCwgeToyNVxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBUaGUgc2NhbGFyIHRvIGRpdmlkZSBieVxuICogQHJldHVybiB7VmljdG9yfSBgdGhpc2AgZm9yIGNoYWluaW5nIGNhcGFiaWxpdGllc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuVmljdG9yLnByb3RvdHlwZS5kaXZpZGVTY2FsYXJZID0gZnVuY3Rpb24gKHNjYWxhcikge1xuXHRpZiAoc2NhbGFyICE9PSAwKSB7XG5cdFx0dGhpcy55IC89IHNjYWxhcjtcblx0fSBlbHNlIHtcblx0XHR0aGlzLnkgPSAwO1xuXHR9XG5cdHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJbnZlcnRzIHRoZSBYIGF4aXNcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYyA9IG5ldyBWaWN0b3IoMTAwLCA1MCk7XG4gKlxuICogICAgIHZlYy5pbnZlcnRYKCk7XG4gKiAgICAgdmVjLnRvU3RyaW5nKCk7XG4gKiAgICAgLy8gPT4geDotMTAwLCB5OjUwXG4gKlxuICogQHJldHVybiB7VmljdG9yfSBgdGhpc2AgZm9yIGNoYWluaW5nIGNhcGFiaWxpdGllc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuVmljdG9yLnByb3RvdHlwZS5pbnZlcnRYID0gZnVuY3Rpb24gKCkge1xuXHR0aGlzLnggKj0gLTE7XG5cdHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJbnZlcnRzIHRoZSBZIGF4aXNcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYyA9IG5ldyBWaWN0b3IoMTAwLCA1MCk7XG4gKlxuICogICAgIHZlYy5pbnZlcnRZKCk7XG4gKiAgICAgdmVjLnRvU3RyaW5nKCk7XG4gKiAgICAgLy8gPT4geDoxMDAsIHk6LTUwXG4gKlxuICogQHJldHVybiB7VmljdG9yfSBgdGhpc2AgZm9yIGNoYWluaW5nIGNhcGFiaWxpdGllc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuVmljdG9yLnByb3RvdHlwZS5pbnZlcnRZID0gZnVuY3Rpb24gKCkge1xuXHR0aGlzLnkgKj0gLTE7XG5cdHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJbnZlcnRzIGJvdGggYXhpc1xuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjID0gbmV3IFZpY3RvcigxMDAsIDUwKTtcbiAqXG4gKiAgICAgdmVjLmludmVydCgpO1xuICogICAgIHZlYy50b1N0cmluZygpO1xuICogICAgIC8vID0+IHg6LTEwMCwgeTotNTBcbiAqXG4gKiBAcmV0dXJuIHtWaWN0b3J9IGB0aGlzYCBmb3IgY2hhaW5pbmcgY2FwYWJpbGl0aWVzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLmludmVydCA9IGZ1bmN0aW9uICgpIHtcblx0dGhpcy5pbnZlcnRYKCk7XG5cdHRoaXMuaW52ZXJ0WSgpO1xuXHRyZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogTXVsdGlwbGllcyB0aGUgWCBheGlzIGJ5IFggY29tcG9uZW50IG9mIGdpdmVuIHZlY3RvclxuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjID0gbmV3IFZpY3RvcigxMDAsIDUwKTtcbiAqICAgICB2YXIgdmVjMiA9IG5ldyBWaWN0b3IoMiwgMCk7XG4gKlxuICogICAgIHZlYy5tdWx0aXBseVgodmVjMik7XG4gKiAgICAgdmVjLnRvU3RyaW5nKCk7XG4gKiAgICAgLy8gPT4geDoyMDAsIHk6NTBcbiAqXG4gKiBAcGFyYW0ge1ZpY3Rvcn0gdmVjdG9yIFRoZSB2ZWN0b3IgdG8gbXVsdGlwbHkgdGhlIGF4aXMgd2l0aFxuICogQHJldHVybiB7VmljdG9yfSBgdGhpc2AgZm9yIGNoYWluaW5nIGNhcGFiaWxpdGllc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuVmljdG9yLnByb3RvdHlwZS5tdWx0aXBseVggPSBmdW5jdGlvbiAodmVjdG9yKSB7XG5cdHRoaXMueCAqPSB2ZWN0b3IueDtcblx0cmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIE11bHRpcGxpZXMgdGhlIFkgYXhpcyBieSBZIGNvbXBvbmVudCBvZiBnaXZlbiB2ZWN0b3JcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYyA9IG5ldyBWaWN0b3IoMTAwLCA1MCk7XG4gKiAgICAgdmFyIHZlYzIgPSBuZXcgVmljdG9yKDAsIDIpO1xuICpcbiAqICAgICB2ZWMubXVsdGlwbHlYKHZlYzIpO1xuICogICAgIHZlYy50b1N0cmluZygpO1xuICogICAgIC8vID0+IHg6MTAwLCB5OjEwMFxuICpcbiAqIEBwYXJhbSB7VmljdG9yfSB2ZWN0b3IgVGhlIHZlY3RvciB0byBtdWx0aXBseSB0aGUgYXhpcyB3aXRoXG4gKiBAcmV0dXJuIHtWaWN0b3J9IGB0aGlzYCBmb3IgY2hhaW5pbmcgY2FwYWJpbGl0aWVzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLm11bHRpcGx5WSA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcblx0dGhpcy55ICo9IHZlY3Rvci55O1xuXHRyZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogTXVsdGlwbGllcyBib3RoIHZlY3RvciBheGlzIGJ5IHZhbHVlcyBmcm9tIGEgZ2l2ZW4gdmVjdG9yXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMgPSBuZXcgVmljdG9yKDEwMCwgNTApO1xuICogICAgIHZhciB2ZWMyID0gbmV3IFZpY3RvcigyLCAyKTtcbiAqXG4gKiAgICAgdmVjLm11bHRpcGx5KHZlYzIpO1xuICogICAgIHZlYy50b1N0cmluZygpO1xuICogICAgIC8vID0+IHg6MjAwLCB5OjEwMFxuICpcbiAqIEBwYXJhbSB7VmljdG9yfSB2ZWN0b3IgVGhlIHZlY3RvciB0byBtdWx0aXBseSBieVxuICogQHJldHVybiB7VmljdG9yfSBgdGhpc2AgZm9yIGNoYWluaW5nIGNhcGFiaWxpdGllc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuVmljdG9yLnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uICh2ZWN0b3IpIHtcblx0dGhpcy54ICo9IHZlY3Rvci54O1xuXHR0aGlzLnkgKj0gdmVjdG9yLnk7XG5cdHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIGJvdGggdmVjdG9yIGF4aXMgYnkgdGhlIGdpdmVuIHNjYWxhciB2YWx1ZVxuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjID0gbmV3IFZpY3RvcigxMDAsIDUwKTtcbiAqXG4gKiAgICAgdmVjLm11bHRpcGx5U2NhbGFyKDIpO1xuICogICAgIHZlYy50b1N0cmluZygpO1xuICogICAgIC8vID0+IHg6MjAwLCB5OjEwMFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBUaGUgc2NhbGFyIHRvIG11bHRpcGx5IGJ5XG4gKiBAcmV0dXJuIHtWaWN0b3J9IGB0aGlzYCBmb3IgY2hhaW5pbmcgY2FwYWJpbGl0aWVzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLm11bHRpcGx5U2NhbGFyID0gZnVuY3Rpb24gKHNjYWxhcikge1xuXHR0aGlzLnggKj0gc2NhbGFyO1xuXHR0aGlzLnkgKj0gc2NhbGFyO1xuXHRyZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogTXVsdGlwbGllcyB0aGUgWCBheGlzIGJ5IHRoZSBnaXZlbiBzY2FsYXJcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYyA9IG5ldyBWaWN0b3IoMTAwLCA1MCk7XG4gKlxuICogICAgIHZlYy5tdWx0aXBseVNjYWxhclgoMik7XG4gKiAgICAgdmVjLnRvU3RyaW5nKCk7XG4gKiAgICAgLy8gPT4geDoyMDAsIHk6NTBcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gVGhlIHNjYWxhciB0byBtdWx0aXBseSB0aGUgYXhpcyB3aXRoXG4gKiBAcmV0dXJuIHtWaWN0b3J9IGB0aGlzYCBmb3IgY2hhaW5pbmcgY2FwYWJpbGl0aWVzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLm11bHRpcGx5U2NhbGFyWCA9IGZ1bmN0aW9uIChzY2FsYXIpIHtcblx0dGhpcy54ICo9IHNjYWxhcjtcblx0cmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIE11bHRpcGxpZXMgdGhlIFkgYXhpcyBieSB0aGUgZ2l2ZW4gc2NhbGFyXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMgPSBuZXcgVmljdG9yKDEwMCwgNTApO1xuICpcbiAqICAgICB2ZWMubXVsdGlwbHlTY2FsYXJZKDIpO1xuICogICAgIHZlYy50b1N0cmluZygpO1xuICogICAgIC8vID0+IHg6MTAwLCB5OjEwMFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBUaGUgc2NhbGFyIHRvIG11bHRpcGx5IHRoZSBheGlzIHdpdGhcbiAqIEByZXR1cm4ge1ZpY3Rvcn0gYHRoaXNgIGZvciBjaGFpbmluZyBjYXBhYmlsaXRpZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUubXVsdGlwbHlTY2FsYXJZID0gZnVuY3Rpb24gKHNjYWxhcikge1xuXHR0aGlzLnkgKj0gc2NhbGFyO1xuXHRyZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogTm9ybWFsaXplXG4gKlxuICogQHJldHVybiB7VmljdG9yfSBgdGhpc2AgZm9yIGNoYWluaW5nIGNhcGFiaWxpdGllc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuVmljdG9yLnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCgpO1xuXG5cdGlmIChsZW5ndGggPT09IDApIHtcblx0XHR0aGlzLnggPSAxO1xuXHRcdHRoaXMueSA9IDA7XG5cdH0gZWxzZSB7XG5cdFx0dGhpcy5kaXZpZGUoVmljdG9yKGxlbmd0aCwgbGVuZ3RoKSk7XG5cdH1cblx0cmV0dXJuIHRoaXM7XG59O1xuXG5WaWN0b3IucHJvdG90eXBlLm5vcm0gPSBWaWN0b3IucHJvdG90eXBlLm5vcm1hbGl6ZTtcblxuLyoqXG4gKiBJZiB0aGUgYWJzb2x1dGUgdmVjdG9yIGF4aXMgaXMgZ3JlYXRlciB0aGFuIGBtYXhgLCBtdWx0aXBsaWVzIHRoZSBheGlzIGJ5IGBmYWN0b3JgXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMgPSBuZXcgVmljdG9yKDEwMCwgNTApO1xuICpcbiAqICAgICB2ZWMubGltaXQoODAsIDAuOSk7XG4gKiAgICAgdmVjLnRvU3RyaW5nKCk7XG4gKiAgICAgLy8gPT4geDo5MCwgeTo1MFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtYXggVGhlIG1heGltdW0gdmFsdWUgZm9yIGJvdGggeCBhbmQgeSBheGlzXG4gKiBAcGFyYW0ge051bWJlcn0gZmFjdG9yIEZhY3RvciBieSB3aGljaCB0aGUgYXhpcyBhcmUgdG8gYmUgbXVsdGlwbGllZCB3aXRoXG4gKiBAcmV0dXJuIHtWaWN0b3J9IGB0aGlzYCBmb3IgY2hhaW5pbmcgY2FwYWJpbGl0aWVzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLmxpbWl0ID0gZnVuY3Rpb24gKG1heCwgZmFjdG9yKSB7XG5cdGlmIChNYXRoLmFicyh0aGlzLngpID4gbWF4KXsgdGhpcy54ICo9IGZhY3RvcjsgfVxuXHRpZiAoTWF0aC5hYnModGhpcy55KSA+IG1heCl7IHRoaXMueSAqPSBmYWN0b3I7IH1cblx0cmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJhbmRvbWl6ZXMgYm90aCB2ZWN0b3IgYXhpcyB3aXRoIGEgdmFsdWUgYmV0d2VlbiAyIHZlY3RvcnNcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYyA9IG5ldyBWaWN0b3IoMTAwLCA1MCk7XG4gKlxuICogICAgIHZlYy5yYW5kb21pemUobmV3IFZpY3Rvcig1MCwgNjApLCBuZXcgVmljdG9yKDcwLCA4MGApKTtcbiAqICAgICB2ZWMudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjY3LCB5OjczXG4gKlxuICogQHBhcmFtIHtWaWN0b3J9IHRvcExlZnQgZmlyc3QgdmVjdG9yXG4gKiBAcGFyYW0ge1ZpY3Rvcn0gYm90dG9tUmlnaHQgc2Vjb25kIHZlY3RvclxuICogQHJldHVybiB7VmljdG9yfSBgdGhpc2AgZm9yIGNoYWluaW5nIGNhcGFiaWxpdGllc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuVmljdG9yLnByb3RvdHlwZS5yYW5kb21pemUgPSBmdW5jdGlvbiAodG9wTGVmdCwgYm90dG9tUmlnaHQpIHtcblx0dGhpcy5yYW5kb21pemVYKHRvcExlZnQsIGJvdHRvbVJpZ2h0KTtcblx0dGhpcy5yYW5kb21pemVZKHRvcExlZnQsIGJvdHRvbVJpZ2h0KTtcblxuXHRyZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmFuZG9taXplcyB0aGUgeSBheGlzIHdpdGggYSB2YWx1ZSBiZXR3ZWVuIDIgdmVjdG9yc1xuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjID0gbmV3IFZpY3RvcigxMDAsIDUwKTtcbiAqXG4gKiAgICAgdmVjLnJhbmRvbWl6ZVgobmV3IFZpY3Rvcig1MCwgNjApLCBuZXcgVmljdG9yKDcwLCA4MGApKTtcbiAqICAgICB2ZWMudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjU1LCB5OjUwXG4gKlxuICogQHBhcmFtIHtWaWN0b3J9IHRvcExlZnQgZmlyc3QgdmVjdG9yXG4gKiBAcGFyYW0ge1ZpY3Rvcn0gYm90dG9tUmlnaHQgc2Vjb25kIHZlY3RvclxuICogQHJldHVybiB7VmljdG9yfSBgdGhpc2AgZm9yIGNoYWluaW5nIGNhcGFiaWxpdGllc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuVmljdG9yLnByb3RvdHlwZS5yYW5kb21pemVYID0gZnVuY3Rpb24gKHRvcExlZnQsIGJvdHRvbVJpZ2h0KSB7XG5cdHZhciBtaW4gPSBNYXRoLm1pbih0b3BMZWZ0LngsIGJvdHRvbVJpZ2h0LngpO1xuXHR2YXIgbWF4ID0gTWF0aC5tYXgodG9wTGVmdC54LCBib3R0b21SaWdodC54KTtcblx0dGhpcy54ID0gcmFuZG9tKG1pbiwgbWF4KTtcblx0cmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJhbmRvbWl6ZXMgdGhlIHkgYXhpcyB3aXRoIGEgdmFsdWUgYmV0d2VlbiAyIHZlY3RvcnNcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYyA9IG5ldyBWaWN0b3IoMTAwLCA1MCk7XG4gKlxuICogICAgIHZlYy5yYW5kb21pemVZKG5ldyBWaWN0b3IoNTAsIDYwKSwgbmV3IFZpY3Rvcig3MCwgODBgKSk7XG4gKiAgICAgdmVjLnRvU3RyaW5nKCk7XG4gKiAgICAgLy8gPT4geDoxMDAsIHk6NjZcbiAqXG4gKiBAcGFyYW0ge1ZpY3Rvcn0gdG9wTGVmdCBmaXJzdCB2ZWN0b3JcbiAqIEBwYXJhbSB7VmljdG9yfSBib3R0b21SaWdodCBzZWNvbmQgdmVjdG9yXG4gKiBAcmV0dXJuIHtWaWN0b3J9IGB0aGlzYCBmb3IgY2hhaW5pbmcgY2FwYWJpbGl0aWVzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLnJhbmRvbWl6ZVkgPSBmdW5jdGlvbiAodG9wTGVmdCwgYm90dG9tUmlnaHQpIHtcblx0dmFyIG1pbiA9IE1hdGgubWluKHRvcExlZnQueSwgYm90dG9tUmlnaHQueSk7XG5cdHZhciBtYXggPSBNYXRoLm1heCh0b3BMZWZ0LnksIGJvdHRvbVJpZ2h0LnkpO1xuXHR0aGlzLnkgPSByYW5kb20obWluLCBtYXgpO1xuXHRyZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmFuZG9tbHkgcmFuZG9taXplcyBlaXRoZXIgYXhpcyBiZXR3ZWVuIDIgdmVjdG9yc1xuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjID0gbmV3IFZpY3RvcigxMDAsIDUwKTtcbiAqXG4gKiAgICAgdmVjLnJhbmRvbWl6ZUFueShuZXcgVmljdG9yKDUwLCA2MCksIG5ldyBWaWN0b3IoNzAsIDgwKSk7XG4gKiAgICAgdmVjLnRvU3RyaW5nKCk7XG4gKiAgICAgLy8gPT4geDoxMDAsIHk6NzdcbiAqXG4gKiBAcGFyYW0ge1ZpY3Rvcn0gdG9wTGVmdCBmaXJzdCB2ZWN0b3JcbiAqIEBwYXJhbSB7VmljdG9yfSBib3R0b21SaWdodCBzZWNvbmQgdmVjdG9yXG4gKiBAcmV0dXJuIHtWaWN0b3J9IGB0aGlzYCBmb3IgY2hhaW5pbmcgY2FwYWJpbGl0aWVzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLnJhbmRvbWl6ZUFueSA9IGZ1bmN0aW9uICh0b3BMZWZ0LCBib3R0b21SaWdodCkge1xuXHRpZiAoISEgTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpKSkge1xuXHRcdHRoaXMucmFuZG9taXplWCh0b3BMZWZ0LCBib3R0b21SaWdodCk7XG5cdH0gZWxzZSB7XG5cdFx0dGhpcy5yYW5kb21pemVZKHRvcExlZnQsIGJvdHRvbVJpZ2h0KTtcblx0fVxuXHRyZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUm91bmRzIGJvdGggYXhpcyB0byBhbiBpbnRlZ2VyIHZhbHVlXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMgPSBuZXcgVmljdG9yKDEwMC4yLCA1MC45KTtcbiAqXG4gKiAgICAgdmVjLnVuZmxvYXQoKTtcbiAqICAgICB2ZWMudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjEwMCwgeTo1MVxuICpcbiAqIEByZXR1cm4ge1ZpY3Rvcn0gYHRoaXNgIGZvciBjaGFpbmluZyBjYXBhYmlsaXRpZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUudW5mbG9hdCA9IGZ1bmN0aW9uICgpIHtcblx0dGhpcy54ID0gTWF0aC5yb3VuZCh0aGlzLngpO1xuXHR0aGlzLnkgPSBNYXRoLnJvdW5kKHRoaXMueSk7XG5cdHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSb3VuZHMgYm90aCBheGlzIHRvIGEgY2VydGFpbiBwcmVjaXNpb25cbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYyA9IG5ldyBWaWN0b3IoMTAwLjIsIDUwLjkpO1xuICpcbiAqICAgICB2ZWMudW5mbG9hdCgpO1xuICogICAgIHZlYy50b1N0cmluZygpO1xuICogICAgIC8vID0+IHg6MTAwLCB5OjUxXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IFByZWNpc2lvbiAoZGVmYXVsdDogOClcbiAqIEByZXR1cm4ge1ZpY3Rvcn0gYHRoaXNgIGZvciBjaGFpbmluZyBjYXBhYmlsaXRpZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUudG9GaXhlZCA9IGZ1bmN0aW9uIChwcmVjaXNpb24pIHtcblx0aWYgKHR5cGVvZiBwcmVjaXNpb24gPT09ICd1bmRlZmluZWQnKSB7IHByZWNpc2lvbiA9IDg7IH1cblx0dGhpcy54ID0gdGhpcy54LnRvRml4ZWQocHJlY2lzaW9uKTtcblx0dGhpcy55ID0gdGhpcy55LnRvRml4ZWQocHJlY2lzaW9uKTtcblx0cmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgbGluZWFyIGJsZW5kIC8gaW50ZXJwb2xhdGlvbiBvZiB0aGUgWCBheGlzIHRvd2FyZHMgYW5vdGhlciB2ZWN0b3JcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYzEgPSBuZXcgVmljdG9yKDEwMCwgMTAwKTtcbiAqICAgICB2YXIgdmVjMiA9IG5ldyBWaWN0b3IoMjAwLCAyMDApO1xuICpcbiAqICAgICB2ZWMxLm1peFgodmVjMiwgMC41KTtcbiAqICAgICB2ZWMudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjE1MCwgeToxMDBcbiAqXG4gKiBAcGFyYW0ge1ZpY3Rvcn0gdmVjdG9yIFRoZSBvdGhlciB2ZWN0b3JcbiAqIEBwYXJhbSB7TnVtYmVyfSBhbW91bnQgVGhlIGJsZW5kIGFtb3VudCAob3B0aW9uYWwsIGRlZmF1bHQ6IDAuNSlcbiAqIEByZXR1cm4ge1ZpY3Rvcn0gYHRoaXNgIGZvciBjaGFpbmluZyBjYXBhYmlsaXRpZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUubWl4WCA9IGZ1bmN0aW9uICh2ZWMsIGFtb3VudCkge1xuXHRpZiAodHlwZW9mIGFtb3VudCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRhbW91bnQgPSAwLjU7XG5cdH1cblxuXHR0aGlzLnggPSAoMSAtIGFtb3VudCkgKiB0aGlzLnggKyBhbW91bnQgKiB2ZWMueDtcblx0cmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgbGluZWFyIGJsZW5kIC8gaW50ZXJwb2xhdGlvbiBvZiB0aGUgWSBheGlzIHRvd2FyZHMgYW5vdGhlciB2ZWN0b3JcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYzEgPSBuZXcgVmljdG9yKDEwMCwgMTAwKTtcbiAqICAgICB2YXIgdmVjMiA9IG5ldyBWaWN0b3IoMjAwLCAyMDApO1xuICpcbiAqICAgICB2ZWMxLm1peFkodmVjMiwgMC41KTtcbiAqICAgICB2ZWMudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjEwMCwgeToxNTBcbiAqXG4gKiBAcGFyYW0ge1ZpY3Rvcn0gdmVjdG9yIFRoZSBvdGhlciB2ZWN0b3JcbiAqIEBwYXJhbSB7TnVtYmVyfSBhbW91bnQgVGhlIGJsZW5kIGFtb3VudCAob3B0aW9uYWwsIGRlZmF1bHQ6IDAuNSlcbiAqIEByZXR1cm4ge1ZpY3Rvcn0gYHRoaXNgIGZvciBjaGFpbmluZyBjYXBhYmlsaXRpZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUubWl4WSA9IGZ1bmN0aW9uICh2ZWMsIGFtb3VudCkge1xuXHRpZiAodHlwZW9mIGFtb3VudCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRhbW91bnQgPSAwLjU7XG5cdH1cblxuXHR0aGlzLnkgPSAoMSAtIGFtb3VudCkgKiB0aGlzLnkgKyBhbW91bnQgKiB2ZWMueTtcblx0cmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgbGluZWFyIGJsZW5kIC8gaW50ZXJwb2xhdGlvbiB0b3dhcmRzIGFub3RoZXIgdmVjdG9yXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMxID0gbmV3IFZpY3RvcigxMDAsIDEwMCk7XG4gKiAgICAgdmFyIHZlYzIgPSBuZXcgVmljdG9yKDIwMCwgMjAwKTtcbiAqXG4gKiAgICAgdmVjMS5taXgodmVjMiwgMC41KTtcbiAqICAgICB2ZWMudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjE1MCwgeToxNTBcbiAqXG4gKiBAcGFyYW0ge1ZpY3Rvcn0gdmVjdG9yIFRoZSBvdGhlciB2ZWN0b3JcbiAqIEBwYXJhbSB7TnVtYmVyfSBhbW91bnQgVGhlIGJsZW5kIGFtb3VudCAob3B0aW9uYWwsIGRlZmF1bHQ6IDAuNSlcbiAqIEByZXR1cm4ge1ZpY3Rvcn0gYHRoaXNgIGZvciBjaGFpbmluZyBjYXBhYmlsaXRpZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUubWl4ID0gZnVuY3Rpb24gKHZlYywgYW1vdW50KSB7XG5cdHRoaXMubWl4WCh2ZWMsIGFtb3VudCk7XG5cdHRoaXMubWl4WSh2ZWMsIGFtb3VudCk7XG5cdHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiAjIFByb2R1Y3RzXG4gKi9cblxuLyoqXG4gKiBDcmVhdGVzIGEgY2xvbmUgb2YgdGhpcyB2ZWN0b3JcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYzEgPSBuZXcgVmljdG9yKDEwLCAxMCk7XG4gKiAgICAgdmFyIHZlYzIgPSB2ZWMxLmNsb25lKCk7XG4gKlxuICogICAgIHZlYzIudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjEwLCB5OjEwXG4gKlxuICogQHJldHVybiB7VmljdG9yfSBBIGNsb25lIG9mIHRoZSB2ZWN0b3JcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBuZXcgVmljdG9yKHRoaXMueCwgdGhpcy55KTtcbn07XG5cbi8qKlxuICogQ29waWVzIGFub3RoZXIgdmVjdG9yJ3MgWCBjb21wb25lbnQgaW4gdG8gaXRzIG93blxuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjMSA9IG5ldyBWaWN0b3IoMTAsIDEwKTtcbiAqICAgICB2YXIgdmVjMiA9IG5ldyBWaWN0b3IoMjAsIDIwKTtcbiAqICAgICB2YXIgdmVjMiA9IHZlYzEuY29weVgodmVjMSk7XG4gKlxuICogICAgIHZlYzIudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjIwLCB5OjEwXG4gKlxuICogQHJldHVybiB7VmljdG9yfSBgdGhpc2AgZm9yIGNoYWluaW5nIGNhcGFiaWxpdGllc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuVmljdG9yLnByb3RvdHlwZS5jb3B5WCA9IGZ1bmN0aW9uICh2ZWMpIHtcblx0dGhpcy54ID0gdmVjLng7XG5cdHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDb3BpZXMgYW5vdGhlciB2ZWN0b3IncyBZIGNvbXBvbmVudCBpbiB0byBpdHMgb3duXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMxID0gbmV3IFZpY3RvcigxMCwgMTApO1xuICogICAgIHZhciB2ZWMyID0gbmV3IFZpY3RvcigyMCwgMjApO1xuICogICAgIHZhciB2ZWMyID0gdmVjMS5jb3B5WSh2ZWMxKTtcbiAqXG4gKiAgICAgdmVjMi50b1N0cmluZygpO1xuICogICAgIC8vID0+IHg6MTAsIHk6MjBcbiAqXG4gKiBAcmV0dXJuIHtWaWN0b3J9IGB0aGlzYCBmb3IgY2hhaW5pbmcgY2FwYWJpbGl0aWVzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLmNvcHlZID0gZnVuY3Rpb24gKHZlYykge1xuXHR0aGlzLnkgPSB2ZWMueTtcblx0cmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIENvcGllcyBhbm90aGVyIHZlY3RvcidzIFggYW5kIFkgY29tcG9uZW50cyBpbiB0byBpdHMgb3duXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMxID0gbmV3IFZpY3RvcigxMCwgMTApO1xuICogICAgIHZhciB2ZWMyID0gbmV3IFZpY3RvcigyMCwgMjApO1xuICogICAgIHZhciB2ZWMyID0gdmVjMS5jb3B5KHZlYzEpO1xuICpcbiAqICAgICB2ZWMyLnRvU3RyaW5nKCk7XG4gKiAgICAgLy8gPT4geDoyMCwgeToyMFxuICpcbiAqIEByZXR1cm4ge1ZpY3Rvcn0gYHRoaXNgIGZvciBjaGFpbmluZyBjYXBhYmlsaXRpZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uICh2ZWMpIHtcblx0dGhpcy5jb3B5WCh2ZWMpO1xuXHR0aGlzLmNvcHlZKHZlYyk7XG5cdHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSB2ZWN0b3IgdG8gemVybyAoMCwwKVxuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjMSA9IG5ldyBWaWN0b3IoMTAsIDEwKTtcbiAqXHRcdCB2YXIxLnplcm8oKTtcbiAqICAgICB2ZWMxLnRvU3RyaW5nKCk7XG4gKiAgICAgLy8gPT4geDowLCB5OjBcbiAqXG4gKiBAcmV0dXJuIHtWaWN0b3J9IGB0aGlzYCBmb3IgY2hhaW5pbmcgY2FwYWJpbGl0aWVzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLnplcm8gPSBmdW5jdGlvbiAoKSB7XG5cdHRoaXMueCA9IHRoaXMueSA9IDA7XG5cdHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBkb3QgcHJvZHVjdCBvZiB0aGlzIHZlY3RvciBhbmQgYW5vdGhlclxuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjMSA9IG5ldyBWaWN0b3IoMTAwLCA1MCk7XG4gKiAgICAgdmFyIHZlYzIgPSBuZXcgVmljdG9yKDIwMCwgNjApO1xuICpcbiAqICAgICB2ZWMxLmRvdCh2ZWMyKTtcbiAqICAgICAvLyA9PiAyMzAwMFxuICpcbiAqIEBwYXJhbSB7VmljdG9yfSB2ZWN0b3IgVGhlIHNlY29uZCB2ZWN0b3JcbiAqIEByZXR1cm4ge051bWJlcn0gRG90IHByb2R1Y3RcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUuZG90ID0gZnVuY3Rpb24gKHZlYzIpIHtcblx0cmV0dXJuIHRoaXMueCAqIHZlYzIueCArIHRoaXMueSAqIHZlYzIueTtcbn07XG5cblZpY3Rvci5wcm90b3R5cGUuY3Jvc3MgPSBmdW5jdGlvbiAodmVjMikge1xuXHRyZXR1cm4gKHRoaXMueCAqIHZlYzIueSApIC0gKHRoaXMueSAqIHZlYzIueCApO1xufTtcblxuLyoqXG4gKiBQcm9qZWN0cyBhIHZlY3RvciBvbnRvIGFub3RoZXIgdmVjdG9yLCBzZXR0aW5nIGl0c2VsZiB0byB0aGUgcmVzdWx0LlxuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjID0gbmV3IFZpY3RvcigxMDAsIDApO1xuICogICAgIHZhciB2ZWMyID0gbmV3IFZpY3RvcigxMDAsIDEwMCk7XG4gKlxuICogICAgIHZlYy5wcm9qZWN0T250byh2ZWMyKTtcbiAqICAgICB2ZWMudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjUwLCB5OjUwXG4gKlxuICogQHBhcmFtIHtWaWN0b3J9IHZlY3RvciBUaGUgb3RoZXIgdmVjdG9yIHlvdSB3YW50IHRvIHByb2plY3QgdGhpcyB2ZWN0b3Igb250b1xuICogQHJldHVybiB7VmljdG9yfSBgdGhpc2AgZm9yIGNoYWluaW5nIGNhcGFiaWxpdGllc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuVmljdG9yLnByb3RvdHlwZS5wcm9qZWN0T250byA9IGZ1bmN0aW9uICh2ZWMyKSB7XG4gICAgdmFyIGNvZWZmID0gKCAodGhpcy54ICogdmVjMi54KSsodGhpcy55ICogdmVjMi55KSApIC8gKCh2ZWMyLngqdmVjMi54KSsodmVjMi55KnZlYzIueSkpO1xuICAgIHRoaXMueCA9IGNvZWZmICogdmVjMi54O1xuICAgIHRoaXMueSA9IGNvZWZmICogdmVjMi55O1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuXG5WaWN0b3IucHJvdG90eXBlLmhvcml6b250YWxBbmdsZSA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIE1hdGguYXRhbjIodGhpcy55LCB0aGlzLngpO1xufTtcblxuVmljdG9yLnByb3RvdHlwZS5ob3Jpem9udGFsQW5nbGVEZWcgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiByYWRpYW4yZGVncmVlcyh0aGlzLmhvcml6b250YWxBbmdsZSgpKTtcbn07XG5cblZpY3Rvci5wcm90b3R5cGUudmVydGljYWxBbmdsZSA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIE1hdGguYXRhbjIodGhpcy54LCB0aGlzLnkpO1xufTtcblxuVmljdG9yLnByb3RvdHlwZS52ZXJ0aWNhbEFuZ2xlRGVnID0gZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gcmFkaWFuMmRlZ3JlZXModGhpcy52ZXJ0aWNhbEFuZ2xlKCkpO1xufTtcblxuVmljdG9yLnByb3RvdHlwZS5hbmdsZSA9IFZpY3Rvci5wcm90b3R5cGUuaG9yaXpvbnRhbEFuZ2xlO1xuVmljdG9yLnByb3RvdHlwZS5hbmdsZURlZyA9IFZpY3Rvci5wcm90b3R5cGUuaG9yaXpvbnRhbEFuZ2xlRGVnO1xuVmljdG9yLnByb3RvdHlwZS5kaXJlY3Rpb24gPSBWaWN0b3IucHJvdG90eXBlLmhvcml6b250YWxBbmdsZTtcblxuVmljdG9yLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbiAoYW5nbGUpIHtcblx0dmFyIG54ID0gKHRoaXMueCAqIE1hdGguY29zKGFuZ2xlKSkgLSAodGhpcy55ICogTWF0aC5zaW4oYW5nbGUpKTtcblx0dmFyIG55ID0gKHRoaXMueCAqIE1hdGguc2luKGFuZ2xlKSkgKyAodGhpcy55ICogTWF0aC5jb3MoYW5nbGUpKTtcblxuXHR0aGlzLnggPSBueDtcblx0dGhpcy55ID0gbnk7XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuXG5WaWN0b3IucHJvdG90eXBlLnJvdGF0ZURlZyA9IGZ1bmN0aW9uIChhbmdsZSkge1xuXHRhbmdsZSA9IGRlZ3JlZXMycmFkaWFuKGFuZ2xlKTtcblx0cmV0dXJuIHRoaXMucm90YXRlKGFuZ2xlKTtcbn07XG5cblZpY3Rvci5wcm90b3R5cGUucm90YXRlVG8gPSBmdW5jdGlvbihyb3RhdGlvbikge1xuXHRyZXR1cm4gdGhpcy5yb3RhdGUocm90YXRpb24tdGhpcy5hbmdsZSgpKTtcbn07XG5cblZpY3Rvci5wcm90b3R5cGUucm90YXRlVG9EZWcgPSBmdW5jdGlvbihyb3RhdGlvbikge1xuXHRyb3RhdGlvbiA9IGRlZ3JlZXMycmFkaWFuKHJvdGF0aW9uKTtcblx0cmV0dXJuIHRoaXMucm90YXRlVG8ocm90YXRpb24pO1xufTtcblxuVmljdG9yLnByb3RvdHlwZS5yb3RhdGVCeSA9IGZ1bmN0aW9uIChyb3RhdGlvbikge1xuXHR2YXIgYW5nbGUgPSB0aGlzLmFuZ2xlKCkgKyByb3RhdGlvbjtcblxuXHRyZXR1cm4gdGhpcy5yb3RhdGUoYW5nbGUpO1xufTtcblxuVmljdG9yLnByb3RvdHlwZS5yb3RhdGVCeURlZyA9IGZ1bmN0aW9uIChyb3RhdGlvbikge1xuXHRyb3RhdGlvbiA9IGRlZ3JlZXMycmFkaWFuKHJvdGF0aW9uKTtcblx0cmV0dXJuIHRoaXMucm90YXRlQnkocm90YXRpb24pO1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBkaXN0YW5jZSBvZiB0aGUgWCBheGlzIGJldHdlZW4gdGhpcyB2ZWN0b3IgYW5kIGFub3RoZXJcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYzEgPSBuZXcgVmljdG9yKDEwMCwgNTApO1xuICogICAgIHZhciB2ZWMyID0gbmV3IFZpY3RvcigyMDAsIDYwKTtcbiAqXG4gKiAgICAgdmVjMS5kaXN0YW5jZVgodmVjMik7XG4gKiAgICAgLy8gPT4gLTEwMFxuICpcbiAqIEBwYXJhbSB7VmljdG9yfSB2ZWN0b3IgVGhlIHNlY29uZCB2ZWN0b3JcbiAqIEByZXR1cm4ge051bWJlcn0gRGlzdGFuY2VcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUuZGlzdGFuY2VYID0gZnVuY3Rpb24gKHZlYykge1xuXHRyZXR1cm4gdGhpcy54IC0gdmVjLng7XG59O1xuXG4vKipcbiAqIFNhbWUgYXMgYGRpc3RhbmNlWCgpYCBidXQgYWx3YXlzIHJldHVybnMgYW4gYWJzb2x1dGUgbnVtYmVyXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMxID0gbmV3IFZpY3RvcigxMDAsIDUwKTtcbiAqICAgICB2YXIgdmVjMiA9IG5ldyBWaWN0b3IoMjAwLCA2MCk7XG4gKlxuICogICAgIHZlYzEuYWJzRGlzdGFuY2VYKHZlYzIpO1xuICogICAgIC8vID0+IDEwMFxuICpcbiAqIEBwYXJhbSB7VmljdG9yfSB2ZWN0b3IgVGhlIHNlY29uZCB2ZWN0b3JcbiAqIEByZXR1cm4ge051bWJlcn0gQWJzb2x1dGUgZGlzdGFuY2VcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUuYWJzRGlzdGFuY2VYID0gZnVuY3Rpb24gKHZlYykge1xuXHRyZXR1cm4gTWF0aC5hYnModGhpcy5kaXN0YW5jZVgodmVjKSk7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGRpc3RhbmNlIG9mIHRoZSBZIGF4aXMgYmV0d2VlbiB0aGlzIHZlY3RvciBhbmQgYW5vdGhlclxuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjMSA9IG5ldyBWaWN0b3IoMTAwLCA1MCk7XG4gKiAgICAgdmFyIHZlYzIgPSBuZXcgVmljdG9yKDIwMCwgNjApO1xuICpcbiAqICAgICB2ZWMxLmRpc3RhbmNlWSh2ZWMyKTtcbiAqICAgICAvLyA9PiAtMTBcbiAqXG4gKiBAcGFyYW0ge1ZpY3Rvcn0gdmVjdG9yIFRoZSBzZWNvbmQgdmVjdG9yXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IERpc3RhbmNlXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLmRpc3RhbmNlWSA9IGZ1bmN0aW9uICh2ZWMpIHtcblx0cmV0dXJuIHRoaXMueSAtIHZlYy55O1xufTtcblxuLyoqXG4gKiBTYW1lIGFzIGBkaXN0YW5jZVkoKWAgYnV0IGFsd2F5cyByZXR1cm5zIGFuIGFic29sdXRlIG51bWJlclxuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjMSA9IG5ldyBWaWN0b3IoMTAwLCA1MCk7XG4gKiAgICAgdmFyIHZlYzIgPSBuZXcgVmljdG9yKDIwMCwgNjApO1xuICpcbiAqICAgICB2ZWMxLmRpc3RhbmNlWSh2ZWMyKTtcbiAqICAgICAvLyA9PiAxMFxuICpcbiAqIEBwYXJhbSB7VmljdG9yfSB2ZWN0b3IgVGhlIHNlY29uZCB2ZWN0b3JcbiAqIEByZXR1cm4ge051bWJlcn0gQWJzb2x1dGUgZGlzdGFuY2VcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUuYWJzRGlzdGFuY2VZID0gZnVuY3Rpb24gKHZlYykge1xuXHRyZXR1cm4gTWF0aC5hYnModGhpcy5kaXN0YW5jZVkodmVjKSk7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIGV1Y2xpZGVhbiBkaXN0YW5jZSBiZXR3ZWVuIHRoaXMgdmVjdG9yIGFuZCBhbm90aGVyXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMxID0gbmV3IFZpY3RvcigxMDAsIDUwKTtcbiAqICAgICB2YXIgdmVjMiA9IG5ldyBWaWN0b3IoMjAwLCA2MCk7XG4gKlxuICogICAgIHZlYzEuZGlzdGFuY2UodmVjMik7XG4gKiAgICAgLy8gPT4gMTAwLjQ5ODc1NjIxMTIwODlcbiAqXG4gKiBAcGFyYW0ge1ZpY3Rvcn0gdmVjdG9yIFRoZSBzZWNvbmQgdmVjdG9yXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IERpc3RhbmNlXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLmRpc3RhbmNlID0gZnVuY3Rpb24gKHZlYykge1xuXHRyZXR1cm4gTWF0aC5zcXJ0KHRoaXMuZGlzdGFuY2VTcSh2ZWMpKTtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgc3F1YXJlZCBldWNsaWRlYW4gZGlzdGFuY2UgYmV0d2VlbiB0aGlzIHZlY3RvciBhbmQgYW5vdGhlclxuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjMSA9IG5ldyBWaWN0b3IoMTAwLCA1MCk7XG4gKiAgICAgdmFyIHZlYzIgPSBuZXcgVmljdG9yKDIwMCwgNjApO1xuICpcbiAqICAgICB2ZWMxLmRpc3RhbmNlU3EodmVjMik7XG4gKiAgICAgLy8gPT4gMTAxMDBcbiAqXG4gKiBAcGFyYW0ge1ZpY3Rvcn0gdmVjdG9yIFRoZSBzZWNvbmQgdmVjdG9yXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IERpc3RhbmNlXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLmRpc3RhbmNlU3EgPSBmdW5jdGlvbiAodmVjKSB7XG5cdHZhciBkeCA9IHRoaXMuZGlzdGFuY2VYKHZlYyksXG5cdFx0ZHkgPSB0aGlzLmRpc3RhbmNlWSh2ZWMpO1xuXG5cdHJldHVybiBkeCAqIGR4ICsgZHkgKiBkeTtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgbGVuZ3RoIG9yIG1hZ25pdHVkZSBvZiB0aGUgdmVjdG9yXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMgPSBuZXcgVmljdG9yKDEwMCwgNTApO1xuICpcbiAqICAgICB2ZWMubGVuZ3RoKCk7XG4gKiAgICAgLy8gPT4gMTExLjgwMzM5ODg3NDk4OTQ4XG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBMZW5ndGggLyBNYWduaXR1ZGVcbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gTWF0aC5zcXJ0KHRoaXMubGVuZ3RoU3EoKSk7XG59O1xuXG4vKipcbiAqIFNxdWFyZWQgbGVuZ3RoIC8gbWFnbml0dWRlXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMgPSBuZXcgVmljdG9yKDEwMCwgNTApO1xuICpcbiAqICAgICB2ZWMubGVuZ3RoU3EoKTtcbiAqICAgICAvLyA9PiAxMjUwMFxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gTGVuZ3RoIC8gTWFnbml0dWRlXG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLmxlbmd0aFNxID0gZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55O1xufTtcblxuVmljdG9yLnByb3RvdHlwZS5tYWduaXR1ZGUgPSBWaWN0b3IucHJvdG90eXBlLmxlbmd0aDtcblxuLyoqXG4gKiBSZXR1cm5zIGEgdHJ1ZSBpZiB2ZWN0b3IgaXMgKDAsIDApXG4gKlxuICogIyMjIEV4YW1wbGVzOlxuICogICAgIHZhciB2ZWMgPSBuZXcgVmljdG9yKDEwMCwgNTApO1xuICogICAgIHZlYy56ZXJvKCk7XG4gKlxuICogICAgIC8vID0+IHRydWVcbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuVmljdG9yLnByb3RvdHlwZS5pc1plcm8gPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMueCA9PT0gMCAmJiB0aGlzLnkgPT09IDA7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSB0cnVlIGlmIHRoaXMgdmVjdG9yIGlzIHRoZSBzYW1lIGFzIGFub3RoZXJcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYzEgPSBuZXcgVmljdG9yKDEwMCwgNTApO1xuICogICAgIHZhciB2ZWMyID0gbmV3IFZpY3RvcigxMDAsIDUwKTtcbiAqICAgICB2ZWMxLmlzRXF1YWxUbyh2ZWMyKTtcbiAqXG4gKiAgICAgLy8gPT4gdHJ1ZVxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLmlzRXF1YWxUbyA9IGZ1bmN0aW9uKHZlYzIpIHtcblx0cmV0dXJuIHRoaXMueCA9PT0gdmVjMi54ICYmIHRoaXMueSA9PT0gdmVjMi55O1xufTtcblxuLyoqXG4gKiAjIFV0aWxpdHkgTWV0aG9kc1xuICovXG5cbi8qKlxuICogUmV0dXJucyBhbiBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHZlY3RvclxuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjID0gbmV3IFZpY3RvcigxMCwgMjApO1xuICpcbiAqICAgICB2ZWMudG9TdHJpbmcoKTtcbiAqICAgICAvLyA9PiB4OjEwLCB5OjIwXG4gKlxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuVmljdG9yLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuICd4OicgKyB0aGlzLnggKyAnLCB5OicgKyB0aGlzLnk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYW4gYXJyYXkgcmVwcmVzZW50YXRpb24gb2YgdGhlIHZlY3RvclxuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqICAgICB2YXIgdmVjID0gbmV3IFZpY3RvcigxMCwgMjApO1xuICpcbiAqICAgICB2ZWMudG9BcnJheSgpO1xuICogICAgIC8vID0+IFsxMCwgMjBdXG4gKlxuICogQHJldHVybiB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5WaWN0b3IucHJvdG90eXBlLnRvQXJyYXkgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBbIHRoaXMueCwgdGhpcy55IF07XG59O1xuXG4vKipcbiAqIFJldHVybnMgYW4gb2JqZWN0IHJlcHJlc2VudGF0aW9uIG9mIHRoZSB2ZWN0b3JcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiAgICAgdmFyIHZlYyA9IG5ldyBWaWN0b3IoMTAsIDIwKTtcbiAqXG4gKiAgICAgdmVjLnRvT2JqZWN0KCk7XG4gKiAgICAgLy8gPT4geyB4OiAxMCwgeTogMjAgfVxuICpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblZpY3Rvci5wcm90b3R5cGUudG9PYmplY3QgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB7IHg6IHRoaXMueCwgeTogdGhpcy55IH07XG59O1xuXG5cbnZhciBkZWdyZWVzID0gMTgwIC8gTWF0aC5QSTtcblxuZnVuY3Rpb24gcmFuZG9tIChtaW4sIG1heCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkgKyBtaW4pO1xufVxuXG5mdW5jdGlvbiByYWRpYW4yZGVncmVlcyAocmFkKSB7XG5cdHJldHVybiByYWQgKiBkZWdyZWVzO1xufVxuXG5mdW5jdGlvbiBkZWdyZWVzMnJhZGlhbiAoZGVnKSB7XG5cdHJldHVybiBkZWcgLyBkZWdyZWVzO1xufVxuIl19
