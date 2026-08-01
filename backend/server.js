const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..')));

const PORT = process.env.PORT || 3000;

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken(apiKey, secretKey) {
    if (cachedToken && Date.now() < tokenExpiry) {
        return cachedToken;
    }
    const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;
    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
}

app.post('/api/ocr', async (req, res) => {
    try {
        const { imageBase64 } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ error: '缺少图片数据' });
        }

        const apiKey = 'cmcX9ue5gKZghMOrSQL81Y85';
        const secretKey = 'IHGAS6BOPjNRFRtObG92BmxW2IeJA29G';

        if (!apiKey || !secretKey) {
            return res.status(500).json({ error: '服务配置错误' });
        }

        const token = await getAccessToken(apiKey, secretKey);
        const body = new URLSearchParams({ image: imageBase64 });

        const response = await fetch(`https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        });

        const result = await response.json();
        console.log('Baidu OCR response:', JSON.stringify(result));

        if (result.words_result) {
            const texts = result.words_result.map(item => item.words).join(' ');
            res.json({ texts });
        } else {
            res.status(500).json({ error: '识别失败', details: result.error_msg || JSON.stringify(result) });
        }

    } catch (error) {
        console.error('OCR Error:', error);
        res.status(500).json({ error: '识别失败', details: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('OCR Proxy Service Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
