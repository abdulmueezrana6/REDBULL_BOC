// base64Utils.ts

// Encode chuỗi sang Base64 (hỗ trợ Unicode)
export const encodeBase64 = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)));
};

// Decode Base64 về chuỗi gốc
export const decodeBase64 = (base64: string): string => {
  return decodeURIComponent(escape(atob(base64)));
};
