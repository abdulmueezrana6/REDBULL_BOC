
// Hàm set giá trị vào localStorage
export const setLocalStorage = <T>(key: string, value: T): void => {
  try {
    const jsonValue = JSON.stringify(value);
    localStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error("Error setting localStorage:", error);
  }
};

// Hàm lấy giá trị từ localStorage
export const getLocalStorage = <T>(key: string, defaultValue: T | null = null): T | null => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : defaultValue;
  } catch (error) {
    console.error("Error getting localStorage:", error);
    return defaultValue;
  }
};
