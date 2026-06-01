import { test, expect } from '@playwright/test';

test('TokenOps portfolio module mounts calculators with selectable models', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByText('TokenOps Cost Engineering Lab')).toBeVisible();
  await expect(page.getByText('Designing technology for human experience')).toBeVisible();
  await expect(page.locator('#to-api-model option')).not.toHaveCount(0);
  await expect(page.locator('[data-role="api-summary"] .tokenops-metric')).toHaveCount(4);

  await page.getByRole('tab', { name: 'GitHub Copilot AI Credits' }).click();
  await expect(page.locator('#to-copilot-model option')).not.toHaveCount(0);
  await expect(page.locator('#to-copilot-model')).toHaveValue('GPT-5.4 mini');
  await expect(page.locator('[data-role="copilot-summary"]')).toContainText('Credits / Month');
  await page.locator('#to-copilot-compare').check();
  await expect(page.locator('[data-role="copilot-comparison"] tbody tr').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('supporting content is secondary to calculator functionality', async ({ page }) => {
  await page.route('**/data/tokenops-learning-content.json', route => route.abort());
  await page.goto('/');
  await page.getByRole('tab', { name: 'GitHub Copilot AI Credits' }).click();
  await expect(page.locator('#to-copilot-model option')).not.toHaveCount(0);
  await expect(page.locator('[data-role="copilot-summary"]')).toContainText('Credits / Month');
  await page.getByRole('tab', { name: 'Optimize Usage' }).click();
  await expect(page.getByText(/supporting optimization content is temporarily unavailable/i)).toBeVisible();
});

test('critical registry failure is visible', async ({ page }) => {
  await page.route('**/data/tokenops-copilot-models.json', route => route.abort());
  await page.goto('/');
  await expect(page.getByText(/Unable to load calculator data/i)).toBeVisible();
});
