document.addEventListener("DOMContentLoaded", function () {
    new gridjs.Grid({
        columns: ['部門', '上班時間', '下班時間', '工時', '準時獎勵點數', '遲到扣點'],
        sort: !0,    // 排序
        pagination: { limit: 5 }, // 分頁
        data: [
            ['工程部', '0900', '1700', '8', '30', '30'],
            ['業務部', '0800', '1600', '8', '30', '30'],
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