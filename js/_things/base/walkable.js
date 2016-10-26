var Thing = require('./thing.js')

class Walkable extends Thing {
    
    constructor( config, container ) {
        
        super( config, container );
        
        this.walkable = true;
        this.characterOn = false;
        
        this.hitbox = this.rect.clone();
        
        this.hitbox.scale( config.hitboxScale || 1 );
        
    }
    
    checkCharacter( character ) {
        
        if( !this.visible ) return false;
        
        var contains = this.hitbox.containsPoint( character.position );
        
        if( contains ) {
            
            if(!this.characterOn) {
                this.emit( 'characterEnter', character);
                this.characterOn = true;
            }
            
            this.emit('characterMove', character);

        } else if ( !contains && this.characterOn ) {
            
            this.emit('characterLeave', character);
            this.characterOn = false;
            
        }
        
        return contains;
        
    }
    
}

module.exports = Walkable;