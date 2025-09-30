Page({
  goCalc() {
    wx.navigateTo({ url: '/pages/calc/index/index' })
  },
  goMortgage() {
    wx.navigateTo({ url: '/pages/mortgage/index/index' })
  },
  comingSoon() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  }
})

