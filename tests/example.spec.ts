import { expect, test } from "@playwright/test";
import {
    play,
    playParallel,
    playParallelWithLimit,
    startCodeGeneration,
    exportGeneratedCode,
    isCodeGenerationActive,
    getCollectedActionsCount,
    // Auto-healing imports
    createHealingPage,
    healSelector,
    verifySelector,
    healTestFile,
    resetHealingStats,
    getHealingStats,
    // Cache imports
    getDefaultCacheManager,
    CacheManager,
    // Multi-page imports
    getMultiPageManagerFromPage
} from "play-ai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

/**
 * Helper to get provider options from environment variables
 *
 * Set PLAY_AI_PROVIDER to: openai | anthropic | gemini | ollama
 * Set the corresponding API key environment variable
 */
function getProviderOptions() {
    const provider = process.env.PLAY_AI_PROVIDER;
    const debug = process.env.PLAY_AI_DEBUG === "true";

    const baseOptions = { debug };

    switch (provider) {
        case "anthropic":
            return {
                ...baseOptions,
                provider: "anthropic" as const,
                anthropicApiKey: process.env.ANTHROPIC_API_KEY
            };
        case "gemini":
            return {
                ...baseOptions,
                provider: "gemini" as const,
                geminiApiKey: process.env.GEMINI_API_KEY
            };
        case "ollama":
            return {
                ...baseOptions,
                provider: "ollama" as const,
                ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
                ollamaModel: process.env.OLLAMA_MODEL || "llama3.1"
            };
        case "openai":
        default:
            return {
                ...baseOptions,
                provider: "openai" as const,
                openaiApiKey: process.env.OPENAI_API_KEY
            };
    }
}

const options = getProviderOptions();

/**
 * Basic Tests - Single and chained commands
 */
test.describe("Play AI - Basic Examples", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("https://www.saucedemo.com/");
    });

    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test("Login with single commands", async ({ page }) => {
        // Execute each action separately
        await play(
            `Type "standard_user" in the Username field`,
            { page, test },
            options
        );

        await play(
            `Type "secret_sauce" in the Password field`,
            { page, test },
            options
        );

        await play(
            "Click the Login button",
            { page, test },
            options
        );

        // Extract and verify data
        const headerText = await play(
            "get the header logo label text",
            { page, test },
            options
        );

        expect(headerText).toBe("Swag Labs");
    });

    test("Login with chained commands", async ({ page }) => {
        // Execute multiple actions in a single call
        await play(
            [
                `Type "standard_user" in the Username field`,
                `Type "secret_sauce" in the Password field`,
                `Click the Login button`
            ],
            { page, test },
            options
        );

        const headerText = await play(
            "get the header logo label text",
            { page, test },
            options
        );

        expect(headerText).toBe("Swag Labs");
    });

    test("Extract inventory data", async ({ page }) => {
        // Login first
        await play(
            [
                `Type "standard_user" in the Username field`,
                `Type "secret_sauce" in the Password field`,
                `Click the Login button`
            ],
            { page, test },
            options
        );

        // Extract first item name
        const firstItem = await play(
            "get the first inventory item name from inventory list",
            { page, test },
            options
        );

        expect(firstItem).toBe("Sauce Labs Backpack");
    });
});

/**
 * Provider-Specific Examples
 * These tests demonstrate how to configure different AI providers
 */
test.describe("Play AI - Provider Configuration Examples", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("https://www.saucedemo.com/");
    });

    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test("OpenAI provider example", async ({ page }) => {
        const openaiOptions = {
            provider: "openai" as const,
            model: "gpt-4o",
            openaiApiKey: process.env.OPENAI_API_KEY,
            debug: true
        };

        // Skip if no API key
        test.skip(!process.env.OPENAI_API_KEY, "OPENAI_API_KEY not set");

        await play(
            `Type "standard_user" in the Username field`,
            { page, test },
            openaiOptions
        );

        await play(
            `Type "secret_sauce" in the Password field`,
            { page, test },
            openaiOptions
        );

        await play("Click the Login button", { page, test }, openaiOptions);

        const headerText = await play(
            "get the header logo label text",
            { page, test },
            openaiOptions
        );

        expect(headerText).toBe("Swag Labs");
    });

    test("Anthropic Claude provider example", async ({ page }) => {
        const anthropicOptions = {
            provider: "anthropic" as const,
            model: "claude-sonnet-4-20250514",
            anthropicApiKey: process.env.ANTHROPIC_API_KEY,
            debug: true
        };

        // Skip if no API key
        test.skip(!process.env.ANTHROPIC_API_KEY, "ANTHROPIC_API_KEY not set");

        await play(
            [
                `Type "standard_user" in the Username field`,
                `Type "secret_sauce" in the Password field`,
                `Click the Login button`
            ],
            { page, test },
            anthropicOptions
        );

        const headerText = await play(
            "get the header logo label text",
            { page, test },
            anthropicOptions
        );

        expect(headerText).toBe("Swag Labs");
    });

    test("Google Gemini provider example", async ({ page }) => {
        const geminiOptions = {
            provider: "gemini" as const,
            model: "gemini-1.5-pro",
            geminiApiKey: process.env.GEMINI_API_KEY,
            debug: true
        };

        // Skip if no API key
        test.skip(!process.env.GEMINI_API_KEY, "GEMINI_API_KEY not set");

        await play(
            [
                `Type "standard_user" in the Username field`,
                `Type "secret_sauce" in the Password field`,
                `Click the Login button`
            ],
            { page, test },
            geminiOptions
        );

        const headerText = await play(
            "get the header logo label text",
            { page, test },
            geminiOptions
        );

        expect(headerText).toBe("Swag Labs");
    });

    test("Ollama local provider example", async ({ page }) => {
        const ollamaOptions = {
            provider: "ollama" as const,
            model: "llama3.1",
            ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
            debug: true
        };

        // Skip if Ollama not available
        test.skip(!process.env.OLLAMA_BASE_URL, "OLLAMA_BASE_URL not set");

        await play(
            [
                `Type "standard_user" in the Username field`,
                `Type "secret_sauce" in the Password field`,
                `Click the Login button`
            ],
            { page, test },
            ollamaOptions
        );

        const headerText = await play(
            "get the header logo label text",
            { page, test },
            ollamaOptions
        );

        expect(headerText).toBe("Swag Labs");
    });
});

/**
 * Snapshot Strategy Examples
 * These tests demonstrate different DOM snapshot strategies
 */
test.describe("Play AI - Snapshot Strategy Examples", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("https://www.saucedemo.com/");
    });

    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test("Full page snapshot (default)", async ({ page }) => {
        // Full page captures entire HTML - best for simple pages
        const fullOptions = {
            ...options,
            snapshotStrategy: "full" as const
        };

        await play(
            [
                `Type "standard_user" in the Username field`,
                `Type "secret_sauce" in the Password field`,
                `Click the Login button`
            ],
            { page, test },
            fullOptions
        );

        const headerText = await play(
            "get the header logo label text",
            { page, test },
            fullOptions
        );

        expect(headerText).toBe("Swag Labs");
    });

    test("Targeted snapshot (reduced tokens)", async ({ page }) => {
        // Targeted extracts only relevant DOM containers
        // Useful for large pages to reduce token usage
        const targetedOptions = {
            ...options,
            snapshotStrategy: "targeted" as const,
            domExtractorConfig: {
                maxContainerLength: 5000,
                preferSmallestContainer: true
            }
        };

        await play(
            [
                `Type "standard_user" in the Username field`,
                `Type "secret_sauce" in the Password field`,
                `Click the Login button`
            ],
            { page, test },
            targetedOptions
        );

        const headerText = await play(
            "get the header logo label text",
            { page, test },
            targetedOptions
        );

        expect(headerText).toBe("Swag Labs");
    });

    test("Auto snapshot (smart selection)", async ({ page }) => {
        // Auto chooses strategy based on page size
        // Uses targeted for large pages, full for small pages
        const autoOptions = {
            ...options,
            snapshotStrategy: "auto" as const
        };

        await play(
            [
                `Type "standard_user" in the Username field`,
                `Type "secret_sauce" in the Password field`,
                `Click the Login button`
            ],
            { page, test },
            autoOptions
        );

        const headerText = await play(
            "get the header logo label text",
            { page, test },
            autoOptions
        );

        expect(headerText).toBe("Swag Labs");
    });
});

/**
 * Parallel Execution Examples
 * These tests demonstrate parallel task execution for improved performance
 */
test.describe("Play AI - Parallel Execution Examples", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("https://www.saucedemo.com/");
        // Login first to access inventory page
        await play(
            [
                `Type "standard_user" in the Username field`,
                `Type "secret_sauce" in the Password field`,
                `Click the Login button`
            ],
            { page, test },
            options
        );
    });

    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test("Extract multiple data points in parallel", async ({ page }) => {
        // Use playParallel to extract multiple pieces of data concurrently
        // This is faster than sequential play() calls for independent queries
        const results = await playParallel(
            [
                "get the header logo label text",
                "get the first inventory item name from inventory list",
                "get the shopping cart badge count or return empty if not visible"
            ],
            { page, test },
            options
        );

        // Verify all tasks completed
        expect(results).toHaveLength(3);

        // Check results
        expect(results[0].success).toBe(true);
        expect(results[0].result).toBe("Swag Labs");

        expect(results[1].success).toBe(true);
        expect(results[1].result).toBe("Sauce Labs Backpack");

        // Cart result
        expect(results[2].success).toBe(true);
    });

    test("Parallel execution with concurrency limit", async ({ page }) => {
        // Use playParallelWithLimit to control max concurrent tasks
        // Useful when you want to limit API calls or resource usage
        const results = await playParallelWithLimit(
            [
                "get the header logo label text",
                "get the first inventory item name",
                "get the second inventory item name",
                "get the third inventory item name"
            ],
            { page, test },
            {
                ...options,
                concurrency: 2 // Max 2 tasks running at once
            }
        );

        // Verify all tasks completed in order
        expect(results).toHaveLength(4);
        expect(results[0].index).toBe(0);
        expect(results[1].index).toBe(1);
        expect(results[2].index).toBe(2);
        expect(results[3].index).toBe(3);
    });

    test("Parallel execution with error handling", async ({ page }) => {
        // Parallel execution handles errors gracefully
        // Failed tasks don't stop other tasks from completing
        const results = await playParallel(
            [
                "get the header logo label text",
                "get the nonexistent-element text", // This will likely fail
                "get the first inventory item name"
            ],
            { page, test },
            options
        );

        // All tasks should complete
        expect(results).toHaveLength(3);

        // First and third should succeed
        expect(results[0].success).toBe(true);
        expect(results[2].success).toBe(true);

        // Second might fail but shouldn't crash the test
        console.log("Second task result:", results[1]);
    });
});

/**
 * Code Generation Examples
 * These tests demonstrate how to generate standalone Playwright tests
 * that can run without play-ai or AI API calls after the first run
 */
test.describe("Play AI - Code Generation Examples", () => {
    const outputDir = "./generated";

    test.beforeAll(() => {
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
    });

    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test("Generate login test from natural language", async ({ page }) => {
        // Start code generation - this begins collecting all actions
        startCodeGeneration("https://www.saucedemo.com/", "Login flow");

        // Verify code generation is active
        expect(isCodeGenerationActive()).toBe(true);

        await page.goto("https://www.saucedemo.com/");

        // Run tests with generateCode: true to collect actions
        const codeGenOptions = { ...options, generateCode: true };

        await play(
            `Type "standard_user" in the Username field`,
            { page, test },
            codeGenOptions
        );

        await play(
            `Type "secret_sauce" in the Password field`,
            { page, test },
            codeGenOptions
        );

        await play("Click the Login button", { page, test }, codeGenOptions);

        // Verify login worked
        const headerText = await play(
            "get the header logo label text",
            { page, test },
            codeGenOptions
        );

        expect(headerText).toBe("Swag Labs");

        // Check that actions were collected
        const actionCount = getCollectedActionsCount();
        expect(actionCount).toBeGreaterThan(0);
        console.log(`\nCollected ${actionCount} actions for code generation`);

        // Export to a standalone Playwright test file
        const outputFile = path.join(outputDir, "login.spec.ts");
        const result = exportGeneratedCode(outputFile, {
            testName: "Login with valid credentials",
            testDescribe: "Authentication Tests",
            includeComments: true
        });

        expect(result).not.toBeNull();
        expect(fs.existsSync(outputFile)).toBe(true);

        console.log(`\n✅ Generated standalone test: ${outputFile}`);
        console.log("Run it without play-ai: npx playwright test generated/login.spec.ts");
    });

    test("Generate inventory browsing test", async ({ page }) => {
        // Start a new code generation session
        startCodeGeneration("https://www.saucedemo.com/", "Browse inventory");

        await page.goto("https://www.saucedemo.com/");

        const codeGenOptions = { ...options, generateCode: true };

        // Login first using chained commands
        await play(
            [
                `Type "standard_user" in the Username field`,
                `Type "secret_sauce" in the Password field`,
                `Click the Login button`
            ],
            { page, test },
            codeGenOptions
        );

        // Browse inventory
        const firstItem = await play(
            "get the first inventory item name from inventory list",
            { page, test },
            codeGenOptions
        );

        expect(firstItem).toBe("Sauce Labs Backpack");

        // Export generated test
        const outputFile = path.join(outputDir, "inventory.spec.ts");
        const result = exportGeneratedCode(outputFile, {
            testName: "Browse inventory items",
            testDescribe: "Inventory Tests"
        });

        expect(result).not.toBeNull();
        console.log(`\n✅ Generated: ${outputFile}`);
    });

    test("Generate add to cart test", async ({ page }) => {
        startCodeGeneration("https://www.saucedemo.com/", "Add to cart flow");

        await page.goto("https://www.saucedemo.com/");

        const codeGenOptions = { ...options, generateCode: true };

        // Login
        await play(
            [
                `Type "standard_user" in the Username field`,
                `Type "secret_sauce" in the Password field`,
                `Click the Login button`
            ],
            { page, test },
            codeGenOptions
        );

        // Add first item to cart
        await play(
            "Click the Add to cart button for the first inventory item",
            { page, test },
            codeGenOptions
        );

        // Verify cart badge shows 1
        const cartBadge = await play(
            "get the shopping cart badge text",
            { page, test },
            codeGenOptions
        );

        expect(cartBadge).toBe("1");

        // Export
        const outputFile = path.join(outputDir, "add-to-cart.spec.ts");
        exportGeneratedCode(outputFile, {
            testName: "Add item to cart",
            testDescribe: "Shopping Cart Tests"
        });

        console.log(`\n✅ Generated: ${outputFile}`);
    });
});

/**
 * Auto-Healing Examples
 * These tests demonstrate how to use auto-healing to automatically fix broken selectors
 */
test.describe("Play AI - Auto-Healing Examples", () => {
    test.afterEach(async ({ page }) => {
        await page.close();
        resetHealingStats();
    });

    test("Verify selector works on page", async ({ page }) => {
        await page.goto("https://www.saucedemo.com/");

        // Use verifySelector to check if a selector exists
        const usernameExists = await verifySelector(page, '[data-test="username"]');
        const passwordExists = await verifySelector(page, '[data-test="password"]');
        const loginBtnExists = await verifySelector(page, '[data-test="login-button"]');

        expect(usernameExists).toBe(true);
        expect(passwordExists).toBe(true);
        expect(loginBtnExists).toBe(true);

        console.log("\n✅ All selectors verified successfully");
    });

    test("Heal a broken selector using AI", async ({ page }) => {
        // Skip if no API key configured
        const hasApiKey = process.env.OPENAI_API_KEY ||
            process.env.ANTHROPIC_API_KEY ||
            process.env.GEMINI_API_KEY ||
            process.env.OLLAMA_BASE_URL;

        test.skip(!hasApiKey, "No AI provider API key configured");

        await page.goto("https://www.saucedemo.com/");

        // Simulate a broken selector and heal it
        const brokenSelector = "#non-existent-username-field";

        // Verify the broken selector doesn't work
        const isBroken = !(await verifySelector(page, brokenSelector));
        expect(isBroken).toBe(true);
        console.log(`\n❌ Broken selector: ${brokenSelector}`);

        // Use healSelector to find the correct selector
        const healResult = await healSelector(page, {
            selector: brokenSelector,
            action: "fill",
            taskDescription: "Type username in the Username field"
        }, {
            debug: true,
            provider: options.provider,
            openaiApiKey: process.env.OPENAI_API_KEY,
            anthropicApiKey: process.env.ANTHROPIC_API_KEY,
            geminiApiKey: process.env.GEMINI_API_KEY,
            ollamaBaseUrl: process.env.OLLAMA_BASE_URL
        });

        if (healResult.success) {
            console.log(`✅ Healed selector: ${healResult.healedSelector}`);

            // Verify the healed selector works
            const healedWorks = await verifySelector(page, healResult.healedSelector!);
            expect(healedWorks).toBe(true);
        } else {
            console.log(`⚠️ Healing failed: ${healResult.error}`);
        }
    });

    test("Use healing page wrapper for automatic healing", async ({ page }) => {
        // Skip if healing not enabled
        test.skip(
            process.env.PLAY_AI_HEALING !== "true",
            "Set PLAY_AI_HEALING=true to run this test"
        );

        await page.goto("https://www.saucedemo.com/");

        // Create a healing-enabled page wrapper
        // When PLAY_AI_HEALING=true, this wrapper will auto-heal failed selectors
        const healingPage = createHealingPage(page);

        // These actions will auto-heal if selectors fail
        await healingPage.locator('[data-test="username"]').fill("standard_user");
        await healingPage.locator('[data-test="password"]').fill("secret_sauce");
        await healingPage.locator('[data-test="login-button"]').click();

        // Check healing stats
        const stats = getHealingStats();
        console.log(`\nHealing stats:`);
        console.log(`  Total attempts: ${stats.totalAttempts}`);
        console.log(`  Successful heals: ${stats.successfulHeals}`);
        console.log(`  Failed heals: ${stats.failedHeals}`);
    });

    test("Demonstrate healing workflow", async ({ page }) => {
        await page.goto("https://www.saucedemo.com/");

        console.log("\n=== Auto-Healing Workflow Demo ===\n");

        // Step 1: Show working selectors
        console.log("Step 1: Verify current selectors work");
        const selectors = [
            '[data-test="username"]',
            '[data-test="password"]',
            '[data-test="login-button"]'
        ];

        for (const selector of selectors) {
            const works = await verifySelector(page, selector);
            console.log(`  ${works ? "✅" : "❌"} ${selector}`);
        }

        // Step 2: Show what happens with broken selectors
        console.log("\nStep 2: When selectors break (e.g., after UI update)");
        console.log("  - Without healing: Test fails, manual fix needed");
        console.log("  - With healing: AI finds new selector, test passes");

        // Step 3: Show healing modes
        console.log("\nStep 3: Two ways to use auto-healing:");
        console.log("\n  Option A: Environment variable (automatic)");
        console.log("    PLAY_AI_HEALING=true npx playwright test");
        console.log("\n  Option B: CLI command (manual)");
        console.log("    npx play-ai heal ./generated/login.spec.ts");

        // Step 4: Show benefits
        console.log("\nStep 4: Benefits");
        console.log("  ✓ Reduced test maintenance");
        console.log("  ✓ Self-healing CI/CD pipelines");
        console.log("  ✓ Less time debugging broken tests");
        console.log("  ✓ Automatic test file updates");

        console.log("\n=================================\n");
    });
});

/**
 * Response Caching Examples
 * These tests demonstrate how to use caching to reduce API costs
 */
test.describe("Play AI - Response Caching Examples", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("https://www.saucedemo.com/");
    });

    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test("Basic caching - automatic (enabled by default)", async ({ page }) => {
        console.log("\n=== Response Caching Demo ===\n");

        // Caching is enabled by default
        // First run: Makes API call and caches result
        // Subsequent runs: Returns cached result (no API call)

        console.log("First run - will make API call and cache result:");
        const result1 = await play(
            "get the login page title or header text",
            { page, test },
            { ...options, debug: true }
        );

        console.log(`Result: ${result1}`);

        // Second run with same task + DOM = cache hit
        console.log("\nSecond run - should use cached result:");
        const result2 = await play(
            "get the login page title or header text",
            { page, test },
            { ...options, debug: true }
        );

        console.log(`Result: ${result2}`);

        // Results should match
        expect(result1).toBe(result2);

        console.log("\n✅ Caching reduces API calls and costs!");
    });

    test("Explicit cache configuration", async ({ page }) => {
        // Configure caching options per-call
        const cacheOptions = {
            ...options,
            cache: true,                      // Enable caching (default: true)
            cacheTTL: 3600,                   // 1 hour TTL (default: 24 hours)
            cacheStrategy: "aggressive" as const, // Cache everything
            debug: true
        };

        const result = await play(
            `Type "standard_user" in the Username field`,
            { page, test },
            cacheOptions
        );

        console.log("\n✅ Cached with custom TTL and strategy");
    });

    test("Cache strategies comparison", async ({ page }) => {
        console.log("\n=== Cache Strategies ===\n");

        // Strategy 1: Aggressive (default)
        // Caches everything, longer TTL
        console.log("1. AGGRESSIVE (default):");
        console.log("   - Caches all responses");
        console.log("   - Best for stable pages");
        console.log("   - Maximum cost savings");

        await play(
            "get the login button text",
            { page, test },
            { ...options, cacheStrategy: "aggressive" as const }
        );

        // Strategy 2: Conservative
        // Only caches exact DOM matches
        console.log("\n2. CONSERVATIVE:");
        console.log("   - Caches only exact DOM matches");
        console.log("   - Invalidates on any DOM change");
        console.log("   - Best for dynamic pages");

        await play(
            "get the username input placeholder",
            { page, test },
            { ...options, cacheStrategy: "conservative" as const }
        );

        // Strategy 3: Off
        // Disables caching
        console.log("\n3. OFF:");
        console.log("   - No caching");
        console.log("   - Always makes API calls");
        console.log("   - Use for debugging");

        await play(
            "get the password input type",
            { page, test },
            { ...options, cacheStrategy: "off" as const }
        );

        console.log("\n✅ Choose strategy based on page stability");
    });

    test("Disable caching for specific calls", async ({ page }) => {
        // Sometimes you want fresh results (e.g., testing dynamic content)
        const noCacheOptions = {
            ...options,
            cache: false,  // Disable caching for this call
            debug: true
        };

        const result = await play(
            "get the current page URL",
            { page, test },
            noCacheOptions
        );

        console.log(`\nFresh result (no cache): ${result}`);
        console.log("\n✅ Use cache: false for dynamic content");
    });

    test("View cache statistics programmatically", async ({ page }) => {
        // Get cache manager instance
        const cacheManager = getDefaultCacheManager();

        // Get statistics
        const stats = await cacheManager.getStats();

        console.log("\n=== Cache Statistics ===");
        console.log(`Total entries:    ${stats.totalEntries}`);
        console.log(`Total size:       ${(stats.totalSizeBytes / 1024).toFixed(2)} KB`);
        console.log(`Cache hits:       ${stats.hits}`);
        console.log(`Cache misses:     ${stats.misses}`);
        console.log(`Hit rate:         ${stats.hitRate.toFixed(1)}%`);
        console.log(`Est. savings:     $${stats.estimatedSavings.toFixed(2)}`);
        console.log("========================\n");

        // Make a cached call to demonstrate
        await play(
            "get the login form action",
            { page, test },
            options
        );

        // Check stats again
        const newStats = await cacheManager.getStats();
        console.log(`Stats after call: ${newStats.totalEntries} entries, ${newStats.hits + newStats.misses} total operations`);
    });

    test("Cache with parallel execution", async ({ page }) => {
        // Login first
        await play(
            [
                `Type "standard_user" in the Username field`,
                `Type "secret_sauce" in the Password field`,
                `Click the Login button`
            ],
            { page, test },
            options
        );

        console.log("\n=== Parallel Execution with Caching ===\n");

        // First parallel run - may make multiple API calls
        console.log("First parallel run:");
        const results1 = await playParallel(
            [
                "get the header logo text",
                "get the first inventory item name",
                "get the shopping cart link text"
            ],
            { page, test },
            options
        );

        console.log(`  Results: ${results1.map(r => r.result).join(", ")}`);

        // Second parallel run - should use cache
        console.log("\nSecond parallel run (cached):");
        const results2 = await playParallel(
            [
                "get the header logo text",
                "get the first inventory item name",
                "get the shopping cart link text"
            ],
            { page, test },
            options
        );

        console.log(`  Results: ${results2.map(r => r.result).join(", ")}`);

        console.log("\n✅ Caching works with parallel execution!");
    });

    test("Demonstrate cache benefits", async ({ page }) => {
        console.log("\n=== Cache Benefits Summary ===\n");

        console.log("WITHOUT CACHING:");
        console.log("  ❌ Every test run calls AI API");
        console.log("  ❌ $0.01-0.05 per task");
        console.log("  ❌ 1-3 seconds per task");
        console.log("  ❌ Rate limit concerns");

        console.log("\nWITH CACHING:");
        console.log("  ✅ First run only calls API");
        console.log("  ✅ Subsequent runs: FREE");
        console.log("  ✅ <50ms per cached task");
        console.log("  ✅ No rate limit issues");

        console.log("\nCACHE CLI COMMANDS:");
        console.log("  npx play-ai cache stats       # View statistics");
        console.log("  npx play-ai cache clear --all # Clear all cache");
        console.log("  npx play-ai cache cleanup     # Remove expired");

        console.log("\nENVIRONMENT VARIABLES:");
        console.log("  PLAY_AI_CACHE=true            # Enable (default)");
        console.log("  PLAY_AI_CACHE_TTL=86400       # TTL in seconds");
        console.log("  PLAY_AI_CACHE_STRATEGY=aggressive");

        console.log("\n================================\n");

        // Actually run a cached operation
        await play(
            "Click the Login button",
            { page, test },
            options
        );
    });
});

/**
 * Multi-Tab / Multi-Page Examples
 * These tests demonstrate how to work with multiple browser tabs/pages
 */
test.describe("Play AI - Multi-Tab / Multi-Page Examples", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("https://www.saucedemo.com/");
    });

    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test("Get current page information", async ({ page }) => {
        console.log("\n=== Page Information ===\n");

        // Get current page URL
        const url = await play(
            "get the current page URL",
            { page, test },
            options
        );
        console.log(`Current URL: ${url}`);

        // Get current page title
        const title = await play(
            "get the current page title",
            { page, test },
            options
        );
        console.log(`Current Title: ${title}`);

        expect(url).toContain("saucedemo.com");
    });

    test("Get page count and all pages info", async ({ page }) => {
        console.log("\n=== Multi-Page Information ===\n");

        // Get number of open pages
        const countResult = await play(
            "get the number of open pages",
            { page, test },
            options
        );
        console.log(`Page count: ${countResult}`);

        // Get info about all pages
        const pagesResult = await play(
            "get information about all open pages",
            { page, test },
            options
        );
        console.log("All pages:", pagesResult);
    });

    test("Open new tab and switch between tabs", async ({ page }) => {
        console.log("\n=== Open New Tab Demo ===\n");

        // Open a new tab with a URL
        console.log("Opening new tab...");
        await play(
            "open a new tab and navigate to https://www.example.com",
            { page, test },
            options
        );

        // Get page count after opening new tab
        const manager = getMultiPageManagerFromPage(page);
        await manager.initialize();
        const pages = await manager.getAllPages();
        console.log(`Pages after opening new tab: ${pages.length}`);

        // Switch to the new tab by index
        console.log("Switching to new tab (index 1)...");
        await play(
            "switch to the page at index 1",
            { page, test },
            options
        );

        // Switch back to original tab
        console.log("Switching back to original tab (index 0)...");
        await play(
            "switch to the page at index 0",
            { page, test },
            options
        );

        console.log("\n✅ Successfully switched between tabs!");
    });

    test("Switch to page by URL pattern", async ({ page }) => {
        console.log("\n=== Switch by URL Demo ===\n");

        // Open multiple tabs
        const context = page.context();
        const newPage1 = await context.newPage();
        await newPage1.goto("https://www.example.com");

        const newPage2 = await context.newPage();
        await newPage2.goto("https://playwright.dev");

        // Get all pages
        const manager = getMultiPageManagerFromPage(page);
        await manager.initialize();
        const pages = await manager.getAllPages();
        console.log(`Total pages: ${pages.length}`);
        pages.forEach((p, i) => console.log(`  ${i}: ${p.url}`));

        // Switch to page by URL pattern
        console.log("\nSwitching to page containing 'playwright'...");
        await play(
            "switch to the page with URL containing playwright",
            { page, test },
            options
        );

        // Switch to page by URL pattern
        console.log("Switching to page containing 'example'...");
        await play(
            "switch to the page with URL containing example",
            { page, test },
            options
        );

        // Switch back to saucedemo
        console.log("Switching to page containing 'saucedemo'...");
        await play(
            "switch to the page with URL containing saucedemo",
            { page, test },
            options
        );

        console.log("\n✅ Successfully switched by URL pattern!");

        // Clean up
        await newPage1.close();
        await newPage2.close();
    });

    test("Close pages", async ({ page }) => {
        console.log("\n=== Close Pages Demo ===\n");

        // Open multiple tabs
        const context = page.context();
        const newPage1 = await context.newPage();
        await newPage1.goto("https://www.example.com");

        const newPage2 = await context.newPage();
        await newPage2.goto("https://playwright.dev");

        // Get initial page count
        let pageCount = context.pages().length;
        console.log(`Initial page count: ${pageCount}`);

        // Close page by index
        console.log("Closing page at index 2...");
        await play(
            "close the page at index 2",
            { page, test },
            options
        );

        pageCount = context.pages().length;
        console.log(`Page count after closing: ${pageCount}`);

        // Close another page
        console.log("Closing page at index 1...");
        await play(
            "close the page at index 1",
            { page, test },
            options
        );

        pageCount = context.pages().length;
        console.log(`Final page count: ${pageCount}`);

        console.log("\n✅ Successfully closed pages!");
    });

    test("Programmatic multi-page management", async ({ page }) => {
        console.log("\n=== Programmatic Multi-Page Management ===\n");

        // Get the multi-page manager
        const manager = getMultiPageManagerFromPage(page);
        await manager.initialize();

        // Get initial page count
        console.log(`Initial pages: ${manager.getPageCount()}`);

        // Open new pages using context
        const context = page.context();
        const newPage = await context.newPage();
        await newPage.goto("https://www.example.com");
        await newPage.waitForLoadState("domcontentloaded");

        // Re-initialize to pick up new page
        await manager.initialize();

        // Get all pages
        const pages = await manager.getAllPages();
        console.log(`\nAll pages (${pages.length}):`);
        for (const p of pages) {
            console.log(`  [${p.index}] ${p.title} - ${p.url} ${p.isActive ? "(active)" : ""}`);
        }

        // Switch to the new page
        const switchResult = await manager.switchToPage({ index: 1 });
        if (switchResult.success) {
            console.log(`\nSwitched to: ${switchResult.pageInfo?.title}`);
        }

        // Switch back
        await manager.switchToPage({ index: 0 });
        console.log("Switched back to original page");

        // Close other pages
        const closedCount = await manager.closeOtherPages();
        console.log(`Closed ${closedCount} other pages`);

        console.log(`\nFinal page count: ${manager.getPageCount()}`);
        console.log("\n✅ Programmatic management complete!");
    });

    test("Demonstrate multi-tab use cases", async ({ page }) => {
        console.log("\n=== Multi-Tab Use Cases ===\n");

        console.log("Common scenarios for multi-tab testing:\n");

        console.log("1. EXTERNAL LINKS");
        console.log("   - Click 'Terms of Service' link that opens in new tab");
        console.log("   - Verify content in new tab");
        console.log("   - Switch back to original page");

        console.log("\n2. OAUTH FLOWS");
        console.log("   - Click 'Login with Google' button");
        console.log("   - Handle OAuth popup window");
        console.log("   - Complete authentication");
        console.log("   - Return to original page");

        console.log("\n3. PRINT PREVIEWS");
        console.log("   - Click 'Print' button");
        console.log("   - Switch to print preview window");
        console.log("   - Verify print layout");
        console.log("   - Close preview");

        console.log("\n4. FILE OPERATIONS");
        console.log("   - Click download link");
        console.log("   - Handle file download dialog");

        console.log("\n5. MULTI-STEP WORKFLOWS");
        console.log("   - Open product in new tab");
        console.log("   - Compare products across tabs");
        console.log("   - Make decisions and complete checkout");

        console.log("\nNATURAL LANGUAGE COMMANDS:");
        console.log("  await play('Click the link that opens in new tab', { page, test });");
        console.log("  await play('Switch to the new tab', { page, test });");
        console.log("  await play('Switch to page containing checkout', { page, test });");
        console.log("  await play('Close the current tab', { page, test });");
        console.log("  await play('Get all open pages', { page, test });");

        console.log("\n================================\n");
    });
});

/**
 * File Upload / Download Examples
 * These tests demonstrate how to handle file uploads and downloads
 */
test.describe("Play AI - File Upload / Download Examples", () => {
    const testFilesDir = "./test-files";
    const downloadsDir = "./downloads";

    test.beforeAll(() => {
        // Create test files directory if it doesn't exist
        if (!fs.existsSync(testFilesDir)) {
            fs.mkdirSync(testFilesDir, { recursive: true });
        }
        // Create downloads directory if it doesn't exist
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }
        // Create a sample test file for upload demos
        const sampleFilePath = path.join(testFilesDir, "sample.txt");
        if (!fs.existsSync(sampleFilePath)) {
            fs.writeFileSync(sampleFilePath, "This is a sample test file for upload testing.");
        }
    });

    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test("Demonstrate file upload concepts", async ({ page }) => {
        console.log("\n=== File Upload Concepts ===\n");

        console.log("File upload with natural language:");
        console.log("  await play(\"Upload './test-files/document.pdf' to the file input\", { page, test });");
        console.log("");
        console.log("Multiple file upload:");
        console.log("  await play(\"Upload './images/photo1.jpg' and './images/photo2.jpg' to the file input\", { page, test });");
        console.log("");
        console.log("Clear file input:");
        console.log("  await play(\"Clear the file input\", { page, test });");

        console.log("\n=== Programmatic File Upload ===\n");

        // Navigate to a page (saucedemo doesn't have file upload, so we'll demonstrate the concept)
        await page.goto("https://www.saucedemo.com/");

        console.log("Programmatic upload example:");
        console.log("  await page.locator('input[type=\"file\"]').setInputFiles('./document.pdf');");
        console.log("");
        console.log("Multiple files:");
        console.log("  await page.locator('input[type=\"file\"]').setInputFiles(['./file1.pdf', './file2.pdf']);");
        console.log("");
        console.log("Clear files:");
        console.log("  await page.locator('input[type=\"file\"]').setInputFiles([]);");

        console.log("\n✅ File upload concepts demonstrated!");
    });

    test("Demonstrate file download concepts", async ({ page }) => {
        console.log("\n=== File Download Concepts ===\n");

        console.log("File download with natural language:");
        console.log("  const result = await play(\"Click the download button and save the file\", { page, test });");
        console.log("  console.log(result.path); // Path to downloaded file");
        console.log("");
        console.log("Download to specific location:");
        console.log("  await play(\"Click 'Export PDF' and save to './downloads/report.pdf'\", { page, test });");

        console.log("\n=== Programmatic File Download ===\n");

        await page.goto("https://www.saucedemo.com/");

        console.log("Wait for download event:");
        console.log("  const [download] = await Promise.all([");
        console.log("      page.waitForEvent('download'),");
        console.log("      page.click('#download-btn')");
        console.log("  ]);");
        console.log("");
        console.log("Save to specific path:");
        console.log("  await download.saveAs('./downloads/file.pdf');");
        console.log("");
        console.log("Get download info:");
        console.log("  const filename = download.suggestedFilename();");
        console.log("  const url = download.url();");
        console.log("  const path = await download.path();");

        console.log("\n✅ File download concepts demonstrated!");
    });

    test("File upload with Playwright API", async ({ page }) => {
        console.log("\n=== Playwright File Upload API ===\n");

        // Create a simple HTML page with file input for testing
        await page.setContent(`
            <html>
                <body>
                    <h1>File Upload Test</h1>
                    <input type="file" id="fileInput" />
                    <input type="file" id="multiFileInput" multiple />
                    <div id="result"></div>
                    <script>
                        document.getElementById('fileInput').addEventListener('change', (e) => {
                            document.getElementById('result').textContent =
                                'Single file: ' + e.target.files[0]?.name || 'No file';
                        });
                        document.getElementById('multiFileInput').addEventListener('change', (e) => {
                            const names = Array.from(e.target.files).map(f => f.name).join(', ');
                            document.getElementById('result').textContent =
                                'Multiple files: ' + names || 'No files';
                        });
                    </script>
                </body>
            </html>
        `);

        // Upload single file using Playwright API
        const sampleFile = path.join(testFilesDir, "sample.txt");
        if (fs.existsSync(sampleFile)) {
            console.log("Uploading single file...");
            await page.locator('#fileInput').setInputFiles(sampleFile);

            // Verify file was selected
            const resultText = await page.locator('#result').textContent();
            console.log(`Result: ${resultText}`);

            // Clear the input
            console.log("Clearing file input...");
            await page.locator('#fileInput').setInputFiles([]);
        }

        console.log("\n✅ File upload API demonstration complete!");
    });

    test("Demonstrate download handling patterns", async ({ page }) => {
        console.log("\n=== Download Handling Patterns ===\n");

        // Create a simple page with download functionality
        await page.setContent(`
            <html>
                <body>
                    <h1>Download Test</h1>
                    <a id="downloadLink" href="data:text/plain;charset=utf-8,Hello%20World" download="test.txt">
                        Download Text File
                    </a>
                    <button id="dynamicDownload" onclick="downloadFile()">Dynamic Download</button>
                    <script>
                        function downloadFile() {
                            const blob = new Blob(['Dynamic content'], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'dynamic.txt';
                            a.click();
                            URL.revokeObjectURL(url);
                        }
                    </script>
                </body>
            </html>
        `);

        console.log("Pattern 1: Download via link click");
        console.log("─".repeat(40));

        // Wait for download when clicking the link
        const [download1] = await Promise.all([
            page.waitForEvent('download'),
            page.click('#downloadLink')
        ]);

        console.log(`  Suggested filename: ${download1.suggestedFilename()}`);
        console.log(`  URL: ${download1.url().substring(0, 50)}...`);

        // Save the download
        const savePath1 = path.join(downloadsDir, download1.suggestedFilename());
        await download1.saveAs(savePath1);
        console.log(`  Saved to: ${savePath1}`);

        console.log("\nPattern 2: Download via button click");
        console.log("─".repeat(40));

        const [download2] = await Promise.all([
            page.waitForEvent('download'),
            page.click('#dynamicDownload')
        ]);

        console.log(`  Suggested filename: ${download2.suggestedFilename()}`);

        const savePath2 = path.join(downloadsDir, download2.suggestedFilename());
        await download2.saveAs(savePath2);
        console.log(`  Saved to: ${savePath2}`);

        console.log("\n✅ Download handling patterns demonstrated!");
    });

    test("File upload/download use cases summary", async ({ page }) => {
        console.log("\n=== File Upload/Download Use Cases ===\n");

        console.log("UPLOAD USE CASES:");
        console.log("─".repeat(40));
        console.log("  • Document upload (PDF, DOCX, etc.)");
        console.log("  • Image upload (profile pictures, attachments)");
        console.log("  • Bulk file upload (multiple files at once)");
        console.log("  • CSV/Excel data import");
        console.log("  • Form attachments");

        console.log("\nDOWNLOAD USE CASES:");
        console.log("─".repeat(40));
        console.log("  • Report export (PDF, Excel)");
        console.log("  • Data export (CSV, JSON)");
        console.log("  • Invoice/receipt download");
        console.log("  • File attachments from messages");
        console.log("  • Backup downloads");

        console.log("\nNATURAL LANGUAGE EXAMPLES:");
        console.log("─".repeat(40));
        console.log("  Upload:");
        console.log("    await play(\"Upload './resume.pdf' to the file input\", { page, test });");
        console.log("    await play(\"Upload multiple images to the gallery input\", { page, test });");
        console.log("");
        console.log("  Download:");
        console.log("    await play(\"Click 'Download Report' and save the file\", { page, test });");
        console.log("    await play(\"Export the data as CSV\", { page, test });");

        console.log("\nENVIRONMENT SETUP:");
        console.log("─".repeat(40));
        console.log("  • Create test-files/ directory for upload test files");
        console.log("  • Create downloads/ directory for downloaded files");
        console.log("  • Add both directories to .gitignore");

        console.log("\n================================\n");
    });
});

/**
 * Drag and Drop Examples
 * Demonstrates drag and drop, slider operations, and sortable list interactions
 */
test.describe("Play AI - Drag and Drop Examples", () => {
    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test("Basic drag and drop between elements", async ({ page }) => {
        console.log("\n=== Basic Drag and Drop ===\n");

        // Create a page with drag and drop elements
        await page.setContent(`
            <html>
                <head>
                    <style>
                        .container { display: flex; gap: 20px; padding: 20px; }
                        .box {
                            width: 200px;
                            height: 200px;
                            border: 2px dashed #ccc;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            flex-direction: column;
                        }
                        .draggable {
                            width: 80px;
                            height: 80px;
                            background: #4CAF50;
                            color: white;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: grab;
                            border-radius: 8px;
                        }
                        .drop-zone {
                            background: #f0f0f0;
                        }
                        .drop-zone.drag-over {
                            background: #e3f2fd;
                            border-color: #2196F3;
                        }
                    </style>
                </head>
                <body>
                    <h1>Drag and Drop Demo</h1>
                    <div class="container">
                        <div class="box" id="source">
                            <p>Source</p>
                            <div id="item" class="draggable" draggable="true">Drag me</div>
                        </div>
                        <div class="box drop-zone" id="target">
                            <p>Drop here</p>
                        </div>
                    </div>
                    <p id="status">Status: Waiting</p>
                    <script>
                        const item = document.getElementById('item');
                        const target = document.getElementById('target');
                        const status = document.getElementById('status');

                        item.addEventListener('dragstart', (e) => {
                            e.dataTransfer.setData('text/plain', e.target.id);
                            status.textContent = 'Status: Dragging...';
                        });

                        target.addEventListener('dragover', (e) => {
                            e.preventDefault();
                            target.classList.add('drag-over');
                        });

                        target.addEventListener('dragleave', () => {
                            target.classList.remove('drag-over');
                        });

                        target.addEventListener('drop', (e) => {
                            e.preventDefault();
                            const id = e.dataTransfer.getData('text/plain');
                            const draggedItem = document.getElementById(id);
                            target.appendChild(draggedItem);
                            target.classList.remove('drag-over');
                            status.textContent = 'Status: Dropped!';
                        });
                    </script>
                </body>
            </html>
        `);

        console.log("Initial state:");
        const initialParent = await page.locator('#item').evaluate(el => el.parentElement?.id);
        console.log(`  Item is in: ${initialParent}`);

        // Using Playwright's dragTo API
        console.log("\nPerforming drag and drop...");
        await page.locator('#item').dragTo(page.locator('#target'));

        // Verify the drop
        const finalParent = await page.locator('#item').evaluate(el => el.parentElement?.id);
        console.log(`  Item is now in: ${finalParent}`);

        const status = await page.locator('#status').textContent();
        console.log(`  Status: ${status}`);

        expect(finalParent).toBe('target');
        console.log("\n✅ Drag and drop completed successfully!");
    });

    test("Drag and drop using page.dragAndDrop", async ({ page }) => {
        console.log("\n=== Drag and Drop with CSS Selectors ===\n");

        // Create a Kanban-style board
        await page.setContent(`
            <html>
                <head>
                    <style>
                        .board { display: flex; gap: 20px; padding: 20px; }
                        .column {
                            width: 200px;
                            min-height: 300px;
                            background: #f5f5f5;
                            border-radius: 8px;
                            padding: 10px;
                        }
                        .column h3 { margin: 0 0 10px 0; text-align: center; }
                        .card {
                            background: white;
                            padding: 10px;
                            margin-bottom: 10px;
                            border-radius: 4px;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                            cursor: grab;
                        }
                        .column.drag-over { background: #e3f2fd; }
                    </style>
                </head>
                <body>
                    <h1>Kanban Board</h1>
                    <div class="board">
                        <div class="column" id="todo">
                            <h3>To Do</h3>
                            <div class="card" id="task1" draggable="true">Task 1: Design</div>
                            <div class="card" id="task2" draggable="true">Task 2: Develop</div>
                        </div>
                        <div class="column" id="inprogress">
                            <h3>In Progress</h3>
                        </div>
                        <div class="column" id="done">
                            <h3>Done</h3>
                        </div>
                    </div>
                    <script>
                        document.querySelectorAll('.card').forEach(card => {
                            card.addEventListener('dragstart', e => {
                                e.dataTransfer.setData('text/plain', e.target.id);
                            });
                        });

                        document.querySelectorAll('.column').forEach(column => {
                            column.addEventListener('dragover', e => {
                                e.preventDefault();
                                column.classList.add('drag-over');
                            });
                            column.addEventListener('dragleave', () => {
                                column.classList.remove('drag-over');
                            });
                            column.addEventListener('drop', e => {
                                e.preventDefault();
                                const id = e.dataTransfer.getData('text/plain');
                                column.appendChild(document.getElementById(id));
                                column.classList.remove('drag-over');
                            });
                        });
                    </script>
                </body>
            </html>
        `);

        console.log("Initial board state:");
        const todoCards = await page.locator('#todo .card').count();
        const inProgressCards = await page.locator('#inprogress .card').count();
        console.log(`  To Do: ${todoCards} cards`);
        console.log(`  In Progress: ${inProgressCards} cards`);

        // Use page.dragAndDrop with selectors
        console.log("\nMoving Task 1 to In Progress...");
        await page.dragAndDrop('#task1', '#inprogress');

        console.log("Moving Task 2 to Done...");
        await page.dragAndDrop('#task2', '#done');

        // Verify the moves
        const finalTodo = await page.locator('#todo .card').count();
        const finalInProgress = await page.locator('#inprogress .card').count();
        const finalDone = await page.locator('#done .card').count();

        console.log("\nFinal board state:");
        console.log(`  To Do: ${finalTodo} cards`);
        console.log(`  In Progress: ${finalInProgress} cards`);
        console.log(`  Done: ${finalDone} cards`);

        expect(finalTodo).toBe(0);
        expect(finalInProgress).toBe(1);
        expect(finalDone).toBe(1);

        console.log("\n✅ Kanban board drag and drop completed!");
    });

    test("Slider manipulation by percentage", async ({ page }) => {
        console.log("\n=== Slider Manipulation ===\n");

        // Create a page with sliders
        await page.setContent(`
            <html>
                <head>
                    <style>
                        .slider-container {
                            padding: 20px;
                            max-width: 400px;
                        }
                        .slider-group {
                            margin-bottom: 20px;
                        }
                        input[type="range"] {
                            width: 100%;
                            height: 20px;
                        }
                        .value-display {
                            font-weight: bold;
                            color: #2196F3;
                        }
                    </style>
                </head>
                <body>
                    <h1>Slider Controls</h1>
                    <div class="slider-container">
                        <div class="slider-group">
                            <label>Volume: <span id="volumeValue" class="value-display">50</span>%</label>
                            <input type="range" id="volume" min="0" max="100" value="50">
                        </div>
                        <div class="slider-group">
                            <label>Brightness: <span id="brightnessValue" class="value-display">75</span>%</label>
                            <input type="range" id="brightness" min="0" max="100" value="75">
                        </div>
                        <div class="slider-group">
                            <label>Price Range: $<span id="priceValue" class="value-display">500</span></label>
                            <input type="range" id="price" min="0" max="1000" value="500">
                        </div>
                    </div>
                    <script>
                        document.querySelectorAll('input[type="range"]').forEach(slider => {
                            slider.addEventListener('input', (e) => {
                                const valueSpan = document.getElementById(e.target.id + 'Value');
                                valueSpan.textContent = e.target.value;
                            });
                        });
                    </script>
                </body>
            </html>
        `);

        console.log("Initial slider values:");
        console.log(`  Volume: ${await page.locator('#volume').inputValue()}`);
        console.log(`  Brightness: ${await page.locator('#brightness').inputValue()}`);
        console.log(`  Price: ${await page.locator('#price').inputValue()}`);

        // Set slider values using the fill method (for range inputs)
        console.log("\nSetting Volume to 80%...");
        await page.locator('#volume').fill('80');

        console.log("Setting Brightness to 25%...");
        await page.locator('#brightness').fill('25');

        console.log("Setting Price to $750...");
        await page.locator('#price').fill('750');

        // Verify values
        console.log("\nFinal slider values:");
        const finalVolume = await page.locator('#volume').inputValue();
        const finalBrightness = await page.locator('#brightness').inputValue();
        const finalPrice = await page.locator('#price').inputValue();

        console.log(`  Volume: ${finalVolume}`);
        console.log(`  Brightness: ${finalBrightness}`);
        console.log(`  Price: ${finalPrice}`);

        expect(finalVolume).toBe('80');
        expect(finalBrightness).toBe('25');
        expect(finalPrice).toBe('750');

        console.log("\n✅ Slider manipulation completed!");
    });

    test("Drag element to specific position", async ({ page }) => {
        console.log("\n=== Position-Based Dragging ===\n");

        // Create a canvas-like drag area
        await page.setContent(`
            <html>
                <head>
                    <style>
                        .canvas {
                            width: 500px;
                            height: 400px;
                            background: #f0f0f0;
                            position: relative;
                            border: 2px solid #ccc;
                            margin: 20px;
                        }
                        .draggable-box {
                            width: 60px;
                            height: 60px;
                            background: #2196F3;
                            color: white;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            position: absolute;
                            cursor: move;
                            border-radius: 8px;
                            user-select: none;
                        }
                        #position { margin: 20px; font-family: monospace; }
                    </style>
                </head>
                <body>
                    <h1>Position-Based Drag</h1>
                    <div class="canvas" id="canvas">
                        <div class="draggable-box" id="box" style="left: 20px; top: 20px;">
                            Drag
                        </div>
                    </div>
                    <p id="position">Position: (20, 20)</p>
                    <script>
                        const box = document.getElementById('box');
                        const canvas = document.getElementById('canvas');
                        const posDisplay = document.getElementById('position');
                        let isDragging = false;
                        let startX, startY, startLeft, startTop;

                        box.addEventListener('mousedown', (e) => {
                            isDragging = true;
                            startX = e.clientX;
                            startY = e.clientY;
                            startLeft = parseInt(box.style.left);
                            startTop = parseInt(box.style.top);
                        });

                        document.addEventListener('mousemove', (e) => {
                            if (!isDragging) return;
                            const dx = e.clientX - startX;
                            const dy = e.clientY - startY;
                            const newLeft = Math.max(0, Math.min(440, startLeft + dx));
                            const newTop = Math.max(0, Math.min(340, startTop + dy));
                            box.style.left = newLeft + 'px';
                            box.style.top = newTop + 'px';
                            posDisplay.textContent = 'Position: (' + newLeft + ', ' + newTop + ')';
                        });

                        document.addEventListener('mouseup', () => {
                            isDragging = false;
                        });
                    </script>
                </body>
            </html>
        `);

        console.log("Initial position:");
        const initialLeft = await page.locator('#box').evaluate(el => parseInt(el.style.left));
        const initialTop = await page.locator('#box').evaluate(el => parseInt(el.style.top));
        console.log(`  Box at: (${initialLeft}, ${initialTop})`);

        // Get the bounding box for the element
        const box = await page.locator('#box').boundingBox();
        const canvas = await page.locator('#canvas').boundingBox();

        if (box && canvas) {
            // Calculate center of the box
            const startX = box.x + box.width / 2;
            const startY = box.y + box.height / 2;

            // Target position (center of canvas)
            const targetX = canvas.x + canvas.width / 2;
            const targetY = canvas.y + canvas.height / 2;

            console.log(`\nDragging from (${Math.round(startX)}, ${Math.round(startY)}) to (${Math.round(targetX)}, ${Math.round(targetY)})...`);

            // Perform the drag using mouse API
            await page.mouse.move(startX, startY);
            await page.mouse.down();
            await page.mouse.move(targetX, targetY, { steps: 10 });
            await page.mouse.up();

            // Check final position
            const finalLeft = await page.locator('#box').evaluate(el => parseInt(el.style.left));
            const finalTop = await page.locator('#box').evaluate(el => parseInt(el.style.top));
            console.log(`  Box now at: (${finalLeft}, ${finalTop})`);

            // Position should have changed significantly
            expect(Math.abs(finalLeft - initialLeft)).toBeGreaterThan(50);
        }

        console.log("\n✅ Position-based drag completed!");
    });

    test("Drag by offset (relative movement)", async ({ page }) => {
        console.log("\n=== Offset-Based Dragging ===\n");

        // Create a resizable panel
        await page.setContent(`
            <html>
                <head>
                    <style>
                        .panel-container {
                            display: flex;
                            width: 600px;
                            height: 300px;
                            margin: 20px;
                            border: 1px solid #ccc;
                        }
                        .panel {
                            height: 100%;
                            overflow: auto;
                            padding: 10px;
                        }
                        #leftPanel {
                            width: 200px;
                            background: #e3f2fd;
                        }
                        #rightPanel {
                            flex: 1;
                            background: #fff3e0;
                        }
                        .divider {
                            width: 10px;
                            background: #90a4ae;
                            cursor: col-resize;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .divider:hover { background: #607d8b; }
                        #widthDisplay { margin: 20px; font-family: monospace; }
                    </style>
                </head>
                <body>
                    <h1>Resizable Panels</h1>
                    <div class="panel-container">
                        <div class="panel" id="leftPanel">
                            <h3>Left Panel</h3>
                            <p>Drag the divider to resize</p>
                        </div>
                        <div class="divider" id="divider">⋮</div>
                        <div class="panel" id="rightPanel">
                            <h3>Right Panel</h3>
                            <p>Content here</p>
                        </div>
                    </div>
                    <p id="widthDisplay">Left panel width: 200px</p>
                    <script>
                        const divider = document.getElementById('divider');
                        const leftPanel = document.getElementById('leftPanel');
                        const display = document.getElementById('widthDisplay');
                        let isResizing = false;
                        let startX, startWidth;

                        divider.addEventListener('mousedown', (e) => {
                            isResizing = true;
                            startX = e.clientX;
                            startWidth = leftPanel.offsetWidth;
                        });

                        document.addEventListener('mousemove', (e) => {
                            if (!isResizing) return;
                            const dx = e.clientX - startX;
                            const newWidth = Math.max(100, Math.min(400, startWidth + dx));
                            leftPanel.style.width = newWidth + 'px';
                            display.textContent = 'Left panel width: ' + newWidth + 'px';
                        });

                        document.addEventListener('mouseup', () => {
                            isResizing = false;
                        });
                    </script>
                </body>
            </html>
        `);

        console.log("Initial state:");
        const initialWidth = await page.locator('#leftPanel').evaluate(el => el.offsetWidth);
        console.log(`  Left panel width: ${initialWidth}px`);

        // Get divider position
        const divider = await page.locator('#divider').boundingBox();

        if (divider) {
            const startX = divider.x + divider.width / 2;
            const startY = divider.y + divider.height / 2;

            console.log("\nDragging divider 100px to the right...");

            // Drag by offset using mouse API
            await page.mouse.move(startX, startY);
            await page.mouse.down();
            await page.mouse.move(startX + 100, startY, { steps: 10 });
            await page.mouse.up();

            const newWidth = await page.locator('#leftPanel').evaluate(el => el.offsetWidth);
            console.log(`  Left panel width: ${newWidth}px`);
            console.log(`  Width increased by: ${newWidth - initialWidth}px`);

            expect(newWidth).toBeGreaterThan(initialWidth);

            console.log("\nDragging divider 50px to the left...");

            // Get new divider position
            const newDivider = await page.locator('#divider').boundingBox();
            if (newDivider) {
                const newStartX = newDivider.x + newDivider.width / 2;
                await page.mouse.move(newStartX, startY);
                await page.mouse.down();
                await page.mouse.move(newStartX - 50, startY, { steps: 10 });
                await page.mouse.up();

                const finalWidth = await page.locator('#leftPanel').evaluate(el => el.offsetWidth);
                console.log(`  Left panel width: ${finalWidth}px`);
            }
        }

        console.log("\n✅ Offset-based drag completed!");
    });

    test("Sortable list drag and drop", async ({ page }) => {
        console.log("\n=== Sortable List ===\n");

        // Create a sortable list
        await page.setContent(`
            <html>
                <head>
                    <style>
                        .sortable-list {
                            list-style: none;
                            padding: 0;
                            max-width: 300px;
                            margin: 20px;
                        }
                        .sortable-item {
                            padding: 15px;
                            margin-bottom: 5px;
                            background: #fff;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            cursor: grab;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        }
                        .sortable-item:hover { background: #f5f5f5; }
                        .sortable-item.dragging {
                            opacity: 0.5;
                            background: #e3f2fd;
                        }
                        .drag-handle { color: #999; }
                        #orderDisplay {
                            margin: 20px;
                            padding: 10px;
                            background: #f5f5f5;
                            font-family: monospace;
                        }
                    </style>
                </head>
                <body>
                    <h1>Sortable List</h1>
                    <ul class="sortable-list" id="list">
                        <li class="sortable-item" data-id="1" draggable="true">
                            <span class="drag-handle">☰</span> Item 1 - First
                        </li>
                        <li class="sortable-item" data-id="2" draggable="true">
                            <span class="drag-handle">☰</span> Item 2 - Second
                        </li>
                        <li class="sortable-item" data-id="3" draggable="true">
                            <span class="drag-handle">☰</span> Item 3 - Third
                        </li>
                        <li class="sortable-item" data-id="4" draggable="true">
                            <span class="drag-handle">☰</span> Item 4 - Fourth
                        </li>
                    </ul>
                    <div id="orderDisplay">Order: 1, 2, 3, 4</div>
                    <script>
                        const list = document.getElementById('list');
                        const display = document.getElementById('orderDisplay');
                        let draggedItem = null;

                        list.addEventListener('dragstart', (e) => {
                            draggedItem = e.target.closest('.sortable-item');
                            draggedItem.classList.add('dragging');
                        });

                        list.addEventListener('dragend', () => {
                            draggedItem.classList.remove('dragging');
                            updateOrderDisplay();
                        });

                        list.addEventListener('dragover', (e) => {
                            e.preventDefault();
                            const afterElement = getDragAfterElement(list, e.clientY);
                            if (afterElement == null) {
                                list.appendChild(draggedItem);
                            } else {
                                list.insertBefore(draggedItem, afterElement);
                            }
                        });

                        function getDragAfterElement(container, y) {
                            const items = [...container.querySelectorAll('.sortable-item:not(.dragging)')];
                            return items.reduce((closest, child) => {
                                const box = child.getBoundingClientRect();
                                const offset = y - box.top - box.height / 2;
                                if (offset < 0 && offset > closest.offset) {
                                    return { offset: offset, element: child };
                                } else {
                                    return closest;
                                }
                            }, { offset: Number.NEGATIVE_INFINITY }).element;
                        }

                        function updateOrderDisplay() {
                            const items = [...list.querySelectorAll('.sortable-item')];
                            const order = items.map(item => item.dataset.id).join(', ');
                            display.textContent = 'Order: ' + order;
                        }
                    </script>
                </body>
            </html>
        `);

        console.log("Initial order:");
        const initialOrder = await page.locator('#orderDisplay').textContent();
        console.log(`  ${initialOrder}`);

        // Get the first and last items
        const items = page.locator('.sortable-item');
        const firstItem = items.nth(0);
        const lastItem = items.nth(3);

        // Drag first item to the end
        console.log("\nMoving Item 1 to the end...");
        await firstItem.dragTo(lastItem);

        // Wait a moment for the DOM to update
        await page.waitForTimeout(100);

        const newOrder = await page.locator('#orderDisplay').textContent();
        console.log(`  ${newOrder}`);

        // The order should have changed
        expect(newOrder).not.toBe(initialOrder);

        console.log("\n✅ Sortable list drag completed!");
    });

    test("Drag and drop use cases summary", async ({ page }) => {
        console.log("\n=== Drag and Drop Use Cases ===\n");

        console.log("SUPPORTED DRAG AND DROP OPERATIONS:");
        console.log("─".repeat(50));
        console.log("  • locator.dragTo - Drag one element to another");
        console.log("  • page.dragAndDrop - Drag using CSS selectors");
        console.log("  • locator.dragToPosition - Drag to x,y coordinates");
        console.log("  • locator.dragByOffset - Drag by relative offset");
        console.log("  • slider.setValueByPercentage - Set slider percentage");

        console.log("\nCOMMON USE CASES:");
        console.log("─".repeat(50));
        console.log("  • Kanban boards (move cards between columns)");
        console.log("  • Sortable lists (reorder items)");
        console.log("  • File managers (drag files to folders)");
        console.log("  • Shopping carts (drag products to cart)");
        console.log("  • Image editors (position elements)");
        console.log("  • Sliders/ranges (volume, price range, etc.)");
        console.log("  • Resizable panels (drag dividers)");
        console.log("  • Form builders (drag fields)");

        console.log("\nNATURAL LANGUAGE EXAMPLES:");
        console.log("─".repeat(50));
        console.log("  Element to element:");
        console.log("    await play(\"Drag 'Task 1' to the 'Done' column\", { page, test });");
        console.log("");
        console.log("  Slider operations:");
        console.log("    await play(\"Set the volume slider to 75%\", { page, test });");
        console.log("    await play(\"Drag the price range to $500\", { page, test });");
        console.log("");
        console.log("  Position-based:");
        console.log("    await play(\"Drag the element to position (300, 200)\", { page, test });");
        console.log("");
        console.log("  Offset-based:");
        console.log("    await play(\"Move the panel 100 pixels to the right\", { page, test });");

        console.log("\nPLAYWRIGHT API EXAMPLES:");
        console.log("─".repeat(50));
        console.log("  // Element to element");
        console.log("  await page.locator('#source').dragTo(page.locator('#target'));");
        console.log("");
        console.log("  // Selector-based");
        console.log("  await page.dragAndDrop('#source', '#target');");
        console.log("");
        console.log("  // Mouse API for custom positioning");
        console.log("  await page.mouse.move(startX, startY);");
        console.log("  await page.mouse.down();");
        console.log("  await page.mouse.move(endX, endY);");
        console.log("  await page.mouse.up();");

        console.log("\n================================\n");
    });
});

/**
 * iFrame Examples
 * Demonstrates interactions with content inside iframes
 */
test.describe("Play AI - iFrame Examples", () => {
    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test("Basic iframe interactions", async ({ page }) => {
        console.log("\n=== Basic iFrame Interactions ===\n");

        // Create a page with an iframe containing a form
        await page.setContent(`
            <html>
                <head>
                    <style>
                        .container { padding: 20px; }
                        iframe { border: 2px solid #ccc; border-radius: 8px; }
                        h1 { color: #333; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Payment Form (in iframe)</h1>
                        <iframe id="payment-frame" width="400" height="300" srcdoc="
                            <html>
                                <head>
                                    <style>
                                        body { font-family: Arial, sans-serif; padding: 20px; }
                                        .form-group { margin-bottom: 15px; }
                                        label { display: block; margin-bottom: 5px; font-weight: bold; }
                                        input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
                                        button { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
                                        button:hover { background: #45a049; }
                                        #result { margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 4px; display: none; }
                                    </style>
                                </head>
                                <body>
                                    <form id='paymentForm'>
                                        <div class='form-group'>
                                            <label for='cardNumber'>Card Number</label>
                                            <input type='text' id='cardNumber' placeholder='1234 5678 9012 3456'>
                                        </div>
                                        <div class='form-group'>
                                            <label for='expiry'>Expiry Date</label>
                                            <input type='text' id='expiry' placeholder='MM/YY'>
                                        </div>
                                        <div class='form-group'>
                                            <label for='cvv'>CVV</label>
                                            <input type='text' id='cvv' placeholder='123'>
                                        </div>
                                        <button type='button' id='submitBtn' onclick='submitForm()'>Pay Now</button>
                                        <div id='result'>Payment submitted successfully!</div>
                                    </form>
                                    <script>
                                        function submitForm() {
                                            document.getElementById('result').style.display = 'block';
                                        }
                                    </script>
                                </body>
                            </html>
                        "></iframe>
                    </div>
                </body>
            </html>
        `);

        console.log("Filling payment form inside iframe...");

        // Use frameLocator to interact with elements inside the iframe
        const frame = page.frameLocator('#payment-frame');

        // Fill the card number
        await frame.locator('#cardNumber').fill('4242424242424242');
        console.log("  ✓ Filled card number");

        // Fill expiry date
        await frame.locator('#expiry').fill('12/25');
        console.log("  ✓ Filled expiry date");

        // Fill CVV
        await frame.locator('#cvv').fill('123');
        console.log("  ✓ Filled CVV");

        // Click submit button
        await frame.locator('#submitBtn').click();
        console.log("  ✓ Clicked submit button");

        // Verify the result message is shown
        const resultVisible = await frame.locator('#result').isVisible();
        expect(resultVisible).toBe(true);
        console.log("  ✓ Payment form submitted successfully");

        // Get text from iframe
        const resultText = await frame.locator('#result').textContent();
        console.log(`  Result: ${resultText}`);

        console.log("\n✅ Basic iframe interactions completed!");
    });

    test("Multiple iframes on same page", async ({ page }) => {
        console.log("\n=== Multiple iFrames ===\n");

        // Create a page with multiple iframes
        await page.setContent(`
            <html>
                <head>
                    <style>
                        .container { padding: 20px; }
                        .iframe-wrapper { display: inline-block; margin: 10px; vertical-align: top; }
                        iframe { border: 2px solid #2196F3; border-radius: 8px; }
                        h2 { color: #2196F3; margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Multiple iFrames Demo</h1>
                        <div class="iframe-wrapper">
                            <h2>Frame 1: Counter</h2>
                            <iframe id="frame1" width="200" height="150" srcdoc="
                                <html>
                                    <body style='text-align: center; padding: 20px;'>
                                        <h3>Counter</h3>
                                        <p id='count'>0</p>
                                        <button id='increment' onclick='document.getElementById(&quot;count&quot;).textContent = parseInt(document.getElementById(&quot;count&quot;).textContent) + 1'>+1</button>
                                    </body>
                                </html>
                            "></iframe>
                        </div>
                        <div class="iframe-wrapper">
                            <h2>Frame 2: Input</h2>
                            <iframe id="frame2" width="200" height="150" srcdoc="
                                <html>
                                    <body style='padding: 20px;'>
                                        <h3>Input</h3>
                                        <input id='textInput' type='text' placeholder='Type here...'>
                                        <p id='echo'></p>
                                        <script>
                                            document.getElementById('textInput').addEventListener('input', function(e) {
                                                document.getElementById('echo').textContent = 'Echo: ' + e.target.value;
                                            });
                                        </script>
                                    </body>
                                </html>
                            "></iframe>
                        </div>
                        <div class="iframe-wrapper">
                            <h2>Frame 3: Toggle</h2>
                            <iframe id="frame3" width="200" height="150" srcdoc="
                                <html>
                                    <body style='text-align: center; padding: 20px;'>
                                        <h3>Toggle</h3>
                                        <label>
                                            <input type='checkbox' id='toggle'> Enable Feature
                                        </label>
                                        <p id='status'>Status: OFF</p>
                                        <script>
                                            document.getElementById('toggle').addEventListener('change', function(e) {
                                                document.getElementById('status').textContent = 'Status: ' + (e.target.checked ? 'ON' : 'OFF');
                                            });
                                        </script>
                                    </body>
                                </html>
                            "></iframe>
                        </div>
                    </div>
                </body>
            </html>
        `);

        // Interact with Frame 1 - Counter
        console.log("Frame 1 - Incrementing counter...");
        const frame1 = page.frameLocator('#frame1');
        await frame1.locator('#increment').click();
        await frame1.locator('#increment').click();
        await frame1.locator('#increment').click();
        const count = await frame1.locator('#count').textContent();
        console.log(`  Counter value: ${count}`);
        expect(count).toBe('3');

        // Interact with Frame 2 - Input
        console.log("\nFrame 2 - Filling input...");
        const frame2 = page.frameLocator('#frame2');
        await frame2.locator('#textInput').fill('Hello from test!');
        const echo = await frame2.locator('#echo').textContent();
        console.log(`  ${echo}`);
        expect(echo).toContain('Hello from test!');

        // Interact with Frame 3 - Toggle
        console.log("\nFrame 3 - Toggling checkbox...");
        const frame3 = page.frameLocator('#frame3');
        await frame3.locator('#toggle').check();
        const status = await frame3.locator('#status').textContent();
        console.log(`  ${status}`);
        expect(status).toContain('ON');

        console.log("\n✅ Multiple iframes interactions completed!");
    });

    test("Nested iframes", async ({ page }) => {
        console.log("\n=== Nested iFrames ===\n");

        // Create a page with nested iframes
        await page.setContent(`
            <html>
                <head>
                    <style>
                        body { padding: 20px; font-family: Arial, sans-serif; }
                        iframe { border: 2px solid #9C27B0; border-radius: 8px; }
                    </style>
                </head>
                <body>
                    <h1>Nested iFrames Demo</h1>
                    <p>Outer Page</p>
                    <iframe id="outer-frame" width="500" height="350" srcdoc="
                        <html>
                            <head>
                                <style>
                                    body { padding: 15px; background: #f3e5f5; }
                                    iframe { border: 2px solid #7B1FA2; border-radius: 4px; }
                                </style>
                            </head>
                            <body>
                                <h2>Middle Frame</h2>
                                <p id='middle-text'>This is the middle frame</p>
                                <iframe id='inner-frame' width='350' height='150' srcdoc='
                                    <html>
                                        <body style=&quot;padding: 10px; background: #e1bee7;&quot;>
                                            <h3>Inner Frame</h3>
                                            <button id=&quot;inner-btn&quot; onclick=&quot;document.getElementById(&apos;inner-result&apos;).textContent = &apos;Button clicked!&apos;&quot;>Click Me</button>
                                            <p id=&quot;inner-result&quot;>Not clicked yet</p>
                                        </body>
                                    </html>
                                '></iframe>
                            </body>
                        </html>
                    "></iframe>
                </body>
            </html>
        `);

        console.log("Accessing nested iframe structure...");

        // Access the outer frame
        const outerFrame = page.frameLocator('#outer-frame');
        const middleText = await outerFrame.locator('#middle-text').textContent();
        console.log(`  Middle frame text: ${middleText}`);

        // Access the inner frame (nested)
        const innerFrame = outerFrame.frameLocator('#inner-frame');

        // Click button in the innermost frame
        console.log("\nClicking button in inner frame...");
        await innerFrame.locator('#inner-btn').click();

        // Verify the result
        const innerResult = await innerFrame.locator('#inner-result').textContent();
        console.log(`  Inner frame result: ${innerResult}`);
        expect(innerResult).toBe('Button clicked!');

        console.log("\n✅ Nested iframes interaction completed!");
    });

    test("iFrame use cases summary", async ({ page }) => {
        console.log("\n=== iFrame Use Cases ===\n");

        console.log("SUPPORTED IFRAME OPERATIONS:");
        console.log("─".repeat(50));
        console.log("  • iframe_frameLocator - Get frame locator");
        console.log("  • iframe_clickInFrame - Click element in iframe");
        console.log("  • iframe_fillInFrame - Fill input in iframe");
        console.log("  • iframe_getTextInFrame - Get text from iframe");
        console.log("  • iframe_waitForElementInFrame - Wait for element");
        console.log("  • iframe_isElementVisibleInFrame - Check visibility");
        console.log("  • iframe_selectOptionInFrame - Select dropdown");
        console.log("  • iframe_checkInFrame - Check checkbox");
        console.log("  • iframe_nestedFrameLocator - Access nested iframes");

        console.log("\nCOMMON USE CASES:");
        console.log("─".repeat(50));
        console.log("  • Payment forms (Stripe, PayPal, Braintree)");
        console.log("  • CAPTCHA widgets (reCAPTCHA, hCaptcha)");
        console.log("  • Social embeds (YouTube, Twitter, Facebook)");
        console.log("  • Advertisement iframes");
        console.log("  • Third-party widgets (chat, calendars, maps)");
        console.log("  • Legacy application embeds");

        console.log("\nNATURAL LANGUAGE EXAMPLES:");
        console.log("─".repeat(50));
        console.log("  await play(\"Fill card number in the payment iframe\", { page, test });");
        console.log("  await play(\"Click submit in the checkout frame\", { page, test });");
        console.log("  await play(\"Get the confirmation message from iframe\", { page, test });");

        console.log("\nPLAYWRIGHT API EXAMPLES:");
        console.log("─".repeat(50));
        console.log("  // Access iframe by selector");
        console.log("  const frame = page.frameLocator('#payment-frame');");
        console.log("  await frame.locator('#card-number').fill('4242...');");
        console.log("");
        console.log("  // Nested iframes");
        console.log("  const inner = page.frameLocator('#outer').frameLocator('#inner');");
        console.log("  await inner.locator('button').click();");

        console.log("\n================================\n");
    });
});

/**
 * Shadow DOM Examples
 * Demonstrates interactions with web components using Shadow DOM
 */
test.describe("Play AI - Shadow DOM Examples", () => {
    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test("Basic shadow DOM interactions", async ({ page }) => {
        console.log("\n=== Basic Shadow DOM Interactions ===\n");

        // Create a page with a custom element using shadow DOM
        await page.setContent(`
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                    </style>
                </head>
                <body>
                    <h1>Shadow DOM Demo</h1>
                    <custom-button id="myButton"></custom-button>
                    <p id="result">Button not clicked</p>

                    <script>
                        class CustomButton extends HTMLElement {
                            constructor() {
                                super();
                                const shadow = this.attachShadow({ mode: 'open' });
                                shadow.innerHTML = \`
                                    <style>
                                        button {
                                            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
                                            color: white;
                                            border: none;
                                            padding: 15px 30px;
                                            font-size: 16px;
                                            border-radius: 8px;
                                            cursor: pointer;
                                            transition: transform 0.2s;
                                        }
                                        button:hover {
                                            transform: scale(1.05);
                                        }
                                        .counter {
                                            margin-top: 10px;
                                            font-size: 14px;
                                            color: #666;
                                        }
                                    </style>
                                    <button id="shadowBtn">Click Me!</button>
                                    <div class="counter">Clicks: <span id="clickCount">0</span></div>
                                \`;

                                let count = 0;
                                shadow.getElementById('shadowBtn').addEventListener('click', () => {
                                    count++;
                                    shadow.getElementById('clickCount').textContent = count;
                                    this.dispatchEvent(new CustomEvent('button-click', { detail: { count } }));
                                });
                            }
                        }
                        customElements.define('custom-button', CustomButton);

                        document.getElementById('myButton').addEventListener('button-click', (e) => {
                            document.getElementById('result').textContent = 'Button clicked ' + e.detail.count + ' time(s)';
                        });
                    </script>
                </body>
            </html>
        `);

        console.log("Interacting with shadow DOM element...");

        // Playwright automatically pierces shadow DOM!
        // We can use regular locators to find elements inside shadow roots
        const shadowButton = page.locator('custom-button').locator('button');

        // Click the button inside shadow DOM
        await shadowButton.click();
        console.log("  ✓ Clicked button inside shadow DOM");

        await shadowButton.click();
        await shadowButton.click();
        console.log("  ✓ Clicked 2 more times");

        // Get text from inside shadow DOM
        const clickCount = await page.locator('custom-button').locator('#clickCount').textContent();
        console.log(`  Click count inside shadow: ${clickCount}`);
        expect(clickCount).toBe('3');

        // Verify the result outside shadow DOM
        const result = await page.locator('#result').textContent();
        console.log(`  Result: ${result}`);
        expect(result).toContain('3 time(s)');

        console.log("\n✅ Basic shadow DOM interactions completed!");
    });

    test("Shadow DOM form components", async ({ page }) => {
        console.log("\n=== Shadow DOM Form Components ===\n");

        // Create custom form elements with shadow DOM
        await page.setContent(`
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .form-container { max-width: 400px; }
                        h1 { color: #333; }
                        #formResult { margin-top: 20px; padding: 15px; background: #e8f5e9; border-radius: 8px; display: none; }
                    </style>
                </head>
                <body>
                    <h1>Custom Form Components</h1>
                    <div class="form-container">
                        <custom-input id="nameInput" label="Full Name" placeholder="Enter your name"></custom-input>
                        <custom-input id="emailInput" label="Email" placeholder="Enter your email" type="email"></custom-input>
                        <custom-checkbox id="termsCheckbox" label="I agree to the terms"></custom-checkbox>
                        <br><br>
                        <button id="submitBtn" onclick="submitForm()">Submit</button>
                        <div id="formResult"></div>
                    </div>

                    <script>
                        class CustomInput extends HTMLElement {
                            constructor() {
                                super();
                                const shadow = this.attachShadow({ mode: 'open' });
                                const label = this.getAttribute('label') || 'Input';
                                const placeholder = this.getAttribute('placeholder') || '';
                                const type = this.getAttribute('type') || 'text';

                                shadow.innerHTML = \`
                                    <style>
                                        .input-wrapper { margin-bottom: 15px; }
                                        label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
                                        input {
                                            width: 100%;
                                            padding: 10px;
                                            border: 2px solid #ddd;
                                            border-radius: 6px;
                                            font-size: 14px;
                                            box-sizing: border-box;
                                            transition: border-color 0.3s;
                                        }
                                        input:focus {
                                            outline: none;
                                            border-color: #667eea;
                                        }
                                    </style>
                                    <div class="input-wrapper">
                                        <label>\${label}</label>
                                        <input type="\${type}" placeholder="\${placeholder}" id="input">
                                    </div>
                                \`;
                            }

                            get value() {
                                return this.shadowRoot.getElementById('input').value;
                            }
                        }

                        class CustomCheckbox extends HTMLElement {
                            constructor() {
                                super();
                                const shadow = this.attachShadow({ mode: 'open' });
                                const label = this.getAttribute('label') || 'Checkbox';

                                shadow.innerHTML = \`
                                    <style>
                                        .checkbox-wrapper {
                                            display: flex;
                                            align-items: center;
                                            gap: 10px;
                                            cursor: pointer;
                                        }
                                        input[type="checkbox"] {
                                            width: 20px;
                                            height: 20px;
                                            cursor: pointer;
                                        }
                                        label { cursor: pointer; color: #555; }
                                    </style>
                                    <div class="checkbox-wrapper">
                                        <input type="checkbox" id="checkbox">
                                        <label>\${label}</label>
                                    </div>
                                \`;
                            }

                            get checked() {
                                return this.shadowRoot.getElementById('checkbox').checked;
                            }
                        }

                        customElements.define('custom-input', CustomInput);
                        customElements.define('custom-checkbox', CustomCheckbox);

                        function submitForm() {
                            const name = document.getElementById('nameInput').value;
                            const email = document.getElementById('emailInput').value;
                            const agreed = document.getElementById('termsCheckbox').checked;

                            const result = document.getElementById('formResult');
                            result.style.display = 'block';
                            result.textContent = \`Submitted: \${name}, \${email}, Terms: \${agreed ? 'Yes' : 'No'}\`;
                        }
                    </script>
                </body>
            </html>
        `);

        console.log("Filling custom form components with shadow DOM...");

        // Fill custom input components (Playwright pierces shadow DOM)
        await page.locator('#nameInput').locator('input').fill('John Doe');
        console.log("  ✓ Filled name input");

        await page.locator('#emailInput').locator('input').fill('john@example.com');
        console.log("  ✓ Filled email input");

        // Check custom checkbox
        await page.locator('#termsCheckbox').locator('input[type="checkbox"]').check();
        console.log("  ✓ Checked terms checkbox");

        // Submit the form
        await page.locator('#submitBtn').click();
        console.log("  ✓ Submitted form");

        // Verify result
        const result = await page.locator('#formResult').textContent();
        console.log(`  Result: ${result}`);
        expect(result).toContain('John Doe');
        expect(result).toContain('john@example.com');
        expect(result).toContain('Terms: Yes');

        console.log("\n✅ Shadow DOM form components test completed!");
    });

    test("Using getByRole with shadow DOM", async ({ page }) => {
        console.log("\n=== getByRole with Shadow DOM ===\n");

        // Create elements with accessible roles inside shadow DOM
        await page.setContent(`
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                    </style>
                </head>
                <body>
                    <h1>Accessible Shadow DOM Components</h1>
                    <custom-dialog id="myDialog"></custom-dialog>
                    <p id="dialogResult">Dialog not opened</p>

                    <script>
                        class CustomDialog extends HTMLElement {
                            constructor() {
                                super();
                                const shadow = this.attachShadow({ mode: 'open' });
                                shadow.innerHTML = \`
                                    <style>
                                        .dialog-trigger { padding: 10px 20px; font-size: 16px; cursor: pointer; }
                                        .dialog {
                                            display: none;
                                            position: fixed;
                                            top: 50%;
                                            left: 50%;
                                            transform: translate(-50%, -50%);
                                            background: white;
                                            padding: 30px;
                                            border-radius: 12px;
                                            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                                            z-index: 1000;
                                        }
                                        .dialog.open { display: block; }
                                        .dialog h2 { margin-top: 0; }
                                        .dialog-buttons { margin-top: 20px; display: flex; gap: 10px; }
                                        .dialog-buttons button { padding: 10px 20px; cursor: pointer; border-radius: 6px; }
                                        .confirm { background: #4CAF50; color: white; border: none; }
                                        .cancel { background: #f5f5f5; border: 1px solid #ddd; }
                                        .overlay {
                                            display: none;
                                            position: fixed;
                                            top: 0;
                                            left: 0;
                                            right: 0;
                                            bottom: 0;
                                            background: rgba(0,0,0,0.5);
                                            z-index: 999;
                                        }
                                        .overlay.open { display: block; }
                                    </style>
                                    <button class="dialog-trigger" aria-label="Open Dialog">Open Dialog</button>
                                    <div class="overlay"></div>
                                    <div class="dialog" role="dialog" aria-labelledby="dialogTitle">
                                        <h2 id="dialogTitle">Confirm Action</h2>
                                        <p>Are you sure you want to proceed?</p>
                                        <div class="dialog-buttons">
                                            <button class="confirm" aria-label="Confirm">Confirm</button>
                                            <button class="cancel" aria-label="Cancel">Cancel</button>
                                        </div>
                                    </div>
                                \`;

                                const trigger = shadow.querySelector('.dialog-trigger');
                                const dialog = shadow.querySelector('.dialog');
                                const overlay = shadow.querySelector('.overlay');
                                const confirmBtn = shadow.querySelector('.confirm');
                                const cancelBtn = shadow.querySelector('.cancel');

                                trigger.addEventListener('click', () => {
                                    dialog.classList.add('open');
                                    overlay.classList.add('open');
                                });

                                confirmBtn.addEventListener('click', () => {
                                    dialog.classList.remove('open');
                                    overlay.classList.remove('open');
                                    this.dispatchEvent(new CustomEvent('dialog-confirm'));
                                });

                                cancelBtn.addEventListener('click', () => {
                                    dialog.classList.remove('open');
                                    overlay.classList.remove('open');
                                    this.dispatchEvent(new CustomEvent('dialog-cancel'));
                                });
                            }
                        }
                        customElements.define('custom-dialog', CustomDialog);

                        document.getElementById('myDialog').addEventListener('dialog-confirm', () => {
                            document.getElementById('dialogResult').textContent = 'Dialog confirmed!';
                        });
                        document.getElementById('myDialog').addEventListener('dialog-cancel', () => {
                            document.getElementById('dialogResult').textContent = 'Dialog cancelled!';
                        });
                    </script>
                </body>
            </html>
        `);

        console.log("Using getByRole to interact with shadow DOM...");

        // Use getByRole - it works across shadow boundaries!
        await page.getByRole('button', { name: 'Open Dialog' }).click();
        console.log("  ✓ Opened dialog using getByRole");

        // Wait for dialog to be visible
        await page.waitForTimeout(100);

        // Click confirm button using getByRole
        await page.getByRole('button', { name: 'Confirm' }).click();
        console.log("  ✓ Clicked confirm using getByRole");

        // Verify result
        const result = await page.locator('#dialogResult').textContent();
        console.log(`  Result: ${result}`);
        expect(result).toBe('Dialog confirmed!');

        console.log("\n✅ getByRole with shadow DOM completed!");
    });

    test("Shadow DOM use cases summary", async ({ page }) => {
        console.log("\n=== Shadow DOM Use Cases ===\n");

        console.log("PLAYWRIGHT SHADOW DOM SUPPORT:");
        console.log("─".repeat(50));
        console.log("  Playwright automatically pierces open shadow DOM!");
        console.log("  Regular locators work inside shadow roots.");
        console.log("");
        console.log("  Supported methods that work across shadow boundaries:");
        console.log("  • page.locator('selector') - CSS selectors");
        console.log("  • page.getByRole() - ARIA roles");
        console.log("  • page.getByText() - Text content");
        console.log("  • page.getByLabel() - Form labels");
        console.log("  • page.getByPlaceholder() - Input placeholders");
        console.log("  • page.getByTestId() - Test IDs");

        console.log("\nCOMMON USE CASES:");
        console.log("─".repeat(50));
        console.log("  • Web Components (custom elements)");
        console.log("  • UI Libraries (Shoelace, Lit, Stencil)");
        console.log("  • Design Systems with encapsulated styles");
        console.log("  • Third-party widgets");
        console.log("  • Micro-frontends");

        console.log("\nNATURAL LANGUAGE EXAMPLES:");
        console.log("─".repeat(50));
        console.log("  await play(\"Click the submit button in the custom form\", { page, test });");
        console.log("  await play(\"Fill the email input in the custom field\", { page, test });");
        console.log("  await play(\"Check the terms checkbox\", { page, test });");

        console.log("\nPLAYWRIGHT API EXAMPLES:");
        console.log("─".repeat(50));
        console.log("  // Direct locator (pierces shadow DOM)");
        console.log("  await page.locator('custom-element button').click();");
        console.log("");
        console.log("  // Using getByRole (recommended)");
        console.log("  await page.getByRole('button', { name: 'Submit' }).click();");
        console.log("");
        console.log("  // Chained locators for specificity");
        console.log("  await page.locator('custom-input').locator('input').fill('value');");
        console.log("");
        console.log("  // For closed shadow roots, use evaluate");
        console.log("  await page.evaluate(() => {");
        console.log("    const host = document.querySelector('custom-element');");
        console.log("    host.shadowRoot.querySelector('button').click();");
        console.log("  });");

        console.log("\n================================\n");
    });
});

/**
 * Integration Example: Code Generation + Auto-Healing
 * This demonstrates the complete workflow for low-maintenance testing
 */
test.describe("Play AI - Complete Workflow Example", () => {
    const outputDir = "./generated";

    test.beforeAll(() => {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
    });

    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test("Complete workflow: Generate + Run + Auto-Heal", async ({ page }) => {
        console.log("\n=== Complete Low-Maintenance Testing Workflow ===\n");

        // Phase 1: Generate tests with AI
        console.log("PHASE 1: Generate Tests (First Run - Uses AI)");
        console.log("─".repeat(50));

        startCodeGeneration("https://www.saucedemo.com/", "Complete workflow test");

        await page.goto("https://www.saucedemo.com/");

        const codeGenOptions = { ...options, generateCode: true };

        await play(
            [
                `Type "standard_user" in the Username field`,
                `Type "secret_sauce" in the Password field`,
                `Click the Login button`
            ],
            { page, test },
            codeGenOptions
        );

        const headerText = await play(
            "get the header logo label text",
            { page, test },
            codeGenOptions
        );

        expect(headerText).toBe("Swag Labs");

        const outputFile = path.join(outputDir, "workflow-example.spec.ts");
        exportGeneratedCode(outputFile, {
            testName: "Generated login test",
            testDescribe: "Workflow Example"
        });

        console.log(`  ✅ Generated: ${outputFile}`);
        console.log(`  📊 Actions collected: ${getCollectedActionsCount()}`);

        // Phase 2: Explain subsequent runs
        console.log("\nPHASE 2: Run Generated Tests (No AI Needed)");
        console.log("─".repeat(50));
        console.log("  Command: npx playwright test generated/workflow-example.spec.ts");
        console.log("  ✅ Runs without AI API calls");
        console.log("  ✅ Fast execution (~50ms per action)");
        console.log("  ✅ No API costs");

        // Phase 3: Explain auto-healing
        console.log("\nPHASE 3: When Selectors Break (Auto-Healing)");
        console.log("─".repeat(50));
        console.log("  If UI changes break selectors:");
        console.log("  ");
        console.log("  Option A - Automatic healing during test:");
        console.log("    PLAY_AI_HEALING=true npx playwright test generated/");
        console.log("  ");
        console.log("  Option B - Manual healing via CLI:");
        console.log("    npx play-ai heal ./generated/workflow-example.spec.ts");
        console.log("  ");
        console.log("  ✅ AI finds correct selectors");
        console.log("  ✅ Test files auto-updated");
        console.log("  ✅ Minimal maintenance required");

        console.log("\n=== Workflow Complete ===\n");
    });
});
