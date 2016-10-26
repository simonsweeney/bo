module.exports = {
    
    find: (world, type) => {
        
        var found = [];
        
        var search = item => {
            
            if ( item.type === type ) found.push( item );
            
            item.children.forEach( search );
            
        }
        
        Array.isArray( world ) ? world.forEach(search) : search(world);
        
        return found;
        
    }
    
}