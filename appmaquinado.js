// Inicialización de Supabase con credenciales
const SUPABASE_URL = 'https://oycvzlnwwhpdlmmofrhd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_1NwNxqZ7zkQXIFRUkn6G3A_RGIdZbHP';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Variables de estado global
window.sesionActual = null;
window.idOperacionEditando = null;
window.operacionEditandoObj = null;
window.listaOperacionesCacheModal = [];
window.listaModelosCacheModal = [];
window.listaCaracteristicasSupabaseCache = [];

// Escapa texto antes de insertarlo como HTML (los datos vienen de la base de datos)
function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Sistema de Notificaciones Flotantes (Toast) integrado
function mostrarToast(mensaje, tipo = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) {
    console.log(mensaje);
    return;
  }

  const esExito = tipo === 'success';
  const toast = document.createElement('div');
  toast.className = `toast ${esExito ? 'toast-ok' : 'toast-err'}`;
  toast.setAttribute('role', esExito ? 'status' : 'alert');
  toast.innerHTML = `<svg class="i" aria-hidden="true"><use href="#${esExito ? 'i-check' : 'i-alert'}"/></svg><span>${esc(mensaje)}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Alertas modales (respaldo)
function mostrarAlertaElegante(titulo, mensaje) {
  const alertModal = document.getElementById('customAlertModal');
  const alertTitle = document.getElementById('alertTitle');
  const alertMessage = document.getElementById('alertMessage');

  if (alertModal && alertTitle && alertMessage) {
    alertTitle.textContent = titulo || 'Atención';
    alertMessage.textContent = mensaje || '';
    alertModal.classList.remove('hidden');
  } else {
    mostrarToast(`${titulo}: ${mensaje}`, 'error');
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
    const modeloStr = String(item.modelo || '').toLowerCase();
    return idStr.includes(textoBusqueda) || tipoStr.includes(textoBusqueda) || caracStr.includes(textoBusqueda) || modeloStr.includes(textoBusqueda);
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

// Teclado numérico en pantalla y manejo de visibilidad mediante el botón calculadora
function inicializarTecladoNumerico() {
  const gridContainer = document.getElementById('gridTecladoContainer');
  const miniTeclado = document.getElementById('miniTeclado');
  const btnCalculadora = document.getElementById('btnCalculadoraTeclado');
  const medicionInput = document.getElementById('medicionInput');

  if (!gridContainer || !miniTeclado || !btnCalculadora || !medicionInput) return;

  const botones = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫', 'C'];
  let htmlBotones = '';
  botones.forEach(btn => {
    if (btn === '⌫') {
      htmlBotones += `<button type="button" onclick="borrarUltimo()" class="key key-del" aria-label="Borrar último dígito"><svg class="i" aria-hidden="true"><use href="#i-backspace"/></svg></button>`;
    } else if (btn === 'C') {
      htmlBotones += `<button type="button" onclick="limpiarTodoTeclado()" class="key key-clear">Borrar todo</button>`;
    } else {
      htmlBotones += `<button type="button" onclick="agregarNumero('${btn}')" class="key">${btn}</button>`;
    }
  });
  gridContainer.innerHTML = htmlBotones;

  btnCalculadora.addEventListener('click', (e) => {
    e.stopPropagation();
    miniTeclado.classList.remove('hidden');
    medicionInput.focus();
  });

  medicionInput.addEventListener('keydown', (e) => {
    if ((e.key >= '0' && e.key <= '9') || e.key === '.' || e.key === ',') {
      e.preventDefault();
      agregarNumero(e.key === ',' ? '.' : e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      borrarUltimo();
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      miniTeclado.classList.add('hidden');
      if (e.key === 'Enter') {
        e.preventDefault();
        medicionInput.blur();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      miniTeclado.classList.add('hidden');
      medicionInput.blur();
    }
  });

  document.addEventListener('click', (e) => {
    const clickFuera = !miniTeclado.contains(e.target) && !medicionInput.contains(e.target) && !btnCalculadora.contains(e.target);
    if (clickFuera) {
      miniTeclado.classList.add('hidden');
    }
  });
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
    authBtn.innerHTML = '<svg class="i" aria-hidden="true"><use href="#i-logout"/></svg><span class="btn-label">Cerrar sesión</span>';
    authBtn.title = 'Cerrar sesión';
    authBtn.setAttribute('aria-label', 'Cerrar sesión');
    authBtn.className = 'btn btn-danger';
  } else {
    authBtn.innerHTML = '<svg class="i" aria-hidden="true"><use href="#i-key"/></svg><span class="btn-label">Acceso admin</span>';
    authBtn.title = 'Iniciar sesión como administrador';
    authBtn.setAttribute('aria-label', 'Iniciar sesión como administrador');
    authBtn.className = 'btn btn-ghost';
  }
}

function toggleModalCards() {
  const modal = document.getElementById('modalCardsFormulario');
  if (modal) modal.classList.toggle('hidden');
}

function seleccionarCardModal(tipoCard) {
  toggleModalCards();
  if (tipoCard === 'Modelos') {
    const modalModelos = document.getElementById('modalModelosFormulario');
    if (modalModelos) {
      modalModelos.classList.remove('hidden');
      reiniciarFormularioModelos();
    }
  } else if (tipoCard === 'Caracteristicas') {
    const modalCarac = document.getElementById('modalCaracteristicasFormulario');
    if (modalCarac) {
      modalCarac.classList.remove('hidden');
      reiniciarFormularioCaracteristicas();
    }
  } else if (tipoCard === 'Dimensiones') {
    const modalDim = document.getElementById('modalDimensionesFormulario');
    if (modalDim) {
      modalDim.classList.remove('hidden');
      reiniciarFormularioDimensiones();
      cargarFiltroModelosDimensiones();
    }
  } else if (tipoCard === 'Operaciones') {
    const modalOp = document.getElementById('modalOperacionesFormulario');
    if (modalOp) {
      modalOp.classList.remove('hidden');
      window.idOperacionEditando = null; 
      window.operacionEditandoObj = null;
      const btnNuevo = document.getElementById('btnNuevoOperacion');
      if (btnNuevo) btnNuevo.classList.add('hidden');

      actualizarTextoBotonGuardarOp();
      cargarListadoOperacionesModal();
      cargarCaracteristicasOperacionesModal();
      reiniciarCamposFormularioOperaciones();
    }
  }
}

// ============================================================
// GESTIÓN DE MODELOS (VENTANA EMERGENTE)
// ============================================================

function cerrarModalModelos() {
  const modalModelos = document.getElementById('modalModelosFormulario');
  if (modalModelos) modalModelos.classList.add('hidden');
}

function reiniciarFormularioModelos() {
  const inputId = document.getElementById('modelFormOriginalId');
  const inputModelo = document.getElementById('modelFormModelo');
  const inputCliente = document.getElementById('modelFormCliente');
  const inputTamano = document.getElementById('modelFormTamano');
  const btnGuardar = document.getElementById('btnGuardarModelo');

  if (inputId) inputId.value = '';
  if (inputModelo) inputModelo.value = '';
  if (inputCliente) inputCliente.value = '';
  if (inputTamano) inputTamano.value = '';
  if (btnGuardar) {
    btnGuardar.textContent = 'Guardar Modelo';
    btnGuardar.className = 'btn btn-primary';
  }

  cargarTablaModelosModal();
}

async function cargarTablaModelosModal() {
  const tbody = document.getElementById('tablaListadoModelosBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" class="tabla-vacia">Cargando modelos…</td></tr>`;

  try {
    const { data, error } = await supabaseClient
      .from('modelos')
      .select('id_modelo, modelo, cliente, tamano')
      .order('modelo', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      window.listaModelosCacheModal = data;
      renderizarTablaModelosModal(data);
    } else {
      window.listaModelosCacheModal = [];
      tbody.innerHTML = `<tr><td colspan="5" class="tabla-vacia">No hay modelos registrados.</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="tabla-vacia tabla-error">Error al cargar: ${esc(err.message)}</td></tr>`;
  }
}

function renderizarTablaModelosModal(dataArray) {
  const tbody = document.getElementById('tablaListadoModelosBody');
  if (!tbody) return;

  if (!dataArray || dataArray.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="tabla-vacia">No hay registros que coincidan.</td></tr>`;
    return;
  }

  let filasHtml = '';
  dataArray.forEach(item => {
    const idVal = item.id_modelo !== undefined ? item.id_modelo : (item.id !== undefined ? item.id : '');
    const itemJson = encodeURIComponent(JSON.stringify(item));

    filasHtml += `
      <tr id="fila-modelo-${idVal}">
        <td class="num">${esc(idVal)}</td>
        <td class="strong">${esc(item.modelo)}</td>
        <td>${esc(item.cliente)}</td>
        <td>${esc(item.tamano)}</td>
        <td style="text-align: right; white-space: nowrap;" id="acciones-modelo-${idVal}">
          <button type="button" class="btn btn-soft btn-sm btn-icon" title="Editar" aria-label="Editar" onclick="cargarModeloEnFormulario('${itemJson}')"><svg class="i" aria-hidden="true"><use href="#i-wrench"/></svg></button>
          <button type="button" class="btn btn-danger btn-sm btn-icon" title="Eliminar" aria-label="Eliminar" onclick="confirmarEliminarModelo(${idVal})"><svg class="i" aria-hidden="true"><use href="#i-x"/></svg></button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = filasHtml;
}

function toggleBuscadorTablaModelos() {
  const contenedor = document.getElementById('contenedorInputBusquedaTablaModelos');
  const input = document.getElementById('inputBusquedaTablaModelos');
  if (!contenedor) return;

  contenedor.classList.toggle('hidden');
  if (!contenedor.classList.contains('hidden') && input) {
    input.focus();
  }
}

function filtrarTablaModelosTexto() {
  const input = document.getElementById('inputBusquedaTablaModelos');
  if (!input || !window.listaModelosCacheModal) return;

  const textoBusqueda = input.value.toLowerCase().trim();
  if (!textoBusqueda) {
    renderizarTablaModelosModal(window.listaModelosCacheModal);
    return;
  }

  const filtrados = window.listaModelosCacheModal.filter(item => {
    const idStr = String(item.id_modelo || item.id || '').toLowerCase();
    const modeloStr = String(item.modelo || '').toLowerCase();
    const clienteStr = String(item.cliente || '').toLowerCase();
    const tamanoStr = String(item.tamano || '').toLowerCase();
    return idStr.includes(textoBusqueda) || modeloStr.includes(textoBusqueda) || clienteStr.includes(textoBusqueda) || tamanoStr.includes(textoBusqueda);
  });

  renderizarTablaModelosModal(filtrados);
}

function limpiarYFecharBuscadorTablaModelos() {
  const input = document.getElementById('inputBusquedaTablaModelos');
  const contenedor = document.getElementById('contenedorInputBusquedaTablaModelos');
  if (input) input.value = '';
  if (contenedor) contenedor.classList.add('hidden');
  if (window.listaModelosCacheModal) {
    renderizarTablaModelosModal(window.listaModelosCacheModal);
  }
}

function cargarModeloEnFormulario(itemJsonStr) {
  try {
    const item = JSON.parse(decodeURIComponent(itemJsonStr));
    const idVal = item.id_modelo !== undefined ? item.id_modelo : item.id;

    document.getElementById('modelFormOriginalId').value = idVal;
    document.getElementById('modelFormModelo').value = item.modelo || '';
    document.getElementById('modelFormCliente').value = item.cliente || '';
    document.getElementById('modelFormTamano').value = item.tamano || '';

    const btnGuardar = document.getElementById('btnGuardarModelo');
    if (btnGuardar) {
      btnGuardar.textContent = `Actualizar Modelo (ID: ${idVal})`;
      btnGuardar.className = 'btn btn-warn';
    }

    document.querySelector('#modalModelosFormulario > div').scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    console.error(e);
  }
}

async function guardarOActualizarModeloSupabase() {
  const idOriginal = document.getElementById('modelFormOriginalId').value.trim();
  const modelo = document.getElementById('modelFormModelo').value.trim();
  const cliente = document.getElementById('modelFormCliente').value.trim();
  const tamano = document.getElementById('modelFormTamano').value.trim();

  if (!modelo || !cliente || !tamano) {
    mostrarToast('Por favor completa todos los campos.', 'error');
    return;
  }

  const datosModelo = { modelo, cliente, tamano };

  try {
    if (idOriginal) {
      const { error } = await supabaseClient
        .from('modelos')
        .update(datosModelo)
        .eq('id_modelo', Number(idOriginal));

      if (error) throw error;
      mostrarToast('Modelo actualizado correctamente');
    } else {
      const { error } = await supabaseClient
        .from('modelos')
        .insert([datosModelo]);

      if (error) throw error;
      mostrarToast('Modelo guardado correctamente');
    }

    reiniciarFormularioModelos();
    await cargarModelosSupabase();
  } catch (err) {
    mostrarToast('Error en Supabase: ' + err.message, 'error');
  }
}

function confirmarEliminarModelo(idVal) {
  const celdaAcciones = document.getElementById(`acciones-modelo-${idVal}`);
  if (!celdaAcciones) return;

  celdaAcciones.innerHTML = `
    <span style="font-size: 13px; font-weight: 600; margin-right: 8px; color: var(--bad-ink);">¿Eliminar?</span>
    <button type="button" class="btn btn-danger btn-sm btn-icon" title="Confirmar eliminación" aria-label="Confirmar eliminación" onclick="ejecutarEliminarModelo(${idVal})"><svg class="i" aria-hidden="true"><use href="#i-check"/></svg></button>
    <button type="button" class="btn btn-ghost btn-sm btn-icon" title="Cancelar" aria-label="Cancelar" onclick="cancelarEliminarModelo()"><svg class="i" aria-hidden="true"><use href="#i-x"/></svg></button>
  `;
}

async function cancelarEliminarModelo() {
  await cargarTablaModelosModal();
}

async function ejecutarEliminarModelo(idVal) {
  try {
    const { error } = await supabaseClient
      .from('modelos')
      .delete()
      .eq('id_modelo', Number(idVal));

    if (error) throw error;

    mostrarToast('Modelo eliminado correctamente');
    await cargarTablaModelosModal();
    await cargarModelosSupabase();
  } catch (err) {
    mostrarToast('Error al eliminar: ' + err.message, 'error');
  }
}

// ============================================================
// GESTIÓN DE CARACTERÍSTICAS (TABLA SUPABASE: Caracteristicas)
// ============================================================

function cerrarModalCaracteristicas() {
  const modalCarac = document.getElementById('modalCaracteristicasFormulario');
  if (modalCarac) modalCarac.classList.add('hidden');
}

function reiniciarFormularioCaracteristicas() {
  const inputId = document.getElementById('caracFormOriginalId');
  const inputName = document.getElementById('caracFormName');
  const btnGuardar = document.getElementById('btnGuardarCaracteristica');

  if (inputId) inputId.value = '';
  if (inputName) inputName.value = '';
  if (btnGuardar) {
    btnGuardar.textContent = 'Guardar Característica';
    btnGuardar.className = 'btn btn-primary';
  }

  cargarTablaCaracteristicasModal();
}

async function cargarTablaCaracteristicasModal() {
  const tbody = document.getElementById('tablaListadoCaracteristicasBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="3" class="tabla-vacia">Cargando características…</td></tr>`;

  try {
    const { data, error } = await supabaseClient
      .from('Caracteristicas')
      .select('id, name_carac')
      .order('id', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      window.listaCaracteristicasSupabaseCache = data;
      renderizarTablaCaracteristicasModal(data);
    } else {
      window.listaCaracteristicasSupabaseCache = [];
      tbody.innerHTML = `<tr><td colspan="3" class="tabla-vacia">No hay características registradas.</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="3" class="tabla-vacia tabla-error">Error al cargar: ${esc(err.message)}</td></tr>`;
  }
}

function renderizarTablaCaracteristicasModal(dataArray) {
  const tbody = document.getElementById('tablaListadoCaracteristicasBody');
  if (!tbody) return;

  if (!dataArray || dataArray.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="tabla-vacia">No hay registros que coincidan.</td></tr>`;
    return;
  }

  let filasHtml = '';
  dataArray.forEach(item => {
    const idVal = item.id;
    const itemJson = encodeURIComponent(JSON.stringify(item));

    filasHtml += `
      <tr id="fila-carac-${idVal}">
        <td class="num">${esc(idVal)}</td>
        <td class="strong">${esc(item.name_carac)}</td>
        <td style="text-align: right; white-space: nowrap;" id="acciones-carac-${idVal}">
          <button type="button" class="btn btn-soft btn-sm btn-icon" title="Editar / Reemplazar" aria-label="Editar / Reemplazar" onclick="cargarCaracteristicaEnFormulario('${itemJson}')"><svg class="i" aria-hidden="true"><use href="#i-wrench"/></svg></button>
          <button type="button" class="btn btn-danger btn-sm btn-icon" title="Eliminar" aria-label="Eliminar" onclick="confirmarEliminarCaracteristica(${idVal})"><svg class="i" aria-hidden="true"><use href="#i-x"/></svg></button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = filasHtml;
}

function toggleBuscadorTablaCaracteristicas() {
  const contenedor = document.getElementById('contenedorInputBusquedaTablaCaracteristicas');
  const input = document.getElementById('inputBusquedaTablaCaracteristicas');
  if (!contenedor) return;

  contenedor.classList.toggle('hidden');
  if (!contenedor.classList.contains('hidden') && input) {
    input.focus();
  }
}

function filtrarTablaCaracteristicasTexto() {
  const input = document.getElementById('inputBusquedaTablaCaracteristicas');
  if (!input || !window.listaCaracteristicasSupabaseCache) return;

  const textoBusqueda = input.value.toLowerCase().trim();
  if (!textoBusqueda) {
    renderizarTablaCaracteristicasModal(window.listaCaracteristicasSupabaseCache);
    return;
  }

  const filtrados = window.listaCaracteristicasSupabaseCache.filter(item => {
    const idStr = String(item.id || '').toLowerCase();
    const nameStr = String(item.name_carac || '').toLowerCase();
    return idStr.includes(textoBusqueda) || nameStr.includes(textoBusqueda);
  });

  renderizarTablaCaracteristicasModal(filtrados);
}

function limpiarYFecharBuscadorTablaCaracteristicas() {
  const input = document.getElementById('inputBusquedaTablaCaracteristicas');
  const contenedor = document.getElementById('contenedorInputBusquedaTablaCaracteristicas');
  if (input) input.value = '';
  if (contenedor) contenedor.classList.add('hidden');
  if (window.listaCaracteristicasSupabaseCache) {
    renderizarTablaCaracteristicasModal(window.listaCaracteristicasSupabaseCache);
  }
}

function cargarCaracteristicaEnFormulario(itemJsonStr) {
  try {
    const item = JSON.parse(decodeURIComponent(itemJsonStr));
    const idVal = item.id;

    document.getElementById('caracFormOriginalId').value = idVal;
    document.getElementById('caracFormName').value = item.name_carac || '';

    const btnGuardar = document.getElementById('btnGuardarCaracteristica');
    if (btnGuardar) {
      btnGuardar.textContent = `Actualizar / Reemplazar (ID: ${idVal})`;
      btnGuardar.className = 'btn btn-warn';
    }

    document.querySelector('#modalCaracteristicasFormulario > div').scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    console.error(e);
  }
}

async function guardarOActualizarCaracteristicaSupabase() {
  const idOriginal = document.getElementById('caracFormOriginalId').value.trim();
  const name_carac = document.getElementById('caracFormName').value.trim();

  if (!name_carac) {
    mostrarToast('Por favor ingresa el nombre de la característica.', 'error');
    return;
  }

  const datosCaracteristica = { name_carac };

  try {
    if (idOriginal) {
      const { error } = await supabaseClient
        .from('Caracteristicas')
        .update(datosCaracteristica)
        .eq('id', Number(idOriginal));

      if (error) throw error;
      mostrarToast('Característica actualizada correctamente');
    } else {
      const { error } = await supabaseClient
        .from('Caracteristicas')
        .insert([datosCaracteristica]);

      if (error) throw error;
      mostrarToast('Característica agregada correctamente');
    }

    reiniciarFormularioCaracteristicas();
  } catch (err) {
    mostrarToast('Error en Supabase: ' + err.message, 'error');
  }
}

function confirmarEliminarCaracteristica(idVal) {
  const celdaAcciones = document.getElementById(`acciones-carac-${idVal}`);
  if (!celdaAcciones) return;

  celdaAcciones.innerHTML = `
    <span style="font-size: 13px; font-weight: 600; margin-right: 8px; color: var(--bad-ink);">¿Eliminar?</span>
    <button type="button" class="btn btn-danger btn-sm btn-icon" title="Confirmar eliminación" aria-label="Confirmar eliminación" onclick="ejecutarEliminarCaracteristica(${idVal})"><svg class="i" aria-hidden="true"><use href="#i-check"/></svg></button>
    <button type="button" class="btn btn-ghost btn-sm btn-icon" title="Cancelar" aria-label="Cancelar" onclick="cancelarEliminarCaracteristica()"><svg class="i" aria-hidden="true"><use href="#i-x"/></svg></button>
  `;
}

async function cancelarEliminarCaracteristica() {
  await cargarTablaCaracteristicasModal();
}

async function ejecutarEliminarCaracteristica(idVal) {
  try {
    const { error } = await supabaseClient
      .from('Caracteristicas')
      .delete()
      .eq('id', Number(idVal));

    if (error) throw error;

    mostrarToast('Característica eliminada correctamente');
    await cargarTablaCaracteristicasModal();
  } catch (err) {
    mostrarToast('Error al eliminar: ' + err.message, 'error');
  }
}

// ============================================================
// GESTIÓN DE DIMENSIONES
// ============================================================

function cerrarModalDimensiones() {
  const modal = document.getElementById('modalDimensionesFormulario');
  if (modal) modal.classList.add('hidden');
}

function reiniciarFormularioDimensiones() {
  document.getElementById('dimFormModel').value = '';
  document.getElementById('dimFormCaracteristica').value = '';
  document.getElementById('dimFormMin').value = '';
  document.getElementById('dimFormNom').value = '';
  document.getElementById('dimFormMax').value = '';
}

async function cargarFiltroModelosDimensiones() {
  const selectFiltro = document.getElementById('filtroModelDimensiones');
  if (!selectFiltro) return;

  try {
    const { data, error } = await supabaseClient
      .from('Dimensiones')
      .select('model');

    if (error) throw error;

    if (data) {
      const modelosUnicos = [...new Set(data.map(item => item.model))].filter(Boolean);
      selectFiltro.innerHTML = '<option value="">-- Selecciona un modelo --</option>';
      modelosUnicos.forEach(model => {
        const opt = document.createElement('option');
        opt.value = model;
        opt.textContent = model;
        selectFiltro.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Error al cargar modelos para el filtro de dimensiones:', err);
  }
}

async function filtrarDimensionesPorModel(modelSeleccionado) {
  const tbody = document.getElementById('tablaListadoDimensionesBody');
  if (!tbody) return;

  if (!modelSeleccionado) {
    tbody.innerHTML = `<tr><td colspan="7" class="tabla-vacia">Selecciona un modelo en el filtro para ver los datos.</td></tr>`;
    return;
  }

  tbody.innerHTML = `<tr><td colspan="7" class="tabla-vacia">Cargando dimensiones…</td></tr>`;

  try {
    const { data, error } = await supabaseClient
      .from('Dimensiones')
      .select('id_caract, model, caracteristica, min, nom, max')
      .eq('model', modelSeleccionado);

    if (error) throw error;

    if (data && data.length > 0) {
      let filasHtml = '';
      data.forEach(item => {
        filasHtml += `
          <tr>
            <td class="num">${esc(item.id_caract)}</td>
            <td class="strong">${esc(item.model)}</td>
            <td>${esc(item.caracteristica)}</td>
            <td class="num">${esc(item.min)}</td>
            <td class="num">${esc(item.nom)}</td>
            <td class="num">${esc(item.max)}</td>
            <td style="text-align: right; white-space: nowrap;">
              <button type="button" class="btn btn-danger btn-sm btn-icon" title="Eliminar" aria-label="Eliminar" onclick="eliminarDimension(${item.id_caract})"><svg class="i" aria-hidden="true"><use href="#i-x"/></svg></button>
            </td>
          </tr>
        `;
      });
      tbody.innerHTML = filasHtml;
    } else {
      tbody.innerHTML = `<tr><td colspan="7" class="tabla-vacia">No hay dimensiones registradas para el modelo ${esc(modelSeleccionado)}.</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="tabla-vacia tabla-error">Error al cargar: ${esc(err.message)}</td></tr>`;
  }
}

async function guardarDimensionSupabase() {
  const model = document.getElementById('dimFormModel').value.trim();
  const caracteristica = document.getElementById('dimFormCaracteristica').value.trim();
  const min = parseFloat(document.getElementById('dimFormMin').value);
  const nom = parseFloat(document.getElementById('dimFormNom').value);
  const max = parseFloat(document.getElementById('dimFormMax').value);

  if (!model || !caracteristica || isNaN(min) || isNaN(nom) || isNaN(max)) {
    mostrarToast('Por favor completa todos los campos correctamente.', 'error');
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('Dimensiones')
      .insert([{ model, caracteristica, min, nom, max }]);

    if (error) throw error;

    mostrarToast('Dimensión guardada correctamente');
    reiniciarFormularioDimensiones();
    await cargarFiltroModelosDimensiones();
    
    const selectFiltro = document.getElementById('filtroModelDimensiones');
    if (selectFiltro && selectFiltro.value === model) {
      filtrarDimensionesPorModel(model);
    }
  } catch (err) {
    mostrarToast('Error al guardar dimensión: ' + err.message, 'error');
  }
}

async function eliminarDimension(idCaract) {
  try {
    const { error } = await supabaseClient
      .from('Dimensiones')
      .delete()
      .eq('id_caract', idCaract);

    if (error) throw error;

    mostrarToast('Dimensión eliminada correctamente');
    const selectFiltro = document.getElementById('filtroModelDimensiones');
    if (selectFiltro) {
      filtrarDimensionesPorModel(selectFiltro.value);
    }
  } catch (err) {
    mostrarToast('Error al eliminar dimensión: ' + err.message, 'error');
  }
}

// ============================================================
// GESTIÓN DE OPERACIONES
// ============================================================

function cerrarModalOperaciones() {
  const modalOp = document.getElementById('modalOperacionesFormulario');
  if (modalOp) modalOp.classList.add('hidden');
}

function actualizarTextoBotonGuardarOp() {
  const btnGuardar = document.getElementById('btnGuardarOperacion');
  if (!btnGuardar) return;
  const editando = window.idOperacionEditando !== null && window.idOperacionEditando !== undefined && window.idOperacionEditando !== '';
  btnGuardar.textContent = editando ? `Actualizar operación (ID: ${window.idOperacionEditando})` : 'Guardar en Operaciones';
  btnGuardar.className = editando ? 'btn btn-warn' : 'btn btn-primary';
}

const CAMPOS_DINAMICOS = {
  ajuste: {
    cont: 'contenedorAjustesDinamicos', clase: 'input-ajuste-item', max: 5,
    msgMax: 'Puedes agregar un máximo de 5 puntos de ajuste.',
    ph: n => `Punto ${n} de ajuste…`, etiqueta: 'Ajuste recomendado',
    fnAdd: 'agregarCampoAjuste', fnDel: 'eliminarCampoAjuste'
  },
  nota: {
    cont: 'contenedorNotasDinamicas', clase: 'input-nota-item', max: 5,
    msgMax: 'Puedes agregar un máximo de 5 puntos en notas.',
    ph: n => `Nota ${n}…`, etiqueta: 'Nota',
    fnAdd: 'agregarCampoNota', fnDel: 'eliminarCampoNota'
  },
  afectacion: {
    cont: 'contenedorAfectacionesDinamicas', clase: 'input-afectacion-item', max: 5,
    msgMax: 'Puedes agregar un máximo de 5 puntos de posibles afectaciones.',
    ph: n => `Posible afectación ${n}…`, etiqueta: 'Afectación',
    fnAdd: 'agregarCampoAfectacion', fnDel: 'eliminarCampoAfectacion'
  }
};

function agregarCampoDinamico(tipo, valor = '') {
  const cfg = CAMPOS_DINAMICOS[tipo];
  const contenedor = document.getElementById(cfg.cont);
  if (!contenedor) return;
  const totalCampos = contenedor.querySelectorAll(`input.${cfg.clase}`).length;
  if (totalCampos >= cfg.max) {
    mostrarToast(cfg.msgMax, 'error');
    return;
  }
  const fila = document.createElement('div');
  fila.className = 'fila-dinamica';
  fila.innerHTML = `
    <input type="text" value="${esc(valor)}" class="${cfg.clase} field-input" placeholder="${esc(cfg.ph(totalCampos + 1))}" aria-label="${cfg.etiqueta}" />
    <button type="button" onclick="${cfg.fnAdd}()" class="btn btn-ghost btn-icon" title="Agregar otro" aria-label="Agregar"><svg class="i" aria-hidden="true"><use href="#i-plus"/></svg></button>
    <button type="button" onclick="${cfg.fnDel}(this)" class="btn btn-danger btn-icon" title="Eliminar" aria-label="Eliminar"><svg class="i" aria-hidden="true"><use href="#i-x"/></svg></button>
  `;
  contenedor.appendChild(fila);
}

function eliminarCampoDinamico(tipo, btn) {
  const cfg = CAMPOS_DINAMICOS[tipo];
  const contenedor = document.getElementById(cfg.cont);
  const fila = btn.closest('.fila-dinamica');
  if (!contenedor || !fila) return;
  if (contenedor.querySelectorAll(`input.${cfg.clase}`).length <= 1) {
    fila.querySelector('input').value = '';
    return;
  }
  fila.remove();
}

function reiniciarCampoDinamico(tipo) {
  const contenedor = document.getElementById(CAMPOS_DINAMICOS[tipo].cont);
  if (!contenedor) return;
  contenedor.innerHTML = '';
  agregarCampoDinamico(tipo);
}

function agregarCampoAjuste(valor = '') { agregarCampoDinamico('ajuste', valor); }
function eliminarCampoAjuste(btn) { eliminarCampoDinamico('ajuste', btn); }
function agregarCampoNota(valor = '') { agregarCampoDinamico('nota', valor); }
function eliminarCampoNota(btn) { eliminarCampoDinamico('nota', btn); }
function agregarCampoAfectacion(valor = '') { agregarCampoDinamico('afectacion', valor); }
function eliminarCampoAfectacion(btn) { eliminarCampoDinamico('afectacion', btn); }

function reiniciarCamposFormularioOperaciones() {
  window.idOperacionEditando = null;
  window.operacionEditandoObj = null;
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

  reiniciarCampoDinamico('ajuste');
  reiniciarCampoDinamico('nota');
  reiniciarCampoDinamico('afectacion');

  if (window.listaOperacionesCacheModal && window.listaOperacionesCacheModal.length > 0) {
    renderizarTablaOperacionesModal(window.listaOperacionesCacheModal);
  }
}

async function cargarListadoOperacionesModal() {
  const tbody = document.getElementById('tablaListadoOperacionesBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="4" class="tabla-vacia">Cargando listado de operaciones…</td></tr>`;

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
      tbody.innerHTML = `<tr><td colspan="4" class="tabla-vacia">No se encontraron operaciones registradas.</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="tabla-vacia tabla-error">Error: ${esc(err.message)}</td></tr>`;
  }
}

function renderizarTablaOperacionesModal(dataArray) {
  const tbody = document.getElementById('tablaListadoOperacionesBody');
  if (!tbody) return;

  if (!dataArray || dataArray.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="tabla-vacia">No hay registros que coincidan.</td></tr>`;
    return;
  }

  let filasHtml = '';
  dataArray.forEach(item => {
    const itemJson = encodeURIComponent(JSON.stringify(item));
    const idVal = item.id_op || '';

    filasHtml += `
      <tr class="fila-click" data-item="${itemJson}" onclick="cargarOperacionEnFormulario(this.dataset.item)">
        <td class="num">${esc(idVal)}</td>
        <td class="strong">${esc(item.operacion_tipo)}</td>
        <td>${esc(item.caracteristica)}</td>
        <td style="text-align: right; white-space: nowrap;" id="acciones-op-${esc(idVal)}" onclick="event.stopPropagation()">
          <button type="button" class="btn btn-danger btn-sm btn-icon" title="Eliminar" aria-label="Eliminar" onclick="confirmarEliminarOperacion('${esc(idVal)}')">
            <svg class="i" aria-hidden="true"><use href="#i-trash"/></svg>
          </button>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = filasHtml;
}

function confirmarEliminarOperacion(idVal) {
  const celdaAcciones = document.getElementById(`acciones-op-${idVal}`);
  if (!celdaAcciones) return;

  celdaAcciones.innerHTML = `
    <span style="font-size: 13px; font-weight: 600; margin-right: 8px; color: var(--bad-ink);">¿Eliminar?</span>
    <button type="button" class="btn btn-danger btn-sm btn-icon" title="Confirmar eliminación" aria-label="Confirmar eliminación" onclick="ejecutarEliminarOperacion('${esc(idVal)}')"><svg class="i" aria-hidden="true"><use href="#i-check"/></svg></button>
    <button type="button" class="btn btn-ghost btn-sm btn-icon" title="Cancelar" aria-label="Cancelar" onclick="cancelarEliminarOperacion()"><svg class="i" aria-hidden="true"><use href="#i-x"/></svg></button>
  `;
}

function cancelarEliminarOperacion() {
  const inputBusqueda = document.getElementById('inputBusquedaTablaOperaciones');
  if (inputBusqueda && inputBusqueda.value.trim() !== '') {
    filtrarTablaOperacionesTexto();
  } else {
    renderizarTablaOperacionesModal(window.listaOperacionesCacheModal);
  }
}

async function ejecutarEliminarOperacion(idVal) {
  try {
    const { error } = await supabaseClient
      .from('operaciones')
      .delete()
      .eq('id_op', idVal);

    if (error) throw error;

    if (String(window.idOperacionEditando) === String(idVal)) {
      reiniciarCamposFormularioOperaciones();
    }

    mostrarToast('Operación eliminada correctamente');
    await cargarListadoOperacionesModal();
    await cargarCaracteristicasOperacionesModal();
  } catch (err) {
    mostrarToast('Error al eliminar: ' + err.message, 'error');
  }
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

function cargarOperacionEnFormulario(itemJsonStr) {
  try {
    const item = JSON.parse(decodeURIComponent(itemJsonStr));
    window.operacionEditandoObj = item;
    window.idOperacionEditando = item.id_op || null; 
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
    if (item.ajustes_recomen) {
      item.ajustes_recomen.split('\n').forEach(linea => {
        const limpia = linea.replace(/^[•\-*\d.]+\s*/, '').trim();
        if (limpia) agregarCampoAjuste(limpia);
      });
    }
    if (contenedorAjustes.querySelectorAll('input').length === 0) agregarCampoAjuste('');

    const contenedorNotas = document.getElementById('contenedorNotasDinamicas');
    contenedorNotas.innerHTML = '';
    if (item.Notas) {
      item.Notas.split('\n').forEach(linea => {
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

    const modalPanel = document.querySelector('#modalOperacionesFormulario .modal-panel');
    if (modalPanel) {
      modalPanel.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } catch (e) {
    console.error("Error al cargar operación en formulario:", e);
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
    aviso.className = 'field-warn';
    aviso.innerHTML = '<svg class="i" aria-hidden="true"><use href="#i-alert"/></svg>Esta dimensión ya está registrada';
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

  if (!window.idOperacionEditando) {
    verificarCaracteristicaDuplicada(caracteristicaVal);
  }

  const inputsAjustes = document.querySelectorAll('#contenedorAjustesDinamicos input.input-ajuste-item');
  let listaAjustesTextos = [];
  inputsAjustes.forEach(input => {
    const val = input.value.trim();
    if (val !== '') listaAjustesTextos.push(`• ${val}`);
  });
  const textoAjustes = listaAjustesTextos.join('\n');

  const inputsNotas = document.querySelectorAll('#contenedorNotasDinamicas input.input-nota-item');
  let listaNotasTextos = [];
  inputsNotas.forEach(input => {
    const val = input.value.trim();
    if (val !== '') listaNotasTextos.push(`• ${val}`);
  });
  const textoNotas = listaNotasTextos.join('\n');

  const inputsAfectaciones = document.querySelectorAll('#contenedorAfectacionesDinamicas input.input-afectacion-item');
  let listaAfectacionesTextos = [];
  inputsAfectaciones.forEach(input => {
    const val = input.value.trim();
    if (val !== '') listaAfectacionesTextos.push(`• ${val}`);
  });
  const textoAfectaciones = listaAfectacionesTextos.join('\n');

  const orig = window.operacionEditandoObj || {};

  const datosOperacion = {
    modelo: orig.modelo !== undefined && orig.modelo !== null ? orig.modelo : "sin dato",
    operacion_tipo,
    caracteristica: caracteristicaVal,
    ajustes_recomen: textoAjustes,
    Notas: textoNotas,
    Ejemplo: document.getElementById('opFormEjemplo').value.trim(),
    posibles_afect: textoAfectaciones,
    g_pbre: document.getElementById('checkGbre').checked,
    g_lhole: document.getElementById('checkGlhole').checked,
    g_vhole: document.getElementById('checkGvhole').checked,
    g_tpos: document.getElementById('checkGtpos').checked,
    g_cret: document.getElementById('checkGcret').checked,
    g_cdep: document.getElementById('checkGcdep').checked,
    g_htkn: document.getElementById('checkGhtkn').checked
  };

  try {
    if (window.idOperacionEditando !== null && window.idOperacionEditando !== undefined && window.idOperacionEditando !== '') {
      const { data, error } = await supabaseClient
        .from('operaciones')
        .update(datosOperacion)
        .eq('id_op', window.idOperacionEditando)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        mostrarToast(`Supabase no actualizó ninguna fila (ID: ${window.idOperacionEditando})`, 'error');
        return;
      }

      mostrarToast('Datos actualizados correctamente');
    } else {
      const { error } = await supabaseClient
        .from('operaciones')
        .insert([datosOperacion]);

      if (error) throw error;
      
      mostrarToast('Datos guardados correctamente');
    }

    reiniciarCamposFormularioOperaciones();
    await cargarListadoOperacionesModal();
    await cargarCaracteristicasOperacionesModal();
  } catch (err) {
    console.error("Error completo de Supabase:", err);
    mostrarToast('Error en Supabase: ' + err.message, 'error');
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

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const abierto = (id) => { const el = document.getElementById(id); return el && !el.classList.contains('hidden'); };
    if (abierto('customAlertModal')) cerrarAlertaElegante();
    else if (abierto('modalNuevoModelo')) cerrarModalNuevoModelo();
    else if (abierto('authModal')) cerrarModalAuth();
    else if (abierto('modalModelosFormulario')) cerrarModalModelos();
    else if (abierto('modalCaracteristicasFormulario')) cerrarModalCaracteristicas();
    else if (abierto('modalDimensionesFormulario')) cerrarModalDimensiones();
    else if (abierto('modalOperacionesFormulario')) cerrarModalOperaciones();
    else if (abierto('modalCardsFormulario')) toggleModalCards();
    else {
      const sidebar = document.getElementById('sidebarDimensional');
      if (sidebar && sidebar.classList.contains('is-open')) togglePanelDimensional();
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

function reiniciarCamposAlCambiarModelo() {
  const ops = ['OP1', 'OP2', 'OP3'];
  ops.forEach(op => {
    const cardId = op === 'OP3' ? 'cardOp3' : (op === 'OP2' ? 'cardOp2' : 'cardOp1');
    const containerId = `cardElementNameInterno${op}`;
    const card = document.getElementById(cardId);
    const container = document.getElementById(containerId);

    if (card) {
      card.classList.remove('seleccionada');
      card.setAttribute('aria-pressed', 'false');
    }
    if (container) {
      container.classList.add('hidden');
    }
  });

  ['elementNameSelectCardOP1', 'elementNameSelectCardOP2', 'elementNameSelectCardOP3', 'elementNameSelect'].forEach(id => {
    const inp = document.getElementById(id);
    if (inp) inp.value = '';
  });

  const inputCarac = document.getElementById('elementNameSelect');
  if (inputCarac) {
    inputCarac.disabled = true;
    inputCarac.placeholder = 'Primero elige una operación';
  }

  const contenedorSpec = document.getElementById('tarjetasEspecificacionContainer');
  if (contenedorSpec) contenedorSpec.classList.add('hidden');

  const panelAjustes = document.getElementById('panelAjustesVerificaciones');
  if (panelAjustes) {
    panelAjustes.classList.add('hidden');
    panelAjustes.style.display = '';
  }

  limpiarMedicionYEstado();
  limpiarPanelAjustesDerecha();
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
          div.className = "dropdown-item opcion-modelo";
          div.textContent = modelo;
          div.dataset.value = modelo;
          div.addEventListener('click', () => {
            inputElement.value = modelo;
            dropdownContainer.classList.add('hidden');
            actualizarClienteYTamanio();
            reiniciarCamposAlCambiarModelo();
            consultarEspecificacionesCaract();
          });
          dropdownContainer.appendChild(div);
        });

        if (filtro.trim() !== '' && !modelosUnicos.some(m => m.toLowerCase() === filtro.toLowerCase())) {
          const divNoEncontrado = document.createElement('div');
          divNoEncontrado.className = 'dropdown-empty';
          const etiquetaNoEncontrado = document.createElement('span');
          etiquetaNoEncontrado.textContent = 'Modelo no encontrado';
          const btnAgregarModelo = document.createElement('button');
          btnAgregarModelo.type = 'button';
          btnAgregarModelo.className = 'btn btn-soft btn-sm';
          btnAgregarModelo.innerHTML = '<svg class="i" aria-hidden="true"><use href="#i-plus"/></svg>Agregar';
          btnAgregarModelo.addEventListener('click', () => abrirModalNuevoModelo(filtro.trim()));
          divNoEncontrado.append(etiquetaNoEncontrado, btnAgregarModelo);
          dropdownContainer.appendChild(divNoEncontrado);
        }

        if (dropdownContainer.children.length > 0) dropdownContainer.classList.remove('hidden');
        else dropdownContainer.classList.add('hidden');
      };

      inputElement.addEventListener('input', (e) => {
        renderDropdown(e.target.value);
        actualizarClienteYTamanio();
        reiniciarCamposAlCambiarModelo();
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
          reiniciarCamposAlCambiarModelo();
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

  if (!modelo) { mostrarToast('Modelo obligatorio.', 'error'); return; }

  try {
    const { error } = await supabaseClient.from('modelos').insert([{ modelo, cliente, tamano }]);
    if (error) throw error;
    mostrarToast('Datos guardados correctamente');
    cerrarModalNuevoModelo();
    document.getElementById('modeloSelect').value = modelo;
    await cargarModelosSupabase();
    actualizarClienteYTamanio();
    reiniciarCamposAlCambiarModelo();
    consultarEspecificacionesCaract();
  } catch (err) {
    mostrarToast('Error: ' + err.message, 'error');
  }
}

function actualizarClienteYTamanio() {
  const inputElement = document.getElementById('modeloSelect');
  const valorSeleccionado = inputElement.value.trim();
  const inputCliente = document.getElementById('clienteInput');
  const inputTamanio = document.getElementById('tamanioInput');
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

  const spanMinima = document.getElementById('valMinText');
  const spanNominal = document.getElementById('valNomText');
  const spanMaxima = document.getElementById('valMaxText');

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
      if (spanMinima) spanMinima.innerHTML = `${registro.min ?? '-'}`;
      if (spanNominal) spanNominal.innerHTML = `${registro.nom ?? '-'}`;
      if (spanMaxima) spanMaxima.innerHTML = `${registro.max ?? '-'}`;
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

function restaurarEscalaNormal() {
  const setWidth = (id, val) => { const el = document.getElementById(id); if (el) el.style.width = val; };
  const setLeft = (id, val) => { const el = document.getElementById(id); if (el) el.style.left = val; };

  setWidth('barraFueraMin', '0%');
  setWidth('barraZonaBaja', '33%');
  setWidth('barraZonaIdeal', '34%');
  setWidth('barraZonaAlta', '33%');
  setWidth('barraFueraMax', '0%');

  setLeft('marcadorMinContainer', '0%');
  setLeft('marcadorMaxContainer', '100%');
  setLeft('labelMinInferior', '0%');
  setLeft('labelMaxInferior', '100%');
  setLeft('marcadorNomContainer', '50%');
  setLeft('pinNominalActual', '50%');
  setLeft('pinPosicionActual', '50%');
  setLeft('tooltipMedidaActual', '50%');
  setLeft('tooltipDesviacionBajoLinea', '50%');
}

function calcularDesviacion() {
  const medicionInput = document.getElementById('medicionInput');
  const spanDesviacion = document.getElementById('desviacionVal');
  const spanDesviacionEscala = document.getElementById('desviacionEscalaVal');
  if (!medicionInput || !spanDesviacion) return;

  let minVal = NaN, nomVal = NaN, maxVal = NaN;
  const contenedorSpec = document.getElementById('tarjetasEspecificacionContainer');
  if (!contenedorSpec) return;

  const spanMin = document.getElementById('valMinText');
  const spanNom = document.getElementById('valNomText');
  const spanMax = document.getElementById('valMaxText');

  if (spanMin && spanNom && spanMax) {
    minVal = parseFloat(spanMin.textContent);
    nomVal = parseFloat(spanNom.textContent);
    maxVal = parseFloat(spanMax.textContent);
  }

  if (document.getElementById('scaleMin')) document.getElementById('scaleMin').textContent = !isNaN(minVal) ? minVal : '-';
  if (document.getElementById('scaleMax')) document.getElementById('scaleMax').textContent = !isNaN(maxVal) ? maxVal : '-';
  if (document.getElementById('scaleNom')) document.getElementById('scaleNom').textContent = !isNaN(nomVal) ? nomVal : '-';

  const medicionText = medicionInput.value.trim();
  const medicionVal = parseFloat(medicionText);

  if (medicionText === "" || isNaN(medicionVal)) {
    spanDesviacion.innerHTML = `-`;
    if (spanDesviacionEscala) spanDesviacionEscala.textContent = `-`;
    restaurarEscalaNormal();
    ocultarEstadoEspecificacion();
    return;
  }

  if (!isNaN(nomVal)) {
    // Cálculo ajustado: Medición actual - Nominal
    const desviacion = medicionVal - nomVal;
    const textoDesviacion = `${desviacion.toFixed(3)} mm`;
    spanDesviacion.textContent = `${desviacion.toFixed(3)} mm`;
    if (spanDesviacionEscala) spanDesviacionEscala.textContent = textoDesviacion;
  }

  const tooltipVal = document.getElementById('tooltipMedidaVal');
  const tooltipContainer = document.getElementById('tooltipMedidaActual');
  const tooltipDesviacionBajoLinea = document.getElementById('tooltipDesviacionBajoLinea');
  const pin = document.getElementById('pinPosicionActual');
  
  if (tooltipVal) tooltipVal.textContent = medicionVal.toFixed(3);

  if (!isNaN(minVal) && !isNaN(maxVal) && pin && tooltipContainer) {
    const rangoSpec = maxVal - minVal;
    if (rangoSpec > 0) {
      let visualMin = minVal;
      let visualMax = maxVal;

      if (medicionVal < minVal) {
        const exceso = minVal - medicionVal;
        visualMin = medicionVal - Math.max(exceso * 0.15, rangoSpec * 0.08);
      } else if (medicionVal > maxVal) {
        const exceso = medicionVal - maxVal;
        visualMax = medicionVal + Math.max(exceso * 0.15, rangoSpec * 0.08);
      }

      const rangoVisualTotal = visualMax - visualMin;

      const posMinPct = ((minVal - visualMin) / rangoVisualTotal) * 100;
      const posMaxPct = ((maxVal - visualMin) / rangoVisualTotal) * 100;
      const anchoSpecPct = posMaxPct - posMinPct;

      const nomEfectivo = !isNaN(nomVal) ? nomVal : (minVal + maxVal) / 2;
      const posNomPct = ((nomEfectivo - visualMin) / rangoVisualTotal) * 100;

      const barraFueraMin = document.getElementById('barraFueraMin');
      const barraZonaBaja = document.getElementById('barraZonaBaja');
      const barraZonaIdeal = document.getElementById('barraZonaIdeal');
      const barraZonaAlta = document.getElementById('barraZonaAlta');
      const barraFueraMax = document.getElementById('barraFueraMax');

      if (barraFueraMin) barraFueraMin.style.width = `${posMinPct}%`;
      if (barraZonaBaja) barraZonaBaja.style.width = `${anchoSpecPct * 0.33}%`;
      if (barraZonaIdeal) barraZonaIdeal.style.width = `${anchoSpecPct * 0.34}%`;
      if (barraZonaAlta) barraZonaAlta.style.width = `${anchoSpecPct * 0.33}%`;
      if (barraFueraMax) barraFueraMax.style.width = `${100 - posMaxPct}%`;

      const marcadorMin = document.getElementById('marcadorMinContainer');
      const marcadorMax = document.getElementById('marcadorMaxContainer');
      const labelMinInf = document.getElementById('labelMinInferior');
      const labelMaxInf = document.getElementById('labelMaxInferior');
      const marcadorNom = document.getElementById('marcadorNomContainer');

      if (marcadorMin) marcadorMin.style.left = `${posMinPct}%`;
      if (marcadorMax) marcadorMax.style.left = `${posMaxPct}%`;
      if (labelMinInf) labelMinInf.style.left = `${posMinPct}%`;
      if (labelMaxInf) labelMaxInf.style.left = `${posMaxPct}%`;
      if (marcadorNom) marcadorNom.style.left = `${Math.max(8, Math.min(92, posNomPct))}%`;
      const pinNominal = document.getElementById('pinNominalActual');
      if (pinNominal) pinNominal.style.left = `${Math.max(0, Math.min(100, posNomPct))}%`;

      let porcentajePin = ((medicionVal - visualMin) / rangoVisualTotal) * 100;
      porcentajePin = Math.max(2, Math.min(98, porcentajePin));

      pin.style.left = `${porcentajePin}%`;
      tooltipContainer.style.left = `${porcentajePin}%`;
      if (tooltipDesviacionBajoLinea) tooltipDesviacionBajoLinea.style.left = `${porcentajePin}%`;
    }
  }

  if (!isNaN(minVal) && !isNaN(maxVal)) {
    mostrarEstadoEspecificacion(medicionVal, minVal, maxVal);
  } else {
    ocultarEstadoEspecificacion();
  }
}

function mostrarEstadoEspecificacion(medicion, min, max) {
  const cardEstado = document.getElementById('estadoEspecificacionCard');
  const textoEstado = document.getElementById('estadoEspecificacionTexto');
  if (!cardEstado || !textoEstado) return;

  const margenCercano = 0.05;
  const fijar = (variante, texto) => {
    cardEstado.className = `estado ${variante}`;
    textoEstado.textContent = texto;
  };

  if (medicion < min) {
    const diferencia = (min - medicion).toFixed(3);
    if (Number(diferencia) <= margenCercano) {
      fijar('estado-warn', `Fuera de especificación: ${diferencia} mm por debajo del límite mínimo`);
    } else {
      fijar('estado-bad', `Fuera de especificación: ${diferencia} mm por debajo del límite mínimo`);
    }
  } else if (medicion > max) {
    const diferencia = (medicion - max).toFixed(3);
    if (Number(diferencia) <= margenCercano) {
      fijar('estado-warn', `Fuera de especificación: ${diferencia} mm por encima del límite máximo`);
    } else {
      fijar('estado-bad', `Fuera de especificación: ${diferencia} mm por encima del límite máximo`);
    }
  } else {
    fijar('estado-ok', 'Dentro de especificación');
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
    
    const activa = key === tipoOp;
    item.card.classList.toggle('seleccionada', activa);
    item.card.setAttribute('aria-pressed', activa ? 'true' : 'false');
    if (item.container) item.container.classList.toggle('hidden', !activa);
  });

  const inputCarac = document.getElementById('elementNameSelect');
  if (inputCarac) inputCarac.disabled = false;

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
        const textoAjusteCrudo = op.ajustes_recomen || '-';
        if (textoAjusteCrudo !== '-') {
          const lineasAjuste = textoAjusteCrudo.split('\n')
            .map(l => l.replace(/^[•\-*\d.]+\s*/, '').trim())
            .filter(Boolean);
          
          txtAjustes.innerHTML = lineasAjuste.length > 0
            ? lineasAjuste.map(item => `<div class="item">${esc(item)}</div>`).join('')
            : '-';
        } else {
          txtAjustes.textContent = '-';
        }
      }
      
      if (txtEjemplo) txtEjemplo.textContent = op.Ejemplo ? `Objetivo: ${op.Ejemplo}` : 'Objetivo: -';

      const contenedorNotasPadre = document.getElementById('panelNotas');
      const txtNotas = document.getElementById('txtNotasVisual');
      if (txtNotas && contenedorNotasPadre) {
        const textoNotasCrudo = op.Notas || '';
        const lineasNotas = textoNotasCrudo.split('\n')
          .map(l => l.replace(/^[•\-*\d.]+\s*/, '').trim())
          .filter(Boolean);

        if (lineasNotas.length > 0) {
          txtNotas.innerHTML = lineasNotas.map(item => `<div class="item">${esc(item)}</div>`).join('');
          contenedorNotasPadre.style.display = ''; 
        } else {
          txtNotas.textContent = '-';
          contenedorNotasPadre.style.display = 'none'; 
        }
      }

      const contenedorAfectacionesPadre = document.getElementById('panelAfectaciones');
      const txtAfect = document.getElementById('txtPosiblesAfect');
      if (txtAfect && contenedorAfectacionesPadre) {
        const textoAfectCrudo = op.posibles_afect || '';
        const afects = textoAfectCrudo.split('\n')
          .map(a => a.replace(/^[•\-*\d.]+\s*/, '').trim())
          .filter(Boolean);

        if (afects.length > 0) {
          txtAfect.innerHTML = afects.map(a => `
            <div class="afect-item">
              <span>${esc(a)}</span>
              <span class="afect-tag">Activo</span>
            </div>
          `).join('');
          contenedorAfectacionesPadre.style.display = ''; 
        } else {
          contenedorAfectacionesPadre.style.display = 'none'; 
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
  if (txtAfect) txtAfect.innerHTML = '';

  const contenedorNotasPadre = document.getElementById('panelNotas');
  if (contenedorNotasPadre) contenedorNotasPadre.style.display = 'none';

  const contenedorAfectacionesPadre = document.getElementById('panelAfectaciones');
  if (contenedorAfectacionesPadre) contenedorAfectacionesPadre.style.display = 'none';
}

let valorTemporal = "";

function abrirTeclado() {
  const miniTeclado = document.getElementById('miniTeclado');
  const medicionInput = document.getElementById('medicionInput');
  if (miniTeclado) miniTeclado.classList.remove('hidden');
  if (medicionInput) {
    valorTemporal = medicionInput.value || "";
    medicionInput.focus({ preventScroll: true });
  }
}

function cerrarTeclado() {
  const miniTeclado = document.getElementById('miniTeclado');
  const medicionInput = document.getElementById('medicionInput');
  if (miniTeclado) miniTeclado.classList.add('hidden');
  if (medicionInput) medicionInput.blur();
}

function agregarNumero(num) {
  if (num === '.' && valorTemporal.includes('.')) return;
  if (num === '.' && valorTemporal === '') valorTemporal = '0';
  valorTemporal += num;
  const input = document.getElementById('medicionInput');
  if (input) input.value = valorTemporal;
  calcularDesviacion();
}

function borrarUltimo() {
  if (valorTemporal.length > 0) {
    valorTemporal = valorTemporal.slice(0, -1);
    const input = document.getElementById('medicionInput');
    if (input) input.value = valorTemporal;
    calcularDesviacion();
  }
}

function limpiarTodoTeclado() {
  valorTemporal = "";
  const input = document.getElementById('medicionInput');
  if (input) input.value = "";
  calcularDesviacion();
}

function confirmarMedicion() {
  cerrarTeclado();
  calcularDesviacion();
}

function togglePanelDimensional(event) {
  if (event) event.stopPropagation();
  const sidebar = document.getElementById('sidebarDimensional');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar) return;

  const abrir = !sidebar.classList.contains('is-open');
  sidebar.classList.toggle('is-open', abrir);
  if (overlay) overlay.classList.toggle('is-open', abrir);

  const contenedor = document.getElementById('listaCeldasVertical');
  if (abrir && contenedor && contenedor.children.length === 0) {
    let htmlCards = '';
    for (let i = 1; i <= 36; i++) {
      if (i === 31 || i === 32) continue;
      const nombreCelda = 'C' + String(i).padStart(2, '0');
      htmlCards += `<button type="button" class="celda-chip" onclick="seleccionarCeldaSidebar('${nombreCelda}')">${nombreCelda}</button>`;
    }
    contenedor.innerHTML = htmlCards;
  }
}

async function seleccionarCeldaSidebar(nombreCelda) {
  const sidebar = document.getElementById('sidebarDimensional');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('is-open');
  if (overlay) overlay.classList.remove('is-open');

  const grid = document.getElementById('gridPrincipalContenedores');
  if (grid) grid.classList.add('modo-historial');

  const seccionHistorial = document.getElementById('seccionHistorialPdf');
  if (!seccionHistorial) return;

  seccionHistorial.className = 'sheet';

  const encabezado = `
    <div id="headerHistorialInfo" class="hist-head">
      <div class="hist-title">
        <svg class="i" aria-hidden="true"><use href="#i-forms"/></svg>
        <h3>Historial de dimensionales · ${esc(nombreCelda)}</h3>
      </div>
      <button type="button" onclick="regresarVistaOriginalAjustes()" class="btn btn-ghost btn-sm"><svg class="i" aria-hidden="true"><use href="#i-back"/></svg>Volver</button>
    </div>
  `;

  seccionHistorial.innerHTML = `${encabezado}<div class="tabla-vacia">Cargando registros de ${esc(nombreCelda)}…</div>`;

  try {
    const { data, error } = await supabaseClient
      .from('historial_celdas')
      .select('id, celda, nombre_archivo, url_archivo, fecha_str, fecha_original')
      .eq('celda', nombreCelda);

    if (error) throw error;

    let filasHtml = '';
    if (data && data.length > 0) {
      data.forEach(item => {
        const linkArchivo = item.url_archivo ? item.url_archivo : '#';
        const nombreTxt = item.nombre_archivo ? item.nombre_archivo : 'Ver documento';
        filasHtml += `
          <tr>
            <td class="num">${esc(item.id)}</td>
            <td class="strong">${esc(item.celda)}</td>
            <td>
              <a href="#" class="doc-link" data-url="${esc(linkArchivo)}" data-nombre="${esc(nombreTxt)}" onclick="visualizarPdfContenedor(this.dataset.url, this.dataset.nombre, event)"><svg class="i" aria-hidden="true"><use href="#i-file"/></svg>${esc(nombreTxt)}</a>
            </td>
            <td>${esc(item.fecha_str)}</td>
            <td class="num">${esc(item.fecha_original)}</td>
          </tr>
        `;
      });
    } else {
      filasHtml = `<tr><td colspan="5" class="tabla-vacia">No hay registros para la celda ${esc(nombreCelda)}.</td></tr>`;
    }

    seccionHistorial.innerHTML = `
      ${encabezado}
      <div id="bloqueTablaHistorial">
        <div class="table-wrap table-tall">
          <table class="table">
            <thead>
              <tr><th>Id</th><th>Celda</th><th>Documento</th><th>Fecha y hora</th><th>Serial</th></tr>
            </thead>
            <tbody>${filasHtml}</tbody>
          </table>
        </div>
      </div>

      <div id="visorPdfContenedor" class="pdf-viewer hidden">
        <div class="pdf-viewer-bar">
          <span id="tituloPdfVisualizando" class="pdf-viewer-title">Documento PDF</span>
          <button type="button" onclick="cerrarVisorPdfYMostrarTabla()" class="btn btn-ghost btn-sm"><svg class="i" aria-hidden="true"><use href="#i-back"/></svg>Regresar a la tabla</button>
        </div>
        <iframe id="iframePdfViewer" src="" title="Documento PDF"></iframe>
      </div>
    `;
  } catch (err) {
    seccionHistorial.innerHTML = `${encabezado}<div class="estado estado-bad">No se pudo consultar el historial de la celda ${esc(nombreCelda)}. Revisa la conexión e inténtalo de nuevo.</div>`;
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
  if (!urlArchivo || urlArchivo === '#') { mostrarToast('La URL del archivo no es válida.', 'error'); return; }

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
  const grid = document.getElementById('gridPrincipalContenedores');
  const seccionHistorial = document.getElementById('seccionHistorialPdf');
  const seccionOriginal = document.getElementById('seccionAjustesOriginal');
  const iframeViewer = document.getElementById('iframePdfViewer');

  if (iframeViewer) iframeViewer.src = '';
  if (grid) grid.classList.remove('modo-historial');
  if (seccionHistorial) seccionHistorial.classList.add('hidden');
  if (seccionOriginal) seccionOriginal.classList.remove('hidden');
}

function mostrarContenidoAjustes() {
  regresarVistaOriginalAjustes();
}
