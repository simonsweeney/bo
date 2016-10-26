var {extend, isFunction} = require('underscore');
var EventEmitter = require('events');
var Vector2 = require('victor');
var Rectangle = require('../../lib/rectangle.js')
var { getTranslate, worldToView, viewToWorld, worldRectViewBounds, PREFIXED_TRANSFORM } = require('../../lib/utils.js');

class Thing extends EventEmitter {
    
    constructor( config, container ) {
        
        super();
        
        config = extend( {}, this.getDefaults(), config );
        
        this.container = container;
        
        this.position = new Vector2(config.x, config.y);
        this.size = new Vector2(config.width, config.height);
        this.center = new Vector2( this.position.x + this.size.x / 2, this.position.y + this.size.y / 2 )
        this.offset = new Vector2(config.offsetX, config.offsetY);
        this.center = new Vector2(
            this.position.x + this.size.x / 2,
            this.position.y + this.size.y / 2
        )
        
        this.rect = new Rectangle( this.position, this.size );
        
        this.element = this.createElement( config );
        this.style( config );
        
        this.viewBounds = this.getViewBounds();
        this.visible = false;
        this.once( 'show', this.emit.bind(this, 'load') );

        for( var key in config.events ) {
            this.on( key, config.events[ key ] );
        }
        
        this.emit('create', config );
        
    }
    
    style ( config ) {
        
        var element = this.element.querySelector('.style-this');
        
        if(!element) element = this.element;
        
        for( var prop in config.style ) {
            element.style[prop] = config.style[prop];
        }
        
    }
    
    getDefaults() {
        
        return {
            position: [0, 0],
            size: [0, 0],
            classes: [],
            style: {},
            events: {},
            content: ''
        }
        
    }
    
    addThings ( things ) {
        
        this.things = things;
        
    }
    
    addClass( ...classes ) {
        this.element.classList.add(...classes);
    }
    
    removeClass( ...classes ) {
        this.element.classList.remove( ...classes );
    }
    
    createElement ( config ) {
        
        var div = document.createElement( config.elementType || 'div' );
        
        div.style.width = this.size.x + 'px';
        div.style.height = this.size.y + 'px';
        var translate = this.position.clone().subtract(this.offset);
        div.style[ PREFIXED_TRANSFORM ] = getTranslate( translate );
        div.classList.add('thing', config.type, ...config.classes);
        
        var content = isFunction(config.content) ? config.content( config ) : config.content;
        
        div.innerHTML = content;
        
        return div;
        
    }
    
    getViewBounds() {
        
        return worldRectViewBounds( this.rect );
        
    }
    
    hide() {
        
        this.element.parentNode.removeChild( this.element );
        
        //this.element.style.display = 'none';
        
    }
    
    show() {
        
        this.container.appendChild( this.element );
        
        //this.element.style.display = 'block';
        
    }
    
    checkVisibility( viewport, visible ) {
        
        if(visible !== true) visible = viewport.intersectsRect( this.viewBounds );
        
        if ( visible ) {
            
            if( !this.visible ) {
                
                this.show();
                this.emit('show');
                this.visible = true;
            
            }
            
            this.things.forEach( thing => thing.checkVisibility( viewport, viewport.containsRect( this.viewBounds ) ) )
            
        } else if ( !visible && this.visible ) {
            
            this.hide();
            this.emit('hide');
            this.visible = false;
            
        }
        
        return visible;
        
    }
    
    checkCharacter( character ) {
        
        
        
    }
    
}

module.exports = Thing;