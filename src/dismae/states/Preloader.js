window.Dismae.Preloader = function (game) {
  this.game = game
  this.background = null
  this.preloadBar = null
  this.ready = false
  this.ratio = window.innerHeight / 720
  this.dismae = this.game.dismae
}

window.Dismae.Preloader.prototype = {
  preload: function () {
    this.background = this.add.sprite(0, 0, 'preloaderBackground')
    this.background.scale.setTo(this.ratio)
    this.preloadBar = this.add.sprite(100 * this.ratio, 400 * this.ratio, 'preloaderBar')

    this.load.setPreloadSprite(this.preloadBar)

    this.config = this.cache.getJSON('config')
    this.assets = this.cache.getJSON('assets')

    this.load.text(this.config.screens.main, this.assets[this.config.screens.main].path)

    this.parser = this.dismae.Parser(this.cache.getText(this.config.screens.main))

    this.nextAsset = this.parser.nextAsset()
    while (this.nextAsset) {
      switch (this.nextAsset.type) {
        case 'image':
          this.load.image(this.nextAsset.asset, this.assets[this.nextAsset.asset].path)
          break
        case 'audio':
          this.load.audio(this.nextAsset.asset, this.assets[this.nextAsset.asset].path)
          break
        case 'atlas':
          this.load.atlas(this.nextAsset.asset, this.assets[this.nextAsset.asset].path, this.assets[this.nextAsset.atlas].path)
          break
      }

      this.nextAsset = this.parser.nextAsset()
    }
  },

  create: function () {
    //  Once the load has finished we disable the crop because we're going to sit in the update loop for a short while as the music decodes
    this.preloadBar.cropEnabled = false
  },

  update: function () {
    //  You don't actually need to do this, but I find it gives a much smoother game experience.
    //  Basically it will wait for our audio file to be decoded before proceeding to the MainMenu.
    //  You can jump right into the menu if you want and still play the music, but you'll have a few
    //  seconds of delay while the mp3 decodes - so if you need your music to be in-sync with your menu
    //  it's best to wait for it to decode here first, then carry on.

    //  If you don't have any music in your game then put the game.state.start line into the create function and delete
    //  the update function completely.

    if (this.cache.isSoundDecoded('main_menu') && this.ready === false) {
      this.ready = true
      this.state.start('MainMenu')
    }
  }
}
