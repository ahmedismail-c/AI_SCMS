// Sidebar functionality
class SidebarManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.loadSidebar();
        this.setupLogout();
    }
    
    // Get the correct base path for GitHub Pages
    getBasePath() {
        const path = window.location.pathname;
        // Check if we're in a GitHub Pages repo (has repo name in path)
        if (path.includes('/AI_SCMS/')) {
            return '/AI_SCMS';
        }
        return '';
    }
    
    // Get correct path for sidebar.html
    getSidebarPath() {
        const basePath = this.getBasePath();
        const currentPath = window.location.pathname;
        
        // If we're in a pages subfolder
        if (currentPath.includes('/pages/')) {
            return `${basePath}/components/sidebar.html`;
        }
        return `${basePath}/components/sidebar.html`;
    }
    
    loadSidebar() {
        const sidebarContainer = document.getElementById('sidebar-container');
        if (!sidebarContainer) return;
        
        const sidebarPath = this.getSidebarPath();
        console.log('Loading sidebar from:', sidebarPath); // Debug
        
        fetch(sidebarPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
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
        // Wait for sidebar to be loaded
        setTimeout(() => {
            const links = document.querySelectorAll('.sidebar-link');
            if (!links.length) return;
            
            // Get current page info
            const currentPath = window.location.pathname;
            const currentFile = currentPath.split('/').pop() || 'dashboard.html';
            const basePath = this.getBasePath();
            
            console.log('Current file:', currentFile); // Debug
            
            links.forEach(link => {
                link.classList.remove('active');
                
                let href = link.getAttribute('href');
                if (!href) return;
                
                // Remove base path from href for comparison
                if (basePath && href.startsWith(basePath)) {
                    href = href.substring(basePath.length);
                }
                
                // Get filename from href
                const hrefFile = href.split('/').pop();
                
                // Check if this link matches current page
                if (hrefFile === currentFile) {
                    link.classList.add('active');
                    console.log('Active set for:', href);
                }
                
                // Handle root/dashboard case
                if ((currentFile === '' || currentFile === 'dashboard.html') && 
                    (href.includes('dashboard') || href === 'dashboard.html' || href === '/dashboard.html')) {
                    link.classList.add('active');
                }
            });
        }, 200);
    }
    
    setUsername() {
        // Try multiple times since element might not be loaded yet
        const checkInterval = setInterval(() => {
            const displayEl = document.getElementById('username-display');
            if (displayEl) {
                const username = localStorage.getItem('username') || 'Admin';
                displayEl.textContent = username;
                clearInterval(checkInterval);
            }
        }, 100);
        
        // Stop checking after 3 seconds
        setTimeout(() => clearInterval(checkInterval), 3000);
    }
    
    setupLogout() {
        // Use event delegation since logout button is loaded dynamically
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.id === 'logout-btn' || 
                (target.tagName === 'BUTTON' && target.textContent.trim() === 'Logout')) {
                this.logout();
            }
        });
    }
    
    logout() {
        localStorage.removeItem('isLoggedIn');
        const basePath = this.getBasePath();
        window.location.href = basePath ? `${basePath}/index.html` : 'index.html';
    }
    
    createFallbackSidebar() {
        const sidebarContainer = document.getElementById('sidebar-container');
        if (!sidebarContainer) return;
        
        const currentPath = window.location.pathname;
        const currentFile = currentPath.split('/').pop() || 'dashboard.html';
        const basePath = this.getBasePath();
        
        // Create hrefs with correct base path
        const dashboardHref = basePath ? `${basePath}/dashboard.html` : 'dashboard.html';
        const inventoryHref = basePath ? `${basePath}/pages/inventory.html` : 'pages/inventory.html';
        const procurementHref = basePath ? `${basePath}/pages/procurement.html` : 'pages/procurement.html';
        const costHref = basePath ? `${basePath}/pages/cost-management.html` : 'pages/cost-management.html';
        const orderHref = basePath ? `${basePath}/pages/order-management.html` : 'pages/order-management.html';
        
        sidebarContainer.innerHTML = `
            <div class="sidebar">
                <div class="sidebar-header">
                    <h3>SCM System</h3>
                    <p>Supply Chain Manager</p>
                </div>
                
                <ul class="sidebar-menu">
                    <li>
                        <a href="${dashboardHref}" class="sidebar-link ${currentFile === 'dashboard.html' ? 'active' : ''}">
                            <i>📊</i> Dashboard
                        </a>
                    </li>
                    <li>
                        <a href="${inventoryHref}" class="sidebar-link ${currentFile === 'inventory.html' ? 'active' : ''}">
                            <i>📦</i> Inventory
                        </a>
                    </li>
                    <li>
                        <a href="${procurementHref}" class="sidebar-link ${currentFile === 'procurement.html' ? 'active' : ''}">
                            <i>🛒</i> Procurement
                        </a>
                    </li>
                    <li>
                        <a href="${costHref}" class="sidebar-link ${currentFile === 'cost-management.html' ? 'active' : ''}">
                            <i>💰</i> Cost Management
                        </a>
                    </li>
                    <li>
                        <a href="${orderHref}" class="sidebar-link ${currentFile === 'order-management.html' ? 'active' : ''}">
                            <i>📋</i> Order Management
                        </a>
                    </li>
                </ul>
                
                <div style="position: absolute; bottom: 20px; width: 100%; padding: 0 20px;">
                    <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px;">
                        <p style="font-size: 12px; opacity: 0.8;">Logged in as:</p>
                        <p style="font-weight: bold;" id="username-display">${localStorage.getItem('username') || 'Admin'}</p>
                        <button onclick="window.logout()" style="width: 100%; margin-top: 10px; padding: 5px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 3px; cursor: pointer;">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Global logout function for fallback sidebar
window.logout = function() {
    localStorage.removeItem('isLoggedIn');
    const path = window.location.pathname;
    const basePath = path.includes('/AI_SCMS/') ? '/AI_SCMS' : '';
    window.location.href = basePath ? `${basePath}/index.html` : 'index.html';
};

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SidebarManager();
});
