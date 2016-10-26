var Promise = require('promise');
var rAF = require('./lib/rAF.js');
var tween = require('./lib/tween.js');
var vec2 = require('gl-matrix-vec2');
var { translateAndScale, createVector, ensureVector } = require('./utils.js');
var config = require('./config.js');

var camera = document.querySelector('.camera');

var screenCenter = vec2.create();

function onResize(){
    
    vec2.set( screenCenter, window.innerWidth / 2, window.innerHeight / 2 );
    
}

window.addEventListener('resize', onResize);
onResize();

module.exports = {
    
    position: vec2.clone( screenCenter ),
    
    zoom: 1,
    
    windowToScene: function( vIn ) {
        
        var vOut = vec2.create();
        vec2.add( vOut, this.position, vIn );
        vec2.sub( vOut, vOut, screenCenter );
        vec2.multiply( vOut, vOut, createVector( 1 / this.zoom ) );
        return vOut;
        
    },
    
    init: function(){
        
        rAF.start( 'cameraDraw', this.draw.bind(this) );
        
    },
    
    draw: function(){
        
        var transform = vec2.create();
        vec2.negate( transform, this.position );
        vec2.add( transform, transform, screenCenter );
        
        translateAndScale( camera, transform, this.zoom );
        
    },
    
    setPosition: function( x, y ) {
        
        var v = ensureVector( x, y );
        
        vec2.copy( this.position, v );
        
        this.draw();
        
    },
    
    moveTo: function( to ) {
        
        rAF.stop( 'cameraMove' );
        
        var from = vec2.clone( this.position );
        var distance = vec2.distance( to, from );
        var duration = Math.abs( distance / config.CAMERA_PAN_SPEED );
        
        return tween( 'cameraMove', 0, 1, duration, 'cubicInOut', x => {
            vec2.lerp( this.position, from, to, x );
        })
        
    },
    
    zoomTo: function( to ){
        
        rAF.stop( 'cameraZoom' );
        
        var from = this.zoom;
        var distance = to - from;
        var duration = Math.abs( distance / config.CAMERA_ZOOM_SPEED );
        
        return tween( 'cameraZoom', from, to, duration, 'cubicInOut', x => {
            this.zoom = x;
        })
        
    },
    
    fitInWindow: function( box, scale ){
        
        box = vec2.clone(box);
        
        vec2.multiply( box, box, createVector(1/scale) );
        
        var win = createVector( window.innerWidth, window.innerHeight );
        
        this.zoom = scale;

        
        var scale = createVector( Math.min( win[0] / box[0], win[1] / box[1] ) );
        
        var scaledBox = vec2.create();
        vec2.multiply( scaledBox, box, scale );
        
        var offset = createVector( ( win[0] - scaledBox[0] ) / 2, ( win[1] - scaledBox[1] ) / 2);
        
        vec2.negate( offset, offset )
        vec2.add( offset, offset, screenCenter );
        
        return Promise.all([ this.zoomTo( scale[0] ), this.moveTo( offset ) ]);
        
    },
    
    follow: function( v ){
        
        rAF.stop( 'cameraMove' );
        
        rAF.start( 'cameraMove', ( now, dT ) => {
            
            vec2.lerp( this.position, this.position, v, config.CAMERA_FOLLOW_SPEED );
            
        })
        
    }
    
}