var Vector2 = require('victor');
var Rectangle = require('./rectangle.js');
var { worldToView } = require( './utils.js' );

class Diamond {
    
    constructor ( rect ) {
        
        this.worldRect = rect.clone();
        
        this.top = worldToView( new Vector2( rext.x, rect.y ) );
        this.left = worldToView( new Vector2( rect.x, rect.b ) );
        this.right = worldToView( new Vector2( rect.r, rect.y ) );
        this.bottom = worldToView( new Vector2( rect.r, rect.b ) );
        
        this.bounds = new Rectangle(
            new Vector2( left.x, top.y ),
            new Vector2( right.x - left.x, bottom.y - top.y )
        );
        
    }
    
    intersects ( diamond ) {
        
        return 
            this.bounds.intersectsRect( rect ) ||
            (
                
            )
        
    }
    
}

    var top = new Vector2( rect.x, rect.y );
    var left = new Vector2( rect.x, rect.b );
    var right = new Vector2( rect.r, rect.y );
    var bottom = new Vector2( rect.r, rect.b );
    
    top = worldToView(top);
    left = worldToView(left);
    right = worldToView(right);
    bottom = worldToView(bottom);
    
    return new Rectangle(
        new Vector2( left.x, top.y ),
        new Vector2( right.x - left.x, bottom.y - top.y )
    );