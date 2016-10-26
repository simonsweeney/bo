var player = require('../player.js');

module.exports = {
    
    inherits: 'Walkable',
    
    width: 400,
    
    height: 400,
    
    content: cfg => `
        <div class="song__inner"></div>
        <span class="song__title">${cfg.title}</span>
    `,
    
    events: {
        
        create: function( config ) {
            
            this.songSrc = config.src;
            this.songTitle = config.title;
            this.timerId = false;
            
            player.on('play', name => {
                if(name === this.songTitle) this.element.classList.add('song_playing');
            })
            
            player.on('pause', name => {
                if(name === this.songTitle) this.element.classList.remove('song_playing');
            })
            
        },
        
        characterEnter: function(){
            
            if( player.soundName === this.songTitle ) return;
            
            this.element.classList.add('song_active');
            
            this.timerId = setTimeout(() => {
                
                player.load( this.songSrc, this.songTitle, this.element );

            }, 3000)
            
        },
        
        characterLeave: function(){
            
            if( player.soundName === this.songTitle ) return;
            
            clearTimeout(this.timerId);
            
            this.element.classList.remove('song_active');
            
        }
        
    }
    
}