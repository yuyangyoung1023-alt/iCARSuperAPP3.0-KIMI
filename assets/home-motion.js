/* Presentation-only enhancement. Existing scene, permission and voice logic stays authoritative. */
(() => {
  'use strict';
  const home = document.getElementById('home');
  if (!home) return;
  const icon = name => typeof uiIcon === 'function' ? uiIcon(name) : '';
  const room = document.createElement('div');
  room.className = 'motionRoom';
  room.setAttribute('aria-hidden', 'true');
  room.innerHTML = `<svg viewBox="0 0 1440 740" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rmGlass" x2=".2" y2="1"><stop stop-color="#979fe8" stop-opacity=".38"/><stop offset="1" stop-color="#252547" stop-opacity=".16"/></linearGradient>
    <linearGradient id="rmShade" x2="1" y2=".5"><stop stop-color="#15162e" stop-opacity=".08"/><stop offset="1" stop-color="#131122" stop-opacity=".54"/></linearGradient>
    <linearGradient id="rmArch" x2="0" y2="1"><stop stop-color="#ffe3b9"/><stop offset="1" stop-color="#b899b1" stop-opacity=".3"/></linearGradient>
    <linearGradient id="rmSofa" x2=".3" y2="1"><stop stop-color="#ffffff" stop-opacity=".35"/><stop offset="1" stop-color="#341d3b" stop-opacity=".35"/></linearGradient>
    <linearGradient id="rmPlatform" x2="0" y2="1"><stop stop-color="#c1b8e0"/><stop offset="1" stop-color="#59536f"/></linearGradient>
    <radialGradient id="rmGlow"><stop stop-color="#d8d4ff" stop-opacity=".5"/><stop offset="1" stop-color="#8e7bc5" stop-opacity="0"/></radialGradient>
    <filter id="rmBlur"><feGaussianBlur stdDeviation="18"/></filter>
    <filter id="rmSoft"><feDropShadow dx="0" dy="15" stdDeviation="15" flood-color="#151324" flood-opacity=".4"/></filter>
    <clipPath id="rmWindow"><path d="M0 0H560Q645 0 645 86V426H0Z"/></clipPath>
  </defs>
  <rect width="1440" height="740" class="roomFloor"/>
  <g class="roomWorld">
    <path d="M0 0H1440V456L772 502 0 445Z" class="roomWall"/>
    <path d="M0 0H1440V456L772 502 0 445Z" fill="url(#rmShade)"/>
    <g clip-path="url(#rmWindow)">
      <rect width="648" height="430" class="roomSky"/>
      <ellipse cx="280" cy="375" rx="340" ry="170" fill="url(#rmGlow)"/>
      <g class="roomStars" fill="#dcdfff"><circle cx="160" cy="110" r="1.7"/><circle cx="250" cy="72" r="1"/><circle cx="334" cy="165" r="2"/><circle cx="496" cy="125" r="1.5"/><circle cx="545" cy="228" r="1"/><circle cx="202" cy="228" r="1"/><circle cx="389" cy="62" r="1.5"/></g>
      <g class="roomPlanet"><circle cx="228" cy="228" r="38" fill="#cdc4ee" opacity=".4"/><ellipse cx="228" cy="228" rx="67" ry="13" fill="none" stroke="#e3d0ff" stroke-opacity=".5" stroke-width="2" transform="rotate(-28 228 228)"/></g>
      <path d="M-70 408Q90 251 257 385Q410 280 620 402L680 450H0Z" fill="#282c4c"/><path d="M-40 445Q118 324 285 418Q431 350 664 435V470H0Z" fill="#7775a2" opacity=".55"/>
      <rect width="648" height="430" fill="url(#rmGlass)"/>
    </g>
    <path d="M0 429H649V86Q649 0 560 0" fill="none" stroke="#c7b6e0" stroke-opacity=".3" stroke-width="4"/>
    <path d="M166 0V428M376 0V428" stroke="#c7b6e0" stroke-opacity=".18" stroke-width="2"/>
    <path d="M710 0V472" stroke="#b4a1c0" stroke-opacity=".18" stroke-width="2"/>
    <path d="M1042 422V205a84 84 0 0 1 168 0V453Z" class="roomLight" opacity=".75"/>
    <path d="M1042 422V205a84 84 0 0 1 168 0V453Z" fill="url(#rmShade)"/>
    <path d="M1036 424V205a90 90 0 0 1 180 0V454" stroke="#ddcade" stroke-opacity=".28" stroke-width="5" fill="none"/>
    <path d="M1290 0H1440V457L1290 447Z" fill="#29283f" opacity=".45"/>
    <g stroke="#c8b6dc" stroke-opacity=".08" stroke-width="2"><path d="M1308 0V448M1325 0V449M1342 0V450M1359 0V451M1376 0V452M1393 0V453M1410 0V454M1427 0V455"/></g>
    <ellipse cx="734" cy="530" rx="530" ry="110" fill="url(#rmGlow)"/>
    <ellipse cx="940" cy="487" rx="260" ry="39" fill="#151123" opacity=".23" filter="url(#rmBlur)"/>
    <g filter="url(#rmSoft)">
      <rect x="927" y="344" width="278" height="106" rx="40" class="roomSofa"/>
      <rect x="927" y="344" width="278" height="106" rx="40" fill="url(#rmSofa)"/>
      <path d="M928 404Q932 385 958 386H1183Q1208 387 1215 413V464Q1070 491 923 454Z" class="roomSofa"/>
      <path d="M928 404Q932 385 958 386H1183Q1208 387 1215 413V464Q1070 491 923 454Z" fill="url(#rmSofa)"/>
      <rect x="908" y="381" width="47" height="79" rx="23" class="roomSofa"/><rect x="1194" y="383" width="44" height="78" rx="22" class="roomSofa"/>
      <path d="M1058 398V460" stroke="#694253" stroke-opacity=".2"/>
      <ellipse cx="350" cy="457" rx="84" ry="25" fill="#585177"/><path d="M272 401H428V449Q350 485 272 449Z" fill="#a7a0b9"/><ellipse cx="350" cy="401" rx="78" ry="25" fill="#c2b9cb"/>
      <path d="M337 389V302" stroke="#cebca8" stroke-width="7"/><ellipse cx="340" cy="309" rx="38" ry="12" fill="#8a87a7"/>
      <path d="M340 308Q288 260 299 243Q337 242 340 308M340 305Q352 258 386 265Q390 291 340 305" fill="#9cb7b2"/>
    </g>
    <ellipse cx="699" cy="526" rx="192" ry="43" fill="#1b1737" opacity=".38" filter="url(#rmBlur)"/>
    <path d="M500 467V483Q697 570 895 483V467Z" fill="url(#rmPlatform)"/>
    <ellipse cx="698" cy="467" rx="198" ry="48" fill="#aaa1cd"/><ellipse cx="698" cy="462" rx="190" ry="42" fill="#7d769f"/>
    <ellipse cx="698" cy="462" rx="169" ry="33" fill="none" stroke="#dfd7ff" stroke-opacity=".65" stroke-width="2"/>
    <ellipse cx="698" cy="460" rx="114" ry="28" fill="url(#rmGlow)"/>
    <g class="roomOrbital" fill="#e6d9ff" opacity=".35"><circle cx="543" cy="390" r="3"/><circle cx="840" cy="390" r="2"/></g>
  </g>
  <path d="M0 660Q720 594 1440 650V740H0Z" fill="#17192e" opacity=".18"/>
  </svg>`;
  home.prepend(room); home.classList.add('motionHome'); home.dataset.room='skills';
})();
