var howler = require('howler');

module.exports = {
    
    inherits: 'Walkable',
    
    events: {
        
        create: function( config ){
        
            this.sound = new howler.Howl({
                src: [config.src],
                preload: false
            })
            
        },
        
        load: function(){

            this.sound.load();
            
        },
        
        characterEnter: function() {
            
            this.sound.play();
            
        }
        
    }
    
}