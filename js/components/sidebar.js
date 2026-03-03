// Sidebar functionality
class SidebarManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.loadSidebar();
        this.setupLogout();
    }
    
    loadSidebar() {
        const sidebarContainer = document.getElementById('sidebar-container');
        if (!sidebarContainer) return;
        
        fetch('../components/sidebar.html')
            .then(response => response.text())
            .then(html => {
                sidebarContainer.innerHTML = html;
                this.setActiveLink();
                this.setUsername();
            })
            .catch(error => {
                console.error('Error loading sidebar:', error);
                // Fallback sidebar if fetch fails
                this.createFallbackSidebar();
            });
    }
    
    setActiveLink() {
        // Get current page filename
        const currentPath = window.location.pathname;
        const currentFile = currentPath.split('/').pop() || 'dashboard.html';
        
        // Wait for sidebar to be loaded
        setTimeout(() => {
            const links = document.querySelectorAll('.sidebar-link');
            links.forEach(link => {
                link.classList.remove('active');
                const href = link.getAttribute('href');
                if (href && href.includes(currentFile)) {
                    link.classList.add('active');
                }
            });
        }, 100);
    }
    
    setUsername() {
        const username = localStorage.getItem('username') || 'Admin';
        const displayEl = document.getElementById('username-display');
        if (displayEl) {
            displayEl.textContent = username;
        }
    }
    
    setupLogout() {
        // Use event delegation since logout button is loaded dynamically
        document.addEventListener('click', (e) => {
            if (e.target.id === 'logout-btn' || e.target.closest('button')?.innerText === 'Logout') {
                this.logout();
            }
        });
    }
    
    logout() {
        localStorage.removeItem('isLoggedIn');
        window.location.href = '../index.html';
    }
    
    createFallbackSidebar() {
        const sidebarContainer = document.getElementById('sidebar-container');
        if (!sidebarContainer) return;
        
        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
        
        sidebarContainer.innerHTML = `
            <div class="sidebar">
                <div class="sidebar-header">
                    <h3>SCM System</h3>
                    <p>Supply Chain Manager</p>
                </div>
                
                <ul class="sidebar-menu">
                    <li>
                        <a href="../dashboard.html" class="sidebar-link ${currentPage === 'dashboard.html' ? 'active' : ''}">
                            <i>📊</i> Dashboard
                        </a>
                    </li>
                    <li>
                        <a href="../pages/inventory.html" class="sidebar-link ${currentPage === 'inventory.html' ? 'active' : ''}">
                            <i>📦</i> Inventory
                        </a>
                    </li>
                    <li>
                        <a href="../pages/procurement.html" class="sidebar-link ${currentPage === 'procurement.html' ? 'active' : ''}">
                            <i>🛒</i> Procurement
                        </a>
                    </li>
                    <li>
                        <a href="../pages/cost-management.html" class="sidebar-link ${currentPage === 'cost-management.html' ? 'active' : ''}">
                            <i>💰</i> Cost Management
                        </a>
                    </li>
                    <li>
                        <a href="../pages/order-management.html" class="sidebar-link ${currentPage === 'order-management.html' ? 'active' : ''}">
                            <i>📋</i> Order Management
                        </a>
                    </li>
                </ul>
                
                <div style="position: absolute; bottom: 20px; width: 100%; padding: 0 20px;">
                    <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px;">
                        <p style="font-size: 12px; opacity: 0.8;">Logged in as:</p>
                        <p style="font-weight: bold;" id="username-display">${localStorage.getItem('username') || 'Admin'}</p>
                        <button onclick="logout()" style="width: 100%; margin-top: 10px; padding: 5px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 3px; cursor: pointer;">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SidebarManager();
});