var XMLToObj = require('./lib/xml.js');
var transform = require('./lib/transform.js');
var objToConfig = require('./lib/sort.js');

var transforms = require('./transforms.js');

module.exports = function ( xml ) {
    
    var obj = XMLToObj( xml );
    var transformed = transform( obj, transforms );
    var config = objToConfig( transformed );
    
    return config;
    
}