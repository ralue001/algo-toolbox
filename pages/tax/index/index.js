Page({
  data: {
    // 输入
    salary: '',          // 税前月薪
    insMode: 'amount',   // 五险一金：amount | percent
    insAmount: '',       // 按金额
    insPercent: '',      // 按比例(百分比)
    extraDeduct: '',     // 专项附加扣除
    stdDeduct: '5000',   // 标准扣除（默认5000）
    bonus: '',

    // 月度结果（展示用）
    monthDone: false,
    taxable: 0,
    quick: 0,
    rate: 0,
    ratePercent: 0,
    tax: 0,
    after: 0,
    taxableStr: '',
    taxStr: '',
    afterStr: '',

    // 年终奖结果（展示用）
    bonusDone: false,
    bonusRateA: 0,
    bonusRateAPercent: 0,
    bonusQuickA: 0,
    bonusTaxA: 0,
    bonusAfterA: 0,
    bonusTaxAStr: '',
    bonusAfterAStr: '',
    bonusTaxB: 0,
    bonusAfterB: 0,
    bonusTaxBStr: '',
    bonusAfterBStr: ''
  },

  /* ---------- 工具 ---------- */
  _num(v) { return Number(v) || 0; },
  _round2(n) { return Math.round(n * 100) / 100; },
  _to2(n) { return this._round2(n).toFixed(2); },

  // 按“综合所得 月度”阶梯获取税率/速算扣除额
  _getRateQuick(monthTaxable) {
    const t = monthTaxable;
    if (t <= 0) return { rate: 0, quick: 0 };
    if (t <= 3000) return { rate: 0.03, quick: 0 };
    if (t <= 12000) return { rate: 0.10, quick: 210 };
    if (t <= 25000) return { rate: 0.20, quick: 1410 };
    if (t <= 35000) return { rate: 0.25, quick: 2660 };
    if (t <= 55000) return { rate: 0.30, quick: 4410 };
    if (t <= 80000) return { rate: 0.35, quick: 7160 };
    return { rate: 0.45, quick: 15160 };
  },

  _calcTaxFromTaxable(taxable) {
    const { rate, quick } = this._getRateQuick(taxable);
    const tax = this._round2(Math.max(0, taxable * rate - quick));
    return { tax, rate, quick };
  },

  _currentInsAmount(salary) {
    if (this.data.insMode === 'percent') {
      const p = this._num(this.data.insPercent);
      return this._round2(salary * p / 100);
    }
    return this._num(this.data.insAmount);
  },

  /* ---------- 事件 ---------- */
  onSalary(e) { this.setData({ salary: e.detail.value }); },
  onInsMode(e) { this.setData({ insMode: e.detail.value }); },
  onInsAmount(e) { this.setData({ insAmount: e.detail.value }); },
  onInsPercent(e) { this.setData({ insPercent: e.detail.value }); },
  onExtra(e) { this.setData({ extraDeduct: e.detail.value }); },
  onStd(e) { this.setData({ stdDeduct: e.detail.value }); },
  onBonus(e) { this.setData({ bonus: e.detail.value }); },

  /* ---------- 计算：月度 ---------- */
  calcMonth() {
    const salary = this._num(this.data.salary);
    const ins = this._currentInsAmount(salary);
    const extra = this._num(this.data.extraDeduct);
    const std = this._num(this.data.stdDeduct);

    const taxable = this._round2(Math.max(0, salary - ins - std - extra));
    const { tax, rate, quick } = this._calcTaxFromTaxable(taxable);
    const after = this._round2(salary - ins - tax);

    this.setData({
      monthDone: true,
      taxable, tax, after, quick, rate,
      ratePercent: Math.round(rate * 100),
      taxableStr: this._to2(taxable),
      taxStr: this._to2(tax),
      afterStr: this._to2(after)
    });
  },

  /* ---------- 计算：年终奖 ---------- */
  calcBonus() {
    // 先确保月度部分有参考（合并计算要用到）
    if (!this.data.monthDone) this.calcMonth();

    const bonus = this._num(this.data.bonus);
    const salary = this._num(this.data.salary);
    const ins = this._currentInsAmount(salary);
    const extra = this._num(this.data.extraDeduct);
    const std = this._num(this.data.stdDeduct);

    // 方案A：年终奖单独计税（按 bonus/12 对应的月度税率 & 速算）
    const avg = bonus / 12;
    const { rate: rateA, quick: quickA } = this._getRateQuick(avg);
    const bonusTaxA = this._round2(Math.max(0, bonus * rateA - quickA));
    const bonusAfterA = this._round2(bonus - bonusTaxA);

    // 方案B：并入当月工资计税（计算差额）
    const baseTaxable = this._round2(Math.max(0, salary - ins - std - extra));
    const withBonusTaxable = this._round2(Math.max(0, salary + bonus - ins - std - extra));
    const { tax: taxBefore } = this._calcTaxFromTaxable(baseTaxable);
    const { tax: taxAfter } = this._calcTaxFromTaxable(withBonusTaxable);
    const bonusTaxB = this._round2(Math.max(0, taxAfter - taxBefore));
    const bonusAfterB = this._round2(bonus - bonusTaxB);

    this.setData({
      bonusDone: true,
      bonusRateA: rateA,
      bonusRateAPercent: Math.round(rateA * 100),
      bonusQuickA: quickA,
      bonusTaxA, bonusAfterA,
      bonusTaxAStr: this._to2(bonusTaxA),
      bonusAfterAStr: this._to2(bonusAfterA),
      bonusTaxB, bonusAfterB,
      bonusTaxBStr: this._to2(bonusTaxB),
      bonusAfterBStr: this._to2(bonusAfterB)
    });
  },

  /* ---------- 重置 ---------- */
  resetAll() {
    this.setData({
      salary: '', insMode: 'amount', insAmount: '', insPercent: '',
      extraDeduct: '', stdDeduct: '5000', bonus: '',
      monthDone: false, bonusDone: false,
      taxable: 0, quick: 0, rate: 0, ratePercent: 0, tax: 0, after: 0,
      taxableStr: '', taxStr: '', afterStr: '',
      bonusRateA: 0, bonusRateAPercent: 0, bonusQuickA: 0,
      bonusTaxA: 0, bonusAfterA: 0, bonusTaxAStr: '', bonusAfterAStr: '',
      bonusTaxB: 0, bonusAfterB: 0, bonusTaxBStr: '', bonusAfterBStr: ''
    });
  }
});
