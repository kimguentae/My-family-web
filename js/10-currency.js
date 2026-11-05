/* =========================
   10. 다중 통화 (환율 조회, 환산, 캐시)
========================= */

/* =========================
   환율 API
   - open.er-api.com (키 불필요, 무료, 161개 통화)
   - 24시간 캐시
========================= */

const FX_API_BASE = "https://open.er-api.com/v6/latest";

const FX_CACHE_TTL_MS = 12 * 60 * 60 * 1000;   /* 12시간 */


/* localStorage 캐시 키 */

const FX_LOCAL_CACHE_KEY = "householdFxCache";


function loadLocalFxCache() {

    try {

        const raw = localStorage.getItem(FX_LOCAL_CACHE_KEY);

        if (!raw) return {};

        const parsed = JSON.parse(raw);

        if (!parsed || typeof parsed !== "object") return {};

        return parsed;

    }

    catch (error) {
        return {};
    }

}


function saveLocalFxCache(cache) {

    try {
        localStorage.setItem(FX_LOCAL_CACHE_KEY, JSON.stringify(cache));
    }
    catch (error) {
        /* ignore */
    }

}


function getCachedRate(fromCode, toCode) {

    /* 1순위: settings.exchangeRates (Supabase 공유) */

    const key = `${fromCode}_${toCode}`;

    const shared = settings.exchangeRates && settings.exchangeRates[key];

    if (
        shared &&
        typeof shared.rate === "number" &&
        shared.rate > 0
    ) {
        return shared;
    }


    /* 2순위: localStorage 캐시 */

    const local = loadLocalFxCache()[key];

    if (
        local &&
        typeof local.rate === "number" &&
        local.rate > 0
    ) {
        return local;
    }


    return null;

}


function setCachedRate(fromCode, toCode, rate, rateDate, source) {

    const key = `${fromCode}_${toCode}`;

    const entry = {
        rate: Number(rate),
        rateDate: rateDate || getTodayString(),
        fetchedAt: Date.now(),
        source: source || "open.er-api.com"
    };


    /* settings.exchangeRates 갱신 */

    if (!settings.exchangeRates) settings.exchangeRates = {};

    settings.exchangeRates[key] = entry;

    saveSettings();


    /* localStorage 캐시 */

    const local = loadLocalFxCache();

    local[key] = entry;

    saveLocalFxCache(local);

}


function isCacheFresh(entry) {

    if (!entry || typeof entry.fetchedAt !== "number") return false;

    return (Date.now() - entry.fetchedAt) < FX_CACHE_TTL_MS;

}


/* =========================
   환율 조회 (비동기)
   - USD 기준 API로 KRW 환율을 가져와
   - 모든 통화 환율을 KRW 기준으로 변환해 캐시
========================= */

async function fetchExchangeRatesForCurrency(currencyCode) {

    if (currencyCode === "KRW") {

        return {
            rate: 1,
            rateDate: getTodayString(),
            source: "fixed"
        };

    }


    /* 1. 캐시 신선하면 그대로 사용 */

    const cached = getCachedRate(currencyCode, "KRW");

    if (cached && isCacheFresh(cached)) {
        return cached;
    }


    /* 2. API 호출 */

    try {

        const url = `${FX_API_BASE}/${currencyCode}`;

        const response = await fetch(url, {
            method: "GET",
            cache: "no-store"
        });


        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }


        const data = await response.json();


        if (data.result !== "success" || !data.rates) {
            throw new Error("Invalid response");
        }


        const krwRate = Number(data.rates.KRW);


        if (!krwRate || krwRate <= 0) {
            throw new Error("KRW rate missing");
        }


        const rateDate = data.time_last_update_utc
            ? new Date(data.time_last_update_utc).toISOString().slice(0, 10)
            : getTodayString();


        const entry = {
            rate: krwRate,
            rateDate: rateDate,
            fetchedAt: Date.now(),
            source: "open.er-api.com"
        };


        setCachedRate(
            currencyCode,
            "KRW",
            krwRate,
            rateDate,
            "open.er-api.com"
        );


        return entry;

    }

    catch (error) {

        console.error("[currency] 환율 조회 실패:", error);


        /* API 실패 → 오래된 캐시라도 사용 */

        const fallback = getCachedRate(currencyCode, "KRW");

        if (fallback) {
            return {
                ...fallback,
                isStale: true
            };
        }


        /* 캐시도 없으면 1:1로 임시 처리 */

        return {
            rate: 1,
            rateDate: getTodayString(),
            source: "fallback-1:1",
            isFallback: true
        };

    }

}


/* =========================
   금액 포맷
========================= */

function formatCurrencyAmount(amount, currencyCode) {

    const meta = getCurrencyMeta(currencyCode);

    const numberValue = Number(amount) || 0;


    /* JPY, VND는 소수점 없이 */

    const isIntegerOnly =
        currencyCode === "JPY" ||
        currencyCode === "VND" ||
        currencyCode === "KRW";


    const formatted = numberValue.toLocaleString("ko-KR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: isIntegerOnly ? 0 : 2
    });


    return formatted;

}


function formatCurrencyWithSymbol(amount, currencyCode) {

    const meta = getCurrencyMeta(currencyCode);

    const formatted = formatCurrencyAmount(amount, currencyCode);


    /* 기호 위치: KRW는 뒤, 나머지는 앞 */

    if (currencyCode === "KRW") {
        return `${formatted}원`;
    }

    if (currencyCode === "VND") {
        return `${formatted}₫`;
    }

    if (currencyCode === "EUR") {
        return `€${formatted}`;
    }

    if (currencyCode === "CNY" || currencyCode === "JPY") {
        return `¥${formatted}`;
    }

    return `${meta.symbol}${formatted}`;

}


/* =========================
   환산
========================= */

function convertToKRW(amount, currencyCode, rate) {

    if (currencyCode === "KRW") {
        return Math.round(Number(amount) || 0);
    }

    const numericRate = Number(rate) || 1;

    return Math.round((Number(amount) || 0) * numericRate);

}


/* =========================
   입력 화면 상태 반영
========================= */

function applyCurrencyToInputUI() {

    const currencyBtn =
        document.getElementById("currencyButton");

    if (!currencyBtn) return;


    const meta = getCurrencyMeta(currentCurrency);

    currencyBtn.innerText = meta.symbol;

    currencyBtn.setAttribute(
        "aria-label",
        meta.name + " 선택"
    );

}


/* =========================
   환율 새로고침 (입력 화면에서 통화 변경 시)
========================= */

async function refreshExchangeRateForCurrentCurrency() {

    if (currentCurrency === "KRW") {

        currentExchangeRate = 1;

        currentRateDate = getTodayString();

        currentRateSource = "fixed";

        updateExchangeRateDisplay();

        return;

    }


    updateExchangeRateDisplay(true);


    const entry = await fetchExchangeRatesForCurrency(currentCurrency);

    currentExchangeRate = entry.rate;

    currentRateDate = entry.rateDate;

    currentRateSource = entry.source;


    updateExchangeRateDisplay(false);

}


/* =========================
   환율 표시 영역 (입력 화면)
========================= */

function updateExchangeRateDisplay(isLoading) {

    const wrap =
        document.getElementById("exchangeRateRow");

    const rateText =
        document.getElementById("exchangeRateText");

    const sourceText =
        document.getElementById("exchangeRateSource");

    const amountInput =
        document.getElementById("amountInput");


    if (!wrap || !rateText) return;


    /* 원화면 숨김 */

    if (currentCurrency === "KRW") {

        wrap.style.display = "none";

        return;

    }


    wrap.style.display = "flex";


    if (isLoading) {

        rateText.innerText = "환율 조회 중...";

        if (sourceText) sourceText.innerText = "";

        return;

    }


    const rawAmount =
        Number(
            (amountInput ? amountInput.value : "").replace(/[^0-9.]/g, "")
        ) || 0;


    const krw = convertToKRW(rawAmount, currentCurrency, currentExchangeRate);


    rateText.innerText =
        `1 ${currentCurrency} = ${Number(currentExchangeRate).toLocaleString("ko-KR", { maximumFractionDigits: 2 })}원 · 약 ${krw.toLocaleString("ko-KR")}원`;


    /* ★ 출처/기준일 표시 안 함 */

    if (sourceText) sourceText.innerText = "";


    wrap.onclick = openExchangeRateEditModal;

}


/* =========================
   환율 수정 모달
========================= */

function openExchangeRateEditModal() {

    if (currentCurrency === "KRW") return;


    const currentValue =
        Number(currentExchangeRate).toLocaleString("ko-KR", {
            maximumFractionDigits: 4
        });


    appPrompt(
        `1 ${currentCurrency} = ? 원`,
        currentValue,
        {
            title: "환율 수정",
            placeholder: "예: 1450",
            formatAmount: true,
            confirmText: "적용"
        }
    ).then(function(input) {

        if (input === null) return;


        const numeric = Number(input.replace(/[^0-9.]/g, ""));


        if (!numeric || numeric <= 0) {
            appAlert("올바른 환율을 입력해주세요.");
            return;
        }


        currentExchangeRate = numeric;

        currentRateDate = getTodayString();

        currentRateSource = "manual";


        updateExchangeRateDisplay(false);

    });

}