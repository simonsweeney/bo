var React = require('react');
var ReactDOM = require('react-dom');
var App = require('./components/app.js');
var regions = require('./regions/main.js');

ReactDOM.render(
  <App regions={regions}></App>,
  document.getElementById('app')
);