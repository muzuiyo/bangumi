# BANGUMI

在网页上展示书影音记录，支持手动更新、从 [Bangumi](https://bgm.tv) 导入数据、同步 Bangumi 更新。

📫 [点击查看 Demo](https://bangumi.lain.today)

## 1. 部署

项目分为前端、后端、工具脚本三部分。

### 1.1 准备工作

1、克隆项目到本地
```yaml
git clone https://github.com/muzuiyo/bangumi
```

并上传到 Github。

2、参数配置

打开 `frontend/site.config.ts`，设置前端站点标题、用户（显示在页脚）、主页链接（用于页脚超链接）。

### 1.2 后端部署

打开仓库项目文件夹，依次执行以下命令。

```bash
# 命令行进入 backend 初始化目录
cd backend
pnpm install
```
登录 cloudflare

```bash
pnpm wrangler login
```

设置 USERNAME（用于bangumi同步）、ADMIN_TOKEN（前端登录密码） 密钥，根据提示完成密钥创建。

```bash
pnpm wrangler secret put USERNAME
pnpm wrangler secret put ADMIN_TOKEN
```

创建 D1 数据库

```bash
pnpm wrangler d1 create media-log
```

初始化数据库

```bash
pnpm wrangler d1 execute media-log --remote --file=./schema.sql
```

部署到 cloudflare worker。

```
pnpm wrangler deploy
```

### 1.3 前端部署

打开 [vercel](https://vercel.com) 官网，部署新项目，选中仓库 `frontend` 目录，框架选用 `NextJS`，环境变量根据 `frontend/.env.example` 参考设置如下：

```yaml
# 后端 API 地址
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
# 想要的设置路径，默认为 settings
NEXT_PUBLIC_SETTING_PATH=settings
```

点击部署。


## 2. 开发

添加 `frontend/.env`、`backend/.dev.vars` 文件，用于本地参数设置，内容参考 `.env.examlple` 与 `.dev.vars.example`。

### 2.1 配置后端服务器

打开仓库项目文件夹，依次执行以下命令。

```bash
# 命令行进入 backend 初始化目录
cd backend
pnpm install
```
登录 cloudflare

```bash
pnpm wrangler login
```

设置 USERNAME（用于bangumi同步）、ADMIN_TOKEN（前端登录密码） 密钥，根据提示完成密钥创建。

```bash
# 设置的值应与 .dev.vars 一致
pnpm wrangler secret put USERNAME
pnpm wrangler secret put ADMIN_TOKEN
```

创建 D1 数据库

```bash
pnpm wrangler d1 create media-log
```

初始化数据库

```bash
pnpm wrangler d1 execute media-log --local --file=./schema.sql
```

运行服务器

```bash
pnpm run dev
```

### 2.2 配置前端页面

注意调整 `.env` 文件 API 地址参数，开发时应为本地地址。

安装依赖

```bash
cd frontend
pnpm install
```

运行页面

```bash
pnpm run dev
```


## 3. 数据导入与同步

### 3.1 从 Bangumi 导入数据

本地运行 `tools/exportBangumi.js` 脚本。

```bash
node exportBangumi.js <username> [token]
```

`username` 为用户唯一标识符，`token` 应前往 [Bangumi 个人令牌](https://next.bgm.tv/demo/access-token) 获取。

### 3.2 让 Bangumi 数据实时同步到站点

将 `tools/exportBangumi.js` 脚本添加到站点组件或者油猴脚本，在个性化面板 `收藏记录一栏` 设置参数保存后，用户在 Bangumi 收藏的时候，会同步发送数据到站点。
