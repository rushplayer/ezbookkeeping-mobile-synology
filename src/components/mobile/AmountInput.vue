<template>
    <input class="mobile-amount-input" type="text" inputmode="decimal" enterkeyhint="done"
           autocomplete="off" :aria-label="label" :value="currentValue"
           @input="onInput" @focus="onFocus" @blur="formatValue" @keydown.enter="onEnter" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

import { useI18n } from '@/locales/helpers.ts';
import { ALL_CURRENCIES } from '@/consts/currency.ts';
import { TRANSACTION_MIN_AMOUNT, TRANSACTION_MAX_AMOUNT } from '@/consts/transaction.ts';
import { parseBigDecimal } from '@/lib/numeral.ts';

const props = defineProps<{
    modelValue: number;
    currency: string;
    label: string;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: number): void;
}>();

const {
    getCurrentNumeralSystemType,
    getCurrentDecimalSeparator,
    parseAmountFromLocalizedNumerals,
    formatAmountToLocalizedNumeralsWithoutDigitGrouping
} = useI18n();

const currentValue = ref<string>(getFormattedValue());

function getFormattedValue(): string {
    return formatAmountToLocalizedNumeralsWithoutDigitGrouping(parseBigDecimal(props.modelValue), props.currency);
}

function formatValue(): void {
    currentValue.value = getFormattedValue();
}

function onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const numeralSystem = getCurrentNumeralSystemType();
    const decimalSeparator = getCurrentDecimalSeparator();
    const normalized = numeralSystem.replaceLocalizedDigitsToWesternArabicDigits(input.value).split(decimalSeparator).join('.');
    const fraction = ALL_CURRENCIES[props.currency]?.fraction ?? 2;
    const pattern = fraction === 0 ? /^-?\d*$/ : /^-?\d*(?:\.\d{0,2})?$/;

    if (!pattern.test(normalized)) {
        input.value = currentValue.value;
        return;
    }

    const localized = numeralSystem.replaceWesternArabicDigitsToLocalizedDigits(normalized.split('.').join(decimalSeparator));
    const value = /^-?\.?$/.test(normalized) ? 0 : parseAmountFromLocalizedNumerals(localized);

    if (!Number.isSafeInteger(value) || value < TRANSACTION_MIN_AMOUNT || value > TRANSACTION_MAX_AMOUNT) {
        input.value = currentValue.value;
        return;
    }

    currentValue.value = localized;
    input.value = localized;
    emit('update:modelValue', value);
}

function onFocus(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
}

function onEnter(event: KeyboardEvent): void {
    event.preventDefault();
    (event.target as HTMLInputElement).blur();
}

watch(() => props.modelValue, (value) => {
    const current = parseAmountFromLocalizedNumerals(currentValue.value);

    if (value !== (Number.isFinite(current) ? current : 0)) {
        formatValue();
    }
});

watch(() => props.currency, formatValue);
</script>

<style scoped>
.mobile-amount-input {
    width: 100%;
    min-width: 0;
    height: 53px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
}
</style>
