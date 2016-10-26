var EventEmitter = require('events');
var Vector2 = require('victor');

var Rectangle = require('./lib/rectangle.js')
var rAF = require('./lib/rAF.js');
var { getTranslate, worldToView, viewToWorld, PREFIXED_TRANSFORM, PREFIXED_TRANSFORM_ORIGIN } = require('./lib/utils.js');

var invert = new Vector2(-1, -1);

var cameraElement = document.querySelector('.camera');

module.exports = class Camera extends EventEmitter {
    
    constructor(  ) {
        
        super();
        
        this.center = new Vector2();
        this.element = cameraElement;
        this.translate = new Vector2();
        this.viewport = new Rectangle();
        this.scale = 1;
        
        window.addEventListener('resize', this.setViewportSize.bind(this) );
        
        this.setViewportSize();
        this.style();
        
    }
    
    setViewportSize() {
        
        var center = this.viewport.center();

        this.viewport.setSizeCenter( new Vector2( window.innerWidth / this.scale, window.innerHeight / this.scale ) );
        
        this.setCenter( center );
        
    }
    
    setCenter( v ) {
        
        this.center.copy(v);
        this.viewport.setCenter( this.center );
        
        this.style();
        
        this.emit('move', this.viewport );
        
        return true;
        
    }
    
    style() {
        
        //var translate = this.position.clone().multiply(invert);
        //var center = this.viewport.center();
        
        this.element.style[ PREFIXED_TRANSFORM ] = getTranslate( -this.viewport.x * this.scale, -this.viewport.y * this.scale ) + 'scale(' + this.scale + ')';
        //this.element.style[ PREFIXED_TRANSFORM_ORIGIN ] = this.center.x + 'px ' + this.center.y + 'px';
        // this.element.style[ PREFIXED_TRANSFORM ] = getTranslate( translate ) + 'scale(' + this.scale + ')';
        // 
        
    }
    
    setScale( x ) {
        
        this.scale = x;
        this.setViewportSize();
        this.style();
        
    }
    
    screenToView( v ) {
        
        var s = new Vector2( this.scale, this.scale );
        
        return new Vector2(this.viewport.x, this.viewport.y)
            .add( v.divide( s ) )//.clone().divide( s ) )
            //.divide( new Vector2( this.scale, this.scale ) );
        
    }
    
    screenToWorld( v ) {
        
        return viewToWorld( this.screenToView( v ) );
        
    }
    
    follow ( thing ) {
        
        rAF.stop( 'cameraMove' );
        
        rAF.start( 'cameraMove', ( now, dT ) => {
            
            var destination = worldToView( thing.position );
            var next = this.viewport.center().mix( destination, .04 );
            
            if ( !this.setCenter( next ) ) {
                
                thing.once('move', this.follow.bind( this, thing ) );
                return false;
                
            };
            
        });
        
    }
    
}