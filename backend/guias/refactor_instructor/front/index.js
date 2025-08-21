const API_URL = 'http://localhost:3000/api/equipos';

async function obtenerEquipos() {
    const res = await fetch(API_URL);
    const equipos = await res.json();
    return equipos;
}

async function crearEquipo(data) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await res.json();
}

async function actualizarEquipo(id, data) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return await res.json();
}

async function eliminarEquipo(id) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    });
    return await res.json();
}

// Referencias a elementos del DOM
const contenedorCards = document.getElementById('contenedorCards');
const templateCard = document.getElementById('templateCard');
const datoForm = document.getElementById('datoForm');
const nombre = document.getElementById('nombre');
const btnCancelar = document.getElementById('btnCancelar');

// Mostrar equipos en el template
async function mostrarEquipos() {
    contenedorCards.innerHTML = '';
    const equipos = await obtenerEquipos();
    equipos.forEach(equipo => {
        const clone = templateCard.content.cloneNode(true);
        clone.querySelector('.nombreEquipos').textContent = equipo.nombre_equipo;
        clone.querySelector('.btn-editar').onclick = () => cargarEquipoParaEditar(equipo);
        clone.querySelector('.btn-eliminar').onclick = () => eliminarEquipoHandler(equipo.id_equipo);
        contenedorCards.appendChild(clone);
    });
}

// Guardar o actualizar equipo
datoForm.onsubmit = async (e) => {
    e.preventDefault();
    const data = { nombre_equipo: nombre.value };
    if (id_equipo.value) {
        await actualizarEquipo(id_equipo.value, data);
    } else {
        await crearEquipo(data);
    }
    datoForm.reset();
    id_equipo.value = '';
    mostrarEquipos();
};

// Cancelar edición
btnCancelar.onclick = () => {
    datoForm.reset();
    id_equipo.value = '';
};

// Cargar equipo para editar
function cargarEquipoParaEditar(equipo) {
    id_equipo.value = equipo.id_equipo;
    nombre.value = equipo.nombre_equipo;
}

// Eliminar equipo
async function eliminarEquipoHandler(id) {
    await eliminarEquipo(id);
    mostrarEquipos();
}

mostrarEquipos();