/* =========================
   01. 설정 및 전역 상태
========================= */

/* =========================
   통화 정의 (다중 통화)
========================= */

var CURRENCY_LIST = [
    { code: "KRW", symbol: "₩",  label: "원",   flag: "🇰🇷", name: "대한민국 원" },
    { code: "USD", symbol: "$",  label: "달러", flag: "🇺🇸", name: "미국 달러" },
    { code: "JPY", symbol: "¥",  label: "엔",   flag: "🇯🇵", name: "일본 엔" },
    { code: "EUR", symbol: "€",  label: "유로", flag: "🇪🇺", name: "유로" },
    { code: "CNY", symbol: "¥",  label: "위안", flag: "🇨🇳", name: "중국 위안" },
    { code: "VND", symbol: "₫",  label: "동",   flag: "🇻🇳", name: "베트남 동" },
    { code: "THB", symbol: "฿",  label: "바트", flag: "🇹🇭", name: "태국 바트" }
];


function getCurrencyMeta(code) {

    return CURRENCY_LIST.find(c => c.code === code) || CURRENCY_LIST[0];

}


/* =========================
   날짜 유틸
========================= */

function getTodayString() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


const SUPABASE_URL =
    "https://lyassaicxiixzyqlewhx.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YXNzYWljeGlpeHp5cWxld2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NjEwMDMsImV4cCI6MjEwNTAzNzAwM30.pHAYhGkx-NE9-_Ep44uKxADRyR5qR--UsYlIuwFKalw";


var supabaseClient =
    typeof window !== "undefined" &&
    window.supabase &&
    typeof window.supabase.createClient === "function"
        ? window.supabase.createClient(
              SUPABASE_URL,
              SUPABASE_ANON_KEY,
              {
                  auth: {
                      persistSession: true,
                      autoRefreshToken: true,
                      detectSessionInUrl: true,
                      storage: window.localStorage,
                      storageKey: "household-auth-token"
                  }
              }
          )
        : null;



/* =========================
   전역 상태
========================= */

var currentUser = null;

var syncUserDataTimer = null;

var isLoadingUserData = false;

var authListenerRegistered = false;

var isSigningOut = false;


/* =========================
   로컬 데이터 로드
========================= */

var transactions = JSON.parse(
    localStorage.getItem("householdTransactions") || "[]"
);


var settings = JSON.parse(
    localStorage.getItem("householdSettings") || "null"
);


if (!settings || typeof settings !== "object") {

    settings = {

        memoEnabled: true,
        paymentEnabled: true,
        categoryEnabled: true,
        subjectEnabled: true,

        memoExpenseEnabled: true,
        memoIncomeEnabled: true,

        paymentExpenseEnabled: true,
        paymentIncomeEnabled: true,

        categoryExpenseEnabled: true,
        categoryIncomeEnabled: true,

        subjectExpenseEnabled: true,
        subjectIncomeEnabled: true,

        analysisCategoryEnabled: true,
        analysisPaymentEnabled: true,
        analysisSubjectEnabled: true,

        analysisGroupOrder: [
            "monthlyChart",
            "category",
            "payment",
            "subject"
        ],

        monthlyChartEnabled: true,

        budgets: {}

    };

}


/* 기존 설정값 이어받기 */

if (settings.memoEnabled === undefined) settings.memoEnabled = true;
if (settings.paymentEnabled === undefined) settings.paymentEnabled = true;
if (settings.categoryEnabled === undefined) settings.categoryEnabled = true;
if (settings.subjectEnabled === undefined) settings.subjectEnabled = true;


if (settings.memoExpenseEnabled === undefined)
    settings.memoExpenseEnabled = settings.memoEnabled !== false;
if (settings.memoIncomeEnabled === undefined)
    settings.memoIncomeEnabled = settings.memoEnabled !== false;

if (settings.paymentExpenseEnabled === undefined)
    settings.paymentExpenseEnabled = settings.paymentEnabled !== false;
if (settings.paymentIncomeEnabled === undefined)
    settings.paymentIncomeEnabled = settings.paymentEnabled !== false;

if (settings.categoryExpenseEnabled === undefined)
    settings.categoryExpenseEnabled = settings.categoryEnabled !== false;
if (settings.categoryIncomeEnabled === undefined)
    settings.categoryIncomeEnabled = settings.categoryEnabled !== false;

if (settings.subjectExpenseEnabled === undefined)
    settings.subjectExpenseEnabled = settings.subjectEnabled !== false;
if (settings.subjectIncomeEnabled === undefined)
    settings.subjectIncomeEnabled = settings.subjectEnabled !== false;

if (settings.analysisCategoryEnabled === undefined) settings.analysisCategoryEnabled = true;
if (settings.analysisPaymentEnabled === undefined) settings.analysisPaymentEnabled = true;
if (settings.analysisSubjectEnabled === undefined) settings.analysisSubjectEnabled = true;
if (settings.monthlyChartEnabled === undefined) settings.monthlyChartEnabled = true;

if (
    !settings.budgets ||
    typeof settings.budgets !== "object" ||
    Array.isArray(settings.budgets)
) {
    settings.budgets = {};
}


/* =========================
   분석 그룹 순서 마이그레이션 (balance + currency)
========================= */

const validAnalysisGroupKeys = [
    "monthlyChart",
    "category",
    "payment",
    "subject",
    "balance",
    "currency"
];


const DEFAULT_ANALYSIS_ORDER_V3 = [
    "balance",
    "currency",
    "monthlyChart",
    "category",
    "payment",
    "subject"
];


if (!settings.analysisGroupOrderMigratedV3) {

    settings.analysisGroupOrder = DEFAULT_ANALYSIS_ORDER_V3.slice();
    settings.analysisGroupOrderMigratedV3 = true;

}
else if (!Array.isArray(settings.analysisGroupOrder)) {

    settings.analysisGroupOrder = DEFAULT_ANALYSIS_ORDER_V3.slice();

}
else {

    let order = settings.analysisGroupOrder.filter(
        key => validAnalysisGroupKeys.includes(key)
    );

    validAnalysisGroupKeys.forEach(key => {
        if (!order.includes(key)) order.push(key);
    });

    settings.analysisGroupOrder = order;

}


if (settings.analysisBalanceEnabled === undefined) {
    settings.analysisBalanceEnabled = true;
}

if (settings.analysisCurrencyEnabled === undefined) {
    settings.analysisCurrencyEnabled = true;
}


/* =========================
   통화 설정 마이그레이션 (다중 통화)
========================= */

/* 설정된 통화 목록 (순서대로). 기본은 원화만 ON */

if (
    !Array.isArray(settings.currencies) ||
    settings.currencies.length === 0
) {
    settings.currencies = [ "KRW" ];
}


/* 선택된 통화 (입력 화면에서 현재 선택된 통화) */

if (typeof settings.selectedCurrency !== "string") {
    settings.selectedCurrency = "KRW";
}

if (!settings.currencies.includes(settings.selectedCurrency)) {
    settings.selectedCurrency = settings.currencies[0] || "KRW";
}


/* 환율 캐시 (Supabase 공유용) */

if (
    !settings.exchangeRates ||
    typeof settings.exchangeRates !== "object" ||
    Array.isArray(settings.exchangeRates)
) {
    settings.exchangeRates = {};
}



/* =========================
   카테고리 / 결제수단 / 주체
========================= */

var categories = JSON.parse(
    localStorage.getItem("householdCategories") || "null"
);

if (!categories || typeof categories !== "object") {
    categories = {
        expense: [
            "식비", "교통", "쇼핑", "생활",
            "의료", "교육", "여가", "기타"
        ],
        income: [
            "급여", "용돈", "이자", "투자수익", "기타"
        ]
    };
}

if (!Array.isArray(categories.expense)) categories.expense = [];
if (!Array.isArray(categories.income)) categories.income = [];


var paymentMethods = JSON.parse(
    localStorage.getItem("householdPaymentMethods") || "null"
);

if (!Array.isArray(paymentMethods)) {
    paymentMethods = [ "카드1", "카드2", "현금", "상품권" ];
}


var subjects = JSON.parse(
    localStorage.getItem("householdSubjects") || "null"
);

if (!Array.isArray(subjects)) {
    subjects = [ "남편", "아내", "아기", "기타" ];
}



/* =========================
   UI 상태
========================= */

var currentType = "expense";

var selectedCategory = "";
var selectedPayment = "";
var selectedSubject = "";

/* 현재 입력 화면에서 선택된 통화 */

var currentCurrency = settings.selectedCurrency || "KRW";

/* 현재 입력 중인 환율 (외화일 때) */

var currentExchangeRate = 1;

/* 환율 기준일 */

var currentRateDate = "";

/* 환율 출처 */

var currentRateSource = "";


var selectedDate = getTodayString();

var calendarDate = new Date();

var historySearchKeyword = "";

var currentScreen = "input";
var previousScreen = "input";


/* 분석 상태 */

var analysisType = "expense";

var analysisSelectedCategory = "";
var analysisSelectedPayment = "";
var analysisSelectedSubject = "";



/* =========================
   저장 함수 (전역)
========================= */

function saveTransactions() {

    localStorage.setItem(
        "householdTransactions",
        JSON.stringify(transactions)
    );

}


function saveSettings() {

    localStorage.setItem(
        "householdSettings",
        JSON.stringify(settings)
    );

    scheduleSyncUserData();

}


function saveCategories() {

    localStorage.setItem(
        "householdCategories",
        JSON.stringify(categories)
    );

    scheduleSyncUserData();

}


function savePaymentMethods() {

    localStorage.setItem(
        "householdPaymentMethods",
        JSON.stringify(paymentMethods)
    );

    scheduleSyncUserData();

}


function saveSubjects() {

    localStorage.setItem(
        "householdSubjects",
        JSON.stringify(subjects)
    );

    scheduleSyncUserData();

}


/* =========================
   기본 데이터 (로그아웃 초기화용)
========================= */

function getDefaultSettings() {

    return {

        memoEnabled: true,
        paymentEnabled: true,
        categoryEnabled: true,
        subjectEnabled: true,

        memoExpenseEnabled: true,
        memoIncomeEnabled: true,

        paymentExpenseEnabled: true,
        paymentIncomeEnabled: true,

        categoryExpenseEnabled: true,
        categoryIncomeEnabled: true,

        subjectExpenseEnabled: true,
        subjectIncomeEnabled: true,

        analysisCategoryEnabled: true,
        analysisPaymentEnabled: true,
        analysisSubjectEnabled: true,
        analysisBalanceEnabled: true,
        analysisCurrencyEnabled: true,

        analysisGroupOrder: [
            "balance",
            "monthlyChart",
            "category",
            "payment",
            "subject",
            "currency"
        ],

        analysisGroupOrderMigratedV3: true,

        monthlyChartEnabled: true,

        budgets: {},

        noSpendStartDate: (function() {
            const year = new Date().getFullYear();
            return `${year}-01-01`;
        })(),

        monthlyBudget: 0,

        /* 다중 통화 */

        currencies: [ "KRW" ],

        selectedCurrency: "KRW",

        exchangeRates: {}

    };

}


function getDefaultCategories() {

    return {
        expense: [
            "식비", "교통", "쇼핑", "생활",
            "의료", "교육", "여가", "기타"
        ],
        income: [
            "급여", "용돈", "이자", "투자수익", "기타"
        ]
    };

}


function getDefaultPaymentMethods() {

    return [ "카드1", "카드2", "현금", "상품권" ];

}


function getDefaultSubjects() {

    return [ "남편", "아내", "아기", "기타" ];

}