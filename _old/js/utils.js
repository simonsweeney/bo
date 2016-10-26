var vec2 = require('gl-matrix-vec2');

function createVector( x, y ) {
    
    if( x === undefined ) x = 0;
    if( y === undefined ) y = x;
    
    var v = vec2.create();
    vec2.set( v, x, y );
    return v;
    
}

function ensureVector( x, y ) {
    
    if( y === undefined ) {
        
        return x;
        
    } else {
        
        return createVector( x, y );
        
    }
    
}

function translate( element, v ) {
    
    element.style.transform = `translate( ${v[0]}px, ${v[1]}px )`;
    
}

function translateAndScale( element, t, s ) {
    
    element.style.transform = `translate( ${t[0]}px, ${t[1]}px ) scale( ${s} )`;
    
}

module.exports = {
    
    createVector,
    
    ensureVector,
    
    translate,
    
    translateAndScale
    
}