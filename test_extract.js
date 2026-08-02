// 模拟 extractLineItems 的处理逻辑
const words = [
    "13:08",
    ":5G",
    "×",
    "AA制分账计算器",
    "aa-bill-calculator.netlify.app",
    "反馈与投诉",
    "退",
    "云南·地道一锅菌·野生菌火锅",
    "星期五21：50",
    "退款通知",
    "￥50.00",
    "查看详情>",
    "退款方式花呗",
    "退款说明",
    "退款-美团收银909700215431950926",
    "余额宝",
    "星期五19：55",
    "转入成功",
    "￥0.01",
    "查看详情>",
    "付款方式建设银行储蓄卡(4192)",
    "管理当前自动扣款服务",
    "回扫描下一张",
    "自扫描记录",
    "第次扫描",
    "￥53.71",
    "删除",
    "累计总额：",
    "￥53.71",
    "导出PDF账单",
    "消费名称（如：早餐）",
    "53.71",
    "天"
];

const skipKeywords = /合计|总计|实付|应付|总价|需付|实收|小计|应收|收款|待付|付款|找零|优惠|折扣|数量|单价|日期|时间|桌号|台号|单号|订单|谢谢|欢迎|地址|电话|服务费|税|发票|备注|积分|会员/;
const datePattern = /\d{4}[\/\-年]\d{1,2}/;
const phonePattern = /1[3-9]\d{9}/;

const amounts = [];
for (const line of words) {
    if (!line || !line.trim()) continue;
    if (skipKeywords.test(line)) {
        console.log(`跳过（关键词）: "${line}"`);
        continue;
    }
    if (datePattern.test(line)) {
        console.log(`跳过（日期）: "${line}"`);
        continue;
    }
    if (phonePattern.test(line)) {
        console.log(`跳过（手机号）: "${line}"`);
        continue;
    }

    const match = line.trim().match(/(\d+(?:\.\d{1,2})?)\s*$/);
    if (!match) continue;

    const amount = parseFloat(match[1]);
    const isDecimal = match[1].includes('.');

    if (isDecimal && amount >= 0.01 && amount < 10000) {
        console.log(`✓ 提取到: "${line}" → ${amount}`);
        amounts.push(amount);
    } else if (!isDecimal && amount >= 5 && amount < 10000) {
        console.log(`✓ 提取到（整数）: "${line}" → ${amount}`);
        amounts.push(amount);
    } else {
        console.log(`× 金额不符合: "${line}" → ${amount} (decimal=${isDecimal})`);
    }
}

console.log('\n=== 最终提取结果 ===');
console.log(`提取到 ${amounts.length} 笔金额:`, amounts);
console.log(`是否 > 1 笔?`, amounts.length > 1);
