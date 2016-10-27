var Sprite = require('./sprite.js');

var Vector2 = require('../vendor/vector2.js');
var Box2 = require('../vendor/box2.js');
var { PREFIXED_TRANSFORM } = require('../lib/utils.js');

var SKEW_ANGLE = Math.atan2(1, 2);

module.exports = class Panel extends Sprite {
    
    getName() { return 'panel' }
    
    getDefaults () {
        return {direction: 'left', shadow: true}
    }
    
    createElement () {
        
        var div = document.createElement('div');
        div.classList.add('thing', 'thing_sprite-shadow');
        div.style.width = this.size.x + 'px';
        div.style.height = this.size.y * 1.5 + 'px';
        return div;
        
    }
    
    updatePosition ( camera ) {
        
        var {x, y} = camera.worldToView( this.position );
        var hw = this.size.x / 2;
        var h = this.size.y;
        var skew = this.attrs.direction === 'left' ? -SKEW_ANGLE : SKEW_ANGLE;
        
        this.spriteElement.style[ PREFIXED_TRANSFORM ] = `translate(${x - hw}px, ${y - h}px) skewY(${skew}rad)`;
        
        this.viewBox = new Box2(
            new Vector2( x - hw, y - h ),
            new Vector2( x + hw, y )
        )
        
        this.viewBox.union( camera.worldToViewBox(this.box) );
        
        var shadowX = this.position.x - hw;
        var shadowY = this.position.y - this.size.y * 1.5;
        
        this.element.style[ PREFIXED_TRANSFORM ] = `translate(${shadowX}px, ${shadowY}px)`;
        
        this.viewBox.union( camera.worldToViewBox(this.box) );

        
    }
    
    createSpriteElement () {
        
        var element = super.createSpriteElement( this.attrs );
        
        element.classList.add( 'sprite_panel_' + this.attrs.direction );
        
        return element;
        
    }
    
}