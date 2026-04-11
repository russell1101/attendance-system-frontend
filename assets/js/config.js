const APP_CONFIG = {
    API_BASE_URL: "http://127.0.0.1:8080/attendances-project",

    // 分頁預設筆數
    PAGE_SIZE: 10,
};

// 全域 SweetAlert2 樣式統一設定
if (typeof Swal !== 'undefined') {
    window.Swal = Swal.mixin({
        buttonsStyling: false,
        reverseButtons: true,
        customClass: {
            confirmButton: 'btn btn-primary w-xs ms-2',
            cancelButton: 'btn btn-light w-xs',
            popup: 'rounded-4 shadow-lg'
        }
    });
}

const targetPath = window.location.href;  // 傳給後端變數
const currentPath = window.location.pathname;  // 前端判斷變數
function checkLogin() {
    if (currentPath.endsWith('rci-login-backend.html') || currentPath.endsWith('rci-login-front.html')) return;
    if (currentPath.includes('back')) {
        admin();
    } else if (currentPath.includes('front')) {
        frontUser();
    }
}

checkLogin();


function admin() {
    fetch(APP_CONFIG.API_BASE_URL + "/admin/checkLogin", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: "include", // set cookie進瀏覽器
        body: JSON.stringify({ targetPath: targetPath })  // 當前網址傳入後端
    })
        .then(resp => resp.json())
        .then(result => {
            if (result.success == -999) {
                alert("請重新登入");
                location.href = "./rci-login-backend.html";
            }
        });
}

function frontUser() {
    fetch(APP_CONFIG.API_BASE_URL + "/frontUser/employee/checkLogin", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: "include", // set cookie進瀏覽器
        body: JSON.stringify({ targetPath: targetPath })  // 當前網址傳入後端
    })
        .then(resp => resp.json())
        .then(result => {
            if (result.success == -999) {
                alert("請重新登入");
                location.href = "./rci-login-front.html";
            }
        });
}