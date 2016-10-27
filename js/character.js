var Sprite = require('./types/sprite.js');
var tween = require('./lib/tween.js');

module.exports = class Character extends Sprite {
    
    constructor ( worldElement, spriteElement ) {
        
        var attrs = {
            x: 0,
            y: 0,
            width: 50,
            height: 100,
            color: 'coral'
        }
        
        super( attrs, { worldElement, spriteElement } );
        
    }
    
    getName() { return 'character' }
    
    walkTo ( to ) {
        
        var from = this.position.clone();
        var distance = from.clone().sub(to).length();
        var duration = Math.abs( distance * 1 );
        
        return tween( 'characterWalk', 0, 1, duration, x => {
            return this.setPosition( from.clone().lerp( to, x ) );
        });
        
    }
    
}