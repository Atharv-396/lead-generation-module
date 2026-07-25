import { test, expect } from '@playwright/test';

test('visitor submits a valid lead — success toast appears and form resets', async ({ page }) => {
  await page.goto('/');

  // Fill all form fields with valid data
  await page.fill('#name', 'Jane Doe');
  await page.fill('#email', 'jane.doe@example.com');
  await page.selectOption('#budget', 'Under ₹10,000');
  await page.fill('#message', 'I am interested in your services and would like to learn more.');

  // Submit the form
  await page.click('button[type="submit"]');

  // Success toast should appear
  await expect(page.getByText('Lead Submitted Successfully')).toBeVisible();

  // Form fields should reset to empty/default state
  await expect(page.locator('#name')).toHaveValue('');
  await expect(page.locator('#email')).toHaveValue('');
  await expect(page.locator('#message')).toHaveValue('');
});

test('visitor submits with all fields empty — all four inline errors appear simultaneously', async ({ page }) => {
  await page.goto('/');

  // Click submit without filling anything
  await page.click('button[type="submit"]');

  // All four error messages should be visible simultaneously
  await expect(page.locator('#name-error')).toBeVisible();
  await expect(page.locator('#email-error')).toBeVisible();
  await expect(page.locator('#budget-error')).toBeVisible();
  await expect(page.locator('#message-error')).toBeVisible();

  // Verify specific error text
  await expect(page.locator('#name-error')).toContainText('Name must be');
  await expect(page.locator('#email-error')).toContainText('valid email');
  await expect(page.locator('#budget-error')).toContainText('budget');
  await expect(page.locator('#message-error')).toContainText('Message must be');
});
