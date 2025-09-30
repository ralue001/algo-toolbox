function to2(n) { return (Math.round(n * 100) / 100).toFixed(2) }

Page({
  data: {
    loanWan: '',
    yearsOptions: [5,10,15,20,25,30],
    yearsIndex: 5,
    ratePercent: '',
    method: 'bx', // bx 等额本息 / bj 等额本金

    // 结果
    done: false,
    monthly: '',
    firstMonth: '',
    decreasePerMonth: '',
    totalInterest: '',
    totalPay: '',
    totalPeriods: 0,

    // 明细数据
    schedule: [],         // 全量
    displaySchedule: [],  // 展示用（全部 or 前12）
    showAll: true         // 你也可以设为 false，默认只展示12期
  },

  onLoan(e) { this.setData({ loanWan: e.detail.value }) },
  onRate(e) { this.setData({ ratePercent: e.detail.value }) },
  onYearsChange(e) { this.setData({ yearsIndex: Number(e.detail.value) }) },
  onMethodChange(e) { this.setData({ method: e.detail.value }) },

  reset() {
    this.setData({
      loanWan: '', ratePercent: '', method: 'bx',
      done: false, monthly: '', firstMonth:'', decreasePerMonth:'',
      totalInterest:'', totalPay:'', totalPeriods: 0,
      schedule: [], displaySchedule: [], showAll: true
    })
  },

  toggleShowAll() {
    const showAll = !this.data.showAll
    this.setData({
      showAll,
      displaySchedule: showAll ? this.data.schedule : this.data.schedule.slice(0, 12)
    })
  },

  /** 计算主流程（全量期数） */
  calc() {
    const loanWan = parseFloat(this.data.loanWan)
    const years = this.data.yearsOptions[this.data.yearsIndex]
    const rate = parseFloat(this.data.ratePercent)

    if (!loanWan || !years || !rate) {
      wx.showToast({ title: '请完整填写', icon: 'none' })
      return
    }

    const P = loanWan * 10000    // 本金（元）
    const n = years * 12         // 期数（月）
    const r = rate / 100 / 12    // 月利率

    if (this.data.method === 'bx') {
      // 等额本息
      const pow = Math.pow(1 + r, n)
      const M = P * r * pow / (pow - 1)
      const totalPay = M * n
      const totalInterest = totalPay - P

      let remain = P
      const schedule = []
      for (let i = 1; i <= n; i++) {
        const interest = remain * r
        const principal = M - interest
        remain -= principal
        schedule.push({
          i,
          pay: to2(M),
          principal: to2(principal),
          interest: to2(interest),
          remain: to2(Math.max(remain, 0))
        })
      }

      this.setData({
        done: true,
        monthly: to2(M),
        totalInterest: to2(totalInterest),
        totalPay: to2(totalPay),
        totalPeriods: n,
        schedule,
        displaySchedule: this.data.showAll ? schedule : schedule.slice(0, 12)
      })

    } else {
      // 等额本金
      const principalPerMonth = P / n
      let totalInterest = 0
      const schedule = []
      let first = 0, second = 0

      for (let i = 1; i <= n; i++) {
        const remainBefore = P - principalPerMonth * (i - 1)
        const interest = remainBefore * r
        const pay = principalPerMonth + interest
        totalInterest += interest

        if (i === 1) first = pay
        if (i === 2) second = pay

        schedule.push({
          i,
          pay: to2(pay),
          principal: to2(principalPerMonth),
          interest: to2(interest),
          remain: to2(Math.max(remainBefore - principalPerMonth, 0))
        })
      }

      const dec = first - second                 // 每月递减
      const totalPay = P + totalInterest

      this.setData({
        done: true,
        firstMonth: to2(first),
        decreasePerMonth: to2(dec),
        totalInterest: to2(totalInterest),
        totalPay: to2(totalPay),
        totalPeriods: n,
        schedule,
        displaySchedule: this.data.showAll ? schedule : schedule.slice(0, 12)
      })
    }
  },

  /** 生成 CSV 字符串（含 BOM，Excel 打开不乱码） */
  buildCSV() {
    const head = ['期数','月供(元)','本金(元)','利息(元)','剩余本金(元)']
    const rows = this.data.schedule.map(r => [r.i, r.pay, r.principal, r.interest, r.remain])
    const csv = [head, ...rows].map(arr => arr.join(',')).join('\n')
    return '\ufeff' + csv  // 加 BOM
  },

  /** 导出 CSV 到本地（持久化），并尝试打开 */
  exportCSV() {
    if (!this.data.schedule.length) {
      wx.showToast({ title: '请先计算', icon: 'none' }); 
      return;
    }
    const fs = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/mortgage_${Date.now()}.csv`;
    const csv = this.buildCSV(); // 已包含 BOM
  
    fs.writeFile({
      filePath,
      data: csv,
      encoding: 'utf8',
      success: () => {
        // 说明保存在哪里 + 提供复制
        wx.showModal({
          title: '已导出 CSV',
          content: `文件已保存：\n${filePath}\n\n部分机型不支持直接预览 CSV，建议“复制 CSV 内容”发到电脑或用表格软件打开。`,
          confirmText: '复制内容',
          cancelText: '知道了',
          success: (res) => { if (res.confirm) this.copyCSV(); }
        });
  
        // 尝试直接打开（很多机型/模拟器对 csv 支持不一致，失败就忽略）
        wx.openDocument({
          filePath,
          fileType: 'csv',
          fail: () => {}
        });
      },
      fail: (err) => {
        console.error('writeFile fail', err);
        wx.showToast({ title: '写入失败', icon: 'none' });
      }
    });
  },

  /** 复制 CSV 文本到剪贴板（最快速分享方式） */
  copyCSV() {
    if (!this.data.schedule.length) {
      wx.showToast({ title: '请先计算', icon: 'none' }); return
    }
    wx.setClipboardData({
      data: this.buildCSV(),
      success: () => wx.showToast({ title: '已复制' })
    })
  }
})
