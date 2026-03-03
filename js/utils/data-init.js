// Data Initialization Helper
const DataInitializer = {
    // Check if system has any data
    isEmpty: function() {
        const inventory = Storage.getData('inventory');
        const procurement = Storage.getData('procurement');
        const costs = Storage.getData('costs');
        const orders = Storage.getData('orders');
        const suppliers = Storage.getData('suppliers');
        
        return inventory.length === 0 && 
               procurement.length === 0 && 
               costs.length === 0 && 
               orders.length === 0 && 
               suppliers.length === 0;
    },
    
    // Show welcome message for new users
    showWelcomeMessage: function() {
        if (this.isEmpty()) {
            const message = `
                🎉 Welcome to your Supply Chain Management System!
                
                Your system is ready for you to add your own data.
                
                Quick Start:
                • Go to Inventory to add your products
                • Add Suppliers in the Procurement module
                • Create Purchase Orders
                • Track Costs and Orders
                
                Click the + buttons in each module to start adding data.
            `;
            
            // Create a nice welcome card
            const welcomeCard = document.createElement('div');
            welcomeCard.className = 'card';
            welcomeCard.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            welcomeCard.style.color = 'white';
            welcomeCard.style.marginBottom = '20px';
            welcomeCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="font-size: 48px;">🎉</div>
                    <div>
                        <h3 style="color: white; margin-bottom: 10px;">Welcome to Your SCM System!</h3>
                        <p style="opacity: 0.9; margin-bottom: 5px;">Your system is ready for you to add your own data.</p>
                        <p style="opacity: 0.9;">Click the + buttons in each module to start adding your inventory, suppliers, and orders.</p>
                    </div>
                </div>
            `;
            
            // Insert at the top of main content
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.insertBefore(welcomeCard, mainContent.firstChild);
            }
        }
    },
    
    // Add sample template for data entry
    showDataTemplates: function() {
        if (this.isEmpty()) {
            console.log('No data found. Use the templates below to add your data:');
            console.log('');
            console.log('📦 INVENTORY TEMPLATE:');
            console.log('{');
            console.log('  "sku": "PRD-001",');
            console.log('  "name": "Product Name",');
            console.log('  "category": "Category",');
            console.log('  "quantity": 100,');
            console.log('  "price": 99.99,');
            console.log('  "location": "Warehouse A",');
            console.log('  "reorderLevel": 10');
            console.log('}');
            console.log('');
            console.log('🏢 SUPPLIER TEMPLATE:');
            console.log('{');
            console.log('  "name": "Supplier Name",');
            console.log('  "contact": "Contact Person",');
            console.log('  "email": "email@supplier.com",');
            console.log('  "phone": "+1-555-0123"');
            console.log('}');
        }
    },
    
    // Create empty data structures
    initializeEmpty: function() {
        localStorage.setItem('inventory', JSON.stringify([]));
        localStorage.setItem('procurement', JSON.stringify([]));
        localStorage.setItem('costs', JSON.stringify([]));
        localStorage.setItem('orders', JSON.stringify([]));
        localStorage.setItem('suppliers', JSON.stringify([]));
        
        console.log('Empty data structures initialized');
    }
};