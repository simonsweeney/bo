var Thing = require('./thing.js');

module.exports = class Ellipse extends Thing {
    
    getName () { return 'ellipse' }
    
    setStyle ( attrs ) {
        
        super.setStyle( attrs );
        
        this.element.style.borderRadius = '50% 50%';
        
    }
    
}