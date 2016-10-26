const Promise = require('promise');

const eases = require('eases');

const rAF = require('./rAF.js');

function tween( name, from, to, duration, easing, cb ){
    
    if( typeof name !== 'string' ) {
        cb = easing;
        easing = duration,
        duration = to;
        to = from;
        from = name;
        name = undefined;
    }
    
    if(!cb){
        cb = easing;
        easing = 'linear';
    }
    
    if(typeof easing === 'string'){
        easing = eases[easing];
    }
    
    const distance = to - from;
        
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    if( name ) rAF.stop( name );

    return new Promise( resolve => {
        
        const ticker = ( now, dT ) => {
            
            if( now < endTime ) {
                
                let progress = ( now - startTime ) / duration;
                
                progress = easing(progress);
                
                return cb( from + distance * progress );
                
            } else {
                
                cb( to );
                
                resolve();
                
                return false;
                
            }
            
        }
        
        if( name ){
            
            rAF.start( name, ticker )
            
        } else {
            
            rAF.start( ticker )
            
        }
    
    });
    
}

tween.stop = function( name ) {
    return rAF.stop(name);
}

module.exports = tween;