// Reusable character assets and procedural layers. No generation requests at runtime.
const portraitDrawing=document.querySelector('.drawing');
const portraitDiagram=portraitDrawing.querySelector('svg');
portraitDiagram.classList.add('structure-diagram');
const artToolbar=document.createElement('div');
artToolbar.className='art-toolbar';
artToolbar.innerHTML='<div class="view-switch" aria-label="표현 선택"><button type="button" data-view="art" aria-pressed="true">삽화</button><button type="button" data-view="diagram" aria-pressed="false">도형</button></div><div class="figure-switch" aria-label="형상 선택"><button type="button" data-figure="spirit" aria-pressed="true">기운의 형상</button><button type="button" data-figure="male" aria-pressed="false">남신</button><button type="button" data-figure="female" aria-pressed="false">여신</button></div>';
portraitDiagram.before(artToolbar);
const scene=document.createElement('div');
scene.className='art-scene';
scene.setAttribute('role','img');
scene.innerHTML=`<div class="art-aura" aria-hidden="true"></div>
<svg class="art-wood" viewBox="0 0 600 600" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.2"><path d="M80 600Q45 390 140 155M106 340Q37 310 29 229M112 286Q187 242 188 180M103 391Q202 350 223 289M500 600Q554 375 470 119M516 337Q590 292 586 204M518 288Q437 253 421 170M505 417Q409 372 389 316"/><path d="M106 340Q36 370 29 229Q85 258 106 340M112 286Q115 205 188 180Q211 249 112 286M103 391Q138 297 223 289Q230 368 103 391M516 337Q510 249 586 204Q612 295 516 337M518 288Q433 286 421 170Q498 183 518 288M505 417Q412 420 389 316Q478 323 505 417" fill="currentColor" fill-opacity=".09"/></g></svg>
<img class="deity-image" src="art/elemental-spirit.png" width="1024" height="1536" alt="불씨를 품은 나무의 몸에 물줄기와 은빛 고리가 이어진 존재" fetchpriority="high" decoding="async">
<div class="spirit-flame" aria-hidden="true"></div>
<svg class="spirit-rings" viewBox="0 0 600 600" aria-hidden="true"><ellipse cx="300" cy="325" rx="177" ry="62" transform="rotate(-24 300 325)"/><ellipse cx="300" cy="325" rx="195" ry="80" transform="rotate(24 300 325)"/></svg>
<div class="book-light" aria-hidden="true"></div>
<svg class="art-water" viewBox="0 0 800 220" preserveAspectRatio="none" aria-hidden="true"><path d="M-50 115Q60 20 180 110T410 110T650 110T880 110V240H-50Z" fill="#7b9fac" fill-opacity=".22"/><path d="M-50 155Q70 58 195 150T450 150T705 150T950 150V240H-50Z" fill="#436878" fill-opacity=".2"/><path d="M-50 115Q60 20 180 110T410 110T650 110T880 110M-50 155Q70 58 195 150T450 150T705 150T950 150" fill="none" stroke="#b4d2d6" stroke-width="2"/></svg>
<span class="art-step-caption"></span><span class="art-symbol">명식을 풀어 그린 상징화</span>`;
portraitDiagram.before(scene);
portraitDrawing.dataset.view='art';
const layerCaptions=['직업과 책임을 품은 모습','맡은 일을 받치는 힘','배움에서 빛이 시작됩니다','같은 배움이 나를 받칩니다','두 도움이 함께 놓입니다','목기운이 제자리를 채웁니다','수에서 목으로 흐름이 이어집니다','도움과 부담을 함께 품은 모습'];
const spiritCaptions=['불씨와 물 · 나와 내가 맡을 일','은빛 고리 · 물의 흐름을 받치는 금','물길이 목으로, 목은 불로 이어집니다','나무의 몸이 안쪽의 불씨를 감쌉니다','받치는 힘과 돕는 힘이 함께 놓입니다','몸을 이룬 목은 계절에도 필요합니다','물과 나무가 한 흐름을 이룹니다','거센 물을 받아, 나무 안의 불을 지키는 존재'];
const spiritLegend=document.createElement('div');
spiritLegend.className='spirit-legend';
spiritLegend.innerHTML='<span><i class="fire-dot"></i>불씨 · 나</span><span><i class="wood-dot"></i>나무 · 배움과 도움</span><span><i class="water-dot"></i>물 · 직업과 책임</span><span><i class="metal-dot"></i>은빛 고리 · 재물</span><small>명식의 연결을 표현하기 위해 만든 상징입니다.</small>';
scene.after(spiritLegend);
let portraitFigure='spirit';
window.updatePortraitIllustration=function(step){
 scene.dataset.step=String(step);
 scene.dataset.figure=portraitFigure;
 portraitDrawing.dataset.figure=portraitFigure;
 scene.style.setProperty('--reveal',String(.40+step*.085));
 scene.style.setProperty('--desaturate',String(Math.max(0,1-step*.23)));
 scene.style.setProperty('--light',step>=2?String(Math.min(.9,.3+(step-2)*.12)):'0');
 scene.style.setProperty('--wood',step>=3?String(Math.min(.85,.25+(step-3)*.16)):'0');
 scene.style.setProperty('--water',step>=6?(step===7?'.95':'.35'):'0');
 scene.style.setProperty('--rings',step>=1?'.45':'0');
 const captions=portraitFigure==='spirit'?spiritCaptions:layerCaptions;
 scene.querySelector('.art-step-caption').textContent=captions[step];
 scene.setAttribute('aria-label',`${portraitFigure==='spirit'?'기운의 형상':portraitFigure==='male'?'남신':'여신'} 상징화. ${captions[step]}`);
};
artToolbar.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
 portraitDrawing.dataset.view=button.dataset.view;
 artToolbar.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
}));
artToolbar.querySelectorAll('[data-figure]').forEach(button=>button.addEventListener('click',()=>{
 portraitFigure=button.dataset.figure;
 const img=scene.querySelector('.deity-image');
 img.src=portraitFigure==='spirit'?'art/elemental-spirit.png':`art/deity-${portraitFigure}.png`;
 img.alt=portraitFigure==='spirit'?'불씨를 품은 나무의 몸에 물줄기와 은빛 고리가 이어진 존재':`책을 품은 ${portraitFigure==='male'?'남신':'여신'}을 그린 상징 삽화`;
 artToolbar.querySelectorAll('[data-figure]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 updatePortraitIllustration(Number(scene.dataset.step||0));
}));
