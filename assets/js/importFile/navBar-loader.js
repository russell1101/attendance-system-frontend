// navBar-loader.js - 完整修正版

// 確保 SweetAlert2 已載入，未載入則動態插入（已載入則直接執行 callback）
function ensureSwal(callback) {
    if (typeof Swal !== 'undefined') {
        callback();
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
    script.onload = callback;
    document.head.appendChild(script);
}

document.addEventListener("DOMContentLoaded", function() {
    
    const navBarContainer = document.querySelector('#navBar-placeholder');
    
    if (!navBarContainer) {
        console.error("找不到 #navBar-placeholder 容器");
        return;
    }
    
    fetch('rci-navBar-back.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data;
            
            const sidebarToggle = tempDiv.querySelector('.sidebar-toggle');
            const sidebarOverlay = tempDiv.querySelector('.sidebar-overlay');
            const sidebar = tempDiv.querySelector('.sidebar');
            
            navBarContainer.innerHTML = '';
            
            if (sidebarToggle) {
                navBarContainer.appendChild(sidebarToggle.cloneNode(true));
            }
            if (sidebarOverlay) {
                navBarContainer.appendChild(sidebarOverlay.cloneNode(true));
            }
            if (sidebar) {
                navBarContainer.appendChild(sidebar.cloneNode(true));
            }
            
            setTimeout(() => {
                initNavBar();
                initMobileMenu();
                initDesktopToggle();
                highlightCurrentMenuItem();
                initLogout();
            }, 100);
        })
        .catch(error => {
            console.error('載入錯誤:', error);
        });
});

// 初始化 NavBar
function initNavBar() {
    
    
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    document.body.classList.add('has-sidebar');
    
    // 添加 tooltip
    const menuLinks = document.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
        const text = link.querySelector('.menu-text');
        if (text) {
            link.setAttribute('data-tooltip', text.textContent.trim());
        }
    });

    // 登出按鈕 tooltip
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.setAttribute('data-tooltip', '登出');
    }
}

// 初始化桌面版展開/收合（只在桌面版）
function initDesktopToggle() {
    if (window.innerWidth <= 767) return;
    
    const sidebar = document.getElementById('sidebar');
    // 檢查儲存的狀態
    const isExpanded = localStorage.getItem('sidebarExpanded') === 'true';
    
    if (isExpanded) {
        sidebar.classList.add('expanded');
        document.body.classList.add('expanded');
    }
    
    sidebar.addEventListener('click', function(e) {
        if (e.target.closest('.sidebar-header')) {
            this.classList.toggle('expanded');
            document.body.classList.toggle('expanded');
            
            const isNowExpanded = this.classList.contains('expanded');
            localStorage.setItem('sidebarExpanded', isNowExpanded);
            // 這裡不再需要寫 logo.src = ... 
        }
    });
}

// 初始化手機選單
function initMobileMenu() {
    
    
    
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar || !sidebarToggle) {
        console.error("找不到必要元素");
        return;
    }
    
    // 漢堡選單點擊
    sidebarToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        
        sidebar.classList.add('active');
        if (sidebarOverlay) {
            sidebarOverlay.classList.add('active');
        }
        this.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // 關閉按鈕
    if (sidebarClose) {
        sidebarClose.addEventListener('click', function(e) {
            e.preventDefault();
            closeSidebar();
        });
    }
    
    // 遮罩層點擊關閉
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    function closeSidebar() {
        
        sidebar.classList.remove('active');
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
        }
        if (sidebarToggle) {
            sidebarToggle.classList.remove('active');
        }
        document.body.style.overflow = '';
    }
}

// 登出
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', function () {
        ensureSwal(async function () {
            const result = await Swal.fire({
                title: '確定登出？',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: '登出',
                cancelButtonText: '取消',
            });
            if (!result.isConfirmed) return;

            try {
                const res = await fetch(`${APP_CONFIG.API_BASE_URL}/admin/component_logout`, {
                    method: 'POST',
                    credentials: 'include',
                });
                const resp = await res.json();
                if (resp.success === 1) {
                    window.location.href = 'rci-login-backend.html';
                } else {
                    Swal.fire('錯誤', resp.errMsg || '登出失敗，請稍後再試', 'error');
                }
            } catch (e) {
                Swal.fire('錯誤', '網路連線異常，請稍後再試', 'error');
            }
        });
    });
}

// 高亮當前頁面
function highlightCurrentMenuItem() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const link = item.querySelector('.menu-link');
        if (link && !item.classList.contains('has-submenu')) {
            const href = link.getAttribute('href');
            if (currentPage === href) {
                item.classList.add('active');
            }
        }
    });
}