module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-url'),
    require('postcss-nested'),
    require('postcss-preset-env')({ stage: 2 })
  ]
};