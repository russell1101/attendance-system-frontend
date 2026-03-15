document.addEventListener("DOMContentLoaded", async function () {
    // 模擬後端回傳的 Employee 資料
    const mockProfileApi = () => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: 1,
                    data: {
                        employeeId: 1001,
                        name: "王大明",
                        email: "ming.wang@company.com",
                        hireDate: "2023-05-15",
                        currentPoints: 2500.50,
                        departmentName: "資訊部", // 假設後端有 Join department表 帶回名稱
                        statusName: "在職",      // 假設後端有 Join status表 帶回名稱
                        isActive: 1
                    }
                });
            }, 500);
        });
    };

    try {
        const response = await mockProfileApi();
        if(response.success === 1) {
            const data = response.data;
            document.getElementById('profile-name').innerText = data.name;
            document.getElementById('profile-dept').innerText = data.departmentName;
            document.getElementById('profile-points').innerText = Number(data.currentPoints).toLocaleString();
            document.getElementById('profile-email').innerText = data.email;
            document.getElementById('profile-hiredate').innerText = data.hireDate;
            document.getElementById('profile-id').innerText = `EMP-${data.employeeId}`;
            document.getElementById('profile-status').innerText = data.statusName;
        }
    } catch(e) {
        console.error(e);
    }
});