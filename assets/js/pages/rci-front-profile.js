document.addEventListener("DOMContentLoaded", function () {
  const loadProfileData = async () => {
    try {
      const response = await fetch(
        `${APP_CONFIG.API_BASE_URL}/frontUser/clock/profile`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("網路連線異常");
      }

      const result = await response.json();

      // 判斷 API 狀態，如果不為 1，全部導回登入頁
      if (result.success !== 1) {
        Swal.fire({
          icon: "error",
          title: "資料讀取失敗",
          text: result.errMsg || "請重新登入",
        }).then(() => {
          window.location.href = "./rci-login-front.html";
        });
        return; // 終止執行
      }

      // 成功取得資料，開始渲染畫面
      const data = result.data;
      document.getElementById("profile-name").innerText = data.name || "未提供";
      document.getElementById("profile-dept").innerText =
        data.departmentName || "未指派部門";
      document.getElementById("profile-points").innerText = Number(
        data.currentPoints || 0
      ).toLocaleString();
      document.getElementById("profile-email").innerText =
        data.email || "未提供";
      document.getElementById("profile-id").innerText = data.employeeId
        ? `EMP-${data.employeeId}`
        : "-";
      document.getElementById("profile-status").innerText =
        data.statusName || "未知狀態";

      // 處理日期格式 (例如從 "2023-05-01 00:00:00.0" 萃取出 "2023-05-01")
      if (data.hireDate) {
        const dateOnly = data.hireDate.split(" ")[0];
        document.getElementById("profile-hiredate").innerText = dateOnly;
      } else {
        document.getElementById("profile-hiredate").innerText = "-";
      }
    } catch (error) {
      // 捕捉網路層級的錯誤 (例如後端沒開、斷網)
      console.error("Profile API 錯誤:", error);
      Swal.fire({
        icon: "error",
        title: "系統錯誤",
        text: "無法取得伺服器回應，請檢查網路狀態",
      }).then(() => {
        window.location.href = "./rci-login-front.html";
      });
    }
  };

  // 執行載入
  loadProfileData();
});
