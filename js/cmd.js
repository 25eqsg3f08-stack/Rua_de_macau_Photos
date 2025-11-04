// 核心配置（与main.js保持一致）
const RECIPIENT_EMAIL = "你的接收邮箱地址"; // 替换为实际接收命令的邮箱

// DOM元素
const DOM = {
    cmdContent: document.getElementById("cmd-content"),
    templateBtns: document.querySelectorAll(".template-btn"),
    emailInput: document.getElementById("allcmd-email"),
    sendEmailBtn: document.getElementById("allcmd-send-email")
};

// 结构化命令验证（防止恶意/违规表述）
function validateCommand(cmd) {
    // 允许的命令前缀（仅支持以下固定格式）
    const allowedPrefixes = ["PHOTO_ADD|", "PHOTO_OPTIMIZE|", "INFO_ADD|", "INFO_CORRECT|", "FUNCTION_ADD|"];
    // 禁止的敏感词（可按需扩展）
    const forbiddenWords = ["垃圾", "废物", "快点", "必须", "赶紧", "太差", "恶心", "辱骂", "施压"];

    // 验证前缀
    const hasValidPrefix = allowedPrefixes.some(prefix => cmd.startsWith(prefix));
    if (!hasValidPrefix) return false;

    // 验证敏感词
    const hasForbiddenWord = forbiddenWords.some(word => cmd.includes(word));
    if (hasForbiddenWord) return false;

    return true;
}

// 绑定命令模板复制事件
DOM.templateBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const template = btn.getAttribute("data-template");
        
        // 验证命令格式（防止手动篡改模板）
        if (!validateCommand(template)) {
            alert("❌ 命令格式不合法，仅支持页面提供的固定模板");
            return;
        }

        DOM.cmdContent.value = template;
        // 复制到剪贴板
        navigator.clipboard.writeText(template).then(() => {
            alert(`✅ 结构化命令已复制：\n${template}`);
        }).catch(() => {
            alert("❌ 复制失败，请手动复制输入框内容");
        });
    });
});

// 发送邮件功能（验证命令合法性）
DOM.sendEmailBtn.addEventListener("click", () => {
    const userEmail = DOM.emailInput.value.trim();
    const command = DOM.cmdContent.value.trim();

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
        DOM.cmdContent.value = "";
        return;
    }

    // 邮件主题和正文（结构化格式，便于处理）
    const subject = encodeURIComponent("Macau Photo Request - Structured Command");
    const body = encodeURIComponent(`
📧 联系人邮箱：${userEmail}
📝 结构化命令：${command}
⚠️  声明：本命令符合规范，无恶意表述，尊重拍摄者劳动成果

---
此邮件通过澳门内港影像集规范命令页面发送
This email is sent via Macau Rare Streets Photo Structured Command Page
`);

    // 唤起邮件客户端
    window.location.href = `mailto:${RECIPIENT_EMAIL}?subject=${subject}&body=${body}`;
});

// 禁止手动编辑命令输入框（仅允许通过模板填充）
DOM.cmdContent.addEventListener("input", () => {
    const template = DOM.cmdContent.value.trim();
    if (!template) return;
    if (!validateCommand(template)) {
        alert("❌ 禁止手动输入命令，仅支持点击页面模板获取");
        DOM.cmdContent.value = "";
    }
});

