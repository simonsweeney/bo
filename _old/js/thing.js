var howler = require('howler');
var {createVector, translateAndScale} = require('./utils.js');
var elements = document.querySelectorAll('.touchable');

var touchables = [];

for(var i = 0; i < elements.length; i++){
    
    let element = elements[i];
    
    touchables.push({
        element: element,
        position: createVector( element.offsetLeft, element.offsetTop ),
        size: createVector( element.clientWidth, element.clientHeight )
    })
    
}

//console.log(elements);

module.exports = {
    
    getTouching: function( v ) {
        
        return touchables.filter( t => {
            
            return t.position[0] <= v[0] &&
                t.position[1] <= v[1] &&
                t.position[0] + t.size[0] > v[0] &&
                t.position[1] + t.size[1] > v[1]
                
        })
        
    }
    
}

var vec2 = require('gl-matrix-vec2');
var EventEmitter = require('events');
var $ = require('jquery')
var tween = require('./lib/tween.js');

class Thing extends EventEmitter {
    
    constructor( options ){
        
        super();
        
        this.element = options.element;
        this.$element = $(options.element);
        
        this.size = options.size || createVector( this.element.clientWidth, this.element.clientHeight );
        this.position = options.position || this.getElementPosition();
        this.scale = options.scale || createVector(1);
        
        this.active = false;
        this.visited = false;
        this.dead = false;
        
        this.getBounds();
        this.bindEvents( options.events );
        
        this.emit('create', this);
        
    }
    
    getElementPosition () {
        
        var node = this.element;
        var x = 0;
        var y = 0;
        
        do {
            
            x += node.offsetLeft;
            y += node.offsetTop;
            
            node = node.parentNode;
            
        } while(node.className !== 'map')
        
        return createVector(x, y);
        
    }
    
    getBounds() {
        
        this.bounds = {
            x: this.position[0],
            y: this.position[1],
            r: this.position[0] + this.size[0],
            b: this.position[1] + this.size[1]
        }
        
    }
    
    bindEvents( events ){
        
        if( !events ) return;
        
        for( var name in events ) {
            
            let handler = events[name];
            
            if ( typeof handler === 'string' ) {
                handler = Thing.behaviours[ handler ];
            }
            
            this.on( name, handler );
            
        }
        
    }
    
    containsPoint( v ){
        
        return this.bounds.x <= v[0] &&
            this.bounds.y <= v[1] &&
            this.bounds.r > v[0] &&
            this.bounds.b > v[1];
        
    }
    
    checkCharacter( v ){
        
        var contains = this.containsPoint( v );
        
        if( contains ) {
            if( !this.active ) {
                this.active = true;
                this.element.classList.add('thing_active');
                this.emit('characterEnter', this);
            }
            if( !this.visited ) {
                this.visited = true;
                this.emit('visited', this);
                this.element.classList.add('thing_visited');
            }
        }
        
        if( !contains && this.active ) {
            this.active = false;
            this.element.classList.remove('thing_active');
            this.emit('characterLeave', this);
        }
        
        return contains;
        
    }
    
    setScale(v) {
        
        vec2.copy( this.scale, v );
        
    }
    
    setPosition( v ) {
        
        vec2.copy( this.position, v );
        
        this.render();
        
    }
    
    render(){
        
        translateAndScale( this.element, this.position, this.scale );
        
    }
    
    moveTo( to ) {
        
        var from = vec2.clone( this.position );
        var direction = vec2.create();
        vec2.subtract( direction, to, from );
        var distance = direction.length();
        var duration = Math.abs( distance / this.speed );
        
        return tween( 'moveCharacter', 0, 1, duration, x => {
            vec2.lerp( this.position, from, to, x );
            this.emit('movementStep', this, from, to, direction );
            this.render();
        });

    }
    
}

Thing.behaviours = {
    
    'addClass': {
        'characterEnter': thing => {
            thing.element.classList.add('thing_active')
        }
    },
    
    'toggleClass': {
        'characterEnter': thing => {
            thing.element.classList.add('thing_active')
        },
        'characterLeave': thing => {
            thing.element.classList.remove('thing_active');
        }
    },
    
    'sfx': {
        'create': thing => {
            thing.sound = new howler.Howl({
                src: ['sound/pop.wav']
            });
        },
        'characterEnter': thing => {
            thing.sound.play();
        }
    },
    
    'remove': {
        'visited': thing => {
            setTimeout( () => {
                thing.element.parentNode.removeChild( thing.element )
            }, 2000);
            thing.dead = true;
        }
    }
    
}

Thing.fog = function( map ){
    
    var slices = Math.round( window.innerWidth / 100 );
    var overlap = 1;
    
    var things = [];
    
    var containerSize = map.clientWidth;
    
    var overlapPx = (overlap / slices) * containerSize;
    
    var size = createVector( (containerSize / slices) * (overlap * 2 + 1) );
    
    for(var y = 0; y < slices; y++){
        
        var tileY = (y / slices) * containerSize;
        
        for( var x = 0; x < slices; x++){
            
            var element = document.createElement('div');
            element.className = 'thing thing_remove fog';
            
            var tileX = (x / slices) * containerSize;
            
            element.style.top = tileY + 'px';
            element.style.left = tileX + 'px';
            element.style.width = Math.ceil( containerSize / slices ) + 'px';
            element.style.height = element.style.width;
            
            map.appendChild(element);
            
            things.push(new Thing({
                element,
                events: Thing.classesToEvents('thing_remove'),
                size,
                position: createVector( tileX - overlapPx, tileY - overlapPx )
            }))
            
        }
        
    }
    
    return things;
    
}

Thing.fromDocument = function( selector ){
    
    selector = selector || '.thing';
    
    var elements = document.querySelectorAll( selector );
    
    return Thing.fromElements( elements );
    
}

Thing.classesToEvents = function(...classes){
    
    var events = {};
    
    classes.forEach( cls => {
        
        if( cls === 'thing' ) return;
        
        var parts = cls.split('_');
        
        var verb = parts[1];
        
        var defs = Thing.behaviours[ verb ];
        
        for( var event in defs ) events[ event ] = defs[ event ];
        
    });
    
    return events;
    
}

Thing.fromElements = function( elements, options ) {
    
    return [...elements].map( (element, i) => {
        
        var events = Thing.classesToEvents( ...element.classList );
        
        var defaults = { element, events };
        
        if( options ) {
            
            var opts = options[ i % options.length ];
            
            for(var key in opts){
                defaults[key] = opts[key];
            }
            
        }
        
        return new Thing( defaults )
        
    })
    
}

module.exports = Thing;