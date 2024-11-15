const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:5069',
        secure: false,
        changeOrigin: true,
        logLevel: 'debug'
      }
    },
    port: 8080,
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'public')
    }
  }
};