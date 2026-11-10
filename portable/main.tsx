import {createRoot} from 'react-dom/client';
import {useRef,useState} from 'react';
import Workspace from '../app/workspace';
import {importBackup,localRequest,parseBackup,PENDING_KEY,readLocal} from './storage';
import type {State} from '../lib/domain';

function LocalTools(){
  const picker=useRef<HTMLInputElement>(null);
  const [message,setMessage]=useState(''),[backup,setBackup]=useState<State|null>(null),[busy,setBusy]=useState(false);
  async function exportData(){
    setBusy(true);
    try {
      const {state}=await readLocal();
      const file=new Blob([JSON.stringify({format:'felifrio-local-v1',exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'});
      const url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=`Felifrio-respaldo-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
      setMessage('Se inició la descarga del respaldo. Guardalo en una carpeta segura.');
    }catch(error){setMessage((error as Error).message);}finally{setBusy(false);}
  }
  async function selectFile(file:File|undefined){
    setMessage('');setBackup(null);if(!file)return;
    try {
      if(file.size>20*1024*1024)throw Error('El respaldo supera el límite de 20 MB.');
      setBackup(parseBackup(JSON.parse(await file.text())));
    }catch(error){setMessage(error instanceof SyntaxError?'El archivo no es un JSON válido.':(error as Error).message);}
    if(picker.current)picker.current.value='';
  }
  async function restore(){
    setBusy(true);
    try {await importBackup({state:backup});location.reload();}
    catch(error){setMessage((error as Error).message);setBackup(null);setBusy(false);}
  }
  return <section className="local-tools" aria-label="Datos de esta computadora">
    <div><span className="local-badge">FELIFRÍO LOCAL · VERSIÓN 1.1</span><h2>Guardado en esta computadora.</h2><p>Los datos quedan en este navegador. Descargá un respaldo al terminar.</p></div>
    <div className="local-buttons"><button className="button" disabled={busy} onClick={exportData}>Descargar respaldo</button><button className="button light" disabled={busy} onClick={()=>picker.current?.click()}>Importar respaldo</button><input ref={picker} type="file" accept=".json,application/json" hidden aria-label="Seleccionar respaldo JSON" onChange={e=>selectFile(e.target.files?.[0])}/></div>
    <details><summary>Cómo empezar y cuidar tus datos</summary><ol><li>En <b>Clientes</b>, creá el comercio y su precio por bolsa.</li><li>En <b>Producción</b>, registrá el primer lote de bolsas de 3 kg.</li><li>En <b>Repartos</b>, cargá el vehículo y entregá al cliente.</li><li>En <b>Rendiciones</b>, contá lo que quedó; después registrá el cobro.</li></ol><p>Usá siempre este archivo y navegador, fuera del modo privado. Los datos no se envían a Internet ni se sincronizan con otros equipos. Limpiar los datos del navegador puede borrar los registros. Cambiar de navegador, mover el archivo o usar otra computadora puede mostrar una base distinta; el respaldo permite trasladar tus datos. Esta versión no tiene usuarios compartidos ni respaldo automático en la nube.</p></details>
    {message&&<p className="local-message" role="status">{message}</p>}
    {backup&&<div className="local-import" role="region" aria-label="Revisar respaldo"><h3>Revisá el respaldo antes de importarlo</h3><p>{backup.clients.length} clientes · {backup.entries.length} movimientos · {backup.factory} bolsas en fábrica</p><p>Sólo se importa si este navegador todavía no tiene registros. No se mezclan ni reemplazan datos existentes.</p><div className="local-buttons"><button className="button" disabled={busy} onClick={restore}>{busy?'Importando…':'Confirmar importación'}</button><button className="button light" disabled={busy} onClick={()=>setBackup(null)}>Cancelar</button></div></div>}
  </section>;
}

createRoot(document.getElementById('root')!).render(<Workspace requestData={localRequest} pendingKey={PENDING_KEY} localTools={<LocalTools/>}/>);
