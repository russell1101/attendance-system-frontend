document.addEventListener("DOMContentLoaded", function () {
    // 讀取全資料
    fetch(APP_CONFIG.API_BASE_URL + "/admin/dep/manage", {
        credentials: "include", // set cookie進瀏覽器
    })
        .then(resp => resp.json())
        .then(result => {
            if (result.success == 1) {
                const departments = result.data;
                const tbody = document.querySelector('tbody');
                departments.forEach((department, index) => {
                    tbody.innerHTML += `
                    <tr data-id="${department.departmentId}" data-name="${department.departmentName}">
                        <td>${index + 1}</td>
                        <td>${department.departmentId}</td>
                        <td>${department.departmentName}</td>
                        <td>
                            <p class="para ">${department.workStartTime}</p>
                            <div class="reveal -none">
                                <input type="time" step="1" class="form-control update-workTime" placeholder="請選擇上班時間" value="${department.workStartTime}">
                            </div>
                        </td>
                        <td>
                            <p class="para ">${department.workEndTime}</p>
                            <div class="reveal -none">
                                <input type="time" step="1" class="form-control update-leaveTime" placeholder="請選擇下班時間" value="${department.workEndTime}">
                            </div>
                        </td>
                        <td>
                            <p class="para ">${department?.onTimeBonusPoints || "未設定"}</p>
                            <div class="reveal -none">
                                <input type="number" class="form-control update-onTimeAdd" placeholder="請輸入增加點數" value="${department.onTimeBonusPoints}">
                            </div>
                        </td>
                        <td>
                            <p class="para ">${department?.latePenaltyPoints || "未設定"}</p>
                            <div class="reveal -none">
                                <input type="number" class="form-control update-lateTimeMinus" placeholder="請輸入減少點數" value="${department.latePenaltyPoints}">
                            </div>
                        </td>
                        <td>
                            <button class="btn btn-soft-secondary btn-sm dropdown para update" type="button"  aria-expanded="false">
                                <i class="ri-pencil-fill align-middle"></i>
                            </button>
                            <div class="reveal -none">
                                <button class="btn btn-soft-secondary btn-sm dropdown update-save" type="button"  aria-expanded="false">
                                    <i class="ri-save-fill align-middle"></i>
                                </button>
                            </div>
                        </td>
                        <td><button class="btn btn-soft-secondary btn-sm dropdown remove" type="button"  aria-expanded="false">
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

    // 新增部門
    const btn_add = document.querySelector("#create-btn");
    btn_add.addEventListener("click", function () {
        const add_name = document.querySelector("#name-field");
        const add_workTime = document.querySelector("#workTime-field");
        const add_leaveTime = document.querySelector("#leaveTime-field");
        const add_onTimeAdd = document.querySelector("#onTimeAdd-field");
        const add_lateTimeMinus = document.querySelector("#lateTimeMinus-field");
        const btn_save = document.querySelector("#add-btn");
        const add_form = document.querySelector("#form"); // 表單區塊

        if (add_form) {
            btn_save.addEventListener("click", function () {
                fetch(APP_CONFIG.API_BASE_URL + '/admin/dep/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: "include", // set cookie進瀏覽器
                    body: JSON.stringify({
                        departmentName: add_name.value,
                        workStartTime: add_workTime.value,
                        workEndTime: add_leaveTime.value,
                        onTimeBonusPoints: add_onTimeAdd.value,
                        latePenaltyPoints: add_lateTimeMinus.value,
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

    // 刪除部門
    document.addEventListener("click", function (e) {
        const btn_delete = e.target.closest("button.remove");
        if (btn_delete) {
            let result = confirm("是否要移除");
            if (result) {
                const tr = btn_delete.closest("tr");
                const departmentId = tr.getAttribute("data-id");
                fetch(APP_CONFIG.API_BASE_URL + '/admin/dep/remove', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: "include", // set cookie進瀏覽器
                    body: JSON.stringify({ departmentId: departmentId })
                })
                    .then(resp => resp.json())
                    .then(result => {
                        if (result.success == 1) {
                            alert("刪除成功");
                            location.reload();
                        } else {
                            alert(result.errMsg);
                            location.reload();
                        }
                    });
            }
        }
    });

    // 更新部門設定
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

                const update_name = tr_el.getAttribute("data-name");
                const update_workTime = tr_el.querySelector(".update-workTime");
                const update_leaveTime = tr_el.querySelector(".update-leaveTime");
                const update_onTimeAdd = tr_el.querySelector(".update-onTimeAdd");
                const update_lateTimeMinus = tr_el.querySelector(".update-lateTimeMinus");

                fetch(APP_CONFIG.API_BASE_URL + '/admin/dep/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: "include", // set cookie進瀏覽器
                    body: JSON.stringify({
                        departmentId: update_id,
                        departmentName: update_name,
                        workStartTime: update_workTime.value,
                        workEndTime: update_leaveTime.value,
                        onTimeBonusPoints: update_onTimeAdd.value,
                        latePenaltyPoints: update_lateTimeMinus.value,
                        isActive: true
                    })
                })
                    .then(resp => resp.json())
                    .then(result => {
                        if (result.success == 1) {
                            alert("更新成功");
                            location.reload();
                        } else {
                            alert('更新失敗');
                            // location.reload();
                        }
                    });
            } else {
                location.reload();
            }
        }
    });
})