(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const params=new URLSearchParams(location.search);
 const specs=TMM.decodeSpecs(params.get('b'));
 const seed=Number(params.get('s'));
 const order=params.get('o')||'group';
 const layout={cols:Number(params.get('c')),rows:Number(params.get('r'))};
 function fail(msg){$('error').hidden=false;$('error').textContent=msg;$('sheets').replaceChildren();$('printAnswers').disabled=true;}
 if(!specs||!params.has('s')||!Number.isInteger(seed)||seed<0||seed>4294967295||!['group','shuffle'].includes(order)||!Number.isInteger(layout.cols)||layout.cols<1||layout.cols>4||!Number.isInteger(layout.rows)||layout.rows<1||layout.rows>15){fail('문제지 정보를 확인할 수 없습니다. 문제지에 인쇄된 QR을 다시 스캔해 주세요.');return;}
 const result=TMM.generateBundle(specs,seed,order);
 if(result.error){fail('정답지를 불러오지 못했습니다. QR을 다시 스캔해 주세요.');return;}
 const opts={withAnswers:true,specs,layout};
 $('sheets').replaceChildren(...TMM.buildSheets(result.problems,opts));
 $('printMount').replaceChildren(...TMM.buildSheets(result.problems,opts));
 $('printAnswers').addEventListener('click',()=>window.print());
})();
