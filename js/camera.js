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
        this.scaleLinear = 1;

        window.addEventListener( 'resize', this.setSize.bind(this) );
        
        this.setSize();
        
    }
    
    setSize () {
        
        var size = v1.set( window.innerWidth / this.scale, window.innerHeight / this.scale );
        this.viewport.setFromCenterAndSize( this.center, size );
        
    }
    
    setCenter ( v ) {
        
        var d = v1.copy( v ).sub( this.center );
        
        this.center.copy( v );
        
        this.viewport.translate( d );
        
    }
    
    moveCenter( x, y ) {
        
        this.setCenter( this.center.clone().add( new Vector2(x, y) ) );
        
    }
    
    setScale ( x ) {
        
        this.scale = x;
        this.setSize();
        
    }
    
    zoomBy ( amt ) {
        
        this.scaleLinear -= amt;
        this.scaleLinear = Math.max( Math.min( this.scaleLinear, 1.5 ), 0.25 );
        
        this.setScale( Math.pow(this.scaleLinear, 3) );
        
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
    
    screenToView ( v ) {
        
        return v.clone().multiplyScalar(this.scale).add( this.viewport.min );
        
    }
    
    screenToWorld ( v ) {
        
        return this.viewToWorld( this.screenToView( v ) );
        
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
        
        var x = -this.viewport.min.x * this.scale;
        var y = -this.viewport.min.y * this.scale;
        
        this.element.style[ PREFIXED_TRANSFORM ] = `translate(${x}px, ${y}px) scale(${this.scale})`;
        
        renderObject( world );
        
    }
    
};