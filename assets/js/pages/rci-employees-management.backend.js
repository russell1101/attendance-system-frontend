document.addEventListener("DOMContentLoaded", function () {
    // 部門選項袋子
    let allDepartments = [];

    // 讀取全資料
    function formatDate(timestamp) {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const options = {
            year: 'numeric',    // 年: 使用4位數
            month: '2-digit',   // 月: 使用2數位
            day: '2-digit',     // 日: 使用2數位
            hour12: false,      // 12小時制: 不使用
            hour: '2-digit',    // 時: 使用2數位
            minute: '2-digit',  // 分: 使用2數位
            second: '2-digit'   // 秒: 使用2數位
        };
        return new Intl.DateTimeFormat('zh-TW', options).format(date);
    }

    // 獲得部門選項
    fetch(APP_CONFIG.API_BASE_URL + "/admin/dep/depOptions", {
        credentials: "include", // set cookie進瀏覽器
    })
        .then(resp => resp.json())
        .then(result => {
            if (result.success == 1) {
                allDepartments = result.data;
            }
        })

    fetch(APP_CONFIG.API_BASE_URL + "/admin/emp/manage", {
        credentials: "include", // set cookie進瀏覽器
    })
        .then(resp => resp.json())
        .then(result => {
            if (result.success == 1) {
                const employees = result.data;
                const tbody = document.querySelector('tbody');
                employees.forEach((employee, index) => {
                    tbody.innerHTML += `
                    <tr data-id="${employee.employeeId}" data-hiredate="${employee.hireDate}">
                        <td>${index + 1}</td>
                        <td>${employee.employeeId}</td>
                        <td>
                            <p class="para ">${employee.departmentName}</p>
                            <div class="reveal -none">
                                <select name="department" class="form-select update-department">
                                <option value="${employee.departmentId}" selected>${employee.departmentName}</option>
                                ${allDepartments
                            .filter(dep => dep.departmentId !== employee.departmentId)
                            .map((dep, index) => `<option value="${dep.departmentId}">${dep.departmentName}</option>`)
                            .join("") // 去除陣列中,
                        }
                                </select>
                            </div>
                        </td>
                        <td>
                            <p class="para ">${employee.name}</p>
                            <div class="reveal -none">
                                <input type="text" class="form-control update-name" placeholder="請輸入姓名" value="${employee.name}">
                            </div>
                        </td>
                        <td>
                            <p class="para ">${employee.email}</p>
                            <div class="reveal -none">
                                <input type="text" class="form-control update-email" placeholder="請輸入信箱" value="${employee.email}">
                            </div>
                        </td>
                        <td>${formatDate(employee.hireDate)}</td>
                        <td>
                            <p class="para ">${employee.currentPoints}</p>
                            <div class="reveal -none">
                                <input type="text" class="form-control update-points" placeholder="請輸入紅利點數" value="${employee.currentPoints}">
                            </div>
                        </td>
                        <td>
                            <p class="para ">${employee.employeeStatus}</p>
                            <div class="reveal -none">
                                <select name="status" class="form-select update-status">
                                <option value="${employee.employeeStatusId}" selected>${employee.employeeStatus}</option>
                                ${employee.employeeStatusId != 1 ? `<option value="1">在職</option>` : ''}
                                ${employee.employeeStatusId != 2 ? `<option value="2">離職</option>` : ''}
                            </select>
                            </div>
                        </td>
                        <td>
                            <button class="btn btn-soft-secondary btn-sm dropdown para update" type="button" aria-expanded="false">
                                <i class="ri-pencil-fill align-middle"></i>
                            </button>
                            <div class="reveal -none">
                                <button class="btn btn-soft-secondary btn-sm dropdown update-save" type="button" aria-expanded="false">
                                    <i class="ri-save-fill align-middle"></i>
                                </button>
                            </div>
                        </td>
                        <td><button class="btn btn-soft-secondary btn-sm dropdown remove" type="button" aria-expanded="false">
                                    <i class="ri-delete-bin-2-line align-middle"></i>
                                </button></td>
                    </tr>
                    `
                })
            } else {
                alert("資料讀取失敗");
            }
        })
        .catch(err => {
            console.log(err);
            alert("系統錯誤");
        })

    // 新增員工
    const btn_add = document.querySelector("#create-btn");
    btn_add.addEventListener("click", function () {
        const add_name = document.querySelector("#name-field");
        const add_department = document.querySelector("#department-field");
        const add_email = document.querySelector("#email-field");
        const add_points = document.querySelector("#points-field");
        const add_hireDate = document.querySelector("#joinDate-field");
        const add_status = document.querySelector("#status-field");
        const btn_save = document.querySelector("#add-btn");
        const add_form = document.querySelector("#form"); // 表單區塊

        if (add_form) {
            let str = ``;
            add_department.innerHTML = `
                <option value="" selected>請選擇部門</option>
                ${allDepartments
                    .map((dep, index) => `<option value="${dep.departmentId}">${dep.departmentName}</option>`)
                    .join("") // 去除陣列中,
                }
            `
            btn_save.addEventListener("click", function () {
                btn_save.classList.add("disabled");
                fetch(APP_CONFIG.API_BASE_URL + '/admin/emp/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: "include", // set cookie進瀏覽器
                    body: JSON.stringify({
                        name: add_name.value,
                        departmentId: add_department.value,
                        email: add_email.value,
                        currentPoints: add_points.value,
                        hireDate: add_hireDate.value,
                        employeeStatusId: add_status.value,
                        isActive: true
                    })
                })
                    .then(resp => resp.json())
                    .then(result => {
                        if (result.success == 1) {
                            alert('新增成功!');
                            location.reload();
                        } else {
                            alert('新增失敗');
                        }
                    });
            })
        }
    })

    // 刪除員工
    document.addEventListener("click", function (e) {
        const btn_delete = e.target.closest("button.remove");
        if (btn_delete) {
            let result = confirm("是否要移除");
            if (result) {
                const tr = btn_delete.closest("tr");
                const employeeId = tr.getAttribute("data-id");
                fetch(APP_CONFIG.API_BASE_URL + '/admin/emp/remove', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: "include", // set cookie進瀏覽器
                    body: JSON.stringify({ employeeId: employeeId })
                })
                    .then(resp => resp.json())
                    .then(result => {
                        if (result.success == 1) {
                            alert("刪除成功");
                            location.reload();
                        } else {
                            alert('刪除失敗');
                        }
                    });
            }
        }
    });

    // 更新員工資料
    document.addEventListener("click", function (e) {
        const btn_update = e.target.closest("button.update");
        if (btn_update) {
            let tr_el = e.target.closest("tr");
            let p_els = tr_el.querySelectorAll(".para");
            p_els.forEach(e => {
                e.classList.add("-none");
            });
            let div_els = tr_el.querySelectorAll(".reveal");
            div_els.forEach(e => {
                e.classList.remove("-none");
            });
        }
    });

    document.addEventListener("click", function (e) {
        const btn_update_save = e.target.closest("button.update-save");
        if (btn_update_save) {
            let result = confirm("是否要更新資料");
            if (result) {
                let tr_el = e.target.closest("tr");
                const update_id = tr_el.getAttribute("data-id");
                let update_hireDate = tr_el.getAttribute("data-hiredate");
                // 將數字字串轉回日期格式
                update_hireDate = new Date(Number(update_hireDate));
                const update_department = tr_el.querySelector(".update-department");
                const update_name = tr_el.querySelector(".update-name");
                const update_email = tr_el.querySelector(".update-email");
                const update_points = tr_el.querySelector(".update-points");
                const update_status = tr_el.querySelector(".update-status");

                fetch(APP_CONFIG.API_BASE_URL + '/admin/emp/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: "include", // set cookie進瀏覽器
                    body: JSON.stringify({
                        employeeId: update_id,
                        departmentId: update_department.value,
                        name: update_name.value,
                        email: update_email.value,
                        currentPoints: update_points.value,
                        employeeStatusId: update_status.value,
                        isActive: true,
                        hireDate: update_hireDate
                    })
                })
                    .then(resp => resp.json())
                    .then(result => {
                        if (result.success == 1) {
                            alert("更新成功");
                            location.reload();
                        } else {
                            alert('更新失敗');
                            location.reload();
                        }
                    });
            } else {
                location.reload();
            }
        }
    });
})