export const randomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)] as T;
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
