globalThis.App = globalThis.App || {};

globalThis.App.Github = (function() {
    const Store = globalThis.App.Store;
    const FETCH_LIMIT = 15;
    const GITHUB_API = 'https://api.github.com/repos/';

    const fetchRepoData = async (owner, name) => {
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        if (Store.state.apiKey) headers['Authorization'] = `token ${Store.state.apiKey}`;

        const res = await fetch(`${GITHUB_API}${owner}/${name}/releases?per_page=${FETCH_LIMIT}`, { headers });

        if (res.status === 403) throw new Error('API Rate Limit. Add Token in Settings.');
        if (res.status === 404) throw new Error('Repository not found.');
        if (!res.ok) throw new Error(`Error (${res.status})`);

        const data = (await res.json()).sort((a, b) => {
            if (b.published_at > a.published_at) return 1;
            if (b.published_at < a.published_at) return -1;
            return 0;
        });

        let stable = data.find(r => !r.prerelease);
        const pre = data.find(r => r.prerelease);

        if (!stable) {
            try {
                const stableRes = await fetch(`${GITHUB_API}${owner}/${name}/releases/latest`, { headers });
                if (stableRes.ok) stable = await stableRes.json();
            } catch (e) {
                console.warn('Fallback fetch failed', e);
            }
        }
        return { data, stable, pre };
    };

    return { fetchRepoData };
})();
