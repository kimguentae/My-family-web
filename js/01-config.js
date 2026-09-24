/* =========================
   01. 설정 및 전역 상태
========================= */

/* 
   ★ 이 함수는 02-utils.js에도 정의되어 있지만,
   01-config.js가 먼저 로드되면서 이 함수를 필요로 하므로
   여기서 먼저 선언해둔다. (중복 정의되지만 나중 로드가 덮어씀)
*/

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

}node --check js/01-config.js

const SUPABASE_URL =
    "https://lyassaicxiixzyqlewhx.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YXNzYWljeGlpeHp5cWxld2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NjEwMDMsImV4cCI6MjEwNTAzNzAwM30.pHAYhGkx-NE9-_Ep44uKxADRyR5qR--UsYlIuwFKalw";


var supabaseClient =
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



var categories = JSON.parse(
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



var paymentMethods = JSON.parse(
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



var subjects = JSON.parse(
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

var currentType = "expense";

var selectedCategory = "";
var selectedPayment = "";
var selectedSubject = "";

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