(function (root) {
  'use strict';
  const OP_LABEL = { p: '+', m: '−', x: '×', d: '÷' };
  const NUMBER_LABEL = { '1': '한 자리 수', '2': '두 자리 수', '3': '세 자리 수', '4': '네 자리 수' };
  const VALID = /^[1-4](?:[pmxd][1-4])*$/;
  function parseTemplate(text) {
    if (typeof text !== 'string' || text.length > 400 || !VALID.test(text)) return null;
    return Array.from(text, ch => ({type: NUMBER_LABEL[ch] ? 'number' : 'operator', value: ch}));
  }
  function labelTemplate(text) {
    const parts = parseTemplate(text);
    return parts ? parts.map(t => t.type === 'number' ? NUMBER_LABEL[t.value] : OP_LABEL[t.value]).join(' ') : '';
  }
  function seededRandom(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function evaluate(values, ops) {
    // Operator precedence applies; every intermediate result is checked.
    const val = [values[0]], stack = [];
    const precedence = {p:1,m:1,x:2,d:2};
    function apply() {
      const op = stack.pop();
      const b = val.pop();
      const a = val.pop();
      if (a === undefined || b === undefined) return false;
      let result;
      if (op === 'p') result = a + b;
      if (op === 'm') result = a - b;
      if (op === 'x') result = a * b;
      if (op === 'd') {
        if (!b || a % b !== 0) return false;
        result = a / b;
      }
      if (!Number.isSafeInteger(result) || result < 0 || result > 1000000000) return false;
      val.push(result);
      return true;
    }
    for (let i=0;i<ops.length;i++) {
      const op = ops[i];
      while(stack.length && precedence[stack[stack.length - 1]] >= precedence[op]) {
        if (!apply()) return null;
      }
      stack.push(op);
      val.push(values[i+1]);
    }
    while (stack.length) if (!apply()) return null;
    return val[0];
  }
  function generate(template, count, seed) {
    const tokens = parseTemplate(template);
    if (!tokens || !Number.isInteger(count) || count < 1 || count > 200 || !Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
      return {problems:[], error:'계산식이나 문제 수가 올바르지 않습니다.'};
    }
    const digits = tokens.filter(t => t.type === 'number').map(t => Number(t.value));
    const ops = tokens.filter(t => t.type === 'operator').map(t => t.value);
    const rand = seededRandom(seed);
    const seen = new Set();
    const problems = [];
    const attempts = Math.max(16000, Math.min(100000, count * 1300));
    for(let trial = 0; trial < attempts && problems.length < count; trial++) {
      const values = digits.map(n => {
        const min = 10 ** (n-1);
        return min + Math.floor(rand() * (9 * min));
      });
      const result = evaluate(values, ops);
      if (result === null) continue;
      const key = values.join(',');
      if(seen.has(key)) continue;
      seen.add(key);
      const expression = values.map((n,i) => i === 0 ? String(n) : `${OP_LABEL[ops[i-1]]} ${n}`).join(' ');
      problems.push({expression, answer:result});
    }
    if (problems.length < count) {
      return {problems, error: problems.length === 0
        ? '이 계산식으로는 음수·소수 결과 없이 문제를 만들기 어렵습니다. 자릿수나 연산 순서를 바꿔 주세요.'
        : `조건에 맞는 문제를 ${problems.length}개만 만들었습니다. 자릿수 또는 연산을 조정해 주세요.`};
    }
    return {problems, error:null};
  }
  function answerUrl(template, count, seed) {
    const url = new URL('answer.html', document.baseURI);
    url.search = new URLSearchParams({t:template, n:String(count), s:String(seed)}).toString();
    return url.href;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function drawQr(target, url) {
    if (!target || !root.QRCode) return false;
    const qr = new root.QRCode(-1, 0);
    qr.addData(url);
    qr.make();
    const n = qr.getModuleCount();
    const commands = [];
    for(let y=0;y<n;y++) for(let x=0;x<n;x++) if(qr.isDark(y,x)) commands.push(`M${x+4} ${y+4}h1v1h-1z`);
    target.innerHTML = `<svg viewBox="0 0 ${n+8} ${n+8}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="정답지로 연결되는 QR 코드" shape-rendering="crispEdges"><rect width="${n+8}" height="${n+8}" fill="#fff"/><path fill="#111" d="${commands.join('')}"/></svg>`;
    return true;
  }
  function buildSheets(problems, opts) {
    const {withAnswers, qrUrl} = opts;
    const pages = [];
    for (let offset=0; offset<problems.length; offset+=20) {
      const subset = problems.slice(offset, offset+20);
      const section = document.createElement('section');
      section.className = 'paper';
      section.setAttribute('aria-label', `${Math.floor(offset/20)+1}번째 A4 ${withAnswers ? '정답지' : '문제지'}`);
      section.innerHTML = `<div class="paper-header"><div class="paper-heading"><strong>${withAnswers?'연산 정답지':'연산 문제지'}</strong><span>이름: __________________</span></div><div class="qr-box" ${withAnswers?'hidden':''}></div></div><div class="question-grid"></div><div class="paper-foot">${Math.floor(offset/20)+1} / ${Math.ceil(problems.length/20)}</div>`;
      const grid = section.querySelector('.question-grid');
      // Each page is exactly two columns and ten rows. Keep the same positions on the answer sheet.
      subset.forEach((p,j) => {
        const line = document.createElement('div');
        line.className = 'question';
        const final = withAnswers ? `<strong class="answer-value">${p.answer.toLocaleString('ko-KR')}</strong>` : '<span class="blank">________</span>';
        line.innerHTML = `<span class="question-number">${offset+j+1}.</span><span class="question-expression">${escapeHtml(p.expression)} = ${final}</span>`;
        grid.appendChild(line);
      });
      if(!withAnswers && qrUrl) {
        try {drawQr(section.querySelector('.qr-box'), qrUrl);} catch(e) {section.querySelector('.qr-box').textContent='QR 생성 실패';}
      }
      pages.push(section);
    }
    return pages;
  }
  root.TMM = {parseTemplate, labelTemplate, generate, buildSheets, answerUrl};
})(window);
