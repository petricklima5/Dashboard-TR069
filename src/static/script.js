// Estado global da aplicação
let currentData = [];
let currentFilters = {
    colaborador: '',
    categoria: '',
    tipo: ''
};

// Elementos DOM
const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const closeModal = document.getElementById('closeModal');
const uploadArea = document.getElementById('uploadArea');
const csvFile = document.getElementById('csvFile');
const uploadFileBtn = document.getElementById('uploadFileBtn');
const uploadProgress = document.getElementById('uploadProgress');
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');

// Filtros
const colaboradorFilter = document.getElementById('colaboradorFilter');
const categoriaFilter = document.getElementById('categoriaFilter');
const tipoFilter = document.getElementById('tipoFilter');
const applyFilters = document.getElementById('applyFilters');
const clearFilters = document.getElementById('clearFilters');

// Resumo
const totalRegistros = document.getElementById('totalRegistros');
const totalValor = document.getElementById('totalValor');
const totalColaboradores = document.getElementById('totalColaboradores');
const totalCategorias = document.getElementById('totalCategorias');

// Tabela
const dataTableBody = document.getElementById('dataTableBody');

// Gráficos
let categoriaChart = null;
let colaboradorChart = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadDashboardData();
});

// Configurar event listeners
function setupEventListeners() {
    // Upload
    uploadBtn.addEventListener('click', () => uploadModal.style.display = 'flex');
    closeModal.addEventListener('click', () => uploadModal.style.display = 'none');
    uploadArea.addEventListener('click', () => csvFile.click());
    csvFile.addEventListener('change', handleFileSelect);
    uploadFileBtn.addEventListener('click', handleFileUpload);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Filtros
    applyFilters.addEventListener('click', applyCurrentFilters);
    clearFilters.addEventListener('click', clearCurrentFilters);
    
    // Fechar modal clicando fora
    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            uploadModal.style.display = 'none';
        }
    });
}

// Carregar dados do dashboard
async function loadDashboardData() {
    try {
        showLoading(true);
        
        // Carregar filtros
        await loadFilters();
        
        // Carregar dados
        await loadData();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showToast('Erro ao carregar dados do dashboard', 'error');
    } finally {
        showLoading(false);
    }
}
// Carregar opções de filtros
async function loadFilters() {
    try {
        const response = await fetch('/api/filters');
        const data = await response.json();
        
        // Limpar filtros
        colaboradorFilter.innerHTML = '<option value="">Todos os colaboradores</option>';
        categoriaFilter.innerHTML = '<option value="">Todas as categorias</option>';
        tipoFilter.innerHTML = '<option value="">Todos os tipos</option>';
        
        // Adicionar opções
        data.colaboradores.forEach(colaborador => {
            const option = document.createElement('option');
            option.value = colaborador;
            option.textContent = colaborador;
            colaboradorFilter.appendChild(option);
        });
        
        data.categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            categoriaFilter.appendChild(option);
        });
        
        data.tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo;
            tipoFilter.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erro ao carregar filtros:', error);
    }
}

// Carregar dados
async function loadData() {
    try {
        const params = new URLSearchParams();
        if (currentFilters.colaborador) params.append('colaborador', currentFilters.colaborador);
        if (currentFilters.categoria) params.append('categoria', currentFilters.categoria);
        if (currentFilters.tipo) params.append('tipo', currentFilters.tipo);
        
        const response = await fetch(`/api/data?${params}`);
        currentData = await response.json();
        
        // Carregar resumo
        await loadSummary();
        
        // Atualizar visualizações
        updateTable();
        updateCharts();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// Carregar resumo
async function loadSummary() {
    try {
        const params = new URLSearchParams();
        if (currentFilters.colaborador) params.append('colaborador', currentFilters.colaborador);
        if (currentFilters.categoria) params.append('categoria', currentFilters.categoria);
        if (currentFilters.tipo) params.append('tipo', currentFilters.tipo);
        
        const response = await fetch(`/api/summary?${params}`);
        const summary = await response.json();
        
        totalRegistros.textContent = summary.total_registros.toLocaleString();
        totalValor.textContent = summary.total_valor.toLocaleString();
        totalColaboradores.textContent = summary.por_colaborador.length;
        totalCategorias.textContent = summary.por_categoria.length;
        
    } catch (error) {
        console.error('Erro ao carregar resumo:', error);
    }
}

// Atualizar tabela
function updateTable() {
    dataTableBody.innerHTML = '';
    
    currentData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.tipo}</td>
            <td>${item.valor.toLocaleString()}</td>
            <td>${item.categoria}</td>
            <td>${item.colaborador}</td>
        `;
        dataTableBody.appendChild(row);
    });
}

// Atualizar gráficos
async function updateCharts() {
    try {
        const params = new URLSearchParams();
        if (currentFilters.colaborador) params.append('colaborador', currentFilters.colaborador);
        if (currentFilters.categoria) params.append('categoria', currentFilters.categoria);
        if (currentFilters.tipo) params.append('tipo', currentFilters.tipo);
        
        const response = await fetch(`/api/summary?${params}`);
        const summary = await response.json();
        
        // Gráfico de categorias
        updateCategoriaChart(summary.por_categoria);
        
        // Gráfico de colaboradores
        updateColaboradorChart(summary.por_colaborador);
        
    } catch (error) {
        console.error('Erro ao atualizar gráficos:', error);
    }
}

// Gráfico de categorias (pizza)
function updateCategoriaChart(data) {
    const ctx = document.getElementById('categoriaChart').getContext('2d');
    
    if (categoriaChart) {
        categoriaChart.destroy();
    }
    
    const colors = [
        '#667eea', '#764ba2', '#10b981', '#f59e0b', 
        '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'
    ];
    
    categoriaChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(item => item.categoria),
            datasets: [{
                data: data.map(item => item.valor),
                backgroundColor: colors.slice(0, data.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

// Gráfico de colaboradores (barras)
function updateColaboradorChart(data) {
    const ctx = document.getElementById('colaboradorChart').getContext('2d');
    
    if (colaboradorChart) {
        colaboradorChart.destroy();
    }
    
    colaboradorChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.colaborador),
            datasets: [{
                label: 'Valor Total',
                data: data.map(item => item.valor),
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: '#667eea',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Aplicar filtros
function applyCurrentFilters() {
    currentFilters.colaborador = colaboradorFilter.value;
    currentFilters.categoria = categoriaFilter.value;
    currentFilters.tipo = tipoFilter.value;
    
    loadData();
    showToast('Filtros aplicados com sucesso!', 'success');
}

// Limpar filtros
function clearCurrentFilters() {
    colaboradorFilter.value = '';
    categoriaFilter.value = '';
    tipoFilter.value = '';
    
    currentFilters = {
        colaborador: '',
        categoria: '',
        tipo: ''
    };
    
    loadData();
    showToast('Filtros limpos!', 'info');
}

// Upload de arquivo
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        validateAndShowFile(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        validateAndShowFile(files[0]);
    }
}

function validateAndShowFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showToast('Por favor, selecione um arquivo CSV válido.', 'error');
        return;
    }
    
    uploadArea.innerHTML = `
        <i class="fas fa-file-csv"></i>
        <p><strong>${file.name}</strong></p>
        <p>Arquivo CSV selecionado</p>
    `;
    
    uploadFileBtn.disabled = false;
}

async function handleFileUpload() {
    const file = csvFile.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        uploadProgress.style.display = 'block';
        uploadFileBtn.disabled = true;
        
        const response = await fetch('/api/upload-csv', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            uploadModal.style.display = 'none';
            await loadDashboardData();
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        console.error('Erro no upload:', error);
        showToast('Erro ao fazer upload do arquivo.', 'error');
    } finally {
        uploadProgress.style.display = 'none';
        uploadFileBtn.disabled = false;
        
        // Reset upload area
        uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Arraste o arquivo CSV aqui ou clique para selecionar</p>
        `;
        csvFile.value = '';
    }
}

// Utilitários
function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

function showError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
}

function hideError() {
    loginError.style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Formatação de números
Number.prototype.toLocaleString = function() {
    return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

