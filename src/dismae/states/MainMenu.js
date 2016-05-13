window.Dismae.MainMenu = function (game) {
  this.game = game
  this.dismae = this.game.dismae
  this.ratio = window.innerHeight / 720
  this.displayables = {}
  this.playing = {}
}

window.Dismae.MainMenu.prototype = {
  create: function () {
    // layer for bgs
    this.backgroundLayer = this.add.group()
    // layer for displayables
    this.spriteLayer = this.add.group()
    // layer for ui
    this.uiLayer = this.add.group()

    this.config = this.cache.getJSON('config')
    this.assets = this.cache.getJSON('assets')
    this.parser = this.dismae.Parser(this.cache.getText(this.config.screens.main))

    var statement = this.parser.nextStatement()
    while (statement) {
      switch (statement.type) {
        case 'play':
          this.playing[statement.play] = this.add.audio(statement.play)
          this.playing[statement.play].name = statement.play
          this.playing[statement.play].play()
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

  startGame: function (pointer) {
    for (var key in this.playing) {
      this.playing[key].destroy()
    }

    this.state.start('VisualNovelWrapper')
  }
}
