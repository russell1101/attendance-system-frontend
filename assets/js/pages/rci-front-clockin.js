document.addEventListener("DOMContentLoaded", function () {
  // 1. DOM 元素取得
  const timeDisplay = document.getElementById("current-time");
  const dateDisplay = document.getElementById("current-date");
  const btnClockIn = document.getElementById("btn-clock-in");
  const btnClockOut = document.getElementById("btn-clock-out");
  const statusText = document.getElementById("status-text");

  // 2. 時鐘運作邏輯
  const updateClock = () => {
    const now = new Date();

    // 格式化時間 (HH:mm:ss，24小時制)
    const timeString = now.toLocaleTimeString("zh-TW", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const dateString = now.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });

    if (timeDisplay) timeDisplay.textContent = timeString;
    if (dateDisplay) dateDisplay.textContent = dateString;
  };

  updateClock();
  // 設定每秒 (1000ms) 更新一次
  setInterval(updateClock, 1000);

  // ==========================================
  // 🔥 3. 頁面初始化：取得當日打卡狀態並 Disable 按鈕
  // ==========================================
  const loadClockStatus = async () => {
    try {
      const response = await fetch(
        `${APP_CONFIG.API_BASE_URL}/frontUser/clock/status`
      );
      const result = await response.json();

      // 如果 API 回傳錯誤
      if (result.success !== 1) {
        Swal.fire({
          icon: "error",
          title: "狀態讀取失敗",
          text: result.errMsg || "系統發生錯誤",
          confirmButtonClass: "btn btn-primary w-xs mt-2",
          buttonsStyling: false,
        }).then(() => {
          // 判斷是否為未登入狀態 (-999)
          if (result.success === -999) {
            window.location.href = "./rci-login-front.html";
          } else {
            window.location.reload();
          }
        });
        return; // 終止後續執行
      }

      // API 成功，處理按鈕狀態
      const data = result.data;
      if (data.hasClockedIn) {
        btnClockIn.disabled = true;
        btnClockIn.classList.replace("btn-primary", "btn-secondary"); // 變更顏色
        btnClockIn.innerHTML = `<i class="ri-map-pin-time-line align-middle me-1"></i> 已上班 (${data.clockInTime})`;

        statusText.textContent = `最新紀錄：上班 (${data.clockInTime})`;
        statusText.className = "text-primary mt-2 mb-0 fw-medium";
      }

      if (data.hasClockedOut) {
        btnClockOut.disabled = true;
        btnClockOut.classList.replace("btn-soft-danger", "btn-secondary"); // 變更顏色
        btnClockOut.innerHTML = `<i class="ri-logout-box-r-line align-middle me-1"></i> 已下班 (${data.clockOutTime})`;

        statusText.textContent = `最新紀錄：下班 (${data.clockOutTime})`;
        statusText.className = "text-danger mt-2 mb-0 fw-medium";
      }
    } catch (error) {
      console.error("狀態 API 呼叫異常:", error);
    }
  };

  // 執行載入狀態
  loadClockStatus();

  // ==========================================
  // 🔥 4. 按鈕點擊邏輯 (真實串接 API)
  // ==========================================

  // 上班打卡
  if (btnClockIn) {
    btnClockIn.addEventListener("click", () => {
      Swal.fire({
        title: "確認上班打卡？",
        text: "系統將記錄您現在的時間為上班時間。",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "確認打卡",
        cancelButtonText: "取消",
        confirmButtonClass: "btn btn-primary w-xs me-2 mb-1",
        cancelButtonClass: "btn btn-light w-xs mb-1",
        buttonsStyling: false,
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            // 直接回傳 fetch 的 JSON 結果交給 then 處理
            const response = await fetch(
              `${APP_CONFIG.API_BASE_URL}/frontUser/clock/clockin`,
              { method: "POST" }
            );
            return await response.json();
          } catch (error) {
            // 網路錯誤時回傳自訂錯誤物件
            return { success: -1, errMsg: "網路連線異常，請檢查網路狀態" };
          }
        },
        allowOutsideClick: () => !Swal.isLoading(),
      }).then((result) => {
        if (result.isConfirmed) {
          const res = result.value;

          // 判斷 API 執行結果
          if (res.success !== 1) {
            // 失敗處理
            Swal.fire({
              icon: "error",
              title: "打卡失敗",
              text: res.errMsg || "發生未知錯誤",
              confirmButtonClass: "btn btn-primary w-xs mt-2",
              buttonsStyling: false,
            }).then(() => {
              if (res.success === -999)
                window.location.href = "./rci-login-front.html";
              else window.location.reload();
            });
          } else {
            // 成功處理，可以把加扣點資訊組裝進去
            let successMsg = `您已於 <b>${timeDisplay.textContent}</b> 完成上班打卡。`;
            if (res.data) {
              successMsg += `<br><br>打卡狀態：<span class="text-primary fw-bold">${res.data.status}</span>`;
              successMsg += `<br>點數異動：<span class="${
                res.data.pointsChanged < 0 ? "text-danger" : "text-success"
              } fw-bold">${res.data.pointsChanged} 點</span>`;
            }

            Swal.fire({
              title: "上班打卡成功!",
              html: successMsg,
              icon: "success",
              confirmButtonClass: "btn btn-primary w-xs mt-2",
              buttonsStyling: false,
            }).then(() => {
              window.location.reload(); // 重整頁面讓按鈕進入 Disable 狀態
            });
          }
        }
      });
    });
  }

  // 下班打卡
  if (btnClockOut) {
    btnClockOut.addEventListener("click", () => {
      Swal.fire({
        title: "確認下班打卡？",
        text: "系統將記錄您現在的時間為下班時間。",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "確認下班",
        cancelButtonText: "取消",
        confirmButtonClass: "btn btn-danger w-xs me-2 mb-1",
        cancelButtonClass: "btn btn-light w-xs mb-1",
        buttonsStyling: false,
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            const response = await fetch(
              `${APP_CONFIG.API_BASE_URL}/frontUser/clock/clockout`,
              { method: "POST" }
            );
            return await response.json();
          } catch (error) {
            return { success: -1, errMsg: "網路連線異常，請檢查網路狀態" };
          }
        },
        allowOutsideClick: () => !Swal.isLoading(),
      }).then((result) => {
        if (result.isConfirmed) {
          const res = result.value;

          // 判斷 API 執行結果
          if (res.success !== 1) {
            // 失敗處理
            Swal.fire({
              icon: "error",
              title: "打卡失敗",
              text: res.errMsg || "發生未知錯誤",
              confirmButtonClass: "btn btn-primary w-xs mt-2",
              buttonsStyling: false,
            }).then(() => {
              if (res.success === -999)
                window.location.href = "./rci-login-front.html";
              else window.location.reload();
            });
          } else {
            // 成功處理
            let successMsg = `您已於 <b>${timeDisplay.textContent}</b> 完成下班打卡。辛苦了！`;
            if (res.data) {
              successMsg += `<br><br>打卡狀態：<span class="text-primary fw-bold">${res.data.status}</span>`;
              successMsg += `<br>點數異動：<span class="${
                res.data.pointsChanged < 0 ? "text-danger" : "text-success"
              } fw-bold">${res.data.pointsChanged} 點</span>`;
            }

            Swal.fire({
              title: "下班打卡成功!",
              html: successMsg,
              icon: "success",
              confirmButtonClass: "btn btn-primary w-xs mt-2",
              buttonsStyling: false,
            }).then(() => {
              window.location.reload(); // 重整頁面讓按鈕進入 Disable 狀態
            });
          }
        }
      });
    });
  }

  // ==========================================
  // 5. 打卡歷程邏輯 (維持不變)
  // ==========================================
  let currentHistoryDate = new Date();
  const monthDisplay = document.getElementById("history-month-display");
  const historyContainer = document.getElementById("history-list-container");

  const fetchHistoryApi = async (year, month) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            workDate: `${year}-${month.toString().padStart(2, "0")}-14`,
            clockInTime: "08:55:00",
            clockOutTime: "18:05:00",
            clockInStatus: "ON_TIME",
            clockOutStatus: "NORMAL",
            pointsAwarded: 10.0,
          },
          {
            workDate: `${year}-${month.toString().padStart(2, "0")}-13`,
            clockInTime: "09:15:00",
            clockOutTime: "18:00:00",
            clockInStatus: "LATE",
            clockOutStatus: "NORMAL",
            pointsAwarded: -5.0,
          },
          {
            workDate: `${year}-${month.toString().padStart(2, "0")}-12`,
            clockInTime: "08:50:00",
            clockOutTime: "17:30:00",
            clockInStatus: "ON_TIME",
            clockOutStatus: "EARLY_LEAVE",
            pointsAwarded: -10.0,
          },
        ]);
      }, 400);
    });
  };

  const statusMap = {
    ON_TIME: { text: "準時", color: "success" },
    LATE: { text: "遲到", color: "danger" },
    NORMAL: { text: "正常", color: "success" },
    EARLY_LEAVE: { text: "早退", color: "warning" },
    MISSING: { text: "缺卡", color: "secondary" },
  };

  const loadHistory = async () => {
    const year = currentHistoryDate.getFullYear();
    const month = currentHistoryDate.getMonth() + 1;
    monthDisplay.innerText = `${year}年 ${month.toString().padStart(2, "0")}月`;

    historyContainer.innerHTML =
      '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>';

    try {
      const records = await fetchHistoryApi(year, month);
      historyContainer.innerHTML = "";

      if (records.length === 0) {
        historyContainer.innerHTML =
          '<div class="text-center py-5 text-muted">本月無打卡紀錄</div>';
        return;
      }

      records.forEach((record) => {
        const inStat = statusMap[record.clockInStatus] || statusMap["MISSING"];
        const outStat =
          statusMap[record.clockOutStatus] || statusMap["MISSING"];

        let pointsHtml = "";
        if (record.pointsAwarded > 0) {
          pointsHtml = `<span class="text-success fw-bold">+${record.pointsAwarded} 點</span>`;
        } else if (record.pointsAwarded < 0) {
          pointsHtml = `<span class="text-danger fw-bold">${record.pointsAwarded} 點</span>`;
        } else {
          pointsHtml = `<span class="text-muted fw-bold">0 點</span>`;
        }

        const day = record.workDate.split("-")[2];

        const html = `
                <div class="list-group-item list-group-item-action p-3">
                    <div class="d-flex align-items-center">
                        <div class="flex-shrink-0 me-3 text-center">
                            <h4 class="mb-0 fw-bold text-primary">${day}</h4>
                            <small class="text-muted">日</small>
                        </div>
                        <div class="flex-grow-1 border-start ps-3 border-light border-2">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <div class="fs-13">
                                    <span class="text-muted me-1">上班</span> 
                                    <span class="fw-medium">${
                                      record.clockInTime || "--:--:--"
                                    }</span>
                                    <span class="badge bg-${
                                      inStat.color
                                    }-subtle text-${inStat.color} ms-1">${
          inStat.text
        }</span>
                                </div>
                                <div>${pointsHtml}</div>
                            </div>
                            <div class="fs-13">
                                <span class="text-muted me-1">下班</span> 
                                <span class="fw-medium">${
                                  record.clockOutTime || "--:--:--"
                                }</span>
                                <span class="badge bg-${
                                  outStat.color
                                }-subtle text-${outStat.color} ms-1">${
          outStat.text
        }</span>
                            </div>
                        </div>
                    </div>
                </div>`;
        historyContainer.insertAdjacentHTML("beforeend", html);
      });
    } catch (e) {
      historyContainer.innerHTML =
        '<div class="text-center py-4 text-danger">資料載入失敗</div>';
    }
  };

  document.getElementById("btn-prev-month").addEventListener("click", () => {
    currentHistoryDate.setMonth(currentHistoryDate.getMonth() - 1);
    loadHistory();
  });

  document.getElementById("btn-next-month").addEventListener("click", () => {
    currentHistoryDate.setMonth(currentHistoryDate.getMonth() + 1);
    loadHistory();
  });

  loadHistory();
});
