export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
};

export const isGoodEnoughPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

  return passwordRegex.test(password);
};

export const isValidZipCode = (zip: string): boolean => {
  const zipRegex = /^\d{5}$/;

  return zipRegex.test(zip);
};

// TODO: DELETE ONCE BETA IS DONE
export const isValidBetaZipCode = (zip: string): boolean => {
  const houstonZipRegex = /^(770[0-9]|77[1-9][0-9])$/;

  return houstonZipRegex.test(zip);
};

export const isValidEINNumber = (ein: string | undefined): boolean => {
  if (!ein) return false;

  const einRegex = /^\d{2}-\d{7}$/;

  return einRegex.test(ein);
};

export const isValidName = (name: string | undefined): boolean => {
  if (!name) return false;

  const nameRegex = /^[a-zA-Z\s]+$/;

  return nameRegex.test(name);
};

export const isValidCity = (city: string | undefined): boolean => {
  if (!city) return false;

  const cityRegex = /^[a-zA-Z\s]+$/;

  return cityRegex.test(city);
};

export const isValidEntityName = (name: string | undefined): boolean => {
  if (!name) return false;

  const nameRegex = /^[a-zA-Z0-9\s]+$/;

  return nameRegex.test(name);
};

export const isValidDate = (date: string | Date): boolean => {
  const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-\d{4}$/;
  const isProperFormat = dateRegex.test(date.toString());

  return isProperFormat;
};

export const isValidNumber = (num: string | number): boolean => {
  if (!num) return false;

  const numRegex = /^\d+$/;

  return numRegex.test(num?.toString());
};

export const isValidStreetName = (street: string | undefined): boolean => {
  if (!street) return false;

  const streetRegex = /^[a-zA-Z0-9\s]+$/;

  return streetRegex.test(street);
};
