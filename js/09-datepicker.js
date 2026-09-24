/* =========================
   09. 커스텀 날짜 선택기
========================= */

/* 상태 */

var datepickerState = {

    /* "single" | "range" */
    mode: "single",

    /* 현재 표시 중인 달 */
    viewYear: new Date().getFullYear(),
    viewMonth: new Date().getMonth(),

    /* 연/월 선택 모드 여부 */
    yearMode: false,
    monthMode: false,

    /* 선택된 날짜 (YYYY-MM-DD) */
    selectedDate: "",

    /* 범위 모드용 */
    rangeStart: "",
    rangeEnd: "",

    /* 범위 선택 중 어느 쪽 편집 중? */
    /* "start" | "end" */
    editingField: "start",

    /* 콜백 (선택 완료 시 실행) */
    onConfirm: null

};


/* =========================
   오버레이 DOM 생성 (1회)
========================= */

function ensureDatepickerDOM() {

    if (document.getElementById("datepickerOverlay")) {
        return;
    }


    const overlay = document.createElement("div");
    overlay.id = "datepickerOverlay";
    overlay.className = "datepicker-overlay";


    overlay.innerHTML = `
        <div class="datepicker-sheet" onclick="event.stopPropagation()">

            <div class="datepicker-header">
                <button
                    type="button"
                    class="datepicker-header-btn"
                    onclick="datepickerPrev()"
                >
                    ‹
                </button>

                <div class="datepicker-title">
                    <button
                        type="button"
                        class="datepicker-year"
                        id="dpYearBtn"
                        onclick="datepickerToggleYearMode()"
                    ></button>
                    <button
                        type="button"
                        class="datepicker-month"
                        id="dpMonthBtn"
                        onclick="datepickerToggleMonthMode()"
                    ></button>
                </div>

                <button
                    type="button"
                    class="datepicker-header-btn"
                    onclick="datepickerNext()"
                >
                    ›
                </button>
            </div>

            <div id="dpBody"></div>

            <div class="datepicker-actions" id="dpActions">
                <button
                    type="button"
                    class="datepicker-action-btn datepicker-action-year"
                    id="dpThisYearBtn"
                    onclick="datepickerSelectThisYear()"
                >
                    이번년도
                </button>
                <button
                    type="button"
                    class="datepicker-action-btn datepicker-action-month"
                    id="dpThisMonthBtn"
                    onclick="datepickerSelectThisMonth()"
                >
                    이번 달
                </button>
                <button
                    type="button"
                    class="datepicker-action-btn datepicker-action-confirm"
                    id="dpConfirmBtn"
                    onclick="datepickerConfirm()"
                >
                    확인
                </button>
            </div>

        </div>
    `;


    overlay.addEventListener(
        "click",
        function(event) {

            if (event.target === overlay) {
                datepickerCancel();
            }

        }
    );


    document.body.appendChild(overlay);

}



/* =========================
   열기 / 닫기
========================= */

function openDatepickerSingle(
    currentDate,
    onConfirm
) {

    ensureDatepickerDOM();


    datepickerState.mode = "single";
    datepickerState.selectedDate =
        currentDate || getTodayString();
    datepickerState.onConfirm = onConfirm;
    datepickerState.yearMode = false;
    datepickerState.monthMode = false;


    /* 현재 달 표시 */

    const base =
        datepickerState.selectedDate
            ? new Date(datepickerState.selectedDate + "T00:00:00")
            : new Date();

    datepickerState.viewYear = base.getFullYear();
    datepickerState.viewMonth = base.getMonth();


    renderDatepicker();
    showDatepickerOverlay();

}



function openDatepickerRange(
    startDate,
    endDate,
    editingField,
    onConfirm
) {

    ensureDatepickerDOM();


    datepickerState.mode = "range";
    datepickerState.rangeStart = startDate || "";
    datepickerState.rangeEnd = endDate || "";
    datepickerState.editingField = editingField || "start";
    datepickerState.onConfirm = onConfirm;
    datepickerState.yearMode = false;
    datepickerState.monthMode = false;


    /* 편집 중인 필드의 날짜를 기준으로 달 표시 */

    const baseStr =
        editingField === "start"
            ? (datepickerState.rangeStart || datepickerState.rangeEnd)
            : (datepickerState.rangeEnd || datepickerState.rangeStart);

    const base =
        baseStr
            ? new Date(baseStr + "T00:00:00")
            : new Date();

    datepickerState.viewYear = base.getFullYear();
    datepickerState.viewMonth = base.getMonth();


    renderDatepicker();
    showDatepickerOverlay();

}



function showDatepickerOverlay() {

    const overlay =
        document.getElementById("datepickerOverlay");

    const sheet =
        overlay ? overlay.querySelector(".datepicker-sheet") : null;

    if (!overlay || !sheet) return;


    /* 오버레이 활성화 */

    overlay.classList.add("active");


    /* 텍스트 위치에 맞게 시트 배치 */

    let anchorRect = null;

    if (datepickerState.mode === "single") {

        /* 입력탭: inputDateText 아래 */

        const inputDateText =
            document.getElementById("inputDateText");

        if (inputDateText) {
            anchorRect = inputDateText.getBoundingClientRect();
        }

    }
    else {

        /* 분석탭: 편집 중인 필드 아래 */

        const startText =
            document.getElementById("analysisStartDateText");

        const endText =
            document.getElementById("analysisEndDateText");

        const targetText =
            datepickerState.editingField === "start"
                ? startText
                : endText;

        if (targetText) {
            anchorRect = targetText.getBoundingClientRect();
        }

    }


    /* 스타일 초기화 */

    sheet.style.position = "fixed";
    sheet.style.transform = "";
    sheet.style.marginTop = "";


    if (!anchorRect) {

        /* 앵커 없으면 중앙 */

        sheet.style.top = "50%";
        sheet.style.left = "50%";
        sheet.style.transform = "translate(-50%, -50%)";

        return;

    }


    /* 시트 실제 높이 측정 (일단 표시 후) */

    const sheetWidth = Math.min(380, window.innerWidth - 32);

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;


    /* 가로: 앵커 중앙에 맞춤 */

    let left = anchorRect.left + anchorRect.width / 2 - sheetWidth / 2;

    if (left < 16) left = 16;
    if (left + sheetWidth > viewportWidth - 16) {
        left = viewportWidth - sheetWidth - 16;
    }


    /* 세로: 일단 앵커 아래로 */

    let top = anchorRect.bottom + 8;


    /* 표시 후 실제 높이 재기 (임시 위치로) */

    sheet.style.left = left + "px";
    sheet.style.top = top + "px";


    requestAnimationFrame(function() {

        const sheetHeight = sheet.offsetHeight;

        /* 아래로 넘치면 위로 */

        if (top + sheetHeight > viewportHeight - 20) {

            const aboveTop = anchorRect.top - sheetHeight - 8;

            if (aboveTop > 20) {
                sheet.style.top = aboveTop + "px";
            }
            else {
                /* 위아래 다 부족 → 화면 중앙 */

                sheet.style.top =
                    Math.max(
                        20,
                        (viewportHeight - sheetHeight) / 2
                    ) + "px";
            }

        }

    });

}


function closeDatepickerOverlay() {

    const overlay =
        document.getElementById("datepickerOverlay");

    if (overlay) {
        overlay.classList.remove("active");
    }

}


function datepickerCancel() {

    closeDatepickerOverlay();

}


/* =========================
   이전/다음 달
========================= */

function datepickerPrev() {

    /* 연도/월 선택 모드에 따라 다르게 */

    if (datepickerState.yearMode) {

        datepickerState.viewYear -= 1;

    }
    else if (datepickerState.monthMode) {

        datepickerState.viewYear -= 1;

    }
    else {

        datepickerState.viewMonth -= 1;

        if (datepickerState.viewMonth < 0) {
            datepickerState.viewMonth = 11;
            datepickerState.viewYear -= 1;
        }

    }


    renderDatepicker();

}


function datepickerNext() {

    if (datepickerState.yearMode) {

        datepickerState.viewYear += 1;

    }
    else if (datepickerState.monthMode) {

        datepickerState.viewYear += 1;

    }
    else {

        datepickerState.viewMonth += 1;

        if (datepickerState.viewMonth > 11) {
            datepickerState.viewMonth = 0;
            datepickerState.viewYear += 1;
        }

    }


    renderDatepicker();

}


/* =========================
   연/월 선택 모드
========================= */

function datepickerToggleYearMode() {

    datepickerState.yearMode = !datepickerState.yearMode;
    datepickerState.monthMode = false;

    renderDatepicker();

}


function datepickerToggleMonthMode() {

    datepickerState.monthMode = !datepickerState.monthMode;
    datepickerState.yearMode = false;

    renderDatepicker();

}


function datepickerSelectYear(year) {

    datepickerState.viewYear = year;
    datepickerState.yearMode = false;

    renderDatepicker();

}


function datepickerSelectMonth(month) {

    datepickerState.viewMonth = month;
    datepickerState.monthMode = false;

    renderDatepicker();

}



/* =========================
   렌더
========================= */

function renderDatepicker() {

    const yearBtn =
        document.getElementById("dpYearBtn");

    const monthBtn =
        document.getElementById("dpMonthBtn");

    const body =
        document.getElementById("dpBody");

    const actions =
        document.getElementById("dpActions");

    const confirmBtn =
        document.getElementById("dpConfirmBtn");

    const thisYearBtn =
        document.getElementById("dpThisYearBtn");

    const thisMonthBtn =
        document.getElementById("dpThisMonthBtn");


    if (!body) return;


    /* 연도/월 버튼 라벨 */

    if (yearBtn) {
        yearBtn.textContent =
            datepickerState.viewYear + "년";
    }

    if (monthBtn) {
        monthBtn.textContent =
            (datepickerState.viewMonth + 1) + "월";
    }


    /* 모드별 액션 버튼 표시 */

    if (actions) {

        if (datepickerState.mode === "single") {

            /* 입력탭: 액션 버튼 전부 숨김 (날짜 탭하면 바로 확정) */

            actions.classList.add("hidden");

        }
        else {

            /* 분석탭: 이번년도, 이번달, 확인만 */

            actions.classList.remove("hidden");

        }

    }


    /* 확인 버튼 활성화 (분석탭만) */

    if (confirmBtn) {

        if (datepickerState.mode === "range") {

            confirmBtn.disabled =
                !datepickerState.rangeStart ||
                !datepickerState.rangeEnd;

        }

    }


    /* 본문 */

    if (datepickerState.yearMode) {

        renderDatepickerYearGrid(body);

    }
    else if (datepickerState.monthMode) {

        renderDatepickerMonthGrid(body);

    }
    else {

        renderDatepickerCalendar(body);

    }

}


/* 연도 그리드 (12년 단위) */

function renderDatepickerYearGrid(container) {

    const currentYear = datepickerState.viewYear;

    /* 12년 블록 */

    const startYear =
        Math.floor(currentYear / 12) * 12;

    let html =
        `<div class="datepicker-month-grid">`;

    for (let i = 0; i < 12; i++) {

        const year = startYear + i;

        const isSelected =
            year === datepickerState.viewYear;

        const isCurrent =
            year === new Date().getFullYear();

        let cls = "datepicker-month-btn";

        if (isSelected) cls += " selected";
        else if (isCurrent) cls += " current";

        html +=
            `<button type="button" class="${cls}" onclick="datepickerSelectYear(${year})">${year}년</button>`;

    }

    html += `</div>`;

    container.innerHTML = html;

}


/* 월 그리드 */

function renderDatepickerMonthGrid(container) {

    const currentYear = datepickerState.viewYear;

    const now = new Date();

    const currentMonth =
        currentYear === now.getFullYear()
            ? now.getMonth()
            : -1;


    let html =
        `<div class="datepicker-month-grid">`;

    for (let i = 0; i < 12; i++) {

        const isSelected =
            i === datepickerState.viewMonth;

        const isCurrent =
            i === currentMonth;

        let cls = "datepicker-month-btn";

        if (isSelected) cls += " selected";
        else if (isCurrent) cls += " current";

        html +=
            `<button type="button" class="${cls}" onclick="datepickerSelectMonth(${i})">${i + 1}월</button>`;

    }

    html += `</div>`;

    container.innerHTML = html;

}


/* 달력 그리드 */

function renderDatepickerCalendar(container) {

    const year = datepickerState.viewYear;
    const month = datepickerState.viewMonth;


    const firstDay =
        new Date(year, month, 1).getDay();

    const lastDate =
        new Date(year, month + 1, 0).getDate();


    const todayStr = getTodayString();


    /* 요일 헤더 */

    let html = `
        <div class="datepicker-weekdays">
            <div class="sun">일</div>
            <div>월</div>
            <div>화</div>
            <div>수</div>
            <div>목</div>
            <div>금</div>
            <div class="sat">토</div>
        </div>
        <div class="datepicker-grid">
    `;


    /* 앞 빈 칸 */

    for (let i = 0; i < firstDay; i++) {

        html +=
            `<button type="button" class="datepicker-day empty"></button>`;

    }


    /* 날짜 */

    for (let d = 1; d <= lastDate; d++) {

        const dateStr =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;


        const dayOfWeek =
            new Date(year, month, d).getDay();


        let cls = "datepicker-day";

        if (dayOfWeek === 0) cls += " sun";
        else if (dayOfWeek === 6) cls += " sat";


        if (dateStr === todayStr) {
            cls += " today";
        }


        /* 선택 표시 */

        if (datepickerState.mode === "single") {

            if (dateStr === datepickerState.selectedDate) {
                cls += " selected";
            }

        }

        else {

            const start = datepickerState.rangeStart;
            const end = datepickerState.rangeEnd;


            if (start && end) {

                if (dateStr > start && dateStr < end) {
                    cls += " in-range";
                }

                if (dateStr === start) cls += " range-start";
                if (dateStr === end) cls += " range-end";

            }
            else if (start && !end && datepickerState.editingField === "end") {

                if (dateStr === start) cls += " range-start range-end";

            }
            else if (end && !start && datepickerState.editingField === "start") {

                if (dateStr === end) cls += " range-start range-end";

            }

        }


        html +=
            `<button type="button" class="${cls}" onclick="datepickerSelectDay('${dateStr}')">${d}</button>`;

    }


    html += `</div>`;


    container.innerHTML = html;

}



/* =========================
   날짜 선택
========================= */

function datepickerSelectDay(dateStr) {

    if (datepickerState.mode === "single") {

        datepickerState.selectedDate = dateStr;


        /* 바로 확정 + 닫기 */

        if (typeof datepickerState.onConfirm === "function") {

            datepickerState.onConfirm(dateStr);

        }

        closeDatepickerOverlay();

        return;

    }


    /* 분석탭 (range 모드) */

    if (datepickerState.editingField === "start") {

        datepickerState.rangeStart = dateStr;

        if (
            datepickerState.rangeEnd &&
            dateStr > datepickerState.rangeEnd
        ) {
            datepickerState.rangeEnd = "";
        }

    }
    else {

        datepickerState.rangeEnd = dateStr;

        if (
            datepickerState.rangeStart &&
            dateStr < datepickerState.rangeStart
        ) {
            datepickerState.rangeStart = "";
        }

    }


    renderDatepicker();

}


function datepickerSelectToday() {

    const today = getTodayString();


    if (datepickerState.mode === "single") {

        datepickerState.selectedDate = today;

        const base = new Date();
        datepickerState.viewYear = base.getFullYear();
        datepickerState.viewMonth = base.getMonth();

        renderDatepicker();

    }

    else {

        /* 오늘을 편집 중인 필드에 반영 */

        if (datepickerState.editingField === "start") {

            datepickerState.rangeStart = today;

            if (
                datepickerState.rangeEnd &&
                today > datepickerState.rangeEnd
            ) {
                datepickerState.rangeEnd = "";
            }

        }
        else {

            datepickerState.rangeEnd = today;

            if (
                datepickerState.rangeStart &&
                today < datepickerState.rangeStart
            ) {
                datepickerState.rangeStart = "";
            }

        }


        const base = new Date();
        datepickerState.viewYear = base.getFullYear();
        datepickerState.viewMonth = base.getMonth();

        renderDatepicker();

    }

}

/* 이번년도: 1월 1일 ~ 오늘 */

function datepickerSelectThisYear() {

    const today = getTodayString();

    const year = new Date().getFullYear();

    const startOfYear = `${year}-01-01`;


    datepickerState.rangeStart = startOfYear;

    datepickerState.rangeEnd = today;


    /* 표시 중인 달도 이번 달로 */

    const now = new Date();

    datepickerState.viewYear = now.getFullYear();

    datepickerState.viewMonth = now.getMonth();


    renderDatepicker();

}


/* 이번 달: 이번 달 1일 ~ 오늘 */

function datepickerSelectThisMonth() {

    const today = getTodayString();

    const now = new Date();

    const startOfMonth =
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;


    datepickerState.rangeStart = startOfMonth;

    datepickerState.rangeEnd = today;


    datepickerState.viewYear = now.getFullYear();

    datepickerState.viewMonth = now.getMonth();


    renderDatepicker();

}

function datepickerConfirm() {

    if (datepickerState.mode === "single") {

        if (!datepickerState.selectedDate) return;

        if (typeof datepickerState.onConfirm === "function") {

            datepickerState.onConfirm(
                datepickerState.selectedDate
            );

        }

    }

    else {

        if (
            !datepickerState.rangeStart ||
            !datepickerState.rangeEnd
        ) {
            return;
        }

        if (typeof datepickerState.onConfirm === "function") {

            datepickerState.onConfirm(
                datepickerState.rangeStart,
                datepickerState.rangeEnd
            );

        }

    }


    closeDatepickerOverlay();

}



/* =========================
   입력탭 날짜 트리거
========================= */

function openInputDatePicker() {

    const currentDate =
        (function() {

            const txt =
                document.getElementById("inputDateText");

            return txt && txt.dataset.date
                ? txt.dataset.date
                : getTodayString();

        })();


    openDatepickerSingle(
        currentDate,
        function(newDate) {

            /* 입력탭 날짜 반영 */

            if (typeof applyInputDate === "function") {

                applyInputDate(newDate);

            }

        }
    );

}



/* =========================
   분석탭 날짜 트리거
========================= */

function openAnalysisStartDatePicker() {

    const startInput =
        document.getElementById("analysisStartDate");

    const endInput =
        document.getElementById("analysisEndDate");


    openDatepickerRange(
        startInput ? startInput.value : "",
        endInput ? endInput.value : "",
        "start",
        function(start, end) {

            if (startInput) startInput.value = start;
            if (endInput) endInput.value = end;

            if (typeof applyAnalysisDates === "function") {
                applyAnalysisDates();
            }

        }
    );

}


function openAnalysisEndDatePicker() {

    const startInput =
        document.getElementById("analysisStartDate");

    const endInput =
        document.getElementById("analysisEndDate");


    openDatepickerRange(
        startInput ? startInput.value : "",
        endInput ? endInput.value : "",
        "end",
        function(start, end) {

            if (startInput) startInput.value = start;
            if (endInput) endInput.value = end;

            if (typeof applyAnalysisDates === "function") {
                applyAnalysisDates();
            }

        }
    );

}