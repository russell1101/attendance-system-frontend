document.addEventListener('DOMContentLoaded', function () {
    const productList = document.getElementById('productList');
    const productEdit = document.getElementById('productEdit');
    const btnBack = document.getElementById('btn-back');
    const btnAdd = document.getElementById('btn-add-product');
    const editForm = document.getElementById('editProductForm');
    
    // 模擬資料庫資料
    let productsData = [
        { id: '#001', name: '超商禮券 100元', points: 500, stock: 120, status: '上架中' },
        { id: '#002', name: '保溫杯', points: 1200, stock: 45, status: '缺貨' }
    ];

    let currentEditId = null; // 用來記錄當前正在編輯的 ID (null 代表新增)
    let originalData = {}; // 用來儲存編輯前的原始資料

    // --- 元件定義 (Components) ---
    const Components = {
        // 狀態標籤元件
        statusBadge: function(status) {
            let badgeClass = 'badge bg-warning-subtle text-warning text-uppercase';
            if (status === '上架中') badgeClass = 'badge bg-success-subtle text-success text-uppercase';
            else if (status === '缺貨') badgeClass = 'badge bg-danger-subtle text-danger text-uppercase';
            else if (status === '下架') badgeClass = 'badge bg-secondary-subtle text-secondary text-uppercase';
            
            return `<span class="${badgeClass}">${status}</span>`;
        },
        // 列表項目元件
        productRow: function(product) {
            return `
                <tr data-id="${product.id}">
                    <td class="id"><a href="#" class="fw-medium link-primary">${product.id}</a></td>
                    <td class="product_name">
                        <div class="d-flex align-items-center justify-content-center">
                            <div class="flex-grow-1">
                                <h5 class="fs-14 mb-1"><a href="#" class="text-dark">${product.name}</a></h5>
                            </div>
                        </div>
                    </td>
                    <td class="points">${product.points}</td>
                    <td class="stock">${product.stock}</td>
                    <td class="status">
                        ${this.statusBadge(product.status)}
                    </td>
                    <td>
                        <div class="d-flex justify-content-center">
                            <a href="#" class="btn btn-sm btn-soft-primary edit-item-btn">
                                <i class="ri-pencil-fill align-bottom"></i>
                            </a>
                        </div>
                    </td>
                </tr>
            `;
        }
    };

    // --- 渲染函式 ---
    function renderTable() {
        const tbody = document.querySelector('#productTable tbody');
        if (tbody) {
            tbody.innerHTML = productsData.map(product => Components.productRow(product)).join('');
        }
    }

    // 初始化渲染
    renderTable();

    // 監聽列表中的編輯按鈕點擊事件
    if (productList) {
        productList.addEventListener('click', function (e) {
            // 檢查是否點擊了編輯按鈕 (或是按鈕內的圖示)
            const btn = e.target.closest('.edit-item-btn');
            if (btn) {
                e.preventDefault();
                const row = btn.closest('tr');
                const id = row.getAttribute('data-id');
                currentEditId = id;

                // 從資料陣列中尋找該筆資料
                const product = productsData.find(p => p.id === id);
                if (!product) return;

                // 編輯模式：編號欄位不可修改
                document.getElementById('edit-id').disabled = true;

                // 填充編輯表單
                document.getElementById('edit-id').value = product.id;
                document.getElementById('edit-name').value = product.name;
                document.getElementById('edit-points').value = product.points;
                document.getElementById('edit-stock').value = product.stock;
                document.getElementById('edit-status').value = product.status;

                // 儲存原始資料以供比對
                originalData = { ...product };

                // 重置圖片預覽
                document.getElementById('edit-image').value = '';
                const imgPreview = document.getElementById('edit-image-preview');
                imgPreview.src = '';
                imgPreview.classList.add('d-none');

                // 切換顯示：隱藏列表，顯示編輯頁
                productList.classList.add('d-none');
                productEdit.classList.remove('d-none');
            }
        });
    }

    // 監聽「新增商品」按鈕
    if (btnAdd) {
        btnAdd.addEventListener('click', function () {
            currentEditId = null; // 設為 null 代表是新增模式

            // 填充表單預設值
            document.getElementById('edit-id').value = '系統自動產生';
            document.getElementById('edit-id').disabled = true; // 鎖定編號欄位
            document.getElementById('edit-name').value = '';
            document.getElementById('edit-points').value = '';
            document.getElementById('edit-stock').value = '';
            document.getElementById('edit-status').value = '上架中';
            document.getElementById('edit-image').value = '';
            
            const imgPreview = document.getElementById('edit-image-preview');
            imgPreview.src = '';
            imgPreview.classList.add('d-none');

            // 設定原始資料 (用於比對是否有異動)
            originalData = {
                id: '系統自動產生',
                name: '',
                points: '',
                stock: '',
                status: '上架中'
            };

            // 切換顯示
            productList.classList.add('d-none');
            productEdit.classList.remove('d-none');
        });
    }

    // 檢查資料是否有異動
    function hasChanges() {
        const currentId = document.getElementById('edit-id').value;
        const currentName = document.getElementById('edit-name').value;
        const currentPoints = document.getElementById('edit-points').value;
        const currentStock = document.getElementById('edit-stock').value;
        const currentStatus = document.getElementById('edit-status').value;
        const imageInput = document.getElementById('edit-image');

        // 如果有選擇新圖片，視為有異動
        if (imageInput.files.length > 0) return true;

        // 比對文字欄位
        if (currentId !== originalData.id) return true;
        if (currentName !== originalData.name) return true;
        if (currentPoints !== originalData.points) return true;
        if (currentStock !== originalData.stock) return true;
        if (currentStatus !== originalData.status) return true;

        return false;
    }

    // 監聽返回按鈕
    if (btnBack) {
        btnBack.addEventListener('click', function () {
            if (hasChanges()) {
                Swal.fire({
                    title: '確定離開？',
                    text: "您有未儲存的變更，確定要離開嗎？",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: '是的，離開',
                    cancelButtonText: '取消',
                    confirmButtonClass: 'btn btn-primary w-xs mt-2',
                    cancelButtonClass: 'btn btn-danger w-xs me-2 mt-2',
                    buttonsStyling: false,
                    showCloseButton: true,
                    reverseButtons: true
                }).then(function (result) {
                    if (result.value) {
                        closeEditMode();
                    }
                });
            } else {
                closeEditMode();
            }
        });
    }

    // 圖片預覽功能
    const editImageInput = document.getElementById('edit-image');
    if (editImageInput) {
        editImageInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = document.getElementById('edit-image-preview');
                    img.src = e.target.result;
                    img.classList.remove('d-none');
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // 監聽表單提交 (儲存編輯)
    if (editForm) {
        editForm.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!hasChanges()) {
                Swal.fire({
                    title: '無異動',
                    text: '您沒有修改任何資料',
                    icon: 'info',
                    confirmButtonClass: 'btn btn-primary w-xs mt-2',
                    buttonsStyling: false
                });
                return;
            }

            Swal.fire({
                title: '確定儲存？',
                text: "即將更新商品資料",
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: '儲存',
                cancelButtonText: '取消',
                confirmButtonClass: 'btn btn-success w-xs mt-2',
                cancelButtonClass: 'btn btn-danger w-xs me-2 mt-2',
                buttonsStyling: false,
                showCloseButton: true,
                reverseButtons: true
            }).then(function (result) {
                if (result.value) {
                    // 執行儲存邏輯
                    let editId = document.getElementById('edit-id').value;
                    const editName = document.getElementById('edit-name').value;
                    const editPoints = document.getElementById('edit-points').value;
                    const editStock = document.getElementById('edit-stock').value;
                    const editStatus = document.getElementById('edit-status').value;

                    if (currentEditId) {
                        // --- 編輯模式：更新資料陣列 ---
                        const index = productsData.findIndex(p => p.id === currentEditId);
                        if (index !== -1) {
                            productsData[index] = {
                                id: currentEditId,
                                name: editName,
                                points: editPoints,
                                stock: editStock,
                                status: editStatus
                            };
                        }
                    } else {
                        // --- 新增模式：加入新資料 ---
                        
                        // 在儲存當下才生成編號 (模擬後端行為)
                        // 找出目前最大的 ID 數字
                        const maxId = productsData.reduce((max, p) => {
                            const num = parseInt(p.id.replace('#', '')) || 0;
                            return num > max ? num : max;
                        }, 0);
                        editId = '#' + String(maxId + 1).padStart(3, '0');

                        productsData.unshift({
                            id: editId,
                            name: editName,
                            points: editPoints,
                            stock: editStock,
                            status: editStatus
                        });
                    }

                    // 重新渲染表格
                    renderTable();

                    Swal.fire({
                        title: '已儲存!',
                        text: currentEditId ? '商品資料已更新' : '新商品已建立',
                        icon: 'success',
                        confirmButtonClass: 'btn btn-primary w-xs mt-2',
                        buttonsStyling: false
                    }).then(() => {
                        closeEditMode();
                    });
                }
            });
        });
    }

    // 封裝關閉編輯模式的函式
    function closeEditMode() {
        productEdit.classList.add('d-none');
        productList.classList.remove('d-none');
    }
});