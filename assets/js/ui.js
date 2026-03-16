globalThis.App = globalThis.App || {};

globalThis.App.UI = (function() {
    const Store = globalThis.App.Store;
    const Utils = globalThis.App.Utils;
    const Github = globalThis.App.Github;

    // Cache static DOM elements
    const apiKeyInput = document.getElementById('api-key-input');
    const refreshValInput = document.getElementById('refresh-value-input');
    const refreshUnitSelect = document.getElementById('refresh-unit-select');
    const newLabelInput = document.getElementById('new-label-period-input');
    const projectsContainer = document.getElementById('projects-container');
    const emptyStateContainer = document.getElementById('empty-state');
    const headerAddRepoBtn = document.getElementById('header-add-repo-btn');
    const refreshBtnElement = document.getElementById('refresh-btn');

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
        if (!html) return document.createDocumentFragment();
        // Sanitize and parse directly to DocumentFragment (avoids DOMParser overhead)
        const fragment = globalThis.DOMPurify.sanitize(html, { RETURN_DOM_FRAGMENT: true });

        for (const el of fragment.querySelectorAll('details')) {
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
        }

        return fragment;
    };

    const createAssetList = (assets) => {
        if (!assets?.length) {
            const p = document.createElement('p');
            p.className = 'text-sm text-slate-400 italic py-1';
            p.textContent = 'No attached assets.';
            return p;
        }

        const ul = document.createElement('ul');
        ul.className = 'space-y-2 mt-3';

        const fragment = document.createDocumentFragment();

        for (const a of assets) {
            const li = document.createElement('li');

            const link = document.createElement('a');
            link.href = a.browser_download_url;
            link.className = 'group flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all text-sm';

            const div = document.createElement('div');
            div.className = 'flex items-center overflow-hidden';

            const iconDiv = document.createElement('div');
            iconDiv.className = 'mr-3 flex-shrink-0';
            iconDiv.innerHTML = Utils.ICONS.DOWNLOAD;
            div.appendChild(iconDiv);

            const nameSpan = document.createElement('span');
            nameSpan.className = 'truncate font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors';
            nameSpan.textContent = a.name;
            div.appendChild(nameSpan);

            link.appendChild(div);

            const sizeSpan = document.createElement('span');
            sizeSpan.className = 'ml-3 text-xs font-mono text-slate-400 whitespace-nowrap bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700 shadow-sm';
            sizeSpan.textContent = `${(a.size / 1048576).toFixed(2)} MB`;
            link.appendChild(sizeSpan);

            li.appendChild(link);
            fragment.appendChild(li);
        }

        ul.appendChild(fragment);
        return ul;
    };

    const createReleaseCard = (release, label, isPre, isFresh) => {
        const labelColor = isPre ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400';

        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-all hover:shadow-md h-full';

        const topSection = document.createElement('div');
        topSection.className = 'p-5 flex-grow';

        const headerRow = document.createElement('div');
        headerRow.className = 'flex justify-between items-start mb-4';

        const leftCol = document.createElement('div');
        leftCol.className = 'min-w-0 flex-1 mr-2';

        const labelSpan = document.createElement('span');
        labelSpan.className = `text-xs font-bold uppercase tracking-widest ${labelColor} mb-1 block`;
        labelSpan.textContent = label;
        leftCol.appendChild(labelSpan);

        const titleRow = document.createElement('div');
        titleRow.className = 'flex items-center gap-2 flex-wrap';

        const titleLink = document.createElement('a');
        titleLink.href = release.html_url;
        titleLink.target = '_blank';
        titleLink.className = 'group flex items-center text-lg font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors break-all';
        titleLink.textContent = release.tag_name;
        titleRow.appendChild(titleLink);

        if (isFresh) {
            const badgeBase = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide shadow-sm';
            const stableBadge = 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-500/30';
            const preBadge = 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-500/30';
            const freshBadgeStyle = isPre ? preBadge : stableBadge;

            const badge = document.createElement('span');
            badge.className = `${badgeBase} ${freshBadgeStyle}`;
            badge.textContent = 'New';
            titleRow.appendChild(badge);
        }

        leftCol.appendChild(titleRow);
        headerRow.appendChild(leftCol);

        const dateSpan = document.createElement('span');
        dateSpan.className = 'text-xs font-medium text-slate-400 whitespace-nowrap bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700';
        dateSpan.textContent = Utils.formatDate(release.published_at);
        headerRow.appendChild(dateSpan);

        topSection.appendChild(headerRow);

        const toggleBtn = document.createElement('button');
        toggleBtn.dataset.action = 'toggle-details';
        toggleBtn.dataset.target = `d-${release.id}`;
        toggleBtn.className = 'w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500';

        const btnText = document.createElement('span');
        btnText.textContent = 'View Assets & Notes';
        toggleBtn.appendChild(btnText);
        toggleBtn.insertAdjacentHTML('beforeend', Utils.ICONS.CHEVRON);

        topSection.appendChild(toggleBtn);
        card.appendChild(topSection);

        const detailsSection = document.createElement('div');
        detailsSection.id = `d-${release.id}`;
        detailsSection.className = 'release-details border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-xl';

        const detailsContent = document.createElement('div');
        detailsContent.className = 'p-5';

        const assetsHeader = document.createElement('h4');
        assetsHeader.className = 'text-xs font-bold uppercase tracking-wider text-slate-400 mb-3';
        assetsHeader.textContent = 'Assets';
        detailsContent.appendChild(assetsHeader);

        detailsContent.appendChild(createAssetList(release.assets));

        const notesHeader = document.createElement('h4');
        notesHeader.className = 'text-xs font-bold uppercase tracking-wider text-slate-400 mt-6 mb-3';
        notesHeader.textContent = 'Release Notes';
        detailsContent.appendChild(notesHeader);

        const notesContainer = document.createElement('div');
        notesContainer.className = 'prose prose-sm prose-slate dark:prose-invert max-w-none break-words bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm';

        if (release.body) {
            notesContainer.appendChild(flattenDetailsTags(globalThis.marked.parse(release.body)));
        } else {
            const noNotes = document.createElement('p');
            noNotes.className = 'text-slate-400 italic';
            noNotes.textContent = 'No release notes.';
            notesContainer.appendChild(noNotes);
        }

        detailsContent.appendChild(notesContainer);
        detailsSection.appendChild(detailsContent);
        card.appendChild(detailsSection);

        return card;
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

        const header = document.createElement('div');
        header.className = 'px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-white dark:bg-slate-800';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'text-slate-800 dark:text-slate-200 p-1.5 bg-slate-50 dark:bg-slate-700 rounded-md border border-slate-200/60 dark:border-slate-600';
        iconDiv.innerHTML = Utils.ICONS.GITHUB;
        header.appendChild(iconDiv);

        const h2 = document.createElement('h2');
        h2.className = 'text-lg font-semibold tracking-tight break-all flex-grow';

        const link = document.createElement('a');
        link.href = `https://github.com/${Utils.escapeAttr(p.owner)}/${Utils.escapeAttr(p.name)}`;
        link.target = '_blank';
        link.className = 'text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors';
        link.textContent = p.name;
        h2.appendChild(link);
        header.appendChild(h2);

        const ownerSpan = document.createElement('span');
        ownerSpan.className = 'text-xs text-slate-400 font-mono ml-auto bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded hidden sm:inline-block self-center';
        ownerSpan.textContent = p.owner;
        header.appendChild(ownerSpan);

        const deleteContainer = document.createElement('div');
        deleteContainer.className = 'delete-btn-container ml-2';
        header.appendChild(deleteContainer);

        el.appendChild(header);

        const contentArea = document.createElement('div');
        contentArea.className = 'p-6 content-area bg-slate-50/30 dark:bg-slate-900/30 min-h-[160px]';
        contentArea.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
                ${Utils.ICONS.SPINNER}
                <span class="text-sm font-medium animate-pulse">Checking releases...</span>
            </div>`;
        el.appendChild(contentArea);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = "p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors";
        deleteBtn.title = "Remove Repository";
        deleteBtn.innerHTML = Utils.ICONS.TRASH;
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleRemoveRepo(p.owner, p.name);
        });
        deleteContainer.appendChild(deleteBtn);

        return el;
    };

    const renderProject = async (card, forceRefresh = false) => {
        const { owner, name } = card.dataset;
        const content = card.querySelector('.content-area');

        try {
            const { data, stable, pre } = await Github.fetchRepoData(owner, name, forceRefresh);

            if (data.length) card.dataset.latest = new Date(data[0].published_at).getTime();

            // Calculate render signature to avoid redundant DOM updates
            const freshMs = (Store.state.newLabelPeriod || 7) * 24 * 3600 * 1000;
            const now = Date.now();

            const getFreshness = (release) => {
                if (!release) return false;
                return (now - new Date(release.published_at).getTime()) <= freshMs;
            };

            const newSignature = {
                stableId: stable?.id,
                preId: pre?.id,
                stableFresh: getFreshness(stable),
                preFresh: getFreshness(pre),
                error: null
            };

            const prevSignature = card._renderCache;

            if (prevSignature &&
                prevSignature.stableId === newSignature.stableId &&
                prevSignature.preId === newSignature.preId &&
                prevSignature.stableFresh === newSignature.stableFresh &&
                prevSignature.preFresh === newSignature.preFresh &&
                prevSignature.error === null) {
                return;
            }

            card._renderCache = newSignature;

            if (!stable && !pre) {
                content.innerHTML = `<div class="text-center text-slate-400 py-8 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">No suitable releases found.</div>`;
                return;
            }

            content.innerHTML = '';
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 items-start';

            if (stable) {
                grid.appendChild(createReleaseCard(stable, 'Latest Stable', false, newSignature.stableFresh));
            } else {
                const spacer = document.createElement('div');
                spacer.className = 'hidden md:block';
                grid.appendChild(spacer);
            }

            if (pre && (!stable || pre.published_at > stable.published_at)) {
                grid.appendChild(createReleaseCard(pre, 'Pre-release', true, newSignature.preFresh));
            }
            content.appendChild(grid);

        } catch (err) {
            const errorSignature = { error: err.message };
            const prevSignature = card._renderCache;

            if (prevSignature && prevSignature.error === errorSignature.error) {
                return;
            }

            card._renderCache = errorSignature;

            content.innerHTML = `
                <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900/30 flex items-center gap-3">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <strong>Error:</strong> ${err.message}
                </div>`;
        }
    };

    const updateRefreshIcon = (btn, forceRefresh) => {
        if (!btn) return;
        btn.innerHTML = Utils.ICONS.REFRESH;
        if (forceRefresh) {
            const svg = btn.querySelector('svg');
            if (svg) svg.classList.add('animate-spin');
        }
    };

    const updateEmptyState = (container, emptyState, headerAddBtn) => {
        const isEmpty = Store.state.projects.length === 0;
        if (isEmpty) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            container.classList.add('hidden');
            if (headerAddBtn) headerAddBtn.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            container.classList.remove('hidden');
            if (headerAddBtn) headerAddBtn.classList.remove('hidden');
        }
        return isEmpty;
    };

    const reconcileCards = (container) => {
        const existingCards = new Map();
        for (const card of container.children) {
            if (card.dataset.owner && card.dataset.name) {
                existingCards.set(`${card.dataset.owner}/${card.dataset.name}`, card);
            }
        }

        const activeKeys = new Set();
        const newCardsFragment = document.createDocumentFragment();

        for (const p of Store.state.projects) {
            const key = `${p.owner}/${p.name}`;
            activeKeys.add(key);

            if (!existingCards.has(key)) {
                const newCard = createProjectCard(p);
                newCardsFragment.appendChild(newCard);
                existingCards.set(key, newCard);
            }
        }

        container.appendChild(newCardsFragment);

        for (const [key, card] of existingCards.entries()) {
            if (!activeKeys.has(key)) {
                card.remove();
                existingCards.delete(key);
            }
        }

        return Array.from(existingCards.values());
    };

    const sortAndReorderCards = (container, cards) => {
        cards.sort((a, b) => (Number(b.dataset.latest) || 0) - (Number(a.dataset.latest) || 0));

        const currentChildren = container.children;
        const needsReorder = cards.length !== currentChildren.length ||
                             cards.some((card, i) => card !== currentChildren[i]);

        if (needsReorder) {
            const fragment = document.createDocumentFragment();
            for (const c of cards) {
                fragment.appendChild(c);
            }
            container.appendChild(fragment);
        }
    };

    const refreshUI = async (forceRefresh = false) => {
        updateRefreshIcon(refreshBtnElement, forceRefresh);

        if (!updateEmptyState(projectsContainer, emptyStateContainer, headerAddRepoBtn)) {
            const cards = reconcileCards(projectsContainer);

            await runConcurrently(
                cards,
                (card) => renderProject(card, forceRefresh),
                5
            );

            sortAndReorderCards(projectsContainer, cards);
        }

        if (refreshBtnElement && forceRefresh) {
            setTimeout(() => {
                const svg = refreshBtnElement.querySelector('svg');
                if (svg) svg.classList.remove('animate-spin');
            }, 500);
        }
    };

    let themeControlBtns = null;
    const updateThemeControl = (activeTheme) => {
        if (!themeControlBtns) {
            themeControlBtns = document.querySelectorAll('[data-theme-value]');
        }
        for (const btn of themeControlBtns) {
            const isActive = btn.dataset.themeValue === activeTheme;
            if (isActive) {
                btn.classList.add('bg-white', 'text-slate-900', 'shadow-sm', 'dark:bg-slate-700', 'dark:text-white');
                btn.classList.remove('text-slate-500', 'hover:text-slate-900', 'dark:text-slate-400', 'dark:hover:text-white');
            } else {
                btn.classList.remove('bg-white', 'text-slate-900', 'shadow-sm', 'dark:bg-slate-700', 'dark:text-white');
                btn.classList.add('text-slate-500', 'hover:text-slate-900', 'dark:text-slate-400', 'dark:hover:text-white');
            }
        }
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
        apiKeyInput.value = Store.state.apiKey || '';
        refreshValInput.value = Store.state.refreshRate;
        refreshUnitSelect.value = Store.state.refreshUnit;
        newLabelInput.value = Store.state.newLabelPeriod || 7;

        // Reset theme controls to stored state
        updateThemeControl(Store.state.theme);
    };

    const hasUnsavedSettings = () => {
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
