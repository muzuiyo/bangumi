/**
 * 加密工具 - 与前端保持一致
 * 使用 Base64 + XOR 加密
 */

const CRYPTO_KEY = 'bangumi-media-log-2026'

/**
 * 加密字符串
 */
export function encrypt(text: string): string {
  try {
    const encrypted = xorEncrypt(text, CRYPTO_KEY)
    return btoa(encrypted) // Base64 编码
  } catch (error) {
    console.error('加密失败:', error)
    return text
  }
}

/**
 * 解密字符串
 */
export function decrypt(encryptedText: string): string {
  try {
    const decoded = atob(encryptedText) // Base64 解码
    return xorEncrypt(decoded, CRYPTO_KEY)
  } catch (error) {
    console.error('解密失败:', error)
    return encryptedText
  }
}

/**
 * XOR 加密/解密（相同操作）
 */
function xorEncrypt(text: string, key: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    result += String.fromCharCode(charCode)
  }
  return result
}
