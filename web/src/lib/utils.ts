import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const truncateString = (string: string, slice?: number) => {
  return string.slice(0, slice || 30) + "...";
};

export const getDaysAgo = (createdAt: Date): string => {
  const daysAgo = Math.floor(
    (new Date().getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000)
  );
  return daysAgo === 0 ? "Today" : `${daysAgo}d ago`;
};
