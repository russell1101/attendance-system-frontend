document.addEventListener("DOMContentLoaded", function () {

    let email = document.querySelector("#email");
    let password = document.querySelector("#password-input");
    let btn_login = document.querySelector("button.btn-success");
    let btn_password_addon = document.querySelector("#password-addon");

    btn_password_addon.addEventListener("click", function () {
        const isPassword = password.type === "password";
        password.type = isPassword ? "text" : "password";
        btn_password_addon.querySelector("i").className = isPassword
            ? "ri-eye-off-fill align-middle"
            : "ri-eye-fill align-middle";
    });

    btn_login.addEventListener("click", function () {
        if (!email.value) {
            alert("請輸入信箱");
            return;
        };
        if (!password.value) {
            alert("請輸入密碼");
            return;
        };
        let data = {
            email: email.value,
            passwordHash: password.value
        };
        fetch(APP_CONFIG.API_BASE_URL + "/frontUser/employee/login", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: "include", // set cookie進瀏覽器
            body: JSON.stringify(data)
        })
            .then(resp => resp.json())
            .then(result => {
                if (result.success == 1) {
                    if (result.errMsg) {
                        location.href = result.errMsg;
                    } else {
                        location.href = "./rci-front-clockin.html";
                    }
                } else {
                    alert("信箱或密碼錯誤");
                }
            })
            .catch(err => {
                console.log(err);
                alert("系統錯誤");
            })
    })
});