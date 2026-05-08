import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class strings */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(...inputs));
}

/** Format a price with optional currency */
export function formatPrice(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);
}

/** Sleep for the specified number of milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
