// ==========================================
// GIẢI BÀI THÔNG MINH - API SERVICE
// ==========================================

const CONFIG = {
    API_KEY: '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',
    API_URL: 'https://api.groq.com/openai/v1/chat/completions',
    MODEL: 'meta-llama/llama-4-scout-17b-16e-instruct',
    MAX_RETRIES: 3,
    RETRY_DELAY: 5000
};

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, retries = CONFIG.MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            
            if (response.status === 429) {
                if (i === retries - 1) {
                    throw new Error('Quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.');
                }
                console.log(`Rate limited, retrying in ${CONFIG.RETRY_DELAY}ms...`);
                await delay(CONFIG.RETRY_DELAY);
                continue;
            }
            
            if (!response.ok) {
                throw new Error(`Lỗi API: ${response.status} - ${response.statusText}`);
            }
            
            return response;
        } catch (error) {
            if (i === retries - 1) throw error;
            console.log(`Request failed, retrying... (${i + 1}/${retries})`);
            await delay(1000);
        }
    }
}

async function solveHomework(imageBase64, description = '') {
    try {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        
        const prompt = `Giải bài tập trong ảnh. ${description ? 'Yêu cầu thêm: ' + description : ''}

CÁCH GIẢI:
- Giải TRỰC TIẾP theo từng câu a), b), c)...
- Mỗi câu bắt đầu bằng **a)**, **b)**, **c)**... in đậm
- Dùng gạch đầu dòng (*) cho từng bước
- KHÔNG dùng "Đặt ẩn:", "Nhận xét:", "Tính:", "Tóm tắt đề:"
- KHÔNG đánh số bước (1., 2., 3..)

QUAN TRỌNG - XUỐNG DÒNG:
- Mỗi phép biến đổi/bước tính PHẢI trên 1 dòng riêng
- KHÔNG viết nhiều dấu = trên cùng 1 dòng
- Nếu công thức dài, XUỐNG DÒNG sau mỗi dấu =
- Mỗi dòng chỉ có 1-2 phép tính

VÍ DỤ ĐÚNG (xuống dòng):
* $B = \\frac{2}{x-2}$
* $= \\frac{2}{7-4\\sqrt{3}-2}$
* $= \\frac{2}{5-4\\sqrt{3}}$

CÔNG THỨC LATEX:
- Inline: $x^2 + y^2$
- Riêng dòng: $$\\frac{a}{b} = c$$
- Căn: $\\sqrt{x}$, Phân số: $\\frac{a}{b}$`;

        const response = await fetchWithRetry(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.API_KEY}`
            },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { 
                            type: 'image_url', 
                            image_url: { 
                                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${base64Data}`
                            } 
                        }
                    ]
                }],
                max_tokens: 4096,
                temperature: 0.7
            })
        });

        const data = await response.json();
        const generatedText = data.choices?.[0]?.message?.content;

        if (!generatedText) {
            throw new Error('Không nhận được phản hồi từ AI. Vui lòng thử lại.');
        }

        return {
            success: true,
            solution: generatedText,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('AI Request Error:', error);
        return {
            success: false,
            error: error.message || 'Đã xảy ra lỗi không xác định',
            timestamp: new Date().toISOString()
        };
    }
}

if (typeof window !== 'undefined') {
    window.GiaiBaiAPI = {
        solve: solveHomework,
        version: '1.0.0',
        config: CONFIG
    };
    console.log('✅ Giải Bài API loaded successfully');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { solveHomework, CONFIG };
            }
