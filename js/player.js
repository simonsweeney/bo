var EventEmitter = require('events');
var howler = require('howler');

class Player extends EventEmitter {
    
    constructor () {
        
        super();
        
        this.sound = false;
        this.soundName = '';
        this.playing = false;
        this.fading = false;
        
    }
    
    load ( src, soundName ) {
        
        if( this.fading ) return;
        
        if( this.playing ) {
            
            this.fading = true;
            this.sound.once('fade', () => {
                this.fading = false;
                this.playing = false;
                this.load( src, soundName );
            });
            this.sound.fade(1, 0, 1000);
            
        } else {
            
            this.sound = new howler.Howl({
                src: [src],
                onload: () => {
                    this.soundName = soundName;
                    this.emit('loaded', soundName);
                    this.play();
                }
            });
            
        }
        
    }
    
    play () {
        
        if( !this.sound || this.playing ) return;
        
        this.playing = true;
        
        this.sound.play();
        
        this.emit('play', this.soundName);
        
    }
    
    pause () {
        
        if( !this.sound || !this.playing ) return;
        
        this.playing = false;
        
        this.sound.pause();
        
        this.emit( 'pause', this.soundName );
        
    }
    
    toggle () {
        
        this.playing ? this.pause() : this.play();
        
    }
    
}

module.exports = new Player();