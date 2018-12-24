module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/js/main.js',
  output: {
    filename: 'main.js'
  },
  plugins: [],
  module: {
    rules: [
      {test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'}
    ]
  },
  devtool: process.env.NODE_ENV !== 'production' ? 'eval' : undefined
}
