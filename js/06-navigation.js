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