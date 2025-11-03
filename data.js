// Mock Data for Inventory System
// Note: These are not used anymore - the app uses real data from the API

// All data wrapped in mockData object to avoid global scope pollution
const mockData = {
    user: {
        id: '1',
        name: 'Ana García',
        email: 'ana.garcia@empresa.com',
        role: 'admin'
    },
    products: [
        {
            id: 'p1',
            sku: 'SKU-001',
            name: 'Laptop Dell Inspiron 15',
            description: 'Laptop empresarial con procesador Intel i7',
            category: 'Electrónica',
            stock: 45,
            minStock: 20,
            price: 899.99,
            supplier: 'TechCorp S.A.',
            lastUpdated: '2025-10-20T10:30:00'
        },
        {
            id: 'p2',
            sku: 'SKU-002',
            name: 'Monitor LG 27"',
            description: 'Monitor LED Full HD con ajuste de altura',
            category: 'Electrónica',
            stock: 12,
            minStock: 15,
            price: 249.99,
            supplier: 'TechCorp S.A.',
            lastUpdated: '2025-10-21T14:15:00'
        },
        {
            id: 'p3',
            sku: 'SKU-003',
            name: 'Teclado Mecánico Logitech',
            description: 'Teclado mecánico retroiluminado RGB',
            category: 'Periféricos',
            stock: 67,
            minStock: 30,
            price: 89.99,
            supplier: 'Office Supplies Inc.',
            lastUpdated: '2025-10-19T09:20:00'
        },
        {
            id: 'p4',
            sku: 'SKU-004',
            name: 'Mouse Inalámbrico',
            description: 'Mouse ergonómico inalámbrico 2.4GHz',
            category: 'Periféricos',
            stock: 8,
            minStock: 25,
            price: 29.99,
            supplier: 'Office Supplies Inc.',
            lastUpdated: '2025-10-22T16:45:00'
        },
        {
            id: 'p5',
            sku: 'SKU-005',
            name: 'Silla Ergonómica Pro',
            description: 'Silla de oficina con soporte lumbar ajustable',
            category: 'Mobiliario',
            stock: 23,
            minStock: 10,
            price: 349.99,
            supplier: 'Muebles Corp',
            lastUpdated: '2025-10-18T11:00:00'
        },
        {
            id: 'p6',
            sku: 'SKU-006',
            name: 'Escritorio Standing Desk',
            description: 'Escritorio ajustable en altura eléctrico',
            category: 'Mobiliario',
            stock: 15,
            minStock: 8,
            price: 599.99,
            supplier: 'Muebles Corp',
            lastUpdated: '2025-10-23T08:30:00'
        },
        {
            id: 'p7',
            sku: 'SKU-007',
            name: 'Papel Bond A4 (Resma)',
            description: 'Resma de 500 hojas papel bond blanco',
            category: 'Suministros',
            stock: 156,
            minStock: 100,
            price: 4.99,
            supplier: 'Office Supplies Inc.',
            lastUpdated: '2025-10-20T13:20:00'
        },
        {
            id: 'p8',
            sku: 'SKU-008',
            name: 'Cartucho Tinta HP Negro',
            description: 'Cartucho de tinta original HP 664XL',
            category: 'Suministros',
            stock: 7,
            minStock: 20,
            price: 35.99,
            supplier: 'TechCorp S.A.',
            lastUpdated: '2025-10-22T10:10:00'
        }
    ],
    suppliers: [
        {
            id: 's1',
            name: 'TechCorp S.A.',
            contact: 'Carlos Rodríguez',
            email: 'ventas@techcorp.com',
            phone: '+34 912 345 678',
            address: 'Av. Tecnología 123, Madrid',
            productsSupplied: 45,
            totalOrders: 127
        },
        {
            id: 's2',
            name: 'Office Supplies Inc.',
            contact: 'María López',
            email: 'contacto@officesupplies.com',
            phone: '+34 913 456 789',
            address: 'C/ Suministros 45, Barcelona',
            productsSupplied: 32,
            totalOrders: 89
        },
        {
            id: 's3',
            name: 'Muebles Corp',
            contact: 'Juan Martínez',
            email: 'info@mueblescorp.com',
            phone: '+34 914 567 890',
            address: 'Polígono Industrial 7, Valencia',
            productsSupplied: 18,
            totalOrders: 54
        }
    ],
    orders: [
        {
            id: 'o1',
            products: [
                { productId: 'p2', productName: 'Monitor LG 27"', quantity: 20 }
            ],
            supplier: 'TechCorp S.A.',
            status: 'shipped',
            totalAmount: 4999.80,
            estimatedDelivery: '2025-10-25T00:00:00',
            createdAt: '2025-10-15T10:00:00',
            createdBy: 'Ana García'
        },
        {
            id: 'o2',
            products: [
                { productId: 'p4', productName: 'Mouse Inalámbrico', quantity: 50 },
                { productId: 'p3', productName: 'Teclado Mecánico Logitech', quantity: 30 }
            ],
            supplier: 'Office Supplies Inc.',
            status: 'confirmed',
            totalAmount: 4199.20,
            estimatedDelivery: '2025-10-28T00:00:00',
            createdAt: '2025-10-20T14:30:00',
            createdBy: 'Pedro Sánchez'
        },
        {
            id: 'o3',
            products: [
                { productId: 'p5', productName: 'Silla Ergonómica Pro', quantity: 15 }
            ],
            supplier: 'Muebles Corp',
            status: 'delivered',
            totalAmount: 5249.85,
            estimatedDelivery: '2025-10-18T00:00:00',
            createdAt: '2025-10-10T09:15:00',
            createdBy: 'Ana García'
        },
        {
            id: 'o4',
            products: [
                { productId: 'p8', productName: 'Cartucho Tinta HP Negro', quantity: 30 }
            ],
            supplier: 'TechCorp S.A.',
            status: 'created',
            totalAmount: 1079.70,
            estimatedDelivery: '2025-10-30T00:00:00',
            createdAt: '2025-10-23T11:00:00',
            createdBy: 'Pedro Sánchez'
        }
    ],
    movements: [
        {
            id: 'm1',
            type: 'entry',
            productId: 'p1',
            productName: 'Laptop Dell Inspiron 15',
            quantity: 25,
            responsible: 'Ana García',
            reference: 'PO-2025-001',
            timestamp: '2025-10-20T10:30:00',
            notes: 'Recepción pedido mensual'
        },
        {
            id: 'm2',
            type: 'exit',
            productId: 'p3',
            productName: 'Teclado Mecánico Logitech',
            quantity: 15,
            responsible: 'Pedro Sánchez',
            reference: 'SO-2025-045',
            timestamp: '2025-10-21T14:20:00',
            notes: 'Venta área comercial'
        },
        {
            id: 'm3',
            type: 'entry',
            productId: 'p7',
            productName: 'Papel Bond A4 (Resma)',
            quantity: 100,
            responsible: 'María López',
            reference: 'PO-2025-002',
            timestamp: '2025-10-22T09:15:00'
        },
        {
            id: 'm4',
            type: 'exit',
            productId: 'p2',
            productName: 'Monitor LG 27"',
            quantity: 8,
            responsible: 'Ana García',
            reference: 'SO-2025-046',
            timestamp: '2025-10-22T16:45:00',
            notes: 'Asignación nuevo departamento'
        },
        {
            id: 'm5',
            type: 'entry',
            productId: 'p5',
            productName: 'Silla Ergonómica Pro',
            quantity: 15,
            responsible: 'Juan Martínez',
            reference: 'PO-2025-003',
            timestamp: '2025-10-18T11:00:00'
        }
    ],
    alerts: [
        {
            id: 'a1',
            type: 'low_stock',
            title: 'Stock Bajo - Cartucho Tinta HP Negro',
            message: 'El producto está por debajo del umbral mínimo (7/20)',
            productId: 'p8',
            timestamp: '2025-10-23T08:00:00',
            read: false,
            severity: 'high'
        },
        {
            id: 'a2',
            type: 'low_stock',
            title: 'Stock Bajo - Monitor LG 27"',
            message: 'El producto está por debajo del umbral mínimo (12/15)',
            productId: 'p2',
            timestamp: '2025-10-22T10:30:00',
            read: false,
            severity: 'medium'
        },
        {
            id: 'a3',
            type: 'low_stock',
            title: 'Stock Bajo - Mouse Inalámbrico',
            message: 'El producto está por debajo del umbral mínimo (8/25)',
            productId: 'p4',
            timestamp: '2025-10-22T16:45:00',
            read: true,
            severity: 'high'
        },
        {
            id: 'a4',
            type: 'order_delayed',
            title: 'Pedido próximo a vencer',
            message: 'Pedido #o1 debe llegar en 2 días',
            timestamp: '2025-10-23T09:00:00',
            read: false,
            severity: 'medium'
        }
    ],
    auditLogs: [
        {
            id: 'al1',
            userId: '1',
            userName: 'Ana García',
            action: 'Actualización de producto',
            entity: 'Producto',
            entityId: 'p2',
            changes: 'Stock actualizado: 20 → 12',
            timestamp: '2025-10-22T16:50:00'
        },
        {
            id: 'al2',
            userId: '2',
            userName: 'Pedro Sánchez',
            action: 'Creación de pedido',
            entity: 'Pedido',
            entityId: 'o4',
            changes: 'Nuevo pedido creado - Proveedor: TechCorp S.A.',
            timestamp: '2025-10-23T11:00:00'
        },
        {
            id: 'al3',
            userId: '1',
            userName: 'Ana García',
            action: 'Registro de movimiento',
            entity: 'Movimiento',
            entityId: 'm1',
            changes: 'Entrada de inventario - 25 unidades',
            timestamp: '2025-10-20T10:30:00'
        },
        {
            id: 'al4',
            userId: '3',
            userName: 'María López',
            action: 'Actualización de proveedor',
            entity: 'Proveedor',
            entityId: 's2',
            changes: 'Teléfono actualizado',
            timestamp: '2025-10-19T14:20:00'
        },
        {
            id: 'al5',
            userId: '1',
            userName: 'Ana García',
            action: 'Eliminación de alerta',
            entity: 'Alerta',
            entityId: 'a5',
            changes: 'Alerta marcada como resuelta',
            timestamp: '2025-10-21T09:15:00'
        }
    ],
    // Chart Data
    stockData: [
        { month: 'May', entradas: 45, salidas: 32 },
        { month: 'Jun', entradas: 52, salidas: 41 },
        { month: 'Jul', entradas: 61, salidas: 38 },
        { month: 'Ago', entradas: 48, salidas: 45 },
        { month: 'Sep', entradas: 70, salidas: 52 },
        { month: 'Oct', entradas: 65, salidas: 48 }
    ],
    categoryData: [
        { name: 'Electrónica', value: 35, color: '#27AE60' },
        { name: 'Periféricos', value: 28, color: '#3498DB' },
        { name: 'Mobiliario', value: 22, color: '#9B59B6' },
        { name: 'Suministros', value: 15, color: '#F39C12' }
    ],
    costData: [
        { day: 'Lun', costo: 4200 },
        { day: 'Mar', costo: 3800 },
        { day: 'Mié', costo: 5100 },
        { day: 'Jue', costo: 4600 },
        { day: 'Vie', costo: 5400 },
        { day: 'Sáb', costo: 3200 },
        { day: 'Dom', costo: 2800 }
    ]
};

// Note: The old variables are no longer exported to avoid conflicts
// The app uses real data from the API
