var Thing = require('./thing.js');
var {getTranslate, worldToView, PREFIXED_TRANSFORM} = require('../../lib/utils.js');

var cameraElement = document.querySelector('.camera');

module.exports = class Sprite extends Thing {
    
    createElement( config ) {
        
        var div = super.createElement(config);
        
        div.style.width = '';
        div.style.height = '';

        cameraElement.appendChild(div);
        
        return div;
        
    }
    
    getTranslate() {
        
        return getTranslate( worldToView( this.position ) );
        
    }
    
}