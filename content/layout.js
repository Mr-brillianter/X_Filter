// 瀑布流布局引擎
class XFilterLayoutEngine {
  constructor(settings) {
    this.settings = settings;
    this.container = null;
    this.items = [];
  }

  init() {
    this.container = document.createElement('div');
    this.container.id = 'xfilter-waterfall-container';
    this.container.className = 'xfilter-waterfall';
    this.hideOriginalTimeline();
    const main = document.querySelector('main') || document.body;
    main.appendChild(this.container);
    this.setupResizeObserver();
    XFilterHelpers.log('Layout engine initialized');
  }

  hideOriginalTimeline() {
    const timeline = document.querySelector('[data-testid="primaryColumn"]');
    if (timeline) {
      timeline.style.display = 'none';
      timeline.setAttribute('data-xfilter-hidden', 'true');
    }
  }

  showOriginalTimeline() {
    const timeline = document.querySelector('[data-testid="primaryColumn"]');
    if (timeline) {
      timeline.style.display = '';
      timeline.removeAttribute('data-xfilter-hidden');
    }
  }

  addItem(tweet, media) {
    if (!media.hasMedia) return;
    const item = this.createMediaCard(tweet, media);
    this.items.push(item);
    this.container.appendChild(item.element);
    this.updateLayout();
  }

  createMediaCard(tweet, media) {
    const card = document.createElement('div');
    card.className = 'xfilter-card';
    card.setAttribute('data-tweet-id', tweet.getAttribute('data-xfilter-id'));
    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'xfilter-media-container';
    if (media.videos.length > 0) {
      this.addVideoToCard(mediaContainer, media.videos[0]);
    } else if (media.images.length > 0) {
      this.addImagesToCard(mediaContainer, media.images);
    }
    card.appendChild(mediaContainer);
    const overlay = this.createOverlay(tweet, media);
    card.appendChild(overlay);
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.xfilter-overlay')) {
        this.openMediaModal(tweet);
      }
    });
    return { element: card, tweet: tweet, media: media };
  }

  addVideoToCard(container, video) {
    const videoElement = document.createElement('video');
    videoElement.className = 'xfilter-video';
    videoElement.src = video.src;
    videoElement.poster = video.poster;
    videoElement.controls = false;
    videoElement.muted = true;
    videoElement.loop = true;
    container.addEventListener('mouseenter', () => {
      videoElement.play().catch(e => XFilterHelpers.error('Video play error:', e));
    });
    container.addEventListener('mouseleave', () => {
      videoElement.pause();
      videoElement.currentTime = 0;
    });
    container.appendChild(videoElement);
  }

  addImagesToCard(container, images) {
    if (images.length === 1) {
      const img = document.createElement('img');
      img.className = 'xfilter-image';
      img.src = images[0].src;
      img.alt = images[0].alt;
      img.loading = 'lazy';
      container.appendChild(img);
    } else {
      container.classList.add('xfilter-multi-image');
      images.forEach((image, index) => {
        if (index < 4) {
          const img = document.createElement('img');
          img.className = 'xfilter-image';
          img.src = image.src;
          img.alt = image.alt;
          img.loading = 'lazy';
          container.appendChild(img);
        }
      });
      if (images.length > 4) {
        const more = document.createElement('div');
        more.className = 'xfilter-more-count';
        more.textContent = `+${images.length - 4}`;
        container.appendChild(more);
      }
    }
  }

  createOverlay(tweet, media) {
    const overlay = document.createElement('div');
    overlay.className = 'xfilter-overlay';
    const author = this.extractAuthor(tweet);
    const text = this.extractText(tweet);
    const stats = this.extractStats(tweet);
    overlay.innerHTML = `
      <div class="xfilter-overlay-content">
        <div class="xfilter-author">${author}</div>
        ${text ? `<div class="xfilter-text">${text}</div>` : ''}
        <div class="xfilter-stats">
          ${stats.likes ? `<span>❤️ ${stats.likes}</span>` : ''}
          ${stats.retweets ? `<span>🔄 ${stats.retweets}</span>` : ''}
          ${stats.replies ? `<span>💬 ${stats.replies}</span>` : ''}
        </div>
      </div>
    `;
    return overlay;
  }

  extractAuthor(tweet) {
    const authorElement = tweet.querySelector('[data-testid="User-Name"]') ||
                         tweet.querySelector('a[role="link"][href*="/"]');
    return authorElement ? authorElement.textContent.trim() : 'Unknown';
  }

  extractText(tweet) {
    const textElement = tweet.querySelector('[data-testid="tweetText"]') ||
                       tweet.querySelector('[lang]');
    if (textElement) {
      const text = textElement.textContent.trim();
      return text.length > 100 ? text.substring(0, 100) + '...' : text;
    }
    return '';
  }

  extractStats(tweet) {
    const stats = { likes: 0, retweets: 0, replies: 0 };
    const buttons = tweet.querySelectorAll('[role="button"]');
    buttons.forEach(button => {
      const ariaLabel = button.getAttribute('aria-label') || '';
      const text = button.textContent.trim();
      if (ariaLabel.includes('like') || ariaLabel.includes('Like')) {
        stats.likes = this.parseCount(text);
      } else if (ariaLabel.includes('retweet') || ariaLabel.includes('Retweet')) {
        stats.retweets = this.parseCount(text);
      } else if (ariaLabel.includes('repl') || ariaLabel.includes('Repl')) {
        stats.replies = this.parseCount(text);
      }
    });
    return stats;
  }

  parseCount(text) {
    const match = text.match(/[\d.]+[KMB]?/i);
    if (!match) return 0;
    const num = match[0];
    if (num.includes('K')) return parseFloat(num) * 1000;
    if (num.includes('M')) return parseFloat(num) * 1000000;
    if (num.includes('B')) return parseFloat(num) * 1000000000;
    return parseInt(num) || 0;
  }

  openMediaModal(tweet) {
    const link = tweet.querySelector('a[href*="/status/"]');
    if (link) link.click();
  }

  updateLayout() {
    this.container.style.setProperty('--columns', this.settings.columns);
    this.container.style.setProperty('--gap', `${this.settings.gap}px`);
  }

  setupResizeObserver() {
    const resizeHandler = XFilterHelpers.debounce(() => {
      this.updateLayout();
    }, 250);
    window.addEventListener('resize', resizeHandler);
  }

  clear() {
    if (this.container) {
      this.container.innerHTML = '';
      this.items = [];
    }
  }

  destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.showOriginalTimeline();
    this.items = [];
  }

  switchToOriginal() {
    if (this.container) this.container.style.display = 'none';
    this.showOriginalTimeline();
  }

  switchToWaterfall() {
    if (this.container) this.container.style.display = '';
    this.hideOriginalTimeline();
  }
}

