import {useEffect,useRef,useState} from 'react';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

type Fighter={id:number;name:string;side:'heroes'|'enemies';hp:number;max:number};
type Props={units:Fighter[];activeId:number;onSelect:(id:number)=>void;disabled:boolean};

/** Procedural stand-in arena. Original character models are NOT included. */
export default function BattleArena3D({units,activeId,onSelect,disabled}:Props){
 const mount=useRef<HTMLDivElement>(null);
 const [localModel,setLocalModel]=useState<File|null>(null);
 const [modelStatus,setModelStatus]=useState('');
 const installModel=useRef<((file:File)=>void)|null>(null);
 const selectRef=useRef(onSelect);
 const stateRef=useRef({units,activeId,disabled});
 selectRef.current=onSelect;
 stateRef.current={units,activeId,disabled};
 useEffect(()=>{
  const host=mount.current;if(!host)return;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#07131b');
  scene.fog=new THREE.Fog('#07131b',15,38);
  const camera=new THREE.PerspectiveCamera(48,1,.1,80);
  camera.position.set(0,8,15);camera.lookAt(0,1,0);
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.shadowMap.enabled=true;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight('#9dd8ff','#1b332a',2));
  const light=new THREE.DirectionalLight('#e9f4ff',3);light.position.set(-4,10,7);light.castShadow=true;
  light.shadow.mapSize.set(1024,1024);scene.add(light);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(50,50),new THREE.MeshStandardMaterial({color:'#192c30',roughness:.9}));
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const grid=new THREE.GridHelper(32,32,'#2b5555','#21383d');grid.position.y=.012;scene.add(grid);
  const figures=new Map<number,THREE.Group>();
  const targets:THREE.Object3D[]=[];
  const colors=['#399e6e','#bf4b43','#9364c4','#545d66','#9a3b4a','#9a86ae'];
  function createFighter(id:number){
   const group=new THREE.Group();group.userData.fighterId=id;
   const mat=new THREE.MeshStandardMaterial({color:colors[id]||'#888888',roughness:.6});
   const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.39,.85,5,10),mat);torso.position.y=1.25;torso.castShadow=true;group.add(torso);
   const head=new THREE.Mesh(new THREE.SphereGeometry(.32,14,10),mat);head.position.y=2.15;head.castShadow=true;group.add(head);
   const face=new THREE.Mesh(new THREE.BoxGeometry(.48,.12,.12),new THREE.MeshStandardMaterial({color:id<3?'#f1d15c':'#e25763'}));
   face.position.set(0,2.2,.27);group.add(face);
   for(const x of [-.25,.25]){
    const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.7,3,8),mat);leg.position.set(x,.5,0);leg.castShadow=true;group.add(leg);
   }
   const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.66,32),new THREE.MeshBasicMaterial({color:'#ffe58a',side:THREE.DoubleSide}));
   ring.rotation.x=-Math.PI/2;ring.position.y=.04;ring.name='activeRing';group.add(ring);
   const healthBack=new THREE.Mesh(new THREE.PlaneGeometry(1.25,.13),new THREE.MeshBasicMaterial({color:'#442c33',side:THREE.DoubleSide}));
   healthBack.position.set(0,2.7,0);group.add(healthBack);
   const healthFill=new THREE.Mesh(new THREE.PlaneGeometry(1.25,.13),new THREE.MeshBasicMaterial({color:'#53d98e',side:THREE.DoubleSide}));
   healthFill.position.set(0,2.7,.01);healthFill.name='healthFill';group.add(healthFill);
   const col=id<3?id:id-3;
   group.position.set((col-1)*2.8,0,id<3?3:-3);
   group.rotation.y=id<3?0:Math.PI;
   group.traverse(obj=>{obj.userData.fighterId=id;if(obj instanceof THREE.Mesh)targets.push(obj)});
   scene.add(group);figures.set(id,group);
  }
  for(let i=0;i<6;i++)createFighter(i);
  let imported:THREE.Object3D|null=null;
  installModel.current=(file:File)=>{
   const url=URL.createObjectURL(file);
   new GLTFLoader().load(url,gltf=>{
    URL.revokeObjectURL(url);
    if(disposed)return;
    if(imported)scene.remove(imported);
    const figure=figures.get(0)!;
    figure.children.forEach(child=>{if(child.name==='localMesh')figure.remove(child)});
    const object=gltf.scene;object.name='localMesh';
    const bounds=new THREE.Box3().setFromObject(object);
    const size=bounds.getSize(new THREE.Vector3());
    const center=bounds.getCenter(new THREE.Vector3());
    const height=Math.max(size.y,.0001);
    object.scale.setScalar(2.6/height);
    object.position.set(-center.x*2.6/height,-bounds.min.y*2.6/height,-center.z*2.6/height);
    figure.add(object);imported=object;
    for(const child of figure.children){if(child!==object&&child.name!=='activeRing'&&child.name!=='healthFill')child.visible=false}
    setModelStatus('Local Leonardo model loaded into the battle scene.');
   },undefined,()=>{URL.revokeObjectURL(url);setModelStatus('Could not load this GLB file.')});
  };
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
  controls.minDistance=8;controls.maxDistance=24;controls.maxPolarAngle=Math.PI/2.15;
  controls.target.set(0,1,0);controls.update();
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
  let startX=0,startY=0;
  function pointerDown(e:PointerEvent){startX=e.clientX;startY=e.clientY}
  function pointerUp(e:PointerEvent){
   if(Math.hypot(e.clientX-startX,e.clientY-startY)>8||stateRef.current.disabled)return;
   const bounds=renderer.domElement.getBoundingClientRect();
   mouse.set(((e.clientX-bounds.left)/bounds.width)*2-1,-((e.clientY-bounds.top)/bounds.height)*2+1);
   ray.setFromCamera(mouse,camera);
   const hit=ray.intersectObjects(targets,false)[0];
   if(hit&&typeof hit.object.userData.fighterId==='number')selectRef.current(hit.object.userData.fighterId);
  }
  renderer.domElement.addEventListener('pointerdown',pointerDown);
  renderer.domElement.addEventListener('pointerup',pointerUp);
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  let frame=0,disposed=false;
  const clock=new THREE.Clock();
  function render(){
   if(disposed)return;
   const t=clock.getElapsedTime();
   const current=stateRef.current;
   for(const unit of current.units){
    const g=figures.get(unit.id);if(!g)continue;
    const alive=unit.hp>0;
    g.visible=alive;
    g.position.y=alive ? .04*Math.sin(t*2+unit.id) : 0;
    const ring=g.getObjectByName('activeRing');if(ring)ring.visible=current.activeId===unit.id;
    const fill=g.getObjectByName('healthFill') as THREE.Mesh|undefined;
    if(fill){const scale=Math.max(0,unit.hp/unit.max);fill.scale.x=scale;fill.position.x=-(1-scale)*.625}
   }
   controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(render);
  }
  render();
  return ()=>{
   disposed=true;installModel.current=null;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();
   renderer.domElement.removeEventListener('pointerdown',pointerDown);
   renderer.domElement.removeEventListener('pointerup',pointerUp);
   scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.LineSegments){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose())}});
   renderer.dispose();renderer.domElement.remove();
  };
 },[]);
 useEffect(()=>{if(localModel)installModel.current?.(localModel)},[localModel]);
 return <section aria-label="Interactive 3D battle arena" style={{maxWidth:1000,margin:'12px auto'}}>
  <div ref={mount} style={{height:'min(58vw,440px)',minHeight:270,width:'100%',borderRadius:14,overflow:'hidden',touchAction:'pan-y',background:'#07131b'}}/>
  <label style={{display:'block',marginTop:10,fontSize:13}}>Use your locally extracted Leonardo GLB in the arena: <input type="file" accept=".glb,model/gltf-binary" onChange={e=>{setModelStatus('Loading local model…');setLocalModel(e.target.files?.[0]??null)}}/></label>
  {modelStatus&&<p role="status">{modelStatus}</p>}
  <p style={{textAlign:'center',fontSize:12,opacity:.75}}>3D prototype arena · Procedural placeholder fighters · Tap a fighter to target</p>
 </section>;
}