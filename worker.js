// Cloudflare Worker - OCR代理
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 处理CORS预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }

  // 只允许POST请求
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = await request.json()
    const { imageBase64 } = body

    if (!imageBase64) {
      return jsonResponse({ error: '缺少图片数据' }, 400)
    }

    // 腾讯云密钥（从环境变量获取）
    const secretId = TENCENT_SECRET_ID
    const secretKey = TENCENT_SECRET_KEY

    const timestamp = Math.floor(Date.now() / 1000)
    const nonce = Math.floor(Math.random() * 1000000)

    // 构建请求参数
    const params = {
      ImageBase64: imageBase64,
      Action: 'GeneralBasicOCR',
      Version: '2018-11-27',
      Region: 'ap-guangzhou',
      Timestamp: timestamp,
      Nonce: nonce,
      SecretId: secretId
    }

    // 生成签名
    const paramStr = Object.keys(params).sort().map(key =>
      `${key}=${params[key]}`
    ).join('&')

    const signStr = 'POSTocr.tencentcloudapi.com/?' + paramStr

    // 使用Web Crypto API生成HMAC-SHA256签名
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secretKey)
    const messageData = encoder.encode(signStr)

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    )

    const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))

    // 调用腾讯云OCR
    const response = await fetch('https://ocr.tencentcloudapi.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': base64Signature
      },
      body: JSON.stringify(params)
    })

    const result = await response.json()
    return jsonResponse(result)

  } catch (error) {
    return jsonResponse({ error: '识别失败', details: error.message }, 500)
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  })
}
