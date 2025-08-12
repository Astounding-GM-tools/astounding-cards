import { Page } from '@playwright/test';

/**
 * Dev tools helper for E2E tests
 * Provides convenient access to the app's development tools
 */
export class DevToolsHelper {
  constructor(private page: Page) {}

  /**
   * Enable dev mode to access dev tools
   */
  async enableDevMode() {
    await this.page.evaluate(() => {
      // @ts-ignore - Using window global for E2E helpers
      window.e2eHelpers.enableDevMode();
    });
  }

  /**
   * Disable dev mode
   */
  async disableDevMode() {
    await this.page.evaluate(() => {
      // @ts-ignore - Using window global for E2E helpers
      window.e2eHelpers.disableDevMode();
    });
  }

  /**
   * Check if dev mode is currently enabled
   */
  async isDevModeEnabled(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return localStorage.getItem('devMode') === 'true';
    });
  }

  /**
   * Clear all data from the database
   * WARNING: This will delete all decks and cards!
   */
  async clearDatabase() {
    await this.ensureDevMode();
    await this.openDeckManager();
    
    const devSection = this.page.locator('.dev-controls');
    await devSection.waitFor({ state: 'visible', timeout: 5000 });
    
    const clearButton = devSection.locator('button:has-text("Clear Database")');
    await clearButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // Set up dialog handler before clicking
    this.page.once('dialog', async dialog => {
      if (dialog.message().includes('delete all decks')) {
        await dialog.accept();
      }
    });
    
    // Click the button
    await clearButton.click();
    
    // Wait for page reload after clearing
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Add sample data to the database
   * Creates a deck called "Tales of the Uncanny" with 3 sample cards
   */
  async addSampleData() {
    await this.ensureDevMode();
    await this.openDeckManager();
    
    const devSection = this.page.locator('.dev-controls');
    await devSection.waitFor({ state: 'visible', timeout: 5000 });
    
    const sampleButton = devSection.locator('button:has-text("Add Sample Data")');
    await sampleButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // Set up dialog handler before clicking
    this.page.once('dialog', async dialog => {
      if (dialog.message().includes('Add sample deck')) {
        await dialog.accept();
      }
    });
    
    await sampleButton.click();
    
    // Wait for page reload after adding sample data
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Test toast notification system
   */
  async testToast() {
    await this.ensureDevMode();
    await this.openDeckManager();
    
    const devSection = this.page.locator('.dev-controls');
    const toastButton = devSection.locator('button:has-text("Test Toast")');
    
    await toastButton.click();
    
    // Return toast locator for further testing
    return this.page.locator('.toast');
  }

  /**
   * Setup a clean test environment with sample data
   * This is perfect for most E2E tests that need some data to work with
   */
  async setupTestEnvironment() {
    // Use console shortcuts for faster, more reliable setup
    const result = await this.page.evaluate(async () => {
      // @ts-ignore - Using window global for E2E helpers
      return await window.e2eHelpers.setupTestEnvironment();
    });
    
    // Wait for any UI updates
    await this.page.waitForLoadState('networkidle');
    
    return result;
  }

  /**
   * Setup a completely empty test environment
   * Useful for tests that need to start from scratch
   */
  async setupEmptyEnvironment() {
    await this.page.evaluate(async () => {
      // @ts-ignore - Using window global for E2E helpers
      await window.e2eHelpers.enableDevMode();
      await window.e2eHelpers.clearDatabase();
    });
    
    // Wait for any UI updates
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fast console-based clear database (bypasses UI)
   */
  async clearDatabaseConsole() {
    const result = await this.page.evaluate(async () => {
      // @ts-ignore - Using window global for E2E helpers
      return await window.e2eHelpers.clearDatabase();
    });
    
    await this.page.waitForLoadState('networkidle');
    return result;
  }

  /**
   * Fast console-based add sample data (bypasses UI)
   */
  async addSampleDataConsole() {
    const result = await this.page.evaluate(async () => {
      // @ts-ignore - Using window global for E2E helpers
      return await window.e2eHelpers.addSampleData();
    });
    
    await this.page.waitForLoadState('networkidle');
    return result;
  }

  /**
   * Private helper: Ensure dev mode is enabled
   */
  private async ensureDevMode() {
    const isEnabled = await this.isDevModeEnabled();
    if (!isEnabled) {
      await this.enableDevMode();
    }
  }

  /**
   * Private helper: Open deck manager dialog
   */
  private async openDeckManager() {
    // Only open if not already open
    const isOpen = await this.page.locator('.deck-dialog').count() > 0;
    if (!isOpen) {
      await this.page.click('button:has-text("📚 Manage Decks")');
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Private helper: Close deck manager dialog
   */
  private async closeDeckManager() {
    const closeButton = this.page.locator('.deck-dialog .close-button');
    const isVisible = await closeButton.count() > 0;
    if (isVisible) {
      await closeButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Get information about sample data
   * Useful for tests that need to know what data is available
   */
  getSampleDataInfo() {
    return {
      deckName: "Tales of the Uncanny",
      cardCount: 3,
      cards: [
        { name: "Dr. Blackwood", role: "Enigmatic Professor", type: "character" },
        { name: "The Ethereal Compass", role: "Mystical Device", type: "item" },
        { name: "The Misty Vale", role: "Mysterious Location", type: "location" }
      ]
    };
  }
}
