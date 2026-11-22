// ไฟล์นี้เป็นตัวช่วยในการป้องกันการส่ง request ซ้ำซ้อน

// เก็บ Request ที่กำลังทำงาน โดยใช้ Key เป็นตัวระบุ
const pendingRequests = new Map<string, Promise<unknown>>();

export function deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>
): Promise<T> {

    // ถ้ามี Request Key เดียวกันอยู่แล้ว จะคืน Promise เดิมโดยไม่เรียก API ซ้ำ
    const existingRequest = pendingRequests.get(key);

    if (existingRequest) {
        return existingRequest as Promise<T>;
    }

    // เรียก requestFn ทันที และแปลง synchronous error เป็น rejected Promise
    let request: Promise<T>;

    try {
        request = Promise.resolve(requestFn());
    } catch (error) {
        request = Promise.reject(error);
    }

    // ลบ Key เมื่อ Request เสร็จ ไม่ว่าจะสำเร็จหรือล้มเหลว
    const trackedRequest = request.finally(() => {
        pendingRequests.delete(key);
    });

    // เพื่อให้ Request ถัดไปสามารถตรวจสอบและใช้ Promise เดิมได้
    pendingRequests.set(key, trackedRequest);

    // return promise ของ function ที่ส่งเข้ามา
    // frontend ก็จะ await รอผลลัพธ์อีกที 
    return trackedRequest;
}
