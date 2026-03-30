document.addEventListener("DOMContentLoaded", function () {
  // ⚠️ 請確保 config.js 有被載入，並且裡面有 APP_CONFIG.API_BASE_URL
  const API_URL =
    APP_CONFIG.API_BASE_URL || "http://127.0.0.1:8080/attendances-project";

  // 全域變數
  let currentUserPoints = 0;
  let allProducts = [];
  let myGiftCards = [];
  let currentStatusFilter =
    sessionStorage.getItem("rci_active_subtab") || "AVAILABLE"; // 預設或讀取記憶狀態

  const container = document.getElementById("voucher-list-container");
  const myVoucherContainer = document.getElementById(
    "my-voucher-list-container"
  );
  const pointsDisplay = document.getElementById("user-points-display");
  const searchInput = document.getElementById("search-product-input");

  // Modal 相關元件
  const modalEl = document.getElementById("productDetailModal");
  const modalBs = window.bootstrap ? new bootstrap.Modal(modalEl) : null;
  let currentModalVoucher = null;

  // ==========================================
  // 0. 頁籤狀態記憶 (Tab Persistence)
  // ==========================================
  // 記憶並還原主頁籤 (商城 / 我的票夾)
  const activeTabHref = sessionStorage.getItem("rci_active_tab");
  if (activeTabHref) {
    const tabEl = document.querySelector(`a[href="${activeTabHref}"]`);
    if (tabEl) new bootstrap.Tab(tabEl).show();
  }

  // 綁定點擊事件以儲存主頁籤狀態
  const mainTabs = document.querySelectorAll('a[data-bs-toggle="tab"]');
  mainTabs.forEach((tab) => {
    tab.addEventListener("shown.bs.tab", (e) => {
      sessionStorage.setItem("rci_active_tab", e.target.getAttribute("href"));
    });
  });

  // 還原「我的票夾」子頁籤 UI 狀態
  const statusButtons = document.querySelectorAll(
    "#voucher-status-filter .nav-link"
  );
  statusButtons.forEach((b) =>
    b.classList.remove("active", "bg-primary", "text-white")
  );
  const activeSubBtn = document.querySelector(
    `#voucher-status-filter .nav-link[data-status="${currentStatusFilter}"]`
  );
  if (activeSubBtn)
    activeSubBtn.classList.add("active", "bg-primary", "text-white");

  // ==========================================
  // 1. 共用錯誤處理函式
  // ==========================================
  const handleApiError = (result, title = "系統錯誤") => {
    if (result.success !== 1) {
      Swal.fire({
        icon: "error",
        title: title,
        text: result.errMsg || "發生未知的錯誤",
      }).then(() => {
        if (result.success === -999) {
          window.location.href = "./rci-login-front.html";
        } else {
          window.location.reload();
        }
      });
      return true; // 有錯誤
    }
    return false; // 沒錯誤
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "-";
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(
      2,
      "0"
    )}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // ==========================================
  // 2. API 呼叫區塊
  // ==========================================
  const fetchMyAssetsApi = async () => {
    const response = await fetch(`${API_URL}/frontUser/cart/myAssets`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("網路回應錯誤");
    return await response.json();
  };

  const fetchProductApi = async () => {
    const response = await fetch(`${API_URL}/frontUser/product/getAll`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("網路回應錯誤");
    return await response.json();
  };

  const buyProductApi = async (productId, qty) => {
    const response = await fetch(`${API_URL}/frontUser/product/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productId: productId, qty: qty }),
    });
    if (!response.ok) throw new Error("網路回應錯誤");
    return await response.json();
  };

  // 🔥 新增：使用優惠券 API
  const useGiftCardApi = async (giftCardId) => {
    const response = await fetch(`${API_URL}/frontUser/cart/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ giftCardId: giftCardId }),
    });
    if (!response.ok) throw new Error("網路回應錯誤");
    return await response.json();
  };

  // ==========================================
  // 3. 初始化載入
  // ==========================================
  const init = async () => {
    try {
      const [assetsResult, productsResult] = await Promise.all([
        fetchMyAssetsApi(),
        fetchProductApi(),
      ]);

      if (handleApiError(assetsResult, "資料讀取失敗")) return;
      if (handleApiError(productsResult, "商品載入失敗")) return;

      const assetsData = assetsResult.data;
      currentUserPoints = assetsData.currentPoints || 0;
      myGiftCards = assetsData.giftCards || [];
      if (pointsDisplay)
        pointsDisplay.innerText = currentUserPoints.toLocaleString();

      allProducts = productsResult.data.map((p) => ({
        id: p.productId,
        name: p.productName,
        desc: p.description || "暫無詳細說明",
        points: p.requiredPoints,
        stock: p.stock,
        validDays: p.validDays,
        image: p?.imageData ? p.imageData : "assets/images/RCI_LOGO.png",
        status: "active",
      }));

      renderVouchers();
      renderMyVouchers();
    } catch (error) {
      console.error("API Error:", error);
      Swal.fire({ icon: "error", title: "連線失敗", text: error.message }).then(
        () => window.location.reload()
      );
    }
  };

  // ==========================================
  // 4. 渲染邏輯 (商城區塊 + 搜尋)
  // ==========================================
  // 🔥 綁定搜尋輸入框的 Enter 鍵事件
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const keyword = e.target.value.trim().toLowerCase();
        renderVouchers(keyword);
      }
    });
  }

  const getExpiryBadge = (days) => {
    if (days === null || days === undefined)
      return `<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="ri-infinite-line"></i> 無使用期限</span>`;
    return `<span class="badge bg-warning-subtle text-warning border border-warning-subtle"><i class="ri-time-line"></i> ${days} 天內有效</span>`;
  };

  // 🔥 加入 keyword 參數進行過濾
  const renderVouchers = (keyword = "") => {
    if (!container) return;
    container.innerHTML = "";

    const filteredProducts = allProducts.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.desc.toLowerCase().includes(keyword)
    );

    if (filteredProducts.length === 0) {
      container.innerHTML = `<div class="col-12 text-center py-5">找不到與「${keyword}」相關的商品</div>`;
      return;
    }

    filteredProducts.forEach((item) => {
      const isOutOfStock = item.stock <= 0;
      const isInsufficientPoints = currentUserPoints < item.points;

      let cardClasses = "card voucher-card h-100 shadow-sm border-0";
      let btnDisabledAttr = "";
      let btnText = "立即兌換";
      let overlayHtml = "";

      if (isOutOfStock) {
        cardClasses += " disabled opacity-75";
        btnDisabledAttr = "disabled";
        btnText = "已兌換完畢";
        overlayHtml =
          '<div class="position-absolute top-50 start-50 translate-middle badge bg-dark fs-14 z-2">補貨中</div>';
      } else if (isInsufficientPoints) {
        btnDisabledAttr = "disabled";
        btnText = "點數不足";
      }

      const html = `
          <div class="col-xxl-3 col-lg-4 col-md-6 col-12 mb-4">
              <div class="${cardClasses}" data-id="${item.id}">
                  ${overlayHtml}
                  <div class="voucher-img-wrapper cursor-pointer" onclick="openDetailModal(${
                    item.id
                  })">
                      <img src="${item.image}" class="voucher-img" alt="${
        item.name
      }"> 
                  </div>
                  <div class="voucher-content p-3">
                      <h5 class="voucher-title cursor-pointer text-truncate" onclick="openDetailModal(${
                        item.id
                      })">${item.name}</h5>
                      <div class="d-flex justify-content-between align-items-center mb-2">
                          <span class="points-tag text-primary fw-bold"><i class="ri-coin-line"></i> ${item.points.toLocaleString()} 點</span>
                          <small class="text-muted">餘量: ${item.stock}</small>
                      </div>
                      <div class="mb-2">${getExpiryBadge(item.validDays)}</div>
                      <p class="voucher-desc text-muted small text-truncate">${
                        item.desc
                      }</p>
                      <div class="voucher-footer mt-3">
                          <div class="row g-2 align-items-center">
                              <div class="col-5">
                                  <div class="input-group input-group-sm">
                                      <button type="button" class="btn btn-outline-secondary minus" onclick="updateListQty(${
                                        item.id
                                      }, -1)">-</button>
                                      <input type="number" class="form-control text-center p-0" id="qty-${
                                        item.id
                                      }" value="1" min="1" max="${
        item.stock
      }" readonly>
                                      <button type="button" class="btn btn-outline-secondary plus" onclick="updateListQty(${
                                        item.id
                                      }, 1)">+</button>
                                  </div>
                              </div>
                              <div class="col-7">
                                  <button type="button" class="btn btn-primary w-100 btn-sm" id="btn-redeem-${
                                    item.id
                                  }" ${btnDisabledAttr} onclick="redeemVoucher(${
        item.id
      })">${btnText}</button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      `;
      container.insertAdjacentHTML("beforeend", html);
    });

    filteredProducts.forEach((item) => validatePoints(item.id));
  };

  // ==========================================
  // 5. 渲染邏輯 (我的票夾 / 已兌換)
  // ==========================================
  const renderMyVouchers = () => {
    if (!myVoucherContainer) return;
    myVoucherContainer.innerHTML = "";

    const filteredCards = myGiftCards.filter(
      (card) => card.status === currentStatusFilter
    );

    if (filteredCards.length === 0) {
      myVoucherContainer.innerHTML = `
        <div class="col-12 text-center py-5 mt-4">
            <lord-icon src="https://cdn.lordicon.com/msoeawqm.json" trigger="loop" colors="primary:#405189,secondary:#0ab39c" style="width:72px;height:72px"></lord-icon>
            <h5 class="mt-3 text-muted">目前沒有相符的優惠券</h5>
        </div>`;
      return;
    }

    filteredCards.forEach((card) => {
      let statusBadge = "";
      let opacityClass = "";
      let actionBtn = "";

      // 🔥 處理 Base64 圖片 (若無則套用預設圖)
      const imgSrc = card.productImageBase64
        ? card.productImageBase64
        : "assets/images/RCI_LOGO.png";

      if (card.status === "AVAILABLE") {
        statusBadge = `<span class="badge bg-success">可使用</span>`;
        // 可使用的票券顯示兌換按鈕
        actionBtn = `<button class="btn btn-sm btn-outline-primary mt-3 w-100 fw-bold" onclick="handleUseGiftCard(${card.giftCardId})">點擊兌換使用</button>`;
      } else if (card.status === "USED") {
        statusBadge = `<span class="badge bg-secondary">已使用</span>`;
        opacityClass = "opacity-75";
      } else {
        statusBadge = `<span class="badge bg-danger">已失效</span>`;
        opacityClass = "opacity-75";
      }

      const html = `
        <div class="col-lg-6 col-12 mb-3">
          <div class="card border-0 shadow-sm ${opacityClass} overflow-hidden h-100">
            <div class="row g-0 align-items-center h-100">
              <div class="col-4 bg-light d-flex justify-content-center align-items-center p-2" style="height: 140px;">
                  <img src="${imgSrc}" class="img-fluid rounded shadow-sm" style="max-height: 100%; object-fit: cover;">
              </div>
              <div class="col-8">
                <div class="card-body py-2 px-3">
                  <div class="d-flex justify-content-between align-items-start mb-1">
                      <h5 class="card-title fs-16 mb-0 fw-bold text-truncate" style="max-width: 70%;">${
                        card.giftName
                      }</h5>
                      ${statusBadge}
                  </div>
                  <p class="mb-1 mt-2 fs-14 fw-medium text-dark">
                      兌換碼：<span class="font-monospace px-2 py-1 bg-light rounded text-primary">${
                        card.giftCode
                      }</span>
                  </p>
                  <p class="card-text text-muted mb-0 fs-12">
                      <small>獲得日: ${formatTime(card.exchangedAt)}</small><br>
                      ${
                        card.status === "AVAILABLE"
                          ? `<small class="text-danger">到期日: ${formatTime(
                              card.expiresAt
                            )}</small>`
                          : ""
                      }
                      ${
                        card.status === "USED"
                          ? `<small>使用日: ${formatTime(card.usedAt)}</small>`
                          : ""
                      }
                  </p>
                  ${actionBtn}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      myVoucherContainer.insertAdjacentHTML("beforeend", html);
    });
  };

  // 狀態子頁籤切換事件
  statusButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      statusButtons.forEach((b) =>
        b.classList.remove("active", "bg-primary", "text-white")
      );
      e.target.classList.add("active", "bg-primary", "text-white");

      currentStatusFilter = e.target.getAttribute("data-status");
      // 記憶子頁籤狀態
      sessionStorage.setItem("rci_active_subtab", currentStatusFilter);
      renderMyVouchers();
    });
  });

  // ==========================================
  // 6. 互動邏輯 & 購買/使用功能
  // ==========================================
  // 🔥 新增：處理點擊「立即兌換使用」優惠券
  window.handleUseGiftCard = (id) => {
    const card = myGiftCards.find((c) => c.giftCardId === id);
    if (!card) return;

    Swal.fire({
      title: "確認使用優惠券？",
      html: `您即將使用：<br><b class="text-primary fs-18">${card.giftName}</b><br><small class="text-muted">兌換碼：${card.giftCode}</small>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "確認使用",
      cancelButtonText: "取消",
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          return await useGiftCardApi(id);
        } catch (error) {
          Swal.showValidationMessage(`請求失敗: ${error.message}`);
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
    }).then((result) => {
      if (result.isConfirmed) {
        const apiResponse = result.value;

        // 錯誤攔截 (包含跳轉邏輯)
        if (handleApiError(apiResponse, "使用失敗")) return;

        // 成功提示
        Swal.fire({
          title: "使用成功!",
          text: "您的優惠券已成功兌換使用。",
          icon: "success",
        }).then(() => {
          // 點擊確認後重整頁面 (因為我們有寫 sessionStorage 記憶，所以重整後會回到原頁籤)
          window.location.reload();
        });
      }
    });
  };

  // 商城詳細內容 Modal 與數量控制 (維持原邏輯)
  window.openDetailModal = (id) => {
    const item = allProducts.find((v) => v.id === id);
    if (!item) return;

    currentModalVoucher = item;
    document.getElementById("modal-img").src = item.image;
    document.getElementById("modal-title").innerText = item.name;
    document.getElementById("modal-points").innerText =
      item.points.toLocaleString();
    document.getElementById("modal-stock").innerText = item.stock;
    document.getElementById("modal-desc").innerText = item.desc;

    const expiryEl = document.getElementById("modal-expiry");
    if (expiryEl) expiryEl.innerHTML = getExpiryBadge(item.validDays);

    const modalInput = document.getElementById("modal-qty-input");
    if (modalInput) {
      modalInput.value = 1;
      modalInput.max = item.stock;
    }

    const modalBtn = document.getElementById("modal-redeem-btn");
    if (modalBtn) {
      if (item.stock <= 0) {
        modalBtn.disabled = true;
        modalBtn.innerText = "已兌換完畢";
      } else if (currentUserPoints < item.points) {
        modalBtn.disabled = true;
        modalBtn.innerText = "點數不足";
      } else {
        modalBtn.disabled = false;
        modalBtn.innerText = "立即兌換";
      }
    }
    if (modalBs) modalBs.show();
  };

  window.updateListQty = (id, delta) => {
    const input = document.getElementById(`qty-${id}`);
    const item = allProducts.find((v) => v.id === id);
    if (!input || !item) return;

    let newQty = parseInt(input.value) + delta;
    if (newQty < 1) newQty = 1;
    if (newQty > item.stock) newQty = item.stock;

    input.value = newQty;
    validatePoints(id);
  };

  const validatePoints = (id) => {
    const item = allProducts.find((v) => v.id === id);
    const input = document.getElementById(`qty-${id}`);
    const btn = document.getElementById(`btn-redeem-${id}`);

    if (!item || !input || !btn) return;
    if (item.stock <= 0) return;

    const currentQty = parseInt(input.value);
    const totalCost = item.points * currentQty;

    if (totalCost > currentUserPoints) {
      btn.disabled = true;
      btn.classList.add("btn-secondary");
      btn.classList.remove("btn-primary");
      btn.innerText = "點數不足";
    } else {
      btn.disabled = false;
      btn.classList.add("btn-primary");
      btn.classList.remove("btn-secondary");
      btn.innerText = "立即兌換";
    }
  };

  // 購買商城商品
  window.redeemVoucher = (id, fromModal = false) => {
    let qty = 1;
    if (fromModal) {
      const modalInput = document.getElementById("modal-qty-input");
      if (modalInput) qty = parseInt(modalInput.value);
    } else {
      const listInput = document.getElementById(`qty-${id}`);
      if (listInput) qty = parseInt(listInput.value);
    }

    const item = allProducts.find((v) => v.id === id);
    if (!item) return;
    const totalCost = item.points * qty;

    if (totalCost > currentUserPoints) {
      Swal.fire({
        icon: "error",
        title: "兌換失敗",
        text: "您的點數不足以支付此訂單！",
      });
      return;
    }

    if (item.stock < qty) {
      Swal.fire({ icon: "error", title: "庫存不足" });
      return;
    }

    Swal.fire({
      title: "確認兌換?",
      html: `商品：${item.name}<br>數量：${qty}<br>總扣除點數：<b class="text-danger">${totalCost}</b> 點`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "確認",
      cancelButtonText: "取消",
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          return await buyProductApi(item.id, qty);
        } catch (error) {
          Swal.showValidationMessage(`請求失敗: ${error.message}`);
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
    }).then((result) => {
      if (result.isConfirmed) {
        const apiResponse = result.value;

        if (handleApiError(apiResponse, "交易失敗")) return;

        const successData = apiResponse.data;
        Swal.fire({
          title: "兌換成功!",
          html: `${successData.message}<br><br>目前剩餘：<b class="text-warning">${successData.currentPoints}</b> 點`,
          icon: "success",
          confirmButtonText: "確認",
        }).then(() => {
          window.location.reload();
        });
      }
    });
  };

  // Modal 按鈕綁定
  const modalMinus = document.querySelector(".modal-qty-btn.minus");
  const modalPlus = document.querySelector(".modal-qty-btn.plus");
  const modalInput = document.getElementById("modal-qty-input");
  const modalRedeemBtn = document.getElementById("modal-redeem-btn");

  if (modalMinus && modalInput) {
    modalMinus.addEventListener("click", () => {
      let val = parseInt(modalInput.value);
      if (val > 1) {
        modalInput.value = val - 1;
        validateModalPoints();
      }
    });
  }

  if (modalPlus && modalInput) {
    modalPlus.addEventListener("click", () => {
      let val = parseInt(modalInput.value);
      if (currentModalVoucher && val < currentModalVoucher.stock) {
        modalInput.value = val + 1;
        validateModalPoints();
      }
    });
  }

  if (modalRedeemBtn) {
    modalRedeemBtn.addEventListener("click", () => {
      if (currentModalVoucher) redeemVoucher(currentModalVoucher.id, true);
    });
  }

  const validateModalPoints = () => {
    if (!currentModalVoucher || !modalInput || !modalRedeemBtn) return;
    const qty = parseInt(modalInput.value);
    const cost = qty * currentModalVoucher.points;

    if (cost > currentUserPoints) {
      modalRedeemBtn.disabled = true;
      modalRedeemBtn.innerText = `點數不足 (需 ${cost})`;
    } else {
      modalRedeemBtn.disabled = false;
      modalRedeemBtn.innerText = `立即兌換 (扣 ${cost} 點)`;
    }
  };

  // 啟動
  init();
});
