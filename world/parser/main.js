var parseXML = require('./xml.js');
var transforms = require('./transform.js');
var config = require('./config.js');

module.exports = xml => {
        
    var world = parseXML( xml, config.ROOT_ELEMENT )[0];
    
    transforms.forEach( fn => fn(world) );
    
    return world;
    
}