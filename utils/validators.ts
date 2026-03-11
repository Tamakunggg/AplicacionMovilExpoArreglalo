export const isEmpty = (value?: string | null) => {
  return !value || value.trim() === '';
};

export const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhone = (phone: string) => {
  const clean = phone.replace(/\D/g, '');
  return clean.length === 10;
};

export const isStrongPassword = (password: string) => {
  return password.length >= 6;
};

export const isValidRating = (rating: number) => {
  return rating >= 1 && rating <= 5;
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