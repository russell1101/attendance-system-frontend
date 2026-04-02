document.addEventListener("DOMContentLoaded", function () {
    fetch(APP_CONFIG.API_BASE_URL + "/admin/manage")
        .then(resp => resp.json())
        .then(result => {
            if (result.success == 1) {
                const employees = result.data;
                const tbody = document.querySelector('tbody');
                employees.forEach((employee, index) => {
                    tbody.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${employee.employeeId}</td>
                        <td>${employee.departmentId}</td>
                        <td>${employee.name}</td>
                        <td>${employee.hireDate}</td>
                        <td>${employee.currentPoints}</td>
                        <td>${employee.employeeStatusId}</td>
                        <td><button class="btn btn-soft-secondary btn-sm dropdown" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="ri-more-fill align-middle"></i>
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
})