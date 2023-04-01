const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './modules/globals.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    library: 'globals',
    libraryTarget: 'var'
  }
};
