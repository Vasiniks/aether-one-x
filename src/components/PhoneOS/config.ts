import {
  Camera,
  ChatTeardrop,
  CloudSun,
  GearSix,
  Image,
  MapPin,
  MusicNote,
  Timer,
  type Icon,
} from '@phosphor-icons/react'
import type { AppId } from '../../data/software'

export interface AppIcon {
  id: AppId
  label: string
  icon: Icon
  tint: string
}

export const APPS: AppIcon[] = [
  { id: 'camera', label: 'Camera', icon: Camera, tint: 'from-[#24405e] to-[#0c1626]' },
  { id: 'photos', label: 'Photos', icon: Image, tint: 'from-[#1d3a52] to-[#0b1a2b]' },
  { id: 'messages', label: 'Messages', icon: ChatTeardrop, tint: 'from-[#27548f] to-[#16273f]' },
  { id: 'weather', label: 'Weather', icon: CloudSun, tint: 'from-[#3a5a7d] to-[#142a42]' },
  { id: 'music', label: 'Music', icon: MusicNote, tint: 'from-[#253a55] to-[#101c2c]' },
  { id: 'maps', label: 'Maps', icon: MapPin, tint: 'from-[#2e4a66] to-[#131f2e]' },
  { id: 'timer', label: 'Timer', icon: Timer, tint: 'from-[#20384f] to-[#0d1722]' },
  { id: 'settings', label: 'Settings', icon: GearSix, tint: 'from-[#263b53] to-[#111d2b]' },
]

export const APP_TITLES: Record<AppId, string> = {
  camera: 'Camera',
  photos: 'Photos',
  messages: 'Messages',
  weather: 'Weather',
  music: 'Music',
  maps: 'Maps',
  timer: 'Timer',
  settings: 'Settings',
}