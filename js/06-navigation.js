/* =========================
   06. 화면 전환
========================= */

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
        document.getElementById("headerBackButton");


    const titleMap = {

        input: "입력",
        history: "내역",
        analysis: "분석",
        settings: "설정",
        inputSettings: "입력 설정",
        budgetSettings: "예산 설정",
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


        header.classList.toggle("hidden", hideHeader);


        if (headerBackButton) {

            const showBackButton =
                screenName === "settings" ||
                screenName === "inputSettings" ||
                screenName === "budgetSettings" ||
                screenName === "memoSettings" ||
                screenName === "categorySettings" ||
                screenName === "paymentSettings" ||
                screenName === "subjectSettings" ||
                screenName === "historySettings" ||
                screenName === "historyExport" ||
                screenName === "analysisSettings" ||
                screenName === "accountSettings";


            headerBackButton.style.display =
                showBackButton ? "flex" : "none";

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


    if (screenName === "budgetSettings") {
        renderBudgetSettings();
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


    if (screenName === "analysis") {

        initializeAnalysisDates();

        renderAnalysis();

    }

}


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
        currentScreen === "budgetSettings" ||
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


function toggleSettingsCollapse(bodyId, button) {

    const body =
        document.getElementById(bodyId);

    if (!body) return;


    const isOpen =
        body.classList.contains("open");


    if (isOpen) {

        body.classList.remove("open");

        button.classList.remove("open");

    }

    else {

        body.classList.add("open");

        button.classList.add("open");

    }

}
/* =========================
   탭 간 좌우 스와이프
   입력 ↔ 내역 ↔ 분석 ↔ 설정
========================= */

const TAB_ORDER = [
    "input",
    "history",
    "analysis",
    "settings"
];

const TAB_SWIPE_THRESHOLD = 60;   /* 스와이프 인식 최소 거리(px) */
const TAB_SWIPE_MAX_Y = 80;       /* 세로로 너무 많이 움직이면 무시 */

let tabSwipeStartX = 0;
let tabSwipeStartY = 0;
let tabSwipeTracking = false;


document.addEventListener(
    "touchstart",
    function(event) {

        /* 1. 스와이프 대상 확인 */

        /* 모달 열려 있으면 무시 */

        const modal = document.getElementById("appModalOverlay");

        if (
            modal &&
            modal.classList.contains("active")
        ) {
            tabSwipeTracking = false;
            return;
        }


        /* 카드 드래그 중이면 무시 */

        if (
            event.target.closest &&
            event.target.closest(".manage-card")
        ) {
            tabSwipeTracking = false;
            return;
        }


        /* 가로 스크롤 영역이면 무시 */

        if (
            event.target.closest &&
            event.target.closest(".card-horizontal-list")
        ) {
            tabSwipeTracking = false;
            return;
        }


        /* 차트/캘린더 등 특정 영역 무시 */

        if (
            event.target.closest &&
            (
                event.target.closest(".monthly-chart") ||
                event.target.closest(".history-calendar-fixed")
            )
        ) {
            tabSwipeTracking = false;
            return;
        }


        /* 설정 하위 화면이면 무시 (설정 메인 탭에서만) */

        if (
            currentScreen !== "input" &&
            currentScreen !== "history" &&
            currentScreen !== "analysis" &&
            currentScreen !== "settings"
        ) {
            tabSwipeTracking = false;
            return;
        }


        /* input, textarea 위에서 시작하면 무시 */

        const tag = (event.target.tagName || "").toLowerCase();

        if (tag === "input" || tag === "textarea") {
            tabSwipeTracking = false;
            return;
        }


        if (event.touches.length !== 1) {
            tabSwipeTracking = false;
            return;
        }


        const touch = event.touches[0];

        tabSwipeStartX = touch.clientX;
        tabSwipeStartY = touch.clientY;

        tabSwipeTracking = true;

    },
    { passive: true }
);



document.addEventListener(
    "touchend",
    function(event) {

        if (!tabSwipeTracking) return;

        tabSwipeTracking = false;


        if (event.changedTouches.length !== 1) return;


        const touch = event.changedTouches[0];

        const diffX = touch.clientX - tabSwipeStartX;
        const diffY = touch.clientY - tabSwipeStartY;


        /* 세로로 많이 움직였으면 무시 */

        if (Math.abs(diffY) > TAB_SWIPE_MAX_Y) return;


        /* 가로 스와이프 거리 부족하면 무시 */

        if (Math.abs(diffX) < TAB_SWIPE_THRESHOLD) return;


        /* 세로가 가로보다 크면 무시 */

        if (Math.abs(diffY) > Math.abs(diffX)) return;


        const currentIdx = TAB_ORDER.indexOf(currentScreen);

        if (currentIdx === -1) return;


        let targetIdx = currentIdx;


        if (diffX < 0) {

            /* 왼쪽으로 스와이프 → 다음 탭 */

            targetIdx = currentIdx + 1;

        }
        else {

            /* 오른쪽으로 스와이프 → 이전 탭 */

            targetIdx = currentIdx - 1;

        }


        if (targetIdx < 0 || targetIdx >= TAB_ORDER.length) {
            return;
        }


        showScreen(TAB_ORDER[targetIdx]);

    },
    { passive: true }
);



document.addEventListener(
    "touchcancel",
    function() {
        tabSwipeTracking = false;
    }
);
