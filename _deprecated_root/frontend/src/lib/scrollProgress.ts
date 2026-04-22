// Singleton mutable partagé entre ScrollTrigger (DOM) et useFrame (WebGL).
// Pas de React state → zéro re-render lors du scroll.
export const scrollProgress = { current: 0 };
