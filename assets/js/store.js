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
    let projectMap = new Map();
    for (const p of state.projects) {
        projectMap.set(getRepoKey(p.owner, p.name), p);
    }

    if (state.refreshRate === undefined) {
        state.refreshRate = 60;
        state.refreshUnit = 'minutes';
    }
    if (state.newLabelPeriod === undefined) {
        state.newLabelPeriod = 7;
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
        const p = { owner, name };
        state.projects.push(p);
        projectMap.set(getRepoKey(owner, name), p);
        saveState();
    };

    const removeRepo = (owner, name) => {
        const key = getRepoKey(owner, name);
        const p = projectMap.get(key);
        if (p) {
            projectMap.delete(key);
            const index = state.projects.indexOf(p);
            if (index !== -1) {
                state.projects.splice(index, 1);
            }
            saveState();
        }
    };

    const repoExists = (owner, name) => {
        return projectMap.has(getRepoKey(owner, name));
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
        projectMap = new Map();
        for (const p of state.projects) {
            projectMap.set(getRepoKey(p.owner, p.name), p);
        }

        if (data.theme !== undefined) {
            state.theme = data.theme;
        }

        if (data.refreshRate !== undefined) state.refreshRate = data.refreshRate;
        if (data.refreshUnit !== undefined) state.refreshUnit = data.refreshUnit;
        if (data.newLabelPeriod !== undefined) state.newLabelPeriod = data.newLabelPeriod;

        saveState();
        return true;
    };

    return { state, saveState, isValidApiKey, addRepo, removeRepo, repoExists, updateSettings, importConfig };
})();
