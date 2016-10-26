var EventEmitter = require('events');
var vec2 = require('gl-matrix-vec2');

var rAF = require('./lib/rAF.js');

var config = require('./config.js');
var {createVector, ensureVector, translateAndScale, tweenVector, tweenProperty} = require('./utils.js');

var screenCenter = vec2.create();

function onResize(){
    
    vec2.set( screenCenter, window.innerWidth / 2, window.innerHeight / 2 );
    
}

window.addEventListener('resize', onResize);
onResize();

class Renderer extends EventEmitter {
    
    constructor( map, objects ) {
        
        super();
        
        this.map = map;
        this.objects = objects;
        
        this.cameraCenter = vec2.create();
        this.cameraZoom = createVector(1);
        this.lod = 1;
        
        this.element = document.querySelector('.camera');
        
    }
    
    getWorldCoordinates ( screenCoordinates ) {
        
        var vOut = vec2.create();
        vec2.add( vOut, this.position, screenCoordinates );
        vec2.sub( vOut, vOut, screenCenter );
        vec2.multiply( vOut, vOut, createVector( 1 / this.zoom ) );
        return vOut;
        
    }
    
    getMapCoordinates ( screenCoordinates ) {
        
        return this.map.getMapCoordinates( this.getWorldCoordinates( screenCoordinates ) );
        
    }
    
    render () {
        
        var transform = vec2.create();
        vec2.negate( transform, this.cameraCenter );
        vec2.add( transform, transform, screenCenter );
        
        translateAndScale( this.element, transform, this.cameraZoom );
        
    }
    
    setCenter ( to ) {
        
        vec2.copy( this.cameraCenter, to );
        
    }
    
    setZoom ( to ) {
        
        if( !to.length ) to = createVector(to);
        
        vec2.copy( this.zoom, to );
        
    }
    
    moveTo ( to ) {
        
        return tweenVector( 'cameraMove', this.cameraCenter, to, config.CAMERA_PAN_SPEED );
        
    }
    
    zoomTo ( to ) {
        
        if( !to.length ) to = createVector(to);
        
        return tweenProperty( 'cameraZoom', this, 'cameraZoom', to, config.CAMERA_ZOOM_SPEED );
        
    }
    
    follow ( what ) {
        
        rAF.stop('cameraMove');
        
        rAF.start( 'cameraMove', ( now, dT ) => {
            
            vec2.lerp( this.position, this.position, what, config.CAMERA_FOLLOW_SPEED );
            
        })
        
    }
    
}