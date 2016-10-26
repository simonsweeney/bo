var React = require('react');

module.exports = class World extends React.Component {
    
    render () {
        
        return <div className="world">{this.props.regions}</div>
        
    }
    
}