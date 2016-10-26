var Thing = require('./thing.js');

module.exports = class Sprite extends Thing {
    
    constructor ( attrs, context ) {
        
        super( attrs, context );
        
        this.isSprite = true;
        this.spriteElement = this.createSpriteElement( attrs );
        this.setSpriteStyle( attrs );
        context.spritesElement.appendChild( this.spriteElement );
        
        this.positionNeedsUpdate = true;
        
    }
    
    createElement() {
        return false;
    }
    
    getDefaults () {
        
        return {
            shadow: true
        }
        
    }
    
    setSpriteStyle ( attrs ) {
        
        this.spriteElement.style.backgroundColor = attrs.color;
        
    }
    
    createSpriteElement ( attrs ) {
        
        var div = document.createElement('div');
        
        div.style.width = attrs.width + 'px';
        div.style.height = attrs.height + 'px';
        
        var classes = attrs.classes || [];
        div.classList.add( 'sprite', 'sprite_' + this.getName(), ...classes );
        
        return div;
        
    }
    
    setPosition(){
        
        super.setPosition(...arguments);
        
        this.positionNeedsUpdate = true;
        
    }
    
}