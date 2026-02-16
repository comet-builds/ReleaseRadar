globalThis.App = globalThis.App || {};

globalThis.App.UI = (function() {
    const Store = globalThis.App.Store;
    const Utils = globalThis.App.Utils;
    const Github = globalThis.App.Github;

    const runConcurrently = async (items, fn, limit) => {
        const results = [];
        const executing = new Set();

        for (const item of items) {
            const p = Promise.resolve().then(() => fn(item));
            results.push(p);

            const e = p.then(() => [], () => []);
            executing.add(e);
            const clean = () => executing.delete(e);
            e.then(clean);

            if (executing.size >= limit) {
                await Promise.race(executing);
            }
        }

        return Promise.allSettled(results);
    };

    const flattenDetailsTags = (html) => {
        if (!html) return '';
        // Use DOMPurify to sanitize and parse into a DocumentFragment in one pass
        // This avoids using DOMParser which is slower and parses the whole string again
        const fragment = globalThis.DOMPurify.sanitize(html, { RETURN_DOM_FRAGMENT: true });

        fragment.querySelectorAll('details').forEach(el => {
            const div = document.createElement('div');
            div.className = 'border-l-2 border-slate-200 dark:border-slate-700 pl-4 my-3 space-y-2';

            // Move children to new div, excluding summary
            while (el.firstChild) {
                const node = el.firstChild;
                if (node.nodeName.toLowerCase() === 'summary') {
                    node.remove();
                } else {
                    div.appendChild(node);
                }
            }
            el.parentNode.replaceChild(div, el);
        });

        const temp = document.createElement('div');
        temp.appendChild(fragment);
        return temp.innerHTML;
    };

    const createAssetList = (assets) => {
        if (!assets?.length) return '<p class="text-sm text-slate-400 italic py-1">No attached assets.</p>';
        return `<ul class="space-y-2 mt-3">
            ${assets.map(a => `
            <li>
                <a href="${a.browser_download_url}" class="group flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all text-sm">
                    <div class="flex items-center overflow-hidden">
                        <div class="mr-3 flex-shrink-0">${Utils.ICONS.DOWNLOAD}</div>
                        <span class="truncate font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">${globalThis.DOMPurify.sanitize(a.name)}</span>
                    </div>
                    <span class="ml-3 text-xs font-mono text-slate-400 whitespace-nowrap bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700 shadow-sm">${(a.size / 1048576).toFixed(2)} MB</span>
                </a>
            </li>`).join('')}
        </ul>`;
    };

    const createReleaseCard = (release, label, isPre) => {
        const freshMs = (Store.state.newLabelPeriod || 7) * 24 * 3600 * 1000;
        const isFresh = (Date.now() - new Date(release.published_at).getTime()) <= freshMs;

        const badgeBase = "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide shadow-sm";
        const stableBadge = "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-500/30";
        const preBadge = "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-500/30";
        const freshBadgeStyle = isPre ? preBadge : stableBadge;

        const freshBadge = isFresh ? `<span class="${badgeBase} ${freshBadgeStyle}">New</span>` : '';
        const labelColor = isPre ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400';

        return `
            <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-all hover:shadow-md h-full">
                <div class="p-5 flex-grow">
                    <div class="flex justify-between items-start mb-4">
                        <div class="min-w-0 flex-1 mr-2">
                            <span class="text-xs font-bold uppercase tracking-widest ${labelColor} mb-1 block">${label}</span>
                            <div class="flex items-center gap-2 flex-wrap">
                                <a href="${release.html_url}" target="_blank" class="group flex items-center text-lg font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors break-all">
                                    ${globalThis.DOMPurify.sanitize(release.tag_name)}
                                </a>
                                ${freshBadge}
                            </div>
                        </div>
                        <span class="text-xs font-medium text-slate-400 whitespace-nowrap bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">${Utils.formatDate(release.published_at)}</span>
                    </div>

                    <button data-action="toggle-details" data-target="d-${release.id}" class="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <span>View Assets & Notes</span> ${Utils.ICONS.CHEVRON}
                    </button>
                </div>

                <div id="d-${release.id}" class="release-details border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-xl">
                    <div class="p-5">
                        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Assets</h4>
                        ${createAssetList(release.assets)}

                        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mt-6 mb-3">Release Notes</h4>
                        <div class="prose prose-sm prose-slate dark:prose-invert max-w-none break-words bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                            ${release.body ? flattenDetailsTags(globalThis.marked.parse(release.body)) : '<p class="text-slate-400 italic">No release notes.</p>'}
                        </div>
                    </div>
                </div>
            </div>`;
    };

    const handleRemoveRepo = (owner, name) => {
        if (confirm(`Are you sure you want to stop tracking ${name}?`)) {
            Store.removeRepo(owner, name);
            refreshUI();
            Utils.showToast(`${name} removed.`, 'success');
        }
    };

    const createProjectCard = (p) => {
        const el = document.createElement('article');
        el.className = 'bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10 overflow-hidden animate-fade-in relative group';
        el.dataset.owner = p.owner;
        el.dataset.name = p.name;
        el.dataset.latest = 0;

        el.innerHTML = `
            <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-white dark:bg-slate-800">
                <div class="text-slate-800 dark:text-slate-200 p-1.5 bg-slate-50 dark:bg-slate-700 rounded-md border border-slate-200/60 dark:border-slate-600">${Utils.ICONS.GITHUB}</div>
                <h2 class="text-lg font-semibold tracking-tight break-all flex-grow">
                    <a href="https://github.com/${Utils.escapeAttr(p.owner)}/${Utils.escapeAttr(p.name)}" target="_blank" class="text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        ${globalThis.DOMPurify.sanitize(p.name)}
                    </a>
                </h2>
                <span class="text-xs text-slate-400 font-mono ml-auto bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded hidden sm:inline-block self-center">${globalThis.DOMPurify.sanitize(p.owner)}</span>
                <div class="delete-btn-container ml-2"></div>
            </div>
            <div class="p-6 content-area bg-slate-50/30 dark:bg-slate-900/30 min-h-[160px]">
                <div class="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
                    ${Utils.ICONS.SPINNER}
                    <span class="text-sm font-medium animate-pulse">Checking releases...</span>
                </div>
            </div>`;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = "p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors";
        deleteBtn.title = "Remove Repository";
        deleteBtn.innerHTML = Utils.ICONS.TRASH;
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleRemoveRepo(p.owner, p.name);
        });
        el.querySelector('.delete-btn-container').appendChild(deleteBtn);

        return el;
    };

    const renderProject = async (card, forceRefresh = false) => {
        const { owner, name } = card.dataset;
        const content = card.querySelector('.content-area');

        try {
            const { data, stable, pre } = await Github.fetchRepoData(owner, name, forceRefresh);

            if (data.length) card.dataset.latest = new Date(data[0].published_at).getTime();

            if (!stable && !pre) {
                content.innerHTML = `<div class="text-center text-slate-400 py-8 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">No suitable releases found.</div>`;
                return;
            }

            let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">';
            html += stable ? createReleaseCard(stable, 'Latest Stable', false) : '<div class="hidden md:block"></div>';

            if (pre && (!stable || pre.published_at > stable.published_at)) {
                html += createReleaseCard(pre, 'Pre-release', true);
            }
            content.innerHTML = html + '</div>';

        } catch (err) {
            content.innerHTML = `
                <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900/30 flex items-center gap-3">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <strong>Error:</strong> ${err.message}
                </div>`;
        }
    };

    const refreshUI = async (forceRefresh = false) => {
        const container = document.getElementById('projects-container');
        const emptyState = document.getElementById('empty-state');
        const headerAddBtn = document.getElementById('header-add-repo-btn');
        const refreshBtn = document.getElementById('refresh-btn');

        if (refreshBtn) refreshBtn.innerHTML = Utils.ICONS.REFRESH;
        if (refreshBtn && forceRefresh) refreshBtn.querySelector('svg').classList.add('animate-spin');

        if (Store.state.projects.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            container.classList.add('hidden');
            if (headerAddBtn) headerAddBtn.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            container.classList.remove('hidden');
            if (headerAddBtn) headerAddBtn.classList.remove('hidden');

            // Reconciliation
            const existingCards = new Map();
            Array.from(container.children).forEach(card => {
                if (card.dataset.owner && card.dataset.name) {
                    existingCards.set(`${card.dataset.owner}/${card.dataset.name}`, card);
                }
            });

            const activeKeys = new Set();

            const newCardsFragment = document.createDocumentFragment();

            Store.state.projects.forEach(p => {
                const key = `${p.owner}/${p.name}`;
                activeKeys.add(key);

                if (!existingCards.has(key)) {
                    const newCard = createProjectCard(p);
                    newCardsFragment.appendChild(newCard);
                    existingCards.set(key, newCard);
                }
            });

            container.appendChild(newCardsFragment);

            existingCards.forEach((card, key) => {
                if (!activeKeys.has(key)) {
                    card.remove();
                    existingCards.delete(key);
                }
            });

            const cards = Array.from(existingCards.values());

            await runConcurrently(
                cards,
                (card) => renderProject(card, forceRefresh),
                5
            );

            // Pre-calculate latest values to avoid repeated DOM and string-to-number operations during sorting
            const cardsWithLatest = cards.map(card => ({
                card,
                latest: Number(card.dataset.latest) || 0
            }));

            cardsWithLatest.sort((a, b) => b.latest - a.latest);
            const sortedCards = cardsWithLatest.map(item => item.card);

            // Check if the DOM order already matches the sorted order to prevent expensive layout calculations
            const currentChildren = container.children;
            let needsReorder = false;

            if (sortedCards.length !== currentChildren.length) {
                needsReorder = true;
            } else {
                for (let i = 0; i < sortedCards.length; i++) {
                    if (sortedCards[i] !== currentChildren[i]) {
                        needsReorder = true;
                        break;
                    }
                }
            }

            if (needsReorder) {
                const fragment = document.createDocumentFragment();
                sortedCards.forEach(c => fragment.appendChild(c));
                container.appendChild(fragment);
            }
        }

        if (refreshBtn && forceRefresh) setTimeout(() => refreshBtn.querySelector('svg').classList.remove('animate-spin'), 500);
    };

    let themeControlBtns = null;
    const updateThemeControl = (activeTheme) => {
        if (!themeControlBtns) {
            themeControlBtns = document.querySelectorAll('[data-theme-value]');
        }
        themeControlBtns.forEach(btn => {
            const isActive = btn.dataset.themeValue === activeTheme;
            if (isActive) {
                btn.classList.add('bg-white', 'text-slate-900', 'shadow-sm', 'dark:bg-slate-700', 'dark:text-white');
                btn.classList.remove('text-slate-500', 'hover:text-slate-900', 'dark:text-slate-400', 'dark:hover:text-white');
            } else {
                btn.classList.remove('bg-white', 'text-slate-900', 'shadow-sm', 'dark:bg-slate-700', 'dark:text-white');
                btn.classList.add('text-slate-500', 'hover:text-slate-900', 'dark:text-slate-400', 'dark:hover:text-white');
            }
        });
    };

    const applyTheme = (themeName = null) => {
        const targetTheme = themeName || Store.state.theme;
        const html = document.documentElement;
        let isDark = false;

        if (targetTheme === 'device') {
            isDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
        } else {
            isDark = targetTheme === 'dark';
        }

        if (isDark) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }

        updateThemeControl(targetTheme);
    };

    const populateSettings = () => {
        document.getElementById('api-key-input').value = Store.state.apiKey || '';
        document.getElementById('refresh-value-input').value = Store.state.refreshRate;
        document.getElementById('refresh-unit-select').value = Store.state.refreshUnit;
        document.getElementById('new-label-period-input').value = Store.state.newLabelPeriod || 7;

        // Ensure UI reflects current state (store state, not necessarily current DOM state if cancelled)
        updateThemeControl(Store.state.theme);
    };

    const hasUnsavedSettings = () => {
        const apiKeyInput = document.getElementById('api-key-input');
        const refreshValInput = document.getElementById('refresh-value-input');
        const refreshUnitSelect = document.getElementById('refresh-unit-select');
        const newLabelInput = document.getElementById('new-label-period-input');

        if (apiKeyInput.value.trim() !== (Store.state.apiKey || '')) return true;

        let rVal = Number.parseInt(refreshValInput.value);
        if (Number.isNaN(rVal) || rVal < 0) rVal = 0;
        if (rVal !== Store.state.refreshRate) return true;

        if (refreshUnitSelect.value !== Store.state.refreshUnit) return true;

        let lVal = Number.parseInt(newLabelInput.value);
        if (Number.isNaN(lVal) || lVal < 0) lVal = 7;
        const stateLabelPeriod = Store.state.newLabelPeriod === undefined ? 7 : Store.state.newLabelPeriod;
        if (lVal !== stateLabelPeriod) return true;

        const activeBtn = document.querySelector('[data-theme-value].bg-white');
        const currentTheme = activeBtn ? activeBtn.dataset.themeValue : 'device';

        if (currentTheme !== Store.state.theme) return true;

        return false;
    };

    const toggleModal = (id) => {
        const modal = document.getElementById(id);
        if (modal.open) {
            if (id === 'settings-modal' && hasUnsavedSettings()) {
                if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
                    return;
                }
            }

            modal.classList.remove('active');
            setTimeout(() => modal.close(), 200);

            if (id === 'settings-modal') {
                applyTheme(Store.state.theme);
            }
        } else {
            if (id === 'settings-modal') {
                populateSettings();
            }

            modal.showModal();
            Utils.forceReflow(modal);
            modal.classList.add('active');

            if (id === 'add-modal') {
                setTimeout(() => {
                    const input = document.getElementById('new-repo-input');
                    if (input) input.focus();
                }, 50);
            }
        }
    };

    const toggleDetails = (btn, id) => {
        const el = document.getElementById(id);
        const expand = el.classList.toggle('expanded');
        el.style.maxHeight = expand ? el.scrollHeight + 'px' : '0';
        btn.querySelector('svg').style.transform = expand ? 'rotate(180deg)' : 'rotate(0)';
        btn.querySelector('span').textContent = expand ? 'Hide Details' : 'View Assets & Notes';

        const activeClasses = ['bg-indigo-50', 'text-indigo-700', 'border-indigo-200', 'dark:bg-indigo-900/30', 'dark:text-indigo-300', 'dark:border-indigo-800'];
        if(expand) {
            btn.classList.add(...activeClasses);
        } else {
            btn.classList.remove(...activeClasses);
        }
    };

    return { renderProject, createProjectCard, refreshUI, applyTheme, populateSettings, hasUnsavedSettings, toggleModal, toggleDetails };
})();
