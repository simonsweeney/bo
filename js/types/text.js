var Rect = require('./rect.js');

module.exports = class Text extends Rect {
    
    getName () { return 'text' }
    
    getDefaults () {
        
        return {
            size: 'inherit',
            color: 'inherit',
            font: 'inherit',
            align: 'inherit'
        }
        
    }
    
    createElement ( attrs ) {
        
        var div = super.createElement( attrs );
        div.innerHTML = attrs.content;
        return div;
        
    }
    
    setStyle ( attrs ) {
        
        this.element.style.color = attrs.color;
        this.element.style.fontFamily = attrs.font;
        this.element.style.fontSize = attrs.size + 'px';
        this.element.style.textAlign = attrs.align;
        
    }
    
}