const canvas=document.querySelector('.canvas'),chapters=[...document.querySelectorAll('.chapter')],visual=document.querySelector('.visual');
const captions=['배움 → 나','직업 → 배움 → 나','재물 → 직업 → 배움 → 나','도움의 연결 + 책임의 부담','배운 것으로 자기 일을 해내는 사람'];
let current=-1,queued=false;
function update(){queued=false;const mobile=matchMedia('(max-width:760px)').matches;const anchor=mobile?visual.getBoundingClientRect().bottom+Math.min(150,innerHeight*.18):innerHeight*.48;let step=0;chapters.forEach((chapter,i)=>{if(chapter.getBoundingClientRect().top<=anchor)step=i;});if(step===current)return;current=step;canvas.dataset.step=String(step);document.querySelector('#count').textContent=String(step+1).padStart(2,'0')+' / 05';document.querySelector('#visual-caption').textContent=captions[step];document.querySelector('#map-title').textContent=captions[step];document.querySelector('.visual-progress i').style.width=((step+1)*20)+'%';}
function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);update();
