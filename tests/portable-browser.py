"""Browser verification for the downloadable app. Requires Python Playwright and Chromium."""
import functools
import http.server
import json
from pathlib import Path
import subprocess
import tempfile
import threading

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'outputs' / 'portable-tests'
OUT.mkdir(parents=True, exist_ok=True)
subprocess.run(['node', 'scripts/build-portable.mjs'], cwd=ROOT, check=True)
subprocess.run(['node', '--input-type=module', '-e', """
import {build} from 'vite';
await build({configFile:false,build:{outDir:'outputs/portable-tests',emptyOutDir:false,
lib:{entry:'portable/storage.ts',name:'FelifrioStorage',formats:['iife'],fileName:()=> 'storage.js'}}});
"""], cwd=ROOT, check=True)


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
app_url = base + '/demo/Felifrio_App.html'


def state(page):
    return page.evaluate('''() => new Promise((resolve,reject)=>{
      const open=indexedDB.open('felifrio-prueba-local-v1',1);
      open.onerror=()=>reject(open.error);
      open.onsuccess=()=>{const db=open.result;
        const request=db.transaction('state').objectStore('state').get('business');
        request.onsuccess=()=>{resolve(request.result ? JSON.parse(JSON.stringify(request.result)) : null);db.close();};
      };
    })''')


def save(page):
    page.get_by_role('button', name='Confirmar y guardar', exact=True).click()
    expect(page.get_by_role('dialog')).not_to_be_visible()


def tab(page, name):
    page.locator('nav').get_by_role('button', name=name, exact=True).click()


with sync_playwright() as p, tempfile.TemporaryDirectory(prefix='felifrio-browser-') as profile:
    launch = {'executable_path': '/usr/bin/chromium', 'args': ['--no-sandbox'], 'viewport': {'width': 1440, 'height': 1000}}
    context = p.chromium.launch_persistent_context(profile, **launch)
    page = context.pages[0]
    errors, outgoing = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('request', lambda request: outgoing.append(request.url))
    page.goto(app_url, wait_until='networkidle')
    expect(page.get_by_text('Cargando el negocio…')).not_to_be_visible()
    assert not state(page)
    tab(page, 'Clientes')
    page.get_by_role('button', name='Nuevo cliente', exact=True).click()
    page.get_by_label('Nombre del comercio').fill('Almacén de prueba')
    page.get_by_label('Precio acordado por bolsa ($)').fill('1000')
    save(page)
    tab(page, 'Producción')
    page.get_by_role('button', name='Nuevo lote', exact=True).click()
    page.get_by_label('Nombre o código del lote').fill('LOTE DE PRUEBA')
    page.get_by_label('Cantidad de bolsas de 3 kg').fill('200')
    save(page)
    tab(page, 'Repartos')
    page.get_by_role('button', name='Cargar vehículo', exact=True).click()
    page.get_by_label('Cantidad de bolsas de 3 kg').fill('40')
    save(page)
    page.get_by_role('button', name='Entregar a cliente', exact=True).click()
    page.locator('.modal select').first.select_option(label='Almacén de prueba')
    page.get_by_label('Cantidad de bolsas de 3 kg').fill('40')
    save(page)
    assert state(page)['state']['clients'][0]['debt'] == 0
    tab(page, 'Rendiciones')
    page.get_by_role('button', name='Nueva rendición', exact=True).click()
    page.locator('.modal select').first.select_option(label='Almacén de prueba')
    page.get_by_label('Bolsas que quedan en el comercio').fill('15')
    save(page)
    page.get_by_role('button', name='Registrar cobro', exact=True).click()
    page.locator('.modal select').first.select_option(label='Almacén de prueba')
    page.get_by_label('Importe cobrado ($)').fill('20000')
    save(page)
    snapshot = state(page)
    assert snapshot['revision'] == 6
    assert snapshot['state']['factory'] == 160
    assert snapshot['state']['clients'][0]['stock'] == 15
    assert snapshot['state']['clients'][0]['debt'] == 5000
    assert snapshot['state']['cash'] == 20000
    # An invalid payment must leave both the state and revision untouched.
    page.get_by_role('button', name='Registrar cobro', exact=True).click()
    page.locator('.modal select').first.select_option(label='Almacén de prueba')
    page.get_by_label('Importe cobrado ($)').fill('6000')
    page.get_by_role('button', name='Confirmar y guardar', exact=True).click()
    expect(page.get_by_role('dialog').get_by_role('alert')).to_contain_text('supera la deuda')
    assert state(page) == snapshot
    page.get_by_role('button', name='Cancelar', exact=True).click()
    assert not errors, errors
    assert outgoing == [app_url], outgoing
    context.close()

    # Reopening the browser profile must preserve saved data.
    context = p.chromium.launch_persistent_context(profile, **launch)
    page = context.pages[0]
    page.goto(app_url, wait_until='networkidle')
    assert state(page) == snapshot
    page.screenshot(path=str(OUT / 'app.png'), full_page=True)
    with page.expect_download() as download:
        page.get_by_role('button', name='Descargar respaldo', exact=True).click()
    backup_path = OUT / 'respaldo-prueba.json'
    download.value.save_as(str(backup_path))
    backup = json.loads(backup_path.read_text())
    assert backup['state'] == snapshot['state']
    # Existing data can never be overwritten through the import UI.
    page.get_by_label('Seleccionar respaldo JSON').set_input_files(str(backup_path))
    page.get_by_role('button', name='Confirmar importación').click()
    expect(page.locator('.local-message')).to_contain_text('ya tiene datos')
    assert state(page) == snapshot
    context.close()

    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 390, 'height': 844})
    page = context.new_page()
    page.goto(app_url, wait_until='networkidle')
    page.get_by_label('Seleccionar respaldo JSON').set_input_files(str(backup_path))
    page.get_by_role('button', name='Confirmar importación').click()
    expect(page.get_by_text('Cargando el negocio…')).not_to_be_visible()
    expect(page.locator('.local-import')).not_to_be_visible()
    assert state(page)['state'] == snapshot['state']
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    context.close()

    # Test transactional guarantees using the same browser storage implementation.
    context = browser.new_context()
    page = context.new_page()
    page.goto(base + '/outputs/portable-tests/')
    page.add_script_tag(url=base + '/outputs/portable-tests/storage.js')
    result = page.evaluate('''async () => {
      const s=FelifrioStorage;
      const make=(revision,action,operationId=crypto.randomUUID())=>({revision,action,operationId});
      const first=make(0,{type:'production',quantity:1,batch:'ÚLTIMA BOLSA'});
      const repeated=await Promise.all([s.mutateLocal(first),s.mutateLocal(first)]);
      if(repeated.filter(x=>x.replayed).length!==1) throw Error('replay failed');
      const conflict=await Promise.allSettled([
        s.mutateLocal(make(1,{type:'load',quantity:1})),
        s.mutateLocal(make(1,{type:'loss',quantity:1,reason:'TEST'}))
      ]);
      if(conflict.filter(x=>x.status==='fulfilled').length!==1) throw Error('double consumption');
      const current=await s.readLocal();
      if(current.revision!==2 || current.state.factory!==0 || current.state.entries.length!==2) throw Error('bad stock');
      try{await s.mutateLocal({...first,action:{type:'production',quantity:5,batch:'CAMBIADO'}});throw Error('collision accepted');}
      catch(error){if(error.status!==409)throw error;}
      const invalid=structuredClone(current);
      invalid.state.cash=1.001;
      try{s.parseBackup(invalid);throw Error('invalid backup accepted');}
      catch(error){if(error.message==='invalid backup accepted')throw error;}
      return {replay:true,concurrentStock:true,collision:true,invalidBackup:true};
    }''')
    print(json.dumps({'uiCircuit': True, 'invalidPayment': True, 'browserRestart': True,
                      'backupRoundTrip': True, 'preventOverwrite': True, 'offlineResources': True,
                      'mobileOverflow': False, 'storage': result}, indent=2))
    browser.close()
server.shutdown()
