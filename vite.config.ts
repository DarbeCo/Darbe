import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

const getCurrentBranch = () => {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

const currentBranch = getCurrentBranch()
const base = currentBranch === 'main' ? '/Darbe/' : '/'

export default defineConfig({
  plugins: [react()],
  base,
})
