
// ==UserScript==
// @name         Giải Bài Thông Minh
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Chụp màn hình bài tập và nhận lời giải chi tiết từ AI
// @author       Your Name
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      your-username.github.io
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// @require      https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js
// @require      https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js
// @resource     KATEX_CSS https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    
    // ⚙️ CẤU HÌNH - THAY ĐỔI URL NÀY
    const API_BASE_URL = 'https://doanlol.github.io/Tool-gi-i-bt-remake-by-Doan-/';
    
    // Inject KaTeX CSS
    const katexCSS = GM_getResourceText('KATEX_CSS');
    GM_addStyle(katexCSS);
    
    // CSS Styling
    GM_addStyle(`
        :root {
            --gb-primary: #667eea;
            --gb-primary-hover: #5568d3;
            --gb-bg: #ffffff;
            --gb-text: #18181b;
            --gb-text-secondary: #71717a;
            --gb-border: #e4e4e7;
            --gb-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
        }
        
        [data-theme="dark"] {
            --gb-bg: #27272a;
            --gb-text: #fafafa;
            --gb-text-secondary: #a1a1aa;
            --gb-border: #3f3f46;
        }
        
        #giai-bai-float-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 999999;
            padding: 16px 28px;
            background: linear-gradient(135deg, var(--gb-primary) 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            box-shadow: var(--gb-shadow);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        #giai-bai-float-btn:hover {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 15px 50px rgba(102, 126, 234, 0.5);
        }
        
        #giai-bai-float-btn:active {
            transform: translateY(-2px) scale(0.98);
        }
        
        #giai-bai-float-btn.loading {
            background: #9ca3af;
            cursor: wait;
            pointer-events: none;
        }
        
        .gb-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(4px);
            z-index: 1000000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: gbFadeIn 0.3s ease;
            padding: 20px;
        }
        
        @keyframes gbFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .gb-modal {
            background: var(--gb-bg);
            border-radius: 20px;
            max-width: 800px;
            width: 100%;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
            animation: gbSlideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
        }
        
        @keyframes gbSlideUp {
            from { 
                transform: translateY(50px) scale(0.95); 
                opacity: 0;
            }
            to { 
                transform: translateY(0) scale(1); 
                opacity: 1;
            }
        }
        
        .gb-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 24px 28px;
            border-bottom: 1px solid var(--gb-border);
            background: var(--gb-bg);
        }
        
        .gb-modal-title {
            font-size: 20px;
            font-weight: 700;
            color: var(--gb-text);
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .gb-modal-close {
            width: 36px;
            height: 36px;
            border: none;
            background: transparent;
            color: var(--gb-text-secondary);
            cursor: pointer;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        
        .gb-modal-close:hover {
            background: var(--gb-border);
            color: var(--gb-text);
        }
        
        .gb-modal-body {
            padding: 28px;
            overflow-y: auto;
            flex: 1;
        }
        
        .gb-loading {
            text-align: center;
            padding: 60px 20px;
        }
        
        .gb-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid var(--gb-border);
            border-top-color: var(--gb-primary);
            border-radius: 50%;
            animation: gbSpin 1s linear infinite;
            margin: 0 auto 24px;
        }
        
        @keyframes gbSpin {
            to { transform: rotate(360deg); }
        }
        
        .gb-loading-text {
            font-size: 16px;
            color: var(--gb-text-secondary);
            margin-top: 12px;
        }
        
        .gb-result-actions {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
        }
        .gb-btn {
            padding: 10px 20px;
            border: 1px solid var(--gb-border);
            background: var(--gb-bg);
            color: var(--gb-text);
            border-radius: 10px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .gb-btn:hover {
            background: var(--gb-primary);
            color: white;
            border-color: var(--gb-primary);
            transform: translateY(-1px);
        }
        
        .gb-btn.copied {
            background: #22c55e;
            color: white;
            border-color: #22c55e;
        }
        
        .gb-result-content {
            background: var(--gb-bg);
            border: 1px solid var(--gb-border);
            border-radius: 16px;
            padding: 24px;
            font-size: 16px;
            line-height: 1.8;
            color: var(--gb-text);
        }
        
        .gb-result-content strong {
            color: var(--gb-text);
            display: block;
            margin-top: 16px;
            margin-bottom: 8px;
            font-size: 17px;
        }
        
        .gb-result-content strong:first-child {
            margin-top: 0;
        }
        
        .gb-result-content .katex {
            color: var(--gb-primary);
            font-size: 1.1em;
        }
        
        .gb-result-content .katex-display {
            margin: 16px 0;
            padding: 16px;
            background: rgba(102, 126, 234, 0.05);
            border-radius: 12px;
            overflow-x: auto;
        }
        
        .gb-error {
            text-align: center;
            padding: 40px 20px;
        }
        
        .gb-error-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        
        .gb-error-title {
            font-size: 18px;
            font-weight: 600;
            color: #ef4444;
            margin-bottom: 8px;
        }
        
        .gb-error-message {
            color: var(--gb-text-secondary);
            font-size: 14px;
        }
        
        .gb-retry-btn {
            margin-top: 20px;
            padding: 12px 24px;
            background: var(--gb-primary);
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
        }
        
        .gb-retry-btn:hover {
            background: var(--gb-primary-hover);
        }
    `);
    
    // State
    let currentImageData = null;
    let rawResultText = '';
    let apiLoaded = false;
    
    // Create floating button
    const floatBtn = document.createElement('button');
    floatBtn.id = 'giai-bai-float-btn';
    floatBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
            <circle cx="12" cy="13" r="3"/>
        </svg>
        <span>Giải Bài</span>
    `;
    document.body.appendChild(floatBtn);
    
    // Load API script
    function loadAPI() {
        return new Promise((resolve, reject) => {
            if (apiLoaded) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = API_BASE_URL + 'api.js';
            script.onload = () => {
                apiLoaded = true;
                console.log('✅ Giải Bài API loaded');
                resolve();
            };
            script.onerror = () => reject(new Error('Không thể tải API. Kiểm tra kết nối mạng.'));
            document.head.appendChild(script);
        });
    }
    
    // Capture and solve
    async function captureAndSolve() {
        floatBtn.classList.add('loading');
        floatBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
            </svg>
            <span>Đang xử lý...</span>
        `;
        
        try {
            // Load API first
            await loadAPI();
            
            // Show loading modal
            showLoadingModal();
            
            // Capture screenshot
            const canvas = await html2canvas(document.body, {
                useCORS: true,
                allowTaint: true,
                scale: 1,
                logging: false
            });
            
            currentImageData = canvas.toDataURL('image/png');
            // Call AI API
            const result = await window.GiaiBaiAPI.solve(currentImageData, '');
            
            if (result.success) {
                rawResultText = result.solution;
                showResultModal(result.solution);
            } else {
                showErrorModal(result.error);
            }
            
        } catch (error) {
            console.error('Error:', error);
            showErrorModal(error.message);
        } finally {
            floatBtn.classList.remove('loading');
            floatBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                    <circle cx="12" cy="13" r="3"/>
                </svg>
                <span>Giải Bài</span>
            `;
        }
    }
    
    // Show loading modal
    function showLoadingModal() {
        const modal = createModal();
        modal.innerHTML = `
            <div class="gb-modal-header">
                <div class="gb-modal-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 6.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"/>
                        <path d="m15.5 9.5 3.5-3.5"/>
                        <path d="M17 2h4v4"/>
                        <path d="m8.5 14.5-3.5 3.5"/>
                        <path d="M7 22H3v-4"/>
                    </svg>
                    Giải Bài Thông Minh
                </div>
                <button class="gb-modal-close" onclick="this.closest('.gb-modal-overlay').remove()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="gb-modal-body">
                <div class="gb-loading">
                    <div class="gb-spinner"></div>
                    <div class="gb-loading-text">Đang phân tích bài toán...</div>
                    <div class="gb-loading-text" style="font-size: 14px; margin-top: 8px;">Vui lòng đợi trong giây lát</div>
                </div>
            </div>
        `;
    }
    
    // Show result modal
    function showResultModal(solution) {
        const modal = document.querySelector('.gb-modal-overlay .gb-modal');
        if (!modal) return;
        
        modal.innerHTML = `
            <div class="gb-modal-header">
                <div class="gb-modal-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Lời Giải Chi Tiết
                </div>
                <button class="gb-modal-close" onclick="this.closest('.gb-modal-overlay').remove()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="gb-modal-body">
                <div class="gb-result-actions">
                    <button class="gb-btn gb-copy-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        <span>Copy kết quả</span>
                    </button>
                    <button class="gb-btn gb-new-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                            -3z"/>
                            <circle cx="12" cy="13" r="3"/>
                        </svg>
                        <span>Giải bài mới</span>
                    </button>
                </div>
                <div class="gb-result-content" id="gb-result-content"></div>
            </div>
        `;
        
        // Render LaTeX
        renderLatexResponse(solution);
        
        // Add event listeners
        modal.querySelector('.gb-copy-btn').addEventListener('click', copyResult);
        modal.querySelector('.gb-new-btn').addEventListener('click', () => {
            document.querySelector('.gb-modal-overlay').remove();
        });
    }
    
    // Show error modal
    function showErrorModal(errorMessage) {
        const modal = document.querySelector('.gb-modal-overlay .gb-modal');
        if (!modal) return;
        
        modal.innerHTML = `
            <div class="gb-modal-header">
                <div class="gb-modal-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Có lỗi xảy ra
                </div>
                <button class="gb-modal-close" onclick="this.closest('.gb-modal-overlay').remove()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="gb-modal-body">
                <div class="gb-error">
                    <div class="gb-error-icon">⚠️</div>
                    <div class="gb-error-title">Không thể xử lý yêu cầu</div>
                    <div class="gb-error-message">${escapeHtml(errorMessage)}</div>
                    <button class="gb-retry-btn" onclick="this.closest('.gb-modal-overlay').remove()">
                        Thử lại
                    </button>
                </div>
            </div>
        `;
    }
    
    // Create modal overlay
    function createModal() {
        const existing = document.querySelector('.gb-modal-overlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'gb-modal-overlay';
        overlay.innerHTML = '<div class="gb-modal"></div>';
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        
        document.body.appendChild(overlay);
        return overlay.querySelector('.gb-modal');
    }
    
    // Render LaTeX
    function renderLatexResponse(text) {
        const container = document.getElementById('gb-result-content');
        if (!container) return;
        
        // Save LaTeX blocks with placeholders
        const latexBlocks = [];
        let processedText = text;
        
        // $$ display blocks
        processedText = processedText.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
            latexBlocks.push(match);
            return `%%LATEX_BLOCK_${latexBlocks.length - 1}%%`;
        });
        
        // $ inline blocks
        processedText = processedText.replace(/\$([^\$\n]+?)\$/g, (match) => {
            latexBlocks.push(match);
            return `%%LATEX_BLOCK_${latexBlocks.length - 1}%%`;
        });
        
        // \[...\] display blocks
        processedText = processedText.replace(/\\\[([\s\S]*?)\\\]/g, (match) => {
            latexBlocks.push(match);
            return `%%LATEX_BLOCK_${latexBlocks.length - 1}%%`;
        });
        
        // \(...\) inline blocks
        processedText = processedText.replace(/\\\(([\s\S]*?)\\\)/g, (match) => {
            latexBlocks.push(match);
            return `%%LATEX_BLOCK_${latexBlocks.length - 1}%%`;
        });
        
        // Escape HTML
        processedText = processedText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Process markdown
        processedText = processedText
            .replace(/^\s*\n/gm, '\n')
            .replace(/\n{2,}/g, '\n')
            .trim()
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/(<br>\s*){2,}/g, '<br>');
        
        // Restore LaTeX blocks
        for (let i = 0; i < latexBlocks.length; i++) {
            let latex = latexBlocks[i];
            if (latex.startsWith('$$') || latex.startsWith('\\[')) {
                processedText = processedText.replace(
                    `%%LATEX_BLOCK_${i}%%`,
                    `<div class="math-display">${latex}</div>`
                );
            } else {
                processedText = processedText.replace(
                    `%%LATEX_BLOCK_${i}%%`,
                    `<span class="math-inline">${latex}</span>`
                );
            }
        }
        
        container.innerHTML = processedText;
        
        // Render with KaTeX
        if (typeof renderMathInElement !== 'undefined') {
            try {
                renderMathInElement(container, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\[', right: '\\]', display: true },
                        { left: '\\(', right: '\\)', display: false }
                    ],
                    throwOnError: false,
                    errorColor: '#ef4444',
                    trust: true,
                    strict: false
                });
            } catch (e) {
                console.error('KaTeX render error:', e);
            }
        }
    }
    
    // Copy result
    function copyResult() {
        const btn = document.querySelector('.gb-copy-btn');
        
        navigator.clipboard.writeText(rawResultText)
            .then(() => {
                btn.classList.add('copied');
                btn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Đã copy!</span>
                `;
                
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        <span>Copy kết quả</span>
                    `;
                }, 2000);
            })
            .catch(err => {
                console.error('Copy failed:', err);
                alert('Không thể copy. Vui lòng copy thủ công.');
            });
    }
    
    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Event listener
    floatBtn.addEventListener('click', captureAndSolve);
    
    // Keyboard shortcut: Ctrl+Shift+S
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            captureAndSolve();
        }
    });
    
    console.log('✅ Giải Bài Thông Minh userscript loaded successfully!');
    console.log('📌 Nhấn nút "Giải Bài" hoặc Ctrl+Shift+S để sử dụng');
})();
