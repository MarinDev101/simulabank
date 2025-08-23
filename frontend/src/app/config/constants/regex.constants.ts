export const REGEX = {
  email: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
  password: /^(?=.*[A-Z])(?=.*\d).{8,}$/, // mínimo 8 caracteres, 1 mayúscula y 1 número
  phone: /^[0-9]{10}$/
};
