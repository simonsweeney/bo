var Sprite = require('./things/base/sprite.js');
var tween = require('./lib/tween');
var { PREFIXED_TRANSFORM } = require('./lib/utils.js');

module.exports = class Character extends Sprite {
    
    constructor(){
        
        super({
            type: 'character',
            x: 10000,
            y: 0
        })
        
    }
    
    moveTo( v, world ){
        
        this.position.copy( v );
        this.element.style[ PREFIXED_TRANSFORM ] = this.getTranslate();
        this.emit('move', this);
    }
    
    walkTo ( to ) {
        
        var from = this.position.clone();
        var distance = from.clone().subtract(to).length();
        var duration = Math.abs( distance * 1 );
        
        return tween( 'characterWalk', 0, 1, duration, x => {
            return this.moveTo( from.clone().mix( to, x ) );
        });
        
    }
    
    stop() {
        
        tween.stop('characterWalk');
        
    }
    
}