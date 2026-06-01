# stem-math-lomdah

לומדה אינטראקטיבית — מתמטיקה, ניהול זמן (STEM).

## Completion screen — close (X) behavior

This lomda is deployed as a **standalone static site** (GitHub Pages). There is
no SCORM/LMS wrapper or host "close" API in this repo, and browsers block
`window.close()` for user-opened tabs.

So when `index.html` is opened directly or served standalone, clicking the **X**
on the completion dialog only **hides the completion overlay** and returns to the
final screen — **it does not close the browser tab**. This is expected.

If the lomda is later embedded in a host (LMS/iframe) that exposes a close API,
wire the host's **exact** expected `postMessage` event (and origin) into the
`closeMission()` "host close hook" in `js/main.js`. Do **not** invent a close
event the host does not actually listen for.

QA deployment trigger.

Second deployment trigger after enabling Actions read/write permissions.
