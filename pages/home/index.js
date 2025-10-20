Page({
  data: { selected: '' },

  // 通用点击：先高亮，再跳转
  tapTile(e) {
    const { id, url } = e.currentTarget.dataset
    this.setData({ selected: id })
    // 给 120ms 视觉反馈时间
    setTimeout(() => {
      wx.navigateTo({ url })
    }, 120)
  }
})
