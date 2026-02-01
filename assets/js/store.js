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

    const saveState = () => localStorage.setItem(STATE_KEY, JSON.stringify(state));

    const isValidApiKey = (key) => {
        if (!key) return true; // Empty is valid
        const validPrefixes = ['ghp_', 'gho_', 'ghu_', 'ghs_', 'ghr_', 'github_pat_'];
        return validPrefixes.some(prefix => key.startsWith(prefix));
    };

    const addRepo = (owner, name) => {
        state.projects.push({ owner, name });
        saveState();
    };

    const removeRepo = (owner, name) => {
        state.projects = state.projects.filter(p => !(p.owner === owner && p.name === name));
        saveState();
    };

    const repoExists = (owner, name) => {
        return state.projects.some(p => p.owner.toLowerCase() === owner.toLowerCase() && p.name.toLowerCase() === name.toLowerCase());
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
