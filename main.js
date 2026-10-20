(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 let formula = '3p2';
 let worksheet = null;
 let qrUrl = '';
 const normalizeCount = () => {
   const value = Number($('count').value);
   if(!Number.isInteger(value) || value < 1 || value > 200) return null;
   return value;
 };
 function show(message) {$('status').textContent=message;$('status').hidden=!message;}
 function refreshFormula() {
   $('expression').textContent=TMM.labelTemplate(formula)||'숫자 버튼을 눌러주세요';
   const expectingNumber = !formula || 'pmxd'.includes(formula[formula.length-1]);
   document.querySelectorAll('[data-digit]').forEach(b=>b.disabled=!expectingNumber);
   document.querySelectorAll('[data-op]').forEach(b=>b.disabled=expectingNumber);
 }
 function renderProblem() {
   $('sheets').replaceChildren(...TMM.buildSheets(worksheet.problems,{withAnswers:false,qrUrl}));
   $('printMount').replaceChildren(...TMM.buildSheets(worksheet.problems,{withAnswers:false,qrUrl}));
 }
 function makeProblems() {
   const count=normalizeCount();
   if(count===null) {show('문제 수는 1~200 사이의 정수로 입력해 주세요.');return false;}
   if(!TMM.parseTemplate(formula)) {show('숫자와 연산 기호를 번갈아 입력해 완성된 계산식을 만들어 주세요.');return false;}
   const seed=Math.floor(Math.random()*4294967296);
   const generated=TMM.generate(formula,count,seed);
   if(generated.error) {show(generated.error);return false;}
   worksheet={problems:generated.problems,template:formula,count,seed};
   qrUrl=TMM.answerUrl(formula,count,seed);
   show(location.protocol==='file:'?'로컬 파일로 열었습니다. 스마트폰 QR 접속은 GitHub Pages에 업로드한 후 이용할 수 있습니다.':'');
   renderProblem();
   return true;
 }
 document.querySelectorAll('[data-digit]').forEach(button=>button.addEventListener('click',()=>{formula+=button.dataset.digit;show('');refreshFormula();}));
 document.querySelectorAll('[data-op]').forEach(button=>button.addEventListener('click',()=>{formula+=button.dataset.op;show('');refreshFormula();}));
 $('backspace').addEventListener('click',()=>{formula=formula.slice(0,-1);show('');refreshFormula();});
 $('clear').addEventListener('click',()=>{formula='';show('');refreshFormula();});
 $('generate').addEventListener('click',makeProblems);
 $('count').addEventListener('change',()=>{
   const count=normalizeCount();
   show(count===null?'문제 수는 1~200 사이로 지정해 주세요.':'설정한 문제 수를 적용하려면 문제 생성을 눌러 주세요.');
 });
 $('printProblems').addEventListener('click',()=>{if(worksheet)window.print();});
 $('openAnswers').addEventListener('click',()=>{if(worksheet)window.open(qrUrl,'_blank','noopener,noreferrer');});
 function setMenu(open){$('drawer').hidden=!open;$('drawerBg').hidden=!open;$('menuOpen').setAttribute('aria-expanded',String(open));}
 $('menuOpen').addEventListener('click',()=>setMenu(true));
 $('menuClose').addEventListener('click',()=>setMenu(false));
 $('drawerBg').addEventListener('click',()=>setMenu(false));
 document.querySelectorAll('[data-menu]').forEach(b=>b.addEventListener('click',()=>{
   if(b.dataset.menu==='basic'){setMenu(false);return;}
   $('menuNotice').textContent='이 메뉴는 추후 개발 예정입니다. 현재는 기본 사칙연산만 사용할 수 있습니다.';
 }));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false);});
 refreshFormula();
 makeProblems();
})();
