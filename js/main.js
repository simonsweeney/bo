var $ = require('jquery');
require('jquery-mousewheel')($);

var rAF = require('./lib/rAF.js');

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

var character = world.find( 'character' )[0];

var Vector2 = require('./vendor/vector2.js');

window.addEventListener('click', e => {
    
    var mouse = new Vector2( e.clientX, e.clientY );
    
    character.setPosition( camera.screenToWorld( mouse ) );
    
})

$(window).on('mousewheel', e => {
    
    camera.zoomBy( e.deltaY * e.deltaFactor * .0001 );
    
})

rAF.start( (now, dT) => {
    
    camera.setCenter( camera.center.clone().lerp( camera.worldToView( character.position ), .1 ) );
    
    camera.render(world);
    
})

camera.render( world );