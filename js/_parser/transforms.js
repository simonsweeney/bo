var parseXML = require('./lib/xml.js');

var {isString, clone, range, mapObject, template} = require('underscore');

var {WORLD_SIZE, TILE_SIZE} = require('../config.js');

function inheritPosition( parent, child ) {
    
    child.attrs.x += parent.attrs.x;
    child.attrs.y += parent.attrs.y;
    
}

function cloneItem( item ) {
    
    return {
        type: item.type,
        attrs: clone( item.attrs ),
        children: item.children.map( cloneItem )
    }
    
}

function generateClones( item ) {
    
    var models = item.children;
    
    return range( item.attrs.num ).map(i => {
        
        var clone = cloneItem( models[ i % models.length ] );
        
        //inheritPosition( item, clone );
        
        return clone;
        
    });
    
}

function rangeAdd( value, add ) {
    
    if( isString(value) ) {
        
        value = value.split('-');
        
        var min = value[0] + add;
        var max = value[1] + add;
        
        return min + '-' + max;
        
    } else {
        
        return value + add;
        
    }
    
}

function random(min, max) {
    
    return min + Math.random() * (max - min);
    
}

function getGeneratedAttr( attr ) {
    
    if( !isString(attr) ) return attr;
    
    var range = attr.split('-');
    
    if( range.length === 2 ) {
        
        if( isNaN( range[0] ) || isNaN(range[1]) ) return attr;
        
        var min = Number(range[0]);
        var max = Number(range[1]);
        
        return random(min, max);
        
    }
    
    var options = attr.split('|')
    
    if( options.length > 1 ) {
        
        return options[ Math.floor( Math.random() * options.length ) ];
        
    }
    
    return attr;
    
}

var aliases = mapObject(
    {
        // image: {
        //     template: "<thing class='image' image='<%= src %>'></thing>",
        //     copyPosition: true
        // }
    }, o => {
        o.template = template(o.template);
        return o;
    })

module.exports = [
    
    // templates
    
    {
        
        transform: item => {
            
            if( item.type in aliases ) {
                
                var alias = aliases[ item.type ];
                
                var template = alias.template( item.attrs );
                
                var newItem = parseXML( template );
                
                newItem.attrs.x = item.attrs.x;
                newItem.attrs.y = item.attrs.y;
                newItem.attrs.width = item.attrs.width;
                newItem.attrs.height = item.attrs.height;
                
                return newItem;
                
            }
            
            return item;
            
        }
        
    },
    
    // defaults
    
    {
        transform: (item, i) => {
            
            var a = item.attrs;
            
            if( !a.x ) a.x = 0;
            if( !a.y ) a.y = 0;
            
            if( !a.width ) a.width = 0;
            
            if( !a.height && !isNaN(a.width) )
                a.height = a.width;
                
            if( !a.z !== undefined ) a.z = i;
            
            return item;
            
        }
        
    },
    
    // generation
    
    {
        
        selector: 'world',
        transform: item => {
            
            item.children.forEach( (item, i) => {
                
                item.attrs.width = TILE_SIZE;
                item.attrs.height = TILE_SIZE;
                
                item.attrs.x = (i % WORLD_SIZE) * TILE_SIZE;
                item.attrs.y = Math.floor( i / WORLD_SIZE ) * TILE_SIZE
                
            })
            
            return item;
            
        }
        
    }, {
        
        selector: 'generator',
        transform: item => {
            
            return generateClones(item).map( clone => {
                
                var w = getGeneratedAttr( clone.attrs.width );
                var h = clone.attrs.height ? getGeneratedAttr( clone.attrs.height ) : w;
                
                w = (w/100) * item.attrs.width;
                h = (h/100) * item.attrs.height;
                
                var minX = item.attrs.x;
                var maxX = item.attrs.x + item.attrs.width - w;
                
                var minY = item.attrs.y;
                var maxY = item.attrs.y + item.attrs.height - h;
                
                clone.attrs.x = random( minX, maxX );
                clone.attrs.y = random( minY, maxY );
                
                clone.attrs.width = w;
                clone.attrs.height = h;
                
                return clone;
                
            });
            
        }
        
    }, {
        
        selector: 'grid',
        transform: item => {
            
            var x = item.attrs.x;
            var y = item.attrs.y;
            
            var rows = item.attrs.rows;
            var columns = item.attrs.columns;
            
            var rowSize = item.attrs.height / rows;
            var columnSize = item.attrs.width / columns;
            
            return generateClones(item)
                .map( (clone, i) => {
                    
                    var offsetX = i % columns * columnSize;
                    var offsetY = Math.floor( i / rows ) * rowSize;
                    
                    debugger;
                    
                    item.attrs.x = rangeAdd( x, offsetX );
                    item.attrs.y = rangeAdd( y, offsetY );
                    
                    return item;
                    
                })
            
        }
        
    },{
        
        transform: item => {
            
            for( var a in item.attrs ) {
                
                item.attrs[a] = getGeneratedAttr( item.attrs[a] );
                
            }
            
            return item;
            
        }
        
    },
    
        // % scale
    
    {
        
        transform: item => {
            
            if( item.type === 'world' ) return item;
            
            item.children.forEach( child => {
                
                child.attrs.x = (child.attrs.x / 100) * item.attrs.width;
                child.attrs.y = (child.attrs.y / 100) * item.attrs.height;
                
                child.attrs.width = (child.attrs.width / 100) * item.attrs.width;
                child.attrs.height = (child.attrs.height / 100) * item.attrs.height;
                
            })
            
            return item;
            
        }
        
    }
    
];