NodeList.prototype.filter = Array.prototype.filter;
NodeList.prototype.map = Array.prototype.map;

function getAttrs(node) {
    
    var ret = {};
    
    var attrs = node.attributes;
    
    for(var name in attrs) {
        var attr = attrs[name];
        if (typeof attr.nodeValue !== 'undefined') {
            var value = attr.nodeValue;
            if( !isNaN(value) ) value = Number(value);
            ret[ attr.nodeName ] = value;
        }
    }
    
    return ret;
    
}

function parseNode(node, i) {
    
    var type = node.tagName.toLowerCase()
    var attrs = getAttrs(node);
    var children = [];
    
    if( type === 'parsererror' ) throw new Error(node.innerText);
    
    if( type === 'container' || type === 'text' ) {
        attrs.content = node.innerHTML;
    } else {
        children = parseDom( node.childNodes );
    }
    
    return { type, attrs, children };
    
}

function parseDom( dom ) {
    
    // nodeType === 3 -> textNode
    // nodeType === 8 -> comment
    
    return dom
        .filter( node => node.nodeType !== 3 && node.nodeType !== 8 )
        .map( parseNode )
    
}

module.exports = xml => {
    
    var parser = new DOMParser();
    var dom = parser.parseFromString(xml, "text/xml");
    
    return parseNode( dom.firstChild );
    
}