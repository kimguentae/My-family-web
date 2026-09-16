/* =========================
   Supabase 연동
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
              SUPABASE_ANON_KEY
          )
        : null;


/* 현재 로그인 사용자 (없으면 null = 로컬 전용 모드) */

let currentUser = null;

let syncUserDataTimer = null;

let isLoadingUserData = false;



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

        monthlyChartEnabled: true
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



let currentType = "expense";

let selectedCategory = "";
let selectedPayment = "";
let selectedSubject = "";

let selectedDate = getTodayString();

let calendarDate = new Date();

let historySearchKeyword = "";


/* 화면 상태 */

let currentScreen = "input";
let previousScreen = "input";



/* 저장 */

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
   Supabase 인증 (로그인 / 회원가입)
========================= */

function updateAccountUI() {

    const loggedOut =
        document.getElementById(
            "accountLoggedOut"
        );

    const loggedIn =
        document.getElementById(
            "accountLoggedIn"
        );

    const emailDisplay =
        document.getElementById(
            "accountEmailDisplay"
        );


    if (!loggedOut || !loggedIn) {

        return;

    }


    if (currentUser) {

        loggedOut.style.display =
            "none";

        loggedIn.style.display =
            "block";


        if (emailDisplay) {

            emailDisplay.innerText =
                currentUser.email;

        }

    }

    else {

        loggedOut.style.display =
            "block";

        loggedIn.style.display =
            "none";

    }

}


function setAuthMessage(text) {

    const message =
        document.getElementById(
            "authMessage"
        );

    if (message) {

        message.innerText =
            text || "";

    }

}


function setSyncStatus(text) {

    const status =
        document.getElementById(
            "accountSyncStatus"
        );

    if (status) {

        status.innerText =
            text || "";

    }

}


/* 앱 실행 시 기존 로그인 세션이 있는지 확인 */

async function checkExistingSession() {

    if (!supabaseClient) {

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient.auth.getSession();


    if (error) {

        console.error(
            error
        );

        return;

    }


    if (
        data &&
        data.session &&
        data.session.user
    ) {

        currentUser = {
            id: data.session.user.id,
            email: data.session.user.email
        };


        updateAccountUI();

        await loadUserDataFromSupabase();

    }

}


async function handleSignUp() {

    if (!supabaseClient) {

        setAuthMessage(
            "Supabase 연결 정보가 설정되지 않았습니다."
        );

        return;

    }


    const emailInput =
        document.getElementById(
            "authEmailInput"
        );

    const passwordInput =
        document.getElementById(
            "authPasswordInput"
        );


    const email =
        emailInput
            ? emailInput.value.trim()
            : "";

    const password =
        passwordInput
            ? passwordInput.value
            : "";


    if (!email || !password) {

        setAuthMessage(
            "이메일과 비밀번호를 입력해주세요."
        );

        return;

    }


    if (password.length < 6) {

        setAuthMessage(
            "비밀번호는 6자 이상이어야 해요."
        );

        return;

    }


    setAuthMessage(
        "처리 중..."
    );


    const {
        data,
        error
    } =
        await supabaseClient.auth.signUp({
            email,
            password
        });


    if (error) {

        setAuthMessage(
            error.message
        );

        return;

    }


    if (
        data &&
        data.session &&
        data.user
    ) {

        currentUser = {
            id: data.user.id,
            email: data.user.email
        };


        setAuthMessage(
            ""
        );

        updateAccountUI();


        /* 최초 가입 시 기존 로컬 데이터를 서버로 올림 */

        await pushLocalDataToSupabase();

        await loadUserDataFromSupabase();

    }

    else {

        setAuthMessage(
            "가입 확인 메일을 확인해주세요."
        );

    }

}


async function handleSignIn() {

    if (!supabaseClient) {

        setAuthMessage(
            "Supabase 연결 정보가 설정되지 않았습니다."
        );

        return;

    }


    const emailInput =
        document.getElementById(
            "authEmailInput"
        );

    const passwordInput =
        document.getElementById(
            "authPasswordInput"
        );


    const email =
        emailInput
            ? emailInput.value.trim()
            : "";

    const password =
        passwordInput
            ? passwordInput.value
            : "";


    if (!email || !password) {

        setAuthMessage(
            "이메일과 비밀번호를 입력해주세요."
        );

        return;

    }


    setAuthMessage(
        "로그인 중..."
    );


    const {
        data,
        error
    } =
        await supabaseClient.auth.signInWithPassword(
            {
                email,
                password
            }
        );


    if (error) {

        setAuthMessage(
            error.message
        );

        return;

    }


    currentUser = {
        id: data.user.id,
        email: data.user.email
    };


    setAuthMessage(
        ""
    );

    updateAccountUI();


    await loadUserDataFromSupabase();

}


async function handleSignOut() {

    if (supabaseClient) {

        await supabaseClient.auth.signOut();

    }


    currentUser = null;

    if (syncUserDataTimer) {

        clearTimeout(
            syncUserDataTimer
        );

        syncUserDataTimer = null;

    }

    setAuthMessage(
        ""
    );

    setSyncStatus(
        ""
    );


    /* 로그인 중 불러온 데이터가 로그아웃 후에도
       화면에 남아있지 않도록 로컬 데이터를 초기화 */

    resetLocalDataToDefaults();

    updateAccountUI();

}


/* 로그아웃 시 로컬 데이터(거래내역/설정/카테고리/결제수단/주체)를
   최초 설치 상태로 되돌림 - 다른 계정 데이터가 남아있지 않도록 함 */

function resetLocalDataToDefaults() {

    transactions = [];

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

        monthlyChartEnabled: true

    };

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

    paymentMethods = [
        "카드1",
        "카드2",
        "현금",
        "상품권"
    ];

    subjects = [
        "남편",
        "아내",
        "아기",
        "기타"
    ];


    localStorage.setItem(
        "householdTransactions",
        JSON.stringify(transactions)
    );

    localStorage.setItem(
        "householdSettings",
        JSON.stringify(settings)
    );

    localStorage.setItem(
        "householdCategories",
        JSON.stringify(categories)
    );

    localStorage.setItem(
        "householdPaymentMethods",
        JSON.stringify(paymentMethods)
    );

    localStorage.setItem(
        "householdSubjects",
        JSON.stringify(subjects)
    );


    selectedCategory = "";
    selectedPayment = "";
    selectedSubject = "";

    if (
        typeof analysisSelectedCategory !==
        "undefined"
    ) {

        analysisSelectedCategory = "";
        analysisSelectedPayment = "";
        analysisSelectedSubject = "";

    }


    calendarDate = new Date();

    selectedDate = getTodayString();

    historySearchKeyword = "";


    refreshAllScreens();

}



/* =========================
   Supabase 데이터 동기화
========================= */

/* 서버에서 내 데이터를 가져와 로컬에 반영 */

async function loadUserDataFromSupabase() {

    if (
        !supabaseClient ||
        !currentUser
    ) {

        return;

    }


    isLoadingUserData = true;

    setSyncStatus(
        "동기화 중..."
    );


    const [
        transactionsResult,
        userDataResult
    ] = await Promise.all([

        supabaseClient
            .from("transactions")
            .select("*")
            .eq(
                "user_id",
                currentUser.id
            )
            .order(
                "date",
                {
                    ascending: true
                }
            ),

        supabaseClient
            .from("user_data")
            .select("*")
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle()

    ]);


    isLoadingUserData = false;


    if (transactionsResult.error) {

        setSyncStatus(
            "동기화 실패: " +
            transactionsResult.error
                .message
        );

        return;

    }


    if (
        userDataResult.error &&
        userDataResult.error.code !==
        "PGRST116"
    ) {

        setSyncStatus(
            "동기화 실패: " +
            userDataResult.error
                .message
        );

        return;

    }


    const rows =
        transactionsResult.data ||
        [];


    transactions =
        rows.map(
            row => ({

                id: row.id,

                date: row.date,

                type: row.type,

                amount:
                    Number(
                        row.amount
                    ) || 0,

                category:
                    row.category ||
                    "",

                memo:
                    row.memo ||
                    "",

                payment:
                    row.payment ||
                    "",

                subject:
                    row.subject ||
                    ""

            })
        );


    localStorage.setItem(
        "householdTransactions",
        JSON.stringify(transactions)
    );


    const userRow =
        userDataResult.data;


    if (userRow) {

        if (userRow.settings) {

            settings = {
                ...settings,
                ...userRow.settings
            };

            localStorage.setItem(
                "householdSettings",
                JSON.stringify(settings)
            );

        }


        if (userRow.categories) {

            categories =
                userRow.categories;

            localStorage.setItem(
                "householdCategories",
                JSON.stringify(categories)
            );

        }


        if (
            userRow.payment_methods
        ) {

            paymentMethods =
                userRow.payment_methods;

            localStorage.setItem(
                "householdPaymentMethods",
                JSON.stringify(paymentMethods)
            );

        }


        if (userRow.subjects) {

            subjects =
                userRow.subjects;

            localStorage.setItem(
                "householdSubjects",
                JSON.stringify(subjects)
            );

        }

    }

    else {

        /* 서버에 데이터가 없는 최초 로그인: 로컬 데이터를 서버로 업로드 */

        await pushLocalDataToSupabase();

    }


    setSyncStatus(
        "동기화 완료"
    );


    refreshAllScreens();

}


/* 로컬 데이터 전체를 서버로 업로드 (최초 로그인/가입 시) */

async function pushLocalDataToSupabase() {

    if (
        !supabaseClient ||
        !currentUser
    ) {

        return;

    }


    await supabaseClient
        .from("user_data")
        .upsert({

            user_id:
                currentUser.id,

            settings: settings,

            categories: categories,

            payment_methods:
                paymentMethods,

            subjects: subjects,

            updated_at:
                new Date().toISOString()

        });


    if (transactions.length) {

        const rows =
            transactions.map(
                transaction => ({

                    id:
                        transaction.id,

                    user_id:
                        currentUser.id,

                    date:
                        transaction.date,

                    type:
                        transaction.type,

                    amount:
                        transaction.amount,

                    category:
                        transaction.category ||
                        null,

                    memo:
                        transaction.memo ||
                        null,

                    payment:
                        transaction.payment ||
                        null,

                    subject:
                        transaction.subject ||
                        null

                })
            );


        await supabaseClient
            .from("transactions")
            .upsert(
                rows
            );

    }

}


/* 설정 / 카테고리 / 결제수단 / 주체 변경을 서버에 반영 (여러 번 연속 호출되어도 한 번만 전송) */

function scheduleSyncUserData() {

    if (
        !supabaseClient ||
        !currentUser ||
        isLoadingUserData
    ) {

        return;

    }


    if (syncUserDataTimer) {

        clearTimeout(
            syncUserDataTimer
        );

    }


    syncUserDataTimer =
        setTimeout(
            function() {

                if (
                    !supabaseClient ||
                    !currentUser
                ) {

                    return;

                }


                supabaseClient
                    .from("user_data")
                    .upsert({

                        user_id:
                            currentUser.id,

                        settings:
                            settings,

                        categories:
                            categories,

                        payment_methods:
                            paymentMethods,

                        subjects:
                            subjects,

                        updated_at:
                            new Date().toISOString()

                    })
                    .then(
                        function(
                            result
                        ) {

                            if (
                                result.error
                            ) {

                                console.error(
                                    result.error
                                );

                            }

                        }
                    );

            },
            600
        );

}


/* 화면 다시 그리기 (로그인 후 서버 데이터로 갱신될 때 사용) */

function refreshAllScreens() {

    renderCategoryButtons();

    renderSubjectButtons();

    renderPaymentButtons();

    updateInputAreas();


    renderCalendar();

    renderSelectedDate();


    renderCategoryManagement();

    renderPaymentManagement();

    renderSubjectManagement();


    updateSettingsUI();


    const analysisScreen =
        document.getElementById(
            "analysisScreen"
        );


    if (
        analysisScreen &&
        analysisScreen.classList.contains(
            "active"
        )
    ) {

        renderAnalysis();

    }

}


/* 거래 1건 추가를 서버에 반영 */

function syncInsertTransaction(
    transaction
) {

    if (
        !supabaseClient ||
        !currentUser
    ) {

        return;

    }


    supabaseClient
        .from("transactions")
        .insert({

            id:
                transaction.id,

            user_id:
                currentUser.id,

            date:
                transaction.date,

            type:
                transaction.type,

            amount:
                transaction.amount,

            category:
                transaction.category ||
                null,

            memo:
                transaction.memo ||
                null,

            payment:
                transaction.payment ||
                null,

            subject:
                transaction.subject ||
                null

        })
        .then(
            function(result) {

                if (result.error) {

                    console.error(
                        result.error
                    );

                }

            }
        );

}


/* 거래 1건 수정(금액 등)을 서버에 반영 */

function syncUpdateTransaction(
    id,
    fields
) {

    if (
        !supabaseClient ||
        !currentUser
    ) {

        return;

    }


    supabaseClient
        .from("transactions")
        .update(
            fields
        )
        .eq(
            "id",
            id
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .then(
            function(result) {

                if (result.error) {

                    console.error(
                        result.error
                    );

                }

            }
        );

}


/* 거래 1건 삭제를 서버에 반영 */

function syncDeleteTransaction(id) {

    if (
        !supabaseClient ||
        !currentUser
    ) {

        return;

    }


    supabaseClient
        .from("transactions")
        .delete()
        .eq(
            "id",
            id
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .then(
            function(result) {

                if (result.error) {

                    console.error(
                        result.error
                    );

                }

            }
        );

}


/* 카테고리 / 결제수단 / 주체 이름이 바뀔 때
   해당 필드를 사용하는 모든 거래를 서버에서도 일괄 변경 */

function syncRenameTransactionsField(
    field,
    oldValue,
    newValue
) {

    if (
        !supabaseClient ||
        !currentUser
    ) {

        return;

    }


    const updatePayload = {};

    updatePayload[field] =
        newValue;


    supabaseClient
        .from("transactions")
        .update(
            updatePayload
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .eq(
            field,
            oldValue
        )
        .then(
            function(result) {

                if (result.error) {

                    console.error(
                        result.error
                    );

                }

            }
        );

}



/* 날짜 */

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


function formatDateKorean(dateString) {

    const date = new Date(
        dateString + "T00:00:00"
    );

    const weekdays = [
        "일",
        "월",
        "화",
        "수",
        "목",
        "금",
        "토"
    ];

    return `${date.getFullYear()}년 ${
        date.getMonth() + 1
    }월 ${
        date.getDate()
    }일 (${weekdays[date.getDay()]})`;

}



/* 화면 */

function showScreen(screenName) {

    if (screenName !== currentScreen) {
        previousScreen = currentScreen;
    }

    currentScreen = screenName;


    document
        .querySelectorAll(".screen")
        .forEach(screen => {

            screen.classList.remove("active");

        });


    const target =
        document.getElementById(
            screenName + "Screen"
        );


    if (target) {

        target.classList.add("active");

    }


    let navScreen = screenName;

    if (
        screenName !== "input" &&
        screenName !== "history" &&
        screenName !== "analysis" &&
        screenName !== "settings"
    ) {

        navScreen = "settings";

    }


    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.screen === navScreen
            );

        });


    const pageTitle =
        document.getElementById("pageTitle");


    const headerBackButton =
        document.getElementById(
            "headerBackButton"
        );


    const titleMap = {

        input: "입력",

        history: "내역",

        analysis: "분석",

        settings: "설정",

        inputSettings: "입력 설정",

        memoSettings: "메모 설정",

        categorySettings: "카테고리 설정",

        paymentSettings: "결제수단 설정",

        subjectSettings: "주체 설정",

        historySettings: "내역 설정",

        historyExport: "엑셀로 저장",

        analysisSettings: "분석 설정",

        accountSettings: "계정 설정"

    };


    if (pageTitle) {

        pageTitle.innerText =
            titleMap[screenName] || "";

    }


    const header =
        document.querySelector(".header");


    if (header) {

        const hideHeader =
            screenName === "input" ||
            screenName === "history" ||
            screenName === "analysis";


        header.classList.toggle(
            "hidden",
            hideHeader
        );


        if (headerBackButton) {

            const showBackButton =
                screenName === "settings" ||
                screenName === "inputSettings" ||
                screenName === "memoSettings" ||
                screenName === "categorySettings" ||
                screenName === "paymentSettings" ||
                screenName === "subjectSettings" ||
                screenName === "historySettings" ||
                screenName === "historyExport" ||
                screenName === "analysisSettings" ||
                screenName === "accountSettings";


            headerBackButton.style.display =
                showBackButton
                    ? "flex"
                    : "none";

        }

    }


    if (screenName === "input") {

        updateInputDateText();

        renderCategoryButtons();
        renderSubjectButtons();
        renderPaymentButtons();

        updateInputAreas();

    }


    if (screenName === "history") {

        renderCalendar();
        renderSelectedDate();

    }


    if (
        screenName === "settings" ||
        screenName === "inputSettings" ||
        screenName === "memoSettings" ||
        screenName === "categorySettings" ||
        screenName === "paymentSettings" ||
        screenName === "subjectSettings" ||
        screenName === "historySettings" ||
        screenName === "analysisSettings" ||
        screenName === "accountSettings"
    ) {

        updateSettingsUI();

    }


    if (screenName === "categorySettings") {

        renderCategoryManagement();

    }


    if (screenName === "paymentSettings") {

        renderPaymentManagement();

    }


    if (screenName === "subjectSettings") {

        renderSubjectManagement();

    }


    if (screenName === "analysisSettings") {

        renderAnalysisGroupOrderList();

    }


    if (screenName === "historyExport") {

        initializeExportDates();

    }

}


/* 설정 화면 뒤로가기 */

function goBackFromHeader() {

    if (currentScreen === "inputSettings") {

        showScreen("settings");

        return;

    }


    if (
        currentScreen === "memoSettings" ||
        currentScreen === "categorySettings" ||
        currentScreen === "paymentSettings" ||
        currentScreen === "subjectSettings"
    ) {

        showScreen("inputSettings");

        return;

    }


    if (
        currentScreen === "historySettings" ||
        currentScreen === "analysisSettings" ||
        currentScreen === "accountSettings"
    ) {

        showScreen("settings");

        return;

    }


    if (currentScreen === "historyExport") {

        showScreen("historySettings");

        return;

    }


    if (currentScreen === "settings") {

        showScreen(
            previousScreen === "settings"
                ? "input"
                : previousScreen
        );

        return;

    }


    showScreen("settings");

}


/* 설정 펼치기 / 접기 */

function toggleSettingsCollapse(
    bodyId,
    button
) {

    const body =
        document.getElementById(
            bodyId
        );


    if (!body) return;


    const isOpen =
        body.classList.contains(
            "open"
        );


    if (isOpen) {

        body.classList.remove(
            "open"
        );

        button.classList.remove(
            "open"
        );

    }

    else {

        body.classList.add(
            "open"
        );

        button.classList.add(
            "open"
        );

    }

}



/* 입력 날짜 */

function updateInputDateText() {

    const input =
        document.getElementById(
            "dateInput"
        );

    const text =
        document.getElementById(
            "inputDateText"
        );


    if (!input || !text) return;


    if (!input.value) {

        input.value =
            getTodayString();

    }


    const date =
        new Date(
            input.value +
            "T00:00:00"
        );


    const weekdays = [
        "일",
        "월",
        "화",
        "수",
        "목",
        "금",
        "토"
    ];


    text.innerText =
        `${date.getFullYear()}년 ${
            date.getMonth() + 1
        }월 ${
            date.getDate()
        }일 (${weekdays[date.getDay()]})`;

}


document.addEventListener(
    "DOMContentLoaded",
    function() {

        const dateInput =
            document.getElementById(
                "dateInput"
            );


        if (dateInput) {

            dateInput.value =
                getTodayString();

            dateInput.addEventListener(
                "change",
                updateInputDateText
            );

        }

    }
);



/* 금액 */

function formatAmountInput() {

    const input =
        document.getElementById(
            "amountInput"
        );


    if (!input) return;


    let value =
        input.value.replace(
            /[^0-9]/g,
            ""
        );


    if (!value) {

        input.value = "";

        return;

    }


    input.value =
        Number(value).toLocaleString(
            "ko-KR"
        );

}


document.addEventListener(
    "input",
    function(event) {

        if (
            event.target &&
            event.target.id ===
            "amountInput"
        ) {

            formatAmountInput();

        }

    }
);



/* 지출 / 수입 */

function setType(type) {

    currentType = type;

    selectedCategory = "";
    selectedPayment = "";
    selectedSubject = "";


    document
        .getElementById("expenseBtn")
        .classList.toggle(
            "active",
            type === "expense"
        );


    document
        .getElementById("incomeBtn")
        .classList.toggle(
            "active",
            type === "income"
        );


    renderCategoryButtons();
    renderSubjectButtons();
    renderPaymentButtons();

    updateInputAreas();

}



/* 현재 타입별 사용 설정 */

function isMemoEnabledForCurrentType() {

    if (currentType === "expense") {

        return settings.memoExpenseEnabled;

    }

    return settings.memoIncomeEnabled;

}


function isCategoryEnabledForCurrentType() {

    if (currentType === "expense") {

        return settings.categoryExpenseEnabled;

    }

    return settings.categoryIncomeEnabled;

}


function isPaymentEnabledForCurrentType() {

    if (currentType === "expense") {

        return settings.paymentExpenseEnabled;

    }

    return settings.paymentIncomeEnabled;

}


function isSubjectEnabledForCurrentType() {

    if (currentType === "expense") {

        return settings.subjectExpenseEnabled;

    }

    return settings.subjectIncomeEnabled;

}



/* 입력 영역 표시 */

function updateInputAreas() {

    const memoArea =
        document.getElementById(
            "memoArea"
        );

    const paymentArea =
        document.getElementById(
            "paymentArea"
        );

    const categoryButtons =
        document.getElementById(
            "categoryButtons"
        );

    const subjectArea =
        document.getElementById(
            "subjectArea"
        );


    if (memoArea) {

        memoArea.style.display =
            isMemoEnabledForCurrentType()
                ? "block"
                : "none";

    }


    if (paymentArea) {

        paymentArea.style.display =
            isPaymentEnabledForCurrentType()
                ? "block"
                : "none";

    }


    if (categoryButtons) {

        categoryButtons.style.display =
            isCategoryEnabledForCurrentType()
                ? "grid"
                : "none";

    }


    if (subjectArea) {

        subjectArea.style.display =
            isSubjectEnabledForCurrentType()
                ? "block"
                : "none";

    }

}



/* 카테고리 */

function renderCategoryButtons() {

    const container =
        document.getElementById(
            "categoryButtons"
        );


    if (!container) return;


    container.innerHTML = "";


    if (!isCategoryEnabledForCurrentType()) {

        return;

    }


    const list =
        categories[currentType] || [];


    list.forEach(category => {

        const button =
            document.createElement(
                "button"
            );


        button.type = "button";

        button.className =
            "category-btn";


        if (
            category ===
            selectedCategory
        ) {

            button.classList.add(
                "active"
            );

        }


        button.innerText =
            category;


        button.onclick =
            function() {

                selectedCategory =
                    category;

                renderCategoryButtons();

            };


        container.appendChild(
            button
        );

    });

}



/* 주체 */

function renderSubjectButtons() {

    const container =
        document.getElementById(
            "subjectButtons"
        );


    if (!container) return;


    container.innerHTML = "";


    if (!isSubjectEnabledForCurrentType()) {

        return;

    }


    subjects.forEach(subject => {

        const button =
            document.createElement(
                "button"
            );


        button.type = "button";

        button.className =
            "subject-btn";


        if (
            subject ===
            selectedSubject
        ) {

            button.classList.add(
                "active"
            );

        }


        button.innerText =
            subject;


        button.onclick =
            function() {

                selectedSubject =
                    subject;

                renderSubjectButtons();

            };


        container.appendChild(
            button
        );

    });

}



/* 결제수단 */

function renderPaymentButtons() {

    const container =
        document.getElementById(
            "paymentButtons"
        );


    if (!container) return;


    container.innerHTML = "";


    if (!isPaymentEnabledForCurrentType()) {

        return;

    }


    paymentMethods.forEach(payment => {

        const button =
            document.createElement(
                "button"
            );


        button.type = "button";

        button.className =
            "payment-btn";


        if (
            payment ===
            selectedPayment
        ) {

            button.classList.add(
                "active"
            );

        }


        button.innerText =
            payment;


        button.onclick =
            function() {

                selectedPayment =
                    payment;

                renderPaymentButtons();

            };


        container.appendChild(
            button
        );

    });

}



/* 설정 UI */

function updateSettingsUI() {

    const memoExpenseToggle =
        document.getElementById(
            "memoExpenseToggle"
        );

    const memoIncomeToggle =
        document.getElementById(
            "memoIncomeToggle"
        );

    const categoryExpenseToggle =
        document.getElementById(
            "categoryExpenseToggle"
        );

    const categoryIncomeToggle =
        document.getElementById(
            "categoryIncomeToggle"
        );

    const paymentExpenseToggle =
        document.getElementById(
            "paymentExpenseToggle"
        );

    const paymentIncomeToggle =
        document.getElementById(
            "paymentIncomeToggle"
        );

    const subjectExpenseToggle =
        document.getElementById(
            "subjectExpenseToggle"
        );

    const subjectIncomeToggle =
        document.getElementById(
            "subjectIncomeToggle"
        );

    const analysisCategoryToggle =
        document.getElementById(
            "analysisCategoryToggle"
        );

    const analysisPaymentToggle =
        document.getElementById(
            "analysisPaymentToggle"
        );

    const analysisSubjectToggle =
        document.getElementById(
            "analysisSubjectToggle"
        );

    const monthlyChartToggle =
        document.getElementById(
            "monthlyChartToggle"
        );


    if (memoExpenseToggle) {

        memoExpenseToggle.checked =
            settings.memoExpenseEnabled;

    }


    if (memoIncomeToggle) {

        memoIncomeToggle.checked =
            settings.memoIncomeEnabled;

    }


    if (categoryExpenseToggle) {

        categoryExpenseToggle.checked =
            settings.categoryExpenseEnabled;

    }


    if (categoryIncomeToggle) {

        categoryIncomeToggle.checked =
            settings.categoryIncomeEnabled;

    }


    if (paymentExpenseToggle) {

        paymentExpenseToggle.checked =
            settings.paymentExpenseEnabled;

    }


    if (paymentIncomeToggle) {

        paymentIncomeToggle.checked =
            settings.paymentIncomeEnabled;

    }


    if (subjectExpenseToggle) {

        subjectExpenseToggle.checked =
            settings.subjectExpenseEnabled;

    }


    if (subjectIncomeToggle) {

        subjectIncomeToggle.checked =
            settings.subjectIncomeEnabled;

    }


    if (analysisCategoryToggle) {

        analysisCategoryToggle.checked =
            settings.analysisCategoryEnabled;

    }


    if (analysisPaymentToggle) {

        analysisPaymentToggle.checked =
            settings.analysisPaymentEnabled;

    }


    if (analysisSubjectToggle) {

        analysisSubjectToggle.checked =
            settings.analysisSubjectEnabled;

    }


    if (monthlyChartToggle) {

        monthlyChartToggle.checked =
            settings.monthlyChartEnabled;

    }


    updateInputAreas();

    updateAnalysisGroupVisibility();

    updateAccountUI();

}



/* 메모 ON/OFF */

function toggleMemoExpense() {

    settings.memoExpenseEnabled =
        document.getElementById(
            "memoExpenseToggle"
        ).checked;


    if (
        currentType === "expense" &&
        !settings.memoExpenseEnabled
    ) {

        const input =
            document.getElementById(
                "memoInput"
            );

        if (input) {

            input.value = "";

        }

    }


    saveSettings();

    updateInputAreas();

}


function toggleMemoIncome() {

    settings.memoIncomeEnabled =
        document.getElementById(
            "memoIncomeToggle"
        ).checked;


    if (
        currentType === "income" &&
        !settings.memoIncomeEnabled
    ) {

        const input =
            document.getElementById(
                "memoInput"
            );

        if (input) {

            input.value = "";

        }

    }


    saveSettings();

    updateInputAreas();

}



/* 카테고리 ON/OFF */

function toggleCategoryExpense() {

    settings.categoryExpenseEnabled =
        document.getElementById(
            "categoryExpenseToggle"
        ).checked;


    if (
        currentType === "expense" &&
        !settings.categoryExpenseEnabled
    ) {

        selectedCategory = "";

    }


    saveSettings();

    renderCategoryButtons();

    updateInputAreas();

}


function toggleCategoryIncome() {

    settings.categoryIncomeEnabled =
        document.getElementById(
            "categoryIncomeToggle"
        ).checked;


    if (
        currentType === "income" &&
        !settings.categoryIncomeEnabled
    ) {

        selectedCategory = "";

    }


    saveSettings();

    renderCategoryButtons();

    updateInputAreas();

}



/* 결제수단 ON/OFF */

function togglePaymentExpense() {

    settings.paymentExpenseEnabled =
        document.getElementById(
            "paymentExpenseToggle"
        ).checked;


    if (
        currentType === "expense" &&
        !settings.paymentExpenseEnabled
    ) {

        selectedPayment = "";

    }


    saveSettings();

    renderPaymentButtons();

    updateInputAreas();

}


function togglePaymentIncome() {

    settings.paymentIncomeEnabled =
        document.getElementById(
            "paymentIncomeToggle"
        ).checked;


    if (
        currentType === "income" &&
        !settings.paymentIncomeEnabled
    ) {

        selectedPayment = "";

    }


    saveSettings();

    renderPaymentButtons();

    updateInputAreas();

}



/* 주체 ON/OFF */

function toggleSubjectExpense() {

    settings.subjectExpenseEnabled =
        document.getElementById(
            "subjectExpenseToggle"
        ).checked;


    if (
        currentType === "expense" &&
        !settings.subjectExpenseEnabled
    ) {

        selectedSubject = "";

    }


    saveSettings();

    renderSubjectButtons();

    updateInputAreas();

}


function toggleSubjectIncome() {

    settings.subjectIncomeEnabled =
        document.getElementById(
            "subjectIncomeToggle"
        ).checked;


    if (
        currentType === "income" &&
        !settings.subjectIncomeEnabled
    ) {

        selectedSubject = "";

    }


    saveSettings();

    renderSubjectButtons();

    updateInputAreas();

}



/* 분석 화면 표시 ON/OFF */

function updateAnalysisGroupVisibility() {

    const categoryGroup =
        document.getElementById(
            "analysisCategoryGroup"
        );

    const paymentGroup =
        document.getElementById(
            "analysisPaymentGroup"
        );

    const subjectGroup =
        document.getElementById(
            "analysisSubjectGroup"
        );

    const monthlyChartGroup =
        document.getElementById(
            "analysisMonthlyChartGroup"
        );


    if (categoryGroup) {

        categoryGroup.style.display =
            settings.analysisCategoryEnabled
                ? "block"
                : "none";

    }


    if (paymentGroup) {

        paymentGroup.style.display =
            settings.analysisPaymentEnabled
                ? "block"
                : "none";

    }


    if (subjectGroup) {

        subjectGroup.style.display =
            settings.analysisSubjectEnabled
                ? "block"
                : "none";

    }


    if (monthlyChartGroup) {

        monthlyChartGroup.style.display =
            settings.monthlyChartEnabled
                ? "block"
                : "none";

    }

}


function toggleAnalysisCategory() {

    settings.analysisCategoryEnabled =
        document.getElementById(
            "analysisCategoryToggle"
        ).checked;


    saveSettings();

    updateAnalysisGroupVisibility();

}


function toggleAnalysisPayment() {

    settings.analysisPaymentEnabled =
        document.getElementById(
            "analysisPaymentToggle"
        ).checked;


    saveSettings();

    updateAnalysisGroupVisibility();

}


function toggleAnalysisSubject() {

    settings.analysisSubjectEnabled =
        document.getElementById(
            "analysisSubjectToggle"
        ).checked;


    saveSettings();

    updateAnalysisGroupVisibility();

}


/* 분석 항목(카테고리 / 결제수단 / 주체) 표시 & 순서 관리 */

const analysisGroupMeta = {

    monthlyChart: {
        label: "월별 그래프 표시",
        settingKey: "monthlyChartEnabled"
    },

    category: {
        label: "카테고리 표시",
        settingKey: "analysisCategoryEnabled"
    },

    payment: {
        label: "결제수단 표시",
        settingKey: "analysisPaymentEnabled"
    },

    subject: {
        label: "주체 분석 표시",
        settingKey: "analysisSubjectEnabled"
    }

};


function renderAnalysisGroupOrderList() {

    const container =
        document.getElementById(
            "analysisGroupOrderList"
        );


    if (!container) return;


    container.innerHTML = "";


    settings.analysisGroupOrder.forEach(
        (key, index) => {

            const meta =
                analysisGroupMeta[key];


            if (!meta) return;


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "category-manage-item";


            item.dataset.index =
                index;


            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "category-manage-content";


            const name =
                document.createElement(
                    "span"
                );


            name.className =
                "category-name";

            name.innerText =
                meta.label;


            const right =
                document.createElement(
                    "div"
                );


            right.style.display =
                "flex";

            right.style.alignItems =
                "center";

            right.style.gap =
                "10px";


            const switchLabel =
                document.createElement(
                    "label"
                );


            switchLabel.className =
                "switch";


            const checkbox =
                document.createElement(
                    "input"
                );


            checkbox.type =
                "checkbox";

            checkbox.checked =
                settings[
                    meta.settingKey
                ];


            checkbox.onchange =
                function() {

                    settings[
                        meta.settingKey
                    ] =
                        checkbox.checked;

                    saveSettings();

                    updateAnalysisGroupVisibility();

                };


            const slider =
                document.createElement(
                    "span"
                );


            slider.className =
                "slider";


            switchLabel.appendChild(
                checkbox
            );

            switchLabel.appendChild(
                slider
            );


            const drag =
                document.createElement(
                    "span"
                );


            drag.className =
                "category-drag";

            drag.innerText =
                "⋮⋮";


            right.appendChild(
                switchLabel
            );

            right.appendChild(
                drag
            );


            content.appendChild(
                name
            );

            content.appendChild(
                right
            );


            item.appendChild(
                content
            );


            container.appendChild(
                item
            );


            initializeAnalysisGroupOrderDrag(
                item,
                drag
            );

        }
    );

}


function initializeAnalysisGroupOrderDrag(
    item,
    handle
) {

    let startY = 0;

    let dragging = false;


    handle.addEventListener(
        "touchstart",
        function(event) {

            event.preventDefault();

            startY =
                event.touches[0]
                    .clientY;

            dragging = true;

            item.classList.add(
                "dragging"
            );

        },
        {
            passive: false
        }
    );


    handle.addEventListener(
        "touchmove",
        function(event) {

            if (!dragging) return;


            const currentY =
                event.touches[0]
                    .clientY;


            const diff =
                currentY -
                startY;


            if (
                Math.abs(diff) < 20
            ) {

                return;

            }


            const currentIndex =
                Number(
                    item.dataset.index
                );


            const direction =
                diff > 0
                    ? 1
                    : -1;


            const newIndex =
                currentIndex +
                direction;


            if (
                newIndex < 0 ||
                newIndex >=
                    settings
                        .analysisGroupOrder
                        .length
            ) {

                return;

            }


            const temp =
                settings.analysisGroupOrder[
                    currentIndex
                ];


            settings.analysisGroupOrder[
                currentIndex
            ] =
                settings.analysisGroupOrder[
                    newIndex
                ];


            settings.analysisGroupOrder[
                newIndex
            ] = temp;


            saveSettings();

            renderAnalysisGroupOrderList();

            renderAnalysis();


            dragging = false;

        },
        {
            passive: false
        }
    );


    handle.addEventListener(
        "touchend",
        function() {

            dragging = false;

            item.classList.remove(
                "dragging"
            );

        }
    );

}


/* 분석탭에서 실제 항목 순서를 반영 */

function reorderAnalysisGroupsInDOM() {

    const groupElements = {

        monthlyChart:
            document.getElementById(
                "analysisMonthlyChartGroup"
            ),

        category:
            document.getElementById(
                "analysisCategoryGroup"
            ),

        payment:
            document.getElementById(
                "analysisPaymentGroup"
            ),

        subject:
            document.getElementById(
                "analysisSubjectGroup"
            )

    };


    const order =
        Array.isArray(
            settings.analysisGroupOrder
        ) &&
        settings.analysisGroupOrder
            .length === 4
            ? settings.analysisGroupOrder
            : [
                  "monthlyChart",
                  "category",
                  "payment",
                  "subject"
              ];


    order.forEach(
        key => {

            const element =
                groupElements[key];


            if (
                element &&
                element.parentNode
            ) {

                element.parentNode.appendChild(
                    element
                );

            }

        }
    );

}


/* 거래 저장 */

function saveTransaction() {

    const dateInput =
        document.getElementById(
            "dateInput"
        );

    const amountInput =
        document.getElementById(
            "amountInput"
        );

    const memoInput =
        document.getElementById(
            "memoInput"
        );


    const date =
        dateInput.value;


    const amount =
        Number(
            amountInput.value.replace(
                /[^0-9]/g,
                ""
            )
        );


    const memo =
        memoInput.value.trim();


    if (!date) {

        alert(
            "날짜를 선택해주세요."
        );

        return;

    }


    if (!amount || amount <= 0) {

        alert(
            "금액을 입력해주세요."
        );

        return;

    }


    if (
        isCategoryEnabledForCurrentType() &&
        !selectedCategory
    ) {

        alert(
            "카테고리를 선택해주세요."
        );

        return;

    }


    if (
        isPaymentEnabledForCurrentType() &&
        !selectedPayment
    ) {

        alert(
            "결제수단을 선택해주세요."
        );

        return;

    }


    const subjectEnabled =
        isSubjectEnabledForCurrentType();


    if (
        subjectEnabled &&
        !selectedSubject
    ) {

        alert(
            "주체를 선택해주세요."
        );

        return;

    }


    const newTransaction = {

        id: Date.now(),

        date: date,

        type: currentType,

        amount: amount,

        category:
            isCategoryEnabledForCurrentType()
                ? selectedCategory
                : "",

        memo:
            isMemoEnabledForCurrentType()
                ? memo
                : "",

        payment:
            isPaymentEnabledForCurrentType()
                ? selectedPayment
                : "",

        subject:
            subjectEnabled
                ? selectedSubject
                : ""

    };


    transactions.push(
        newTransaction
    );


    saveTransactions();

    syncInsertTransaction(
        newTransaction
    );


    amountInput.value = "";

    memoInput.value = "";

    selectedCategory = "";

    selectedPayment = "";

    selectedSubject = "";


    renderCategoryButtons();
    renderSubjectButtons();
    renderPaymentButtons();

    renderCalendar();

}



/* 선택 날짜에 거래 추가 */

function addTransactionForSelectedDate() {

    showScreen("input");


    const dateInput =
        document.getElementById(
            "dateInput"
        );


    if (dateInput) {

        dateInput.value =
            selectedDate;

        updateInputDateText();

    }

}



/* =========================
   한국 공휴일
   미래 연도 자동 계산
========================= */

function isKoreanHoliday(dateString) {

    const target =
        new Date(
            dateString + "T00:00:00"
        );

    const year =
        target.getFullYear();


    const holidays = {};


    function pad(number) {

        return String(number)
            .padStart(2, "0");

    }


    function dateKey(date) {

        return (
            date.getFullYear() +
            "-" +
            pad(
                date.getMonth() + 1
            ) +
            "-" +
            pad(
                date.getDate()
            )
        );

    }


    function addHoliday(
        date,
        name
    ) {

        holidays[
            dateKey(date)
        ] = name;

    }


    function addFixed(
        month,
        day,
        name
    ) {

        addHoliday(
            new Date(
                year,
                month - 1,
                day
            ),
            name
        );

    }



    /*
     * 고정 공휴일
     */

    addFixed(
        1,
        1,
        "신정"
    );


    addFixed(
        3,
        1,
        "삼일절"
    );


    /*
     * 노동절
     * 2026년부터 반영
     */

    if (year >= 2026) {

        addFixed(
            5,
            1,
            "노동절"
        );

    }


    addFixed(
        5,
        5,
        "어린이날"
    );


    addFixed(
        6,
        6,
        "현충일"
    );


    /*
     * 제헌절
     */

    if (year >= 2026) {

        addFixed(
            7,
            17,
            "제헌절"
        );

    }


    addFixed(
        8,
        15,
        "광복절"
    );


    addFixed(
        10,
        3,
        "개천절"
    );


    addFixed(
        10,
        9,
        "한글날"
    );


    addFixed(
        12,
        25,
        "성탄절"
    );



    /*
     * 2026년 선거일
     *
     * 향후 선거일은 실제 확정 후
     * 별도로 추가해야 함
     */

    if (year === 2026) {

        addFixed(
            6,
            3,
            "전국동시지방선거일"
        );

    }



    /*
     * 한국 음력 계산
     *
     * 브라우저에서 지원하는
     * Chinese Calendar를 사용하여
     * 매년 음력 날짜를 자동으로 찾음
     */

    const lunarFormatter =
        new Intl.DateTimeFormat(
            "en-u-ca-chinese",
            {
                month: "numeric",
                day: "numeric"
            }
        );


    function getLunar(date) {

        const parts =
            lunarFormatter.formatToParts(
                date
            );


        let month = null;
        let day = null;


        parts.forEach(
            part => {

                if (
                    part.type === "month"
                ) {

                    month =
                        Number(
                            part.value
                        );

                }


                if (
                    part.type === "day"
                ) {

                    day =
                        Number(
                            part.value
                        );

                }

            }
        );


        return {
            month,
            day
        };

    }



    /*
     * 해당 연도의 날짜를
     * 하루씩 검사
     */

    const start =
        new Date(
            year,
            0,
            1
        );


    const end =
        new Date(
            year,
            11,
            31
        );


    let seollal = null;

    let buddha = null;

    let chuseok = null;


    for (
        let date =
            new Date(start);

        date <= end;

        date.setDate(
            date.getDate() + 1
        )
    ) {

        const lunar =
            getLunar(date);


        if (
            !lunar.month ||
            !lunar.day
        ) {

            continue;

        }


        /*
         * 설날
         * 음력 1월 1일
         */

        if (
            lunar.month === 1 &&
            lunar.day === 1
        ) {

            seollal =
                new Date(date);

        }


        /*
         * 부처님오신날
         * 음력 4월 8일
         */

        if (
            lunar.month === 4 &&
            lunar.day === 8
        ) {

            buddha =
                new Date(date);

        }


        /*
         * 추석
         * 음력 8월 15일
         */

        if (
            lunar.month === 8 &&
            lunar.day === 15
        ) {

            chuseok =
                new Date(date);

        }

    }



    /*
     * 설날 3일
     */

    if (seollal) {

        const before =
            new Date(
                seollal
            );

        before.setDate(
            before.getDate() - 1
        );


        const after =
            new Date(
                seollal
            );

        after.setDate(
            after.getDate() + 1
        );


        addHoliday(
            before,
            "설날 전날"
        );


        addHoliday(
            seollal,
            "설날"
        );


        addHoliday(
            after,
            "설날 다음날"
        );

    }



    /*
     * 부처님오신날
     */

    if (buddha) {

        addHoliday(
            buddha,
            "부처님오신날"
        );

    }



    /*
     * 추석 3일
     */

    if (chuseok) {

        const before =
            new Date(
                chuseok
            );

        before.setDate(
            before.getDate() - 1
        );


        const after =
            new Date(
                chuseok
            );

        after.setDate(
            after.getDate() + 1
        );


        addHoliday(
            before,
            "추석 전날"
        );


        addHoliday(
            chuseok,
            "추석"
        );


        addHoliday(
            after,
            "추석 다음날"
        );

    }



    /*
     * 대체공휴일
     */

    const substituteTargets = [

        "삼일절",

        "부처님오신날",

        "어린이날",

        "광복절",

        "개천절",

        "한글날",

        "성탄절",

        "설날 전날",

        "설날",

        "설날 다음날",

        "추석 전날",

        "추석",

        "추석 다음날"

    ];


    /*
     * 원래 공휴일 목록을 먼저 복사
     *
     * 계산 중 새로 만들어지는
     * 대체공휴일을 다시 대상으로
     * 삼지 않도록 함
     */

    const originalHolidayEntries =
        Object.entries(
            holidays
        );


    originalHolidayEntries.forEach(
        ([key, name]) => {

            if (
                !substituteTargets.includes(
                    name
                )
            ) {

                return;

            }


            const date =
                new Date(
                    key + "T00:00:00"
                );


            const day =
                date.getDay();


            /*
             * 토요일 또는 일요일에
             * 해당하는 경우
             */

            if (
                day !== 0 &&
                day !== 6
            ) {

                return;

            }


            let substitute =
                new Date(
                    date
                );


            substitute.setDate(
                substitute.getDate() + 1
            );


            /*
             * 이미 공휴일인 날짜라면
             * 다음 날짜로 이동
             */

            while (
                holidays[
                    dateKey(
                        substitute
                    )
                ]
            ) {

                substitute.setDate(
                    substitute.getDate() + 1
                );

            }


            addHoliday(
                substitute,
                name +
                " 대체공휴일"
            );

        }
    );



    /*
     * 요청한 날짜가 공휴일인지 반환
     */

    return (
        holidays[dateString] ||
        ""
    );

}



/* 달력 */

function renderCalendar() {

    const calendar =
        document.getElementById(
            "calendar"
        );

    const title =
        document.getElementById(
            "calendarTitle"
        );


    if (!calendar || !title) return;


    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    title.innerText =
        `${year}년 ${month + 1}월`;


    calendar.innerHTML = "";


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    const lastDate =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "calendar-day empty";

        calendar.appendChild(empty);

    }


    for (
        let day = 1;
        day <= lastDate;
        day++
    ) {

        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "calendar-day";


        const dateString =
            `${year}-${String(
                month + 1
            ).padStart(2, "0")}-${String(
                day
            ).padStart(2, "0")}`;


        const date =
            new Date(
                year,
                month,
                day
            );


        const dayOfWeek =
            date.getDay();


        /*
         * 일요일 / 공휴일 / 토요일
         */

        const holidayName =
            isKoreanHoliday(
                dateString
            );


        if (
            dayOfWeek === 0 ||
            holidayName
        ) {

            cell.classList.add(
                "sunday-holiday"
            );

        }
        else if (
            dayOfWeek === 6
        ) {

            cell.classList.add(
                "saturday"
            );

        }


        if (holidayName) {

            cell.title =
                holidayName;

        }


        if (
            dateString ===
            selectedDate
        ) {

            cell.classList.add(
                "selected"
            );

        }


        if (
            dateString ===
            getTodayString()
        ) {

            cell.classList.add(
                "today"
            );

        }


        const number =
            document.createElement(
                "div"
            );


        number.className =
            "calendar-day-number";

        number.innerText =
            day;


        cell.appendChild(
            number
        );


        const dailyTransactions =
            transactions.filter(
                transaction =>
                    transaction.date ===
                    dateString
            );


        let expenseTotal = 0;
        let incomeTotal = 0;


        dailyTransactions.forEach(
            transaction => {

                if (
                    transaction.type ===
                    "expense"
                ) {

                    expenseTotal +=
                        transaction.amount;

                }

                else {

                    incomeTotal +=
                        transaction.amount;

                }

            }
        );


        if (expenseTotal > 0) {

            const amount =
                document.createElement(
                    "div"
                );


            amount.className =
                "calendar-amount expense";


            amount.innerText =
                "-" +
                formatCompactAmount(
                    expenseTotal
                );


            cell.appendChild(
                amount
            );

        }


        if (incomeTotal > 0) {

            const amount =
                document.createElement(
                    "div"
                );


            amount.className =
                "calendar-amount income";


            amount.innerText =
                "+" +
                formatCompactAmount(
                    incomeTotal
                );


            cell.appendChild(
                amount
            );

        }


        cell.onclick =
            function() {

                selectDate(dateString);

            };


        calendar.appendChild(
            cell
        );

    }

}



function formatCompactAmount(amount) {

    if (amount >= 100000000) {

        return (
            (amount / 100000000)
                .toFixed(1)
                .replace(".0", "")
            + "억"
        );

    }


    if (amount >= 10000) {

        return (
            (amount / 10000)
                .toFixed(1)
                .replace(".0", "")
            + "만"
        );

    }


    return amount.toLocaleString(
        "ko-KR"
    );

}



function selectDate(dateString) {

    selectedDate =
        dateString;

    historySearchKeyword = "";


    const searchArea =
        document.getElementById(
            "historySearchArea"
        );

    const searchInput =
        document.getElementById(
            "historySearchInput"
        );


    if (searchArea) {

        searchArea.classList.remove(
            "active"
        );

    }


    if (searchInput) {

        searchInput.value = "";

    }


    renderCalendar();

    renderSelectedDate();

}



/* 내역 검색 */

function toggleHistorySearch() {

    const area =
        document.getElementById(
            "historySearchArea"
        );

    const input =
        document.getElementById(
            "historySearchInput"
        );


    if (!area) return;


    area.classList.toggle(
        "active"
    );


    if (
        area.classList.contains(
            "active"
        )
    ) {

        if (input) {

            input.focus();

        }

    }

    else {

        historySearchKeyword = "";

        if (input) {

            input.value = "";

        }

        renderCalendar();

        renderSelectedDate();

    }

}



function clearHistorySearch() {

    const input =
        document.getElementById(
            "historySearchInput"
        );


    historySearchKeyword = "";


    if (input) {

        input.value = "";

    }


    renderCalendar();

    renderSelectedDate();

}


document.addEventListener(
    "input",
    function(event) {

        if (
            event.target &&
            event.target.id ===
            "historySearchInput"
        ) {

            historySearchKeyword =
                event.target.value.trim();


            renderCalendar();

            renderSelectedDate();

        }

    }
);



function getHistorySearchResults() {

    if (!historySearchKeyword) {

        return [];

    }


    const keyword =
        historySearchKeyword.toLowerCase();


    return transactions
        .filter(transaction => {

            const memo =
                transaction.memo || "";


            return memo
                .toLowerCase()
                .includes(keyword);

        })
        .sort(
            (a, b) =>
                b.date.localeCompare(
                    a.date
                )
        );

}



/* 검색 결과 날짜 */

function formatHistoryResultDate(
    dateString
) {

    const date =
        new Date(
            dateString +
            "T00:00:00"
        );


    const weekdays = [
        "일",
        "월",
        "화",
        "수",
        "목",
        "금",
        "토"
    ];


    return `${
        date.getMonth() + 1
    }월 ${
        date.getDate()
    }일(${
        weekdays[date.getDay()]
    })`;

}



function goToSearchResultDate(
    dateString
) {

    selectedDate =
        dateString;


    const date =
        new Date(
            dateString +
            "T00:00:00"
        );


    calendarDate =
        new Date(
            date.getFullYear(),
            date.getMonth(),
            1
        );


    const area =
        document.getElementById(
            "historySearchArea"
        );

    const input =
        document.getElementById(
            "historySearchInput"
        );


    if (area) {

        area.classList.remove(
            "active"
        );

    }


    if (input) {

        input.value = "";

    }


    historySearchKeyword = "";


    renderCalendar();

    renderSelectedDate();


    const details =
        document.getElementById(
            "selectedDateTransactions"
        );


    if (details) {

        details.scrollTop = 0;

    }

}



/* 날짜별 내역 */

function renderSelectedDate() {

    const title =
        document.getElementById(
            "selectedDateTitle"
        );

    const container =
        document.getElementById(
            "selectedDateTransactions"
        );


    if (!title || !container) return;


    container.innerHTML = "";


    if (historySearchKeyword) {

        title.innerText =
            "검색 결과";


        const results =
            getHistorySearchResults();


        if (results.length === 0) {

            container.innerHTML =
                `<div class="no-transactions">
                    검색 결과가 없습니다.
                </div>`;

            return;

        }


        const list =
            document.createElement(
                "div"
            );


        list.className =
            "transaction-list";


        results.forEach(
            transaction => {

                list.appendChild(
                    createTransactionCard(
                        transaction,
                        true
                    )
                );

            }
        );


        container.appendChild(
            list
        );

        return;

    }


    const date =
        new Date(
            selectedDate +
            "T00:00:00"
        );


    title.innerText =
        `${date.getMonth() + 1}월 ${
            date.getDate()
        }일 내역`;


    const addButton =
        document.createElement(
            "button"
        );


    addButton.type = "button";

    addButton.className =
        "selected-date-add-button";

    addButton.innerText =
        "+ 추가";


    addButton.onclick =
        addTransactionForSelectedDate;


    title.appendChild(
        addButton
    );


    const dailyTransactions =
        transactions
            .filter(
                transaction =>
                    transaction.date ===
                    selectedDate
            )
            .sort(
                (a, b) =>
                    b.id - a.id
            );


    if (
        dailyTransactions.length === 0
    ) {

        container.innerHTML =
            `<div class="no-transactions">
                내역이 없습니다.
            </div>`;

        return;

    }


    const list =
        document.createElement(
            "div"
        );


    list.className =
        "transaction-list";


    dailyTransactions.forEach(
        transaction => {

            list.appendChild(
                createTransactionCard(
                    transaction,
                    false
                )
            );

        }
    );


    container.appendChild(
        list
    );

}



/* 거래 카드 */

function createTransactionCard(
    transaction,
    isSearchResult = false
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "transaction-card";


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "swipe-actions";


    const editButton =
        document.createElement(
            "button"
        );


    editButton.type = "button";

    editButton.className =
        "swipe-edit";

    editButton.innerText =
        "수정";


    editButton.onclick =
        function(event) {

            event.stopPropagation();

            editTransaction(
                transaction.id
            );

        };


    const deleteButton =
        document.createElement(
            "button"
        );


    deleteButton.type = "button";

    deleteButton.className =
        "swipe-delete";

    deleteButton.innerText =
        "삭제";


    deleteButton.onclick =
        function(event) {

            event.stopPropagation();

            deleteTransaction(
                transaction.id
            );

        };


    actions.appendChild(
        editButton
    );

    actions.appendChild(
        deleteButton
    );



    const content =
        document.createElement(
            "div"
        );


    content.className =
        "transaction-content";


    const left =
        document.createElement(
            "div"
        );


    left.className =
        "transaction-left";


    if (isSearchResult) {

        const titleRow =
            document.createElement(
                "div"
            );


        titleRow.className =
            "search-result-title";


        const searchDate =
            document.createElement(
                "button"
            );


        searchDate.type = "button";

        searchDate.className =
            "search-result-date";

        searchDate.innerText =
            formatHistoryResultDate(
                transaction.date
            );


        searchDate.onclick =
            function(event) {

                event.stopPropagation();

                goToSearchResultDate(
                    transaction.date
                );

            };


        titleRow.appendChild(
            searchDate
        );


        if (transaction.category) {

            const searchCategory =
                document.createElement(
                    "span"
                );


            searchCategory.className =
                "search-result-category";


            searchCategory.innerText =
                transaction.category;


            titleRow.appendChild(
                searchCategory
            );

        }


        left.appendChild(
            titleRow
        );

    }

    else {

        if (transaction.category) {

            const category =
                document.createElement(
                    "div"
                );


            category.className =
                "transaction-category";


            category.innerText =
                transaction.category;


            left.appendChild(
                category
            );

        }

    }


    const meta =
        document.createElement(
            "div"
        );


    meta.className =
        "transaction-meta";


    const metaParts = [];


    if (transaction.subject) {

        metaParts.push(
            transaction.subject
        );

    }


    if (transaction.memo) {

        metaParts.push(
            transaction.memo
        );

    }


    if (transaction.payment) {

        metaParts.push(
            transaction.payment
        );

    }


    meta.innerText =
        metaParts.join(" · ");


    if (metaParts.length > 0) {

        left.appendChild(
            meta
        );

    }


    const amount =
        document.createElement(
            "div"
        );


    amount.className =
        "transaction-amount";


    amount.classList.add(
        transaction.type === "expense"
            ? "expense"
            : "income"
    );


    amount.innerText =
        transaction.type === "expense"
            ? "-" +
              transaction.amount.toLocaleString(
                  "ko-KR"
              ) +
              "원"
            : "+" +
              transaction.amount.toLocaleString(
                  "ko-KR"
              ) +
              "원";


    content.appendChild(
        left
    );

    content.appendChild(
        amount
    );


    card.appendChild(
        actions
    );

    card.appendChild(
        content
    );


    initializeSwipe(card);


    return card;

}



/* 거래 스와이프 */

function initializeSwipe(card) {

    if (!card) return;


    const content =
        card.querySelector(
            ".transaction-content"
        );


    if (!content) return;


    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let swiping = false;

    const revealWidth = 130;


    content.addEventListener(
        "touchstart",
        function(event) {

            const touch =
                event.touches[0];


            startX =
                touch.clientX;

            startY =
                touch.clientY;

            currentX =
                startX;

            swiping = true;

            content.style.transition =
                "none";

        },
        {
            passive: true
        }
    );


    content.addEventListener(
        "touchmove",
        function(event) {

            if (!swiping) return;


            const touch =
                event.touches[0];


            currentX =
                touch.clientX;


            const currentY =
                touch.clientY;


            const diffX =
                currentX - startX;


            const diffY =
                currentY - startY;


            if (
                Math.abs(diffY) >
                    Math.abs(diffX) &&
                Math.abs(diffY) > 8
            ) {

                swiping = false;

                content.style.transition =
                    "";

                return;

            }


            if (diffX < 0) {

                const translateX =
                    Math.max(
                        diffX,
                        -revealWidth
                    );


                content.style.transform =
                    `translateX(${translateX}px)`;

            }

            else if (
                diffX > 0
            ) {

                const currentTransform =
                    parseFloat(
                        getComputedStyle(
                            content
                        ).transform
                            .replace(
                                /^matrix\([^,]+,[^,]+,[^,]+,[^,]+,([^,]+),.*\)$/,
                                "$1"
                            )
                    );


                if (
                    !isNaN(
                        currentTransform
                    ) &&
                    currentTransform < 0
                ) {

                    const translateX =
                        Math.min(
                            0,
                            currentTransform +
                            diffX
                        );


                    content.style.transform =
                        `translateX(${translateX}px)`;

                }

            }

        },
        {
            passive: true
        }
    );


    content.addEventListener(
        "touchend",
        function() {

            if (!swiping) return;


            swiping = false;


            const diff =
                currentX - startX;


            content.style.transition =
                "transform 0.2s ease";


            if (diff < -50) {

                content.style.transform =
                    `translateX(-${revealWidth}px)`;

            }

            else {

                content.style.transform =
                    "translateX(0)";

            }


            startX = 0;
            startY = 0;
            currentX = 0;

        }
    );


    document.addEventListener(
        "touchstart",
        function(event) {

            if (
                !card.contains(
                    event.target
                )
            ) {

                content.style.transition =
                    "transform 0.2s ease";

                content.style.transform =
                    "translateX(0)";

            }

        },
        {
            passive: true
        }
    );

}



/* 거래 수정 */

function editTransaction(id) {

    const transaction =
        transactions.find(
            item =>
                item.id === id
        );


    if (!transaction) return;


    const currentAmount =
        transaction.amount.toLocaleString(
            "ko-KR"
        );


    const newAmount =
        prompt(
            "금액을 수정하세요.",
            currentAmount
        );


    if (newAmount === null) {

        return;

    }


    const amount =
        Number(
            newAmount.replace(
                /[^0-9]/g,
                ""
            )
        );


    if (!amount || amount <= 0) {

        alert(
            "올바른 금액을 입력해주세요."
        );

        return;

    }


    transaction.amount =
        amount;


    saveTransactions();

    syncUpdateTransaction(
        id,
        {
            amount:
                amount
        }
    );

    renderCalendar();

    renderSelectedDate();

}



/* 거래 삭제 */

function deleteTransaction(id) {

    const transaction =
        transactions.find(
            item =>
                item.id === id
        );


    if (!transaction) return;


    const confirmed =
        confirm(
            "이 내역을 삭제할까요?"
        );


    if (!confirmed) return;


    transactions =
        transactions.filter(
            item =>
                item.id !== id
        );


    saveTransactions();

    syncDeleteTransaction(
        id
    );

    renderCalendar();

    renderSelectedDate();

}



/* 월 변경 */

function changeMonth(delta) {

    calendarDate =
        new Date(
            calendarDate.getFullYear(),
            calendarDate.getMonth() + delta,
            1
        );


    renderCalendar();

}



/* =========================
   거래내역 엑셀로 저장
========================= */

function setExportDates(
    start,
    end
) {

    const startInput =
        document.getElementById(
            "exportStartDate"
        );

    const endInput =
        document.getElementById(
            "exportEndDate"
        );


    if (startInput) {

        startInput.value = start;

    }


    if (endInput) {

        endInput.value = end;

    }

}


function setExportRangeThisMonth() {

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        today.getMonth();


    const start =
        `${year}-${String(
            month + 1
        ).padStart(2, "0")}-01`;


    const lastDate =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const end =
        `${year}-${String(
            month + 1
        ).padStart(2, "0")}-${String(
            lastDate
        ).padStart(2, "0")}`;


    setExportDates(
        start,
        end
    );

}


function setExportRangeLastMonth() {

    const today = new Date();

    const date =
        new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1
        );


    const year =
        date.getFullYear();

    const month =
        date.getMonth();


    const start =
        `${year}-${String(
            month + 1
        ).padStart(2, "0")}-01`;


    const lastDate =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const end =
        `${year}-${String(
            month + 1
        ).padStart(2, "0")}-${String(
            lastDate
        ).padStart(2, "0")}`;


    setExportDates(
        start,
        end
    );

}


function setExportRangeThisYear() {

    const year =
        new Date().getFullYear();


    setExportDates(
        `${year}-01-01`,
        `${year}-12-31`
    );

}


function setExportRangeAll() {

    if (!transactions.length) {

        setExportDates(
            getTodayString(),
            getTodayString()
        );

        return;

    }


    const sorted =
        [...transactions].sort(
            (a, b) =>
                a.date.localeCompare(
                    b.date
                )
        );


    setExportDates(
        sorted[0].date,
        sorted[sorted.length - 1]
            .date
    );

}


function initializeExportDates() {

    const startInput =
        document.getElementById(
            "exportStartDate"
        );

    const endInput =
        document.getElementById(
            "exportEndDate"
        );


    if (!startInput || !endInput) {

        return;

    }


    if (
        !startInput.value ||
        !endInput.value
    ) {

        setExportRangeThisMonth();

    }

}


function exportTransactionsToExcel() {

    const startInput =
        document.getElementById(
            "exportStartDate"
        );

    const endInput =
        document.getElementById(
            "exportEndDate"
        );


    const start =
        startInput
            ? startInput.value
            : "";

    const end =
        endInput
            ? endInput.value
            : "";


    if (!start || !end) {

        alert(
            "기간을 선택해주세요."
        );

        return;

    }


    if (start > end) {

        alert(
            "시작일이 종료일보다 늦을 수 없습니다."
        );

        return;

    }


    const filtered =
        transactions
            .filter(
                transaction =>
                    transaction.date >=
                        start &&
                    transaction.date <=
                        end
            )
            .sort(
                (a, b) =>
                    a.date.localeCompare(
                        b.date
                    ) ||
                    a.id - b.id
            );


    if (!filtered.length) {

        alert(
            "선택한 기간에 내역이 없습니다."
        );

        return;

    }


    if (typeof XLSX === "undefined") {

        alert(
            "엑셀 기능을 불러오지 못했습니다. 인터넷 연결을 확인해주세요."
        );

        return;

    }


    const rows =
        filtered.map(
            transaction => ({

                "날짜":
                    transaction.date,

                "구분":
                    transaction.type ===
                    "expense"
                        ? "지출"
                        : "수입",

                "금액":
                    transaction.amount,

                "카테고리":
                    transaction.category ||
                    "",

                "결제수단":
                    transaction.payment ||
                    "",

                "주체":
                    transaction.subject ||
                    "",

                "메모":
                    transaction.memo ||
                    ""

            })
        );


    const worksheet =
        XLSX.utils.json_to_sheet(
            rows
        );


    worksheet["!cols"] = [
        { wch: 12 },
        { wch: 6 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 8 },
        { wch: 24 }
    ];


    const workbook =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "거래내역"
    );


    const fileName =
        `가계부_거래내역_${start}_${end}.xlsx`;


    XLSX.writeFile(
        workbook,
        fileName
    );

}



/* 카테고리 관리 */

function renderCategoryManagement() {

    renderCategoryManagementList(
        "expense"
    );

    renderCategoryManagementList(
        "income"
    );

}



function renderCategoryManagementList(
    type
) {

    const container =
        document.getElementById(
            type === "expense"
                ? "expenseCategoryList"
                : "incomeCategoryList"
        );


    if (!container) return;


    container.innerHTML = "";


    categories[type].forEach(
        (category, index) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "category-manage-item";


            item.dataset.index =
                index;


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "category-actions";


            const editButton =
                document.createElement(
                    "button"
                );


            editButton.type = "button";

            editButton.className =
                "category-edit";

            editButton.innerText =
                "수정";


            editButton.onclick =
                function(event) {

                    event.stopPropagation();

                    editCategory(
                        type,
                        index
                    );

                };


            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type = "button";

            deleteButton.className =
                "category-delete";

            deleteButton.innerText =
                "삭제";


            deleteButton.onclick =
                function(event) {

                    event.stopPropagation();

                    deleteCategory(
                        type,
                        index
                    );

                };


            actions.appendChild(
                editButton
            );

            actions.appendChild(
                deleteButton
            );


            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "category-manage-content";


            const name =
                document.createElement(
                    "span"
                );


            name.className =
                "category-name";

            name.innerText =
                category;


            const drag =
                document.createElement(
                    "span"
                );


            drag.className =
                "category-drag";

            drag.innerText =
                "⋮⋮";


            content.appendChild(
                name
            );

            content.appendChild(
                drag
            );


            item.appendChild(
                actions
            );

            item.appendChild(
                content
            );


            container.appendChild(
                item
            );


            initializeSingleCategorySwipe(
                item,
                content
            );


            initializeCategoryDrag(
                item,
                drag,
                type
            );

        }
    );

}



function initializeSingleCategorySwipe(
    item,
    content
) {

    let startX = 0;

    let currentX = 0;

    let swiping = false;


    content.addEventListener(
        "touchstart",
        function(event) {

            startX =
                event.touches[0]
                    .clientX;

            currentX =
                startX;

            swiping = true;

        },
        {
            passive: true
        }
    );


    content.addEventListener(
        "touchmove",
        function(event) {

            if (!swiping) return;


            currentX =
                event.touches[0]
                    .clientX;


            const diff =
                currentX -
                startX;


            if (
                diff < 0 &&
                diff > -120
            ) {

                content.style.transform =
                    `translateX(${diff}px)`;

            }

        },
        {
            passive: true
        }
    );


    content.addEventListener(
        "touchend",
        function() {

            if (!swiping) return;


            swiping = false;


            const diff =
                currentX -
                startX;


            if (diff < -50) {

                content.style.transform =
                    "translateX(-120px)";

            }

            else {

                content.style.transform =
                    "translateX(0)";

            }


            startX = 0;

            currentX = 0;

        }
    );

}



function initializeCategoryDrag(
    item,
    handle,
    type
) {

    let startY = 0;

    let dragging = false;


    handle.addEventListener(
        "touchstart",
        function(event) {

            event.preventDefault();

            startY =
                event.touches[0]
                    .clientY;

            dragging = true;

            item.classList.add(
                "dragging"
            );

        },
        {
            passive: false
        }
    );


    handle.addEventListener(
        "touchmove",
        function(event) {

            if (!dragging) return;


            const currentY =
                event.touches[0]
                    .clientY;


            const diff =
                currentY -
                startY;


            if (
                Math.abs(diff) < 20
            ) {

                return;

            }


            const currentIndex =
                Number(
                    item.dataset.index
                );


            const direction =
                diff > 0
                    ? 1
                    : -1;


            const newIndex =
                currentIndex +
                direction;


            if (
                newIndex < 0 ||
                newIndex >=
                    categories[type].length
            ) {

                return;

            }


            const temp =
                categories[type][
                    currentIndex
                ];


            categories[type][
                currentIndex
            ] =
                categories[type][
                    newIndex
                ];


            categories[type][
                newIndex
            ] = temp;


            saveCategories();

            renderCategoryManagement();

            renderCategoryButtons();


            dragging = false;

        },
        {
            passive: false
        }
    );


    handle.addEventListener(
        "touchend",
        function() {

            dragging = false;

            item.classList.remove(
                "dragging"
            );

        }
    );

}



function addCategory(type) {

    const name =
        prompt(
            "카테고리 이름을 입력하세요."
        );


    if (name === null) {

        return;

    }


    const trimmed =
        name.trim();


    if (!trimmed) return;


    if (
        categories[type].includes(
            trimmed
        )
    ) {

        alert(
            "이미 존재하는 카테고리입니다."
        );

        return;

    }


    categories[type].push(
        trimmed
    );


    saveCategories();

    renderCategoryManagement();

    renderCategoryButtons();

}



function editCategory(
    type,
    index
) {

    const oldName =
        categories[type][index];


    const newName =
        prompt(
            "카테고리 이름을 수정하세요.",
            oldName
        );


    if (newName === null) {

        return;

    }


    const trimmed =
        newName.trim();


    if (!trimmed) return;


    if (
        categories[type].includes(
            trimmed
        ) &&
        trimmed !== oldName
    ) {

        alert(
            "이미 존재하는 카테고리입니다."
        );

        return;

    }


    categories[type][index] =
        trimmed;


    transactions.forEach(
        transaction => {

            if (
                transaction.category ===
                oldName
            ) {

                transaction.category =
                    trimmed;

            }

        }
    );


    if (
        selectedCategory ===
        oldName
    ) {

        selectedCategory =
            trimmed;

    }


    saveCategories();

    saveTransactions();

    syncRenameTransactionsField(
        "category",
        oldName,
        trimmed
    );

    renderCategoryManagement();

    renderCategoryButtons();

    renderSelectedDate();

}



function deleteCategory(
    type,
    index
) {

    const name =
        categories[type][index];


    const confirmed =
        confirm(
            `"${name}" 카테고리를 삭제할까요?\n\n기존 거래 내역은 삭제되지 않습니다.`
        );


    if (!confirmed) return;


    categories[type].splice(
        index,
        1
    );


    if (
        selectedCategory ===
        name
    ) {

        selectedCategory = "";

    }


    saveCategories();

    renderCategoryManagement();

    renderCategoryButtons();

}



/* 결제수단 관리 */

function renderPaymentManagement() {

    const container =
        document.getElementById(
            "paymentMethodList"
        );


    if (!container) return;


    container.innerHTML = "";


    paymentMethods.forEach(
        (payment, index) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "category-manage-item";


            item.dataset.index =
                index;


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "category-actions";


            const editButton =
                document.createElement(
                    "button"
                );


            editButton.type = "button";

            editButton.className =
                "category-edit";

            editButton.innerText =
                "수정";


            editButton.onclick =
                function(event) {

                    event.stopPropagation();

                    editPaymentMethod(
                        index
                    );

                };


            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type = "button";

            deleteButton.className =
                "category-delete";

            deleteButton.innerText =
                "삭제";


            deleteButton.onclick =
                function(event) {

                    event.stopPropagation();

                    deletePaymentMethod(
                        index
                    );

                };


            actions.appendChild(
                editButton
            );

            actions.appendChild(
                deleteButton
            );


            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "category-manage-content";


            const name =
                document.createElement(
                    "span"
                );


            name.className =
                "category-name";

            name.innerText =
                payment;


            const drag =
                document.createElement(
                    "span"
                );


            drag.className =
                "category-drag";

            drag.innerText =
                "⋮⋮";


            content.appendChild(
                name
            );

            content.appendChild(
                drag
            );


            item.appendChild(
                actions
            );

            item.appendChild(
                content
            );


            container.appendChild(
                item
            );


            initializeSingleCategorySwipe(
                item,
                content
            );


            initializePaymentDrag(
                item,
                drag
            );

        }
    );

}



function initializePaymentDrag(
    item,
    handle
) {

    let startY = 0;

    let dragging = false;


    handle.addEventListener(
        "touchstart",
        function(event) {

            event.preventDefault();

            startY =
                event.touches[0]
                    .clientY;

            dragging = true;

            item.classList.add(
                "dragging"
            );

        },
        {
            passive: false
        }
    );


    handle.addEventListener(
        "touchmove",
        function(event) {

            if (!dragging) return;


            const currentY =
                event.touches[0]
                    .clientY;


            const diff =
                currentY -
                startY;


            if (
                Math.abs(diff) < 20
            ) {

                return;

            }


            const currentIndex =
                Number(
                    item.dataset.index
                );


            const direction =
                diff > 0
                    ? 1
                    : -1;


            const newIndex =
                currentIndex +
                direction;


            if (
                newIndex < 0 ||
                newIndex >=
                    paymentMethods.length
            ) {

                return;

            }


            const temp =
                paymentMethods[
                    currentIndex
                ];


            paymentMethods[
                currentIndex
            ] =
                paymentMethods[
                    newIndex
                ];


            paymentMethods[
                newIndex
            ] = temp;


            savePaymentMethods();

            renderPaymentManagement();

            renderPaymentButtons();


            dragging = false;

        },
        {
            passive: false
        }
    );


    handle.addEventListener(
        "touchend",
        function() {

            dragging = false;

            item.classList.remove(
                "dragging"
            );

        }
    );

}



function addPaymentMethod() {

    const name =
        prompt(
            "결제수단 이름을 입력하세요."
        );


    if (name === null) {

        return;

    }


    const trimmed =
        name.trim();


    if (!trimmed) return;


    if (
        paymentMethods.includes(
            trimmed
        )
    ) {

        alert(
            "이미 존재하는 결제수단입니다."
        );

        return;

    }


    paymentMethods.push(
        trimmed
    );


    savePaymentMethods();

    renderPaymentManagement();

    renderPaymentButtons();

}



function editPaymentMethod(index) {

    const oldName =
        paymentMethods[index];


    const newName =
        prompt(
            "결제수단 이름을 수정하세요.",
            oldName
        );


    if (newName === null) {

        return;

    }


    const trimmed =
        newName.trim();


    if (!trimmed) return;


    if (
        paymentMethods.includes(
            trimmed
        ) &&
        trimmed !== oldName
    ) {

        alert(
            "이미 존재하는 결제수단입니다."
        );

        return;

    }


    paymentMethods[index] =
        trimmed;


    transactions.forEach(
        transaction => {

            if (
                transaction.payment ===
                oldName
            ) {

                transaction.payment =
                    trimmed;

            }

        }
    );


    if (
        selectedPayment ===
        oldName
    ) {

        selectedPayment =
            trimmed;

    }


    savePaymentMethods();

    saveTransactions();

    syncRenameTransactionsField(
        "payment",
        oldName,
        trimmed
    );

    renderPaymentManagement();

    renderPaymentButtons();

    renderSelectedDate();

}



function deletePaymentMethod(index) {

    const name =
        paymentMethods[index];


    const confirmed =
        confirm(
            `"${name}" 결제수단을 삭제할까요?\n\n기존 거래 내역은 삭제되지 않습니다.`
        );


    if (!confirmed) return;


    paymentMethods.splice(
        index,
        1
    );


    if (
        selectedPayment ===
        name
    ) {

        selectedPayment = "";

    }


    savePaymentMethods();

    renderPaymentManagement();

    renderPaymentButtons();

}



/* 주체 관리 */

function renderSubjectManagement() {

    const container =
        document.getElementById(
            "subjectList"
        );


    if (!container) return;


    container.innerHTML = "";


    subjects.forEach(
        (subject, index) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "category-manage-item";


            item.dataset.index =
                index;


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "category-actions";


            const editButton =
                document.createElement(
                    "button"
                );


            editButton.type = "button";

            editButton.className =
                "category-edit";

            editButton.innerText =
                "수정";


            editButton.onclick =
                function(event) {

                    event.stopPropagation();

                    editSubject(
                        index
                    );

                };


            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type = "button";

            deleteButton.className =
                "category-delete";

            deleteButton.innerText =
                "삭제";


            deleteButton.onclick =
                function(event) {

                    event.stopPropagation();

                    deleteSubject(
                        index
                    );

                };


            actions.appendChild(
                editButton
            );

            actions.appendChild(
                deleteButton
            );


            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "category-manage-content";


            const name =
                document.createElement(
                    "span"
                );


            name.className =
                "category-name";

            name.innerText =
                subject;


            const drag =
                document.createElement(
                    "span"
                );


            drag.className =
                "category-drag";

            drag.innerText =
                "⋮⋮";


            content.appendChild(
                name
            );

            content.appendChild(
                drag
            );


            item.appendChild(
                actions
            );

            item.appendChild(
                content
            );


            container.appendChild(
                item
            );


            initializeSingleCategorySwipe(
                item,
                content
            );


            initializeSubjectDrag(
                item,
                drag
            );

        }
    );

}



function initializeSubjectDrag(
    item,
    handle
) {

    let startY = 0;

    let dragging = false;


    handle.addEventListener(
        "touchstart",
        function(event) {

            event.preventDefault();

            startY =
                event.touches[0]
                    .clientY;

            dragging = true;

            item.classList.add(
                "dragging"
            );

        },
        {
            passive: false
        }
    );


    handle.addEventListener(
        "touchmove",
        function(event) {

            if (!dragging) return;


            const currentY =
                event.touches[0]
                    .clientY;


            const diff =
                currentY -
                startY;


            if (
                Math.abs(diff) < 20
            ) {

                return;

            }


            const currentIndex =
                Number(
                    item.dataset.index
                );


            const direction =
                diff > 0
                    ? 1
                    : -1;


            const newIndex =
                currentIndex +
                direction;


            if (
                newIndex < 0 ||
                newIndex >=
                    subjects.length
            ) {

                return;

            }


            const temp =
                subjects[
                    currentIndex
                ];


            subjects[
                currentIndex
            ] =
                subjects[
                    newIndex
                ];


            subjects[
                newIndex
            ] = temp;


            saveSubjects();

            renderSubjectManagement();

            renderSubjectButtons();


            dragging = false;

        },
        {
            passive: false
        }
    );


    handle.addEventListener(
        "touchend",
        function() {

            dragging = false;

            item.classList.remove(
                "dragging"
            );

        }
    );

}



function addSubject() {

    const name =
        prompt(
            "주체 이름을 입력하세요."
        );


    if (name === null) {

        return;

    }


    const trimmed =
        name.trim();


    if (!trimmed) return;


    if (
        subjects.includes(
            trimmed
        )
    ) {

        alert(
            "이미 존재하는 주체입니다."
        );

        return;

    }


    subjects.push(
        trimmed
    );


    saveSubjects();

    renderSubjectManagement();

    renderSubjectButtons();

}



function editSubject(index) {

    const oldName =
        subjects[index];


    const newName =
        prompt(
            "주체 이름을 수정하세요.",
            oldName
        );


    if (newName === null) {

        return;

    }


    const trimmed =
        newName.trim();


    if (!trimmed) return;


    if (
        subjects.includes(
            trimmed
        ) &&
        trimmed !== oldName
    ) {

        alert(
            "이미 존재하는 주체입니다."
        );

        return;

    }


    subjects[index] =
        trimmed;


    transactions.forEach(
        transaction => {

            if (
                transaction.subject ===
                oldName
            ) {

                transaction.subject =
                    trimmed;

            }

        }
    );


    if (
        selectedSubject ===
        oldName
    ) {

        selectedSubject =
            trimmed;

    }


    saveSubjects();

    saveTransactions();

    syncRenameTransactionsField(
        "subject",
        oldName,
        trimmed
    );

    renderSubjectManagement();

    renderSubjectButtons();

    renderSelectedDate();

}



function deleteSubject(index) {

    const name =
        subjects[index];


    const confirmed =
        confirm(
            `"${name}" 주체를 삭제할까요?\n\n기존 거래 내역은 삭제되지 않습니다.`
        );


    if (!confirmed) return;


    subjects.splice(
        index,
        1
    );


    if (
        selectedSubject ===
        name
    ) {

        selectedSubject = "";

    }


    saveSubjects();

    renderSubjectManagement();

    renderSubjectButtons();

}



/* 최초 실행 */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        updateInputDateText();

        updateSettingsUI();

        renderCategoryButtons();

        renderSubjectButtons();

        renderPaymentButtons();

        renderCategoryManagement();

        renderPaymentManagement();

        renderSubjectManagement();

        renderCalendar();

        renderSelectedDate();


        document
            .getElementById(
                "pageTitle"
            )
            .innerText = "입력";


        const header =
            document.querySelector(
                ".header"
            );


        if (header) {

            header.classList.add(
                "hidden"
            );

        }


        checkExistingSession();

    }
);

/* =========================================================
   분석
========================================================= */

let analysisType = "expense";

let analysisSelectedCategory = "";
let analysisSelectedPayment = "";
let analysisSelectedSubject = "";


/* 오늘 날짜 */

function getAnalysisTodayString() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* 올해 1월 1일 */

function getAnalysisStartOfYear() {

    const today = new Date();

    return `${today.getFullYear()}-01-01`;
}


/* 금액 */

function formatAnalysisAmount(amount) {

    return Number(amount || 0).toLocaleString("ko-KR");
}


/* 기간 일수 */

function getAnalysisDays(startDate, endDate) {

    const start = new Date(
        startDate + "T00:00:00"
    );

    const end = new Date(
        endDate + "T00:00:00"
    );

    const difference =
        end.getTime() -
        start.getTime();

    return (
        Math.floor(
            difference /
            (1000 * 60 * 60 * 24)
        ) + 1
    );
}


/* 월평균
   산식: 총액 ÷ (기간 일수 ÷ 30.44) */

function getAnalysisMonthlyAverage(
    amount,
    startDate,
    endDate
) {

    const days =
        getAnalysisDays(
            startDate,
            endDate
        );

    if (
        !days ||
        days <= 0
    ) {
        return 0;
    }

    return (
        Number(amount || 0) /
        (days / 30.44)
    );

}


/* 분석 거래 가져오기 */

function getAnalysisTransactions() {

    const start =
        document.getElementById(
            "analysisStartDate"
        )?.value;

    const end =
        document.getElementById(
            "analysisEndDate"
        )?.value;

    if (!start || !end) {
        return [];
    }

    return transactions.filter(
        transaction => {

            if (
                transaction.type !==
                analysisType
            ) {
                return false;
            }

            if (
                transaction.date < start ||
                transaction.date > end
            ) {
                return false;
            }

            return true;

        }
    );

}


/* 지출 / 수입 */

function setAnalysisType(type) {

    analysisType = type;

    analysisSelectedCategory = "";
    analysisSelectedPayment = "";
    analysisSelectedSubject = "";

    const expenseButton =
        document.getElementById(
            "analysisExpenseBtn"
        );

    const incomeButton =
        document.getElementById(
            "analysisIncomeBtn"
        );

    if (expenseButton) {

        expenseButton.classList.toggle(
            "active",
            type === "expense"
        );

    }

    if (incomeButton) {

        incomeButton.classList.toggle(
            "active",
            type === "income"
        );

    }

    renderAnalysis();

}


/* 날짜 표시 (2026년 1월 1일 형식) */

function formatAnalysisDateDisplay(
    dateString
) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(
            dateString +
            "T00:00:00"
        );

    return `${date.getFullYear()}년 ${
        date.getMonth() + 1
    }월 ${
        date.getDate()
    }일`;

}


function updateAnalysisDateText() {

    const startText =
        document.getElementById(
            "analysisStartDateText"
        );

    const endText =
        document.getElementById(
            "analysisEndDateText"
        );

    const startInput =
        document.getElementById(
            "analysisStartDate"
        );

    const endInput =
        document.getElementById(
            "analysisEndDate"
        );

    if (
        startText &&
        startInput
    ) {

        startText.innerText =
            formatAnalysisDateDisplay(
                startInput.value
            );

    }

    if (
        endText &&
        endInput
    ) {

        endText.innerText =
            formatAnalysisDateDisplay(
                endInput.value
            );

    }


    fitAnalysisDateRow();

}


/* 날짜 범위가 한 줄에 들어가도록 글자 크기 자동 축소 */

function fitAnalysisDateRow() {

    const row =
        document.getElementById(
            "analysisDateRow"
        );

    if (!row) {
        return;
    }

    const pieces =
        row.querySelectorAll(
            ".analysis-date-text, .analysis-date-separator"
        );

    if (!pieces.length) {
        return;
    }

    let fontSize = 23;

    pieces.forEach(
        piece => {

            piece.style.fontSize =
                fontSize + "px";

        }
    );


    while (
        row.scrollWidth >
            row.clientWidth &&
        fontSize > 13
    ) {

        fontSize -= 1;

        pieces.forEach(
            piece => {

                piece.style.fontSize =
                    fontSize + "px";

            }
        );

    }

}


/* 날짜 */

function initializeAnalysisDates() {

    const startInput =
        document.getElementById(
            "analysisStartDate"
        );

    const endInput =
        document.getElementById(
            "analysisEndDate"
        );

    if (!startInput || !endInput) {
        return;
    }

    if (!startInput.value) {

        startInput.value =
            getAnalysisStartOfYear();

    }

    if (!endInput.value) {

        endInput.value =
            getAnalysisTodayString();

    }

    updateAnalysisDateText();

    startInput.onchange =
        function() {

            if (
                startInput.value >
                endInput.value
            ) {

                endInput.value =
                    startInput.value;

            }

            updateAnalysisDateText();

            analysisSelectedCategory = "";
            analysisSelectedPayment = "";
            analysisSelectedSubject = "";

            renderAnalysis();

        };


    endInput.onchange =
        function() {

            if (
                endInput.value <
                startInput.value
            ) {

                startInput.value =
                    endInput.value;

            }

            updateAnalysisDateText();

            analysisSelectedCategory = "";
            analysisSelectedPayment = "";
            analysisSelectedSubject = "";

            renderAnalysis();

        };

}


/* 카테고리별 집계 */

function getAnalysisCategoryData(
    transactions
) {

    const result = {};

    transactions.forEach(
        transaction => {

            const name =
                transaction.category ||
                "미분류";

            if (!result[name]) {
                result[name] = 0;
            }

            result[name] +=
                Number(
                    transaction.amount
                ) || 0;

        }
    );

    return result;

}


/* 결제수단별 집계 */

function getAnalysisPaymentData(
    transactions
) {

    const result = {};

    transactions.forEach(
        transaction => {

            const name =
                transaction.payment ||
                "미지정";

            if (!result[name]) {
                result[name] = 0;
            }

            result[name] +=
                Number(
                    transaction.amount
                ) || 0;

        }
    );

    return result;

}


/* 주체별 집계 */

function getAnalysisSubjectData(
    transactions
) {

    const result = {};

    transactions.forEach(
        transaction => {

            const name =
                transaction.subject ||
                "미지정";

            if (!result[name]) {
                result[name] = 0;
            }

            result[name] +=
                Number(
                    transaction.amount
                ) || 0;

        }
    );

    return result;

}


/* 카테고리 / 결제수단 / 주체 비율 그래프 (그룹 제목 바로 아래, 한 줄) */

const analysisBarColors = [
    "#222222",
    "#3d78d8",
    "#e05252",
    "#f0a93a",
    "#4caf50",
    "#8e6dd8",
    "#00acc1",
    "#c2185b",
    "#8d6e63",
    "#7ba7e0",
    "#aaaaaa",
    "#cfcfcf"
];


/* 항목을 금액이 큰 순으로 정렬 */

function sortAnalysisEntriesByAmount(
    dataObject
) {

    return Object.entries(
        dataObject
    ).sort(
        (a, b) =>
            b[1] - a[1]
    );

}


function renderAnalysisGroupBar(
    elementId,
    infoElementId,
    dataObject,
    total
) {

    const container =
        document.getElementById(
            elementId
        );

    const info =
        document.getElementById(
            infoElementId
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (info) {

        info.innerText = "";

    }

    if (
        !total ||
        total <= 0
    ) {
        return;
    }

    let selectedSegment = null;


    sortAnalysisEntriesByAmount(
        dataObject
    ).forEach(
        (
            [name, amount],
            index
        ) => {

            const percentage =
                (
                    amount /
                    total
                ) * 100;

            const segment =
                document.createElement(
                    "div"
                );

            segment.className =
                "analysis-group-bar-segment";

            segment.style.width =
                percentage + "%";

            segment.style.background =
                analysisBarColors[
                    index %
                    analysisBarColors.length
                ];


            segment.onclick =
                function() {

                    const allSegments =
                        container.querySelectorAll(
                            ".analysis-group-bar-segment"
                        );


                    if (
                        selectedSegment ===
                        segment
                    ) {

                        selectedSegment = null;

                        allSegments.forEach(
                            other => {

                                other.classList.remove(
                                    "dimmed"
                                );

                            }
                        );

                        if (info) {

                            info.innerText = "";

                        }

                        return;

                    }


                    selectedSegment =
                        segment;


                    allSegments.forEach(
                        other => {

                            other.classList.toggle(
                                "dimmed",
                                other !== segment
                            );

                        }
                    );


                    if (info) {

                        info.innerText =
                            `${name} · ${percentage.toFixed(1)}%`;

                    }

                };


            container.appendChild(
                segment
            );

        }
    );

}


/* 분석 버튼 */

function createAnalysisItem(
    name,
    amount,
    clickFunction,
    startDate,
    endDate
) {

    const button =
        document.createElement(
            "button"
        );

    button.type = "button";

    button.className =
        "analysis-item";

    button.onclick =
        clickFunction;

    const nameElement =
        document.createElement(
            "span"
        );

    nameElement.className =
        "analysis-item-name";

    nameElement.textContent =
        name;


    const amountElement =
        document.createElement(
            "span"
        );

    amountElement.className =
        "analysis-item-amount";

    amountElement.textContent =
        formatAnalysisAmount(
            amount
        ) + "원";


    const averageElement =
        document.createElement(
            "span"
        );

    averageElement.className =
        "analysis-item-average";

    const periodAverage =
        getAnalysisMonthlyAverage(
            amount,
            startDate,
            endDate
        );

    averageElement.textContent =
        formatAnalysisAmount(
            Math.round(
                periodAverage
            )
        ) + "원";


    button.appendChild(
        nameElement
    );

    button.appendChild(
        amountElement
    );

    button.appendChild(
        averageElement
    );

    return button;

}


/* 합계 */

function renderAnalysisSummary(
    elementId,
    total,
    startDate,
    endDate
) {

    const element =
        document.getElementById(
            elementId
        );

    if (!element) {
        return;
    }

    const monthlyAverage =
        getAnalysisMonthlyAverage(
            total,
            startDate,
            endDate
        );

    element.innerHTML = `

        <div class="analysis-summary-item">

            <span class="analysis-summary-label">
                전체 합산
            </span>

            <span class="analysis-summary-value">
                ${formatAnalysisAmount(total)}원
            </span>

        </div>

        <div class="analysis-summary-item">

            <span class="analysis-summary-label">
                기간 월평균
            </span>

            <span class="analysis-summary-value">
                ${formatAnalysisAmount(Math.round(monthlyAverage))}원
            </span>

        </div>

    `;

}


/* 전체금액 / 월평균 (지출·수입 아래) */

function renderAnalysisOverallSummary(
    total,
    startDate,
    endDate
) {

    const element =
        document.getElementById(
            "analysisOverallSummary"
        );

    if (!element) {
        return;
    }

    const monthlyAverage =
        getAnalysisMonthlyAverage(
            total,
            startDate,
            endDate
        );

    element.innerHTML = `

        <div class="analysis-overall-summary-item">

            <span class="analysis-overall-summary-label">
                전체금액
            </span>

            <span class="analysis-overall-summary-value">
                ${formatAnalysisAmount(total)}원
            </span>

        </div>

        <div class="analysis-overall-summary-item">

            <span class="analysis-overall-summary-label">
                월평균
            </span>

            <span class="analysis-overall-summary-value">
                ${formatAnalysisAmount(Math.round(monthlyAverage))}원
            </span>

        </div>

    `;

}


/* 날짜 표시 */

function formatAnalysisDate(
    dateString
) {

    if (!dateString) {
        return "";
    }

    const parts =
        dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    return (
        Number(parts[0]) +
        "." +
        Number(parts[1]) +
        "." +
        Number(parts[2])
    );

}


/* 상세 내역 */

function renderAnalysisDetails(
    elementId,
    transactions,
    filterField,
    filterValue
) {

    const element =
        document.getElementById(
            elementId
        );

    if (!element) {
        return;
    }

    const filtered =
        transactions.filter(
            transaction => {

                const value =
                    transaction[filterField] ||
                    (
                        filterField ===
                        "payment"
                            ? "미지정"
                            : filterField ===
                              "subject"
                                ? "미지정"
                                : "미분류"
                    );

                return (
                    value ===
                    filterValue
                );

            }
        );

    if (!filtered.length) {

        element.innerHTML = `
            <div class="no-transactions">
                해당 내역이 없습니다.
            </div>
        `;

        element.classList.add(
            "active"
        );

        return;

    }


    element.innerHTML = "";


    filtered
        .sort(
            (a, b) =>
                a.date.localeCompare(
                    b.date
                )
        )
        .forEach(
            transaction => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "analysis-detail-card";


                const left =
                    document.createElement(
                        "div"
                    );

                left.className =
                    "analysis-detail-left";


                const date =
                    document.createElement(
                        "div"
                    );

                date.className =
                    "analysis-detail-date";

                date.textContent =
                    formatAnalysisDate(
                        transaction.date
                    );


                const name =
                    document.createElement(
                        "div"
                    );

                name.className =
                    "analysis-detail-name";

                name.textContent =
                    transaction.category ||
                    "미분류";


                const meta =
                    document.createElement(
                        "div"
                    );

                meta.className =
                    "analysis-detail-meta";

                const metaParts = [];


                if (
                    filterField !==
                    "category"
                ) {

                    if (
                        transaction.payment
                    ) {

                        metaParts.push(
                            transaction.payment
                        );

                    }


                    if (
                        transaction.subject
                    ) {

                        metaParts.push(
                            transaction.subject
                        );

                    }

                }


                if (
                    transaction.memo
                ) {

                    metaParts.push(
                        transaction.memo
                    );

                }


                meta.textContent =
                    metaParts.join(
                        " · "
                    );


                left.appendChild(
                    date
                );

                if (
                    filterField !==
                    "category"
                ) {

                    left.appendChild(
                        name
                    );

                }

                if (
                    meta.textContent
                ) {

                    left.appendChild(
                        meta
                    );

                }


                const amount =
                    document.createElement(
                        "div"
                    );

                amount.className =
                    "analysis-detail-amount " +
                    analysisType;

                amount.textContent =
                    (
                        analysisType ===
                        "expense"
                            ? "-"
                            : "+"
                    ) +
                    formatAnalysisAmount(
                        transaction.amount
                    ) +
                    "원";


                card.appendChild(
                    left
                );

                card.appendChild(
                    amount
                );


                element.appendChild(
                    card
                );

            }
        );


    element.classList.add(
        "active"
    );

}


/* 카테고리 선택 */

function selectAnalysisCategory(
    category
) {

    if (
        analysisSelectedCategory ===
        category
    ) {

        analysisSelectedCategory = "";

        const details =
            document.getElementById(
                "analysisCategoryDetails"
            );

        if (details) {
            details.classList.remove(
                "active"
            );
        }

        return;

    }


    analysisSelectedCategory =
        category;

    const transactions =
        getAnalysisTransactions();

    renderAnalysisDetails(
        "analysisCategoryDetails",
        transactions,
        "category",
        category
    );

}


/* 결제수단 선택 */

function selectAnalysisPayment(
    payment
) {

    if (
        analysisSelectedPayment ===
        payment
    ) {

        analysisSelectedPayment = "";

        const details =
            document.getElementById(
                "analysisPaymentDetails"
            );

        if (details) {
            details.classList.remove(
                "active"
            );
        }

        return;

    }


    analysisSelectedPayment =
        payment;

    const transactions =
        getAnalysisTransactions();

    renderAnalysisDetails(
        "analysisPaymentDetails",
        transactions,
        "payment",
        payment
    );

}


/* 주체 선택 */

function selectAnalysisSubject(
    subject
) {

    if (
        analysisSelectedSubject ===
        subject
    ) {

        analysisSelectedSubject = "";

        const details =
            document.getElementById(
                "analysisSubjectDetails"
            );

        if (details) {
            details.classList.remove(
                "active"
            );
        }

        return;

    }


    analysisSelectedSubject =
        subject;

    const transactions =
        getAnalysisTransactions();

    renderAnalysisDetails(
        "analysisSubjectDetails",
        transactions,
        "subject",
        subject
    );

}


/* =========================================================
   월별 세로 막대그래프
   (기간 내 각 월의 합계를,
    카테고리 비율로 색을 나눠 쌓아 표시)
========================================================= */

const monthlyChartColors = [
    "#4f80e1",
    "#e9a23b",
    "#5ec488",
    "#e2607f",
    "#8c6fd1",
    "#3fb6c9",
    "#d98a53",
    "#7a90a4",
    "#c8556b",
    "#5aa8d1",
    "#9c9c9c",
    "#c9c9c9"
];


/* 기간에 포함된 월(YYYY-MM) 목록 */

function getAnalysisMonthKeys(
    startDate,
    endDate
) {

    const keys = [];

    const cursor =
        new Date(
            startDate.slice(0, 7) +
            "-01T00:00:00"
        );

    const endCursor =
        new Date(
            endDate.slice(0, 7) +
            "-01T00:00:00"
        );

    while (cursor <= endCursor) {

        const year =
            cursor.getFullYear();

        const month =
            String(
                cursor.getMonth() + 1
            ).padStart(2, "0");

        keys.push(
            `${year}-${month}`
        );

        cursor.setMonth(
            cursor.getMonth() + 1
        );

    }

    return keys;

}


function renderAnalysisMonthlyChart(
    transactionsForChart,
    startDate,
    endDate
) {

    const group =
        document.getElementById(
            "analysisMonthlyChartGroup"
        );

    const container =
        document.getElementById(
            "analysisMonthlyChart"
        );

    const legend =
        document.getElementById(
            "analysisMonthlyLegend"
        );

    if (
        !group ||
        !container ||
        !legend
    ) {
        return;
    }


    if (!settings.monthlyChartEnabled) {

        group.style.display =
            "none";

        return;

    }

    group.style.display =
        "block";


    container.innerHTML = "";

    legend.innerHTML = "";


    if (
        !startDate ||
        !endDate
    ) {
        return;
    }


    const monthKeys =
        getAnalysisMonthKeys(
            startDate,
            endDate
        );


    /* 월별 · 카테고리별 집계 */

    const monthData = {};

    monthKeys.forEach(
        key => {

            monthData[key] = {
                total: 0,
                categories: {}
            };

        }
    );


    transactionsForChart.forEach(
        transaction => {

            const monthKey =
                transaction.date.slice(
                    0,
                    7
                );

            if (
                !monthData[monthKey]
            ) {
                return;
            }

            const name =
                transaction.category ||
                "미분류";

            const amount =
                Number(
                    transaction.amount
                ) || 0;

            monthData[monthKey]
                .categories[name] =
                (
                    monthData[monthKey]
                        .categories[name] ||
                    0
                ) + amount;

            monthData[monthKey].total +=
                amount;

        }
    );


    /* 기간 전체 기준 카테고리 비중 순서 및 색상 매핑 */

    const categoryTotals = {};

    Object.values(
        monthData
    ).forEach(
        month => {

            Object.entries(
                month.categories
            ).forEach(
                ([name, amount]) => {

                    categoryTotals[name] =
                        (
                            categoryTotals[name] ||
                            0
                        ) + amount;

                }
            );

        }
    );


    const sortedCategoryNames =
        Object.keys(
            categoryTotals
        ).sort(
            (a, b) =>
                categoryTotals[b] -
                categoryTotals[a]
        );


    const colorMap = {};

    sortedCategoryNames.forEach(
        (name, index) => {

            colorMap[name] =
                monthlyChartColors[
                    index %
                    monthlyChartColors.length
                ];

        }
    );


    if (!sortedCategoryNames.length) {

        container.innerHTML =
            `<div class="monthly-chart-empty">해당 기간에 내역이 없습니다.</div>`;

        return;

    }


    const maxTotal =
        Math.max(
            1,
            ...monthKeys.map(
                key =>
                    monthData[key].total
            )
        );


    const barMaxHeight = 180;


    monthKeys.forEach(
        key => {

            const data =
                monthData[key];


            const col =
                document.createElement(
                    "div"
                );

            col.className =
                "monthly-chart-col";


            const amountLabel =
                document.createElement(
                    "div"
                );

            amountLabel.className =
                "monthly-chart-amount";

            amountLabel.textContent =
                data.total > 0
                    ? formatCompactAmount(
                          data.total
                      )
                    : "";


            const barWrap =
                document.createElement(
                    "div"
                );

            barWrap.className =
                "monthly-chart-bar-wrap";


            const bar =
                document.createElement(
                    "div"
                );

            bar.className =
                "monthly-chart-bar";

            const barHeight =
                data.total > 0
                    ? (
                          data.total /
                          maxTotal
                      ) * barMaxHeight
                    : 0;

            bar.style.height =
                barHeight + "px";


            const monthCategoriesSorted =
                Object.entries(
                    data.categories
                ).sort(
                    (a, b) =>
                        b[1] - a[1]
                );


            monthCategoriesSorted.forEach(
                ([name, amount]) => {

                    const ratio =
                        data.total > 0
                            ? amount /
                              data.total
                            : 0;

                    const segment =
                        document.createElement(
                            "div"
                        );

                    segment.className =
                        "monthly-chart-segment";

                    segment.style.height =
                        (ratio * 100) +
                        "%";

                    segment.style.background =
                        colorMap[name];

                    segment.title =
                        `${name} · ${Math.round(ratio * 100)}%`;


                    if (ratio >= 0.1) {

                        const label =
                            document.createElement(
                                "span"
                            );

                        label.className =
                            "monthly-chart-segment-label";

                        label.textContent =
                            Math.round(
                                ratio * 100
                            ) + "%";

                        segment.appendChild(
                            label
                        );

                    }


                    bar.appendChild(
                        segment
                    );

                }
            );


            barWrap.appendChild(
                bar
            );


            const monthLabel =
                document.createElement(
                    "div"
                );

            monthLabel.className =
                "monthly-chart-month";

            const [
                ,
                monthPart
            ] = key.split("-");

            monthLabel.textContent =
                Number(monthPart) +
                "월";


            col.appendChild(
                amountLabel
            );

            col.appendChild(
                barWrap
            );

            col.appendChild(
                monthLabel
            );


            container.appendChild(
                col
            );

        }
    );


    /* 범례 */

    sortedCategoryNames.forEach(
        name => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "monthly-chart-legend-item";


            const dot =
                document.createElement(
                    "span"
                );

            dot.className =
                "monthly-chart-legend-dot";

            dot.style.background =
                colorMap[name];


            const label =
                document.createElement(
                    "span"
                );

            label.textContent =
                name;


            item.appendChild(
                dot
            );

            item.appendChild(
                label
            );


            legend.appendChild(
                item
            );

        }
    );

}


/* 분석 전체 렌더링 */

function renderAnalysis() {

    const startInput =
        document.getElementById(
            "analysisStartDate"
        );

    const endInput =
        document.getElementById(
            "analysisEndDate"
        );

    if (
        !startInput ||
        !endInput
    ) {
        return;
    }


    if (
        !startInput.value ||
        !endInput.value
    ) {
        initializeAnalysisDates();
    }


    const startDate =
        startInput.value;

    const endDate =
        endInput.value;


    if (
        !startDate ||
        !endDate
    ) {
        return;
    }


    const transactions =
        getAnalysisTransactions();


    const total =
        transactions.reduce(
            (
                sum,
                transaction
            ) => {

                return (
                    sum +
                    (
                        Number(
                            transaction.amount
                        ) || 0
                    )
                );

            },
            0
        );


    renderAnalysisOverallSummary(
        total,
        startDate,
        endDate
    );


    updateAnalysisGroupVisibility();

    reorderAnalysisGroupsInDOM();


    /* 월별 그래프 */

    renderAnalysisMonthlyChart(
        transactions,
        startDate,
        endDate
    );


    /* 카테고리 */

    const categoryList =
        document.getElementById(
            "analysisCategoryList"
        );

    const categoryDetails =
        document.getElementById(
            "analysisCategoryDetails"
        );


    if (categoryList) {

        categoryList.innerHTML = "";

        const categoryData =
            getAnalysisCategoryData(
                transactions
            );


        renderAnalysisGroupBar(
            "analysisCategoryBar",
            "analysisCategoryBarInfo",
            categoryData,
            total
        );


        sortAnalysisEntriesByAmount(
            categoryData
        ).forEach(
            (
                [name, amount]
            ) => {

                const item =
                    createAnalysisItem(
                        name,
                        amount,
                        () =>
                            selectAnalysisCategory(
                                name
                            ),
                        startDate,
                        endDate
                    );

                categoryList.appendChild(
                    item
                );

            }
        );

    }


    if (
        categoryDetails &&
        !analysisSelectedCategory
    ) {

        categoryDetails.classList.remove(
            "active"
        );

        categoryDetails.innerHTML =
            "";

    }


    /* 결제수단 */

    const paymentList =
        document.getElementById(
            "analysisPaymentList"
        );

    const paymentDetails =
        document.getElementById(
            "analysisPaymentDetails"
        );


    if (paymentList) {

        paymentList.innerHTML = "";

        const paymentData =
            getAnalysisPaymentData(
                transactions
            );


        renderAnalysisGroupBar(
            "analysisPaymentBar",
            "analysisPaymentBarInfo",
            paymentData,
            total
        );


        sortAnalysisEntriesByAmount(
            paymentData
        ).forEach(
            (
                [name, amount]
            ) => {

                const item =
                    createAnalysisItem(
                        name,
                        amount,
                        () =>
                            selectAnalysisPayment(
                                name
                            ),
                        startDate,
                        endDate
                    );

                paymentList.appendChild(
                    item
                );

            }
        );

    }


    if (
        paymentDetails &&
        !analysisSelectedPayment
    ) {

        paymentDetails.classList.remove(
            "active"
        );

        paymentDetails.innerHTML =
            "";

    }


    /* 주체 */

    const subjectList =
        document.getElementById(
            "analysisSubjectList"
        );

    const subjectDetails =
        document.getElementById(
            "analysisSubjectDetails"
        );


    if (subjectList) {

        subjectList.innerHTML = "";

        const subjectData =
            getAnalysisSubjectData(
                transactions
            );


        renderAnalysisGroupBar(
            "analysisSubjectBar",
            "analysisSubjectBarInfo",
            subjectData,
            total
        );


        sortAnalysisEntriesByAmount(
            subjectData
        ).forEach(
            (
                [name, amount]
            ) => {

                const item =
                    createAnalysisItem(
                        name,
                        amount,
                        () =>
                            selectAnalysisSubject(
                                name
                            ),
                        startDate,
                        endDate
                    );

                subjectList.appendChild(
                    item
                );

            }
        );

    }


    if (
        subjectDetails &&
        !analysisSelectedSubject
    ) {

        subjectDetails.classList.remove(
            "active"
        );

        subjectDetails.innerHTML =
            "";

    }


    /* 선택된 상세내역 유지 */

    if (
        analysisSelectedCategory
    ) {

        renderAnalysisDetails(
            "analysisCategoryDetails",
            transactions,
            "category",
            analysisSelectedCategory
        );

    }


    if (
        analysisSelectedPayment
    ) {

        renderAnalysisDetails(
            "analysisPaymentDetails",
            transactions,
            "payment",
            analysisSelectedPayment
        );

    }


    if (
        analysisSelectedSubject
    ) {

        renderAnalysisDetails(
            "analysisSubjectDetails",
            transactions,
            "subject",
            analysisSelectedSubject
        );

    }

}


/* 분석 화면이 실제로 표시될 때 자동 실행 */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        initializeAnalysisDates();

        renderAnalysis();


        const analysisScreen =
            document.getElementById(
                "analysisScreen"
            );


        if (
            analysisScreen
        ) {

            const observer =
                new MutationObserver(
                    function() {

                        if (
                            analysisScreen.classList.contains(
                                "active"
                            )
                        ) {

                            initializeAnalysisDates();

                            renderAnalysis();

                        }

                    }
                );


            observer.observe(
                analysisScreen,
                {
                    attributes: true,
                    attributeFilter: [
                        "class"
                    ]
                }
            );

        }

    }
);


/* =========================================================
   키보드 관련 스크롤 보정
   - 키보드가 열릴 때: 입력창이 키보드에 가려지지 않도록 스크롤
   - 키보드가 닫힐 때: 화면이 위로 밀린 채 고정되지 않도록 원위치
========================================================= */

function resetPageScrollPosition() {

    window.scrollTo(
        0,
        0
    );

    document.documentElement.scrollTop = 0;

    document.body.scrollTop = 0;

}


/* 포커스된 입력창을 감싸는, 실제로 스크롤 가능한 조상 요소 찾기 */

function findScrollableAncestor(
    element
) {

    let node =
        element.parentElement;


    while (
        node &&
        node !== document.body
    ) {

        const style =
            window.getComputedStyle(
                node
            );


        if (
            style.overflowY ===
                "auto" ||
            style.overflowY ===
                "scroll"
        ) {

            return node;

        }


        node =
            node.parentElement;

    }


    return null;

}


/* 입력창이 키보드에 가려지지 않도록 필요한 만큼만 스크롤 */

function scrollFocusedInputIntoView(
    target
) {

    if (!target) {

        return;

    }


    const scrollableParent =
        findScrollableAncestor(
            target
        );


    const viewportHeight =
        window.visualViewport
            ? window.visualViewport.height
            : window.innerHeight;


    const rect =
        target.getBoundingClientRect();


    const buffer = 16;

    const overflow =
        rect.bottom -
        (
            viewportHeight -
            buffer
        );


    if (overflow <= 0) {

        return;

    }


    if (scrollableParent) {

        scrollableParent.scrollBy(
            {
                top: overflow,
                behavior: "smooth"
            }
        );

    }

    else {

        target.scrollIntoView(
            {
                block: "center",
                behavior: "smooth"
            }
        );

    }

}


document.addEventListener(
    "focusin",
    function(event) {

        const target =
            event.target;


        if (
            !target ||
            (
                target.tagName !== "INPUT" &&
                target.tagName !== "TEXTAREA"
            )
        ) {

            return;

        }


        /* 키보드가 올라오는 애니메이션 시간을 기다린 뒤 위치 보정 */

        setTimeout(
            function() {

                scrollFocusedInputIntoView(
                    target
                );

            },
            300
        );

    }
);


document.addEventListener(
    "focusout",
    function(event) {

        const target =
            event.target;


        if (
            !target ||
            (
                target.tagName !== "INPUT" &&
                target.tagName !== "TEXTAREA"
            )
        ) {

            return;

        }


        setTimeout(
            resetPageScrollPosition,
            50
        );

        setTimeout(
            resetPageScrollPosition,
            300
        );

    }
);


if (window.visualViewport) {

    window.visualViewport.addEventListener(
        "resize",
        function() {

            const active =
                document.activeElement;


            const isTyping =
                active &&
                (
                    active.tagName === "INPUT" ||
                    active.tagName === "TEXTAREA"
                );


            if (isTyping) {

                /* 키보드가 열리는 중: 입력창이 보이도록만 스크롤,
                   페이지를 강제로 원위치시키지 않음 */

                setTimeout(
                    function() {

                        scrollFocusedInputIntoView(
                            active
                        );

                    },
                    50
                );

            }

            else {

                /* 입력 중이 아닐 때(키보드가 닫힐 때 등)만 원위치 */

                setTimeout(
                    resetPageScrollPosition,
                    50
                );

            }

        }
    );

}


window.addEventListener(
    "orientationchange",
    function() {

        setTimeout(
            resetPageScrollPosition,
            300
        );

    }
);
