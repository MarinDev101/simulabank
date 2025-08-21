// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api'; // Ajusta según tu configuración
const API_ENDPOINT = `${API_BASE_URL}/banderas`;

// Variables globales
let imagenes = [];
let editandoId = null;

// Elementos del DOM
const formulario = document.getElementById('datoForm');
const inputImagen = document.getElementById('imagen');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const btnGuardar = document.getElementById('btnGuardar');
const btnCancelar = document.getElementById('btnCancelar');
const contenedorCards = document.getElementById('contenedorCards');
const templateCard = document.getElementById('templateCard');

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    inicializarEventos();
    cargarImagenes();
});

// Configurar todos los event listeners
function inicializarEventos() {
    // Evento para previsualizar imagen seleccionada
    inputImagen.addEventListener('change', previsualizarImagen);
    
    // Evento para enviar formulario
    formulario.addEventListener('submit', manejarSubmit);
    
    // Evento para cancelar edición
    btnCancelar.addEventListener('click', cancelarEdicion);
}

// Previsualizar imagen seleccionada
function previsualizarImagen(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        previewContainer.style.display = 'none';
    }
}

// Manejar envío del formulario
async function manejarSubmit(event) {
    event.preventDefault();
    
    const archivo = inputImagen.files[0];
    if (!archivo) {
        alert('Por favor selecciona una imagen');
        return;
    }
    
    try {
        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Guardando...';
        
        if (editandoId) {
            await actualizarImagen(editandoId, archivo);
        } else {
            await crearNuevaImagen(archivo);
        }
        
        limpiarFormulario();
        cargarImagenes();
        
    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Error al guardar la imagen: ' + error.message);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar';
    }
}

// Crear nueva imagen
async function crearNuevaImagen(archivo) {
    try {
        // Primero crear el registro vacío en la base de datos
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                // Solo crear el registro, la imagen se subirá después
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al crear el registro');
        }
        
        const registroCreado = await response.json();
        const registroId = registroCreado.id_bandera || registroCreado.insertId;
        
        // Luego subir la imagen al registro creado
        await subirImagen(registroId, archivo);
        
        alert('Imagen guardada exitosamente');
        
    } catch (error) {
        console.error('Error al crear imagen:', error);
        throw error;
    }
}

// Actualizar imagen existente
async function actualizarImagen(id, archivo) {
    try {
        await subirImagen(id, archivo);
        alert('Imagen actualizada exitosamente');
        
    } catch (error) {
        console.error('Error al actualizar imagen:', error);
        throw error;
    }
}

// Subir imagen al servidor
async function subirImagen(id, archivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const base64 = e.target.result.split(',')[1]; // Remover el prefijo data:image/...;base64,
                
                const response = await fetch(`${API_ENDPOINT}/${id}/imagen`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        imagen: base64,
                        esBase64: true
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Error al subir la imagen');
                }
                
                resolve();
                
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsDataURL(archivo);
    });
}

// Cargar todas las imágenes
async function cargarImagenes() {
    try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
            throw new Error('Error al cargar imágenes');
        }
        
        const registros = await response.json();
        
        // Filtrar solo los registros que tienen imagen
        imagenes = [];
        for (const registro of registros) {
            try {
                const responseImagen = await fetch(`${API_ENDPOINT}/${registro.id_bandera}/imagen`);
                if (responseImagen.ok) {
                    const dataImagen = await responseImagen.json();
                    if (dataImagen.imagen) {
                        imagenes.push({
                            id: registro.id_bandera,
                            imagen: dataImagen.imagen
                        });
                    }
                }
            } catch (error) {
                console.error(`Error al cargar imagen para ID ${registro.id_bandera}:`, error);
            }
        }
        
        renderizarImagenes();
        
    } catch (error) {
        console.error('Error al cargar imágenes:', error);
        alert('Error al cargar imágenes: ' + error.message);
    }
}

// Renderizar imágenes en el DOM
function renderizarImagenes() {
    contenedorCards.innerHTML = '';
    
    if (imagenes.length === 0) {
        contenedorCards.innerHTML = '<p>No hay imágenes guardadas.</p>';
        return;
    }
    
    imagenes.forEach(item => {
        const cardElement = templateCard.content.cloneNode(true);
        const card = cardElement.querySelector('.card-equipos');
        const imagen = cardElement.querySelector('.imgEquipo');
        const btnEditar = cardElement.querySelector('.btn-editar');
        const btnEliminar = cardElement.querySelector('.btn-eliminar');
        
        // Configurar imagen
        imagen.src = `data:image/jpeg;base64,${item.imagen}`;
        imagen.alt = `Imagen ${item.id}`;
        
        // Configurar botones
        btnEditar.addEventListener('click', () => editarImagen(item.id));
        btnEliminar.addEventListener('click', () => eliminarImagen(item.id));
        
        contenedorCards.appendChild(card);
    });
}

// Editar imagen
async function editarImagen(id) {
    try {
        // Configurar formulario para edición
        editandoId = id;
        document.getElementById('id_bandera').value = id;
        btnGuardar.textContent = 'Actualizar';
        
        // Cargar imagen actual en preview
        const imagenActual = imagenes.find(img => img.id === id);
        if (imagenActual) {
            imagePreview.src = `data:image/jpeg;base64,${imagenActual.imagen}`;
            previewContainer.style.display = 'block';
        }
        
        // Limpiar el input file para forzar selección de nueva imagen
        inputImagen.value = '';
        
        // Hacer scroll hacia el formulario
        formulario.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error al editar imagen:', error);
        alert('Error al cargar datos de la imagen: ' + error.message);
    }
}

// Eliminar imagen
async function eliminarImagen(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
        return;
    }
    
    try {
        // Eliminar la imagen del registro
        const responseImagen = await fetch(`${API_ENDPOINT}/${id}/imagen`, {
            method: 'DELETE'
        });
        
        if (!responseImagen.ok) {
            throw new Error('Error al eliminar la imagen');
        }
        
        // Eliminar el registro completo
        const response = await fetch(`${API_ENDPOINT}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar el registro');
        }
        
        alert('Imagen eliminada exitosamente');
        cargarImagenes();
        
    } catch (error) {
        console.error('Error al eliminar imagen:', error);
        alert('Error al eliminar imagen: ' + error.message);
    }
}

// Cancelar edición
function cancelarEdicion() {
    limpiarFormulario();
}

// Limpiar formulario
function limpiarFormulario() {
    formulario.reset();
    editandoId = null;
    document.getElementById('id_bandera').value = '';
    previewContainer.style.display = 'none';
    btnGuardar.textContent = 'Guardar';
    btnGuardar.disabled = false;
}

// Utilidad para mostrar errores
function mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
    `;
    errorDiv.textContent = mensaje;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        document.body.removeChild(errorDiv);
    }, 5000);
}

// Utilidad para mostrar mensajes de éxito
function mostrarExito(mensaje) {
    const exitoDiv = document.createElement('div');
    exitoDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #44ff44;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
    `;
    exitoDiv.textContent = mensaje;
    document.body.appendChild(exitoDiv);
    
    setTimeout(() => {
        document.body.removeChild(exitoDiv);
    }, 3000);
}