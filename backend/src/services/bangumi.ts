/**
 * Bangumi API 相关服务
 */

/**
 * 验证 Bangumi Token 并检查用户名
 */
export async function verifyBangumiToken(token: string, expectedUsername: string): Promise<{ success: boolean; error?: string; username?: string }> {
  try {
    const response = await fetch('https://api.bgm.tv/v0/me', {
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'user-agent': 'CFWorkers'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { 
        success: false, 
        error: `Bangumi API error (${response.status}): ${errorText}` 
      }
    }

    const userData = await response.json() as { username?: string }
    
    if (!userData.username) {
      return { success: false, error: 'No username in response' }
    }

    if (userData.username !== expectedUsername) {
      return { 
        success: false, 
        error: `Username mismatch: expected ${expectedUsername}, got ${userData.username}` 
      }
    }

    return { success: true, username: userData.username }
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to verify token: ${error instanceof Error ? error.message : String(error)}` 
    }
  }
}
