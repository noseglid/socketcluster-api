const path = require('path');

module.exports = {
  devtool: 'cheap-eval-source-map',
  entry: path.join(__dirname, 'client.js'),
  output: {
    filename: 'bundle.js',
    publicPath: 'example'
  },
  module: {
    rules: [
      {
        test: /\.proto$/,
        use: 'raw-loader'
      }
    ]
  },
  node: {
    fs: 'empty'
  }
};
