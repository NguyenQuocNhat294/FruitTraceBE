// src/utils/inputValidation.js

// Chặn nhập số âm — dùng trên <input type="number">
export const positiveNumberProps = {
    min: 0,
    onKeyDown: (e) => ['-', '+', 'e'].includes(e.key) && e.preventDefault(),
    onBlur: (e) => { if (Number(e.target.value) < 0) e.target.value = 0; },
};

// Chặn chọn ngày quá khứ — dùng trên <input type="date">
export const futureDateProps = {
    min: new Date().toISOString().split('T')[0],
};

// Chặn chọn ngày tương lai — nếu cần nhập ngày sản xuất
export const pastOrTodayDateProps = {
    max: new Date().toISOString().split('T')[0],
};