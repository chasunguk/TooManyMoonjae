(function (root) {
 'use strict';
 const OP = {p:'+',m:'−',x:'×',d:'÷'};
 const NUM = {'1':'한 자리 수','2':'두 자리 수','3':'세 자리 수','4':'네 자리 수'};
 const DIFFICULTY={low:'하',mid:'중',high:'상'};
 const VALID=/^[1-4](?:[pmxd][1-4])*$/;
 function parseTemplate(s){
   if(typeof s!=='string'||s.length>400||!VALID.test(s))return null;
   return Array.from(s,c=>({type:NUM[c]?'number':'operator',value:c}));
 }
 function labelTemplate(s){
   if(typeof s!=='string'||s.length>400||!/^[1-4](?:[pmxd][1-4])*(?:[pmxd])?$/.test(s))return '';
   return Array.from(s,c=>NUM[c]||OP[c]).join(' ');
 }
 function seededRandom(seed){
   let a=seed>>>0;
   return ()=>{a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};
 }
 function addCarry(a,b){
   let carries=0,carry=0;
   while(a||b||carry){const sum=a%10+b%10+carry;carry=sum>=10?1:0;carries+=carry;a=Math.floor(a/10);b=Math.floor(b/10);}
   return carries;
 }
 function subBorrow(a,b){
   let borrow=0,total=0;
   while(a||b||borrow){const left=a%10-borrow,right=b%10;borrow=left<right?1:0;total+=borrow;a=Math.floor(a/10);b=Math.floor(b/10);}
   return total;
 }
 function mulCarry(a,b){
   let total=0;
   for(const digit of String(b)){
     let carry=0,v=a,k=Number(digit);
     while(v){const product=v%10*k+carry;carry=Math.floor(product/10);if(carry>0)total++;v=Math.floor(v/10);}
   }
   return total;
 }
 function divCarry(a,b){
   let n=0,partial=0,started=false;
   const digits=String(a);
   for(let i=0;i<digits.length;i++){
     partial=partial*10+Number(digits[i]);
     if(partial>=b)started=true;
     if(!started)continue;
     const q=Math.floor(partial/b);
     partial-=q*b;
     if(i<digits.length-1&&partial>0)n++;
   }
   return n;
 }
 function evaluateWithDifficulty(values,ops){
   const v=[values[0]],stack=[];
   const priority={p:1,m:1,x:2,d:2};
   let steps=0;
   function apply(){
     const op=stack.pop(),b=v.pop(),a=v.pop();
     if(a===undefined||b===undefined)return false;
     let result,work;
     if(op==='p'){result=a+b;work=addCarry(a,b);}
     if(op==='m'){result=a-b;if(result<0)return false;work=subBorrow(a,b);}
     if(op==='x'){result=a*b;work=mulCarry(a,b);}
     if(op==='d'){if(b===0||a%b!==0)return false;result=a/b;work=divCarry(a,b);}
     if(!Number.isSafeInteger(result)||result<0||result>1000000000)return false;
     steps+=work;v.push(result);return true;
   }
   for(let i=0;i<ops.length;i++){
     const op=ops[i];
     while(stack.length&&priority[stack[stack.length-1]]>=priority[op])if(!apply())return null;
     stack.push(op);v.push(values[i+1]);
   }
   while(stack.length)if(!apply())return null;
   return {answer:v[0],difficulty:steps===0?'low':steps===1?'mid':'high'};
 }
 function validSpec(s){return !!s&&!!parseTemplate(s.template)&&s.template.length>=3&&!!DIFFICULTY[s.difficulty]&&Number.isInteger(s.count)&&s.count>=1&&s.count<=200;}
 function generateBundle(specs,seed,order='group'){
   if(!Array.isArray(specs)||specs.length<1||specs.length>20||specs.some(s=>!validSpec(s))||!Number.isInteger(seed)||seed<0||seed>4294967295||!['group','shuffle'].includes(order))return {problems:[],error:'문제 구성 정보가 올바르지 않습니다.'};
   const total=specs.reduce((sum,s)=>sum+s.count,0);
   if(total>200)return {problems:[],error:'전체 문제 수는 최대 200문제입니다.'};
   const rand=seededRandom(seed);
   const seen=new Set(),problems=[];
   for(const spec of specs){
     const tokens=parseTemplate(spec.template);
     const digits=tokens.filter(t=>t.type==='number').map(t=>Number(t.value));
     const ops=tokens.filter(t=>t.type==='operator').map(t=>t.value);
     const made=[];
     const maxAttempts=Math.max(12000,Math.min(65000,spec.count*800));
     for(let attempt=0;attempt<maxAttempts&&made.length<spec.count;attempt++){
       const vals=digits.map(n=>{const min=10**(n-1);return min+Math.floor(rand()*(9*min));});
       const calc=evaluateWithDifficulty(vals,ops);
       if(!calc||calc.difficulty!==spec.difficulty)continue;
       const expression=vals.map((n,i)=>i===0?String(n):`${OP[ops[i-1]]} ${n}`).join(' ');
       if(seen.has(expression))continue;
       seen.add(expression);
       made.push({expression,answer:calc.answer});
     }
     if(made.length<spec.count)return {problems:[],error:`「${labelTemplate(spec.template)} · ${DIFFICULTY[spec.difficulty]}」 조건에 맞는 서로 다른 문제를 ${spec.count}개 만들 수 없습니다. 자릿수·난이도·문제 수를 조정해 주세요.`};
     problems.push(...made);
   }
   if(order==='shuffle'){
     for(let i=problems.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[problems[i],problems[j]]=[problems[j],problems[i]];}
   }
   return {problems,error:null};
 }
 function encodeSpecs(specs){return specs.map(s=>`${s.template}.${{low:'l',mid:'m',high:'h'}[s.difficulty]}.${s.count}`).join('~');}
 function decodeSpecs(encoded){
   if(typeof encoded!=='string'||encoded.length>3000)return null;
   const level={l:'low',m:'mid',h:'high'};
   const result=encoded.split('~').map(x=>{const p=x.split('.');if(p.length!==3)return null;return {template:p[0],difficulty:level[p[1]],count:Number(p[2])};});
   return result.length>=1&&result.length<=20&&result.every(validSpec)&&result.reduce((a,b)=>a+b.count,0)<=200?result:null;
 }
 function answerUrl(specs,seed,layout,order){
   const url=new URL('answer.html',document.baseURI);
   url.search=new URLSearchParams({b:encodeSpecs(specs),s:String(seed),c:String(layout.cols),r:String(layout.rows),o:order}).toString();
   return url.href;
 }
 function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function drawQr(target,url){
   if(!target||!root.QRCode)return false;
   const qr=new root.QRCode(-1,0);qr.addData(url);qr.make();
   const n=qr.getModuleCount(),commands=[];
   for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(qr.isDark(y,x))commands.push(`M${x+4} ${y+4}h1v1h-1z`);
   target.innerHTML=`<svg viewBox="0 0 ${n+8} ${n+8}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="정답지 QR 코드" shape-rendering="crispEdges"><rect width="${n+8}" height="${n+8}" fill="#fff"/><path fill="#111" d="${commands.join('')}"/></svg>`;
   return true;
 }
 function buildSheets(problems,opts){
   const {withAnswers=false,qrUrl='',specs=[],layout={cols:2,rows:10}}=opts;
   const cols=layout.cols,rows=layout.rows,perPage=cols*rows,total=Math.max(1,Math.ceil(problems.length/perPage));
   const printed=specs.slice(0,3).map(s=>`${labelTemplate(s.template)} (${DIFFICULTY[s.difficulty]} · ${s.count}문제)`).join(' / ');
   const summary=printed+(specs.length>3?` 외 ${specs.length-3}개 유형`:'');
   const pages=[];
   for(let page=0;page<total;page++){
     const offset=page*perPage,subset=problems.slice(offset,offset+perPage);
     const paper=document.createElement('section');paper.className='paper';paper.style.setProperty('--cols',cols);paper.style.setProperty('--rows',rows);
     paper.style.setProperty('--problem-font',cols>=4?'12px':cols===3?'14px':'16px');
     paper.setAttribute('aria-label',`${page+1}번째 A4 ${withAnswers?'정답지':'문제지'}`);
     paper.innerHTML=`<div class="paper-header"><h3>문제가 많은 게 문제${withAnswers?' · 정답지':''}</h3><div class="paper-details"><div class="paper-template"><span class="paper-key">계산식</span><span>${escapeHtml(summary||'　')}</span></div><div class="student-name">이름: <span class="name-line"></span></div><div class="qr-box" ${withAnswers||!qrUrl?'hidden':''}></div></div></div><div class="question-grid"></div><div class="paper-foot">${page+1} / ${total}</div>`;
     const grid=paper.querySelector('.question-grid');
     subset.forEach((p,j)=>{
       const line=document.createElement('div');line.className='question';
       const final=withAnswers?`<strong class="answer-value">${p.answer.toLocaleString('ko-KR')}</strong>`:'<span class="answer-line" aria-label="정답칸"></span>';
       line.innerHTML=`<span class="question-number">${offset+j+1}.</span><span class="question-expression">${escapeHtml(p.expression)} = ${final}</span>`;
       grid.appendChild(line);
     });
     if(!withAnswers&&qrUrl){try{drawQr(paper.querySelector('.qr-box'),qrUrl);}catch(e){paper.querySelector('.qr-box').textContent='QR 표시 오류';}}
     pages.push(paper);
   }
   return pages;
 }
 root.TMM={parseTemplate,labelTemplate,generateBundle,buildSheets,answerUrl,encodeSpecs,decodeSpecs};
})(window);
