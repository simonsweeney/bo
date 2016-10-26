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