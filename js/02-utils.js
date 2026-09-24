/* =========================
   02. 공용 유틸 (모달, 날짜, 포맷, 스크롤)
========================= */

/* =========================
   공용 모달
========================= */

let modalResolver = null;


function getModalElements() {

    return {

        overlay:
            document.getElementById(
                "appModalOverlay"
            ),

        title:
            document.getElementById(
                "modalTitle"
            ),

        message:
            document.getElementById(
                "modalMessage"
            ),

        inputWrap:
            document.getElementById(
                "modalInputWrap"
            ),

        input:
            document.getElementById(
                "modalInput"
            ),

        cancelBtn:
            document.getElementById(
                "modalCancelBtn"
            ),

        confirmBtn:
            document.getElementById(
                "modalConfirmBtn"
            )

    };

}


function closeAppModal(result) {

    const els =
        getModalElements();

    if (!els.overlay) return;


    els.overlay.classList.remove(
        "active"
    );


    if (modalResolver) {

        const resolve =
            modalResolver;

        modalResolver = null;

        resolve(result);

    }

}


function openAppModal(options) {

    options = options || {};


    return new Promise(
        function(resolve) {

            const els =
                getModalElements();


            if (!els.overlay) {

                resolve(
                    options.showInput
                        ? null
                        : (
                              options.showCancel
                                  ? false
                                  : undefined
                          )
                );

                return;

            }


            modalResolver =
                resolve;


            els.title.textContent =
                options.title || "";

            els.title.classList.toggle(
                "has-content",
                !!options.title
            );


            els.message.textContent =
                options.message || "";

            els.message.classList.toggle(
                "has-content",
                !!options.message
            );


            if (options.showInput) {

                els.inputWrap.classList.add(
                    "active"
                );

                els.input.value =
                    options.inputValue ||
                    "";

                els.input.placeholder =
                    options.placeholder ||
                    "";

                els.input.dataset.formatAmount =
                    options.formatAmount
                        ? "1"
                        : "";

                els.input.inputMode =
                    options.formatAmount
                        ? "numeric"
                        : "text";

            }

            else {

                els.inputWrap.classList.remove(
                    "active"
                );

                els.input.dataset.formatAmount =
                    "";

            }


            els.cancelBtn.style.display =
                options.showCancel ===
                false
                    ? "none"
                    : "block";

            els.cancelBtn.textContent =
                options.cancelText ||
                "취소";

            els.confirmBtn.textContent =
                options.confirmText ||
                "확인";

            els.confirmBtn.classList.toggle(
                "danger",
                !!options.danger
            );


            els.overlay.classList.add(
                "active"
            );


            if (options.showInput) {

                setTimeout(
                    function() {

                        els.input.focus();

                        const length =
                            els.input.value.length;

                        try {

                            els.input.setSelectionRange(
                                length,
                                length
                            );

                        }

                        catch (error) {}

                    },
                    50
                );

            }

        }
    );

}


function appAlert(message, options) {

    options = options || {};

    return openAppModal({

        message: message,

        title: options.title || "",

        showCancel: false,

        confirmText:
            options.confirmText ||
            "확인"

    }).then(function() {

        return undefined;

    });

}


function appConfirm(message, options) {

    options = options || {};

    return openAppModal({

        message: message,

        title: options.title || "",

        showCancel: true,

        confirmText:
            options.confirmText ||
            "확인",

        cancelText:
            options.cancelText ||
            "취소",

        danger: options.danger

    });

}


function appPrompt(
    message,
    defaultValue,
    options
) {

    options = options || {};

    return openAppModal({

        message: message,

        title: options.title || "",

        showCancel: true,

        showInput: true,

        inputValue:
            defaultValue || "",

        placeholder:
            options.placeholder ||
            "",

        formatAmount:
            options.formatAmount,

        confirmText:
            options.confirmText ||
            "확인",

        cancelText:
            options.cancelText ||
            "취소"

    }).then(function(confirmed) {

        if (!confirmed) {

            return null;

        }


        const els =
            getModalElements();

        return els.input
            ? els.input.value
            : "";

    });

}


/* 모달 초기 이벤트 등록 */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const els =
            getModalElements();

        if (!els.overlay) return;


        els.confirmBtn.addEventListener(
            "click",
            function() {

                closeAppModal(true);

            }
        );


        els.cancelBtn.addEventListener(
            "click",
            function() {

                closeAppModal(false);

            }
        );


        els.overlay.addEventListener(
            "click",
            function(event) {

                if (
                    event.target ===
                    els.overlay
                ) {

                    closeAppModal(false);

                }

            }
        );


        els.input.addEventListener(
            "input",
            function() {

                if (
                    els.input.dataset
                        .formatAmount ===
                    "1"
                ) {

                    const digits =
                        els.input.value.replace(
                            /[^0-9]/g,
                            ""
                        );

                    els.input.value =
                        digits
                            ? Number(
                                  digits
                              ).toLocaleString(
                                  "ko-KR"
                              )
                            : "";

                }

            }
        );


        els.input.addEventListener(
            "keydown",
            function(event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    closeAppModal(true);

                }

            }
        );

    }
);



/* =========================
   날짜 유틸
========================= */

function getTodayString() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function formatDateKorean(dateString) {

    const date = new Date(
        dateString + "T00:00:00"
    );

    const weekdays = [
        "일",
        "월",
        "화",
        "수",
        "목",
        "금",
        "토"
    ];

    return `${date.getFullYear()}년 ${
        date.getMonth() + 1
    }월 ${
        date.getDate()
    }일 (${weekdays[date.getDay()]})`;

}


function formatCompactAmount(amount) {

    if (amount >= 100000000) {

        return (
            (amount / 100000000)
                .toFixed(1)
                .replace(".0", "")
            + "억"
        );

    }


    if (amount >= 10000) {

        return (
            (amount / 10000)
                .toFixed(1)
                .replace(".0", "")
            + "만"
        );

    }


    return amount.toLocaleString(
        "ko-KR"
    );

}


function formatAnalysisAmount(amount) {

    return Number(amount || 0).toLocaleString("ko-KR");
}



/* =========================
   키보드 관련 스크롤 보정
========================= */

function resetPageScrollPosition() {

    window.scrollTo(0, 0);

    document.documentElement.scrollTop = 0;

    document.body.scrollTop = 0;

}


function findScrollableAncestor(element) {

    let node =
        element.parentElement;


    while (
        node &&
        node !== document.body
    ) {

        const style =
            window.getComputedStyle(node);


        if (
            style.overflowY === "auto" ||
            style.overflowY === "scroll"
        ) {

            return node;

        }


        node =
            node.parentElement;

    }


    return null;

}


function scrollFocusedInputIntoView(target) {

    if (!target) return;


    const scrollableParent =
        findScrollableAncestor(target);


    const viewportHeight =
        window.visualViewport
            ? window.visualViewport.height
            : window.innerHeight;


    const rect =
        target.getBoundingClientRect();


    const buffer = 16;

    const overflow =
        rect.bottom -
        (viewportHeight - buffer);


    if (overflow <= 0) return;


    if (scrollableParent) {

        scrollableParent.scrollBy(
            {
                top: overflow,
                behavior: "smooth"
            }
        );

    }

    else {

        target.scrollIntoView(
            {
                block: "center",
                behavior: "smooth"
            }
        );

    }

}


document.addEventListener(
    "focusin",
    function(event) {

        const target = event.target;


        if (
            !target ||
            (
                target.tagName !== "INPUT" &&
                target.tagName !== "TEXTAREA"
            )
        ) {
            return;
        }


        setTimeout(
            function() {

                scrollFocusedInputIntoView(
                    target
                );

            },
            300
        );

    }
);


document.addEventListener(
    "focusout",
    function(event) {

        const target = event.target;


        if (
            !target ||
            (
                target.tagName !== "INPUT" &&
                target.tagName !== "TEXTAREA"
            )
        ) {
            return;
        }


        setTimeout(resetPageScrollPosition, 50);

        setTimeout(resetPageScrollPosition, 300);

    }
);


if (window.visualViewport) {

    window.visualViewport.addEventListener(
        "resize",
        function() {

            const active =
                document.activeElement;


            const isTyping =
                active &&
                (
                    active.tagName === "INPUT" ||
                    active.tagName === "TEXTAREA"
                );


            if (isTyping) {

                setTimeout(
                    function() {

                        scrollFocusedInputIntoView(
                            active
                        );

                    },
                    50
                );

            }

            else {

                setTimeout(
                    resetPageScrollPosition,
                    50
                );

            }

        }
    );

}


window.addEventListener(
    "orientationchange",
    function() {

        setTimeout(
            resetPageScrollPosition,
            300
        );

    }
);



/* =========================
   드래그 유틸 (카테고리/결제수단/주체/분석 공용)
========================= */

/* 공용: 아이템 재정렬 */

function moveArrayItem(array, from, to) {

    if (
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= array.length ||
        to >= array.length
    ) {

        return false;

    }


    const moved =
        array.splice(from, 1)[0];

    array.splice(to, 0, moved);

    return true;

}


/* 공용: 드래그 초기화 */

function initializeDragSort(
    item,
    handle,
    options
) {

    /* options:
       - getArray: () => 배열 반환
       - getItemHeight: () => 54
       - onSave: () => 저장 함수
       - onRender: () => 다시 그리기
       - onAfterMove: () => 추가 콜백(선택)
    */

    let startY = 0;
    let dragging = false;


    handle.addEventListener(
        "touchstart",
        function(event) {

            event.preventDefault();

            startY =
                event.touches[0].clientY;

            dragging = true;

            item.classList.add("dragging");

        },
        { passive: false }
    );


    handle.addEventListener(
        "touchmove",
        function(event) {

            if (!dragging) return;


            const currentY =
                event.touches[0].clientY;

            const diff = currentY - startY;

            const itemHeight =
                options.getItemHeight
                    ? options.getItemHeight()
                    : 54;

            const steps =
                Math.trunc(diff / itemHeight);


            if (steps === 0) return;


            const array = options.getArray();

            const currentIndex =
                Number(item.dataset.index);

            let newIndex =
                currentIndex + steps;


            if (newIndex < 0) newIndex = 0;

            if (newIndex >= array.length) {
                newIndex = array.length - 1;
            }


            if (newIndex === currentIndex) {
                return;
            }


            moveArrayItem(
                array,
                currentIndex,
                newIndex
            );


            options.onSave();

            startY = currentY;

            options.onRender();

            if (options.onAfterMove) {

                options.onAfterMove();

            }

        },
        { passive: false }
    );


    handle.addEventListener(
        "touchend",
        function() {

            dragging = false;

            item.classList.remove("dragging");

        }
    );

}