var DOMParser = require('dom-parser');

function getAttrs(node) {
    
    var ret = {};
    
    var attrs = node.attributes;
    
    for(var i = 0; i < attrs.length; i++) {
        
        var attr = attrs[i];
        var name = attr.name;
        var value = attr.value;
        
        if( name === 'class' ) {
            name = 'classes';
            value = value.split(' ');
        }
        
        if( !isNaN(value) ) value = Number(value);
        
        ret[ name ] = value;
    }
    
    return ret;
    
}

function parseNode(node, i) {
    
    var tag = node.nodeName;
    
    var type = tag[0].toUpperCase() + tag.slice(1).toLowerCase();
    var attrs = getAttrs(node);
    var children = [];
    
    if( type === 'parsererror' ) throw new Error(node.innerText);
    
    if( type === 'Text' ) {
        attrs.content = node.innerHTML;
    } else {
        children = parseDom( node.childNodes );
    }
    
    return { type, attrs, children };
    
}

function parseDom( dom ) {
    
    // nodeType === 3 -> textNode
    // nodeType === 8 -> comment
    
    return [].filter.call( dom, node => node.nodeType !== 3 && node.nodeType !== 8 )
        .map( parseNode )
    
}

module.exports = (xml, tagName) => {
    
    var parser = new DOMParser();
    var dom = parser.parseFromString(xml, "text/xml");
    
    return parseDom( dom.getElementsByTagName( tagName ) );
    
}