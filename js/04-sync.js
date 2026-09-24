/* =========================
   04. Supabase 데이터 동기화
========================= */

async function loadUserDataFromSupabase() {

    if (!supabaseClient || !currentUser) return;


    isLoadingUserData = true;

    setSyncStatus("동기화 중...");


    const [
        transactionsResult,
        userDataResult
    ] = await Promise.all([

        supabaseClient
            .from("transactions")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("date", { ascending: true }),

        supabaseClient
            .from("user_data")
            .select("*")
            .eq("user_id", currentUser.id)
            .maybeSingle()

    ]);


    isLoadingUserData = false;


    if (transactionsResult.error) {

        setSyncStatus(
            "동기화 실패: " +
            transactionsResult.error.message
        );

        return;

    }


    if (
        userDataResult.error &&
        userDataResult.error.code !== "PGRST116"
    ) {

        setSyncStatus(
            "동기화 실패: " +
            userDataResult.error.message
        );

        return;

    }


    const rows =
        transactionsResult.data || [];


    transactions =
        rows.map(
            row => ({

                id: row.id,

                date: row.date,

                type: row.type,

                amount: Number(row.amount) || 0,

                category: row.category || "",

                memo: row.memo || "",

                payment: row.payment || "",

                subject: row.subject || ""

            })
        );


    localStorage.setItem(
        "householdTransactions",
        JSON.stringify(transactions)
    );


    const userRow = userDataResult.data;


    if (userRow) {

        if (userRow.settings) {

            settings = {
                ...settings,
                ...userRow.settings
            };

            localStorage.setItem(
                "householdSettings",
                JSON.stringify(settings)
            );

        }


        if (userRow.categories) {

            categories = userRow.categories;

            localStorage.setItem(
                "householdCategories",
                JSON.stringify(categories)
            );

        }


        if (userRow.payment_methods) {

            paymentMethods =
                userRow.payment_methods;

            localStorage.setItem(
                "householdPaymentMethods",
                JSON.stringify(paymentMethods)
            );

        }


        if (userRow.subjects) {

            subjects = userRow.subjects;

            localStorage.setItem(
                "householdSubjects",
                JSON.stringify(subjects)
            );

        }

    }

    else {

        await pushLocalDataToSupabase();

    }


    setSyncStatus("동기화 완료");

    refreshAllScreens();

}


async function pushLocalDataToSupabase() {

    if (!supabaseClient || !currentUser) return;


    await supabaseClient
        .from("user_data")
        .upsert({

            user_id: currentUser.id,

            settings: settings,

            categories: categories,

            payment_methods: paymentMethods,

            subjects: subjects,

            updated_at: new Date().toISOString()

        });


    if (transactions.length) {

        const rows =
            transactions.map(
                transaction => ({

                    id: String(transaction.id),

                    user_id: currentUser.id,

                    date: transaction.date,

                    type: transaction.type,

                    amount: transaction.amount,

                    category: transaction.category || null,

                    memo: transaction.memo || null,

                    payment: transaction.payment || null,

                    subject: transaction.subject || null

                })
            );


        await supabaseClient
            .from("transactions")
            .upsert(rows);

    }

}


function scheduleSyncUserData() {

    if (
        !supabaseClient ||
        !currentUser ||
        isLoadingUserData
    ) {
        return;
    }


    if (!navigator.onLine) {

        pendingSyncWhenOnline = true;

        return;

    }


    if (syncUserDataTimer) {
        clearTimeout(syncUserDataTimer);
    }


    syncUserDataTimer =
        setTimeout(
            function() {

                if (!supabaseClient || !currentUser) {
                    return;
                }


                supabaseClient
                    .from("user_data")
                    .upsert({

                        user_id: currentUser.id,

                        settings: settings,

                        categories: categories,

                        payment_methods: paymentMethods,

                        subjects: subjects,

                        updated_at: new Date().toISOString()

                    })
                    .then(
                        function(result) {

                            if (result.error) {
                                console.error(result.error);
                            }

                        }
                    );

            },
            600
        );

}


function refreshAllScreens() {

    renderCategoryButtons();

    renderSubjectButtons();

    renderPaymentButtons();

    updateInputAreas();


    renderCalendar();

    renderSelectedDate();


    renderCategoryManagement();

    renderPaymentManagement();

    renderSubjectManagement();


    updateSettingsUI();


    const analysisScreen =
        document.getElementById("analysisScreen");


    if (
        analysisScreen &&
        analysisScreen.classList.contains("active")
    ) {

        renderAnalysis();

    }

}


/* =========================
   거래 동기화
========================= */

function syncInsertTransaction(transaction) {

    if (!supabaseClient || !currentUser) return;

    if (!navigator.onLine) {
        pendingSyncWhenOnline = true;
        return;
    }


    supabaseClient
        .from("transactions")
        .insert({

            id: String(transaction.id),

            user_id: currentUser.id,

            date: transaction.date,

            type: transaction.type,

            amount: transaction.amount,

            category: transaction.category || null,

            memo: transaction.memo || null,

            payment: transaction.payment || null,

            subject: transaction.subject || null

        })
        .then(
            function(result) {

                if (result.error) {
                    console.error(result.error);
                }

            }
        );

}


function syncUpdateTransaction(id, fields) {

    if (!supabaseClient || !currentUser) return;

    if (!navigator.onLine) {
        pendingSyncWhenOnline = true;
        return;
    }


    supabaseClient
        .from("transactions")
        .update(fields)
        .eq("id", String(id))
        .eq("user_id", currentUser.id)
        .then(
            function(result) {

                if (result.error) {
                    console.error(result.error);
                }

            }
        );

}


function syncDeleteTransaction(id) {

    if (!supabaseClient || !currentUser) return;

    if (!navigator.onLine) {
        pendingSyncWhenOnline = true;
        return;
    }


    supabaseClient
        .from("transactions")
        .delete()
        .eq("id", String(id))
        .eq("user_id", currentUser.id)
        .then(
            function(result) {

                if (result.error) {
                    console.error(result.error);
                }

            }
        );

}


function syncRenameTransactionsField(
    field,
    oldValue,
    newValue
) {

    if (!supabaseClient || !currentUser) return;

    if (!navigator.onLine) {
        pendingSyncWhenOnline = true;
        return;
    }


    const updatePayload = {};

    updatePayload[field] = newValue;


    supabaseClient
        .from("transactions")
        .update(updatePayload)
        .eq("user_id", currentUser.id)
        .eq(field, oldValue)
        .then(
            function(result) {

                if (result.error) {
                    console.error(result.error);
                }

            }
        );

}