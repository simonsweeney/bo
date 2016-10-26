var React = require('react');

module.exports = class Camera extends React.Component {
    
    render () {
        
        return (
            <div className="camera">
                {this.props.children}
            </div>
        )
        
    }
    
}