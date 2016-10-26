NodeList.prototype.map = Array.prototype.map;
NodeList.prototype.filter = Array.prototype.filter;
NodeList.prototype.forEach = Array.prototype.forEach;

function attribToStyle( a, s, t ) {
    s = s || a;
    t = t || parseValue;
    return function(from, to){
        var value = from.attributes[ a ];
        if(value === undefined || value.nodeValue === undefined) return undefined;
        to.style[ s ] = t(value.nodeValue);
    }
}

var styles = [
    attribToStyle('x', 'left'),
    attribToStyle('y', 'top'),
    attribToStyle('width'),
    attribToStyle('height'),
    attribToStyle('color', 'backgroundColor'),
    attribToStyle('src', 'backgroundImage', function(v){
        return 'url(' + parseValue(v) + ')';
    })
]

function parseValue( value ) {
    
    var range = value.split('-');
    var list = value.split('|');
    
    if(range.length === 2 && !isNaN(range[0]) && !isNaN(range[1])) {
        value = range[0] + Math.random() * range[1] - range[0];
    } else if( list.length > 1 ) {
        value = list[ Math.floor( Math.random() * list.length ) ]
    }
    
    if( !isNaN(value) ) value += '%';
    
    return value;
    
}

function build(node) {
    
    var div = document.createElement('div');
    
    if(node.tagName === 'text') debugger;
    
    div.className = 'thing ' + node.tagName.toLowerCase();
    
    if( node.attributes.class ) {
        div.className += ' ' + parseValue(node.attributes.class.nodeValue)
    }
    
    styles.forEach(function( fn ){
        fn(node, div);
    });
    
    node.childNodes.filter(function(n){
        return [8, 3].indexOf(n.nodeType) === -1;
    }).forEach(function(n){
        div.appendChild( build(n) );
    })
    
    return div;
    
}

$.get('../world.xml', function(r){
    
    document.body.appendChild( build(r.firstChild) );
    
    // var $world = $(r.firstChild);
    
    // $world.find('*').each(function(){
        
    //     var $this = $(this);
        
    //     Object.keys(styles).forEach(function( attrib ){
            
    //         var value = $this.attr( attrib );
            
    //         if(value === undefined) return;
            
    //         var range = value.split('-');
    //         var list = value.split('|');
            
    //         if(range.length === 2 && !isNaN(range[0]) && !isNaN(range[1])) {
    //             value = range[0] + Math.random() * range[1] - range[0];
    //         } else if( list.length > 1 ) {
    //             value = list[ Math.floor( Math.random() * list.length ) ]
    //         }
            
    //         $this.attr( 'style', 'background-color: red' );
            
    //         //$this.css( styles[attrib], value );
            
    //     })
        
    // })
    
    // console.log($world.html());
    
    // $('body').append($world);
    
})