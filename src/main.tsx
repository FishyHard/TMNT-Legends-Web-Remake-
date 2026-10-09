import BattleArena3D from './BattleArena3D';
import ModelViewer from './ModelViewer';
import React,{useState} from 'react';
import{createRoot}from'react-dom/client';
import './style.css';
type Side='heroes'|'enemies';
type Unit={id:number;name:string;side:Side;hp:number;max:number;atk:number;speed:number;heal:boolean;cooldown:number};
const initial=():Unit[]=>[
{id:0,name:'Leonardo',side:'heroes',hp:180,max:180,atk:35,speed:85,heal:false,cooldown:0},
{id:1,name:'Raphael',side:'heroes',hp:210,max:210,atk:42,speed:65,heal:false,cooldown:0},
{id:2,name:'Donatello',side:'heroes',hp:160,max:160,atk:28,speed:75,heal:true,cooldown:0},
{id:3,name:'Foot Soldier',side:'enemies',hp:155,max:155,atk:28,speed:70,heal:false,cooldown:0},
{id:4,name:'Foot Elite',side:'enemies',hp:175,max:175,atk:31,speed:60,heal:false,cooldown:0},
{id:5,name:'Kraang Droid',side:'enemies',hp:170,max:170,atk:32,speed:80,heal:false,cooldown:0}
];
const order=[0,5,2,3,1,4];
function App(){
 const [units,setUnits]=useState<Unit[]>(initial);
 const [turn,setTurn]=useState(0);
 const [special,setSpecial]=useState(false);
 const [log,setLog]=useState<string[]>(['Battle started!']);
 const actorId=order[turn%order.length];
 const actor=units[actorId];
 const hero=actor.side==='heroes';
 const won=units.filter(u=>u.side==='enemies').every(u=>u.hp===0);
 const lost=units.filter(u=>u.side==='heroes').every(u=>u.hp===0);
 const ended=won||lost;
 function advance(from:Unit[]){
  let next=turn+1;
  while(next<turn+order.length+1&&from[order[next%order.length]].hp===0)next++;
  setTurn(next);
 }
 function act(targetId:number){
  if(ended||actor.hp===0)return;
  const target=units[targetId];
  const isHeal=hero&&special&&actor.heal;
  if(target.hp===0||target.side!==(isHeal?'heroes':hero?'enemies':'heroes'))return;
  if(special&&actor.cooldown>0)return;
  const amount=Math.round(actor.atk*(special?isHeal?1.9:1.65:1));
  const updated=units.map(u=>{
   if(u.id===targetId)return {...u,hp:Math.max(0,Math.min(u.max,u.hp+(isHeal?amount:-amount)))};
   if(u.id===actorId)return {...u,cooldown:special?2:Math.max(0,u.cooldown-1)};
   return u;
  });
  setUnits(updated);
  setLog(prev=>[`${actor.name} used ${special?(isHeal?'Repair':'Power Strike'):'Strike'} on ${target.name}: ${isHeal?'+':'−'}${amount} HP`,...prev].slice(0,5));
  setSpecial(false);
  advance(updated);
 }
 function enemyMove(){
  if(hero||ended)return;
  if(actor.hp===0){advance(units);return;}
  const targets=units.filter(u=>u.side==='heroes'&&u.hp>0).sort((a,b)=>a.hp-b.hp);
  if(targets.length)act(targets[0].id);
 }
 function reset(){setUnits(initial());setTurn(0);setSpecial(false);setLog(['Battle started!']);}
 return <main><header><small>UNOFFICIAL FAN-MADE PROTOTYPE</small><h1>TMNT <em>LEGENDS</em></h1><p>Turn-based battle · Round {Math.floor(turn/6)+1}</p></header>
 <BattleArena3D units={units} activeId={actorId} onSelect={act} disabled={!hero||ended}/>
 <section className="arena">
 {(['enemies','heroes'] as Side[]).map(side=><div key={side}><h2>{side==='heroes'?'YOUR SQUAD':'ENEMY SQUAD'}</h2><div className="team">{units.filter(u=>u.side===side).map(u=><button key={u.id} disabled={!hero||ended||u.hp===0} onClick={()=>act(u.id)} className={`unit ${actorId===u.id?'active':''} ${u.hp===0?'dead':''}`}><div className="portrait">{['🐢','🐢','🐢','🥷','⚔️','🤖'][u.id]}</div><strong>{u.name}</strong><div className="bar"><span style={{width:`${100*u.hp/u.max}%`}}/></div><small>{u.hp}/{u.max} HP</small></button>)}</div></div>)}
 </section>
 <section className="controls">{ended?<><h2>{won?'Victory!':'Defeat!'}</h2><button onClick={reset}>Play again</button></>:<><h2>{actor.name}'s turn</h2>{hero?<><p>Select an ability, then tap a {special&&actor.heal?'teammate':'foe'}.</p><button className={!special?'selected':''} onClick={()=>setSpecial(false)}>Strike</button><button disabled={actor.cooldown>0} className={special?'selected':''} onClick={()=>setSpecial(true)}>{actor.heal?'Repair':'Power Strike'}{actor.cooldown>0?` (CD ${actor.cooldown})`:''}</button></>:<button onClick={enemyMove}>Continue enemy turn</button>}</>}<div className="log">{log.map((s,i)=><p key={i}>{s}</p>)}</div></section>
 <ModelViewer/><footer>Original placeholder visuals · Not affiliated with TMNT rights holders</footer></main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
