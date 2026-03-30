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