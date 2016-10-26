var React = require('react');
var Camera = require('./camera.js');
var World = require('./world.js');

module.exports = class App extends React.Component {
    
    render () {
        
        return (
            
            <Camera>
            
                <World regions={this.props.regions}>
                    
                </World>
                
            </Camera>
            
        )
        
    }
    
}