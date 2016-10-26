function assign( property, transform ) {
    
    transform = transform || (x => x);
    
    return (value, obj) => obj[ property ] = transform(value, obj);
    
}

function sortInto( property, where, transform ) {
    
    transform = transform || (x => x);
    
    return (value, obj) => {
        
        if( !obj[ where ] ) obj[ where ] = {};
        
        return assign( property, transform )( value, obj[ where ] );
        
    }
    
}

function style( property, transform ){
    
    return sortInto( property, 'style', transform );
    
}

function perType( dict ) {
    
    return ( value, obj, type ) => {
        
        if( type in dict ) {
            dict[type](value, obj);
        } else {
            dict['*'](value, obj);
        }
        
    }
    
}

var map = {
    
    'color': perType({
        'text': style('color'),
        '*': style('backgroundColor')
    }),
    'image': style('backgroundImage', x => 'url(' + x + ')'),
    'class': assign('classes', cls => cls.split(' ')),
    'font': style('fontFamily'),
    'align': style('textAlign'),
    'size': style('fontSize', x => x + 'px'),
    'z': style('zIndex'),
    'src': perType({
        'image': style('backgroundImage', (value, attrs) => {
            console.log(value, attrs);
            return 'url(./assets/' + value + ')';
        }),
        '*': assign('src')
    })
    
}

var transform = obj => {
    
    var ret = {
        type: obj.type,
        things: obj.children.map(transform)
    };
    
    for(var def in obj.attrs) {
        
        var attr = obj.attrs[ def ];

        if( !(def in map) ) {
            
            ret[def] = attr;
            continue;
            
        }
        
        var fn = map[ def ];
        
        fn(attr, ret, obj.type);
        
    }
    
    return ret;
    
}

module.exports = transform;