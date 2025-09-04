Page({
  data: {
    current: '',
    prev: null,
    op: null,
    isNew: false,
    expression: '' // 记录表达式
  },

  inputNum(e) {
    const num = e.currentTarget.dataset.num;
    if (this.data.isNew) {
      this.setData({ current: num, isNew: false });
    } else {
      this.setData({ current: (this.data.current || '') + num });
    }
  },

  dot() {
    if (!this.data.current.includes('.')) {
      this.setData({ current: (this.data.current || '0') + '.' });
    }
  },

  clear() {
    this.setData({ current: '', prev: null, op: null, isNew: false, expression: '' });
  },

  toggleSign() {
    if (this.data.current) {
      this.setData({ current: String(-parseFloat(this.data.current)) });
    }
  },

  percent() {
    if (this.data.current) {
      this.setData({ current: String(parseFloat(this.data.current) / 100) });
    }
  },

  operate(e) {
    const op = e.currentTarget.dataset.op;
    if (this.data.current) {
      this.setData({
        prev: this.data.current,
        op,
        isNew: true,
        expression: this.data.current + ' ' + op
      });
    }
  },

  calculate() {
    if (this.data.prev && this.data.op && this.data.current) {
      const a = parseFloat(this.data.prev);
      const b = parseFloat(this.data.current);
      let result = 0;
      switch (this.data.op) {
        case '+': result = a + b; break;
        case '-': result = a - b; break;
        case '×': result = a * b; break;
        case '÷': result = b !== 0 ? a / b : '错误'; break;
      }

      this.setData({
        current: String(result),
        expression: this.data.prev + ' ' + this.data.op + ' ' + this.data.current,
        prev: null,
        op: null,
        isNew: true
      });
    }
  }
});
