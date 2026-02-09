// ==UserScript==
// @name         Bangumi Collection Data Listener
// @namespace    http://tampermonkey.net/
// @version      2026-02-08
// @description  监听 Bangumi 收藏保存，生成 JSON 数据发送到云端同步
// @author       laintoday
// @match        https://bgm.tv/*
// @match        https://chii.in/*
// @match        https://bangumi.tv/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

/**
 * Bangumi Collection Data Listener
 *
 * 功能：
 * 1. 监听收藏表单的"保存"按钮点击
 * 2. 通过 Bangumi API 获取 subject 详细信息（标题、类型）
 * 3. 根据 platform 和 type 自动识别媒体类型（anime/manga/novel/game/music/tv/movie）
 * 4. 生成标准化的收藏数据 JSON
 * 5. 保存到云端服务器
 * 6. 支持代理模式解决跨域问题
 * 7. 提供图形化配置面板
 *
 * 配置方法：
 * - 打开「个性化」面板
 * - 切换到「收藏记录」标签页
 * - 配置外部 API 地址（例如：http://127.0.0.1:8787）
 * - 配置代理设置（用于解决跨域问题）
 */

(function () {
  "use strict";

  // ============================================================
  // 配置区域
  // ============================================================

  // 外部 API 服务器地址
  let EXTERNAL_API_URL = "";

  function injectStyles() {
    const css = `
            /* 个性化面板内部样式 */
            .bangumi-kiroku-tab-content {
                padding: 10px;
            }
            .bangumi-kiroku-tab-content .section {
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
            }
            .bangumi-kiroku-tab-content h3 {
                margin-bottom: 15px;
                font-size: 14px;
                font-weight: bold;
                color: #444;
            }
            .bangumi-kiroku-tab-content label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
                color: #666;
            }
            .bangumi-kiroku-tab-content input[type="text"],
            .bangumi-kiroku-tab-content input[type="password"],
            .bangumi-kiroku-tab-content input[type="number"],
            .bangumi-kiroku-tab-content select {
                width: 100%;
                padding: 6px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
                margin-bottom: 10px;
                font-size: 13px;
            }
            .bangumi-kiroku-tab-content textarea {
                width: 100%;
                min-height: 120px;
                padding: 6px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 12px;
                line-height: 1.5;
                resize: vertical;
                box-sizing: border-box;
                font-family: monospace;
            }
            .bangumi-kiroku-tab-content .row {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }
            .bangumi-kiroku-tab-content .btn-group {
                margin-top: 10px;
                display: flex;
                gap: 10px;
            }
            .bangumi-kiroku-tab-content button {
                cursor: pointer;
                padding: 5px 12px;
                border-radius: 4px;
                border: 1px solid #ccc;
                background: #fff;
                font-size: 12px;
            }
            .bangumi-kiroku-tab-content button.primary {
                background: #f09199;
                color: white;
                border-color: #f09199;
            }
            .bangumi-kiroku-tab-content button.primary:hover {
                background: #e07179;
            }
            .bangumi-kiroku-tab-content button.danger {
                background: #ff4d4f;
                color: white;
                border-color: #ff4d4f;
            }
            .bangumi-kiroku-tab-content .checkbox-wrapper {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }
            .bangumi-kiroku-tab-content .checkbox-wrapper label {
                margin-bottom: 0;
                font-weight: normal;
            }
        `;
    const style = document.createElement("style");
    style.type = "text/css";
    style.textContent = css;
    if (document.head) {
      document.head.appendChild(style);
    } else {
      document.addEventListener("DOMContentLoaded", () =>
        document.head.appendChild(style),
      );
    }
  }

  function registerMenuPanel() {
    // 检查 chiiLib 是否可用
    if (typeof chiiLib === 'undefined' || !chiiLib.ukagaka) {
      setTimeout(registerMenuPanel, 500);
      return;
    }

    chiiLib.ukagaka.addPanelTab({
      tab: "collection_listener",
      label: "收藏记录",
      type: "custom",
      customContent: function () {
        return `
            <div class="bangumi-kiroku-tab-content">
                <div class="section">
                    <h3>外部 API 设置</h3>
                    <label>API 地址：</label>
                    <input type="text" id="kiroku_apiUrl" placeholder="http://127.0.0.1:8787">

                    <h3>代理设置</h3>
                    <label>代理地址：</label>
                    <input type="text" id="kiroku_proxyUrl" placeholder="https://proxy.example.com">
                    
                    <h3>Bangumi Token</h3>
                    <label>Access Token：</label>
                    <input type="password" id="kiroku_bangumiToken" placeholder="在 next.bgm.tv/demo/access-tokens 获取">
                    <small style="color: #999; font-size: 11px;">访问 https://next.bgm.tv/demo/access-tokens 创建 token</small>
                </div>

                <div class="btn-group" style="justify-content: flex-end;">
                    <button class="primary" id="kiroku_saveBtn">保存配置</button>
                    <button id="kiroku_clearBtn">清除所有缓存</button>
                </div>
                <div id="kiroku_statusMsg" style="text-align:right; margin-top:5px; color:green; height:20px;"></div>
            </div>
        `;
      },
      onInit: function (tabSelector, $tabContent) {
        console.log('收藏监听器面板初始化中...', tabSelector);

        const container = $tabContent[0];

        // 获取元素
        const els = {
          apiUrl: container.querySelector('#kiroku_apiUrl'),
          proxyUrl: container.querySelector('#kiroku_proxyUrl'),
          bangumiToken: container.querySelector('#kiroku_bangumiToken'),
          saveBtn: container.querySelector('#kiroku_saveBtn'),
          clearBtn: container.querySelector('#kiroku_clearBtn'),
          status: container.querySelector('#kiroku_statusMsg')
        };

        // 加载配置
        const loadConfig = () => {
          try {
            const config = {
              apiUrl: localStorage.getItem('kiroku_api_url') || '',
              proxyUrl: localStorage.getItem('kiroku_proxy_url') || '',
              bangumiToken: localStorage.getItem('kiroku_bangumi_token') || ''
            };

            els.apiUrl.value = config.apiUrl;
            els.proxyUrl.value = config.proxyUrl;
            els.bangumiToken.value = config.bangumiToken;

            // 更新全局配置
            EXTERNAL_API_URL = config.apiUrl;
          } catch (e) {
          }
        };

        // 保存配置
        els.saveBtn.addEventListener('click', () => {
          try {
            localStorage.setItem('kiroku_api_url', els.apiUrl.value);
            localStorage.setItem('kiroku_proxy_url', els.proxyUrl.value);
            localStorage.setItem('kiroku_bangumi_token', els.bangumiToken.value);

            // 更新全局配置
            EXTERNAL_API_URL = els.apiUrl.value;

            els.status.textContent = '✓ 配置已保存';
            els.status.style.color = 'green';
            setTimeout(() => els.status.textContent = '', 2000);
          } catch (e) {
            els.status.textContent = '✗ 保存失败: ' + e.message;
            els.status.style.color = 'red';
          }
        });

        // 清除缓存
        els.clearBtn.addEventListener('click', () => {
          if (confirm('确定要清除所有收藏数据缓存吗？')) {
            try {
              const keys = Object.keys(localStorage);
              let count = 0;
              keys.forEach(key => {
                if (key.startsWith('bangumi_collection_')) {
                  localStorage.removeItem(key);
                  count++;
                }
              });

              els.status.textContent = `✓ 已清除 ${count} 条缓存记录`;
              els.status.style.color = 'green';
              setTimeout(() => els.status.textContent = '', 3000);
            } catch (e) {
              els.status.textContent = '✗ 清除失败: ' + e.message;
              els.status.style.color = 'red';
            }
          }
        });

        // 初始加载
        loadConfig();
      }
    });
  }

  // 默认代理配置（可在面板中修改）
  let PROXY_URL = "";

  // API 基础 URL
  const API_BASE_URL = "https://api.bgm.tv/v0";

  /**
   * 构建请求 URL（如果配置了代理则使用代理）
   * @param {string} url - 原始 URL
   * @returns {string} 处理后的 URL
   */
  function buildRequestURL(url) {
    const proxyUrl = localStorage.getItem('kiroku_proxy_url') || PROXY_URL;
    if (!proxyUrl) {
      return url; // 未配置代理时直接返回原始 URL
    }
    return `${proxyUrl}/${url}`;
  }

  // ============================================================
  // 类型映射数据（从 exportBangumi.js 复制）
  // ============================================================

  // 收藏状态映射表
  const STATUS_MAP = {
    1: "wish", // 想看/想听/想玩
    2: "collect", // 看过/听过/玩过
    3: "do", // 在看/在听/在玩
    4: "on_hold", // 搁置
    5: "dropped", // 抛弃
  };

  // Bangumi 平台类型数据
  const PLATFORM_TYPES = {
    1: {
      // 书籍
      0: "manga",
      1001: "manga", // 漫画
      1002: "novel", // 小说
      1003: "manga", // 画集
      1004: "manga", // 绘本
      1005: "manga", // 写真
      1006: "manga", // 公式书
    },
    2: {
      // 动画
      0: "anime",
      1: "anime", // TV
      2: "anime", // OVA
      3: "anime", // 剧场版
      5: "anime", // WEB
      2006: "anime", // 动态漫画
    },
    3: {
      // 音乐
      0: "music",
    },
    4: {
      // 游戏
      0: "game",
      4001: "game", // 游戏
      4002: "game", // 软件
      4003: "game", // 扩展包
      4005: "game", // 桌游
    },
    6: {
      // 三次元
      0: "tv",
      1: "tv", // 日剧
      2: "tv", // 欧美剧
      3: "tv", // 华语剧
      6001: "tv", // 电视剧
      6002: "movie", // 电影
      6003: "tv", // 演出
      6004: "tv", // 综艺
    },
  };

  // 主类型映射
  const TYPE_MAP = {
    1: "manga", // 书籍
    2: "anime", // 动画
    3: "music", // 音乐
    4: "game", // 游戏
    6: "tv", // 三次元
  };

  // 平台名称映射
  const PLATFORM_NAME_MAP = {
    // 书籍类 - 除小说外都归为漫画
    漫画: "manga",
    manga: "manga",
    comic: "manga",
    小说: "novel",
    novel: "novel",
    画集: "manga",
    illustration: "manga",
    绘本: "manga",
    picture: "manga",
    写真: "manga",
    photo: "manga",
    公式书: "manga",
    official: "manga",
    book: "manga",

    // 动画类
    动画: "anime",
    anime: "anime",
    tv: "anime",
    ova: "anime",
    web: "anime",
    剧场版: "anime",

    // 游戏类
    游戏: "game",
    game: "game",
    games: "game",
    软件: "game",
    software: "game",
    dlc: "game",
    扩展包: "game",
    桌游: "game",
    tabletop: "game",

    // 三次元类
    日剧: "tv",
    欧美剧: "tv",
    华语剧: "tv",
    电视剧: "tv",
    电影: "movie",
    movie: "movie",
    演出: "tv",
    综艺: "tv",
    live: "tv",
    show: "tv",
    real: "tv",

    // 音乐类
    音乐: "music",
    music: "music",
  };

  // ============================================================
  // 工具函数
  // ============================================================

  /**
   * 根据 subject type 和 platform 规范化媒体类型
   * @param {number} subjectType - Bangumi subject type
   * @param {string} platform - 平台信息
   * @returns {string} 规范化的媒体类型
   */
  function normalizeMediaType(subjectType, platform) {
    // 优先使用 type + platform 精确匹配
    if (subjectType && platform) {
      const typeStr = String(subjectType);
      const platformStr = String(platform);

      // 尝试通过 type 和 platform ID 精确匹配
      if (PLATFORM_TYPES[typeStr] && PLATFORM_TYPES[typeStr][platformStr]) {
        return PLATFORM_TYPES[typeStr][platformStr];
      }

      // 尝试通过平台名称匹配
      const platformKey = platformStr.trim().toLowerCase();
      if (PLATFORM_NAME_MAP[platformKey]) {
        return PLATFORM_NAME_MAP[platformKey];
      }

      // 尝试模糊匹配平台名称
      for (const [key, value] of Object.entries(PLATFORM_NAME_MAP)) {
        if (platformKey.includes(key) || key.includes(platformKey)) {
          return value;
        }
      }
    }

    // 根据 subject type 返回默认类型
    if (subjectType) {
      return TYPE_MAP[subjectType] || "anime";
    }

    // 最终默认值
    return "anime";
  }

  /**
   * 带重试机制的 API 请求函数
   * @param {string} url - 请求 URL
   * @param {number} maxRetries - 最大重试次数
   * @returns {Promise<Object>} JSON 响应
   */
  async function fetchWithRetry(url, maxRetries = 3) {
    let retryCount = 0;

    const fetchOptions = {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    };

    while (retryCount <= maxRetries) {
      try {
        const response = await fetch(url, fetchOptions);

        if (response.ok) {
          return await response.json();
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        retryCount++;

        if (retryCount > maxRetries) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // 缓存 subject 数据以避免重复请求
  let subjectDataCache = null;

  /**
   * 从 API 获取 subject 详细信息
   * @param {string} subjectId - Subject ID
   * @returns {Promise<Object|null>} Subject 数据或 null
   */
  async function fetchSubjectData(subjectId) {
    if (!subjectId) {
      return null;
    }

    // 如果已有缓存，直接返回
    if (subjectDataCache && subjectDataCache.id === parseInt(subjectId)) {
      return subjectDataCache;
    }

    try {
      const url = `${API_BASE_URL}/subjects/${subjectId}`;
      const requestURL = buildRequestURL(url);

      const data = await fetchWithRetry(requestURL);

      // 缓存数据
      subjectDataCache = data;

      return data;
    } catch (error) {
      return null;
    }
  }

  // ============================================================
  // 数据提取函数
  // ============================================================

  /**
   * 从表单 action 中获取 subject ID
   * @returns {string|null} subject ID
   */
  function getSubjectID() {
    const form = document.getElementById("collectBoxForm");
    if (form && form.action) {
      // 从 action="/subject/309445/interest/update?gh=..." 中提取
      const match = form.action.match(/\/subject\/(\d+)\//);
      if (match) {
        return match[1];
      }
    }

    // 备用：从当前 URL 获取
    const urlMatch = location.pathname.match(/\/subject\/(\d+)/);
    return urlMatch ? urlMatch[1] : null;
  }

  /**
   * 获取条目标题（从 API）
   * @param {string} subjectId - Subject ID
   * @returns {Promise<string>} 条目标题
   */
  async function getSubjectTitle(subjectId) {
    // 尝试从 API 获取
    const subjectData = await fetchSubjectData(subjectId);
    if (subjectData && subjectData.name) {
      return subjectData.name;
    }

    // 备用：从页面元素获取
    const titleSelectors = [
      "h1.nameSingle a",
      "h1.nameSingle",
      ".infobox .title",
      "#headerSubject h1 a",
      "#headerSubject h1",
    ];

    for (const selector of titleSelectors) {
      const titleEl = document.querySelector(selector);
      if (titleEl) {
        return titleEl.textContent.trim();
      }
    }

    return "Unknown Title";
  }

  /**
   * 获取条目类型（从 API 转换）
   * @param {string} subjectId - Subject ID
   * @returns {Promise<string>} 条目类型
   */
  async function getMediaType(subjectId) {
    // 从 API 获取 subject 数据
    const subjectData = await fetchSubjectData(subjectId);

    if (!subjectData) {
      return "";
    }

    const subjectType = subjectData.type; // 1=书籍, 2=动画, 3=音乐, 4=游戏, 6=三次元
    const platform = subjectData.platform; // 平台信息

    // 使用转换函数获取规范化的媒体类型
    const mediaType = normalizeMediaType(subjectType, platform);

    return mediaType;
  }

  /**
   * 获取收藏状态
   * @returns {string} 收藏状态
   */
  function getCollectionStatus() {
    const form = document.getElementById("collectBoxForm");
    if (!form) return "";

    const selectedInterest = form.querySelector(
      'input[name="interest"]:checked',
    );
    if (!selectedInterest) return "";

    return STATUS_MAP[selectedInterest.value] || "";
  }

  /**
   * 获取评分
   * @returns {number|null} 评分 (1-10) 或 null
   */
  function getRating() {
    const form = document.getElementById("collectBoxForm");
    if (!form) return null;

    const selectedRating = form.querySelector('input[name="rating"]:checked');
    if (!selectedRating) return null;

    const rating = parseInt(selectedRating.value, 10);
    return isNaN(rating) ? null : rating;
  }

  /**
   * 获取评论/吐槽
   * @returns {string} 评论内容
   */
  function getComment() {
    const commentEl = document.getElementById("comment");
    return commentEl ? commentEl.value.trim() : "";
  }

  /**
   * 生成收藏数据 JSON
   * @returns {Promise<Object>} 收藏数据对象
   */
  async function generateCollectionData() {
    const subjectId = getSubjectID();

    if (!subjectId) {
      throw new Error("无法获取 Subject ID");
    }

    // 并行获取标题和类型
    const [title, mediaType] = await Promise.all([
      getSubjectTitle(subjectId),
      getMediaType(subjectId),
    ]);

    const data = {
      external_id: subjectId,
      title: title,
      mediaType: mediaType,
      status: getCollectionStatus(),
      rating: getRating(),
      comment: getComment(),
      updated_at: new Date().toISOString(),
    };

    return data;
  }

  /**
   * 保存数据到本地存储
   * @param {Object} data 收藏数据
   */
  async function saveCollectionData(data) {
    // console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    // console.log("📊 收藏数据 JSON:");
    // console.log(JSON.stringify(data, null, 2));
    // console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // 从配置中获取 token
    const token = localStorage.getItem('kiroku_bangumi_token');
    
    if (!token) {
      showNotification("⚠️ 请先在配置面板中设置 Bangumi Token", "error");
      return;
    }
    
    try {
      // 直接使用配置的 token 发送数据到服务器
      await sendToServer(data, token);
    } catch (error) {
      showNotification("保存失败: " + error.message, "error");
    }
  }

  /**
   * 发送数据到服务器
   * @param {Object} data 收藏数据
   * @param {string} token Bangumi access token
   */
  async function sendToServer(data, token) {
    const apiUrl = localStorage.getItem('kiroku_api_url') || EXTERNAL_API_URL;
    
    if (!apiUrl) {
      return;
    }

    try {
      // 状态映射：Bangumi -> API
      const statusMap = {
        'wish': 'want',
        'collect': 'done',
        'do': 'doing',
        'on_hold': 'on_hold',
        'dropped': 'dropped'
      };

      // 构建请求体
      const payload = {
        title: data.title,
        media_type: data.mediaType,
        status: statusMap[data.status] || data.status,
        external_id: data.external_id
      };

      // 可选字段
      if (data.rating) {
        payload.rating = data.rating;
      }
      if (data.comment) {
        payload.comment = data.comment;
      }
      if (data.updated_at) {
        payload.updated_at = data.updated_at;
      }
      
      const targetUrl = `${apiUrl}/items/bangumi`;
      const finalUrl = buildRequestURL(targetUrl);
      const response = await fetch(finalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`服务器返回错误 ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      showNotification('✓ 数据已同步到服务器', 'success');
    } catch (error) {
      showNotification('✗ 服务器同步失败: ' + error.message, 'error');
    }
  }

  /**
   * 在页面上显示通知
   * @param {string} message 通知消息
   * @param {string} type 类型 (success/error/info)
   */
  function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === "success" ? "#4caf50" : type === "error" ? "#f44336" : "#2196f3"};
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 99999;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * 初始化事件监听
   */
  function initEventListener() {
    // 使用事件委托监听表单提交按钮点击
    document.addEventListener("click", function (e) {
      const target = e.target;

      // 检查是否点击了保存按钮
      if (
        target.tagName === "INPUT" &&
        target.classList.contains("inputBtn") &&
        target.type === "submit" &&
        target.name === "update" &&
        target.value === "保存"
      ) {
        // 阻止默认表单提交
        e.preventDefault();
        
        const form = document.getElementById("collectBoxForm");
        
        // 延迟一点执行，确保表单状态已更新
        setTimeout(async () => {
          try {
            showNotification("正在获取数据...", "info");

            const collectionData = await generateCollectionData();

            // 验证必要字段
            if (!collectionData.external_id) {
              showNotification("无法获取条目ID", "error");
              // 即使失败也提交表单
              if (form) form.submit();
              return;
            }

            await saveCollectionData(collectionData);
            
            // 云端保存成功后，提交表单
            if (form) {
              form.submit();
            }
          } catch (error) {
            showNotification("保存数据失败: " + error.message, "error");
            
            // 失败时询问是否继续提交
            const shouldSubmit = confirm("云端保存失败，是否继续保存到 Bangumi？");
            if (shouldSubmit && form) {
              form.submit();
            }
          }
        }, 100);

        return false;
      }
    });
  }

  // 初始化
  function init() {
    // 注入样式
    injectStyles();

    // 注册设置面板（始终注册，以便在任何页面都能配置）
    registerMenuPanel();

    // 检查是否在条目页面
    const isSubjectPage = /^\/subject\/\d+/.test(location.pathname);

    if (isSubjectPage) {
      // 在条目页面初始化事件监听器
      initEventListener();
    }
  }

  // 启动
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // DOM 已加载完成，延迟一点确保 chiiLib 加载
    setTimeout(init, 100);
    console.log("⚡ 同步 Bangumi")
  }
})();
