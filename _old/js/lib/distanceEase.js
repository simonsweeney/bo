var easeIn = require('eases').quintIn;

module.exports = function distanceEase( runup, total ) {
        
    runup = Math.min(runup / total, 0.5)
    
    return function(x) {
        
        if( x < runup ) {
            
            console.log('START');
            
            return easeIn( x / runup ) * runup;
            
        } else if ( 1 - x < runup ) {
            
            console.log('END');
            
            return 1 - easeIn( (1 - x) / runup ) * runup;
            
        } else {
            
            console.log('MIDDLE');
            
            return x;
            
        }
        
    }
    
}