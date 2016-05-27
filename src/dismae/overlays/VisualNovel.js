window.Dismae.VisualNovel = function (game) {
  this.game = game
  this.add = this.game.add //  used to add displayables, text, groups, etc (Phaser.GameObjectFactory)
  this.camera = this.game.camera //  a reference to the game camera (Phaser.Camera)
  this.cache = this.game.cache //  the game cache (Phaser.Cache)
  this.input = this.game.input //  the global input manager. You can access this.input.keyboard, this.input.mouse, as well from it. (Phaser.Input)
  this.load = this.game.load //  for preloading assets (Phaser.Loader)
  this.math = this.game.math //  lots of useful common math operations (Phaser.Math)
  this.sound = this.game.sound //  the sound manager - add a sound, play one, set-up markers, etc (Phaser.SoundManager)
  this.stage = this.game.stage //  the game stage (Phaser.Stage)
  this.time = this.game.time //  the clock (Phaser.Time)
  this.tweens = this.game.tweens //  the tween manager (Phaser.TweenManager)
  this.state = this.game.state //  the state manager (Phaser.StateManager)
  this.world = this.game.world //  the game world (Phaser.World)
  this.particles = this.game.particles //  the particle manager (Phaser.Particles)
  this.physics = this.game.physics //  the physics manager (Phaser.Physics)
  this.rnd = this.game.rnd //  the repeatable random number generator (Phaser.RandomDataGenerator)
  this.ratio = window.innerHeight / 720
  this.dismae = this.game.dismae
}

window.Dismae.VisualNovel.prototype = {
  statement: {},
  sayStatement: null,
  showCharacterCount: 0,
  timer: null,
  text: null,
  say: null,
  advance: false,
  settings: null,
  alive: false,
  displayables: {},
  playing: {},
  nextAsset: null,
  assetUsageCounts: {},
  cacheSize: 64,
  cacheUsed: 0,
  wait: false,

  incrementShowCharacterCount: function () {
    if (this.sayStatement && this.showCharacterCount < this.sayStatement.text.length) {
      this.showCharacterCount++
    }
  },

  onTap: function (pointer, doubleTap) {
    if (!doubleTap) {
      this.advance = true
    }
  },

  show: function show (statement) {
    var game = this
    function performShow () {
      game.assetUsageCounts[statement.show]--

      if (statement.as === 'background') {
        game.displayables[statement.show] = game.backgroundLayer.create(statement.x, statement.y, statement.show)
      } else {
        game.displayables[statement.show] = game.spriteLayer.create(statement.x, statement.y, statement.show)
      }
      game.displayables[statement.show].name = statement.show

      if (statement.alpha === undefined) {
        game.displayables[statement.show].alpha = 1
      } else {
        game.displayables[statement.show].alpha = statement.alpha
      }

      if (statement.animate) {
        game.displayables[statement.show].tween = game.add.tween(game.displayables[statement.show])
        game.displayables[statement.show].tween.to(
          statement.to,
          statement.over * 1000,
          window.Phaser.Easing[statement.function.name][statement.function.type]
        )
        game.displayables[statement.show].tween.start()
      }
    }

    if (this.load.getAsset('image', statement.show)) {
      this.wait = true
    } else if (!this.cache.checkImageKey(statement.show)) {
      this.loadAsset({asset: statement.show, type: 'image'})
      this.wait = true
    } else {
      this.wait = false
      performShow()
    }
  },

  hide: function hide (statement, callback) {
    var game = this

    function hideComplete () {
      if (callback) {
        callback()
      }
      this.displayables[statement.hide].tween.onComplete.remove(hideComplete, this)
      this.kill(statement.hide)
    }

    if (statement.animate) {
      game.displayables[statement.hide].tween = this.add.tween(game.displayables[statement.hide])
      game.displayables[statement.hide].tween.to(
        statement.to,
        statement.over * 1000,
        window.Phaser.Easing[statement.function.name][statement.function.type]
        )

      this.displayables[statement.hide].tween.onComplete.add(hideComplete, this)
      this.displayables[statement.hide].tween.start()
    } else {
      game.kill(statement.hide)
    }
  },

  play: function play (statement) {
    var game = this
    function performPlay () {
      game.assetUsageCounts[statement.play]--
      game.playing[statement.play] = game.add.audio(statement.play)
      game.playing[statement.play].name = statement.play
      statement.volume = statement.volume === undefined ? 1 : statement.volume
      game.playing[statement.play].play('', 0, statement.volume, statement.loop)
      if (statement.animate) {
        game.playing[statement.play].tween = game.add.tween(game.playing[statement.play])
        game.playing[statement.play].tween.to(
          statement.to,
          statement.over * 1000,
          window.Phaser.Easing[statement.function.name][statement.function.type],
          true
        )
      }
    }

    if (this.load.getAsset('sound', statement.play)) {
      this.wait = true
    } else if (!this.cache.checkSoundKey(statement.play)) {
      this.loadAsset({asset: statement.play, type: 'audio'})
      this.wait = true
    } else if (!this.cache.isSoundDecoded(statement.play)) {
      this.wait = true
    } else {
      this.wait = false
      performPlay()
    }
  },

  stop: function stop (statement, callback) {
    var game = this

    function stopComplete () {
      if (callback) {
        callback()
      }
      this.playing[statement.stop].tween.onComplete.remove(stopComplete, this)
      this.playing[statement.stop].destroy()
    }

    if (statement.animate) {
      game.playing[statement.stop].tween = game.add.tween(game.playing[statement.stop])
      game.playing[statement.stop].tween.to(
        statement.to,
        statement.over * 1000,
        window.Phaser.Easing[statement.function.name][statement.function.type]
        )

      game.playing[statement.stop].tween.onComplete.add(stopComplete, this)
      game.playing[statement.stop].tween.start()
    } else {
      game.playing[statement.stop].destroy()
    }
  },

  kill: function kill (asset) {
    this.displayables[asset].kill()

    console.log('kill request', asset, this.assetUsageCounts[asset])
    if (!this.assetUsageCounts[asset]) {
      this.cache.removeImage(asset, true)
      this.cacheUsed -= this.assets[asset].size
    }
  },

  executeStatement: function executeStatement () {
    var game = this
    switch (this.statement.type) {
      case 'show':
        this.show(this.statement)
        break
      case 'hide':
        this.hide(this.statement)
        break
      case 'change':
        // if it's a change statement for an image
        if (this.displayables[this.statement.change.from]) {
          var hideStatement = Object.assign({}, this.statement)
          var showStatement = Object.assign({}, this.statement)
          hideStatement.to = Object.assign({}, this.statement.to)
          showStatement.to = Object.assign({}, this.statement.to)
          hideStatement.hide = this.statement.change.from
          hideStatement.to.x = this.displayables[this.statement.change.from].x
          hideStatement.to.y = this.displayables[this.statement.change.from].y
          hideStatement.to.alpha = 0

          if (this.backgroundLayer.getByName(this.statement.change.from)) {
            showStatement.as = 'background'
          }
          showStatement.show = this.statement.change.to
          showStatement.x = this.displayables[this.statement.change.from].x
          showStatement.y = this.displayables[this.statement.change.from].y
          showStatement.alpha = 0
          showStatement.to.x = this.displayables[this.statement.change.from].x
          showStatement.to.y = this.displayables[this.statement.change.from].y
          showStatement.to.alpha = 1

          if (this.statement.chained) {
            this.hide(hideStatement, function () {
              game.show(showStatement)
            })
          } else {
            this.hide(hideStatement)
            this.show(showStatement)
          }
        }
        // if it's a change statement for a sound
        if (this.playing[this.statement.change.from]) {
          var stopStatement = Object.assign({}, this.statement)
          var playStatement = Object.assign({}, this.statement)
          stopStatement.to = Object.assign({}, this.statement.to)
          playStatement.to = Object.assign({}, this.statement.to)
          stopStatement.stop = this.statement.change.from
          stopStatement.to.volume = 0

          playStatement.play = this.statement.change.to
          playStatement.volume = 0
          playStatement.to.volume = 1

          if (this.statement.chained) {
            this.stop(stopStatement, function () {
              game.play(playStatement)
            })
          } else {
            this.stop(stopStatement)
            this.play(playStatement)
          }
        }
        break
      case 'play':
        this.play(this.statement)
        break
      case 'stop':
        this.stop(this.statement)
        break
      case 'wait':
        this.wait = true
        setTimeout(function () {
          game.wait = false
        }, Number(this.statement.time) * 1000)
        break
    }
  },

  advanceScript: function () {
    do {
      if (!this.wait) {
        this.statement = this.parser.nextStatement()
      }

      this.executeStatement()
    } while (this.statement && this.statement.type !== 'say' && !this.wait)

    if (this.statement) {
      if (this.statement.type === 'say') {
        this.showCharacterCount = 1
        this.sayStatement = this.statement
      }
    } else {
      this.destroy()
    }
  },

  preload: function () {
    this.assets = this.cache.getJSON('assets')
    this.load.text('start', this.assets['start'].path)
  },

  create: function () {
    // layer for bgs
    this.backgroundLayer = this.game.add.group()
    // layer for displayables
    this.spriteLayer = this.game.add.group()
    // layer for ui
    this.uiLayer = this.game.add.group()

    // this.load.onFileComplete.add(function (progress, fileKey, success, totalLoadedFiles, totalFiles) {
    //   console.log('file loaded')
    //   console.log(progress, fileKey, success, totalLoadedFiles, totalFiles)
    // }, this)

    this.parser = this.dismae.Parser(this.cache.getText('start'))

    this.text = this.add.text(this.world.centerX, this.world.centerY)
    this.uiLayer.add(this.text)
    this.text.font = 'LiberationSans'
    this.text.fontSize = 24 * this.ratio
    this.text.fill = '#fff8ec'
    this.text.stroke = '#000000'
    this.text.strokeThickness = 2
    this.text.fontWeight = 300
    // xoffset, yoffset, color (rgba), blur, shadowStroke(bool), shadowFill(bool)
    this.text.setShadow(1, 2, 'rgba(0,0,0,1)', 0, true, true)

    this.say = this.add.text(this.world.centerX, this.world.centerY - 30)
    this.uiLayer.add(this.say)
    this.say.font = 'LiberationSans'
    this.say.fontSize = 22 * this.ratio
    this.say.fill = '#fff8ec'
    this.say.stroke = '#000000'
    this.say.strokeThickness = 2
    this.say.fontWeight = 300
    // xoffset, yoffset, color (rgba), blur, shadowStroke(bool), shadowFill(bool)
    this.say.setShadow(1, 2, 'rgba(0,0,0,1)', 0, true, true)

    this.timer = this.time.create(false)
    this.timer.loop(50, this.incrementShowCharacterCount, this)
    this.timer.start(0)

    this.input.onTap.add(this.onTap, this)
    this.alive = true
    this.advance = true
  },

  loadAsset: function (asset) {
    var cacheCheck

    switch (asset.type) {
      case 'image':
        cacheCheck = this.cache.checkImageKey(asset.asset)
        break
      case 'audio':
        cacheCheck = this.cache.checkSoundKey(asset.asset)
        break
    }

    if (this.assetUsageCounts[asset.asset]) {
      this.assetUsageCounts[asset.asset]++
    } else {
      this.assetUsageCounts[asset.asset] = 1
    }

    if (!cacheCheck) {
      this.cacheUsed += this.assets[asset.asset].size
      switch (asset.type) {
        case 'image':
          this.load.image(asset.asset, this.assets[asset.asset].path)
          break
        case 'audio':
          this.load.audio(asset.asset, this.assets[asset.asset].path)
          break
      }
      this.load.start()
    }

    console.log('load', asset.asset, this.assetUsageCounts[asset.asset])
  },

  update: function () {
    if (this.nextAsset !== false && this.load.hasLoaded && this.cacheUsed < this.cacheSize) {
      this.nextAsset = this.parser.nextAsset()
      if (this.nextAsset) {
        console.log(this.nextAsset)
        this.loadAsset(this.nextAsset)
      }
    }

    if (this.advance) {
      if (this.sayStatement && this.showCharacterCount < this.sayStatement.text.length) {
        this.showCharacterCount = this.sayStatement.text.length
      } else {
        this.advanceScript()
      }

      if (!this.wait) {
        this.advance = false
      }
    }

    if (this.sayStatement) {
      this.say.text = this.sayStatement.say
      this.text.text = this.sayStatement.text.substring(0, this.showCharacterCount)
    }
  },

  destroy: function () {
    this.text.kill()
    this.say.kill()
    for (var key in this.displayables) {
      this.displayables[key].kill()
    }
    for (key in this.playing) {
      this.playing[key].destroy()
    }
    this.alive = false
  },

  render: function () {}
}
