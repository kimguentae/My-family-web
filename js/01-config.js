/* =========================
   01. 설정 및 전역 상태
========================= */

const SUPABASE_URL =
    "https://lyassaicxiixzyqlewhx.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YXNzYWljeGlpeHp5cWxld2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NjEwMDMsImV4cCI6MjEwNTAzNzAwM30.pHAYhGkx-NE9-_Ep44uKxADRyR5qR--UsYlIuwFKalw";


const supabaseClient =
    typeof window !== "undefined" &&
    window.supabase &&
    typeof window.supabase.createClient ===
        "function"
        ? window.supabase.createClient(
              SUPABASE_URL,
              SUPABASE_ANON_KEY,
              {
                  auth: {
                      persistSession: true,
                      autoRefreshToken: true,
                      detectSessionInUrl: true,
                      storage: window.localStorage,
                      storageKey:
                          "household-auth-token"
                  }
              }
          )
        : null;



/* =========================
   전역 상태
========================= */

let currentUser = null;

let syncUserDataTimer = null;

let isLoadingUserData = false;

let authListenerRegistered = false;

let isSigningOut = false;


/* =========================
   로컬 데이터 로드
========================= */

let transactions = JSON.parse(
    localStorage.getItem("householdTransactions") || "[]"
);


let settings = JSON.parse(
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

if (settings.memoEnabled === undefined) {
    settings.memoEnabled = true;
}

if (settings.paymentEnabled === undefined) {
    settings.paymentEnabled = true;
}

if (settings.categoryEnabled === undefined) {
    settings.categoryEnabled = true;
}

if (settings.subjectEnabled === undefined) {
    settings.subjectEnabled = true;
}


if (settings.memoExpenseEnabled === undefined) {
    settings.memoExpenseEnabled =
        settings.memoEnabled !== false;
}

if (settings.memoIncomeEnabled === undefined) {
    settings.memoIncomeEnabled =
        settings.memoEnabled !== false;
}


if (settings.paymentExpenseEnabled === undefined) {
    settings.paymentExpenseEnabled =
        settings.paymentEnabled !== false;
}

if (settings.paymentIncomeEnabled === undefined) {
    settings.paymentIncomeEnabled =
        settings.paymentEnabled !== false;
}


if (settings.categoryExpenseEnabled === undefined) {
    settings.categoryExpenseEnabled =
        settings.categoryEnabled !== false;
}

if (settings.categoryIncomeEnabled === undefined) {
    settings.categoryIncomeEnabled =
        settings.categoryEnabled !== false;
}


if (settings.subjectExpenseEnabled === undefined) {
    settings.subjectExpenseEnabled =
        settings.subjectEnabled !== false;
}

if (settings.subjectIncomeEnabled === undefined) {
    settings.subjectIncomeEnabled =
        settings.subjectEnabled !== false;
}


if (settings.analysisCategoryEnabled === undefined) {
    settings.analysisCategoryEnabled = true;
}

if (settings.analysisPaymentEnabled === undefined) {
    settings.analysisPaymentEnabled = true;
}

if (settings.analysisSubjectEnabled === undefined) {
    settings.analysisSubjectEnabled = true;
}

if (settings.monthlyChartEnabled === undefined) {
    settings.monthlyChartEnabled = true;
}

if (
    !settings.budgets ||
    typeof settings.budgets !== "object" ||
    Array.isArray(settings.budgets)
) {
    settings.budgets = {};
}

if (
    !Array.isArray(settings.analysisGroupOrder) ||
    settings.analysisGroupOrder.length !== 4 ||
    !settings.analysisGroupOrder.includes(
        "monthlyChart"
    )
) {

    const existingOrder =
        Array.isArray(
            settings.analysisGroupOrder
        )
            ? settings.analysisGroupOrder.filter(
                  key =>
                      key === "category" ||
                      key === "payment" ||
                      key === "subject"
              )
            : [
                  "category",
                  "payment",
                  "subject"
              ];


    settings.analysisGroupOrder = [
        "monthlyChart",
        ...existingOrder
    ];

}



let categories = JSON.parse(
    localStorage.getItem("householdCategories") || "null"
);


if (!categories || typeof categories !== "object") {

    categories = {

        expense: [
            "식비",
            "교통",
            "쇼핑",
            "생활",
            "의료",
            "교육",
            "여가",
            "기타"
        ],

        income: [
            "급여",
            "용돈",
            "이자",
            "투자수익",
            "기타"
        ]

    };

}


if (!Array.isArray(categories.expense)) {
    categories.expense = [];
}

if (!Array.isArray(categories.income)) {
    categories.income = [];
}



let paymentMethods = JSON.parse(
    localStorage.getItem("householdPaymentMethods") || "null"
);


if (!Array.isArray(paymentMethods)) {

    paymentMethods = [
        "카드1",
        "카드2",
        "현금",
        "상품권"
    ];

}



let subjects = JSON.parse(
    localStorage.getItem("householdSubjects") || "null"
);


if (!Array.isArray(subjects)) {

    subjects = [
        "남편",
        "아내",
        "아기",
        "기타"
    ];

}



/* UI 상태 */

let currentType = "expense";

let selectedCategory = "";
let selectedPayment = "";
let selectedSubject = "";

let selectedDate = getTodayString();

let calendarDate = new Date();

let historySearchKeyword = "";

let currentScreen = "input";
let previousScreen = "input";


/* 분석 상태 */

let analysisType = "expense";

let analysisSelectedCategory = "";
let analysisSelectedPayment = "";
let analysisSelectedSubject = "";



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