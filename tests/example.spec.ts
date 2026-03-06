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
    CacheManager
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
