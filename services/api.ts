const SCRIPT_URL = import.meta.env.VITE_APP_SCRIPT_URL;

// --- Helper Function for Robust API Requests ---

/**
 * จัดการการเรียก API ไปยัง Google Apps Script
 * ตรวจสอบ Error และรับประกันการ Parse ข้อมูล JSON อย่างปลอดภัย
 */
export const apiRequest = async <T,>(body: object): Promise<T> => {
  if (!SCRIPT_URL) {
    throw new Error("VITE_APP_SCRIPT_URL is not defined.");
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      // ใช้ text/plain เพื่อหลีกเลี่ยงปัญหา CORS preflight กับ Google Apps Script
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    });

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
      // ตรวจสอบสถานะจาก Backend (ตามโครงสร้างที่คาดหวังจาก GAS)
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
          "ได้รับข้อมูลที่ไม่ใช่รูปแบบ JSON. โปรดตรวจสอบ Logs หรือสิทธิ์ของ Google Apps Script."
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
