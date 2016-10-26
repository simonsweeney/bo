module.exports = {
    
    inherits: 'Walkable',
    
    events: {
        
        characterEnter: function(){
            
            this.addClass('button_visited', 'button_active');
            
        },
        
        characterLeave: function() {
            
            this.removeClass('button_active');
            
        }
    }
    
}