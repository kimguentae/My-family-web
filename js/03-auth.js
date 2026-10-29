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


        avatarBtn.onclick = function() {
            openRecentPasswordModal(account);
        };


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
   계정 리포트 (무지출 챌린지)
========================= */

function renderAccountMonthSummary() {

    renderNoSpendChallenge();

}


function renderNoSpendChallenge() {

    const totalEl =
        document.getElementById("noSpendTotalDays");

    const streakEl =
        document.getElementById("noSpendStreak");

    const bestEl =
        document.getElementById("noSpendBest");

    const todayStatusEl =
        document.getElementById("noSpendTodayStatus");

    const startDateTextEl =
        document.getElementById("noSpendStartDateText");


    if (!totalEl) return;


    const startDate =
        settings.noSpendStartDate ||
        getDefaultSettings().noSpendStartDate;


    if (startDateTextEl) {

        startDateTextEl.innerText = startDate;

    }


    const expenseDates = new Set();

    (transactions || []).forEach(function(t) {

        if (t.type === "expense" && t.date) {
            expenseDates.add(t.date);
        }

    });


    const today = new Date();

    const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 1
    );


    const pad = function(n) { return String(n).padStart(2, "0"); };

    const toDateStr = function(d) {
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };


    const todayStr = toDateStr(today);


    function isNoSpendDay(dateStr) {
        return !expenseDates.has(dateStr);
    }


    const startDateObj =
        new Date(startDate + "T00:00:00");

    const todayObj =
        new Date(todayStr + "T00:00:00");


    if (startDateObj > todayObj) {

        totalEl.innerText = "0일";
        streakEl.innerText = "0일";
        bestEl.innerText = "0일";

        if (todayStatusEl) {
            todayStatusEl.innerText = "아직 시작 전";
            todayStatusEl.className = "no-spend-today";
        }

        return;

    }


    /* 총 무지출: 시작일 ~ 어제 */

    let totalNoSpend = 0;

    const cursor = new Date(startDateObj);

    while (cursor <= yesterday) {

        if (isNoSpendDay(toDateStr(cursor))) {
            totalNoSpend += 1;
        }

        cursor.setDate(cursor.getDate() + 1);

    }

    totalEl.innerText = totalNoSpend + "일";


    /* 현재 연속: 어제부터 거꾸로 */

    let streak = 0;

    const streakCursor = new Date(yesterday);

    while (streakCursor >= startDateObj) {

        if (isNoSpendDay(toDateStr(streakCursor))) {
            streak += 1;
            streakCursor.setDate(streakCursor.getDate() - 1);
        }
        else {
            break;
        }

    }


    if (expenseDates.has(todayStr)) {
        streak = 0;
    }

    streakEl.innerText = streak + "일";


    /* 최고 기록: 시작일 ~ 어제 최장 연속 (+ 오늘 무지출이면 현재 포함) */

    let bestStreak = 0;
    let currentRun = 0;

    const bestCursor = new Date(startDateObj);

    while (bestCursor <= yesterday) {

        if (isNoSpendDay(toDateStr(bestCursor))) {

            currentRun += 1;

            if (currentRun > bestStreak) {
                bestStreak = currentRun;
            }

        }
        else {
            currentRun = 0;
        }

        bestCursor.setDate(bestCursor.getDate() + 1);

    }


    if (!expenseDates.has(todayStr)) {

        const todayRun = streak + 1;

        if (todayRun > bestStreak) {
            bestStreak = todayRun;
        }

    }

    bestEl.innerText = bestStreak + "일";


    /* 오늘 상태 */

    if (todayStatusEl) {

        if (expenseDates.has(todayStr)) {

            todayStatusEl.innerText = "오늘 지출이 있어요";
            todayStatusEl.className = "no-spend-today no-spend-today-done";

        }
        else {

            todayStatusEl.innerText = "오늘 무지출 도전 중!";
            todayStatusEl.className = "no-spend-today no-spend-today-active";

        }

    }

}


function openNoSpendStartDatePicker() {

    const currentDate =
        settings.noSpendStartDate ||
        getDefaultSettings().noSpendStartDate;


    openDatepickerSingle(
        currentDate,
        function(newDate) {

            settings.noSpendStartDate = newDate;

            saveSettings();

            renderNoSpendChallenge();

        },
        {
            anchorId: "noSpendStartDateText"
        }
    );

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
        "서버에 저장된 데이터는 안전하게 보관됩니다.\n이 기기의 임시 데이터만 정리됩니다.",
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