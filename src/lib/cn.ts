import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// `text-body`, `text-small`, dll adalah token ukuran font kustom. Tanpa
// pendaftaran ini tailwind-merge mengira `text-white` adalah ukuran dan
// membuangnya, sehingga warna teks hilang.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['title', 'section', 'kpi', 'body', 'small'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
