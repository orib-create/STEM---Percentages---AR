/* ============================================================
   Weekend Widget (Question 7) — internal/local implementation
   Source reference (unchanged): assets/widgets/weekend-widget-original.html
   IIFE-scoped to avoid colliding with main.js globals and with the
   Time Management Widget. No shared DOM, state, IDs, or functions.
   ============================================================ */

(function () {
  'use strict';

  const MAX_ATTEMPTS = 5;
  const BASE_TOTAL  = 300;
  const BASE_SCREEN = 105;
  const EXPECTED_FINAL_PERC = 35;

  let attempts = 0;
  let successes = 0;
  let isFinished = false;
  let hasAnsweredCurrentPercent = false;

  let elRoot, zoomBtn,
      slider, percDisplayVal,
      newTotalInput, newScreenInput, finalPercInput,
      feedbackBox, checkBtn, restartBtn,
      attemptsDisplay, successesDisplay;

  function byId(id) { return document.getElementById(id); }

  function init() {
    elRoot = byId('ww-container');
    if (!elRoot) return;

    zoomBtn          = byId('ww-zoom-btn');
    slider           = byId('ww-perc-slider');
    percDisplayVal   = byId('ww-perc-display-val');
    newTotalInput    = byId('ww-new-total-input');
    newScreenInput   = byId('ww-new-screen-input');
    finalPercInput   = byId('ww-final-perc-input');
    feedbackBox      = byId('ww-feedback');
    checkBtn         = byId('ww-check-btn');
    restartBtn       = byId('ww-restart-btn');
    attemptsDisplay  = byId('ww-attempts-val');
    successesDisplay = byId('ww-successes-val');

    if (!slider || !checkBtn || !restartBtn) return;

    slider.addEventListener('input', onSliderInput);
    checkBtn.addEventListener('click', checkAnswers);
    restartBtn.addEventListener('click', restartGame);
    if (zoomBtn) zoomBtn.addEventListener('click', toggleZoom);

    // הרצה ראשונית של השדות
    updateCalculatedFields();
  }

  /* Pure class toggle on the existing container — no DOM remount,
     no init re-run, so all widget state is preserved across zoom. */
  function toggleZoom() {
    const zoomed = elRoot.classList.toggle('ww-zoomed');
    const label  = zoomed ? 'הקטן יישומון' : 'הגדל יישומון';
    zoomBtn.setAttribute('aria-label', label);
    zoomBtn.setAttribute('title', label);
  }

  function updateCalculatedFields() {
    const percIncrease = parseInt(slider.value, 10);
    const expectedTotal  = BASE_TOTAL  + Math.round(BASE_TOTAL  * (percIncrease / 100));
    const expectedScreen = BASE_SCREEN + Math.round(BASE_SCREEN * (percIncrease / 100));

    newTotalInput.value  = expectedTotal;
    newScreenInput.value = expectedScreen;
  }

  function onSliderInput() {
    if (isFinished) return;

    percDisplayVal.innerText = slider.value;
    hasAnsweredCurrentPercent = false;

    // עדכון השדות המספריים אוטומטית
    updateCalculatedFields();

    // פתיחת שדה האחוז לאיפוס
    finalPercInput.disabled = false;
    finalPercInput.value = '';

    // החזרת כפתור הבדיקה למצב פעיל
    checkBtn.disabled = false;
    checkBtn.innerText = 'בדקו את תשובותיכם';
    feedbackBox.style.display = 'none';
  }

  function checkAnswers() {
    if (isFinished || hasAnsweredCurrentPercent) return;

    const userFinalPerc = parseInt(finalPercInput.value, 10);

    if (isNaN(userFinalPerc)) {
      feedbackBox.innerText = 'נא להקליד את האחוז החדש לפני הבדיקה.';
      feedbackBox.className = 'ww-feedback ww-error';
      feedbackBox.style.display = 'block';
      return;
    }

    // נעילת השדה והכפתור
    hasAnsweredCurrentPercent = true;
    finalPercInput.disabled = true;

    attempts++;
    attemptsDisplay.innerText = attempts;

    if (userFinalPerc === EXPECTED_FINAL_PERC) {
      successes++;
      successesDisplay.innerText = successes;
      feedbackBox.innerHTML = 'כל הכבוד! תשובה נכונה ומדויקת.';
      feedbackBox.className = 'ww-feedback ww-success';
    } else {
      feedbackBox.innerHTML = 'טעיתם בחישוב האחוז - נסו שוב.';
      feedbackBox.className = 'ww-feedback ww-error';
    }

    feedbackBox.style.display = 'block';

    if (attempts >= MAX_ATTEMPTS) {
      isFinished = true;
      checkBtn.style.display = 'none';
      restartBtn.style.display = 'block';

      feedbackBox.innerHTML +=
        '<br><br><span style="font-size:22px;">סיימתם את המשימה!</span>' +
        '<br>הצלחתם ' + successes + ' פעמים מתוך 5.';
      feedbackBox.className = 'ww-feedback ww-finished';
    } else {
      checkBtn.disabled = true;
      checkBtn.innerText = 'הזיזו את הסליידר לבחירת אחוז חדש ->';
    }
  }

  function restartGame() {
    attempts = 0;
    successes = 0;
    isFinished = false;
    hasAnsweredCurrentPercent = false;

    attemptsDisplay.innerText = '0';
    successesDisplay.innerText = '0';

    restartBtn.style.display = 'none';
    checkBtn.style.display = 'block';

    slider.value = 40;
    slider.dispatchEvent(new Event('input'));
    updateCalculatedFields();
  }

  window.initWeekendWidget = init;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
