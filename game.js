'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=960,H=640,CELL=24,COLS=40,keys=new Set(),shipSprite=new Image();shipSprite.src='assets/irover-sprite.png';
const botSprite=new Image();botSprite.src='assets/bot-sprite.png';
const DEFENSE_TOP=505,GLASS_BANDS=[{color:'#61ff91',top:0},{color:'#ffe76a',top:DEFENSE_TOP/3},{color:'#ff655d',top:DEFENSE_TOP*2/3}];
let best=0;try{best=Number(localStorage.getItem('drift-destroyer-best'))||0}catch{}
let state='ready',score=0,wave=1,lives=3,player={x:480,y:582},bullets=[],chains=[],blocks=[],particles=[],bot=null,last=0,tick=0,shot=0,spawn=0,invincible=0,pointer=false,muted=false,audio,nextHorn=-1,wallTouches=0,links=[],linkTimer=0,missiles=[],blasts=[],missileReady=true,missileShots=0,botKills=0,radeTime=0,radeFlash=0,introElapsed=0,introNotes=[];
const BUG_RADIUS=10,BLAST_RADIUS=3*BUG_RADIUS*Math.sqrt(10);
const $=id=>document.getElementById(id),rand=(a,b)=>a+Math.random()*(b-a);
function hud(){const radeStatus=$('rade');if(radeStatus)radeStatus.textContent=radeTime>0?'RADE '+Math.ceil(radeTime)+'s':'BOTS '+botKills+'/3';$('missile').textContent=missileReady?'MISSILE READY [M]':'MISSILE '+missileShots+'/10';$('missile').disabled=state!=='playing'||!missileReady;$('score').textContent=String(score).padStart(6,'0');$('best').textContent=String(best).padStart(6,'0');$('wave').textContent=String(wave).padStart(2,'0');$('walls').textContent=String(wallTouches).padStart(2,'0');$('lives').textContent='◆ '.repeat(lives).trim()||'—'}
function tone(f,d=.06,type='square',v=.025){if(muted)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+d)}catch{}}
function addScore(n){score+=n;if(score>best){best=score;try{localStorage.setItem('drift-destroyer-best',best)}catch{}}hud()}
function burst(x,y,color,count=12){for(let i=0;i<count;i++)particles.push({x,y,vx:rand(-130,130),vy:rand(-130,130),life:rand(.2,.65),color})}
function segment(x,y){return {x,y,phased:false,phaseTimer:rand(2,5)}}
function nextWave(){
 wallTouches=0;
 const spawnRows=Math.floor((DEFENSE_TOP-24-60)/CELL)+1;
 chains=Array.from({length:wave},(_,i)=>({
  segments:[segment(i%2===0?12:W-12,60+(i%spawnRows)*CELL)],
  dir:i%2===0?1:-1,clock:0,growth:0,wallCounter:{touches:0}
 }));
 spawn=0;hud();
}
function spawnLink(){
 const candidates=[];
 for(let i=0;i<blocks.length;i++)for(let j=i+1;j<blocks.length;j++){
  const a=blocks[i],b=blocks[j];
  if((a.x===b.x||a.y===b.y)&&Math.hypot(a.x-b.x,a.y-b.y)>=CELL*2&&!links.some(l=>(l.a===a&&l.b===b)||(l.a===b&&l.b===a)))candidates.push({a,b});
 }
 if(candidates.length){const pair=candidates[Math.floor(Math.random()*candidates.length)];links.push({...pair,vertical:pair.a.x===pair.b.x,life:rand(1,3)});}
}
function updateLinks(dt){
 for(const l of links)l.life-=dt;
 links=links.filter(l=>l.life>0&&blocks.includes(l.a)&&blocks.includes(l.b));
 linkTimer-=dt;
 if(linkTimer<=0){if(links.length<8)spawnLink();linkTimer=rand(.35,.8)}
}
function crossesVertical(x,nx,y){return links.some(l=>l.vertical&&Math.min(x,nx)-10<=l.a.x&&Math.max(x,nx)+10>=l.a.x&&y>=Math.min(l.a.y,l.b.y)&&y<=Math.max(l.a.y,l.b.y))}
function blocksShot(b){if(b.vx)return false;return links.some(l=>!l.vertical&&b.x>=Math.min(l.a.x,l.b.x)&&b.x<=Math.max(l.a.x,l.b.x)&&b.y-8<=l.a.y&&b.previousY+8>=l.a.y)}
function stepChain(c){
 c.wallCounter??={touches:0};
 const previous=c.segments.map(s=>({x:s.x,y:s.y})),head=c.segments[0],nx=head.x+c.dir*CELL;
 const wall=nx<12||nx>W-12;
 if(wall||crossesVertical(head.x,nx,head.y)||blocks.some(m=>Math.abs(m.x-nx)<12&&Math.abs(m.y-head.y)<12)){
  c.dir*=-1;head.y+=CELL;if(head.y>H-15)head.y=516;
 }else head.x=nx;
 for(let i=1;i<c.segments.length;i++)Object.assign(c.segments[i],previous[i-1]);
 // Only the leading bug starts a new wall encounter. Followers must not
 // recursively turn this same encounter into further growth events.
 if((head.x===12||head.x===W-12)&&head.x!==previous[0].x){
  wallTouches++;c.wallCounter.touches++;c.growth+=c.wallCounter.touches;burst(head.x,head.y,'#f5b66f',6);hud();
 }
 // Finite addition for this encounter, one new segment per movement step.
 // No duration timer controls growth; only architecture links use 1–3 seconds.
 if(c.growth>0){const tail=previous[previous.length-1];c.segments.push(segment(tail.x,tail.y));c.growth--}
}

function registerBotKill(){
 botKills++;
 if(botKills===3){botKills=0;radeTime=30;radeFlash=2.5;tone(1000,.3,'triangle')}
 hud();
}
function updateRade(dt){
 const oldSeconds=Math.ceil(radeTime);radeTime=Math.max(0,radeTime-dt);radeFlash=Math.max(0,radeFlash-dt);
 if(Math.ceil(radeTime)!==oldSeconds)hud();
}
function fireMissile(){
 if(state!=='playing'||!missileReady)return;
 missiles.push({x:player.x,y:player.y-29});missileReady=false;missileShots=0;hud();tone(150,.18,'sawtooth');
}
function chargeMissile(){if(!missileReady){missileShots=Math.min(10,missileShots+1);if(missileShots===10)missileReady=true;hud()}}
function detonate(x,y){
 blasts.push({x,y,life:.45});burst(x,y,'#ffd38a',35);tone(60,.3,'sawtooth');
 const inside=s=>Math.hypot(s.x-x,s.y-y)<=BLAST_RADIUS;
 const survivors=[];let removed=0;
 for(const c of chains){let run=[],first=true;
  function keep(){if(run.length){survivors.push({...c,segments:run,growth:first?c.growth:0});first=false;run=[]}}
  for(const s of c.segments){if(!s.phased&&inside(s)){keep();removed++;burst(s.x,s.y,'#ffb769',5)}else run.push(s)}keep();
 }
 chains=survivors;
 const oldBlocks=blocks.length;blocks=blocks.filter(b=>!inside(b));links=links.filter(l=>blocks.includes(l.a)&&blocks.includes(l.b));
 let bonus=0;if(bot&&inside(bot)){registerBotKill();bot=null;bonus=100}
 addScore(removed*20+(oldBlocks-blocks.length)*5+bonus);
}
function updateMissiles(dt){
 for(const m of missiles){
  const end=m.y-450*dt,targets=[];
  for(const c of chains)for(const s of c.segments)if(!s.phased&&Math.abs(s.x-m.x)<=14)targets.push({y:s.y+10});
  for(const b of blocks)if(Math.abs(b.x-m.x)<=11)targets.push({y:b.y+7});
  for(const l of links)if(!l.vertical&&m.x>=Math.min(l.a.x,l.b.x)&&m.x<=Math.max(l.a.x,l.b.x))targets.push({y:l.a.y});
  if(bot&&Math.abs(bot.x-m.x)<=25)targets.push({y:bot.y+12});
  const impact=targets.filter(t=>t.y<=m.y&&t.y>=end).sort((a,b)=>b.y-a.y)[0];
  if(impact||end<=12){detonate(m.x,impact?impact.y:12);m.dead=true}else m.y=end;
 }
 missiles=missiles.filter(m=>!m.dead);
}
function createBot(quarter=0,reverse=false,direction=1){
 const width=W/4,left=quarter*width+32,right=(quarter+1)*width-32;
 const xs=reverse?[right,left,right,left]:[left,right,left,right];
 return {x:xs[0],y:535,quarter,reverse,direction,leg:0,mode:'z',hopTime:0,route:xs.map((x,i)=>({x,y:i<2?535:608}))};
}
function moveBot(dt){
 if(!bot)return;
 if(bot.mode==='hop'){
  bot.hopTime=Math.min(.65,bot.hopTime+dt);const t=bot.hopTime/.65;
  const next=createBot((bot.quarter+bot.direction+4)%4,!bot.reverse,bot.direction);
  bot.x=bot.route[3].x+(next.x-bot.route[3].x)*t;
  bot.y=608+(535-608)*t-Math.sin(Math.PI*t)*12;
  if(t===1)bot=next;
  return;
 }
 let travel=(320+wave*12)*dt;
 while(travel>0&&bot.mode==='z'){
  const target=bot.route[bot.leg+1],dx=target.x-bot.x,dy=target.y-bot.y,d=Math.hypot(dx,dy);
  if(travel>=d){bot.x=target.x;bot.y=target.y;travel-=d;bot.leg++;if(bot.leg===3){bot.mode='hop';bot.hopTime=0}}
  else{bot.x+=dx/d*travel;bot.y+=dy/d*travel;travel=0}
 }
}
// Traditional Farmer in the Dell melody, synthesized locally as square waves.
const INTRO_SECONDS=5;
const INTRO_MELODY=[[60,1],[65,1],[65,1],[65,1],[65,2],[65,1],[67,1],[69,1],[69,1],[69,1],[69,1],[69,2],[69,1],[70,1],[69,1],[67,1],[65,2],[65,1],[64,1],[64,1],[65,4]];
function stopIntroMusic(){for(const note of introNotes)try{note.stop()}catch{}introNotes=[]}
function playIntroMusic(){
 stopIntroMusic();if(muted)return;
 try{
  audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume?.();
  const units=INTRO_MELODY.reduce((n,note)=>n+note[1],0),beat=4.8/units;let at=audio.currentTime+.03;
  for(const [pitch,length] of INTRO_MELODY){const o=audio.createOscillator(),g=audio.createGain(),duration=length*beat;
   o.type='square';o.frequency.value=440*2**((pitch-69)/12);g.gain.setValueAtTime(.0001,at);g.gain.linearRampToValueAtTime(.045,at+.008);g.gain.exponentialRampToValueAtTime(.0001,at+duration*.9);
   o.connect(g);g.connect(audio.destination);o.start(at);o.stop(at+duration);introNotes.push(o);at+=duration;
  }
 }catch{}
}
function startIntro(){
 if(state==='intro'||state==='playing')return;
 reset();state='intro';introElapsed=0;keys.clear();pointer=false;
 $('intro').classList.remove('hidden');hud();playIntroMusic();
}
function advanceIntro(dt){
 if(state!=='intro')return;
 introElapsed+=dt;if(introElapsed>=INTRO_SECONDS){stopIntroMusic();$('intro').classList.add('hidden');state='playing';keys.clear();pointer=false;last=performance.now();hud()}
}
function reset(){stopIntroMusic();$('intro').classList.add('hidden');introElapsed=0;botKills=0;radeTime=0;radeFlash=0;missiles=[];blasts=[];missileReady=true;missileShots=0;links=[];linkTimer=0;nextHorn=-1;shot=0;pointer=false;keys.clear();tick=0;score=0;wave=1;lives=3;bullets=[];particles=[];bot=null;player={x:480,y:582};invincible=2;blocks=[];for(let y=4;y<21;y++)for(let x=1;x<COLS-1;x++)if(Math.random()<.12)blocks.push({x:x*CELL+12,y:y*CELL+12,hp:3});nextWave();state='playing';$('overlay').classList.add('hidden');last=performance.now();hud()}
function resetToReady(){
 reset();state='ready';
 $('overline').textContent='GAME RESET';$('title').textContent='Deploy OBI.';
 $('message').innerHTML='Fresh start. One drift bug. Full hull.<br>Press Start Game or Enter when you’re ready.';
 $('start').innerHTML='START GAME <span>↗</span>';$('hint').textContent='PRESS ENTER TO START';
 $('overlay').classList.remove('hidden');
 $('reset').blur?.();hud();
}
function overlay(title,message,button){$('overline').textContent=state==='paused'?'SYSTEMS ON HOLD':'CHARGE COMPLETE';$('title').textContent=title;$('message').innerHTML=message;$('start').innerHTML=button+' <span>↗</span>';$('hint').textContent='PRESS ENTER TO '+(state==='paused'?'RESUME':'RESTART');$('overlay').classList.remove('hidden')}
function pause(){if(state==='playing'){state='paused';overlay('Take a breather.','OBI is on standby. The drift is paused.','RESUME GAME')}else if(state==='paused'){state='playing';$('overlay').classList.add('hidden')}}
function hit(){if(invincible>0)return;lives--;burst(player.x,player.y,'#5de8f2',30);tone(70,.35,'sawtooth');hud();if(!lives){state='over';overlay('Drift took over.','Final score: '+String(score).padStart(6,'0')+'<br>Deploy OBI again?','PLAY AGAIN')}else{invincible=2.5;player.x=480;player.y=600;bot=null}}
function update(dt){updateRade(dt);updateLinks(dt);tick+=dt;invincible-=dt;shot-=dt;let dx=0,dy=0;if(keys.has('ArrowLeft')||keys.has('a'))dx--;if(keys.has('ArrowRight')||keys.has('d'))dx++;if(keys.has('ArrowUp')||keys.has('w'))dy--;if(keys.has('ArrowDown')||keys.has('s'))dy++;player.x=Math.max(25,Math.min(W-25,player.x+dx*350*dt));player.y=Math.max(515,Math.min(H-28,player.y+dy*350*dt));if((keys.has(' ')||pointer)&&shot<=0){bullets.push({x:player.x+nextHorn*21,y:player.y-29});if(radeTime>0)for(const side of [-1,1])bullets.push({x:player.x+side*28,y:player.y,vx:side*700});burst(player.x+nextHorn*21,player.y-29,'#5de8f2',3);nextHorn*=-1;chargeMissile();shot=.115;tone(nextHorn<0?780:720,.04,'triangle')}
for(const b of bullets){b.previousY=b.y;b.previousX=b.x;if(b.vx)b.x+=b.vx*dt;else b.y-=700*dt;if(blocksShot(b)){burst(b.x,b.y,"#ff9c52",4);b.y=-100}}
for(const c of chains){
 for(const s of c.segments){s.phaseTimer-=dt;if(s.phaseTimer<=0){s.phased=!s.phased;s.phaseTimer=s.phased?rand(.8,2):rand(2,5)}}
 c.clock+=dt;const speed=Math.max(.055,.15-wave*.009);
 while(c.clock>=speed){c.clock-=speed;stepChain(c)}
}
updateMissiles(dt);for(const blast of blasts)blast.life-=dt;blasts=blasts.filter(b=>b.life>0);
for(const b of bullets){if(b.y<0)continue;let m=blocks.find(m=>Math.abs(m.x-b.x)<16&&Math.abs(m.y-b.y)<15);if(m){b.y=-100;m.hp--;burst(m.x,m.y,'#ff9c52',3);if(!m.hp){blocks.splice(blocks.indexOf(m),1);links=links.filter(l=>l.a!==m&&l.b!==m);addScore(5)}continue}for(const c of chains){const i=c.segments.findIndex(s=>!s.phased&&Math.abs(s.x-b.x)<17&&Math.abs(s.y-b.y)<17);if(i>=0){const s=c.segments[i];burst(s.x,s.y,'#ffb769');if(!blocks.some(m=>m.x===s.x&&m.y===s.y))blocks.push({x:s.x,y:s.y,hp:3});const tail=c.segments.splice(i);tail.shift();if(tail.length){chains.push({segments:tail,dir:-c.dir,clock:0,growth:c.growth,wallCounter:c.wallCounter});c.growth=0;}b.y=-100;addScore(20);tone(200,.08);break}}if(bot&&(b.vx?Math.abs(b.y-bot.y)<27&&bot.x>=Math.min(b.previousX,b.x)-27&&bot.x<=Math.max(b.previousX,b.x)+27:Math.hypot(b.x-bot.x,b.y-bot.y)<27)){registerBotKill();burst(bot.x,bot.y,'#ff5945',25);bot=null;b.y=-100;addScore(100);tone(400,.15)}}
bullets=bullets.filter(b=>b.y>-20&&b.x>-30&&b.x<W+30);chains=chains.filter(c=>c.segments.length);if(!chains.length){wave++;nextWave();invincible=1.5;tone(950,.25,'triangle')}
spawn+=dt;if(!bot&&spawn>9){bot=Math.random()<.5?createBot():createBot(3,true,-1);spawn=0}moveBot(dt);if(bot&&invincible<=0&&Math.hypot(bot.x-player.x,bot.y-player.y)<39){registerBotKill();burst(bot.x,bot.y,'#ff5945',25);bot=null;hit();}
for(const c of chains)for(const s of c.segments)if(Math.hypot(s.x-player.x,s.y-player.y)<29)hit();for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}particles=particles.filter(p=>p.life>0)}
function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle='#061019';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#142632';ctx.lineWidth=.6;for(let x=0;x<W;x+=CELL){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<H;y+=CELL){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}ctx.fillStyle='#102c382e';ctx.fillRect(0,505,W,135);ctx.setLineDash([4,9]);ctx.strokeStyle='#245063';ctx.beginPath();ctx.moveTo(0,505);ctx.lineTo(W,505);ctx.stroke();ctx.setLineDash([]);
for(const l of links){ctx.globalAlpha=Math.min(1,l.life*3);ctx.strokeStyle=l.vertical?'#ffc27a':'#f0873f';ctx.lineWidth=2;ctx.shadowColor='#ff973c';ctx.shadowBlur=6;ctx.beginPath();ctx.moveTo(l.a.x,l.a.y);ctx.lineTo(l.b.x,l.b.y);ctx.stroke()}ctx.shadowBlur=0;ctx.globalAlpha=1;
const connectedBlocks=new Set(links.filter(l=>l.life>0).flatMap(l=>[l.a,l.b]));
for(const m of blocks){const connected=connectedBlocks.has(m);ctx.globalAlpha=.4+m.hp*.2;ctx.fillStyle=connected?'#409dff':'#f39a4a';ctx.fillRect(m.x-7,m.y-7,14,14);ctx.strokeStyle=connected?'#a4dbff':'#ffd29a';ctx.lineWidth=1;ctx.strokeRect(m.x-7,m.y-7,14,14);ctx.fillStyle=connected?'#155aa6':'#ad5e27';ctx.fillRect(m.x-3,m.y-3,6,6)}ctx.globalAlpha=1;
for(const c of chains)for(const s of c.segments){ctx.globalAlpha=s.phased?.16:1;ctx.shadowColor='#fb9f57';ctx.shadowBlur=13;ctx.fillStyle='#eaa060';ctx.beginPath();ctx.arc(s.x,s.y,10,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#ffd4a1';ctx.lineWidth=1;ctx.beginPath();ctx.arc(s.x,s.y,6,-2.6,.4);ctx.stroke();ctx.fillStyle='#19222a';ctx.fillRect(s.x+c.dir*3-2,s.y-4,3,3);ctx.strokeStyle='#ad683c';for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(s.x-5,s.y+side*8);ctx.lineTo(s.x-9,s.y+side*14);ctx.moveTo(s.x+5,s.y+side*8);ctx.lineTo(s.x+9,s.y+side*14);ctx.stroke()}}
ctx.globalAlpha=1;ctx.shadowColor='#64e7ff';ctx.shadowBlur=14;ctx.fillStyle='#a4faff';for(const b of bullets){if(b.vx){ctx.fillStyle='#fff3a2';ctx.fillRect(b.x-10,b.y-2,20,4)}else{ctx.fillStyle='#a4faff';ctx.fillRect(b.x-2,b.y-8,4,17)}}ctx.shadowBlur=0;
for(const m of missiles){ctx.fillStyle='#fff0bc';ctx.shadowColor='#ffb65f';ctx.shadowBlur=16;ctx.beginPath();ctx.moveTo(m.x,m.y-9);ctx.lineTo(m.x-5,m.y+7);ctx.lineTo(m.x+5,m.y+7);ctx.closePath();ctx.fill();ctx.fillStyle='#ff9445';ctx.fillRect(m.x-2,m.y+7,4,10)}ctx.shadowBlur=0;
for(const b of blasts){ctx.globalAlpha=b.life/.45;ctx.fillStyle='#ffad493f';ctx.strokeStyle='#ffe4a7';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,BLAST_RADIUS,0,Math.PI*2);ctx.fill();ctx.stroke()}ctx.globalAlpha=1;
if(bot&&botSprite.complete&&botSprite.naturalWidth){ctx.imageSmoothingEnabled=false;ctx.drawImage(botSprite,bot.x-30,bot.y-30,60,60);ctx.imageSmoothingEnabled=true}
if(invincible<=0||Math.floor(tick*12)%2===0){if(shipSprite.complete&&shipSprite.naturalWidth){ctx.imageSmoothingEnabled=false;ctx.drawImage(shipSprite,player.x-35,player.y-35,70,70);ctx.imageSmoothingEnabled=true;}else{ctx.fillStyle='#5de8f2';ctx.beginPath();ctx.moveTo(player.x,player.y-23);ctx.lineTo(player.x-24,player.y+15);ctx.lineTo(player.x+24,player.y+15);ctx.fill()}}for(const p of particles){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3)}ctx.globalAlpha=1;
// Translucent glass sits over the action, ending precisely at the flight zone.
ctx.save();ctx.globalAlpha=.12;
for(const band of GLASS_BANDS){ctx.fillStyle=band.color;ctx.fillRect(0,band.top,W,DEFENSE_TOP/3)}
ctx.globalAlpha=.07;ctx.fillStyle='#ffffff';
for(const band of GLASS_BANDS)ctx.fillRect(0,band.top,W,2);
ctx.restore();
if(radeFlash>0&&Math.floor(radeFlash*5)%2===0){
 ctx.save();ctx.textAlign='center';ctx.font='bold 64px Arial';ctx.shadowColor='#ffe76a';ctx.shadowBlur=22;ctx.fillStyle='#fff4a1';ctx.fillText('RADE Enabled',W/2,DEFENSE_TOP/2+20);ctx.restore();
}
ctx.fillStyle='#668897';ctx.font='9px monospace';ctx.fillText('OBI / DEFENSE ZONE',18,625)}
function frame(now){const introLast=last,previousState=state;const dt=Math.min((now-last)/1000,.04);last=now;if(state==='intro')advanceIntro(Math.max(0,(now-introLast)/1000));if(state==='playing'&&previousState==='playing')update(dt);draw();requestAnimationFrame(frame)}
window.addEventListener('keydown',e=>{if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();keys.add(e.key.length===1?e.key.toLowerCase():e.key);if(e.repeat)return;if(e.key==='Enter'){if(state==='paused')pause();else if(state!=='playing'&&state!=='intro')startIntro()}if(e.key.toLowerCase()==='p')pause();if(e.key.toLowerCase()==='m')fireMissile()});window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));window.addEventListener('blur',()=>{keys.clear();pointer=false;if(state==='playing')pause()});
function aim(e){if(state!=='playing')return;const r=canvas.getBoundingClientRect();player.x=Math.max(25,Math.min(W-25,(e.clientX-r.left)*W/r.width));player.y=Math.max(515,Math.min(H-28,(e.clientY-r.top)*H/r.height))}canvas.addEventListener('pointermove',aim);canvas.addEventListener('pointerdown',e=>{if(state!=='playing')return;aim(e);pointer=true;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointerup',()=>pointer=false);canvas.addEventListener('pointercancel',()=>pointer=false);$('start').onclick=()=>state==='paused'?pause():startIntro();$('pause').onclick=pause;$('reset').onclick=resetToReady;$('missile').onclick=fireMissile;$('sound').onclick=()=>{muted=!muted;if(muted)stopIntroMusic();$('sound').textContent='SOUND '+(muted?'OFF':'ON');tone(500,.1,'triangle')};
for(let i=0;i<60;i++)blocks.push({x:Math.floor(rand(1,39))*24+12,y:Math.floor(rand(4,20))*24+12,hp:3});hud();requestAnimationFrame(frame);
