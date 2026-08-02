const https = require('https');
const fs = require('fs');

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

async function testOCR(imagePath) {
    const imageBase64 = fs.readFileSync(imagePath, 'base64');

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
        console.log('=== 识别到的文本行（逐行）===');
        result.words_result.forEach((item, i) => {
            console.log(`第${i+1}行: "${item.words}"`);
        });
        console.log('\n=== 合并后的文本 ===');
        console.log(result.words_result.map(item => item.words).join(' '));
    } else {
        console.error('识别失败:', result);
    }
}

const imagePath = process.argv[2];
if (!imagePath) {
    console.error('用法: node test_ocr.js <图片路径>');
    process.exit(1);
}

testOCR(imagePath).catch(console.error);
