window.Dismae.VisualNovel = function (game) {
  this.game = game
  this.add = this.game.add //  used to add sprites, text, groups, etc (Phaser.GameObjectFactory)
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
  sprites: {},
  backgrounds: {},
  nextAsset: null,
  assetUsageCounts: {},
  cacheSize: 64,
  cacheUsed: 0,
  loadingAsset: false,

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

  showSprite: function showSprite (statement, callback) {
    var game = this
    function performShow () {
      game.assetUsageCounts[statement.show]--
      console.log(statement.show, ' used. Usages: ', game.assetUsageCounts[statement.show])
      game.sprites[statement.show] = game.spriteLayer.create(statement.x, statement.y, statement.show)
      if (statement.alpha === undefined) {
        game.sprites[statement.show].alpha = 1
      } else {
        game.sprites[statement.show].alpha = statement.alpha
      }

      if (statement.animate) {
        game.sprites[statement.show].tween = game.add.tween(game.sprites[statement.show])
        game.sprites[statement.show].tween.to(
          statement.to,
          statement.over * 1000,
          window.Phaser.Easing[statement.function.name][statement.function.type]
          )
        game.sprites[statement.show].tween.start().onComplete.add(function () {
          if (callback) {
            callback()
          }
        })
      }
    }

    if (this.load.getAsset('image', statement.show)) {
      this.loadingAsset = true
    } else if (!this.cache.checkImageKey(statement.show)) {
      this.loadAsset(statement.show)
      this.loadingAsset = true
    } else {
      this.loadingAsset = false
      performShow()
    }
  },

  hideSprite: function hideSprite (statement, callback) {
    var _this = this

    if (statement.animate) {
      this.sprites[statement.hide].tween = this.add.tween(this.sprites[statement.hide])
      this.sprites[statement.hide].tween.to(
        statement.to,
        statement.over * 1000,
        window.Phaser.Easing[statement.function.name][statement.function.type]
        )
      var sprite = statement.hide
      this.sprites[statement.hide].tween.start().onComplete.add(function () {
        if (callback) {
          callback()
        }
        _this.killSprite(sprite)
      })
    } else {
      this.killSprite(statement.hide)
    }
  },

  killSprite: function killSprite (asset) {
    this.sprites[asset].kill()

    if (!this.assetUsageCounts[asset]) {
      console.log(asset, ' no longer needed. Removing from cache.')
      this.cache.removeImage(asset, true)
      this.cacheUsed -= this.assets[asset].size
    }
  },

  advanceScript: function () {
    var game = this

    function executeStatement () {
      switch (game.statement.type) {
        case 'show':
          game.showSprite(game.statement)
          break
        case 'hide':
          game.hideSprite(game.statement)
          break
        case 'change':
          console.log(game.statement)
          var hideStatement = Object.assign({}, game.statement)
          var showStatement = Object.assign({}, game.statement)
          hideStatement.to = Object.assign({}, game.statement.to)
          showStatement.to = Object.assign({}, game.statement.to)
          hideStatement.hide = game.statement.change.from
          hideStatement.to.x = game.sprites[game.statement.change.from].x
          hideStatement.to.y = game.sprites[game.statement.change.from].y
          hideStatement.to.alpha = 0

          showStatement.show = game.statement.change.to
          showStatement.x = game.sprites[game.statement.change.from].x
          showStatement.y = game.sprites[game.statement.change.from].y
          showStatement.alpha = 0
          showStatement.to.x = game.sprites[game.statement.change.from].x
          showStatement.to.y = game.sprites[game.statement.change.from].y
          showStatement.to.alpha = 1

          game.hideSprite(hideStatement)
          game.showSprite(showStatement)

          break
      }

      if (!game.loadingAsset) {
        game.statement = game.parser.nextStatement()
      }
    }

    console.log('advance script')
    if (!game.loadingAsset) {
      game.statement = game.parser.nextStatement()
    }

    executeStatement()

    while (game.statement && game.statement.type !== 'say' && !game.loadingAsset) {
      executeStatement()
    }

    if (game.statement) {
      if (game.statement.type === 'say') {
        game.showCharacterCount = 1
        game.sayStatement = game.statement
      }
    } else {
      game.destroy()
    }
  },

  preload: function () {
    this.assets = this.cache.getJSON('assets')
    this.load.text('start', this.assets['start'].path)
  },

  create: function () {
    // layer for bgs
    this.backgroundLayer = this.game.add.group()
    // layer for sprites
    this.spriteLayer = this.game.add.group()
    // layer for ui
    this.uiLayer = this.game.add.group()

    this.load.onFileComplete.add(function (progress, fileKey, success, totalLoadedFiles, totalFiles) {
      console.log('file loaded')
      console.log(progress, fileKey, success, totalLoadedFiles, totalFiles)
    }, this)
    this.parser = this.dismae.Parser(this.cache.getText('start'))

    this.text = this.add.text(0, this.world.centerY)
    this.uiLayer.add(this.text)
    this.text.font = 'LiberationSans'
    this.text.fontSize = 24 * this.ratio
    this.text.fill = '#fff8ec'
    this.text.stroke = '#000000'
    this.text.strokeThickness = 2
    this.text.fontWeight = 300
    // xoffset, yoffset, color (rgba), blur, shadowStroke(bool), shadowFill(bool)
    this.text.setShadow(1, 2, 'rgba(0,0,0,1)', 0, true, true)

    this.say = this.add.text(0, this.world.centerY - 30)
    this.uiLayer.add(this.say)
    this.say.font = 'LiberationSans'
    this.say.fontSize = 22 * this.ratio
    this.say.fill = '#fff8ec'
    this.say.stroke = '#000000'
    this.say.strokeThickness = 2
    this.say.fontWeight = 300
    // xoffset, yoffset, color (rgba), blur, shadowStroke(bool), shadowFill(bool)
    this.say.setShadow(1, 2, 'rgba(0,0,0,1)', 0, true, true)

    //  Create our Timer
    this.timer = this.time.create(false)

    this.timer.loop(50, this.incrementShowCharacterCount, this)

    //  Start the timer running - this is important!
    //  It won't start automatically, allowing you to hook it to button events and the like.
    this.timer.start(0)

    this.input.onTap.add(this.onTap, this)
    this.alive = true
    this.advance = true
  },

  loadAsset: function (asset) {
    if (this.cache.checkImageKey(asset)) {
      this.assetUsageCounts[asset]++
      console.log(asset, ' already loaded. Usages: ', this.assetUsageCounts[asset])
    } else {
      this.assetUsageCounts[asset] = 1
      console.log('Loading ', this.assets[asset].path, ' with key ', asset)
      this.cacheUsed += this.assets[asset].size
      this.load.image(asset, this.assets[asset].path)
      this.load.start()
    }
  },

  update: function () {
    if (this.nextAsset !== false && this.load.hasLoaded && this.cacheUsed < this.cacheSize) {
      console.log(this.cacheUsed)

      this.nextAsset = this.parser.nextAsset()
      if (this.nextAsset) {
        this.loadAsset(this.nextAsset)
      }
    }

    if (this.advance) {
      if (this.sayStatement && this.sayStatement.text && this.showCharacterCount < this.sayStatement.text.length) {
        this.showCharacterCount = this.sayStatement.text.length
      } else {
        this.advanceScript()
      }

      if (!this.loadingAsset) {
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
    for (var key in this.sprites) {
      this.sprites[key].kill()
    }
    this.alive = false
  },

  render: function () {}
}
