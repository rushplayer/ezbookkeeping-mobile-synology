<template>
    <f7-popup tablet-fullscreen class="two-column-selection-popup" :opened="show"
              @popup:open="onPopupOpen" @popup:closed="onPopupClosed">
        <f7-page :page-content="false" :with-subnavbar="enableFilter">
            <f7-navbar>
                <f7-nav-left>
                    <f7-link popup-close icon-f7="xmark" :aria-label="tt('Close')"></f7-link>
                </f7-nav-left>
                <f7-nav-title :title="tt('Account')"></f7-nav-title>
                <f7-subnavbar :inner="false" v-if="enableFilter">
                    <f7-searchbar ref="searchbar" custom-search
                                  :value="filterContent"
                                  :placeholder="filterPlaceholder"
                                  :disable-button="false"
                                  @input="filterContent = $event.target.value">
                    </f7-searchbar>
                </f7-subnavbar>
            </f7-navbar>
            <f7-page-content>
                <div class="grid grid-gap" :class="{ 'grid-cols-2': filteredItems && filteredItems.length }">
                    <div>
                        <div class="primary-list-container">
                            <f7-list dividers class="primary-list no-margin-vertical">
                                <f7-list-item link="#" no-chevron
                                              :class="{ 'primary-list-item-selected': item === selectedPrimaryItem }"
                                              :value="primaryValueField ? item[primaryValueField] : item"
                                              :title="primaryTitleField ? ti(item[primaryTitleField] as string, !!primaryTitleI18n) : ''"
                                              :header="primaryHeaderField ? ti(item[primaryHeaderField] as string, !!primaryHeaderI18n) : ''"
                                              :footer="primaryFooterField ? ti(item[primaryFooterField] as string, !!primaryFooterI18n) : ''"
                                              :key="primaryKeyField ? item[primaryKeyField] : item"
                                              v-for="item in filteredItems"
                                              @click="onPrimaryItemClicked(item)">
                                    <template #media>
                                        <ItemIcon :icon-type="getIconType(primaryIconType, primaryIconTypeField ? item[primaryIconTypeField] : undefined)"
                                                  :icon-id="primaryIconField ? item[primaryIconField] : undefined"
                                                  :color="primaryColorField ? item[primaryColorField] : undefined"></ItemIcon>
                                    </template>
                                    <template #after>
                                        <f7-icon class="list-item-showing icon-with-direction" f7="chevron_right" v-if="item === selectedPrimaryItem"></f7-icon>
                                    </template>
                                </f7-list-item>
                                <f7-list-item v-if="!filteredItems || !filteredItems.length"
                                                :title="filterNoItemsText"></f7-list-item>
                            </f7-list>
                        </div>
                    </div>
                    <div v-show="filteredItems && filteredItems.length">
                        <div class="secondary-list-container">
                            <f7-list dividers class="secondary-list no-margin-vertical" v-if="selectedPrimaryItem && primarySubItemsField && (selectedPrimaryItem as Record<string, unknown>)[primarySubItemsField]">
                                <f7-list-item link="#" no-chevron
                                              :class="{ 'secondary-list-item-selected': isSecondarySelected(subItem) }"
                                              :value="secondaryValueField ? subItem[secondaryValueField] : subItem"
                                              :title="secondaryTitleField ? ti(subItem[secondaryTitleField] as string, !!secondaryTitleI18n) : ''"
                                              :header="secondaryHeaderField ? ti(subItem[secondaryHeaderField] as string, !!secondaryHeaderI18n) : ''"
                                              :footer="secondaryFooterField ? ti(subItem[secondaryFooterField] as string, !!secondaryFooterI18n) : ''"
                                              :key="secondaryKeyField ? subItem[secondaryKeyField] : subItem"
                                              v-for="subItem in filteredSubItems"
                                              @click="onSecondaryItemClicked(subItem)">
                                    <template #media>
                                        <ItemIcon :icon-type="getIconType(secondaryIconType, secondaryIconTypeField ? subItem[secondaryIconTypeField] : undefined)"
                                                  :icon-id="secondaryIconField ? subItem[secondaryIconField] : undefined"
                                                  :color="secondaryColorField ? subItem[secondaryColorField] : undefined"></ItemIcon>
                                    </template>
                                    <template #after>
                                        <f7-icon class="list-item-checked-icon" f7="checkmark_alt" v-if="isSecondarySelected(subItem)"></f7-icon>
                                    </template>
                                </f7-list-item>
                            </f7-list>
                        </div>
                    </div>
                </div>
            </f7-page-content>
        </f7-page>
    </f7-popup>
</template>

<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue';
import type { Searchbar } from 'framework7/types';

import { useI18n } from '@/locales/helpers.ts';
import { type CommonTwoColumnListItemSelectionProps, useTwoColumnListItemSelectionBase } from '@/components/base/TwoColumnListItemSelectionBase.ts';

import { getIconType } from '@/lib/icon.ts';
import { scrollToSelectedItem } from '@/lib/ui/common.ts';
import type { Framework7Dom } from '@/lib/ui/mobile.ts';

interface MobileTwoColumnListItemSelectionProps extends CommonTwoColumnListItemSelectionProps {
    show: boolean;
}

const props = defineProps<MobileTwoColumnListItemSelectionProps>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: unknown): void;
    (e: 'update:show', value: boolean): void;
}>();

const { tt, ti } = useI18n();

const {
    filterContent,
    filteredItems,
    getFilteredSubItems,
    getCurrentPrimaryValueBySecondaryValue,
    isSecondaryValueSelected,
    getSelectedPrimaryItem,
    updateCurrentPrimaryValue,
    updateCurrentSecondaryValue
} = useTwoColumnListItemSelectionBase(props);

const searchbar = useTemplateRef<Searchbar.Searchbar>('searchbar');

const currentPrimaryValue = ref<unknown>(getCurrentPrimaryValueBySecondaryValue(props.modelValue));
const currentSecondaryValue = ref<unknown>(props.modelValue);

const filteredSubItems = computed<Record<string, unknown>[]>(() => getFilteredSubItems(selectedPrimaryItem.value));
const selectedPrimaryItem = computed<unknown>(() => {
    const selectedItem = getSelectedPrimaryItem(currentPrimaryValue.value);

    return filteredItems.value.includes(selectedItem as Record<string, unknown>) ? selectedItem : filteredItems.value[0];
});

function isSecondarySelected(subItem: unknown): boolean {
    return isSecondaryValueSelected(currentSecondaryValue.value, subItem);
}

function close(): void {
    emit('update:show', false);
}

function onPrimaryItemClicked(item: unknown): void {
    updateCurrentPrimaryValue(currentPrimaryValue, item);
}

function onSecondaryItemClicked(subItem: unknown): void {
    updateCurrentSecondaryValue(currentSecondaryValue, subItem);
    emit('update:modelValue', currentSecondaryValue.value);
    close();
}

function onPopupOpen(event: { $el: Framework7Dom }): void {
    currentPrimaryValue.value = getCurrentPrimaryValueBySecondaryValue(props.modelValue);
    currentSecondaryValue.value = props.modelValue;
    scrollToSelectedItem(event.$el[0], '.primary-list-container', '.primary-list-container', 'li.primary-list-item-selected');
    scrollToSelectedItem(event.$el[0], '.secondary-list-container', '.secondary-list-container', 'li.secondary-list-item-selected');
}

function onPopupClosed(): void {
    close();
    filterContent.value = '';
    searchbar.value?.clear();
}
</script>

<style>
.two-column-selection-popup .page-content {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.two-column-selection-popup .page-content > .grid {
    flex: 1;
    min-height: 0;
}

.two-column-selection-popup .primary-list-container,
.two-column-selection-popup .secondary-list-container {
    height: 100%;
    overflow-y: auto;
}

.two-column-selection-popup .grid > div {
    min-height: 0;
}

.two-column-selection-popup .item-title {
    white-space: normal;
}

.primary-list.list .item-inner {
    padding-inline-end: 6px;
}

.secondary-list.list .item-content {
    padding-inline-start: 0;
}
</style>
