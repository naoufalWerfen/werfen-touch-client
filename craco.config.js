const path = require('path');
module.exports = config => {
    config.devtool = 'source-map';
    config.target = 'electron-renderer';
    config.module = {
        rules: [ {
            test: [
                /\.html$/,
                /\.(js|jsx)$/,
                /\.css$/,
                /\.json$/,
                /\.bmp$/,
                /\.gif$/,
                /\.svg$/,
                /\.jpe?g$/,
                /\.png$/,
                /\.woff$/,
                /\.woff2$/,
            ]
            // ,
            // exclude: [
            //     path.resolve(__dirname,'./pdfjs-2.3.200-dist')
            // ]
        } ]

    };
    return config;
};