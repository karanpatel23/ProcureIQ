import { ImageResponse } from 'next/og';
import { brand } from '@/lib/seo';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Corven — The AI decision layer for procurement';

// Branded social/preview card shown when the site is shared or surfaced in search.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 80, background: 'linear-gradient(150deg, #0e1116 0%, #171c25 60%, #10131a 100%)', color: '#e9e6e7', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(150deg, #9db0cc, #6b7c98)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0e1116', fontSize: 40, fontWeight: 800 }}>P</div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>Corven</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 900 }}>{brand.tagline}</div>
          <div style={{ fontSize: 30, color: '#9ba1ac', maxWidth: 880, lineHeight: 1.35 }}>Supplier quotes, RFQs, exceptions, and approvals in one human-controlled decision workflow.</div>
        </div>
        <div style={{ fontSize: 26, color: '#6b7c98', fontWeight: 600 }}>corven.com</div>
      </div>
    ),
    { ...size },
  );
}
