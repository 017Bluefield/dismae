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
  showCharacterCount: 0,
  timer: null,
  text: null,
  say: null,
  advance: false,
  settings: null,
  alive: false,
  sprites: {},
  backgrounds: {},

  incrementShowCharacterCount: function () {
    if (this.showCharacterCount < this.statement.text.length) {
      this.showCharacterCount++
    }
  },

  onTap: function (pointer, doubleTap) {
    if (!doubleTap) {
      this.advance = true
    }
  },

  advanceScript: function () {
    var statement = this.parser.parseStatement()

    while (statement && statement.type !== 'say') {
      switch (statement.type) {
        case 'show':
          console.log(statement)
          this.sprites[statement.show] = this.add.sprite(statement.x, statement.y, statement.show)
          this.sprites[statement.show].alpha = statement.alpha || 1
          if (statement.animate) {
            this.sprites[statement.show].tween = this.add.tween(this.sprites[statement.show])
            this.sprites[statement.show].tween.to(
              statement.to,
              statement.over * 1000,
              window.Phaser.Easing[statement.function.name][statement.function.type]
              )
            this.sprites[statement.show].tween.start()
          }

          break
      }

      statement = this.parser.parseStatement()
    }

    if (statement) {
      if (statement.type === 'say') {
        this.showCharacterCount = 1
        this.statement = statement
      } else {

      }
    } else {
      this.destroy()
    }
  },

  preload: function () {
    this.load.image('sad', 'assets/images/sprites/sad.png')
    this.assets = this.cache.getJSON('assets')
    console.log(this.assets)
    this.load.text('ideal', this.assets['ideal.dis'])
  },

  create: function () {
    this.parser = this.dismae.Parser(this.cache.getText('ideal'))

    this.text = this.add.text(this.world.centerX, this.world.centerY)
    this.text.font = 'LiberationSans'
    this.text.fontSize = 24 * this.ratio
    this.text.fill = '#fff8ec'
    this.text.stroke = '#000000'
    this.text.strokeThickness = 2
    this.text.fontWeight = 300
    // xoffset, yoffset, color (rgba), blur, shadowStroke(bool), shadowFill(bool)
    this.text.setShadow(1, 2, 'rgba(0,0,0,1)', 0, true, true)

    this.say = this.add.text(this.world.centerX, this.world.centerY - 30)
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
    this.advanceScript()
  },

  update: function () {
    if (this.advance) {
      if (this.showCharacterCount < this.statement.text.length) {
        this.showCharacterCount = this.statement.text.length
      } else {
        this.advanceScript()
      }

      this.advance = false
    }
    if (this.statement.say) {
      this.say.text = this.statement.say
    }
    this.text.text = this.statement.text.substring(0, this.showCharacterCount)
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
