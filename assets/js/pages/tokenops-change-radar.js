import {safeText} from './tokenops-render.js';
export function renderAnnouncements(container, announcements) {
 container.innerHTML = announcements.map(item=>`<article>
  <h3>${safeText(item.title)}</h3><p>${safeText(item.summary)}</p>
  <p><strong>TokenOps impact:</strong> ${safeText(item.impact)}</p>
  <div class="meta"><span>${safeText(item.provider)}</span><span>${safeText(item.category)}</span><span>${safeText(item.effectiveDate || 'No fixed effective date')}</span></div>
  <a href="${item.source}" target="_blank" rel="noopener">Official source ↗</a>
 </article>`).join('');
}
