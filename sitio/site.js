const steps = [
  {kicker:'SALIDA A REPARTO', title:'Todo listo para salir.', description:'Producís 200 bolsas y cargás 40 en el vehículo. En fábrica quedan 160.', a:['En fábrica','160','bolsas disponibles'], b:['En el vehículo','40','bolsas para repartir'], insight:'Sabés qué quedó en fábrica y qué salió a reparto.'},
  {kicker:'ENTREGA EN CONSIGNACIÓN', title:'40 bolsas en el almacén.', description:'Dejás 40 bolsas en Almacén Las Sierras. La entrega mueve stock: todavía no es una venta.', a:['En el comercio','40','bolsas en consignación'], b:['Deuda por la entrega','$0','la venta se registra al rendir'], insight:'Las bolsas cambian de lugar. Todavía no hay un cobro.'},
  {kicker:'RECUENTO Y RENDICIÓN', title:'Quedaron 15. Vendiste 25.', description:'Volvés al almacén y contás 15 bolsas. Sin pérdidas, se vendieron 25 a $1.000 cada una.', a:['Bolsas vendidas','25','40 entregadas − 15 restantes'], b:['Venta rendida','$25.000','pendientes de cobrar'], insight:'El recuento genera la venta y el saldo a cobrar al cliente.'},
  {kicker:'COBRO PARCIAL', title:'Cobrás. El saldo se actualiza.', description:'El almacén te paga $20.000. Registrás el cobro y quedan $5.000 pendientes.', a:['Cobro registrado','$20.000','ingresan a los fondos'], b:['Saldo del cliente','$5.000','pendientes de cobrar'], insight:'Te quedan 160 bolsas en fábrica y 15 en el comercio.'},
];
let activeStep = 0;
const tabs = [...document.querySelectorAll('[data-step]')];
function setStep(index) {
  activeStep = index;
  const step = steps[index];
  for (const key of ['kicker','title','description','insight']) document.getElementById(`demo-${key}`).textContent = step[key];
  for (const key of ['a','b']) {
    document.getElementById(`metric-${key}-label`).textContent = step[key][0];
    document.getElementById(`metric-${key}`).textContent = step[key][1];
    document.getElementById(`metric-${key}-unit`).textContent = step[key][2];
  }
  tabs.forEach((tab, i) => {tab.setAttribute('aria-selected', String(index === i)); tab.tabIndex = index === i ? 0 : -1;});
  document.getElementById('demo-panel').setAttribute('aria-labelledby', `tab-${index}`);
  const next = document.getElementById('next-step');
  next.innerHTML = index === 3 ? 'Volver a empezar <span>↺</span>' : 'Siguiente <span>→</span>';
  next.setAttribute('aria-label', index === 3 ? 'Volver al primer paso' : 'Ver siguiente paso');
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => setStep(index));
  tab.addEventListener('keydown', event => {
    let next;
    if (['ArrowDown','ArrowRight'].includes(event.key)) next = (index + 1) % tabs.length;
    if (['ArrowUp','ArrowLeft'].includes(event.key)) next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {event.preventDefault();setStep(next);tabs[next].focus();}
  });
});
document.getElementById('next-step').addEventListener('click', () => setStep((activeStep + 1) % steps.length));
const dialog = document.getElementById('video-dialog');
const video = document.getElementById('promo-video');
document.querySelectorAll('[data-video]').forEach(button => button.addEventListener('click', () => {
  dialog.showModal();document.body.classList.add('modal-open');
  video.play().catch(() => { /* Native controls remain available if autoplay is blocked. */ });
}));
document.getElementById('close-video').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {if (event.target === dialog) {const bounds = dialog.getBoundingClientRect();if(event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();}});
dialog.addEventListener('close', () => {video.pause();document.body.classList.remove('modal-open');});
document.getElementById('share-site').addEventListener('click', async () => {
  const feedback = document.getElementById('share-feedback');
  const url = new URL(location.href);url.hash = '';
  if (url.protocol === 'file:' || ['localhost','127.0.0.1'].includes(url.hostname)) {
    feedback.textContent = 'La opción de compartir estará disponible en el sitio publicado.';return;
  }
  try {
    if (navigator.share) {await navigator.share({title:'Felifrío — Tu fábrica de hielo, bajo control',url:url.href});feedback.textContent = '';}
    else if(navigator.clipboard?.writeText) {await navigator.clipboard.writeText(url.href);feedback.textContent = 'Enlace copiado. Ya podés compartirlo.';}
    else {feedback.textContent = 'Copiá el enlace desde la barra de direcciones.';}
  } catch(error) {if(error.name !== 'AbortError') feedback.textContent = 'Podés copiar el enlace desde la barra de direcciones.';}
});
