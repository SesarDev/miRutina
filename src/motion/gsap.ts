/** The one place where GSAP plugins are registered (CustomEase is registered in tokens.ts). */
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(useGSAP, Flip, ScrollTrigger)

export { Flip, gsap, ScrollTrigger, useGSAP }
