# Easy DS
A simple tool to help with GML data structures. See it [here](https://christopherwk210.github.io/easy-ds/)!

This project is written in plain old JavaScript, and lovingly uses the [ace editor](https://ace.c9.io/).


# Quick Start
`npm run build` - Build the entire project to the `dist/` directoy.

`npm run dev` - Builds the project to `dist/` but skips image optimization and JS linting/uglifying for speed.

### Available Gulp tasks:

 - `clean` - Delete the `dist/` directory
 - `html` - Minify and copy all html files
 - `css` - Autoprefix, minify, concat all css to one file
 - `js` - Lint, uglify, concat all js files to one
 - `images` - Copy and optimize images
 - `images.copy` - Copy images only