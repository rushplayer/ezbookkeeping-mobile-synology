import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { getApplicationSettings, updateApplicationSettingsValue } from '@/lib/settings.ts';

describe('amount picture indicator preference upgrade', () => {
    beforeEach(() => {
        const data = new Map<string, string>();
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => data.get(key) ?? null,
            setItem: (key: string, value: string) => data.set(key, value)
        });
    });

    afterEach(() => vi.unstubAllGlobals());

    it('enables the indicator for existing settings while retaining other preferences', () => {
        localStorage.setItem('ebk_app_settings', JSON.stringify({
            showPictureIndicatorInTransactionListPage: false,
            showTagInTransactionListPage: false, theme: 'dark', itemsCountInTransactionListPage: 50
        }));

        expect(getApplicationSettings()).toMatchObject({
            showPictureIndicatorInTransactionListPage: true,
            showTagInTransactionListPage: false, theme: 'dark', itemsCountInTransactionListPage: 50
        });
    });

    it('retains a later choice to disable the indicator', () => {
        getApplicationSettings();
        updateApplicationSettingsValue('showPictureIndicatorInTransactionListPage', false);
        expect(getApplicationSettings().showPictureIndicatorInTransactionListPage).toBe(false);
    });

    it('enables the indicator for a new browser', () => {
        expect(getApplicationSettings().showPictureIndicatorInTransactionListPage).toBe(true);
    });
});
