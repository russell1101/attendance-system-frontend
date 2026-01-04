// header-loader.js
document.addEventListener("DOMContentLoaded", function() {
    // 1. 取得頁面中準備放置 header 的容器
    const headerContainer = document.querySelector('#header-placeholder');
    
    if (headerContainer) {
        // 2. 使用 fetch 讀取 header.html
        fetch('header.html')
            .then(response => response.text())
            .then(data => {
                headerContainer.innerHTML = data;
                highlightCurrentPage();
            });
    }
});

function highlightCurrentPage() {
    // 3. 自動判斷當前頁面並加上 active class
    const path = window.location.pathname;
    const page = path.split("/").pop();
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const link = item.querySelector('a').getAttribute('href');
        if (page === link || (page === '' && link === 'index.html')) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}