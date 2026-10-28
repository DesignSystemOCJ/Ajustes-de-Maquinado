// Inicialización de Supabase con tus credenciales
const SUPABASE_URL = 'https://oycvzlnwwhpdlmmofrhd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_1NwNxqZ7zkQXIFRUkn6G3A_RGIdZbHP';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Variable para almacenar el estado de sesión actual
window.sesionActual = null;
window.idOperacionEditando = null;
window.listaOperacionesCacheModal = [];
window.idMapeoEditando = null;

// Funciones para alerta elegante
function mostrarAlertaElegante(titulo, mensaje) {
  const alertModal = document.getElementById('customAlertModal');
  const alertTitle = document.getElementById('alertTitle');
  const alertMessage = document.getElementById('alertMessage');

  if (alertModal && alertTitle && alertMessage) {
    alertTitle.textContent = titulo || 'Atención';
    alertMessage.textContent = mensaje || '';
    alertModal.classList.remove('hidden');
  } else {
    alert(`${titulo}: ${mensaje}`);
  }
}

function cerrarAlertaElegante() {
  const alertModal = document.getElementById('customAlertModal');
  if (alertModal) alertModal.classList.add('hidden');
}

function toggleBuscadorTablaOperaciones() {
  const contenedor = document.getElementById('contenedorInputBusquedaTabla');
  const input = document.getElementById('inputBusquedaTablaOperaciones');
  if (!contenedor) return;

  contenedor.classList.toggle('hidden');
  if (!contenedor.classList.contains('hidden') && input) {
    input.focus();
  }
}

function filtrarTablaOperacionesTexto() {
  const input = document.getElementById('inputBusquedaTablaOperaciones');
  if (!input || !window.listaOperacionesCacheModal) return;

  const textoBusqueda = input.value.toLowerCase().trim();
  if (!textoBusqueda) {
    renderizarTablaOperacionesModal(window.listaOperacionesCacheModal);
    return;
  }

  const filtrados = window.listaOperacionesCacheModal.filter(item => {
    const idStr = String(item.id_op || '').toLowerCase();
    const tipoStr = String(item.operacion_tipo || '').toLowerCase();
    const caracStr = String(item.caracteristica || '').toLowerCase();
    return idStr.includes(textoBusqueda) || tipoStr.includes(textoBusqueda) || caracStr.includes(textoBusqueda);
  });

  renderizarTablaOperacionesModal(filtrados);
}

function limpiarYFecharBuscadorTabla() {
  const input = document.getElementById('inputBusquedaTablaOperaciones');
  const contenedor = document.getElementById('contenedorInputBusquedaTabla');
  if (input) input.value = '';
  if (contenedor) contenedor.classList.add('hidden');
  if (window.listaOperacionesCacheModal) {
    renderizarTablaOperacionesModal(window.listaOperacionesCacheModal);
  }
}

function inicializarTecladoNumerico() {
  const gridContainer = document.getElementById('gridTecladoContainer');
  if (!gridContainer) return;

  const botones = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
  let htmlBotones = '';
  botones.forEach(btn => {
    if (btn === '⌫') {
      htmlBotones += `<button type="button" onclick="borrarUltimo()" class="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 py-2.5 rounded-xl active:scale-95 transition font-bold text-sm shadow-sm">⌫</button>`;
    } else {
      htmlBotones += `<button type="button" onclick="agregarNumero('${btn}')" class="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 py-2.5 rounded-xl active:scale-95 transition font-semibold text-sm shadow-sm">${btn}</button>`;
    }
  });
  gridContainer.innerHTML = htmlBotones;
}

async function verificarSesionInicial() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && session.user) {
      actualizarInterfazUsuario(session.user.email);
    } else {
      await loginComoInvitadoAutomatico();
    }
  } catch (err) {
    console.error('Error al verificar sesión:', err);
  }
}

async function loginComoInvitadoAutomatico() {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: 'guest@appam.com',
      password: 'guestpassword123'
    });
    
    if (error) {
      actualizarInterfazUsuario('guest@appam.com');
    } else if (data.session) {
      actualizarInterfazUsuario(data.session.user.email);
    }
  } catch (e) {
    actualizarInterfazUsuario('guest@appam.com');
  }
}

function actualizarInterfazUsuario(email) {
  window.sesionActual = email;
  const userInfoContainer = document.getElementById('userInfoContainer');
  const userEmailSpan = document.getElementById('userEmailSpan');
  const authBtn = document.getElementById('authBtn');
  const btnMapear = document.getElementById('btnMapearContainer');
  const btnFormularioCards = document.getElementById('btnFormularioCards');

  if (userInfoContainer && userEmailSpan) {
    userInfoContainer.classList.remove('hidden');
    userEmailSpan.textContent = email;
  }

  if (email && email.toLowerCase() !== 'guest@appam.com') {
    if (btnFormularioCards) {
      btnFormularioCards.classList.remove('hidden');
      btnFormularioCards.style.display = 'inline-flex';
    }
  } else {
    if (btnFormularioCards) {
      btnFormularioCards.classList.add('hidden');
      btnFormularioCards.style.display = 'none';
    }
  }

  if (email && email.toLowerCase() === 'admin@appam.com') {
    authBtn.innerHTML = '🚪';
    authBtn.title = 'Cerrar Sesión';
    authBtn.className = "bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-2xl text-sm transition-all shadow-sm";
    if (btnMapear) {
      btnMapear.classList.remove('hidden');
      btnMapear.style.display = 'inline-flex';
    }
  } else {
    authBtn.innerHTML = '🔑';
    authBtn.title = 'Iniciar Sesión Admin';
    authBtn.className = "bg-slate-900 hover:bg-blue-600 text-white font-bold px-4 py-2.5 rounded-2xl text-sm transition-all shadow-sm";
    if (btnMapear) {
      btnMapear.classList.add('hidden');
      btnMapear.style.display = 'none';
    }
  }
}

function toggleModalCards() {
  const modal = document.getElementById('modalCardsFormulario');
  if (modal) modal.classList.toggle('hidden');
}

function seleccionarCardModal(tipoCard) {
  toggleModalCards();
  if (tipoCard === 'Caracteristicas') {
    const elInput = document.getElementById('elementNameSelectCardOP1') || document.getElementById('elementNameSelectCardOP2') || document.getElementById('elementNameSelectCardOP3') || document.getElementById('elementNameSelect');
    if (elInput) elInput.focus();
  } else if (tipoCard === 'Dimensiones') {
    const btnDim = document.getElementById('btnDimensional');
    if (btnDim) btnDim.click();
  } else if (tipoCard === 'Operaciones') {
    const modalOp = document.getElementById('modalOperacionesFormulario');
    if (modalOp) {
      modalOp.classList.remove('hidden');
      window.idOperacionEditando = null; 
      const btnNuevo = document.getElementById('btnNuevoOperacion');
      if (btnNuevo) btnNuevo.classList.add('hidden');

      actualizarTextoBotonGuardarOp();
      cargarListadoOperacionesModal();
      cargarCaracteristicasOperacionesModal();
      reiniciarCamposFormularioOperaciones();
    }
  }
}

function cerrarModalOperaciones() {
  const modalOp = document.getElementById('modalOperacionesFormulario');
  if (modalOp) modalOp.classList.add('hidden');
}

function actualizarTextoBotonGuardarOp() {
  const btnGuardar = document.getElementById('btnGuardarOperacion');
  if (!btnGuardar) return;
  if (window.idOperacionEditando) {
    btnGuardar.textContent = `💾 Actualizar Operación (ID: ${window.idOperacionEditando})`;
    btnGuardar.className = "w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg text-xs transition";
  } else {
    btnGuardar.textContent = `💾 Guardar en Operaciones`;
    btnGuardar.className = "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-xs transition";
  }
}

function agregarCampoAjuste(valor = '') {
  const contenedor = document.getElementById('contenedorAjustesDinamicos');
  const totalCampos = contenedor.querySelectorAll('input.input-ajuste-item').length;
  if (totalCampos >= 5) {
    alert('Puedes agregar un máximo de 5 puntos de ajuste.');
    return;
  }
  const divFila = document.createElement('div');
  divFila.className = 'flex items-center gap-2';
  divFila.innerHTML = `
    <input type="text" value="${valor}" class="input-ajuste-item w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" placeholder="Punto ${totalCampos + 1} de ajuste..." />
    <button type="button" onclick="agregarCampoAjuste()" class="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 transition">+</button>
    <button type="button" onclick="eliminarCampoAjuste(this)" class="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 transition">✕</button>
  `;
  contenedor.appendChild(divFila);
}

function eliminarCampoAjuste(btn) {
  const contenedor = document.getElementById('contenedorAjustesDinamicos');
  const fila = btn.closest('div');
  if (contenedor.querySelectorAll('input.input-ajuste-item').length <= 1) {
    fila.querySelector('input').value = '';
    return;
  }
  fila.remove();
}

function agregarCampoNota(valor = '') {
  const contenedor = document.getElementById('contenedorNotasDinamicas');
  const totalCampos = contenedor.querySelectorAll('input.input-nota-item').length;
  if (totalCampos >= 5) {
    alert('Puedes agregar un máximo de 5 puntos en notas.');
    return;
  }
  const divFila = document.createElement('div');
  divFila.className = 'flex items-center gap-2';
  divFila.innerHTML = `
    <input type="text" value="${valor}" class="input-nota-item w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" placeholder="Punta / Nota ${totalCampos + 1}..." />
    <button type="button" onclick="agregarCampoNota()" class="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 transition">+</button>
    <button type="button" onclick="eliminarCampoNota(this)" class="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 transition">✕</button>
  `;
  contenedor.appendChild(divFila);
}

function eliminarCampoNota(btn) {
  const contenedor = document.getElementById('contenedorNotasDinamicas');
  const fila = btn.closest('div');
  if (contenedor.querySelectorAll('input.input-nota-item').length <= 1) {
    fila.querySelector('input').value = '';
    return;
  }
  fila.remove();
}

function agregarCampoAfectacion(valor = '') {
  const contenedor = document.getElementById('contenedorAfectacionesDinamicas');
  const totalCampos = contenedor.querySelectorAll('input.input-afectacion-item').length;
  if (totalCampos >= 5) {
    alert('Puedes agregar un máximo de 5 puntos de posibles afectaciones.');
    return;
  }
  const divFila = document.createElement('div');
  divFila.className = 'flex items-center gap-2';
  divFila.innerHTML = `
    <input type="text" value="${valor}" class="input-afectacion-item w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" placeholder="Posible afectación ${totalCampos + 1}..." />
    <button type="button" onclick="agregarCampoAfectacion()" class="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 transition">+</button>
    <button type="button" onclick="eliminarCampoAfectacion(this)" class="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 transition">✕</button>
  `;
  contenedor.appendChild(divFila);
}

function eliminarCampoAfectacion(btn) {
  const contenedor = document.getElementById('contenedorAfectacionesDinamicas');
  const fila = btn.closest('div');
  if (contenedor.querySelectorAll('input.input-afectacion-item').length <= 1) {
    fila.querySelector('input').value = '';
    return;
  }
  fila.remove();
}

function reiniciarCamposFormularioOperaciones() {
  window.idOperacionEditando = null;
  actualizarTextoBotonGuardarOp();

  const btnNuevo = document.getElementById('btnNuevoOperacion');
  if (btnNuevo) btnNuevo.classList.add('hidden');

  document.getElementById('opFormTipo').value = '';
  const inputCarac = document.getElementById('opFormCaracteristica');
  if (inputCarac) inputCarac.value = '';
  
  ocultarAvisoCaracteristicaDuplicada();
  document.getElementById('opFormEjemplo').value = '';

  ['checkGbre', 'checkGlhole', 'checkGvhole', 'checkGtpos', 'checkGcret', 'checkGcdep', 'checkGhtkn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });

  if (document.getElementById('filtroOp1')) document.getElementById('filtroOp1').checked = false;
  if (document.getElementById('filtroOp2')) document.getElementById('filtroOp2').checked = false;
  if (document.getElementById('filtroOp3')) document.getElementById('filtroOp3').checked = false;

  const contenedorAjustes = document.getElementById('contenedorAjustesDinamicos');
  if (contenedorAjustes) {
    contenedorAjustes.innerHTML = `
      <div class="flex items-center gap-2">
        <input type="text" class="input-ajuste-item w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" placeholder="Punto 1 de ajuste..." />
        <button type="button" onclick="agregarCampoAjuste()" class="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 transition">+</button>
        <button type="button" onclick="eliminarCampoAjuste(this)" class="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 transition">✕</button>
      </div>
    `;
  }

  const contenedorNotas = document.getElementById('contenedorNotasDinamicas');
  if (contenedorNotas) {
    contenedorNotas.innerHTML = `
      <div class="flex items-center gap-2">
        <input type="text" class="input-nota-item w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" placeholder="Punta / Nota 1..." />
        <button type="button" onclick="agregarCampoNota()" class="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 transition">+</button>
        <button type="button" onclick="eliminarCampoNota(this)" class="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 transition">✕</button>
      </div>
    `;
  }

  const contenedorAfectaciones = document.getElementById('contenedorAfectacionesDinamicas');
  if (contenedorAfectaciones) {
    contenedorAfectaciones.innerHTML = `
      <div class="flex items-center gap-2">
        <input type="text" class="input-afectacion-item w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" placeholder="Posible afectación 1..." />
        <button type="button" onclick="agregarCampoAfectacion()" class="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 transition">+</button>
        <button type="button" onclick="eliminarCampoAfectacion(this)" class="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 transition">✕</button>
      </div>
    `;
  }

  if (window.listaOperacionesCacheModal && window.listaOperacionesCacheModal.length > 0) {
    renderizarTablaOperacionesModal(window.listaOperacionesCacheModal);
  }
}

async function cargarListadoOperacionesModal() {
  const tbody = document.getElementById('tablaListadoOperacionesBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center italic text-slate-400">Cargando listado de operaciones...</td></tr>`;

  try {
    const { data, error } = await supabaseClient
      .from('operaciones')
      .select('*')
      .order('id_op', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      window.listaOperacionesCacheModal = data;
      renderizarTablaOperacionesModal(data);
    } else {
      window.listaOperacionesCacheModal = [];
      tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center italic text-slate-400">No se encontraron operaciones registradas.</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center italic text-red-500">Error: ${err.message}</td></tr>`;
  }
}

function renderizarTablaOperacionesModal(dataArray) {
  const tbody = document.getElementById('tablaListadoOperacionesBody');
  if (!tbody) return;

  if (!dataArray || dataArray.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center italic text-slate-400">No hay registros que coincidan.</td></tr>`;
    return;
  }

  let filasHtml = '';
  dataArray.forEach(item => {
    const itemJson = encodeURIComponent(JSON.stringify(item));
    filasHtml += `
      <tr onclick="cargarOperacionEnFormulario('${itemJson}')" class="hover:bg-blue-50/70 transition cursor-pointer">
        <td class="p-2.5 font-medium text-slate-600">${item.id_op ?? ''}</td>
        <td class="p-2.5 font-semibold text-slate-800">${item.operacion_tipo ?? ''}</td>
        <td class="p-2.5 text-slate-700">${item.caracteristica ?? ''}</td>
      </tr>
    `;
  });
  tbody.innerHTML = filasHtml;
}

function filtrarOperacionesCheckbox(opSeleccionada) {
  const chk1 = document.getElementById('filtroOp1');
  const chk2 = document.getElementById('filtroOp2');
  const chk3 = document.getElementById('filtroOp3');
  let activo = '';

  if (opSeleccionada === 'OP1' && chk1.checked) {
    if (chk2) chk2.checked = false;
    if (chk3) chk3.checked = false;
    activo = 'OP1';
  } else if (opSeleccionada === 'OP2' && chk2.checked) {
    if (chk1) chk1.checked = false;
    if (chk3) chk3.checked = false;
    activo = 'OP2';
  } else if (opSeleccionada === 'OP3' && chk3.checked) {
    if (chk1) chk1.checked = false;
    if (chk2) chk2.checked = false;
    activo = 'OP3';
  }

  if (!window.listaOperacionesCacheModal) return;

  if (!activo) {
    renderizarTablaOperacionesModal(window.listaOperacionesCacheModal);
  } else {
    const filtrados = window.listaOperacionesCacheModal.filter(item => {
      const tipo = (item.operacion_tipo || '').toUpperCase();
      if (activo === 'OP1') return tipo.includes('OP1') || tipo.includes('1') || tipo.includes('PRIMERA');
      if (activo === 'OP2') return tipo.includes('OP2') || tipo.includes('2') || tipo.includes('SEGUNDA');
      if (activo === 'OP3') return tipo.includes('OP3') || tipo.includes('3') || tipo.includes('DRILL');
      return false;
    });
    renderizarTablaOperacionesModal(filtrados);
  }
}

function cerrarModalDetallesDimension() {
  const modalDetalles = document.getElementById('modalDetallesDimension');
  if (modalDetalles) modalDetalles.classList.add('hidden');
}

async function actualizarDimensionDesdeDetalles() {
  const id_op = document.getElementById('detIdOp').value.trim();
  if (!id_op) return;

  const datosActualizados = {
    modelo: document.getElementById('detModelo').value.trim(),
    operacion_tipo: document.getElementById('detOpTipo').value.trim(),
    Ejemplo: document.getElementById('detEjemplo').value.trim(),
    caracteristica: document.getElementById('detCaracteristica').value.trim(),
    ajustes_recomen: document.getElementById('detAjustes').value.trim(),
    Notas: document.getElementById('detNotas').value.trim(),
    posibles_afect: document.getElementById('detAfectaciones').value.trim(),
    g_pbre: document.getElementById('detGbre').checked,
    g_lhole: document.getElementById('detGlhole').checked,
    g_vhole: document.getElementById('detGvhole').checked,
    g_tpos: document.getElementById('detGtpos').checked,
    g_cret: document.getElementById('detGcret').checked,
    g_cdep: document.getElementById('detGcdep').checked,
    g_htkn: document.getElementById('detGhtkn').checked
  };

  try {
    const { error } = await supabaseClient.from('operaciones').update(datosActualizados).eq('id_op', id_op);
    if (error) throw error;
    alert('¡Datos actualizados correctamente!');
    cerrarModalDetallesDimension();
    cargarListadoOperacionesModal();
  } catch (err) {
    alert('Error al actualizar: ' + err.message);
  }
}

function cargarOperacionEnFormulario(itemJsonStr) {
  try {
    const item = JSON.parse(decodeURIComponent(itemJsonStr));
    window.idOperacionEditando = item.id_op; 
    actualizarTextoBotonGuardarOp();

    const btnNuevo = document.getElementById('btnNuevoOperacion');
    if (btnNuevo) btnNuevo.classList.remove('hidden');

    document.getElementById('opFormTipo').value = item.operacion_tipo || '';
    document.getElementById('opFormCaracteristica').value = item.caracteristica || '';
    document.getElementById('opFormEjemplo').value = item.Ejemplo || '';

    document.getElementById('checkGbre').checked = !!item.g_pbre;
    document.getElementById('checkGlhole').checked = !!item.g_lhole;
    document.getElementById('checkGvhole').checked = !!item.g_vhole;
    document.getElementById('checkGtpos').checked = !!item.g_tpos;
    document.getElementById('checkGcret').checked = !!item.g_cret;
    document.getElementById('checkGcdep').checked = !!item.g_cdep;
    document.getElementById('checkGhtkn').checked = !!item.g_htkn;

    const contenedorAjustes = document.getElementById('contenedorAjustesDinamicos');
    contenedorAjustes.innerHTML = '';
    const ajusteVal = item.ajustes_recomen || item.ajuste_recomen;
    if (ajusteVal) {
      ajusteVal.split('\n').forEach(linea => {
        const limpia = linea.replace(/^[•\-*\d.]+\s*/, '').trim();
        if (limpia) agregarCampoAjuste(limpia);
      });
    }
    if (contenedorAjustes.querySelectorAll('input').length === 0) agregarCampoAjuste('');

    const contenedorNotas = document.getElementById('contenedorNotasDinamicas');
    contenedorNotas.innerHTML = '';
    const notasVal = item.Notas || item.notas;
    if (notasVal) {
      notasVal.split('\n').forEach(linea => {
        const limpia = linea.replace(/^[•\-*\d.]+\s*/, '').trim();
        if (limpia) agregarCampoNota(limpia);
      });
    }
    if (contenedorNotas.querySelectorAll('input').length === 0) agregarCampoNota('');

    const contenedorAfectaciones = document.getElementById('contenedorAfectacionesDinamicas');
    contenedorAfectaciones.innerHTML = '';
    if (item.posibles_afect) {
      item.posibles_afect.split('\n').forEach(linea => {
        const limpia = linea.replace(/^[•\-*\d.]+\s*/, '').trim();
        if (limpia) agregarCampoAfectacion(limpia);
      });
    }
    if (contenedorAfectaciones.querySelectorAll('input').length === 0) agregarCampoAfectacion('');

    document.querySelector('#modalOperacionesFormulario > div').scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    console.error(e);
  }
}

window.listaOpFormCaracteristicasCache = [];

async function cargarCaracteristicasOperacionesModal() {
  const datalistElement = document.getElementById('listaOpFormCaracteristica');
  if (!datalistElement) return;

  try {
    const { data, error } = await supabaseClient.from('operaciones').select('caracteristica');
    if (error) throw error;
    if (data && data.length > 0) {
      const caracteristicasUnicas = [...new Set(data.map(item => item.caracteristica))].filter(Boolean);
      window.listaOpFormCaracteristicasCache = caracteristicasUnicas;
      datalistElement.innerHTML = '';
      caracteristicasUnicas.forEach(carac => {
        const option = document.createElement('option');
        option.value = carac;
        datalistElement.appendChild(option);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

function verificarCaracteristicaDuplicada(valorInput) {
  const inputCarac = document.getElementById('opFormCaracteristica');
  if (!inputCarac) return false;
  const valorLimpio = valorInput.trim().toLowerCase();
  if (!valorLimpio) {
    ocultarAvisoCaracteristicaDuplicada();
    return false;
  }
  const existe = window.listaOpFormCaracteristicasCache && 
    window.listaOpFormCaracteristicasCache.some(c => c && c.trim().toLowerCase() === valorLimpio);

  if (existe) {
    mostrarAvisoCaracteristicaDuplicada();
    return true;
  } else {
    ocultarAvisoCaracteristicaDuplicada();
    return false;
  }
}

function mostrarAvisoCaracteristicaDuplicada() {
  const inputCarac = document.getElementById('opFormCaracteristica');
  if (!inputCarac) return;
  let aviso = document.getElementById('avisoCaracteristicaDuplicada');
  if (!aviso) {
    aviso = document.createElement('label');
    aviso.id = 'avisoCaracteristicaDuplicada';
    aviso.className = 'text-[11px] font-semibold text-amber-600 mt-1 block flex items-center gap-1';
    aviso.innerHTML = '⚠️ Dimension ya se encuentra registrada';
    inputCarac.parentNode.appendChild(aviso);
  }
  aviso.classList.remove('hidden');
}

function ocultarAvisoCaracteristicaDuplicada() {
  const aviso = document.getElementById('avisoCaracteristicaDuplicada');
  if (aviso) aviso.classList.add('hidden');
}

async function guardarOperacionSupabase() {
  const caracteristicaVal = document.getElementById('opFormCaracteristica').value.trim();
  const operacion_tipo = document.getElementById('opFormTipo').value.trim();
  
  if (!window.idOperacionEditando) verificarCaracteristicaDuplicada(caracteristicaVal);

  const inputsAjustes = document.querySelectorAll('#contenedorAjustesDinamicos input.input-ajuste-item');
  let listaAjustesTextos = [];
  inputsAjustes.forEach(input => {
    const val = input.value.trim();
    if (val !== '') listaAjustesTextos.push(`• ${val}`);
  });
  const ajuste_recomen = listaAjustesTextos.join('\n');

  const inputsNotas = document.querySelectorAll('#contenedorNotasDinamicas input.input-nota-item');
  let listaNotasTextos = [];
  inputsNotas.forEach(input => {
    const val = input.value.trim();
    if (val !== '') listaNotasTextos.push(`• ${val}`);
  });
  const Notas = listaNotasTextos.join('\n');

  const inputsAfectaciones = document.querySelectorAll('#contenedorAfectacionesDinamicas input.input-afectacion-item');
  let listaAfectacionesTextos = [];
  inputsAfectaciones.forEach(input => {
    const val = input.value.trim();
    if (val !== '') listaAfectacionesTextos.push(`• ${val}`);
  });
  const posibles_afect = listaAfectacionesTextos.join('\n');

  const datosOperacion = {
    modelo: "sin dato",
    operacion_tipo,
    caracteristica: caracteristicaVal,
    ajustes_recomen,
    Notas,
    Ejemplo: document.getElementById('opFormEjemplo').value.trim(),
    posibles_afect,
    g_pbre: document.getElementById('checkGbre').checked,
    g_lhole: document.getElementById('checkGlhole').checked,
    g_vhole: document.getElementById('checkGvhole').checked,
    g_tpos: document.getElementById('checkGtpos').checked,
    g_cret: document.getElementById('checkGcret').checked,
    g_cdep: document.getElementById('checkGcdep').checked,
    g_htkn: document.getElementById('checkGhtkn').checked
  };

  try {
    if (window.idOperacionEditando) {
      const { error } = await supabaseClient.from('operaciones').update(datosOperacion).eq('id_op', window.idOperacionEditando);
      if (error) throw error;
      alert('¡Operación actualizada exitosamente!');
    } else {
      const { error } = await supabaseClient.from('operaciones').insert([datosOperacion]);
      if (error) throw error;
      alert('¡Operación agregada exitosamente!');
    }

    reiniciarCamposFormularioOperaciones();
    cargarDatosMapaSupabase();
    cargarListadoOperacionesModal();
    cargarCaracteristicasOperacionesModal();
  } catch (err) {
    alert('Error en Supabase: ' + err.message);
  }
}

function manejarBotonAuth() {
  if (window.sesionActual && window.sesionActual.toLowerCase() === 'admin@appam.com') {
    supabaseClient.auth.signOut().then(() => loginComoInvitadoAutomatico());
  } else {
    document.getElementById('authModal').classList.remove('hidden');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('passwordContainer').classList.add('hidden');
  }
}

function cerrarModalAuth() {
  document.getElementById('authModal').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  inicializarTecladoNumerico();
  verificarSesionInicial();
  cargarModelosSupabase();
  cargarDatosMapaSupabase(); 

  document.addEventListener('click', (e) => {
    const teclado = document.getElementById('miniTeclado');
    const medicionInput = document.getElementById('medicionInput');
    if (teclado && !teclado.classList.contains('hidden')) {
      if (!teclado.contains(e.target) && e.target !== medicionInput) {
        cerrarTeclado();
      }
    }
  });

  const opFormTipoInput = document.getElementById('opFormTipo');
  if (opFormTipoInput) {
    opFormTipoInput.addEventListener('focus', () => { if (!opFormTipoInput.value) opFormTipoInput.value = ''; });
  }

  const opFormCaracteristicaInput = document.getElementById('opFormCaracteristica');
  const datalistOpFormCaracteristica = document.getElementById('listaOpFormCaracteristica');
  if (opFormCaracteristicaInput) {
    opFormCaracteristicaInput.addEventListener('focus', () => {
      if (window.listaOpFormCaracteristicasCache && datalistOpFormCaracteristica) {
        datalistOpFormCaracteristica.innerHTML = '';
        window.listaOpFormCaracteristicasCache.forEach(carac => {
          const option = document.createElement('option');
          option.value = carac;
          datalistOpFormCaracteristica.appendChild(option);
        });
      }
    });
    opFormCaracteristicaInput.addEventListener('input', (e) => verificarCaracteristicaDuplicada(e.target.value));
  }

  const loginEmailInput = document.getElementById('loginEmail');
  if (loginEmailInput) {
    loginEmailInput.addEventListener('input', (e) => {
      const val = e.target.value.trim().toLowerCase();
      const pwdContainer = document.getElementById('passwordContainer');
      if (val === 'admin@appam.com') pwdContainer.classList.remove('hidden');
      else pwdContainer.classList.add('hidden');
    });
  }

  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const loginPasswordInput = document.getElementById('loginPassword');
  if (togglePasswordBtn && loginPasswordInput) {
    togglePasswordBtn.addEventListener('mousedown', () => loginPasswordInput.type = 'text');
    togglePasswordBtn.addEventListener('mouseup', () => loginPasswordInput.type = 'password');
    togglePasswordBtn.addEventListener('mouseleave', () => loginPasswordInput.type = 'password');
  }

  const datosMapaInput = document.getElementById('listaDatosMapaInput');
  const datalistDatosMapa = document.getElementById('listaDatosMapa');
  if (datosMapaInput && datalistDatosMapa) {
    datosMapaInput.addEventListener('focus', () => {
      datosMapaInput.value = '';
      if (window.listaDatosMapaCache) {
        datalistDatosMapa.innerHTML = '';
        window.listaDatosMapaCache.forEach(carac => {
          const option = document.createElement('option');
          option.value = carac;
          datalistDatosMapa.appendChild(option);
        });
      }
    });
    datosMapaInput.addEventListener('change', (e) => verificarYCargarPuntosExistentes(e.target.value.trim()));
  }

  const elementInputGlobal = document.getElementById('elementNameSelect');
  const inputsCards = [
    document.getElementById('elementNameSelectCardOP1'),
    document.getElementById('elementNameSelectCardOP2'),
    document.getElementById('elementNameSelectCardOP3'),
    elementInputGlobal
  ].filter(Boolean);

  const datalistElement = document.getElementById('listaElementos');

  inputsCards.forEach(inputEl => {
    inputEl.addEventListener('focus', () => {
      if (window.listaCaracteristicasCache && datalistElement) {
        datalistElement.innerHTML = '';
        window.listaCaracteristicasCache.forEach(carac => {
          const option = document.createElement('option');
          option.value = carac;
          datalistElement.appendChild(option);
        });
      }
      consultarEspecificacionesCaract();
    });
    inputEl.addEventListener('input', () => {
      const val = inputEl.value.trim();
      inputsCards.forEach(otherInput => {
        if (otherInput !== inputEl) otherInput.value = val;
      });

      limpiarMedicionYEstado();
      consultarEspecificacionesCaract();
      manejarSeleccionElemento(val);
    });
    inputEl.addEventListener('change', () => {
      const val = inputEl.value.trim();
      inputsCards.forEach(otherInput => {
        if (otherInput !== inputEl) otherInput.value = val;
      });

      limpiarMedicionYEstado();
      consultarEspecificacionesCaract();
      manejarSeleccionElemento(val);
      inputEl.blur();
    });
  });
});

async function ejecutarLoginSupabase() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  
  if (!email) { 
    mostrarAlertaElegante('Campo requerido', 'Por favor, ingrese un correo electrónico.'); 
    return; 
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password: password || 'guestpassword123'
    });
    
    if (error) throw error;
    
    cerrarModalAuth();
    actualizarInterfazUsuario(data.user.email);
  } catch (err) {
    let mensajeUsuario = err.message;
    
    if (err.message && (err.message.includes('Invalid login credentials') || err.message.includes('invalid_credentials'))) {
      mensajeUsuario = 'Error al iniciar sesión: Invalid login credentials';
    }

    mostrarAlertaElegante('Error al iniciar sesión', mensajeUsuario);
  }
}

async function cargarModelosSupabase() {
  const inputElement = document.getElementById('modeloSelect');
  const dropdownContainer = document.getElementById('dropdownModelosPersonalizado');
  
  try {
    const { data, error } = await supabaseClient.from('modelos').select('modelo, cliente, tamano');
    if (error) throw error;

    if (data) {
      window.modelosDataMap = data;
      const modelosUnicos = [...new Set(data.map(item => item.modelo))].filter(Boolean);
      inputElement.placeholder = "Escriba para buscar modelo...";

      const renderDropdown = (filtro = '') => {
        const filtrados = modelosUnicos.filter(m => m.toLowerCase().includes(filtro.toLowerCase()));
        dropdownContainer.innerHTML = '';

        filtrados.forEach((modelo) => {
          const div = document.createElement('div');
          div.className = "opcion-modelo px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition";
          div.textContent = modelo;
          div.dataset.value = modelo;
          div.addEventListener('click', () => {
            inputElement.value = modelo;
            dropdownContainer.classList.add('hidden');
            actualizarClienteYTamanio();
            limpiarMedicionYEstado();
            consultarEspecificacionesCaract();
          });
          dropdownContainer.appendChild(div);
        });

        if (filtro.trim() !== '' && !modelosUnicos.some(m => m.toLowerCase() === filtro.toLowerCase())) {
          const divNoEncontrado = document.createElement('div');
          divNoEncontrado.className = "p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs";
          divNoEncontrado.innerHTML = `
            <span class="text-slate-500 italic font-medium">Modelo no encontrado</span>
            <button type="button" onclick="abrirModalNuevoModelo('${filtro.trim()}')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1.5 rounded-xl transition">+ Agregar</button>
          `;
          dropdownContainer.appendChild(divNoEncontrado);
        }

        if (dropdownContainer.children.length > 0) dropdownContainer.classList.remove('hidden');
        else dropdownContainer.classList.add('hidden');
      };

      inputElement.addEventListener('input', (e) => {
        renderDropdown(e.target.value);
        actualizarClienteYTamanio();
        limpiarMedicionYEstado();
        consultarEspecificacionesCaract();
      });

      inputElement.addEventListener('focus', (e) => renderDropdown(e.target.value));

      inputElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const valorEscrito = inputElement.value.trim().toLowerCase();
          const coincidenciaExacta = modelosUnicos.find(m => m.toLowerCase() === valorEscrito);
          if (coincidenciaExacta) inputElement.value = coincidenciaExacta;
          else {
            const primeraOpcion = dropdownContainer.querySelector('.opcion-modelo');
            if (primeraOpcion) inputElement.value = primeraOpcion.dataset.value;
          }
          dropdownContainer.classList.add('hidden');
          actualizarClienteYTamanio();
          limpiarMedicionYEstado();
          consultarEspecificacionesCaract();
          inputElement.blur();
        }
      });

      document.addEventListener('click', (e) => {
        if (!inputElement.contains(e.target) && !dropdownContainer.contains(e.target)) {
          dropdownContainer.classList.add('hidden');
        }
      });
    }
  } catch (err) {
    console.error(err);
  }
}

function abrirModalNuevoModelo(nombreModelo) {
  document.getElementById('dropdownModelosPersonalizado').classList.add('hidden');
  document.getElementById('nuevoModeloInput').value = nombreModelo;
  document.getElementById('nuevoClienteInput').value = '';
  document.getElementById('nuevoTamanioInput').value = '';
  document.getElementById('modalNuevoModelo').classList.remove('hidden');
}

function cerrarModalNuevoModelo() {
  document.getElementById('modalNuevoModelo').classList.add('hidden');
}

async function guardarNuevoModeloSupabase() {
  const modelo = document.getElementById('nuevoModeloInput').value.trim();
  const cliente = document.getElementById('nuevoClienteInput').value.trim();
  const tamano = document.getElementById('nuevoTamanioInput').value.trim();

  if (!modelo) { alert('Modelo obligatorio.'); return; }

  try {
    const { error } = await supabaseClient.from('modelos').insert([{ modelo, cliente, tamano }]);
    if (error) throw error;
    alert('¡Modelo agregado!');
    cerrarModalNuevoModelo();
    document.getElementById('modeloSelect').value = modelo;
    await cargarModelosSupabase();
    actualizarClienteYTamanio();
    limpiarMedicionYEstado();
    consultarEspecificacionesCaract();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

window.listaDatosMapaCache = [];

async function cargarDatosMapaSupabase() {
  const datalistElement = document.getElementById('listaDatosMapa');
  if (!datalistElement) return;

  try {
    const { data, error } = await supabaseClient.from('operaciones').select('caracteristica');
    if (error) throw error;
    if (data && data.length > 0) {
      const caracteristicasUnicas = [...new Set(data.map(item => item.caracteristica))].filter(Boolean);
      window.listaDatosMapaCache = caracteristicasUnicas;
      datalistElement.innerHTML = '';
      caracteristicasUnicas.forEach(carac => {
        const option = document.createElement('option');
        option.value = carac;
        datalistElement.appendChild(option);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

function actualizarClienteYTamanio() {
  const inputElement = document.getElementById('modeloSelect');
  const valorSeleccionado = inputElement.value.trim();
  const inputsFila = inputElement.closest('.grid').querySelectorAll('input');
  const inputCliente = inputsFila[1];
  const inputTamanio = inputsFila[2];
  const contenedorSpec = document.getElementById('tarjetasEspecificacionContainer');

  if (!window.modelosDataMap) {
    if (contenedorSpec) contenedorSpec.classList.add('hidden');
    return;
  }
  
  const encontrado = window.modelosDataMap.find(item => item.modelo && item.modelo.toLowerCase() === valorSeleccionado.toLowerCase());
  
  if (encontrado) {
    inputCliente.value = encontrado.cliente || '';
    inputTamanio.value = encontrado.tamano || '';
    if (contenedorSpec) contenedorSpec.classList.remove('hidden');
  } else {
    inputCliente.value = '';
    inputTamanio.value = '';
    if (contenedorSpec) contenedorSpec.classList.add('hidden');
  }
}

function limpiarMedicionYEstado() {
  const medicionInput = document.getElementById('medicionInput');
  if (medicionInput) medicionInput.value = '';
  valorTemporal = "";
  ocultarEstadoEspecificacion();
}

function obtenerElementoNameActivo() {
  const inputs = [
    document.getElementById('elementNameSelectCardOP1'),
    document.getElementById('elementNameSelectCardOP2'),
    document.getElementById('elementNameSelectCardOP3'),
    document.getElementById('elementNameSelect')
  ];
  for (let input of inputs) {
    if (input && input.value.trim()) return input.value.trim();
  }
  return '';
}

async function consultarEspecificacionesCaract() {
  const modeloInput = document.getElementById('modeloSelect');
  const modeloVal = modeloInput ? modeloInput.value.trim() : '';
  const caracteristicaVal = obtenerElementoNameActivo();

  const contenedorSpec = document.getElementById('tarjetasEspecificacionContainer');
  if (!contenedorSpec) return;

  const divsEspecificacion = contenedorSpec.querySelectorAll('.grid > div');
  if (divsEspecificacion.length < 4) return;

  const spanMinima = divsEspecificacion[1].querySelectorAll('span')[1];
  const spanNominal = divsEspecificacion[2].querySelectorAll('span')[1];
  const spanMaxima = divsEspecificacion[3].querySelectorAll('span')[1];

  if (!modeloVal || !caracteristicaVal || caracteristicaVal.startsWith('Seleccione') || caracteristicaVal.startsWith('Cargando')) {
    if (spanMinima) spanMinima.innerHTML = `-`;
    if (spanNominal) spanNominal.innerHTML = `-`;
    if (spanMaxima) spanMaxima.innerHTML = `-`;
    ocultarEstadoEspecificacion();
    return;
  }

  contenedorSpec.classList.remove('hidden');

  try {
    const { data, error } = await supabaseClient
      .from('Dimensiones')
      .select('min, nom, max, model, caracteristica')
      .ilike('model', modeloVal)
      .ilike('caracteristica', caracteristicaVal);

    if (error) throw error;

    if (data && data.length > 0) {
      const registro = data[0];
      if (spanMinima) spanMinima.innerHTML = `${registro.min ?? '-'} <span class="text-[10px] font-normal text-slate-400">mm</span>`;
      if (spanNominal) spanNominal.innerHTML = `${registro.nom ?? '-'} <span class="text-[10px] font-normal text-slate-400">mm</span>`;
      if (spanMaxima) spanMaxima.innerHTML = `${registro.max ?? '-'} <span class="text-[10px] font-normal text-slate-400">mm</span>`;
      calcularDesviacion();
    } else {
      if (spanMinima) spanMinima.innerHTML = `-`;
      if (spanNominal) spanNominal.innerHTML = `-`;
      if (spanMaxima) spanMaxima.innerHTML = `-`;
      ocultarEstadoEspecificacion();
    }
  } catch (err) {
    if (spanMinima) spanMinima.innerHTML = `-`;
    if (spanNominal) spanNominal.innerHTML = `-`;
    if (spanMaxima) spanMaxima.innerHTML = `-`;
    ocultarEstadoEspecificacion();
  }
}

function calcularDesviacion() {
  const medicionInput = document.getElementById('medicionInput');
  const spanDesviacion = document.getElementById('desviacionVal');
  const footerDesviacion = document.getElementById('footerDesviacionText');

  if (!medicionInput || !spanDesviacion) return;

  let nominalVal = NaN;
  const contenedorSpec = document.getElementById('tarjetasEspecificacionContainer');
  if (!contenedorSpec) return;

  const divsEspecificacion = contenedorSpec.querySelectorAll('.grid > div');
  if (divsEspecificacion.length >= 3) {
    const valorSpan = divsEspecificacion[2].querySelectorAll('span')[1];
    if (valorSpan) {
      nominalVal = parseFloat(valorSpan.textContent.replace('mm', '').trim());
    }
  }

  const medicionText = medicionInput.value.trim();
  const medicionVal = parseFloat(medicionText);

  if (medicionText === "") {
    spanDesviacion.innerHTML = `-`;
    if (footerDesviacion) footerDesviacion.innerHTML = `<b>Desviación:</b> -`;
    ocultarEstadoEspecificacion();
    return;
  }

  if (!isNaN(nominalVal) && !isNaN(medicionVal)) {
    const desviacion = nominalVal - medicionVal;
    
    spanDesviacion.innerHTML = `${desviacion.toFixed(3)} <span class="text-[10px] font-normal text-slate-400">mm</span>`;
    if (footerDesviacion) footerDesviacion.innerHTML = `<b>Desviación:</b> ${desviacion.toFixed(3)} mm`;

    let minVal = NaN, maxVal = NaN;
    if (divsEspecificacion.length >= 4) {
      const minSpan = divsEspecificacion[1].querySelectorAll('span')[1];
      const maxSpan = divsEspecificacion[3].querySelectorAll('span')[1];
      if (minSpan) minVal = parseFloat(minSpan.textContent.replace('mm', '').trim());
      if (maxSpan) maxVal = parseFloat(maxSpan.textContent.replace('mm', '').trim());
    }

    if (!isNaN(minVal) && !isNaN(maxVal)) {
      mostrarEstadoEspecificacion(medicionVal, minVal, maxVal);
    } else {
      ocultarEstadoEspecificacion();
    }
  } else {
    spanDesviacion.innerHTML = `-`;
    if (footerDesviacion) footerDesviacion.innerHTML = `<b>Desviación:</b> -`;
    ocultarEstadoEspecificacion();
  }
}

function mostrarEstadoEspecificacion(medicion, min, max) {
  const cardEstado = document.getElementById('estadoEspecificacionCard');
  const textoEstado = document.getElementById('estadoEspecificacionTexto');
  if (!cardEstado || !textoEstado) return;

  cardEstado.classList.remove('hidden');
  
  const margenCercano = 0.05;

  if (medicion < min) {
    const diferencia = (min - medicion).toFixed(3);
    if (diferencia <= margenCercano) {
      cardEstado.className = "px-4 py-3 rounded-2xl text-xs font-bold text-center border bg-amber-50 text-amber-800 border-amber-200 shadow-2xs";
      textoEstado.textContent = `❌ Fuera de especificación por (${diferencia} abajo del límite Mínimo)`;
    } else {
      cardEstado.className = "px-4 py-3 rounded-2xl text-xs font-bold text-center border bg-red-50 text-red-700 border-red-200 shadow-2xs";
      textoEstado.textContent = "❌ Fuera de especificación (Por debajo del límite Mínimo)";
    }
  } else if (medicion > max) {
    const diferencia = (medicion - max).toFixed(3);
    if (diferencia <= margenCercano) {
      cardEstado.className = "px-4 py-3 rounded-2xl text-xs font-bold text-center border bg-amber-50 text-amber-800 border-amber-200 shadow-2xs";
      textoEstado.textContent = `❌ Fuera de especificación por (${diferencia} arriba del límite Máximo)`;
    } else {
      cardEstado.className = "px-4 py-3 rounded-2xl text-xs font-bold text-center border bg-red-50 text-red-700 border-red-200 shadow-2xs";
      textoEstado.textContent = "❌ Fuera de especificación (Por encima del límite Máximo)";
    }
  } else {
    cardEstado.className = "px-4 py-3 rounded-2xl text-xs font-bold text-center border bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs";
    textoEstado.textContent = "✅ Dentro de especificación";
  }
}

function ocultarEstadoEspecificacion() {
  const cardEstado = document.getElementById('estadoEspecificacionCard');
  if (cardEstado) cardEstado.classList.add('hidden');
}

window.listaCaracteristicasCache = [];

async function cargarOperacionesPorTipo(tipoOp) {
  const inputsCards = [
    document.getElementById('elementNameSelectCardOP1'),
    document.getElementById('elementNameSelectCardOP2'),
    document.getElementById('elementNameSelectCardOP3'),
    document.getElementById('elementNameSelect')
  ].filter(Boolean);

  const datalistElement = document.getElementById('listaElementos');
  if (!datalistElement) return;

  inputsCards.forEach(inp => {
    inp.value = '';
    inp.placeholder = "Cargando características...";
  });

  limpiarMedicionYEstado();
  datalistElement.innerHTML = '<option value="Cargando características...">';

  try {
    let terminosBusqueda = [tipoOp];
    if (tipoOp === 'OP1') terminosBusqueda = ['OP1', 'Primera Operacion', 'Primera Operación', '1'];
    if (tipoOp === 'OP2') terminosBusqueda = ['OP2', 'Segunda Operacion', 'Segunda Operación', '2'];
    if (tipoOp === 'OP3') terminosBusqueda = ['OP3', 'Operacion Drill', 'Operación Drill', 'Drill', '3'];

    const filtroOr = terminosBusqueda.map(t => `operacion_tipo.ilike.%${t}%`).join(',');
    const { data, error } = await supabaseClient.from('operaciones').select('caracteristica, operacion_tipo').or(filtroOr);
    if (error) throw error;

    datalistElement.innerHTML = '';
    window.listaCaracteristicasCache = [];

    if (data && data.length > 0) {
      const caracteristicasUnicas = [...new Set(data.map(item => item.caracteristica))].filter(Boolean);
      window.listaCaracteristicasCache = caracteristicasUnicas;
      
      if (caracteristicasUnicas.length === 0) {
        datalistElement.innerHTML = `<option value="No hay características para ${tipoOp}">`;
        inputsCards.forEach(inp => inp.placeholder = `No hay características para ${tipoOp}`);
        return;
      }

      inputsCards.forEach(inp => inp.placeholder = "Escriba o seleccione característica...");

      caracteristicasUnicas.forEach(carac => {
        const option = document.createElement('option');
        option.value = carac;
        datalistElement.appendChild(option);
      });
    } else {
      datalistElement.innerHTML = `<option value="No se encontraron datos para ${tipoOp}">`;
      inputsCards.forEach(inp => inp.placeholder = `No se encontraron datos para ${tipoOp}`);
    }
  } catch (err) {
    datalistElement.innerHTML = '<option value="Error al cargar datos">';
    inputsCards.forEach(inp => inp.placeholder = "Error al cargar datos");
  }
}

function seleccionarOperacion(tipoOp) {
  const cards = {
    'OP1': { card: document.getElementById('cardOp1'), container: document.getElementById('cardElementNameInternoOP1') },
    'OP2': { card: document.getElementById('cardOp2'), container: document.getElementById('cardElementNameInternoOP2') },
    'OP3': { card: document.getElementById('cardOp3'), container: document.getElementById('cardElementNameInternoOP3') }
  };

  Object.keys(cards).forEach(key => {
    const item = cards[key];
    if (!item.card) return;
    
    if (key === tipoOp) {
      item.card.className = "group relative bg-white rounded-xl overflow-hidden border-2 border-blue-500 shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[144px] ring-2 ring-blue-500/20";
      if (item.container) item.container.classList.remove('hidden');
    } else {
      item.card.className = "group relative bg-white rounded-xl overflow-hidden border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between h-36";
      if (item.container) item.container.classList.add('hidden');
    }
  });

  const panelAjustes = document.getElementById('panelAjustesVerificaciones');
  if (panelAjustes) {
    panelAjustes.classList.remove('hidden');
    panelAjustes.style.display = 'flex';
  }

  limpiarPanelAjustesDerecha();
  limpiarMedicionYEstado();

  cargarOperacionesPorTipo(tipoOp);
}

async function manejarSeleccionElemento(caracteristicaVal) {
  const inputsCards = [
    document.getElementById('elementNameSelectCardOP1'),
    document.getElementById('elementNameSelectCardOP2'),
    document.getElementById('elementNameSelectCardOP3'),
    document.getElementById('elementNameSelect')
  ].filter(Boolean);

  inputsCards.forEach(inp => {
    if (inp.value !== caracteristicaVal) inp.value = caracteristicaVal;
  });

  const panelAjustes = document.getElementById('panelAjustesVerificaciones');
  if (panelAjustes && caracteristicaVal && !caracteristicaVal.startsWith('Seleccione')) {
    panelAjustes.classList.remove('hidden');
  }

  try {
    const { data, error } = await supabaseClient
      .from('operaciones')
      .select('*')
      .ilike('caracteristica', caracteristicaVal);

    if (error) throw error;

    if (data && data.length > 0) {
      const op = data[0];
      const txtAjustes = document.getElementById('txtAjustesRecomen');
      const txtEjemplo = document.getElementById('txtEjemploAjuste');
      
      if (txtAjustes) {
        const textoAjusteCrudo = op.ajustes_recomen || op.ajuste_recomen || '-';
        if (textoAjusteCrudo !== '-') {
          const lineasAjuste = textoAjusteCrudo.split('\n')
            .map(l => l.replace(/^[•\-*\d.]+\s*/, '').trim())
            .filter(Boolean);
          
          txtAjustes.innerHTML = lineasAjuste.length > 0 
            ? lineasAjuste.map(item => `<div class="py-0.5">${item}</div>`).join('') 
            : '-';
        } else {
          txtAjustes.textContent = '-';
        }
      }
      
      if (txtEjemplo) txtEjemplo.textContent = op.Ejemplo ? `Objetivo: ${op.Ejemplo}` : 'Objetivo: -';

      const txtNotas = document.getElementById('txtNotasVisual');
      if (txtNotas) {
        const textoNotasCrudo = op.Notas || op.notas || '-';
        if (textoNotasCrudo !== '-') {
          const lineasNotas = textoNotasCrudo.split('\n')
            .map(l => l.replace(/^[•\-*\d.]+\s*/, '').trim())
            .filter(Boolean);

          txtNotas.innerHTML = lineasNotas.length > 0 
            ? lineasNotas.map(item => `<div class="py-0.5">${item}</div>`).join('') 
            : '-';
        } else {
          txtNotas.textContent = '-';
        }
      }

      const txtAfect = document.getElementById('txtPosiblesAfect');
      if (txtAfect) {
        if (op.posibles_afect) {
          const afects = op.posibles_afect.split('\n')
            .map(a => a.replace(/^[•\-*\d.]+\s*/, '').trim())
            .filter(Boolean);

          txtAfect.innerHTML = afects.length > 0 
            ? afects.map(a => `
              <div class="bg-white/90 p-2 rounded-lg border border-amber-200/50 flex items-center justify-between text-xs">
                <span class="font-medium text-slate-700">${a}</span>
                <span class="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px]">Activo</span>
              </div>
            `).join('')
            : `<div class="bg-white/90 p-2 rounded-lg border border-amber-200/50 text-xs text-slate-500">-</div>`;
        } else {
          txtAfect.innerHTML = `<div class="bg-white/90 p-2 rounded-lg border border-amber-200/50 text-xs text-slate-500">-</div>`;
        }
      }
    } else {
      limpiarPanelAjustesDerecha();
    }
  } catch (err) {
    limpiarPanelAjustesDerecha();
  }
}

function limpiarPanelAjustesDerecha() {
  const txtAjustes = document.getElementById('txtAjustesRecomen');
  const txtEjemplo = document.getElementById('txtEjemploAjuste');
  const txtNotas = document.getElementById('txtNotasVisual');
  const txtAfect = document.getElementById('txtPosiblesAfect');
  
  if (txtAjustes) txtAjustes.textContent = '-';
  if (txtEjemplo) txtEjemplo.textContent = 'Objetivo: -';
  if (txtNotas) txtNotas.textContent = '-';
  if (txtAfect) txtAfect.innerHTML = `<div class="bg-white/90 p-2 rounded-lg border border-amber-200/50 text-xs text-slate-500">-</div>`;
}

let valorTemporal = "";

function abrirTeclado() {
  const teclado = document.getElementById('miniTeclado');
  if (!teclado) return;
  valorTemporal = document.getElementById('medicionInput').value || "";
  teclado.classList.remove('hidden');
  teclado.style.display = 'block';
}

function cerrarTeclado() {
  const teclado = document.getElementById('miniTeclado');
  if (teclado) {
    teclado.classList.add('hidden');
    teclado.style.display = 'none';
  }
  const medicionInput = document.getElementById('medicionInput');
  if (medicionInput) medicionInput.blur();
}

function agregarNumero(num) {
  valorTemporal += num;
  document.getElementById('medicionInput').value = valorTemporal;
  calcularDesviacion();
}

function borrarUltimo() {
  if (valorTemporal.length > 0) {
    valorTemporal = valorTemporal.slice(0, -1);
    document.getElementById('medicionInput').value = valorTemporal;
    calcularDesviacion();
  }
}

function confirmarMedicion() {
  if (valorTemporal === "") {
    valorTemporal = "0.000";
    document.getElementById('medicionInput').value = valorTemporal;
  }
  cerrarTeclado();
  calcularDesviacion();
}

async function mostrarContenedorMapeo() {
  document.getElementById('vistaInicialRinContainer').classList.add('hidden');
  document.getElementById('mapaRinContenedorCompleto').classList.remove('hidden');

  const caracteristicaActual = obtenerElementoNameActivo();
  const inputDatosMapa = document.getElementById('listaDatosMapaInput');
  
  if (caracteristicaActual && inputDatosMapa) {
    inputDatosMapa.value = caracteristicaActual;
    await verificarYCargarPuntosExistentes(caracteristicaActual);
  }
}

function ocultarContenedorMapeo() {
  document.getElementById('mapaRinContenedorCompleto').classList.add('hidden');
  document.getElementById('vistaInicialRinContainer').classList.remove('hidden');
  window.idMapeoEditando = null;
  const avisoEdicion = document.getElementById('avisoModoEdicionMapeo');
  if (avisoEdicion) avisoEdicion.classList.add('hidden');
}

let puntosSeleccionados = [];

async function verificarYCargarPuntosExistentes(caracteristicaVal) {
  const modoSelect = document.getElementById('modoPuntosSelect');
  const avisoEdicion = document.getElementById('avisoModoEdicionMapeo');
  if (!caracteristicaVal) return;

  try {
    const { data, error } = await supabaseClient
      .from('mapeo_puntos_rin')
      .select('*')
      .ilike('caracteristica', caracteristicaVal);

    if (error) throw error;

    if (data && data.length > 0) {
      const registro = data[data.length - 1];
      window.idMapeoEditando = registro.id || registro.id_mapeo || null; 
      
      puntosSeleccionados = [];
      if (registro.punto_1_x !== null && registro.punto_1_y !== null) puntosSeleccionados.push({ x: registro.punto_1_x, y: registro.punto_1_y });
      if (registro.punto_2_x !== null && registro.punto_2_y !== null) puntosSeleccionados.push({ x: registro.punto_2_x, y: registro.punto_2_y });

      if (puntosSeleccionados.length > 0) {
        if (modoSelect) modoSelect.value = puntosSeleccionados.length;
        if (avisoEdicion) avisoEdicion.classList.remove('hidden');
        redibujarElementosMapa();
      }
    } else {
      window.idMapeoEditando = null;
      if (avisoEdicion) avisoEdicion.classList.add('hidden');
    }
  } catch (err) {
    console.error(err);
  }
}

function cancelarEdicionMapeo() {
  window.idMapeoEditando = null;
  limpiarPuntosMapa();
  const avisoEdicion = document.getElementById('avisoModoEdicionMapeo');
  if (avisoEdicion) avisoEdicion.classList.add('hidden');
}

function cambiarModoPuntos() {
  puntosSeleccionados = [];
  redibujarElementosMapa();
}

function limpiarPuntosMapa() {
  puntosSeleccionados = [];
  document.getElementById('puntosMapaLayer').innerHTML = '';
}

function redibujarElementosMapa() {
  const layer = document.getElementById('puntosMapaLayer');
  if (!layer) return;
  layer.innerHTML = '';

  puntosSeleccionados.forEach((p, index) => {
    const puntoFijo = document.createElement('div');
    puntoFijo.className = 'absolute w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[10px] font-extrabold text-white';
    puntoFijo.style.left = `${p.x}%`;
    puntoFijo.style.top = `${p.y}%`;
    puntoFijo.textContent = index + 1;
    layer.appendChild(puntoFijo);
  });

  const inputDatosMapa = document.getElementById('listaDatosMapaInput');
  const nombreParteMapa = inputDatosMapa ? inputDatosMapa.value.trim() : '';
  if (puntosSeleccionados.length > 0 && nombreParteMapa) {
    const primerPin = puntosSeleccionados[0];
    const labelLeyenda = document.createElement('div');
    labelLeyenda.className = 'absolute bg-red-100/95 border border-red-300 text-red-800 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm pointer-events-none z-10 flex items-center gap-1 transform -translate-x-1/2 translate-y-3';
    labelLeyenda.style.left = `${primerPin.x}%`;
    labelLeyenda.style.top = `${primerPin.y}%`;
    labelLeyenda.innerHTML = `📍 <span>${nombreParteMapa}</span>`;
    layer.appendChild(labelLeyenda);
  }
}

function colocarPuntoMapa(event) {
  const container = document.getElementById('mapaRinContainer');
  const maxPuntos = parseInt(document.getElementById('modoPuntosSelect').value);
  const rect = container.getBoundingClientRect();
  
  const x = parseFloat((((event.clientX - rect.left) / rect.width) * 100).toFixed(2));
  const y = parseFloat((((event.clientY - rect.top) / rect.height) * 100).toFixed(2));

  if (puntosSeleccionados.length >= maxPuntos) puntosSeleccionados = [];
  puntosSeleccionados.push({ x, y });
  redibujarElementosMapa();
}

async function guardarPuntosSupabase() {
  const caracteristicaMapaVal = document.getElementById('listaDatosMapaInput').value.trim();
  const modoSelect = document.getElementById('modoPuntosSelect').value;

  if (!caracteristicaMapaVal) { alert('Ingrese o seleccione un valor en Datos.'); return; }
  if (puntosSeleccionados.length === 0) { alert('Marque al menos un punto.'); return; }

  const datosGuardar = {
    caracteristica: caracteristicaMapaVal,
    tipo_puntos: parseInt(modoSelect),
    punto_1_x: puntosSeleccionados[0] ? puntosSeleccionados[0].x : null,
    punto_1_y: puntosSeleccionados[0] ? puntosSeleccionados[0].y : null,
    punto_2_x: puntosSeleccionados[1] ? puntosSeleccionados[1].x : null,
    punto_2_y: puntosSeleccionados[1] ? puntosSeleccionados[1].y : null,
    punto_3: caracteristicaMapaVal
  };

  try {
    if (window.idMapeoEditando) {
      const { error } = await supabaseClient.from('mapeo_puntos_rin').update(datosGuardar).eq('id', window.idMapeoEditando);
      if (error) throw error;
      alert('¡Posicionamiento actualizado!');
    } else {
      datosGuardar.created_at = new Date();
      const { error } = await supabaseClient.from('mapeo_puntos_rin').insert([datosGuardar]);
      if (error) throw error;
      alert('¡Posicionamiento guardado!');
    }

    ocultarContenedorMapeo();
    manejarSeleccionElemento(caracteristicaMapaVal);
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function togglePanelDimensional(event) {
  if (event) event.stopPropagation();
  const sidebar = document.getElementById('sidebarDimensional');
  sidebar.classList.toggle('translate-x-full');
  
  const contenedor = document.getElementById('listaCeldasVertical');
  if (!sidebar.classList.contains('translate-x-full') && contenedor.children.length === 0) {
    let htmlCards = '';
    for (let i = 1; i <= 36; i++) {
      if (i === 31 || i === 32) continue;
      let numeroStr = i < 10 ? '0' + i : '' + i;
      let nombreCelda = 'C' + numeroStr;
      htmlCards += `
        <div onclick="seleccionarCeldaSidebar('${nombreCelda}')" class="bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 py-2.5 px-3.5 rounded-2xl text-center cursor-pointer transition shadow-2xs group">
          <span class="text-xs font-bold text-slate-700 group-hover:text-blue-600">${nombreCelda}</span>
        </div>
      `;
    }
    contenedor.innerHTML = htmlCards;
  }
}

async function seleccionarCeldaSidebar(nombreCelda) {
  const sidebar = document.getElementById('sidebarDimensional');
  if (sidebar) sidebar.classList.add('translate-x-full');

  const contenedorGlobal = document.getElementById('contenedorPrincipalGlobal');
  if (contenedorGlobal) {
    contenedorGlobal.classList.remove('max-w-6xl', 'mx-auto');
    contenedorGlobal.classList.add('w-full', 'px-4');
  }

  const columnaIzquierda = document.getElementById('columnaIzquierda');
  const columnaDerecha = document.getElementById('columnaDerecha');
  
  if (columnaIzquierda) {
    columnaIzquierda.className = "lg:col-span-4 bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col gap-3 overflow-y-auto max-h-full transition-all duration-300";
  }
  
  if (columnaDerecha) {
    columnaDerecha.className = "lg:col-span-8 bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col gap-4 overflow-y-auto h-full max-h-full transition-all duration-300 flex";
  }

  const panelAjustes = document.getElementById('panelAjustesVerificaciones');
  if (panelAjustes) {
    panelAjustes.classList.remove('hidden');
    panelAjustes.style.display = 'flex';
  }

  const seccionOriginal = document.getElementById('seccionAjustesOriginal');
  if (seccionOriginal) {
    seccionOriginal.classList.remove('hidden');
  }

  const elementoActivo = obtenerElementoNameActivo();
  if (elementoActivo) {
    manejarSeleccionElemento(elementoActivo);
  }

  const seccionHistorial = document.getElementById('seccionHistorialPdf');
  if (seccionHistorial) {
    seccionHistorial.classList.remove('hidden');
    seccionHistorial.className = "flex flex-col gap-3 transition-all duration-300";
    seccionHistorial.innerHTML = `
      <div class="flex items-center justify-between border-b border-slate-100 pb-4">
        <div class="flex items-center gap-2.5">
          <span class="text-base">📋</span>
          <h3 class="font-extrabold text-slate-900 text-sm">Historial de dimensionales - ${nombreCelda}</h3>
        </div>
        <button type="button" onclick="regresarVistaOriginalAjustes()" class="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl border border-slate-200 transition">⬅️ Volver</button>
      </div>
      <div class="p-6 text-center text-xs text-slate-400 italic">Cargando registros para ${nombreCelda}...</div>
    `;

    try {
      const { data, error } = await supabaseClient
        .from('historial_celdas')
        .select('id, celda, nombre_archivo, url_archivo, fecha_str, fecha_original')
        .eq('celda', nombreCelda);

      if (error) throw error;

      let filasHtml = '';
      if (data && data.length > 0) {
        data.forEach(item => {
          let linkArchivo = item.url_archivo ? item.url_archivo : '#';
          let nombreTxt = item.nombre_archivo ? item.nombre_archivo : 'Ver Documento';
          filasHtml += `
            <tr class="hover:bg-slate-50/80 transition">
              <td class="p-3 font-medium text-slate-600">${item.id ?? ''}</td>
              <td class="p-3 font-semibold text-slate-800">${item.celda ?? ''}</td>
              <td class="p-3 font-bold text-blue-600">
                <a href="#" onclick="visualizarPdfContenedor('${linkArchivo}', '${nombreTxt}', event)" class="hover:underline flex items-center gap-1.5">📄 ${nombreTxt}</a>
              </td>
              <td class="p-3 text-slate-600">${item.fecha_str ?? ''}</td>
              <td class="p-3 text-slate-600">${item.fecha_original ?? ''}</td>
            </tr>
          `;
        });
      } else {
        filasHtml = `<tr><td colspan="5" class="p-8 text-center text-slate-400 italic">No se encontraron registros para la celda ${nombreCelda}</td></tr>`;
      }

      seccionHistorial.innerHTML = `
        <div id="headerHistorialInfo" class="flex items-center justify-between border-b border-slate-100 pb-4">
          <div class="flex items-center gap-2.5">
            <span class="text-base">📋</span>
            <h3 class="font-extrabold text-slate-900 text-sm">Historial de dimensionales - ${nombreCelda}</h3>
          </div>
          <button type="button" onclick="regresarVistaOriginalAjustes()" class="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl border border-slate-200 transition">⬅️ Volver</button>
        </div>

        <div id="bloqueTablaHistorial" class="space-y-4">
          <div class="overflow-x-auto border border-slate-200/80 rounded-2xl bg-slate-50/50 max-h-[380px] overflow-y-auto shadow-2xs">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-100/90 text-slate-700 border-b border-slate-200 sticky top-0">
                  <th class="p-3 font-extrabold">Id</th>
                  <th class="p-3 font-extrabold">Celda</th>
                  <th class="p-3 font-extrabold">Documento</th>
                  <th class="p-3 font-extrabold">Fecha|Hora</th>
                  <th class="p-3 font-extrabold">Serial</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 text-slate-700">${filasHtml}</tbody>
            </table>
          </div>
        </div>

        <div id="visorPdfContenedor" class="hidden flex flex-col gap-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl p-4 w-full shadow-2xs">
          <div class="flex items-center justify-between border-b border-slate-200 pb-3">
            <span id="tituloPdfVisualizando" class="text-xs font-bold text-slate-900 truncate">Documento PDF</span>
            <button type="button" onclick="cerrarVisorPdfYMostrarTabla()" class="text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-300 transition">⬅️ Regresar a la tabla</button>
          </div>
          <iframe id="iframePdfViewer" src="" class="w-full h-[680px] bg-white rounded-2xl border border-slate-200"></iframe>
        </div>
      `;
    } catch (err) {
      seccionHistorial.innerHTML = `<div class="p-4 text-center text-xs text-red-600 bg-red-50 rounded-2xl border border-red-200 mt-3 font-semibold">Error al consultar la tabla historial_celdas.</div>`;
    }
  }
}

function visualizarPdfContenedor(urlArchivo, nombreArchivo, event) {
  if (event) event.preventDefault();
  const headerHistorial = document.getElementById('headerHistorialInfo');
  const bloqueTabla = document.getElementById('bloqueTablaHistorial');
  const visorContainer = document.getElementById('visorPdfContenedor');
  const iframeViewer = document.getElementById('iframePdfViewer');
  const tituloPdf = document.getElementById('tituloPdfVisualizando');

  if (!visorContainer || !iframeViewer) return;
  if (!urlArchivo || urlArchivo === '#') { alert('URL de archivo no válida.'); return; }

  if (headerHistorial) headerHistorial.classList.add('hidden');
  if (bloqueTabla) bloqueTabla.classList.add('hidden');
  
  tituloPdf.textContent = `Visualizando: ${nombreArchivo}`;
  iframeViewer.src = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(urlArchivo)}#pagemode=none`;
  visorContainer.classList.remove('hidden');
}

function cerrarVisorPdfYMostrarTabla() {
  const headerHistorial = document.getElementById('headerHistorialInfo');
  const bloqueTabla = document.getElementById('bloqueTablaHistorial');
  const visorContainer = document.getElementById('visorPdfContenedor');
  const iframeViewer = document.getElementById('iframePdfViewer');
  
  if (iframeViewer) iframeViewer.src = '';
  if (visorContainer) visorContainer.classList.add('hidden');
  if (headerHistorial) headerHistorial.classList.remove('hidden');
  if (bloqueTabla) bloqueTabla.classList.remove('hidden');
}

function regresarVistaOriginalAjustes() {
  const seccionHistorial = document.getElementById('seccionHistorialPdf');
  const seccionOriginal = document.getElementById('seccionAjustesOriginal');
  const columnaIzquierda = document.getElementById('columnaIzquierda');
  const columnaDerecha = document.getElementById('columnaDerecha');
  const gridPrincipal = document.getElementById('gridPrincipalContenedores');
  
  const contenedorGlobal = document.getElementById('contenedorPrincipalGlobal');
  if (contenedorGlobal) {
    contenedorGlobal.classList.remove('w-full', 'px-4');
    contenedorGlobal.classList.add('max-w-6xl', 'w-full', 'mx-auto');
  }

  if (gridPrincipal) {
    gridPrincipal.className = "grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 items-start transition-all duration-300 h-full";
  }

  if (seccionHistorial) seccionHistorial.classList.add('hidden');
  if (seccionOriginal) seccionOriginal.classList.remove('hidden');

  if (columnaIzquierda) {
    columnaIzquierda.className = "lg:col-span-12 bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col gap-3 overflow-y-auto h-full max-h-full transition-all duration-300";
  }
  
  if (columnaDerecha) {
    columnaDerecha.className = "hidden lg:col-span-8 bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col gap-4 overflow-y-auto h-full max-h-full transition-all duration-300";
  }
}

function mostrarContenidoAjustes() {
  const seccionHistorial = document.getElementById('seccionHistorialPdf');
  const seccionOriginal = document.getElementById('seccionAjustesOriginal');
  if (seccionHistorial) seccionHistorial.classList.add('hidden');
  if (seccionOriginal) seccionOriginal.classList.remove('hidden');
}