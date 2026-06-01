export const money = value => `$${Number(value).toLocaleString(undefined,{minimumFractionDigits:value < 1 ? 4 : 2,maximumFractionDigits:value < 1 ? 6 : 2})}`;
export const credits = value => Number(value).toLocaleString(undefined,{maximumFractionDigits:2});
export const safeText = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function statusBadge(status) {
 return `<span class="status ${status}">${safeText(String(status).replaceAll('-',' '))}</span>`;
}
