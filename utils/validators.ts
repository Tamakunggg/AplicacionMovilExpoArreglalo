export const isEmpty = (value?: string | null): boolean => {
  if (value === undefined || value === null) return true;
  return String(value).trim().length === 0;
};

export const isValidEmail = (email?: string): boolean => {
  if (!email) return false;

  const clean = email.trim().toLowerCase();

  const emailRegex =
    /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

  return emailRegex.test(clean);
};

export const isValidPhone = (phone?: string): boolean => {
  if (!phone) return false;

  const clean = phone.replace(/\D/g, '');

  return clean.length === 10;
};

export const isStrongPassword = (password?: string): boolean => {
  if (!password) return false;

  return password.trim().length >= 6;
};

export const isValidRating = (rating?: number): boolean => {
  if (rating === undefined || rating === null) return false;

  const num = Number(rating);

  if (isNaN(num)) return false;

  return num >= 1 && num <= 5;
};

export const validateRequiredFields = (
  fields: { label: string; value: string | undefined | null }[]
) => {
  const missing = fields.filter((field) => isEmpty(field.value));

  return {
    ok: missing.length === 0,
    missing,
  };
};