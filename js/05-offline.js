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


function updateOnlineStatus() {

    if (navigator.onLine) {

        hideOfflineBanner();


        if (
            pendingSyncWhenOnline &&
            currentUser &&
            supabaseClient
        ) {

            pendingSyncWhenOnline = false;

            loadUserDataFromSupabase();

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