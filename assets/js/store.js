globalThis.App = globalThis.App || {};

globalThis.App.Store = (function() {
    const STATE_KEY = 'releaseradar';
    const defaultState = {
        projects: [],
        apiKey: '',
        theme: 'device',
        refreshRate: 60,
        refreshUnit: 'minutes',
        newLabelPeriod: 7
    };

    const state = JSON.parse(localStorage.getItem(STATE_KEY)) || defaultState;

    const getRepoKey = (owner, name) => `${owner.toLowerCase()}/${name.toLowerCase()}`;
    let projectSet = new Set(state.projects.map(p => getRepoKey(p.owner, p.name)));

    // Migrations
    if (state.refreshRate === undefined) {
        state.refreshRate = state.refreshInterval ?? 60;
        state.refreshUnit = 'minutes';
        delete state.refreshInterval;
    }
    if (state.newLabelPeriod === undefined) {
        state.newLabelPeriod = 7;
    }
    if (state.darkMode !== undefined) {
        state.theme = state.darkMode ? 'dark' : 'light';
        delete state.darkMode;
    }
    if (state.theme === undefined) {
        state.theme = 'device';
    }

    let saveHandle = null;
    const requestIdleCallback = globalThis.requestIdleCallback || ((cb) => setTimeout(cb, 1));
    const cancelIdleCallback = globalThis.cancelIdleCallback || clearTimeout;

    const saveState = () => {
        if (saveHandle) cancelIdleCallback(saveHandle);
        saveHandle = requestIdleCallback(() => {
            localStorage.setItem(STATE_KEY, JSON.stringify(state));
            saveHandle = null;
        });
    };

    const isValidApiKey = (key) => {
        if (!key) return true; // Empty is valid
        return key.startsWith('ghp_') ||
               key.startsWith('gho_') ||
               key.startsWith('ghu_') ||
               key.startsWith('ghs_') ||
               key.startsWith('ghr_') ||
               key.startsWith('github_pat_');
    };

    const addRepo = (owner, name) => {
        state.projects.push({ owner, name });
        projectSet.add(getRepoKey(owner, name));
        saveState();
    };

    const removeRepo = (owner, name) => {
        const key = getRepoKey(owner, name);
        if (projectSet.has(key)) {
            projectSet.delete(key);
            state.projects = state.projects.filter(p => getRepoKey(p.owner, p.name) !== key);
            saveState();
        }
    };

    const repoExists = (owner, name) => {
        return projectSet.has(getRepoKey(owner, name));
    };

    const updateSettings = ({ apiKey, refreshRate, refreshUnit, newLabelPeriod, theme }) => {
        if (apiKey !== undefined) state.apiKey = apiKey;
        if (refreshRate !== undefined) state.refreshRate = refreshRate;
        if (refreshUnit !== undefined) state.refreshUnit = refreshUnit;
        if (newLabelPeriod !== undefined) state.newLabelPeriod = newLabelPeriod;
        if (theme !== undefined) state.theme = theme;
        saveState();
    };

    const importConfig = (data) => {
        if (!Array.isArray(data.projects)) {
            return false;
        }

        state.projects = data.projects;
        projectSet = new Set(state.projects.map(p => getRepoKey(p.owner, p.name)));

        if (data.theme !== undefined) {
            state.theme = data.theme;
        } else if (data.darkMode !== undefined) {
            state.theme = data.darkMode ? 'dark' : 'light';
        }

        if (data.refreshRate !== undefined) state.refreshRate = data.refreshRate;
        if (data.refreshUnit !== undefined) state.refreshUnit = data.refreshUnit;
        if (data.newLabelPeriod !== undefined) state.newLabelPeriod = data.newLabelPeriod;

        if (data.refreshInterval !== undefined && (data.refreshRate === undefined || data.refreshRate === 'undefined')) {
            state.refreshRate = data.refreshInterval;
            state.refreshUnit = 'minutes';
        }

        saveState();
        return true;
    };

    return { state, saveState, isValidApiKey, addRepo, removeRepo, repoExists, updateSettings, importConfig };
})();
