import React,{useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import BattleArena3D from './BattleArena3D';
import ModelViewer from './ModelViewer';
import './style.css';

type Side='heroes'|'enemies';
type Unit={id:number;name:string;side:Side;hp:number;max:number;atk:number;speed:number;heal:boolean;cooldown:number;role:string;accent:string;initials:string};
const initial=():Unit[]=>[
{id:0,name:'Leonardo',side:'heroes',hp:180,max:180,atk:35,speed:85,heal:false,cooldown:0,role:'LEADER',accent:'#32a9e7',initials:'LEO'},
{id:1,name:'Raphael',side:'heroes',hp:210,max:210,atk:42,speed:65,heal:false,cooldown:0,role:'BRUISER',accent:'#e95355',initials:'RAPH'},
{id:2,name:'Donatello',side:'heroes',hp:160,max:160,atk:28,speed:75,heal:true,cooldown:0,role:'SUPPORT',accent:'#ae7af6',initials:'DON'},
{id:3,name:'Foot Soldier',side:'enemies',hp:155,max:155,atk:28,speed:70,heal:false,cooldown:0,role:'ASSASSIN',accent:'#e27d6d',initials:'FOOT'},
{id:4,name:'Foot Elite',side:'enemies',hp:175,max:175,atk:31,speed:60,heal:false,cooldown:0,role:'ELITE',accent:'#dc9d67',initials:'ELITE'},
{id:5,name:'Kraang Droid',side:'enemies',hp:170,max:170,atk:32,speed:80,heal:false,cooldown:0,role:'TECH',accent:'#df7cce',initials:'KRAANG'}
];
const order=[0,5,2,3,1,4];
type Skill='basic'|'special';
function App(){
 const [units,setUnits]=useState<Unit[]>(initial);
 const [turn,setTurn]=useState(0);
 const [skill,setSkill]=useState<Skill>('basic');
 const [log,setLog]=useState<string[]>(['Mission started. Defeat the enemy squad.']);
 const [tab,setTab]=useState<'battle'|'workshop'>('battle');
 const [autoEnemy,setAutoEnemy]=useState(true);
 const actorId=order[turn%order.length],actor=units[actorId];
 const hero=actor.side==='heroes';
 const won=units.filter(u=>u.side==='enemies').every(u=>u.hp===0);
 const lost=units.filter(u=>u.side==='heroes').every(u=>u.hp===0);
 const ended=won||lost;
 const round=Math.floor(turn/order.length)+1;
 const isHeal=hero&&skill==='special'&&actor.heal;
 function advance(nextUnits:Unit[]){
  let next=turn+1;
  while(next<turn+order.length+1&&nextUnits[order[next%order.length]].hp===0)next++;
  setTurn(next);
 }
 function act(targetId:number,selectedSkill:Skill=skill){
  if(ended||actor.hp===0)return;
  const target=units[targetId];
  if(!target||target.hp===0)return;
  const healing=hero&&selectedSkill==='special'&&actor.heal;
  if(target.side!==(healing?'heroes':hero?'enemies':'heroes'))return;
  if(selectedSkill==='special'&&actor.cooldown>0)return;
  const amount=Math.round(actor.atk*(selectedSkill==='special'?(healing?1.9:1.65):1));
  const updated=units.map(u=>{
   if(u.id===actorId&&u.id===targetId){
    return {...u,hp:Math.max(0,Math.min(u.max,u.hp+(healing?amount:-amount))),cooldown:selectedSkill==='special'?2:Math.max(0,u.cooldown-1)};
   }
   if(u.id===targetId)return {...u,hp:Math.max(0,Math.min(u.max,u.hp+(healing?amount:-amount)))};
   if(u.id===actorId)return {...u,cooldown:selectedSkill==='special'?2:Math.max(0,u.cooldown-1)};
   return u;
  });
  setUnits(updated);
  setLog(prev=>[`${actor.name} · ${selectedSkill==='special'?(healing?'Field Repair':'Power Strike'):'Basic Attack'} → ${target.name} (${healing?'+':'−'}${amount} HP)`,...prev].slice(0,6));
  setSkill('basic');advance(updated);
 }
 function enemyMove(){
  if(hero||ended)return;
  if(actor.hp===0){advance(units);return}
  const targets=units.filter(u=>u.side==='heroes'&&u.hp>0).sort((a,b)=>a.hp-b.hp);
  if(targets[0])act(targets[0].id,'basic');
 }
 useEffect(()=>{
  if(hero||ended||!autoEnemy||tab!=='battle')return;
  const timer=window.setTimeout(enemyMove,900);
  return()=>window.clearTimeout(timer);
 },[turn,autoEnemy,tab,ended]);
 function reset(){setUnits(initial());setTurn(0);setSkill('basic');setLog(['Mission started. Defeat the enemy squad.']);setTab('battle')}
 function card(u:Unit){
  const eligible=!ended&&hero&&u.hp>0&&u.side===(isHeal?'heroes':'enemies');
  return <button key={u.id} type="button" onClick={()=>act(u.id)} disabled={!eligible}
   className={`fighter-card ${u.hp===0?'is-down':''} ${u.id===actorId?'is-active':''} ${eligible?'is-targetable':''}`}
   style={{'--fighter-color':u.accent} as React.CSSProperties} aria-label={`${u.name}, ${u.hp} of ${u.max} health`}>
    <div className="fighter-avatar"><span>{u.initials}</span><small>LV. 30</small></div>
    <div className="fighter-info"><div className="fighter-name">{u.name}</div><div className="fighter-role">{u.role}</div>
    <div className="hp-track"><span style={{width:`${100*u.hp/u.max}%`}}/></div><div className="hp-numbers">{u.hp} / {u.max} HP</div></div>
    {u.id===actorId&&<span className="turn-indicator">TURN</span>}
  </button>
 }
 return <main className="app-shell">
  <div className="ambient-glow"/>
  <header className="topbar">
   <div className="brand"><div className="brand-mark">T</div><div><span className="brand-kicker">TEENAGE MUTANT NINJA TURTLES</span><strong>LEGENDS <span className="brand-beta">WEB PROTOTYPE</span></strong></div></div>
   <div className="topbar-right"><span className="online-dot"/> <span>LOCAL SESSION</span><button className="icon-button" onClick={reset} title="Restart mission" aria-label="Restart mission">↻</button></div>
  </header>
  <nav className="primary-nav" aria-label="Main navigation">
   <button className={tab==='battle'?'nav-active':''} onClick={()=>setTab('battle')}>⚔ <span>BATTLE</span></button>
   <button className={tab==='workshop'?'nav-active':''} onClick={()=>setTab('workshop')}>⬡ <span>MODEL WORKSHOP</span></button>
   <span className="nav-caption">UNOFFICIAL FAN PROJECT</span>
  </nav>
  {tab==='battle'?<>
   <section className="mission-heading"><div><div className="eyebrow"><span className="mission-pip"/> CAMPAIGN / PROTOTYPE MISSION 01</div><h1>STREETS OF <span>NEW YORK</span></h1><p>Lead your squad. Choose abilities. Take down the enemy team.</p></div><div className="mission-counter"><span>ROUND</span><strong>{String(round).padStart(2,'0')}</strong></div></section>
   <div className="battle-layout">
    <section className="battle-stage">
     <div className="stage-topline"><span><i/> COMBAT ARENA</span><span>3 VS 3 · TURN-BASED</span></div>
     <BattleArena3D units={units} activeId={actorId} onSelect={act} disabled={!hero||ended}/>
     <div className="battle-status"><span className="status-icon">◆</span><div><small>{ended?'MISSION COMPLETE':hero?'YOUR TURN':'ENEMY TURN'}</small><strong>{ended?(won?'Victory — squad secured!':'Defeat — mission failed'):actor.name+' is acting'}</strong></div><span className="battle-status-side">{hero&&!ended?'SELECT A TARGET':ended?'BATTLE ENDED':'ENEMY THINKING'}</span></div>
    </section>
    <aside className="battle-sidebar">
     <section className="panel squad-panel"><div className="panel-heading"><span>01 / HOSTILES</span><b>{units.filter(u=>u.side==='enemies'&&u.hp>0).length} ALIVE</b></div><div className="fighter-list">{units.filter(u=>u.side==='enemies').map(card)}</div></section>
     <section className="panel squad-panel"><div className="panel-heading"><span>02 / YOUR SQUAD</span><b>{units.filter(u=>u.side==='heroes'&&u.hp>0).length} ALIVE</b></div><div className="fighter-list">{units.filter(u=>u.side==='heroes').map(card)}</div></section>
    </aside>
   </div>
   <section className="bottom-grid">
    <div className="panel ability-panel">
     <div className="panel-heading"><span>COMBAT CONTROLS</span><b>TURN {turn+1}</b></div>
     {ended?<div className="result-panel"><h2>{won?'MISSION ACCOMPLISHED':'SQUAD DEFEATED'}</h2><p>{won?'All enemies eliminated.':'Try a different targeting strategy.'}</p><button className="primary-action" onClick={reset}>↻ REPLAY MISSION</button></div>:<>
      <div className="actor-strip"><div className="actor-avatar" style={{borderColor:actor.accent}}>{actor.initials}</div><div><small>CURRENT FIGHTER</small><strong>{actor.name}</strong></div><div className="actor-health">{actor.hp} <span>HP</span></div></div>
      {hero?<><div className="ability-list">
       <button className={skill==='basic'?'ability selected':'ability'} onClick={()=>setSkill('basic')}><span className="ability-symbol">⚔</span><span><strong>BASIC ATTACK</strong><small>Deal {actor.atk} damage to one enemy</small></span><em>READY</em></button>
       <button disabled={actor.cooldown>0} className={skill==='special'?'ability selected':'ability'} onClick={()=>setSkill('special')}><span className="ability-symbol special-symbol">✦</span><span><strong>{actor.heal?'FIELD REPAIR':'POWER STRIKE'}</strong><small>{actor.heal?'Restore '+Math.round(actor.atk*1.9)+' HP to an ally':'Deal '+Math.round(actor.atk*1.65)+' damage to one enemy'}</small></span><em>{actor.cooldown>0?'CD '+actor.cooldown:'READY'}</em></button>
      </div><p className="hint">Select an ability, then tap a {isHeal?'friendly fighter':'hostile fighter'} in the arena or roster.</p></>:<><div className="enemy-controls"><p>{autoEnemy?'Enemy AI will act automatically.':'Enemy AI is paused.'}</p><button onClick={enemyMove}>CONTINUE ENEMY TURN →</button></div></>}
     </>}
    </div>
    <div className="panel combat-log"><div className="panel-heading"><span>COMBAT FEED</span><b>LIVE</b></div><div className="log-entries">{log.map((s,i)=><div className="log-entry" key={i}><span className="log-bullet">{i===0?'●':'·'}</span><p>{s}</p></div>)}</div><label className="toggle-row"><input type="checkbox" checked={autoEnemy} onChange={e=>setAutoEnemy(e.target.checked)}/> Automatic enemy turns</label></div>
   </section>
  </>:<section className="workshop-page"><div className="eyebrow">ASSET RECONSTRUCTION LAB</div><h1>MODEL <span>WORKSHOP</span></h1><p>Preview GLB files extracted from your own copy of the game. Files stay in your browser and are not uploaded.</p><ModelViewer/><div className="panel workshop-note"><strong>Original asset status</strong><p>Static meshes and textures can be extracted. Original skeletal animation is not yet decoded. The battle arena uses procedural stand-ins until you import your own GLB.</p></div></section>}
  <footer className="footer"><span>TMNT LEGENDS — COMMUNITY WEB REMAKE</span><span>Unofficial prototype · No affiliation with rights holders · Original assets not hosted</span></footer>
 </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
