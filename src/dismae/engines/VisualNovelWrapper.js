window.Dismae.VisualNovelWrapper = function (game) {
  this.ratio = window.innerHeight / 720
  this.dismae = game.dismae
}

window.Dismae.VisualNovelWrapper.prototype = {
  preload: function () {
    this.visualNovel = new window.Dismae.VisualNovel(this, 'intro')
    this.visualNovel.preload()
  },

  create: function () {
    this.visualNovel.create()
  },

  update: function () {
    if (this.visualNovel.alive === true) {
      this.visualNovel.update()
    } else {
      this.quitGame()
    }
  },

  render: function () {
    // this.visualNovel.render()
  },

  quitGame: function (pointer) {
    //  Here you should destroy anything you no longer need.
    //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

    this.state.start('MainMenu')
  }
}
