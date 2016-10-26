var {isArray} = require('underscore');

function transformItems( items, fns ) {
    
    var ret = [];
    
    items.forEach( (item, itemIdx) => {
        
        for( var i = 0; i < fns.length; i++ ) {
            
            var fn = fns[ i ];
            
            var value = fn( item, itemIdx );
            
            if( isArray( value ) ) {
                
                ret = ret.concat( transformItems( value, fns ) );
                
                return;
                
            }
            
            item = value;
            
        }
        
        ret.push( item );
        
    })
    
    return ret;
    
}

function walk( items, fns ) {
    
    items = transformItems( items, fns );
    
    items.forEach( item => {
        item.children = walk( item.children, fns );
    });
    
    return items;
    
}

module.exports = function ( root, fns ) {
    
    fns = fns.map( fn => {
        
        if( fn.selector ) {
            
            return item => {
                
                if( item.type === fn.selector ) {
                    
                    return fn.transform( item );
                    
                } else {
                    
                    return item;
                    
                }
                
            }
            
        } else {
            
            return fn.transform;
            
        }
        
    })
    
    fns.forEach( (fn, i) => {
        
        root = fn( root, i );
        
    })
    
    root.children = walk( root.children, fns );
    
    return root;
    
};