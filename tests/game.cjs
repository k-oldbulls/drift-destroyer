const fs=require('fs'),vm=require('vm');const elements={};const context=new Proxy({},{get:()=>()=>{}});const sandbox={document:{getElementById(id){return elements[id]??={textContent:'',innerHTML:'',classList:{add(){},remove(){}},getContext:()=>context,addEventListener(){}}}},Image:class{},localStorage:{getItem:()=>null,setItem(){}},window:{addEventListener(){}},performance:{now:()=>0},requestAnimationFrame(){},Math,Set};vm.createContext(sandbox);vm.runInContext(fs.readFileSync('game.js','utf8'),sandbox);vm.runInContext(`
function check(ok,label){if(!ok)throw Error(label)}
reset();check(chains.length===1&&chains[0].segments.length===1,'single starting bug');
blocks=[];links=[];let c=chains[0];
// Exercise real traversals rather than manufacturing successive follower hits.
while(wallTouches<1)stepChain(c);
check(c.segments.length===2&&c.growth===0,'first wall adds exactly one');
for(let i=0;i<10;i++)stepChain(c);
check(wallTouches===1&&c.segments.length===2,'followers cannot cascade growth');
while(wallTouches<2)stepChain(c);
check(c.segments.length+c.growth===4,'second wall adds exactly two');
for(let i=0;i<22;i++)stepChain(c);
check(wallTouches===2&&c.segments.length===4&&c.growth===0,'three seconds of movement cannot keep adding bugs');
while(wallTouches<3)stepChain(c);
check(c.segments.length+c.growth===7,'third wall adds exactly three');
for(let i=0;i<4;i++)stepChain(c);
check(c.segments.length===7&&wallTouches===3,'third wall addition ends');
let walls=wallTouches;c.segments[0].x=300;c.dir=1;blocks=[{x:324,y:c.segments[0].y,hp:3}];stepChain(c);check(wallTouches===walls,'block does not count');
// Connections expire within three seconds and only join aligned blocks.
blocks=[{x:300,y:100,hp:3},{x:300,y:300,hp:3},{x:500,y:300,hp:3}];links=[];spawnLink();check(links.length===1&&links[0].life<=3,'connection lifetime');
linkTimer=10;updateLinks(3.01);check(links.length===0,'connection expires');
let va=blocks[0],vb=blocks[1];links=[{a:va,b:vb,vertical:true,life:2}];
let bouncing={segments:[segment(276,200)],dir:1,clock:0,growth:0};let count=wallTouches;stepChain(bouncing);check(bouncing.dir===-1&&wallTouches===count,'vertical link bounces without growth');
links=[{a:vb,b:blocks[2],vertical:false,life:2}];check(blocksShot({x:400,y:280,previousY:320}),'horizontal link blocks swept shot');check(!blocksShot({x:550,y:280,previousY:320}),'shot outside link passes');
links=[{a:va,b:vb,vertical:true,life:2}];check(!blocksShot({x:300,y:180,previousY:220}),'vertical link allows shots');
reset();blocks=[];keys.add(' ');update(.001);check(bullets[0].x===459,'left horn');shot=0;update(.001);check(bullets[1].x===501,'right horn');keys.clear();
chains=[{segments:[segment(480,300)],dir:1,clock:-1,growth:0}];let bug=chains[0].segments[0];bug.phased=true;bug.phaseTimer=10;bullets=[{x:480,y:310}];update(.01);check(score===0&&bullets.length===1,'phased bug ignores shot');
bug.phased=false;bullets=[{x:480,y:310}];update(.01);check(score===20&&wave===2,'solid bug hit and next wave');check(chains.length===2&&chains.every(c=>c.segments.length===1)&&wallTouches===0,'level two starts two single-segment chains');
chains[0].segments[0].phaseTimer=0;update(.01);check(chains[0].segments[0].phased,'phase begins');chains[0].segments[0].phaseTimer=0;update(.01);check(!chains[0].segments[0].phased,'phase ends');
// Losing a life must not teleport a grown chain back to the spawn row.
chains=[{segments:[segment(480,540),segment(456,540),segment(432,540)],dir:1,clock:0,growth:4}];
let beforeDamage=chains[0].segments.map(s=>({x:s.x,y:s.y}));wallTouches=5;invincible=0;hit();
check(lives===2&&invincible>0,'OBI respawns with protection');
check(chains.length===1&&chains[0].segments.length===3&&chains[0].growth===4&&wallTouches===5,'damage preserves existing drift');
check(chains[0].segments.every((s,i)=>s.x===beforeDamage[i].x&&s.y===beforeDamage[i].y),'damage never moves bugs to top');
wave=3;nextWave();check(chains.length===3&&chains.every(c=>c.segments.length===1&&c.growth===0),'level three starts three single-segment chains');
check(chains[0].segments[0].x===12&&chains[0].segments[0].y===60&&chains[0].dir===1,'first chain left');
check(chains[1].segments[0].x===W-12&&chains[1].segments[0].y===84&&chains[1].dir===-1,'second chain opposite side one row down');
check(chains[2].segments[0].x===12&&chains[2].segments[0].y===108&&chains[2].dir===1,'third chain alternates side and row');
wave=25;nextWave();check(chains.length===25&&chains.every(c=>c.segments[0].y<DEFENSE_TOP-20),'later levels keep spawns above flight zone');
reset();check(chains.length===1&&chains[0].segments.length===1&&chains[0].growth===0,'restart always one segment');
reset();fireMissile();check(missiles.length===1&&missiles[0].x===player.x&&!missileReady,'centre launch');fireMissile();check(missiles.length===1,'no extra missile');
for(let i=0;i<9;i++)chargeMissile();check(!missileReady&&missileShots===9,'nine shots cannot reload');chargeMissile();check(missileReady,'tenth shot reloads');
check(Math.abs(Math.PI*BLAST_RADIUS**2-90*Math.PI*BUG_RADIUS**2)<.0001,'tripled radius covers ninety bugs of area');
chains=[{segments:[segment(400,300),segment(420,300),segment(496,300)],dir:1,clock:0,growth:0}];chains[0].segments[0].phased=true;blocks=[];detonate(400,300);check(chains.reduce((n,c)=>n+c.segments.length,0)===2,'blast respects radius and phase immunity');
state='paused';fireMissile();check(missiles.length===1,'cannot fire while paused');$('reset').onclick();check(state==='intro'&&score===0&&lives===3&&missiles.length===0&&blasts.length===0&&missileReady&&chains[0].segments.length===1,'reset enters intro during pause');$('start').onclick();advanceIntro(5);check(state==='playing','start works after reset');
reset();bot=createBot();let patrolStart=bot.x;
moveBot(.1);check(bot.x>patrolStart&&bot.y===535,'bot top Z stroke');
bot.x=bot.route[1].x;bot.y=535;bot.leg=1;moveBot(.1);check(bot.x<bot.route[1].x&&bot.y>535,'bot diagonal Z stroke');
bot.x=bot.route[2].x;bot.y=608;bot.leg=2;moveBot(.1);check(bot.x>bot.route[2].x&&bot.y===608,'bot bottom Z stroke');
bot.x=bot.route[3].x;bot.y=608;moveBot(.01);check(bot.mode==='hop','bot hops after Z');moveBot(.65);check(bot.y===535&&bot.quarter===1&&bot.mode==='z','bot hops to top of second quarter');
for(let q=1;q<=4;q++){
 check(bot.quarter===q%4,'quarter sequence');
 const left=bot.quarter*W/4,right=(bot.quarter+1)*W/4;
 check(bot.route.every(p=>p.x-30>=left&&p.x+30<=right),'Z and sprite stay within quarter');
 for(let i=0;i<120;i++){if(bot.mode==='hop')break;moveBot(.04)}
 check(bot.mode==='hop','quarter Z completes');moveBot(.65);
}
check(GLASS_BANDS.length===3&&GLASS_BANDS[2].top+DEFENSE_TOP/3===505,'glass ends above flight zone');
bot=createBot(3,true,-1);let reverseStart=bot.x;moveBot(.1);check(bot.x<reverseStart&&bot.y===535,'reverse Z moves left on top');
bot.x=bot.route[1].x;bot.y=535;bot.leg=1;moveBot(.1);check(bot.x>bot.route[1].x&&bot.y>535,'reverse Z diagonal moves right');
for(let i=0;i<4;i++){
 const oldQuarter=bot.quarter,oldReverse=bot.reverse;
 bot.x=bot.route[3].x;bot.y=608;bot.leg=2;moveBot(.01);moveBot(.65);
 check(bot.quarter===(oldQuarter+3)%4&&bot.reverse!==oldReverse&&bot.direction===-1,'right-side start advances left and alternates Z');
}
reset();blocks=[];links=[];
for(let i=0;i<2;i++)registerBotKill();check(radeTime===0&&botKills===2,'RADE waits for three kills');
bot=createBot();bot.x=400;bot.y=player.y;bullets=[{x:380,y:player.y,vx:700}];update(.01);
check(bot===null&&radeTime===30&&botKills===0&&radeFlash>0,'third bot side hit enables RADE');
bullets=[];shot=0;keys.add(' ');update(.01);keys.clear();
check(bullets.length===3&&bullets.filter(b=>b.vx).length===2,'RADE fires vertical and both horizontal lasers');
updateRade(10);check(radeTime>19&&radeTime<=20,'RADE remains active after ten seconds');updateRade(20);check(radeTime===0,'RADE expires after thirty seconds');bullets=[];shot=0;keys.add(' ');update(.01);keys.clear();check(bullets.length===1&&!bullets[0].vx,'normal vertical fire restored');
for(let i=0;i<3;i++)registerBotKill();check(radeTime===30,'RADE can be earned again');reset();check(radeTime===0&&botKills===0,'reset clears RADE');
bot=createBot();bot.x=400;bot.y=300;botKills=2;detonate(400,300);check(bot===null&&radeTime===30,'missile bot kill also earns RADE');
reset();check(bot===null,'reset clears bot');
restartGame();check(state==='intro'&&introElapsed===0,'reset starts fresh intro');$('start').onclick();advanceIntro(5);check(state==='playing','restart from confirmation');
reset();blocks=[];links=[];invincible=0;botKills=2;bot=createBot();bot.x=player.x;bot.y=player.y;update(.001);
check(bot===null&&lives===2&&radeTime===30&&botKills===0,'bot crash counts as third kill and damages hull');
bot=createBot();bot.x=player.x;bot.y=player.y;update(.001);check(bot!==null&&lives===2&&botKills===0,'protected contact cannot repeatedly count kills');
reset();blocks=[];links=[];invincible=0;lives=1;bot=createBot();bot.x=player.x;bot.y=player.y;update(.001);check(bot===null&&botKills===1&&state==='over','fatal crash counts once');reset();
reset();wave=2;nextWave();blocks=[];links=[];
let firstDrift=chains[0],secondDrift=chains[1];
while(firstDrift.wallCounter.touches<3)stepChain(firstDrift);
check(firstDrift.segments.length+firstDrift.growth===7,'first drift has seven after three contacts');
check(secondDrift.segments.length===1&&secondDrift.wallCounter.touches===0,'other spawn stays single');
while(secondDrift.wallCounter.touches<1)stepChain(secondDrift);
check(secondDrift.segments.length+secondDrift.growth===2,'second drift first contact adds one regardless of other drift');
let totalBefore=chains.reduce((n,c)=>n+c.segments.length+c.growth,0);radeTime=30;invincible=2;update(.001);
check(chains.reduce((n,c)=>n+c.segments.length+c.growth,0)===totalBefore,'RADE and respawn protection do not add drift segments');
let inherited={segments:[segment(300,300)],dir:1,clock:0,growth:0,wallCounter:firstDrift.wallCounter};inherited.segments[0].x=924;stepChain(inherited);check(inherited.segments.length+inherited.growth===5,'split uses original drift counter without duplicating pending growth');
reset();
restartGame();startIntro();check(state==='intro'&&introElapsed===0,'start enters intro');let introX=player.x;aim({clientX:0,clientY:0});check(player.x===introX,'intro blocks movement');fireMissile();check(missiles.length===0,'intro blocks weapons');advanceIntro(4.999);check(state==='intro'&&tick===0&&spawn===0,'no gameplay before five seconds');startIntro();check(introElapsed===4.999,'repeated start does not restart intro');advanceIntro(.0011);check(state==='playing','five seconds starts gameplay');restartGame();startIntro();restartGame();check(introElapsed===0,'reset restarts intro countdown');advanceIntro(4);check(state==='intro','reset grants full intro duration');advanceIntro(1);check(state==='playing','reset automatically restarts gameplay');reset();
reset();blocks=[];links=[];let arrow=chains[0];stepChain(arrow);check(arrow.segments[0].angle===0,'right-pointing chevron');arrow.segments[0].x=948;arrow.dir=1;stepChain(arrow);check(arrow.segments[0].angle===Math.PI/2,'down-pointing chevron on descent');stepChain(arrow);check(Math.abs(arrow.segments[0].angle)===Math.PI,'left-pointing chevron');
let fading=arrow.segments[0];fading.phased=true;fading.phaseTimer=10;update(.25);check(fading.visibility===0,'inactive dark debt fades fully toward black');fading.phased=false;update(.25);check(fading.visibility===1,'active dark debt returns light grey');reset();
// Actual level clears announce the new level and add distinct, bounded defects.
reset();blocks=[];links=[];chains=[];update(.001);
check(wave===2&&chains.length===2&&levelNotice===5,'clear announces next level');
check(newDefects>=10&&newDefects<=20&&blocks.length===newDefects,'message counts newly introduced defects');
check(new Set(blocks.map(b=>b.x+','+b.y)).size===blocks.length,'new defects occupy distinct cells');
check(blocks.every(b=>b.hp===3&&b.y<DEFENSE_TOP),'new defects stay above flight zone');
const added=blocks.length;update(.01);check(blocks.length===added&&levelNotice<5,'defects added once per clear');
levelNotice=.01;update(.02);check(levelNotice===0,'announcement expires');
blocks=[];for(let y=4;y<21;y++)for(let x=1;x<COLS-1;x++)blocks.push({x:x*CELL+12,y:y*CELL+12,hp:3});
check(introduceDefects()===0,'full board reports zero without overlapping');
reset();check(levelNotice===0&&newDefects===0,'reset clears announcement');draw();
const realGet=document.getElementById;document.getElementById=id=>id==='rade'?null:realGet(id);$('start').onclick();advanceIntro(5);check(state==='playing','start survives older HTML without RADE status');document.getElementById=realGet;
pause();check(state==='paused','pause');pause();check(state==='playing','resume');
`,sandbox);console.log('PASS: starting bug; +1/+2/+3 wall growth; block exclusion; alternating horns; phased immunity and recovery; solid hits; increasing level chain count and alternating spawns; damage never respawns a long chain; restart; bot Z and hop; glass bands; third-kill 30-second RADE activation, side fire and expiry; pause/resume');
