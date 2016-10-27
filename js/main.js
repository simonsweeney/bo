var $ = require('jquery');
require('jquery-mousewheel')($);

var rAF = require('./lib/rAF.js');

var Camera = require('./camera.js');
var World = require('./world.js');
var Character = require('./character.js');

var data = require('./world.json');

var cameraElement = document.querySelector('.camera');
var worldElement = document.querySelector('.world');
var spriteElement = document.querySelector('.sprites');

var character = new Character( worldElement, spriteElement );
var camera = new Camera( cameraElement );

var context = {
    worldElement,
    spriteElement,
    character,
    camera
}

var world = new World( data, context );

world.children.push(character);

camera.setBounds( world.box );

var Vector2 = require('./vendor/vector2.js');
var winSize = new Vector2();

window.addEventListener('click', e => {
    
    var mouse = new Vector2( e.clientX, e.clientY );
    
    character.walkTo( camera.screenToWorld( mouse ) );

});

window.addEventListener('mousewheel', e => {
    
    camera.zoomBy( e.deltaY * .0001 );
    
})

camera.follow( character );

rAF.start( now => camera.update( world ) );