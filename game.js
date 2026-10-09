'use strict';
const canvas=document.querySelector('#board'),ctx=canvas.getContext('2d');
const nextCanvas=document.querySelector('#next'),nextCtx=nextCanvas.getContext('2d');
const holdCanvas=document.querySelector('#hold'),holdCtx=holdCanvas.getContext('2d');
const COLS=10,ROWS=20,CELL=30;
const SHAPES={I:[[1,1,1,1]],O:[[1,1],[1,1]],T:[[0,1,0],[1,1,1]],S:[[0,1,1],[1,1,0]],Z:[[1,1,0],[0,1,1]],J:[[1,0,0],[1,1,1]],L:[[0,0,1],[1,1,1]]};
const COLORS={I:'#49e7e0',O:'#ffd66c',T:'#b58aff',S:'#78e4a1',Z:'#ff7790',J:'#6e9dff',L:'#ffa36d'};
let board,active,queue,held,holdUsed,score,lines,level,playing=false,paused=false,lastTime=0,dropTimer=0,rafId=0,sound=false,audioCtx=null;
const $=s=>document.querySelector(s);
function beep(freq=420,duration=.07){if(!sound)return;try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.055,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration)}catch(e){}}
function bag(){const b=Object.keys(SHAPES);for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function take(){if(queue.length<7)queue.push(...bag());return queue.shift()}
function piece(type){const shape=SHAPES[type].map(r=>r.slice());return{type,shape,x:Math.floor((COLS-shape[0].length)/2),y:0}}
function valid(p,dx=0,dy=0,shape=p.shape){for(let y=0;y<shape.length;y++)for(let x=0;x<shape[y].length;x++){if(!shape[y][x])continue;const bx=p.x+x+dx,by=p.y+y+dy;if(bx<0||bx>=COLS||by>=ROWS||(by>=0&&board[by][bx]))return false}return true}
function spawn(){active=piece(take());holdUsed=false;drawPreviews();if(!valid(active))gameOver()}
function start(){cancelAnimationFrame(rafId);board=Array.from({length:ROWS},()=>Array(COLS).fill(null));queue=bag();held=null;holdUsed=false;score=0;lines=0;level=1;dropTimer=0;lastTime=0;playing=true;paused=false;updateStats();spawn();hideOverlay();$('#pause').textContent='Pause (P)';draw();rafId=requestAnimationFrame(loop)}
function showOverlay(title,message,button){$('#overlay-title').textContent=title;$('#overlay-text').textContent=message;$('#overlay-button').textContent=button;$('#overlay').hidden=false}
function hideOverlay(){$('#overlay').hidden=true}
function gameOver(){playing=false;beep(150,.3);showOverlay('GAME OVER',`Final score: ${score.toLocaleString()}`,'Play again →')}
function updateStats(){$('#score').textContent=score.toLocaleString();$('#lines').textContent=lines;$('#level').textContent=level}
function lock(){for(let y=0;y<active.shape.length;y++)for(let x=0;x<active.shape[y].length;x++)if(active.shape[y][x]){const by=active.y+y;if(by<0){gameOver();return}board[by][active.x+x]=active.type}let cleared=0;for(let y=ROWS-1;y>=0;y--){if(board[y].every(Boolean)){board.splice(y,1);board.unshift(Array(COLS).fill(null));cleared++;y++}}if(cleared){score+=[0,100,300,500,800][cleared]*level;lines+=cleared;level=Math.floor(lines/10)+1;beep(620+cleared*80,.13)}else beep(230,.04);updateStats();spawn()}
function down(manual=false){if(!playing||paused)return;if(valid(active,0,1)){active.y++;if(manual){score++;updateStats()}}else lock();dropTimer=0;draw()}
function hardDrop(){if(!playing||paused)return;let n=0;while(valid(active,0,1)){active.y++;n++}score+=n*2;updateStats();lock();draw()}
function move(dx){if(!playing||paused)return;if(valid(active,dx,0)){active.x+=dx;beep(300,.025);draw()}}
function rotate(){if(!playing||paused)return;const s=active.shape,rot=s[0].map((_,i)=>s.map(row=>row[i]).reverse());for(const offset of [0,-1,1,-2,2])if(valid(active,offset,0,rot)){active.x+=offset;active.shape=rot;beep(500,.04);draw();return}}
function hold(){if(!playing||paused||holdUsed)return;const type=active.type;if(held){active=piece(held);held=type;if(!valid(active)){gameOver();return}}else{held=type;spawn()}holdUsed=true;drawPreviews();draw()}
function togglePause(){if(!playing)return;paused=!paused;if(paused){showOverlay('PAUSED','Press P or Resume to continue','Resume →');$('#pause').textContent='Resume (P)'}else{hideOverlay();lastTime=0;$('#pause').textContent='Pause (P)';rafId=requestAnimationFrame(loop)}}
function loop(t){if(!playing||paused)return;const dt=lastTime?Math.min(t-lastTime,100):0;lastTime=t;dropTimer+=dt;const interval=Math.max(85,850*Math.pow(.82,level-1));if(dropTimer>=interval){down();dropTimer=0}draw();rafId=requestAnimationFrame(loop)}
function cell(c,x,y,type,alpha=1,size=CELL){c.globalAlpha=alpha;c.fillStyle=COLORS[type];c.fillRect(x*size+1,y*size+1,size-2,size-2);c.fillStyle='#ffffff30';c.fillRect(x*size+3,y*size+3,size-6,3);c.globalAlpha=1}
function draw(){ctx.clearRect(0,0,300,600);ctx.fillStyle='#0e1529';ctx.fillRect(0,0,300,600);ctx.strokeStyle='#202a42';ctx.lineWidth=.6;for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*CELL,0);ctx.lineTo(x*CELL,600);ctx.stroke()}for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*CELL);ctx.lineTo(300,y*CELL);ctx.stroke()}if(!board)return;for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(board[y][x])cell(ctx,x,y,board[y][x]);if(active&&playing){let ghost=0;while(valid(active,0,ghost+1))ghost++;for(let y=0;y<active.shape.length;y++)for(let x=0;x<active.shape[y].length;x++)if(active.shape[y][x]){cell(ctx,active.x+x,active.y+y+ghost,active.type,.18);cell(ctx,active.x+x,active.y+y,active.type)}}}
function preview(c,cv,type){c.clearRect(0,0,cv.width,cv.height);if(!type)return;const s=SHAPES[type],sz=25,x0=Math.floor((cv.width-s[0].length*sz)/2),y0=Math.floor((cv.height-s.length*sz)/2);for(let y=0;y<s.length;y++)for(let x=0;x<s[y].length;x++)if(s[y][x]){c.fillStyle=COLORS[type];c.fillRect(x0+x*sz+1,y0+y*sz+1,sz-2,sz-2)}}
function drawPreviews(){preview(nextCtx,nextCanvas,queue[0]);preview(holdCtx,holdCanvas,held)}
function act(a){if(a==='left')move(-1);if(a==='right')move(1);if(a==='down')down(true);if(a==='rotate')rotate();if(a==='drop')hardDrop();if(a==='hold')hold()}
document.addEventListener('keydown',e=>{const keys=['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','KeyC','KeyP','Enter'];if(keys.includes(e.code))e.preventDefault();if(e.repeat&&['Space','KeyC','KeyP','Enter'].includes(e.code))return;if(e.code==='Enter'&&!playing){start();return}if(e.code==='KeyP'){togglePause();return}const m={ArrowLeft:'left',ArrowRight:'right',ArrowDown:'down',ArrowUp:'rotate',Space:'drop',KeyC:'hold'};if(m[e.code])act(m[e.code])});
$('#start').addEventListener('click',start);$('#pause').addEventListener('click',togglePause);$('#overlay-button').addEventListener('click',()=>{if(playing&&paused)togglePause();else start()});$('#sound').addEventListener('click',()=>{sound=!sound;$('#sound').textContent=`Sound: ${sound?'On':'Off'}`;beep()});document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>act(b.dataset.action)));
board=Array.from({length:ROWS},()=>Array(COLS).fill(null));draw();drawPreviews();
