/**
 * Tiện ích kiểm tra định dạng dữ liệu biểu mẫu (Validation Utilities)
 */

// Regex kiểm tra định dạng email chuẩn quốc tế
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Regex kiểm tra định dạng số điện thoại Việt Nam (10 chữ số, đầu số 03, 05, 07, 08, 09 hoặc +84)
export const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

/**
 * Kiểm tra tính hợp lệ của email
 */
export function isValidEmail(email: string): boolean {
    if (!email) return false;
    return EMAIL_REGEX.test(email.trim());
}

/**
 * Kiểm tra tính hợp lệ của số điện thoại
 */
export function isValidPhone(phone: string): boolean {
    if (!phone) return false;
    const cleanPhone = phone.replace(/[\s.-]/g, '');
    return PHONE_REGEX.test(cleanPhone);
}

/**
 * Chuẩn hóa số điện thoại về định dạng 10 số (bắt đầu bằng số 0)
 */
export function normalizePhone(phone: string): string {
    const cleanPhone = phone.replace(/[\s.-]/g, '');
    if (cleanPhone.startsWith('+84')) {
        return '0' + cleanPhone.slice(3);
    }
    return cleanPhone;
}

export interface RegistrationErrors {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
}

/**
 * Xác thực toàn bộ biểu mẫu Đăng ký
 */
export function validateRegistrationForm(formData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
}): { isValid: boolean; errors: RegistrationErrors } {
    const errors: RegistrationErrors = {};

    // 1. Kiểm tra Họ và tên
    const trimmedName = (formData.name || '').trim();
    if (!trimmedName) {
        errors.name = 'Vui lòng nhập họ và tên';
    } else if (trimmedName.length < 2) {
        errors.name = 'Họ và tên phải có ít nhất 2 ký tự';
    }

    // 2. Kiểm tra Email
    const trimmedEmail = (formData.email || '').trim();
    if (!trimmedEmail) {
        errors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!isValidEmail(trimmedEmail)) {
        errors.email = 'Email không đúng định dạng (Ví dụ: name@gmail.com)';
    }

    // 3. Kiểm tra Số điện thoại
    const trimmedPhone = (formData.phone || '').trim();
    if (!trimmedPhone) {
        errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!isValidPhone(trimmedPhone)) {
        errors.phone = 'Số điện thoại không hợp lệ (Cần 10 số: 03x, 05x, 07x, 08x, 09x)';
    }

    // 4. Kiểm tra Mật khẩu
    if (!formData.password) {
        errors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
        errors.password = 'Mật khẩu phải có tối thiểu 6 ký tự';
    }

    // 5. Kiểm tra Xác nhận mật khẩu
    if (!formData.confirmPassword) {
        errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Mật khẩu xác nhận không khớp!';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

export interface LoginErrors {
    email?: string;
    password?: string;
}

/**
 * Xác thực biểu mẫu Đăng nhập
 */
export function validateLoginForm(email: string, password: string): { isValid: boolean; errors: LoginErrors } {
    const errors: LoginErrors = {};

    const trimmedEmail = (email || '').trim();
    if (!trimmedEmail) {
        errors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!isValidEmail(trimmedEmail)) {
        errors.email = 'Email không đúng định dạng (Ví dụ: name@gmail.com)';
    }

    if (!password) {
        errors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
        errors.password = 'Mật khẩu phải có tối thiểu 6 ký tự';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

/**
 * Đọc thông điệp lỗi từ API (tránh hiển thị raw json)
 */
export async function parseApiError(res: Response, defaultMessage: string = 'Đã có lỗi xảy ra!'): Promise<string> {
    try {
        const text = await res.text();
        try {
            const data = JSON.parse(text);
            return data.message || data.error || defaultMessage;
        } catch {
            return text || defaultMessage;
        }
    } catch {
        return defaultMessage;
    }
}
