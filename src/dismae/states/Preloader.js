window.Dismae.Preloader = function (game) {
  this.background = null
  this.preloadBar = null
  this.ready = false
  this.ratio = window.innerHeight / 720
}

window.Dismae.Preloader.prototype = {
  preload: function () {
    this.background = this.add.sprite(0, 0, 'preloaderBackground')
    this.background.scale.setTo(this.ratio)
    this.preloadBar = this.add.sprite(100 * this.ratio, 400 * this.ratio, 'preloaderBar')

    this.load.setPreloadSprite(this.preloadBar)

    this.load.image('titlepage', 'assets/images/ui/main_menu/main_menu.jpg')
    this.load.atlas('playButton', 'assets/images/ui/main_menu/play_button.png', 'assets/images/ui/main_menu/play_button.json')
    this.load.audio('titleMusic', ['assets/sounds/music/main_menu.mp3'])

    this.load.json('settings', 'assets.json')
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

    if (this.cache.isSoundDecoded('titleMusic') && this.ready === false) {
      this.ready = true
      this.state.start('MainMenu')
    }
  }
}
