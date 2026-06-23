import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple deterministic hash for 4-digit passcodes (not cryptographically secure,
// but sufficient to prevent casual localStorage snooping from reading the raw PIN)
export function hashPasscode(passcode: string): string {
  let h = 0
  const salt = 'inkwings-salt-v1'
  const str = salt + passcode
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return h.toString(16)
}

export function verifyPasscode(passcode: string, hash: string): boolean {
  return hashPasscode(passcode) === hash
}

// Fallback for browsers without crypto.randomUUID (older Safari, private mode)
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
