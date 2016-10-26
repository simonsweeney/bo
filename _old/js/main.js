var utils = require('./utils.js');
var map = require('./map.js');
var character = require('./character.js');
var camera = require('./camera.js');
var Thing = require('./thing.js');

character.setPosition( map.center );
camera.setPosition( map.center );

camera.init();
camera.follow( character.position );

window.addEventListener('click', function(e){
    
    var v = utils.createVector( e.clientX, e.clientY );
    
    v = camera.windowToScene( v );
    
    if( map.inBounds( v ) ) {
        
        map.ping( v );
        character.walkTo( v );
        
    }
    
})

document.querySelector('.zoom-out').addEventListener('click', function(e){
    
    e.stopPropagation();
    
    map.element.classList.add('map_simple');
    
    camera.fitInWindow( map.size, 3 );
    
})

console.log(map);

var things = Thing.fromDocument().concat( /*Thing.fog( map.element )*/ );

character.onPositionChange( pos => {
    
    pos = map.screenToWorld(pos);
    
    things.forEach( thing => {
        
        thing.checkCharacter( pos );
        
    })
    
    things = things.filter( thing => !thing.dead );
    
//    touchable.getTouching( map.screenToWorld(pos) ).forEach(t => {
//        t.element.classList.add('touchable_active');
//    })
    
})

/*


var Vector = require('victor');
var tween = require('./lib/tween.js');
var distanceEase = require('./lib/distanceEase.js');

var map = document.querySelector('.map');

var { width: MAP_SCREEN_WIDTH, height: MAP_SCREEN_HEIGHT } = map.getBoundingClientRect();

function transformMap( v ) {
    
    //v = screenToMap( v );
    
    position = v;
    
    map.style.transform = MAP_TRANSFORM + ` translate( ${-v.x}px, ${-v.y}px )`;
    
}

var position = new Vector( MAP_SIZE / 2, MAP_SIZE / 2 );

map.addEventListener('click', function(e){
    
    var from = position.clone();
    var to = new Vector( e.offsetX, e.offsetY );
    var distance = to.clone().subtract( from ).length();
    var duration = distance * 1;

    tween( 'moveCharacter', 0, 1, duration, x => {
        var pos = from.clone().mix( to, x );
        transformMap( pos );
    });
    
    ping( to );
    
})



function ping( v ) {
    
    var pinger = document.createElement('div');
    pinger.className = 'ping';
    pinger.style.transform = `translate( ${ v[0] }px, ${ v[1] }px )`;
    map.appendChild( pinger );
    
    setTimeout(() => {
        //map.removeChild( pinger );
    }, 2000)
    
}

//transformMap( position );



window.addEventListener('click', function(e){
    
    vec2.set( mouse, e.clientX, e.clientY );
    
    vec2.transformMat2d( mouse, mouse, matrix );
    
    console.log( mouse[0], mouse[1] );
    
    ping( mouse );
    
})

*/