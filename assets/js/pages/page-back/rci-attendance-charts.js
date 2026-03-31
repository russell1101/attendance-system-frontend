// rci-attendance-charts.js - 出勤管理圖表

// 儲存圖表實例
var chartInstances = {
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

    // 載入部門下拉選單
    loadDepartments();

    // 載入員工下拉選單
    loadEmployees(null);

    // 設定預設日期（當月）
    setDefaultDate();

    // 部門改變時，重新載入員工
    document.getElementById('departmentSelect').addEventListener('change', function() {
        var deptId = this.value;
        loadEmployees(deptId);
    });

    // 篩選按鈕切換（當月/3個月/半年）
    var filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            filterBtns.forEach(function(b) {
                b.classList.remove('active');
            });
            this.classList.add('active');

            var range = this.getAttribute('data-range');
            setDateRange(range);
        });
    });

    // 搜尋按鈕
    document.getElementById('searchBtn').addEventListener('click', function() {
        searchChart();
    });

    // 下載按鈕
    document.getElementById('downloadBtn').addEventListener('click', function() {
        downloadCsv();
    });

    // 防抖函式
    function debounce(func, wait) {
        var timeout;
        return function() {
            clearTimeout(timeout);
            timeout = setTimeout(func, wait);
        };
    }

    // 統一 resize 所有圖表
    function resizeAllCharts() {
        for (var key in chartInstances) {
            var chart = chartInstances[key];
            if (chart && !chart.isDisposed()) {
                chart.resize();
            }
        }
    }

    // 監聽視窗大小變化
    window.addEventListener('resize', debounce(resizeAllCharts, 150));

    // 監聽 sidebar 展開/收合
    var sidebar = document.getElementById('sidebar');
    if (sidebar) {
        var observer = new MutationObserver(debounce(resizeAllCharts, 300));
        observer.observe(sidebar, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    // 頁面完全載入後再 resize 一次
    window.addEventListener('load', function() {
        setTimeout(resizeAllCharts, 100);
    });
});

// ========== 設定日期 ==========

// 設定預設日期（當月）
function setDefaultDate() {
    setDateRange('month');
}

// 根據範圍設定日期
function setDateRange(range) {
    var today = new Date();
    var startDate = new Date();
    var endDate = new Date();

    if (range === 'month') {
        // 當月：月初到今天
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = today;
    } else if (range === '3months') {
        // 3個月前到今天
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        endDate = today;
    } else if (range === 'half') {
        // 半年前到今天
        startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
        endDate = today;
    }

    document.getElementById('startDate').value = formatDate(startDate);
    document.getElementById('endDate').value = formatDate(endDate);
}

// 日期格式化成 yyyy-MM-dd
function formatDate(date) {
    var year = date.getFullYear();
    var month = (date.getMonth() + 1).toString().padStart(2, '0');
    var day = date.getDate().toString().padStart(2, '0');
    return year + '-' + month + '-' + day;
}

// ========== 載入下拉選單 ==========

// 載入部門
function loadDepartments() {
    fetch('chart?action=getDepts')
        .then(function(res) {
            return res.json();
        })
        .then(function(data) {
            var select = document.getElementById('departmentSelect');
            select.innerHTML = '<option value="">全公司</option>';

            if (data && data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    var option = document.createElement('option');
                    option.value = data[i].departmentId;
                    option.textContent = data[i].departmentName;
                    select.appendChild(option);
                }
            }
        })
        .catch(function(err) {
            console.log('載入部門失敗:', err);
        });
}

// 載入員工
function loadEmployees(deptId) {
    var url = 'chart?action=getEmps';
    if (deptId) {
        url += '&deptId=' + deptId;
    }

    fetch(url)
        .then(function(res) {
            return res.json();
        })
        .then(function(data) {
            var select = document.getElementById('employeeSelect');
            select.innerHTML = '<option value="">全體員工</option>';

            if (data && data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    var option = document.createElement('option');
                    option.value = data[i].employeeId;
                    option.textContent = data[i].name;
                    select.appendChild(option);
                }
            }
        })
        .catch(function(err) {
            console.log('載入員工失敗:', err);
        });
}

// ========== 搜尋圖表 ==========

function searchChart() {
    var deptId = document.getElementById('departmentSelect').value;
    var empId = document.getElementById('employeeSelect').value;
    var startDate = document.getElementById('startDate').value;
    var endDate = document.getElementById('endDate').value;

    // 檢查日期
    if (!startDate || !endDate) {
        alert('請選擇日期範圍');
        return;
    }

    var url = 'chart?startDate=' + startDate + '&endDate=' + endDate;
    if (deptId) {
        url += '&deptId=' + deptId;
    }
    if (empId) {
        url += '&empId=' + empId;
    }

    fetch(url)
        .then(function(res) {
            return res.json();
        })
        .then(function(data) {
            console.log('圖表資料:', data);

            // 1. 更新圓餅圖
            updatePieChart(data.onTime, data.late, data.absent);

            // 2. 更新橫條圖
            if (data.deptName && data.lateCounts) {
                updateBarHorizontalChart(data.deptName, data.lateCounts);
            }

            // 3. 更新直條圖
            if (data.workingDates && data.workingHours) {
                updateBarVerticalChart(data.workingDates, data.workingHours);
            }

            // 4. 更新散佈圖
            if (data.checkInTimes && data.checkOutTimes) {
                var inData = [];
                var outData = [];
                for (var i = 0; i < data.checkInTimes.length; i++) {
                    inData.push([i + 1, timeToNumber(data.checkInTimes[i])]);
                }
                for (var i = 0; i < data.checkOutTimes.length; i++) {
                    outData.push([i + 1, timeToNumber(data.checkOutTimes[i])]);
                }
                updateScatterChart(inData, outData);
            }

            // 5. 更新統計
            updateStats(data.totalLateCounts, data.attendRate, data.noChecked);
        })
        .catch(function(err) {
            console.log('搜尋失敗:', err);
        });
}

// ========== 下載 CSV ==========

function downloadCsv() {
    var deptId = document.getElementById('departmentSelect').value;
    var empId = document.getElementById('employeeSelect').value;
    var startDate = document.getElementById('startDate').value;
    var endDate = document.getElementById('endDate').value;

    // 檢查日期
    if (!startDate || !endDate) {
        alert('請選擇日期範圍');
        return;
    }

    var url = 'chart?action=exportCsv&startDate=' + startDate + '&endDate=' + endDate;
    if (deptId) {
        url += '&deptId=' + deptId;
    }
    if (empId) {
        url += '&empId=' + empId;
    }

    // 直接跳轉下載
    window.location.href = url;
}

// ========== 時間轉換 ==========

// 時間字串轉數字 "09:15:00" → 9.25
function timeToNumber(timeStr) {
    if (!timeStr) return 0;
    var parts = timeStr.split(':');
    return parseInt(parts[0]) + parseInt(parts[1]) / 60;
}

// ========== 初始化圖表 ==========

// 1. 圓餅圖
function initPieChart() {
    var chartDom = document.getElementById('chartPie');
    var chart = echarts.init(chartDom);
    chartInstances.pie = chart;

    var option = {
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
                radius: ['40%', '70%'],
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
                    { value: 0, name: '準時' },
                    { value: 0, name: '遲到' },
                    { value: 0, name: '曠職' }
                ]
            }
        ]
    };

    chart.setOption(option);
}

// 2. 遲到排行（橫條圖）
function initBarHorizontalChart() {
    var chartDom = document.getElementById('chartBarHorizontal');
    var chart = echarts.init(chartDom);
    chartInstances.barHorizontal = chart;

    var option = {
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
            data: [],
            axisLabel: {
                fontSize: 12
            }
        },
        color: ['#00b8d9'],
        series: [
            {
                name: '遲到次數',
                type: 'bar',
                data: [],
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

// 3. 工時統計（直條圖）
function initBarVerticalChart() {
    var chartDom = document.getElementById('chartBarVertical');
    var chart = echarts.init(chartDom);
    chartInstances.barVertical = chart;

    var option = {
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
            data: [],
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
        series: [
            {
                name: '工時',
                type: 'bar',
                data: [],
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
                itemStyle: {
                    color: function(params) {
                        return params.value < 8 ? '#ffc107' : '#00b8d9';
                    },
                    borderRadius: [4, 4, 0, 0]
                }
            }
        ]
    };

    chart.setOption(option);
}

// 4. 打卡時間分佈（散佈圖）
function initScatterChart() {
    var chartDom = document.getElementById('chartScatter');
    var chart = echarts.init(chartDom);
    chartInstances.scatter = chart;

    var option = {
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                var day = params.value[0];
                var time = params.value[1];
                var hours = Math.floor(time);
                var minutes = Math.round((time - hours) * 60);
                return '第' + day + '天<br/>' + params.seriesName + ': ' + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
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
            max: 31,
            axisLabel: {
                formatter: function(value) {
                    return value > 0 ? value + '日' : '';
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
        series: [
            {
                name: '上班打卡',
                type: 'scatter',
                symbolSize: 10,
                data: [],
                itemStyle: {
                    color: '#00b8d9'
                },
                markLine: {
                    silent: true,
                    data: [
                        {
                            yAxis: 9,
                            lineStyle: { color: '#dc3545', type: 'dashed' },
                            label: { formatter: '上班 09:00', position: 'end' }
                        }
                    ]
                }
            },
            {
                name: '下班打卡',
                type: 'scatter',
                symbolSize: 10,
                data: [],
                itemStyle: {
                    color: '#28a745'
                },
                markLine: {
                    silent: true,
                    data: [
                        {
                            yAxis: 18,
                            lineStyle: { color: '#ffc107', type: 'dashed' },
                            label: { formatter: '下班 18:00', position: 'end' }
                        }
                    ]
                }
            }
        ]
    };

    chart.setOption(option);
}

// ========== 更新圖表 ==========

// 更新圓餅圖
function updatePieChart(onTime, late, absent) {
    var chart = chartInstances.pie;
    if (chart) {
        chart.setOption({
            series: [{
                data: [
                    { value: onTime || 0, name: '準時' },
                    { value: late || 0, name: '遲到' },
                    { value: absent || 0, name: '曠職' }
                ]
            }]
        });
    }
}

// 更新橫條圖
function updateBarHorizontalChart(departments, lateCounts) {
    var chart = chartInstances.barHorizontal;
    if (chart) {
        chart.setOption({
            yAxis: { data: departments || [] },
            series: [{ data: lateCounts || [] }]
        });
    }
}

// 更新直條圖
function updateBarVerticalChart(dates, hours) {
    var chart = chartInstances.barVertical;
    if (chart) {
        chart.setOption({
            xAxis: { data: dates || [] },
            series: [{ data: hours || [] }]
        });
    }
}

// 更新散佈圖
function updateScatterChart(punchInData, punchOutData) {
    var chart = chartInstances.scatter;
    if (chart) {
        chart.setOption({
            series: [
                { data: punchInData || [] },
                { data: punchOutData || [] }
            ]
        });
    }
}

// 更新統計數據
function updateStats(lateCount, attendanceRate, missingCount) {
    var lateEl = document.getElementById('statLateCount');
    var rateEl = document.getElementById('statAttendanceRate');
    var missingEl = document.getElementById('statMissingCount');

    if (lateEl) {
        lateEl.textContent = lateCount || 0;
    }
    if (rateEl) {
        var rate = attendanceRate || 0;
        rateEl.textContent = rate.toFixed(1) + '%';
    }
    if (missingEl) {
        missingEl.textContent = (missingCount || 0) + ' 人';
    }
}