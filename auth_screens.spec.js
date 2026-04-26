const { test } = require('@playwright/test');

test('capture authenticated internal pages', async ({ page }) => {
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'ai_test_1777033577@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Login"), button:has-text("लॉग इन"), button:has-text("లాగిన్"), button[type="submit"]');
  await page.waitForTimeout(2000);

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/farmease_internal_dashboard.png', fullPage: true });

  await page.goto('http://localhost:5173/market', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/farmease_internal_market.png', fullPage: true });

  await page.goto('http://localhost:5173/farms', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/farmease_internal_farms.png', fullPage: true });

  await page.goto('http://localhost:5173/crop-recommendation', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/farmease_internal_crop.png', fullPage: true });
});
