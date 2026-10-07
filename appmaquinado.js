// Inicialización de Supabase con tus credenciales
const SUPABASE_URL = 'https://oycvzlnwwhpdlmmofrhd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_1NwNxqZ7zkQXIFRUkn6G3A_RGIdZbHP';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Variable para almacenar el estado de sesión actual
window.sesionActual = null;

// Función para inicializar dinámicamente los botones del mini teclado numérico
function inicializarTecladoNumerico() {
  const gridContainer = document.getElementById('gridTecladoContainer');
  if (!gridContainer) return;

  const botones = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
  
  let htmlBotones = '';
  botones.forEach(btn => {
    if (btn === '⌫') {
      htmlBotones += `<button type="button" onclick="borrarUltimo()" class="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 py-2 rounded-xl active:scale-95 transition">${btn}</button>`;
    } else {
      htmlBotones += `<button type="button" onclick="agregarNumero('${btn}')" class="bg-slate-50 hover:bg-slate-100 border border-slate-200 py-2 rounded-xl active:scale-95 transition">${btn}</button>`;
    }
  });

  gridContainer.innerHTML = htmlBotones;
}

// Función para verificar sesión activa al cargar la página o iniciar sesión como invitado por defecto
async function verificarSesionInicial() {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
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

  if (userInfoContainer && userEmailSpan) {
    userInfoContainer.classList.remove('hidden');
    userEmailSpan.textContent = email;
  }

  if (email && email.toLowerCase() === 'admin@appam.com') {
    authBtn.innerHTML = '🚪';
    authBtn.title = 'Cerrar Sesión';
    authBtn.className = "bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-xl text-sm transition shadow-sm";
    if (btnMapear) {
      btnMapear.classList.remove('hidden');
      btnMapear.style.display = 'inline-flex';
    }
  } else {
    authBtn.innerHTML = '🔑';
    authBtn.title = 'Iniciar Sesión Admin';
    authBtn.className = "bg-slate-900 hover:bg-blue-600 text-white font-bold px-3 py-2 rounded-xl text-sm transition shadow-sm";
    if (btnMapear) {
      btnMapear.classList.add('hidden');
      btnMapear.style.display = 'none';
    }
  }
}

function manejarBotonAuth() {
  if (window.sesionActual && window.sesionActual.toLowerCase() === 'admin@appam.com') {
    supabaseClient.auth.signOut().then(() => {
      loginComoInvitadoAutomatico();
    });
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
  inicializarTecladoNumerico(); // Inyecta el teclado dinámicamente
  verificarSesionInicial();
  cargarModelosSupabase();
  cargarDatosMapaSupabase(); 

  const loginEmailInput = document.getElementById('loginEmail');
  if (loginEmailInput) {
    loginEmailInput.addEventListener('input', (e) => {
      const val = e.target.value.trim().toLowerCase();
      const pwdContainer = document.getElementById('passwordContainer');
      if (val === 'admin@appam.com') {
        pwdContainer.classList.remove('hidden');
      } else {
        pwdContainer.classList.add('hidden');
      }
    });
  }

  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const loginPasswordInput = document.getElementById('loginPassword');

  if (togglePasswordBtn && loginPasswordInput) {
    const mostrarPassword = () => { loginPasswordInput.type = 'text'; };
    const ocultarPassword = () => { loginPasswordInput.type = 'password'; };

    togglePasswordBtn.addEventListener('mousedown', mostrarPassword);
    togglePasswordBtn.addEventListener('mouseup', ocultarPassword);
    togglePasswordBtn.addEventListener('mouseleave', ocultarPassword);

    togglePasswordBtn.addEventListener('touchstart', (e) => { e.preventDefault(); mostrarPassword(); });
    togglePasswordBtn.addEventListener('touchend', (e) => { e.preventDefault(); ocultarPassword(); });
  }

  const datosMapaInput = document.getElementById('listaDatosMapaInput');
  const datalistDatosMapa = document.getElementById('listaDatosMapa');

  if (datosMapaInput && datalistDatosMapa) {
    const mostrarTodasLasOpcionesDatos = () => {
      datosMapaInput.value = '';
      if (window.listaDatosMapaCache && window.listaDatosMapaCache.length > 0) {
        datalistDatosMapa.innerHTML = '';
        window.listaDatosMapaCache.forEach(carac => {
          const option = document.createElement('option');
          option.value = carac;
          datalistDatosMapa.appendChild(option);
        });
      }
    };
    datosMapaInput.addEventListener('focus', mostrarTodasLasOpcionesDatos);
    datosMapaInput.addEventListener('click', mostrarTodasLasOpcionesDatos);
  }

  const elementInput = document.getElementById('elementNameSelect');
  const datalistElement = document.getElementById('listaElementos');

  if (elementInput) {
    elementInput.addEventListener('focus', () => {
      elementInput.value = '';
      if (window.listaCaracteristicasCache && window.listaCaracteristicasCache.length > 0) {
        datalistElement.innerHTML = '';
        window.listaCaracteristicasCache.forEach(carac => {
          const option = document.createElement('option');
          option.value = carac;
          datalistElement.appendChild(option);
        });
      }
    });

    elementInput.addEventListener('input', () => {
      limpiarMedicionYEstado();
      consultarEspecificacionesCaract();
      manejarSeleccionElemento(elementInput.value.trim());
    });
    
    elementInput.addEventListener('change', () => {
      limpiarMedicionYEstado();
      consultarEspecificacionesCaract();
      manejarSeleccionElemento(elementInput.value.trim());
      elementInput.blur();
    });
  }
});

async function ejecutarLoginSupabase() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!email) {
    alert('Por favor ingrese un correo electrónico.');
    return;
  }

  if (email.toLowerCase() === 'admin@appam.com' && !password) {
    alert('Por favor ingrese la contraseña de administrador.');
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password || 'guestpassword123'
    });

    if (error) throw error;

    cerrarModalAuth();
    actualizarInterfazUsuario(data.user.email);
  } catch (err) {
    console.error('Error de autenticación:', err.message);
    alert('Error al iniciar sesión: Verifique sus credenciales en Supabase Auth.');
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

        if (filtrados.length > 0) {
          filtrados.forEach(modelo => {
            const div = document.createElement('div');
            div.className = "px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition";
            div.textContent = modelo;
            div.addEventListener('click', () => {
              inputElement.value = modelo;
              dropdownContainer.classList.add('hidden');
              actualizarClienteYTamanio();
              limpiarMedicionYEstado();
              consultarEspecificacionesCaract();
            });
            dropdownContainer.appendChild(div);
          });
        }

        if (filtro.trim() !== '' && !modelosUnicos.some(m => m.toLowerCase() === filtro.toLowerCase())) {
          const divNoEncontrado = document.createElement('div');
          divNoEncontrado.className = "p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs";
          divNoEncontrado.innerHTML = `
            <span class="text-slate-500 italic">Modelo no encontrado</span>
            <button type="button" onclick="abrirModalNuevoModelo('${filtro.trim()}')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold w-6 h-6 rounded-lg flex items-center justify-center transition shadow-2xs" title="Agregar modelo">
              +
            </button>
          `;
          dropdownContainer.appendChild(divNoEncontrado);
        }

        if (dropdownContainer.children.length > 0) {
          dropdownContainer.classList.remove('hidden');
        } else {
          dropdownContainer.classList.add('hidden');
        }
      };

      inputElement.addEventListener('input', (e) => {
        renderDropdown(e.target.value);
        actualizarClienteYTamanio();
        limpiarMedicionYEstado();
        consultarEspecificacionesCaract();
      });

      inputElement.addEventListener('focus', (e) => {
        renderDropdown(e.target.value);
      });

      document.addEventListener('click', (e) => {
        if (!inputElement.contains(e.target) && !dropdownContainer.contains(e.target)) {
          dropdownContainer.classList.add('hidden');
        }
      });
    }
  } catch (err) {
    console.error('Error al cargar modelos de Supabase:', err);
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

  if (!modelo) {
    alert('El campo modelo es obligatorio.');
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('modelos')
      .insert([{ modelo, cliente, tamano }]);

    if (error) throw error;

    alert('¡Modelo agregado exitosamente!');
    cerrarModalNuevoModelo();

    document.getElementById('modeloSelect').value = modelo;
    
    await cargarModelosSupabase();
    actualizarClienteYTamanio();
    limpiarMedicionYEstado();
    consultarEspecificacionesCaract();

  } catch (err) {
    console.error('Error al guardar el nuevo modelo:', err.message);
    alert('Error al guardar en Supabase: ' + err.message);
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
    console.error('Error al cargar características para el campo DATOS:', err);
  }
}

function actualizarClienteYTamanio() {
  const inputElement = document.getElementById('modeloSelect');
  const valorSeleccionado = inputElement.value.trim();
  const inputsFila = inputElement.closest('.grid').querySelectorAll('input');
  const inputCliente = inputsFila[1];
  const inputTamanio = inputsFila[2];

  if (!window.modelosDataMap) return;

  const encontrado = window.modelosDataMap.find(item => item.modelo === valorSeleccionado);
  if (encontrado) {
    inputCliente.value = encontrado.cliente || '';
    inputTamanio.value = encontrado.tamano || '';
  } else {
    inputCliente.value = '';
    inputTamanio.value = '';
  }
}

function limpiarMedicionYEstado() {
  const medicionInput = document.getElementById('medicionInput');
  if (medicionInput) medicionInput.value = '';
  valorTemporal = "";
  ocultarEstadoEspecificacion();
}

async function consultarEspecificacionesCaract() {
  const modeloInput = document.getElementById('modeloSelect');
  const elementInput = document.getElementById('elementNameSelect');

  const modeloVal = modeloInput.value.trim();
  const caracteristicaVal = elementInput.value.trim();

  const contenedoresEspecificacion = document.querySelectorAll('.grid.grid-cols-4.gap-2.text-center > div');
  if (contenedoresEspecificacion.length < 3) return;

  const spanMinima = contenedoresEspecificacion[0].querySelector('span.text-sm');
  const spanNominal = contenedoresEspecificacion[1].querySelector('span.text-sm');
  const spanMaxima = contenedoresEspecificacion[2].querySelector('span.text-sm');

  if (!modeloVal || !caracteristicaVal || 
      caracteristicaVal.startsWith('Seleccione') || 
      caracteristicaVal.startsWith('Cargando') || 
      caracteristicaVal.startsWith('No hay')) {
    ocultarEstadoEspecificacion();
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('caract')
      .select('min, nom, max, model, caracteristica')
      .ilike('model', modeloVal)
      .ilike('caracteristica', caracteristicaVal);

    if (error) throw error;

    if (data && data.length > 0) {
      const registro = data[0];
      const minVal = registro.min !== null && registro.min !== undefined ? registro.min : '-';
      const nomVal = registro.nom !== null && registro.nom !== undefined ? registro.nom : '-';
      const maxVal = registro.max !== null && registro.max !== undefined ? registro.max : '-';

      spanMinima.innerHTML = `${minVal} <span class="text-[10px] font-normal text-slate-500">mm</span>`;
      spanNominal.innerHTML = `${nomVal} <span class="text-[10px] font-normal text-slate-500">mm</span>`;
      spanMaxima.innerHTML = `${maxVal} <span class="text-[10px] font-normal text-slate-500">mm</span>`;

      calcularDesviacion();
    } else {
      spanMinima.innerHTML = `- <span class="text-[10px] font-normal text-slate-500">mm</span>`;
      spanNominal.innerHTML = `- <span class="text-[10px] font-normal text-slate-500">mm</span>`;
      spanMaxima.innerHTML = `- <span class="text-[10px] font-normal text-slate-500">mm</span>`;
      ocultarEstadoEspecificacion();
    }
  } catch (err) {
    console.error('Error al consultar la tabla caract:', err);
    ocultarEstadoEspecificacion();
  }
}

function calcularDesviacion() {
  const medicionInput = document.getElementById('medicionInput');
  const contenedoresEspecificacion = document.querySelectorAll('.grid.grid-cols-4.gap-2.text-center > div');
  
  if (contenedoresEspecificacion.length < 3) return;

  const spanMinima = contenedoresEspecificacion[0].querySelector('span.text-sm');
  const spanNominal = contenedoresEspecificacion[1].querySelector('span.text-sm');
  const spanMaxima = contenedoresEspecificacion[2].querySelector('span.text-sm');
  const spanDesviacion = document.getElementById('desviacionVal');
  const footerDesviacion = document.getElementById('footerDesviacionText');

  if (!medicionInput || !spanNominal || !spanDesviacion) return;

  const minVal = parseFloat(spanMinima.textContent.replace('mm', '').trim());
  const nominalVal = parseFloat(spanNominal.textContent.replace('mm', '').trim());
  const maxVal = parseFloat(spanMaxima.textContent.replace('mm', '').trim());
  const medicionText = medicionInput.value.trim();
  const medicionVal = parseFloat(medicionText);

  if (medicionText === "") {
    spanDesviacion.innerHTML = `-`;
    if (footerDesviacion) footerDesviacion.innerHTML = `<b>Desviación:</b> -`;
    ocultarEstadoEspecificacion();
    return;
  }

  if (!isNaN(nominalVal) && !isNaN(medicionVal)) {
    const desviacion = medicionVal - nominalVal;
    spanDesviacion.innerHTML = `${desviacion.toFixed(3)} <span class="text-[10px] font-normal text-slate-500">mm</span>`;
    if (footerDesviacion) footerDesviacion.innerHTML = `<b>Desviación:</b> ${desviacion.toFixed(3)} mm`;

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
  const toleranciaLimite = 0.002;

  if (medicion < min) {
    cardEstado.className = "px-4 py-2.5 rounded-xl text-xs font-bold text-center border bg-red-50 text-red-700 border-red-200 shadow-2xs";
    textoEstado.textContent = "❌ Fuera de especificación (Por debajo del límite Mínimo)";
  } else if (medicion > max) {
    cardEstado.className = "px-4 py-2.5 rounded-xl text-xs font-bold text-center border bg-red-50 text-red-700 border-red-200 shadow-2xs";
    textoEstado.textContent = "❌ Fuera de especificación (Por encima del límite Máximo)";
  } else if (Math.abs(medicion - min) <= toleranciaLimite) {
    cardEstado.className = "px-4 py-2.5 rounded-xl text-xs font-bold text-center border bg-amber-50 text-amber-800 border-amber-200 shadow-2xs";
    textoEstado.textContent = "⚠ Dentro de especificación (Al límite de la Mínima)";
  } else if (Math.abs(medicion - max) <= toleranciaLimite) {
    cardEstado.className = "px-4 py-2.5 rounded-xl text-xs font-bold text-center border bg-amber-50 text-amber-800 border-amber-200 shadow-2xs";
    textoEstado.textContent = "⚠ Dentro de especificación (Al límite de la Máxima)";
  } else {
    cardEstado.className = "px-4 py-2.5 rounded-xl text-xs font-bold text-center border bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs";
    textoEstado.textContent = "✅ Dentro de especificación";
  }
}

function ocultarEstadoEspecificacion() {
  const cardEstado = document.getElementById('estadoEspecificacionCard');
  if (cardEstado) cardEstado.classList.add('hidden');
}

window.listaCaracteristicasCache = [];

async function cargarOperacionesPorTipo(tipoOp) {
  const inputElement = document.getElementById('elementNameSelect');
  const datalistElement = document.getElementById('listaElementos');
  if (!inputElement || !datalistElement) return;

  inputElement.value = '';
  limpiarMedicionYEstado();
  inputElement.placeholder = "Cargando características...";
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
        inputElement.placeholder = `No hay características para ${tipoOp}`;
        return;
      }

      inputElement.placeholder = "Escriba o seleccione característica...";
      caracteristicasUnicas.forEach(carac => {
        const option = document.createElement('option');
        option.value = carac;
        datalistElement.appendChild(option);
      });
    } else {
      datalistElement.innerHTML = `<option value="No se encontraron datos para ${tipoOp}">`;
      inputElement.placeholder = `No se encontraron datos para ${tipoOp}`;
    }
  } catch (err) {
    console.error(`Error al consultar operaciones ${tipoOp}:`, err);
    datalistElement.innerHTML = '<option value="Error al cargar datos">';
    inputElement.placeholder = "Error al cargar datos";
  }
}

function seleccionarOperacion(tipoOp) {
  const cards = {
    'OP1': document.getElementById('cardOp1'),
    'OP2': document.getElementById('cardOp2'),
    'OP3': document.getElementById('cardOp3')
  };

  Object.keys(cards).forEach(key => {
    const card = cards[key];
    if (!card) return;
    const spanTag = card.querySelector('span');
    const titleTag = card.querySelectorAll('span')[1];
    const opLabelText = key === 'OP1' ? 'Op 1' : key === 'OP2' ? 'Op 2' : 'Op 3';

    if (key === tipoOp) {
      card.className = "bg-blue-50 p-3 rounded-xl border border-blue-300 shadow-2xs cursor-pointer flex flex-col justify-between ring-1 ring-blue-300";
      spanTag.className = "text-[10px] font-bold text-blue-600 uppercase flex items-center justify-between";
      spanTag.innerHTML = `${opLabelText} <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block"></span>`;
      titleTag.className = "text-xs font-bold text-blue-900 mt-1";
    } else {
      card.className = "bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs hover:border-blue-300 transition cursor-pointer flex flex-col justify-between";
      spanTag.className = "text-[10px] font-bold text-slate-400 uppercase";
      spanTag.textContent = opLabelText;
      titleTag.className = "text-xs font-bold text-slate-800 mt-1";
    }
  });

  cargarOperacionesPorTipo(tipoOp);
}

async function manejarSeleccionElemento(caracteristicaVal) {
  const parteRinInput = document.getElementById('parteRinInput');
  const layerVistaInicial = document.getElementById('puntosVistaInicialLayer');
  
  if (!parteRinInput || !layerVistaInicial) return;
  layerVistaInicial.innerHTML = '';

  if (!caracteristicaVal || caracteristicaVal.startsWith('Seleccione') || caracteristicaVal.startsWith('Cargando')) {
    parteRinInput.value = '';
    return;
  }

  parteRinInput.value = caracteristicaVal;

  try {
    const { data, error } = await supabaseClient
      .from('mapeo_puntos_rin')
      .select('*')
      .ilike('caracteristica', caracteristicaVal);

    if (error) throw error;

    if (data && data.length > 0) {
      const registro = data[data.length - 1];
      const puntosAMostrar = [];

      if (registro.punto_1_x !== null && registro.punto_1_y !== null) {
        puntosAMostrar.push({ x: registro.punto_1_x, y: registro.punto_1_y });
      }
      if (registro.punto_2_x !== null && registro.punto_2_y !== null) {
        puntosAMostrar.push({ x: registro.punto_2_x, y: registro.punto_2_y });
      }

      puntosAMostrar.forEach((p, index) => {
        const puntoFijo = document.createElement('div');
        puntoFijo.className = 'absolute w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[10px] font-bold text-white';
        puntoFijo.style.left = `${p.x}%`;
        puntoFijo.style.top = `${p.y}%`;
        puntoFijo.textContent = index + 1;
        layerVistaInicial.appendChild(puntoFijo);
      });
    }
  } catch (err) {
    console.error('Error al consultar puntos mapeados:', err);
  }
}

let valorTemporal = "";

function abrirTeclado() {
  const teclado = document.getElementById('miniTeclado');
  valorTemporal = document.getElementById('medicionInput').value || "";
  teclado.classList.remove('hidden');
}

function cerrarTeclado() {
  document.getElementById('miniTeclado').classList.add('hidden');
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

function mostrarContenedorMapeo() {
  document.getElementById('vistaInicialRinContainer').classList.add('hidden');
  document.getElementById('mapaRinContenedorCompleto').classList.remove('hidden');
}

function ocultarContenedorMapeo() {
  document.getElementById('mapaRinContenedorCompleto').classList.add('hidden');
  document.getElementById('vistaInicialRinContainer').classList.remove('hidden');
}

let puntosSeleccionados = [];

function cambiarModoPuntos() {
  puntosSeleccionados = [];
  document.getElementById('puntosMapaLayer').innerHTML = '';
}

function limpiarPuntosMapa() {
  puntosSeleccionados = [];
  document.getElementById('puntosMapaLayer').innerHTML = '';
}

function colocarPuntoMapa(event) {
  const container = document.getElementById('mapaRinContainer');
  const layer = document.getElementById('puntosMapaLayer');
  const maxPuntos = parseInt(document.getElementById('modoPuntosSelect').value);
  const rect = container.getBoundingClientRect();
  
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  if (puntosSeleccionados.length >= maxPuntos) {
    puntosSeleccionados = [];
    layer.innerHTML = '';
  }

  puntosSeleccionados.push({ x, y });

  layer.innerHTML = '';
  puntosSeleccionados.forEach((p, index) => {
    const puntoFijo = document.createElement('div');
    puntoFijo.className = 'absolute w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[10px] font-bold text-white';
    puntoFijo.style.left = `${p.x}%`;
    puntoFijo.style.top = `${p.y}%`;
    puntoFijo.textContent = index + 1;
    layer.appendChild(puntoFijo);
  });
}

async function guardarPuntosSupabase() {
  const caracteristicaMapaVal = document.getElementById('listaDatosMapaInput').value.trim();
  const modoSelect = document.getElementById('modoPuntosSelect').value;

  if (!caracteristicaMapaVal) {
    alert('Por favor ingresa o selecciona un valor en el campo de Datos.');
    return;
  }

  if (puntosSeleccionados.length === 0) {
    alert('Debes marcar al menos un punto en el mapa del rin.');
    return;
  }

  const datosGuardar = {
    caracteristica: caracteristicaMapaVal,
    tipo_puntos: parseInt(modoSelect),
    punto_1_x: puntosSeleccionados[0] ? parseFloat(puntosSeleccionados[0].x.toFixed(2)) : null,
    punto_1_y: puntosSeleccionados[0] ? parseFloat(puntosSeleccionados[0].y.toFixed(2)) : null,
    punto_2_x: puntosSeleccionados[1] ? parseFloat(puntosSeleccionados[1].x.toFixed(2)) : null,
    punto_2_y: puntosSeleccionados[1] ? parseFloat(puntosSeleccionados[1].y.toFixed(2)) : null,
    created_at: new Date()
  };

  try {
    const { error } = await supabaseClient.from('mapeo_puntos_rin').insert([datosGuardar]);
    if (error) throw error;
    alert('¡Posicionamiento guardado correctamente en Supabase!');
  } catch (err) {
    console.error('Error al guardar en Supabase:', err.message);
    alert('Error al guardar en la base de datos: ' + err.message);
  }
}

// --- SIDEBAR DIMENSIONAL Y TABLA HISTORIAL (C01 a C36, omitiendo C31 y C32) ---
function togglePanelDimensional(event) {
  if (event) event.stopPropagation();
  const sidebar = document.getElementById('sidebarDimensional');
  sidebar.classList.toggle('translate-x-full');
  
  const contenedor = document.getElementById('listaCeldasVertical');
  if (!sidebar.classList.contains('translate-x-full') && contenedor.children.length === 0) {
    let htmlCards = '';
    for (let i = 1; i <= 36; i++) {
      if (i === 31 || i === 32) continue; // Omitir C31 y C32
      
      let numeroStr = i < 10 ? '0' + i : '' + i;
      let nombreCelda = 'C' + numeroStr;
      
      htmlCards += `
        <div onclick="seleccionarCeldaSidebar('${nombreCelda}')" class="bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 py-2 px-3 rounded-xl text-center cursor-pointer transition shadow-2xs">
          <span class="text-xs font-bold text-slate-700 hover:text-blue-600">${nombreCelda}</span>
        </div>
      `;
    }
    contenedor.innerHTML = htmlCards;
  }
}

async function seleccionarCeldaSidebar(nombreCelda) {
  const sidebar = document.getElementById('sidebarDimensional');
  sidebar.classList.add('translate-x-full');

  const seccionOriginal = document.getElementById('seccionAjustesOriginal');
  if (seccionOriginal) seccionOriginal.classList.add('hidden');

  const seccionHistorial = document.getElementById('seccionHistorialPdf');
  if (seccionHistorial) {
    seccionHistorial.classList.remove('hidden');
    seccionHistorial.innerHTML = `
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center gap-2">
          <span class="text-base">📋</span>
          <h3 class="font-bold text-slate-900 text-sm">Historial de dimensionales - ${nombreCelda}</h3>
        </div>
        <button type="button" onclick="regresarVistaOriginalAjustes()" class="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition">
          ⬅️ Volver
        </button>
      </div>
      <div class="p-6 text-center text-xs text-slate-500">Cargando registros para ${nombreCelda}...</div>
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
            <tr class="hover:bg-white/80 transition">
              <td class="p-2.5 font-medium text-slate-600">${item.id ?? ''}</td>
              <td class="p-2.5 font-semibold text-slate-800">${item.celda ?? ''}</td>
              <td class="p-2.5 font-semibold text-blue-600">
                <a href="#" onclick="visualizarPdfContenedor('${linkArchivo}', '${nombreTxt}', event)" class="hover:underline flex items-center gap-1">
                  📄 ${nombreTxt}
                </a>
              </td>
              <td class="p-2.5 text-slate-600">${item.fecha_str ?? ''}</td>
              <td class="p-2.5 text-slate-600">${item.fecha_original ?? ''}</td>
            </tr>
          `;
        });
      } else {
        filasHtml = `
          <tr>
            <td colspan="5" class="p-6 text-center text-slate-400 italic">No se encontraron registros para la celda ${nombreCelda}</td>
          </tr>
        `;
      }

      seccionHistorial.innerHTML = `
        <div id="headerHistorialInfo" class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-base">📋</span>
            <h3 class="font-bold text-slate-900 text-sm">Historial de dimensionales - ${nombreCelda}</h3>
          </div>
          <button type="button" onclick="regresarVistaOriginalAjustes()" class="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition">
            ⬅️ Volver
          </button>
        </div>

        <div id="bloqueTablaHistorial" class="space-y-4">
          <div class="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/50 max-h-[380px] overflow-y-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-100/80 text-slate-600 border-b border-slate-200 sticky top-0">
                  <th class="p-2.5 font-bold">Id</th>
                  <th class="p-2.5 font-bold">Celda</th>
                  <th class="p-2.5 font-bold">Documento</th>
                  <th class="p-2.5 font-bold">Fecha|Hora</th>
                  <th class="p-2.5 font-bold">Serial</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 text-slate-700">
                ${filasHtml}
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-slate-400 italic text-center mt-1">Mostrando registros históricos de la celda ${nombreCelda}</p>
        </div>

        <div id="visorPdfContenedor" class="hidden flex flex-col gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 w-full">
          <div class="flex items-center justify-between border-b border-slate-200 pb-3">
            <span id="tituloPdfVisualizando" class="text-sm font-bold text-slate-900 truncate">Documento PDF</span>
            <button type="button" onclick="cerrarVisorPdfYMostrarTabla()" class="text-xs font-bold text-slate-700 bg-white hover:bg-slate-200 px-3 py-2 rounded-xl border border-slate-300 shadow-2xs transition flex items-center gap-1.5">
              ⬅️ Regresar a la tabla
            </button>
          </div>
          <iframe id="iframePdfViewer" src="" class="w-full h-[680px] bg-white rounded-xl border border-slate-200"></iframe>
        </div>
      `;

    } catch (err) {
      console.error('Error al consultar historial_celdas:', err);
      seccionHistorial.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-base">📋</span>
            <h3 class="font-bold text-slate-900 text-sm">Historial de dimensionales - ${nombreCelda}</h3>
          </div>
          <button type="button" onclick="regresarVistaOriginalAjustes()" class="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition">
            ⬅️ Volver
          </button>
        </div>
        <div class="p-4 text-center text-xs text-red-600 bg-red-50 rounded-xl border border-red-200 mt-3">
          Error al consultar la tabla <b>historial_celdas</b> en Supabase o verificar el nombre de las columnas.
        </div>
      `;
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

  if (!urlArchivo || urlArchivo === '#') {
    alert('El documento no cuenta con una URL de archivo válida.');
    return;
  }

  if (headerHistorial) headerHistorial.classList.add('hidden');
  if (bloqueTabla) bloqueTabla.classList.add('hidden');
  
  tituloPdf.textContent = `Visualizando: ${nombreArchivo}`;
  
  const viewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(urlArchivo)}#pagemode=none`;

  iframeViewer.src = viewerUrl;
  visorContainer.classList.remove('hidden');
  visorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
  
  if (seccionHistorial) seccionHistorial.classList.add('hidden');
  if (seccionOriginal) seccionOriginal.classList.remove('hidden');
}

document.addEventListener('click', function(event) {
  const sidebar = document.getElementById('sidebarDimensional');
  const btnDimensional = document.getElementById('btnDimensional');
  
  if (!sidebar.classList.contains('translate-x-full')) {
    if (!sidebar.contains(event.target) && !btnDimensional.contains(event.target)) {
      sidebar.classList.add('translate-x-full');
    }
  }
});

function mostrarContenidoAjustes() {
  const seccionHistorial = document.getElementById('seccionHistorialPdf');
  const seccionOriginal = document.getElementById('seccionAjustesOriginal');
  
  if (seccionHistorial) seccionHistorial.classList.add('hidden');
  if (seccionOriginal) seccionOriginal.classList.remove('hidden');
}