var vec2 = require('gl-matrix-vec2');
var rAF = require('./lib/rAF.js');
var tween = require('./lib/tween.js');

function createVector( x, y ) {
    
    if(y === undefined) y = x;
        
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
    
    element.style.transform = `translate( ${t[0]}px, ${t[1]}px ) scale( ${s[0]}, ${s[1]} )`;
    
}

function tweenVector( name, vec, to, speed ) {
    
    rAF.stop( name );
    
    var from = vec2.clone( vec );
    var distance = vec2.distance( to, from );
    var duration = Math.abs( distance / speed );
    
    return tween( name, 0, 1, duration, 'cubicInOut', x => {
        vec2.lerp( vec, from, to, x );
    })
    
}

function tweenProperty( name, obj, property, to, speed ) {
    
    rAF.stop( name );
    
    var from = obj[ property ];
    var distance = to - from;
    var duration = Math.abs( distance / speed );
    
    return tween( name, from, to, duration, 'cubicInOut', x => {
        obj[property] = x;
    })
    
}

module.exports = {
    
    createVector,
    
    ensureVector,
    
    translate,
    
    translateAndScale,
    
    tweenVector,
    
    tweenProperty
    
}