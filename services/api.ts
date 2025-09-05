const API_BASE_URL = 'http://localhost:3000/api';

// --- Helper Function for Robust API Requests ---

/**
 * จัดการการเรียก API ไปยัง Backend ใหม่
 * ตรวจสอบ Error และรับประกันการ Parse ข้อมูล JSON อย่างปลอดภัย
 */
export const apiRequest = async <T,>(endpoint: string, method: string = 'GET', body: object | null = null): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    // 1. ตรวจสอบ HTTP Status
    if (!response.ok) {
      const errorText = await response.text().catch(() => "N/A");
      console.error("HTTP Error Response:", errorText);
      throw new Error(
        `HTTP error ${response.status}. โปรดตรวจสอบการเชื่อมต่อหรือสถานะเซิร์ฟเวอร์.`
      );
    }

    // 2. อ่านข้อมูลเป็น Text ก่อน (สำคัญมากสำหรับการ Debug และป้องกัน JSON Error)
    const textData = await response.text();

    // 3. พยายามแปลงเป็น JSON
    try {
      const result = JSON.parse(textData);
      // ตรวจสอบสถานะจาก Backend (ตามโครงสร้างที่คาดหวังจาก Backend ใหม่)
      if (result.status !== "success") {
        throw new Error(
          result.message || "การดำเนินการล้มเหลว (Backend Error)."
        );
      }
      // ตรวจสอบว่ามี data หรือไม่ ถ้าไม่มีให้ return เป็น object ว่าง
      return (result.data !== undefined ? result.data : {}) as T;
    } catch (parseError) {
      // ดักจับ "SyntaxError: JSON.parse: unexpected character"
      if (parseError instanceof SyntaxError) {
        console.error("Failed to parse JSON. Raw data received:", textData);
        throw new Error(
          "ได้รับข้อมูลที่ไม่ใช่รูปแบบ JSON. โปรดตรวจสอบ Logs ของ Backend."
        );
      }
      throw parseError;
    }
  } catch (error) {
    // จัดการ Network errors
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (Network Error/CORS)."
      );
    }
    throw error;
  }
};
