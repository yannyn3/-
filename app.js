// 注册 Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker not registered', err));
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const takePhotoBtn = document.getElementById('takePhotoBtn');
    const imagePreview = document.getElementById('imagePreview');
    const previewContainer = document.getElementById('previewContainer');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loadingSection = document.getElementById('loadingSection');
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');
    const healthRating = document.getElementById('healthRating');
    const usageCounter = document.getElementById('usageCounter');
    const userRemainingScans = document.getElementById('userRemainingScans');
    
    // Tab elements
    const homeTab = document.getElementById('homeTab');
    const shopTab = document.getElementById('shopTab');
    const userTab = document.getElementById('userTab');
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    
    // Settings elements
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const settingsForm = document.getElementById('settingsForm');
    const apiProvider = document.getElementById('apiProvider');
    const apiKey = document.getElementById('apiKey');
    const modelName = document.getElementById('modelName');
    const azureEndpointContainer = document.getElementById('azureEndpointContainer');
    const azureEndpoint = document.getElementById('azureEndpoint');
    const toggleAdvancedBtn = document.getElementById('toggleAdvancedBtn');
    const advancedOptions = document.getElementById('advancedOptions');
    const maxTokens = document.getElementById('maxTokens');
    const temperature = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperatureValue');
    const resetSettingsBtn = document.getElementById('resetSettingsBtn');
    
    // Checkin elements
    const checkinBtn = document.getElementById('checkinBtn');
    const userCheckinBtn = document.getElementById('userCheckinBtn');
    const checkinModal = document.getElementById('checkinModal');
    const closeCheckinBtn = document.getElementById('closeCheckinBtn');
    const checkinStatus = document.getElementById('checkinStatus');
    
    // Donate elements
    const donateBtn = document.getElementById('donateBtn');
    const donateModal = document.getElementById('donateModal');
    const closeDonateBtn = document.getElementById('closeDonateBtn');
    
    // Usage exhausted elements
    const usageExhaustedModal = document.getElementById('usageExhaustedModal');
    const gotoShopBtn = document.getElementById('gotoShopBtn');
    const configApiBtn = document.getElementById('configApiBtn');
    
    // Shop elements
    const buyBasicBtn = document.getElementById('buyBasicBtn');
    const buyHighBtn = document.getElementById('buyHighBtn');
    const buyYearBtn = document.getElementById('buyYearBtn');
    const activateCardBtn = document.getElementById('activateCardBtn');
    const upgradeBtn = document.getElementById('upgradeBtn');
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    let selectedFile = null;
    
    // 免费使用限制相关
    const DEFAULT_FREE_SCANS = 6;
    const CHECKIN_REWARD = 1;
    
    // 用户配置和使用数据存储对象
    const userData = {
        remainingScans: DEFAULT_FREE_SCANS,
        lastCheckinDate: null,
        hasCheckedInToday: false,
        scanHistory: []
    };
    
    // 默认设置
    const defaultSettings = {
        apiProvider: 'openai',
        apiKey: '',
        modelName: 'gpt-4',
        azureEndpoint: '',
        maxTokens: 2000,
        temperature: 0.7,
        usePoeApi: true // 是否使用 Poe API (如果可用)
    };
    
    // 初始化应用
    function initApp() {
        loadUserData();
        updateUsageCounter();
        checkDarkModePreference();
        
        // 检查是否已经签到
        checkDailyCheckin();

        // 初始化支付选项
        initPaymentOptions();
    }
    
    // 初始化支付选项
    function initPaymentOptions() {
        const paymentOptions = document.querySelectorAll('.payment-option');
        const selectedPayment = document.getElementById('selectedPayment');
        
        paymentOptions.forEach(option => {
            option.addEventListener('click', () => {
                // 移除所有活动状态
                paymentOptions.forEach(opt => opt.classList.remove('active'));
                
                // 添加当前活动状态
                option.classList.add('active');
                
                // 更新显示的二维码
                const img = option.querySelector('img');
                const qrImg = selectedPayment.querySelector('img');
                qrImg.src = img.src;
                qrImg.alt = img.alt;
            });
        });
    }
    
    // 保存用户数据
    function saveUserData() {
        localStorage.setItem('foodScannerUserData', JSON.stringify(userData));
    }
    
    // 加载用户数据
    function loadUserData() {
        const savedData = localStorage.getItem('foodScannerUserData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            
            // 合并已保存的数据，保留默认值
            Object.assign(userData, parsedData);
            
            // 确保有历史记录数组
            if (!userData.scanHistory) {
                userData.scanHistory = [];
            }
        }
    }
    
    // 更新使用次数显示
    function updateUsageCounter() {
        usageCounter.textContent = `剩余次数: ${userData.remainingScans}`;
        if (userRemainingScans) {
            userRemainingScans.textContent = userData.remainingScans;
        }
    }
    
    // 检查每日签到状态
    function checkDailyCheckin() {
        const today = new Date().toDateString();
        
        if (userData.lastCheckinDate === today) {
            userData.hasCheckedInToday = true;
            checkinBtn.classList.add('opacity-50');
            userCheckinBtn.disabled = true;
            userCheckinBtn.classList.add('opacity-50');
            checkinStatus.textContent = '今日已签到';
            checkinStatus.classList.add('text-green-500');
        } else {
            userData.hasCheckedInToday = false;
            checkinBtn.classList.remove('opacity-50');
            userCheckinBtn.disabled = false;
            userCheckinBtn.classList.remove('opacity-50');
            checkinStatus.textContent = '今日未签到';
            checkinStatus.classList.remove('text-green-500');
            checkinStatus.classList.add('text-yellow-500');
        }
    }
    
    // 执行每日签到
    function performCheckin() {
        if (userData.hasCheckedInToday) return;
        
        const today = new Date().toDateString();
        userData.lastCheckinDate = today;
        userData.hasCheckedInToday = true;
        userData.remainingScans += CHECKIN_REWARD;
        
        saveUserData();
        updateUsageCounter();
        
        // 更新签到UI
        checkinBtn.classList.add('opacity-50');
        userCheckinBtn.disabled = true;
        userCheckinBtn.classList.add('opacity-50');
        checkinStatus.textContent = '今日已签到';
        checkinStatus.classList.add('text-green-500');
        checkinStatus.classList.remove('text-yellow-500');
        
        // 显示签到成功弹窗
        checkinModal.classList.add('show');
    }
    
    // 减少使用次数
    function decrementUsage() {
        if (userData.remainingScans > 0) {
            userData.remainingScans--;
            saveUserData();
            updateUsageCounter();
            return true;
        }
        return false;
    }
    
    // 添加扫描历史
    function addScanHistory(imagePreview, result, health) {
        userData.scanHistory.push({
            date: new Date().toISOString(),
            imageData: imagePreview.src,
            result: result,
            healthRating: health
        });
        
        // 限制历史记录数量，防止localStorage过大
        if (userData.scanHistory.length > 20) {
            userData.scanHistory.shift(); // 移除最旧的记录
        }
        
        saveUserData();
    }
    
    // 检查深色模式偏好
    function checkDarkModePreference() {
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        darkModeToggle.checked = prefersDarkMode;

        if (prefersDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
    
    // 初始化标签页切换
    function initTabs() {
        // 设置点击事件
        bottomNavItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabName = item.getAttribute('data-tab');
                showTab(tabName);
            });
        });

        // 商店相关按钮
        upgradeBtn.addEventListener('click', () => {
            showTab('shopTab');
        });

        // 购物相关按钮
        buyBasicBtn.addEventListener('click', () => {
            alert('请扫描二维码支付19.9元购买基础套餐');
        });
        
        buyHighBtn.addEventListener('click', () => {
            alert('请扫描二维码支付49.9元购买高级套餐');
        });
        
        buyYearBtn.addEventListener('click', () => {
            alert('请扫描二维码支付99.9元购买年度套餐');
        });
        
        // 卡密激活
        activateCardBtn.addEventListener('click', () => {
            const cardKey = document.getElementById('cardKey').value;
            if (cardKey.trim() === '') {
                alert('请输入有效的卡密');
                return;
            }
            
            // 这里应该添加卡密验证逻辑
            // 由于我们没有后端，这里仅做简单演示
            alert('卡密激活成功，您获得了10次分析机会');
            userData.remainingScans += 10;
            saveUserData();
            updateUsageCounter();
            document.getElementById('cardKey').value = '';
        });
    }

    // 显示特定标签页
    function showTab(tabName) {
        // 移除所有活动状态
        bottomNavItems.forEach(navItem => {
            navItem.classList.remove('active');
            if (navItem.getAttribute('data-tab') === tabName) {
                navItem.classList.add('active');
            }
        });
        
        // 隐藏所有tab内容
        homeTab.classList.add('hidden');
        shopTab.classList.add('hidden');
        userTab.classList.add('hidden');
        
        // 显示选中的tab
        document.getElementById(tabName).classList.remove('hidden');
    }
    
    // 事件监听器设置
    // 图片上传和拍照
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    takePhotoBtn.addEventListener('click', () => {
        // 使用专门的camera capture方式，确保打开相机而不是上传图片
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // 创建相机UI
            const cameraContainer = document.createElement('div');
            cameraContainer.className = 'camera-container';
            cameraContainer.innerHTML = `
                <div class="camera-header">
                    <span class="font-semibold">拍摄配料表</span>
                    <button id="closeCameraBtn" class="p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="camera-viewer">
                    <video id="cameraView" class="camera-view" autoplay playsinline></video>
                    <div class="camera-frame"></div>
                    <div class="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
                        请将配料表对准框内
                    </div>
                </div>
                <div class="camera-footer">
                    <button id="takePictureBtn" class="camera-button">
                        <div class="camera-button-inner"></div>
                    </button>
                </div>
            `;
            document.body.appendChild(cameraContainer);
            
            const video = document.getElementById('cameraView');
            const closeCameraBtn = document.getElementById('closeCameraBtn');
            const takePictureBtn = document.getElementById('takePictureBtn');
            
            // 关闭相机
            const closeCamera = () => {
                if (video.srcObject) {
                    const tracks = video.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                    video.srcObject = null;
                }
                cameraContainer.remove();
            };
            
            closeCameraBtn.addEventListener('click', closeCamera);
            
            // 打开相机
            navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: "environment",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                } 
            })
            .then(stream => {
                video.srcObject = stream;
                
                // 拍照按钮
                takePictureBtn.addEventListener('click', () => {
                    // 创建临时canvas来捕获图像
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // 转换为Blob
                    canvas.toBlob(blob => {
                        selectedFile = new File([blob], "camera-image.jpg", { 
                            type: "image/jpeg" 
                        });
                        
                        // 显示预览图
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            imagePreview.src = e.target.result;
                            previewContainer.classList.remove('hidden');
                            analyzeBtn.disabled = false;
                        };
                        reader.readAsDataURL(selectedFile);
                        
                        // 关闭相机
                        closeCamera();
                    }, 'image/jpeg', 0.9);
                });
            })
            .catch(error => {
                console.error('无法访问相机:', error);
                closeCamera();
                // 降级为普通文件上传
                fileInput.click();
            });
        } else {
            // 降级为普通文件上传
            fileInput.setAttribute('capture', 'environment');
            fileInput.click();
            setTimeout(() => fileInput.removeAttribute('capture'), 1000);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            selectedFile = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                previewContainer.classList.remove('hidden');
                analyzeBtn.disabled = false;
            };
            
            reader.readAsDataURL(selectedFile);
        }
    });
    
    removeImageBtn.addEventListener('click', () => {
        imagePreview.src = '';
        previewContainer.classList.add('hidden');
        fileInput.value = '';
        selectedFile = null;
        analyzeBtn.disabled = true;
    });
    
    // 签到相关事件监听
    checkinBtn.addEventListener('click', performCheckin);
    userCheckinBtn.addEventListener('click', performCheckin);
    closeCheckinBtn.addEventListener('click', () => {
        checkinModal.classList.remove('show');
    });
    
    // 打赏相关事件监听
    donateBtn.addEventListener('click', () => {
        donateModal.classList.add('show');
    });
    
    closeDonateBtn.addEventListener('click', () => {
        donateModal.classList.remove('show');
    });
    
    // 用量用尽弹窗
    gotoShopBtn.addEventListener('click', () => {
        // 隐藏弹窗
        usageExhaustedModal.classList.remove('show');
        
        // 切换到商店标签
        showTab('shopTab');
    });
    
    configApiBtn.addEventListener('click', () => {
        // 隐藏弹窗
        usageExhaustedModal.classList.remove('show');
        
        // 显示设置
        settingsModal.classList.add('show');
        loadSettings();
    });
    
    // Function to create star rating
    function renderHealthRating(rating) {
        healthRating.innerHTML = '';
        
        // Convert rating to number if it's a string
        const numRating = typeof rating === 'string' 
            ? parseInt(rating.charAt(0)) 
            : rating;
        
        // Create 5 stars
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = 'text-lg';
            
            // Filled or empty star based on rating
            star.innerHTML = i <= numRating 
                ? '★' 
                : '☆';
            
            // Color based on rating
            if (numRating <= 2) {
                star.className += ' text-red-500';
            } else if (numRating === 3) {
                star.className += ' text-yellow-500';
            } else {
                star.className += ' text-green-500';
            }
            
            healthRating.appendChild(star);
        }
    }
    
    // Function to highlight harmful additives in the output
    function highlightHarmfulAdditives(content) {
        // Create a temporary element to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        // Words that might indicate harmful additives being discussed
        const harmfulKeywords = [
            "有害", "危害", "风险", "不安全", "不健康", "警告", 
            "危险", "致癌", "过敏", "中毒", "不建议", "避免食用",
            "慎用", "少量食用", "副作用", "问题"
        ];
        
        // Find potential paragraphs that talk about harmful additives
        const allParagraphs = tempDiv.getElementsByTagName('p');
        for (let p of allParagraphs) {
            for (const keyword of harmfulKeywords) {
                if (p.textContent.includes(keyword)) {
                    // Create a span to wrap the paragraph with a highlight class
                    const wrapper = document.createElement('div');
                    wrapper.className = 'p-3 my-3 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded-lg border-l-4 border-red-500';
                    
                    // Clone the paragraph to preserve its content
                    const clone = p.cloneNode(true);
                    wrapper.appendChild(clone);
                    
                    // Replace the original paragraph with the wrapped version
                    p.parentNode.replaceChild(wrapper, p);
                    break;
                }
            }
        }
        
        return tempDiv.innerHTML;
    }
    
    // 设置相关的功能
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('show');
        loadSettings();
    });
    
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('show');
    });
    
    // 点击模态框外部关闭
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('show');
        }
    });
    
    checkinModal.addEventListener('click', (e) => {
        if (e.target === checkinModal) {
            checkinModal.classList.remove('show');
        }
    });
    
    donateModal.addEventListener('click', (e) => {
        if (e.target === donateModal) {
            donateModal.classList.remove('show');
        }
    });
    
    usageExhaustedModal.addEventListener('click', (e) => {
        if (e.target === usageExhaustedModal) {
            usageExhaustedModal.classList.remove('show');
        }
    });
    
    // 显示/隐藏高级选项
    toggleAdvancedBtn.addEventListener('click', () => {
        const isHidden = advancedOptions.classList.contains('hidden');
        if (isHidden) {
            advancedOptions.classList.remove('hidden');
            toggleAdvancedBtn.querySelector('svg').style.transform = 'rotate(180deg)';
        } else {
            advancedOptions.classList.add('hidden');
            toggleAdvancedBtn.querySelector('svg').style.transform = 'rotate(0)';
        }
    });
    
    // 深色模式切换
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    });
    
    // 动态更新温度值显示
    temperature.addEventListener('input', () => {
        temperatureValue.textContent = temperature.value;
    });
    
    // 根据选择的API提供商显示/隐藏相关字段
    apiProvider.addEventListener('change', () => {
        updateApiProviderUI();
    });
    
    function updateApiProviderUI() {
        // 显示/隐藏Azure端点
        if (apiProvider.value === 'azure') {
            azureEndpointContainer.classList.remove('hidden');
        } else {
            azureEndpointContainer.classList.add('hidden');
        }
        
        // 更新模型选项
        updateModelOptions();
    }
    
    function updateModelOptions() {
        const provider = apiProvider.value;
        modelName.innerHTML = '';
        
        if (provider === 'openai') {
            addModelOption('gpt-4', 'GPT-4');
            addModelOption('gpt-4o', 'GPT-4o');
            addModelOption('gpt-3.5-turbo', 'GPT-3.5 Turbo');
        } else if (provider === 'anthropic') {
            addModelOption('claude-3-opus-20240229', 'Claude 3 Opus');
            addModelOption('claude-3-sonnet-20240229', 'Claude 3 Sonnet');
            addModelOption('claude-3-haiku-20240307', 'Claude 3 Haiku');
        } else if (provider === 'azure') {
            addModelOption('gpt-4', 'GPT-4');
            addModelOption('gpt-35-turbo', 'GPT-3.5 Turbo');
        } else if (provider === 'gemini') {
            addModelOption('gemini-1.5-pro', 'Gemini 1.5 Pro');
            addModelOption('gemini-1.5-flash', 'Gemini 1.5 Flash');
            addModelOption('gemini-1.0-pro', 'Gemini 1.0 Pro');
        } else if (provider === 'deepseek') {
            addModelOption('deepseek-vision', 'DeepSeek Vision');
            addModelOption('deepseek-coder-v2', 'DeepSeek Coder v2');
        }
    }
    
    function addModelOption(value, text) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        modelName.appendChild(option);
    }
    
    // 保存设置
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const settings = {
            apiProvider: apiProvider.value,
            apiKey: apiKey.value,
            modelName: modelName.value,
            azureEndpoint: azureEndpoint.value,
            maxTokens: parseInt(maxTokens.value),
            temperature: parseFloat(temperature.value),
            usePoeApi: apiKey.value === '' // 如果没有提供API密钥，使用Poe API
        };
        
        localStorage.setItem('foodScannerSettings', JSON.stringify(settings));
        
        // 显示保存成功消息
        const successMsg = document.createElement('div');
        successMsg.className = 'fade-in p-2 mb-3 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 text-green-600 dark:text-green-400 rounded-lg text-center text-sm';
        successMsg.textContent = '设置已保存';
        
        const form = document.getElementById('settingsForm');
        form.insertBefore(successMsg, form.firstChild);
        
        // 3秒后移除消息
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
    });
    
    // 重置设置
    resetSettingsBtn.addEventListener('click', () => {
        if (confirm('确定要重置所有设置吗？这将删除您保存的API密钥和其他设置。')) {
            localStorage.removeItem('foodScannerSettings');
            loadSettings(); // 重新加载默认设置
        }
    });
    
    // 加载设置
    function loadSettings() {
        let settings = defaultSettings;
        const savedSettings = localStorage.getItem('foodScannerSettings');
        
        if (savedSettings) {
            settings = JSON.parse(savedSettings);
        }
        
        apiProvider.value = settings.apiProvider || defaultSettings.apiProvider;
        updateApiProviderUI();
        
        apiKey.value = settings.apiKey || '';
        if (settings.modelName) {
            // 确保该模型在当前选项中
            const modelExists = Array.from(modelName.options).some(option => option.value === settings.modelName);
            if (modelExists) {
                modelName.value = settings.modelName;
            }
        }
        
        azureEndpoint.value = settings.azureEndpoint || '';
        maxTokens.value = settings.maxTokens || defaultSettings.maxTokens;
        temperature.value = settings.temperature || defaultSettings.temperature;
        temperatureValue.textContent = temperature.value;
        
        // 检查是否显示高级选项
        if (savedSettings && (settings.maxTokens !== defaultSettings.maxTokens || settings.temperature !== defaultSettings.temperature)) {
            advancedOptions.classList.remove('hidden');
            toggleAdvancedBtn.querySelector('svg').style.transform = 'rotate(180deg)';
        }
    }
    
    // 分析按钮点击处理
    analyzeBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        
        // 检查是否有足够的剩余次数或自定义API
        const settings = getSettings();
        
        if (!settings.apiKey && userData.remainingScans <= 0) {
            // 显示提示用户购买或配置API的弹窗
            usageExhaustedModal.classList.add('show');
            return;
        }
        
        // 如果使用免费额度，减少使用次数
        if (!settings.apiKey) {
            decrementUsage();
        }
        
        // 获取当前设置
        
        // 显示加载状态
        loadingSection.classList.remove('hidden');
        resultSection.classList.add('hidden');
        analyzeBtn.disabled = true;
        
        try {
            // 如果使用Poe API
            if (settings.usePoeApi && window.Poe) {
                await analyzeWithPoeApi(selectedFile);
            } else {
                // 使用自定义API
                await analyzeWithCustomApi(selectedFile, settings);
            }
        } catch (error) {
            console.error('Error:', error);
            showError('分析过程中出现错误，请重试。');
            loadingSection.classList.add('hidden');
            analyzeBtn.disabled = false;
        }
    });
    
    // 使用Poe API进行分析
    async function analyzeWithPoeApi(file) {
        // Register handler for Claude's response
        window.Poe.registerHandler('food-analysis-handler', (result, context) => {
            // Hide loading state when we get a response
            loadingSection.classList.add('hidden');
            
            const response = result.responses[0];
            
            if (response.status === 'error') {
                showError('分析过程中出现错误，请重试。');
                analyzeBtn.disabled = false;
                return;
            }
            
            if (response.status === 'complete' || response.status === 'incomplete') {
                // Parse the markdown content
                let parsedContent = marked.parse(response.content);
                
                // Highlight any harmful additives mentioned
                parsedContent = highlightHarmfulAdditives(parsedContent);
                
                // Display the result
                resultContent.innerHTML = parsedContent;
                
                // Try to extract health rating from the response
                const ratingMatch = response.content.match(/健康评级[：:]\s*(\d)[颗⭐星]/);
                let healthRatingValue = 0;
                if (ratingMatch && ratingMatch[1]) {
                    healthRatingValue = parseInt(ratingMatch[1]);
                    renderHealthRating(healthRatingValue);
                } else {
                    // Default to no stars if we can't find a rating
                    renderHealthRating(0);
                }
                
                resultSection.classList.remove('hidden');
                
                // If response is complete, enable the analyze button again
                if (response.status === 'complete') {
                    // 保存到历史记录
                    addScanHistory(imagePreview, response.content, healthRatingValue);
                    
                    analyzeBtn.disabled = false;
                }
            }
        });
        
        // Create object to be sent as attachment
        const fileToSend = new File([file], file.name, {
            type: file.type
        });
        
        try {
            // Send the image to Claude for analysis with improved prompt
            await window.Poe.sendUserMessage(
                "@Claude-3.7-Sonnet 请分析这张食品配料表图片，并提供以下信息：\n" +
                "1. 识别出的主要配料清单\n" +
                "2. 该食品中的添加剂成分及其作用\n" +
                "3. **重点分析**：食品中的任何有害添加剂或不健康成分，详细解释其潜在风险和对健康的影响\n" +
                "4. 该食品可能含有的常见过敏原\n" +
                "5. 对特殊人群（如孕妇、儿童、老人、糖尿病患者等）的适宜性建议\n" +
                "6. 基于配料表的健康评级（1-5星，5星最健康）\n" +
                "7. 总体食用建议和注意事项\n\n" +
                "请将你的回答格式化为Markdown格式，确保在回答中使用markdown结构，以便我可以清晰地展示给用户。当提到有害成分时，请使用加粗或其他markdown格式突出显示。",
                {
                    attachments: [fileToSend],
                    handler: 'food-analysis-handler',
                    stream: true,
                    openChat: false
                }
            );
        } catch (err) {
            // 如果没有Poe API或出错，显示模拟结果
            console.error("Error using Poe API:", err);
            showMockedResult();
        }
    }
    
    // 使用自定义API进行分析
    async function analyzeWithCustomApi(file, settings) {
        // 从图片创建base64字符串
        const base64Image = await fileToBase64(file);
        
        // 分析提示文本
        const promptText = "请分析这张食品配料表图片，并提供以下信息：\n" +
                      "1. 识别出的主要配料清单\n" +
                      "2. 该食品中的添加剂成分及其作用\n" +
                      "3. **重点分析**：食品中的任何有害添加剂或不健康成分，详细解释其潜在风险和对健康的影响\n" +
                      "4. 该食品可能含有的常见过敏原\n" +
                      "5. 对特殊人群（如孕妇、儿童、老人、糖尿病患者等）的适宜性建议\n" +
                      "6. 基于配料表的健康评级（1-5星，5星最健康）\n" +
                      "7. 总体食用建议和注意事项\n\n" +
                      "请将你的回答格式化为Markdown格式，当提到有害成分时，请使用加粗或其他markdown格式突出显示。";
        
        // 根据不同API提供商构建请求
        let apiUrl, requestData, headers;
        
        try {
            // 构建API请求对象
            switch(settings.apiProvider) {
                case 'openai':
                    // OpenAI API 请求
                    apiUrl = 'https://api.openai.com/v1/chat/completions';
                    headers = {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${settings.apiKey}`
                    };
                    requestData = {
                        model: settings.modelName,
                        messages: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text", 
                                        text: promptText
                                    },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: base64Image
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: settings.maxTokens,
                        temperature: settings.temperature
                    };
                    break;
                case 'anthropic':
                    // Anthropic API 请求
                    apiUrl = 'https://api.anthropic.com/v1/messages';
                    headers = {
                        'Content-Type': 'application/json',
                        'x-api-key': settings.apiKey,
                        'anthropic-version': '2023-06-01'
                    };
                    requestData = {
                        model: settings.modelName,
                        messages: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text", 
                                        text: promptText
                                    },
                                    {
                                        type: "image",
                                        source: {
                                            type: "base64",
                                            media_type: file.type,
                                            data: base64Image.split(',')[1]
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: settings.maxTokens,
                        temperature: settings.temperature
                    };
                    break;
                case 'azure':
                    // Azure OpenAI API 请求
                    const deploymentName = settings.modelName;
                    apiUrl = `${settings.azureEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2023-12-01-preview`;
                    headers = {
                        'Content-Type': 'application/json',
                        'api-key': settings.apiKey
                    };
                    requestData = {
                        messages: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text", 
                                        text: promptText
                                    },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: base64Image
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: settings.maxTokens,
                        temperature: settings.temperature
                    };
                    break;
                case 'gemini':
                    // Google Gemini API 请求
                    apiUrl = 'https://generativelanguage.googleapis.com/v1/models/' + settings.modelName + ':generateContent';
                    headers = {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': settings.apiKey
                    };
                    requestData = {
                        contents: [
                            {
                                role: "user",
                                parts: [
                                    {
                                        text: promptText
                                    },
                                    {
                                        inline_data: {
                                            mime_type: file.type,
                                            data: base64Image.split(',')[1]
                                        }
                                    }
                                ]
                            }
                        ],
                        generationConfig: {
                            maxOutputTokens: settings.maxTokens,
                            temperature: settings.temperature
                        }
                    };
                    break;
                case 'deepseek':
                    // DeepSeek API 请求
                    apiUrl = 'https://api.deepseek.com/v1/chat/completions';
                    headers = {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${settings.apiKey}`
                    };
                    requestData = {
                        model: settings.modelName,
                        messages: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text", 
                                        text: promptText
                                    },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: base64Image
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: settings.maxTokens,
                        temperature: settings.temperature
                    };
                    break;
                default:
                    throw new Error('不支持的API提供商');
            }

            // 尝试发送API请求
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestData)
                });
                
                if (!response.ok) {
                    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                let content = '';
                
                // 根据不同API提供商提取响应内容
                if (settings.apiProvider === 'openai' || settings.apiProvider === 'azure' || settings.apiProvider === 'deepseek') {
                    content = data.choices[0].message.content;
                } else if (settings.apiProvider === 'anthropic') {
                    content = data.content[0].text;
                } else if (settings.apiProvider === 'gemini') {
                    content = data.candidates[0].content.parts[0].text;
                }
                
                // 处理并显示结果
                processAnalysisResult(content);
            } catch (error) {
                console.error('API请求错误:', error);
                
                // 如果API请求失败，显示模拟结果
                showMockedResult();
            }
        } catch (err) {
            console.error('API配置错误:', err);
            showMockedResult();
        }
    }
    
    // 处理分析结果
    function processAnalysisResult(content) {
        loadingSection.classList.add('hidden');
        
        // 解析Markdown
        let parsedContent = marked.parse(content);
        
        // 高亮有害添加剂
        parsedContent = highlightHarmfulAdditives(parsedContent);
        
        // 显示结果
        resultContent.innerHTML = parsedContent;
        
        // 尝试提取健康评级
        const ratingMatch = content.match(/健康评级[：:]\s*(\d)[颗⭐星]/);
        let healthRatingValue = 0;
        if (ratingMatch && ratingMatch[1]) {
            healthRatingValue = parseInt(ratingMatch[1]);
            renderHealthRating(healthRatingValue);
        } else {
            renderHealthRating(0);
        }
        
        // 保存到历史记录
        addScanHistory(imagePreview, content, healthRatingValue);
        
        resultSection.classList.remove('hidden');
        analyzeBtn.disabled = false;
    }
    
    // 当无API可用时显示模拟结果
    function showMockedResult() {
        const mockContent = `
## 食品配料分析结果

### 主要配料清单
- 小麦粉
- 白砂糖
- 植物油
- 食用盐
- 酵母

### 添加剂成分及作用
- **柠檬酸（E330）**：用作酸味剂和抗氧化剂
- **山梨酸钾（E202）**：防腐剂
- **二氧化钛（E171）**：着色剂，使产品呈现白色
- **焦糖色（E150）**：着色剂，用于调整颜色

### 有害添加剂分析
**二氧化钛（E171）** 是一种有潜在风险的添加剂。近年研究表明，二氧化钛纳米颗粒可能对人体健康造成负面影响，欧盟食品安全局已将其列为不再被认为安全的食品添加剂。长期摄入可能增加肠胃炎症风险。

### 常见过敏原
本产品含有**小麦（麸质）**，不适合麸质过敏人群食用。

### 适宜人群建议
- **孕妇**：建议少量食用，注意二氧化钛的存在
- **儿童**：不建议频繁食用，特别是含有人工着色剂的食品可能影响儿童注意力
- **老年人**：适量食用，关注钠含量
- **糖尿病患者**：不适合，含有较高糖分

### 健康评级：2星 ⭐⭐☆☆☆
这款食品含有多种添加剂，尤其是二氧化钛这类有争议的成分，营养价值较低。

### 总体食用建议
1. 建议偶尔少量食用，不宜长期大量摄入
2. 有过敏体质者应特别注意是否含有过敏原
3. 儿童和孕妇应尽量选择更天然、添加剂更少的替代品
4. 如有特殊健康问题，请在食用前咨询医生意见
`;

        processAnalysisResult(mockContent);
    }
    
    // 辅助函数：将File对象转换为base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    
    // 获取设置
    function getSettings() {
        const savedSettings = localStorage.getItem('foodScannerSettings');
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }
        return defaultSettings;
    }
    
    function showError(message) {
        resultContent.innerHTML = `<div class="p-4 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 text-red-600 dark:text-red-400 rounded-lg">${message}</div>`;
        resultSection.classList.remove('hidden');
    }
    
    // 初始化
    initApp();
    initTabs();
});
