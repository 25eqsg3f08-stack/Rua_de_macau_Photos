// GitHub配置（必须替换为你的实际信息！）
const GITHUB_CONFIG = {
    user: "25eqsg3f08-stack", // 例："octocat"（仅用户名，非邮箱）
    repo: "Rua_de_macau_Photos", // 你的仓库名（已确认）
    repoPath: "/Rua_de_macau_Photos" // 个人主页仓库（用户名.github.io）留空；普通仓库填 "/Rua_de_macau_Photos"
};

// 核心配置（替换为你的接收邮箱）
const RECIPIENT_EMAIL = "25eqsg3f08@g.elctp.k12.edu.mo"; // 例："xxx@xxx.com"

// 常量配置
const PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
let photoFiles = [];
let currentIndex = 0;

// DOM元素
const DOM = {
    currentPhoto: document.getElementById("current-photo"),
    photoInfo: document.getElementById("photo-info"),
    loading: document.getElementById("loading"),
    error: document.getElementById("error"),
    prevBtn: document.getElementById("prev-btn"),
    nextBtn: document.getElementById("next-btn"),
    emailInput: document.getElementById("email"),
    contentInput: document.getElementById("content"),
    sendEmailBtn: document.getElementById("send-email-btn"),
    templateBtns: document.querySelectorAll(".template-btn")
};

// 结构化命令验证（防恶意/违规表述，与cmd.js统一规则）
function validateCommand(cmd) {
    const allowedPrefixes = ["PHOTO_ADD|", "PHOTO_OPTIMIZE|", "INFO_ADD|", "INFO_CORRECT|", "FUNCTION_ADD|"];
    const forbiddenWords = ["垃圾", "废物", "快点", "必须", "赶紧", "太差", "恶心", "辱骂", "施压", "催促", "没用", "烂"];
    
    const hasValidPrefix = allowedPrefixes.some(prefix => cmd.startsWith(prefix));
    const hasForbiddenWord = forbiddenWords.some(word => cmd.includes(word));
    
    return hasValidPrefix && !hasForbiddenWord;
}

// 初始化：从GitHub API读取照片
async function init() {
    try {
        const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.user}/${GITHUB_CONFIG.repo}/contents/`;
        const response = await fetch(apiUrl, {
            headers: { "Accept": "application/vnd.github.v3+json" }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "仓库文件获取失败，请检查用户名和仓库名是否正确");
        }
        
        const files = await response.json();
        filterPhotoFiles(files);
        
        if (photoFiles.length === 0) {
            showError("根目录未找到照片！请将照片上传到仓库根目录（与index.html同级）");
            return;
        }
        
        // 加载第一张照片
        DOM.loading.style.display = "none";
        DOM.currentPhoto.style.display = "block";
        loadPhoto(0);
        updateBtnStatus();
        bindTemplateEvents();
        bindEmailEvent();

    } catch (error) {
        showError(error.message);
        console.error("初始化错误：", error);
    }
}

// 筛选照片文件（仅保留图片格式）
function filterPhotoFiles(files) {
    photoFiles = files
        .filter(file => file.type === "file" && PHOTO_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext)))
        .map(file => file.name)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
}

// 加载指定索引的照片
function loadPhoto(index) {
    const photoName = encodeURIComponent(photoFiles[index]);
    const photoPath = `${GITHUB_CONFIG.repoPath}/${photoName}`;
    
    DOM.currentPhoto.src = photoPath;
    DOM.currentPhoto.alt = `澳门内港街景：${photoFiles[index]}`;
    currentIndex = index;
    updatePhotoInfo();

    DOM.currentPhoto.onerror = () => {
        showError(`照片「${photoFiles[index]}」加载失败，请检查文件名是否包含特殊字符（如#、&）`);
        DOM.currentPhoto.style.display = "none";
    };
}

// 更新照片信息（名称+总数）
function updatePhotoInfo() {
    DOM.photoInfo.textContent = `照片名称：${photoFiles[currentIndex]} / 总数：${currentIndex + 1}/${photoFiles.length}`;
}

// 更新切换按钮状态
function updateBtnStatus() {
    DOM.prevBtn.disabled = currentIndex === 0;
    DOM.nextBtn.disabled = currentIndex === photoFiles.length - 1;
}

// 绑定命令模板复制事件
function bindTemplateEvents() {
    DOM.templateBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            let template = btn.getAttribute("data-template");
            
            // 替换[PHOTO_NAME]为当前照片名
            if (photoFiles.length > 0) {
                template = template.replace("[PHOTO_NAME]", photoFiles[currentIndex]);
            }

            // 验证命令合法性
            if (!validateCommand(template)) {
                alert("❌ 命令格式不合法，仅支持页面提供的固定模板");
                return;
            }

            DOM.contentInput.value = template;
            // 复制到剪贴板
            navigator.clipboard.writeText(template).then(() => {
                alert(`✅ 结构化命令已复制：\n${template}`);
            }).catch(() => {
                alert("❌ 复制失败，请手动复制输入框内容");
            });
        });
    });
}

// 绑定发送邮件事件
function bindEmailEvent() {
    DOM.sendEmailBtn.addEventListener("click", () => {
        const userEmail = DOM.emailInput.value.trim();
        const command = DOM.contentInput.value.trim();
        const currentPhotoName = photoFiles.length > 0 ? photoFiles[currentIndex] : "Unknown Photo";

        // 基础验证
        if (!userEmail) {
            alert("❌ 请填写你的联系邮箱！");
            DOM.emailInput.focus();
            return;
        }
        if (!command) {
            alert("❌ 请选择页面提供的命令模板！");
            return;
        }

        // 命令合法性验证
        if (!validateCommand(command)) {
            alert("❌ 命令不合法，禁止添加敏感/施压表述，仅支持固定模板");
            DOM.contentInput.value = "";
            return;
        }

        // 邮件主题和正文（结构化格式）
        const subject = encodeURIComponent(`Macau Photo Request - ${currentPhotoName}`);
        const body = encodeURIComponent(`
📧 联系人邮箱：${userEmail}
🖼️ 当前照片：${currentPhotoName}
📝 结构化命令：${command}
⚠️  声明：本命令符合规范，无恶意表述，尊重拍摄者劳动成果

---
此邮件通过澳门内港影像集网页发送
This email is sent via Macau Rare Streets Photo Collection Website
        `);

        // 唤起本地邮件客户端
        window.location.href = `mailto:${RECIPIENT_EMAIL}?subject=${subject}&body=${body}`;
    });
}

// 显示错误提示
function showError(message) {
    DOM.loading.style.display = "none";
    DOM.error.style.display = "block";
    DOM.error.textContent = `❌ ${message}`;
}

// 绑定上一张/下一张按钮事件
DOM.prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
        DOM.error.style.display = "none";
        DOM.currentPhoto.style.display = "block";
        loadPhoto(currentIndex - 1);
        updateBtnStatus();
    }
});

DOM.nextBtn.addEventListener("click", () => {
    if (currentIndex < photoFiles.length - 1) {
        DOM.error.style.display = "none";
        DOM.currentPhoto.style.display = "block";
        loadPhoto(currentIndex + 1);
        updateBtnStatus();
    }
});

// 页面加载完成后初始化
window.addEventListener("load", init);
