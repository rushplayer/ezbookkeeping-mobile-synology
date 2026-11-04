<template>
    <f7-popup tablet-fullscreen :opened="show" @popup:open="onPopupOpen" @popup:closed="onPopupClosed">
        <f7-page :page-content="false" :with-subnavbar="enableFilter">
            <f7-navbar>
                <f7-nav-left>
                    <f7-link popup-close icon-f7="xmark" :aria-label="tt('Close')"></f7-link>
                </f7-nav-left>
                <f7-nav-title :title="tt('Category')"></f7-nav-title>
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
                <f7-list class="no-margin-top no-margin-bottom" v-if="!filteredItems || !filteredItems.length">
                    <f7-list-item :title="filterNoItemsText"></f7-list-item>
                </f7-list>
                <f7-treeview class="tree-view-selection-treeview">
                    <f7-treeview-item item-toggle
                                      :opened="isPrimaryItemHasSecondaryValue(item)"
                                      :label="ti((primaryTitleField ? item[primaryTitleField] : item) as string, !!primaryTitleI18n)"
                                      :key="primaryKeyField ? item[primaryKeyField] : item"
                                      v-for="item in filteredItems">
                        <template #media>
                            <ItemIcon :icon-type="getIconType(primaryIconType, primaryIconTypeField ? item[primaryIconTypeField] : undefined)"
                                      :icon-id="item[primaryIconField]"
                                      :color="primaryColorField ? item[primaryColorField] : undefined" v-if="primaryIconField"></ItemIcon>
                        </template>

                        <f7-treeview-item selectable
                                          :selected="isSecondaryValueSelected(currentValue, subItem)"
                                          :label="ti((secondaryTitleField ? (subItem as Record<string, unknown>)[secondaryTitleField] : subItem) as string, !!secondaryTitleI18n)"
                                          :key="secondaryKeyField ? (subItem as Record<string, unknown>)[secondaryKeyField] : subItem"
                                          v-for="subItem in getFilteredSubItems(item)"
                                          @click="onSecondaryItemClicked(subItem)">
                            <template #media>
                                <ItemIcon :icon-type="getIconType(secondaryIconType, secondaryIconTypeField ? (subItem as Record<string, unknown>)[secondaryIconTypeField] : undefined)"
                                          :icon-id="(subItem as Record<string, unknown>)[secondaryIconField]"
                                          :color="secondaryColorField ? (subItem as Record<string, unknown>)[secondaryColorField] : undefined" v-if="secondaryIconField"></ItemIcon>
                            </template>
                        </f7-treeview-item>
                    </f7-treeview-item>
                </f7-treeview>
            </f7-page-content>
        </f7-page>
    </f7-popup>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import type { Searchbar } from 'framework7/types';

import { useI18n } from '@/locales/helpers.ts';
import { type TwoLevelItemSelectionBaseProps, useTwoLevelItemSelectionBase } from '@/components/base/TwoLevelItemSelectionBase.ts';

import { NormalizedText } from '@/core/text.ts';

import { getIconType } from '@/lib/icon.ts';
import { scrollToSelectedItem } from '@/lib/ui/common.ts';
import type { Framework7Dom } from '@/lib/ui/mobile.ts';

interface MobileTwoLevelItemSelectionBaseProps extends TwoLevelItemSelectionBaseProps {
    show: boolean;
}

const props = defineProps<MobileTwoLevelItemSelectionBaseProps>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: unknown): void;
    (e: 'update:show', value: boolean): void;
}>();

const { tt, ti } = useI18n();

const {
    filterContent,
    filteredItems,
    getFilteredSubItems,
    isSecondaryValueSelected,
    updateCurrentSecondaryValue
} = useTwoLevelItemSelectionBase(props);

const searchbar = useTemplateRef<Searchbar.Searchbar>('searchbar');

const currentValue = ref<unknown>(props.modelValue);

function isPrimaryItemHasSecondaryValue(primaryItem: Record<string, unknown>): boolean {
    const subItems = primaryItem[props.primarySubItemsField] as unknown[];

    if (subItems.length < 1) {
        return false;
    }

    const normalizedFilterContent = NormalizedText.normalizeForSearch(filterContent.value ?? '');

    for (const secondaryItem of subItems) {
        if (props.secondaryHiddenField && (secondaryItem as Record<string, unknown>)[props.secondaryHiddenField]) {
            continue;
        }

        if (props.primaryTitleField && normalizedFilterContent) {
            const title = ti((secondaryItem as Record<string, unknown>)[props.primaryTitleField] as string, !!props.primaryTitleI18n);

            if (NormalizedText.normalizeForSearch(title).indexOf(normalizedFilterContent) >= 0) {
                return true;
            }
        }

        if (props.secondaryValueField && (secondaryItem as Record<string, unknown>)[props.secondaryValueField] === currentValue.value) {
            return true;
        } else if (!props.secondaryValueField && secondaryItem === currentValue.value) {
            return true;
        }
    }

    return false;
}

function onSecondaryItemClicked(subItem: unknown): void {
    updateCurrentSecondaryValue(currentValue, subItem);
    emit('update:modelValue', currentValue.value);
    emit('update:show', false);
}

function onPopupOpen(event: { $el: Framework7Dom }): void {
    currentValue.value = props.modelValue;
    scrollToSelectedItem(event.$el[0], '.page-content', '.page-content', '.treeview-item > .treeview-item-selected');
}

function onPopupClosed(): void {
    emit('update:show', false);
    filterContent.value = '';
    searchbar.value?.clear();
}
</script>

<style>
.tree-view-selection-treeview {
    position: relative;
}
</style>
