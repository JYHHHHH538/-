// Vercel Serverless Function - OCR代理
const crypto = require('crypto');

module.exports = async (req, res) => {
    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { imageBase64 } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ error: '缺少图片数据' });
        }

        // 腾讯云密钥（存储在环境变量中）
        const secretId = process.env.TENCENT_SECRET_ID;
        const secretKey = process.env.TENCENT_SECRET_KEY;

        if (!secretId || !secretKey) {
            return res.status(500).json({ error: '服务配置错误' });
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = Math.floor(Math.random() * 1000000);

        // 构建请求参数
        const params = {
            ImageBase64: imageBase64,
            Action: 'GeneralBasicOCR',
            Version: '2018-11-27',
            Region: 'ap-guangzhou',
            Timestamp: timestamp,
            Nonce: nonce,
            SecretId: secretId
        };

        // 生成签名
        const paramStr = Object.keys(params).sort().map(key =>
            `${key}=${params[key]}`
        ).join('&');

        const signStr = 'POSTocr.tencentcloudapi.com/?' + paramStr;
        const hmac = crypto.createHmac('sha256', secretKey);
        const signature = hmac.update(signStr).digest('base64');

        // 调用腾讯云OCR
        const response = await fetch('https://ocr.tencentcloudapi.com/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': signature
            },
            body: JSON.stringify(params)
        });

        const result = await response.json();

        // 返回结果
        res.status(200).json(result);

    } catch (error) {
        console.error('OCR Error:', error);
        res.status(500).json({ error: '识别失败', details: error.message });
    }
};
