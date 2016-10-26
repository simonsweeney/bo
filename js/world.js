var Vector2 = require('./vendor/vector2.js');
var Matrix = require('transformation-matrix-js').Matrix;
var { PREFIXED_TRANSFORM } = require('./lib/utils.js');

var types = {
    Region: require('./types/region.js'),
    Rect: require('./types/rect.js'),
    Ellipse: require('./types/ellipse.js'),
    Text: require('./types/text.js'),
    Image: require('./types/image.js'),
    Song: require('./types/song.js'),
    Sprite: require('./types/sprite.js'),
    Character: require('./types/character.js')
}

var matrix = new Matrix();
var SCALE = new Vector2( 1, .5 );

module.exports = class World {
    
    constructor ( config, context ) {
        
        this.element = context.worldElement;
        this.children = this.create( config.children, context );
        
        this.center = new Vector2();

        //this.regions.forEach( region => this.element.appendChild(region.element) );
        
    }
    
    create ( config, context ) {
        
        return config.map( cfg => {
        
            var Ctor = types[ cfg.type ];
            
            var instance = new Ctor( cfg.attrs, context );
            
            instance.addChildren( this.create( cfg.children, context ) )
            
            return instance;
            
        });
        
    }
    
    find( fn ) {
        
        if( typeof fn === 'string' ) {
            
            var type = fn.toLowerCase();
            
            fn = x => x.getName().toLowerCase() === type;
            
        }
        
        var found = [];
        
        var reducer = (ret, item) => {
            
            if( fn(item) ) ret.push( item );
            
            return item.children.reduce( reducer, ret );
            
        }
        
        return this.children.reduce( reducer, [] );
        
    }
    
    // rotate( a ) {
        
    //     this.angle = a;
        
    //     var t = 200;
        
    //     var translate = new Matrix().translate( -t, -t );
    //     var rotate = new Matrix().rotateDeg( a );
    //     var translateInv = new Matrix().translate( t, t );
        
    //     matrix
    //         .reset()
    //         //.translate( -t, -t )
    //         .rotate( a )
    //     //     .translate( t, t )
            
    //     console.log( matrix.toCSS() );
        
        
    //     //this.element.style.transformOrigin = '200px 200px'
    //     this.element.style[ PREFIXED_TRANSFORM ] = matrix.toCSS3D();
        
    // }
    
}