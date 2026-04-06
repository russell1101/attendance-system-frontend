document.addEventListener("DOMContentLoaded", function () {
  const productList = document.getElementById("productList");
  const productEdit = document.getElementById("productEdit");
  const btnBack = document.getElementById("btn-back");
  const btnAdd = document.getElementById("btn-add-product");
  const editForm = document.getElementById("editProductForm");

  const API_BASE = APP_CONFIG.API_BASE_URL;
  const PAGE_SIZE = APP_CONFIG.PAGE_SIZE;

  // 全域未登入攔截：resp.success === -999 時彈窗並跳轉登入頁
  function checkAuth(resp) {
    if (resp.success === -999) {
      Swal.fire({
        title: "尚未登入",
        text: "請先登入後台，即將跳轉至登入頁面",
        icon: "warning",
        confirmButtonText: "確定",
        allowOutsideClick: false,
      }).then(() => {
        window.location.href = "rci-login-backend.html";
      });
      return false;
    }
    return true;
  }

  let allProducts = [];       // 從 API 取回的完整資料
  let filteredProducts = [];  // 搜尋過濾後
  let currentPage = 1;
  let currentEditProduct = null; // 正在編輯的原始物件（null = 新增模式）
  let editImageBase64 = null;    // 使用者新選取的圖片 Base64

  // ===================== 工具函式 =====================

  function getProductStatus(product) {
    if (product.removedAt != null) return "下架";
    if (product.stock <= 0) return "缺貨";
    return "上架中";
  }

  function getCurrentTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  // ===================== 元件 =====================

  const Components = {
    statusBadge: function (status) {
      const map = {
        上架中: "badge bg-success-subtle text-success text-uppercase",
        缺貨: "badge bg-danger-subtle text-danger text-uppercase",
        下架: "badge bg-secondary-subtle text-secondary text-uppercase",
      };
      const cls = map[status] || "badge bg-warning-subtle text-warning text-uppercase";
      return `<span class="${cls}">${status}</span>`;
    },

    productRow: function (product) {
      const status = getProductStatus(product);
      const idStr = "#" + String(product.productId).padStart(3, "0");
      return `
        <tr data-id="${product.productId}">
          <td><span class="fw-medium text-primary">${idStr}</span></td>
          <td>
            <div class="d-flex align-items-center gap-2">
              ${
                product.imageData
                  ? `<img src="data:image/jpeg;base64,${product.imageData}" class="product-thumb" alt="${product.productName}">`
                  : `<div class="product-thumb-placeholder"><i class="ri-image-line"></i></div>`
              }
              <span class="fs-14 fw-medium">${product.productName}</span>
            </div>
          </td>
          <td>${product.requiredPoints}</td>
          <td>${product.stock}</td>
          <td>${this.statusBadge(status)}</td>
          <td>
            <div class="d-flex justify-content-center">
              <a href="#" class="btn btn-sm btn-soft-primary edit-item-btn">
                <i class="ri-pencil-fill align-bottom"></i>
              </a>
            </div>
          </td>
        </tr>
      `;
    },
  };

  // ===================== API =====================

  function fetchProducts() {
    fetch(`${API_BASE}/admin/product/list`, { credentials: "include" })
      .then((res) => res.json())
      .then((resp) => {
        if (!checkAuth(resp)) return;
        if (resp.success === 1) {
          allProducts = resp.data || [];
          applyFilter();
        } else {
          Swal.fire("錯誤", resp.errMsg || "無法取得商品資料", "error");
        }
      })
      .catch(() => Swal.fire("錯誤", "網路連線異常，請稍後再試", "error"));
  }

  function saveProduct(payload) {
    return fetch(`${API_BASE}/admin/product/save`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((res) => res.json());
  }

  // ===================== 搜尋 & 分頁 =====================

  function applyFilter() {
    const keyword = (document.querySelector("#productList .search") || {}).value || "";
    const kw = keyword.trim().toLowerCase();
    filteredProducts = allProducts.filter((p) => {
      return (
        p.productName.toLowerCase().includes(kw) ||
        String(p.productId).includes(kw)
      );
    });
    currentPage = 1;
    renderTable();
    renderPagination();
  }

  function renderTable() {
    const tbody = document.querySelector("#productTable tbody");
    if (!tbody) return;
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageData = filteredProducts.slice(start, start + PAGE_SIZE);

    if (filteredProducts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">查無商品資料</td></tr>`;
      return;
    }
    tbody.innerHTML = pageData.map((p) => Components.productRow(p)).join("");
  }

  function renderPagination() {
    const container = document.getElementById("productPagination");
    const info = document.getElementById("productPaginationInfo");
    if (!container) return;

    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, total);

    if (info) {
      info.textContent = total > 0 ? `顯示 ${start}–${end} / 共 ${total} 筆` : "";
    }

    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    let html = `<ul class="pagination pagination-sm mb-0">`;
    html += `<li class="page-item ${currentPage === 1 ? "disabled" : ""}">
               <a class="page-link" href="#" data-page="${currentPage - 1}">«</a></li>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<li class="page-item ${i === currentPage ? "active" : ""}">
                 <a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    html += `<li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
               <a class="page-link" href="#" data-page="${currentPage + 1}">»</a></li>`;
    html += `</ul>`;
    container.innerHTML = html;

    container.querySelectorAll(".page-link").forEach((a) => {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        const page = parseInt(this.dataset.page);
        if (page >= 1 && page <= totalPages && page !== currentPage) {
          currentPage = page;
          renderTable();
          renderPagination();
        }
      });
    });
  }

  // ===================== 初始化 =====================

  // TODO: [MOCK] 正式上線前移除以下 mock 登入呼叫，改由正式登入頁跳轉後攜帶 session 進入
  fetch(`${API_BASE}/admin/mock-login`, { credentials: "include" })
    .then((res) => res.json())
    .then(() => fetchProducts())
    .catch(() => Swal.fire("錯誤", "mock 登入失敗，請確認後端服務是否啟動", "error"));

  const searchInput = document.querySelector("#productList .search");
  if (searchInput) {
    searchInput.addEventListener("input", applyFilter);
  }

  // ===================== 編輯 / 新增 =====================

  if (productList) {
    productList.addEventListener("click", function (e) {
      const btn = e.target.closest(".edit-item-btn");
      if (!btn) return;
      e.preventDefault();
      const row = btn.closest("tr");
      const id = parseInt(row.getAttribute("data-id"));
      const product = allProducts.find((p) => p.productId === id);
      if (!product) return;
      openEditMode(product);
    });
  }

  function openEditMode(product) {
    currentEditProduct = product; // null = 新增
    editImageBase64 = null;

    const isAdd = !product;
    document.getElementById("editFormTitle").textContent = isAdd ? "新增商品" : "編輯商品";

    document.getElementById("edit-product-id").value = product ? product.productId : "";
    document.getElementById("edit-version").value = product ? product.version : "";
    document.getElementById("edit-name").value = product ? product.productName : "";
    document.getElementById("edit-description").value = product ? product.description || "" : "";
    document.getElementById("edit-points").value = product ? product.requiredPoints : "";
    document.getElementById("edit-stock").value = product ? product.stock : "";
    document.getElementById("edit-valid-days").value = product ? product.validDays || "" : "";
    document.getElementById("edit-status").value = product && product.removedAt ? "下架" : "上架中";

    // 重置圖片欄位
    document.getElementById("edit-image").value = "";
    const imgPreview = document.getElementById("edit-image-preview");
    if (product && product.imageData) {
      imgPreview.src = "data:image/jpeg;base64," + product.imageData;
      imgPreview.classList.remove("d-none");
    } else {
      imgPreview.src = "";
      imgPreview.classList.add("d-none");
    }

    productList.classList.add("d-none");
    productEdit.classList.remove("d-none");
  }

  if (btnAdd) {
    btnAdd.addEventListener("click", function () {
      openEditMode(null);
    });
  }

  // 圖片選取 → Base64 預覽
  const editImageInput = document.getElementById("edit-image");
  if (editImageInput) {
    editImageInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        const dataUrl = ev.target.result; // data:image/jpeg;base64,XXX
        editImageBase64 = dataUrl.split(",")[1]; // 只取純 Base64
        const img = document.getElementById("edit-image-preview");
        img.src = dataUrl;
        img.classList.remove("d-none");
      };
      reader.readAsDataURL(file);
    });
  }

  // 判斷是否有異動
  function hasChanges() {
    if (editImageBase64) return true;

    // 新增模式：有填名稱就算有異動
    if (!currentEditProduct) {
      return document.getElementById("edit-name").value.trim() !== "";
    }

    const p = currentEditProduct;
    if (document.getElementById("edit-name").value !== p.productName) return true;
    if (document.getElementById("edit-description").value !== (p.description || "")) return true;
    if (String(document.getElementById("edit-points").value) !== String(p.requiredPoints)) return true;
    if (String(document.getElementById("edit-stock").value) !== String(p.stock)) return true;
    if (String(document.getElementById("edit-valid-days").value) !== String(p.validDays || "")) return true;
    const currentStatus = document.getElementById("edit-status").value;
    const originalStatus = p.removedAt ? "下架" : "上架中";
    if (currentStatus !== originalStatus) return true;
    return false;
  }

  // 返回按鈕
  if (btnBack) {
    btnBack.addEventListener("click", function () {
      if (hasChanges()) {
        Swal.fire({
          title: "確定離開？",
          text: "您有未儲存的變更，確定要離開嗎？",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "是的，離開",
          cancelButtonText: "取消",
        }).then(function (result) {
          if (result.isConfirmed) closeEditMode();
        });
      } else {
        closeEditMode();
      }
    });
  }

  function closeEditMode() {
    productEdit.classList.add("d-none");
    productList.classList.remove("d-none");
  }

  // 表單提交（新增 / 修改）
  if (editForm) {
    editForm.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!hasChanges()) {
        Swal.fire({ title: "無異動", text: "您沒有修改任何資料", icon: "info" });
        return;
      }

      const isAdd = !currentEditProduct;
      Swal.fire({
        title: isAdd ? "確定新增？" : "確定儲存？",
        text: isAdd ? "即將新增商品至系統" : "即將更新商品資料",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: isAdd ? "新增" : "儲存",
        cancelButtonText: "取消",
      }).then(function (result) {
        if (!result.isConfirmed) return;

        // 組裝 removedAt
        const statusVal = document.getElementById("edit-status").value;
        let removedAt = null;
        if (statusVal === "下架") {
          // 若原本就已下架，保留原始時間；否則記錄此刻為下架時間
          removedAt =
            currentEditProduct && currentEditProduct.removedAt
              ? currentEditProduct.removedAt
              : getCurrentTimestamp();
        }

        const validDaysVal = document.getElementById("edit-valid-days").value;
        const payload = {
          productId: currentEditProduct ? currentEditProduct.productId : null,
          version: currentEditProduct ? currentEditProduct.version : null,
          productName: document.getElementById("edit-name").value.trim(),
          description: document.getElementById("edit-description").value.trim() || null,
          requiredPoints: parseFloat(document.getElementById("edit-points").value),
          stock: parseInt(document.getElementById("edit-stock").value),
          validDays: validDaysVal ? parseInt(validDaysVal) : null,
          removedAt: removedAt,
          // 若使用者有選新圖片則送新圖；否則送 null（後端不異動圖片欄位）
          imageData: editImageBase64 || null,
        };

        saveProduct(payload)
          .then((resp) => {
            if (!checkAuth(resp)) return;
            if (resp.success === 1) {
              Swal.fire({
                title: "成功！",
                text: isAdd ? "新商品已建立" : "商品資料已更新",
                icon: "success",
              }).then(() => {
                closeEditMode();
                fetchProducts(); // 重新載入最新資料
              });
            } else {
              Swal.fire("錯誤", resp.errMsg || "儲存失敗，請稍後再試", "error");
            }
          })
          .catch(() => Swal.fire("錯誤", "網路連線異常", "error"));
      });
    });
  }

  // ===================================================================
  // 兌換紀錄 (History) 模組
  // ===================================================================

  const History = {
    summaryData: [],       // 全部商品彙總資料
    expandedProductId: null, // 目前展開的商品 ID

    init() {
      const filterInput = document.getElementById("filterHistoryProduct");
      if (filterInput) filterInput.addEventListener("input", () => this.renderSummary());

      // 切換到 tab 時才載入（避免不必要的請求）
      const historyTab = document.querySelector('[href="#tab-history"]');
      if (historyTab) {
        historyTab.addEventListener("shown.bs.tab", () => {
          if (this.summaryData.length === 0) this.loadSummary();
        });
      }

      // 事件委派：展開按鈕
      const tbody = document.getElementById("historyTableBody");
      if (tbody) {
        tbody.addEventListener("click", (e) => {
          const expandBtn = e.target.closest(".history-expand-btn");
          if (expandBtn) {
            const pid = parseInt(expandBtn.dataset.productId);
            this.toggleDetail(pid);
          }
        });
      }
    },

    // ── 彙總 ──
    loadSummary() {
      fetch(`${API_BASE}/admin/redemption/summary`, { credentials: "include" })
        .then((res) => res.json())
        .then((resp) => {
          if (!checkAuth(resp)) return;
          if (resp.success === 1) {
            this.summaryData = resp.data || [];
            this.renderSummary();
          } else {
            Swal.fire("錯誤", resp.errMsg || "無法取得兌換彙總", "error");
          }
        })
        .catch(() => Swal.fire("錯誤", "網路連線異常", "error"));
    },

    renderSummary() {
      const tbody = document.getElementById("historyTableBody");
      if (!tbody) return;

      const kw = (document.getElementById("filterHistoryProduct")?.value || "").toLowerCase().trim();
      const filtered = this.summaryData.filter((s) =>
        !kw || s.productName.toLowerCase().includes(kw)
      );

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">查無商品資料</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map((s) => this._summaryRow(s)).join("");
    },

    _summaryRow(s) {
      const isExpanded = this.expandedProductId === s.productId;
      const statusBadge = s.removedAt
        ? '<span class="badge bg-secondary-subtle text-secondary">已下架</span>'
        : '<span class="badge bg-success-subtle text-success">上架中</span>';

      const summaryTr = `
        <tr class="history-summary-row">
          <td class="text-center">
            <button class="btn btn-sm history-expand-btn ${isExpanded ? "is-expanded" : ""}"
                    data-product-id="${s.productId}" title="${isExpanded ? "收合" : "展開明細"}">
              <i class="ri-arrow-right-s-line"></i>
            </button>
          </td>
          <td class="fw-medium">${s.productName}</td>
          <td>${statusBadge}</td>
          <td>${s.stock}</td>
          <td><span class="stat-badge stat-total">${s.totalIssued}</span></td>
          <td><span class="stat-badge stat-available">${s.availableCount}</span></td>
          <td><span class="stat-badge stat-used">${s.usedCount}</span></td>
          <td><span class="stat-badge stat-expired">${s.expiredCount}</span></td>
        </tr>`;

      const detailTr = isExpanded
        ? `<tr class="detail-expand-row"><td colspan="8" class="p-0">${this._detailPanel(s.productId)}</td></tr>`
        : `<tr class="detail-expand-row d-none" data-detail-for="${s.productId}"><td colspan="8"></td></tr>`;

      return summaryTr + detailTr;
    },

    _detailPanel(productId) {
      return `
        <div class="detail-panel">
          <div class="table-responsive">
            <table class="table table-sm align-middle mb-0">
              <thead class="table-light text-center">
                <tr>
                  <th>兌換時間</th>
                  <th>兌換碼</th>
                  <th>員工姓名</th>
                  <th>扣除點數</th>
                  <th>狀態</th>
                  <th>使用時間</th>
                  <th>到期時間</th>
                </tr>
              </thead>
              <tbody id="dt-${productId}">
                <tr><td colspan="7" class="text-center py-3 text-muted">載入中…</td></tr>
              </tbody>
            </table>
          </div>
        </div>`;
    },

    // ── 展開 / 收合 ──
    toggleDetail(productId) {
      if (this.expandedProductId === productId) {
        this.expandedProductId = null;
        this.renderSummary();
      } else {
        this.expandedProductId = productId;
        this.renderSummary();
        this.loadDetail(productId);
      }
    },

    // ── 明細 API ──
    loadDetail(productId) {
      const params = new URLSearchParams({ productId });

      const tbody = document.getElementById(`dt-${productId}`);
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3 text-muted">載入中…</td></tr>`;

      fetch(`${API_BASE}/admin/redemption/detail?${params}`, { credentials: "include" })
        .then((res) => res.json())
        .then((resp) => {
          if (!checkAuth(resp)) return;
          if (resp.success === 1) {
            this._renderDetail(productId, resp.data || []);
          } else {
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3 text-danger">${resp.errMsg || "載入失敗"}</td></tr>`;
          }
        })
        .catch(() => {
          if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3 text-danger">網路連線異常</td></tr>`;
        });
    },

    _renderDetail(productId, data) {
      const tbody = document.getElementById(`dt-${productId}`);
      if (!tbody) return;

      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3 text-muted">查無兌換紀錄</td></tr>`;
        return;
      }

      tbody.innerHTML = data.map((d) => `
        <tr>
          <td class="text-muted">${d.exchangedAt || "--"}</td>
          <td><span class="fw-medium text-primary font-monospace">${d.giftCode}</span></td>
          <td>${d.employeeName}</td>
          <td><span class="text-danger fw-bold">-${d.pointsSpent}</span></td>
          <td>${this._statusBadge(d.status)}</td>
          <td class="text-muted">${d.usedAt || "--"}</td>
          <td class="text-muted">${d.expiresAt || "--"}</td>
        </tr>`).join("");
    },

    _statusBadge(status) {
      const map = {
        AVAILABLE: '<span class="badge bg-info-subtle text-info">可使用</span>',
        USED: '<span class="badge bg-success-subtle text-success">已使用</span>',
        EXPIRED: '<span class="badge bg-secondary-subtle text-secondary">已過期</span>',
      };
      return map[status] || '<span class="badge bg-light text-dark">未知</span>';
    },
  };

  History.init();

  // ===================================================================
  // 紅利設定 (Settings) 模組
  // ===================================================================

  const Settings = {
    loaded: false,

    init() {
      document
        .querySelector('[href="#tab-setting"]')
        .addEventListener("shown.bs.tab", () => {
          if (!this.loaded) {
            this.load();
            this.loaded = true;
          }
        });

      document
        .getElementById("pointSettingsForm")
        .addEventListener("submit", (e) => {
          e.preventDefault();
          this.save();
        });
    },

    load() {
      fetch(`${API_BASE}/admin/setting/global`, { credentials: "include" })
        .then((res) => res.json())
        .then((resp) => {
          if (!checkAuth(resp)) return;
          if (resp.success === 1) {
            document.getElementById("set-on-time").value =
              resp.data.onTimeBonus ?? "";
            document.getElementById("set-late").value =
              resp.data.latePenalty ?? "";
          } else {
            Swal.fire("錯誤", resp.message || "載入設定失敗", "error");
          }
        })
        .catch(() => Swal.fire("錯誤", "網路異常，無法載入設定", "error"));
    },

    save() {
      const onTimeBonus = document.getElementById("set-on-time").value.trim();
      const latePenalty = document.getElementById("set-late").value.trim();

      if (onTimeBonus === "" || latePenalty === "") {
        Swal.fire("提示", "請填寫所有欄位", "warning");
        return;
      }

      Swal.fire({
        title: "儲存設定？",
        text: "即將更新全公司的考勤紅利計算規則。",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "確定儲存",
        cancelButtonText: "取消",
      }).then((result) => {
        if (!result.isConfirmed) return;

        fetch(`${API_BASE}/admin/setting/global`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ onTimeBonus, latePenalty }),
        })
          .then((res) => res.json())
          .then((resp) => {
            if (!checkAuth(resp)) return;
            if (resp.success === 1) {
              Swal.fire("儲存成功", "紅利點數規則已更新生效。", "success");
            } else {
              Swal.fire("錯誤", resp.message || "儲存失敗", "error");
            }
          })
          .catch(() => Swal.fire("錯誤", "網路異常，無法儲存設定", "error"));
      });
    },
  };

  Settings.init();
});
