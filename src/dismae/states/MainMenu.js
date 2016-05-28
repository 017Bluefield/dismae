window.Dismae.MainMenu = function (game) {
  this.game = game
  this.dismae = this.game.dismae
  this.ratio = window.innerHeight / 720
}

window.Dismae.MainMenu.prototype = {
  preload: function () {
    this.config = this.cache.getJSON('config')
    this.menu = new window.Dismae.Menu(this, this.config.screens.main)
    this.menu.preload()
  },

  create: function () {
    this.menu.create()
  },

  update: function () {
    this.menu.update()
  },

  render: function () {
    // this.menu.render()
  }
}
