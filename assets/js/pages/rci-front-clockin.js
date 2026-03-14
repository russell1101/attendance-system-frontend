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

  // 3. API 呼叫模擬區塊
  const callAttendanceApi = async (type) => {
    // type: "IN" (上班) 或 "OUT" (下班)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模擬 API 呼叫成功
        resolve({ success: 1, message: "打卡紀錄已儲存" });
      }, 800);
    });
  };

  // 4. 按鈕點擊邏輯
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
            const res = await callAttendanceApi("IN");
            if (res.success !== 1) throw new Error("打卡失敗");
            return res;
          } catch (error) {
            Swal.showValidationMessage(`發生錯誤: ${error.message}`);
          }
        },
        allowOutsideClick: () => !Swal.isLoading(),
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "上班打卡成功!",
            text: `您已於 ${timeDisplay.textContent} 完成上班打卡。`,
            icon: "success",
            confirmButtonClass: "btn btn-primary w-xs mt-2",
            buttonsStyling: false,
          });
          statusText.textContent = `最新紀錄：上班 (${timeDisplay.textContent})`;
          statusText.className = "text-primary mt-2 mb-0 fw-medium";
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
        icon: "warning", // 用黃色警告圖示稍微區分
        showCancelButton: true,
        confirmButtonText: "確認下班",
        cancelButtonText: "取消",
        confirmButtonClass: "btn btn-danger w-xs me-2 mb-1",
        cancelButtonClass: "btn btn-light w-xs mb-1",
        buttonsStyling: false,
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            const res = await callAttendanceApi("OUT");
            if (res.success !== 1) throw new Error("打卡失敗");
            return res;
          } catch (error) {
            Swal.showValidationMessage(`發生錯誤: ${error.message}`);
          }
        },
        allowOutsideClick: () => !Swal.isLoading(),
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "下班打卡成功!",
            text: `您已於 ${timeDisplay.textContent} 完成下班打卡`,
            icon: "success",
            confirmButtonClass: "btn btn-primary w-xs mt-2",
            buttonsStyling: false,
          });
          statusText.textContent = `最新紀錄：下班 (${timeDisplay.textContent})`;
          statusText.className = "text-danger mt-2 mb-0 fw-medium";
        }
      });
    });
  }

  // 5. 打卡歷程邏輯
  // ==========================================
  let currentHistoryDate = new Date(); // 當前查看的月份
  const monthDisplay = document.getElementById("history-month-display");
  const historyContainer = document.getElementById("history-list-container");

  // 模擬打卡歷程 API
  const fetchHistoryApi = async (year, month) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 根據你提供的 attendance_records table 結構模擬資料
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

  // 狀態 Badge 轉換字典
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

        // 點數顯示樣式
        let pointsHtml = "";
        if (record.pointsAwarded > 0) {
          pointsHtml = `<span class="text-success fw-bold">+${record.pointsAwarded} 點</span>`;
        } else if (record.pointsAwarded < 0) {
          pointsHtml = `<span class="text-danger fw-bold">${record.pointsAwarded} 點</span>`;
        } else {
          pointsHtml = `<span class="text-muted fw-bold">0 點</span>`;
        }

        // 拆解日期 (例如: 14日)
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

  // 綁定月份切換按鈕
  document.getElementById("btn-prev-month").addEventListener("click", () => {
    currentHistoryDate.setMonth(currentHistoryDate.getMonth() - 1);
    loadHistory();
  });

  document.getElementById("btn-next-month").addEventListener("click", () => {
    currentHistoryDate.setMonth(currentHistoryDate.getMonth() + 1);
    loadHistory();
  });

  // 載入當月資料
  loadHistory();
});
