var Vector2 = require('victor');

var Camera = require('./camera.js');
var World = require('./world.js');
var Character = require('./character.js');
var player = require('./player.js');

var space = document.querySelector('.space');

module.exports = function( config ) {
    
    var camera = new Camera();
    var world = new World( document.querySelector('.world'), config );
    var character = new Character();
    
    camera.element.addEventListener('click', e => {
        var v = new Vector2( e.clientX, e.clientY );
        character.walkTo( camera.screenToWorld( v ) );
    })
    
    camera.setCenter( new Vector2(0, 0) );
    
    camera.follow( character );
    
    camera.on('move', () => {
        world.checkVisibility( camera.viewport );
    });
    
    var walkable = world.filter( thing => thing.walkable );
    
    character.on('move', () => {
        walkable.forEach( w => w.checkCharacter(character) );
    })
    
    world.checkVisibility( camera.viewport );
    
    character.element.addEventListener( 'click', e => {
        e.stopPropagation();
        player.toggle();
    });
    
    player.on( 'play', () => world.element.classList.add('song-playing') )
    player.on( 'pause', () => world.element.classList.remove('song-playing') )
    
    var cameraScaleLinear = 1;
    
    window.addEventListener('mousewheel', e => {
        
        cameraScaleLinear -= e.deltaY / 5000;
        cameraScaleLinear = Math.max( Math.min( cameraScaleLinear, 1.5 ), 0 );
        
        camera.setScale( Math.pow(cameraScaleLinear, 3) );
        
        space.style.opacity = (camera.scale * 10 - 5) / 5;
        
    })
    
    return {
        world,
        camera,
        character
    }
    
}