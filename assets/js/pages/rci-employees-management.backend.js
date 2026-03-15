document.addEventListener("DOMContentLoaded", function () {
    new gridjs.Grid({
        columns: ['編號', '員號', '部門', '姓名', '入職日', '紅利點數'],
        sort: !0,    // 排序
        pagination: { limit: 5 }, // 分頁
        data: [
            ['1', '001', '工程部', '王曉明', '2026/1/25', '2000'],
            ['2', '002', '業務部', '李小花', '2025/6/10', '1000'],
        ],
        language: {                     // 框架文字中文設定
            'pagination': {
                'previous': '上一頁',
                'next': '下一頁',
                'showing': '顯示',
                'to': '至',
                'of': '共',
                'results': '筆紀錄'
            }
        }
    }).render(document.getElementById('table-hidden-column'));
})