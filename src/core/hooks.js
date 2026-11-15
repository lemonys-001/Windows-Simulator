import { useSyncExternalStore } from 'react'
import { fs } from './fs'

export const useFs = () => useSyncExternalStore(fs.subscribe, fs.getSnapshot)
