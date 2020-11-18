const path = require('path');

module.exports = {
    watch: true,
    entry: './elect.js',
    output: {
        library: 'elect',
        libraryTarget: 'umd',
        filename: 'elect.umd.js',
        path: path.resolve(__dirname, 'dist'),
    },
};