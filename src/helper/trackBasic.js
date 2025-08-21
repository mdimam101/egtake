// utils/trackBasic.js
import SummaryApi from "../common/SummaryApi";

export async function trackBasic(type, extra = {}) {
  try {
    await fetch(SummaryApi.track_basic.url, {
      method: SummaryApi.track_basic.method.toUpperCase(),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...extra })
    });
  } catch {}
}

// EXACT usage (আপনার চাওয়া মতো):
// trackBasic('visit_app');
// trackBasic('category_click', { subCategory: 'men-shoes' });
// trackBasic('search', { term: 'air max' });
// trackBasic('product_view', { subCategory: 'men-shoes' });
// trackBasic('add_to_cart', { count: 3 });
// trackBasic('order_confirm', { count: 5 });
