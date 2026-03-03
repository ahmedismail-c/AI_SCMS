const Storage = {
    // Initialize all data from JSON files
    init: async function() {
        // Check if data already exists in localStorage
        const dataTypes = ['inventory', 'procurement', 'costs', 'orders', 'suppliers'];
        let needsInitialization = false;
        
        dataTypes.forEach(type => {
            if (!localStorage.getItem(type)) {
                needsInitialization = true;
            }
        });
        
        if (needsInitialization) {
            await this.loadAllData();
        }
    },
    
    // Load all data from JSON files
    loadAllData: async function() {
        try {
            // Load inventory data
            const inventoryResponse = await fetch('data/inventory.json');
            const inventoryData = await inventoryResponse.json();
            localStorage.setItem('inventory', JSON.stringify(inventoryData.inventory));
            
            // Load procurement data
            const procurementResponse = await fetch('data/procurement.json');
            const procurementData = await procurementResponse.json();
            localStorage.setItem('procurement', JSON.stringify(procurementData.procurement));
            
            // Load costs data
            const costsResponse = await fetch('data/costs.json');
            const costsData = await costsResponse.json();
            localStorage.setItem('costs', JSON.stringify(costsData.costs));
            
            // Load orders data
            const ordersResponse = await fetch('data/orders.json');
            const ordersData = await ordersResponse.json();
            localStorage.setItem('orders', JSON.stringify(ordersData.orders));
            
            // Load suppliers data
            const suppliersResponse = await fetch('data/suppliers.json');
            const suppliersData = await suppliersResponse.json();
            localStorage.setItem('suppliers', JSON.stringify(suppliersData.suppliers));
            
            console.log('All data loaded successfully');
            this.showNotification('Data loaded successfully', 'success');
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.loadDefaultData(); // Fallback to hardcoded data
        }
    },
    
    // Fallback default data (if JSON files fail to load)
    loadDefaultData: function() {
        const defaultInventory = [
            {
                id: 1,
                sku: 'SKU001',
                name: 'Laptop Dell XPS 15',
                category: 'Electronics',
                quantity: 45,
                price: 1299.99,
                location: 'Warehouse A',
                reorderLevel: 10
            },
            {
                id: 2,
                sku: 'SKU002',
                name: 'Office Chair Ergonomics',
                category: 'Furniture',
                quantity: 23,
                price: 299.99,
                location: 'Warehouse B',
                reorderLevel: 5
            }
        ];
        
        localStorage.setItem('inventory', JSON.stringify(defaultInventory));
        localStorage.setItem('procurement', JSON.stringify([]));
        localStorage.setItem('costs', JSON.stringify([]));
        localStorage.setItem('orders', JSON.stringify([]));
        localStorage.setItem('suppliers', JSON.stringify([]));
        
        this.showNotification('Using default data', 'warning');
    },
    
    // Get all data from a specific collection
    getData: function(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },
    
    // Save data to a collection
    saveData: function(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
        document.dispatchEvent(new CustomEvent('data-updated', { 
            detail: { collection: key, data: data }
        }));
    },
    
// Add new item to collection (with option to suppress notification)
addItem: function(key, item, showNotification = true) {
    const items = this.getData(key);
    item.id = Date.now(); // Generate unique ID
    items.push(item);
    this.saveData(key, items);
    if (showNotification) {
        this.showNotification('Item added successfully', 'success');
    }
    return item;
},    
    // Update existing item
    updateItem: function(key, id, updatedItem) {
        const items = this.getData(key);
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updatedItem };
            this.saveData(key, items);
            this.showNotification('Item updated successfully', 'success');
            return items[index];
        }
        this.showNotification('Item not found', 'error');
        return null;
    },
    
    // Delete item
    deleteItem: function(key, id) {
        const items = this.getData(key);
        const filtered = items.filter(item => item.id !== id);
        this.saveData(key, filtered);
        this.showNotification('Item deleted successfully', 'success');
    },
    
    // Get item by ID
    getItemById: function(key, id) {
        const items = this.getData(key);
        return items.find(item => item.id === id);
    },
    
    // Filter items
    filterItems: function(key, predicate) {
        const items = this.getData(key);
        return items.filter(predicate);
    },
    
    // Search items
    searchItems: function(key, searchTerm, fields) {
        const items = this.getData(key);
        searchTerm = searchTerm.toLowerCase();
        return items.filter(item => {
            return fields.some(field => {
                const value = item[field];
                return value && value.toString().toLowerCase().includes(searchTerm);
            });
        });
    },
    
    // Get summary statistics
    getSummary: function() {
        const inventory = this.getData('inventory');
        const procurement = this.getData('procurement');
        const costs = this.getData('costs');
        const orders = this.getData('orders');
        
        const totalInventoryValue = inventory.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0);
        
        const totalProcurementValue = procurement
            .filter(p => p.status !== 'cancelled')
            .reduce((sum, p) => sum + p.totalAmount, 0);
        
        const totalCosts = costs
            .filter(c => c.category !== 'Revenue')
            .reduce((sum, c) => sum + c.amount, 0);
        
        const totalRevenue = costs
            .filter(c => c.category === 'Revenue')
            .reduce((sum, c) => sum + Math.abs(c.amount), 0);
        
        const totalOrderValue = orders
            .filter(o => o.status !== 'cancelled')
            .reduce((sum, o) => sum + o.totalAmount, 0);
        
        const lowStockItems = inventory.filter(item => item.quantity <= (item.reorderLevel || 10)).length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const pendingProcurement = procurement.filter(p => p.status === 'pending').length;
        
        return {
            inventory: {
                totalItems: inventory.length,
                totalValue: totalInventoryValue,
                lowStock: lowStockItems
            },
            procurement: {
                total: procurement.length,
                totalValue: totalProcurementValue,
                pending: pendingProcurement
            },
            costs: {
                total: costs.filter(c => c.category !== 'Revenue').length,
                totalValue: totalCosts,
                revenue: totalRevenue,
                profit: totalRevenue - totalCosts
            },
            orders: {
                total: orders.length,
                totalValue: totalOrderValue,
                pending: pendingOrders
            }
        };
    },
    
    // Show notification
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type}`;
        notification.innerHTML = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.style.animation = 'slideIn 0.3s';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '5px';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
};

// Initialize storage when the script loads
Storage.init();