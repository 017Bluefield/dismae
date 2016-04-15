'use strict';

var gulp = require('gulp');
var rimraf = require('rimraf');
var pug = require('pug');
var electron = require('electron-prebuilt');
var proc = require('child_process');
const fs = require('fs');
var recursiveReaddir = require('recursive-readdir');

// spawn electron
module.exports =  function(config) {
  function start() {
    clean(function(){
      build(function(){
        var child = proc.spawn(electron, [`build/main.js`]);
      });
    });
  }

  function build(callback) {
    fs.mkdirSync('build');

    gulp.src(`${__dirname}/src/**/*.js`, {base: `${__dirname}/src/`})
    .pipe(gulp.dest('build'));

    gulp.src('src/**/*.*', {base: 'src/'})
    .pipe(gulp.dest('build'));

    gulp.src(`${__dirname}/node_modules/phaser/build/phaser.min.js`)
    .pipe(gulp.dest('build/js/'));

    var index = fs.readFileSync(`${__dirname}/src/index.pug`, 'utf8');
    index = pug.compile(index, {pretty: true});
    index = index(config);
    fs.writeFileSync('build/index.html', index, 'utf8');

    var assets = {};
    recursiveReaddir('src/assets', ['.*'], function (err, files) {
      var pathArray;
      var assetName;
      var depth;
      var file;
      for(var i = 0; i < files.length; i++) {
        file = files[i];
        pathArray = file.split('/');
        depth = pathArray.length - 1;
        assetName = pathArray[depth];
        while(assets[assetName]){
          depth--;
          assetName = pathArray[depth] + '/' + assetName;
        }
        assets[assetName] = file;
      }
      fs.writeFileSync('build/assets.json', JSON.stringify(assets, null, '  '), 'utf8');
    });
  }

  function clean(callback) {
    rimraf('build', callback);
  }

  return {
    start: start,
    build: build,
    clean: clean
  }
}
