// Shared pieces for the Roman Imperial Quests UI — pure visual helpers with
// no data fetching. Styling lives in quests.css; the markup vocabulary and
// class names (`q-*`) mirror the quest_concept/index.html prototype.
import { Fragment } from 'react';
import portraitCaesar from './assets/badges/portrait-caesar.png';
import portraitFlavian from './assets/badges/portrait-flavian.png';
import portraitSeveran from './assets/badges/portrait-severan.png';
import portraitEmpress from './assets/badges/portrait-empress.png';
import portraitPantheon from './assets/badges/portrait-pantheon.png';

// Badge display name — the concept's badge carries its own short name
// ("Twelve Caesars", "The Imperial Women"); fall back to the quest title.
export const badgeNameFor = (quest) => quest.badge?.name ?? quest.title;

const paths = {
  check: <path d="M20 6 9 17l-5-5" />,
  circle: <circle cx="12" cy="12" r="10" />,
  'circle-check': (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  alert: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  'chevron-right': (<path d="m9 18 6-6-6-6" />),
  'arrow-right': (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </>
  ),
};

export const Icon = ({ name, size = 15, className = '' }) => (
  <svg
    className={`q-icon${className ? ` ${className}` : ''}`}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {paths[name] || paths.circle}
  </svg>
);

// The badge medallion: bronze seal ring with the quest's emoji mark. Locked
// badges are grey; earned ones bronze. Mirrors the prototype sealSvg().
// ---- Badge seal art (ported from the Open Design concept, 2026-10-31) ----
// Badges are {name, art} from the API. Engraved vector arts + five
// photographic portraits. All coordinate space is viewBox 0..120.

const sealLeaf = (x, y, angle, scale = 1, leafClass = 'seal-leaf') =>
`<path class="${leafClass}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${scale})" d="M0 0C-2.3-3-1.7-7.2 1.8-9.2 4.4-5.4 3.5-2.2 0 0Z"></path>`;

const sealWreath = ({ rx = 27, ry = 28, count = 8, size = 1.35, spread = 42, leafClass = 'seal-leaf' } = {}) =>
`<path class="seal-line" d="M60 ${60 + ry}A${rx} ${ry} 0 0 0 60 ${60 - ry}"></path>`
+ `<path class="seal-line" d="M60 ${60 + ry}A${rx} ${ry} 0 0 1 60 ${60 - ry}"></path>`
+ Array.from({ length: count }, (_, index) => {
const t = (index + 0.6) / count;
const left = Math.PI / 2 + t * Math.PI;
const right = Math.PI / 2 - t * Math.PI;
return [
sealLeaf(60 + Math.cos(left) * rx, 60 + Math.sin(left) * ry, left * 180 / Math.PI + 90 + spread, size, leafClass),
sealLeaf(60 + Math.cos(right) * rx, 60 + Math.sin(right) * ry, right * 180 / Math.PI + 90 - spread, size, leafClass),
].join('');
}).join('');

const sealBerry = (x, y, r = 1.2) => `<circle class="seal-fill" cx="${x}" cy="${y}" r="${r}"></circle>`;

const sealRibbons = '<path class="seal-line" d="M54 90c-5 4-8 8-9 13M66 90c5 4 8 8 9 13"></path><path class="seal-fine" d="M48 98l-4 5M52 100l-2 5M72 98l4 5M68 100l2 5"></path>';

const sealStar = (x, y, r = 2.8) => {
const q = r * 0.26;
return `<path class="seal-fill" d="M${x} ${y - r} ${x + q} ${y - q} ${x + r} ${y} ${x + q} ${y + q} ${x} ${y + r} ${x - q} ${y + q} ${x - r} ${y} ${x - q} ${y - q}Z"></path>`;
};


const sealBust = (cx, cy, scale = 1) => `
<g transform="translate(${cx} ${cy}) scale(${scale})">
<path class="seal-fill" d="M-8.4 8.4c.2-4.7 3.8-7.3 8.4-7.3s8.2 2.6 8.4 7.3Z"></path>
<path class="seal-fill" d="M-2.9 1.4h5.8v3.2h-5.8z"></path>
<path class="seal-fill" d="M0-9.8c3.1 0 5.2 2.1 5.2 4.8 0 2.7-2.1 4.9-5.2 4.9s-5.2-2.2-5.2-4.9c0-2.7 2.1-4.8 5.2-4.8Z"></path>
<path class="seal-fine" d="M-5.5-6.6c1.3-2.2 3.9-3 6.3-2 1.6.7 2.6 2 2.9 3.4"></path>
<path class="seal-fine" d="M-5.7-4.4h11.4"></path>
</g>`;

const SEAL_PROFILE = 'M0.4-9.8C4.4-9.4 6.2-7.2 6.2-5L5.6-4.4 6.4-3.6 8.6-1.4 6.2-.9 7-.1 6 .5 6.6 1.1 5.4 1.9C6.2 2.9 5.6 3.9 4.2 4.6 3 5.6 1.6 6 1.4 6.6L1.4 9.6C4.2 10.6 6.8 11.6 8.2 13.4L-8.2 13.4C-8 11.6-6.2 10.4-4.4 9.4L-4.8 6.8C-6.6 5.4-8 3-8.4.2-8.9-3.6-7.6-7.4-3.6-9.2-2.6-9.6-1.2-9.8 .4-9.8Z';

const sealProfile = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})">
<path class="seal-fill" d="${SEAL_PROFILE}"></path>
<path class="seal-cut" d="M-6.7-4.2C-7-7.4-4.4-9.2-1-9.1 1.6-9 4-8.3 5.2-6.8"></path>
<circle class="seal-cut" cx="-6.9" cy="-2.6" r="1.1"></circle>
<path class="seal-cut" d="M-4.4 9.4C-1 8.4 2.8 8.4 5.6 9.6"></path>
</g>`;

const sealArches = (y, h, n, x0, step, w) =>
Array.from({ length: n }, (_, i) => {
const x = x0 + i * step;
return `<path class="seal-line" d="M${x} ${y + h}V${y + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${y + h}"></path>`;
}).join('');

const sealColumns = (x0, n, step, top, bottom) =>
Array.from({ length: n }, (_, i) => {
const x = x0 + i * step;
return `<path class="seal-line" d="M${x} ${top}v${bottom - top}M${x + 3.2} ${top}v${bottom - top}"></path>`
+ `<path class="seal-fine" d="M${x - 1} ${top}h${5.2}M${x - 1.2} ${bottom}h${5.6}"></path>`;
}).join('');

const BADGE_ART = {
temple: `
<path class="seal-wash" d="M26 48 60 27 94 48Z"></path>
<path class="seal-line" d="M23 49 60 26 97 49"></path>
<path class="seal-fine" d="M31 48 60 31 89 48"></path>
<path class="seal-fill" d="M56 22h8v4h-8zM21 46h7v4h-7zM92 46h7v4h-7z"></path>
<circle class="seal-wash" cx="60" cy="39" r="7"></circle>
<circle class="seal-line" cx="60" cy="39" r="6.3"></circle>
<circle class="seal-fill" cx="60" cy="39" r="2.1"></circle>
<path class="seal-fine" d="M54 39h12M60 33v12"></path>
<path class="seal-line" d="M23 51h74M25 57h70"></path>
<path class="seal-cut" d="M27 53.5h66"></path>
<path class="seal-hatch" d="M34 47 43 38M48 46l9-9M63 37l9 9M77 38l9 9"></path>
${[30, 42, 54, 66, 78, 90].map((x) => `
<path class="seal-fill" d="M${x - 3} 56h6l2 4h-10zM${x - 2.5} 80h5v3h-5z"></path>
<path class="seal-line" d="M${x - 2.5} 60v20M${x + 2.5} 60v20"></path>
<path class="seal-cut" d="M${x} 61v17"></path>
<path class="seal-hatch" d="M${x - 1.3} 64v12"></path>
`).join('')}
<path class="seal-fill" d="M53 83V70a7 7 0 0 1 14 0v13z"></path>
<path class="seal-cut" d="M60 70v12"></path>
<path class="seal-line" d="M27 83h66M24 88h72M21 93h78"></path>
<path class="seal-cut" d="M29 85.5h62M26 90.5h68"></path>
<path class="seal-hatch" d="M38 61v18M82 61v18M34 91l-4 2M42 91l-4 2M78 91l4 2M86 91l4 2"></path>
`,
bust: `<image class="seal-photo" href="${portraitCaesar}" x="19" y="19" width="82" height="82" preserveAspectRatio="xMidYMid slice"></image>`,
swords: `
<circle class="seal-wash" cx="60" cy="60" r="32"></circle>
<circle class="seal-line" cx="60" cy="60" r="33"></circle>
<circle class="seal-cut" cx="60" cy="60" r="28"></circle>
<path class="seal-fill" d="M33 31 40 24l46 61-7 7zM87 31l-7-7-46 61 7 7z"></path>
<path class="seal-cut" d="m38 30 43 57M82 30 39 87"></path>
<path class="seal-fill" d="m35 28 5-7 7 5-5 7zM80 25l7-4 5 7-7 4zM32 85l7-5 5 7-7 5zM76 87l5-7 7 5-5 7z"></path>
<circle class="seal-fill" cx="60" cy="60" r="7"></circle>
<circle class="seal-cut" cx="60" cy="60" r="3"></circle>
<path class="seal-hatch" d="M44 38l7 9M76 38l-7 9M44 82l7-9M76 82l-7-9"></path>
`,
laurelKnot: `
<path class="seal-line" d="M55 92C36 80 29 63 32 47 35 34 43 26 54 22M65 92c19-12 26-29 23-45-3-13-11-21-22-25"></path>
${sealWreath({ rx: 27, ry: 31, count: 9, size: 1.7, spread: 43 })}
<circle class="seal-wash" cx="60" cy="56" r="20"></circle>
<circle class="seal-line" cx="60" cy="56" r="20"></circle>
${sealStar(60, 56, 13)}
<circle class="seal-ground" cx="60" cy="56" r="3.2"></circle>
<circle class="seal-fill" cx="60" cy="56" r="2.1"></circle>
<path class="seal-fill" d="M53 84h14l-2 5-5 3-5-3z"></path>
<path class="seal-cut" d="M57 85v4M63 85v4"></path>
<path class="seal-line" d="M55 92 49 99M65 92l6 7"></path>
<path class="seal-hatch" d="M39 41l8 3M36 53l9 1M39 66l8-3M81 41l-8 3M84 53l-9 1M81 66l-8-3"></path>
`,
colosseum: `
<image class="seal-photo" href="${portraitFlavian}" x="19" y="19" width="82" height="82" preserveAspectRatio="xMidYMid meet"></image>
`,
severan: `<image class="seal-photo" href="${portraitSeveran}" x="19" y="19" width="82" height="82" preserveAspectRatio="xMidYMid slice"></image>`,
empress: `<image class="seal-photo" href="${portraitEmpress}" x="19" y="19" width="82" height="82" preserveAspectRatio="xMidYMid slice"></image>`,
helmet: `
<path class="seal-wash" d="M34 61c0-17 11-29 26-29s26 12 26 29v7c0 11-9 19-26 26-17-7-26-15-26-26z"></path>
<path class="seal-line" d="M34 61c0-17 11-29 26-29s26 12 26 29v7c0 11-9 19-26 26-17-7-26-15-26-26z"></path>
<path class="seal-cut" d="M40 61c0-13 8-23 20-23s20 10 20 23v7c0 8-7 14-20 20-13-6-20-12-20-20z"></path>
<path class="seal-fill" d="M38 35c0-15 10-25 22-25s22 10 22 25l-9-4-13 5-13-5z"></path>
<path class="seal-line" d="M38 34c0-15 10-25 22-25s22 10 22 25M45 31V15M60 30V8M75 31V15"></path>
<path class="seal-cut" d="M47 27V17M60 27V12M73 27V17"></path>
<path class="seal-fill" d="M30 52h60v7H30z"></path>
<path class="seal-cut" d="M34 54h52"></path>
<circle class="seal-fill" cx="60" cy="62" r="9"></circle>
<circle class="seal-cut" cx="60" cy="62" r="4"></circle>
<path class="seal-hatch" d="M41 40l-5 7M79 40l5 7M43 76l8 8M77 76l-8 8"></path>
<path class="seal-line" d="M31 94h58"></path>
`,
chiRho: `
<circle class="seal-wash" cx="60" cy="60" r="35"></circle>
<circle class="seal-line" cx="60" cy="60" r="35"></circle>
<circle class="seal-cut" cx="60" cy="60" r="30"></circle>
<path class="seal-fill" d="M55 22h10v76H55z"></path>
<path class="seal-cut" d="M60 27v66"></path>
<path class="seal-fill" d="M60 28h10a16 16 0 1 1 0 32H60v-9h10a7 7 0 1 0 0-14H60z"></path>
<path class="seal-cut" d="M65 33h5a11 11 0 1 1 0 22h-5"></path>
<path class="seal-fill" d="M27 34 32 29 93 86 88 92zM27 86 88 29 93 34 32 92z"></path>
<path class="seal-cut" d="M31 34 88 87M88 34 31 87"></path>
<path class="seal-hatch" d="M60 20v-6M60 100v6M20 60h-6M100 60h6"></path>
`,
scroll: `
<path class="seal-wash" d="M34 40h52v42H34z"></path>
<path class="seal-line" d="M34 40h52v42H34z"></path>
<path class="seal-cut" d="M39 45h42v32H39z"></path>
<path class="seal-fill" d="M28 34h64v9H28zM28 78h64v9H28z"></path>
<circle class="seal-fill" cx="28" cy="38.5" r="6"></circle><circle class="seal-cut" cx="28" cy="38.5" r="2.4"></circle>
<circle class="seal-fill" cx="92" cy="38.5" r="6"></circle><circle class="seal-cut" cx="92" cy="38.5" r="2.4"></circle>
<circle class="seal-fill" cx="28" cy="82.5" r="6"></circle><circle class="seal-cut" cx="28" cy="82.5" r="2.4"></circle>
<circle class="seal-fill" cx="92" cy="82.5" r="6"></circle><circle class="seal-cut" cx="92" cy="82.5" r="2.4"></circle>
<path class="seal-line" d="M45 50h30M45 58h30M45 66h23M45 73h16"></path>
<path class="seal-hatch" d="M48 53h24M48 61h24M48 69h15"></path>
<path class="seal-fill" d="M55 87h10v8l-5 5-5-5z"></path>
<path class="seal-cut" d="M60 89v9M56 93h8"></path>
`,
metals: `
<circle class="seal-wash" cx="43" cy="44" r="20"></circle><circle class="seal-line" cx="43" cy="44" r="20"></circle><circle class="seal-cut" cx="43" cy="44" r="15"></circle>
${sealStar(43, 44, 9)}<circle class="seal-fill" cx="43" cy="44" r="2"></circle>
<circle class="seal-fill" cx="77" cy="44" r="20"></circle><circle class="seal-cut" cx="77" cy="44" r="15"></circle>
<path class="seal-cut" d="M67 49h20M70 49V39M77 49V36M84 49V39M68 39l9-6 9 6z"></path>
<circle class="seal-wash" cx="60" cy="78" r="20"></circle><circle class="seal-line" cx="60" cy="78" r="20"></circle><circle class="seal-cut" cx="60" cy="78" r="15"></circle>
<path class="seal-fill" d="M49 82c2-7 7-10 12-8 4-4 9-3 10 1 1 3-1 5-4 7-6-2-12-1-18 3z"></path>
<path class="seal-cut" d="M60 67v7M54 88l-3 4M66 88l3 4"></path>
`,
stack: `
<path class="seal-fill" d="M37 56h46v31c0 7-10 12-23 12s-23-5-23-12z"></path>
<ellipse class="seal-fill" cx="60" cy="56" rx="23" ry="9"></ellipse>
<ellipse class="seal-cut" cx="60" cy="55" rx="17" ry="5"></ellipse>
<path class="seal-cut" d="M42 58v24M78 58v24"></path>
<ellipse class="seal-line" cx="60" cy="66" rx="23" ry="9"></ellipse>
<ellipse class="seal-wash" cx="60" cy="66" rx="17" ry="4.5"></ellipse>
<ellipse class="seal-line" cx="60" cy="76" rx="23" ry="9"></ellipse>
<ellipse class="seal-wash" cx="60" cy="76" rx="17" ry="4.5"></ellipse>
<ellipse class="seal-line" cx="60" cy="86" rx="23" ry="9"></ellipse>
<ellipse class="seal-wash" cx="60" cy="86" rx="17" ry="4.5"></ellipse>
<path class="seal-hatch" d="M44 63l6-3M49 69l6-3M70 69l6 3M44 83l6-3M70 83l6 3"></path>
<circle class="seal-fill" cx="85" cy="88" r="10"></circle><circle class="seal-cut" cx="85" cy="88" r="7"></circle><circle class="seal-cut" cx="85" cy="88" r="2"></circle>
`,
amphora: `
<path class="seal-fill" d="M50 23h20v8H50z"></path>
<path class="seal-cut" d="M54 25h12M54 31v11h12V31"></path>
<path class="seal-wash" d="M53 41c-12 2-19 10-19 23 0 14 9 23 26 30 17-7 26-16 26-30 0-13-7-21-19-23z"></path>
<path class="seal-line" d="M53 41c-12 2-19 10-19 23 0 14 9 23 26 30 17-7 26-16 26-30 0-13-7-21-19-23z"></path>
<path class="seal-cut" d="M54 46c-9 3-14 9-14 18 0 11 7 19 20 25 13-6 20-14 20-25 0-9-5-15-14-18"></path>
<path class="seal-fill" d="M43 41c-8-4-12 0-12 7 0 5 3 9 9 11l4-5M77 41c8-4 12 0 12 7 0 5-3 9-9 11l-4-5"></path>
<path class="seal-cut" d="M37 46c-3 4-1 8 3 10M83 46c3 4 1 8-3 10"></path>
<path class="seal-fill" d="M44 57h32v6H44z"></path>
<path class="seal-cut" d="M46 59h28"></path>
<path class="seal-hatch" d="M43 67c2 8 7 14 14 18M77 67c-2 8-7 14-14 18M49 72l7 8M71 72l-7 8"></path>
<path class="seal-line" d="M53 94h14M50 99h20"></path>
`,
pantheon: `<image class="seal-photo" href="${portraitPantheon}" x="19" y="19" width="82" height="82" preserveAspectRatio="xMidYMid meet"></image>`,
mint: `
<path class="seal-wash" d="M38 68h44l-5 10H43zM48 79h26v7H48zM42 87h38v5H42z"></path>
<path class="seal-line" d="M38 67h44l-5 12H43zM48 79h26v8H48zM42 87h38v6H42z"></path>
<path class="seal-cut" d="M43 70h34M52 81h18M47 89h28"></path>
<path class="seal-fill" d="M54 61h12v8H54zM51 59h18v3H51z"></path>
<path class="seal-line" d="M54 62h12v7H54zM51 59h18v3H51z"></path>
<ellipse class="seal-cut" cx="60" cy="58" rx="5" ry="2"></ellipse>
<path class="seal-fill" d="M20 64c2-7 7-10 13-10s10 4 12 10l-4 23H25z"></path>
<circle class="seal-fill" cx="29" cy="45" r="5"></circle>
<path class="seal-line" d="M25 45c2-5 8-6 11-1M26 49l6 1"></path>
<path class="seal-cut" d="M25 44c2-4 7-5 10-2"></path>
<path class="seal-fill" d="M29 56c6 0 10 3 13 8l15-3 2 4-17 7-13-5z"></path>
<path class="seal-line" d="m34 60 16 3 8-3M35 65l15 2 8-3"></path>
<path class="seal-cut" d="m39 61 12 2m-11 3 12 1"></path>
<path class="seal-line" d="M26 78v13M32 79v12M24 91h13M26 92v5M35 92v5"></path>
<path class="seal-fill" d="M49 43c0-6 4-10 10-10s10 4 10 10v14H49z"></path>
<circle class="seal-fill" cx="58" cy="29" r="5"></circle>
<path class="seal-line" d="M54 29c2-4 7-5 10-1M51 38h15"></path>
<path class="seal-cut" d="M55 26c2-2 5-1 7 1"></path>
<path class="seal-fill" d="M51 42h5l4 15-4 4-6-11zM64 42h4l7 13-3 4-10-10z"></path>
<path class="seal-line" d="m54 44 5 14m6-13 8 12"></path>
<path class="seal-fill" d="M76 48c0-7 4-12 10-12s10 5 10 12v14H76z"></path>
<circle class="seal-fill" cx="86" cy="28" r="5"></circle>
<path class="seal-line" d="M82 28c2-4 7-5 10-1M79 42h15"></path>
<path class="seal-fill" d="m78 47-10 8 2 4 14-6zM92 44l4 4-7 9-4-3z"></path>
<path class="seal-line" d="m79 48-10 8m23-10-5 10"></path>
<path class="seal-fill" d="m77 19 7-6 15 22-8 6zM76 16l8-7 5 5-8 7z"></path>
<path class="seal-line" d="m79 17 5-4m-2 8 5-4m-1 1 12 18"></path>
<path class="seal-cut" d="m83 15 3-2m-1 8 4-3"></path>
<path class="seal-line" d="M81 63v6M89 63v6M79 69h13"></path>
<circle class="seal-fill" cx="60" cy="57" r="2"></circle>
<path class="seal-hatch" d="M26 69l5 2m19-24 3 6m15-8 3 5m10 7-4 3m14-2-3 4"></path>
`,
};

let sealPaperSeq = 0;

export const Seal = ({ badge, earned, size = 52 }) => {
  const artKey = badge?.art ?? 'temple';
  const art = BADGE_ART[artKey] ?? BADGE_ART.temple;
  const paper = `q-seal-paper-${(sealPaperSeqUi += 1)}`;
  const isPhoto = ['bust', 'severan', 'empress', 'pantheon'].includes(artKey);
  const engraved = isPhoto ? '' : ' q-seal-engraved';
  return (
    <svg
      className={`q-seal ${earned ? 'q-seal-earned' : 'q-seal-locked'}${engraved}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{
        // framed medallion for every badge — engraved arts and photographed
        // portraits alike (the ring + parchment card is the badge look)
        __html: `<circle class="seal-ring" cx="60" cy="60" r="55"></circle><circle class="seal-bead" cx="60" cy="60" r="47"></circle><defs><radialGradient id="${paper}" cx="50%" cy="40%" r="62%"><stop offset="0" stop-color="#fdf9f0"></stop><stop offset="0.66" stop-color="#f6ecda"></stop><stop offset="1" stop-color="#e7d7bd"></stop></radialGradient></defs><circle class="seal-field" cx="60" cy="60" r="41" fill="url(#${paper})"></circle><g class="seal-engraving" transform="translate(60 60) scale(1.06) translate(-60 -60)">${art}</g>`
      }}   />
  );
};

let sealPaperSeqUi = 0;

export const Bar = ({ percent, collected, total, large = false, complete = false }) => {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div
      className={`q-bar${large ? ' q-bar-lg' : ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={collected}
      aria-valuetext={`${collected} of ${total} requirements`}
    >
      <span className={`q-bar-fill${complete ? ' q-bar-fill-complete' : ''}`} style={{ transform: `scaleX(${safePercent / 100})` }} />
    </div>
  );
};

export const statusLabel = (complete) => (complete ? 'Completed' : 'In progress');

// Full-page load-failure state, mirroring the coin-flip loading layout:
// amber alert mark, condensed title, short explanation, and a Try again
// button the page wires back to its own refresh().
export const QuestError = ({ onRetry }) => (
  <div className="q-error" role="alert">
    <div className="q-error-mark" aria-hidden="true"><Icon name="alert" size={24} /></div>
    <h2 className="q-error-title">Could not load quests</h2>
    <p className="q-error-copy">
      The server didn&apos;t answer. Check your connection and try again —
      progress is re-checked live on every load, so nothing is lost.
    </p>
    {onRetry && (
      <button className="q-error-retry" type="button" onClick={onRetry}>
        <Icon name="refresh" size={16} />
        Try again
      </button>
    )}
  </div>
);

export const Chip = ({ complete, children }) => (
  <span className={`q-chip ${complete ? 'q-chip-complete' : 'q-chip-progress'}`}>
    <Icon name={complete ? 'check' : 'circle'} size={13} />
    {children}
  </span>
);

// Deterministic engraved-style placeholder for a coin photo slot — same
// shape as the prototype's coinThumb: initials on the obverse, type glyph
// on the reverse.
const placeHolders = new Map();
export const coinPlaceholder = (coin, side) => {
  const key = `${coin._id}-${side}`;
  if (placeHolders.has(key)) return placeHolders.get(key);
  const text = side === 'obv'
    ? String(coin.issuer ?? '').split(/\s+/).slice(0, 2).map((w) => (w[0] ?? '').toUpperCase()).join('')
    : String(coin.denomination ?? '').startsWith('AR') ? '✶' : '❖';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="58" fill="#465768"/><circle cx="60" cy="60" r="50" fill="none" stroke="#a7b5c1" stroke-width="3" stroke-dasharray="4 3"/><circle cx="60" cy="60" r="34" fill="#a7b5c1" opacity="0.35"/><text x="60" y="${side === 'obv' ? 70 : 66}" text-anchor="middle" font-family="Georgia, serif" font-size="${side === 'obv' ? 30 : 34}" font-weight="700" fill="#f4f6f8">${text || '◆'}</text></svg>`;
  const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  placeHolders.set(key, url);
  return url;
};

export const ProgressRing = ({ percent, collected, total, size = 116 }) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  const offset = circumference * (1 - safePercent / 100);
  return (
    <svg
      className="q-progress-ring"
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`${safePercent}% of requirements met`}
    >
      <circle className="q-ring-track" cx="60" cy="60" r={radius} />
      <circle
        className="q-ring-fill"
        cx="60"
        cy="60"
        r={radius}
        strokeDasharray={circumference.toFixed(2)}
        strokeDashoffset={offset.toFixed(2)}
        transform="rotate(-90 60 60)"
      />
      <text className="q-ring-pct" x="60" y="63" textAnchor="middle" aria-hidden="true">
        {safePercent}%
      </text>
      <text className="q-ring-sub" x="60" y="79" textAnchor="middle" aria-hidden="true">
        {collected} / {total}
      </text>
    </svg>
  );
};
