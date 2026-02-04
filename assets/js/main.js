// Main Entry Point
(function() {
    const Store = globalThis.App.Store;
    const UI = globalThis.App.UI;
    const Utils = globalThis.App.Utils;

    let refreshTimer = null;

    const setupAutoRefresh = () => {
        if (refreshTimer) clearInterval(refreshTimer);

        if (Store.state.refreshRate > 0) {
            let multiplier = 1000 * 60;
            if (Store.state.refreshUnit === 'seconds') multiplier = 1000;
            if (Store.state.refreshUnit === 'hours') multiplier = 1000 * 60 * 60;

            const ms = Store.state.refreshRate * multiplier;

            refreshTimer = setInterval(() => {
                UI.refreshUI(true);
            }, ms);
        }
    };

    const manualRefresh = () => {
        UI.refreshUI(true);
        setupAutoRefresh();
    };

    const handleAddRepo = () => {
        const input = document.getElementById('new-repo-input');
        let val = input.value.trim();

        val = val.replace(/\/$/, '');

        try {
            if (val.includes('github.com')) {
                const url = new URL(val.startsWith('http') ? val : `https://${val}`);
                const parts = url.pathname.split('/').filter(Boolean);
                if (parts.length >= 2) {
                    val = `${parts[0]}/${parts[1]}`;
                }
            }
        } catch (e) {
            console.error('Invalid URL:', e);
        }

        const parts = val.split('/');

        if (parts.length !== 2 || !parts[0] || !parts[1]) {
            Utils.showToast('Invalid format. Please use "Owner/Repo" (e.g., microsoft/vscode) or a full GitHub URL.', 'error');
            return;
        }

        if (Store.repoExists(parts[0], parts[1])) {
            Utils.showToast('Repository already exists.', 'error');
            return;
        }

        Store.addRepo(parts[0], parts[1]);
        UI.refreshUI(false);
        input.value = '';
        UI.toggleModal('add-modal');
    };

    const saveSettingsHandler = () => {
        const apiKeyInput = document.getElementById('api-key-input');
        const refreshValInput = document.getElementById('refresh-value-input');
        const refreshUnitSelect = document.getElementById('refresh-unit-select');
        const newLabelInput = document.getElementById('new-label-period-input');

        const newApiKey = apiKeyInput.value.trim();

        if (!Store.isValidApiKey(newApiKey)) {
            Utils.showToast('Invalid API Key format. It should start with "ghp_", "github_pat_", etc.', 'error');
            return;
        }

        let rVal = Number.parseInt(refreshValInput.value);
        if (Number.isNaN(rVal) || rVal < 0) rVal = 0;

        let lVal = Number.parseInt(newLabelInput.value);
        if (Number.isNaN(lVal) || lVal < 0) lVal = 7;

        // Get theme
        const activeBtn = document.querySelector('[data-theme-value].bg-white'); // Active button has white bg
        const newTheme = activeBtn ? activeBtn.dataset.themeValue : 'device';

        Store.updateSettings({
            apiKey: newApiKey,
            refreshRate: rVal,
            refreshUnit: refreshUnitSelect.value,
            newLabelPeriod: lVal,
            theme: newTheme
        });

        setupAutoRefresh();
        UI.refreshUI(false);

        const modal = document.getElementById('settings-modal');
        modal.classList.remove('active');
        setTimeout(() => modal.close(), 200);
    };

    const exportConfig = () => {
        const exportData = {
            projects: Store.state.projects,
            theme: Store.state.theme,
            refreshRate: Store.state.refreshRate,
            refreshUnit: Store.state.refreshUnit,
            newLabelPeriod: Store.state.newLabelPeriod
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'releaseradar-config.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const importConfigHandler = (input) => {
        const file = input.files[0];
        if (!file) return;

        if (confirm('This will overwrite your current projects list and settings. Are you sure you want to continue?')) {
            processImport(file);
        }

        input.value = '';
    };

    const processImport = async (file) => {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (Store.importConfig(data)) {
                UI.applyTheme();
                UI.populateSettings();
                UI.refreshUI(false);
                setupAutoRefresh();
                Utils.showToast('Configuration imported successfully.', 'success');

                if (document.getElementById('settings-modal').open) {
                    UI.toggleModal('settings-modal');
                }
            } else {
                throw new TypeError('Invalid file format');
            }
        } catch (err) {
            Utils.showToast('Error importing file: ' + err.message, 'error');
        }
    };

    const setupEventListeners = () => {
        document.getElementById('refresh-btn')?.addEventListener('click', manualRefresh);
        document.getElementById('header-add-repo-btn')?.addEventListener('click', () => UI.toggleModal('add-modal'));
        document.getElementById('header-settings-btn')?.addEventListener('click', () => UI.toggleModal('settings-modal'));
        document.getElementById('empty-state-add-repo-btn')?.addEventListener('click', () => UI.toggleModal('add-modal'));

        document.getElementById('add-modal-close-btn')?.addEventListener('click', () => UI.toggleModal('add-modal'));
        document.getElementById('settings-modal-close-btn')?.addEventListener('click', () => UI.toggleModal('settings-modal'));

        document.querySelectorAll('dialog').forEach(dialog => {
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) UI.toggleModal(dialog.id);
            });
            dialog.addEventListener('cancel', (e) => {
                e.preventDefault();
                UI.toggleModal(dialog.id);
            });
        });

        document.getElementById('add-repo-confirm-btn')?.addEventListener('click', handleAddRepo);

        // Theme segmented control listeners
        document.querySelectorAll('[data-theme-value]').forEach(btn => {
            btn.addEventListener('click', () => {
                UI.applyTheme(btn.dataset.themeValue);
            });
        });

        // Listen for system theme changes if in device mode
        globalThis.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
             // We can check if currently selected mode is 'device', or just let applyTheme handle it
             // If we are in device mode, we should update
             const activeBtn = document.querySelector('[data-theme-value].bg-white');
             if (activeBtn?.dataset.themeValue === 'device' || (!activeBtn && Store.state.theme === 'device')) {
                 UI.applyTheme('device');
             }
        });

        document.getElementById('save-settings-btn')?.addEventListener('click', saveSettingsHandler);

        document.getElementById('import-config-input')?.addEventListener('change', (e) => importConfigHandler(e.target));
        document.getElementById('export-config-btn')?.addEventListener('click', exportConfig);

        // Global delegation for toggle details
        document.getElementById('projects-container')?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action="toggle-details"]');
            if (btn) {
                UI.toggleDetails(btn, btn.dataset.target);
            }
        });
    };

    // Init
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
        try {
            toastContainer.popover = "manual";
        } catch (e) {
            console.warn('Popover API not supported', e);
        }

        if (toastContainer.showPopover) {
            toastContainer.showPopover();
        }
    }

    UI.applyTheme();
    UI.populateSettings();

    document.getElementById('new-repo-input')?.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') handleAddRepo();
    });

    setupEventListeners();
    UI.refreshUI(true);
    setupAutoRefresh();

})();
