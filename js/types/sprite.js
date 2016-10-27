var Thing = require('./thing.js');
var Vector2 = require('../vendor/vector2.js');
var Box2 = require('../vendor/box2.js');
var { PREFIXED_TRANSFORM } = require('../lib/utils.js');

module.exports = class Sprite extends Thing {
    
    constructor ( attrs, context ) {
        
        super( attrs, context );
        
        this.isSprite = true;
        this.spriteElement = this.createSpriteElement( attrs );
        this.setSpriteStyle( attrs );
        context.spriteElement.appendChild( this.spriteElement );
        
        this.positionNeedsUpdate = true;
        
    }
    
    getDefaults () {
        
        return {
            shadow: true
        }
        
    }
    
    createElement () {
        
        if( this.attrs.shadow ) {
            
            var div = document.createElement('div');
            div.classList.add('thing', 'thing_sprite-shadow');
            div.style.width = this.size.x + 'px';
            div.style.height = this.size.y * 1.5 + 'px';
            return div;
            
        } else {
            
            return false;
            
        }
        
    }
    
    setStyle () {}
    
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
    
    updatePosition ( camera ) {
        
        var {x, y} = camera.worldToView( this.position );
        var hw = this.size.x / 2;
        var h = this.size.y;
        
        this.spriteElement.style[ PREFIXED_TRANSFORM ] = `translate(${x - hw}px, ${y - h}px)`;
        
        this.viewBox = new Box2(
            new Vector2( x - hw, y - h ),
            new Vector2( x + hw, y )
        )
        
        if( this.element ) {
            
            x = this.position.x - hw;
            y = this.position.y - this.size.y * 1.5;
            
            this.element.style[ PREFIXED_TRANSFORM ] = `translate(${x}px, ${y}px)`;
            
            this.viewBox.union( camera.worldToViewBox(this.box) );
            
        }
        
    }
    
    hide () {
        
        this.spriteElement.style.display = 'none';
        
        if(this.element) this.element.style.display = 'none';
        
    }
    
    show () {
        
        this.spriteElement.style.display = 'block';
        
        if(this.element) this.element.style.display = 'block';
        
    }
    
}