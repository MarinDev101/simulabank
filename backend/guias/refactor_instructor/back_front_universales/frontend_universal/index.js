// =========================
// CONFIGURACIÓN
// =========================
const API_BASE = 'http://localhost:3000/api';
let tabla = 'equipos'; // Cambia aquí para apuntar a otra tabla del CRUD universal
let idCampo = 'id_equipo'; // Nombre del campo clave primaria
let campoNombre = 'nombre_equipo'; // Campo que quieres mostrar en las tarjetas

// URL completa del endpoint actual
const API_URL = `${API_BASE}/${tabla}`;

// =========================
// FUNCIONES CRUD
// =========================
async function obtenerDatos() {
    const res = await fetch(API_URL);
    const json = await res.json();
    return json.data || json; // Si el backend devuelve {data:[]}, usar data, si no, usar todo
}

async function crearDato(data) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await res.json();
}

async function actualizarDato(id, data) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await res.json();
}

async function eliminarDato(id) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    });
    return await res.json();
}

// =========================
// DOM
// =========================
const contenedorCards = document.getElementById('contenedorCards');
const templateCard = document.getElementById('templateCard');
const datoForm = document.getElementById('datoForm');
const inputNombre = document.getElementById('nombre');
const btnCancelar = document.getElementById('btnCancelar');
const inputId = document.getElementById(idCampo) || document.createElement('input');

// =========================
// RENDERIZAR DATOS
// =========================
async function mostrarDatos() {
    contenedorCards.innerHTML = '';
    const datos = await obtenerDatos();

    datos.forEach(item => {
        const clone = templateCard.content.cloneNode(true);
        clone.querySelector('.nombreEquipos').textContent = item[campoNombre];
        clone.querySelector('.btn-editar').onclick = () => cargarDatoParaEditar(item);
        clone.querySelector('.btn-eliminar').onclick = () => eliminarDatoHandler(item[idCampo]);
        contenedorCards.appendChild(clone);
    });
}

// =========================
// FORMULARIO
// =========================
datoForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = { [campoNombre]: inputNombre.value };

    if (inputId.value) {
        await actualizarDato(inputId.value, data);
    } else {
        await crearDato(data);
    }

    datoForm.reset();
    inputId.value = '';
    mostrarDatos();
};

btnCancelar.onclick = () => {
    datoForm.reset();
    inputId.value = '';
};

// =========================
// CARGAR DATO PARA EDITAR
// =========================
function cargarDatoParaEditar(item) {
    inputId.value = item[idCampo];
    inputNombre.value = item[campoNombre];
}

// =========================
// ELIMINAR
// =========================
async function eliminarDatoHandler(id) {
    await eliminarDato(id);
    mostrarDatos();
}

// =========================
// INICIO
// =========================
mostrarDatos();
