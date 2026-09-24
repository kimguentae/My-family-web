/* =========================
   07-1. 입력 / 내역 / 공휴일 / 엑셀
========================= */

/* =========================
   입력 날짜
========================= */

function updateInputDateText() {

    const input =
        document.getElementById("dateInput");

    const text =
        document.getElementById("inputDateText");


    if (!input || !text) return;


    if (!input.value) {
        input.value = getTodayString();
    }


    const date =
        new Date(input.value + "T00:00:00");

    const weekdays = [
        "일", "월", "화", "수", "목", "금", "토"
    ];


    text.innerText =
        `${date.getFullYear()}년 ${
            date.getMonth() + 1
        }월 ${
            date.getDate()
        }일 (${weekdays[date.getDay()]})`;

}


/* =========================
   금액
========================= */

function formatAmountInput() {

    const input =
        document.getElementById("amountInput");

    if (!input) return;


    let value =
        input.value.replace(/[^0-9]/g, "");


    if (!value) {
        input.value = "";
        return;
    }


    input.value =
        Number(value).toLocaleString("ko-KR");

}


document.addEventListener(
    "input",
    function(event) {

        if (
            event.target &&
            event.target.id === "amountInput"
        ) {
            formatAmountInput();
        }

    }
);


/* =========================
   지출 / 수입
========================= */

function setType(type) {

    currentType = type;

    selectedCategory = "";
    selectedPayment = "";
    selectedSubject = "";


    document
        .getElementById("expenseBtn")
        .classList.toggle("active", type === "expense");

    document
        .getElementById("incomeBtn")
        .classList.toggle("active", type === "income");


    renderCategoryButtons();
    renderSubjectButtons();
    renderPaymentButtons();

    updateInputAreas();

}


function isMemoEnabledForCurrentType() {

    return currentType === "expense"
        ? settings.memoExpenseEnabled
        : settings.memoIncomeEnabled;

}


function isCategoryEnabledForCurrentType() {

    return currentType === "expense"
        ? settings.categoryExpenseEnabled
        : settings.categoryIncomeEnabled;

}


function isPaymentEnabledForCurrentType() {

    return currentType === "expense"
        ? settings.paymentExpenseEnabled
        : settings.paymentIncomeEnabled;

}


function isSubjectEnabledForCurrentType() {

    return currentType === "expense"
        ? settings.subjectExpenseEnabled
        : settings.subjectIncomeEnabled;

}


function updateInputAreas() {

    const memoArea =
        document.getElementById("memoArea");

    const paymentArea =
        document.getElementById("paymentArea");

    const categoryButtons =
        document.getElementById("categoryButtons");

    const subjectArea =
        document.getElementById("subjectArea");


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


/* =========================
   버튼 렌더
========================= */

function renderCategoryButtons() {

    const container =
        document.getElementById("categoryButtons");

    if (!container) return;


    container.innerHTML = "";


    if (!isCategoryEnabledForCurrentType()) return;


    const list = categories[currentType] || [];


    list.forEach(category => {

        const button =
            document.createElement("button");

        button.type = "button";
        button.className = "category-btn";


        if (category === selectedCategory) {
            button.classList.add("active");
        }


        button.innerText = category;

        button.onclick = function() {

            selectedCategory = category;

            renderCategoryButtons();

        };


        container.appendChild(button);

    });

}


function renderSubjectButtons() {

    const container =
        document.getElementById("subjectButtons");

    if (!container) return;


    container.innerHTML = "";


    if (!isSubjectEnabledForCurrentType()) return;


    subjects.forEach(subject => {

        const button =
            document.createElement("button");

        button.type = "button";
        button.className = "subject-btn";


        if (subject === selectedSubject) {
            button.classList.add("active");
        }


        button.innerText = subject;

        button.onclick = function() {

            selectedSubject = subject;

            renderSubjectButtons();

        };


        container.appendChild(button);

    });

}


function renderPaymentButtons() {

    const container =
        document.getElementById("paymentButtons");

    if (!container) return;


    container.innerHTML = "";


    if (!isPaymentEnabledForCurrentType()) return;


    paymentMethods.forEach(payment => {

        const button =
            document.createElement("button");

        button.type = "button";
        button.className = "payment-btn";


        if (payment === selectedPayment) {
            button.classList.add("active");
        }


        button.innerText = payment;

        button.onclick = function() {

            selectedPayment = payment;

            renderPaymentButtons();

        };


        container.appendChild(button);

    });

}


/* =========================
   거래 저장
========================= */

function saveTransaction() {

    const dateInput =
        document.getElementById("dateInput");

    const amountInput =
        document.getElementById("amountInput");

    const memoInput =
        document.getElementById("memoInput");


    const date = dateInput.value;


    const amount =
        Number(
            amountInput.value.replace(/[^0-9]/g, "")
        );


    const memo = memoInput.value.trim();


    if (!date) {

        appAlert("날짜를 선택해주세요.");

        return;

    }


    if (!amount || amount <= 0) {

        appAlert("금액을 입력해주세요.");

        return;

    }


    if (
        isCategoryEnabledForCurrentType() &&
        !selectedCategory
    ) {

        appAlert("카테고리를 선택해주세요.");

        return;

    }


    if (
        isPaymentEnabledForCurrentType() &&
        !selectedPayment
    ) {

        appAlert("결제수단을 선택해주세요.");

        return;

    }


    const subjectEnabled =
        isSubjectEnabledForCurrentType();


    if (subjectEnabled && !selectedSubject) {

        appAlert("주체를 선택해주세요.");

        return;

    }


    const newTransaction = {

        id:
            String(Date.now()) +
            "-" +
            Math.random().toString(36).slice(2, 8),

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
            subjectEnabled ? selectedSubject : ""

    };


    transactions.push(newTransaction);


    saveTransactions();

    syncInsertTransaction(newTransaction);


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


function addTransactionForSelectedDate() {

    showScreen("input");


    const dateInput =
        document.getElementById("dateInput");


    if (dateInput) {

        dateInput.value = selectedDate;

        updateInputDateText();

    }

}



/* =========================
   한국 공휴일
========================= */

function isKoreanHoliday(dateString) {

    const target =
        new Date(dateString + "T00:00:00");

    const year = target.getFullYear();

    const holidays = {};


    function pad(number) {
        return String(number).padStart(2, "0");
    }


    function dateKey(date) {

        return (
            date.getFullYear() +
            "-" +
            pad(date.getMonth() + 1) +
            "-" +
            pad(date.getDate())
        );

    }


    function addHoliday(date, name) {
        holidays[dateKey(date)] = name;
    }


    function addFixed(month, day, name) {

        addHoliday(
            new Date(year, month - 1, day),
            name
        );

    }


    /* 고정 공휴일 */

    addFixed(1, 1, "신정");
    addFixed(3, 1, "삼일절");


    if (year >= 2026) {
        addFixed(5, 1, "노동절");
    }

    addFixed(5, 5, "어린이날");
    addFixed(6, 6, "현충일");


    if (year >= 2026) {
        addFixed(7, 17, "제헌절");
    }


    addFixed(8, 15, "광복절");
    addFixed(10, 3, "개천절");
    addFixed(10, 9, "한글날");
    addFixed(12, 25, "성탄절");


    if (year === 2026) {
        addFixed(6, 3, "전국동시지방선거일");
    }


    /* 음력 */

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
            lunarFormatter.formatToParts(date);


        let month = null;
        let day = null;


        parts.forEach(part => {

            if (part.type === "month") {
                month = Number(part.value);
            }

            if (part.type === "day") {
                day = Number(part.value);
            }

        });


        return { month, day };

    }


    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);

    let seollal = null;
    let buddha = null;
    let chuseok = null;


    for (
        let date = new Date(start);
        date <= end;
        date.setDate(date.getDate() + 1)
    ) {

        const lunar = getLunar(date);

        if (!lunar.month || !lunar.day) continue;


        if (lunar.month === 1 && lunar.day === 1) {
            seollal = new Date(date);
        }

        if (lunar.month === 4 && lunar.day === 8) {
            buddha = new Date(date);
        }

        if (lunar.month === 8 && lunar.day === 15) {
            chuseok = new Date(date);
        }

    }


    if (seollal) {

        const before = new Date(seollal);
        before.setDate(before.getDate() - 1);

        const after = new Date(seollal);
        after.setDate(after.getDate() + 1);


        addHoliday(before, "설날 전날");
        addHoliday(seollal, "설날");
        addHoliday(after, "설날 다음날");

    }


    if (buddha) {
        addHoliday(buddha, "부처님오신날");
    }


    if (chuseok) {

        const before = new Date(chuseok);
        before.setDate(before.getDate() - 1);

        const after = new Date(chuseok);
        after.setDate(after.getDate() + 1);


        addHoliday(before, "추석 전날");
        addHoliday(chuseok, "추석");
        addHoliday(after, "추석 다음날");

    }


    /* 대체공휴일 */

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


    const originalHolidayEntries =
        Object.entries(holidays);


    originalHolidayEntries.forEach(
        ([key, name]) => {

            if (!substituteTargets.includes(name)) {
                return;
            }


            const date =
                new Date(key + "T00:00:00");

            const day = date.getDay();


            if (day !== 0 && day !== 6) {
                return;
            }


            let substitute = new Date(date);

            substitute.setDate(
                substitute.getDate() + 1
            );


            while (
                holidays[dateKey(substitute)]
            ) {

                substitute.setDate(
                    substitute.getDate() + 1
                );

            }


            addHoliday(
                substitute,
                name + " 대체공휴일"
            );

        }
    );


    return holidays[dateString] || "";

}



/* =========================
   달력
========================= */

function renderCalendar() {

    const calendar =
        document.getElementById("calendar");

    const title =
        document.getElementById("calendarTitle");


    if (!calendar || !title) return;


    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();


    title.innerText = `${year}년 ${month + 1}월`;


    calendar.innerHTML = "";


    const firstDay =
        new Date(year, month, 1).getDay();

    const lastDate =
        new Date(year, month + 1, 0).getDate();


    for (let i = 0; i < firstDay; i++) {

        const empty =
            document.createElement("div");

        empty.className = "calendar-day empty";

        calendar.appendChild(empty);

    }


    for (let day = 1; day <= lastDate; day++) {

        const cell =
            document.createElement("div");

        cell.className = "calendar-day";


        const dateString =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


        const date = new Date(year, month, day);

        const dayOfWeek = date.getDay();


        const holidayName =
            isKoreanHoliday(dateString);


        if (dayOfWeek === 0 || holidayName) {
            cell.classList.add("sunday-holiday");
        }
        else if (dayOfWeek === 6) {
            cell.classList.add("saturday");
        }


        if (holidayName) {
            cell.title = holidayName;
        }


        if (dateString === selectedDate) {
            cell.classList.add("selected");
        }


        if (dateString === getTodayString()) {
            cell.classList.add("today");
        }


        const number =
            document.createElement("div");

        number.className = "calendar-day-number";
        number.innerText = day;

        cell.appendChild(number);


        const dailyTransactions =
            transactions.filter(
                transaction =>
                    transaction.date === dateString
            );


        let expenseTotal = 0;
        let incomeTotal = 0;


        dailyTransactions.forEach(transaction => {

            if (transaction.type === "expense") {
                expenseTotal += transaction.amount;
            }
            else {
                incomeTotal += transaction.amount;
            }

        });


        if (expenseTotal > 0) {

            const amount =
                document.createElement("div");

            amount.className = "calendar-amount expense";

            amount.innerText =
                "-" + formatCompactAmount(expenseTotal);

            cell.appendChild(amount);

        }


        if (incomeTotal > 0) {

            const amount =
                document.createElement("div");

            amount.className = "calendar-amount income";

            amount.innerText =
                "+" + formatCompactAmount(incomeTotal);

            cell.appendChild(amount);

        }


        cell.onclick = function() {

            selectDate(dateString);

        };


        calendar.appendChild(cell);

    }

}


function selectDate(dateString) {

    selectedDate = dateString;

    historySearchKeyword = "";


    const searchArea =
        document.getElementById("historySearchArea");

    const searchInput =
        document.getElementById("historySearchInput");


    if (searchArea) {
        searchArea.classList.remove("active");
    }


    if (searchInput) {
        searchInput.value = "";
    }


    renderCalendar();
    renderSelectedDate();

}


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
   내역 검색
========================= */

function toggleHistorySearch() {

    const area =
        document.getElementById("historySearchArea");

    const input =
        document.getElementById("historySearchInput");


    if (!area) return;


    area.classList.toggle("active");


    if (area.classList.contains("active")) {

        if (input) input.focus();

    }

    else {

        historySearchKeyword = "";

        if (input) input.value = "";

        renderCalendar();
        renderSelectedDate();

    }

}


function clearHistorySearch() {

    const input =
        document.getElementById("historySearchInput");


    historySearchKeyword = "";

    if (input) input.value = "";


    renderCalendar();
    renderSelectedDate();

}


document.addEventListener(
    "input",
    function(event) {

        if (
            event.target &&
            event.target.id === "historySearchInput"
        ) {

            historySearchKeyword =
                event.target.value.trim();

            renderCalendar();
            renderSelectedDate();

        }

    }
);


function getHistorySearchResults() {

    if (!historySearchKeyword) return [];


    const keyword =
        historySearchKeyword.toLowerCase();


    return transactions
        .filter(transaction => {

            const memo = transaction.memo || "";

            return memo.toLowerCase().includes(keyword);

        })
        .sort(
            (a, b) =>
                String(b.date).localeCompare(String(a.date))
        );

}


function formatHistoryResultDate(dateString) {

    const date =
        new Date(dateString + "T00:00:00");

    const weekdays = [
        "일", "월", "화", "수", "목", "금", "토"
    ];


    return `${
        date.getMonth() + 1
    }월 ${
        date.getDate()
    }일(${weekdays[date.getDay()]})`;

}


function goToSearchResultDate(dateString) {

    selectedDate = dateString;


    const date =
        new Date(dateString + "T00:00:00");


    calendarDate =
        new Date(
            date.getFullYear(),
            date.getMonth(),
            1
        );


    const area =
        document.getElementById("historySearchArea");

    const input =
        document.getElementById("historySearchInput");


    if (area) area.classList.remove("active");

    if (input) input.value = "";


    historySearchKeyword = "";


    renderCalendar();
    renderSelectedDate();


    const details =
        document.getElementById("selectedDateTransactions");


    if (details) details.scrollTop = 0;

}



/* =========================
   날짜별 내역
========================= */

function renderSelectedDate() {

    const title =
        document.getElementById("selectedDateTitle");

    const container =
        document.getElementById("selectedDateTransactions");


    if (!title || !container) return;


    container.innerHTML = "";


    if (historySearchKeyword) {

        title.innerText = "검색 결과";


        const results = getHistorySearchResults();


        if (results.length === 0) {

            container.innerHTML =
                `<div class="no-transactions">
                    검색 결과가 없습니다.
                </div>`;

            return;

        }


        const list =
            document.createElement("div");

        list.className = "transaction-list";


        results.forEach(transaction => {

            list.appendChild(
                createTransactionCard(transaction, true)
            );

        });


        container.appendChild(list);

        return;

    }


    const date =
        new Date(selectedDate + "T00:00:00");


    title.innerText =
        `${date.getMonth() + 1}월 ${
            date.getDate()
        }일 내역`;


    const addButton =
        document.createElement("button");

    addButton.type = "button";
    addButton.className = "selected-date-add-button";

    addButton.innerHTML = `
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-circle-plus"
    >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M8 12h8"></path>
        <path d="M12 8v8"></path>
    </svg>
`;


    addButton.onclick =
        addTransactionForSelectedDate;


    title.appendChild(addButton);


    const dailyTransactions =
        transactions
            .filter(
                transaction =>
                    transaction.date === selectedDate
            )
            .sort(
                (a, b) =>
                    String(b.id).localeCompare(String(a.id))
            );


    if (dailyTransactions.length === 0) {

        container.innerHTML =
            `<div class="no-transactions">
                내역이 없습니다.
            </div>`;

        return;

    }


    const list =
        document.createElement("div");

    list.className = "transaction-list";


    dailyTransactions.forEach(transaction => {

        list.appendChild(
            createTransactionCard(transaction, false)
        );

    });


    container.appendChild(list);

}



/* =========================
   거래 카드
========================= */

function createTransactionCard(
    transaction,
    isSearchResult = false
) {

    const card =
        document.createElement("div");

    card.className = "transaction-card";


    const actions =
        document.createElement("div");

    actions.className = "swipe-actions";


    const editButton =
        document.createElement("button");

    editButton.type = "button";
    editButton.className = "swipe-edit";
    editButton.innerText = "수정";

    editButton.onclick = function(event) {

        event.stopPropagation();

        editTransaction(transaction.id);

    };


    const deleteButton =
        document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "swipe-delete";
    deleteButton.innerText = "삭제";

    deleteButton.onclick = function(event) {

        event.stopPropagation();

        deleteTransaction(transaction.id);

    };


    actions.appendChild(editButton);
    actions.appendChild(deleteButton);


    const content =
        document.createElement("div");

    content.className = "transaction-content";


    const left =
        document.createElement("div");

    left.className = "transaction-left";


    if (isSearchResult) {

        const titleRow =
            document.createElement("div");

        titleRow.className = "search-result-title";


        const searchDate =
            document.createElement("button");

        searchDate.type = "button";
        searchDate.className = "search-result-date";
        searchDate.innerText =
            formatHistoryResultDate(transaction.date);

        searchDate.onclick = function(event) {

            event.stopPropagation();

            goToSearchResultDate(transaction.date);

        };


        titleRow.appendChild(searchDate);


        if (transaction.category) {

            const searchCategory =
                document.createElement("span");

            searchCategory.className = "search-result-category";
            searchCategory.innerText = transaction.category;

            titleRow.appendChild(searchCategory);

        }


        left.appendChild(titleRow);

    }

    else {

        if (transaction.category) {

            const category =
                document.createElement("div");

            category.className = "transaction-category";
            category.innerText = transaction.category;

            left.appendChild(category);

        }

    }


    const meta =
        document.createElement("div");

    meta.className = "transaction-meta";


    const metaParts = [];


    if (transaction.subject) metaParts.push(transaction.subject);
    if (transaction.memo) metaParts.push(transaction.memo);
    if (transaction.payment) metaParts.push(transaction.payment);


    meta.innerText = metaParts.join(" · ");


    if (metaParts.length > 0) {
        left.appendChild(meta);
    }


    const amount =
        document.createElement("div");

    amount.className = "transaction-amount";

    amount.classList.add(
        transaction.type === "expense"
            ? "expense"
            : "income"
    );


    amount.innerText =
        transaction.type === "expense"
            ? "-" +
              Number(transaction.amount).toLocaleString("ko-KR") +
              "원"
            : "+" +
              Number(transaction.amount).toLocaleString("ko-KR") +
              "원";


    content.appendChild(left);
    content.appendChild(amount);


    card.appendChild(actions);
    card.appendChild(content);


    initializeSwipe(card);


    return card;

}



/* =========================
   거래 스와이프
========================= */

const activeSwipeCards = new WeakSet();


document.addEventListener(
    "touchstart",
    function(event) {

        const target = event.target;


        document
            .querySelectorAll(
                ".transaction-content.swiped-open"
            )
            .forEach(function(content) {

                if (!content.contains(target)) {

                    content.classList.remove("swiped-open");

                    content.style.transition =
                        "transform 0.2s ease";

                    content.style.transform =
                        "translateX(0)";

                }

            });

    },
    { passive: true }
);


function initializeSwipe(card) {

    if (!card) return;
    if (activeSwipeCards.has(card)) return;

    activeSwipeCards.add(card);


    const content =
        card.querySelector(".transaction-content");

    if (!content) return;


    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let swiping = false;

    const revealWidth = 130;


    content.addEventListener(
        "touchstart",
        function(event) {

            const touch = event.touches[0];

            startX = touch.clientX;
            startY = touch.clientY;
            currentX = startX;

            swiping = true;

            content.style.transition = "none";

        },
        { passive: true }
    );


    content.addEventListener(
        "touchmove",
        function(event) {

            if (!swiping) return;


            const touch = event.touches[0];

            currentX = touch.clientX;

            const currentY = touch.clientY;

            const diffX = currentX - startX;
            const diffY = currentY - startY;


            if (
                Math.abs(diffY) > Math.abs(diffX) &&
                Math.abs(diffY) > 8
            ) {

                swiping = false;

                content.style.transition = "";

                return;

            }


            if (diffX < 0) {

                const translateX =
                    Math.max(diffX, -revealWidth);

                content.style.transform =
                    `translateX(${translateX}px)`;

            }

            else if (diffX > 0) {

                const currentTransform =
                    parseFloat(
                        getComputedStyle(content)
                            .transform
                            .replace(
                                /^matrix\([^,]+,[^,]+,[^,]+,[^,]+,([^,]+),.*\)$/,
                                "$1"
                            )
                    );


                if (!isNaN(currentTransform) && currentTransform < 0) {

                    const translateX =
                        Math.min(0, currentTransform + diffX);

                    content.style.transform =
                        `translateX(${translateX}px)`;

                }

            }

        },
        { passive: true }
    );


    content.addEventListener(
        "touchend",
        function() {

            if (!swiping) return;

            swiping = false;


            const diff = currentX - startX;


            content.style.transition =
                "transform 0.2s ease";


            if (diff < -50) {

                content.style.transform =
                    `translateX(-${revealWidth}px)`;

                content.classList.add("swiped-open");

            }

            else {

                content.style.transform = "translateX(0)";

                content.classList.remove("swiped-open");

            }


            startX = 0;
            startY = 0;
            currentX = 0;

        }
    );

}



/* =========================
   거래 수정 / 삭제
========================= */

function editTransaction(id) {

    const transaction =
        transactions.find(
            item => String(item.id) === String(id)
        );


    if (!transaction) return;


    const currentAmount =
        transaction.amount.toLocaleString("ko-KR");


    appPrompt(
        "금액을 수정하세요.",
        currentAmount,
        {
            title: "금액 수정",
            formatAmount: true,
            placeholder: "0"
        }
    ).then(function(newAmount) {

        if (newAmount === null) return;


        const amount =
            Number(newAmount.replace(/[^0-9]/g, ""));


        if (!amount || amount <= 0) {

            appAlert("올바른 금액을 입력해주세요.");

            return;

        }


        transaction.amount = amount;


        saveTransactions();

        syncUpdateTransaction(id, { amount: amount });

        renderCalendar();
        renderSelectedDate();

    });

}


function deleteTransaction(id) {

    const transaction =
        transactions.find(
            item => String(item.id) === String(id)
        );


    if (!transaction) return;


    appConfirm(
        "이 내역을 삭제할까요?",
        {
            title: "내역 삭제",
            confirmText: "삭제",
            danger: true
        }
    ).then(function(confirmed) {

        if (!confirmed) return;


        transactions =
            transactions.filter(
                item => String(item.id) !== String(id)
            );


        saveTransactions();

        syncDeleteTransaction(id);

        renderCalendar();
        renderSelectedDate();

    });

}



/* =========================
   엑셀 내보내기
========================= */

function setExportDates(start, end) {

    const startInput =
        document.getElementById("exportStartDate");

    const endInput =
        document.getElementById("exportEndDate");


    if (startInput) startInput.value = start;
    if (endInput) endInput.value = end;

}


function setExportRangeThisMonth() {

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();


    const start =
        `${year}-${String(month + 1).padStart(2, "0")}-01`;


    const lastDate =
        new Date(year, month + 1, 0).getDate();


    const end =
        `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDate).padStart(2, "0")}`;


    setExportDates(start, end);

}


function setExportRangeLastMonth() {

    const today = new Date();

    const date =
        new Date(today.getFullYear(), today.getMonth() - 1, 1);


    const year = date.getFullYear();
    const month = date.getMonth();


    const start =
        `${year}-${String(month + 1).padStart(2, "0")}-01`;


    const lastDate =
        new Date(year, month + 1, 0).getDate();


    const end =
        `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDate).padStart(2, "0")}`;


    setExportDates(start, end);

}


function setExportRangeThisYear() {

    const year = new Date().getFullYear();

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
                String(a.date).localeCompare(String(b.date))
        );


    setExportDates(
        sorted[0].date,
        sorted[sorted.length - 1].date
    );

}


function initializeExportDates() {

    const startInput =
        document.getElementById("exportStartDate");

    const endInput =
        document.getElementById("exportEndDate");


    if (!startInput || !endInput) return;


    if (!startInput.value || !endInput.value) {
        setExportRangeThisMonth();
    }

}


function exportTransactionsToExcel() {

    const startInput =
        document.getElementById("exportStartDate");

    const endInput =
        document.getElementById("exportEndDate");


    const start =
        startInput ? startInput.value : "";

    const end =
        endInput ? endInput.value : "";


    if (!start || !end) {

        appAlert("기간을 선택해주세요.");

        return;

    }


    if (start > end) {

        appAlert("시작일이 종료일보다 늦을 수 없습니다.");

        return;

    }


    const filtered =
        transactions
            .filter(
                transaction =>
                    transaction.date >= start &&
                    transaction.date <= end
            )
            .sort(
                (a, b) =>
                    String(a.date).localeCompare(String(b.date)) ||
                    String(a.id).localeCompare(String(b.id))
            );


    if (!filtered.length) {

        appAlert("선택한 기간에 내역이 없습니다.");

        return;

    }


    if (typeof XLSX === "undefined") {

        appAlert(
            "엑셀 기능을 불러오지 못했습니다. 인터넷 연결을 확인해주세요."
        );

        return;

    }


    const rows =
        filtered.map(transaction => ({

            "날짜": transaction.date,

            "구분":
                transaction.type === "expense"
                    ? "지출"
                    : "수입",

            "금액": transaction.amount,

            "카테고리": transaction.category || "",
            "결제수단": transaction.payment || "",
            "주체": transaction.subject || "",
            "메모": transaction.memo || ""

        }));


    const worksheet =
        XLSX.utils.json_to_sheet(rows);


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


    try {

        const workbookArray =
            XLSX.write(
                workbook,
                {
                    bookType: "xlsx",
                    type: "array"
                }
            );


        const blob =
            new Blob(
                [workbookArray],
                {
                    type:
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                }
            );


        const url = URL.createObjectURL(blob);


        const link =
            document.createElement("a");

        link.href = url;
        link.download = fileName;
        link.style.display = "none";


        document.body.appendChild(link);

        link.click();


        setTimeout(
            function() {

                document.body.removeChild(link);

                URL.revokeObjectURL(url);

            },
            1000
        );

    }

    catch (error) {

        console.error(error);

        XLSX.writeFile(workbook, fileName);

    }

}