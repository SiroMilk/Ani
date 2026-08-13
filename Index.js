/**
 * TizenBrew module cho AnimeVietsub – Phiên bản chiến đấu
 * Chức năng:
 * - Chặn quảng cáo (request, iframe, script)
 * - Che giấu mọi dấu hiệu Developer Mode / debug
 * - Điều khiển video bằng remote TV đầy đủ
 * - Tự động phát video khi vào trang tập
 */

(function () {
  'use strict';

  // ============================================================
  // 1. CHE GIẤU DEVELOPER MODE & DẤU VẾT DEBUG
  // ============================================================
  function hideDeveloperTraces() {
    // Xóa webdriver (dấu hiệu tự động hóa)
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
      configurable: true
    });

    // Xóa debug flag
    Object.defineProperty(navigator, 'debug', {
      get: () => undefined,
      configurable: true
    });

    // Xóa thuộc tính plugin mặc định (có thể bị kiểm tra)
    if (navigator.plugins && navigator.plugins.length > 0) {
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          const arr = [];
          arr.item = () => null;
          arr.namedItem = () => null;
          arr.refresh = () => {};
          return arr;
        },
        configurable: true
      });
    }

    // Giả mạo User-Agent thành Chrome Windows để tránh bị nhận diện TV
    Object.defineProperty(navigator, 'userAgent', {
      get: () => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      configurable: true
    });

    // Vô hiệu hóa console.log để script quảng cáo không biết ta đang gỡ lỗi
    // (Không bắt buộc, nhưng nếu trang check console -> có thể gỡ)
    // window.console.log = function() {};
    // window.console.warn = function() {};
    // window.console.error = function() {};

    // Chặn hàm kiểm tra developer mode (nếu tồn tại)
    window.checkDeveloperMode = function() { return false; };
    window.isDeveloperMode = false;
    window.developerMode = false;

    // Chặn kiểm tra cổng localhost (có thể bị tấn công qua fetch)
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      if (typeof url === 'string' && (
        url.includes('localhost:922') ||
        url.includes('127.0.0.1:922') ||
        url.includes(':9222') ||
        url.includes(':9229')
      )) {
        return Promise.reject(new Error('Blocked debug port'));
      }
      return originalFetch.apply(this, args);
    };

    // Chặn WebSocket kết nối tới debug port
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(...args) {
      const url = args[0];
      if (typeof url === 'string' && (
        url.includes('localhost:922') ||
        url.includes('127.0.0.1:922')
      )) {
        throw new Error('Blocked debug WebSocket');
      }
      return new originalWebSocket(...args);
    };
  }

  // Gọi ngay lập tức
  hideDeveloperTraces();

  // ============================================================
  // 2. CHẶN QUẢNG CÁO (DOMAIN + DOM)
  // ============================================================
  const BLOCK_DOMAINS = [
    'doubleclick.net', 'googleadservices.com', 'googlesyndication.com',
    'adservice.google.com', 'pagead2.googlesyndication.com',
    'quangcao.vn', 'ads.animevietsub.mom', 'banner.animevietsub.mom',
    'popup.animevietsub.mom', 'adserver.vn', 'dable.io', 'taboola.com',
    'outbrain.com', 'coinclick.com', 'exoclick.com', 'popads.net'
  ];

  function isBlocked(url) {
    if (!url) return false;
    return BLOCK_DOMAINS.some(domain => url.includes(domain));
  }

  // Chặn XHR
  const origXHR = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    if (typeof url === 'string' && isBlocked(url)) {
      console.warn('[AdBlock] Chặn XHR:', url);
      this.abort();
      return;
    }
    return origXHR.call(this, method, url, ...rest);
  };

  // Chặn fetch (đã có phần hide nhưng bổ sung thêm domain)
  const origFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && isBlocked(url)) {
      return Promise.reject(new Error('Ad blocked'));
    }
    return origFetch.apply(this, args);
  };

  // Gỡ DOM quảng cáo
  function removeAds() {
    // Iframe
    document.querySelectorAll('iframe[src]').forEach(iframe => {
      if (isBlocked(iframe.src)) {
        iframe.remove();
      }
    });

    // Selector quảng cáo
    const adSelectors = [
      '.ads', '.ad-container', '.banner', '.popup',
      '#ads', '#ad-block', '[id*="ad_"]', '[class*="ad_"]',
      '[id*="banner"]', '[class*="banner"]'
    ];
    adSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        const text = el.innerText || '';
        if (text.match(/quảng cáo|advertisement|sponsor/i) || isBlocked(el.src || '')) {
          el.remove();
        }
      });
    });
  }

  // Chạy khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeAds);
  } else {
    removeAds();
  }

  // Quan sát DOM thay đổi
  const observer = new MutationObserver(() => removeAds());
  observer.observe(document.body, { childList: true, subtree: true });

  // ============================================================
  // 3. VÔ HIỆU HÓA SCRIPT QUẢNG CÁO
  // ============================================================
  const origEval = window.eval;
  window.eval = function(code) {
    if (typeof code === 'string' && (
      code.includes('google_ad') || code.includes('googletag') ||
      code.includes('adsbygoogle') || code.includes('_popup')
    )) {
      return undefined;
    }
    return origEval.call(this, code);
  };

  const origSetTimeout = window.setTimeout;
  window.setTimeout = function(fn, delay, ...args) {
    if (typeof fn === 'string' && (
      fn.includes('google_ad') || fn.includes('googletag')
    )) {
      return 0;
    }
    return origSetTimeout.call(this, fn, delay, ...args);
  };

  // ============================================================
  // 4. ĐIỀU KHIỂN REMOTE TV
  // ============================================================
  const KEY = {
    RETURN: 10009,
    ENTER: 13,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    MEDIA_PLAY: 415,
    MEDIA_PAUSE: 19,
    MEDIA_PLAY_PAUSE: 10252,
    MEDIA_STOP: 413,
    MEDIA_REWIND: 412,
    MEDIA_FAST_FORWARD: 417,
    CH_UP: 427,
    CH_DOWN: 428
  };

  function getVideo() {
    return document.querySelector('video');
  }

  function seek(sec) {
    const v = getVideo();
    if (v && !isNaN(v.currentTime)) {
      v.currentTime = Math.max(0, v.currentTime + sec);
    }
  }

  function togglePlay() {
    const v = getVideo();
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  }

  function handleBack() {
    const isHome = location.pathname === '/' || location.pathname === '' || history.length <= 1;
    if (isHome) {
      try {
        if (window.tizen && tizen.application) {
          tizen.application.getCurrentApplication().exit();
          return;
        }
      } catch (e) {}
      window.close();
    } else {
      history.back();
    }
  }

  document.addEventListener('keydown', function(e) {
    switch (e.keyCode) {
      case KEY.RETURN:
        handleBack();
        e.preventDefault();
        break;
      case KEY.MEDIA_PLAY:
      case KEY.MEDIA_PAUSE:
      case KEY.MEDIA_PLAY_PAUSE:
      case KEY.ENTER:
        if (e.keyCode !== KEY.ENTER || document.activeElement === getVideo()) {
          togglePlay();
          e.preventDefault();
        }
        break;
      case KEY.MEDIA_STOP:
        const v = getVideo();
        if (v) { v.pause(); v.currentTime = 0; }
        break;
      case KEY.MEDIA_REWIND:
      case KEY.CH_DOWN:
        seek(-10);
        e.preventDefault();
        break;
      case KEY.MEDIA_FAST_FORWARD:
      case KEY.CH_UP:
        seek(10);
        e.preventDefault();
        break;
      default:
        break;
    }
  });

  // Đăng ký phím với hệ thống TV
  try {
    if (window.tizen && tizen.tvinputdevice) {
      [
        'MediaPlay', 'MediaPause', 'MediaPlayPause', 'MediaStop',
        'MediaRewind', 'MediaFastForward', 'ChannelUp', 'ChannelDown'
      ].forEach(function(key) {
        try { tizen.tvinputdevice.registerKey(key); } catch (err) {}
      });
    }
  } catch (e) {}

  // ============================================================
  // 5. TỰ ĐỘNG PHÁT VIDEO KHI VÀO TRANG TẬP (tùy chọn)
  // ============================================================
  // Nếu trang có nút "Play" tự động, script này sẽ kích hoạt sau 2 giây
  setTimeout(function() {
    const video = getVideo();
    if (video) {
      video.play().catch(() => {});
    } else {
      // Nếu chưa có video, thử click vào nút play nếu tồn tại
      const playBtn = document.querySelector('.play-btn, .btn-play, [id*="play"]');
      if (playBtn) playBtn.click();
    }
  }, 2000);

  console.log('[TizenBrew Anime] Module chiến đấu đã nạp – Developer Mode ẩn, AdBlock kích hoạt, Remote sẵn sàng.');
})();
