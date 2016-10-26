var EventEmitter = require('events');
var Vector2 = require('./vendor/vector2.js');
var Box2 = require('./vendor/box2.js');

var config = require('./config.js');

var rAF = require('./lib/rAF.js');
var { PREFIXED_TRANSFORM } = require('./lib/utils.js');

var v1 = new Vector2();

var origin = new Vector2();
var deg45 = Math.PI / 4;
var scale = new Vector2( 1, .5 );
var scaleInv = new Vector2( 1, 2 );

module.exports = class Camera extends EventEmitter {
    
    constructor ( element ) {
        
        super();
        
        this.setMaxListeners( Infinity );
        
        this.element = element;

        this.focus = new Vector2();
        this.center = new Vector2();
        this.viewport = new Box2();
        this.scale = 1;
        this.scaleLinear = 1;
        
        window.addEventListener( 'resize', this.setSize.bind(this) );
        
    }
    
    setBounds( worldBox ) {
        
        var worldViewBox = this.worldToViewBox( worldBox );
        var worldViewSize = worldViewBox.getSize();
        var maxWorldViewSize = new Vector2( window.innerWidth, window.innerHeight ).multiplyScalar( config.MIN_ZOOM_WORLD_SIZE );
        this.viewCenter = new Vector2( 0, worldViewSize.y / 2 );
        this.minScale = Math.min( maxWorldViewSize.x/ worldViewSize.x, maxWorldViewSize.y / worldViewSize.y )
        this.setSize();
        
    }
    
    setSize () {
        
        var size = v1.set( window.innerWidth / this.scale, window.innerHeight / this.scale );
        this.viewport.setFromCenterAndSize( this.center, size );
        this.setFocus(this.focus);
        
    }
    
    setFocus ( v ) {
        
        this.focus = v.clone();
        
        var lerp = Math.max( (1 - this.scale) / (1 - this.minScale), 0 );
        
        var center = this.focus.clone().lerp( this.viewCenter, Math.pow(lerp, 10) );
        
        var d = v1.copy( center ).sub( this.center );
        
        this.center.add( d );
        
        this.viewport.translate( d );
        
    }
    
    setScale ( x ) {
        
        this.scale = Math.max( Math.min( x, config.MAX_ZOOM ), this.minScale );
        this.setSize();
        this.setFocus( this.focus );
        
    }
    
    zoomBy ( amt ) {
        
        if(
            (this.scale === config.MAX_ZOOM && amt < 0) ||
            (this.scale <= this.minScale && amt > 0)
        ) return;
        
        this.scaleLinear -= amt;
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
        
        return v.clone().multiplyScalar(1/this.scale).add( this.viewport.min );
        
    }
    
    screenToWorld ( v ) {
        
        return this.viewToWorld( this.screenToView( v ) );
        
    }
    
    worldToViewBox ( wBox ) {
        
        var corners = [
            wBox.min,
            wBox.max,
            new Vector2( wBox.min.x, wBox.max.y ),
            new Vector2( wBox.max.x, wBox.min.y ),
        ]
        
        return new Box2().setFromPoints( corners.map(this.worldToView) );
        
    }
    
    getWorldCenter(){
        
        return this.viewToWorld( this.center );
        
    }
    
    follow ( thing ) {
        
        rAF.stop( 'cameraMove' );
        
        rAF.start( 'cameraMove', ( now, dT ) => {
            
            var destination = this.worldToView( thing.position );
            var next = v1.copy( this.focus ).lerp( destination, .04 );
            
            this.setFocus( next );

        });
        
    }
    
    update( world ) {
        
        var renderObject = object => {
            
            if( object.positionNeedsUpdate ) {
                
                if( object.isSprite ) {
                    
                    var {x, y} = this.worldToView( object.position );
                    var hw = object.size.x / 2;
                    var h = object.size.y;
                    
                    object.spriteElement.style[ PREFIXED_TRANSFORM ] = `translate(${x - hw}px, ${y - h}px)`;
                    
                    object.viewBox = new Box2(
                        new Vector2( x - hw, y - h ),
                        new Vector2( x + hw, y )
                    )
                    
                    if( object.element ) object.viewBox.union( this.worldToViewBox(object.box) );
                    
                } else {
                    
                    var {x, y} = object.position;
                    
                    object.element.style[ PREFIXED_TRANSFORM ] = `translate(${x}px, ${y}px)`;
                    
                    object.viewBox = this.worldToViewBox( object.box );
                
                }
                
                object.positionNeedsUpdate = false;
            
            }
            
            if( this.viewport.intersectsBox( object.viewBox ) ) {
                
                object.show();
                object.update(this);
                object.children.forEach( renderObject );
                
            } else {
                
                object.hide();
                
            }
            
        }
        
        var x = -this.viewport.min.x * this.scale;
        var y = -this.viewport.min.y * this.scale;
        
        this.element.style[ PREFIXED_TRANSFORM ] = `translate(${x}px, ${y}px) scale(${this.scale})`;

        world.children.forEach( renderObject );
        
    }
    
};