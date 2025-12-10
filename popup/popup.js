document.addEventListener('DOMContentLoaded', async () => {
  // UI 元素
  const toggleFilter = document.getElementById('toggle-filter');
  const countLoaded = document.getElementById('count-loaded');
  const countMedia = document.getElementById('count-media');
  const openSettings = document.getElementById('open-settings');

  // 初始化状态
  const settings = await XFilterStorage.get();
  toggleFilter.checked = settings.enabled;

  // 监听开关切换
  toggleFilter.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await XFilterStorage.set('enabled', enabled);
    
    // 通知当前标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { 
        type: 'TOGGLE_FILTER', 
        payload: { enabled } 
      });
    }
  });

  // 获取统计数据 (如果有)
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_STATS' }, (response) => {
        if (response && response.stats) {
          countLoaded.textContent = response.stats.total || 0;
          countMedia.textContent = response.stats.media || 0;
        }
      });
    }
  });

  // 打开设置页面 (预留)
  openSettings.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options/options.html'));
    }
  });
});