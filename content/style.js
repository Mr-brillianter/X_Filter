// 样式注入器 - 管理样式注入和主题适配

class XFilterStyleInjector {
  constructor() {
    this.styleId = 'xfilter-dynamic-style';
    this.styleElement = null;
    this.observer = null;
  }

  /**
   * 初始化样式注入器
   */
  init() {
    this.createStyleElement();
    this.syncTheme();
    this.observeThemeChange();
    XFilterHelpers.log('Style injector initialized');
  }

  /**
   * 创建动态样式标签
   */
  createStyleElement() {
    if (document.getElementById(this.styleId)) {
      this.styleElement = document.getElementById(this.styleId);
    } else {
      this.styleElement = document.createElement('style');
      this.styleElement.id = this.styleId;
      document.head.appendChild(this.styleElement);
    }
  }

  /**
   * 同步当前 X 主题颜色
   * X 有三种模式：默认(Default)、昏暗(Dim)、黑色(Lights out)
   */
  syncTheme() {
    if (!this.styleElement) return;

    // 获取 body 背景色作为基准
    const bodyStyle = window.getComputedStyle(document.body);
    const bgColor = bodyStyle.backgroundColor;
    const textColor = bodyStyle.color;

    // 定义主题变量
    let cardBg, cardHoverBg, secondaryColor;

    // 简单的颜色判断逻辑
    if (this.isDarkTheme(bgColor)) {
      // 暗色模式处理
      if (bgColor === 'rgb(0, 0, 0)') {
        // 纯黑模式 (Lights out)
        cardBg = '#16181c'; // Twitter 卡片常用深灰
        cardHoverBg = '#1d1f23';
        secondaryColor = '#71767b';
      } else {
        // 昏暗模式 (Dim) - 蓝灰色
        // 通常是 rgb(21, 32, 43)
        cardBg = this.adjustColor(bgColor, 10); // 稍微亮一点
        cardHoverBg = this.adjustColor(bgColor, 20);
        secondaryColor = '#8b98a5';
      }
    } else {
      // 亮色模式
      cardBg = '#ffffff';
      cardHoverBg = '#f7f9f9';
      secondaryColor = '#536471';
    }

    // 注入 CSS 变量覆盖 waterfall.css 中的默认值
    const css = `
      :root {
        --xfilter-card-bg: ${cardBg} !important;
        --xfilter-card-hover-bg: ${cardHoverBg} !important;
        --xfilter-text-color: ${textColor} !important;
        --xfilter-secondary-color: ${secondaryColor} !important;
      }
      
      /* 强制背景色适配 */
      body.xfilter-active {
        background-color: ${bgColor} !important;
      }
    `;

    this.styleElement.textContent = css;
    XFilterHelpers.log('Theme synced:', { bgColor, cardBg });
  }

  /**
   * 判断是否为暗色主题
   */
  isDarkTheme(colorString) {
    // 简单的 RGB 解析
    const rgb = colorString.match(/\d+/g);
    if (!rgb) return false;
    
    // 计算亮度 (YIQ formula)
    const r = parseInt(rgb[0]);
    const g = parseInt(rgb[1]);
    const b = parseInt(rgb[2]);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    return yiq < 128;
  }

  /**
   * 颜色亮度调整 (辅助函数)
   * amount: 正数变亮，负数变暗
   */
  adjustColor(rgbString, amount) {
    const rgb = rgbString.match(/\d+/g);
    if (!rgb) return rgbString;

    const adjust = (c) => Math.min(255, Math.max(0, parseInt(c) + amount));
    
    const r = adjust(rgb[0]);
    const g = adjust(rgb[1]);
    const b = adjust(rgb[2]);

    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * 监听主题变化
   * Twitter 切换主题时会修改 body 的 backgroundColor
   */
  observeThemeChange() {
    this.observer = new MutationObserver(XFilterHelpers.debounce(() => {
      this.syncTheme();
    }, 200));

    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }

  /**
   * 注入全屏/沉浸式样式
   * 隐藏侧边栏，让瀑布流居中
   */
  toggleImmersiveMode(enable) {
    const immersiveStyleId = 'xfilter-immersive-style';
    let style = document.getElementById(immersiveStyleId);

    if (enable) {
      if (!style) {
        style = document.createElement('style');
        style.id = immersiveStyleId;
        document.head.appendChild(style);
      }
      // 隐藏侧边栏，调整主容器宽度
      style.textContent = `
        [data-testid="sidebarColumn"] {
          display: none !important;
        }
        main[role="main"] {
          max-width: 100% !important;
          width: 100% !important;
        }
        div[data-testid="primaryColumn"] {
          max-width: 100% !important; 
        }
        .xfilter-waterfall {
          max-width: 1600px !important;
        }
      `;
    } else {
      if (style) {
        style.remove();
      }
    }
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.styleElement) {
      this.styleElement.remove();
    }
    const immersive = document.getElementById('xfilter-immersive-style');
    if (immersive) immersive.remove();
  }
}