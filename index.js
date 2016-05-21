#!/usr/bin/env node
'use strict'

var gulp = require('gulp')
var rimraf = require('rimraf')
var pug = require('pug')
var proc = require('child_process')
const fs = require('fs')
var recursiveReaddir = require('recursive-readdir')
var os = require('os')
var path = require('path')
const EventEmitter = require('events')
var request = require('request')
var progress = require('request-progress')

// spawn electron
module.exports =
  class dismae extends EventEmitter {
    constructor (config, gameDir) {
      super()
      this.config = config
      this.gameDir = gameDir
      this.tempDir = path.join(gameDir, 'tmp')
    }

    start () {
      var dismae = this
      dismae.emit('update', 'checking dependencies')
      dismae.getElectron(function (electron) {
        dismae.emit('update', 'cleaning')
        dismae.clean(function () {
          dismae.emit('update', 'building')
          dismae.build(function () {
            dismae.emit('update', 'starting')
            var mainjs = path.join(dismae.gameDir, 'build', 'main.js')
            var child = proc.spawn(electron, [mainjs])
            child.on('close', function (code) {
              dismae.emit('update', 'closed')
            })
          })
        })
      })
    }

    getElectron (callback) {
      var dismae = this
      var platform = os.platform()

      var paths = {
        darwin: 'electron-darwin/Electron.app/Contents/MacOS/Electron',
        freebsd: 'electron-freebsd/electron',
        linux: 'electron-linux/electron',
        win32: 'electron-win32/electron.exe'
      }

      if (!paths[platform]) throw new Error('Unknown platform: ' + platform)

      try {
        fs.lstatSync(path.join(dismae.tempDir, paths[platform]))
        callback(path.join(dismae.tempDir, paths[platform]))
      } catch (e) {
        dismae.emit('update', 'downloading dependencies')
        this.installElectron(platform, function () {
          callback(path.join(dismae.tempDir, paths[platform]))
        })
      }
    }

    downloadElectron (options, callback) {
      var dismae = this
      var platform = options.platform || os.platform()
      var arch = options.arch || os.arch()
      var version = options.version
      var filename = 'electron-v' + version + '-' + platform + '-' + arch + '.zip'
      var url = 'https://github.com/electron/electron/releases/download/v'
      url += version + '/' + filename
      var cache = options.cache

      try {
        fs.lstatSync(dismae.tempDir)
      } catch (e) {
        fs.mkdirSync(dismae.tempDir)
      }
      try {
        fs.lstatSync(cache)
      } catch (e) {
        fs.mkdirSync(cache)
      }
      try {
        fs.lstatSync(path.join(cache, filename))
        // already downloaded
        callback(null, path.join(cache, filename))
      } catch (e) {
        // haven't downloaded it yet
        progress(request(url, function () {
          dismae.emit('progress', {percentage: 1})
          callback(null, path.join(cache, filename))
        }), {throttle: 500})
        .on('progress', function (state) {
          // The state is an object that looks like this:
          // {
          //     percentage: 0.5,           // Overall percentage (between 0 to 1)
          //     speed: 554732,             // The download speed in bytes/sec
          //     size: {
          //         total: 90044871,       // The total payload size in bytes
          //         transferred: 27610959  // The transferred payload size in bytes
          //     },
          //     time: {
          //         elapsed: 36.235,      // The total elapsed seconds since the start (3 decimals)
          //         remaining: 81.403     // The remaining seconds to finish (3 decimals)
          //     }
          // }
          dismae.emit('progress', state)
        })
        .on('error', function (err) {
          dismae.emit('error', err)
        })
        .pipe(fs.createWriteStream(path.join(cache, filename)))
      }
    }

    installElectron (platform, callback) {
      var dismae = this
      dismae.downloadElectron({version: '1.1.1', cache: path.join(dismae.tempDir, 'cache')}, extractFile)

      // unzips and makes path.txt point at the correct executable
      function extractFile (err, zipPath) {
        if (err) {
          dismae.emit('error', err)
        }

        dismae.emit('update', 'extracting files')
        try {
          fs.lstatSync(path.join(dismae.tempDir, `electron-${platform}`))
        } catch (e) {
          fs.mkdirSync(path.join(dismae.tempDir, `electron-${platform}`))
        }

        if (platform === 'darwin') {
          proc.execSync(`unzip "${zipPath}" -d "${path.join(dismae.tempDir, 'electron-darwin')}"`)
          callback()
        } else if (platform === 'linux') {
          proc.execSync(`unzip "${zipPath}" -d "${path.join(dismae.tempDir, 'electron-linux')}"`)
          var electronAppPath = path.join(path.join(dismae.tempDir, 'electron-linux'), 'electron')
          if (fs.existsSync(electronAppPath)) {
            fs.chmodSync(electronAppPath, '755')
          }

          var atomAppPath = path.join(path.join(dismae.tempDir, 'electron-linux'), 'atom')
          if (fs.existsSync(atomAppPath)) {
            fs.chmodSync(atomAppPath, '755')
          }
          callback()
        } else if (platform === 'win32') {
          proc.execFileSync(path.join(__dirname, 'bin', '7zip', '7za.exe'), ['x', zipPath, '-o' + path.join(dismae.tempDir, 'electron-win32')], {stdio: 'ignore'})
          callback()
        }
      }
    }

    build (callback) {
      let dismae = this
      fs.mkdirSync(path.join(this.gameDir, 'build'))

      gulp.src(path.join(__dirname, 'src', '**', '*.js'), {base: path.join(__dirname, 'src')})
        .pipe(gulp.dest(path.join(this.gameDir, 'build')))

      gulp.src(path.join(dismae.gameDir, 'src', '**', '*.*'), {base: path.join(this.gameDir, 'src')})
        .pipe(gulp.dest(path.join(this.gameDir, 'build')))

      // dependencies are in a different place if dismae is installed in a module
      // probably not the best way to handle this, but I couldn't figure out a
      // better one offhand
      fs.stat(path.join(__dirname, 'node_modules', 'phaser', 'build', 'phaser.min.js'), function (err, stat) {
        if (err === null) {
          gulp.src(path.join(__dirname, 'node_modules', 'phaser', 'build', 'phaser.min.js'))
            .pipe(gulp.dest(path.join(dismae.gameDir, 'build', 'dismae', 'phaser')))
        } else {
          gulp.src(path.join(__dirname, '..', 'phaser', 'build', 'phaser.min.js'))
            .pipe(gulp.dest(path.join(dismae.gameDir, 'build', 'dismae', 'phaser')))
        }
      })

      fs.writeFileSync(path.join(dismae.gameDir, 'build', 'config.json'), JSON.stringify(dismae.config, null, '  '), 'utf8')

      dismae.buildAssetFile(function (assets) {
        var index = fs.readFileSync(path.join(__dirname, 'src', 'index.pug'), 'utf8')
        index = pug.compile(index, {pretty: true})
        index = index(dismae.resolveConfigPaths(dismae.config, assets))
        fs.writeFileSync(path.join(dismae.gameDir, 'build', 'index.html'), index, 'utf8')
        callback()
      })
    }

    clean (callback) {
      rimraf(path.join(this.gameDir, 'build'), callback)
    }

    buildAssetFile (callback) {
      var dismae = this
      var assets = {}
      recursiveReaddir(path.join(dismae.gameDir, 'src'), ['.*'], function (err, files) {
        if (err) {
          dismae.emit('error', err)
        }

        var pathArray
        var assetName
        var depth
        var file
        var stats

        for (var i = 0; i < files.length; i++) {
          stats = fs.lstatSync(files[i])
          file = files[i].replace(path.join(dismae.gameDir, 'src') + path.sep, '')
          pathArray = file.split(path.sep)
          depth = pathArray.length - 1
          assetName = pathArray[depth].split('.')[0]
          while (assets[assetName]) {
            depth--
            assetName = pathArray[depth] + path.sep + assetName
          }
          assets[assetName] = {path: file, size: stats.size / 1000 / 1000}
        }

        fs.writeFileSync(path.join(dismae.gameDir, 'build', 'assets.json'), JSON.stringify(assets, null, '  '), 'utf8')

        callback(assets)
      })
    }

    resolveConfigPaths (config, assets) {
      for (var key in config) {
        if (config.hasOwnProperty(key)) {
          if (assets[config[key]]) {
            config[key] = assets[config[key]].path
          }
        }
      }

      return config
    }
}
