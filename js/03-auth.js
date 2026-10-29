/* =========================
   03. 인증 (로그인/회원가입/세션)
========================= */

var currentAuthMode = "login";

/* 최근 로그인 폼 강제 표시 여부 */

var forceShowAuthForm = false;


/* =========================
   최근 로그인 계정 (localStorage)
========================= */

function getRecentAccountsStorageKey() {
    return "householdRecentAccounts";
}


function getRecentAccounts() {

    try {

        const raw =
            localStorage.getItem(getRecentAccountsStorageKey());

        if (!raw) return [];

        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) return [];

        return parsed.filter(function(item) {
            return item &&
                typeof item.email === "string" &&
                typeof item.userId === "string";
        });

    }

    catch (error) {
        return [];
    }

}


function saveRecentAccounts(list) {

    try {

        localStorage.setItem(
            getRecentAccountsStorageKey(),
            JSON.stringify(list)
        );

    }

    catch (error) {
        console.error(error);
    }

}


function addRecentAccount(user) {

    if (!user || !user.email || !user.id) return;


    let list = getRecentAccounts();


    list = list.filter(function(item) {
        return item.userId !== user.id;
    });


    list.unshift({
        userId: user.id,
        email: user.email,
        lastUsed: Date.now()
    });


    list = list.slice(0, 5);


    saveRecentAccounts(list);

}


function removeRecentAccount(userId) {

    let list = getRecentAccounts();

    list = list.filter(function(item) {
        return item.userId !== userId;
    });

    saveRecentAccounts(list);

    renderAuthMode();

}


/* =========================
   로그인 화면 모드 결정
   - 최근 로그인 있음 + forceShowAuthForm=false → 아바타만
   - 최근 로그인 없음 or forceShowAuthForm=true → 폼
========================= */

function renderAuthMode() {

    const recentOnlyView =
        document.getElementById("authRecentOnlyView");

    const formView =
        document.getElementById("authFormView");

    const list = getRecentAccounts();


    if (!recentOnlyView || !formView) return;


    const hasRecent = list.length > 0;

    const showRecentOnly = hasRecent && !forceShowAuthForm;


    if (showRecentOnly) {

        recentOnlyView.style.display = "block";
        formView.style.display = "none";

        renderRecentOnlyList(list);

    }
    else {

        recentOnlyView.style.display = "none";
        formView.style.display = "block";

    }

}


function renderRecentOnlyList(list) {

    const container =
        document.getElementById("authRecentOnlyList");

    if (!container) return;

    container.innerHTML = "";


    list.forEach(function(account) {

        const item = document.createElement("div");

        item.className = "auth-recent-only-item";


        const avatarBtn = document.createElement("button");

        avatarBtn.type = "button";

        avatarBtn.className = "auth-recent-only-avatar-btn";


        const avatarDataUrl =
            localStorage.getItem(
                "householdAvatar_" + account.userId
            );


        if (avatarDataUrl) {

            const img = document.createElement("img");

            img.className = "auth-recent-only-avatar-img";

            img.src = avatarDataUrl;

            img.alt = account.email;

            avatarBtn.appendChild(img);

        }

        else {

            const initial = document.createElement("span");

            initial.className = "auth-recent-only-avatar-initial";

            initial.innerText =
                (account.email[0] || "?").toUpperCase();

            avatarBtn.appendChild(initial);

        }


        const emailLabel = document.createElement("div");

        emailLabel.className = "auth-recent-only-email";

        emailLabel.innerText = account.email;


        /* 탭 → 비밀번호 모달 */

        avatarBtn.onclick = function() {
            openRecentPasswordModal(account);
        };


        /* 길게 누르기 → 삭제 */

        let pressTimer = null;

        item.addEventListener(
            "touchstart",
            function() {

                pressTimer = setTimeout(function() {

                    pressTimer = null;

                    removeRecentAccount(account.userId);

                }, 700);

            },
            { passive: true }
        );


        item.addEventListener(
            "touchend",
            function() {

                if (pressTimer) {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                }

            }
        );


        item.addEventListener(
            "touchmove",
            function() {

                if (pressTimer) {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                }

            },
            { passive: true }
        );


        /* 마우스(PC) 우클릭 삭제 */

        avatarBtn.addEventListener(
            "contextmenu",
            function(event) {

                event.preventDefault();

                removeRecentAccount(account.userId);

            }
        );


        item.appendChild(avatarBtn);

        item.appendChild(emailLabel);

        container.appendChild(item);

    });

}


/* 직접 입력 버튼 */

function showAuthFormView() {

    forceShowAuthForm = true;

    switchAuthMode("login");

    renderAuthMode();

}


/* =========================
   최근 로그인 비밀번호 모달
========================= */

function openRecentPasswordModal(account) {

    if (!account) return;


    const emailInput =
        document.getElementById("authEmailInput");

    const passwordInput =
        document.getElementById("authPasswordInput");


    if (emailInput) {
        emailInput.value = account.email;
    }

    if (passwordInput) {
        passwordInput.value = "";
    }


    setAuthFieldError("authEmailError", "");
    setAuthFieldError("authPasswordError", "");
    setAuthMessage("", "");


    appPrompt(
        account.email,
        "",
        {
            title: "비밀번호 입력",
            placeholder: "비밀번호",
            confirmText: "로그인",
            cancelText: "취소"
        }
    ).then(function(password) {

        if (password === null) return;

        if (!password || password.length < 6) {

            appAlert("비밀번호는 6자 이상이어야 해요.");

            return;

        }


        if (passwordInput) {
            passwordInput.value = password;
        }


        handleSignIn();

    });

}


/* =========================
   UI 업데이트
========================= */

function updateAccountUI() {

    const loggedOut =
        document.getElementById("accountLoggedOut");

    const loggedIn =
        document.getElementById("accountLoggedIn");

    const emailDisplay =
        document.getElementById("accountEmailDisplay");


    if (!loggedOut || !loggedIn) return;


    if (currentUser) {

        loggedOut.style.display = "none";
        loggedIn.style.display = "block";

        if (emailDisplay) {
            emailDisplay.innerText = currentUser.email;
        }

        renderProfileAvatar();
        renderAccountMonthSummary();

    }

    else {

        loggedOut.style.display = "block";
        loggedIn.style.display = "none";

        renderAuthMode();

    }

}


/* =========================
   프로필 사진 (Base64, localStorage)
========================= */

function getAvatarStorageKey() {

    return currentUser
        ? "householdAvatar_" + currentUser.id
        : "householdAvatar";

}


function renderProfileAvatar() {

    const img =
        document.getElementById("authProfileAvatarImg");

    const placeholder =
        document.getElementById("authProfileAvatarPlaceholder");


    if (!img || !placeholder) return;


    const dataUrl =
        localStorage.getItem(getAvatarStorageKey());


    if (dataUrl) {

        img.src = dataUrl;

        img.style.display = "block";

        placeholder.style.display = "none";

    }

    else {

        img.style.display = "none";

        img.removeAttribute("src");

        placeholder.style.display = "flex";

    }

}


function openAvatarPicker() {

    const input =
        document.getElementById("authAvatarFileInput");

    if (input) {

        input.value = "";

        input.click();

    }

}


function handleAvatarFileChange(event) {

    const file =
        event.target &&
        event.target.files &&
        event.target.files[0];


    if (!file) return;


    if (!file.type.startsWith("image/")) {

        appAlert("이미지 파일만 선택할 수 있어요.");

        return;

    }


    if (file.size > 10 * 1024 * 1024) {

        appAlert("10MB 이하의 이미지를 선택해주세요.");

        return;

    }


    const reader = new FileReader();


    reader.onload = function(e) {

        const rawDataUrl = e.target.result;

        resizeAvatarImage(
            rawDataUrl,
            200,
            function(resizedDataUrl) {

                if (!resizedDataUrl) {

                    appAlert("이미지를 처리하지 못했어요.");

                    return;

                }


                try {

                    localStorage.setItem(
                        getAvatarStorageKey(),
                        resizedDataUrl
                    );

                    renderProfileAvatar();

                }

                catch (error) {

                    console.error(error);

                    appAlert(
                        "이미지를 저장하지 못했어요. 더 작은 이미지를 사용해주세요."
                    );

                }

            }
        );

    };


    reader.onerror = function() {

        appAlert("이미지를 읽지 못했어요.");

    };


    reader.readAsDataURL(file);

}


function resizeAvatarImage(dataUrl, maxSize, callback) {

    const image = new Image();


    image.onload = function() {

        const canvas =
            document.createElement("canvas");


        let width = image.width;
        let height = image.height;


        if (width > height) {

            if (width > maxSize) {

                height = Math.round(
                    (height * maxSize) / width
                );

                width = maxSize;

            }

        }

        else {

            if (height > maxSize) {

                width = Math.round(
                    (width * maxSize) / height
                );

                height = maxSize;

            }

        }


        canvas.width = width;
        canvas.height = height;


        const ctx = canvas.getContext("2d");

        ctx.drawImage(image, 0, 0, width, height);


        try {

            const result =
                canvas.toDataURL("image/jpeg", 0.85);

            callback(result);

        }

        catch (error) {

            console.error(error);

            callback(null);

        }

    };


    image.onerror = function() {

        callback(null);

    };


    image.src = dataUrl;

}


/* =========================
   이번 달 요약
========================= */

function renderAccountMonthSummary() {

    const label =
        document.getElementById("authMonthSummaryMonth");

    const expenseElement =
        document.getElementById("authMonthExpense");

    const incomeElement =
        document.getElementById("authMonthIncome");

    const balanceElement =
        document.getElementById("authMonthBalance");

    const budgetWrap =
        document.getElementById("authMonthBudgetWrap");

    const budgetPercent =
        document.getElementById("authMonthBudgetPercent");

    const budgetFill =
        document.getElementById("authMonthBudgetFill");


    if (!expenseElement || !incomeElement || !balanceElement) {
        return;
    }


    const now = new Date();

    const year = now.getFullYear();

    const month = now.getMonth();


    const monthStart =
        `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const monthEnd =
        `${year}-${String(month + 1).padStart(2, "0")}-${String(
            new Date(year, month + 1, 0).getDate()
        ).padStart(2, "0")}`;


    if (label) {
        label.innerText = `${month + 1}월`;
    }


    let expenseTotal = 0;
    let incomeTotal = 0;


    (transactions || []).forEach(function(transaction) {

        if (
            transaction.date < monthStart ||
            transaction.date > monthEnd
        ) {
            return;
        }

        if (transaction.type === "expense") {
            expenseTotal += Number(transaction.amount) || 0;
        }
        else {
            incomeTotal += Number(transaction.amount) || 0;
        }

    });


    const balance = incomeTotal - expenseTotal;


    expenseElement.innerText =
        formatAnalysisAmount(expenseTotal) + "원";

    incomeElement.innerText =
        formatAnalysisAmount(incomeTotal) + "원";

    balanceElement.innerText =
        (balance < 0 ? "-" : "") +
        formatAnalysisAmount(Math.abs(balance)) + "원";

    balanceElement.classList.remove("expense", "income", "negative");

    if (balance < 0) {
        balanceElement.classList.add("expense");
    }
    else if (balance > 0) {
        balanceElement.classList.add("income");
    }


    /* 예산 사용률 */

    const budgets =
        (settings && settings.budgets) || {};


    const totalBudget =
        Object.values(budgets).reduce(
            function(sum, value) {
                return sum + (Number(value) || 0);
            },
            0
        );


    if (totalBudget > 0 && budgetWrap) {

        budgetWrap.style.display = "block";


        const percent =
            Math.min(
                100,
                Math.round((expenseTotal / totalBudget) * 100)
            );


        if (budgetPercent) {
            budgetPercent.innerText = percent + "%";
        }

        if (budgetFill) {

            budgetFill.style.width = percent + "%";

            budgetFill.classList.toggle(
                "over",
                expenseTotal > totalBudget
            );

        }

    }

    else if (budgetWrap) {

        budgetWrap.style.display = "none";

    }

}


/* =========================
   메시지 / 에러
========================= */

function setAuthMessage(text, type) {

    const message =
        document.getElementById("authMessage");

    if (!message) return;

    applyMessageStyle(message, text, type);

}


function setSignupMessage(text, type) {

    const message =
        document.getElementById("authSignupMessage");

    if (!message) return;

    applyMessageStyle(message, text, type);

}


function applyMessageStyle(element, text, type) {

    element.innerText = text || "";

    element.classList.remove("error", "success", "info");

    if (!text) return;

    if (type === "error") element.classList.add("error");
    else if (type === "success") element.classList.add("success");
    else element.classList.add("info");

}


function setAuthFieldError(fieldId, text) {

    const element =
        document.getElementById(fieldId);

    if (!element) return;

    element.innerText = text || "";

}


function setSyncStatus(text) {

    const accountStatus =
        document.getElementById("accountSyncStatus");

    if (accountStatus) {
        accountStatus.innerText = text || "";
    }


    const inputStatus =
        document.getElementById("syncStatus");

    if (!inputStatus) return;


    inputStatus.classList.remove("success", "warning", "error");


    if (!text) return;


    if (text === "동기화 완료") {

        inputStatus.classList.add("success");

        if (currentUser && currentScreen === "accountSettings") {
            renderAccountMonthSummary();
        }

        return;

    }


    if (
        text === "동기화 중..." ||
        text.includes("동기화 중")
    ) {
        inputStatus.classList.add("warning");
        return;
    }


    if (text.includes("실패") || text.includes("로그아웃")) {
        inputStatus.classList.add("error");
        return;
    }

}


/* =========================
   로그인 / 회원가입 화면 전환
========================= */

function switchAuthMode(mode) {

    if (mode !== "login" && mode !== "signup") return;

    currentAuthMode = mode;


    const loginView =
        document.getElementById("authLoginView");

    const signupView =
        document.getElementById("authSignupView");

    const pageTitle =
        document.getElementById("pageTitle");


    if (loginView) {
        loginView.style.display =
            mode === "login" ? "block" : "none";
    }

    if (signupView) {
        signupView.style.display =
            mode === "signup" ? "block" : "none";
    }

    if (pageTitle && currentScreen === "accountSettings") {
        pageTitle.innerText =
            mode === "login" ? "로그인" : "회원가입";
    }


    setAuthMessage("", "");
    setSignupMessage("", "");

    setAuthFieldError("authEmailError", "");
    setAuthFieldError("authPasswordError", "");
    setAuthFieldError("authSignupEmailError", "");
    setAuthFieldError("authSignupPasswordError", "");
    setAuthFieldError("authSignupPasswordConfirmError", "");


    resetPageScrollPosition();

}


function togglePasswordVisibility() {

    const input =
        document.getElementById("authPasswordInput");

    const btn =
        document.getElementById("authPasswordToggle");

    if (!input || !btn) return;

    const isPassword = input.type === "password";

    input.type = isPassword ? "text" : "password";

    btn.classList.toggle("visible", isPassword);

}


function toggleSignupPasswordVisibility() {

    const input =
        document.getElementById("authSignupPasswordInput");

    const btn =
        document.getElementById("authSignupPasswordToggle");

    if (!input || !btn) return;

    const isPassword = input.type === "password";

    input.type = isPassword ? "text" : "password";

    btn.classList.toggle("visible", isPassword);

}


/* =========================
   검증
========================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


function validateSignInInputs(email, password) {

    let valid = true;

    setAuthFieldError("authEmailError", "");
    setAuthFieldError("authPasswordError", "");


    if (!email) {

        setAuthFieldError("authEmailError", "이메일을 입력해주세요.");
        valid = false;

    }
    else if (!isValidEmail(email)) {

        setAuthFieldError("authEmailError", "올바른 이메일 형식이 아닙니다.");
        valid = false;

    }


    if (!password) {

        setAuthFieldError("authPasswordError", "비밀번호를 입력해주세요.");
        valid = false;

    }
    else if (password.length < 6) {

        setAuthFieldError("authPasswordError", "비밀번호는 6자 이상이어야 해요.");
        valid = false;

    }


    return valid;

}


function validateSignUpInputs(email, password, passwordConfirm) {

    let valid = true;

    setAuthFieldError("authSignupEmailError", "");
    setAuthFieldError("authSignupPasswordError", "");
    setAuthFieldError("authSignupPasswordConfirmError", "");


    if (!email) {

        setAuthFieldError("authSignupEmailError", "이메일을 입력해주세요.");
        valid = false;

    }
    else if (!isValidEmail(email)) {

        setAuthFieldError("authSignupEmailError", "올바른 이메일 형식이 아닙니다.");
        valid = false;

    }


    if (!password) {

        setAuthFieldError("authSignupPasswordError", "비밀번호를 입력해주세요.");
        valid = false;

    }
    else if (password.length < 6) {

        setAuthFieldError("authSignupPasswordError", "비밀번호는 6자 이상이어야 해요.");
        valid = false;

    }


    if (!passwordConfirm) {

        setAuthFieldError("authSignupPasswordConfirmError", "비밀번호를 다시 입력해주세요.");
        valid = false;

    }
    else if (password !== passwordConfirm) {

        setAuthFieldError("authSignupPasswordConfirmError", "비밀번호가 일치하지 않습니다.");
        valid = false;

    }


    return valid;

}


/* =========================
   인증 리스너
========================= */

function registerAuthListener() {

    if (!supabaseClient || authListenerRegistered) {
        return;
    }

    authListenerRegistered = true;

    supabaseClient.auth.onAuthStateChange(
        function(event, session) {

            if (
                event === "TOKEN_REFRESHED" ||
                event === "SIGNED_IN" ||
                event === "INITIAL_SESSION"
            ) {

                if (session && session.user) {

                    currentUser = {
                        id: session.user.id,
                        email: session.user.email
                    };

                    updateAccountUI();

                    setSyncStatus("동기화 완료");

                }

                return;

            }


            if (event === "SIGNED_OUT") {

                if (isSigningOut) return;

                attemptAutoRecoverSession();

            }

        }
    );

}


async function attemptAutoRecoverSession() {

    if (!supabaseClient) return;


    const { data, error } =
        await supabaseClient.auth.refreshSession();


    if (
        error ||
        !data ||
        !data.session ||
        !data.session.user
    ) {

        currentUser = null;

        updateAccountUI();

        setSyncStatus("로그아웃됨");


        if (currentScreen !== "accountSettings") {
            showScreen("accountSettings");
        }

        return;

    }


    currentUser = {
        id: data.session.user.id,
        email: data.session.user.email
    };

    updateAccountUI();

    setSyncStatus("동기화 완료");

    await loadUserDataFromSupabase();

}


async function checkExistingSession() {

    if (!supabaseClient) return;


    try {

        const { data, error } =
            await supabaseClient.auth.getSession();


        if (!error && data && data.session && data.session.user) {

            currentUser = {
                id: data.session.user.id,
                email: data.session.user.email
            };

            updateAccountUI();

            await loadUserDataFromSupabase();

            return;

        }


        const { data: refreshData, error: refreshError } =
            await supabaseClient.auth.refreshSession();


        if (
            !refreshError &&
            refreshData &&
            refreshData.session &&
            refreshData.session.user
        ) {

            currentUser = {
                id: refreshData.session.user.id,
                email: refreshData.session.user.email
            };

            updateAccountUI();

            await loadUserDataFromSupabase();

            return;

        }

    }

    catch (error) {

        console.error("세션 확인 중 오류:", error);

    }

}


/* =========================
   회원가입
========================= */

async function handleSignUp() {

    if (!supabaseClient) {

        setSignupMessage(
            "Supabase 연결 정보가 설정되지 않았습니다.",
            "error"
        );

        return;

    }


    const emailInput =
        document.getElementById("authSignupEmailInput");

    const passwordInput =
        document.getElementById("authSignupPasswordInput");

    const confirmInput =
        document.getElementById("authSignupPasswordConfirmInput");


    const email =
        emailInput ? emailInput.value.trim() : "";

    const password =
        passwordInput ? passwordInput.value : "";

    const passwordConfirm =
        confirmInput ? confirmInput.value : "";


    if (!validateSignUpInputs(email, password, passwordConfirm)) {
        return;
    }


    setSignupMessage("처리 중...", "info");


    const submitBtn =
        document.getElementById("authSignupSubmitBtn");

    if (submitBtn) submitBtn.disabled = true;


    try {

        const { data, error } =
            await supabaseClient.auth.signUp({
                email,
                password
            });


        if (error) {

            setSignupMessage(error.message, "error");

            return;

        }


        if (data && data.session && data.user) {

            currentUser = {
                id: data.user.id,
                email: data.user.email
            };

            addRecentAccount(currentUser);

            setSignupMessage("", "");

            updateAccountUI();


            await pushLocalDataToSupabase();

            await loadUserDataFromSupabase();


            showScreen("input");

        }

        else {

            setSignupMessage(
                "가입 확인 메일을 확인해주세요.",
                "success"
            );

        }

    }

    catch (error) {

        setSignupMessage(
            error.message || "오류가 발생했습니다.",
            "error"
        );

    }

    finally {

        if (submitBtn) submitBtn.disabled = false;

    }

}


/* =========================
   로그인
========================= */

async function handleSignIn() {

    if (!supabaseClient) {

        setAuthMessage(
            "Supabase 연결 정보가 설정되지 않았습니다.",
            "error"
        );

        return;

    }


    const emailInput =
        document.getElementById("authEmailInput");

    const passwordInput =
        document.getElementById("authPasswordInput");


    const email =
        emailInput ? emailInput.value.trim() : "";

    const password =
        passwordInput ? passwordInput.value : "";


    if (!validateSignInInputs(email, password)) return;


    const submitBtn =
        document.getElementById("authSubmitBtn");

    if (submitBtn) submitBtn.disabled = true;


    try {

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });


        if (error) {

            /* 최근 로그인 모달에서 실패한 경우 */

            if (forceShowAuthForm === false) {

                appAlert(
                    "로그인 실패: " + error.message
                );

            }
            else {

                setAuthMessage(error.message, "error");

            }

            return;

        }


        currentUser = {
            id: data.user.id,
            email: data.user.email
        };

        addRecentAccount(currentUser);

        setAuthMessage("", "");

        updateAccountUI();


        await loadUserDataFromSupabase();


        forceShowAuthForm = false;

        showScreen("input");

    }

    catch (error) {

        if (forceShowAuthForm === false) {

            appAlert(
                "로그인 실패: " +
                (error.message || "오류가 발생했습니다.")
            );

        }
        else {

            setAuthMessage(
                error.message || "오류가 발생했습니다.",
                "error"
            );

        }

    }

    finally {

        if (submitBtn) submitBtn.disabled = false;

    }

}


/* =========================
   로그아웃
========================= */

function confirmSignOut() {

    appConfirm(
        "로그아웃하시겠어요?\n\n서버에 저장된 데이터는 안전하게 보관됩니다.\n이 기기의 임시 데이터만 정리됩니다.",
        {
            title: "로그아웃",
            confirmText: "로그아웃",
            cancelText: "취소",
            danger: true
        }
    ).then(function(confirmed) {

        if (!confirmed) return;

        handleSignOut();

    });

}


async function handleSignOut() {

    isSigningOut = true;


    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }


    currentUser = null;


    if (syncUserDataTimer) {

        clearTimeout(syncUserDataTimer);

        syncUserDataTimer = null;

    }


    /* 로컬 상태 초기화 */

    transactions = [];

    settings = getDefaultSettings();
    categories = getDefaultCategories();
    paymentMethods = getDefaultPaymentMethods();
    subjects = getDefaultSubjects();


    localStorage.removeItem("householdTransactions");
    localStorage.removeItem("householdSettings");
    localStorage.removeItem("householdCategories");
    localStorage.removeItem("householdPaymentMethods");
    localStorage.removeItem("householdSubjects");
    localStorage.removeItem("householdLastSync");


    /* 최근 로그인 계정과 프로필 사진은 유지 */


    selectedCategory = "";
    selectedPayment = "";
    selectedSubject = "";

    analysisSelectedCategory = "";
    analysisSelectedPayment = "";
    analysisSelectedSubject = "";

    historySearchKeyword = "";

    if (typeof monthlyChartSelectedCategory !== "undefined") {
        monthlyChartSelectedCategory = "";
    }


    updateSettingsUI();

    renderCategoryButtons();
    renderSubjectButtons();
    renderPaymentButtons();

    renderCategoryManagement();
    renderPaymentManagement();
    renderSubjectManagement();

    renderCalendar();
    renderSelectedDate();


    setAuthMessage("", "");
    setSignupMessage("", "");

    setSyncStatus("");


    /* 로그아웃 후에는 폼이 아닌 아바타 뷰 우선 */

    forceShowAuthForm = false;


    updateAccountUI();


    switchAuthMode("login");

    showScreen("accountSettings");


    setTimeout(
        function() {
            isSigningOut = false;
        },
        5000
    );

}


/* =========================
   Enter 키 / 입력 이벤트
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const emailInput =
            document.getElementById("authEmailInput");

        const passwordInput =
            document.getElementById("authPasswordInput");

        const signupEmailInput =
            document.getElementById("authSignupEmailInput");

        const signupPasswordInput =
            document.getElementById("authSignupPasswordInput");

        const signupConfirmInput =
            document.getElementById("authSignupPasswordConfirmInput");


        if (emailInput) {

            emailInput.addEventListener(
                "keydown",
                function(event) {

                    if (event.key === "Enter") {

                        event.preventDefault();

                        if (passwordInput) passwordInput.focus();

                    }

                }
            );

            emailInput.addEventListener(
                "input",
                function() {
                    setAuthFieldError("authEmailError", "");
                }
            );

        }


        if (passwordInput) {

            passwordInput.addEventListener(
                "keydown",
                function(event) {

                    if (event.key === "Enter") {

                        event.preventDefault();

                        handleSignIn();

                    }

                }
            );

            passwordInput.addEventListener(
                "input",
                function() {
                    setAuthFieldError("authPasswordError", "");
                }
            );

        }


        if (signupEmailInput) {

            signupEmailInput.addEventListener(
                "keydown",
                function(event) {

                    if (event.key === "Enter") {

                        event.preventDefault();

                        if (signupPasswordInput) signupPasswordInput.focus();

                    }

                }
            );

            signupEmailInput.addEventListener(
                "input",
                function() {
                    setAuthFieldError("authSignupEmailError", "");
                }
            );

        }


        if (signupPasswordInput) {

            signupPasswordInput.addEventListener(
                "keydown",
                function(event) {

                    if (event.key === "Enter") {

                        event.preventDefault();

                        if (signupConfirmInput) signupConfirmInput.focus();

                    }

                }
            );

            signupPasswordInput.addEventListener(
                "input",
                function() {
                    setAuthFieldError("authSignupPasswordError", "");
                }
            );

        }


        if (signupConfirmInput) {

            signupConfirmInput.addEventListener(
                "keydown",
                function(event) {

                    if (event.key === "Enter") {

                        event.preventDefault();

                        handleSignUp();

                    }

                }
            );

            signupConfirmInput.addEventListener(
                "input",
                function() {
                    setAuthFieldError("authSignupPasswordConfirmError", "");
                }
            );

        }

    }
);