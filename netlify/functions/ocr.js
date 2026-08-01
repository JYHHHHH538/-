const https = require('https');

async function getAccessToken(apiKey, secretKey) {
    return new Promise((resolve, reject) => {
        const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data).access_token); } catch(e) { reject(e); }
            });
        }).on('error', reject);
    });
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { imageBase64 } = JSON.parse(event.body || '{}');
        if (!imageBase64) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: '缺少图片数据' }) };
        }

        const apiKey = 'cmcX9ue5gKZghMOrSQL81Y85';
        const secretKey = 'IHGAS6BOPjNRFRtObG92BmxW2IeJA29G';
        const token = await getAccessToken(apiKey, secretKey);

        const result = await new Promise((resolve, reject) => {
            const body = new URLSearchParams({ image: imageBase64 }).toString();
            const options = {
                hostname: 'aip.baidubce.com',
                path: `/rest/2.0/ocr/v1/general_basic?access_token=${token}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(body)
                }
            };
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
            });
            req.on('error', reject);
            req.write(body);
            req.end();
        });

        if (result.words_result) {
            const texts = result.words_result.map(item => item.words).join(' ');
            return { statusCode: 200, headers, body: JSON.stringify({ texts }) };
        } else {
            return { statusCode: 500, headers, body: JSON.stringify({ error: result.error_msg || '识别失败' }) };
        }

    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: '识别失败', details: error.message }) };
    }
};
