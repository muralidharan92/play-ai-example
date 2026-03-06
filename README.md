# Play AI Examples

Example project demonstrating how to use [play-ai](https://github.com/muralidharan92/play-ai) for AI-powered Playwright testing.

## Features

- **Multi-Provider Support**: OpenAI, Anthropic Claude, Google Gemini, Ollama
- **Response Caching**: Reduce API costs by 80%+ with intelligent caching
- **Multi-Tab / Multi-Page**: Handle complex scenarios with multiple browser tabs
- **File Upload / Download**: Handle file operations with natural language
- **Drag and Drop**: Sortable lists, sliders, Kanban boards, resizable panels
- **iFrame Support**: Payment forms, nested iframes, multiple iframes
- **Shadow DOM**: Web components, custom elements, accessible interactions
- **Smart Retry Logic**: Exponential backoff with jitter for reliable tests
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

## Multi-Tab / Multi-Page Support

Handle complex scenarios involving multiple browser tabs or pages.

### Basic Multi-Tab Operations

```typescript
// Get current page info
const url = await play("get the current page URL", { page, test });
const title = await play("get the current page title", { page, test });

// Open a new tab
await play("open a new tab and navigate to https://example.com", { page, test });

// Switch between tabs
await play("switch to the page at index 1", { page, test });
await play("switch to the page with URL containing checkout", { page, test });

// Close tabs
await play("close the current tab", { page, test });
await play("close the page at index 2", { page, test });
```

### Get All Pages Info

```typescript
// Get number of open pages
const count = await play("get the number of open pages", { page, test });

// Get info about all pages
const pages = await play("get information about all open pages", { page, test });
// Returns: { pages: [{ index, url, title, isActive }, ...], count }
```

### Programmatic Multi-Page Management

```typescript
import { getMultiPageManagerFromPage } from "play-ai";

const manager = getMultiPageManagerFromPage(page);
await manager.initialize();

// Get all pages
const pages = await manager.getAllPages();

// Switch to a page
await manager.switchToPage({ index: 1 });
await manager.switchToPage({ urlPattern: /checkout/ });

// Close other pages
await manager.closeOtherPages();
```

### Multi-Tab Use Cases

| Use Case | Description |
|----------|-------------|
| External links | Links that open in new tabs (Terms, Privacy) |
| OAuth flows | Handle OAuth popup windows |
| Print previews | Switch to print preview windows |
| Multi-step workflows | Compare products across tabs |

## File Upload / Download

Handle file uploads and downloads using natural language.

### File Upload

```typescript
// Upload a single file
await play("Upload './test-files/document.pdf' to the file input", { page, test });

// Upload multiple files
await play("Upload './images/photo1.jpg' and './images/photo2.jpg' to the file input", { page, test });

// Clear file input
await play("Clear the file input", { page, test });
```

### File Download

```typescript
// Click download and get file info
const result = await play("Click the download button and save the file", { page, test });
console.log(result.path); // Path to downloaded file

// Download to specific location
await play("Click 'Export PDF' and save to './downloads/report.pdf'", { page, test });
```

### Programmatic File Operations

```typescript
// Upload file
await page.locator('input[type="file"]').setInputFiles('./document.pdf');

// Download file
const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#download-btn')
]);
await download.saveAs('./downloads/file.pdf');
```

### File Upload/Download Use Cases

| Use Case | Example |
|----------|---------|
| Document upload | Upload PDF, DOCX to forms |
| Image upload | Profile pictures, attachments |
| Report export | Download generated reports |
| Data export | Export CSV, Excel files |

## Drag and Drop

Test drag and drop interactions, sliders, and sortable lists using natural language.

### Basic Drag and Drop

```typescript
// Drag one element to another
await play("Drag 'Item 1' and drop it on 'Cart'", { page, test });

// Drag using CSS selectors
await play("Drag the task card to the Done column", { page, test });
```

### Slider Operations

```typescript
// Set slider to percentage
await play("Drag the slider to 75%", { page, test });

// Set volume/brightness
await play("Set the volume slider to 50%", { page, test });
```

### Position and Offset Dragging

```typescript
// Drag to specific coordinates
await play("Drag the element to position (300, 200)", { page, test });

// Drag by relative offset
await play("Move the panel 100 pixels to the right", { page, test });
```

### Programmatic Drag and Drop

```typescript
// Element to element
await page.locator('#source').dragTo(page.locator('#target'));

// Selector-based
await page.dragAndDrop('#source', '#target');

// Mouse API for custom positioning
const box = await page.locator('#element').boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.mouse.move(targetX, targetY, { steps: 10 });
await page.mouse.up();
```

### Drag and Drop Use Cases

| Use Case | Example |
|----------|---------|
| Kanban boards | Move cards between columns |
| Sortable lists | Reorder todo items |
| File managers | Drag files to folders |
| Sliders/ranges | Volume, price range, brightness |
| Resizable panels | Drag dividers to resize |
| Shopping carts | Drag products to cart |

## iFrame Support

Test content inside iframes, including payment forms, embedded widgets, and third-party integrations.

### Basic iFrame Interactions

```typescript
// Access iframe and interact with elements inside
const frame = page.frameLocator('#payment-frame');
await frame.locator('#card-number').fill('4242424242424242');
await frame.locator('#expiry').fill('12/25');
await frame.locator('#submit').click();

// Get text from iframe
const message = await frame.locator('.result').textContent();
```

### Multiple iFrames

```typescript
// Interact with different iframes on the same page
const frame1 = page.frameLocator('#frame1');
const frame2 = page.frameLocator('#frame2');

await frame1.locator('button').click();
await frame2.locator('input').fill('value');
```

### Nested iFrames

```typescript
// Access nested iframes (iframe inside another iframe)
const outer = page.frameLocator('#outer-frame');
const inner = outer.frameLocator('#inner-frame');

await inner.locator('button').click();
```

### iFrame Use Cases

| Use Case | Example |
|----------|---------|
| Payment forms | Stripe, PayPal, Braintree embedded forms |
| CAPTCHA widgets | reCAPTCHA, hCaptcha |
| Social embeds | YouTube, Twitter, Facebook |
| Third-party widgets | Chat widgets, calendars, maps |
| Legacy integrations | Embedded legacy applications |

## Shadow DOM Support

Test web components and custom elements that use Shadow DOM. Playwright automatically pierces shadow DOM boundaries.

### Basic Shadow DOM Interactions

```typescript
// Playwright automatically pierces open shadow DOM
await page.locator('custom-element button').click();
await page.locator('custom-input input').fill('value');

// Get text from inside shadow DOM
const text = await page.locator('custom-element .message').textContent();
```

### Using getByRole (Recommended)

```typescript
// getByRole works across shadow boundaries
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Email').fill('test@example.com');
await page.getByPlaceholder('Search...').fill('query');
```

### Custom Form Components

```typescript
// Interact with custom form elements
await page.locator('custom-input').locator('input').fill('John Doe');
await page.locator('custom-checkbox').locator('input[type="checkbox"]').check();
await page.locator('custom-select').locator('select').selectOption('option1');
```

### Closed Shadow Roots

```typescript
// For closed shadow roots, use evaluate
await page.evaluate(() => {
    const host = document.querySelector('custom-element');
    const button = host.shadowRoot.querySelector('button');
    button.click();
});
```

### Shadow DOM Use Cases

| Use Case | Example |
|----------|---------|
| Web Components | Custom elements with encapsulation |
| UI Libraries | Shoelace, Lit, Stencil components |
| Design Systems | Enterprise component libraries |
| Third-party widgets | Encapsulated third-party components |

## Smart Retry Logic

Automatically retry failed actions with exponential backoff and intelligent error classification.

### Basic Retry Configuration

```typescript
await play("Click the Submit button", { page, test }, {
    retry: {
        maxAttempts: 3,           // Try up to 3 times
        initialDelay: 1000,       // Start with 1 second delay
        maxDelay: 10000,          // Cap at 10 seconds
        backoffMultiplier: 2,     // Double delay each retry
        jitter: true              // Add randomness to prevent thundering herd
    }
});
```

### Environment Variable Configuration

```bash
PLAY_AI_RETRY=true                    # Enable retry (default: true)
PLAY_AI_RETRY_MAX_ATTEMPTS=3          # Max attempts
PLAY_AI_RETRY_INITIAL_DELAY=1000      # Initial delay (ms)
PLAY_AI_RETRY_MAX_DELAY=10000         # Max delay (ms)
PLAY_AI_RETRY_BACKOFF_MULTIPLIER=2    # Backoff multiplier
```

### Exponential Backoff

The retry system uses exponential backoff to prevent overwhelming services:

```
Attempt 1 → Immediate
Attempt 2 → 1000ms  (initial delay)
Attempt 3 → 2000ms  (1000 × 2)
Attempt 4 → 4000ms  (2000 × 2)
Attempt 5 → 8000ms  (capped at maxDelay)
```

With jitter enabled, actual delays vary randomly to prevent thundering herd issues.

### Smart Error Classification

The retry system automatically classifies errors:

**Transient Errors (Will Retry):**
- Timeout errors
- Network errors (ECONNRESET, ETIMEDOUT)
- Rate limiting (429)
- Service unavailable (503)

**Permanent Errors (No Retry):**
- Invalid selector
- Element not found
- Validation errors
- Unauthorized (401)
- Not found (404)

### Disable Retry for Specific Actions

```typescript
// Single attempt, no retry
await play("Click the Delete button", { page, test }, {
    retry: { maxAttempts: 1 }
});
```

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
| `PLAY_AI_RETRY` | Enable retry logic | `true` (default) |
| `PLAY_AI_RETRY_MAX_ATTEMPTS` | Maximum retry attempts | `3` |
| `PLAY_AI_RETRY_INITIAL_DELAY` | Initial retry delay (ms) | `1000` |
| `PLAY_AI_RETRY_MAX_DELAY` | Maximum retry delay (ms) | `10000` |
| `PLAY_AI_RETRY_BACKOFF_MULTIPLIER` | Backoff multiplier | `2` |
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
    ├── Multi-Tab / Multi-Page Examples
    │   ├── Get current page information
    │   ├── Get page count and all pages info
    │   ├── Open new tab and switch between tabs
    │   ├── Switch to page by URL pattern
    │   ├── Close pages
    │   ├── Programmatic multi-page management
    │   └── Demonstrate multi-tab use cases
    │
    ├── File Upload / Download Examples
    │   ├── Demonstrate file upload concepts
    │   ├── Demonstrate file download concepts
    │   ├── File upload with Playwright API
    │   ├── Demonstrate download handling patterns
    │   └── File upload/download use cases summary
    │
    ├── Drag and Drop Examples
    │   ├── Basic drag and drop between elements
    │   ├── Drag and drop using page.dragAndDrop
    │   ├── Slider manipulation by percentage
    │   ├── Drag element to specific position
    │   ├── Drag by offset (relative movement)
    │   ├── Sortable list drag and drop
    │   └── Drag and drop use cases summary
    │
    ├── iFrame Examples
    │   ├── Basic iframe interactions
    │   ├── Multiple iframes on same page
    │   ├── Nested iframes
    │   └── iFrame use cases summary
    │
    ├── Shadow DOM Examples
    │   ├── Basic shadow DOM interactions
    │   ├── Shadow DOM form components
    │   ├── Using getByRole with shadow DOM
    │   └── Shadow DOM use cases summary
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
