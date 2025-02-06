import { Fira_Code as FontMono, Inter as FontSans } from "next/font/google"

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
})

import localFont from 'next/font/local'


export const kalameFont = localFont({ src: './kalame/KalamehWeb-Regular.woff2' ,  variable: "--font-kalame" })