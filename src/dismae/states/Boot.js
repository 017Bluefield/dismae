window.Dismae = {}

window.Dismae.Boot = function (game) {}

window.Dismae.Boot.prototype = {
  init: function () {
    this.input.maxPointers = 1
    //  Phaser will automatically pause if the browser tab the game is in loses focus. You can disable that here:
    this.stage.disableVisibilityChange = true
    if (this.game.device.desktop) {
      //  If you have any desktop specific settings, they can go in here
      this.scale.pageAlignHorizontally = true
    } else {
      //  Same goes for mobile settings.
      //  In this case we're saying "scale the game, no lower than 480x260 and no higher than 1024x768"
      this.scale.scaleMode = window.Phaser.ScaleManager.SHOW_ALL
      this.scale.setMinMax(480, 260, 1024, 768)
      this.scale.forceLandscape = true
      this.scale.pageAlignHorizontally = true
    }

    this.scale.fullScreenScaleMode = window.Phaser.ScaleManager.EXACT_FIT
    this.stage.smoothed = false
  },

  preload: function () {
    //  Here we load the assets required for our preloader (in this case a background and a loading bar)
    this.load.json('assets', 'assets.json')
    this.load.json('config', 'config.json')

    this.load.image('preloaderBackground', 'images/ui/preloader/loader_background.jpg')
    this.load.image('preloaderBar', 'images/ui/preloader/loader_bar.png')
  },

  create: function () {
    function startPreloader () {
      this.load.onLoadComplete.remove(startPreloader, this)
      this.state.start('Preloader')
    }

    this.config = this.cache.getJSON('config')
    this.assets = this.cache.getJSON('assets')

    this.load.onLoadComplete.add(startPreloader, this)

    this.load.text(this.config.screens.main, this.assets[this.config.screens.main].path)
    this.load.start()
  }
}
