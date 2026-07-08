const fs = require('fs');

// 读取CSV文件
const csvText = fs.readFileSync('销售数据素材.csv', 'utf-8');
const lines = csvText.split('\n').filter(l => l.trim());
const headers = lines[0].split(',');

const data = [];
for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < headers.length) continue;
    const row = {};
    headers.forEach((h, idx) => {
        row[h.trim()] = values[idx] ? values[idx].trim() : '';
    });
    // 转换数值
    row['销售额'] = parseFloat(row['销售额']) || 0;
    row['利润'] = parseFloat(row['利润']) || 0;
    row['数量'] = parseInt(row['数量']) || 0;
    row['折扣率'] = parseFloat(row['折扣率']) || 0;
    row['利润率'] = parseFloat(row['利润率']) || 0;
    row['单价'] = parseFloat(row['单价']) || 0;
    row['年份'] = row['订单日期'] ? row['订单日期'].substring(0, 4) : '';
    data.push(row);
}

console.log('=== 数据总览 ===');
console.log(`总订单数: ${data.length}`);
console.log(`总销售额: ${(data.reduce((s, r) => s + r['销售额'], 0) / 10000).toFixed(2)}万`);
console.log(`总利润: ${(data.reduce((s, r) => s + r['利润'], 0) / 10000).toFixed(2)}万`);
console.log('');

// ========== 问题1: 利润为负的订单 ==========
console.log('=== 问题1: 亏损订单分析 ===');
const lossOrders = data.filter(r => r['利润'] < 0);
console.log(`利润为负的订单数: ${lossOrders.length} (占比: ${(lossOrders.length / data.length * 100).toFixed(1)}%)`);
console.log(`亏损总金额: ${(lossOrders.reduce((s, r) => s + r['利润'], 0) / 10000).toFixed(2)}万`);

// 按产品类别统计
console.log('\n亏损订单按产品类别分布:');
const lossByCategory = {};
lossOrders.forEach(r => {
    const cat = r['产品类别'];
    if (!lossByCategory[cat]) lossByCategory[cat] = { count: 0, loss: 0, total: 0 };
    lossByCategory[cat].count++;
    lossByCategory[cat].loss += r['利润'];
});
data.forEach(r => {
    const cat = r['产品类别'];
    if (lossByCategory[cat]) lossByCategory[cat].total++;
});
Object.entries(lossByCategory)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([cat, v]) => {
        console.log(`  ${cat}: ${v.count}单 (该类亏损率: ${(v.count / v.total * 100).toFixed(1)}%), 亏损${(v.loss / 10000).toFixed(2)}万`);
    });

// 按区域统计
console.log('\n亏损订单按区域分布:');
const lossByRegion = {};
lossOrders.forEach(r => {
    const reg = r['区域'];
    if (!lossByRegion[reg]) lossByRegion[reg] = { count: 0, loss: 0, total: 0 };
    lossByRegion[reg].count++;
    lossByRegion[reg].loss += r['利润'];
});
data.forEach(r => {
    const reg = r['区域'];
    if (lossByRegion[reg]) lossByRegion[reg].total++;
});
Object.entries(lossByRegion)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([reg, v]) => {
        console.log(`  ${reg}: ${v.count}单 (该区域亏损率: ${(v.count / v.total * 100).toFixed(1)}%), 亏损${(v.loss / 10000).toFixed(2)}万`);
    });

// 亏损订单折扣率分析
console.log('\n亏损订单折扣率分析:');
const lossDiscount = lossOrders.filter(r => r['折扣率'] > 0).length;
const highDiscountLoss = lossOrders.filter(r => r['折扣率'] >= 0.2).length;
console.log(`  有折扣的亏损单: ${lossDiscount}单 (${(lossDiscount / lossOrders.length * 100).toFixed(1)}%)`);
console.log(`  折扣≥20%的亏损单: ${highDiscountLoss}单 (${(highDiscountLoss / lossOrders.length * 100).toFixed(1)}%)`);
console.log(`  亏损单平均折扣率: ${(lossOrders.reduce((s, r) => s + r['折扣率'], 0) / lossOrders.length * 100).toFixed(1)}%`);
console.log(`  盈利单平均折扣率: ${(data.filter(r => r['利润'] >= 0).reduce((s, r) => s + r['折扣率'], 0) / data.filter(r => r['利润'] >= 0).length * 100).toFixed(1)}%`);

// ========== 问题2: 2025 vs 2024 产品类别增长 ==========
console.log('\n=== 问题2: 2025 vs 2024 产品类别增长 ===');
const sales2024 = {};
const sales2025 = {};
data.forEach(r => {
    const cat = r['产品类别'];
    if (r['年份'] === '2024') {
        if (!sales2024[cat]) sales2024[cat] = 0;
        sales2024[cat] += r['销售额'];
    } else if (r['年份'] === '2025') {
        if (!sales2025[cat]) sales2025[cat] = 0;
        sales2025[cat] += r['销售额'];
    }
});

const allCategories = [...new Set(data.map(r => r['产品类别']))];
const growth = [];
allCategories.forEach(cat => {
    const s24 = sales2024[cat] || 0;
    const s25 = sales2025[cat] || 0;
    const rate = s24 > 0 ? ((s25 - s24) / s24 * 100) : 0;
    growth.push({ cat, s24, s25, rate });
});
growth.sort((a, b) => b.rate - a.rate);
console.log('各类别销售额及同比增长率:');
growth.forEach(g => {
    const flag = g.rate >= 0 ? '📈' : '📉';
    console.log(`  ${flag} ${g.cat}: 2024年${(g.s24/10000).toFixed(1)}万 → 2025年${(g.s25/10000).toFixed(1)}万, 同比${g.rate >= 0 ? '+' : ''}${g.rate.toFixed(1)}%`);
});

// ========== 问题3: 各区域销售员人效 ==========
console.log('\n=== 问题3: 各区域销售员人效排名 ===');
const regionSalesman = {};
data.forEach(r => {
    const reg = r['区域'];
    const man = r['销售员'];
    if (!reg || !man) return;
    if (!regionSalesman[reg]) regionSalesman[reg] = { sales: 0, men: new Set() };
    regionSalesman[reg].sales += r['销售额'];
    regionSalesman[reg].men.add(man);
});

const regionEfficiency = [];
Object.entries(regionSalesman).forEach(([reg, v]) => {
    const avgSales = v.sales / v.men.size;
    regionEfficiency.push({ reg, totalSales: v.sales, menCount: v.men.size, avgSales });
});
regionEfficiency.sort((a, b) => b.avgSales - a.avgSales);
console.log('各区域人均销售额排名:');
regionEfficiency.forEach((r, idx) => {
    console.log(`  第${idx+1}名 ${r.reg}: ${r.menCount}位销售, 总销售${(r.totalSales/10000).toFixed(1)}万, 人均${(r.avgSales/10000).toFixed(1)}万`);
});

// ========== 问题4: 复购客户分析 ==========
console.log('\n=== 问题4: 复购客户分析 ===');
const customerOrders = {};
data.forEach(r => {
    const cid = r['客户ID'];
    if (!cid) return;
    if (!customerOrders[cid]) customerOrders[cid] = { count: 0, sales: 0 };
    customerOrders[cid].count++;
    customerOrders[cid].sales += r['销售额'];
});

const allCustomers = Object.keys(customerOrders).length;
const repeatCustomers = Object.values(customerOrders).filter(v => v.count >= 2).length;
const singleCustomers = allCustomers - repeatCustomers;

console.log(`总客户数: ${allCustomers}`);
console.log(`复购客户(购买≥2次): ${repeatCustomers}人, 占比 ${(repeatCustomers / allCustomers * 100).toFixed(1)}%`);
console.log(`单次购买客户: ${singleCustomers}人, 占比 ${(singleCustomers / allCustomers * 100).toFixed(1)}%`);

// 客单价对比
let repeatOrderTotal = 0, repeatOrderCount = 0;
let singleOrderTotal = 0, singleOrderCount = 0;
Object.entries(customerOrders).forEach(([cid, v]) => {
    if (v.count >= 2) {
        repeatOrderTotal += v.sales;
        repeatOrderCount += v.count;
    } else {
        singleOrderTotal += v.sales;
        singleOrderCount += v.count;
    }
});
const repeatAvg = repeatOrderTotal / repeatOrderCount;
const singleAvg = singleOrderTotal / singleOrderCount;
console.log(`\n复购客户: ${repeatOrderCount}单, 平均客单价 ¥${repeatAvg.toFixed(0)}`);
console.log(`新客户: ${singleOrderCount}单, 平均客单价 ¥${singleAvg.toFixed(0)}`);
console.log(`复购客户客单价比新客户高 ${((repeatAvg - singleAvg) / singleAvg * 100).toFixed(1)}%`);

// 复购客户贡献
const repeatTotalSales = Object.values(customerOrders).filter(v => v.count >= 2).reduce((s, v) => s + v.sales, 0);
const totalSales = data.reduce((s, r) => s + r['销售额'], 0);
console.log(`\n复购客户贡献销售额: ${(repeatTotalSales/10000).toFixed(1)}万, 占总销售额 ${(repeatTotalSales/totalSales*100).toFixed(1)}%`);

console.log('\n=== 分析完成 ===');
