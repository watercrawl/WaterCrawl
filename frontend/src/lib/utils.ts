import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function classnames(obj: {[key: string]: boolean }) {
  return Object.entries(obj)
    .filter(([_, value]) => value)
    .map(([key]) => key)
    .join(' ')
}