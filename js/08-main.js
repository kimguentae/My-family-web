/* =========================
   08. 초기화
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        /* 날짜 input 초기화 */

        const dateInput =
            document.getElementById("dateInput");

        if (dateInput) {

            dateInput.value = getTodayString();

            dateInput.addEventListener(
                "change",
                updateInputDateText
            );

        }


        /* 화면 초기 렌더 */

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


        /* 헤더 */

        const pageTitle =
            document.getElementById("pageTitle");

        if (pageTitle) pageTitle.innerText = "입력";


        const header =
            document.querySelector(".header");

        if (header) header.classList.add("hidden");


        /* 분석 초기화 */

        initializeAnalysisDates();

        renderAnalysis();


        /* 1. 인증 리스너 등록 */

        registerAuthListener();


        /* 2. 기존 세션 확인 및 데이터 로드 */

        checkExistingSession();


        /* 3. 오프라인 상태 체크 */

        updateOnlineStatus();

    }
);