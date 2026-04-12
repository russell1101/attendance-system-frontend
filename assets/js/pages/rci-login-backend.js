document.addEventListener("DOMContentLoaded", function () {
    const float_end_btn = document.querySelector("div.float-end");
    float_end_btn.addEventListener("click", function () {
        alert("請聯絡後台");
    })

    let username = document.querySelector("#username");
    let password = document.querySelector("#password-input");
    let btn_login = document.querySelector("button.btn-success");

    btn_login.addEventListener("click", function () {
        if (!username.value) {
            alert("請輸入使用者名稱");
            return;
        };
        if (!password.value) {
            alert("請輸入密碼");
            return;
        };
        let data = {
            username: username.value,
            passwordHash: password.value
        };
        fetch(APP_CONFIG.API_BASE_URL + "/admin/login", {
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
                        if (result.errMsg.includes('front')) {
                            location.href = "./rci-echarts-back.html";
                        }
                        location.href = result.errMsg;
                    } else {
                        location.href = "./rci-echarts-back.html";
                    }
                } else {
                    console.log(result.errMsg);
                    alert("使⽤者名稱或密碼錯誤");
                }
            })
            .catch(err => {
                console.log(err);
                alert("系統錯誤");
            })
    })
});