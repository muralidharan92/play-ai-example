# Play AI Examples

Example project demonstrating how to use [play-ai](https://github.com/muralidharan92/play-ai) for AI-powered Playwright testing.

## Features

- **Multi-Provider Support**: OpenAI, Anthropic Claude, Google Gemini, Ollama
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

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PLAY_AI_PROVIDER` | AI provider to use | `openai`, `anthropic`, `gemini`, `ollama` |
| `PLAY_AI_DEBUG` | Enable debug logging | `true` |
| `PLAY_AI_PARALLEL` | Enable parallel test execution | `true`, `false` |
| `PLAY_AI_WORKERS` | Number of parallel workers | `4` |
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
    └── Parallel Execution Examples
        ├── Extract multiple data points in parallel
        ├── Parallel execution with concurrency limit
        └── Parallel execution with error handling
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
