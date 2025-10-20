Page({
  onLoad() {
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/home/index' })
    }, 200);
  }
})
