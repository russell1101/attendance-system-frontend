document.addEventListener("DOMContentLoaded", function () {
  // 1. DOM 元素取得
  const timeDisplay = document.getElementById("current-time");
  const dateDisplay = document.getElementById("current-date");
  const btnClockIn = document.getElementById("btn-clock-in");
  const btnClockOut = document.getElementById("btn-clock-out");
  const statusText = document.getElementById("status-text");

  const ATTENDANCE_STATUS_MAP = {
    ON_TIME: { text: "準時", color: "success" },
    LATE: { text: "遲到", color: "danger" },
    NORMAL: { text: "正常", color: "success" }, // 下班正常
    EARLY_LEAVE: { text: "早退", color: "warning" },
    MISSING: { text: "缺卡", color: "secondary" },
  };

  // 時鐘運作邏輯
  const updateClock = () => {
    const now = new Date();

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
  setInterval(updateClock, 1000);

  // 取得當日打卡狀態
  const loadClockStatus = async () => {
    try {
      const response = await fetch(
        `${APP_CONFIG.API_BASE_URL}/frontUser/clock/status`,
        { credentials: "include" }
      );
      const result = await response.json();

      // 錯誤
      if (result.success !== 1) {
        if (result.success === -999) {
          Swal.fire({
            icon: "error",
            title: "尚未登入",
            text: "請先登入系統",
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.href = "./rci-login-front.html";
            }
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "狀態讀取失敗",
            text: result.errMsg || "系統發生錯誤",
          }).then(() => {
            window.location.reload();
          });
        }
        return;
      }

      // 成功
      const data = result.data;
      if (data.hasClockedIn) {
        btnClockIn.disabled = true;
        btnClockIn.classList.replace("btn-primary", "btn-secondary");
        btnClockIn.innerHTML = `<i class="ri-map-pin-time-line align-middle me-1"></i> 已上班 (${data.clockInTime})`;

        statusText.textContent = `最新紀錄：上班 (${data.clockInTime})`;
        statusText.className = "text-primary mt-2 mb-0 fw-medium";
      }

      if (data.hasClockedOut) {
        btnClockOut.disabled = true;
        btnClockOut.classList.replace("btn-soft-danger", "btn-secondary");
        btnClockOut.innerHTML = `<i class="ri-logout-box-r-line align-middle me-1"></i> 已下班 (${data.clockOutTime})`;

        statusText.textContent = `最新紀錄：下班 (${data.clockOutTime})`;
        statusText.className = "text-danger mt-2 mb-0 fw-medium";
      }
    } catch (error) {
      console.error("狀態 API 呼叫異常:", error);
    }
  };


  loadClockStatus();

  // 4. 按鈕點擊邏輯 (上下班打卡)
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
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            const response = await fetch(
              `${APP_CONFIG.API_BASE_URL}/frontUser/clock/clockin`,
              { method: "POST", credentials: "include" }
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

          if (res.success !== 1) {
            if (res.success === -999) {
              Swal.fire({
                icon: "error",
                title: "尚未登入",
                text: "請先登入系統",
              }).then(() => {
                window.location.href = "./rci-login-front.html";
              });
            } else {
              Swal.fire({
                icon: "error",
                title: "打卡失敗",
                text: res.errMsg || "發生未知錯誤",
              }).then(() => {
                window.location.reload();
              });
            }
          } else {
            let successMsg = `您已於 <b>${timeDisplay.textContent}</b> 完成上班打卡。`;
            if (res.data) {
              const statusObj = ATTENDANCE_STATUS_MAP[res.data.status] || {
                text: res.data.status,
                color: "primary",
              };
              successMsg += `<br><br>打卡狀態：<span class="text-${statusObj.color} fw-bold">${statusObj.text}</span>`;
              successMsg +=
                `<br>點數異動：<span class="${
                  res.data.pointsChanged < 0 ? "text-danger" : "text-success"
                } fw-bold">` +
                `${res.data.pointsChanged > 0 ? "+" : ""}${
                  res.data.pointsChanged
                } 點</span>`;
            }

            Swal.fire({
              title: "上班打卡成功!",
              html: successMsg,
              icon: "success",
            }).then(() => {
              window.location.reload();
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
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            const response = await fetch(
              `${APP_CONFIG.API_BASE_URL}/frontUser/clock/clockout`,
              { method: "POST", credentials: "include" }
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

          if (res.success !== 1) {
            if (res.success === -999) {
              Swal.fire({
                icon: "error",
                title: "尚未登入",
                text: "請先登入系統",
              }).then(() => {
                window.location.href = "./rci-login-front.html";
              });
            } else {
              Swal.fire({
                icon: "error",
                title: "打卡失敗",
                text: res.errMsg || "發生未知錯誤",
              }).then(() => {
                window.location.reload();
              });
            }
          } else {
            let successMsg = `已於 <b>${timeDisplay.textContent}</b> 完成下班打卡`;
            if (res.data) {
              const statusObj = ATTENDANCE_STATUS_MAP[res.data.status] || {
                text: res.data.status,
                color: "primary",
              };
              successMsg += `<br><br>打卡狀態：<span class="text-${statusObj.color} fw-bold">${statusObj.text}</span>`;
              successMsg +=
                `<br>點數異動：<span class="${
                  res.data.pointsChanged < 0 ? "text-danger" : "text-success"
                } fw-bold">` +
                `${res.data.pointsChanged > 0 ? "+" : ""}${
                  res.data.pointsChanged
                } 點</span>`;
            }

            Swal.fire({
              title: "下班打卡成功!",
              html: successMsg,
              icon: "success",
            }).then(() => {
              window.location.reload();
            });
          }
        }
      });
    });
  }

  // 5. 打卡歷程邏輯
  let currentHistoryDate = new Date(); // 當前查看的月份
  const monthDisplay = document.getElementById("history-month-display");
  const historyContainer = document.getElementById("history-list-container");
  const btnNextMonth = document.getElementById("btn-next-month");
  const btnPrevMonth = document.getElementById("btn-prev-month");

  // 真實打卡歷程 API
  const fetchHistoryApi = async (year, month) => {
    try {
      const response = await fetch(
        `${APP_CONFIG.API_BASE_URL}/frontUser/clock/history?year=${year}&month=${month}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("網路連線異常");

      const result = await response.json();

      if (result.success !== 1) {
        if (result.success === -999) {
          Swal.fire({
            icon: "error",
            title: "尚未登入",
            text: "請先登入系統",
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.href = "./rci-login-front.html";
            }
          });
          // 拋出特定標記，讓外層 catch 知道不需要再跳錯誤彈窗
          throw new Error("UNAUTHORIZED");
        } else {
          Swal.fire({
            icon: "error",
            title: "讀取失敗",
            text: result.errMsg || "發生未知錯誤",
          });
          throw new Error(result.errMsg || "載入失敗");
        }
      }

      // 若後端為 null (通常代表沒資料)，給空陣列
      return result.data || [];
    } catch (err) {
      throw err;
    }
  };

  const loadHistory = async () => {
    const year = currentHistoryDate.getFullYear();
    const month = currentHistoryDate.getMonth() + 1;
    monthDisplay.innerText = `${year}年 ${month.toString().padStart(2, "0")}月`;

    // 判斷是否為「未來月份」，若是則鎖死「下個月」按鈕
    const realNow = new Date();
    if (year === realNow.getFullYear() && month === realNow.getMonth() + 1) {
      btnNextMonth.disabled = true;
      btnNextMonth.classList.add("opacity-50"); // 加上半透明效果
    } else {
      btnNextMonth.disabled = false;
      btnNextMonth.classList.remove("opacity-50");
    }

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
        const inStat =
          ATTENDANCE_STATUS_MAP[record.clockInStatus] ||
          ATTENDANCE_STATUS_MAP["MISSING"];
        const outStat =
          ATTENDANCE_STATUS_MAP[record.clockOutStatus] ||
          ATTENDANCE_STATUS_MAP["MISSING"];

        let pointsHtml = "";
        if (record.pointsAwarded > 0) {
          pointsHtml = `<span class="text-success fw-bold">+${record.pointsAwarded} 點</span>`;
        } else if (record.pointsAwarded < 0) {
          pointsHtml = `<span class="text-danger fw-bold">${record.pointsAwarded} 點</span>`;
        } else {
          pointsHtml = `<span class="text-muted fw-bold">0 點</span>`;
        }

        // 處理後端傳來的格式: "2026-03-22 00:00:00.0" -> 分割空白後取 [0] 再分割 '-' 拿日
        const dateOnly = record.workDate.split(" ")[0]; // "2026-03-22"
        const day = dateOnly.split("-")[2]; // "22"

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
      Swal.fire("錯誤", e.message, "error");
      historyContainer.innerHTML =
        '<div class="text-center py-4 text-danger">資料載入失敗</div>';
    }
  };

  // 綁定月份切換按鈕
  if (btnPrevMonth) {
    btnPrevMonth.addEventListener("click", () => {
      currentHistoryDate.setMonth(currentHistoryDate.getMonth() - 1);
      loadHistory();
    });
  }

  if (btnNextMonth) {
    btnNextMonth.addEventListener("click", () => {
      currentHistoryDate.setMonth(currentHistoryDate.getMonth() + 1);
      loadHistory();
    });
  }

  // 第一次載入
  loadHistory();
});
