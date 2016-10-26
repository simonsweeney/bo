var Vector2 = require('../vendor/vector2.js');

var DEG_45 = Math.PI / 4;
var SCALE = new Vector2( 1, .5 );
var SCALE_INV = new Vector2( 1, 2 );

module.exports = class World {
    
    constructor ( config, context ) {
        
        this.element = context.worldElement;
        
        this.regions = this.create( config, context );
        
    }
    
    create ( config, context ) {
        
        return config.map( cfg => {
        
            var Ctor = types[ cfg.type ];
            
            var instance = new Ctor( cfg.attrs, context );
            
            instance.addChildren( this.create( cfg.children, context ) )
            
            return instance;
            
        });
        
    }
    
    viewToWorld ( v ) {
        
        return v.clone().multiply(  )
        
    }
    
}