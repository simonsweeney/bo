var Vector2 = require('victor');

class Rectangle {
    
    constructor ( position, size ) {
        
        if( position === undefined ) position = new Vector2();
        if( size === undefined ) size = new Vector2();
        
        this.x = position.x;
        this.y = position.y;
        this.w = size.x;
        this.h = size.y;
        this.getRB();
        
    }
    
    getRB () {
        this.r = this.x + this.w;
        this.b = this.y + this.h;
    }
    
    clone() {
        
        return new Rectangle( 
            new Vector2( this.x, this.y ),
            new Vector2( this.r - this.x, this.b - this.y )
        );
        
    }
    
    setPosition( v ) {
        this.x = v.x;
        this.y = v.y;
        this.getRB();
    }
    
    setSize( v ) {
        this.w = v.x;
        this.h = v.y;
        this.getRB();
    }
    
    center(){
        return new Vector2( this.x + this.w / 2, this.y + this.h/2 );
    }
    
    setCenter( v ) {
        
        return this.setPosition( new Vector2( v.x - this.w/2, v.y - this.h/2 ) );
        
    }
    
    containsPoint( v ) {
        
        return v.x >= this.x && v.y >= this.y && v.x < this.r && v.y < this.b;
        
    }
    
    intersectsRect( r ) {
        
        return r.x < this.r &&
           r.r > this.x &&
           r.y < this.b &&
           r.b > this.y;
        
    }
    
    containsRect( r ) {
        
        return this.x < r.x &&
            this.r > r.r &&
            this.y < r.y &&
            this.b > r.b;
        
    }
    
    scale( x ) {
        
        return this.setSizeCenter( new Vector2(
            this.w * x,
            this.h * x
        ))
        
    }
    
    setSizeCenter( v ) {
        
        this.x += (this.w - v.x) / 2;
        this.y += (this.h - v.y) / 2;
        this.w = v.x;
        this.h = v.y;
        this.getRB();
        
    }
    
}

module.exports = Rectangle;