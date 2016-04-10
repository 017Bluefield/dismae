'use strict';

var gulp = require('gulp');
var rimraf = require('rimraf');
var pug = require('pug');
var electron = require('electron-prebuilt');
var proc = require('child_process');
const fs = require('fs');

// spawn electron
module.exports =  function(config) {
  function start() {
    clean(function(){
      build();
      var child = proc.spawn(electron, [`build/main.js`]);
    });
  }

  function build() {
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
  }

  function clean(callback) {
    rimraf('build', callback);
    //callback();
  }

  return {
    start: start,
    build: build,
    clean: clean
  }
}
