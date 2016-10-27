//var embed = require('embed-video');
var Panel = require('./panel.js');

module.exports = class Theater extends Panel {
    
    constructor ( attrs, context ) {
        
        attrs.height = attrs.width * 9 / 16;
        
        super( attrs, context );
        
    }
    
    createSpriteElement ( attrs ) {
        
        var element = super.createSpriteElement( attrs );
        
        element.style.width = this.size.x + 'px';
        element.style.height = this.size.y + 'px';
        
        var iframe = document.createElement('iframe');
        iframe.src = attrs.src;
        element.appendChild(iframe);
        
        return element;
        
    }
    
}