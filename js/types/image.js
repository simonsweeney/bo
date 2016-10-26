var Rect = require('./rect.js');

module.exports = class Image extends Rect {
    
    constructor( attrs, elements ) {
        
        super(attrs, elements);
        
        this.srcs = attrs.src;
        
    }
    
    getName () { return 'image' }
    
    onCameraMove ( camera ) {
        
        this.element.style.backgroundImage = this.srcs[ this.srcs.length - 1 ];
        
    }
    
}