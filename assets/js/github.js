globalThis.App = globalThis.App || {};

globalThis.App.Github = (function() {
    const Store = globalThis.App.Store;
    const FETCH_LIMIT = 15;
    const GITHUB_API = 'https://api.github.com/repos/';
    const cache = new Map();

    const processReleases = (data) => {
        let stable;
        let pre;

        for (const r of data) {
            if (r.prerelease) {
                if (!pre || r.published_at > pre.published_at) {
                    pre = r;
                }
            } else if (!stable || r.published_at > stable.published_at) {
                stable = r;
            }
        }

        return { stable, pre };
    };

    const fetchRepoData = async (owner, name, forceRefresh = false) => {
        const cacheKey = `${owner.toLowerCase()}/${name.toLowerCase()}`;
        if (!forceRefresh && cache.has(cacheKey)) {
            return cache.get(cacheKey);
        }

        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        if (Store.state.apiKey) headers['Authorization'] = `token ${Store.state.apiKey}`;

        const res = await fetch(`${GITHUB_API}${owner}/${name}/releases?per_page=${FETCH_LIMIT}`, { headers });

        if (res.status === 403) throw new Error('API Rate Limit. Add Token in Settings.');
        if (res.status === 404) throw new Error('Repository not found.');
        if (!res.ok) throw new Error(`Error (${res.status})`);

        const data = await res.json();

        let { stable, pre } = processReleases(data);

        if (!stable) {
            try {
                const stableRes = await fetch(`${GITHUB_API}${owner}/${name}/releases/latest`, { headers });
                if (stableRes.ok) stable = await stableRes.json();
            } catch (e) {
                console.warn('Fallback fetch failed', e);
            }
        }

        const result = { data, stable, pre };
        cache.set(cacheKey, result);
        return result;
    };

    return { fetchRepoData };
})();
