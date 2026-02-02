// rci-attendance-charts.js - 出勤管理圖表初始化

// 儲存圖表實例
let chartInstances = {
    pie: null,
    barHorizontal: null,
    barVertical: null,
    scatter: null
};

document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有圖表
    initPieChart();
    initBarHorizontalChart();
    initBarVerticalChart();
    initScatterChart();

    // 防抖函式
    function debounce(func, wait) {
        let timeout;
        return function() {
            clearTimeout(timeout);
            timeout = setTimeout(func, wait);
        };
    }

    // 統一 resize 所有圖表
    function resizeAllCharts() {
        Object.values(chartInstances).forEach(chart => {
            if (chart && !chart.isDisposed()) {
                chart.resize();
            }
        });
    }

    // 監聽視窗大小變化（加入防抖，避免頻繁觸發）
    window.addEventListener('resize', debounce(resizeAllCharts, 150));

    // 監聽 sidebar 展開/收合（如果有的話）
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        const observer = new MutationObserver(debounce(resizeAllCharts, 300));
        observer.observe(sidebar, { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
    }

    // 頁面完全載入後再 resize 一次，確保尺寸正確
    window.addEventListener('load', function() {
        setTimeout(resizeAllCharts, 100);
    });

    // 篩選按鈕切換
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            // TODO: 根據選擇的範圍重新載入資料
        });
    });
});

// === 1. 出勤狀態圓餅圖 ===
function initPieChart() {
    const chartDom = document.getElementById('chartPie');
    const chart = echarts.init(chartDom);
    chartInstances.pie = chart; // 儲存實例

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'horizontal',
            bottom: '5%',
            data: ['準時', '遲到', '曠職']
        },
        color: ['#00b8d9', '#ffc107', '#dc3545'],
        series: [
            {
                name: '出勤狀態',
                type: 'pie',
                radius: ['40%', '70%'], // 環形圖
                center: ['50%', '45%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 4,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: [
                    { value: 850, name: '準時' },
                    { value: 85, name: '遲到' },
                    { value: 15, name: '曠職' }
                ]
            }
        ]
    };

    chart.setOption(option);
}

// === 2. 部門/人員遲到排行 (Horizontal Bar) ===
function initBarHorizontalChart() {
    const chartDom = document.getElementById('chartBarHorizontal');
    const chart = echarts.init(chartDom);
    chartInstances.barHorizontal = chart; // 儲存實例

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '8%',
            bottom: '3%',
            top: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: '遲到次數',
            nameLocation: 'end'
        },
        yAxis: {
            type: 'category',
            data: ['人資部', '財務部', '行銷部', '業務部', '研發部'],
            axisLabel: {
                fontSize: 12
            }
        },
        color: ['#00b8d9'],
        series: [
            {
                name: '遲到次數',
                type: 'bar',
                data: [8, 12, 15, 22, 28],
                itemStyle: {
                    borderRadius: [0, 4, 4, 0]
                },
                label: {
                    show: true,
                    position: 'right',
                    formatter: '{c} 次'
                }
            }
        ]
    };

    chart.setOption(option);
}

// === 3. 工時統計圖 (Vertical Bar) ===
function initBarVerticalChart() {
    const chartDom = document.getElementById('chartBarVertical');
    const chart = echarts.init(chartDom);
    chartInstances.barVertical = chart; // 儲存實例

    // 模擬一個月的工時資料
    const dates = [];
    const workHours = [];
    for (let i = 1; i <= 22; i++) {
        dates.push(`11/${i.toString().padStart(2, '0')}`);
        // 隨機產生 4-12 小時的工時
        workHours.push((Math.random() * 4 + 6).toFixed(1));
    }

    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: '{b}<br/>工時: {c} 小時'
        },
        grid: {
            left: '3%',
            right: '10%',
            bottom: '12%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates,
            axisLabel: {
                rotate: 45,
                fontSize: 10
            }
        },
        yAxis: {
            type: 'value',
            name: '工時 (小時)',
            min: 0,
            max: 14,
            axisLabel: {
                formatter: '{value}h'
            }
        },
        // 標準工時線
        markLine: {
            silent: true,
            data: [
                {
                    yAxis: 8,
                    lineStyle: { color: '#ffc107', type: 'dashed' },
                    label: { formatter: '標準 8h' }
                }
            ]
        },
        series: [
            {
                name: '工時',
                type: 'bar',
                data: workHours,
                itemStyle: {
                    color: function(params) {
                        // 低於 8 小時用不同顏色
                        return params.value < 8 ? '#ffc107' : '#00b8d9';
                    },
                    borderRadius: [4, 4, 0, 0]
                }
            }
        ]
    };

    chart.setOption(option);
}

// === 4. 打卡時間分佈圖 (Scatter) ===
function initScatterChart() {
    const chartDom = document.getElementById('chartScatter');
    const chart = echarts.init(chartDom);
    chartInstances.scatter = chart; // 儲存實例

    // 模擬打卡時間資料 [日期index, 時間(小數)]
    const punchInData = [];  // 上班打卡
    const punchOutData = []; // 下班打卡

    for (let day = 1; day <= 22; day++) {
        // 上班時間 8:30-9:30 之間
        const inTime = 8.5 + Math.random() * 1;
        punchInData.push([day, inTime]);
        
        // 下班時間 17:30-20:00 之間
        const outTime = 17.5 + Math.random() * 2.5;
        punchOutData.push([day, outTime]);
    }

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                const day = params.value[0];
                const time = params.value[1];
                const hours = Math.floor(time);
                const minutes = Math.round((time - hours) * 60);
                return `11/${day.toString().padStart(2, '0')}<br/>${params.seriesName}: ${hours}:${minutes.toString().padStart(2, '0')}`;
            }
        },
        legend: {
            data: ['上班打卡', '下班打卡'],
            top: '0%',
            right: '5%'
        },
        grid: {
            left: '8%',
            right: '20%',
            bottom: '15%',
            top: '20%'
        },
        xAxis: {
            type: 'value',
            name: '日期',
            min: 0,
            max: 23,
            axisLabel: {
                formatter: function(value) {
                    return value > 0 ? `11/${value}` : '';
                }
            }
        },
        yAxis: {
            type: 'value',
            name: '時間',
            min: 7,
            max: 21,
            axisLabel: {
                formatter: function(value) {
                    return value + ':00';
                }
            }
        },
        // 標準上下班時間線
        series: [
            {
                name: '上班打卡',
                type: 'scatter',
                symbolSize: 10,
                data: punchInData,
                itemStyle: {
                    color: '#00b8d9'
                },
                markLine: {
                    silent: true,
                    data: [
                        {
                            yAxis: 9,
                            lineStyle: { color: '#dc3545', type: 'dashed' },
                            label: { formatter: '上班標準線 09:00', position: 'end' }
                        }
                    ]
                }
            },
            {
                name: '下班打卡',
                type: 'scatter',
                symbolSize: 10,
                data: punchOutData,
                itemStyle: {
                    color: '#28a745'
                },
                markLine: {
                    silent: true,
                    data: [
                        {
                            yAxis: 18,
                            lineStyle: { color: '#ffc107', type: 'dashed' },
                            label: { formatter: '下班標準線 18:00', position: 'end' }
                        }
                    ]
                }
            }
        ]
    };

    chart.setOption(option);
}

// === 更新圖表資料的函式 (供後端呼叫) ===
function updatePieChart(onTime, late, absent) {
    const chart = echarts.getInstanceByDom(document.getElementById('chartPie'));
    if (chart) {
        chart.setOption({
            series: [{
                data: [
                    { value: onTime, name: '準時' },
                    { value: late, name: '遲到' },
                    { value: absent, name: '曠職' }
                ]
            }]
        });
    }
}

function updateBarHorizontalChart(departments, lateCounts) {
    const chart = echarts.getInstanceByDom(document.getElementById('chartBarHorizontal'));
    if (chart) {
        chart.setOption({
            yAxis: { data: departments },
            series: [{ data: lateCounts }]
        });
    }
}

function updateBarVerticalChart(dates, hours) {
    const chart = echarts.getInstanceByDom(document.getElementById('chartBarVertical'));
    if (chart) {
        chart.setOption({
            xAxis: { data: dates },
            series: [{ data: hours }]
        });
    }
}

function updateScatterChart(punchInData, punchOutData) {
    const chart = echarts.getInstanceByDom(document.getElementById('chartScatter'));
    if (chart) {
        chart.setOption({
            series: [
                { data: punchInData },
                { data: punchOutData }
            ]
        });
    }
}

// 更新統計數據
function updateStats(lateCount, attendanceRate, missingCount) {
    document.getElementById('statLateCount').textContent = lateCount;
    document.getElementById('statAttendanceRate').textContent = attendanceRate + '%';
    document.getElementById('statMissingCount').textContent = missingCount + ' 人';
}