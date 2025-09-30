function f2(n) { return (Math.round(n * 100) / 100).toFixed(2) }

// 工资薪金预扣率表（常见口径）
const TABLE = [
  { upto: 3000,  rate: 0.03, quick: 0 },
  { upto: 12000, rate: 0.10, quick: 210 },
  { upto: 25000, rate: 0.20, quick: 1410 },
  { upto: 35000, rate: 0.25, quick: 2660 },
  { upto: 55000, rate: 0.30, quick: 4410 },
  { upto: 80000, rate: 0.35, quick: 7160 },
  { upto: Infinity, rate: 0.45, quick: 15160 },
];

function pickRateQuick(taxable) {
  for (const row of TABLE) {
    if (taxable <= row.upto) return { rate: row.rate, quick: row.quick };
  }
  return { rate: 0, quick: 0 };
}

Page({
  data: {
    // 输入
    salary: '',           // 税前月薪
    insMode: 'amount',    // amount / percent
    insAmount: '',
    insPercent: '',
    extraDeduct: '',      // 专项附加（每月合计）
    stdDeduct: '5000',
    bonus: '',

    // 月度结果
    monthDone: false,
    taxable: '0.00',
    rate: 0,
    quick: 0,
    tax: '0.00',
    after: '0.00',

    // 年终奖结果
    bonusDone: false,
    bonusRateA: 0,
    bonusQuickA: 0,
    bonusTaxA: '0.00',
    bonusAfterA: '0.00',
    bonusTaxB: '0.00',
    bonusAfterB: '0.00'
  },

  // 输入绑定
  onSalary(e){ this.setData({ salary: e.detail.value }) },
  onInsMode(e){ this.setData({ insMode: e.detail.value }) },
  onInsAmount(e){ this.setData({ insAmount: e.detail.value }) },
  onInsPercent(e){ this.setData({ insPercent: e.detail.value }) },
  onExtra(e){ this.setData({ extraDeduct: e.detail.value }) },
  onStd(e){ this.setData({ stdDeduct: e.detail.value }) },
  onBonus(e){ this.setData({ bonus: e.detail.value }) },

  resetAll(){
    this.setData({
      salary:'', insMode:'amount', insAmount:'', insPercent:'',
      extraDeduct:'', stdDeduct:'5000', bonus:'',
      monthDone:false, taxable:'0.00', rate:0, quick:0, tax:'0.00', after:'0.00',
      bonusDone:false, bonusRateA:0, bonusQuickA:0, bonusTaxA:'0.00', bonusAfterA:'0.00',
      bonusTaxB:'0.00', bonusAfterB:'0.00'
    })
  },

  // 计算月度
  calcMonth(){
    const salary = parseFloat(this.data.salary || '0')
    if (!salary) { wx.showToast({ title:'请输入税前月薪', icon:'none' }); return }

    let ins = 0
    if (this.data.insMode === 'amount') {
      ins = parseFloat(this.data.insAmount || '0')
    } else {
      const p = parseFloat(this.data.insPercent || '0')
      ins = salary * (isNaN(p) ? 0 : p/100)
    }
    const extra = parseFloat(this.data.extraDeduct || '0')
    const std = parseFloat(this.data.stdDeduct || '0') || 0

    const taxable = Math.max(0, salary - ins - extra - std)
    const { rate, quick } = pickRateQuick(taxable)
    const tax = Math.max(0, taxable * rate - quick)
    const after = salary - ins - tax

    this.setData({
      monthDone: true,
      taxable: f2(taxable),
      rate, quick,
      tax: f2(tax),
      after: f2(after)
    })
  },

  // 计算年终奖（两种方案）
  calcBonus(){
    const bonus = parseFloat(this.data.bonus || '0')
    if (!bonus){ wx.showToast({ title:'请输入年终奖', icon:'none' }); return }

    // 方案A：单独计税
    const avg = bonus / 12
    const { rate: rateA, quick: quickA } = pickRateQuick(avg)
    const bonusTaxA = Math.max(0, bonus * rateA - quickA)
    const bonusAfterA = bonus - bonusTaxA

    // 方案B：并入当月工资（与工资合并后重算差额）
    // 如果还没算过月度，就先按当前输入快速算一次（不含年终奖）
    if (!this.data.monthDone) this.calcMonth()
    const baseTaxable = parseFloat(this.data.taxable)
    const { rate: rateBase, quick: quickBase } = pickRateQuick(baseTaxable)
    const baseTax = Math.max(0, baseTaxable * rateBase - quickBase)

    const mergeTaxable = baseTaxable + bonus
    const { rate: rateMerge, quick: quickMerge } = pickRateQuick(mergeTaxable)
    const mergeTax = Math.max(0, mergeTaxable * rateMerge - quickMerge)
    const bonusTaxB = Math.max(0, mergeTax - baseTax)
    const bonusAfterB = bonus - bonusTaxB

    this.setData({
      bonusDone: true,
      bonusRateA: rateA, bonusQuickA: quickA,
      bonusTaxA: f2(bonusTaxA), bonusAfterA: f2(bonusAfterA),
      bonusTaxB: f2(bonusTaxB), bonusAfterB: f2(bonusAfterB)
    })
  }
})

