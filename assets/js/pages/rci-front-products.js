document.addEventListener("DOMContentLoaded", function () {

    const API_URL = "http://localhost:8080/attendances-project";

  // 模擬會員資訊 API
  const fetchUserApi = async () => {
    const response = await fetch(
      API_URL + "/product/empProfile",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // 固定傳入 employeeId: 1
        body: JSON.stringify({ employeeId: 1 }),
      }
    );

    if (!response.ok) {
      throw new Error("會員 API 網路回應錯誤: " + response.status);
    }

    const result = await response.json();

    if (result.success === 1) {
      return result.data; // 回傳 Employee 物件
    } else {
      throw new Error(result.errMsg || "無法取得會員資料");
    }
  };

  // 實商品列表 API
  const fetchProductApi = async () => {
    const response = await fetch(
      API_URL + "/product/getAll"
    );

    if (!response.ok) {
      throw new Error("網路回應錯誤: " + response.status);
    }

    const result = await response.json();

    if (result.success === 1) {
      return result.data;
    } else {
      throw new Error(result.errMsg || "未知的伺服器錯誤");
    }
  };

  // 購買商品 API
  const buyProductApi = async (productId, qty) => {
    const response = await fetch(API_URL + "/product/buy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employeeId: 1,
        productId: productId,
        qty: qty
      }),
    });

    if (!response.ok) {
      throw new Error("購買 API 網路回應錯誤: " + response.status);
    }

    const result = await response.json();
    return result; // 回傳完整 ApiResponse (包含 success, errMsg, data)
  };

  // 全域變數
  let currentUserPoints = 0;
  let allVouchers = [];
  const container = document.getElementById("voucher-list-container");
  const pointsDisplay = document.getElementById("user-points-display");

  // Modal 相關元件
  const modalEl = document.getElementById("productDetailModal");
  const modalBs = window.bootstrap ? new bootstrap.Modal(modalEl) : null;
  let currentModalVoucher = null;

  // 初始化載入
  const init = async () => {
    try {
      const [userData, backendProducts] = await Promise.all([
        fetchUserApi(),
        fetchProductApi(),
      ]);

      // 更新點數
      currentUserPoints = userData.currentPoints;
      if (pointsDisplay)
        pointsDisplay.innerText = currentUserPoints.toLocaleString();

      allVouchers = backendProducts.map((p) => ({
        id: p.productId,
        name: p.productName,
        desc: p.description || "暫無詳細說明",
        points: p.requiredPoints,
        stock: p.stock,
        validDays: p.validDays,
        image: p?.imageData ? p.imageData : "assets/images/RCI_LOGO.png",
        status: "active",
      }));

      // 渲染列表
      renderVouchers();
    } catch (error) {
      console.error("API Error:", error);
      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "error",
          title: "載入失敗",
          text: error.message,
        });
      } else {
        alert("載入失敗: " + error.message);
      }
    }
  };

  // 渲染
  // 產生期限標籤的 HTML
  const getExpiryBadge = (days) => {
    if (days === null || days === undefined) {
      // 沒有期限 綠色標籤
      return `<span class="badge bg-success-subtle text-success border border-success-subtle">
                    <i class="ri-infinite-line"></i> 無使用期限
                </span>`;
    } else {
      // 有期限 黃色標籤
      return `<span class="badge bg-warning-subtle text-warning border border-warning-subtle">
                    <i class="ri-time-line"></i> ${days} 天內有效
                </span>`;
    }
  };

  const renderVouchers = () => {
    if (!container) return;
    container.innerHTML = "";

    if (allVouchers.length === 0) {
      container.innerHTML =
        '<div class="col-12 text-center py-5">暫無可兌換商品</div>';
      return;
    }

    allVouchers.forEach((item) => {
      // 判斷狀態
      const isOutOfStock = item.stock <= 0;
      const isInsufficientPoints = currentUserPoints < item.points;

      let cardClasses = "card voucher-card h-100";
      let btnDisabledAttr = "";
      let btnText = "立即兌換";
      let overlayHtml = "";

      if (isOutOfStock) {
        cardClasses += " disabled";
        btnDisabledAttr = "disabled";
        btnText = "已兌換完畢";
        overlayHtml =
          '<div class="position-absolute top-50 start-50 translate-middle badge bg-dark fs-14 z-2">補貨中</div>';
      } else if (isInsufficientPoints) {
        cardClasses += " opacity-75";
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
                              <img src="${
                                item.image
                              }" class="voucher-img" alt="${item.name}"> 
                          </div>
                          <div class="voucher-content p-3">
                              <h5 class="voucher-title cursor-pointer text-truncate" onclick="openDetailModal(${
                                item.id
                              })">${item.name}</h5>
                              <div class="d-flex justify-content-between align-items-center mb-2">
                                  <span class="points-tag text-primary fw-bold">
                                      <i class="ri-coin-line"></i> ${item.points.toLocaleString()} 點
                                  </span>
                                  <small class="text-muted">餘量: ${
                                    item.stock
                                  }</small>
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
                                          <button type="button" class="btn btn-primary w-100 btn-sm" 
                                              id="btn-redeem-${item.id}"
                                              ${btnDisabledAttr} 
                                              onclick="redeemVoucher(${
                                                item.id
                                              })">
                                              ${btnText}
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              `;
      container.insertAdjacentHTML("beforeend", html);
    });

    allVouchers.forEach((item) => validatePoints(item.id));
  };

  // 互動邏輯 & 全域函數
  window.openDetailModal = (id) => {
    const item = allVouchers.find((v) => v.id === id);
    if (!item) return;

    currentModalVoucher = item;

    document.getElementById("modal-img").src = item.image;
    document.getElementById("modal-title").innerText = item.name;
    document.getElementById("modal-points").innerText =
      item.points.toLocaleString();
    document.getElementById("modal-stock").innerText = item.stock;
    document.getElementById("modal-desc").innerText = item.desc;

    const expiryEl = document.getElementById("modal-expiry");
    if(expiryEl) {
        expiryEl.innerHTML = getExpiryBadge(item.validDays);
    }

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
    const item = allVouchers.find((v) => v.id === id);
    if (!input || !item) return;

    let newQty = parseInt(input.value) + delta;
    if (newQty < 1) newQty = 1;
    if (newQty > item.stock) newQty = item.stock;

    input.value = newQty;
    validatePoints(id);
  };

  const validatePoints = (id) => {
    const item = allVouchers.find((v) => v.id === id);
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

  window.redeemVoucher = (id, fromModal = false) => {
    let qty = 1;
    if (fromModal) {
      const modalInput = document.getElementById("modal-qty-input");
      if (modalInput) qty = parseInt(modalInput.value);
    } else {
      const listInput = document.getElementById(`qty-${id}`);
      if (listInput) qty = parseInt(listInput.value);
    }

    const item = allVouchers.find((v) => v.id === id);
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
        showLoaderOnConfirm: true, // 設定確認後顯示 Loading
        preConfirm: async () => {
          try {
            const apiResponse = await buyProductApi(item.id, qty);
            
            if (apiResponse.success !== 1) {
                throw new Error(apiResponse.errMsg || "交易失敗");
            }
            return apiResponse.data;
          } catch (error) {
            Swal.showValidationMessage(`請求失敗: ${error.message}`);
          }
        },
        allowOutsideClick: () => !Swal.isLoading()
      }).then((result) => {
        // 如果使用者按了確認，且 API 成功回傳
        if (result.isConfirmed && result.value) {
          const buyResult = result.value;
          currentUserPoints = buyResult.currentPoints; 
          item.stock = buyResult.currentStock;
          if (pointsDisplay) pointsDisplay.innerText = currentUserPoints.toLocaleString();
          renderVouchers();
          if (fromModal && modalBs) modalBs.hide();
          Swal.fire({
            title: "兌換成功!",
            text: buyResult.message,
            icon: "success",
          });
        }
      });
  };

  // Modal 內的加減按鈕
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
      if (currentModalVoucher) {
        redeemVoucher(currentModalVoucher.id, true);
      }
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
