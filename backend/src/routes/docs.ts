import { Hono } from 'hono'

const docs = new Hono()

docs.get('/', (c) => {
  return c.html(`
    <html>
      <head>
        <title>API 文档</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          code { background: #f0f0f0; padding: 2px 4px; border-radius: 3px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        </style>
      </head>
      <body>
        <h1>书影音管理 API 文档</h1>
        <p>管理员接口需要在请求头中携带 <code>x-admin-token</code>（已加密）。</p>
        <h2>认证</h2>
        <table>
          <thead>
            <tr>
              <th>方法</th>
              <th>路径</th>
              <th>说明</th>
              <th>请求体 / 参数</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>GET</td>
              <td>/auth/verify</td>
              <td>校验管理员 token</td>
              <td>Header: x-admin-token</td>
            </tr>
          </tbody>
        </table>
        <h2>条目</h2>
        <table>
          <thead>
            <tr>
              <th>方法</th>
              <th>路径</th>
              <th>说明</th>
              <th>请求体 / 参数</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>GET</td>
              <td>/items</td>
              <td>获取所有条目</td>
              <td>可选 query 参数：status / media_type</td>
            </tr>
            <tr>
              <td>POST</td>
              <td>/items</td>
              <td>新增条目（管理员）</td>
              <td>JSON body: { title, media_type, status, rating?, comment?, external_id? }</td>
            </tr>
            <tr>
              <td>PATCH</td>
              <td>/items/:id?</td>
              <td>更新条目（管理员）</td>
              <td>JSON body: { status?, rating?, comment?, external_id? }</td>
            </tr>
            <tr>
              <td>DELETE</td>
              <td>/items/:id?</td>
              <td>删除条目（管理员）</td>
              <td>Query 参数：external_id（可选）</td>
            </tr>
            <tr>
              <td>POST</td>
              <td>/items/bangumi</td>
              <td>新建/更新条目（Bangumi认证）</td>
              <td>
                <div>Header: Authorization: Bearer &lt;bangumi_token&gt;</div>
                <div>JSON body: 
                  <ul style="margin: 5px 0; padding-left: 20px;">
                    <li><strong>新建</strong>: { title, media_type, status, rating?, comment?, external_id?, updated_at? }</li>
                    <li><strong>更新</strong>: { id 或 external_id, title?, media_type?, status?, rating?, comment? }</li>
                  </ul>
                </div>
                <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                  需通过 Bangumi API (/v0/me) 验证 token，且返回的 username 需匹配环境变量 USERNAME
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <h2>media_type 可选值</h2>
        <p><code>game</code>, <code>novel</code>, <code>manga</code>, <code>music</code>, <code>tv</code>, <code>movie</code>, <code>anime</code></p>
          </tbody>
        </table>
        <h2>media_type 可选值</h2>
        <p><code>game</code>, <code>novel</code>, <code>manga</code>, <code>music</code>, <code>tv</code>, <code>movie</code>, <code>anime</code></p>
        <h2>status 可选值</h2>
        <p>
          <code>doing</code> (在看/在玩/在听), 
          <code>want</code> (想看/想玩/想听), 
          <code>done</code> (看过/玩过/听过), 
          <code>on_hold</code> (搁置), 
          <code>dropped</code> (抛弃)
        </p>
      </body>
    </html>
  `)
})

export default docs
