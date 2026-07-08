import csv
import json
from collections import defaultdict

# 读取CSV数据
data = []
with open('销售数据素材.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if not row.get('订单ID'):
            continue
        try:
            processed = {
                '订单ID': row['订单ID'],
                '订单日期': row['订单日期'],
                '发货日期': row['发货日期'],
                '配送方式': row['配送方式'],
                '区域': row['区域'],
                '省份': row['省份'],
                '客户ID': row['客户ID'],
                '客户名称': row['客户名称'],
                '客户类型': row['客户类型'],
                '产品类别': row['产品类别'],
                '产品名称': row['产品名称'],
                '单价': float(row['单价']),
                '数量': int(row['数量']),
                '折扣率': float(row['折扣率']),
                '销售额': float(row['销售额']),
                '利润': float(row['利润']),
                '利润率': float(row['利润率']),
                '销售员': row['销售员'],
                '支付方式': row['支付方式'],
                '年份': row['订单日期'][:4] if row['订单日期'] else '',
                '年月': row['订单日期'][:7] if row['订单日期'] else ''
            }
            data.append(processed)
        except:
            continue

print(f"成功读取 {len(data)} 条数据")

# 计算KPI
total_sales = sum(r['销售额'] for r in data)
total_profit = sum(r['利润'] for r in data)
total_orders = len(data)
total_customers = len(set(r['客户ID'] for r in data))
avg_order = total_sales / total_orders if total_orders > 0 else 0
avg_rate = (total_profit / total_sales * 100) if total_sales > 0 else 0

print(f"总销售额: {total_sales:,.2f}")
print(f"总利润: {total_profit:,.2f}")
print(f"订单数: {total_orders}")
print(f"客户数: {total_customers}")
print(f"平均客单价: {avg_order:,.2f}")
print(f"平均利润率: {avg_rate:.2f}%")

# 将数据转为JSON
data_json = json.dumps(data, ensure_ascii=False)

html_template = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>电商销售数据分析看板</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .dashboard-container { max-width: 1920px; margin: 0 auto; }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 25px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        .header h1 { font-size: 32px; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
        .header .subtitle { font-size: 14px; opacity: 0.9; }
        .filter-bar {
            background: white;
            border-radius: 12px;
            padding: 15px 25px;
            margin-bottom: 20px;
            display: flex;
            gap: 20px;
            align-items: center;
            flex-wrap: wrap;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .filter-item { display: flex; align-items: center; gap: 8px; }
        .filter-item label { font-weight: 600; color: #333; font-size: 14px; }
        .filter-item select {
            padding: 8px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            outline: none;
            transition: all 0.3s;
        }
        .filter-item select:hover { border-color: #667eea; }
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 20px;
            margin-bottom: 20px;
        }
        .kpi-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s, box-shadow 0.3s;
            position: relative;
            overflow: hidden;
        }
        .kpi-card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
        .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; }
        .kpi-card:nth-child(1)::before { background: #667eea; }
        .kpi-card:nth-child(2)::before { background: #f093fb; }
        .kpi-card:nth-child(3)::before { background: #4facfe; }
        .kpi-card:nth-child(4)::before { background: #43e97b; }
        .kpi-card:nth-child(5)::before { background: #fa709a; }
        .kpi-card:nth-child(6)::before { background: #feca57; }
        .kpi-label { font-size: 13px; color: #888; margin-bottom: 8px; }
        .kpi-value { font-size: 24px; font-weight: bold; color: #333; }
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
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .chart-card.full-width { grid-column: span 2; }
        .chart-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            padding-left: 10px;
            border-left: 4px solid #667eea;
        }
        .chart-container { width: 100%; height: 320px; }
        .chart-container.tall { height: 400px; }
        @media (max-width: 1200px) {
            .kpi-grid { grid-template-columns: repeat(3, 1fr); }
            .charts-grid { grid-template-columns: 1fr; }
            .chart-card.full-width { grid-column: span 1; }
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <div class="header">
            <h1>📊 电商销售数据分析看板</h1>
            <div class="subtitle">数据周期：2024年1月 - 2025年12月 | 共''' + str(total_orders) + '''条订单记录</div>
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
            <div class="filter-item">
                <label>🌍 区域：</label>
                <select id="regionFilter"><option value="all">全部区域</option></select>
            </div>
            <div class="filter-item">
                <label>🏷️ 产品类别：</label>
                <select id="categoryFilter"><option value="all">全部类别</option></select>
            </div>
            <div class="filter-item">
                <label>👥 客户类型：</label>
                <select id="customerFilter"><option value="all">全部类型</option></select>
            </div>
            <div style="margin-left:auto; font-size:13px; color:#888;">💡 选择筛选条件后图表自动更新</div>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">💰 总销售额</div>
                <div class="kpi-value" id="totalSales">-</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">📈 总利润</div>
                <div class="kpi-value" id="totalProfit">-</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">📦 订单总数</div>
                <div class="kpi-value" id="totalOrders">-</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">👤 客户数量</div>
                <div class="kpi-value" id="totalCustomers">-</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">💵 平均客单价</div>
                <div class="kpi-value" id="avgOrderValue">-</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">📊 平均利润率</div>
                <div class="kpi-value" id="avgProfitRate">-</div>
            </div>
        </div>

        <div class="charts-grid">
            <div class="chart-card full-width">
                <div class="chart-title">📈 月度销售趋势分析</div>
                <div id="trendChart" class="chart-container tall"></div>
            </div>
            <div class="chart-card">
                <div class="chart-title">🌍 区域销售分布</div>
                <div id="regionChart" class="chart-container"></div>
            </div>
            <div class="chart-card">
                <div class="chart-title">🏷️ 产品类别销售占比</div>
                <div id="categoryChart" class="chart-container"></div>
            </div>
            <div class="chart-card">
                <div class="chart-title">👥 客户类型贡献分析</div>
                <div id="customerChart" class="chart-container"></div>
            </div>
            <div class="chart-card">
                <div class="chart-title">💳 支付方式分布</div>
                <div id="paymentChart" class="chart-container"></div>
            </div>
            <div class="chart-card full-width">
                <div class="chart-title">🏆 销售员业绩排名</div>
                <div id="salesmanChart" class="chart-container tall"></div>
            </div>
            <div class="chart-card">
                <div class="chart-title">🚚 配送方式效率分析</div>
                <div id="shippingChart" class="chart-container"></div>
            </div>
            <div class="chart-card">
                <div class="chart-title">🏙️ 省份销售 TOP10</div>
                <div id="provinceChart" class="chart-container"></div>
            </div>
        </div>
    </div>

    <script>
        const rawData = ''' + data_json + ''';
        let charts = {};
        const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#feca57', '#ff6b6b', '#a55eea'];

        function formatMoney(num) {
            if (num >= 100000000) return (num / 100000000).toFixed(2) + '亿';
            if (num >= 10000) return (num / 10000).toFixed(2) + '万';
            return num.toFixed(2);
        }
        function formatNumber(num) { return num.toLocaleString('zh-CN'); }

        function initFilters() {
            const regions = [...new Set(rawData.map(r => r['区域']).filter(Boolean))].sort();
            const categories = [...new Set(rawData.map(r => r['产品类别']).filter(Boolean))].sort();
            const customers = [...new Set(rawData.map(r => r['客户类型']).filter(Boolean))].sort();
            const regionSel = document.getElementById('regionFilter');
            regions.forEach(r => { const opt = document.createElement('option'); opt.value = r; opt.textContent = r; regionSel.appendChild(opt); });
            const catSel = document.getElementById('categoryFilter');
            categories.forEach(c => { const opt = document.createElement('option'); opt.value = c; opt.textContent = c; catSel.appendChild(opt); });
            const custSel = document.getElementById('customerFilter');
            customers.forEach(c => { const opt = document.createElement('option'); opt.value = c; opt.textContent = c; custSel.appendChild(opt); });
            ['yearFilter', 'regionFilter', 'categoryFilter', 'customerFilter'].forEach(id => {
                document.getElementById(id).addEventListener('change', updateDashboard);
            });
        }

        function getFilteredData() {
            const year = document.getElementById('yearFilter').value;
            const region = document.getElementById('regionFilter').value;
            const category = document.getElementById('categoryFilter').value;
            const customer = document.getElementById('customerFilter').value;
            return rawData.filter(r => {
                if (year !== 'all' && r['年份'] !== year) return false;
                if (region !== 'all' && r['区域'] !== region) return false;
                if (category !== 'all' && r['产品类别'] !== category) return false;
                if (customer !== 'all' && r['客户类型'] !== customer) return false;
                return true;
            });
        }

        function initCharts() {
            charts.trend = echarts.init(document.getElementById('trendChart'));
            charts.region = echarts.init(document.getElementById('regionChart'));
            charts.category = echarts.init(document.getElementById('categoryChart'));
            charts.customer = echarts.init(document.getElementById('customerChart'));
            charts.payment = echarts.init(document.getElementById('paymentChart'));
            charts.salesman = echarts.init(document.getElementById('salesmanChart'));
            charts.shipping = echarts.init(document.getElementById('shippingChart'));
            charts.province = echarts.init(document.getElementById('provinceChart'));
            window.addEventListener('resize', () => { Object.values(charts).forEach(c => c.resize()); });
        }

        function updateDashboard() {
            const data = getFilteredData();
            const totalSales = data.reduce((s, r) => s + r['销售额'], 0);
            const totalProfit = data.reduce((s, r) => s + r['利润'], 0);
            const totalOrders = data.length;
            const customers = new Set(data.map(r => r['客户ID'])).size;
            const avgOrder = totalOrders > 0 ? totalSales / totalOrders : 0;
            const avgRate = totalSales > 0 ? (totalProfit / totalSales * 100) : 0;
            document.getElementById('totalSales').textContent = '¥' + formatMoney(totalSales);
            document.getElementById('totalProfit').textContent = '¥' + formatMoney(totalProfit);
            document.getElementById('totalOrders').textContent = formatNumber(totalOrders);
            document.getElementById('totalCustomers').textContent = formatNumber(customers);
            document.getElementById('avgOrderValue').textContent = '¥' + formatNumber(Math.round(avgOrder));
            document.getElementById('avgProfitRate').textContent = avgRate.toFixed(2) + '%';
            updateTrendChart(data);
            updateRegionChart(data);
            updateCategoryChart(data);
            updateCustomerChart(data);
            updatePaymentChart(data);
            updateSalesmanChart(data);
            updateShippingChart(data);
            updateProvinceChart(data);
        }

        function updateTrendChart(data) {
            const months = {};
            data.forEach(r => {
                const m = r['年月'];
                if (!m) return;
                if (!months[m]) months[m] = { sales: 0, profit: 0, orders: 0 };
                months[m].sales += r['销售额'];
                months[m].profit += r['利润'];
                months[m].orders += 1;
            });
            const sortedMonths = Object.keys(months).sort();
            charts.trend.setOption({
                tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
                legend: { data: ['销售额', '利润', '订单数'], top: 0 },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'category', data: sortedMonths, axisLabel: { rotate: 45 } },
                yAxis: [
                    { type: 'value', name: '金额(元)', axisLabel: { formatter: v => formatMoney(v) } },
                    { type: 'value', name: '订单数', position: 'right' }
                ],
                series: [
                    { name: '销售额', type: 'bar', data: sortedMonths.map(m => months[m].sales),
                      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{offset:0,color:'#667eea'},{offset:1,color:'#764ba2'}])}, barWidth: '40%' },
                    { name: '利润', type: 'line', data: sortedMonths.map(m => months[m].profit), smooth: true,
                      itemStyle: { color: '#43e97b' }, lineStyle: { width: 3 }, symbol: 'circle', symbolSize: 8 },
                    { name: '订单数', type: 'line', yAxisIndex: 1, data: sortedMonths.map(m => months[m].orders), smooth: true,
                      itemStyle: { color: '#fa709a' }, lineStyle: { width: 2, type: 'dashed' }, symbol: 'diamond', symbolSize: 8 }
                ]
            });
        }

        function updateRegionChart(data) {
            const regions = {};
            data.forEach(r => {
                const reg = r['区域'];
                if (!reg) return;
                if (!regions[reg]) regions[reg] = { sales: 0, profit: 0 };
                regions[reg].sales += r['销售额'];
                regions[reg].profit += r['利润'];
            });
            const sorted = Object.entries(regions).sort((a, b) => b[1].sales - a[1].sales);
            charts.region.setOption({
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: { data: ['销售额', '利润'], top: 0 },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'value', axisLabel: { formatter: v => formatMoney(v) } },
                yAxis: { type: 'category', data: sorted.map(s => s[0]).reverse() },
                series: [
                    { name: '销售额', type: 'bar', data: sorted.map(s => s[1].sales).reverse(), itemStyle: { color: '#4facfe' }, barWidth: '35%' },
                    { name: '利润', type: 'bar', data: sorted.map(s => s[1].profit).reverse(), itemStyle: { color: '#43e97b' }, barWidth: '35%' }
                ]
            });
        }

        function updateCategoryChart(data) {
            const cats = {};
            data.forEach(r => {
                const c = r['产品类别'];
                if (!c) return;
                if (!cats[c]) cats[c] = 0;
                cats[c] += r['销售额'];
            });
            const pieData = Object.entries(cats).map(([name, value], i) => ({ name, value, itemStyle: { color: colors[i % colors.length] } }));
            charts.category.setOption({
                tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
                legend: { orient: 'vertical', left: 'left', top: 'center' },
                series: [{
                    type: 'pie', radius: ['40%', '70%'], center: ['60%', '50%'],
                    itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
                    label: { show: true, formatter: '{b}\\n{d}%' },
                    emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
                    data: pieData
                }]
            });
        }

        function updateCustomerChart(data) {
            const custs = {};
            data.forEach(r => {
                const c = r['客户类型'];
                if (!c) return;
                if (!custs[c]) custs[c] = { sales: 0, profit: 0 };
                custs[c].sales += r['销售额'];
                custs[c].profit += r['利润'];
            });
            const names = Object.keys(custs);
            charts.customer.setOption({
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: { data: ['销售额', '利润'], top: 0 },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'category', data: names },
                yAxis: { type: 'value', axisLabel: { formatter: v => formatMoney(v) } },
                series: [
                    { name: '销售额', type: 'bar', data: names.map(n => custs[n].sales),
                      itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#f093fb'},{offset:1,color:'#f5576c'}])}, barWidth: '30%' },
                    { name: '利润', type: 'bar', data: names.map(n => custs[n].profit),
                      itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#4facfe'},{offset:1,color:'#00f2fe'}])}, barWidth: '30%' }
                ]
            });
        }

        function updatePaymentChart(data) {
            const pays = {};
            data.forEach(r => {
                const p = r['支付方式'];
                if (!p) return;
                if (!pays[p]) pays[p] = 0;
                pays[p] += r['销售额'];
            });
            const pieData = Object.entries(pays).map(([name, value], i) => ({ name, value, itemStyle: { color: colors[i % colors.length] } }));
            charts.payment.setOption({
                tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
                series: [{
                    type: 'pie', radius: '65%', center: ['50%', '55%'],
                    itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
                    label: { formatter: '{b}: {d}%' },
                    data: pieData
                }]
            });
        }

        function updateSalesmanChart(data) {
            const salesmen = {};
            data.forEach(r => {
                const s = r['销售员'];
                if (!s) return;
                if (!salesmen[s]) salesmen[s] = { sales: 0, profit: 0, orders: 0 };
                salesmen[s].sales += r['销售额'];
                salesmen[s].profit += r['利润'];
                salesmen[s].orders += 1;
            });
            const sorted = Object.entries(salesmen).sort((a, b) => b[1].sales - a[1].sales);
            charts.salesman.setOption({
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: { data: ['销售额', '利润', '订单数'], top: 0 },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'category', data: sorted.map(s => s[0]) },
                yAxis: [
                    { type: 'value', name: '金额(元)', axisLabel: { formatter: v => formatMoney(v) } },
                    { type: 'value', name: '订单数', position: 'right' }
                ],
                series: [
                    { name: '销售额', type: 'bar', data: sorted.map(s => s[1].sales),
                      itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#667eea'},{offset:1,color:'#764ba2'}])}, barWidth: '25%' },
                    { name: '利润', type: 'bar', data: sorted.map(s => s[1].profit),
                      itemStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#43e97b'},{offset:1,color:'#38f9d7'}])}, barWidth: '25%' },
                    { name: '订单数', type: 'line', yAxisIndex: 1, data: sorted.map(s => s[1].orders), smooth: true,
                      itemStyle: { color: '#fa709a' }, lineStyle: { width: 3 }, symbol: 'circle', symbolSize: 10 }
                ]
            });
        }

        function updateShippingChart(data) {
            const ships = {};
            data.forEach(r => {
                const s = r['配送方式'];
                if (!s || !r['发货日期'] || !r['订单日期']) return;
                if (!ships[s]) ships[s] = { sales: 0, count: 0, totalDays: 0 };
                ships[s].sales += r['销售额'];
                ships[s].count += 1;
                const d1 = new Date(r['发货日期']);
                const d2 = new Date(r['订单日期']);
                const days = (d1 - d2) / (1000 * 60 * 60 * 24);
                ships[s].totalDays += Math.max(0, days);
            });
            const names = Object.keys(ships);
            charts.shipping.setOption({
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: { data: ['销售额', '平均发货天数'], top: 0 },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'category', data: names },
                yAxis: [
                    { type: 'value', name: '销售额', axisLabel: { formatter: v => formatMoney(v) } },
                    { type: 'value', name: '天数', position: 'right', axisLabel: { formatter: '{value}天' } }
                ],
                series: [
                    { name: '销售额', type: 'bar', data: names.map(n => ships[n].sales), itemStyle: { color: '#feca57' }, barWidth: '40%' },
                    { name: '平均发货天数', type: 'line', yAxisIndex: 1, data: names.map(n => (ships[n].totalDays/ships[n].count).toFixed(1)),
                      itemStyle: { color: '#ff6b6b' }, lineStyle: { width: 3 }, symbol: 'circle', symbolSize: 10 }
                ]
            });
        }

        function updateProvinceChart(data) {
            const provs = {};
            data.forEach(r => {
                const p = r['省份'];
                if (!p) return;
                if (!provs[p]) provs[p] = 0;
                provs[p] += r['销售额'];
            });
            const sorted = Object.entries(provs).sort((a, b) => b[1] - a[1]).slice(0, 10);
            charts.province.setOption({
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                grid: { left: '3%', right: '15%', bottom: '3%', containLabel: true },
                xAxis: { type: 'value', axisLabel: { formatter: v => formatMoney(v) } },
                yAxis: { type: 'category', data: sorted.map(s => s[0]).reverse() },
                series: [{
                    type: 'bar', data: sorted.map(s => s[1]).reverse(),
                    itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#a55eea'},{offset:1,color:'#667eea'}])},
                    barWidth: '50%',
                    label: { show: true, position: 'right', formatter: p => '¥' + formatMoney(p.value) }
                }]
            });
        }

        initFilters();
        initCharts();
        updateDashboard();
    </script>
</body>
</html>'''

with open('销售数据看板.html', 'w', encoding='utf-8') as f:
    f.write(html_template)

print("看板生成成功！")
