var Vector2 = require('victor');

var {PREFIXED_TRANSFORM} = require('../lib/utils.js');

function rotate(element, deg) {
    element.style[PREFIXED_TRANSFORM] = 'translate(-50%, -50%) rotate(' + deg + 'deg)';
}

module.exports = {
    
    inherits: 'Walkable',
        
    hitboxScale: 10,
    
    content: '<div class="style-this"></div>',
    
    events: {
        
        create: function() {
            
            this.spinner = this.element.childNodes[0];
            this.element.appendChild( this.spinner );
            
            rotate( this.spinner, Math.random() * 360 );
            
        },
        
        characterMove: function( character ){
            
            var deg = this.center.clone().subtract(character.position).angleDeg();
            
            rotate(this.spinner, deg);
            
        }
        
    }
    
}