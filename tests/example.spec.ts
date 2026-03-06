import { expect, test } from "@playwright/test";
import { play, playParallel, playParallelWithLimit } from "play-ai";
import * as dotenv from "dotenv";

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
