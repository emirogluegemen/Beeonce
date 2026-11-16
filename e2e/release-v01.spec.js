const { test, expect } = require('@playwright/test');
test.describe.configure({ mode: 'serial' });
async function login(page, email) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill('Demo1234!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
async function logout(page) { await page.getByRole('button', { name: 'Sign out' }).click(); }
function monday() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  return d.toISOString().slice(0, 10);
}

test('M1 — login goes to the correct role-specific screen', async ({ page }) => {
  await login(page, 'parent@demo.test');
  await expect(page).toHaveURL(/\/parent$/);
  await expect(page.getByRole('heading', { name: 'Your child’s week' })).toBeVisible();
  await logout(page);
  await login(page, 'child@demo.test');
  await expect(page).toHaveURL(/\/child$/);
  await expect(page.getByRole('heading', { name: /Hello, Deniz/ })).toBeVisible();
  await expect(page.getByRole('form', { name: 'Assign a task' })).toHaveCount(0);
});

test('M2 — parent links registered specialist, then unlinks after confirmation', async ({ page, request }) => {
  await login(page, 'parent@demo.test');
  const form = page.getByRole('form', { name: 'Link specialist' });
  await form.getByLabel('Registered email').fill('doctor@demo.test');
  await form.getByLabel('Specialist type').selectOption('doctor');
  await form.getByRole('button', { name: 'Link specialist' }).click();
  await expect(page.getByText('Can Demo')).toBeVisible();
  await logout(page);
  await login(page, 'doctor@demo.test');
  await expect(page.getByRole('heading', { name: 'Your linked children' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Deniz Demo’s schedule and tasks/ })).toBeVisible();
  const oldToken = await page.evaluate(() => localStorage.getItem('seng383-demo-token'));
  await logout(page);
  await login(page, 'parent@demo.test');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Unlink Can Demo' }).click();
  await expect(page.getByRole('button', { name: 'Unlink Can Demo' })).toHaveCount(0);
  const denied = await request.get('/api/children/1/events', { headers: { Authorization: `Bearer ${oldToken}` } });
  expect(denied.status()).toBe(403);
});

test('M3 — parent creates an event and child sees it in the same week', async ({ page }) => {
  const week = monday();
  await login(page, 'parent@demo.test');
  const form = page.getByRole('form', { name: 'Add an event' });
  await form.getByLabel('Event title').fill('E2E art workshop');
  await form.getByLabel('Starts').fill(`${week}T12:00`);
  await form.getByLabel('Ends').fill(`${week}T13:00`);
  await form.getByRole('button', { name: 'Add to schedule' }).click();
  await expect(page.getByText('E2E art workshop')).toBeVisible();
  await logout(page);
  await login(page, 'child@demo.test');
  await expect(page.getByText('E2E art workshop')).toBeVisible();
  await expect(page.getByRole('form', { name: 'Add an event' })).toHaveCount(0);
});

test('M4 — parent assigns task, child completes, parent sees completed', async ({ page }) => {
  const week = monday();
  await login(page, 'parent@demo.test');
  const form = page.getByRole('form', { name: 'Assign a task' });
  await form.getByLabel('Task title').fill('E2E build a paper rocket');
  await form.getByLabel('Description').fill('Fold a sheet of paper with supervision.');
  await form.getByLabel('Development area').selectOption('motor');
  await form.getByLabel('Due date').fill(week);
  await form.getByRole('button', { name: 'Assign task' }).click();
  await expect(page.getByText('E2E build a paper rocket')).toBeVisible();
  await logout(page);
  await login(page, 'child@demo.test');
  await page.getByRole('button', { name: 'Mark E2E build a paper rocket as done' }).click();
  await expect(page.getByText('E2E build a paper rocket')).toBeVisible();
  await logout(page);
  await login(page, 'parent@demo.test');
  const row = page.getByRole('listitem').filter({ hasText: 'E2E build a paper rocket' });
  await expect(row.getByText('Completed', { exact: true })).toBeVisible();
});
