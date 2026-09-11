// --- Bio: track to the cabinet doors in the video, regardless of viewport size ---
// The video is covered (object-fit: cover), so the visible crop of its 1920x1080
// frame shifts with the viewport's aspect ratio. PANEL is the cabinet-door
// region as fractions of that native frame; recompute on resize so the text
// always lands on the cabinet instead of drifting onto the bookshelf/floor.
const VIDEO_FRAME = { w: 1920, h: 1080 };
const PANEL = { left: 0.010, top: 0.489, width: 0.260, height: 0.391 };
const MOBILE_BREAKPOINT = 600;

function positionBio() {
  const bio = document.querySelector('.bio');
  if (window.innerWidth <= MOBILE_BREAKPOINT) {
    ['left', 'top', 'width', 'transform'].forEach(p => bio.style.removeProperty(p));
    return;
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const videoAspect = VIDEO_FRAME.w / VIDEO_FRAME.h;
  const vpAspect = vw / vh;
  let renderedW, renderedH, offX, offY;
  if (vpAspect >= videoAspect) {
    renderedW = vw; renderedH = vw / videoAspect; offX = 0; offY = (vh - renderedH) / 2;
  } else {
    // matches the video's object-position: left center — crop from the right only
    renderedH = vh; renderedW = vh * videoAspect; offX = 0; offY = 0;
  }
  const panelLeft   = offX + PANEL.left * renderedW;
  const panelRight  = offX + (PANEL.left + PANEL.width) * renderedW;
  const panelTop    = offY + PANEL.top * renderedH;
  const panelBottom = offY + (PANEL.top + PANEL.height) * renderedH;
  const visLeft  = Math.max(0, panelLeft);
  const visRight = Math.min(vw, panelRight);

  bio.style.left      = (visLeft + visRight) / 2 + 'px';
  bio.style.top       = (panelTop + panelBottom) / 2 + 'px';
  bio.style.width     = Math.max(40, visRight - visLeft) + 'px';
  bio.style.transform = 'translate(-50%, -50%)';
}

positionBio();
window.addEventListener('resize', positionBio);

// --- Entry animation ---
gsap.from('.bio', {
  opacity: 0,
  duration: 1.2,
  delay: 0.4,
  ease: 'power2.out',
});

// --- Background video: landscape clip loads by default from the <source> in
// HTML (so it plays even if this script never runs); on mobile-width
// viewports, swap in the portrait clip instead. Autoplay once, then freeze +
// slow zoom on last frame.
// Both clips were run through ffmpeg's deshake filter — the raw AI-generated
// footage has a persistent low-level camera jitter that's most noticeable at
// the end, once the sketch-to-color animation settles and that jitter becomes
// the only motion left. Re-run deshake on any replacement clip before using it. ---
const video = document.getElementById('bg-video');
const mobileMql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

// Re-checked on every breakpoint crossing, not just at load — otherwise
// resizing across the breakpoint (e.g. dragging a devtools device toolbar,
// or rotating without a reload) leaves the wrong-aspect clip loaded, which
// object-fit: cover then crops down to a sliver of the frame.
function syncVideoSource() {
  const wanted = mobileMql.matches ? 'media/portrait-background.mp4' : 'media/office-dogs.mp4';
  if (video.currentSrc.endsWith(wanted)) return;
  video.src = wanted;
  video.classList.remove('settled');
  video.play().catch(() => {});
}

syncVideoSource();
mobileMql.addEventListener('change', syncVideoSource);
video.play().catch(() => {});
video.addEventListener('ended', () => video.classList.add('settled'));
