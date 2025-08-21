const API_BASE = 'http://localhost:3000/api';
let tabla = 'equipos'; // 👈 Cambia esto para usar otra tabla
let API_URL = `${API_BASE}/${tabla}`;

let idCampo = null;
let columnas = [];

const contenedorCards = document.getElementById('contenedorCards');
const templateCard = document.getElementById('templateCard');
const datoForm = document.getElementById('datoForm');
const btnCancelar = document.getElementById('btnCancelar');
const titulo = document.getElementById('titulo');

// Input oculto para ID
const inputId = document.createElement('input');
inputId.type = 'hidden';
datoForm.appendChild(inputId);

// ==========================
// Funciones para backend
// ==========================
async function obtenerMeta() {
    const res = await fetch(`${API_URL}/meta`);
    const meta = await res.json();
    idCampo = meta.idCampo;
    columnas = meta.columnas;
    console.log(`Meta recibida:`, meta);
}

async function obtenerDatos() {
    const res = await fetch(API_URL);
    const json = await res.json();
    return json.data || json;
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
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    return await res.json();
}

// ==========================
// Generar formulario dinámico
// ==========================
function generarFormulario() {
    titulo.textContent = `Gestión de ${tabla}`;
    datoForm.innerHTML = '';
    datoForm.appendChild(inputId);

    columnas.filter(c => c !== idCampo).forEach(col => {
        const label = document.createElement('label');
        label.textContent = col;
        const input = document.createElement('input');
        input.type = 'text';
        input.name = col;
        label.appendChild(input);
        datoForm.appendChild(label);
    });

    const btnGuardar = document.createElement('button');
    btnGuardar.type = 'submit';
    btnGuardar.textContent = 'Guardar';
    datoForm.appendChild(btnGuardar);
}

// ==========================
// Renderizar tarjetas
// ==========================
async function mostrarDatos() {
    contenedorCards.innerHTML = '';
    const datos = await obtenerDatos();
    const campoNombre = columnas.find(c => c !== idCampo);

    datos.forEach(item => {
        const clone = templateCard.content.cloneNode(true);
        clone.querySelector('.nombreRegistro').textContent = item[campoNombre];
        clone.querySelector('.btn-editar').onclick = () => cargarDatoParaEditar(item);
        clone.querySelector('.btn-eliminar').onclick = () => eliminarDatoHandler(item[idCampo]);
        contenedorCards.appendChild(clone);
    });
}

// ==========================
// Formulario: guardar
// ==========================
datoForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = {};
    columnas.filter(c => c !== idCampo).forEach(col => {
        const input = datoForm.querySelector(`[name="${col}"]`);
        if (input) data[col] = input.value;
    });

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

// ==========================
// Cargar dato para editar
// ==========================
function cargarDatoParaEditar(item) {
    inputId.value = item[idCampo];
    columnas.filter(c => c !== idCampo).forEach(col => {
        const input = datoForm.querySelector(`[name="${col}"]`);
        if (input) input.value = item[col];
    });
}

// ==========================
// Eliminar
// ==========================
async function eliminarDatoHandler(id) {
    await eliminarDato(id);
    mostrarDatos();
}

// ==========================
// Inicio
// ==========================
(async function init() {
    await obtenerMeta();
    generarFormulario();
    mostrarDatos();
})();
