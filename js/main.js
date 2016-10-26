var Camera = require('./camera.js');
var World = require('./world.js');

var data = require('./world.json');

var camera = new Camera( document.querySelector('.camera') )

var context = {
    worldElement: document.querySelector('.world'),
    spritesElement: document.querySelector('.sprites'),
    camera
}

var world = new World( data, context );

var Vector2 = require('./vendor/vector2.js');

camera.render( world );