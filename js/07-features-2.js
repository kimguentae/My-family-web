/* =========================
   07-2. 분석 / 설정 / 관리 / 예산
========================= */

/* =========================
   설정 UI
========================= */

function updateSettingsUI() {

    const memoExpenseToggle =
        document.getElementById("memoExpenseToggle");

    const memoIncomeToggle =
        document.getElementById("memoIncomeToggle");

    const categoryExpenseToggle =
        document.getElementById("categoryExpenseToggle");

    const categoryIncomeToggle =
        document.getElementById("categoryIncomeToggle");

    const paymentExpenseToggle =
        document.getElementById("paymentExpenseToggle");

    const paymentIncomeToggle =
        document.getElementById("paymentIncomeToggle");

    const subjectExpenseToggle =
        document.getElementById("subjectExpenseToggle");

    const subjectIncomeToggle =
        document.getElementById("subjectIncomeToggle");


    if (memoExpenseToggle)
        memoExpenseToggle.checked = settings.memoExpenseEnabled;

    if (memoIncomeToggle)
        memoIncomeToggle.checked = settings.memoIncomeEnabled;

    if (categoryExpenseToggle)
        categoryExpenseToggle.checked = settings.categoryExpenseEnabled;

    if (categoryIncomeToggle)
        categoryIncomeToggle.checked = settings.categoryIncomeEnabled;

    if (paymentExpenseToggle)
        paymentExpenseToggle.checked = settings.paymentExpenseEnabled;

    if (paymentIncomeToggle)
        paymentIncomeToggle.checked = settings.paymentIncomeEnabled;

    if (subjectExpenseToggle)
        subjectExpenseToggle.checked = settings.subjectExpenseEnabled;

    if (subjectIncomeToggle)
        subjectIncomeToggle.checked = settings.subjectIncomeEnabled;


    updateInputAreas();

    updateAnalysisGroupVisibility();

    updateAccountUI();

}


function toggleMemoExpense() {

    settings.memoExpenseEnabled =
        document.getElementById("memoExpenseToggle").checked;


    if (currentType === "expense" && !settings.memoExpenseEnabled) {

        const input =
            document.getElementById("memoInput");

        if (input) input.value = "";

    }


    saveSettings();
    updateInputAreas();

}


function toggleMemoIncome() {

    settings.memoIncomeEnabled =
        document.getElementById("memoIncomeToggle").checked;


    if (currentType === "income" && !settings.memoIncomeEnabled) {

        const input =
            document.getElementById("memoInput");

        if (input) input.value = "";

    }


    saveSettings();
    updateInputAreas();

}


function toggleCategoryExpense() {

    settings.categoryExpenseEnabled =
        document.getElementById("categoryExpenseToggle").checked;


    if (currentType === "expense" && !settings.categoryExpenseEnabled) {
        selectedCategory = "";
    }


    saveSettings();
    renderCategoryButtons();
    updateInputAreas();

}


function toggleCategoryIncome() {

    settings.categoryIncomeEnabled =
        document.getElementById("categoryIncomeToggle").checked;


    if (currentType === "income" && !settings.categoryIncomeEnabled) {
        selectedCategory = "";
    }


    saveSettings();
    renderCategoryButtons();
    updateInputAreas();

}


function togglePaymentExpense() {

    settings.paymentExpenseEnabled =
        document.getElementById("paymentExpenseToggle").checked;


    if (currentType === "expense" && !settings.paymentExpenseEnabled) {
        selectedPayment = "";
    }


    saveSettings();
    renderPaymentButtons();
    updateInputAreas();

}


function togglePaymentIncome() {

    settings.paymentIncomeEnabled =
        document.getElementById("paymentIncomeToggle").checked;


    if (currentType === "income" && !settings.paymentIncomeEnabled) {
        selectedPayment = "";
    }


    saveSettings();
    renderPaymentButtons();
    updateInputAreas();

}


function toggleSubjectExpense() {

    settings.subjectExpenseEnabled =
        document.getElementById("subjectExpenseToggle").checked;


    if (currentType === "expense" && !settings.subjectExpenseEnabled) {
        selectedSubject = "";
    }


    saveSettings();
    renderSubjectButtons();
    updateInputAreas();

}


function toggleSubjectIncome() {

    settings.subjectIncomeEnabled =
        document.getElementById("subjectIncomeToggle").checked;


    if (currentType === "income" && !settings.subjectIncomeEnabled) {
        selectedSubject = "";
    }


    saveSettings();
    renderSubjectButtons();
    updateInputAreas();

}


function updateAnalysisGroupVisibility() {

    const categoryGroup =
        document.getElementById("analysisCategoryGroup");

    const paymentGroup =
        document.getElementById("analysisPaymentGroup");

    const subjectGroup =
        document.getElementById("analysisSubjectGroup");

    const monthlyChartGroup =
        document.getElementById("analysisMonthlyChartGroup");


    if (categoryGroup)
        categoryGroup.style.display =
            settings.analysisCategoryEnabled ? "block" : "none";

    if (paymentGroup)
        paymentGroup.style.display =
            settings.analysisPaymentEnabled ? "block" : "none";

    if (subjectGroup)
        subjectGroup.style.display =
            settings.analysisSubjectEnabled ? "block" : "none";

    if (monthlyChartGroup)
        monthlyChartGroup.style.display =
            settings.monthlyChartEnabled ? "block" : "none";

}



/* =========================
   분석 항목 순서 관리
========================= */

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
        document.getElementById("analysisGroupOrderList");

    if (!container) return;


    container.innerHTML = "";


    settings.analysisGroupOrder.forEach((key, index) => {

        const meta = analysisGroupMeta[key];

        if (!meta) return;


        const item = document.createElement("div");
        item.className = "category-manage-item";
        item.dataset.index = index;


        const content = document.createElement("div");
        content.className = "category-manage-content";


        const name = document.createElement("span");
        name.className = "category-name";
        name.innerText = meta.label;


        const right = document.createElement("div");
        right.style.display = "flex";
        right.style.alignItems = "center";
        right.style.gap = "10px";


        const switchLabel = document.createElement("label");
        switchLabel.className = "switch";


        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = settings[meta.settingKey];

        checkbox.onchange = function() {

            settings[meta.settingKey] = checkbox.checked;

            saveSettings();
            updateAnalysisGroupVisibility();


            const analysisScreen =
                document.getElementById("analysisScreen");

            if (
                analysisScreen &&
                analysisScreen.classList.contains("active")
            ) {
                renderAnalysis();
            }

        };


        const slider = document.createElement("span");
        slider.className = "slider";


        switchLabel.appendChild(checkbox);
        switchLabel.appendChild(slider);


        const drag = document.createElement("span");
        drag.className = "category-drag";
        drag.innerText = "⋮⋮";


        right.appendChild(switchLabel);
        right.appendChild(drag);


        content.appendChild(name);
        content.appendChild(right);


        item.appendChild(content);

        container.appendChild(item);


        initializeDragSort(
            item,
            drag,
            {
                getArray: () => settings.analysisGroupOrder,
                getItemHeight: () => 54,
                onSave: saveSettings,
                onRender: renderAnalysisGroupOrderList,
                onAfterMove: function() {

                    const analysisScreen =
                        document.getElementById("analysisScreen");

                    if (
                        analysisScreen &&
                        analysisScreen.classList.contains("active")
                    ) {
                        renderAnalysis();
                    }

                }
            }
        );

    });

}


function reorderAnalysisGroupsInDOM() {

    const groupElements = {

        monthlyChart:
            document.getElementById("analysisMonthlyChartGroup"),

        category:
            document.getElementById("analysisCategoryGroup"),

        payment:
            document.getElementById("analysisPaymentGroup"),

        subject:
            document.getElementById("analysisSubjectGroup")

    };


    const order =
        Array.isArray(settings.analysisGroupOrder) &&
        settings.analysisGroupOrder.length === 4
            ? settings.analysisGroupOrder
            : ["monthlyChart", "category", "payment", "subject"];


    order.forEach(key => {

        const element = groupElements[key];

        if (element && element.parentNode) {
            element.parentNode.appendChild(element);
        }

    });

}



/* =========================
   분석 (기본 유틸)
========================= */

function getAnalysisTodayString() {

    const today = new Date();

    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

}


function getAnalysisStartOfYear() {

    return `${new Date().getFullYear()}-01-01`;

}


function getAnalysisMonthlyAverage(amount, startDate, endDate) {

    if (!startDate || !endDate) return 0;


    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");


    const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) +
        1;


    if (months <= 0) return 0;


    return Number(amount || 0) / months;

}


function getAnalysisTransactions() {

    const start =
        document.getElementById("analysisStartDate")?.value;

    const end =
        document.getElementById("analysisEndDate")?.value;


    if (!start || !end) return [];


    return transactions.filter(transaction => {

        if (transaction.type !== analysisType) return false;

        if (transaction.date < start || transaction.date > end) return false;

        return true;

    });

}


function setAnalysisType(type) {

    analysisType = type;

    analysisSelectedCategory = "";
    analysisSelectedPayment = "";
    analysisSelectedSubject = "";


    const expenseButton =
        document.getElementById("analysisExpenseBtn");

    const incomeButton =
        document.getElementById("analysisIncomeBtn");


    if (expenseButton)
        expenseButton.classList.toggle("active", type === "expense");

    if (incomeButton)
        incomeButton.classList.toggle("active", type === "income");


    renderAnalysis();

}


function formatAnalysisDateDisplay(dateString) {

    if (!dateString) return "";

    const date = new Date(dateString + "T00:00:00");

    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;

}


function updateAnalysisDateText() {

    const startText = document.getElementById("analysisStartDateText");
    const endText = document.getElementById("analysisEndDateText");

    const startInput = document.getElementById("analysisStartDate");
    const endInput = document.getElementById("analysisEndDate");


    if (startText && startInput)
        startText.innerText = formatAnalysisDateDisplay(startInput.value);

    if (endText && endInput)
        endText.innerText = formatAnalysisDateDisplay(endInput.value);


    fitAnalysisDateRow();

}


function fitAnalysisDateRow() {

    const row = document.getElementById("analysisDateRow");
    if (!row) return;


    const pieces =
        row.querySelectorAll(
            ".analysis-date-text, .analysis-date-separator"
        );


    if (!pieces.length) return;


    let fontSize = 23;

    pieces.forEach(piece => {
        piece.style.fontSize = fontSize + "px";
    });


    while (
        row.scrollWidth > row.clientWidth &&
        fontSize > 13
    ) {

        fontSize -= 1;

        pieces.forEach(piece => {
            piece.style.fontSize = fontSize + "px";
        });

    }

}


function initializeAnalysisDates() {

    const startInput = document.getElementById("analysisStartDate");
    const endInput = document.getElementById("analysisEndDate");

    if (!startInput || !endInput) return;


    if (!startInput.value)
        startInput.value = getAnalysisStartOfYear();

    if (!endInput.value)
        endInput.value = getAnalysisTodayString();


    updateAnalysisDateText();


    startInput.onchange = function() {

        if (startInput.value > endInput.value)
            endInput.value = startInput.value;

        updateAnalysisDateText();

        analysisSelectedCategory = "";
        analysisSelectedPayment = "";
        analysisSelectedSubject = "";

        renderAnalysis();

    };


    endInput.onchange = function() {

        if (endInput.value < startInput.value)
            startInput.value = endInput.value;

        updateAnalysisDateText();

        analysisSelectedCategory = "";
        analysisSelectedPayment = "";
        analysisSelectedSubject = "";

        renderAnalysis();

    };

}



/* =========================
   분석 집계
========================= */

function getAnalysisCategoryData(transactions) {

    const result = {};

    transactions.forEach(transaction => {

        const name = transaction.category || "미분류";

        if (!result[name]) result[name] = 0;

        result[name] += Number(transaction.amount) || 0;

    });

    return result;

}


function getAnalysisPaymentData(transactions) {

    const result = {};

    transactions.forEach(transaction => {

        const name = transaction.payment || "미지정";

        if (!result[name]) result[name] = 0;

        result[name] += Number(transaction.amount) || 0;

    });

    return result;

}


function getAnalysisSubjectData(transactions) {

    const result = {};

    transactions.forEach(transaction => {

        const name = transaction.subject || "미지정";

        if (!result[name]) result[name] = 0;

        result[name] += Number(transaction.amount) || 0;

    });

    return result;

}


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


function sortAnalysisEntriesByAmount(dataObject) {

    return Object.entries(dataObject).sort((a, b) => b[1] - a[1]);

}


function renderAnalysisGroupBar(
    elementId,
    infoElementId,
    dataObject,
    total
) {

    const container = document.getElementById(elementId);
    const info = document.getElementById(infoElementId);

    if (!container) return;


    container.innerHTML = "";

    if (info) info.innerText = "";


    if (!total || total <= 0) return;


    let selectedSegment = null;


    sortAnalysisEntriesByAmount(dataObject).forEach(([name, amount], index) => {

        const percentage = (amount / total) * 100;

        const segment = document.createElement("div");
        segment.className = "analysis-group-bar-segment";

        segment.style.width = percentage + "%";
        segment.style.background =
            analysisBarColors[index % analysisBarColors.length];


        segment.onclick = function() {

            const allSegments =
                container.querySelectorAll(
                    ".analysis-group-bar-segment"
                );


            if (selectedSegment === segment) {

                selectedSegment = null;

                allSegments.forEach(other => {
                    other.classList.remove("dimmed");
                });

                if (info) info.innerText = "";

                return;

            }


            selectedSegment = segment;

            allSegments.forEach(other => {
                other.classList.toggle("dimmed", other !== segment);
            });


            if (info)
                info.innerText = `${name} · ${percentage.toFixed(1)}%`;

        };


        container.appendChild(segment);

    });

}


function createAnalysisItem(
    name,
    amount,
    clickFunction,
    startDate,
    endDate
) {

    const button = document.createElement("button");
    button.type = "button";
    button.className = "analysis-item";
    button.onclick = clickFunction;


    const nameElement = document.createElement("span");
    nameElement.className = "analysis-item-name";
    nameElement.textContent = name;


    const amountElement = document.createElement("span");
    amountElement.className = "analysis-item-amount";
    amountElement.textContent = formatAnalysisAmount(amount) + "원";


    const averageElement = document.createElement("span");
    averageElement.className = "analysis-item-average";


    const periodAverage =
        getAnalysisMonthlyAverage(amount, startDate, endDate);

    averageElement.textContent =
        formatAnalysisAmount(Math.round(periodAverage)) + "원";


    button.appendChild(nameElement);
    button.appendChild(amountElement);
    button.appendChild(averageElement);


    return button;

}


function createAnalysisCategoryItem(
    name,
    amount,
    startDate,
    endDate
) {

    const periodAverage =
        getAnalysisMonthlyAverage(amount, startDate, endDate);


    const budget =
        Number(settings.budgets && settings.budgets[name]) || 0;


    const isOverBudget =
        budget > 0 && periodAverage > budget;


    const button = document.createElement("button");
    button.type = "button";
    button.className = "analysis-item analysis-item-flip";


    const inner = document.createElement("div");
    inner.className = "analysis-item-inner";


    const front = document.createElement("div");
    front.className = "analysis-item-front";


    const nameElement = document.createElement("span");
    nameElement.className = "analysis-item-name";
    nameElement.textContent = name;


    const amountElement = document.createElement("span");
    amountElement.className = "analysis-item-amount";
    amountElement.textContent = formatAnalysisAmount(amount) + "원";


    const averageElement = document.createElement("span");
    averageElement.className = "analysis-item-average";
    averageElement.textContent =
        formatAnalysisAmount(Math.round(periodAverage)) + "원";


    front.appendChild(nameElement);
    front.appendChild(amountElement);
    front.appendChild(averageElement);


    const back = document.createElement("div");
    back.className =
        "analysis-item-back" +
        (isOverBudget ? " over-budget" : "");


    const backName = document.createElement("span");
    backName.className = "analysis-item-back-name";
    backName.textContent = name;


    const budgetElement = document.createElement("span");
    budgetElement.className = "analysis-item-budget-label";
    budgetElement.textContent =
        budget > 0
            ? formatAnalysisAmount(budget) + "원"
            : "예산 미설정";


    const budgetAverageElement = document.createElement("span");
    budgetAverageElement.className = "analysis-item-budget-average";
    budgetAverageElement.textContent =
        formatAnalysisAmount(Math.round(periodAverage)) + "원";


    back.appendChild(backName);
    back.appendChild(budgetElement);
    back.appendChild(budgetAverageElement);


    inner.appendChild(front);
    inner.appendChild(back);

    button.appendChild(inner);


    button.onclick = function() {

        button.classList.toggle("flipped");

        selectAnalysisCategory(name);

    };


    return button;

}



/* =========================
   분석 요약
========================= */

function renderAnalysisOverallSummary(
    total,
    startDate,
    endDate
) {

    const element =
        document.getElementById("analysisOverallSummary");

    if (!element) return;


    const monthlyAverage =
        getAnalysisMonthlyAverage(total, startDate, endDate);


    element.innerHTML = `

        <div class="analysis-overall-summary-item">
            <span class="analysis-overall-summary-label">전체금액</span>
            <span class="analysis-overall-summary-value">
                ${formatAnalysisAmount(total)}원
            </span>
        </div>

        <div class="analysis-overall-summary-item">
            <span class="analysis-overall-summary-label">월평균</span>
            <span class="analysis-overall-summary-value">
                ${formatAnalysisAmount(Math.round(monthlyAverage))}원
            </span>
        </div>

    `;

}


function formatAnalysisDate(dateString) {

    if (!dateString) return "";

    const parts = dateString.split("-");

    if (parts.length !== 3) return dateString;


    return (
        Number(parts[0]) + "." +
        Number(parts[1]) + "." +
        Number(parts[2])
    );

}



/* =========================
   분석 상세
========================= */

function renderAnalysisDetails(
    elementId,
    transactions,
    filterField,
    filterValue
) {

    const element = document.getElementById(elementId);

    if (!element) return;


    const filtered =
        transactions.filter(transaction => {

            const value =
                transaction[filterField] ||
                (
                    filterField === "payment"
                        ? "미지정"
                        : filterField === "subject"
                            ? "미지정"
                            : "미분류"
                );


            return value === filterValue;

        });


    if (!filtered.length) {

        element.innerHTML =
            `<div class="no-transactions">해당 내역이 없습니다.</div>`;

        element.classList.add("active");

        return;

    }


    element.innerHTML = "";


    filtered
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .forEach(transaction => {

            const card = document.createElement("div");
            card.className = "analysis-detail-card";


            const left = document.createElement("div");
            left.className = "analysis-detail-left";


            const date = document.createElement("div");
            date.className = "analysis-detail-date";
            date.textContent = formatAnalysisDate(transaction.date);


            const name = document.createElement("div");
            name.className = "analysis-detail-name";
            name.textContent = transaction.category || "미분류";


            const meta = document.createElement("div");
            meta.className = "analysis-detail-meta";

            const metaParts = [];


            if (filterField !== "category") {

                if (transaction.payment)
                    metaParts.push(transaction.payment);

                if (transaction.subject)
                    metaParts.push(transaction.subject);

            }


            if (transaction.memo)
                metaParts.push(transaction.memo);


            meta.textContent = metaParts.join(" · ");


            left.appendChild(date);

            if (filterField !== "category")
                left.appendChild(name);

            if (meta.textContent)
                left.appendChild(meta);


            const amount = document.createElement("div");
            amount.className =
                "analysis-detail-amount " + analysisType;

            amount.textContent =
                (analysisType === "expense" ? "-" : "+") +
                formatAnalysisAmount(transaction.amount) + "원";


            card.appendChild(left);
            card.appendChild(amount);

            element.appendChild(card);

        });


    element.classList.add("active");

}


function selectAnalysisCategory(category) {

    if (analysisSelectedCategory === category) {

        analysisSelectedCategory = "";

        const details =
            document.getElementById("analysisCategoryDetails");

        if (details) details.classList.remove("active");

        return;

    }


    analysisSelectedCategory = category;

    const transactions = getAnalysisTransactions();

    renderAnalysisDetails(
        "analysisCategoryDetails",
        transactions,
        "category",
        category
    );

}


function selectAnalysisPayment(payment) {

    if (analysisSelectedPayment === payment) {

        analysisSelectedPayment = "";

        const details =
            document.getElementById("analysisPaymentDetails");

        if (details) details.classList.remove("active");

        return;

    }


    analysisSelectedPayment = payment;

    const transactions = getAnalysisTransactions();

    renderAnalysisDetails(
        "analysisPaymentDetails",
        transactions,
        "payment",
        payment
    );

}


function selectAnalysisSubject(subject) {

    if (analysisSelectedSubject === subject) {

        analysisSelectedSubject = "";

        const details =
            document.getElementById("analysisSubjectDetails");

        if (details) details.classList.remove("active");

        return;

    }


    analysisSelectedSubject = subject;

    const transactions = getAnalysisTransactions();

    renderAnalysisDetails(
        "analysisSubjectDetails",
        transactions,
        "subject",
        subject
    );

}



/* =========================
   월별 그래프
========================= */

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


function getAnalysisMonthKeys(startDate, endDate) {

    const keys = [];

    const cursor =
        new Date(startDate.slice(0, 7) + "-01T00:00:00");

    const endCursor =
        new Date(endDate.slice(0, 7) + "-01T00:00:00");


    while (cursor <= endCursor) {

        const year = cursor.getFullYear();

        const month =
            String(cursor.getMonth() + 1).padStart(2, "0");

        keys.push(`${year}-${month}`);

        cursor.setMonth(cursor.getMonth() + 1);

    }

    return keys;

}


function renderAnalysisMonthlyChart(
    transactionsForChart,
    startDate,
    endDate
) {

    const group =
        document.getElementById("analysisMonthlyChartGroup");

    const container =
        document.getElementById("analysisMonthlyChart");

    const legend =
        document.getElementById("analysisMonthlyLegend");


    if (!group || !container || !legend) return;


    if (!settings.monthlyChartEnabled) {
        group.style.display = "none";
        return;
    }

    group.style.display = "block";

    container.innerHTML = "";
    legend.innerHTML = "";


    if (!startDate || !endDate) return;


    const monthKeys =
        getAnalysisMonthKeys(startDate, endDate);


    const monthData = {};

    monthKeys.forEach(key => {
        monthData[key] = { total: 0, categories: {} };
    });


    transactionsForChart.forEach(transaction => {

        const monthKey = transaction.date.slice(0, 7);

        if (!monthData[monthKey]) return;

        const name = transaction.category || "미분류";
        const amount = Number(transaction.amount) || 0;


        monthData[monthKey].categories[name] =
            (monthData[monthKey].categories[name] || 0) + amount;

        monthData[monthKey].total += amount;

    });


    const categoryTotals = {};

    Object.values(monthData).forEach(month => {

        Object.entries(month.categories).forEach(([name, amount]) => {

            categoryTotals[name] =
                (categoryTotals[name] || 0) + amount;

        });

    });


    const sortedCategoryNames =
        Object.keys(categoryTotals).sort(
            (a, b) => categoryTotals[b] - categoryTotals[a]
        );


    const colorMap = {};

    sortedCategoryNames.forEach((name, index) => {
        colorMap[name] =
            monthlyChartColors[index % monthlyChartColors.length];
    });


    if (!sortedCategoryNames.length) {

        container.innerHTML =
            `<div class="monthly-chart-empty">해당 기간에 내역이 없습니다.</div>`;

        return;

    }


    const maxTotal =
        Math.max(1, ...monthKeys.map(key => monthData[key].total));

    const barMaxHeight = 180;


    monthKeys.forEach(key => {

        const data = monthData[key];

        const col = document.createElement("div");
        col.className = "monthly-chart-col";


        const amountLabel = document.createElement("div");
        amountLabel.className = "monthly-chart-amount";
        amountLabel.textContent =
            data.total > 0 ? formatCompactAmount(data.total) : "";


        const barWrap = document.createElement("div");
        barWrap.className = "monthly-chart-bar-wrap";


        const bar = document.createElement("div");
        bar.className = "monthly-chart-bar";

        const barHeight =
            data.total > 0
                ? (data.total / maxTotal) * barMaxHeight
                : 0;

        bar.style.height = barHeight + "px";


        const monthCategoriesSorted =
            Object.entries(data.categories).sort((a, b) => b[1] - a[1]);


        monthCategoriesSorted.forEach(([name, amount]) => {

            const ratio =
                data.total > 0 ? amount / data.total : 0;

            const segment = document.createElement("div");
            segment.className = "monthly-chart-segment";
            segment.style.height = (ratio * 100) + "%";
            segment.style.background = colorMap[name];

            segment.title =
                `${name} · ${Math.round(ratio * 100)}%`;


            if (ratio >= 0.1) {

                const label = document.createElement("span");
                label.className = "monthly-chart-segment-label";
                label.textContent = Math.round(ratio * 100) + "%";

                segment.appendChild(label);

            }


            bar.appendChild(segment);

        });


        barWrap.appendChild(bar);


        const monthLabel = document.createElement("div");
        monthLabel.className = "monthly-chart-month";

        const [, monthPart] = key.split("-");

        monthLabel.textContent = Number(monthPart) + "월";


        col.appendChild(amountLabel);
        col.appendChild(barWrap);
        col.appendChild(monthLabel);


        container.appendChild(col);

    });


    sortedCategoryNames.forEach(name => {

        const item = document.createElement("div");
        item.className = "monthly-chart-legend-item";


        const dot = document.createElement("span");
        dot.className = "monthly-chart-legend-dot";
        dot.style.background = colorMap[name];


        const label = document.createElement("span");
        label.textContent = name;


        item.appendChild(dot);
        item.appendChild(label);

        legend.appendChild(item);

    });

}



/* =========================
   분석 전체 렌더링
========================= */

function renderAnalysis() {

    const startInput = document.getElementById("analysisStartDate");
    const endInput = document.getElementById("analysisEndDate");

    if (!startInput || !endInput) return;


    if (!startInput.value || !endInput.value)
        initializeAnalysisDates();


    const startDate = startInput.value;
    const endDate = endInput.value;


    if (!startDate || !endDate) return;


    const transactions = getAnalysisTransactions();


    const total =
        transactions.reduce(
            (sum, transaction) =>
                sum + (Number(transaction.amount) || 0),
            0
        );


    renderAnalysisOverallSummary(total, startDate, endDate);

    updateAnalysisGroupVisibility();
    reorderAnalysisGroupsInDOM();


    renderAnalysisMonthlyChart(transactions, startDate, endDate);


    /* 카테고리 */

    const categoryList =
        document.getElementById("analysisCategoryList");

    const categoryDetails =
        document.getElementById("analysisCategoryDetails");


    if (categoryList) {

        categoryList.innerHTML = "";

        const categoryData =
            getAnalysisCategoryData(transactions);


        renderAnalysisGroupBar(
            "analysisCategoryBar",
            "analysisCategoryBarInfo",
            categoryData,
            total
        );


        sortAnalysisEntriesByAmount(categoryData)
            .forEach(([name, amount]) => {

                categoryList.appendChild(
                    createAnalysisCategoryItem(
                        name,
                        amount,
                        startDate,
                        endDate
                    )
                );

            });

    }


    if (categoryDetails && !analysisSelectedCategory) {
        categoryDetails.classList.remove("active");
        categoryDetails.innerHTML = "";
    }


    /* 결제수단 */

    const paymentList =
        document.getElementById("analysisPaymentList");

    const paymentDetails =
        document.getElementById("analysisPaymentDetails");


    if (paymentList) {

        paymentList.innerHTML = "";

        const paymentData =
            getAnalysisPaymentData(transactions);


        renderAnalysisGroupBar(
            "analysisPaymentBar",
            "analysisPaymentBarInfo",
            paymentData,
            total
        );


        sortAnalysisEntriesByAmount(paymentData)
            .forEach(([name, amount]) => {

                paymentList.appendChild(
                    createAnalysisItem(
                        name,
                        amount,
                        () => selectAnalysisPayment(name),
                        startDate,
                        endDate
                    )
                );

            });

    }


    if (paymentDetails && !analysisSelectedPayment) {
        paymentDetails.classList.remove("active");
        paymentDetails.innerHTML = "";
    }


    /* 주체 */

    const subjectList =
        document.getElementById("analysisSubjectList");

    const subjectDetails =
        document.getElementById("analysisSubjectDetails");


    if (subjectList) {

        subjectList.innerHTML = "";

        const subjectData =
            getAnalysisSubjectData(transactions);


        renderAnalysisGroupBar(
            "analysisSubjectBar",
            "analysisSubjectBarInfo",
            subjectData,
            total
        );


        sortAnalysisEntriesByAmount(subjectData)
            .forEach(([name, amount]) => {

                subjectList.appendChild(
                    createAnalysisItem(
                        name,
                        amount,
                        () => selectAnalysisSubject(name),
                        startDate,
                        endDate
                    )
                );

            });

    }


    if (subjectDetails && !analysisSelectedSubject) {
        subjectDetails.classList.remove("active");
        subjectDetails.innerHTML = "";
    }


    /* 선택된 상세내역 유지 */

    if (analysisSelectedCategory)
        renderAnalysisDetails(
            "analysisCategoryDetails",
            transactions,
            "category",
            analysisSelectedCategory
        );

    if (analysisSelectedPayment)
        renderAnalysisDetails(
            "analysisPaymentDetails",
            transactions,
            "payment",
            analysisSelectedPayment
        );

    if (analysisSelectedSubject)
        renderAnalysisDetails(
            "analysisSubjectDetails",
            transactions,
            "subject",
            analysisSelectedSubject
        );

}



/* =========================
   예산
========================= */

function renderBudgetSettings() {

    const container =
        document.getElementById("budgetCategoryList");

    if (!container) return;


    container.innerHTML = "";


    const list = categories.expense || [];


    if (!settings.budgets) settings.budgets = {};


    if (!list.length) {

        container.innerHTML =
            `<div class="no-transactions">지출 카테고리가 없습니다.</div>`;

        return;

    }


    list.forEach(category => {

        const budget =
            Number(settings.budgets[category]) || 0;


        const button = document.createElement("button");
        button.type = "button";
        button.className = "budget-card";

        button.onclick = function() {
            editCategoryBudget(category);
        };


        const nameElement = document.createElement("span");
        nameElement.className = "budget-card-name";
        nameElement.textContent = category;


        const amountElement = document.createElement("span");
        amountElement.className = "budget-card-amount";

        if (budget > 0) {
            amountElement.textContent =
                formatAnalysisAmount(budget) + "원";
        }
        else {
            amountElement.classList.add("empty");
            amountElement.textContent = "미설정";
        }


        button.appendChild(nameElement);
        button.appendChild(amountElement);

        container.appendChild(button);

    });

}


function editCategoryBudget(category) {

    if (!settings.budgets) settings.budgets = {};


    const currentBudget =
        Number(settings.budgets[category]) || 0;


    appPrompt(
        `월 예산을 입력하세요.`,
        currentBudget > 0
            ? currentBudget.toLocaleString("ko-KR")
            : "",
        {
            title: category,
            formatAmount: true,
            placeholder: "0"
        }
    ).then(function(input) {

        if (input === null) return;


        const trimmed = input.replace(/[^0-9]/g, "");


        if (!trimmed || Number(trimmed) <= 0) {
            delete settings.budgets[category];
        }
        else {
            settings.budgets[category] = Number(trimmed);
        }


        saveSettings();
        renderBudgetSettings();


        const analysisScreen =
            document.getElementById("analysisScreen");

        if (
            analysisScreen &&
            analysisScreen.classList.contains("active")
        ) {
            renderAnalysis();
        }

    });

}



/* =========================
   카테고리 관리
========================= */

function renderCategoryManagement() {

    renderCategoryManagementList("expense");
    renderCategoryManagementList("income");

}


function renderCategoryManagementList(type) {

    const container =
        document.getElementById(
            type === "expense"
                ? "expenseCategoryList"
                : "incomeCategoryList"
        );


    if (!container) return;


    container.innerHTML = "";


    categories[type].forEach((category, index) => {

        const item = document.createElement("div");
        item.className = "category-manage-item";
        item.dataset.index = index;


        const actions = document.createElement("div");
        actions.className = "category-actions";


        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "category-edit";
        editButton.innerText = "수정";

        editButton.onclick = function(event) {
            event.stopPropagation();
            editCategory(type, index);
        };


        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "category-delete";
        deleteButton.innerText = "삭제";

        deleteButton.onclick = function(event) {
            event.stopPropagation();
            deleteCategory(type, index);
        };


        actions.appendChild(editButton);
        actions.appendChild(deleteButton);


        const content = document.createElement("div");
        content.className = "category-manage-content";


        const name = document.createElement("span");
        name.className = "category-name";
        name.innerText = category;


        const drag = document.createElement("span");
        drag.className = "category-drag";
        drag.innerText = "⋮⋮";


        content.appendChild(name);
        content.appendChild(drag);


        item.appendChild(actions);
        item.appendChild(content);

        container.appendChild(item);


        initializeSingleCategorySwipe(item, content);


        initializeDragSort(
            item,
            drag,
            {
                getArray: () => categories[type],
                getItemHeight: () => 54,
                onSave: saveCategories,
                onRender: renderCategoryManagement,
                onAfterMove: renderCategoryButtons
            }
        );

    });

}


function initializeSingleCategorySwipe(item, content) {

    let startX = 0;
    let currentX = 0;
    let swiping = false;


    content.addEventListener(
        "touchstart",
        function(event) {
            startX = event.touches[0].clientX;
            currentX = startX;
            swiping = true;
        },
        { passive: true }
    );


    content.addEventListener(
        "touchmove",
        function(event) {

            if (!swiping) return;

            currentX = event.touches[0].clientX;

            const diff = currentX - startX;

            if (diff < 0 && diff > -120) {
                content.style.transform = `translateX(${diff}px)`;
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

            if (diff < -50) {
                content.style.transform = "translateX(-120px)";
            }
            else {
                content.style.transform = "translateX(0)";
            }

            startX = 0;
            currentX = 0;

        }
    );

}


function addCategory(type) {

    appPrompt(
        "카테고리 이름을 입력하세요.",
        "",
        {
            title: "카테고리 추가",
            placeholder: "카테고리 이름"
        }
    ).then(function(name) {

        if (name === null) return;


        const trimmed = name.trim();

        if (!trimmed) return;


        if (categories[type].includes(trimmed)) {
            appAlert("이미 존재하는 카테고리입니다.");
            return;
        }


        categories[type].push(trimmed);

        saveCategories();
        renderCategoryManagement();
        renderCategoryButtons();

    });

}


function editCategory(type, index) {

    const oldName = categories[type][index];


    appPrompt(
        "카테고리 이름을 수정하세요.",
        oldName,
        {
            title: "카테고리 수정",
            placeholder: "카테고리 이름"
        }
    ).then(function(newName) {

        if (newName === null) return;


        const trimmed = newName.trim();

        if (!trimmed) return;


        if (categories[type].includes(trimmed) && trimmed !== oldName) {
            appAlert("이미 존재하는 카테고리입니다.");
            return;
        }


        categories[type][index] = trimmed;


        transactions.forEach(transaction => {
            if (transaction.category === oldName) {
                transaction.category = trimmed;
            }
        });


        if (selectedCategory === oldName)
            selectedCategory = trimmed;


        if (
            settings.budgets &&
            Object.prototype.hasOwnProperty.call(settings.budgets, oldName)
        ) {
            settings.budgets[trimmed] = settings.budgets[oldName];
            delete settings.budgets[oldName];
            saveSettings();
        }


        saveCategories();
        saveTransactions();

        syncRenameTransactionsField("category", oldName, trimmed);

        renderCategoryManagement();
        renderCategoryButtons();
        renderSelectedDate();

    });

}


function deleteCategory(type, index) {

    const name = categories[type][index];


    const hasBudget =
        settings.budgets &&
        Object.prototype.hasOwnProperty.call(settings.budgets, name);


    const message =
        hasBudget
            ? `"${name}" 카테고리를 삭제할까요?\n\n· 기존 거래 내역은 삭제되지 않습니다.\n· 이 카테고리에 설정한 예산도 함께 삭제됩니다.`
            : `"${name}" 카테고리를 삭제할까요?\n\n기존 거래 내역은 삭제되지 않습니다.`;


    appConfirm(
        message,
        {
            title: "카테고리 삭제",
            confirmText: "삭제",
            danger: true
        }
    ).then(function(confirmed) {

        if (!confirmed) return;


        categories[type].splice(index, 1);


        if (selectedCategory === name)
            selectedCategory = "";


        if (
            settings.budgets &&
            Object.prototype.hasOwnProperty.call(settings.budgets, name)
        ) {
            delete settings.budgets[name];
            saveSettings();
        }


        saveCategories();

        renderCategoryManagement();
        renderCategoryButtons();

    });

}



/* =========================
   결제수단 관리
========================= */

function renderPaymentManagement() {

    const container =
        document.getElementById("paymentMethodList");

    if (!container) return;


    container.innerHTML = "";


    paymentMethods.forEach((payment, index) => {

        const item = document.createElement("div");
        item.className = "category-manage-item";
        item.dataset.index = index;


        const actions = document.createElement("div");
        actions.className = "category-actions";


        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "category-edit";
        editButton.innerText = "수정";

        editButton.onclick = function(event) {
            event.stopPropagation();
            editPaymentMethod(index);
        };


        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "category-delete";
        deleteButton.innerText = "삭제";

        deleteButton.onclick = function(event) {
            event.stopPropagation();
            deletePaymentMethod(index);
        };


        actions.appendChild(editButton);
        actions.appendChild(deleteButton);


        const content = document.createElement("div");
        content.className = "category-manage-content";


        const name = document.createElement("span");
        name.className = "category-name";
        name.innerText = payment;


        const drag = document.createElement("span");
        drag.className = "category-drag";
        drag.innerText = "⋮⋮";


        content.appendChild(name);
        content.appendChild(drag);


        item.appendChild(actions);
        item.appendChild(content);

        container.appendChild(item);


        initializeSingleCategorySwipe(item, content);


        initializeDragSort(
            item,
            drag,
            {
                getArray: () => paymentMethods,
                getItemHeight: () => 54,
                onSave: savePaymentMethods,
                onRender: renderPaymentManagement,
                onAfterMove: renderPaymentButtons
            }
        );

    });

}


function addPaymentMethod() {

    appPrompt(
        "결제수단 이름을 입력하세요.",
        "",
        {
            title: "결제수단 추가",
            placeholder: "결제수단 이름"
        }
    ).then(function(name) {

        if (name === null) return;

        const trimmed = name.trim();

        if (!trimmed) return;


        if (paymentMethods.includes(trimmed)) {
            appAlert("이미 존재하는 결제수단입니다.");
            return;
        }


        paymentMethods.push(trimmed);

        savePaymentMethods();
        renderPaymentManagement();
        renderPaymentButtons();

    });

}


function editPaymentMethod(index) {

    const oldName = paymentMethods[index];


    appPrompt(
        "결제수단 이름을 수정하세요.",
        oldName,
        {
            title: "결제수단 수정",
            placeholder: "결제수단 이름"
        }
    ).then(function(newName) {

        if (newName === null) return;

        const trimmed = newName.trim();

        if (!trimmed) return;


        if (paymentMethods.includes(trimmed) && trimmed !== oldName) {
            appAlert("이미 존재하는 결제수단입니다.");
            return;
        }


        paymentMethods[index] = trimmed;


        transactions.forEach(transaction => {
            if (transaction.payment === oldName) {
                transaction.payment = trimmed;
            }
        });


        if (selectedPayment === oldName)
            selectedPayment = trimmed;


        savePaymentMethods();
        saveTransactions();

        syncRenameTransactionsField("payment", oldName, trimmed);

        renderPaymentManagement();
        renderPaymentButtons();
        renderSelectedDate();

    });

}


function deletePaymentMethod(index) {

    const name = paymentMethods[index];


    appConfirm(
        `"${name}" 결제수단을 삭제할까요?\n\n기존 거래 내역은 삭제되지 않습니다.`,
        {
            title: "결제수단 삭제",
            confirmText: "삭제",
            danger: true
        }
    ).then(function(confirmed) {

        if (!confirmed) return;


        paymentMethods.splice(index, 1);


        if (selectedPayment === name)
            selectedPayment = "";


        savePaymentMethods();

        renderPaymentManagement();
        renderPaymentButtons();

    });

}



/* =========================
   주체 관리
========================= */

function renderSubjectManagement() {

    const container =
        document.getElementById("subjectList");

    if (!container) return;


    container.innerHTML = "";


    subjects.forEach((subject, index) => {

        const item = document.createElement("div");
        item.className = "category-manage-item";
        item.dataset.index = index;


        const actions = document.createElement("div");
        actions.className = "category-actions";


        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "category-edit";
        editButton.innerText = "수정";

        editButton.onclick = function(event) {
            event.stopPropagation();
            editSubject(index);
        };


        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "category-delete";
        deleteButton.innerText = "삭제";

        deleteButton.onclick = function(event) {
            event.stopPropagation();
            deleteSubject(index);
        };


        actions.appendChild(editButton);
        actions.appendChild(deleteButton);


        const content = document.createElement("div");
        content.className = "category-manage-content";


        const name = document.createElement("span");
        name.className = "category-name";
        name.innerText = subject;


        const drag = document.createElement("span");
        drag.className = "category-drag";
        drag.innerText = "⋮⋮";


        content.appendChild(name);
        content.appendChild(drag);


        item.appendChild(actions);
        item.appendChild(content);

        container.appendChild(item);


        initializeSingleCategorySwipe(item, content);


        initializeDragSort(
            item,
            drag,
            {
                getArray: () => subjects,
                getItemHeight: () => 54,
                onSave: saveSubjects,
                onRender: renderSubjectManagement,
                onAfterMove: renderSubjectButtons
            }
        );

    });

}


function addSubject() {

    appPrompt(
        "주체 이름을 입력하세요.",
        "",
        {
            title: "주체 추가",
            placeholder: "주체 이름"
        }
    ).then(function(name) {

        if (name === null) return;

        const trimmed = name.trim();

        if (!trimmed) return;


        if (subjects.includes(trimmed)) {
            appAlert("이미 존재하는 주체입니다.");
            return;
        }


        subjects.push(trimmed);

        saveSubjects();
        renderSubjectManagement();
        renderSubjectButtons();

    });

}


function editSubject(index) {

    const oldName = subjects[index];


    appPrompt(
        "주체 이름을 수정하세요.",
        oldName,
        {
            title: "주체 수정",
            placeholder: "주체 이름"
        }
    ).then(function(newName) {

        if (newName === null) return;

        const trimmed = newName.trim();

        if (!trimmed) return;


        if (subjects.includes(trimmed) && trimmed !== oldName) {
            appAlert("이미 존재하는 주체입니다.");
            return;
        }


        subjects[index] = trimmed;


        transactions.forEach(transaction => {
            if (transaction.subject === oldName) {
                transaction.subject = trimmed;
            }
        });


        if (selectedSubject === oldName)
            selectedSubject = trimmed;


        saveSubjects();
        saveTransactions();

        syncRenameTransactionsField("subject", oldName, trimmed);

        renderSubjectManagement();
        renderSubjectButtons();
        renderSelectedDate();

    });

}


function deleteSubject(index) {

    const name = subjects[index];


    appConfirm(
        `"${name}" 주체를 삭제할까요?\n\n기존 거래 내역은 삭제되지 않습니다.`,
        {
            title: "주체 삭제",
            confirmText: "삭제",
            danger: true
        }
    ).then(function(confirmed) {

        if (!confirmed) return;


        subjects.splice(index, 1);


        if (selectedSubject === name)
            selectedSubject = "";


        saveSubjects();

        renderSubjectManagement();
        renderSubjectButtons();

    });

}