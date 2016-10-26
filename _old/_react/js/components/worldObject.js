var React = require('react');

class WorldObject extends React.Component {
    
    render () {
        
        var style = {
            top: this.props.y + 'px',
            left: this.props.x + 'px',
            width: this.props.width + 'px',
            height: this.props.height + 'px'
        }
        
        var children = React.Children.map( this.props.children, child => {
            console.log(child);
            return child;
        })
        
        return (
            <div className={"world-object " + this.props.classes} style={style}>
                { children }
            </div>
        )
        
    }
    
}

WorldObject.defaultProps = {
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    classes: ''
}

module.exports = WorldObject;