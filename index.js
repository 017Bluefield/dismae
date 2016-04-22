#!/usr/bin/env node
'use strict';

var gulp = require('gulp');
var rimraf = require('rimraf');
var pug = require('pug');
var proc = require('child_process');
const fs = require('fs');
var recursiveReaddir = require('recursive-readdir');
var os = require('os');
var path = require('path');
const EventEmitter = require('events');
var Download = require('download');

// spawn electron
module.exports = class dismae extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.tempDir = path.join(config.gameDir, 'tmp');
  }

  start() {
    var dismae = this;
    dismae.emit('update', 'checking dependencies');
    dismae.getElectron(function(electron){
      dismae.emit('update', 'cleaning');
      dismae.clean(function(){
        dismae.emit('update', 'building');
        dismae.build(function(){
          dismae.emit('update', 'starting');
          var child = proc.spawn(electron, [`${dismae.config.gameDir}/build/main.js`]);
          child.on('close', function(code) {
            dismae.emit('update', 'closed');
          });
        });
      });
    });
  }

  getElectron(callback) {
    var dismae = this;
    var platform = os.platform()

    var paths = {
      darwin: 'electron-darwin/Electron.app/Contents/MacOS/Electron',
      freebsd: 'electron-freebsd/electron',
      linux: 'electron-linux/electron',
      win32: 'electron-win32/electron.exe'
    }

    if (!paths[platform]) throw new Error('Unknown platform: ' + platform)

    try {
      var exists = fs.lstatSync(path.join(dismae.tempDir, paths[platform]));
      callback(path.join(dismae.tempDir, paths[platform]));
    } catch (e) {
      dismae.emit('update', 'downloading dependencies');
      this.installElectron(platform, function() {
        callback(path.join(dismae.tempDir, paths[platform]));
      });
    }
  }

  downloadElectron(options, callback) {
    var dismae = this;
    var platform = options.platform || os.platform();
    var arch = options.arch || os.arch();
    var version = options.version;
    var filename = 'electron-v' + version + '-' + platform + '-' + arch + '.zip'
    var url = 'https://github.com/electron/electron/releases/download/v';
    url += version + '/' + filename;
    var cache = options.cache;

    try {
      var exists = fs.lstatSync(dismae.tempDir);
    } catch (e) {
      fs.mkdirSync(dismae.tempDir);
    }
    try {
      var exists = fs.lstatSync(cache);
    } catch (e) {
      fs.mkdirSync(cache);
    }
    try {
      var exists = fs.lstatSync(path.join(cache,filename));
      // already downloaded
      callback(null, path.join(cache,filename))
    } catch (e) {
      // haven't downloaded it yet
      new Download({mode: '755'})
      .get(url)
      .dest(cache)
      .run(function(){
        callback(null, path.join(cache,filename));
      });
    }
  }

  installElectron(platform, callback) {
    var dismae = this;
    dismae.downloadElectron({version: '0.37.6', cache: path.join(dismae.tempDir, 'cache')}, extractFile)

    // unzips and makes path.txt point at the correct executable
    function extractFile (err, zipPath) {
      dismae.emit('update', 'extracting files');
      try {
        var exists = fs.lstatSync(path.join(dismae.tempDir, `electron-${platform}`));
      } catch (e) {
        fs.mkdirSync(path.join(dismae.tempDir, `electron-${platform}`));
      }

      if(platform === 'darwin'){
        proc.execSync('unzip ' + zipPath + ' -d ' + path.join(dismae.tempDir, 'electron-darwin'));
        callback();
      } else if (platform === 'linux') {
        proc.execSync('unzip ' + zipPath + ' -d ' + path.join(dismae.tempDir, 'electron-linux'));
        electronAppPath = path.join(path.join(dismae.tempDir, 'electron-linux'), 'electron')
        if (fs.existsSync(electronAppPath)) {
          fs.chmodSync(electronAppPath, '755');
        }

        atomAppPath = path.join(path.join(dismae.tempDir, 'electron-linux'), 'atom')
        if (fs.existsSync(atomAppPath)) {
          fs.chmodSync(atomAppPath, '755');
        }
        callback();
      } else if (platform === 'win32') {
        proc.execFileSync(path.join(__dirname, 'bin', '7zip', '7za.exe'), ['x ' + zipPath, '-o' + path.join(dismae.tempDir, 'electron-win32')]);
        callback();
      }
    }
  }

  build(callback) {
    let dismae = this;
    fs.mkdirSync(this.config.gameDir + '/build');

    gulp.src(`${__dirname}/src/**/*.js`, {base: `${__dirname}/src/`})
    .pipe(gulp.dest(this.config.gameDir + '/build'));

    gulp.src(this.config.gameDir + '/src/**/*.*', {base: this.config.gameDir + '/src/'})
    .pipe(gulp.dest(this.config.gameDir + '/build'));

    //dependencies are in a different place if dismae is installed in a module
    //probably not the best way to handle this, but I couldn't figure out a
    //better one offhand
    fs.stat(`${__dirname}/node_modules/phaser/build/phaser.min.js`, function(err, stat) {
      if(err === null) {
        gulp.src(`${__dirname}/node_modules/phaser/build/phaser.min.js`)
        .pipe(gulp.dest(dismae.config.gameDir + '/build/dismae/phaser'));
      } else {
        gulp.src(`${__dirname}/../phaser/build/phaser.min.js`)
        .pipe(gulp.dest(dismae.config.gameDir + '/build/dismae/phaser'));
      }
    });

    dismae.buildAssetFile(function(assets){
      var index = fs.readFileSync(`${__dirname}/src/index.pug`, 'utf8');
      index = pug.compile(index, {pretty: true});
      index = index(dismae.resolveConfigPaths(dismae.config, assets));
      fs.writeFileSync(dismae.config.gameDir + '/build/index.html', index, 'utf8');
      callback();
    });
  }

  clean(callback) {
    rimraf(this.config.gameDir + '/build', callback);
  }

  buildAssetFile(callback){
    var dismae = this;
    var assets = {};
    recursiveReaddir(dismae.config.gameDir + '/src/assets', ['.*'], function (err, files) {
      var pathArray;
      var assetName;
      var depth;
      var file;

      for(var i = 0; i < files.length; i++) {
        file = files[i].replace(dismae.config.gameDir + 'src/', '');
        pathArray = file.split('/');
        depth = pathArray.length - 1;
        assetName = pathArray[depth];
        while(assets[assetName]){
          depth--;
          assetName = pathArray[depth] + '/' + assetName;
        }
        assets[assetName] = file;
      }

      fs.writeFileSync(dismae.config.gameDir + '/build/assets.json', JSON.stringify(assets, null, '  '), 'utf8');

      callback(assets);
    });
  }

  resolveConfigPaths(config, assets){
    for (var key in config) {
       if (config.hasOwnProperty(key)) {
          if(assets[config[key]]) {
            config[key] = assets[config[key]];
          }
       }
    }

    return config;
  }
}
