(() => {


"use strict";


/* =========================================================
   ELEMENTS
========================================================== */

const status =
    document.getElementById(
        "downloadStatus"
    );

const manualDownload =
    document.getElementById(
        "manualDownload"
    );


/* =========================================================
   GET TOKEN
========================================================== */

const accessToken =
    sessionStorage.getItem(
        "deploypilot_access_token"
    );


/* =========================================================
   DOWNLOAD ENDPOINT
========================================================== */

const buildDownloadUrl =
    () => {

        if (!accessToken) {

            return "";

        }

        return (
            "/api/download?access=" +
            encodeURIComponent(
                accessToken
            )
        );

    };


const downloadUrl =
    buildDownloadUrl();


/* =========================================================
   NO TOKEN
========================================================== */

if (!downloadUrl) {

    if (status) {

        status.innerHTML = `
            <div class="status-error">
                !
            </div>

            <div>
                <strong>
                    Download link unavailable
                </strong>

                <p>
                    Please return to the download
                    page and try again.
                </p>
            </div>
        `;

    }

    return;

}


/* =========================================================
   MANUAL DOWNLOAD BUTTON
========================================================== */

if (manualDownload) {

    manualDownload.href =
        downloadUrl;

}


/* =========================================================
   START DOWNLOAD
========================================================== */

function startDownload() {

    /*
     * A normal browser navigation to the Worker
     * endpoint is used here.

     * The Worker validates the signed token
     * and redirects to the actual installer.
     */

    window.location.href =
        downloadUrl;

}


/* =========================================================
   AUTOMATIC DOWNLOAD
========================================================== */

setTimeout(
    () => {

        startDownload();

    },
    500
);


/* =========================================================
   UPDATE STATUS
========================================================== */

setTimeout(
    () => {

        if (!status) {
            return;
        }

        status.innerHTML = `
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

    },
    1500
);


/* =========================================================
   VIDEO AUTOPLAY
========================================================== */

const video =
    document.getElementById(
        "installationVideo"
    );

if (video) {

    video.play().catch(
        () => {}
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
            ["i", "j", "c"].includes(key)
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


})();
