/**
 * Offline-safe SVG artwork generator for raw agricultural products and raw categories.
 * Escapes all XML text safely so every data URI renders reliably across all browsers.
 */

const ARTWORK_PALETTES = {
  foodGrains: { bg1: '#FEF9C3', bg2: '#DCFCE7', accent: '#0F766E', detail: '#CA8A04', badge: '#FEF08A' },
  pulses: { bg1: '#FFEDD5', bg2: '#FEF3C7', accent: '#B45309', detail: '#EA580C', badge: '#FED7AA' },
  oilSeeds: { bg1: '#FEF3C7', bg2: '#ECFCCB', accent: '#A16207', detail: '#65A30D', badge: '#FDE68A' },
  commercial: { bg1: '#F1F5F9', bg2: '#CCFBF1', accent: '#0F766E', detail: '#475569', badge: '#E2E8F0' },
  spices: { bg1: '#FEE2E2', bg2: '#FEF3C7', accent: '#B91C1C', detail: '#D97706', badge: '#FECACA' },
  otherRaw: { bg1: '#ECFDF5', bg2: '#FEF9C3', accent: '#15803D', detail: '#92400E', badge: '#BBF7D0' },
};

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function encodeSvg(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
}

function getMotifSvg(motif, accent, detail) {
  switch (motif) {
    case 'paddy':
    case 'wheat':
    case 'maize':
    case 'grains':
      return `
        <path d="M160 158 V56" stroke="${detail}" stroke-width="5" stroke-linecap="round"/>
        <path d="M132 154 C132 125 142 96 152 72" stroke="${detail}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        <path d="M188 154 C188 125 178 96 168 72" stroke="${detail}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        <ellipse cx="148" cy="70" rx="8" ry="14" transform="rotate(-24 148 70)" fill="${detail}"/>
        <ellipse cx="172" cy="70" rx="8" ry="14" transform="rotate(24 172 70)" fill="${detail}"/>
        <ellipse cx="146" cy="94" rx="9" ry="15" transform="rotate(-28 146 94)" fill="${detail}" opacity="0.9"/>
        <ellipse cx="174" cy="94" rx="9" ry="15" transform="rotate(28 174 94)" fill="${detail}" opacity="0.9"/>
        <ellipse cx="148" cy="118" rx="8" ry="14" transform="rotate(-24 148 118)" fill="${accent}" opacity="0.85"/>
        <ellipse cx="172" cy="118" rx="8" ry="14" transform="rotate(24 172 118)" fill="${accent}" opacity="0.85"/>
        <circle cx="160" cy="54" r="9" fill="${detail}"/>
      `;
    case 'pulses':
      return `
        <ellipse cx="160" cy="126" rx="58" ry="26" fill="${accent}" opacity="0.92"/>
        <path d="M108 120 C125 140 195 140 212 120" stroke="#FFFFFF" stroke-width="2.5" opacity="0.5" fill="none"/>
        <circle cx="136" cy="108" r="11" fill="${detail}"/>
        <circle cx="158" cy="104" r="12" fill="#F59E0B"/>
        <circle cx="180" cy="109" r="11" fill="${detail}"/>
        <circle cx="147" cy="118" r="10" fill="#D97706"/>
        <circle cx="169" cy="118" r="10" fill="#FBBF24"/>
      `;
    case 'oilSeeds':
      return `
        <path d="M122 108 C110 92 126 70 144 80 C152 84 162 84 172 78 C192 68 208 88 194 108 C184 122 170 116 158 116 C146 116 132 122 122 108 Z" fill="#D97706" opacity="0.9"/>
        <circle cx="138" cy="96" r="10" fill="#FEF3C7" opacity="0.65"/>
        <circle cx="178" cy="94" r="10" fill="#FEF3C7" opacity="0.65"/>
        <circle cx="140" cy="136" r="9" fill="${detail}" opacity="0.9"/>
        <circle cx="160" cy="142" r="10" fill="${accent}" opacity="0.9"/>
        <circle cx="180" cy="136" r="9" fill="${detail}" opacity="0.9"/>
      `;
    case 'commercial':
      return `
        <circle cx="144" cy="106" r="22" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <circle cx="176" cy="106" r="22" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <circle cx="160" cy="84" r="22" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
        <path d="M126 128 Q160 156 194 128" stroke="${accent}" stroke-width="8" stroke-linecap="round" fill="none"/>
        <path d="M160 136 V160" stroke="${detail}" stroke-width="5" stroke-linecap="round"/>
      `;
    case 'spices':
      return `
        <path d="M126 88 C114 114 134 148 164 142 C154 128 148 108 146 90 C140 84 130 82 126 88 Z" fill="#DC2626"/>
        <path d="M134 86 C132 76 138 68 146 68" stroke="#15803D" stroke-width="4" stroke-linecap="round" fill="none"/>
        <ellipse cx="182" cy="116" rx="14" ry="26" transform="rotate(-18 182 116)" fill="#D97706"/>
        <path d="M174 106 H190 M176 120 H192" stroke="#FEF3C7" stroke-width="2.5" stroke-linecap="round"/>
      `;
    case 'otherRaw':
    default:
      return `
        <circle cx="144" cy="114" r="26" fill="${detail}" opacity="0.9"/>
        <circle cx="176" cy="116" r="24" fill="${detail}" opacity="0.82"/>
        <circle cx="144" cy="114" r="14" fill="#FEF3C7" opacity="0.65"/>
        <path d="M160 64 C146 72 138 86 142 96 C154 88 166 88 178 96 C182 86 174 72 160 64 Z" fill="${accent}"/>
      `;
  }
}

export function createAgriArtwork({ palette = 'foodGrains', motif = 'grains', label = 'Raw Product', tag = 'RAW CROP' }) {
  const colors = ARTWORK_PALETTES[palette] || ARTWORK_PALETTES.foodGrains;
  const motifSvg = getMotifSvg(motif, colors.accent, colors.detail);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colors.bg1}" />
          <stop offset="100%" stop-color="${colors.bg2}" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#bgGrad)"/>
      <circle cx="272" cy="36" r="48" fill="${colors.badge}" opacity="0.55"/>
      <circle cx="48" cy="172" r="54" fill="${colors.badge}" opacity="0.45"/>
      <ellipse cx="160" cy="162" rx="64" ry="12" fill="${colors.accent}" opacity="0.12"/>
      ${motifSvg}
      <rect x="16" y="16" width="96" height="24" rx="12" fill="#FFFFFF" opacity="0.92"/>
      <text x="64" y="32" font-family="Inter, Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle" fill="${colors.accent}">${escapeXml(tag)}</text>
      <text x="160" y="186" font-family="Inter, Segoe UI, sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="${colors.accent}" opacity="0.88">${escapeXml(label)}</text>
    </svg>
  `;

  return encodeSvg(svg);
}
