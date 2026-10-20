(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const params=new URLSearchParams(window.location.search);
 const template=params.get('t');
 const count=Number(params.get('n'));
 const seed=Number(params.get('s'));
 function fail(message){$('error').hidden=false;$('error').textContent=message;$('sheets').replaceChildren();$('printAnswers').disabled=true;}
 if(!params.has('t') || !params.has('n') || !params.has('s')) {
   fail('문제지 정보가 없습니다. 원본 문제지의 QR 코드를 스캔해 주세요.');return;
 }
 const result=TMM.generate(template,count,seed);
 if(result.error){fail('정답지를 불러오지 못했습니다. 원본 문제지에서 QR을 다시 스캔해 주세요.');return;}
 $('sheets').replaceChildren(...TMM.buildSheets(result.problems,{withAnswers:true}));
 $('printMount').replaceChildren(...TMM.buildSheets(result.problems,{withAnswers:true}));
 $('printAnswers').addEventListener('click',()=>window.print());
})();
