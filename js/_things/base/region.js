var Thing = require('./thing.js');

module.exports = class Region extends Thing {
    
    createElement( config ){
        
        var el = super.createElement( config );
        
        el.style.width = this.size.x + 1 + 'px';
        el.style.height = this.size.y + 1 + 'px';
        
        return el;
        
    }
    
}