import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for report CRUD operations across all user groups.
 *
 * User groups are determined by crc32(userId) % 8:
 * - Group A (0): Has damage_photo_upload, priority_indicators, bulk_actions
 * - Group B (1): Has damage_photo_upload, priority_indicators
 * - Group C (2): Has damage_photo_upload only
 * - Group D (3): Has damage_photo_upload only
 * - Groups E-H: No user_groups feature flags enabled
 *
 * Feature flags from FeatureFlagSeeder:
 * - damage_photo_upload: enabled for groups A, B, C, D (user_groups)
 * - priority_indicators: enabled for groups A, B (user_groups)
 * - bulk_actions: enabled for group A only (user_groups)
 * - ai_damage_detection: boolean, active for all users
 * - pdf_export: boolean, inactive (scheduled for future)
 */

/**
 * User IDs that deterministically map to each group (A-H)
 * Based on CRC32 hash modulo 8
 * Matches backend/tests/Feature/ReportControllerTest.php USER_GROUPS
 */
const USER_GROUPS = {
  A: 'user-3',
  B: 'user-7',
  C: 'user-0',
  D: 'user-4',
  E: 'user-1',
  F: 'user-5',
  G: 'user-2',
  H: 'user-6',
} as const;

type GroupName = keyof typeof USER_GROUPS;

interface GroupConfig {
  name: GroupName;
  userId: string;
  hasPhotos: boolean;
  hasPriority: boolean;
  hasBulkActions: boolean;
  hasAiDetection: boolean; // Boolean flag, available to all when photos exist
  hasPdfExport: boolean; // Currently inactive (scheduled)
}

// Groups with their feature flag availability based on FeatureFlagSeeder
const groups: GroupConfig[] = [
  {
    name: 'A',
    userId: USER_GROUPS.A,
    hasPhotos: true,
    hasPriority: true,
    hasBulkActions: true,
    hasAiDetection: true,
    hasPdfExport: false, // Scheduled, not active
  },
  {
    name: 'B',
    userId: USER_GROUPS.B,
    hasPhotos: true,
    hasPriority: true,
    hasBulkActions: false,
    hasAiDetection: true,
    hasPdfExport: false,
  },
  {
    name: 'C',
    userId: USER_GROUPS.C,
    hasPhotos: true,
    hasPriority: false,
    hasBulkActions: false,
    hasAiDetection: true,
    hasPdfExport: false,
  },
  {
    name: 'D',
    userId: USER_GROUPS.D,
    hasPhotos: true,
    hasPriority: false,
    hasBulkActions: false,
    hasAiDetection: true,
    hasPdfExport: false,
  },
  {
    name: 'E',
    userId: USER_GROUPS.E,
    hasPhotos: false,
    hasPriority: false,
    hasBulkActions: false,
    hasAiDetection: true, // Available but needs photos to show
    hasPdfExport: false,
  },
  {
    name: 'F',
    userId: USER_GROUPS.F,
    hasPhotos: false,
    hasPriority: false,
    hasBulkActions: false,
    hasAiDetection: true,
    hasPdfExport: false,
  },
  {
    name: 'G',
    userId: USER_GROUPS.G,
    hasPhotos: false,
    hasPriority: false,
    hasBulkActions: false,
    hasAiDetection: true,
    hasPdfExport: false,
  },
  {
    name: 'H',
    userId: USER_GROUPS.H,
    hasPhotos: false,
    hasPriority: false,
    hasBulkActions: false,
    hasAiDetection: true,
    hasPdfExport: false,
  },
];

const PHOTO_URL = 'https://iaotle.dev/images/me.webp';

async function setUserGroup(page: Page, userId: string) {
  await page.goto('/');
  await page.evaluate((id) => {
    localStorage.setItem('feature_flag_user_id', id);
  }, userId);
}

for (const group of groups) {
  test.describe(`User Group ${group.name}`, () => {
    // Use a unique timestamp per test run to avoid conflicts
    let reportTitle: string;
    let editedTitle: string;

    const reportDescription =
      'This is a comprehensive damage report created during e2e testing. The damage was observed on the vehicle exterior and requires immediate attention. Multiple areas of the vehicle are affected.';
    const reportLocation = 'Front bumper, driver side panel';
    const reportPriority = 'high';

    const editedDescription =
      'Updated description after editing. The damage assessment has been revised following a more thorough inspection.';
    const editedLocation = 'Front bumper and hood, driver side';

    test.beforeEach(async ({ page }) => {
      // Generate unique title for each test
      reportTitle = `E2E Report - Group ${group.name} - ${Date.now()}`;
      editedTitle = `EDITED: ${reportTitle}`;
      await setUserGroup(page, group.userId);
    });

    test('can create, submit, and edit a report with all available fields', async ({
      page,
    }) => {
      // ===== CREATE REPORT =====
      await page.goto('/reports/new');

      // Wait for the form to load (flags fetched)
      await expect(
        page.getByRole('heading', { name: 'New Damage Report' })
      ).toBeVisible();

      // Fill title
      const titleInput = page.locator('input[type="text"]').first();
      await titleInput.fill(reportTitle);

      // Fill description
      const descriptionTextarea = page.locator('textarea');
      await descriptionTextarea.fill(reportDescription);

      // Fill damage location
      const locationInput = page.locator('input[type="text"]').nth(1);
      await locationInput.fill(reportLocation);

      // ===== PRIORITY FIELD =====
      const prioritySelect = page.locator('select');
      if (group.hasPriority) {
        await expect(prioritySelect).toBeVisible();
        await prioritySelect.selectOption(reportPriority);
      } else {
        // Priority should NOT be visible for this group
        await expect(prioritySelect).not.toBeVisible();
      }

      // ===== PHOTO UPLOAD =====
      const addPhotoButton = page.getByRole('button', { name: '+ Add Photo' });
      if (group.hasPhotos) {
        // Set up dialog handler before clicking
        page.on('dialog', async (dialog) => {
          await dialog.accept(PHOTO_URL);
        });

        await expect(addPhotoButton).toBeVisible();
        await addPhotoButton.click();

        // Wait for photo to appear
        await expect(page.locator('img[alt="Damage photo 1"]')).toBeVisible();
      } else {
        // Photo upload should NOT be visible for this group
        await expect(addPhotoButton).not.toBeVisible();
      }

      // Submit the form
      const createButton = page.getByRole('button', { name: 'Create Report' });
      await createButton.click();

      // Wait for redirect to reports list
      await page.waitForURL('/reports');

      // ===== VERIFY REPORT CREATED =====
      await expect(page.getByText(reportTitle)).toBeVisible();

      // ===== VERIFY PRIORITY IN LIST =====
      const reportRow = page.locator('tr', { hasText: reportTitle });
      if (group.hasPriority) {
        // Priority badge should be visible in the table
        await expect(reportRow.locator('text=High')).toBeVisible();
      }

      // ===== BULK ACTIONS CHECKBOX =====
      const selectAllCheckbox = page.locator('th input[type="checkbox"]');
      if (group.hasBulkActions) {
        await expect(selectAllCheckbox).toBeVisible();
        // Individual row checkbox
        await expect(reportRow.locator('td input[type="checkbox"]')).toBeVisible();
      } else {
        // Bulk actions should NOT be visible
        await expect(selectAllCheckbox).not.toBeVisible();
      }

      // // ===== PDF EXPORT BUTTON ===== (scheduled, test will be flaky if enabled)
      // const pdfExportButton = page.getByRole('button', { name: 'Export PDF' });
      // if (group.hasPdfExport) {
      //   await expect(pdfExportButton).toBeVisible();
      // } else {
      //   // PDF Export should NOT be visible (flag is inactive/scheduled)
      //   await expect(pdfExportButton).not.toBeVisible();
      // }

      // ===== EDIT REPORT =====
      await reportRow.getByRole('link', { name: 'Edit' }).click();

      // Wait for edit form to load
      await expect(
        page.getByRole('heading', { name: 'Edit Damage Report' })
      ).toBeVisible();

      // Clear and update title
      const editTitleInput = page.locator('input[type="text"]').first();
      await editTitleInput.clear();
      await editTitleInput.fill(editedTitle);

      // Clear and update description
      const editDescriptionTextarea = page.locator('textarea');
      await editDescriptionTextarea.clear();
      await editDescriptionTextarea.fill(editedDescription);

      // Clear and update location
      const editLocationInput = page.locator('input[type="text"]').nth(1);
      await editLocationInput.clear();
      await editLocationInput.fill(editedLocation);

      // ===== VERIFY PRIORITY FIELD ON EDIT =====
      const editPrioritySelect = page.locator('select');
      if (group.hasPriority) {
        await expect(editPrioritySelect).toBeVisible();
        await editPrioritySelect.selectOption('low');
      } else {
        await expect(editPrioritySelect).not.toBeVisible();
      }

      // ===== VERIFY PHOTO UPLOAD ON EDIT =====
      const editAddPhotoButton = page.getByRole('button', { name: '+ Add Photo' });
      if (group.hasPhotos) {
        await expect(editAddPhotoButton).toBeVisible();
        // Photo should still be there from creation
        await expect(page.locator('img[alt="Damage photo 1"]')).toBeVisible();
      } else {
        await expect(editAddPhotoButton).not.toBeVisible();
      }

      // Save changes
      const saveButton = page.getByRole('button', { name: 'Save Changes' });
      await saveButton.click();

      // Wait for redirect to view page
      await page.waitForURL(/\/reports\/\d+$/);

      // ===== VERIFY EDIT SAVED =====
      await expect(
        page.getByRole('heading', { name: editedTitle })
      ).toBeVisible();
      await expect(page.getByText(editedDescription)).toBeVisible();
      await expect(page.getByText(editedLocation)).toBeVisible();

      // ===== VERIFY PRIORITY ON VIEW PAGE =====
      if (group.hasPriority) {
        // Look for the priority badge specifically
        await expect(
          page.locator('span.capitalize', { hasText: 'low' })
        ).toBeVisible();
      }

      // ===== VERIFY PHOTO ON VIEW PAGE =====
      if (group.hasPhotos) {
        await expect(page.locator('img[alt="Damage photo 1"]')).toBeVisible();

        // ===== VERIFY AI DAMAGE DETECTION =====
        // AI detection should be visible when photos exist and flag is enabled
        if (group.hasAiDetection) {
          await expect(
            page.getByText('Automatic Damage Detection')
          ).toBeVisible();
          // Verify the "Run Analysis" button is present
          await expect(
            page.getByRole('button', { name: 'Run Analysis' })
          ).toBeVisible();
        }
      }
    });

    // Test bulk delete functionality for Group A
    if (group.hasBulkActions) {
      test('can use bulk delete functionality', async ({ page }) => {
        // First create a report
        await page.goto('/reports/new');
        await expect(
          page.getByRole('heading', { name: 'New Damage Report' })
        ).toBeVisible();

        const bulkTestTitle = `Bulk Delete Test - Group ${group.name} - ${Date.now()}`;

        await page.locator('input[type="text"]').first().fill(bulkTestTitle);
        await page.locator('textarea').fill('Test report for bulk delete');
        await page.locator('input[type="text"]').nth(1).fill('Test location');

        if (group.hasPriority) {
          await page.locator('select').selectOption('low');
        }

        await page.getByRole('button', { name: 'Create Report' }).click();
        await page.waitForURL('/reports');

        // Verify report exists
        await expect(page.getByText(bulkTestTitle)).toBeVisible();

        // Select the report using checkbox
        const reportRow = page.locator('tr', { hasText: bulkTestTitle });
        await reportRow.locator('td input[type="checkbox"]').check();

        // Bulk delete button should appear
        const bulkDeleteButton = page.getByRole('button', {
          name: /Delete Selected/,
        });
        await expect(bulkDeleteButton).toBeVisible();

        // For confirm() dialogs, we need to handle them in parallel with the click
        // because confirm() is synchronous and blocks JavaScript execution
        await Promise.all([
          // Wait for dialog and accept it
          page.waitForEvent('dialog').then((dialog) => dialog.accept()),
          // Click the button (this triggers the confirm dialog)
          bulkDeleteButton.click(),
        ]);

        // Wait for the report row to be removed from the DOM (API completes and React updates state)
        await expect(
          page.locator('tr', { hasText: bulkTestTitle })
        ).toHaveCount(0, { timeout: 15000 });
      });
    }

    // Verify priority column visibility in reports list
    test('reports list shows correct columns based on feature flags', async ({
      page,
    }) => {
      await page.goto('/reports');

      // Wait for page to load
      await expect(
        page.getByRole('heading', { name: 'Car Damage Reports' })
      ).toBeVisible();

      // Priority column header
      const priorityHeader = page.locator('th', { hasText: 'Priority' });
      if (group.hasPriority) {
        await expect(priorityHeader).toBeVisible();
      } else {
        await expect(priorityHeader).not.toBeVisible();
      }

      // Bulk actions checkbox column
      const selectAllCheckbox = page.locator('th input[type="checkbox"]');
      if (group.hasBulkActions) {
        await expect(selectAllCheckbox).toBeVisible();
      } else {
        await expect(selectAllCheckbox).not.toBeVisible();
      }

      // PDF Export button
      const pdfExportButton = page.getByRole('button', { name: 'Export PDF' });
      if (group.hasPdfExport) {
        await expect(pdfExportButton).toBeVisible();
      } else {
        await expect(pdfExportButton).not.toBeVisible();
      }
    });

    // Verify new report form shows correct fields
    test('new report form shows correct fields based on feature flags', async ({
      page,
    }) => {
      await page.goto('/reports/new');

      await expect(
        page.getByRole('heading', { name: 'New Damage Report' })
      ).toBeVisible();

      // Title - always visible
      await expect(page.locator('label', { hasText: 'Title' })).toBeVisible();

      // Description - always visible
      await expect(
        page.locator('label', { hasText: 'Description' })
      ).toBeVisible();

      // Damage Location - always visible
      await expect(
        page.locator('label', { hasText: 'Damage Location' })
      ).toBeVisible();

      // Priority - conditional
      const priorityLabel = page.locator('label', { hasText: 'Priority' });
      if (group.hasPriority) {
        await expect(priorityLabel).toBeVisible();
      } else {
        await expect(priorityLabel).not.toBeVisible();
      }

      // Photo upload - conditional
      const photoSection = page.getByRole('button', { name: '+ Add Photo' });
      if (group.hasPhotos) {
        await expect(photoSection).toBeVisible();
      } else {
        await expect(photoSection).not.toBeVisible();
      }
    });
  });
}
