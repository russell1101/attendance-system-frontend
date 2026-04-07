document.addEventListener("DOMContentLoaded", function () {
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
    fetch(APP_CONFIG.API_BASE_URL + "/admin/employeeManage", {
        credentials: "include", // set cookie進瀏覽器
    })
        .then(resp => resp.json())
        .then(result => {
            if (result.success == 1) {
                const employees = result.data;
                const tbody = document.querySelector('tbody');
                employees.forEach((employee, index) => {
                    tbody.innerHTML += `
                    <tr data-id="${employee.employeeId}">
                        <td>${index + 1}</td>
                        <td>${employee.employeeId}</td>
                        <td>
                            <p class="para ">${employee.departmentName}</p>
                            <select id="title-field update-department" name="title" class="form-control allUpdate -none" required />
                            <option value="" selected>請選擇部門</option>
                            <option value="1">研發部</option>
                            <option value="2">人事部</option>
                            <option value="3">工程部</option>
                            </select>
                        </td>
                        <td>
                            <p class="para ">${employee.name}</p>
                            <input type="text" id="update-name" class="allUpdate -none" placeholder="請輸入姓名" value="${employee.name}">
                        </td>
                        <td>${formatDate(employee.hireDate)}</td>
                        <td>
                            <p class="para ">${employee.currentPoints}</p>
                            <input type="text" class="allUpdate -none" placeholder="請輸入紅利點數" value="${employee.currentPoints}">
                        </td>
                        <td>
                            <p class="para ">${employee.employeeStatus}</p>
                            <select id="title-field update-status" name="title" class="form-control allUpdate -none" required />
                            <option value="" selected>請選擇狀態</option>
                            <option value="1">在職</option>
                            <option value="2">離職</option>
                            </select>
                        </td>
                        <td><button class="btn btn-soft-secondary btn-sm dropdown update" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="ri-pencil-fill align-middle"></i>
                                </button></td>
                        <td><button class="btn btn-soft-secondary btn-sm dropdown remove" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="ri-delete-bin-2-line align-middle"></i>
                                </button></td>
                    </tr>
                    `

                })

            } else {
                console.log(result.errMsg);
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
        const add_department = document.querySelector("#title-field");
        const add_email = document.querySelector("#email-field");
        const add_points = document.querySelector("#phone-field");
        const add_hireDate = document.querySelector("#joinDate-field");
        const add_status = document.querySelector("#department-field");
        const btn_save = document.querySelector("#add-btn");
        const add_form = document.querySelector("#form");

        if (add_form) {
            btn_save.addEventListener("click", function () {
                fetch(APP_CONFIG.API_BASE_URL + '/admin/save', {
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
                fetch(APP_CONFIG.API_BASE_URL + '/admin/remove', {
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
            const tr_el = e.target.closest("tr");
            let result = confirm("是否要異動資料");
            if (result) {
                let p_els = tr_el.
                    querySelectorAll("p.para");
                let allUpdate_els = tr_el.querySelectorAll(".allUpdate");
                p_els.classname.add(".-none");
                allUpdate_els.toggle(".-none");

                const employeeId = tr_el.getAttribute("data-id");
                const update_departmaent = tr_el.querySelector("#update-department");
                const update_name = tr_el.querySelector("#update-name");
                const update_status = tr_el.querySelector("#update-status");

                fetch(APP_CONFIG.API_BASE_URL + '/admin/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: "include", // set cookie進瀏覽器
                    body: JSON.stringify({
                        employeeId: employeeId,
                        departmentId: update_departmaent.value,
                        name: update_name.value,
                        employeeStatusId: update_status.value
                    })
                })
                    .then(resp => resp.json())
                    .then(result => {
                        if (result.success == 1) {
                            alert("更新成功");
                            location.reload();
                        } else {
                            alert('更新失敗');
                        }
                    });
            }
        }
    });






})