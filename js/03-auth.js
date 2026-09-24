/* =========================
   03. 인증 (로그인/회원가입/세션)
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

    }

    else {

        loggedOut.style.display = "block";
        loggedIn.style.display = "none";

    }

}


function setAuthMessage(text) {

    const message =
        document.getElementById("authMessage");

    if (message) {
        message.innerText = text || "";
    }

}


function setSyncStatus(text) {

    const accountStatus =
        document.getElementById("accountSyncStatus");

    if (accountStatus) {
        accountStatus.innerText = text || "";
    }


    const inputStatus =
        document.getElementById("syncStatus");

    if (inputStatus) {

        inputStatus.classList.remove(
            "success",
            "warning",
            "error"
        );


        if (text === "동기화 완료") {
            inputStatus.classList.add("success");
        }
        else if (text === "동기화 중...") {
            inputStatus.classList.add("warning");
        }
        else if (text && text.includes("동기화 실패")) {
            inputStatus.classList.add("error");
        }
        else if (text && text.includes("로그아웃")) {
            inputStatus.classList.add("error");
        }

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


    /* 1차: 현재 저장된 세션 확인 */

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


    /* 2차: refresh token으로 재시도 */

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


async function handleSignUp() {

    if (!supabaseClient) {

        setAuthMessage(
            "Supabase 연결 정보가 설정되지 않았습니다."
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


    setAuthMessage("처리 중...");


    const { data, error } =
        await supabaseClient.auth.signUp({
            email,
            password
        });


    if (error) {

        setAuthMessage(error.message);

        return;

    }


    if (data && data.session && data.user) {

        currentUser = {
            id: data.user.id,
            email: data.user.email
        };

        setAuthMessage("");

        updateAccountUI();


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
        document.getElementById("authEmailInput");

    const passwordInput =
        document.getElementById("authPasswordInput");


    const email =
        emailInput ? emailInput.value.trim() : "";

    const password =
        passwordInput ? passwordInput.value : "";


    if (!email || !password) {

        setAuthMessage(
            "이메일과 비밀번호를 입력해주세요."
        );

        return;

    }


    setAuthMessage("로그인 중...");


    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });


    if (error) {

        setAuthMessage(error.message);

        return;

    }


    currentUser = {
        id: data.user.id,
        email: data.user.email
    };


    setAuthMessage("");

    updateAccountUI();


    await loadUserDataFromSupabase();

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


    setAuthMessage("");

    setSyncStatus("");


    updateAccountUI();


    setTimeout(
        function() {
            isSigningOut = false;
        },
        5000
    );

}