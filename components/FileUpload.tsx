// src/components/FileUpload.tsx

import React from "react";

const SCRIPT_URL = import.meta.env.VITE_APP_SCRIPT_URL;

// ฟังก์ชันสำหรับแปลงไฟล์เป็น Base64
function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// ฟังก์ชันสำหรับเรียก Google Apps Script
async function uploadToGoogleScript(file: File, taskRowIndex: number) {
  const fileData = await toBase64(file);
  const payload = {
    op: "uploadFile",
    rowIndex: taskRowIndex,
    fileName: file.name,
    mimeType: file.type,
    fileData: fileData,
  };

  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    // Apps Script จะอ่าน Body ที่เป็น String ได้ดีที่สุด
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "text/plain;charset=utf-8", // ส่งเป็น text/plain เพื่อลดปัญหา CORS
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// --- นี่คือ React Component ของคุณ ---
interface FileUploadProps {
  taskRowIndex: number;
}

export function FileUpload({ taskRowIndex }: FileUploadProps) {
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files) return;

    const file = event.target.files[0];
    if (!file) return;

    try {
      console.log("Uploading...");
      const response: any = await uploadToGoogleScript(file, taskRowIndex);
      if (response.status === 'success') {
        console.log('Upload successful:', response);
        alert(`อัปโหลดไฟล์สำเร็จ! ลิงก์: ${response.fileUrl}`);
      } else {
        throw new Error(response.message || 'Unknown error from Apps Script');
      }
    } catch (error: any) {
      console.error("Upload failed:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        แนบไฟล์ (Attachment)
      </label>
      <input
        type="file"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
      />
    </div>
  );
}
