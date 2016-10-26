var EventEmitter = require('events');
var {ensureVector} = require('./utils.js');
var vec2 = require('gl-matrix-vec2');
var tween = require('./lib/tween.js');
var config = require('./config');

var element = document.querySelector('.character');

var events = new EventEmitter();

module.exports = {
    
    position: vec2.create(),
    
    setPosition: function( x, y ){
        
        var v = ensureVector( x, y );
        
        vec2.copy( this.position, v );
        
        this.draw();
        
    },
    
    draw: function( v ) {
        
        var [x, y] = this.position;
        
        element.style.transform = `translate( ${ x }px, ${ y }px )`;
        
        events.emit( 'positionChange', this.position );
        
    },
    
    onPositionChange: function( fn ){
        
        events.on('positionChange', fn);
        
    },
    
    walkTo: function( to ) {
        
        var from = vec2.clone( this.position );
        var distance = vec2.distance( to, from );
        var duration = Math.abs( distance / config.CHARACTER_WALK_SPEED );
        
        return tween( 'moveCharacter', 0, 1, duration, x => {
            vec2.lerp( this.position, from, to, x );
            this.draw();
        });
        
    },
    
    walkToPoints: function( ...points ) {
        
        var promise;
        
        points.forEach( point => {
            
            if( !promise ) {
                
                promise = this.walkTo( point );
                
            } else {
                
                promise.then( () => {
                    
                    return this.walkTo( point );
                    
                })
                
            }
            
        })
        
    }
    
}