const fs = require('fs');

// 读取CSV
const csvText = fs.readFileSync('销售数据素材.csv', 'utf-8');
const lines = csvText.split('\n').filter(l => l.trim());
const headers = lines[0].split(',').map(h => h.trim());

const data = [];
for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < headers.length) continue;
    const row = {};
    headers.forEach((h, idx) => {
        row[h] = values[idx] ? values[idx].trim() : '';
    });
    row['销售额'] = parseFloat(row['销售额']) || 0;
    row['利润'] = parseFloat(row['利润']) || 0;
    row['数量'] = parseInt(row['数量']) || 0;
    row['折扣率'] = parseFloat(row['折扣率']) || 0;
    row['利润率'] = parseFloat(row['利润率']) || 0;
    row['单价'] = parseFloat(row['单价']) || 0;
    row['年份'] = row['订单日期'] ? row['订单日期'].substring(0, 4) : '';
    row['年月'] = row['订单日期'] ? row['订单日期'].substring(0, 7) : '';
    data.push(row);
}

console.log(`处理了 ${data.length} 条数据`);

const dataJson = JSON.stringify(data);

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>电商销售数据分析看板</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif;
            background: #f0f4f8;
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1600px; margin: 0 auto; }
        .header {
            text-align: center;
            color: #1e40af;
            margin-bottom: 20px;
            padding: 25px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            border-top: 4px solid #1e40af;
        }
        .header h1 { font-size: 28px; margin-bottom: 8px; }
        .header p { color: #64748b; font-size: 14px; }
        .filter-bar {
            background: white;
            border-radius: 12px;
            padding: 15px 25px;
            margin-bottom: 20px;
            display: flex;
            gap: 20px;
            align-items: center;
            flex-wrap: wrap;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .filter-item { display: flex; align-items: center; gap: 8px; }
        .filter-item label { font-weight: 600; color: #334155; font-size: 14px; }
        .filter-item select {
            padding: 8px 15px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            outline: none;
        }
        .filter-item select:hover { border-color: #3b82f6; }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            margin: 25px 0 15px 0;
            padding-left: 12px;
            border-left: 4px solid #3b82f6;
        }
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 20px;
        }
        .kpi-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            border-left: 4px solid #3b82f6;
        }
        .kpi-label { font-size: 13px; color: #64748b; margin-bottom: 8px; }
        .kpi-value { font-size: 26px; font-weight: bold; color: #1e293b; }
        .kpi-growth { font-size: 12px; margin-top: 8px; padding: 3px 8px; border-radius: 4px; display: inline-block; }
        .kpi-growth.up { background: #dcfce7; color: #166534; }
        .kpi-growth.down { background: #fee2e2; color: #991b1b; }
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 20px;
        }
        .chart-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .chart-card.full { grid-column: span 2; }
        .chart-title {
            font-size: 15px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 15px;
        }
        .chart { width: 100%; height: 320px; }
        .chart.tall { height: 380px; }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        table th, table td {
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        table th {
            background: #f8fafc;
            font-weight: 600;
            color: #475569;
        }
        table tr:hover { background: #f1f5f9; }
        .rank {
            display: inline-block;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            text-align: center;
            line-height: 24px;
            color: white;
            font-weight: bold;
            font-size: 12px;
            background: #94a3b8;
        }
        .rank-1 { background: #eab308; }
        .rank-2 { background: #94a3b8; }
        .rank-3 { background: #ea580c; }
        @media (max-width: 1200px) {
            .kpi-grid { grid-template-columns: repeat(2, 1fr); }
            .charts-grid { grid-template-columns: 1fr; }
            .chart-card.full { grid-column: span 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 电商销售数据分析看板</h1>
            <p>数据周期：2024年1月 - 2025年12月 | 共${data.length}条订单记录</p>
        </div>

        <div class="filter-bar">
            <div class="filter-item">
                <label>📅 年份：</label>
                <select id="yearFilter">
                    <option value="all">全部</option>
                    <option value="2024">2024年</option>
                    <option value="2025">2025年</option>
                </select>
            </div>
            <div style="margin-left:auto; font-size:13px; color:#64748b;">💡 本地自包含版本，双击即可打开使用</div>
        </div>

        <div class="section-title">📊 核心KPI概览</div>
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">💰 总销售额</div>
                <div class="kpi-value" id="kpiSales">-</div>
                <div class="kpi-growth" id="kpiSalesGrowth">-</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">📈 总利润</div>
                <div class="kpi-value" id="kpiProfit">-</div>
                <div class="kpi-growth" id="kpiProfitGrowth">-</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">📦 总订单数</div>
                <div class="kpi-value" id="kpiOrders">-</div>
                <div class="kpi-growth" id="kpiOrdersGrowth">-</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">💵 平均客单价</div>
                <div class="kpi-value" id="kpiAvg">-</div>
                <div class="kpi-growth" id="kpiAvgGrowth">-</div>
            </div>
        </div>

        <div class="section-title">📈 趋势分析</div>
        <div class="charts-grid">
            <div class="chart-card full">
                <div class="chart-title">月度销售额与利润趋势</div>
                <div id="trendChart" class="chart tall"></div>
            </div>
        </div>

        <div class="section-title">🗺️ 区域分析</div>
        <div class="charts-grid">
            <div class="chart-card">
                <div class="chart-title">7大区域销售额对比（降序）</div>
                <div id="regionSalesChart" class="chart"></div>
            </div>
            <div class="chart-card">
                <div class="chart-title">各区域利润率对比</div>
                <div id="regionRateChart" class="chart"></div>
            </div>
            <div class="chart-card full">
                <div class="chart-title">省份销售额TOP10</div>
                <div id="provinceChart" class="chart"></div>
            </div>
        </div>

        <div class="section-title">🛒 产品分析</div>
        <div class="charts-grid">
            <div class="chart-card">
                <div class="chart-title">5大产品类别销售额占比</div>
                <div id="catPieChart" class="chart"></div>
            </div>
            <div class="chart-card">
                <div class="chart-title">各产品类别利润率对比</div>
                <div id="catRateChart" class="chart"></div>
            </div>
            <div class="chart-card full">
                <div class="chart-title">销售额TOP10单品</div>
                <div id="topProductsTable"></div>
            </div>
        </div>

        <div class="section-title">👥 客户分析</div>
        <div class="charts-grid">
            <div class="chart-card">
                <div class="chart-title">4类客户对比（订单量/销售额/客单价）</div>
                <div id="custTypeChart" class="chart"></div>
            </div>
            <div class="chart-card">
                <div class="chart-title">客户价值分层</div>
                <div id="custLevelChart" class="chart"></div>
            </div>
        </div>

        <div class="section-title">🧑‍💼 销售团队分析</div>
        <div class="charts-grid">
            <div class="chart-card">
                <div class="chart-title">销售员销售额排名</div>
                <div id="manRankChart" class="chart"></div>
            </div>
            <div class="chart-card">
                <div class="chart-title">销售员能力散点图（销售额vs利润率）</div>
                <div id="manScatterChart" class="chart"></div>
            </div>
        </div>

        <div class="section-title">💡 交叉洞察</div>
        <div class="charts-grid">
            <div class="chart-card">
                <div class="chart-title">折扣率对利润率的影响</div>
                <div id="discountChart" class="chart"></div>
            </div>
            <div class="chart-card">
                <div class="chart-title">支付方式分布</div>
                <div id="payChart" class="chart"></div>
            </div>
            <div class="chart-card full">
                <div class="chart-title">各配送方式平均发货天数</div>
                <div id="shipChart" class="chart"></div>
            </div>
        </div>
    </div>

    <script>
        const rawData = ${dataJson};
        const charts = {};
        const BLUE = ['#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

        function fmt(n) {
            if (n >= 100000000) return (n/100000000).toFixed(2) + '亿';
            if (n >= 10000) return (n/10000).toFixed(2) + '万';
            return n.toFixed(0);
        }

        function init() {
            // 初始化图表
            charts.trend = echarts.init(document.getElementById('trendChart'));
            charts.regionSales = echarts.init(document.getElementById('regionSalesChart'));
            charts.regionRate = echarts.init(document.getElementById('regionRateChart'));
            charts.province = echarts.init(document.getElementById('provinceChart'));
            charts.catPie = echarts.init(document.getElementById('catPieChart'));
            charts.catRate = echarts.init(document.getElementById('catRateChart'));
            charts.custType = echarts.init(document.getElementById('custTypeChart'));
            charts.custLevel = echarts.init(document.getElementById('custLevelChart'));
            charts.manRank = echarts.init(document.getElementById('manRankChart'));
            charts.manScatter = echarts.init(document.getElementById('manScatterChart'));
            charts.discount = echarts.init(document.getElementById('discountChart'));
            charts.pay = echarts.init(document.getElementById('payChart'));
            charts.ship = echarts.init(document.getElementById('shipChart'));

            document.getElementById('yearFilter').addEventListener('change', update);
            window.addEventListener('resize', () => Object.values(charts).forEach(c => c.resize()));
            update();
        }

        function getData() {
            const year = document.getElementById('yearFilter').value;
            return year === 'all' ? rawData : rawData.filter(r => r['年份'] === year);
        }

        function calcGrowth(data, field) {
            const d24 = rawData.filter(r => r['年份'] === '2024').reduce((s, r) => s + r[field], 0);
            const d25 = rawData.filter(r => r['年份'] === '2025').reduce((s, r) => s + r[field], 0);
            if (d24 === 0) return 0;
            return ((d25 - d24) / d24 * 100);
        }

        function update() {
            const data = getData();
            const totalSales = data.reduce((s, r) => s + r['销售额'], 0);
            const totalProfit = data.reduce((s, r) => s + r['利润'], 0);
            const totalOrders = data.length;
            const avgOrder = totalSales / totalOrders;

            // KPI
            document.getElementById('kpiSales').textContent = '¥' + fmt(totalSales);
            document.getElementById('kpiProfit').textContent = '¥' + fmt(totalProfit);
            document.getElementById('kpiOrders').textContent = totalOrders.toLocaleString();
            document.getElementById('kpiAvg').textContent = '¥' + Math.round(avgOrder).toLocaleString();

            // 增长率
            const year = document.getElementById('yearFilter').value;
            ['Sales', 'Profit', 'Orders', 'Avg'].forEach(k => {
                const el = document.getElementById('kpi' + k + 'Growth');
                if (year !== 'all') { el.style.display = 'none'; return; }
                el.style.display = 'inline-block';
                let field = k === 'Sales' ? '销售额' : k === 'Profit' ? '利润' : k === 'Orders' ? null : null;
                let rate;
                if (k === 'Orders') {
                    const c24 = rawData.filter(r => r['年份'] === '2024').length;
                    const c25 = rawData.filter(r => r['年份'] === '2025').length;
                    rate = ((c25 - c24) / c24 * 100);
                } else if (k === 'Avg') {
                    const a24 = rawData.filter(r => r['年份'] === '2024').reduce((s,r)=>s+r['销售额'],0) / rawData.filter(r => r['年份'] === '2024').length;
                    const a25 = rawData.filter(r => r['年份'] === '2025').reduce((s,r)=>s+r['销售额'],0) / rawData.filter(r => r['年份'] === '2025').length;
                    rate = ((a25 - a24) / a24 * 100);
                } else {
                    rate = calcGrowth(data, field);
                }
                el.textContent = (rate >= 0 ? '↑ ' : '↓ ') + '同比' + rate.toFixed(1) + '%';
                el.className = 'kpi-growth ' + (rate >= 0 ? 'up' : 'down');
            });

            renderTrend(data);
            renderRegion(data);
            renderProduct(data);
            renderCustomer(data);
            renderSalesman(data);
            renderInsight(data);
        }

        function renderTrend(data) {
            const months = {};
            data.forEach(r => {
                const m = r['年月'];
                if (!m) return;
                if (!months[m]) months[m] = { sales: 0, profit: 0 };
                months[m].sales += r['销售额'];
                months[m].profit += r['利润'];
            });
            const sorted = Object.keys(months).sort();
            charts.trend.setOption({
                tooltip: { trigger: 'axis' },
                legend: { data: ['销售额', '利润'], top: 0 },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'category', data: sorted, axisLabel: { rotate: 45 } },
                yAxis: { type: 'value', axisLabel: { formatter: v => fmt(v) } },
                series: [
                    { name: '销售额', type: 'bar', data: sorted.map(m => months[m].sales), itemStyle: { color: '#3b82f6' }, barWidth: '50%' },
                    { name: '利润', type: 'line', data: sorted.map(m => months[m].profit), smooth: true, itemStyle: { color: '#10b981' }, lineStyle: { width: 3 } }
                ]
            });
        }

        function renderRegion(data) {
            // 区域销售额
            const regions = {};
            data.forEach(r => {
                const reg = r['区域'];
                if (!reg) return;
                if (!regions[reg]) regions[reg] = { sales: 0, profit: 0 };
                regions[reg].sales += r['销售额'];
                regions[reg].profit += r['利润'];
            });
            const sorted = Object.entries(regions).sort((a,b) => b[1].sales - a[1].sales);
            
            charts.regionSales.setOption({
                tooltip: { trigger: 'axis', formatter: p => p[0].name + '<br/>销售额: ¥' + fmt(p[0].value) },
                grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
                xAxis: { type: 'value', axisLabel: { formatter: v => fmt(v) } },
                yAxis: { type: 'category', data: sorted.map(s => s[0]).reverse() },
                series: [{
                    type: 'bar', data: sorted.map(s => s[1].sales).reverse(),
                    itemStyle: { color: '#3b82f6', borderRadius: [0, 4, 4, 0] },
                    label: { show: true, position: 'right', formatter: p => '¥' + fmt(p.value) }
                }]
            });

            // 区域利润率
            const rates = sorted.map(([name, v]) => ({ name, rate: v.sales > 0 ? (v.profit / v.sales * 100) : 0 }));
            charts.regionRate.setOption({
                tooltip: { trigger: 'axis', formatter: p => p[0].name + '<br/>利润率: ' + p[0].value.toFixed(2) + '%' },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'category', data: rates.map(r => r.name), axisLabel: { rotate: 30 } },
                yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
                series: [{
                    type: 'bar', data: rates.map(r => r.rate),
                    itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
                    label: { show: true, position: 'top', formatter: p => p.value.toFixed(1) + '%' }
                }]
            });

            // 省份TOP10
            const provs = {};
            data.forEach(r => {
                const p = r['省份'];
                if (!p) return;
                if (!provs[p]) provs[p] = 0;
                provs[p] += r['销售额'];
            });
            const topProv = Object.entries(provs).sort((a,b) => b[1] - a[1]).slice(0, 10);
            charts.province.setOption({
                tooltip: { trigger: 'axis', formatter: p => p[0].name + '<br/>销售额: ¥' + fmt(p[0].value) },
                grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
                xAxis: { type: 'value', axisLabel: { formatter: v => fmt(v) } },
                yAxis: { type: 'category', data: topProv.map(p => p[0]).reverse() },
                series: [{
                    type: 'bar', data: topProv.map(p => p[1]).reverse(),
                    itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#60a5fa'},{offset:1,color:'#1e40af'}]), borderRadius: [0, 4, 4, 0] },
                    label: { show: true, position: 'right', formatter: p => '¥' + fmt(p.value) }
                }]
            });
        }

        function renderProduct(data) {
            // 类别饼图
            const cats = {};
            data.forEach(r => {
                const c = r['产品类别'];
                if (!c) return;
                if (!cats[c]) cats[c] = { sales: 0, profit: 0 };
                cats[c].sales += r['销售额'];
                cats[c].profit += r['利润'];
            });
            const pieData = Object.entries(cats).map(([name, v], i) => ({ name, value: v.sales, itemStyle: { color: BLUE[i] } }));
            charts.catPie.setOption({
                tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
                legend: { orient: 'vertical', left: 'left', top: 'center' },
                series: [{
                    type: 'pie', radius: ['40%', '70%'], center: ['60%', '50%'],
                    itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
                    label: { formatter: '{b}\\n{d}%' },
                    data: pieData
                }]
            });

            // 类别利润率
            const catRates = Object.entries(cats).map(([name, v]) => ({ name, rate: v.sales > 0 ? (v.profit / v.sales * 100) : 0 }));
            charts.catRate.setOption({
                tooltip: { trigger: 'axis', formatter: p => p[0].name + '<br/>利润率: ' + p[0].value.toFixed(2) + '%' },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'category', data: catRates.map(r => r.name), axisLabel: { rotate: 20 } },
                yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
                series: [{
                    type: 'bar', data: catRates.map(r => r.rate),
                    itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] },
                    label: { show: true, position: 'top', formatter: p => p.value.toFixed(1) + '%' }
                }]
            });

            // TOP10单品
            const prods = {};
            data.forEach(r => {
                const name = r['产品名称'];
                const cat = r['产品类别'];
                if (!name) return;
                const key = cat + ' - ' + name;
                if (!prods[key]) prods[key] = { sales: 0, profit: 0, cat };
                prods[key].sales += r['销售额'];
                prods[key].profit += r['利润'];
            });
            const top10 = Object.entries(prods).sort((a,b) => b[1].sales - a[1].sales).slice(0, 10);
            let html = '<table><thead><tr><th>排名</th><th>产品名称</th><th>类别</th><th>销售额</th><th>利润</th><th>利润率</th></tr></thead><tbody>';
            top10.forEach(([name, v], i) => {
                const rate = v.sales > 0 ? (v.profit / v.sales * 100) : 0;
                html += '<tr><td><span class="rank rank-' + (i+1) + '">' + (i+1) + '</span></td><td>' + name.split(' - ')[1] + '</td><td>' + v.cat + '</td><td>¥' + fmt(v.sales) + '</td><td>¥' + fmt(v.profit) + '</td><td>' + rate.toFixed(1) + '%</td></tr>';
            });
            html += '</tbody></table>';
            document.getElementById('topProductsTable').innerHTML = html;
        }

        function renderCustomer(data) {
            // 客户类型对比
            const types = {};
            data.forEach(r => {
                const t = r['客户类型'];
                if (!t) return;
                if (!types[t]) types[t] = { orders: 0, sales: 0 };
                types[t].orders++;
                types[t].sales += r['销售额'];
            });
            const typeNames = Object.keys(types);
            charts.custType.setOption({
                tooltip: { trigger: 'axis' },
                legend: { data: ['订单数', '销售额(万)'], top: 0 },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'category', data: typeNames },
                yAxis: [
                    { type: 'value', name: '订单数' },
                    { type: 'value', name: '销售额(万)' }
                ],
                series: [
                    { name: '订单数', type: 'bar', data: typeNames.map(t => types[t].orders), itemStyle: { color: '#3b82f6' } },
                    { name: '销售额(万)', type: 'line', yAxisIndex: 1, data: typeNames.map(t => Math.round(types[t].sales/10000)), itemStyle: { color: '#f59e0b' }, lineStyle: { width: 3 } }
                ]
            });

            // 客户价值分层
            const custSales = {};
            data.forEach(r => {
                const cid = r['客户ID'];
                if (!cid) return;
                if (!custSales[cid]) custSales[cid] = 0;
                custSales[cid] += r['销售额'];
            });
            let high = 0, mid = 0, low = 0, highSales = 0, midSales = 0, lowSales = 0;
            Object.values(custSales).forEach(s => {
                if (s >= 500000) { high++; highSales += s; }
                else if (s >= 100000) { mid++; midSales += s; }
                else { low++; lowSales += s; }
            });
            charts.custLevel.setOption({
                tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
                legend: { bottom: 0 },
                series: [{
                    type: 'pie', radius: ['40%', '70%'],
                    itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
                    label: { formatter: '{b}\\n{c}人' },
                    data: [
                        { value: high, name: '高价值(>50万)', itemStyle: { color: '#1e40af' } },
                        { value: mid, name: '中价值(10-50万)', itemStyle: { color: '#3b82f6' } },
                        { value: low, name: '低价值(<10万)', itemStyle: { color: '#93c5fd' } }
                    ]
                }]
            });
        }

        function renderSalesman(data) {
            // 销售员排名
            const men = {};
            data.forEach(r => {
                const m = r['销售员'];
                if (!m) return;
                if (!men[m]) men[m] = { sales: 0, profit: 0, orders: 0 };
                men[m].sales += r['销售额'];
                men[m].profit += r['利润'];
                men[m].orders++;
            });
            const sorted = Object.entries(men).sort((a,b) => b[1].sales - a[1].sales);
            
            charts.manRank.setOption({
                tooltip: { trigger: 'axis', formatter: p => p[0].name + '<br/>销售额: ¥' + fmt(p[0].value) },
                grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
                xAxis: { type: 'value', axisLabel: { formatter: v => fmt(v) } },
                yAxis: { type: 'category', data: sorted.map(s => s[0]).reverse() },
                series: [{
                    type: 'bar', data: sorted.map(s => s[1].sales).reverse(),
                    itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#60a5fa'},{offset:1,color:'#1e40af'}]), borderRadius: [0, 4, 4, 0] },
                    label: { show: true, position: 'right', formatter: p => '¥' + fmt(p.value) }
                }]
            });

            // 散点图
            const scatterData = sorted.map(([name, v]) => ({
                name,
                value: [Math.round(v.sales/10000), v.sales > 0 ? (v.profit/v.sales*100) : 0, v.orders]
            }));
            charts.manScatter.setOption({
                tooltip: {
                    formatter: p => p.data.name + '<br/>销售额: ' + p.value[0] + '万<br/>利润率: ' + p.value[1].toFixed(1) + '%<br/>订单数: ' + p.value[2]
                },
                grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
                xAxis: { name: '销售额(万)', type: 'value' },
                yAxis: { name: '利润率(%)', type: 'value', axisLabel: { formatter: '{value}%' } },
                series: [{
                    type: 'scatter',
                    data: scatterData,
                    symbolSize: d => Math.sqrt(d[2]) * 5,
                    itemStyle: { color: '#3b82f6', opacity: 0.7 },
                    label: { show: true, formatter: p => p.data.name, position: 'top', fontSize: 11 }
                }]
            });
        }

        function renderInsight(data) {
            // 折扣影响
            const discounts = { '0%': [], '5-10%': [], '15-20%': [], '25-30%': [] };
            data.forEach(r => {
                const d = r['折扣率'] * 100;
                if (d === 0) discounts['0%'].push(r);
                else if (d <= 10) discounts['5-10%'].push(r);
                else if (d <= 20) discounts['15-20%'].push(r);
                else discounts['25-30%'].push(r);
            });
            const discNames = Object.keys(discounts);
            const discRates = discNames.map(k => {
                const arr = discounts[k];
                if (arr.length === 0) return 0;
                return arr.reduce((s, r) => s + (r['销售额'] > 0 ? r['利润']/r['销售额']*100 : 0), 0) / arr.length;
            });
            charts.discount.setOption({
                tooltip: { trigger: 'axis', formatter: p => p[0].name + '<br/>平均利润率: ' + p[0].value.toFixed(2) + '%' },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'category', data: discNames },
                yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
                series: [{
                    type: 'bar', data: discRates,
                    itemStyle: { color: p => p.value > 15 ? '#10b981' : p.value > 10 ? '#f59e0b' : '#ef4444', borderRadius: [4, 4, 0, 0] },
                    label: { show: true, position: 'top', formatter: p => p.value.toFixed(1) + '%' }
                }]
            });

            // 支付方式
            const pays = {};
            data.forEach(r => {
                const p = r['支付方式'];
                if (!p) return;
                if (!pays[p]) pays[p] = 0;
                pays[p] += r['销售额'];
            });
            const payData = Object.entries(pays).map(([name, value], i) => ({ name, value, itemStyle: { color: BLUE[i] } }));
            charts.pay.setOption({
                tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
                legend: { orient: 'vertical', left: 'left', top: 'center' },
                series: [{
                    type: 'pie', radius: '65%', center: ['60%', '50%'],
                    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
                    label: { formatter: '{b}: {d}%' },
                    data: payData
                }]
            });

            // 配送时效
            const ships = {};
            data.forEach(r => {
                const s = r['配送方式'];
                if (!s || !r['发货日期'] || !r['订单日期']) return;
                if (!ships[s]) ships[s] = { days: 0, count: 0 };
                const d1 = new Date(r['发货日期']);
                const d2 = new Date(r['订单日期']);
                const days = Math.max(0, (d1 - d2) / (1000*60*60*24));
                ships[s].days += days;
                ships[s].count++;
            });
            const shipNames = Object.keys(ships);
            const shipDays = shipNames.map(n => ships[n].count > 0 ? (ships[n].days / ships[n].count).toFixed(1) : 0);
            charts.ship.setOption({
                tooltip: { trigger: 'axis', formatter: p => p[0].name + '<br/>平均发货天数: ' + p[0].value + '天' },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'category', data: shipNames },
                yAxis: { type: 'value', name: '天数', axisLabel: { formatter: '{value}天' } },
                series: [{
                    type: 'bar', data: shipDays,
                    itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
                    label: { show: true, position: 'top', formatter: p => p.value + '天' }
                }]
            });
        }

        init();
    </script>
</body>
</html>`;

fs.writeFileSync('销售数据看板_本地版.html', html, 'utf-8');
console.log('生成成功！文件：销售数据看板_本地版.html');
