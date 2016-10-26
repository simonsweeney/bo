var {extend, mapObject} = require('underscore');

var Thing = require('./things/base/thing.js');
var Sprite = require('./things/base/sprite.js');
var Region = require('./things/base/region.js');
var Walkable = require('./things/base/walkable.js');

var ctors = {
    Thing,
    Sprite,
    Region,
    Walkable
}

var types = {
    region: {
        inherits: 'Region'
    },
    button: require('./things/button.js'),
    spinner: require('./things/spinner.js'),
    container: require('./things/container.js')
}

types = mapObject(types, type => {
    
    type.ctor = ctors[type.inherits] || Thing;
    
    return type;
    
})

class World {
    
    constructor ( container, defs ) {
        
        this.things = this.create( defs, container );
        
    }
    
    create ( defs, container ) {
        
        return defs.map( (def, i) => {
            
            var type = types[ def.type ];
            
            if(!type) throw new Error( def.type + ' is not a thing' );
            
            var config = extend( {}, type, def );
            
            var thing = new type.ctor( config, container, i );
            
            thing.addThings( this.create( def.things, thing.element ) );
            
            return thing;
            
        })
        
    }
    
    getInheritance( def, ret ) {
        
        ret = ret || { inherits: [] };
        
        var name = def.inherits;
        
        if( ctors[ name ] ) {
            
            ret.ctor = ctors.name;
            
            return ret;
            
        }
        
        if( types[ name ] ) {
            
            ret.inherits.push( types[ name ] );
            
            return this.getInheritance( types[ name ] )
            
        };
        
        return Thing;
        
    }
    
    forEach ( fn, list ) {
        
        list = list || this.things;
        
        list.forEach( thing => {
            fn(thing);
            this.forEach( fn, thing.things );
        })
        
    }
    
    filter ( fn ) {
        
        var found = [];
        
        this.forEach( thing => {
            
            if( fn( thing ) ) found.push(thing);
            
        })
        
        return found;
        
    }
    
    untilFalse ( fn, list ) {
        
        list = list || this.things;
        
        return list.some( thing => {
            var result = fn( thing );
            if( result === false ) return true;
            this.untilFalse( fn, thing.things );
        })

        
    }
    
    checkVisibility( viewport ) {
        
        this.things.forEach( thing => {
            thing.checkVisibility( viewport );
        });
        
    }
    
    checkCharacter( character ) {
        
        return this.things.forEach( thing => thing.checkCharacter( character ) );
        
    }
    
}

module.exports = World;