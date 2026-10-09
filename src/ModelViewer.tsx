import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

/** Loads a local original GLB without uploading it to any server. */
export default function ModelViewer(){
 const mount=useRef<HTMLDivElement>(null);
 const [model,setModel]=useState<File|null>(null);
 const [error,setError]=useState('');
 useEffect(()=>{
  if(!mount.current||!model)return;
  const host=mount.current;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#111b22');
  const camera=new THREE.PerspectiveCamera(40,1,.01,2000);
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xffffff,0x536c70,2.5));
  const key=new THREE.DirectionalLight(0xffffff,3);
  key.position.set(2,5,5);scene.add(key);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;
  let disposed=false;
  const url=URL.createObjectURL(model);
  const resize=()=>{
   const w=host.clientWidth,h=host.clientHeight;
   renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  };
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  new GLTFLoader().load(url,gltf=>{
   if(disposed)return;
   const object=gltf.scene;
   scene.add(object);
   const bounds=new THREE.Box3().setFromObject(object);
   const center=bounds.getCenter(new THREE.Vector3());
   const size=bounds.getSize(new THREE.Vector3());
   object.position.sub(center);
   const radius=Math.max(size.x,size.y,size.z,1);
   camera.position.set(radius*.9,radius*.45,radius*1.8);
   camera.near=Math.max(.01,radius/1000);camera.far=radius*20;
   camera.updateProjectionMatrix();controls.target.set(0,0,0);controls.update();
   setError('');
  },undefined,err=>setError('Unable to load model: '+String(err)));
  let frame=0;
  function tick(){if(disposed)return;controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(tick)}
  tick();
  return ()=>{
   disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();
   URL.revokeObjectURL(url);renderer.dispose();renderer.domElement.remove();
   scene.traverse(o=>{
    if(o instanceof THREE.Mesh){
     o.geometry.dispose();
     const materials=Array.isArray(o.material)?o.material:[o.material];
     materials.forEach(m=>m.dispose());
    }
   });
  };
 },[model]);
 return <section style={{margin:'20px auto',maxWidth:900,padding:16,background:'#17222c',borderRadius:16}}>
  <h2>Original 3D model viewer</h2>
  <p>Open a locally exported GLB to inspect the recovered geometry. The file stays on your device.</p>
  <input aria-label="Choose GLB model" type="file" accept=".glb,model/gltf-binary" onChange={e=>setModel(e.target.files?.[0]??null)}/>
  <div ref={mount} style={{width:'100%',height:360,marginTop:12,borderRadius:12,overflow:'hidden',background:'#111b22'}}/>
  {error&&<p role="alert">{error}</p>}
 </section>;
}
