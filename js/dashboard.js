// Dashboard JavaScript
class Dashboard {
    constructor() {
        this.init();
    }
    
    init() {
        this.loadStats();
        this.loadRecentOrders();
        this.loadLowStockItems();
        this.initCharts();
        
        // Listen for data updates
        document.addEventListener('data-updated', () => {
            this.loadStats();
            this.loadRecentOrders();
            this.loadLowStockItems();
        });
    }
    
    loadStats() {
        const summary = Storage.getSummary();
        
        // Update inventory stats
        document.getElementById('inventory-value').textContent = 
            '$' + summary.inventory.totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.getElementById('inventory-items').textContent = 
            summary.inventory.totalItems + ' items (' + summary.inventory.lowStock + ' low stock)';
        
        // Update procurement stats
        document.getElementById('procurement-value').textContent = 
            '$' + summary.procurement.totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.getElementById('procurement-pending').textContent = 
            summary.procurement.pending + ' pending';
        
        // Update costs stats
        document.getElementById('costs-value').textContent = 
            '$' + summary.costs.totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.getElementById('costs-average').textContent = 
            '$' + summary.costs.averagePerDay + ' avg/day';
        
        // Update orders stats
        document.getElementById('orders-value').textContent = 
            '$' + summary.orders.totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.getElementById('orders-pending').textContent = 
            summary.orders.pending + ' pending';
    }
    
// Load recent orders
loadRecentOrders() {
    const orders = Storage.getData('orders');
    const recentOrders = orders.slice(-5).reverse(); // Last 5 orders
    
    const tbody = document.getElementById('recent-orders');
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">No recent orders</td></tr>';
        return;
    }
    
    tbody.innerHTML = recentOrders.map(order => {
        // Extract customer name properly (FIX HERE)
        let customerName = 'Unknown';
        
        if (order.customer) {
            if (typeof order.customer === 'object') {
                // If customer is an object, get the name property
                customerName = order.customer.name || 'Unknown';
            } else {
                // If customer is a string, use it directly
                customerName = order.customer;
            }
        }
        
        return `
            <tr>
                <td>${order.orderNumber || 'N/A'}</td>
                <td>${customerName}</td>
                <td>$${(order.totalAmount || 0).toLocaleString()}</td>
                <td>
                    <span class="badge badge-${this.getStatusBadge(order.status)}">
                        ${order.status || 'pending'}
                    </span>
                </td>
                <td>${order.orderDate || 'N/A'}</td>
            </tr>
        `;
    }).join('');
}    
    loadLowStockItems() {
        const inventory = Storage.getData('inventory');
        const lowStock = inventory.filter(item => item.quantity <= item.reorderLevel);
        
        const tbody = document.getElementById('low-stock-items');
        if (lowStock.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No low stock items</td></tr>';
        } else {
            tbody.innerHTML = lowStock.map(item => `
                <tr>
                    <td>${item.sku}</td>
                    <td>${item.name}</td>
                    <td class="${item.quantity <= item.reorderLevel ? 'text-danger' : ''}">${item.quantity}</td>
                    <td>${item.reorderLevel}</td>
                    <td>
                        <span class="badge badge-danger">Low Stock</span>
                    </td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="reorderItem(${item.id})">
                            Reorder
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }
    
// Get status badge class
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
        // Inventory by Category Chart
        this.initInventoryChart();
        
        // Cost Trend Chart
        this.initCostChart();
    }
    
initInventoryChart() {
    const inventory = Storage.getData('inventory');
    const categories = {};
    
    inventory.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + item.quantity;
    });
    
    const ctx = document.getElementById('inventoryChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (this.inventoryChart) {
        this.inventoryChart.destroy();
    }
    
    this.inventoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    '#3498db',
                    '#2ecc71',
                    '#f39c12',
                    '#e74c3c',
                    '#9b59b6'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} units (${percentage}%)`;
                        }
                    }
                }
            },
            layout: {
                padding: {
                    top: 5,
                    bottom: 5
                }
            }
        }
    });
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
    const item = Storage.getItemById('inventory', itemId);
    if (item) {
        // Create procurement request
        const procurement = {
            poNumber: 'PO-' + Date.now(),
            supplier: 'Auto Reorder',
            items: [{
                sku: item.sku,
                name: item.name,
                quantity: item.reorderLevel * 2,
                unitPrice: item.price * 0.9 // Assuming 10% discount for bulk
            }],
            totalAmount: (item.reorderLevel * 2) * (item.price * 0.9),
            status: 'pending',
            orderDate: new Date().toISOString().split('T')[0],
            expectedDelivery: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
            paymentTerms: 'Net 30'
        };
        
        Storage.addItem('procurement', procurement);
        Storage.showNotification('Reorder request created for ' + item.name, 'success');
    }
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});