# Dismae Game Engine Core
[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)


[![node-dependencies](https://david-dm.org/Dischan/dismae.svg)](https://david-dm.org/Dischan/dismae) [![npm](https://img.shields.io/npm/dt/dismae.svg?maxAge=2592000)](https://www.npmjs.com/package/dismae)
[![npm](https://img.shields.io/npm/dm/dismae.svg?maxAge=2592000)](https://www.npmjs.com/package/dismae)

Dismae is a game engine for story-based games built on [Phaser.io](http://phaser.io/) and [electron](http://electron.atom.io/). It is developed by [Dischan Media](https://dischan.co/).

## Usage

There are two ways to use Dismae. The first and easiest method is to use the [Dismae UI](https://github.com/Dischan/dismae-ui/releases/latest), which provides a visual interface to create, manage, and launch Dismae projects.

Alternatively, you can create you own project manually. Doing this requires node.js and some experience with creating node.js projects. If you choose this method, you can clone the [Dismae base project](https://github.com/Dischan/dismae-base) to use as a starting point. Once cloned, you should create a `package.json` file and include [Dismae](https://www.npmjs.com/package/dismae) as a dependency. You can do this automatically via `npm init` and `npm install --save dismae`.

Once you have Dismae installed, you should create an `index.js` with the following content:

```javascript
var dismae = require('dismae')
var config = require('./config')
var process = require('process')

config.gameDir = process.cwd()

var game = new dismae(config)

game.on('update', (event) => {
  console.log(event)
})

game.on('error', (event) => {
  console.log(event)
})

game.start()
```

You can then run your game via `node index.js`.

## Documentation

Since Dismae is still in heavy development, there is no documentation yet. Documentation will be written once the feature set is stable.
