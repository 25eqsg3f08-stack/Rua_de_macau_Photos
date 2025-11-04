// download.js - 控制照片下载及单日10次限额（无需依赖main.js）
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const downloadBtn = document.getElementById('download-btn');
    const currentPhoto = document.getElementById('current-photo');
    const downloadCountEl = document.getElementById('download-count');
    const photoInfoEl = document.getElementById('photo-info');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // 初始化下载次数（用localStorage存储，按日期重置）
    let downloadData = JSON.parse(localStorage.getItem('photoDownloadData')) || {};
    const today = new Date().toISOString().split('T')[0]; // 格式：YYYY-MM-DD

    // 非当天数据则重置
    if (downloadData.date !== today) {
        downloadData = { date: today, remaining: 10 };
        localStorage.setItem('photoDownloadData', JSON.stringify(downloadData));
    }

    // 更新下载按钮状态和剩余次数显示
    function updateDownloadStatus() {
        // 1. 更新剩余次数文本
        downloadCountEl.textContent = `今日剩余下载次数：${downloadData.remaining}`;
        
        // 2. 控制下载按钮禁用/启用（有照片+有剩余次数才启用）
        const hasPhoto = !!currentPhoto.src && currentPhoto.style.display !== 'none';
        const hasRemaining = downloadData.remaining > 0;
        downloadBtn.disabled = !(hasPhoto && hasRemaining);
        
        // 3. 按钮样式适配
        if (downloadBtn.disabled) {
            downloadBtn.style.backgroundColor = '#bdc3c7';
            downloadBtn.style.cursor = 'not-allowed';
        } else {
            downloadBtn.style.backgroundColor = '#2c3e50'; // 继承nav-btn原背景色
            downloadBtn.style.cursor = 'pointer';
        }
    }

    // 下载照片核心逻辑
    function downloadCurrentPhoto() {
        if (!currentPhoto.src) return;
        
        if (downloadData.remaining <= 0) {
            alert('今日下载次数已用完（单日限10次），请明天再试！');
            return;
        }

        // 提取当前照片名称
        const photoNameMatch = photoInfoEl.textContent.match(/照片名称：(.+) \//);
        const photoName = photoNameMatch ? photoNameMatch[1] : 'macau-street-photo';

        // 触发下载
        const downloadLink = document.createElement('a');
        downloadLink.href = currentPhoto.src;
        downloadLink.download = photoName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // 更新次数并存储
        downloadData.remaining--;
        localStorage.setItem('photoDownloadData', JSON.stringify(downloadData));
        updateDownloadStatus();
        alert(`照片《${photoName}》下载成功！今日剩余：${downloadData.remaining}次`);
    }

    // -------------- 关键：监听照片切换（无需改main.js）--------------
    // 1. 监听照片加载完成事件（首次加载/切换照片时触发）
    currentPhoto.addEventListener('load', updateDownloadStatus);
    
    // 2. 监听上一张/下一张按钮点击（点击后照片会切换，延迟更新状态）
    [prevBtn, nextBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            // 按钮点击后照片切换有延迟，加50ms等待确保DOM更新
            setTimeout(updateDownloadStatus, 50);
        });
    });

    // 3. 监听照片显示/隐藏状态变化（加载失败/成功时状态会变）
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            // 监测照片的display样式或src变化
            if (mutation.attributeName === 'style' || mutation.attributeName === 'src') {
                updateDownloadStatus();
            }
        });
    });
    // 启动监听：监测照片的style和src属性
    observer.observe(currentPhoto, { attributes: true, attributeFilter: ['style', 'src'] });

    // 绑定下载按钮点击事件
    downloadBtn.addEventListener('click', downloadCurrentPhoto);

    // 初始加载时更新一次状态
    updateDownloadStatus();
});
