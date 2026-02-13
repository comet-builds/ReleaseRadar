globalThis.App = globalThis.App || {};

globalThis.App.Utils = (function() {
    const ICONS = {
        GITHUB: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`,
        SPINNER: `<svg class="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`,
        DOWNLOAD: `<svg class="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>`,
        CHEVRON: `<svg class="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>`,
        TRASH: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`,
        REFRESH: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>`,
        TOAST_ERROR: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        TOAST_SUCCESS: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L9 17l10-10"/></svg>`
    };

    const forceReflow = (el) => el.offsetWidth;

    const escapeAttr = (str) => str.replaceAll('"', '&quot;');

    // Shared formatters for performance
    const dateFormatter = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

    const formatDate = (str) => {
        const date = new Date(str);
        if (Number.isNaN(date.getTime())) {
            return 'Invalid Date • Invalid Date';
        }
        return dateFormatter.format(date) + ' • ' + timeFormatter.format(date);
    };

    const showToast = (message, type = 'success') => {
        const container = document.getElementById('toast-container');

        if (container?.hidePopover && container?.showPopover) {
            container.hidePopover();
            container.showPopover();
        }

        const el = document.createElement('div');

        let classes = "pointer-events-auto bg-white dark:bg-slate-800 border shadow-lg rounded-lg p-4 flex items-center gap-3 transition-all transform translate-y-2 opacity-0 max-w-sm w-full";

        if (type === 'error') {
            classes += " border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400";
        } else {
            classes += " border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400";
        }

        el.className = classes;

        const icon = type === 'error' ? ICONS.TOAST_ERROR : ICONS.TOAST_SUCCESS;

        el.innerHTML = `${icon}<span class="text-sm font-medium break-words flex-grow">${message}</span>`;

        container.appendChild(el);

        requestAnimationFrame(() => {
            el.classList.remove('translate-y-2', 'opacity-0');
        });

        setTimeout(() => {
            el.classList.add('translate-y-2', 'opacity-0');
            el.addEventListener('transitionend', () => el.remove());
        }, 4000);
    };

    return { ICONS, forceReflow, escapeAttr, formatDate, showToast };
})();
