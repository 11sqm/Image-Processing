// 获取元素
const form = document.getElementById('attendance-form');
const nameInput = document.getElementById('name');
const list = document.getElementById('attendance-list');
const ctx = document.getElementById('attendance-chart').getContext('2d');
const csvFile = document.getElementById('csv-file');
const loadCsvBtn = document.getElementById('load-csv');
const classInfo = document.getElementById('class-info');
const rateDisplay = document.getElementById('rate-display');
const toggleChartBtn = document.getElementById('toggle-chart');
const clearTodayBtn = document.getElementById('clear-today');

// 全局变量
let chart;
let classList = JSON.parse(localStorage.getItem('classList')) || []; // 班级名单
let attendanceData = JSON.parse(localStorage.getItem('attendance')) || []; // 签到数据
let chartType = 'count'; // 'count' 或 'rate'

// 加载CSV名单
loadCsvBtn.addEventListener('click', () => {
    const file = csvFile.files[0];
    if (file) {
        Papa.parse(file, {
            complete: (results) => {
                classList = results.data.flat().filter(name => name && name.trim()); // 假设单列CSV
                localStorage.setItem('classList', JSON.stringify(classList));
                updateClassInfo();
                updateAttendanceRate();
                drawChart();
                alert('名单加载成功！');
            },
            header: false,
            skipEmptyLines: true
        });
    } else {
        alert('请选择CSV文件！');
    }
});

// 更新班级信息
function updateClassInfo() {
    classInfo.textContent = `班级总人数: ${classList.length}`;
}

// 计算当天出勤率
function updateAttendanceRate() {
    const today = new Date().toDateString();
    const todayAttendance = attendanceData.filter(item => new Date(item.time).toDateString() === today);
    const uniqueToday = [...new Set(todayAttendance.map(item => item.name))]; // 去重
    const rate = classList.length > 0 ? (uniqueToday.length / classList.length * 100).toFixed(1) : 0;
    rateDisplay.textContent = `出勤率: ${rate}% (${uniqueToday.length}/${classList.length})`;
}

// 显示签到列表
function displayList() {
    list.innerHTML = '';
    attendanceData.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.name} - ${new Date(item.time).toLocaleString()}`;
        list.appendChild(li);
    });
}

// 绘制/更新图表
function drawChart() {
    const dateStats = {};
    attendanceData.forEach(item => {
        const date = new Date(item.time).toDateString();
        if (!dateStats[date]) dateStats[date] = { count: 0, unique: new Set() };
        dateStats[date].count++;
        dateStats[date].unique.add(item.name);
    });

    const labels = Object.keys(dateStats);
    let data;
    let label;
    let maxY;
    if (chartType === 'count') {
        data = labels.map(date => dateStats[date].count);
        label = '签到人数';
        maxY = classList.length || 10; // 班级总人数，或默认10
    } else {
        data = labels.map(date => classList.length > 0 ? (dateStats[date].unique.size / classList.length * 100).toFixed(1) : 0);
        label = '出勤率 (%)';
        maxY = 100; // 出勤率最大100%
    }

    if (chart) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.data.datasets[0].label = label;
        chart.options.scales.y.max = maxY; // 更新Y轴最大值
        chart.update();
    } else {
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: maxY // 设置Y轴最大值
                    }
                }
            }
        });
    }
}

// 图表切换
toggleChartBtn.addEventListener('click', () => {
    chartType = chartType === 'count' ? 'rate' : 'count';
    toggleChartBtn.textContent = chartType === 'count' ? '切换到出勤率图表' : '切换到人数图表';
    drawChart();
});

// 表单提交事件（防止重复签到）
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;

    // 检查是否在班级名单中
    if (!classList.includes(name)) {
        alert('该姓名不在班级名单中！');
        return;
    }

    // 检查当天是否已签到
    const today = new Date().toDateString();
    const alreadySigned = attendanceData.some(item => item.name === name && new Date(item.time).toDateString() === today);
    if (alreadySigned) {
        alert('您今天已签到！');
        return;
    }

    const now = new Date().toISOString();
    attendanceData.push({ name, time: now });
    localStorage.setItem('attendance', JSON.stringify(attendanceData));
    nameInput.value = '';
    displayList();
    updateAttendanceRate();
    drawChart();
});

// 清空当天签到记录
clearTodayBtn.addEventListener('click', () => {
    const today = new Date().toDateString();
    // 过滤掉当天的记录
    attendanceData = attendanceData.filter(item => new Date(item.time).toDateString() !== today);
    localStorage.setItem('attendance', JSON.stringify(attendanceData));
    displayList();
    updateAttendanceRate();
    drawChart();
    alert('当天签到记录已清空！');
});

// 初始化
updateClassInfo();
displayList();
updateAttendanceRate();
drawChart();