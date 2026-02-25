/**
 * Bangumi 收藏数据导出工具
 * 
 * 功能：
 * 1. 从 Bangumi API 批量获取用户收藏数据
 * 2. 根据条目类型 (type) 和平台 (platform) 精确识别媒体类型
 * 3. 转换收藏状态为标准格式
 * 4. 导出为 JSON 格式
 * 5. 支持 Bearer Token 认证
 * 6. 请求失败自动重试 (每次间隔1秒)
 * 
 * 支持的媒体类型：
 * - manga: 漫画类 (包含: 漫画, 画集, 绘本, 写真, 公式书)
 * - novel: 小说类
 * - anime: 动画类 (包含: TV, OVA, WEB, 剧场版, 动态漫画)
 * - music: 音乐类
 * - game: 游戏类 (包含: 游戏, 软件, DLC, 桌游)
 * - tv: 电视剧类 (包含: 日剧, 欧美剧, 华语剧, 电视剧, 演出, 综艺)
 * - movie: 电影类 (三次元电影)
 * 
 * 使用方法：
 * node exportBangumi.js <username> [token]
 * 或使用环境变量: BANGUMI_TOKEN=xxx node exportBangumi.js <username>
 * 
 * 示例：
 * node exportBangumi.js laintoday
 * node exportBangumi.js laintoday your_bearer_token_here
 * BANGUMI_TOKEN=xxx node exportBangumi.js laintoday
 */

const fs = require("fs").promises;

// 全局配置
let BEARER_TOKEN = null; // Bearer token，可通过环境变量或参数设置

/**
 * 带重试机制的请求函数
 * @param {string} url - 请求的 URL
 * @param {Object} options - fetch 选项
 * @param {number} maxRetries - 最大重试次数 (0 表示无限重试)
 * @returns {Promise<Response>} fetch response
 */
async function fetchWithRetry(url, options = {}, maxRetries = 0) {
  let retryCount = 0;
  
  // 添加 Authorization header
  const headers = {
    'accept': 'application/json',
    'User-Agent': 'Bangumi-Collections-Exporter/1.0',
    ...options.headers,
  };
  
  if (BEARER_TOKEN) {
    headers['Authorization'] = `Bearer ${BEARER_TOKEN}`;
  }
  
  const fetchOptions = {
    ...options,
    headers,
  };
  
  while (true) {
    try {
      const response = await fetch(url, fetchOptions);
      
      // 如果请求成功 (2xx 状态码)
      if (response.ok) {
        return response;
      }
      
      // 如果是 4xx 客户端错误且不是 429 (Too Many Requests)，可能是 token 或权限问题
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        console.error(`客户端错误 ${response.status}: ${response.statusText}`);
        if (response.status === 401) {
          console.error('认证失败，请检查 Bearer Token 是否正确');
        }
        // 对于客户端错误，可能不需要重试，但这里还是重试
      }
      
      // 服务器错误或其他错误，进行重试
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      retryCount++;
      
      if (maxRetries > 0 && retryCount > maxRetries) {
        console.error(`请求失败，已达到最大重试次数 (${maxRetries})`);
        throw error;
      }
      
      console.warn(`请求失败 (${error.message})，1秒后重试... (第 ${retryCount} 次)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

/**
 * 设置 Bearer Token
 * @param {string} token - Bearer token
 */
function setBearerToken(token) {
  BEARER_TOKEN = token;
  console.log('已设置 Bearer Token');
}

// Bangumi 收藏状态映射表
const statusMap = {
  1: "want",      // 想看
  2: "done",      // 看过
  3: "doing",     // 在看
  4: "on_hold",   // 搁置
  5: "dropped",   // 抛弃
};

// Bangumi 平台类型数据 (从 API 获取的完整映射)
const PLATFORM_TYPES = {
  "1": { // 书籍
    "0": "manga",
    "1001": "manga",        // 漫画
    "1002": "novel",        // 小说
    "1003": "manga",        // 画集
    "1004": "manga",        // 绘本
    "1005": "manga",        // 写真
    "1006": "manga",        // 公式书
  },
  "2": { // 动画
    "0": "anime",
    "1": "anime",           // TV
    "2": "anime",           // OVA
    "3": "anime",           // 剧场版
    "5": "anime",           // WEB
    "2006": "anime",        // 动态漫画
  },
  "3": { // 音乐
    "0": "music",
  },
  "4": { // 游戏
    "0": "game",
    "4001": "game",         // 游戏
    "4002": "game",         // 软件
    "4003": "game",         // 扩展包
    "4005": "game",         // 桌游
  },
  "6": { // 三次元
    "0": "tv",
    "1": "tv",              // 日剧
    "2": "tv",              // 欧美剧
    "3": "tv",              // 华语剧
    "6001": "tv",           // 电视剧
    "6002": "movie",        // 电影
    "6003": "tv",           // 演出
    "6004": "tv",           // 综艺
  }
};

// 主类型映射 (type -> mediaType)
const TYPE_MAP = {
  1: "manga",   // 书籍 (默认漫画，小说通过 platform 识别)
  2: "anime",   // 动画
  3: "music",   // 音乐
  4: "game",    // 游戏
  6: "tv",      // 三次元 (默认电视剧，电影通过 platform 识别)
};

// 平台名称映射 (用于文本匹配)
const PLATFORM_NAME_MAP = {
  // 书籍类 - 除小说外都归为漫画
  "漫画": "manga",
  "manga": "manga",
  "comic": "manga",
  "小说": "novel",
  "novel": "novel",
  "画集": "manga",
  "illustration": "manga",
  "绘本": "manga",
  "picture": "manga",
  "写真": "manga",
  "photo": "manga",
  "公式书": "manga",
  "official": "manga",
  "book": "manga",
  
  // 动画类
  "动画": "anime",
  "anime": "anime",
  "tv": "anime",
  "ova": "anime",
  "web": "anime",
  "剧场版": "anime",
  
  // 游戏类 - 全部归为游戏
  "游戏": "game",
  "game": "game",
  "games": "game",
  "软件": "game",
  "software": "game",
  "dlc": "game",
  "扩展包": "game",
  "桌游": "game",
  "tabletop": "game",
  
  // 三次元类 - 电影为 movie，其他为 tv
  "日剧": "tv",
  "欧美剧": "tv",
  "华语剧": "tv",
  "电视剧": "tv",
  "电影": "movie",
  "movie": "movie",
  "演出": "tv",
  "综艺": "tv",
  "live": "tv",
  "show": "tv",
  "real": "tv",
  
  // 音乐类
  "音乐": "music",
  "music": "music",
};

/**
 * 根据 subject type 和 platform 规范化媒体类型
 * @param {number} subjectType - Bangumi subject type (1=书籍, 2=动画, 3=音乐, 4=游戏, 6=三次元)
 * @param {string} platform - 平台信息 (可能是平台ID或平台名称)
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
 * 转换 Bangumi status 类型
 * @param {number} type - Bangumi collection type
 * @returns {string} 转换后的 status
 */
function convertStatus(type) {
  return statusMap[type] || "want"; // 默认值为 want
}

/**
 * 统计收藏数据的媒体类型分布
 * @param {Array} collections - 收藏数据数组
 * @returns {Object} 媒体类型统计
 */
function getMediaTypeStats(collections) {
  const stats = {};
  
  collections.forEach(item => {
    const mediaType = item.mediaType || 'unknown';
    if (!stats[mediaType]) {
      stats[mediaType] = {
        count: 0,
        statuses: {
          want: 0,
          doing: 0,
          done: 0,
          on_hold: 0,
          dropped: 0
        }
      };
    }
    stats[mediaType].count++;
    if (item.status) {
      stats[mediaType].statuses[item.status] = (stats[mediaType].statuses[item.status] || 0) + 1;
    }
  });
  
  return stats;
}

/**
 * 导出 Bangumi 用户的所有收藏数据
 * @param {string} username - Bangumi 用户名
 * @returns {Promise<Array>} 返回所有收藏数据
 */
async function exportbangumi(username) {
  const limit = 50; // 每页获取的数量
  let offset = 0;
  let allCollections = [];
  let hasMore = true;

  console.log(`开始获取用户 ${username} 的收藏数据...`);

  while (hasMore) {
    const url = `https://api.bgm.tv/v0/users/${username}/collections?limit=${limit}&offset=${offset}`;

    console.log(
      `正在获取第 ${Math.floor(offset / limit) + 1} 页数据 (offset: ${offset})...`,
    );

    const response = await fetchWithRetry(url);
    const data = await response.json();
    
    // 检查返回的数据
    if (data.data && Array.isArray(data.data)) {
      const collections = data.data;
      console.log(`获取到 ${collections.length} 条数据`);

      if (collections.length === 0) {
        hasMore = false;
      } else {
        allCollections = allCollections.concat(collections);
        offset += collections.length;

        // 如果返回的数据少于 limit，说明已经是最后一页
        if (collections.length < limit) {
          hasMore = false;
        }
      }
    } else {
      console.log("未找到更多数据");
      hasMore = false;
    }

    // 添加延迟，避免请求过快
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\n总共获取到 ${allCollections.length} 条收藏数据`);

  // 根据 subject_id 请求详情，获取 platform 作为 mediaType
  console.log(`正在获取详细数据...`);
  const formattedData = [];
  
  for (let index = 0; index < allCollections.length; index += 1) {
    const item = allCollections[index];
    const subjectId = item.subject.id;
    const subjectType = item.subject.type; // Bangumi 条目类型
    
    try {
      // 请求 subject 详情以获取精确的 platform 信息
      const subjectUrl = `https://api.bgm.tv/v0/subjects/${subjectId}`;
      const subjectResponse = await fetchWithRetry(subjectUrl);
      const subjectData = await subjectResponse.json();
      
      const platform = subjectData.platform; // 平台信息 (可能是字符串或ID)
      const mediaType = normalizeMediaType(subjectType, platform);
      
      formattedData.push({
        external_id: item.subject.id,
        title: item.subject.name + (item.subject.name_cn ? ` / ${item.subject.name_cn}` : "") + (item.subject.date ? ` (${item.subject.date})` : ""),
        mediaType,
        status: convertStatus(item.type),
        rating: item.rate || 0,
        comment: item.comment || "",
        updated_at: item.updated_at,
      });
      
      console.log(`已处理 ${index + 1}/${allCollections.length} 条数据 [${mediaType}] ${item.subject.name}`);
      
      // 添加延迟，避免请求过快
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.warn(`处理 subject ${subjectId} 时出错: ${error.message}，使用默认类型`);
      // 失败时使用 subject type 推断
      const mediaType = normalizeMediaType(subjectType, null);
      formattedData.push({
        external_id: item.subject.id,
        title: item.subject.name,
        mediaType,
        status: convertStatus(item.type),
        rating: item.rate || 0,
        comment: item.comment || "",
        updated_at: item.updated_at,
      });
    }
  }

  // 保存到文件
  const filename = `bangumi_${username}_collections_${Date.now()}.json`;
  await fs.writeFile(
    filename,
    JSON.stringify(formattedData, null, 2),
    "utf-8",
  );
  console.log(`\n数据已保存到: ${filename}`);

  // 输出统计信息
  const stats = getMediaTypeStats(formattedData);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 收藏数据统计:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Object.entries(stats).forEach(([type, data]) => {
    console.log(`\n${type.toUpperCase()}: ${data.count} 条`);
    console.log(`  想看: ${data.statuses.want} | 在看: ${data.statuses.doing} | 看过: ${data.statuses.done}`);
    console.log(`  搁置: ${data.statuses.on_hold} | 抛弃: ${data.statuses.dropped}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return formattedData;
}

// 使用示例
// node exportBangumi.js <username> [token]
// 或使用环境变量: BANGUMI_TOKEN=xxx node exportBangumi.js <username>
if (require.main === module) {
  const username = process.argv[2] || "laintoday";
  const token = process.argv[3] || process.env.BANGUMI_TOKEN;
  
  if (token) {
    setBearerToken(token);
  } else {
    console.log('提示: 未设置 Bearer Token，如需使用私有 API 请通过参数或环境变量提供');
    console.log('使用方法: node exportBangumi.js <username> <token>');
    console.log('或: BANGUMI_TOKEN=xxx node exportBangumi.js <username>\n');
  }

  exportbangumi(username)
    .then((data) => {
      console.log(`\n✓ 成功导出 ${data.length} 条收藏数据`);
    })
    .catch((error) => {
      console.error(`✗ 导出失败: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { 
  exportbangumi,
  setBearerToken,
  fetchWithRetry,
  normalizeMediaType,
  convertStatus,
  getMediaTypeStats,
  PLATFORM_TYPES,
  TYPE_MAP,
  statusMap,
};

