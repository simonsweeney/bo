var {createVector, ensureVector} = require('./utils.js');
var mat2d = require('gl-matrix-mat2d');
var vec2 = require('gl-matrix-vec2');

var { MAP_SIZE, MAP_ANGLE } = require('./config.js');

var map = document.querySelector('.map');

var { width: MAP_DIAGONAL_X, height: MAP_DIAGONAL_Y } = map.getBoundingClientRect();

var transformedMapSize = createVector( MAP_DIAGONAL_X, MAP_DIAGONAL_Y );
var transformedCenter = vec2.create();
vec2.multiply( transformedCenter, transformedMapSize, createVector(.5, .5) );

var scale = createVector( 1, 1 / (MAP_DIAGONAL_Y / MAP_DIAGONAL_X) );
var mapCenterInv = createVector( -MAP_SIZE / 2, MAP_SIZE / 2 );

var viewModelMatrix = mat2d.create();

mat2d.translate( viewModelMatrix, viewModelMatrix, mapCenterInv );
mat2d.rotate( viewModelMatrix, viewModelMatrix, -Math.PI / 4 );
mat2d.scale( viewModelMatrix, viewModelMatrix, scale );

var modelViewMatrix = mat2d.create();
mat2d.invert( modelViewMatrix, viewModelMatrix );

function vectorTransformer( matrix ) {
    
    return function( vIn ) {
        
        var vOut = vec2.create();
        
        vec2.transformMat2d( vOut, vIn, matrix );
        
        return vOut;
        
    };
    
}

module.exports = {
    
    element: map,
    
    size: transformedMapSize,
    
    center: transformedCenter,
    
    screenToWorld: vectorTransformer( viewModelMatrix ),
    
    worldToScreen: vectorTransformer( modelViewMatrix ),
    
    inBounds: function( x, y ) {
        
        var [x, y] = this.screenToWorld( x, y )
        
        return x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE;
        
    },
    
    ping: function( x, y ) {
        
        var [x, y] = this.screenToWorld( x, y );
        
        var pinger = document.createElement('div');
        pinger.className = 'ping';
        pinger.style.transform = `translate( ${ x }px, ${ y }px )`;
        //map.appendChild( pinger );
        
        setTimeout( () => {
            
            //map.removeChild( pinger );
            
        }, 2000)
        
    }
    
}