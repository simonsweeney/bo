var Rect = require('./rect.js');

module.exports = class Image extends Rect {
    
    constructor( attrs, elements ) {
        
        super(attrs, elements);
        
        this.srcs = attrs.src;
        this.src = '';
        
    }
    
    getName () { return 'image' }
    
    createElement ( attrs ) {
        
        return super.createElement( attrs, 'img' );
        
    }
    
    update ( camera ) {
        
        if(this.src) return;
        
        this.src = this.srcs[ this.srcs.length - 1 ];
        
        this.element.src = this.src;
        
    }
    
}