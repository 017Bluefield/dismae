window.Dismae.Menu = function (game, menu) {
  this.game = game
  this.menu = menu
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

window.Dismae.Menu.prototype = {
  displayables: {},
  playing: {},
  startGame: function (pointer) {
    for (var key in this.playing) {
      this.playing[key].destroy()
    }

    this.state.start('VisualNovelWrapper')
  },

  preload: function () {},

  create: function () {
    // layer for bgs
    this.backgroundLayer = this.add.group()
    // layer for displayables
    this.spriteLayer = this.add.group()
    // layer for ui
    this.uiLayer = this.add.group()

    this.config = this.cache.getJSON('config')
    this.assets = this.cache.getJSON('assets')
    this.parser = this.dismae.Parser(this.cache.getText(this.menu))

    var statement = this.parser.nextStatement()
    while (statement) {
      switch (statement.type) {
        case 'play':
          this.playing[statement.play] = this.add.audio(statement.play)
          this.playing[statement.play].name = statement.play
          statement.volume = statement.volume === undefined ? 1 : statement.volume
          this.playing[statement.play].play('', 0, statement.volume, statement.loop)
          if (statement.animate) {
            this.playing[statement.play].tween = this.add.tween(this.playing[statement.play])
            this.playing[statement.play].tween.to(
              statement.to,
              statement.over * 1000,
              window.Phaser.Easing[statement.function.name][statement.function.type],
              true
            )
          }
          break
        case 'show':
          if (statement.as === 'background') {
            this.displayables[statement.show] = this.backgroundLayer.create(statement.x, statement.y, statement.show)
          } else {
            this.displayables[statement.show] = this.spriteLayer.create(statement.x, statement.y, statement.show)
          }

          if (statement.alpha === undefined) {
            this.displayables[statement.show].alpha = 1
          } else {
            this.displayables[statement.show].alpha = statement.alpha
          }

          if (statement.animate) {
            this.displayables[statement.show].tween = this.add.tween(this.displayables[statement.show])
            this.displayables[statement.show].tween.to(
              statement.to,
              statement.over * 1000,
              window.Phaser.Easing[statement.function.name][statement.function.type],
              true
            )
          }
          break
        case 'button':
          this.displayables[statement.button] = this.add.button(statement.x, statement.y, statement.button, this[statement.execute], this, 'over', 'out', 'down', 'up')
          this.uiLayer.add(this.displayables[statement.button])

          if (statement.alpha === undefined) {
            this.displayables[statement.button].alpha = 1
          } else {
            this.displayables[statement.button].alpha = statement.alpha
          }

          if (statement.animate) {
            this.displayables[statement.button].tween = this.add.tween(this.displayables[statement.button])
            this.displayables[statement.button].tween.to(
              statement.to,
              statement.over * 1000,
              window.Phaser.Easing[statement.function.name][statement.function.type],
              true
            )
          }
          break
      }
      statement = this.parser.nextStatement()
    }
  },

  update: function () {},

  destroy: function () {},

  render: function () {}
}
