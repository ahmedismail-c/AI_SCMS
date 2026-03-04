class Dashboard {
    constructor() {
        this.inventoryChart = null;
        this.costChart = null;
        this.dataLoaded = false;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    async init() {
        console.log('Initializing Dashboard...');
        
        // Ensure Storage is ready
        if (typeof Storage === 'undefined') {
            console.error('Storage not loaded');
            return;
        }
        
        // Small delay to ensure DOM elements exist
        setTimeout(() => {
            this.loadStats();
            this.loadRecentOrders();
            this.loadLowStockItems();
            this.initCharts();
            this.setupEventListeners();
            this.dataLoaded = true;
        }, 100);
    }
    
    setupEventListeners() {
        // Listen for data updates
        document.removeEventListener('data-updated', this.handleDataUpdate);
        document.addEventListener('data-updated', () => this.handleDataUpdate());
    }
    
    handleDataUpdate() {
        console.log('Data updated, refreshing dashboard...');
        this.loadStats();
        this.loadRecentOrders();
        this.loadLowStockItems();
        this.initCharts();
    }
    
    loadStats() {
        try {
            const summary = Storage.getSummary();
            
            // Update inventory stats
            const invValue = document.getElementById('inventory-value');
            if (invValue) {
                invValue.textContent = '$' + (summary.inventory.totalValue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            }
            
            const invItems = document.getElementById('inventory-items');
            if (invItems) {
                invItems.textContent = (summary.inventory.totalItems || 0) + ' items (' + (summary.inventory.lowStock || 0) + ' low stock)';
            }
            
            // Update procurement stats
            const procValue = document.getElementById('procurement-value');
            if (procValue) {
                procValue.textContent = '$' + (summary.procurement.totalValue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            }
            
            const procPending = document.getElementById('procurement-pending');
            if (procPending) {
                procPending.textContent = (summary.procurement.pending || 0) + ' pending';
            }
            
            // Update costs stats
            const costsValue = document.getElementById('costs-value');
            if (costsValue) {
                costsValue.textContent = '$' + (summary.costs.totalValue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            }
            
            const costsAvg = document.getElementById('costs-average');
            if (costsAvg) {
                costsAvg.textContent = '$' + (summary.costs.averagePerDay || 0) + ' avg/day';
            }
            
            // Update orders stats
            const ordersValue = document.getElementById('orders-value');
            if (ordersValue) {
                ordersValue.textContent = '$' + (summary.orders.totalValue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            }
            
            const ordersPending = document.getElementById('orders-pending');
            if (ordersPending) {
                ordersPending.textContent = (summary.orders.pending || 0) + ' pending';
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    
    loadRecentOrders() {
        try {
            const orders = Storage.getData('orders');
            const tbody = document.getElementById('recent-orders');
            
            if (!tbody) return;
            
            if (!orders || orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">No recent orders</td></tr>';
                return;
            }
            
            const recentOrders = [...orders]
                .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
                .slice(0, 5);
            
            tbody.innerHTML = recentOrders.map(order => {
                let customerName = 'Unknown';
                if (order.customer) {
                    if (typeof order.customer === 'object') {
                        customerName = order.customer.name || order.customer.company || 'Unknown';
                    } else {
                        customerName = order.customer;
                    }
                }
                
                return `
                    <tr>
                        <td>${order.orderNumber || 'N/A'}</td>
                        <td>${customerName}</td>
                        <td>$${(order.totalAmount || 0).toFixed(2)}</td>
                        <td>
                            <span class="badge badge-${this.getStatusBadge(order.status)}">
                                ${order.status || 'pending'}
                            </span>
                        </td>
                        <td>${order.orderDate || 'N/A'}</td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading recent orders:', error);
        }
    }
    
    loadLowStockItems() {
        try {
            const inventory = Storage.getData('inventory');
            const tbody = document.getElementById('low-stock-items');
            
            if (!tbody) return;
            
            if (!inventory || inventory.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">No inventory items</td></tr>';
                return;
            }
            
            const lowStock = inventory.filter(item => item.quantity <= (item.reorderLevel || 10));
            
            if (lowStock.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">✅ All items are well stocked</td></tr>';
            } else {
                tbody.innerHTML = lowStock.slice(0, 5).map(item => `
                    <tr>
                        <td>${item.sku || 'N/A'}</td>
                        <td>${item.name || 'Unknown'}</td>
                        <td class="${item.quantity <= item.reorderLevel ? 'text-danger' : ''}">${item.quantity}</td>
                        <td>${item.reorderLevel || 10}</td>
                        <td><span class="badge badge-danger">Low Stock</span></td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="reorderItem(${item.id})">Reorder</button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading low stock items:', error);
        }
    }
    
    getStatusBadge(status) {
        const badges = {
            'pending': 'warning',
            'processing': 'info',
            'shipped': 'primary',
            'delivered': 'success',
            'cancelled': 'danger'
        };
        return badges[status] || 'secondary';
    }
    
    initCharts() {
        // Wait a bit for charts to be ready
        setTimeout(() => {
            this.initInventoryChart();
            this.initCostChart();
        }, 200);
    }
    
    initInventoryChart() {
        try {
            const canvas = document.getElementById('inventoryChart');
            if (!canvas) {
                console.log('Inventory chart canvas not found');
                return;
            }
            
            const inventory = Storage.getData('inventory');
            const categories = {};
            
            inventory.forEach(item => {
                if (item.category) {
                    categories[item.category] = (categories[item.category] || 0) + (item.quantity || 0);
                }
            });
            
            // Clear any existing chart
            if (this.inventoryChart) {
                this.inventoryChart.destroy();
            }
            
            const ctx = canvas.getContext('2d');
            
            if (Object.keys(categories).length === 0) {
                this.showChartMessage(canvas, 'No inventory data available');
                return;
            }
            
            canvas.style.display = 'block';
            
            this.inventoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(categories),
                    datasets: [{
                        data: Object.values(categories),
                        backgroundColor: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { boxWidth: 12, font: { size: 11 } }
                        }
                    }
                }
            });
            
            console.log('Inventory chart created');
        } catch (error) {
            console.error('Error creating inventory chart:', error);
        }
    }
    
initCostChart() {
    const costs = Storage.getData('costs');
    
    // Group costs by date for last 7 days
    const last7Days = [];
    const costByDay = {};
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(dateStr);
        costByDay[dateStr] = 0;
    }
    
    costs.forEach(cost => {
        if (costByDay.hasOwnProperty(cost.date)) {
            costByDay[cost.date] += cost.amount;
        }
    });
    
    const ctx = document.getElementById('costChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (this.costChart) {
        this.costChart.destroy();
    }
    
    this.costChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days.map(date => {
                const d = new Date(date);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
                label: 'Daily Costs ($)',
                data: last7Days.map(date => costByDay[date]),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.3,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 5
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
                            return '$' + context.raw.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        },
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 10
                        },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            },
            layout: {
                padding: {
                    top: 10,
                    bottom: 10,
                    left: 5,
                    right: 5
                }
            }
        }
    });
}    
initCostChart() {
    const costs = Storage.getData('costs');
    const positiveCosts = costs.filter(c => c.amount > 0);
    
    if (positiveCosts.length === 0) {
        this.showNoDataMessage('costChart', 'No cost data available');
        return;
    }
    
    // Sort by date
    const sortedCosts = [...positiveCosts].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );
    
    // Take last 10 costs for better visibility
    const recentCosts = sortedCosts.slice(-10);
    
    const ctx = document.getElementById('costChart').getContext('2d');
    
    if (this.costChart) this.costChart.destroy();
    
    this.costChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: recentCosts.map(c => {
                const d = new Date(c.date);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
                label: 'Cost Amount ($)',
                data: recentCosts.map(c => c.amount),
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: recentCosts.map(c => 
                    c.amount > 5000 ? '#e74c3c' : '#3498db'
                ),
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const cost = recentCosts[context.dataIndex];
                            return [
                                `Amount: $${context.raw.toFixed(2)}`,
                                `Category: ${cost.category}`,
                                `Description: ${cost.description || ''}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => '$' + value
                    }
                }
            }
        }
    });
}
}

// Global function for reorder action
window.reorderItem = function(itemId) {
    try {
        const item = Storage.getItemById('inventory', itemId);
        if (item) {
            // Store item info for procurement page
            sessionStorage.setItem('reorderItem', JSON.stringify(item));
            window.location.href = 'pages/procurement.html';
        }
    } catch (error) {
        console.error('Error in reorderItem:', error);
        alert('Unable to reorder item. Please try again.');
    }
};

// Initialize dashboard when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new Dashboard();
    });
} else {
    new Dashboard();
}
