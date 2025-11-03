// Main Application Logic

// API Base URL
const API_BASE = 'api/';

// Application State
let currentView = 'dashboard';
let isLoggedIn = false;
let currentUser = null;
let products = [];
let suppliers = [];
let orders = [];
let movements = [];
let alerts = [];
let auditLogs = [];
let categorias = [];
let dashboardData = null;
let reportesData = null;
let usuarios = [];
let currentReportPeriod = 'month'; // 'week', 'month', 'quarter', 'year'
let currentReportTab = 'rotation'; // 'rotation', 'costs', 'stock', 'suppliers'

// API Helper Functions
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        // Agregar timestamp para evitar cache del navegador en peticiones GET
        if (method === 'GET' && !endpoint.includes('?')) {
            endpoint += `?_t=${Date.now()}`;
        } else if (method === 'GET' && endpoint.includes('?')) {
            endpoint += `&_t=${Date.now()}`;
        }
        
        const response = await fetch(API_BASE + endpoint, options);
        
        // Verificar si la respuesta es JSON válido
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('API Error: Respuesta no es JSON:', {
                endpoint: API_BASE + endpoint,
                status: response.status,
                contentType: contentType,
                responseText: text.substring(0, 500) // Primeros 500 caracteres
            });
            throw new Error('El servidor no devolvió JSON. Verifica que los archivos PHP estén funcionando correctamente.');
        }
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Error en la petición');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Función para generar el siguiente SKU automáticamente
function generateNextSku() {
    // Asegurar que products es un array válido
    let totalProducts = 0;
    if (Array.isArray(products)) {
        totalProducts = products.length;
    }
    
    const nextNumber = totalProducts + 1;
    const sku = 'PROD-' + String(nextNumber).padStart(4, '0');
    console.log('🔢 Generando SKU:', sku, '| Total productos:', totalProducts, '| Próximo número:', nextNumber);
    return sku;
}

// Función para actualizar el SKU en el formulario cuando se abre el modal
function updateAutoSku() {
    // Usar el evento de Bootstrap para asegurar que el modal esté completamente visible
    const modalElement = document.getElementById('addProductModal');
    if (modalElement) {
        // Limpiar listeners anteriores
        modalElement.removeEventListener('shown.bs.modal', updateSkuOnShow);
        
        // Agregar listener para cuando el modal esté completamente visible
        modalElement.addEventListener('shown.bs.modal', updateSkuOnShow);
    }
}

function updateSkuOnShow() {
    const autoSkuField = document.getElementById('auto-sku');
    if (autoSkuField) {
        autoSkuField.value = generateNextSku();
    }
}

// Función global para actualizar el SKU en el campo del formulario
async function updateSkuField() {
    await loadProducts();
    const autoSkuField = document.getElementById('auto-sku');
    if (autoSkuField) {
        const newSku = generateNextSku();
        autoSkuField.value = newSku;
        console.log('✅ SKU actualizado a:', newSku, 'Productos totales:', products.length);
    } else {
        console.error('❌ Campo auto-sku no encontrado');
    }
}

// Configurar el buscador de productos con debounce
function setupProductSearch() {
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        // Remover listeners previos para evitar duplicados
        const newInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newInput, searchInput);
        
        const freshInput = document.getElementById('product-search');
        
        // Event listener solo para Enter (búsqueda al presionar Enter)
        freshInput.addEventListener('keypress', handleProductSearchEnter);
        
        console.log('✅ Buscador de productos configurado');
    }
}

// Configurar el buscador de proveedores (similar al de productos)
function setupSupplierSearch() {
    const searchInput = document.getElementById('supplier-search');
    if (searchInput) {
        // Remover listeners previos para evitar duplicados
        const newInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newInput, searchInput);
        
        const freshInput = document.getElementById('supplier-search');
        
        // Event listener solo para Enter (búsqueda al presionar Enter)
        freshInput.addEventListener('keypress', handleSupplierSearchEnter);
        
        console.log('✅ Buscador de proveedores configurado');
    }
}

// Función para búsqueda de proveedores al presionar Enter
function handleSupplierSearchEnter(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        // Buscar inmediatamente (solo re-renderizar)
        renderCurrentView();
    }
}

// Función para limpiar la búsqueda y mostrar todos los proveedores
function clearSupplierSearch() {
    const searchInput = document.getElementById('supplier-search');
    if (searchInput) {
        searchInput.value = '';
        // Re-renderizar para mostrar todos los proveedores
        renderCurrentView();
    }
}

// Configurar eventos del modal de productos
function setupProductModal() {
    // Configurar botón de agregar producto
    const btnAddProduct = document.getElementById('btn-add-product');
    if (btnAddProduct) {
        // Remover listeners previos para evitar duplicados
        const newBtn = btnAddProduct.cloneNode(true);
        btnAddProduct.parentNode.replaceChild(newBtn, btnAddProduct);
        
        const freshBtn = document.getElementById('btn-add-product');
        freshBtn.addEventListener('click', async function(e) {
            console.log('🔄 Botón agregar producto clickeado, actualizando SKU...');
            // Asegurar que los productos estén cargados antes de abrir el modal
            await loadProducts();
            // Pequeño delay para que el modal se renderice completamente
            setTimeout(() => {
                updateSkuField();
            }, 150);
        });
    }
    
    const modalElement = document.getElementById('addProductModal');
    if (!modalElement) {
        console.warn('Modal addProductModal no encontrado');
        return;
    }
    
    // Remover listeners anteriores para evitar duplicados
    const newModal = modalElement.cloneNode(true);
    modalElement.parentNode.replaceChild(newModal, modalElement);
    
    const freshModal = document.getElementById('addProductModal');
    
    // Agregar evento cuando el modal se muestra completamente
    freshModal.addEventListener('shown.bs.modal', function() {
        console.log('Modal mostrado completamente, actualizando SKU...');
        updateSkuField();
    });
    
    // Limpiar formulario cuando se cierra el modal
    freshModal.addEventListener('hidden.bs.modal', function() {
        const form = document.getElementById('addProductForm');
        if (form) {
            form.reset();
            // Actualizar el SKU después de cerrar para la próxima vez
            setTimeout(() => {
                updateSkuField();
            }, 50);
        }
    });
    
    console.log('✅ Eventos del modal configurados');
}

// Load data functions
async function loadProducts() {
    try {
        const search = document.getElementById('product-search')?.value || '';
        const categoria = document.getElementById('product-category-filter')?.value || '';
        let url = 'productos.php';
        const params = [];
        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (categoria && categoria !== 'all') params.push(`categoria=${encodeURIComponent(categoria)}`);
        if (params.length > 0) url += '?' + params.join('&');
        
        // Siempre cargar desde la base de datos, no usar cache
        const response = await apiCall(url + (url.includes('?') ? '&' : '?') + `_t=${Date.now()}`);
        
        // Normalizar los datos para asegurar tipos correctos (número)
        products = Array.isArray(response) ? response.map(p => ({
            ...p,
            stock: Number(p.stock) || 0,
            stock_minimo: Number(p.stock_minimo) || 0,
            precio: parseFloat(p.precio) || 0
        })) : [];
        
        console.log('Productos cargados desde BD:', products.length);
    } catch (error) {
        console.error('Error cargando productos:', error);
        products = [];
    }
}

// Función para filtrar productos (solo en frontend, sin recargar desde servidor)
function filterProducts() {
    renderCurrentView();
}

// Variable global para preservar el filtro de categoría
let currentCategoryFilter = 'all';
let currentMovementTypeFilter = 'all'; // Variable global para preservar el filtro de tipo de movimiento
let currentOrderStatusFilter = 'all'; // Variable global para preservar el filtro de estado de pedidos

// Función para manejar el cambio de categoría
function handleCategoryFilterChange() {
    // Obtener y guardar el valor seleccionado
    const categorySelect = document.getElementById('product-category-filter');
    if (categorySelect) {
        currentCategoryFilter = categorySelect.value || 'all';
        console.log('Categoría seleccionada:', currentCategoryFilter);
    }
    
    // Re-renderizar la vista para aplicar el filtro
    renderCurrentView();
    
    // Restaurar el valor seleccionado después de renderizar
    setTimeout(() => {
        const newCategorySelect = document.getElementById('product-category-filter');
        if (newCategorySelect && currentCategoryFilter) {
            newCategorySelect.value = currentCategoryFilter;
        }
    }, 100);
}

// Función para búsqueda al presionar Enter
function handleProductSearchEnter(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        // Buscar inmediatamente (solo re-renderizar)
        renderCurrentView();
    }
}

async function loadSuppliers() {
    try {
        // Siempre cargar todos los proveedores desde la base de datos, sin filtrar por búsqueda
        // El filtrado se hará en el frontend
        const url = 'proveedores.php' + `?_t=${Date.now()}`;
        suppliers = await apiCall(url);
    } catch (error) {
        console.error('Error cargando proveedores:', error);
        suppliers = [];
    }
}

async function loadOrders() {
    try {
        // Siempre cargar todos los pedidos (el filtrado se hace en el frontend)
        orders = await apiCall('pedidos.php?_t=' + Date.now());
    } catch (error) {
        console.error('Error cargando pedidos:', error);
        orders = [];
    }
}

// Función para manejar el cambio de filtro de estado de pedidos
function handleOrderStatusFilterChange() {
    // Obtener y guardar el valor seleccionado
    const statusSelect = document.getElementById('order-status-filter');
    if (statusSelect) {
        currentOrderStatusFilter = statusSelect.value || 'all';
        console.log('Estado de pedido seleccionado:', currentOrderStatusFilter);
    }
    
    // Re-renderizar la vista para aplicar el filtro
    renderCurrentView();
    
    // Preservar el valor después de renderizar
    setTimeout(() => {
        const newStatusSelect = document.getElementById('order-status-filter');
        if (newStatusSelect && currentOrderStatusFilter) {
            newStatusSelect.value = currentOrderStatusFilter;
        }
    }, 100);
}

async function loadMovements() {
    try {
        // Cargar todos los movimientos sin filtros (el filtrado se hace en el frontend)
        movements = await apiCall('movimientos.php?_t=' + Date.now());
    } catch (error) {
        console.error('Error cargando movimientos:', error);
        movements = [];
    }
}

// Función para manejar el cambio de filtro de tipo de movimiento
function handleMovementTypeFilterChange() {
    const typeSelect = document.getElementById('movement-type-filter');
    if (typeSelect) {
        currentMovementTypeFilter = typeSelect.value || 'all';
        console.log('Tipo de movimiento seleccionado:', currentMovementTypeFilter);
        // Re-renderizar la vista para aplicar el filtro
    renderCurrentView();
    }
}

// Función para búsqueda de movimientos al presionar Enter
function handleMovementSearchEnter(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        // Buscar inmediatamente (solo re-renderizar)
        renderCurrentView();
    }
}

// Función para configurar el buscador de movimientos
function setupMovementSearch() {
    const searchInput = document.getElementById('movement-search');
    if (searchInput) {
        // Remover listeners previos para evitar duplicados
        const newInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newInput, searchInput);
        
        const freshInput = document.getElementById('movement-search');
        
        // Event listener solo para Enter (búsqueda al presionar Enter)
        freshInput.addEventListener('keypress', handleMovementSearchEnter);
        
        console.log('✅ Buscador de movimientos configurado');
    }
}

async function loadAlerts() {
    try {
        const filtro = document.getElementById('alert-filter')?.value || 'all';
        let url = 'alertas.php';
        if (filtro && filtro !== 'all') url += `?filtro=${encodeURIComponent(filtro)}`;
        alerts = await apiCall(url);
        updateAlertBadge();
    } catch (error) {
        console.error('Error cargando alertas:', error);
        alerts = [];
    }
}

async function filterAlerts() {
    // Esta función se mantiene para compatibilidad pero ya no se usa
    // El filtrado se maneja con handleAlertFilterChange
    await loadAlerts();
    renderCurrentView();
}

async function loadAuditLogs() {
    try {
        let url = 'auditoria.php';
        auditLogs = await apiCall(url);
    } catch (error) {
        console.error('Error cargando historial:', error);
        auditLogs = [];
    }
}

function handleAuditYearFilterChange() {
    const yearSelect = document.getElementById('audit-year-filter');
    if (yearSelect) {
        const value = yearSelect.value;
        currentAuditYear = value === 'all' ? 'all' : parseInt(value);
        renderCurrentView();
        
        // Preservar el valor después de renderizar
        setTimeout(() => {
            const newYearSelect = document.getElementById('audit-year-filter');
            if (newYearSelect && currentAuditYear) {
                newYearSelect.value = currentAuditYear === 'all' ? 'all' : currentAuditYear.toString();
            }
        }, 100);
    }
}

async function loadCategorias() {
    try {
        categorias = await apiCall('categorias.php');
    } catch (error) {
        console.error('Error cargando categorías:', error);
        categorias = [];
    }
}

async function loadDashboardData() {
    try {
        dashboardData = await apiCall('dashboard.php');
    } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
        dashboardData = null;
    }
}

async function loadReportesData() {
    try {
        reportesData = await apiCall('reportes.php');
    } catch (error) {
        console.error('Error cargando datos de reportes:', error);
        reportesData = null;
    }
}

async function loadUsuarios() {
    try {
        usuarios = await apiCall('usuarios.php?_t=' + Date.now());
        console.log('✅ Usuarios cargados:', usuarios.length);
        console.log('📋 Primer usuario:', usuarios[0]);
    } catch (error) {
        console.error('❌ Error cargando usuarios:', error);
        usuarios = [];
    }
}

async function loadAllData() {
    await Promise.all([
        loadProducts(),
        loadSuppliers(),
        loadOrders(),
        loadMovements(),
        loadAlerts(),
        loadAuditLogs(),
        loadCategorias(),
        loadDashboardData(),
        loadReportesData(),
        loadUsuarios()
    ]);
}

// Menu Items
const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: 'bi-speedometer2', roles: ['admin', 'inventory_manager'] },
    { id: 'products', label: 'Productos', icon: 'bi-box-seam', roles: ['admin', 'inventory_manager'] },
    { id: 'suppliers', label: 'Proveedores', icon: 'bi-people', roles: ['admin', 'inventory_manager'] },
    { id: 'movements', label: 'Movimientos', icon: 'bi-arrow-left-right', roles: ['admin', 'inventory_manager'] },
    { id: 'orders', label: 'Pedidos', icon: 'bi-cart', roles: ['admin', 'inventory_manager'] },
    { id: 'reports', label: 'Informes', icon: 'bi-file-text', roles: ['admin', 'inventory_manager'] },
    { id: 'alerts', label: 'Alertas', icon: 'bi-bell', roles: ['admin', 'inventory_manager'] },
    { id: 'audit', label: 'Historial', icon: 'bi-shield-check', roles: ['admin'] },
    { id: 'users', label: 'Usuarios & Roles', icon: 'bi-person', roles: ['admin'] },
    { id: 'settings', label: 'Configuración', icon: 'bi-gear', roles: ['admin', 'inventory_manager'] }
];

// Función para obtener los items del menú según el rol del usuario
function getFilteredMenuItems() {
    if (!currentUser || !currentUser.rol) {
        return []; // Si no hay usuario, no mostrar menú
    }
    
    const userRole = currentUser.rol;
    
    // Si es administrador, mostrar todos
    if (userRole === 'admin') {
        return menuItems;
    }
    
    // Para otros roles, filtrar según los permisos definidos
    return menuItems.filter(item => {
        return item.roles && item.roles.includes(userRole);
    });
}

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initLogin();
    initApp();
    updateAlertBadge();
});

// Login Functions
function initLogin() {
    const loginForm = document.getElementById('login-form');
    const recoverForm = document.getElementById('recover-form');
    const backLoginRecoverLink = document.getElementById('back-login-recover-link');
    const forgotLink = document.getElementById('forgot-link');
    const togglePassword = document.getElementById('toggle-password');

    loginForm?.addEventListener('submit', handleLogin);
    recoverForm?.addEventListener('submit', handleRecover);
    
    backLoginRecoverLink?.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
    
    forgotLink?.addEventListener('click', (e) => {
        e.preventDefault();
        showRecoverForm();
    });

    togglePassword?.addEventListener('click', () => togglePasswordVisibility('password', 'eye-icon'));
}

function showLoginForm() {
    document.getElementById('login-form').classList.remove('d-none');
    document.getElementById('recover-form').classList.add('d-none');
    document.getElementById('login-subtitle').textContent = 'Ingresa a tu cuenta';
}

function showRecoverForm() {
    document.getElementById('login-form').classList.add('d-none');
    document.getElementById('recover-form').classList.remove('d-none');
    document.getElementById('login-subtitle').textContent = 'Recupera tu contraseña';
}

function togglePasswordVisibility(fieldId, iconId) {
    const field = document.getElementById(fieldId);
    const icon = document.getElementById(iconId);
    if (field.type === 'password') {
        field.type = 'text';
        icon.className = 'bi bi-eye-slash';
    } else {
        field.type = 'password';
        icon.className = 'bi bi-eye';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await apiCall('auth.php', 'POST', {
            action: 'login',
            email: email,
            password: password
        });
        
        if (response.success) {
            currentUser = response.user;
            isLoggedIn = true;
            document.getElementById('login-page').classList.add('d-none');
            document.getElementById('app-container').classList.remove('d-none');
            document.getElementById('user-name').textContent = currentUser.nombre;
            document.getElementById('user-dropdown-name').textContent = currentUser.nombre;
            document.getElementById('user-dropdown-email').textContent = currentUser.email;
            
            // Renderizar sidebar con los permisos correctos
            renderSidebar();
            
            await loadAllData();
            renderApp();
        }
    } catch (error) {
        alert('Error al iniciar sesión: ' + error.message);
    }
}

function handleRecover(e) {
    e.preventDefault();
    alert('Se han enviado las instrucciones a tu correo electrónico.');
    showLoginForm();
}

// App Functions
function initApp() {
    renderSidebar();
    setupSidebarToggle();
    setupNavigation();
    setupLogout();
    setupAlertsButton();
}

function setupAlertsButton() {
    const alertsBtn = document.getElementById('alerts-btn');
    if (alertsBtn) {
        // Remover listeners anteriores para evitar duplicados
        const newBtn = alertsBtn.cloneNode(true);
        alertsBtn.parentNode.replaceChild(newBtn, alertsBtn);
        
        const freshBtn = document.getElementById('alerts-btn');
        freshBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await navigateTo('alerts'); // Usar navigateTo para mantener consistencia
        });
    }
}

function renderSidebar() {
    const desktopMenu = document.getElementById('sidebar-menu');
    const mobileMenu = document.getElementById('mobile-sidebar-menu');
    
    if (desktopMenu && mobileMenu) {
        // Obtener los items filtrados según el rol del usuario
        const filteredItems = getFilteredMenuItems();
        
        desktopMenu.innerHTML = filteredItems.map(item => `
            <a href="#" class="menu-item ${currentView === item.id ? 'active' : ''}" data-view="${item.id}">
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
                ${item.id === 'alerts' && getUnreadAlertsCount() > 0 ? 
                    `<span class="badge bg-danger ms-auto">${getUnreadAlertsCount()}</span>` : ''}
            </a>
        `).join('');
        
        mobileMenu.innerHTML = desktopMenu.innerHTML;
    }
}

function setupSidebarToggle() {
    const toggle = document.getElementById('sidebar-toggle');
    const overlay = document.getElementById('sidebar-overlay');
    const sidebar = document.getElementById('mobile-sidebar');
    const closeBtn = document.getElementById('close-sidebar');
    
    toggle?.addEventListener('click', () => {
        overlay?.classList.remove('d-none');
        sidebar?.classList.remove('d-none');
    });
    
    closeBtn?.addEventListener('click', closeMobileSidebar);
    overlay?.addEventListener('click', closeMobileSidebar);
}

function closeMobileSidebar() {
    document.getElementById('sidebar-overlay')?.classList.add('d-none');
    document.getElementById('mobile-sidebar')?.classList.add('d-none');
}

function setupNavigation() {
    document.querySelectorAll('[data-view]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.getAttribute('data-view');
            navigateTo(view);
        });
    });
}

async function navigateTo(view) {
    // Verificar permisos antes de navegar
    const filteredItems = getFilteredMenuItems();
    const allowedViews = filteredItems.map(item => item.id);
    
    // Si la vista solicitada no está permitida, redirigir al dashboard
    if (!allowedViews.includes(view)) {
        console.warn(`Vista "${view}" no permitida para el rol del usuario. Redirigiendo al dashboard.`);
        view = 'dashboard';
    }
    
    currentView = view;
    renderSidebar();
    await renderCurrentView();
    closeMobileSidebar();
}

function setupLogout() {
    document.getElementById('logout-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        isLoggedIn = false;
        currentView = 'dashboard';
        document.getElementById('login-page').classList.remove('d-none');
        document.getElementById('app-container').classList.add('d-none');
        showLoginForm();
    });
}

async function renderApp() {
    renderSidebar();
    await renderCurrentView();
    updateAlertBadge();
}

async function renderCurrentView() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // Verificar permisos para la vista actual
    if (currentUser && currentUser.rol) {
        const filteredItems = getFilteredMenuItems();
        const allowedViews = filteredItems.map(item => item.id);
        
        if (!allowedViews.includes(currentView)) {
            console.warn(`Vista "${currentView}" no permitida para el rol "${currentUser.rol}". Redirigiendo al dashboard.`);
            currentView = 'dashboard';
        }
    }

    // Recargar datos antes de renderizar
    await loadAllData();

    switch(currentView) {
        case 'dashboard':
            await loadDashboardData();
            mainContent.innerHTML = await renderDashboard();
            setTimeout(() => {
                initDashboardCharts();
            }, 200);
            break;
        case 'products':
            mainContent.innerHTML = await renderProducts();
            // Configurar eventos del modal después de renderizar
            setTimeout(() => {
                setupProductModal();
                setupProductSearch();
                // Restaurar el valor del filtro de categoría después de renderizar
                const categorySelect = document.getElementById('product-category-filter');
                if (categorySelect && currentCategoryFilter) {
                    categorySelect.value = currentCategoryFilter;
                }
            }, 200);
            break;
        case 'suppliers':
            mainContent.innerHTML = renderSuppliers();
            setTimeout(() => {
                setupSupplierSearch();
            }, 200);
            break;
        case 'movements':
            mainContent.innerHTML = renderMovements();
            setTimeout(() => {
                setupMovementModal();
                setupMovementSearch();
                // Restaurar el valor del filtro de tipo después de renderizar
                const typeSelect = document.getElementById('movement-type-filter');
                if (typeSelect && currentMovementTypeFilter) {
                    typeSelect.value = currentMovementTypeFilter;
                }
            }, 200);
            break;
        case 'orders':
            mainContent.innerHTML = renderOrders();
            setTimeout(() => {
                // Configurar el modal de pedidos cuando se abre
                setupOrderModal();
                // Preservar el valor del filtro después de renderizar
                const statusSelect = document.getElementById('order-status-filter');
                if (statusSelect && currentOrderStatusFilter) {
                    statusSelect.value = currentOrderStatusFilter;
                }
            }, 200);
            break;
        case 'reports':
            mainContent.innerHTML = renderReports();
            setTimeout(async () => {
                await loadReportesData();
                // Inicializar gráficos según la pestaña activa
                if (currentReportTab === 'rotation' && window.rotationChartData) {
                    initRotationChart(window.rotationChartData);
                } else if (currentReportTab === 'costs') {
                    initCostsChart();
                } else if (currentReportTab === 'stock') {
                    initStockChart();
                } else if (currentReportTab === 'suppliers' && window.suppliersPieChartData) {
                    initSuppliersPieChart(window.suppliersPieChartData);
                }
            }, 200);
            break;
        case 'alerts':
            mainContent.innerHTML = renderAlerts();
            break;
        case 'audit':
            mainContent.innerHTML = renderAudit();
            setTimeout(() => {
                // Preservar el valor del filtro después de renderizar
                const yearSelect = document.getElementById('audit-year-filter');
                if (yearSelect && currentAuditYear) {
                    yearSelect.value = currentAuditYear === 'all' ? 'all' : currentAuditYear.toString();
                }
            }, 100);
            break;
        case 'users':
            mainContent.innerHTML = await renderUsers();
            break;
        case 'settings':
            mainContent.innerHTML = renderSettings();
            break;
        default:
            await loadDashboardData();
            mainContent.innerHTML = await renderDashboard();
            setTimeout(() => {
                initDashboardCharts();
            }, 200);
    }

    // Re-setup event listeners after rendering
    setupNavigation();
    setupAlertsButton(); // Re-configurar el botón de alertas después de renderizar
}

function updateAlertBadge() {
    const count = getUnreadAlertsCount();
    const badge = document.getElementById('alert-badge');
    if (badge) {
        if (count > 0) {
            // Mostrar máximo 99
            badge.textContent = count > 99 ? '99+' : count.toString();
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function getUnreadAlertsCount() {
    // Normalizar el campo leida para asegurar comparación correcta
    return alerts.filter(a => {
        const leida = a.leida === true || a.leida === 1 || a.leida === '1' || a.leida === 'true';
        return !leida;
    }).length;
}

// Dashboard
async function renderDashboard() {
    try {
        const stats = dashboardData || {};
        console.log('Datos del dashboard:', stats);
        
        const totalStock = parseInt(stats.inventario_total) || 0;
        const lowStockProducts = stats.productos_stock_bajo || [];
        const pendingOrders = parseInt(stats.pedidos_pendientes) || 0;
        const unreadAlerts = stats.alertas_activas || [];
        const totalValue = parseFloat(stats.valor_total) || 0;
        const recentMovements = stats.movimientos_recientes || [];
        
        console.log('Valores procesados:', { totalStock, pendingOrders, totalValue });

    return `
        <div class="mb-4">
            <h2 class="text-dark mb-1">Panel de Control</h2>
            <p class="text-muted">Resumen general del inventario y operaciones</p>
        </div>

        <div class="row g-4 mb-4">
            <div class="col-md-6 col-lg-3">
                <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="stat-card-title">Inventario Total</span>
                        <i class="bi bi-box-seam text-success fs-5"></i>
                    </div>
                    <div class="stat-card-value">${totalStock} unidades</div>
                    <p class="text-success mb-0">
                        <i class="bi bi-arrow-up"></i> +12% vs mes anterior
                    </p>
                </div>
            </div>
            <div class="col-md-6 col-lg-3">
                <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="stat-card-title">Stock Bajo</span>
                        <i class="bi bi-exclamation-triangle text-danger fs-5"></i>
                    </div>
                    <div class="stat-card-value">${lowStockProducts.length} productos</div>
                    <p class="text-danger mb-0">
                        <i class="bi bi-arrow-down"></i> Requiere atención
                    </p>
                </div>
            </div>
            <div class="col-md-6 col-lg-3">
                <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="stat-card-title">Pedidos Pendientes</span>
                        <i class="bi bi-cart text-primary fs-5"></i>
                    </div>
                    <div class="stat-card-value">${pendingOrders} pedidos</div>
                    <p class="text-muted mb-0">En proceso de entrega</p>
                </div>
            </div>
            <div class="col-md-6 col-lg-3">
                <div class="stat-card">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="stat-card-title">Valor Total</span>
                        <i class="bi bi-currency-dollar text-warning fs-5"></i>
                    </div>
                    <div class="stat-card-value">$${totalValue.toLocaleString()}</div>
                    <p class="text-success mb-0">
                        <i class="bi bi-arrow-up"></i> +8.2% este mes
                    </p>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-4">
            <div class="col-lg-6">
                <div class="card-custom">
                    <div class="card-header-custom">
                        <h5 class="text-dark mb-1">Movimiento de Stock</h5>
                        <p class="text-muted small mb-0">Entradas vs Salidas (últimos 6 meses)</p>
                    </div>
                    <div class="chart-container">
                        <canvas id="stockChart"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card-custom">
                    <div class="card-header-custom">
                        <h5 class="text-dark mb-1">Distribución por Categoría</h5>
                        <p class="text-muted small mb-0">Porcentaje de inventario por tipo</p>
                    </div>
                    <div class="chart-container">
                        <canvas id="categoryChart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-4">
            <div class="col-lg-6">
                <div class="card-custom">
                    <div class="card-header-custom">
                        <h5 class="text-dark mb-1">Análisis de Costos</h5>
                        <p class="text-muted small mb-0">Costos de entradas por día (última semana)</p>
                    </div>
                    <div class="chart-container">
                        <canvas id="costChart"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card-custom">
                    <div class="card-header-custom">
                        <h5 class="text-dark mb-1">Estado de Pedidos</h5>
                        <p class="text-muted small mb-0">Distribución de pedidos por estado</p>
                    </div>
                    <div class="chart-container">
                        <canvas id="ordersStatusChart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-4">
            <div class="col-lg-6">
                <div class="card-custom">
                    <div class="card-header-custom">
                        <h5 class="text-dark mb-1">Productos Más Movidos</h5>
                        <p class="text-muted small mb-0">Top 5 productos con más salidas (último mes)</p>
                    </div>
                    <div class="chart-container">
                        <canvas id="topProductsChart"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card-custom">
                    <div class="card-header-custom">
                        <h5 class="text-dark mb-1">Valor por Categoría</h5>
                        <p class="text-muted small mb-0">Valor total del inventario por categoría</p>
                    </div>
                    <div class="chart-container">
                        <canvas id="valueByCategoryChart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-4">
            <div class="col-lg-4">
                <div class="card-custom">
                    <div class="card-header-custom d-flex justify-content-between align-items-center">
                        <h5 class="text-dark mb-0">Alertas Activas</h5>
                        <span class="badge bg-danger">${unreadAlerts.length}</span>
                    </div>
                    <div>
                        ${unreadAlerts.length > 0 ? unreadAlerts.slice(0, 4).map(alert => `
                            <div class="alert-card mb-2">
                                <div class="d-flex align-items-start gap-2">
                                    <i class="bi bi-exclamation-triangle ${alert.severidad === 'high' ? 'text-danger' : 'text-warning'}"></i>
                                    <div class="flex-grow-1">
                                        <p class="mb-0 text-dark small">${alert.titulo}</p>
                                        <p class="mb-0 text-muted" style="font-size: 0.75rem;">${alert.mensaje || ''}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('') : '<p class="text-muted text-center py-3">No hay alertas activas</p>'}
                    </div>
                </div>
            </div>
            <div class="col-lg-8">
                <div class="card-custom">
                    <div class="card-header-custom">
                        <h5 class="text-dark mb-1">Tendencias de Pedidos</h5>
                        <p class="text-muted small mb-0">Pedidos por mes (últimos 6 meses)</p>
                    </div>
                    <div class="chart-container">
                        <canvas id="ordersTrendChart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4">
            <div class="col-lg-6">
                <div class="card-custom">
                    <div class="card-header-custom">
                        <h5 class="text-dark mb-0">Movimientos Recientes</h5>
                    </div>
                    <div>
                        ${recentMovements.map(movement => `
                            <div class="d-flex justify-content-between align-items-center p-3 mb-2 bg-light rounded">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="rounded-circle d-flex align-items-center justify-content-center ${movement.tipo === 'entry' ? 'bg-success bg-opacity-25' : 'bg-danger bg-opacity-25'}" style="width: 40px; height: 40px;">
                                        <i class="bi bi-${movement.tipo === 'entry' ? 'arrow-up' : 'arrow-down'} text-${movement.tipo === 'entry' ? 'success' : 'danger'}"></i>
                                    </div>
                                    <div>
                                        <p class="mb-0 text-dark">${movement.producto_nombre || '-'}</p>
                                        <p class="mb-0 text-muted small">${movement.responsable_nombre || '-'}</p>
                                    </div>
                                </div>
                                <div class="text-end">
                                    <p class="mb-0 text-${movement.tipo === 'entry' ? 'success' : 'danger'}">
                                        ${movement.tipo === 'entry' ? '+' : '-'}${movement.cantidad}
                                    </p>
                                    <p class="mb-0 text-muted small">${movement.referencia || '-'}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card-custom">
                    <div class="card-header-custom">
                        <h5 class="text-dark mb-0">Productos con Stock Bajo</h5>
                    </div>
                    <div>
                        ${lowStockProducts.slice(0, 5).map(product => {
                            const percentage = (parseInt(product.stock) / parseInt(product.stock_minimo)) * 100;
                            return `
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                        <div>
                                            <p class="mb-0 text-dark">${product.nombre}</p>
                                            <p class="mb-0 text-muted small">${product.stock} / ${product.stock_minimo} unidades</p>
                                        </div>
                                        <span class="badge ${percentage < 50 ? 'bg-danger' : 'bg-secondary'}">${Math.round(percentage)}%</span>
                                    </div>
                                    <div class="progress progress-custom">
                                        <div class="progress-bar progress-bar-custom" style="width: ${percentage}%"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        return '<div class="alert alert-danger">Error cargando dashboard</div>';
    }
}

function initDashboardCharts() {
    if (!dashboardData) {
        console.warn('No hay datos del dashboard para renderizar gráficas');
        return;
    }

    // Stock Movement Chart
    const stockCtx = document.getElementById('stockChart');
    if (stockCtx && dashboardData.stockData) {
        const stockData = dashboardData.stockData || [];
        if (stockCtx.chart) {
            stockCtx.chart.destroy();
        }
        if (stockData.length > 0) {
            stockCtx.chart = new Chart(stockCtx, {
                type: 'line',
                data: {
                    labels: stockData.map(d => d.month),
                    datasets: [
                        {
                            label: 'Entradas',
                            data: stockData.map(d => d.entradas),
                            borderColor: '#27AE60',
                            backgroundColor: 'rgba(39, 174, 96, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Salidas',
                            data: stockData.map(d => d.salidas),
                            borderColor: '#E74C3C',
                            backgroundColor: 'rgba(231, 76, 60, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }
    }

    // Category Chart
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx && dashboardData.categoryData) {
        const categoryData = dashboardData.categoryData || [];
        if (categoryCtx.chart) {
            categoryCtx.chart.destroy();
        }
        if (categoryData.length > 0) {
            categoryCtx.chart = new Chart(categoryCtx, {
                type: 'doughnut',
                data: {
                    labels: categoryData.map(d => d.name),
                    datasets: [{
                        data: categoryData.map(d => d.value),
                        backgroundColor: categoryData.map(d => d.color)
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
    }

    // Cost Chart
    const costCtx = document.getElementById('costChart');
    if (costCtx && dashboardData.costData) {
        const costData = dashboardData.costData || [];
        if (costCtx.chart) {
            costCtx.chart.destroy();
        }
        if (costData.length > 0) {
            costCtx.chart = new Chart(costCtx, {
                type: 'bar',
                data: {
                    labels: costData.map(d => d.day),
                    datasets: [{
                        label: 'Costo ($)',
                        data: costData.map(d => d.costo),
                        backgroundColor: '#27AE60'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }
    }

    // Orders Status Chart
    const ordersStatusCtx = document.getElementById('ordersStatusChart');
    if (ordersStatusCtx && dashboardData.ordersStatusData) {
        const ordersStatusData = dashboardData.ordersStatusData || [];
        if (ordersStatusCtx.chart) {
            ordersStatusCtx.chart.destroy();
        }
        if (ordersStatusData.length > 0) {
            ordersStatusCtx.chart = new Chart(ordersStatusCtx, {
                type: 'pie',
                data: {
                    labels: ordersStatusData.map(d => d.label),
                    datasets: [{
                        data: ordersStatusData.map(d => d.value),
                        backgroundColor: ordersStatusData.map(d => d.color)
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
    }

    // Top Products Chart
    const topProductsCtx = document.getElementById('topProductsChart');
    if (topProductsCtx && dashboardData.topProductsData) {
        const topProductsData = dashboardData.topProductsData || [];
        if (topProductsCtx.chart) {
            topProductsCtx.chart.destroy();
        }
        if (topProductsData.length > 0) {
            topProductsCtx.chart = new Chart(topProductsCtx, {
                type: 'bar',
                data: {
                    labels: topProductsData.map(d => d.producto.length > 15 ? d.producto.substring(0, 15) + '...' : d.producto),
                    datasets: [{
                        label: 'Salidas',
                        data: topProductsData.map(d => d.total),
                        backgroundColor: '#3498DB'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { beginAtZero: true }
                    }
                }
            });
        }
    }

    // Value by Category Chart
    const valueByCategoryCtx = document.getElementById('valueByCategoryChart');
    if (valueByCategoryCtx && dashboardData.valueByCategoryData) {
        const valueByCategoryData = dashboardData.valueByCategoryData || [];
        if (valueByCategoryCtx.chart) {
            valueByCategoryCtx.chart.destroy();
        }
        if (valueByCategoryData.length > 0) {
            valueByCategoryCtx.chart = new Chart(valueByCategoryCtx, {
                type: 'bar',
                data: {
                    labels: valueByCategoryData.map(d => d.categoria),
                    datasets: [{
                        label: 'Valor ($)',
                        data: valueByCategoryData.map(d => d.valor),
                        backgroundColor: valueByCategoryData.map(d => d.color)
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }
    }

    // Orders Trend Chart
    const ordersTrendCtx = document.getElementById('ordersTrendChart');
    if (ordersTrendCtx && dashboardData.ordersTrendData) {
        const ordersTrendData = dashboardData.ordersTrendData || [];
        if (ordersTrendCtx.chart) {
            ordersTrendCtx.chart.destroy();
        }
        if (ordersTrendData.length > 0) {
            ordersTrendCtx.chart = new Chart(ordersTrendCtx, {
                type: 'line',
                data: {
                    labels: ordersTrendData.map(d => d.month),
                    datasets: [{
                        label: 'Pedidos',
                        data: ordersTrendData.map(d => d.cantidad),
                        borderColor: '#9B59B6',
                        backgroundColor: 'rgba(155, 89, 182, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }
    }
}

// Products Page
async function renderProducts() {
    // Solo cargar productos si no están cargados o si es la primera vez
    if (products.length === 0) {
        await loadProducts();
    }
    
    // Obtener el valor del filtro de categoría (usar variable global si el elemento no existe aún)
    const categorySelect = document.getElementById('product-category-filter');
    const categoriaFilter = categorySelect?.value || currentCategoryFilter || 'all';
    
    // Actualizar la variable global si hay un nuevo valor
    if (categorySelect && categorySelect.value) {
        currentCategoryFilter = categorySelect.value;
    }
    
    // Obtener valores de filtros antes de renderizar
    const searchInput = document.getElementById('product-search');
    const searchValue = searchInput?.value.toLowerCase().trim() || '';
    
    // Filtrar productos en el frontend basándose en el valor del input de búsqueda
    let filteredProducts = products.filter(product => {
        // Filtrar por búsqueda
        const matchesSearch = !searchValue || 
            product.nombre?.toLowerCase().includes(searchValue) || 
            product.sku?.toLowerCase().includes(searchValue);
        
        // Filtrar por categoría - si es "all", mostrar todos
        const matchesCategory = categoriaFilter === 'all' || categoriaFilter === '' || 
            product.categoria_nombre === categoriaFilter;
        
        return matchesSearch && matchesCategory;
    });

    return `
        <div class="mb-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                    <h2 class="text-dark mb-1">Gestión de Productos</h2>
                    <p class="text-muted mb-0">Administra tu catálogo de productos e inventario</p>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-success" data-bs-toggle="modal" data-bs-target="#importCSVModal">
                        <i class="bi bi-upload me-2"></i>Importar CSV
                    </button>
                    <button class="btn btn-success" id="btn-add-product" data-bs-toggle="modal" data-bs-target="#addProductModal">
                        <i class="bi bi-plus-lg me-2"></i>Agregar Producto
                    </button>
                </div>
            </div>
        </div>

        <div class="card-custom mb-4">
            <div class="row g-3 p-3">
                <div class="col-md-6">
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-search"></i></span>
                        <input type="text" class="form-control" id="product-search" placeholder="Buscar por nombre o SKU..." autocomplete="off">
                    </div>
                </div>
                <div class="col-md-6">
                    <select class="form-select" id="product-category-filter" onchange="handleCategoryFilterChange()">
                        <option value="all" ${categoriaFilter === 'all' || categoriaFilter === '' ? 'selected' : ''}>Todas las categorías</option>
                        ${categorias.map(cat => {
                            const isSelected = categoriaFilter === cat.nombre ? 'selected' : '';
                            return `<option value="${cat.nombre}" ${isSelected}>${cat.nombre}</option>`;
                        }).join('')}
                    </select>
                </div>
            </div>
        </div>

        <div class="card-custom">
            <div class="table-responsive">
                <table class="table table-custom mb-0">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Stock</th>
                            <th>Precio</th>
                            <th>Proveedor</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredProducts.map(product => {
                            // Asegurar conversión correcta a números y manejar valores nulos/vacíos
                            const stock = Number(product.stock) || 0;
                            const stockMinimo = Number(product.stock_minimo) || 0;
                            // El estado es "Stock Bajo" cuando el stock actual es menor que el stock mínimo
                            const isLowStock = stockMinimo > 0 && stock < stockMinimo;
                            
                            return `
                                <tr>
                                    <td>${product.sku}</td>
                                    <td>
                                        <div>
                                            <strong>${product.nombre}</strong>
                                            <br><small class="text-muted">${product.descripcion || ''}</small>
                                        </div>
                                    </td>
                                    <td>${product.categoria_nombre || product.categoria_id || '-'}</td>
                                    <td>
                                        <span class="${isLowStock ? 'text-danger fw-bold' : ''}">${stock}</span>
                                        <small class="text-muted">/ ${stockMinimo} min</small>
                                        ${isLowStock ? ' <i class="bi bi-exclamation-triangle text-danger"></i>' : ''}
                                    </td>
                                    <td>$${parseFloat(product.precio || 0).toFixed(2)}</td>
                                    <td>${product.proveedor_nombre || product.proveedor_id || '-'}</td>
                                    <td>
                                        ${isLowStock ? 
                                            '<span class="badge bg-danger">Stock Bajo</span>' : 
                                            '<span class="badge bg-success">Normal</span>'}
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct(${product.id})">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${product.id})">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        ${renderAddProductModal()}
        ${renderEditProductModal()}
        ${renderDeleteProductModal()}
        ${renderImportCSVModal()}
    `;
}

function renderAddProductModal() {
    // Calcular el siguiente SKU basado en la cantidad de productos
    // Asegurar que siempre tengamos un valor válido
    let totalProducts = 0;
    if (Array.isArray(products) && products.length > 0) {
        totalProducts = products.length;
    }
    
    // Si no hay productos, empezar con PROD-0001
    const nextNumber = totalProducts + 1;
    const initialSku = 'PROD-' + String(nextNumber).padStart(4, '0');
    
    // Debug: verificar que el SKU se calcula correctamente
    console.log('🔍 Renderizando modal - Productos:', totalProducts, 'SKU inicial:', initialSku);
    
    return `
        <div class="modal fade" id="addProductModal" tabindex="-1" aria-labelledby="addProductModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="addProductModalLabel">Nuevo Producto</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form onsubmit="handleAddProduct(event)" id="addProductForm">
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label for="auto-sku" class="form-label">SKU *</label>
                                    <input type="text" class="form-control" name="sku" id="auto-sku" value="${initialSku}" readonly required style="background-color: #f8f9fa; cursor: not-allowed;">
                                    <small class="text-muted"><i class="bi bi-info-circle"></i> Generado automáticamente</small>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Nombre *</label>
                                    <input type="text" class="form-control" name="name" required>
                                </div>
                                <div class="col-12">
                                    <label class="form-label">Descripción</label>
                                    <textarea class="form-control" name="description" rows="2"></textarea>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Categoría *</label>
                                    <select class="form-select" name="category" required>
                                        <option value="">Seleccionar...</option>
                                        ${categorias.map(cat => `<option value="${cat.nombre}">${cat.nombre}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Proveedor *</label>
                                    <select class="form-select" name="supplier" required>
                                        <option value="">Seleccionar...</option>
                                        ${suppliers.map(s => `<option value="${s.nombre}">${s.nombre}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Stock *</label>
                                    <input type="number" class="form-control" name="stock" min="0" required>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Stock Mínimo *</label>
                                    <input type="number" class="form-control" name="minStock" min="0" required>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Precio *</label>
                                    <input type="number" class="form-control" name="price" min="0" step="0.01" required>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-success">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

async function handleAddProduct(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Validación básica en el frontend
    const sku = formData.get('sku') || generateNextSku(); // Usar el SKU del formulario o generar uno
    const nombre = formData.get('name');
    const categoria = formData.get('category');
    const proveedor = formData.get('supplier');
    const stock = formData.get('stock');
    const minStock = formData.get('minStock');
    const precio = formData.get('price');
    
    if (!nombre || !categoria || !proveedor || !stock || !minStock || !precio) {
        alert('Por favor completa todos los campos requeridos');
        return;
    }
    
    try {
        const response = await apiCall('productos.php', 'POST', {
            sku: sku.trim(),
            nombre: nombre.trim(),
            descripcion: formData.get('description') || '',
            categoria: categoria.trim(),
            stock: Number(stock),
            stock_minimo: Number(minStock),
            precio: Number(precio),
            proveedor: proveedor.trim()
        });
        
        if (response && response.success) {
            bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
            // Limpiar el formulario
            e.target.reset();
            // Recargar productos
            products = [];
            await loadProducts();
            renderCurrentView();
            // Sin mensaje de alerta
        } else {
            alert('Error al crear producto: ' + (response?.error || response?.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error completo:', error);
        alert('Error al crear producto: ' + (error.message || 'Error de conexión. Verifica la consola para más detalles.'));
    }
}

async function editProduct(id) {
    try {
        // Asegurar que tenemos los datos más recientes
        await loadProducts();
        const product = products.find(p => p.id == id);
        
        if (!product) {
            alert('Producto no encontrado');
            return;
        }
        
        // Cargar categorías y proveedores si no están cargados
        await loadCategorias();
        await loadSuppliers();
        
        // Verificar que el modal existe, si no, esperar a que se renderice
        let editModal = document.getElementById('editProductModal');
        if (!editModal) {
            // Si el modal no existe, forzar renderizado
            await renderCurrentView();
            editModal = document.getElementById('editProductModal');
            if (!editModal) {
                alert('Error: No se pudo cargar el formulario de edición. Por favor recarga la página.');
                return;
            }
        }
        
        // Actualizar las opciones de categorías y proveedores en el select
        const categorySelect = document.getElementById('edit-product-category');
        const supplierSelect = document.getElementById('edit-product-supplier');
        
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Seleccionar...</option>' + 
                categorias.map(cat => `<option value="${cat.nombre}">${cat.nombre}</option>`).join('');
        }
        
        if (supplierSelect) {
            supplierSelect.innerHTML = '<option value="">Seleccionar...</option>' + 
                suppliers.map(s => `<option value="${s.nombre}">${s.nombre}</option>`).join('');
        }
        
        // Llenar el formulario de edición
        document.getElementById('edit-product-id').value = product.id;
        document.getElementById('edit-product-sku').value = product.sku || '';
        document.getElementById('edit-product-name').value = product.nombre || '';
        document.getElementById('edit-product-description').value = product.descripcion || '';
        if (categorySelect) categorySelect.value = product.categoria_nombre || '';
        if (supplierSelect) supplierSelect.value = product.proveedor_nombre || '';
        document.getElementById('edit-product-stock').value = product.stock || 0;
        document.getElementById('edit-product-minStock').value = product.stock_minimo || 0;
        document.getElementById('edit-product-price').value = product.precio || 0;
        
        // Abrir el modal
        const modal = new bootstrap.Modal(editModal);
        modal.show();
    } catch (error) {
        console.error('Error al cargar producto para editar:', error);
        alert('Error al cargar el producto para editar: ' + error.message);
    }
}

async function handleUpdateProduct(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const productId = formData.get('productId');
    
    try {
        const response = await apiCall('productos.php', 'PUT', {
            id: parseInt(productId),
            sku: formData.get('sku'),
            nombre: formData.get('name'),
            descripcion: formData.get('description') || '',
            categoria: formData.get('category'),
            stock: Number(formData.get('stock')),
            stock_minimo: Number(formData.get('minStock')),
            precio: Number(formData.get('price')),
            proveedor: formData.get('supplier')
        });
        
        if (response.success) {
            bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
            // Limpiar el formulario
            e.target.reset();
            // Forzar recarga completa de productos para asegurar que el estado se calcule correctamente
            products = [];
            await loadProducts();
            // Forzar re-renderizado completo de la vista
            await renderCurrentView();
        } else {
            alert('Error al actualizar producto: ' + (response.message || 'Error desconocido'));
        }
    } catch (error) {
        alert('Error al actualizar producto: ' + error.message);
    }
}

function renderEditProductModal() {
    return `
        <div class="modal fade" id="editProductModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Editar Producto</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form onsubmit="handleUpdateProduct(event)">
                        <input type="hidden" name="productId" id="edit-product-id">
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">SKU *</label>
                                    <input type="text" class="form-control" name="sku" id="edit-product-sku" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Nombre *</label>
                                    <input type="text" class="form-control" name="name" id="edit-product-name" required>
                                </div>
                                <div class="col-12">
                                    <label class="form-label">Descripción</label>
                                    <textarea class="form-control" name="description" id="edit-product-description" rows="2"></textarea>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Categoría *</label>
                                    <select class="form-select" name="category" id="edit-product-category" required>
                                        <option value="">Seleccionar...</option>
                                        ${categorias.map(cat => `<option value="${cat.nombre}">${cat.nombre}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Proveedor *</label>
                                    <select class="form-select" name="supplier" id="edit-product-supplier" required>
                                        <option value="">Seleccionar...</option>
                                        ${suppliers.map(s => `<option value="${s.nombre}">${s.nombre}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Stock *</label>
                                    <input type="number" class="form-control" name="stock" id="edit-product-stock" min="0" required>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Stock Mínimo *</label>
                                    <input type="number" class="form-control" name="minStock" id="edit-product-minStock" min="0" required>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Precio *</label>
                                    <input type="number" class="form-control" name="price" id="edit-product-price" min="0" step="0.01" required>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-success">Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// Función para abrir el modal de confirmación de eliminación
async function deleteProduct(id) {
        try {
        // Buscar el producto para mostrar información en el modal
            await loadProducts();
        const product = products.find(p => p.id == id);
        
        if (!product) {
            alert('Producto no encontrado');
            return;
        }
        
        // Llenar el modal con información del producto
        document.getElementById('delete-product-id').value = id;
        document.getElementById('delete-product-name').textContent = product.nombre;
        document.getElementById('delete-product-sku').textContent = product.sku || '-';
        
        // Mostrar el modal
        const deleteModal = document.getElementById('deleteProductModal');
        if (deleteModal) {
            const modal = new bootstrap.Modal(deleteModal);
            modal.show();
        } else {
            // Fallback si el modal no existe
            if (confirm('⚠️ ¿Estás seguro de eliminar este producto permanentemente?\n\nEsta acción no se puede deshacer y el producto será eliminado de la base de datos.')) {
                await confirmDeleteProduct();
            }
        }
        } catch (error) {
        console.error('Error al cargar producto para eliminar:', error);
        alert('Error al cargar la información del producto: ' + error.message);
    }
}

// Función que ejecuta la eliminación después de confirmar
async function confirmDeleteProduct() {
    const productIdInput = document.getElementById('delete-product-id');
    if (!productIdInput) return;
    
    const id = productIdInput.value;
    if (!id) return;
    
    // Cerrar el modal primero
    const deleteModal = document.getElementById('deleteProductModal');
    if (deleteModal) {
        const modalInstance = bootstrap.Modal.getInstance(deleteModal);
        if (modalInstance) {
            modalInstance.hide();
        }
    }
    
    try {
        const response = await apiCall(`productos.php?id=${id}`, 'DELETE');
        if (response && response.success) {
            // Forzar recarga completa de productos desde la base de datos
            products = [];
            await loadProducts();
            await renderCurrentView();
            console.log('✅ Producto eliminado exitosamente de la base de datos');
        } else {
            alert('❌ Error al eliminar producto: ' + (response?.message || response?.error || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error completo al eliminar:', error);
        const errorMessage = error.message || 'Error de conexión';
        alert('❌ Error al eliminar producto: ' + errorMessage + '\n\nVerifica la consola para más detalles.');
        // Recargar productos para asegurar sincronización
        products = [];
        await loadProducts();
        await renderCurrentView();
    }
}

// Función para renderizar el modal de confirmación de eliminación
function renderDeleteProductModal() {
    return `
        <div class="modal fade" id="deleteProductModal" tabindex="-1" aria-labelledby="deleteProductModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title" id="deleteProductModalLabel">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>Confirmar Eliminación
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="delete-product-id">
                        <div class="text-center mb-3">
                            <i class="bi bi-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
                        </div>
                        <p class="text-center mb-3">
                            ¿Estás seguro de eliminar este producto <strong>permanentemente</strong>?
                        </p>
                        <div class="card bg-light p-3 mb-3">
                            <div class="mb-2">
                                <strong>Nombre:</strong> <span id="delete-product-name">-</span>
                            </div>
                            <div>
                                <strong>SKU:</strong> <span id="delete-product-sku">-</span>
                            </div>
                        </div>
                        <div class="alert alert-warning mb-0" role="alert">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Advertencia:</strong> Esta acción no se puede deshacer. El producto será eliminado permanentemente de la base de datos.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-danger" onclick="confirmDeleteProduct()">
                            <i class="bi bi-trash me-2"></i>Eliminar Permanentemente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Función para renderizar el modal de importar CSV
function renderImportCSVModal() {
    return `
        <div class="modal fade" id="importCSVModal" tabindex="-1" aria-labelledby="importCSVModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title" id="importCSVModalLabel">
                            <i class="bi bi-file-earmark-spreadsheet me-2"></i>Importar Productos desde CSV
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info mb-3" role="alert">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Formato del CSV:</strong> El archivo debe tener las siguientes columnas:
                            <ul class="mb-0 mt-2">
                                <li><strong>nombre</strong> (requerido) - Nombre del producto</li>
                                <li><strong>descripcion</strong> (opcional) - Descripción del producto</li>
                                <li><strong>categoria</strong> (requerido) - Nombre de la categoría</li>
                                <li><strong>stock</strong> (requerido) - Cantidad en stock</li>
                                <li><strong>stock_minimo</strong> (requerido) - Stock mínimo</li>
                                <li><strong>precio</strong> (requerido) - Precio del producto</li>
                                <li><strong>proveedor</strong> (requerido) - Nombre del proveedor</li>
                                <li><strong>sku</strong> (opcional) - SKU del producto (se generará automáticamente si no se proporciona)</li>
                            </ul>
                        </div>
                        
                        <div class="mb-3">
                            <label for="csv-file" class="form-label">Seleccionar archivo CSV</label>
                            <input type="file" class="form-control" id="csv-file" accept=".csv" required>
                            <small class="text-muted">Selecciona un archivo CSV con la estructura indicada arriba</small>
                        </div>
                        
                        <div id="csv-import-progress" class="d-none">
                            <div class="progress mb-3">
                                <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 100%"></div>
                            </div>
                            <p class="text-center mb-0">Procesando archivo CSV...</p>
                        </div>
                        
                        <div id="csv-import-results" class="d-none"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-success" id="btn-import-csv" onclick="handleImportCSV()">
                            <i class="bi bi-upload me-2"></i>Importar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Función para manejar la importación de CSV
async function handleImportCSV() {
    const fileInput = document.getElementById('csv-file');
    const progressDiv = document.getElementById('csv-import-progress');
    const resultsDiv = document.getElementById('csv-import-results');
    const importBtn = document.getElementById('btn-import-csv');
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert('Por favor selecciona un archivo CSV');
        return;
    }
    
    const file = fileInput.files[0];
    
    // Validar que sea un archivo CSV
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
        alert('Por favor selecciona un archivo CSV válido');
        return;
    }
    
    // Mostrar progreso
    progressDiv.classList.remove('d-none');
    resultsDiv.classList.add('d-none');
    importBtn.disabled = true;
    
    try {
        // Leer el archivo CSV
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
            throw new Error('El archivo CSV debe tener al menos una fila de encabezado y una fila de datos');
        }
        
        // Parsear el CSV (manejar comillas y comas dentro de valores)
        const parseCSVLine = (line) => {
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());
            return values;
        };
        
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim().replace(/"/g, ''));
        const productsToImport = [];
        
        // Validar headers requeridos
        const requiredHeaders = ['nombre', 'categoria', 'stock', 'stock_minimo', 'precio', 'proveedor'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
            throw new Error('Faltan las siguientes columnas requeridas: ' + missingHeaders.join(', '));
        }
        
        // Procesar cada fila
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            
            if (values.length !== headers.length) {
                console.warn(`Fila ${i + 1} tiene un número incorrecto de columnas (${values.length} vs ${headers.length}), se omitirá`);
                continue;
            }
            
            const product = {};
            headers.forEach((header, index) => {
                product[header] = (values[index] || '').replace(/^"|"$/g, '');
            });
            
            // Validar campos requeridos
            if (!product.nombre || !product.categoria || !product.proveedor) {
                console.warn(`Fila ${i + 1} tiene campos requeridos vacíos, se omitirá`);
                continue;
            }
            
            productsToImport.push(product);
        }
        
        if (productsToImport.length === 0) {
            throw new Error('No se encontraron productos válidos en el archivo CSV');
        }
        
        // Enviar productos al servidor
        const response = await apiCall('importar_productos.php', 'POST', {
            products: productsToImport
        });
        
        // Ocultar progreso
        progressDiv.classList.add('d-none');
        importBtn.disabled = false;
        
        if (response && response.success) {
            const imported = response.imported || 0;
            const errors = response.errors || [];
            
            // Mostrar resultados
            let resultsHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>Importación completada:</strong> ${imported} producto(s) importado(s) exitosamente de ${response.total || productsToImport.length} total
                </div>
            `;
            
            if (errors.length > 0) {
                resultsHTML += `
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        <strong>Errores encontrados (${errors.length}):</strong>
                        <ul class="mb-0 mt-2" style="max-height: 200px; overflow-y: auto;">
                            ${errors.slice(0, 10).map(error => `<li>${error}</li>`).join('')}
                            ${errors.length > 10 ? `<li><em>... y ${errors.length - 10} error(es) más</em></li>` : ''}
                        </ul>
                    </div>
                `;
            }
            
            resultsDiv.innerHTML = resultsHTML;
            resultsDiv.classList.remove('d-none');
            
            // Recargar productos y actualizar vista
            products = [];
            await loadProducts();
            await renderCurrentView();
            
            // Limpiar el input de archivo
            fileInput.value = '';
            
            // Cerrar modal después de 3 segundos si todo fue exitoso
            if (errors.length === 0) {
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('importCSVModal'));
                    if (modal) {
                        modal.hide();
                        resultsDiv.classList.add('d-none');
                    }
                }, 3000);
            }
        } else {
            throw new Error(response?.message || response?.error || 'Error al importar productos');
        }
    } catch (error) {
        console.error('Error al importar CSV:', error);
        progressDiv.classList.add('d-none');
        importBtn.disabled = false;
        resultsDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-x-circle me-2"></i>
                <strong>Error:</strong> ${error.message}
            </div>
        `;
        resultsDiv.classList.remove('d-none');
    }
}

// Suppliers Page
function renderSuppliers() {
    // Solo cargar proveedores si no están cargados o si es la primera vez
    if (suppliers.length === 0) {
        loadSuppliers();
    }
    
    // Obtener valor de búsqueda antes de renderizar
    const searchInput = document.getElementById('supplier-search');
    const searchValue = searchInput?.value.toLowerCase().trim() || '';
    
    // Filtrar proveedores en el frontend basándose en el valor del input de búsqueda
    const filteredSuppliers = suppliers.filter(supplier => {
        // Filtrar por búsqueda (nombre, contacto, email, teléfono)
        const matchesSearch = !searchValue || 
            supplier.nombre?.toLowerCase().includes(searchValue) || 
            supplier.contacto?.toLowerCase().includes(searchValue) ||
            supplier.email?.toLowerCase().includes(searchValue) ||
            supplier.telefono?.toLowerCase().includes(searchValue);
        
        return matchesSearch;
    });

    return `
        <div class="mb-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                    <h2 class="text-dark mb-1">Gestión de Proveedores</h2>
                    <p class="text-muted mb-0">Administra tus proveedores y relaciones comerciales</p>
                </div>
                <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#addSupplierModal">
                    <i class="bi bi-plus-lg me-2"></i>Agregar Proveedor
                </button>
            </div>
        </div>

        <div class="card-custom mb-4">
            <div class="p-3">
                <div class="d-flex gap-2 align-items-center">
                    <div class="input-group flex-grow-1">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                        <input type="text" class="form-control" id="supplier-search" placeholder="Buscar por nombre, contacto, email o teléfono..." autocomplete="off">
                    </div>
                    ${searchValue ? `
                        <button class="btn btn-outline-secondary border" onclick="clearSupplierSearch()" style="height: 38px; white-space: nowrap; min-width: 140px; padding-left: 8px; padding-right: 16px; border-color: #dee2e6 !important;">
                            <i class="bi bi-arrow-counterclockwise me-1"></i>Mostrar Todos
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>

        <div class="row g-4">
            ${filteredSuppliers.map(supplier => `
                <div class="col-md-6 col-lg-4">
                    <div class="card-custom">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="text-dark mb-0">${supplier.nombre}</h5>
                            <div class="dropdown">
                                <button class="btn btn-link" data-bs-toggle="dropdown">
                                    <i class="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" onclick="editSupplier(${supplier.id})">Editar</a></li>
                                    <li><a class="dropdown-item text-danger" href="#" onclick="deleteSupplier(${supplier.id})">Eliminar</a></li>
                                </ul>
                            </div>
                        </div>
                        <div class="mb-2">
                            <i class="bi bi-person me-2 text-muted"></i>
                            <span class="text-muted">${supplier.contacto}</span>
                        </div>
                        <div class="mb-2">
                            <i class="bi bi-envelope me-2 text-muted"></i>
                            <span class="text-muted">${supplier.email}</span>
                        </div>
                        <div class="mb-2">
                            <i class="bi bi-telephone me-2 text-muted"></i>
                            <span class="text-muted">${supplier.telefono}</span>
                        </div>
                        <div class="mb-3">
                            <i class="bi bi-geo-alt me-2 text-muted"></i>
                            <span class="text-muted">${supplier.direccion || '-'}</span>
                        </div>
                        <div class="d-flex justify-content-between pt-3 border-top">
                            <div class="text-center">
                                <div class="fw-bold text-dark">${supplier.productos_suministrados || 0}</div>
                                <div class="text-muted small">Productos</div>
                            </div>
                            <div class="text-center">
                                <div class="fw-bold text-dark">${supplier.total_pedidos || 0}</div>
                                <div class="text-muted small">Pedidos</div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

        ${renderAddSupplierModal()}
        ${renderEditSupplierModal()}
        ${renderDeleteSupplierModal()}
    `;
}

function renderAddSupplierModal() {
    return `
        <div class="modal fade" id="addSupplierModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Nuevo Proveedor</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form onsubmit="handleAddSupplier(event)">
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Nombre de la Empresa *</label>
                                    <input type="text" class="form-control" name="name" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Persona de Contacto *</label>
                                    <input type="text" class="form-control" name="contact" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Correo Electrónico *</label>
                                    <input type="email" class="form-control" name="email" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Teléfono *</label>
                                    <input type="tel" class="form-control" name="phone" required>
                                </div>
                                <div class="col-12">
                                    <label class="form-label">Dirección *</label>
                                    <input type="text" class="form-control" name="address" required>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-success">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// Función para renderizar el modal de edición de proveedor
function renderEditSupplierModal() {
    return `
        <div class="modal fade" id="editSupplierModal" tabindex="-1" aria-labelledby="editSupplierModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="editSupplierModalLabel">Editar Proveedor</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form onsubmit="handleUpdateSupplier(event)">
                        <input type="hidden" name="supplierId" id="edit-supplier-id">
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Nombre de la Empresa *</label>
                                    <input type="text" class="form-control" name="name" id="edit-supplier-name" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Persona de Contacto *</label>
                                    <input type="text" class="form-control" name="contact" id="edit-supplier-contact" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Correo Electrónico *</label>
                                    <input type="email" class="form-control" name="email" id="edit-supplier-email" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Teléfono *</label>
                                    <input type="tel" class="form-control" name="phone" id="edit-supplier-phone" required>
                                </div>
                                <div class="col-12">
                                    <label class="form-label">Dirección *</label>
                                    <input type="text" class="form-control" name="address" id="edit-supplier-address" required>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-success">Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// Función para renderizar el modal de confirmación de eliminación de proveedor
function renderDeleteSupplierModal() {
    return `
        <div class="modal fade" id="deleteSupplierModal" tabindex="-1" aria-labelledby="deleteSupplierModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title" id="deleteSupplierModalLabel">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>Confirmar Eliminación
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="delete-supplier-id">
                        <div class="text-center mb-3">
                            <i class="bi bi-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
                        </div>
                        <p class="text-center mb-3">
                            ¿Estás seguro de eliminar este proveedor?
                        </p>
                        <div class="card bg-light p-3 mb-3">
                            <div class="mb-2">
                                <strong>Nombre:</strong> <span id="delete-supplier-name">-</span>
                            </div>
                            <div>
                                <strong>Contacto:</strong> <span id="delete-supplier-contact">-</span>
                            </div>
                        </div>
                        <div class="alert alert-warning mb-0" role="alert">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Advertencia:</strong> Esta acción no se puede deshacer. El proveedor será eliminado permanentemente de la base de datos. Los productos asociados se desvincularán automáticamente.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-danger" onclick="confirmDeleteSupplier()">
                            <i class="bi bi-trash me-2"></i>Eliminar Permanentemente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function handleAddSupplier(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        const response = await apiCall('proveedores.php', 'POST', {
            nombre: formData.get('name'),
            contacto: formData.get('contact'),
            email: formData.get('email'),
            telefono: formData.get('phone'),
            direccion: formData.get('address')
        });
        
        if (response.success) {
            bootstrap.Modal.getInstance(document.getElementById('addSupplierModal')).hide();
            await loadSuppliers();
            renderCurrentView();
        }
    } catch (error) {
        alert('Error al crear proveedor: ' + error.message);
    }
}

// Función para abrir el modal de edición de proveedor
async function editSupplier(id) {
    try {
        // Asegurar que tenemos los datos más recientes
        await loadSuppliers();
        const supplier = suppliers.find(s => s.id == id);
        
        if (!supplier) {
            alert('Proveedor no encontrado');
            return;
        }
        
        // Llenar el formulario de edición
        document.getElementById('edit-supplier-id').value = supplier.id;
        document.getElementById('edit-supplier-name').value = supplier.nombre || '';
        document.getElementById('edit-supplier-contact').value = supplier.contacto || '';
        document.getElementById('edit-supplier-email').value = supplier.email || '';
        document.getElementById('edit-supplier-phone').value = supplier.telefono || '';
        document.getElementById('edit-supplier-address').value = supplier.direccion || '';
        
        // Abrir el modal
        const editModal = document.getElementById('editSupplierModal');
        if (editModal) {
            const modal = new bootstrap.Modal(editModal);
            modal.show();
        }
    } catch (error) {
        console.error('Error al cargar proveedor para editar:', error);
        alert('Error al cargar el proveedor para editar: ' + error.message);
    }
}

// Función para manejar la actualización de proveedor
async function handleUpdateSupplier(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get('supplierId');
    
    try {
        const response = await apiCall('proveedores.php', 'PUT', {
            id: id,
            nombre: formData.get('name'),
            contacto: formData.get('contact'),
            email: formData.get('email'),
            telefono: formData.get('phone'),
            direccion: formData.get('address')
        });
        
        if (response && response.success) {
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editSupplierModal'));
            if (modal) {
                modal.hide();
            }
            
            // Recargar proveedores y actualizar vista
            await loadSuppliers();
            renderCurrentView();
        } else {
            alert('Error al actualizar proveedor: ' + (response?.error || 'Error desconocido'));
        }
        } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        alert('Error al actualizar proveedor: ' + error.message);
    }
}

// Función para abrir el modal de confirmación de eliminación
async function deleteSupplier(id) {
    try {
        // Asegurar que tenemos los datos más recientes
        await loadSuppliers();
        const supplier = suppliers.find(s => s.id == id);
        
        if (!supplier) {
            alert('Proveedor no encontrado');
            return;
        }
        
        // Llenar el modal con información del proveedor
        document.getElementById('delete-supplier-id').value = id;
        document.getElementById('delete-supplier-name').textContent = supplier.nombre;
        document.getElementById('delete-supplier-contact').textContent = supplier.contacto || '-';
        
        // Mostrar el modal
        const deleteModal = document.getElementById('deleteSupplierModal');
        if (deleteModal) {
            const modal = new bootstrap.Modal(deleteModal);
            modal.show();
        } else {
            // Fallback si el modal no existe
            if (confirm('⚠️ ¿Estás seguro de eliminar este proveedor permanentemente?\n\nEsta acción no se puede deshacer y el proveedor será eliminado de la base de datos.')) {
                await confirmDeleteSupplier();
            }
        }
    } catch (error) {
        console.error('Error al cargar proveedor para eliminar:', error);
        alert('Error al cargar la información del proveedor: ' + error.message);
    }
}

// Función que ejecuta la eliminación después de confirmar
async function confirmDeleteSupplier() {
    const supplierIdInput = document.getElementById('delete-supplier-id');
    if (!supplierIdInput) return;
    
    const id = supplierIdInput.value;
    if (!id) return;
    
    // Cerrar el modal primero
    const deleteModal = document.getElementById('deleteSupplierModal');
    if (deleteModal) {
        const modalInstance = bootstrap.Modal.getInstance(deleteModal);
        if (modalInstance) {
            modalInstance.hide();
        }
    }
    
    try {
        const response = await apiCall(`proveedores.php?id=${id}`, 'DELETE');
        if (response && response.success) {
            // Recargar proveedores y actualizar vista
            await loadSuppliers();
            renderCurrentView();
            console.log('✅ Proveedor eliminado exitosamente');
        } else {
            alert('❌ Error al eliminar proveedor: ' + (response?.message || response?.error || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error completo al eliminar:', error);
        const errorMessage = error.message || 'Error de conexión';
        alert('❌ Error al eliminar proveedor: ' + errorMessage + '\n\nVerifica la consola para más detalles.');
        // Recargar proveedores para asegurar sincronización
        await loadSuppliers();
        renderCurrentView();
    }
}

// Movements Page
function renderMovements() {
    // Solo cargar movimientos si no están cargados o si es la primera vez
    if (movements.length === 0) {
        loadMovements();
    }
    
    // Obtener el valor del filtro de tipo (usar variable global si el elemento no existe aún)
    const typeSelect = document.getElementById('movement-type-filter');
    const tipoFilter = typeSelect?.value || currentMovementTypeFilter || 'all';
    
    // Actualizar la variable global si hay un nuevo valor
    if (typeSelect && typeSelect.value) {
        currentMovementTypeFilter = typeSelect.value;
    }
    
    // Obtener valores de filtros antes de renderizar
    const searchInput = document.getElementById('movement-search');
    const searchValue = searchInput?.value.toLowerCase().trim() || '';
    
    // Filtrar movimientos en el frontend basándose en el valor del input de búsqueda
    let filteredMovements = movements.filter(movement => {
        // Filtrar por búsqueda - buscar en: producto, responsable, referencia, notas
        const matchesSearch = !searchValue || 
            movement.producto_nombre?.toLowerCase().includes(searchValue) || 
            movement.responsable_nombre?.toLowerCase().includes(searchValue) ||
            movement.referencia?.toLowerCase().includes(searchValue) ||
            movement.notas?.toLowerCase().includes(searchValue);
        
        // Filtrar por tipo - si es "all", mostrar todos
        const matchesType = tipoFilter === 'all' || tipoFilter === '' || 
            movement.tipo === tipoFilter;
        
        return matchesSearch && matchesType;
    });
    
    const totalEntries = filteredMovements.filter(m => m.tipo === 'entry').reduce((sum, m) => sum + (parseInt(m.cantidad) || 0), 0);
    const totalExits = filteredMovements.filter(m => m.tipo === 'exit').reduce((sum, m) => sum + (parseInt(m.cantidad) || 0), 0);

    return `
        <div class="mb-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                    <h2 class="text-dark mb-1">Movimientos de Inventario</h2>
                    <p class="text-muted mb-0">Registro de entradas y salidas de productos</p>
                </div>
                <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#addMovementModal">
                    <i class="bi bi-plus-lg me-2"></i>Registrar Movimiento
                </button>
            </div>
        </div>

        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="card" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); height: 100%;">
                    <div class="card-body d-flex align-items-center p-4">
                        <div class="me-3">
                            <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #d4edda; display: flex; align-items: center; justify-content: center;">
                                <i class="bi bi-arrow-up" style="font-size: 1.5rem; color: #198754;"></i>
                            </div>
                        </div>
                        <div class="flex-grow-1">
                            <div class="text-muted small mb-1" style="font-size: 0.875rem;">Total Entradas</div>
                            <div class="h5 mb-0" style="font-weight: 600; color: #212529;">${totalEntries} unidades</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); height: 100%;">
                    <div class="card-body d-flex align-items-center p-4">
                        <div class="me-3">
                            <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #f8d7da; display: flex; align-items: center; justify-content: center;">
                                <i class="bi bi-arrow-down" style="font-size: 1.5rem; color: #dc3545;"></i>
                            </div>
                        </div>
                        <div class="flex-grow-1">
                            <div class="text-muted small mb-1" style="font-size: 0.875rem;">Total Salidas</div>
                            <div class="h5 mb-0" style="font-weight: 600; color: #212529;">${totalExits} unidades</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); height: 100%;">
                    <div class="card-body d-flex align-items-center p-4">
                        <div class="me-3">
                            <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #cfe2ff; display: flex; align-items: center; justify-content: center;">
                                <i class="bi bi-file-text" style="font-size: 1.5rem; color: #0d6efd;"></i>
                            </div>
                        </div>
                        <div class="flex-grow-1">
                            <div class="text-muted small mb-1" style="font-size: 0.875rem;">Balance</div>
                            <div class="h5 mb-0" style="font-weight: 600; color: #212529;">
                                ${(totalEntries - totalExits) >= 0 ? '+' : ''}${totalEntries - totalExits} unidades
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card-custom mb-4">
            <div class="row g-3 p-3">
                <div class="col-md-6">
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-search"></i></span>
                        <input type="text" class="form-control" id="movement-search" placeholder="Buscar por producto, responsable, referencia..." autocomplete="off">
                    </div>
                </div>
                <div class="col-md-6">
                    <select class="form-select" id="movement-type-filter" onchange="handleMovementTypeFilterChange()">
                        <option value="all" ${tipoFilter === 'all' || tipoFilter === '' ? 'selected' : ''}>Todos los tipos</option>
                        <option value="entry" ${tipoFilter === 'entry' ? 'selected' : ''}>Entradas</option>
                        <option value="exit" ${tipoFilter === 'exit' ? 'selected' : ''}>Salidas</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="card-custom">
            <div class="table-responsive">
                <table class="table table-custom mb-0">
                    <thead>
                        <tr>
                            <th>Tipo</th>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Responsable</th>
                            <th>Referencia</th>
                            <th>Fecha</th>
                            <th>Notas</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredMovements.map(movement => `
                            <tr>
                                <td>
                                    <span class="badge status-${movement.tipo}">
                                        ${movement.tipo === 'entry' ? 'Entrada' : 'Salida'}
                                    </span>
                                </td>
                                <td>${movement.producto_nombre || '-'}</td>
                                <td class="${movement.tipo === 'entry' ? 'text-success' : 'text-danger'}">
                                    ${movement.tipo === 'entry' ? '+' : '-'}${movement.cantidad}
                                </td>
                                <td>${movement.responsable_nombre || '-'}</td>
                                <td>${movement.referencia || '-'}</td>
                                <td>${new Date(movement.fecha_movimiento).toLocaleDateString()}</td>
                                <td>${movement.notas || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        ${renderAddMovementModal()}
        ${renderMovementErrorModal()}
    `;
}

function renderAddMovementModal() {
    // Nota: Los usuarios se cargarán dinámicamente cuando se abra el modal
    
    return `
        <div class="modal fade" id="addMovementModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Nuevo Movimiento</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form onsubmit="handleAddMovement(event)" id="addMovementForm">
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Tipo de Movimiento *</label>
                                    <select class="form-select" name="type" id="movement-type" required onchange="updateMovementReference()">
                                        <option value="entry">Entrada</option>
                                        <option value="exit">Salida</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Producto *</label>
                                    <select class="form-select" name="product" required>
                                        <option value="">Seleccionar...</option>
                                        ${products.map(p => `<option value="${p.id}">${p.nombre} (Stock: ${p.stock || 0})</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Cantidad *</label>
                                    <input type="number" class="form-control" name="quantity" min="1" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Responsable *</label>
                                    ${currentUser && ((currentUser.rol === 'admin') || (currentUser.role === 'admin')) ? `
                                        <select class="form-select" name="responsable_id" id="movement-responsable" required>
                                            <option value="">Seleccionar...</option>
                                            <!-- Los usuarios se cargarán dinámicamente al abrir el modal -->
                                        </select>
                                    ` : `
                                        <input type="text" class="form-control" value="${currentUser ? currentUser.nombre : 'Usuario no identificado'}" readonly style="background-color: #f8f9fa; cursor: not-allowed;">
                                    <input type="hidden" name="responsable_id" value="${currentUser ? currentUser.id : 1}">
                                        <small class="text-muted">Usuario actual</small>
                                    `}
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Referencia *</label>
                                    <input type="text" class="form-control" name="reference" id="movement-reference" readonly>
                                    <small class="text-muted">Generada automáticamente</small>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Fecha</label>
                                    <input type="datetime-local" class="form-control" name="timestamp" value="${new Date().toISOString().slice(0, 16)}">
                                </div>
                                <div class="col-12">
                                    <label class="form-label">Notas</label>
                                    <textarea class="form-control" name="notes" rows="2"></textarea>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-success">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// Función para renderizar el modal de error de movimiento
function renderMovementErrorModal() {
    return `
        <div class="modal fade" id="movementErrorModal" tabindex="-1" aria-labelledby="movementErrorModalLabel" aria-hidden="true" data-bs-backdrop="static" style="z-index: 1060;">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title" id="movementErrorModalLabel">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>Error al Registrar Movimiento
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-3">
                            <i class="bi bi-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
                        </div>
                        <p class="text-center mb-0" id="movement-error-message">
                            No se pudo registrar el movimiento
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-2"></i>Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Función para configurar el modal de movimientos
async function setupMovementModal() {
    const addMovementModal = document.getElementById('addMovementModal');
    if (addMovementModal) {
        // Remover listeners previos para evitar duplicados
        const newModal = addMovementModal.cloneNode(true);
        addMovementModal.parentNode.replaceChild(newModal, addMovementModal);
        
        const freshModal = document.getElementById('addMovementModal');
        
        // Configurar evento para cuando se abre el modal
        freshModal.addEventListener('shown.bs.modal', async function() {
            console.log('🔓 Modal de movimientos abierto');
            console.log('👤 Usuario actual:', currentUser);
            
            // Cargar usuarios y productos si no están cargados
            if (usuarios.length === 0) {
                console.log('📥 Cargando usuarios desde setupMovementModal...');
                await loadUsuarios();
            }
            if (products.length === 0) {
                await loadProducts();
            }
            
            // Si el usuario es admin, actualizar el select de responsables con los usuarios
            const userRole = currentUser?.rol || currentUser?.role;
            if (currentUser && userRole === 'admin') {
                console.log('🔑 Usuario es admin, actualizando select de responsables...');
                await updateMovementResponsableSelect();
            } else {
                console.log('ℹ️ Usuario no es admin (rol:', userRole, '), no se actualiza el select');
            }
            
            // Generar referencia inicial
            updateMovementReference();
        });
        
        // Configurar evento para cuando se cierra el modal (limpiar formulario)
        freshModal.addEventListener('hidden.bs.modal', function() {
            const form = document.getElementById('addMovementForm');
            if (form) {
                form.reset();
            }
            // Regenerar referencia cuando se vuelva a abrir
            setTimeout(() => {
                updateMovementReference();
            }, 100);
        });
    }
}

// Función para actualizar el select de responsables con los usuarios (solo para admin)
async function updateMovementResponsableSelect() {
    const responsableSelect = document.getElementById('movement-responsable');
    if (!responsableSelect) {
        console.warn('⚠️ Select de responsable no encontrado');
        return;
    }
    
    // Asegurar que los usuarios estén cargados
    if (usuarios.length === 0) {
        console.log('📥 Cargando usuarios...');
        await loadUsuarios();
    }
    
    console.log('👥 Usuarios cargados:', usuarios.length);
    
    // Limpiar y poblar el select
    responsableSelect.innerHTML = '<option value="">Seleccionar...</option>';
    
    // Normalizar los usuarios para que tengan los campos correctos
    const usuariosNormalizados = usuarios.map(u => ({
        id: u.id,
        nombre: u.nombre || u.name,
        email: u.email,
        rol: u.rol || u.role,
        activo: u.activo !== undefined ? u.activo : (u.active !== undefined ? u.active : true)
    }));
    
    const usuariosActivos = usuariosNormalizados.filter(u => u.activo !== false && u.activo !== 0);
    console.log('✅ Usuarios activos:', usuariosActivos.length);
    
    if (usuariosActivos.length === 0) {
        console.warn('⚠️ No hay usuarios activos disponibles');
        responsableSelect.innerHTML = '<option value="">No hay usuarios disponibles</option>';
        return;
    }
    
    usuariosActivos.forEach(u => {
        const option = document.createElement('option');
        option.value = u.id;
        option.textContent = `${u.nombre} (${u.email})`;
        
        // Seleccionar el usuario actual por defecto
        if (currentUser && currentUser.id == u.id) {
            option.selected = true;
        }
        
        responsableSelect.appendChild(option);
    });
    
    console.log('✅ Select de responsable actualizado con', usuariosActivos.length, 'usuarios');
}

// Función para actualizar la referencia automáticamente según el tipo de movimiento
async function updateMovementReference() {
    const typeSelect = document.getElementById('movement-type');
    const referenceInput = document.getElementById('movement-reference');
    
    if (!typeSelect || !referenceInput) return;
    
    const tipo = typeSelect.value;
    
    try {
        // Obtener el conteo de movimientos del tipo seleccionado
        const response = await apiCall(`movimientos.php?tipo=${tipo}`);
        const count = Array.isArray(response) ? response.length : 0;
        const nextNumber = count + 1;
        
        // Generar referencia según el tipo
        if (tipo === 'entry') {
            referenceInput.value = 'ENTR-' + String(nextNumber).padStart(4, '0');
        } else {
            referenceInput.value = 'SAL-' + String(nextNumber).padStart(4, '0');
        }
    } catch (error) {
        console.error('Error al generar referencia:', error);
        // Generar referencia básica como fallback
        if (tipo === 'entry') {
            referenceInput.value = 'ENTR-0001';
        } else {
            referenceInput.value = 'SAL-0001';
        }
    }
}

async function handleAddMovement(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        const response = await apiCall('movimientos.php', 'POST', {
            tipo: formData.get('type'),
            producto_id: parseInt(formData.get('product')),
            cantidad: parseInt(formData.get('quantity')),
            responsable_id: parseInt(formData.get('responsable_id')),
            referencia: formData.get('reference') || '', // Si está vacío, se generará automáticamente
            notas: formData.get('notes') || ''
        });
        
        if (response && response.success) {
            // Cerrar modal solo si fue exitoso
            const modal = bootstrap.Modal.getInstance(document.getElementById('addMovementModal'));
            if (modal) {
                modal.hide();
            }
            
            // Limpiar formulario
            e.target.reset();
            
            // Recargar datos
            movements = [];
            products = [];
            await loadMovements();
            await loadProducts(); // Recargar productos para actualizar stock
            
            // Re-renderizar vista
            renderCurrentView();
        } else {
            // Mostrar modal de error ENCIMA del formulario (no cerrar el formulario)
            showMovementErrorModal(response?.error || 'Error desconocido');
        }
    } catch (error) {
        console.error('Error completo al registrar movimiento:', error);
        // Extraer el mensaje de error
        let errorMessage = 'Error de conexión';
        
        // Intentar obtener el mensaje del error desde diferentes fuentes
        if (error.message) {
            errorMessage = error.message;
        } else if (error.error) {
            errorMessage = error.error;
        } else if (typeof error === 'string') {
            errorMessage = error;
        } else if (error.response && error.response.error) {
            errorMessage = error.response.error;
        }
        
        // Mostrar modal de error
        showMovementErrorModal(errorMessage);
    }
}

// Función para mostrar el modal de error de movimiento
function showMovementErrorModal(message) {
    // Esperar a que el DOM esté listo
    setTimeout(() => {
        // Crear o actualizar el contenido del modal de error
        let errorModal = document.getElementById('movementErrorModal');
        
        if (!errorModal) {
            // Si el modal no existe, asegurarse de que la vista esté renderizada
            renderCurrentView();
            errorModal = document.getElementById('movementErrorModal');
        }
        
        if (errorModal) {
            // Actualizar el mensaje
            const messageElement = document.getElementById('movement-error-message');
            if (messageElement) {
                messageElement.textContent = message;
            }
            
            // NO cerrar el modal de agregar movimiento - solo mostrar el error encima
            // El modal de error aparecerá encima del formulario
            
            // Mostrar el modal de error
            const modal = new bootstrap.Modal(errorModal);
            modal.show();
        } else {
            // Si el modal no existe después de intentar renderizarlo, usar alert como fallback
            alert('Error: ' + message);
        }
    }, 100);
}

// Orders Page
function renderOrders() {
    const statusConfig = {
        pendiente: { 
            label: 'Pendiente', 
            color: 'bg-secondary', 
            iconClass: 'bi-clock',
            bgColor: '#e9ecef',
            iconColor: '#6c757d'
        },
        confirmado: { 
            label: 'Confirmado', 
            color: 'bg-primary', 
            iconClass: 'bi-check-circle',
            bgColor: '#cfe2ff',
            iconColor: '#0d6efd'
        },
        enviado: { 
            label: 'Enviado', 
            color: 'bg-warning', 
            iconClass: 'bi-truck',
            bgColor: '#fff3cd',
            iconColor: '#ff9800'
        },
        entregado: { 
            label: 'Entregado', 
            color: 'bg-success', 
            iconClass: 'bi-box-seam',
            bgColor: '#d4edda',
            iconColor: '#198754'
        },
        cancelado: { 
            label: 'Cancelado', 
            color: 'bg-danger', 
            iconClass: 'bi-x-circle',
            bgColor: '#f8d7da',
            iconColor: '#dc3545'
        },
        // Mantener compatibilidad con estado antiguo
        en_transito: { 
            label: 'Confirmado', 
            color: 'bg-primary', 
            iconClass: 'bi-check-circle',
            bgColor: '#cfe2ff',
            iconColor: '#0d6efd'
        }
    };

    // Filtrar pedidos por estado
    // Usar la variable global para preservar el filtro seleccionado
    const statusFilter = document.getElementById('order-status-filter');
    const statusValue = statusFilter?.value || currentOrderStatusFilter || 'all';
    
    // Actualizar la variable global si hay un nuevo valor
    if (statusFilter && statusFilter.value) {
        currentOrderStatusFilter = statusFilter.value;
    }
    
    let filteredOrders = orders.filter(order => {
        // Los pedidos ya vienen mapeados del backend
        if (statusValue === 'all') {
            return true;
        }
        return order.estado === statusValue;
    });

    // Contar pedidos por estado
    // Los pedidos ya vienen mapeados del backend (en_transito -> confirmado)
    // Por lo tanto, contamos directamente por los estados del frontend
    const stats = {
        pendiente: orders.filter(o => o.estado === 'pendiente').length,
        confirmado: orders.filter(o => o.estado === 'confirmado').length,
        enviado: orders.filter(o => o.estado === 'enviado').length,
        entregado: orders.filter(o => o.estado === 'entregado').length,
        cancelado: orders.filter(o => o.estado === 'cancelado').length
    };

    return `
        <div class="mb-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                    <h2 class="text-dark mb-1">Gestión de Pedidos</h2>
                    <p class="text-muted mb-0">Administra pedidos a proveedores y seguimiento de entregas</p>
                </div>
                <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#addOrderModal">
                    <i class="bi bi-plus-lg me-2"></i>Crear Pedido
                </button>
            </div>
        </div>

        <!-- Tarjetas de Estado -->
        <div class="row g-3 mb-4">
            <div class="col">
                <div class="card text-center" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); height: 100%;">
                    <div class="card-body">
                        <div class="mb-2" style="font-size: 1.5rem; color: #6c757d;">
                            <i class="bi bi-clock"></i>
                    </div>
                        <div class="text-muted small mb-1">Pendiente</div>
                        <div class="h4 mb-0" style="color: #6c757d;">${stats.pendiente}</div>
                </div>
                </div>
            </div>
            <div class="col">
                <div class="card text-center" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); height: 100%;">
                    <div class="card-body">
                        <div class="mb-2" style="font-size: 1.5rem; color: #0d6efd;">
                            <i class="bi bi-check-circle"></i>
                        </div>
                        <div class="text-muted small mb-1">Confirmado</div>
                        <div class="h4 mb-0" style="color: #0d6efd;">${stats.confirmado}</div>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card text-center" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); height: 100%;">
                    <div class="card-body">
                        <div class="mb-2" style="font-size: 1.5rem; color: #ff9800;">
                            <i class="bi bi-truck"></i>
                        </div>
                        <div class="text-muted small mb-1">Enviado</div>
                        <div class="h4 mb-0" style="color: #ff9800;">${stats.enviado}</div>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card text-center" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); height: 100%;">
                    <div class="card-body">
                        <div class="mb-2" style="font-size: 1.5rem; color: #198754;">
                            <i class="bi bi-box-seam"></i>
                        </div>
                        <div class="text-muted small mb-1">Entregado</div>
                        <div class="h4 mb-0" style="color: #198754;">${stats.entregado}</div>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="card text-center" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); height: 100%;">
                    <div class="card-body">
                        <div class="mb-2" style="font-size: 1.5rem; color: #dc3545;">
                            <i class="bi bi-x-circle"></i>
                        </div>
                        <div class="text-muted small mb-1">Cancelado</div>
                        <div class="h4 mb-0" style="color: #dc3545;">${stats.cancelado}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filtro por Estado -->
        <div class="mb-4 d-flex justify-content-end">
            <div style="min-width: 250px; max-width: 300px;">
                <label for="order-status-filter" class="form-label small text-muted mb-2 d-block">Filtrar por estado:</label>
                <select class="form-select" id="order-status-filter" onchange="handleOrderStatusFilterChange()">
                    <option value="all" ${currentOrderStatusFilter === 'all' || currentOrderStatusFilter === '' ? 'selected' : ''}>Todos los estados</option>
                    <option value="pendiente" ${currentOrderStatusFilter === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="confirmado" ${currentOrderStatusFilter === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                    <option value="enviado" ${currentOrderStatusFilter === 'enviado' ? 'selected' : ''}>Enviado</option>
                    <option value="entregado" ${currentOrderStatusFilter === 'entregado' ? 'selected' : ''}>Entregado</option>
                    <option value="cancelado" ${currentOrderStatusFilter === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </div>
        </div>

        <!-- Lista de Pedidos en Cards -->
        <div class="row g-3">
            ${filteredOrders.length > 0 ? filteredOrders.map(order => {
                // Los pedidos ya vienen mapeados del backend
                const estadoKey = order.estado || 'pendiente';
                let statusInfo = statusConfig[estadoKey];
                
                // Si no se encuentra el estado, intentar con el estado original
                if (!statusInfo) {
                    statusInfo = statusConfig[order.estado] || statusConfig['pendiente'];
                }
                
                // Asegurar que siempre tengamos un statusInfo válido
                if (!statusInfo || !statusInfo.label) {
                    statusInfo = {
                        label: order.estado || 'Pendiente', 
                        color: 'bg-secondary', 
                        iconClass: 'bi-circle',
                        bgColor: '#e9ecef',
                        iconColor: '#6c757d'
                    };
                }
                const totalProductos = order.productos ? order.productos.reduce((sum, p) => sum + (parseInt(p.cantidad) || 0), 0) : 0;
                const fechaCreacion = order.fecha_creacion ? new Date(order.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
                const fechaEntrega = order.fecha_entrega_estimada ? new Date(order.fecha_entrega_estimada).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null;
                
                return `
                    <div class="col-12">
                        <div class="card" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <div class="card-body">
                                <div class="row align-items-center">
                                    <div class="col-auto">
                                        <div class="d-flex align-items-center justify-content-center" style="width: 60px; height: 60px; border-radius: 12px; background-color: ${statusInfo.bgColor || '#e9ecef'};">
                                            <i class="bi ${statusInfo.iconClass || 'bi-circle'}" style="font-size: 2rem; color: ${statusInfo.iconColor || '#6c757d'};"></i>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <div class="d-flex align-items-center gap-2 mb-2">
                                            <h5 class="mb-0">Pedido ${order.numero_pedido || '#' + order.id}</h5>
                                            <span class="badge ${statusInfo.color}" style="font-size: 0.75rem; padding: 0.35rem 0.65rem; background-color: ${statusInfo.iconColor || '#6c757d'} !important; color: white !important;">
                                                ${statusInfo.label || order.estado || 'Pendiente'}
                                    </span>
                                        </div>
                                        <p class="mb-1 text-muted">
                                            <strong>Proveedor:</strong> ${order.proveedor_nombre || '-'}
                                        </p>
                                        <p class="mb-0 text-muted small">
                                            ${totalProductos} producto(s) • Creado por ${order.creado_por_nombre || '-'}
                                        </p>
                                    </div>
                                    <div class="col-auto text-end">
                                        <div class="mb-2">
                                            <strong class="h5 mb-0">$${parseFloat(order.monto_total || 0).toFixed(2).replace('.', ',')}</strong>
                                        </div>
                                        ${fechaEntrega ? `
                                            <div class="text-muted small mb-1">
                                                <i class="bi bi-calendar"></i> Entrega: ${fechaEntrega}
                                            </div>
                                        ` : ''}
                                        <div class="text-muted small">
                                            Creado: ${fechaCreacion}
                                        </div>
                                        <div class="mt-3 d-flex gap-2 justify-content-end">
                                            <button class="btn btn-sm btn-outline-primary" onclick="editOrder(${order.id})" title="Ver detalles">
                                                <i class="bi bi-eye"></i>
                                    </button>
                                            ${order.estado === 'entregado' ? `
                                                <button class="btn btn-sm btn-outline-secondary" disabled title="No se puede cambiar el estado de un pedido entregado">
                                                    <i class="bi bi-arrow-repeat"></i>
                                                </button>
                                            ` : `
                                                <button class="btn btn-sm btn-outline-secondary" onclick="showStatusChangeModal(${order.id}, '${order.estado}')" title="Cambiar estado">
                                                    <i class="bi bi-arrow-repeat"></i>
                                                </button>
                                            `}
            </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('') : `
                <div class="col-12">
                    <div class="card text-center" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div class="card-body py-5">
                            <i class="bi bi-inbox" style="font-size: 3rem; color: #dee2e6;"></i>
                            <p class="text-muted mt-3 mb-0">No hay pedidos para mostrar</p>
                        </div>
                    </div>
                </div>
            `}
        </div>

        ${renderAddOrderModal()}
    `;
}

function renderAddOrderModal() {
    // Asegurar que productos y proveedores estén cargados
    if (products.length === 0) {
        loadProducts();
    }
    if (suppliers.length === 0) {
        loadSuppliers();
    }
    
    return `
        <div class="modal fade" id="addOrderModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-cart-plus me-2"></i>Nuevo Pedido a Proveedor</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form onsubmit="handleAddOrder(event)" id="addOrderForm">
                        <div class="modal-body">
                            <div class="row g-3 mb-4">
                                <div class="col-md-6">
                                    <label class="form-label">Número de Pedido</label>
                                    <input type="text" class="form-control" id="order-number" value="PO-${new Date().getFullYear()}-XXXX" readonly>
                                    <small class="text-muted">Generado automáticamente</small>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Proveedor *</label>
                                    <select class="form-select" name="supplier" id="order-supplier" required onchange="updateSupplierInfo()">
                                        <option value="">Seleccionar proveedor...</option>
                                        ${suppliers.filter(s => s.activo !== false).map(s => 
                                            `<option value="${s.id}" data-contact="${s.contacto || ''}" data-email="${s.email || ''}" data-phone="${s.telefono || ''}">
                                                ${s.nombre}
                                            </option>`
                                        ).join('')}
                                    </select>
                                </div>
                                </div>
                            
                            <!-- Información del Proveedor -->
                            <div class="alert alert-info" id="supplier-info" style="display: none;">
                                <strong><i class="bi bi-building me-2"></i>Información del Proveedor:</strong>
                                <div class="mt-2">
                                    <span id="supplier-contact"></span><br>
                                    <span id="supplier-email"></span><br>
                                    <span id="supplier-phone"></span>
                                </div>
                            </div>
                            
                            <!-- Notas Adicionales -->
                            <div class="mb-4">
                                <label class="form-label">Notas Adicionales</label>
                                <textarea class="form-control" name="notes" id="order-notes" rows="3" placeholder="Notas, instrucciones especiales, condiciones de entrega, etc."></textarea>
                            </div>
                            
                            <!-- Productos del Pedido -->
                            <div class="card mb-3">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0"><i class="bi bi-box-seam me-2"></i>Productos del Pedido</h6>
                                    <button type="button" class="btn btn-sm btn-success" onclick="addProductToOrder()">
                                        <i class="bi bi-plus-circle me-1"></i>Agregar Producto
                                    </button>
                                </div>
                                <div class="card-body">
                                    <div class="table-responsive">
                                        <table class="table table-sm" id="order-products-table">
                                            <thead>
                                                <tr>
                                                    <th style="width: 40%;">Producto *</th>
                                                    <th style="width: 15%;">Cantidad *</th>
                                                    <th style="width: 20%;">Precio Unitario *</th>
                                                    <th style="width: 15%;">Subtotal</th>
                                                    <th style="width: 10%;">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody id="order-products-body">
                                                <!-- Los productos se agregarán dinámicamente aquí -->
                                            </tbody>
                                            <tfoot>
                                                <tr class="table-secondary fw-bold">
                                                    <td colspan="3" class="text-end">TOTAL:</td>
                                                    <td id="order-total">$0.00</td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                    <div class="text-danger small mt-2" id="order-products-error" style="display: none;">
                                        <i class="bi bi-exclamation-circle me-1"></i>Debe agregar al menos un producto al pedido
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle me-2"></i>Cancelar
                            </button>
                            <button type="submit" class="btn btn-success">
                                <i class="bi bi-check-circle me-2"></i>Crear Pedido
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

// Variables para el formulario de pedidos
let orderProducts = []; // Array para almacenar los productos del pedido

// Función para agregar un producto al pedido
function addProductToOrder() {
    const tbody = document.getElementById('order-products-body');
    if (!tbody) return;
    
    const productIndex = orderProducts.length;
    orderProducts.push({ producto_id: '', cantidad: 1, precio_unitario: 0 });
    
    const row = document.createElement('tr');
    row.id = `order-product-row-${productIndex}`;
    
    // Obtener productos disponibles (filtrar por proveedor si está seleccionado)
    const supplierId = document.getElementById('order-supplier')?.value;
    let availableProducts = products.filter(p => p.activo !== false);
    
    // Si hay un proveedor seleccionado, filtrar productos de ese proveedor
    if (supplierId) {
        availableProducts = availableProducts.filter(p => p.proveedor_id == supplierId);
    }
    
    row.innerHTML = `
        <td>
            <select class="form-select form-select-sm order-product-select" data-index="${productIndex}" required onchange="updateProductPrice(${productIndex})">
                <option value="">Seleccionar producto...</option>
                ${availableProducts.map(p => `
                    <option value="${p.id}" data-price="${p.precio || 0}">
                        ${p.nombre} (SKU: ${p.sku}) - Stock: ${p.stock || 0}
                    </option>
                `).join('')}
            </select>
        </td>
        <td>
            <input type="number" class="form-control form-control-sm order-quantity" data-index="${productIndex}" 
                   min="1" step="1" value="1" required onchange="calculateOrderTotal()">
        </td>
        <td>
            <input type="number" class="form-control form-control-sm order-price" data-index="${productIndex}" 
                   min="0" step="0.01" value="0" required onchange="calculateOrderTotal()">
        </td>
        <td>
            <span class="order-subtotal" data-index="${productIndex}">$0.00</span>
        </td>
        <td>
            <button type="button" class="btn btn-sm btn-danger" onclick="removeProductFromOrder(${productIndex})">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    
    tbody.appendChild(row);
    updateOrderTotalDisplay();
}

// Función para actualizar el precio del producto cuando se selecciona
function updateProductPrice(index) {
    const select = document.querySelector(`.order-product-select[data-index="${index}"]`);
    const priceInput = document.querySelector(`.order-price[data-index="${index}"]`);
    
    if (select && priceInput) {
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption && selectedOption.dataset.price) {
            const price = parseFloat(selectedOption.dataset.price) || 0;
            priceInput.value = price.toFixed(2);
            orderProducts[index].producto_id = select.value;
            orderProducts[index].precio_unitario = price;
            calculateOrderTotal();
        }
    }
}

// Función para eliminar un producto del pedido
function removeProductFromOrder(index) {
    const row = document.getElementById(`order-product-row-${index}`);
    if (row) {
        row.remove();
    }
    orderProducts = orderProducts.filter((_, i) => i !== index);
    
    // Re-indexar las filas
    const tbody = document.getElementById('order-products-body');
    if (tbody) {
        Array.from(tbody.children).forEach((row, i) => {
            row.id = `order-product-row-${i}`;
            row.querySelectorAll('[data-index]').forEach(el => {
                const oldIndex = parseInt(el.dataset.index);
                el.dataset.index = i;
                if (el.classList.contains('order-product-select')) {
                    el.setAttribute('onchange', `updateProductPrice(${i})`);
                }
                if (el.classList.contains('order-quantity')) {
                    el.setAttribute('onchange', 'calculateOrderTotal()');
                }
                if (el.classList.contains('order-price')) {
                    el.setAttribute('onchange', 'calculateOrderTotal()');
                }
                if (el.classList.contains('btn-danger')) {
                    el.setAttribute('onclick', `removeProductFromOrder(${i})`);
                }
            });
        });
    }
    
    // Re-indexar el array
    orderProducts = orderProducts.map((_, i) => {
        const select = document.querySelector(`.order-product-select[data-index="${i}"]`);
        const quantityInput = document.querySelector(`.order-quantity[data-index="${i}"]`);
        const priceInput = document.querySelector(`.order-price[data-index="${i}"]`);
        
        return {
            producto_id: select?.value || '',
            cantidad: parseInt(quantityInput?.value || 1),
            precio_unitario: parseFloat(priceInput?.value || 0)
        };
    });
    
    calculateOrderTotal();
}

// Función para calcular el total del pedido
function calculateOrderTotal() {
    const tbody = document.getElementById('order-products-body');
    if (!tbody) return;
    
    let total = 0;
    
    tbody.querySelectorAll('tr').forEach((row, index) => {
        const quantityInput = row.querySelector(`.order-quantity[data-index="${index}"]`);
        const priceInput = row.querySelector(`.order-price[data-index="${index}"]`);
        const subtotalSpan = row.querySelector(`.order-subtotal[data-index="${index}"]`);
        
        if (quantityInput && priceInput && subtotalSpan) {
            const quantity = parseInt(quantityInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            const subtotal = quantity * price;
            
            subtotalSpan.textContent = '$' + subtotal.toFixed(2);
            total += subtotal;
            
            // Actualizar el array
            if (orderProducts[index]) {
                orderProducts[index].cantidad = quantity;
                orderProducts[index].precio_unitario = price;
            }
        }
    });
    
    updateOrderTotalDisplay();
}

// Función para actualizar el display del total
function updateOrderTotalDisplay() {
    const totalElement = document.getElementById('order-total');
    if (totalElement) {
        let total = 0;
        orderProducts.forEach((product, index) => {
            const quantityInput = document.querySelector(`.order-quantity[data-index="${index}"]`);
            const priceInput = document.querySelector(`.order-price[data-index="${index}"]`);
            
            if (quantityInput && priceInput) {
                const quantity = parseInt(quantityInput.value) || 0;
                const price = parseFloat(priceInput.value) || 0;
                total += quantity * price;
            }
        });
        
        totalElement.textContent = '$' + total.toFixed(2);
    }
}

// Función para actualizar información del proveedor
function updateSupplierInfo() {
    const supplierSelect = document.getElementById('order-supplier');
    const supplierInfo = document.getElementById('supplier-info');
    const supplierContact = document.getElementById('supplier-contact');
    const supplierEmail = document.getElementById('supplier-email');
    const supplierPhone = document.getElementById('supplier-phone');
    
    if (!supplierSelect || !supplierInfo) return;
    
    const selectedOption = supplierSelect.options[supplierSelect.selectedIndex];
    if (selectedOption && selectedOption.value) {
        const contact = selectedOption.dataset.contact || '';
        const email = selectedOption.dataset.email || '';
        const phone = selectedOption.dataset.phone || '';
        
        if (supplierContact) supplierContact.innerHTML = `<strong>Contacto:</strong> ${contact}`;
        if (supplierEmail) supplierEmail.innerHTML = `<strong>Email:</strong> ${email}`;
        if (supplierPhone) supplierPhone.innerHTML = `<strong>Teléfono:</strong> ${phone}`;
        
        supplierInfo.style.display = 'block';
        
        // Actualizar productos disponibles según el proveedor
        updateOrderProductsBySupplier();
    } else {
        supplierInfo.style.display = 'none';
    }
}

// Función para actualizar productos según el proveedor seleccionado
function updateOrderProductsBySupplier() {
    const supplierId = document.getElementById('order-supplier')?.value;
    const productSelects = document.querySelectorAll('.order-product-select');
    
    if (!supplierId) {
        // Si no hay proveedor, mostrar todos los productos activos
        const allProducts = products.filter(p => p.activo !== false);
        productSelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Seleccionar producto...</option>' +
                allProducts.map(p => `
                    <option value="${p.id}" data-price="${p.precio || 0}" ${p.id == currentValue ? 'selected' : ''}>
                        ${p.nombre} (SKU: ${p.sku}) - Stock: ${p.stock || 0}
                    </option>
                `).join('');
            if (currentValue) select.value = currentValue;
        });
        return;
    }
    
    // Filtrar productos del proveedor seleccionado
    const supplierProducts = products.filter(p => p.activo !== false && p.proveedor_id == supplierId);
    
    productSelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Seleccionar producto...</option>' +
            supplierProducts.map(p => `
                <option value="${p.id}" data-price="${p.precio || 0}" ${p.id == currentValue ? 'selected' : ''}>
                    ${p.nombre} (SKU: ${p.sku}) - Stock: ${p.stock || 0}
                </option>
            `).join('');
        
        // Si el producto actual no pertenece a este proveedor, limpiar
        if (currentValue) {
            const currentProduct = products.find(p => p.id == currentValue);
            if (!currentProduct || currentProduct.proveedor_id != supplierId) {
                select.value = '';
                const index = parseInt(select.dataset.index);
                const priceInput = document.querySelector(`.order-price[data-index="${index}"]`);
                if (priceInput) priceInput.value = '0';
                calculateOrderTotal();
            } else {
                select.value = currentValue;
            }
        }
    });
}

async function handleAddOrder(e) {
    e.preventDefault();
    
    // Validar que hay al menos un producto
    if (orderProducts.length === 0 || orderProducts.every(p => !p.producto_id)) {
        const errorDiv = document.getElementById('order-products-error');
        if (errorDiv) {
            errorDiv.style.display = 'block';
        }
        alert('Debe agregar al menos un producto al pedido');
        return;
    }
    
    const formData = new FormData(e.target);
    const supplierId = parseInt(formData.get('supplier'));
    
    // Validar que todos los productos tengan datos válidos
    const validProducts = [];
    for (let i = 0; i < orderProducts.length; i++) {
        const select = document.querySelector(`.order-product-select[data-index="${i}"]`);
        const quantityInput = document.querySelector(`.order-quantity[data-index="${i}"]`);
        const priceInput = document.querySelector(`.order-price[data-index="${i}"]`);
        
        if (select && select.value && quantityInput && priceInput) {
            const producto_id = parseInt(select.value);
            const cantidad = parseInt(quantityInput.value);
            const precio_unitario = parseFloat(priceInput.value);
            
            if (producto_id && cantidad > 0 && precio_unitario >= 0) {
                validProducts.push({
                    producto_id: producto_id,
                    cantidad: cantidad,
                    precio_unitario: precio_unitario,
                    subtotal: cantidad * precio_unitario
                });
            }
        }
    }
    
    if (validProducts.length === 0) {
        alert('Debe agregar al menos un producto válido al pedido');
        return;
    }
    
    // Calcular monto total
    const monto_total = validProducts.reduce((sum, p) => sum + p.subtotal, 0);
    
    try {
        const response = await apiCall('pedidos.php', 'POST', {
            proveedor_id: supplierId,
            notas: formData.get('notes') || '',
            creado_por: currentUser ? currentUser.id : 1,
            productos: validProducts,
            monto_total: monto_total
        });
        
        if (response.success) {
            // Limpiar el formulario
            orderProducts = [];
            const tbody = document.getElementById('order-products-body');
            if (tbody) tbody.innerHTML = '';
            updateOrderTotalDisplay();
            
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('addOrderModal')).hide();
            
            // Recargar datos
            await loadOrders();
            renderCurrentView();
        }
    } catch (error) {
        alert('Error al crear pedido: ' + error.message);
    }
}

// Función para configurar el modal de pedidos
function setupOrderModal() {
    const addOrderModal = document.getElementById('addOrderModal');
    if (addOrderModal) {
        // Remover listeners previos
        const newModal = addOrderModal.cloneNode(true);
        addOrderModal.parentNode.replaceChild(newModal, addOrderModal);
        
        const freshModal = document.getElementById('addOrderModal');
        
        // Evento cuando se abre el modal
        freshModal.addEventListener('shown.bs.modal', function() {
            // Limpiar productos anteriores
            orderProducts = [];
            const tbody = document.getElementById('order-products-body');
            if (tbody) tbody.innerHTML = '';
            
            // Cargar productos y proveedores si no están cargados
            if (products.length === 0) {
                loadProducts();
            }
            if (suppliers.length === 0) {
                loadSuppliers();
            }
            
            // Resetear formulario
            const form = document.getElementById('addOrderForm');
            if (form) {
                form.reset();
            }
            
            // Resetear información del proveedor
            const supplierInfo = document.getElementById('supplier-info');
            if (supplierInfo) {
                supplierInfo.style.display = 'none';
            }
            
            updateOrderTotalDisplay();
        });
        
        // Evento cuando se cierra el modal
        freshModal.addEventListener('hidden.bs.modal', function() {
            // Limpiar productos
            orderProducts = [];
            const tbody = document.getElementById('order-products-body');
            if (tbody) tbody.innerHTML = '';
            
            // Ocultar error
            const errorDiv = document.getElementById('order-products-error');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        });
    }
}

// Función para mostrar el modal de cambio de estado
function showStatusChangeModal(orderId, currentStatus) {
    const order = orders.find(o => o.id == orderId);
    if (!order) {
        alert('Pedido no encontrado');
        return;
    }
    
    const statusConfig = {
        pendiente: { label: 'Pendiente', color: 'bg-secondary', icon: '⏳' },
        confirmado: { label: 'Confirmado', color: 'bg-primary', icon: '✓' },
        enviado: { label: 'Enviado', color: 'bg-warning', icon: '🚚' },
        entregado: { label: 'Entregado', color: 'bg-success', icon: '📦' },
        cancelado: { label: 'Cancelado', color: 'bg-danger', icon: '❌' },
        en_transito: { label: 'Confirmado', color: 'bg-primary', icon: '✓' } // Compatibilidad
    };
    
    // Mapear en_transito a confirmado para visualización
    const displayStatus = currentStatus === 'en_transito' ? 'confirmado' : currentStatus;
    const currentStatusInfo = statusConfig[displayStatus] || statusConfig[currentStatus] || { label: currentStatus, color: 'bg-secondary', icon: '' };
    
    const modalHTML = `
        <div class="modal fade" id="changeStatusModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-arrow-repeat me-2"></i>Cambiar Estado del Pedido</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <p class="mb-2"><strong>Pedido:</strong> ${order.numero_pedido || order.id}</p>
                            <p class="mb-3"><strong>Estado Actual:</strong> 
                                <span class="badge ${currentStatusInfo.color}">${currentStatusInfo.icon} ${currentStatusInfo.label}</span>
                            </p>
                        </div>
                        <div class="mb-3">
                            <label class="form-label"><strong>Nuevo Estado:</strong></label>
                            <select class="form-select form-select-lg" id="new-status-select" style="font-size: 1rem;">
                                <option value="pendiente" ${displayStatus === 'pendiente' ? 'selected' : ''} data-color="bg-secondary" data-icon="⏳">⏳ Pendiente</option>
                                <option value="confirmado" ${displayStatus === 'confirmado' ? 'selected' : ''} data-color="bg-primary" data-icon="✓">✓ Confirmado</option>
                                <option value="enviado" ${displayStatus === 'enviado' ? 'selected' : ''} data-color="bg-warning" data-icon="🚚">🚚 Enviado</option>
                                <option value="entregado" ${displayStatus === 'entregado' ? 'selected' : ''} data-color="bg-success" data-icon="📦">📦 Entregado</option>
                                <option value="cancelado" ${displayStatus === 'cancelado' ? 'selected' : ''} data-color="bg-danger" data-icon="❌">❌ Cancelado</option>
                            </select>
                        </div>
                        <div id="status-change-warning" class="alert alert-warning" style="display: none;">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            <span id="warning-message"></span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="confirmStatusChange(${orderId})">
                            <i class="bi bi-check-circle me-2"></i>Cambiar Estado
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const existingModal = document.getElementById('changeStatusModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar el nuevo modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('changeStatusModal'));
    modal.show();
    
    // Configurar evento para mostrar advertencias según el estado seleccionado
    const statusSelect = document.getElementById('new-status-select');
    const warningDiv = document.getElementById('status-change-warning');
    const warningMessage = document.getElementById('warning-message');
    
    statusSelect.addEventListener('change', function() {
        const selectedValue = this.value;
        if (selectedValue === 'entregado' && currentStatus !== 'entregado') {
            warningDiv.style.display = 'block';
            warningMessage.innerHTML = 'Al marcar como <strong>Entregado</strong>, se actualizará automáticamente:<br>- Stock de productos<br>- Movimientos de inventario<br>- Se generarán notificaciones';
        } else if (selectedValue === 'cancelado' && currentStatus !== 'cancelado') {
            warningDiv.style.display = 'block';
            warningMessage.innerHTML = '¿Está seguro de cancelar este pedido?<br>Esta acción puede afectar el seguimiento del pedido.';
        } else {
            warningDiv.style.display = 'none';
        }
    });
    
    // Limpiar el modal cuando se cierre
    document.getElementById('changeStatusModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Función para confirmar el cambio de estado
async function confirmStatusChange(orderId) {
    const statusSelect = document.getElementById('new-status-select');
    if (!statusSelect) {
        alert('Error: No se encontró el selector de estado');
        return;
    }
    
    const newStatus = statusSelect.value;
    if (!newStatus) {
        alert('Por favor selecciona un estado');
        return;
    }
    
    // Cerrar el modal
    const modalElement = document.getElementById('changeStatusModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
        // Remover el modal del DOM después de cerrarlo
        setTimeout(() => {
            modalElement.remove();
        }, 300);
    }
    
    // Llamar a la función de cambio de estado
    await changeOrderStatus(orderId, newStatus);
}

// Función para cambiar el estado de un pedido
async function changeOrderStatus(orderId, newStatus) {
    const order = orders.find(o => o.id == orderId);
    if (!order) {
        alert('Pedido no encontrado');
        return;
    }
    
    const statusConfig = {
        pendiente: { label: 'Pendiente' },
        confirmado: { label: 'Confirmado' },
        enviado: { label: 'Enviado' },
        entregado: { label: 'Entregado' },
        cancelado: { label: 'Cancelado' },
        en_transito: { label: 'Confirmado' } // Compatibilidad
    };
    
    const currentStatus = order.estado;
    // El backend manejará el mapeo, enviar el estado tal cual desde el frontend
    const backendStatus = newStatus; // Ya no mapeamos aquí, el backend lo hace
    const newStatusLabel = statusConfig[newStatus]?.label || newStatus;
    
    // La confirmación ya se hizo en el modal, así que procedemos directamente
    
    try {
        console.log('🔄 Cambiando estado:', { orderId, currentStatus, newStatus, backendStatus });
        
        // Asegurar que el estado se envíe correctamente
        const requestData = {
            id: parseInt(orderId),
            nuevo_estado: backendStatus,
            usuario_id: currentUser ? parseInt(currentUser.id) : 1
        };
        
        console.log('📤 Datos enviados al backend:', requestData);
        
        const response = await apiCall(`pedidos.php?id=${orderId}`, 'PUT', requestData);
        
        console.log('📥 Respuesta:', response);
        
        if (response && response.success) {
            // Recargar TODOS los pedidos sin filtros para asegurar que se vea el cambio
            try {
                console.log('🔄 Recargando pedidos...');
                
                // Limpiar el array de pedidos antes de recargar
                orders = [];
                
                // Recargar desde el servidor
                const reloadedOrders = await apiCall('pedidos.php?_t=' + Date.now());
                
                if (Array.isArray(reloadedOrders)) {
                    orders = reloadedOrders;
                    console.log('📦 Pedidos recargados:', orders.length);
                    
                    // Verificar que el pedido se haya actualizado
                    const updatedOrder = orders.find(o => o.id == orderId);
                    if (updatedOrder) {
                        console.log('✅ Pedido actualizado encontrado:', {
                            id: updatedOrder.id,
                            estado: updatedOrder.estado,
                            numero_pedido: updatedOrder.numero_pedido
                        });
                    } else {
                        console.error('❌ Pedido no encontrado después de recargar');
                    }
                } else {
                    console.error('❌ Error: La respuesta no es un array:', reloadedOrders);
                    return;
                }
            } catch (error) {
                console.error('❌ Error recargando pedidos:', error);
                return;
            }
            
            // Si se marcó como entregado, también recargar productos y movimientos
            if (newStatus === 'entregado') {
                await loadProducts();
                await loadMovements();
                await loadAlerts();
            }
            
            // Forzar actualización de la vista inmediatamente
            console.log('🎨 Renderizando vista...');
            console.log('📋 Estado actual de orders:', orders.length, 'pedidos');
            
            // Asegurarse de que estamos en la vista de pedidos
            if (currentView !== 'orders') {
                console.log('🔄 Cambiando vista a orders');
                currentView = 'orders';
            }
            
            // Asegurar que la vista esté en 'orders' antes de renderizar
            currentView = 'orders';
            
            // Renderizar directamente sin recargar datos (ya los tenemos)
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.innerHTML = renderOrders();
                console.log('✅ Vista actualizada directamente');
                
                // Configurar eventos después de renderizar
                setTimeout(() => {
                    setupOrderModal();
                    // Restaurar el filtro de estado si existía
                    const statusSelect = document.getElementById('order-status-filter');
                    if (statusSelect && currentOrderStatusFilter) {
                        statusSelect.value = currentOrderStatusFilter;
                    }
                }, 100);
            } else {
                // Si no hay mainContent, usar renderCurrentView
                renderCurrentView();
            }
        } else {
            const errorMsg = response?.error || response?.message || 'Error desconocido';
            console.error('❌ Error en respuesta:', response);
            // Solo mostrar error si es crítico
            if (!errorMsg.includes('ya tiene ese estado')) {
                alert('Error: ' + errorMsg);
            }
        }
    } catch (error) {
        console.error('❌ Error al cambiar estado:', error);
        // Solo mostrar error si es crítico
        if (error.message && !error.message.includes('ya tiene ese estado')) {
            alert('Error al actualizar el estado del pedido: ' + error.message);
        }
    }
}

function editOrder(id) {
    const order = orders.find(o => o.id == id);
    if (order) {
        // Mostrar modal con detalles del pedido
        showOrderDetails(order);
    }
}

// Función para mostrar detalles del pedido
function showOrderDetails(order) {
    const statusConfig = {
        pendiente: { label: 'Pendiente', color: 'bg-secondary' },
        confirmado: { label: 'Confirmado', color: 'bg-primary' },
        enviado: { label: 'Enviado', color: 'bg-warning' },
        entregado: { label: 'Entregado', color: 'bg-success' },
        cancelado: { label: 'Cancelado', color: 'bg-danger' },
        en_transito: { label: 'Confirmado', color: 'bg-primary' } // Compatibilidad
    };
    
    // Los pedidos ya vienen mapeados del backend
    const displayEstado = order.estado;
    const status = statusConfig[displayEstado] || statusConfig[order.estado] || { label: order.estado, color: 'bg-secondary' };
    const productosHTML = order.productos && order.productos.length > 0 
        ? order.productos.map(p => 
            `<tr>
                <td>${p.producto_nombre || 'Producto'}</td>
                <td>${p.cantidad}</td>
                <td>$${parseFloat(p.precio_unitario || 0).toFixed(2)}</td>
                <td>$${parseFloat(p.subtotal || 0).toFixed(2)}</td>
            </tr>`
        ).join('')
        : '<tr><td colspan="4" class="text-center">Sin productos</td></tr>';
    
    const modalHTML = `
        <div class="modal fade" id="orderDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalles del Pedido: ${order.numero_pedido || order.id}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Proveedor:</strong> ${order.proveedor_nombre || '-'}<br>
                                <strong>Estado:</strong> 
                                <span class="badge ${status.color}">${status.label}</span><br>
                                <strong>Creado por:</strong> ${order.creado_por_nombre || '-'}<br>
                                <strong>Fecha de creación:</strong> ${order.fecha_creacion ? new Date(order.fecha_creacion).toLocaleString() : '-'}
                            </div>
                            <div class="col-md-6">
                                <strong>Total:</strong> $${parseFloat(order.monto_total || 0).toFixed(2)}<br>
                                ${order.fecha_entrega_estimada ? `<strong>Fecha de entrega estimada:</strong> ${new Date(order.fecha_entrega_estimada).toLocaleDateString()}<br>` : ''}
                            </div>
                        </div>
                        
                        <h6>Productos del Pedido:</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Cantidad</th>
                                        <th>Precio Unitario</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${productosHTML}
                                </tbody>
                            </table>
                        </div>
                        
                        ${order.notas ? `<div class="mt-3"><strong>Notas:</strong><br>${order.notas}</div>` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const existingModal = document.getElementById('orderDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar el nuevo modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
    modal.show();
    
    // Limpiar el modal cuando se cierre
    document.getElementById('orderDetailsModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Reports Page
function renderReports() {
    // Calcular métricas desde los datos disponibles
    const inventoryValue = products.reduce((sum, p) => sum + (parseFloat(p.precio || 0) * parseInt(p.stock || 0)), 0);
    const totalItems = products.filter(p => p.activo !== false).length;
    const totalCategories = categorias.length;
    
    // Calcular rotación promedio (simplificado: salidas / promedio de stock)
    const totalExits = movements.filter(m => m.tipo === 'exit').reduce((sum, m) => sum + parseInt(m.cantidad || 0), 0);
    const avgStock = products.reduce((sum, p) => sum + parseInt(p.stock || 0), 0) / (products.length || 1);
    const rotation = avgStock > 0 ? (totalExits / avgStock).toFixed(1) : '0.0';
    const rotationStatus = parseFloat(rotation) >= 4 && parseFloat(rotation) <= 6 ? 'Óptimo (4-6x)' : parseFloat(rotation) < 4 ? 'Bajo' : 'Alto';
    
    // Calcular margen bruto (simplificado: diferencia entre precio de venta y compra estimado)
    // Usaremos una estimación del 24% como valor por defecto
    const margin = 24.3;
    
    // Calcular cambios porcentuales (simulados por ahora)
    const valueChange = 15.2;
    const marginChange = 2.1;
    
    return `
        <!-- Título y Botones de Exportar -->
        <div class="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 class="text-dark mb-1">Informes y Reportes</h2>
                <p class="text-muted mb-0">Análisis de KPIs y métricas del inventario</p>
                </div>
                <div class="d-flex gap-2">
                <button class="btn btn-outline-success" onclick="exportToPDF()">
                    <i class="bi bi-file-earmark-pdf me-2"></i>Exportar PDF
                    </button>
                <button class="btn btn-success" onclick="exportToExcel()">
                    <i class="bi bi-download me-2"></i>Exportar Excel
                    </button>
                </div>
        </div>

        <!-- Contenedor Principal del Reporte -->
        <div class="card" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div class="card-body p-4">
                <!-- Selector de Período -->
                <div class="mb-4 d-flex align-items-center gap-3">
                    <span class="text-dark fw-medium">Período del Reporte:</span>
                    <div class="btn-group" role="group" style="border: none; box-shadow: none;">
                        <button type="button" class="btn ${currentReportPeriod === 'week' ? 'btn-success' : 'btn-outline-secondary'}" 
                                onclick="changeReportPeriod('week')" 
                                style="border-radius: 8px 0 0 8px; border: none !important; ${currentReportPeriod === 'week' ? '' : 'background-color: white; color: #6c757d;'}">
                            Esta Semana
                        </button>
                        <button type="button" class="btn ${currentReportPeriod === 'month' ? 'btn-success' : 'btn-outline-secondary'}" 
                                onclick="changeReportPeriod('month')"
                                style="border: none !important; ${currentReportPeriod === 'month' ? '' : 'background-color: white; color: #6c757d;'}">
                            Este Mes
                        </button>
                        <button type="button" class="btn ${currentReportPeriod === 'quarter' ? 'btn-success' : 'btn-outline-secondary'}" 
                                onclick="changeReportPeriod('quarter')"
                                style="border: none !important; ${currentReportPeriod === 'quarter' ? '' : 'background-color: white; color: #6c757d;'}">
                            Trimestre
                        </button>
                        <button type="button" class="btn ${currentReportPeriod === 'year' ? 'btn-success' : 'btn-outline-secondary'}" 
                                onclick="changeReportPeriod('year')" 
                                style="border-radius: 0 8px 8px 0; border: none !important; ${currentReportPeriod === 'year' ? '' : 'background-color: white; color: #6c757d;'}">
                            Año
                        </button>
            </div>
        </div>

                <!-- Tarjetas de Métricas -->
                <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); height: 100%;">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <span class="text-muted small">Valor Inventario</span>
                            <i class="bi bi-currency-dollar text-success" style="font-size: 1.5rem;"></i>
                            </div>
                        <div class="h4 mb-2" style="font-weight: 600; color: #212529;">$${inventoryValue.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        <div class="text-success small">+${valueChange}% vs período anterior</div>
                        </div>
                            </div>
                        </div>
            <div class="col-md-3">
                <div class="card" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); height: 100%;">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <span class="text-muted small">Rotación Promedio</span>
                            <i class="bi bi-graph-up-arrow text-primary" style="font-size: 1.5rem;"></i>
                    </div>
                        <div class="h4 mb-2" style="font-weight: 600; color: #212529;">${rotation}x</div>
                        <div class="text-primary small">${rotationStatus}</div>
                </div>
                </div>
                </div>
            <div class="col-md-3">
                <div class="card" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); height: 100%;">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <span class="text-muted small">Margen Bruto</span>
                            <i class="bi bi-currency-dollar text-warning" style="font-size: 1.5rem;"></i>
                        </div>
                        <div class="h4 mb-2" style="font-weight: 600; color: #212529;">${margin}%</div>
                        <div class="text-success small">+${marginChange}% mejora</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); height: 100%;">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <span class="text-muted small">Items en Stock</span>
                            <i class="bi bi-box-seam text-info" style="font-size: 1.5rem;"></i>
                        </div>
                        <div class="h4 mb-2" style="font-weight: 600; color: #212529;">${totalItems} unidades</div>
                        <div class="text-muted small">${totalCategories} categorías</div>
                    </div>
                </div>
                </div>

                <!-- Pestañas de Navegación -->
                <div class="mt-4">
                    <div class="d-flex" role="tablist" style="background-color: #e9ecef; border-radius: 20px; padding: 4px; gap: 0;">
                        <button class="nav-link ${currentReportTab === 'rotation' ? 'active' : ''}" 
                                onclick="changeReportTab('rotation')" 
                                style="flex: 1; border: none; background-color: ${currentReportTab === 'rotation' ? 'white' : 'transparent'}; color: #6c757d; padding: 0.75rem 1rem; border-radius: ${currentReportTab === 'rotation' ? '16px 0 0 16px' : '0'}; font-weight: ${currentReportTab === 'rotation' ? '500' : '400'}; ${currentReportTab !== 'rotation' ? 'border-right: 1px solid rgba(0,0,0,0.1);' : ''}">
                            Rotación
                        </button>
                        <button class="nav-link ${currentReportTab === 'costs' ? 'active' : ''}" 
                                onclick="changeReportTab('costs')"
                                style="flex: 1; border: none; background-color: ${currentReportTab === 'costs' ? 'white' : 'transparent'}; color: #6c757d; padding: 0.75rem 1rem; border-radius: 0; font-weight: ${currentReportTab === 'costs' ? '500' : '400'}; ${currentReportTab !== 'costs' ? 'border-right: 1px solid rgba(0,0,0,0.1);' : ''} ${currentReportTab === 'costs' ? 'border-left: 1px solid rgba(0,0,0,0.1);' : ''}">
                            Costos
                        </button>
                        <button class="nav-link ${currentReportTab === 'stock' ? 'active' : ''}" 
                                onclick="changeReportTab('stock')"
                                style="flex: 1; border: none; background-color: ${currentReportTab === 'stock' ? 'white' : 'transparent'}; color: #6c757d; padding: 0.75rem 1rem; border-radius: 0; font-weight: ${currentReportTab === 'stock' ? '500' : '400'}; ${currentReportTab !== 'stock' ? 'border-right: 1px solid rgba(0,0,0,0.1);' : ''} ${currentReportTab === 'stock' ? 'border-left: 1px solid rgba(0,0,0,0.1);' : ''}">
                            Niveles de Stock
                        </button>
                        <button class="nav-link ${currentReportTab === 'suppliers' ? 'active' : ''}" 
                                onclick="changeReportTab('suppliers')"
                                style="flex: 1; border: none; background-color: ${currentReportTab === 'suppliers' ? 'white' : 'transparent'}; color: #6c757d; padding: 0.75rem 1rem; border-radius: ${currentReportTab === 'suppliers' ? '0 16px 16px 0' : '0'}; font-weight: ${currentReportTab === 'suppliers' ? '500' : '400'}; ${currentReportTab === 'suppliers' ? 'border-left: 1px solid rgba(0,0,0,0.1);' : ''}">
                            Proveedores
                        </button>
                    </div>

                    <div class="tab-content pt-4">
                        ${currentReportTab === 'rotation' ? renderRotationTab() : ''}
                        ${currentReportTab === 'costs' ? renderCostsTab() : ''}
                        ${currentReportTab === 'stock' ? renderStockTab() : ''}
                        ${currentReportTab === 'suppliers' ? renderSuppliersTab() : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Función para cambiar el período del reporte
function changeReportPeriod(period) {
    currentReportPeriod = period;
    renderCurrentView();
}

// Función para cambiar la pestaña del reporte
function changeReportTab(tab) {
    currentReportTab = tab;
    renderCurrentView();
    // Inicializar gráficos después de cambiar de pestaña
    setTimeout(() => {
        if (tab === 'rotation' && window.rotationChartData) {
            initRotationChart(window.rotationChartData);
        } else if (tab === 'costs') {
            initCostsChart();
        } else if (tab === 'stock') {
            initStockChart();
        } else if (tab === 'suppliers' && window.suppliersPieChartData) {
            initSuppliersPieChart(window.suppliersPieChartData);
        }
    }, 300);
}

// Función para exportar a PDF
async function exportToPDF() {
    try {
        // Verificar que las bibliotecas estén disponibles
        if (typeof window.jspdf === 'undefined') {
            alert('Error: La biblioteca jsPDF no está cargada. Por favor recarga la página.');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Obtener el contenido del reporte
        const reportContainer = document.querySelector('.card-body');
        if (!reportContainer) {
            alert('Error: No se encontró el contenido del reporte.');
            return;
        }
        
        // Crear contenido de texto para el PDF
        doc.setFontSize(18);
        doc.text('Informes y Reportes', 20, 20);
        
        doc.setFontSize(12);
        let yPos = 35;
        doc.text(`Período: ${getPeriodLabel(currentReportPeriod)}`, 20, yPos);
        yPos += 10;
        doc.text(`Pestaña: ${getTabLabel(currentReportTab)}`, 20, yPos);
        yPos += 10;
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, yPos);
        yPos += 15;
        
        // Agregar métricas generales
        doc.setFontSize(14);
        doc.text('Métricas Generales', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        const inventoryValue = products.reduce((sum, p) => sum + (parseFloat(p.precio || 0) * parseInt(p.stock || 0)), 0);
        const totalItems = products.filter(p => p.activo !== false).length;
        const totalCategories = categorias.length;
        
        doc.text(`Valor Inventario: $${inventoryValue.toLocaleString('es-ES', {minimumFractionDigits: 2})}`, 20, yPos);
        yPos += 8;
        doc.text(`Items en Stock: ${totalItems} unidades`, 20, yPos);
        yPos += 8;
        doc.text(`Categorías: ${totalCategories}`, 20, yPos);
        yPos += 15;
        
        // Intentar capturar el contenido como imagen si html2canvas está disponible
        if (typeof html2canvas !== 'undefined') {
            try {
                // Esperar un momento para que todo se renderice
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Usar html2canvas con opciones mejoradas
                const canvas = await html2canvas(reportContainer, {
                    scale: 1.5,
                    useCORS: true,
                    logging: false,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: reportContainer.scrollWidth,
                    height: reportContainer.scrollHeight
                });
                
                // Verificar que el canvas sea válido
                if (!canvas || canvas.width === 0 || canvas.height === 0) {
                    throw new Error('El canvas generado es inválido');
                }
                
                // Convertir a imagen con mejor calidad
                const imgData = canvas.toDataURL('image/jpeg', 0.95); // Usar JPEG con 95% de calidad en lugar de PNG
                
                // Verificar que la imagen sea válida
                if (!imgData || imgData.length < 100) {
                    throw new Error('La imagen generada es inválida');
                }
                
                const imgWidth = 210; // A4 width in mm
                const pageHeight = 297; // A4 height in mm
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                
                let position = yPos;
                
                // Agregar nueva página para la imagen
                if (yPos > 250) {
                    doc.addPage();
                    position = 10;
                }
                
                doc.addImage(imgData, 'JPEG', 10, position, imgWidth - 20, imgHeight * ((imgWidth - 20) / imgWidth));
                heightLeft -= (pageHeight - position - 10);
                
                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    doc.addPage();
                    doc.addImage(imgData, 'JPEG', 10, 10, imgWidth - 20, imgHeight * ((imgWidth - 20) / imgWidth));
                    heightLeft -= (pageHeight - 20);
                }
            } catch (imgError) {
                console.warn('Error al generar imagen del reporte:', imgError);
                // Continuar sin la imagen, solo con los datos de texto
                doc.setFontSize(11);
                doc.text('Nota: No se pudo generar la imagen del reporte completo.', 20, yPos);
                yPos += 8;
                doc.text('Los datos detallados están disponibles en la exportación a Excel.', 20, yPos);
            }
        } else {
            // Si html2canvas no está disponible, crear PDF solo con texto
            doc.setFontSize(11);
            doc.text('Nota: Para una mejor visualización, use la exportación a Excel.', 20, yPos);
        }
        
        // Generar nombre de archivo
        const periodLabel = getPeriodLabel(currentReportPeriod);
        const tabLabel = getTabLabel(currentReportTab);
        const fileName = `Reporte_${tabLabel}_${periodLabel}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Descargar el PDF
        doc.save(fileName);
    } catch (error) {
        console.error('Error al exportar PDF:', error);
        alert('Error al exportar PDF: ' + error.message + '\n\nIntenta usar la exportación a Excel como alternativa.');
    }
}

// Función para exportar a Excel
function exportToExcel() {
    try {
        // Verificar que la biblioteca esté disponible
        if (typeof XLSX === 'undefined') {
            alert('Error: La biblioteca SheetJS no está cargada. Por favor recarga la página.');
            return;
        }
        
        const workbook = XLSX.utils.book_new();
        
        // Obtener datos según la pestaña actual
        let sheetData = [];
        let sheetName = '';
        
        switch (currentReportTab) {
            case 'rotation':
                sheetName = 'Rotación';
                // Obtener datos de la tabla de métricas detalladas
                const rotationTable = document.querySelector('#main-content .card-body table');
                if (rotationTable) {
                    sheetData = tableToArray(rotationTable);
                } else {
                    // Datos alternativos si no hay tabla
                    sheetData = [
                        ['Producto', 'Rotación', 'Stock Actual', 'Precio', 'Categoría', 'Valor Total']
                    ];
                    if (window.rotationChartData) {
                        window.rotationChartData.forEach(item => {
                            const product = products.find(p => p.nombre === item.name);
                            sheetData.push([
                                item.name,
                                item.value,
                                product ? parseInt(product.stock || 0) : 0,
                                product ? parseFloat(product.precio || 0) : 0,
                                product ? (categorias.find(c => c.id == product.categoria_id)?.nombre || 'N/A') : 'N/A',
                                product ? (parseInt(product.stock || 0) * parseFloat(product.precio || 0)) : 0
                            ]);
                        });
                    }
                }
                break;
                
            case 'costs':
                sheetName = 'Costos';
                const costsTable = document.querySelector('#main-content .card-body table');
                if (costsTable) {
                    sheetData = tableToArray(costsTable);
                } else {
                    sheetData = [
                        ['Mes', 'Ventas', 'Compras', 'Margen', 'Margen %']
                    ];
                    const months = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'];
                    const sales = [23500, 29000, 31500, 28000, 35500, 39000];
                    const purchases = [19000, 22000, 24500, 21000, 27000, 29500];
                    months.forEach((month, index) => {
                        const margin = sales[index] - purchases[index];
                        const marginPercent = purchases[index] > 0 ? ((sales[index] - purchases[index]) / purchases[index] * 100).toFixed(1) : 0;
                        sheetData.push([month, sales[index], purchases[index], margin, parseFloat(marginPercent)]);
                    });
                }
                break;
                
            case 'stock':
                sheetName = 'Niveles de Stock';
                const stockTable = document.querySelector('#main-content .card-body table');
                if (stockTable) {
                    sheetData = tableToArray(stockTable);
                } else {
                    sheetData = [
                        ['Categoría', 'Stock Actual', 'Stock Óptimo', 'Productos', 'Estado', 'Desviación']
                    ];
                    categorias.forEach(cat => {
                        const categoryProducts = products.filter(p => p.categoria_id == cat.id && p.activo !== false);
                        const currentStock = categoryProducts.reduce((sum, p) => sum + parseInt(p.stock || 0), 0);
                        const optimalStock = categoryProducts.reduce((sum, p) => sum + parseInt(p.stock_minimo || 0), 0) * 2;
                        const status = currentStock >= optimalStock ? 'Óptimo' : currentStock >= optimalStock * 0.7 ? 'Normal' : 'Bajo';
                        const deviation = ((currentStock / optimalStock) * 100).toFixed(1);
                        sheetData.push([
                            cat.nombre,
                            currentStock,
                            optimalStock,
                            categoryProducts.length,
                            status,
                            parseFloat(deviation)
                        ]);
                    });
                }
                break;
                
            case 'suppliers':
                sheetName = 'Proveedores';
                const suppliersTable = document.querySelector('#main-content .card-body table');
                if (suppliersTable) {
                    sheetData = tableToArray(suppliersTable);
                } else {
                    sheetData = [
                        ['Proveedor', 'Pedidos', 'Monto Total', 'Plazo Promedio', 'Cumplimiento']
                    ];
                    suppliers.forEach(supplier => {
                        const supplierOrders = orders.filter(o => o.proveedor_id == supplier.id);
                        const totalOrders = supplierOrders.length;
                        const totalAmount = supplierOrders.reduce((sum, o) => sum + parseFloat(o.monto_total || 0), 0);
                        const compliance = 95 + Math.floor(Math.random() * 4);
                        sheetData.push([
                            supplier.nombre,
                            totalOrders,
                            totalAmount,
                            '4.2 días',
                            compliance
                        ]);
                    });
                }
                break;
                
            default:
                sheetName = 'Reporte';
                sheetData = [['Datos del reporte']];
        }
        
        // Crear la hoja de cálculo
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        
        // Agregar hoja de resumen con métricas generales
        const summaryData = [
            ['Métrica', 'Valor'],
            ['Valor Inventario', '$' + products.reduce((sum, p) => sum + (parseFloat(p.precio || 0) * parseInt(p.stock || 0)), 0).toLocaleString('es-ES', {minimumFractionDigits: 2})],
            ['Items en Stock', products.filter(p => p.activo !== false).length],
            ['Categorías', categorias.length],
            ['Período', getPeriodLabel(currentReportPeriod)],
            ['Fecha de Exportación', new Date().toLocaleString('es-ES')]
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
        
        // Generar nombre de archivo
        const periodLabel = getPeriodLabel(currentReportPeriod);
        const tabLabel = getTabLabel(currentReportTab);
        const fileName = `Reporte_${tabLabel}_${periodLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Descargar el archivo
        XLSX.writeFile(workbook, fileName);
    } catch (error) {
        console.error('Error al exportar Excel:', error);
        alert('Error al exportar Excel: ' + error.message);
    }
}

// Función auxiliar para convertir tabla HTML a array
function tableToArray(table) {
    const rows = [];
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    // Agregar encabezados
    if (thead) {
        const headerRow = thead.querySelector('tr');
        if (headerRow) {
            const headers = Array.from(headerRow.querySelectorAll('th')).map(th => {
                let text = th.textContent.trim();
                // Remover caracteres especiales de badges y estilos
                text = text.replace(/\s+/g, ' ').trim();
                return text;
            });
            rows.push(headers);
        }
    }
    
    // Agregar datos
    if (tbody) {
        const dataRows = tbody.querySelectorAll('tr');
        dataRows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(td => {
                let text = td.textContent.trim();
                // Remover caracteres especiales y espacios extra
                text = text.replace(/\s+/g, ' ').trim();
                // Intentar convertir a número si es posible
                const numText = text.replace(/[$,%]/g, '');
                if (!isNaN(numText) && numText !== '') {
                    return parseFloat(numText);
                }
                return text;
            });
            rows.push(cells);
        });
    }
    
    return rows;
}

// Función auxiliar para obtener el label del período
function getPeriodLabel(period) {
    const labels = {
        'week': 'Esta Semana',
        'month': 'Este Mes',
        'quarter': 'Trimestre',
        'year': 'Año'
    };
    return labels[period] || period;
}

// Función auxiliar para obtener el label de la pestaña
function getTabLabel(tab) {
    const labels = {
        'rotation': 'Rotacion',
        'costs': 'Costos',
        'stock': 'NivelesStock',
        'suppliers': 'Proveedores'
    };
    return labels[tab] || tab;
}

// Tab de Rotación
function renderRotationTab() {
    // Calcular productos con mayor movimiento (rotación)
    const productMovements = {};
    movements.forEach(m => {
        if (!productMovements[m.producto_nombre]) {
            productMovements[m.producto_nombre] = 0;
        }
        productMovements[m.producto_nombre] += parseInt(m.cantidad || 0);
    });
    
    // Ordenar y tomar los top 5
    const topProducts = Object.entries(productMovements)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));
    
    // Guardar datos globalmente para inicialización
    window.rotationChartData = topProducts;
    
    // Obtener todos los productos con sus datos completos para la tabla
    const allProductsRotation = Object.entries(productMovements)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => {
            const product = products.find(p => p.nombre === name);
            return {
                name,
                value,
                stock: product ? parseInt(product.stock || 0) : 0,
                precio: product ? parseFloat(product.precio || 0) : 0,
                categoria: product ? (categorias.find(c => c.id == product.categoria_id)?.nombre || 'N/A') : 'N/A'
            };
        });
    
    return `
        <div>
            <h5 class="mb-2">Análisis de Rotación de Inventario</h5>
            <p class="text-muted small mb-4">Productos con mayor movimiento</p>
            <div style="height: 400px;">
                <canvas id="rotationChart"></canvas>
            </div>
        </div>
        <div class="mt-4">
            <h5 class="mb-3">Métricas Detalladas</h5>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Rotación</th>
                            <th>Stock Actual</th>
                            <th>Precio</th>
                            <th>Categoría</th>
                            <th>Valor Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allProductsRotation.map(product => `
                            <tr>
                                <td>${product.name}</td>
                                <td><span class="badge bg-success">${product.value} veces</span></td>
                                <td>${product.stock} unidades</td>
                                <td>$${product.precio.toLocaleString('es-ES', {minimumFractionDigits: 2})}</td>
                                <td>${product.categoria}</td>
                                <td>$${(product.stock * product.precio).toLocaleString('es-ES', {minimumFractionDigits: 2})}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Tab de Costos
function renderCostsTab() {
    // Calcular datos mensuales para la tabla
    const months = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'];
    const sales = [23500, 29000, 31500, 28000, 35500, 39000];
    const purchases = [19000, 22000, 24500, 21000, 27000, 29500];
    const margin = sales.map((s, i) => s - purchases[i]);
    const marginPercent = sales.map((s, i) => purchases[i] > 0 ? ((s - purchases[i]) / purchases[i] * 100).toFixed(1) : 0);
    
    return `
        <div>
            <h5 class="mb-2">Análisis de Costos y Márgenes</h5>
            <p class="text-muted small mb-4">Evolución mensual de ventas, compras y margen</p>
            <div style="height: 400px;">
                <canvas id="costsChart"></canvas>
            </div>
        </div>
        <div class="mt-4">
            <h5 class="mb-3">Métricas Detalladas</h5>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Mes</th>
                            <th>Ventas</th>
                            <th>Compras</th>
                            <th>Margen</th>
                            <th>Margen %</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${months.map((month, index) => `
                            <tr>
                                <td>${month}</td>
                                <td>$${sales[index].toLocaleString('es-ES', {minimumFractionDigits: 2})}</td>
                                <td>$${purchases[index].toLocaleString('es-ES', {minimumFractionDigits: 2})}</td>
                                <td class="${margin[index] >= 0 ? 'text-success' : 'text-danger'} fw-bold">$${margin[index].toLocaleString('es-ES', {minimumFractionDigits: 2})}</td>
                                <td class="${parseFloat(marginPercent[index]) >= 0 ? 'text-success' : 'text-danger'} fw-bold">${marginPercent[index]}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Tab de Niveles de Stock
function renderStockTab() {
    // Calcular datos por categoría para la tabla
    const categoryStock = categorias.map(cat => {
        const categoryProducts = products.filter(p => p.categoria_id == cat.id && p.activo !== false);
        const currentStock = categoryProducts.reduce((sum, p) => sum + parseInt(p.stock || 0), 0);
        const optimalStock = categoryProducts.reduce((sum, p) => sum + parseInt(p.stock_minimo || 0), 0) * 2; // Asumiendo que el óptimo es 2x el mínimo
        const status = currentStock >= optimalStock ? 'Óptimo' : currentStock >= optimalStock * 0.7 ? 'Normal' : 'Bajo';
        const statusColor = currentStock >= optimalStock ? 'text-success' : currentStock >= optimalStock * 0.7 ? 'text-warning' : 'text-danger';
        
        return {
            name: cat.nombre,
            currentStock,
            optimalStock,
            status,
            statusColor,
            products: categoryProducts.length
        };
    });
    
    return `
        <div>
            <h5 class="mb-2">Niveles de Stock por Categoría</h5>
            <p class="text-muted small mb-4">Comparación con niveles óptimos</p>
            <div style="height: 400px;">
                <canvas id="stockChart"></canvas>
            </div>
        </div>
        <div class="mt-4">
            <h5 class="mb-3">Métricas Detalladas</h5>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Categoría</th>
                            <th>Stock Actual</th>
                            <th>Stock Óptimo</th>
                            <th>Productos</th>
                            <th>Estado</th>
                            <th>Desviación</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categoryStock.map(cat => {
                            const deviation = ((cat.currentStock / cat.optimalStock) * 100).toFixed(1);
                            return `
                                <tr>
                                    <td>${cat.name}</td>
                                    <td>${cat.currentStock} unidades</td>
                                    <td>${cat.optimalStock} unidades</td>
                                    <td>${cat.products} productos</td>
                                    <td class="${cat.statusColor} fw-bold">${cat.status}</td>
                                    <td class="${parseFloat(deviation) >= 100 ? 'text-success' : parseFloat(deviation) >= 70 ? 'text-warning' : 'text-danger'}">${deviation}%</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Tab de Proveedores
function renderSuppliersTab() {
    // Calcular datos de proveedores
    const supplierData = suppliers.map(supplier => {
        const supplierOrders = orders.filter(o => o.proveedor_id == supplier.id);
        const totalOrders = supplierOrders.length;
        const totalAmount = supplierOrders.reduce((sum, o) => sum + parseFloat(o.monto_total || 0), 0);
        const percentage = orders.length > 0 ? Math.round((totalOrders / orders.length) * 100) : 0;
        
        return {
            name: supplier.nombre,
            orders: totalOrders,
            amount: totalAmount,
            percentage: percentage,
            delivery: '3-5 días',
            rating: 4.5
        };
    }).sort((a, b) => b.percentage - a.percentage).slice(0, 3);
    
    // Guardar datos globalmente para inicialización
    window.suppliersPieChartData = supplierData;
    
    return `
        <div class="row">
            <div class="col-md-6">
                <h5 class="mb-2">Distribución por Proveedor</h5>
                <p class="text-muted small mb-4">% del total de pedidos</p>
                <div style="height: 300px;">
                    <canvas id="suppliersPieChart"></canvas>
                </div>
            </div>
            <div class="col-md-6">
                <h5 class="mb-2">Performance de Proveedores</h5>
                <div class="mt-4">
                    ${supplierData.map((supplier, index) => {
                        const colors = ['#198754', '#0d6efd', '#6f42c1'];
                        const color = colors[index] || '#6c757d';
                        return `
                            <div class="mb-4">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="fw-medium">${supplier.name}</span>
                                    <span class="fw-bold">${supplier.percentage}%</span>
                                </div>
                                <div class="progress mb-2" style="height: 8px;">
                                    <div class="progress-bar" role="progressbar" style="width: ${supplier.percentage}%; background-color: ${color};"></div>
                                </div>
                                <div class="small text-muted">Tiempo entrega: ${supplier.delivery}</div>
                                <div class="small text-muted">Calificación: ${supplier.rating}/5</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
        <div class="mt-4">
            <h5 class="mb-3">Métricas Detalladas</h5>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Proveedor</th>
                            <th>Pedidos</th>
                            <th>Monto Total</th>
                            <th>Plazo Promedio</th>
                            <th>Cumplimiento</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${supplierData.map(supplier => {
                            const compliance = 95 + Math.floor(Math.random() * 4); // 95-98%
                            const complianceColor = compliance >= 96 ? 'text-success' : 'text-warning';
                            return `
                                <tr>
                                    <td>${supplier.name}</td>
                                    <td>${supplier.orders}</td>
                                    <td>$${supplier.amount.toLocaleString('es-ES', {minimumFractionDigits: 2})}</td>
                                    <td>4.2 días</td>
                                    <td class="${complianceColor} fw-bold">${compliance}%</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function initRotationChart(data) {
    const ctx = document.getElementById('rotationChart');
    if (!ctx) return;
    
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    const labels = data.map(d => d.name);
    const values = data.map(d => d.value);
    
    ctx.chart = new Chart(ctx, {
            type: 'bar',
            data: {
            labels: labels,
                datasets: [{
                label: 'Veces vendido',
                data: values,
                backgroundColor: '#198754'
                }]
            },
            options: {
            indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 25
                    },
                    grid: {
                        borderDash: [5, 5]
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Veces vendido : ' + context.parsed.x;
                        }
                    }
                }
            }
            }
        });
    }

function initCostsChart() {
    const ctx = document.getElementById('costsChart');
    if (!ctx) return;
    
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    // Generar datos mensuales de los últimos 6 meses
    const months = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'];
    const sales = [23500, 29000, 31500, 28000, 35500, 39000];
    const purchases = [19000, 22000, 24500, 21000, 27000, 29500];
    const margin = sales.map((s, i) => s - purchases[i]);
    
    ctx.chart = new Chart(ctx, {
            type: 'line',
            data: {
            labels: months,
                datasets: [
                {
                    label: 'Compras',
                    data: purchases,
                    borderColor: '#dc3545',
                    backgroundColor: '#dc3545',
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#dc3545'
                },
                {
                    label: 'Margen',
                    data: margin,
                    borderColor: '#0d6efd',
                    backgroundColor: '#0d6efd',
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#0d6efd'
                },
                    {
                        label: 'Ventas',
                    data: sales,
                    borderColor: '#198754',
                    backgroundColor: '#198754',
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#198754'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 40000,
                    ticks: {
                        stepSize: 10000
                    },
                    grid: {
                        borderDash: [5, 5]
                    }
                },
                x: {
                    grid: {
                        borderDash: [5, 5]
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        }
    });
}

function initStockChart() {
    const ctx = document.getElementById('stockChart');
    if (!ctx) return;
    
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    // Calcular stock por categoría
    const categoryStock = {};
    const categoryOptimal = {};
    
    categorias.forEach(cat => {
        const catProducts = products.filter(p => p.categoria_id == cat.id && p.activo !== false);
        categoryStock[cat.nombre] = catProducts.reduce((sum, p) => sum + parseInt(p.stock || 0), 0);
        categoryOptimal[cat.nombre] = catProducts.reduce((sum, p) => sum + parseInt(p.stock_minimo || 0) * 1.5, 0); // 1.5x stock mínimo como óptimo
    });
    
    const labels = Object.keys(categoryStock);
    const currentStock = labels.map(cat => categoryStock[cat] || 0);
    const optimalStock = labels.map(cat => categoryOptimal[cat] || 0);
    
    ctx.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Stock Actual',
                    data: currentStock,
                    backgroundColor: '#198754'
                },
                {
                    label: 'Stock Óptimo',
                    data: optimalStock,
                    backgroundColor: '#e9ecef'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        borderDash: [5, 5]
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
            }
        });
    }

function initSuppliersPieChart(data) {
    const ctx = document.getElementById('suppliersPieChart');
    if (!ctx) return;
    
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    const colors = ['#198754', '#0d6efd', '#6f42c1'];
    const labels = data.map(d => d.name);
    const values = data.map(d => d.percentage);
    const backgroundColors = data.map((d, i) => colors[i] || '#6c757d');
    
    ctx.chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

function initReportsCharts() {
    // Esta función se mantiene para compatibilidad pero ya no se usa
    // Los gráficos se inicializan directamente en cada tab
}

// Alerts Page
// Variable global para preservar el filtro de alertas
let currentAlertFilter = 'all';

function renderAlerts() {
    // Función auxiliar para normalizar leida
    const isRead = (alert) => {
        return alert.leida === true || alert.leida === 1 || alert.leida === '1' || alert.leida === 'true';
    };
    
    const unreadAlerts = alerts.filter(a => !isRead(a));
    const highPriorityCount = alerts.filter(a => a.severidad === 'high').length;
    
    // Función auxiliar para obtener el color del icono según severidad
    const getSeverityIconColor = (severidad) => {
        if (severidad === 'high') return '#dc3545'; // Rojo
        if (severidad === 'medium') return '#fd7e14'; // Naranja
        return '#ffc107'; // Amarillo para low
    };
    
    // Función auxiliar para obtener el label de severidad
    const getSeverityLabel = (severidad) => {
        if (severidad === 'high') return 'Alta';
        if (severidad === 'medium') return 'Media';
        return 'Baja';
    };
    
    // Función auxiliar para obtener el color del badge de severidad
    const getSeverityBadgeColor = (severidad) => {
        if (severidad === 'high') return 'bg-danger';
        if (severidad === 'medium') return 'bg-warning';
        return 'bg-info';
    };
    
    // Filtrar alertas según el filtro seleccionado
    const filteredAlerts = alerts.filter(alert => {
        if (currentAlertFilter === 'unread') return !isRead(alert);
        if (currentAlertFilter === 'high') return alert.severidad === 'high';
        return true;
    });

    return `
        <!-- Título y Botón de Configurar -->
        <div class="d-flex justify-content-between align-items-start mb-4">
            <div>
                <h2 class="text-dark mb-1">Centro de Alertas</h2>
                <p class="text-muted mb-0">Notificaciones y alertas del sistema</p>
            </div>
            <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#alertConfigModal">
                <i class="bi bi-gear me-2"></i>Configurar Umbrales
            </button>
        </div>

        <!-- Tarjetas de Resumen -->
        <div class="row g-3 mb-4">
            <div class="col-md-4">
                <div class="card text-center" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); height: 100%;">
                    <div class="card-body p-4">
                        <div class="mb-2" style="font-size: 1.5rem; color: #0d6efd;">
                            <i class="bi bi-bell"></i>
                        </div>
                        <div class="text-muted small mb-1">Total Alertas</div>
                        <div class="h4 mb-0" style="font-weight: 600; color: #212529;">${alerts.length}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-center" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); height: 100%;">
                    <div class="card-body p-4">
                        <div class="mb-2" style="font-size: 1.5rem; color: #ffc107;">
                            <i class="bi bi-eye"></i>
                        </div>
                        <div class="text-muted small mb-1">No Leídas</div>
                        <div class="h4 mb-0" style="font-weight: 600; color: #212529;">${unreadAlerts.length}</div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-center" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1); height: 100%;">
                    <div class="card-body p-4">
                        <div class="mb-2" style="font-size: 1.5rem; color: #dc3545;">
                            <i class="bi bi-exclamation-triangle"></i>
                        </div>
                        <div class="text-muted small mb-1">Alta Prioridad</div>
                        <div class="h4 mb-0" style="font-weight: 600; color: #212529;">${highPriorityCount}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Botones de Filtro -->
        <div class="mb-4">
            <div class="btn-group" role="group" style="border: none; box-shadow: none;">
                <button type="button" class="btn ${currentAlertFilter === 'all' ? 'btn-success' : 'btn-outline-secondary'}" 
                        onclick="handleAlertFilterChange('all')" 
                        style="border-radius: 8px 0 0 8px; border: none !important; ${currentAlertFilter === 'all' ? '' : 'background-color: white; color: #6c757d;'}">
                    Todas (${alerts.length})
                </button>
                <button type="button" class="btn ${currentAlertFilter === 'unread' ? 'btn-success' : 'btn-outline-secondary'}" 
                        onclick="handleAlertFilterChange('unread')"
                        style="border: none !important; ${currentAlertFilter === 'unread' ? '' : 'background-color: white; color: #6c757d;'}">
                    No leídas (${unreadAlerts.length})
                </button>
                <button type="button" class="btn ${currentAlertFilter === 'high' ? 'btn-success' : 'btn-outline-secondary'}" 
                        onclick="handleAlertFilterChange('high')" 
                        style="border-radius: 0 8px 8px 0; border: none !important; ${currentAlertFilter === 'high' ? '' : 'background-color: white; color: #6c757d;'}">
                    Prioridad Alta (${highPriorityCount})
                </button>
            </div>
        </div>

        <!-- Lista de Alertas -->
        <div class="row g-3">
            ${filteredAlerts.length > 0 ? filteredAlerts.map(alert => {
                const isNew = !isRead(alert);
                const severityColor = getSeverityIconColor(alert.severidad);
                const severityLabel = getSeverityLabel(alert.severidad);
                const severityBadgeColor = getSeverityBadgeColor(alert.severidad);
                const fecha = new Date(alert.fecha_creacion);
                const fechaFormateada = fecha.toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                });
                const horaFormateada = fecha.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                });
                
                return `
                    <div class="col-12">
                        <div class="card" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <div class="card-body p-4">
                                <div class="d-flex align-items-start gap-3">
                                    <!-- Icono de Alerta -->
                                    <div style="flex-shrink: 0;">
                                        <div style="width: 48px; height: 48px; border-radius: 50%; background-color: ${severityColor === '#dc3545' ? '#f8d7da' : severityColor === '#fd7e14' ? '#fff3cd' : '#fff3cd'}; display: flex; align-items: center; justify-content: center;">
                                            <i class="bi bi-exclamation-triangle" style="font-size: 1.5rem; color: ${severityColor};"></i>
                                        </div>
                                    </div>
                                    
                                    <!-- Contenido de la Alerta -->
                                    <div class="flex-grow-1">
                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <h6 class="mb-2" style="font-weight: 600; color: #212529;">${alert.titulo || 'Alerta'}</h6>
                                                <div class="d-flex gap-2 mb-2">
                                                    ${isNew ? `<span class="badge bg-success" style="border-radius: 12px; padding: 0.25rem 0.75rem;">Nuevo</span>` : ''}
                                                    <span class="badge ${severityBadgeColor}" style="border-radius: 12px; padding: 0.25rem 0.75rem;">${severityLabel}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p class="text-muted mb-2" style="font-size: 0.875rem;">${alert.mensaje || ''}</p>
                                        <small class="text-muted">${fechaFormateada}, ${horaFormateada}</small>
                                    </div>
                                    
                                    <!-- Botones de Acción -->
                                    <div class="d-flex gap-2" style="flex-shrink: 0;">
                                        ${!isRead(alert) ? `
                                            <button class="btn btn-sm btn-success" onclick="markAlertRead(${alert.id})" title="Marcar como leída" style="border-radius: 8px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; padding: 0;">
                                                <i class="bi bi-check"></i>
                                            </button>
                                        ` : ''}
                                        <button class="btn btn-sm btn-danger" onclick="deleteAlert(${alert.id})" title="Eliminar" style="border-radius: 8px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; padding: 0;">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('') : `
                <div class="col-12">
                    <div class="card text-center" style="border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div class="card-body p-5">
                            <i class="bi bi-inbox" style="font-size: 3rem; color: #6c757d; margin-bottom: 1rem;"></i>
                            <p class="text-muted mb-0">No hay alertas para mostrar</p>
                        </div>
                    </div>
                </div>
            `}
        </div>

        <!-- Modal de Configuración -->
        ${renderDeleteAlertModal()}
        
        <div class="modal fade" id="alertConfigModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Configurar Umbrales</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-muted">Configuración de umbrales próximamente...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Función para renderizar el modal de eliminación de alertas
function renderDeleteAlertModal() {
    return `
        <div class="modal fade" id="deleteAlertModal" tabindex="-1" aria-labelledby="deleteAlertModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title" id="deleteAlertModalLabel">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>Confirmar Eliminación
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="delete-alert-id">
                        <div class="text-center mb-3">
                            <i class="bi bi-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
                        </div>
                        <p class="text-center mb-3">
                            ¿Estás seguro de eliminar esta alerta <strong>permanentemente</strong>?
                        </p>
                        <div class="card bg-light p-3 mb-3">
                            <div class="mb-2">
                                <strong>Título:</strong> <span id="delete-alert-titulo"></span>
                            </div>
                            <div class="mb-0">
                                <strong>Mensaje:</strong> <span id="delete-alert-mensaje"></span>
                            </div>
                        </div>
                        <p class="text-muted small text-center mb-0">
                            Esta acción no se puede deshacer.
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-danger" onclick="confirmDeleteAlert()">
                            <i class="bi bi-trash me-2"></i>Eliminar Permanentemente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Función para manejar el cambio de filtro de alertas
function handleAlertFilterChange(filter) {
    currentAlertFilter = filter;
    renderCurrentView();
    // Restaurar el valor seleccionado después de renderizar
    setTimeout(() => {
        const filterButtons = document.querySelectorAll('[onclick^="handleAlertFilterChange"]');
        filterButtons.forEach(btn => {
            const onclickAttr = btn.getAttribute('onclick');
            const filterValue = onclickAttr.match(/'([^']+)'/)?.[1];
            if (filterValue === currentAlertFilter) {
                btn.classList.remove('btn-outline-secondary');
                btn.classList.add('btn-success');
                btn.style.backgroundColor = '';
                btn.style.color = '';
            } else {
                btn.classList.remove('btn-success');
                btn.classList.add('btn-outline-secondary');
                btn.style.backgroundColor = 'white';
                btn.style.color = '#6c757d';
            }
        });
    }, 100);
}

async function markAlertRead(id) {
    try {
        await apiCall('alertas.php', 'PUT', {
            id: id,
            action: 'mark_read'
        });
        await loadAlerts();
        updateAlertBadge(); // Actualizar badge después de marcar como leída
        renderCurrentView();
    } catch (error) {
        alert('Error al marcar alerta: ' + error.message);
    }
}

async function deleteAlert(id) {
    try {
        // Buscar la alerta en el array
        const alertToDelete = alerts.find(a => a.id == id);
        if (!alertToDelete) {
            alert('No se encontró la alerta.');
            return;
        }
        
        // Llenar el modal con los datos de la alerta
        document.getElementById('delete-alert-id').value = alertToDelete.id;
        document.getElementById('delete-alert-titulo').textContent = alertToDelete.titulo || 'Sin título';
        document.getElementById('delete-alert-mensaje').textContent = alertToDelete.mensaje || 'Sin mensaje';
        
        // Mostrar el modal
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteAlertModal'));
        deleteModal.show();
    } catch (error) {
        console.error('Error al cargar alerta para eliminar:', error);
        alert('Error al cargar la información de la alerta.');
    }
}

async function confirmDeleteAlert() {
    const alertId = document.getElementById('delete-alert-id').value;
    if (!alertId) {
        alert('Error: No se pudo identificar la alerta a eliminar.');
        return;
    }
    
    try {
        await apiCall(`alertas.php?id=${alertId}`, 'DELETE');
        
        // Cerrar el modal
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteAlertModal'));
        if (deleteModal) {
            deleteModal.hide();
        }
        
        // Recargar alertas y actualizar la vista
        await loadAlerts();
        updateAlertBadge(); // Actualizar badge después de eliminar
        renderCurrentView();
    } catch (error) {
        console.error('Error al eliminar alerta:', error);
        const errorMsg = error.message || 'Error desconocido al eliminar la alerta';
        alert('Error: ' + errorMsg);
    }
}

// Audit Page (Historial)
let currentAuditYear = new Date().getFullYear(); // Año actual por defecto

function renderAudit() {
    // Asegurar que auditLogs es un array
    if (!Array.isArray(auditLogs)) {
        auditLogs = [];
    }
    
    // Obtener años únicos de los logs
    const years = [...new Set(auditLogs.map(log => {
        if (!log || !log.fecha) return null;
        const fecha = new Date(log.fecha);
        return fecha.getFullYear();
    }).filter(year => year !== null))].sort((a, b) => b - a); // Ordenar descendente
    
    // Si no hay logs del año seleccionado, agregar el año actual
    if (!years.includes(currentAuditYear) && currentAuditYear !== 'all') {
        years.unshift(currentAuditYear);
    }
    
    // Filtrar logs por año seleccionado
    const filteredLogs = auditLogs.filter(log => {
        if (!log || !log.fecha) return false;
        if (currentAuditYear === 'all') return true;
        try {
            const logYear = new Date(log.fecha).getFullYear();
            return logYear === currentAuditYear;
        } catch (e) {
            return false;
        }
    });

    // Aplicar anchos fijos a todas las columnas para mantener consistencia entre todos los años
    // Estilos para cada columna (aplicados a todos los años incluyendo 2024, 2025 y "Todos")
    const columnStyles = {
        usuario: 'style="width: 12%;"',
        accion: 'style="width: 18%;"',
        entidad: 'style="width: 10%;"',
        entidadId: 'style="width: 8%;"',
        cambios: 'style="width: 32%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"',
        fecha: 'style="width: 20%;"'
    };

    return `
        <div class="mb-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                    <h2 class="text-dark mb-1">Historial</h2>
                    <p class="text-muted mb-0">Registro completo de cambios y actividades del sistema</p>
                </div>
                <button class="btn btn-outline-success" onclick="alert('Exportar logs próximamente')">
                    <i class="bi bi-download me-2"></i>Exportar Logs
                </button>
            </div>
        </div>

        <div class="mb-4">
            <div class="d-flex justify-content-end">
                <div style="min-width: 200px; max-width: 250px;">
                    <label for="audit-year-filter" class="form-label mb-2">Filtrar por año</label>
                    <select class="form-select" id="audit-year-filter" onchange="handleAuditYearFilterChange()">
                        <option value="all" ${currentAuditYear === 'all' ? 'selected' : ''}>Todos los años</option>
                        ${years.map(year => `
                            <option value="${year}" ${year === currentAuditYear ? 'selected' : ''}>${year}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
        </div>

        <div class="card-custom">
            <div class="table-responsive">
                <table class="table table-custom mb-0" style="table-layout: fixed; width: 100%;">
                    <thead>
                        <tr>
                            <th ${columnStyles.usuario}>Usuario</th>
                            <th ${columnStyles.accion}>Acción</th>
                            <th ${columnStyles.entidad}>Entidad</th>
                            <th ${columnStyles.entidadId}>ID Entidad</th>
                            <th ${columnStyles.cambios}>Cambios</th>
                            <th ${columnStyles.fecha}>Fecha/Hora</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredLogs.length > 0 ? filteredLogs.map(log => {
                            if (!log) return '';
                            const accionClass = log.accion && log.accion.includes('Creación') ? 'bg-success' : 
                                               log.accion && log.accion.includes('Actualización') ? 'bg-primary' : 'bg-danger';
                            const fechaStr = log.fecha ? new Date(log.fecha).toLocaleString('es-ES') : '';
                            return `
                            <tr>
                                <td ${columnStyles.usuario}>${log.nombre_usuario || ''}</td>
                                <td ${columnStyles.accion}>
                                    <span class="badge ${accionClass}">
                                        ${log.accion || ''}
                                    </span>
                                </td>
                                <td ${columnStyles.entidad}>${log.entidad || ''}</td>
                                <td ${columnStyles.entidadId}>${log.entidad_id || ''}</td>
                                <td ${columnStyles.cambios} title="${log.cambios || ''}">${log.cambios || ''}</td>
                                <td ${columnStyles.fecha}>${fechaStr}</td>
                            </tr>
                            `;
                        }).join('') : `
                            <tr>
                                <td colspan="6" class="text-center text-muted py-4">
                                    <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                                    <p class="mt-2 mb-0">${currentAuditYear === 'all' ? 'No hay registros disponibles' : `No hay registros para el año ${currentAuditYear}`}</p>
                                </td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Users Page
async function renderUsers() {
    await loadUsuarios();

    const roleLabels = {
        admin: 'Administrador',
        inventory_manager: 'Gestor de Inventario'
    };

    return `
        <div class="mb-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                    <h2 class="text-dark mb-1">Usuarios & Roles</h2>
                    <p class="text-muted mb-0">Gestiona usuarios y permisos del sistema</p>
                </div>
                <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#addUserModal">
                    <i class="bi bi-plus-lg me-2"></i>Agregar Usuario
                </button>
            </div>
        </div>

        <div class="card-custom">
            <div class="table-responsive">
                <table class="table table-custom mb-0">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${usuarios.length > 0 ? usuarios.map(user => `
                            <tr>
                                <td>${user.nombre || ''}</td>
                                <td>${user.email || ''}</td>
                                <td>
                                    <span class="badge bg-primary">${roleLabels[user.rol] || user.rol || 'N/A'}</span>
                                </td>
                                <td>
                                    <span class="badge ${user.activo ? 'bg-success' : 'bg-secondary'}">
                                        ${user.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editUser(${user.id})">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${user.id})">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="5" class="text-center text-muted py-4">
                                    <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                                    <p class="mt-2 mb-0">No hay usuarios registrados</p>
                                </td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="modal fade" id="addUserModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Nuevo Usuario</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form id="add-user-form" onsubmit="handleAddUser(event)">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="new-user-name" class="form-label">Nombre completo <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="new-user-name" required>
                            </div>
                            <div class="mb-3">
                                <label for="new-user-email" class="form-label">Correo electrónico <span class="text-danger">*</span></label>
                                <input type="email" class="form-control" id="new-user-email" required>
                            </div>
                            <div class="mb-3">
                                <label for="new-user-password" class="form-label">Contraseña <span class="text-danger">*</span></label>
                                <input type="password" class="form-control" id="new-user-password" required minlength="6">
                                <small class="text-muted">Mínimo 6 caracteres</small>
                            </div>
                            <div class="mb-3">
                                <label for="new-user-role" class="form-label">Rol <span class="text-danger">*</span></label>
                                <select class="form-select" id="new-user-role" required>
                                    <option value="">Seleccionar rol...</option>
                                    <option value="admin">Administrador</option>
                                    <option value="inventory_manager">Gestor de Inventario</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="new-user-activo" checked>
                                    <label class="form-check-label" for="new-user-activo">
                                        Usuario activo
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-success">
                                <i class="bi bi-check-circle me-2"></i>Crear Usuario
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div class="modal fade" id="editUserModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Editar Usuario</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form id="edit-user-form" onsubmit="handleEditUser(event)">
                        <input type="hidden" id="edit-user-id">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="edit-user-name" class="form-label">Nombre completo <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="edit-user-name" required>
                            </div>
                            <div class="mb-3">
                                <label for="edit-user-email" class="form-label">Correo electrónico <span class="text-danger">*</span></label>
                                <input type="email" class="form-control" id="edit-user-email" required>
                            </div>
                            <div class="mb-3">
                                <label for="edit-user-password" class="form-label">Nueva contraseña</label>
                                <input type="password" class="form-control" id="edit-user-password" minlength="6">
                                <small class="text-muted">Dejar en blanco para mantener la contraseña actual. Mínimo 6 caracteres si se cambia.</small>
                            </div>
                            <div class="mb-3">
                                <label for="edit-user-role" class="form-label">Rol <span class="text-danger">*</span></label>
                                <select class="form-select" id="edit-user-role" required>
                                    <option value="">Seleccionar rol...</option>
                                    <option value="admin">Administrador</option>
                                    <option value="inventory_manager">Gestor de Inventario</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="edit-user-activo">
                                    <label class="form-check-label" for="edit-user-activo">
                                        Usuario activo
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-success">
                                <i class="bi bi-check-circle me-2"></i>Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

async function handleAddUser(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('new-user-name').value.trim();
    const email = document.getElementById('new-user-email').value.trim();
    const password = document.getElementById('new-user-password').value;
    const rol = document.getElementById('new-user-role').value;
    const activo = document.getElementById('new-user-activo').checked ? 1 : 0;
    
    // Validaciones
    if (!nombre || !email || !password || !rol) {
        alert('Por favor completa todos los campos requeridos');
        return;
    }
    
    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    try {
        const response = await apiCall('usuarios.php', 'POST', {
            nombre: nombre,
            email: email,
            password: password,
            rol: rol,
            activo: activo
        });
        
        if (response.success) {
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
            modal.hide();
            
            // Limpiar el formulario
            document.getElementById('add-user-form').reset();
            
            // Recargar usuarios y actualizar la vista
            await loadUsuarios();
            renderCurrentView();
            
            // Mostrar mensaje de éxito
            alert('Usuario creado exitosamente');
        }
    } catch (error) {
        alert('Error al crear usuario: ' + error.message);
    }
}

async function editUser(id) {
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
        return;
    }
    
    const user = usuarios.find(u => u.id == userId);
    if (!user) {
        return;
    }
    
    // Llenar el formulario con los datos del usuario
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-user-name').value = user.nombre || '';
    document.getElementById('edit-user-email').value = user.email || '';
    document.getElementById('edit-user-password').value = '';
    document.getElementById('edit-user-role').value = user.rol || '';
    document.getElementById('edit-user-activo').checked = user.activo ? true : false;
    
    // Abrir el modal
    const editModal = document.getElementById('editUserModal');
    if (editModal) {
        const modal = new bootstrap.Modal(editModal);
        modal.show();
    }
}

async function handleEditUser(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edit-user-id').value);
    const nombre = document.getElementById('edit-user-name').value.trim();
    const email = document.getElementById('edit-user-email').value.trim();
    const password = document.getElementById('edit-user-password').value;
    const rol = document.getElementById('edit-user-role').value;
    const activo = document.getElementById('edit-user-activo').checked ? 1 : 0;
    
    // Validaciones
    if (!nombre || !email || !rol) {
        return;
    }
    
    if (password && password.length < 6) {
        return;
    }
    
    try {
        const updateData = {
            id: id,
            nombre: nombre,
            email: email,
            rol: rol,
            activo: activo
        };
        
        // Solo incluir password si se proporcionó uno nuevo
        if (password && password.length >= 6) {
            updateData.password = password;
        }
        
        const response = await apiCall('usuarios.php', 'PUT', updateData);
        
        if (response.success) {
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
            modal.hide();
            
            // Limpiar el formulario
            document.getElementById('edit-user-form').reset();
            
            // Recargar usuarios y actualizar la vista
            await loadUsuarios();
            renderCurrentView();
        }
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
    }
}

async function deleteUser(id) {
    // Convertir ID a número si es string
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
        return;
    }
    
    const user = usuarios.find(u => u.id == userId);
    if (!user) {
        return;
    }
    
    try {
        const response = await apiCall(`usuarios.php?id=${userId}`, 'DELETE');
        
        if (response && response.success) {
            // Recargar usuarios
            await loadUsuarios();
            
            // Actualizar la vista
            renderCurrentView();
        }
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
    }
}

// Settings Page
function renderSettings() {
    if (!currentUser) return '<div class="alert alert-warning">No hay usuario logueado</div>';
    
    return `
        <div class="mb-4">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                    <h2 class="text-dark mb-1">Configuración</h2>
                    <p class="text-muted mb-0">Personaliza y configura el sistema</p>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-success" onclick="alert('Configuración guardada')">
                        <i class="bi bi-save me-2"></i>Guardar Cambios
                    </button>
                    <button class="btn btn-outline-danger" onclick="setupLogout(); document.getElementById('logout-btn')?.click();">
                        <i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>

        <div class="row g-4">
            <div class="col-lg-4">
                <div class="card-custom text-center">
                    <div class="mb-3">
                        <div class="avatar-sm bg-success rounded-circle d-inline-flex align-items-center justify-content-center text-white mx-auto" style="width: 80px; height: 80px; font-size: 2rem;">
                            ${currentUser.nombre.charAt(0)}
                        </div>
                    </div>
                    <h5 class="text-dark">${currentUser.nombre}</h5>
                    <p class="text-muted">${currentUser.email}</p>
                    <span class="badge bg-success">${currentUser.rol === 'admin' ? 'Administrador' : currentUser.rol}</span>
                </div>
            </div>
            <div class="col-lg-8">
                <div class="card-custom">
                    <h5 class="mb-3">Preferencias</h5>
                    <div class="mb-3">
                        <label class="form-label">Notificaciones por Email</label>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" checked>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Alertas de Stock Bajo</label>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" checked>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Idioma</label>
                        <select class="form-select">
                            <option>Español</option>
                            <option>English</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    `;
}

