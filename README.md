# Play AI Examples

Example project demonstrating how to use [play-ai](https://github.com/muralidharan92/play-ai) for AI-powered Playwright testing.

## Features

- **Multi-Provider Support**: OpenAI, Anthropic Claude, Google Gemini, Ollama
- **Response Caching**: Reduce API costs by 80%+ with intelligent caching
- **Code Generation**: Generate standalone Playwright tests (no AI after first run!)
- **Auto-Healing Selectors**: Automatically fix broken selectors (low maintenance!)
- **Parallel Execution**: Extract multiple data points concurrently
- **Snapshot Strategies**: Full page, targeted extraction, auto selection
- **Command Chaining**: Single and batched commands
- **Data Extraction**: Querying page content with natural language

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install chromium
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your API key
```

### 4. Run Tests

```bash
# With OpenAI (default)
OPENAI_API_KEY='sk-...' npm test

# With Anthropic Claude
ANTHROPIC_API_KEY='sk-ant-...' PLAY_AI_PROVIDER=anthropic npm test

# With Google Gemini
GEMINI_API_KEY='...' PLAY_AI_PROVIDER=gemini npm test

# With Ollama (local)
PLAY_AI_PROVIDER=ollama npm test
```

## Usage Examples

### Basic Usage

```typescript
import { play, playParallel, playParallelWithLimit } from "play-ai";

await play("Click the Login button", { page, test });
```

### Chained Commands

```typescript
await play([
    "Type 'username' in the Username field",
    "Type 'password' in the Password field",
    "Click the Login button"
], { page, test });
```

### Extract Data

```typescript
const headerText = await play(
    "get the header logo text",
    { page, test }
);
expect(headerText).toBe("Swag Labs");
```

## Multi-Provider Configuration

### OpenAI (Default)

```typescript
await play("Click Login", { page, test }, {
    provider: "openai",
    model: "gpt-4o",
    openaiApiKey: process.env.OPENAI_API_KEY
});
```

### Anthropic Claude

```typescript
await play("Click Login", { page, test }, {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY
});
```

### Google Gemini

```typescript
await play("Click Login", { page, test }, {
    provider: "gemini",
    model: "gemini-1.5-pro",
    geminiApiKey: process.env.GEMINI_API_KEY
});
```

### Ollama (Local)

```typescript
await play("Click Login", { page, test }, {
    provider: "ollama",
    model: "llama3.1",
    ollamaBaseUrl: "http://localhost:11434"
});
```

## Snapshot Strategies

Control how Play AI captures page content to optimize token usage:

### Full Page (Default)

```typescript
await play("Click Login", { page, test }, {
    snapshotStrategy: "full"
});
```

### Targeted (Reduced Tokens)

```typescript
await play("Click Login", { page, test }, {
    snapshotStrategy: "targeted",
    domExtractorConfig: {
        maxContainerLength: 5000,
        preferSmallestContainer: true
    }
});
```

### Auto (Smart Selection)

```typescript
await play("Click Login", { page, test }, {
    snapshotStrategy: "auto"
});
```

## Parallel Execution

Extract multiple data points concurrently for improved performance.

### Basic Parallel Execution

```typescript
import { playParallel } from "play-ai";

const results = await playParallel(
    [
        "get the header logo text",
        "get the first product name",
        "get the cart count"
    ],
    { page, test }
);

console.log(results[0].result); // "Swag Labs"
console.log(results[1].result); // "Sauce Labs Backpack"
```

### Parallel with Concurrency Limit

```typescript
import { playParallelWithLimit } from "play-ai";

const results = await playParallelWithLimit(
    ["task1", "task2", "task3", "task4"],
    { page, test },
    { concurrency: 2 } // Max 2 concurrent tasks
);
```

### Parallel Result Structure

```typescript
interface ParallelResult {
    index: number;     // Position in original array
    task: string;      // The task that was executed
    success: boolean;  // Whether task succeeded
    result?: unknown;  // Result value if successful
    error?: string;    // Error message if failed
}
```

### When to Use Parallel Execution

| Use Case | Recommended |
|----------|-------------|
| Extracting multiple independent data points | ✅ Yes |
| Running multiple read-only queries | ✅ Yes |
| Validating multiple elements | ✅ Yes |
| Sequential actions (fill → click → verify) | ❌ No |
| Actions that depend on each other | ❌ No |

## Code Generation

Generate standalone Playwright tests from natural language. After the first run, tests execute **without AI API calls** - saving costs and improving speed.

### Basic Usage

```typescript
import {
    play,
    startCodeGeneration,
    exportGeneratedCode
} from "play-ai";

test("Generate login test", async ({ page }) => {
    // 1. Start collecting actions
    startCodeGeneration("https://www.saucedemo.com/", "Login test");

    await page.goto("https://www.saucedemo.com/");

    // 2. Run with code generation enabled
    await play("Type 'user' in username", { page, test }, { generateCode: true });
    await play("Type 'pass' in password", { page, test }, { generateCode: true });
    await play("Click Login", { page, test }, { generateCode: true });

    // 3. Export to standalone Playwright file
    exportGeneratedCode("./generated/login.spec.ts", {
        testName: "Login with credentials",
        testDescribe: "Auth Tests"
    });
});
```

### Generated Output

```typescript
// ./generated/login.spec.ts - Runs WITHOUT play-ai!
import { test, expect } from "@playwright/test";

test.describe("Auth Tests", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("https://www.saucedemo.com/");
    });

    test("Login with credentials", async ({ page }) => {
        // Task: Type 'user' in username
        await page.locator('[data-test="username"]').fill("user");

        // Task: Type 'pass' in password
        await page.locator('[data-test="password"]').fill("pass");

        // Task: Click Login
        await page.locator('[data-test="login-button"]').click();
    });
});
```

### Code Generation API

| Function | Description |
|----------|-------------|
| `startCodeGeneration(baseUrl?, testName?)` | Start collecting actions |
| `exportGeneratedCode(path, options?)` | Write to .spec.ts file |
| `isCodeGenerationActive()` | Check if collecting |
| `getCollectedActionsCount()` | Get action count |
| `cancelCodeGeneration()` | Cancel without saving |

### Benefits

| | First Run | After Generation |
|---|-----------|-----------------|
| AI API calls | Yes | **No** |
| Cost | API cost | **Free** |
| Speed | ~2-5s/action | **~50ms/action** |
| Dependencies | play-ai | **None** |

## Auto-Healing Selectors

When selectors break in generated tests, Play AI automatically fixes them using AI.

### Method 1: Automatic (During Test Run)

```bash
# Run tests with auto-healing enabled
PLAY_AI_HEALING=true npx playwright test generated/
```

### Method 2: CLI (Manual)

```bash
# Heal all selectors in a file
npx play-ai heal ./generated/login.spec.ts

# Heal with debug and backup
npx play-ai heal ./generated/login.spec.ts --debug --backup

# Dry run (check without modifying)
npx play-ai heal ./generated/*.spec.ts --dry-run
```

### CLI Options

| Option | Description |
|--------|-------------|
| `--line, -l <n>` | Heal specific line only |
| `--url, -u <url>` | URL to navigate to |
| `--backup, -b` | Create backup before modifying |
| `--report, -r` | Generate healing report |
| `--dry-run` | Check without modifying files |
| `--debug, -d` | Enable debug output |

### Benefits

| | Without Healing | With Auto-Healing |
|---|-----------------|-------------------|
| Selector breaks | Manual fix needed | Auto-fixed |
| Maintenance | High effort | Low effort |
| CI/CD | Flaky tests | Self-healing |

## Response Caching

Cache AI responses to reduce API costs by 80%+. When you run the same task with the same DOM, Play AI returns the cached result instantly.

### How It Works

```
First run:  play("Click Login") → AI API call → Result cached
Next runs:  play("Click Login") → Cache hit → Instant result (FREE!)
```

### Basic Usage (Enabled by Default)

```typescript
// Caching is enabled by default
await play("Click Login", { page, test });

// Second call with same task + DOM = cache hit
await play("Click Login", { page, test }); // Uses cache, no API call
```

### Configuration Options

```typescript
await play("Click Login", { page, test }, {
    cache: true,                    // Enable/disable caching (default: true)
    cacheTTL: 86400,               // Cache TTL in seconds (default: 24 hours)
    cacheStrategy: "aggressive",   // aggressive | conservative | smart | off
    cacheDir: ".play-ai-cache"     // Cache directory
});
```

### Cache Strategies

| Strategy | Description |
|----------|-------------|
| `aggressive` | Cache everything, longer TTL (default) |
| `conservative` | Only cache exact DOM matches |
| `smart` | AI-assisted cache invalidation |
| `off` | Disable caching |

### CLI Commands

```bash
# View cache statistics
npx play-ai cache stats

# Clear all cache entries
npx play-ai cache clear --all

# Clear entries for specific provider
npx play-ai cache clear --provider openai

# Dry run - see what would be cleared
npx play-ai cache clear --all --dry-run

# Remove expired entries
npx play-ai cache cleanup
```

### Benefits

| | Without Caching | With Caching |
|---|-----------------|--------------|
| API calls | Every test run | First run only* |
| Cost | $0.01-0.05 per task | ~$0 after cached |
| Speed | 1-3s per task | <50ms per task |
| Rate limits | Can hit limits | Reduced API usage |

*For identical task + DOM combinations

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PLAY_AI_PROVIDER` | AI provider to use | `openai`, `anthropic`, `gemini`, `ollama` |
| `PLAY_AI_DEBUG` | Enable debug logging | `true` |
| `PLAY_AI_PARALLEL` | Enable parallel test execution | `true`, `false` |
| `PLAY_AI_WORKERS` | Number of parallel workers | `4` |
| `PLAY_AI_GENERATE_CODE` | Enable code generation mode | `true` |
| `PLAY_AI_CODE_OUTPUT_DIR` | Output directory for generated tests | `./generated` |
| `PLAY_AI_HEALING` | Enable auto-healing during test runs | `true` |
| `PLAY_AI_HEALING_DEBUG` | Enable healing debug output | `true` |
| `PLAY_AI_CACHE` | Enable response caching | `true` (default) |
| `PLAY_AI_CACHE_DIR` | Cache directory | `.play-ai-cache` |
| `PLAY_AI_CACHE_TTL` | Cache TTL in seconds | `86400` (24 hours) |
| `PLAY_AI_CACHE_STRATEGY` | Cache strategy | `aggressive`, `conservative`, `off` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-...` |
| `GEMINI_API_KEY` | Google Gemini API key | `...` |
| `OLLAMA_BASE_URL` | Ollama server URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model name | `llama3.1` |

## Test Structure

```
tests/
└── example.spec.ts
    ├── Basic Examples
    │   ├── Login with single commands
    │   ├── Login with chained commands
    │   └── Extract inventory data
    │
    ├── Provider Configuration Examples
    │   ├── OpenAI provider
    │   ├── Anthropic Claude provider
    │   ├── Google Gemini provider
    │   └── Ollama local provider
    │
    ├── Snapshot Strategy Examples
    │   ├── Full page snapshot
    │   ├── Targeted snapshot
    │   └── Auto snapshot
    │
    ├── Parallel Execution Examples
    │   ├── Extract multiple data points in parallel
    │   ├── Parallel execution with concurrency limit
    │   └── Parallel execution with error handling
    │
    ├── Code Generation Examples
    │   ├── Generate login test from natural language
    │   ├── Generate inventory browsing test
    │   └── Generate add to cart test
    │
    ├── Auto-Healing Examples
    │   ├── Verify selector works on page
    │   ├── Heal a broken selector using AI
    │   ├── Use healing page wrapper
    │   └── Demonstrate healing workflow
    │
    ├── Response Caching Examples
    │   ├── Basic caching (automatic)
    │   ├── Explicit cache configuration
    │   ├── Cache strategies comparison
    │   ├── Disable caching for specific calls
    │   ├── View cache statistics
    │   ├── Cache with parallel execution
    │   └── Demonstrate cache benefits
    │
    └── Complete Workflow Example
        └── Generate + Run + Auto-Heal
```

## Supported Actions

- `page.goto` - Navigate to URL
- `locator.click` - Click element
- `locator.fill` - Fill input field
- `locator.textContent` - Get text content
- `locator.blur` - Remove focus
- `locator.boundingBox` - Get element bounds
- `locator.check` / `locator.uncheck` - Checkbox actions
- `locator.clear` - Clear input
- `locator.count` - Count elements
- `locator.getAttribute` - Get attribute value
- `locator.innerHTML` / `locator.innerText` - Get HTML/text
- `locator.inputValue` - Get input value
- `locator.isChecked` / `locator.isEditable` / `locator.isEnabled` / `locator.isVisible` - State checks
- `locator.hover` - Hover on element
- `locator.dblclick` - Double click
- `locator.scrollIntoView` / `locator.scrollIntoViewIfNeeded` - Scroll element into view
- `locator.waitForPageLoad` - Wait for page to load
- `locator.expectToBe` / `locator.expectNotToBe` - Assertions

## Debugging

Enable debug mode to see detailed logs:

```bash
PLAY_AI_DEBUG=true npm test
```

Or in code:

```typescript
await play("Click Login", { page, test }, { debug: true });
```

## Run Tests Headed

See the browser during test execution:

```bash
npm test -- --headed
```

## License

MIT
