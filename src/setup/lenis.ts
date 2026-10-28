import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// One shared instance. Splash.astro imports this to stop/start scrolling.
export const lenis = new Lenis({ autoRaf: false });

// Drive Lenis from GSAP's ticker so everything shares one RAF loop
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);