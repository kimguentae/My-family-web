/* =========================
   05. 오프라인 감지 및 자동 동기화
========================= */

var offlineBanner = null;

var pendingSyncWhenOnline = false;


function showOfflineBanner() {

    if (offlineBanner) return;


    document.body.classList.add("offline");


    offlineBanner =
        document.createElement("div");

    offlineBanner.id = "offlineBanner";

    offlineBanner.textContent =
        "오프라인 상태입니다 · 입력한 내용은 연결되면 자동 저장됩니다";

    offlineBanner.style.cssText = `
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        max-width: 600px;
        background: #f0a93a;
        color: white;
        text-align: center;
        font-size: 12px;
        font-weight: 600;
        padding: 6px 10px;
        z-index: 9999;
        box-sizing: border-box;
    `;


    document.body.appendChild(offlineBanner);

}


function hideOfflineBanner() {

    document.body.classList.remove("offline");


    if (offlineBanner) {

        offlineBanner.remove();

        offlineBanner = null;

    }

}


async function flushPendingSync() {

    if (!currentUser || !supabaseClient) return;


    setSyncStatus("동기화 중...");


    try {

        /* 로컬 데이터를 서버로 push (서버에서 load하지 않음!) */

        await pushLocalDataToSupabase();

        await pushAllTransactionsToSupabase();


        setSyncStatus("동기화 완료");

    }

    catch (error) {

        console.error(
            "오프라인 복귀 동기화 실패:",
            error
        );

        setSyncStatus("동기화 실패");

    }

}


function updateOnlineStatus() {

    if (navigator.onLine) {

        hideOfflineBanner();


        if (
            pendingSyncWhenOnline &&
            currentUser &&
            supabaseClient
        ) {

            pendingSyncWhenOnline = false;

            flushPendingSync();

        }

    }

    else {

        showOfflineBanner();

        pendingSyncWhenOnline = true;

    }

}


window.addEventListener(
    "online",
    updateOnlineStatus
);

window.addEventListener(
    "offline",
    updateOnlineStatus
);


/* 앱이 다시 활성화될 때 세션 재확인 */

document.addEventListener(
    "visibilitychange",
    function() {

        if (document.visibilityState === "visible") {

            if (supabaseClient && !currentUser) {
                checkExistingSession();
            }

        }

    }
);


window.addEventListener(
    "online",
    function() {

        if (supabaseClient && !currentUser) {
            checkExistingSession();
        }

    }
);