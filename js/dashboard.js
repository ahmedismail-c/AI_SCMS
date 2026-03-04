class Dashboard {
    constructor() {
        this.inventoryChart = null;
        this.costChart = null;
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
        
        document.getElementById('inventory-value').textContent = 
            '$' + (summary.inventory.totalValue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.getElementById('inventory-items').textContent = 
            (summary.inventory.totalItems || 0) + ' items (' + (summary.inventory.lowStock || 0) + ' low stock)';
        
        document.getElementById('procurement-value').textContent = 
            '$' + (summary.procurement.totalValue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.getElementById('procurement-pending').textContent = 
            (summary.procurement.pending || 0) + ' pending';
        
        document.getElementById('costs-value').textContent = 
            '$' + (summary.costs.totalValue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.getElementById('costs-average').textContent = 
            '$' + (summary.costs.averagePerDay || 0) + ' avg/day';
        
        document.getElementById('orders-value').textContent = 
            '$' + (summary.orders.totalValue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.getElementById('orders-pending').textContent = 
            (summary.orders.pending || 0) + ' pending';
    }
    
    loadRecentOrders() {
        const orders = Storage.getData('orders');
        const tbody = document.getElementById('recent-orders');
        
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
    }
    
    loadLowStockItems() {
        const inventory = Storage.getData('inventory');
        const lowStock = inventory.filter(item => item.quantity <= (item.reorderLevel || 10));
        const tbody = document.getElementById('low-stock-items');
        
        if (lowStock.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px;">No low stock items</td></tr>';
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
        this.initInventoryChart();
        this.initCostChart();
    }
    
    initInventoryChart() {
        const inventory = Storage.getData('inventory');
        const categories = {};
        
        inventory.forEach(item => {
            categories[item.category] = (categories[item.category] || 0) + item.quantity;
        });
        
        const ctx = document.getElementById('inventoryChart');
        if (!ctx) return;
        
        if (this.inventoryChart) this.inventoryChart.destroy();
        
        if (Object.keys(categories).length === 0) {
            ctx.style.display = 'none';
            const parent = ctx.parentNode;
            parent.innerHTML += '<div style="text-align: center; padding: 50px; color: #666;">No inventory data</div>';
            return;
        }
        
        ctx.style.display = 'block';
        
        this.inventoryChart = new Chart(ctx.getContext('2d'), {
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
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
                }
            }
        });
    }
    
    initCostChart() {
        const costs = Storage.getData('costs');
        
        const last7Days = [];
        const costByDay = {};
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            last7Days.push(dateStr);
            costByDay[dateStr] = 0;
        }
        
        let hasData = false;
        costs.forEach(cost => {
            if (cost.date && cost.amount > 0 && last7Days.includes(cost.date)) {
                costByDay[cost.date] += cost.amount;
                hasData = true;
            }
        });
        
        const labels = last7Days.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        const values = last7Days.map(date => costByDay[date] || 0);
        
        const ctx = document.getElementById('costChart');
        if (!ctx) return;
        
        if (this.costChart) this.costChart.destroy();
        
        // Show message if no data
        const parent = ctx.parentNode;
        const existingMsg = parent.querySelector('.no-cost-data');
        if (existingMsg) existingMsg.remove();
        
        if (!hasData) {
            ctx.style.display = 'none';
            const msgDiv = document.createElement('div');
            msgDiv.className = 'no-cost-data';
            msgDiv.style.textAlign = 'center';
            msgDiv.style.padding = '40px';
            msgDiv.style.backgroundColor = '#f8f9fa';
            msgDiv.style.borderRadius = '5px';
            msgDiv.style.color = '#666';
            msgDiv.innerHTML = '📊 No cost data available for the last 7 days';
            parent.appendChild(msgDiv);
            return;
        }
        
        ctx.style.display = 'block';
        
        this.costChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Daily Costs ($)',
                    data: values,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: value => '$' + value }
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
        window.location.href = 'pages/procurement.html';
    }
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});
