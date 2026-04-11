// header-loader.js

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

document.addEventListener("DOMContentLoaded", function () {
    const headerContainer = document.querySelector("#header-placeholder");

    if (headerContainer) {
        fetch("rci-header-front.html")
            .then((response) => response.text())
            .then((data) => {
                headerContainer.innerHTML = data;
                highlightCurrentPage();
                initLogout();
            });
    }
});

function highlightCurrentPage() {
    const path = window.location.pathname;
    const page = path.split("/").pop();

    const headerContainer = document.querySelector("#header-placeholder");
    if (!headerContainer) return;

    const navItems = headerContainer.querySelectorAll(".nav-item");

    navItems.forEach((item) => {
        const aTag = item.querySelector("a");
        if (aTag) {
            const link = aTag.getAttribute("href");
            if (link && (page === link || (page === "" && link === "rci-front-clockin.html"))) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        }
    });
}

function initLogout() {
    const logoutBtn = document.getElementById('headerLogoutBtn');
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
                const res = await fetch(`${APP_CONFIG.API_BASE_URL}/frontUser/employee/component_logout`, {
                    method: 'POST',
                    credentials: 'include',
                });
                const resp = await res.json();
                if (resp.success === 1) {
                    window.location.href = 'rci-login-front.html';
                } else {
                    Swal.fire('錯誤', resp.errMsg || '登出失敗，請稍後再試', 'error');
                }
            } catch (e) {
                Swal.fire('錯誤', '網路連線異常，請稍後再試', 'error');
            }
        });
    });
}