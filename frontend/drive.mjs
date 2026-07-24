import { chromium } from "playwright";

const URL = "http://localhost:5173";
const SHOT = "screenshot-work-filter.png";

const toAdd = [
  { title: "Buy milk", category: "Shopping" },
  { title: "Ship the release", category: "Work" },
  { title: "Call the dentist", category: "Personal" },
];

async function addTodo(page, { title, category }) {
  await page.getByLabel("New todo title").fill(title);
  await page.getByLabel("New todo category").selectOption(category);
  await page.getByRole("button", { name: "Add" }).click();
  // Wait for this todo's row to appear.
  await page.locator(".todo-title", { hasText: title }).waitFor();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 720, height: 640 } });
  const page = await context.newPage();

  await page.goto(URL, { waitUntil: "networkidle" });

  // Start from a clean list so re-runs don't accumulate duplicates. Delete
  // any todos that already exist (left over from prior runs) via the API.
  const existing = await page.evaluate(async () => {
    const res = await fetch("http://localhost:8000/api/todos");
    return res.json();
  });
  for (const t of existing) {
    await page.evaluate(async (id) => {
      await fetch(`http://localhost:8000/api/todos/${id}`, { method: "DELETE" });
    }, t.id);
  }
  // Wait for the UI to reflect the empty list. The deletes went straight to
  // the API (bypassing React state), so reload to let React re-fetch.
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".empty").waitFor();

  // Add the three todos with categories.
  for (const t of toAdd) await addTodo(page, t);

  // Mark "Ship the release" complete via its checkbox. Use a single click
  // (not .check(), which retries and double-toggles the controlled checkbox
  // while the async PATCH/refresh is in flight), then wait for the done style.
  const shipRow = page.locator(".todo-item", { hasText: "Ship the release" });
  await shipRow.locator(".todo-checkbox").click();
  await page.locator(".todo-item.is-done .todo-title", { hasText: "Ship the release" }).waitFor();

  // Sanity snapshot of the DOM before filtering.
  const allTitlesBefore = await page.locator(".todo-item .todo-title").allTextContents();
  const allCatsBefore = await page.locator(".todo-category").allTextContents();
  const shipDoneBefore = await page.locator(".todo-item.is-done .todo-title", { hasText: "Ship the release" }).count();

  // Click the Work filter pill.
  await page.getByRole("tab", { name: "Work" }).click();

  // Wait for filtering: visible titles should be only Work todos.
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOT, fullPage: true });

  const visibleTitles = await page.locator(".todo-item:visible .todo-title").allTextContents();
  const visibleCats = await page.locator(".todo-item:visible .todo-category").allTextContents();
  const visibleAll = await page.locator(".todo-item:visible").count();
  const activeFilter = await page.locator(".filter-pill.is-active").textContent();
  const shipStillDoneVisible = await page.locator(".todo-item.is-done:visible .todo-title", { hasText: "Ship the release" }).count();

  const result = {
    allTitlesBefore,
    allCatsBefore,
    shipDoneBefore,
    activeFilter,
    visibleTitles,
    visibleCats,
    visibleItemCount: visibleAll,
    shipStillDoneVisible,
    screenshot: SHOT,
  };
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})().catch((e) => { console.error("DRIVE_ERROR:", e); process.exit(1); });
