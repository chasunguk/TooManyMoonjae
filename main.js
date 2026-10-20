(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 let formula='',difficulty='mid',specs=[],worksheet=null,qrUrl='';
 const getLayout=()=>({cols:Number($('columns').value),rows:Number($('rows').value)});
 const validLayout=l=>Number.isInteger(l.cols)&&l.cols>=1&&l.cols<=4&&Number.isInteger(l.rows)&&l.rows>=1&&l.rows<=15;
 const countValue=()=>Number($('itemCount').value);
 const validCount=n=>Number.isInteger(n)&&n>=1&&n<=200;
 const totalCount=()=>specs.reduce((sum,s)=>sum+s.count,0);
 const levelName={low:'하',mid:'중',high:'상'};
 function show(msg){$('status').textContent=msg;$('status').hidden=!msg;}
 function markChanged(){if(worksheet)show('구성표가 변경되었습니다. 적용하려면 문제지 생성하기를 다시 눌러 주세요.');}
 function refreshFormula(){
   $('expression').textContent=TMM.labelTemplate(formula)||'';
   const expects=!formula||'pmxd'.includes(formula.at(-1));
   document.querySelectorAll('[data-digit]').forEach(b=>b.disabled=!expects);
   document.querySelectorAll('[data-op]').forEach(b=>b.disabled=expects);
   $('addType').disabled=!TMM.parseTemplate(formula)||formula.length<3;
 }
 function refreshDifficulty(){
   document.querySelectorAll('[data-level]').forEach(b=>{
     const chosen=b.dataset.level===difficulty;b.classList.toggle('selected',chosen);b.setAttribute('aria-pressed',String(chosen));
   });
 }
 function refreshList(){
   const list=$('typeList');list.replaceChildren();
   if(!specs.length){const p=document.createElement('p');p.className='empty-msg';p.innerHTML='계산식을 조립한 뒤 <b>유형 추가</b>를 눌러 주세요.';list.appendChild(p);}
   specs.forEach((s,i)=>{
     const row=document.createElement('div');row.className='type-row';
     const text=document.createElement('span');text.className='type-formula';text.textContent=`${i+1}. ${TMM.labelTemplate(s.template)}`;
     const level=document.createElement('span');level.className='type-level';level.textContent=levelName[s.difficulty];
     const lbl=document.createElement('label');lbl.className='type-quantity';lbl.textContent='문제 수 ';
     const input=document.createElement('input');input.type='number';input.min='1';input.max='200';input.step='1';input.value=s.count;input.setAttribute('aria-label',`${i+1}번째 유형 문제 수`);
     input.addEventListener('change',()=>{
       const next=Number(input.value);
       if(!validCount(next)||totalCount()-s.count+next>200){show('전체 문제는 최대 200문제이며, 각 유형은 1문제 이상이어야 합니다.');input.value=s.count;return;}
       s.count=next;refreshList();markChanged();
     });lbl.appendChild(input);
     const remove=document.createElement('button');remove.className='type-remove';remove.type='button';remove.textContent='삭제';remove.setAttribute('aria-label',`${i+1}번째 유형 삭제`);
     remove.addEventListener('click',()=>{specs.splice(i,1);refreshList();markChanged();});
     row.append(text,level,lbl,remove);list.appendChild(row);
   });
   $('compositionTotal').textContent=`총 ${totalCount()}문제 · ${specs.length}개 유형`;
   $('generate').disabled=!specs.length;
   updateLayout();
 }
 function updateLayout(){
   const l=getLayout(),total=totalCount();
   $('layoutInfo').textContent=validLayout(l)?`한 장에 ${l.cols}열 × ${l.rows}행 = ${l.cols*l.rows}문제${total?` · 총 ${Math.ceil(total/(l.cols*l.rows))}장`:''}`:'열 1~4, 행 1~15 사이로 지정해 주세요.';
 }
 function addType(){
   if(!TMM.parseTemplate(formula)||formula.length<3){show('숫자와 연산자를 조합해 완성된 식을 만들어 주세요.');return;}
   const count=countValue();
   if(!validCount(count)){show('추가할 문제 수는 1~200 사이로 입력해 주세요.');return;}
   if(specs.length>=20){show('한 번에 최대 20개 유형을 등록할 수 있습니다.');return;}
   if(totalCount()+count>200){show('문제지 한 묶음은 최대 200문제까지 만들 수 있습니다.');return;}
   specs.push({template:formula,difficulty,count});formula='';refreshFormula();refreshList();markChanged();
 }
 function renderProblems(){
   const layout=getLayout();
   qrUrl=TMM.answerUrl(worksheet.specs,worksheet.seed,layout,worksheet.order);
   const cfg={withAnswers:false,qrUrl,specs:worksheet.specs,layout};
   $('sheets').replaceChildren(...TMM.buildSheets(worksheet.problems,cfg));
   $('printMount').replaceChildren(...TMM.buildSheets(worksheet.problems,cfg));
   $('openAnswers').disabled=false;$('printProblems').disabled=false;
 }
 function generate(){
   if(!validLayout(getLayout())){show('한 장 배치는 열 1~4, 행 1~15 사이의 정수로 설정해 주세요.');return;}
   if(!specs.length){show('문제 유형을 먼저 추가해 주세요.');return;}
   const seed=Math.floor(Math.random()*4294967296);
   const order=document.querySelector('input[name="order"]:checked').value;
   const copy=specs.map(s=>({...s}));
   const result=TMM.generateBundle(copy,seed,order);
   if(result.error){show(result.error);return;}
   worksheet={specs:copy,seed,order,problems:result.problems};
   renderProblems();
   show(location.protocol==='file:'?'문제지를 생성했습니다. QR은 GitHub Pages에 올린 뒤 스마트폰에서 사용할 수 있습니다.':'');
 }
 document.querySelectorAll('[data-digit]').forEach(b=>b.addEventListener('click',()=>{formula+=b.dataset.digit;show('');refreshFormula();}));
 document.querySelectorAll('[data-op]').forEach(b=>b.addEventListener('click',()=>{formula+=b.dataset.op;show('');refreshFormula();}));
 document.querySelectorAll('[data-level]').forEach(b=>b.addEventListener('click',()=>{difficulty=b.dataset.level;refreshDifficulty();}));
 $('backspace').addEventListener('click',()=>{formula=formula.slice(0,-1);show('');refreshFormula();});
 $('clear').addEventListener('click',()=>{formula='';show('');refreshFormula();});
 $('addType').addEventListener('click',addType);
 $('generate').addEventListener('click',generate);
 $('itemCount').addEventListener('change',()=>{if(!validCount(countValue()))show('추가할 문제 수는 1~200 사이로 입력해 주세요.');});
 ['columns','rows'].forEach(id=>$(id).addEventListener('change',()=>{
   updateLayout();if(!validLayout(getLayout())){show('열 1~4, 행 1~15 사이로 지정해 주세요.');return;}
   if(worksheet){renderProblems();show('행·열 배치를 미리보기에 반영했습니다.');}
 }));
 $('printProblems').addEventListener('click',()=>{if(worksheet)window.print();});
 $('openAnswers').addEventListener('click',()=>{if(worksheet)window.open(qrUrl,'_blank','noopener,noreferrer');});
 function menu(open){$('drawer').hidden=!open;$('drawerBg').hidden=!open;$('menuOpen').setAttribute('aria-expanded',String(open));}
 $('menuOpen').addEventListener('click',()=>menu(true));$('menuClose').addEventListener('click',()=>menu(false));$('drawerBg').addEventListener('click',()=>menu(false));
 document.querySelectorAll('[data-menu]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.menu==='basic')menu(false);else $('menuNotice').textContent='이 메뉴는 추후 개발 예정입니다.';}));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')menu(false);});
 refreshFormula();refreshDifficulty();refreshList();
 $('sheets').replaceChildren(...TMM.buildSheets([],{specs:[],layout:getLayout()}));
})();
