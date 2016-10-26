var EventEmitter = require('events');
var Vector2 = require('../vendor/vector2.js');
var Box2 = require('../vendor/box2.js');
var { extend } = require('underscore');
var { PREFIXED_TRANSFORM } = require('../lib/utils.js');

module.exports = class Thing extends EventEmitter {
    
    constructor ( attrs, context ) {
        
        super();
        
        attrs = extend( {}, this.getDefaults(), attrs );

        this.position = new Vector2( attrs.x, attrs.y );
        this.size = new Vector2( attrs.width, attrs.height );
        this.box = new Box2();
        this.setBox();
        
        this.children = [];
        this.element = this.createElement( attrs );
        
        if( this.element ) {
            
            this.setStyle( attrs );
            this.positionNeedsUpdate = true;
            this.hide();
            context.worldElement.appendChild( this.element );
            
        }
        
    }
    
    getDefaults() { return {} }
    
    getName () { return 'abstract' }
    
    setStyle ( attrs ) {
        
        this.element.style.backgroundColor = attrs.color;
        
    }
    
    createElement ( attrs ) {
        
        var div = document.createElement('div');
        div.style.width = attrs.width + 'px';
        div.style.height = attrs.height + 'px';
        
        var classes = attrs.classes || [];
        
        div.classList.add( 'thing', 'thing_' + this.getName(), ...classes );
        
        return div;
        
    }
    
    setPosition ( v, y ) {
        
        if( y !== undefined ) v = new Vector2(v, y);
        
        this.position.copy( v );
        
        this.setBox();
        
        if( this.element ) this.positionNeedsUpdate = true;
        
    }
    
    setBox() {
        
        this.box.min = this.position.clone();
        this.box.max = this.box.min.clone().add(this.size);
        
    }
    
    getTransform() {
        
        return `translate(${this.position.x}px, ${this.position.y}px)`;
        
    }
    
    addChildren ( children ) {
        
        this.children = this.children.concat( children );
        
    }
    
    bindToCharacter ( character ) {
        
        this.containsCharacter = false;
        this.visited = false;
        
        character.on( 'move', point => {
            
            var contains = this.containsPoint( point );
            
            if ( contains ) {
                
                if( !this.containsCharacter ) {
                    
                    this.containsCharacter = true;
                    this.emit('characterEnter', point);
                    
                }
                
                this.emit( 'characterMove', point );
                
            } else if( this.containsCharacter ) {
                
                this.containsCharacter = false;
                this.emit('characterLeave', point);
                
            }
            
        });
        
    }
    
    hide () {
        
        this.element.style.display = 'none';
        
    }
    
    show () {
        
        this.element.style.display = 'block';
        
    }
    
};