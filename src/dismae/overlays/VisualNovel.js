window.Dismae.VisualNovel = function (game, scene) {
  this.scene = scene
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
}

window.Dismae.VisualNovel.prototype = {
  script: null,
  scriptIndex: 0,
  scriptStatement: {},
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
    if (this.showCharacterCount < this.scriptStatement.text.length) {
      this.showCharacterCount++
    }
  },

  onTap: function (pointer, doubleTap) {
    if (!doubleTap) {
      this.advance = true
    }
  },

  advanceScript: function () {
    if (this.scriptIndex < this.script.length - 1) {
      this.showCharacterCount = 1
      switch (this.script[this.scriptIndex].charAt(0)) {
        case '"':
          this.scriptStatement.text = JSON.parse(this.script[this.scriptIndex])
          this.scriptIndex++
          break
        case '{':
          this.scriptStatement = JSON.parse(this.script[this.scriptIndex])
          switch (this.scriptStatement.action) {
            case 'show':
              this.sprites[this.scriptStatement.target] = this.add.sprite(this.scriptStatement.start.x, this.scriptStatement.start.y, this.scriptStatement.target)
              this.sprites[this.scriptStatement.target].alpha = this.scriptStatement.start.alpha
              this.sprites[this.scriptStatement.target].tween = this.add.tween(this.sprites[this.scriptStatement.target])
              this.sprites[this.scriptStatement.target].tween.to({x: this.scriptStatement.end.x, y: this.scriptStatement.end.y, alpha: this.scriptStatement.end.alpha}, 1000, window.Phaser.Easing[this.scriptStatement.easing.function][this.scriptStatement.easing.type])
              this.sprites[this.scriptStatement.target].tween.start()
              break
          }
          this.scriptIndex++
          this.advanceScript()
          break
        default:
          this.scriptStatement.raw = this.script[this.scriptIndex].split('"')
          this.scriptStatement.say = this.scriptStatement.raw[0]
          this.scriptStatement.text = this.scriptStatement.raw[1]
          this.scriptIndex++
          break
      }
    } else {
      this.destroy()
    }
  },

  preload: function () {
    this.load.text('intro', 'assets/scripts/' + this.scene + '.script')
    this.load.image('sad_winter', 'assets/images/sprites/sad.png')
  },

  create: function () {
    this.script = this.cache.getText(this.scene).split('\n')

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
      if (this.showCharacterCount < this.scriptStatement.text.length) {
        this.showCharacterCount = this.scriptStatement.text.length
      } else {
        this.advanceScript()
      }

      this.advance = false
    }
    if (this.scriptStatement.say) {
      this.say.text = this.scriptStatement.say
    }
    this.text.text = this.scriptStatement.text.substring(0, this.showCharacterCount)
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
