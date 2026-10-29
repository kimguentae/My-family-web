/* =========================
   03. 인증 (로그인/회원가입/세션)
========================= */

/* 현재 로그인/회원가입 모드 */

var currentAuthMode = "login";


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

        updateAccountProfileInfo();

    }

    else {

        loggedOut.style.display = "block";
        loggedIn.style.display = "none";

    }

}


function updateAccountProfileInfo() {

    const lastSyncElement =
        document.getElementById("accountLastSync");

    const countElement =
        document.getElementById("accountTransactionCount");


    if (lastSyncElement) {

        const lastSync =
            localStorage.getItem(
                "householdLastSync"
            );

        if (lastSync) {

            const diff =
                Math.floor(
                    (Date.now() - Number(lastSync)) / 1000
                );

            if (diff < 60) {
                lastSyncElement.innerText = "방금 전";
            }
            else if (diff < 3600) {
                lastSyncElement.innerText =
                    Math.floor(diff / 60) + "분 전";
            }
            else if (diff < 86400) {
                lastSyncElement.innerText =
                    Math.floor(diff / 3600) + "시간 전";
            }
            else {
                lastSyncElement.innerText =
                    Math.floor(diff / 86400) + "일 전";
            }

        }
        else {
            lastSyncElement.innerText = "-";
        }

    }


    if (countElement) {

        countElement.innerText =
            (transactions ? transactions.length : 0) + "건";

    }

}


function setAuthMessage(text, type) {

    const message =
        document.getElementById("authMessage");

    if (!message) return;


    message.innerText = text || "";

    message.classList.remove(
        "error",
        "success",
        "info"
    );


    if (!text) return;


    if (type === "error") {
        message.classList.add("error");
    }
    else if (type === "success") {
        message.classList.add("success");
    }
    else {
        message.classList.add("info");
    }

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


    inputStatus.classList.remove(
        "success",
        "warning",
        "error"
    );


    if (!text) return;


    if (text === "동기화 완료") {

        inputStatus.classList.add("success");

        localStorage.setItem(
            "householdLastSync",
            String(Date.now())
        );

        updateAccountProfileInfo();

        return;

    }


    if (
        text === "동기화 중..." ||
        text.includes("동기화 중")
    ) {
        inputStatus.classList.add("warning");
        return;
    }


    if (
        text.includes("실패") ||
        text.includes("로그아웃")
    ) {
        inputStatus.classList.add("error");
        return;
    }

}


/* =========================
   로그인/회원가입 탭 전환
========================= */

function switchAuthMode(mode) {

    if (mode !== "login" && mode !== "signup") return;


    currentAuthMode = mode;


    const loginTab =
        document.getElementById("authTabLogin");

    const signupTab =
        document.getElementById("authTabSignup");

    const submitBtn =
        document.getElementById("authSubmitBtn");

    const passwordInput =
        document.getElementById("authPasswordInput");

    const hint =
        document.getElementById("authModeHint");


    if (loginTab) {
        loginTab.classList.toggle(
            "active",
            mode === "login"
        );
    }

    if (signupTab) {
        signupTab.classList.toggle(
            "active",
            mode === "signup"
        );
    }

    if (submitBtn) {
        submitBtn.innerText =
            mode === "login" ? "로그인" : "회원가입";
    }

    if (passwordInput) {
        passwordInput.autocomplete =
            mode === "login"
                ? "current-password"
                : "new-password";
    }

    if (hint) {
        hint.innerHTML =
            mode === "login"
                ? `계정이 없으신가요? <button type="button" class="auth-mode-hint-btn" onclick="switchAuthMode('signup')">회원가입</button>`
                : `이미 계정이 있으신가요? <button type="button" class="auth-mode-hint-btn" onclick="switchAuthMode('login')">로그인</button>`;
    }


    setAuthMessage("");

    setAuthFieldError("authEmailError", "");
    setAuthFieldError("authPasswordError", "");

}


/* =========================
   비밀번호 표시/숨김
========================= */

function togglePasswordVisibility() {

    const input =
        document.getElementById("authPasswordInput");

    const btn =
        document.getElementById("authPasswordToggle");


    if (!input || !btn) return;


    const isPassword =
        input.type === "password";


    input.type =
        isPassword ? "text" : "password";


    btn.setAttribute(
        "aria-label",
        isPassword ? "비밀번호 숨김" : "비밀번호 표시"
    );


    btn.classList.toggle(
        "visible",
        isPassword
    );

}


/* =========================
   입력 검증
========================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


function validateAuthInputs(email, password) {

    let valid = true;


    setAuthFieldError("authEmailError", "");
    setAuthFieldError("authPasswordError", "");


    if (!email) {

        setAuthFieldError(
            "authEmailError",
            "이메일을 입력해주세요."
        );

        valid = false;

    }
    else if (!isValidEmail(email)) {

        setAuthFieldError(
            "authEmailError",
            "올바른 이메일 형식이 아닙니다."
        );

        valid = false;

    }


    if (!password) {

        setAuthFieldError(
            "authPasswordError",
            "비밀번호를 입력해주세요."
        );

        valid = false;

    }
    else if (password.length < 6) {

        setAuthFieldError(
            "authPasswordError",
            "비밀번호는 6자 이상이어야 해요."
        );

        valid = false;

    }


    return valid;

}


/* =========================
   제출 (로그인 or 회원가입)
========================= */

async function handleAuthSubmit() {

    if (currentAuthMode === "login") {
        await handleSignIn();
    }
    else {
        await handleSignUp();
    }

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


        if (
            !error &&
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

        console.error(
            "세션 확인 중 오류:",
            error
        );

    }

}


/* =========================
   회원가입
========================= */

async function handleSignUp() {

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


    if (!validateAuthInputs(email, password)) return;


    setAuthMessage("처리 중...", "info");


    const submitBtn =
        document.getElementById("authSubmitBtn");

    if (submitBtn) submitBtn.disabled = true;


    try {

        const { data, error } =
            await supabaseClient.auth.signUp({
                email,
                password
            });


        if (error) {

            setAuthMessage(error.message, "error");

            return;

        }


        if (data && data.session && data.user) {

            currentUser = {
                id: data.user.id,
                email: data.user.email
            };

            setAuthMessage("", "");

            updateAccountUI();


            await pushLocalDataToSupabase();

            await loadUserDataFromSupabase();


            showScreen("input");

        }

        else {

            setAuthMessage(
                "가입 확인 메일을 확인해주세요.",
                "success"
            );

        }

    }

    catch (error) {

        setAuthMessage(
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


    if (!validateAuthInputs(email, password)) return;


    setAuthMessage("로그인 중...", "info");


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

            setAuthMessage(error.message, "error");

            return;

        }


        currentUser = {
            id: data.user.id,
            email: data.user.email
        };


        setAuthMessage("", "");

        updateAccountUI();


        await loadUserDataFromSupabase();


        showScreen("input");

    }

    catch (error) {

        setAuthMessage(
            error.message || "오류가 발생했습니다.",
            "error"
        );

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
        "로그아웃하시겠어요?\n\n이 기기의 로컬 데이터가 초기화됩니다.",
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


    /* 선택 상태 초기화 */

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


    /* UI 재렌더 */

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

    setSyncStatus("");


    updateAccountUI();


    showScreen("accountSettings");


    setTimeout(
        function() {
            isSigningOut = false;
        },
        5000
    );

}


/* =========================
   Enter 키 제출
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const emailInput =
            document.getElementById("authEmailInput");

        const passwordInput =
            document.getElementById("authPasswordInput");


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

        }


        if (passwordInput) {

            passwordInput.addEventListener(
                "keydown",
                function(event) {

                    if (event.key === "Enter") {

                        event.preventDefault();

                        handleAuthSubmit();

                    }

                }
            );

        }


        /* 입력 시 에러 메시지 자동 제거 */

        if (emailInput) {

            emailInput.addEventListener(
                "input",
                function() {
                    setAuthFieldError("authEmailError", "");
                }
            );

        }


        if (passwordInput) {

            passwordInput.addEventListener(
                "input",
                function() {
                    setAuthFieldError("authPasswordError", "");
                }
            );

        }

    }
);