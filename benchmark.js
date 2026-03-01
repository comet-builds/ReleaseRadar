const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Prevent network requests that might delay the page load or cause issues without internet
    await page.route('**/*', route => {
        const url = route.request().url();
        if (url.startsWith('http')) {
             route.abort();
        } else {
             route.continue();
        }
    });

    // Mock API requests and init
    await page.addInitScript(() => {
        window.App = window.App || {};
        window.App.Github = {
            fetchRepoData: async () => ({ data: [], stable: null, pre: null })
        };
    });

    await page.goto(`file://${path.resolve(__dirname, 'index.html')}`);

    // Wait for App to be initialized
    await page.waitForFunction(() => window.App && window.App.UI && window.App.UI.hasUnsavedSettings);

    const result = await page.evaluate(() => {
        // Open the settings modal to ensure elements are populated if necessary
        window.App.UI.toggleModal('settings-modal');

        const start = performance.now();
        const iterations = 10000;

        for (let i = 0; i < iterations; i++) {
            window.App.UI.hasUnsavedSettings();
        }

        const end = performance.now();
        return {
            iterations,
            duration: end - start,
            avgMs: (end - start) / iterations
        };
    });

    console.log(`Benchmark completed:`);
    console.log(`Iterations: ${result.iterations}`);
    console.log(`Total duration: ${result.duration.toFixed(2)} ms`);
    console.log(`Average time per call: ${result.avgMs.toFixed(4)} ms`);

    await browser.close();
})();
