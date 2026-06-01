/* ============================================================
   Time Management Widget — internal/local implementation
   Source reference (unchanged): assets/widgets/time-management-widget-original.html
   IIFE-scoped to avoid colliding with main.js globals
   (the lesson already defines a top-level checkAnswers()).
   ============================================================ */

(function () {
  'use strict';

  const MAX_ATTEMPTS = 5;

  let attempts = 0;
  let successes = 0;
  let isFinished = false;
  let hasAnsweredCurrentTime = false;

  let elRoot,
      sliderEl, timeDisplayVal,
      gymTotalInput, gymNetInput, screenTimeInput,
      feedbackBox, chartSection,
      checkBtn, restartBtn, zoomBtn,
      attemptsDisplay, successesDisplay,
      chartGym, chartScreen, chartOther;

  function byId(id) { return document.getElementById(id); }

  function init() {
    elRoot = byId('tmw-container');
    if (!elRoot) return;

    sliderEl         = byId('tmw-time-slider');
    timeDisplayVal   = byId('tmw-time-display-val');
    gymTotalInput    = byId('tmw-gym-total-input');
    gymNetInput      = byId('tmw-gym-net-input');
    screenTimeInput  = byId('tmw-screen-input');
    feedbackBox      = byId('tmw-feedback');
    chartSection     = byId('tmw-chart-section');
    checkBtn         = byId('tmw-check-btn');
    restartBtn       = byId('tmw-restart-btn');
    zoomBtn          = byId('tmw-zoom-btn');
    attemptsDisplay  = byId('tmw-attempts-val');
    successesDisplay = byId('tmw-successes-val');
    chartGym         = byId('tmw-chart-gym');
    chartScreen      = byId('tmw-chart-screen');
    chartOther       = byId('tmw-chart-other');

    if (!sliderEl || !checkBtn || !restartBtn) return;

    sliderEl.addEventListener('input', onSliderInput);
    checkBtn.addEventListener('click', checkAnswers);
    restartBtn.addEventListener('click', restartGame);
    if (zoomBtn) zoomBtn.addEventListener('click', toggleZoom);
  }

  /* Pure class toggle on the existing container — no DOM remount,
     no init re-run, so all widget state is preserved across zoom. */
  function toggleZoom() {
    const zoomed = elRoot.classList.toggle('tmw-zoomed');
    // Relax the question-card clip so the enlarged widget can break out (QA r1 item 1).
    const card = elRoot.closest('.content-card');
    if (card) card.classList.toggle('tmw-zoom-open', zoomed);
    const label  = zoomed ? 'הקטן יישומון' : 'הגדל יישומון';
    zoomBtn.setAttribute('aria-label', label);
    zoomBtn.setAttribute('title', label);
  }

  function onSliderInput() {
    if (isFinished) return;

    timeDisplayVal.innerText = sliderEl.value;
    hasAnsweredCurrentTime = false;

    gymTotalInput.disabled   = false;
    gymNetInput.disabled     = false;
    screenTimeInput.disabled = false;
    gymTotalInput.value      = '';
    gymNetInput.value        = '';
    screenTimeInput.value    = '';

    checkBtn.disabled  = false;
    checkBtn.innerText = 'בדקו את התשובות';

    feedbackBox.style.display  = 'none';
    chartSection.style.display = 'none';
    chartGym.style.width    = '0%';
    chartScreen.style.width = '0%';
    chartOther.style.width  = '0%';
  }

  function checkAnswers() {
    if (isFinished || hasAnsweredCurrentTime) return;

    const currentTotalTime = parseInt(sliderEl.value, 10);

    const expectedGymTotal = Math.round(currentTotalTime * 0.20);
    const expectedGymNet   = expectedGymTotal - 20;
    const expectedScreen   = Math.round(currentTotalTime * 0.35);

    const userGymTotal = parseInt(gymTotalInput.value, 10);
    const userGymNet   = parseInt(gymNetInput.value, 10);
    const userScreen   = parseInt(screenTimeInput.value, 10);

    if (isNaN(userGymTotal) || isNaN(userGymNet) || isNaN(userScreen)) {
      feedbackBox.innerText = 'נא למלא את כל השדות לפני הבדיקה.';
      feedbackBox.className = 'tmw-feedback tmw-error';
      feedbackBox.style.display = 'block';
      return;
    }

    hasAnsweredCurrentTime  = true;
    gymTotalInput.disabled   = true;
    gymNetInput.disabled     = true;
    screenTimeInput.disabled = true;

    attempts++;
    attemptsDisplay.innerText = attempts;

    const isCorrect = (userGymTotal === expectedGymTotal &&
                       userGymNet   === expectedGymNet &&
                       userScreen   === expectedScreen);

    if (isCorrect) {
      successes++;
      successesDisplay.innerText = successes;
      feedbackBox.innerHTML = 'כל הכבוד! חישבתם במדויק.';
      feedbackBox.className = 'tmw-feedback tmw-success';
      showChart();
    } else {
      feedbackBox.innerHTML =
        'יש לכם טעות בחישוב.' +
        '<div class="tmw-correct-answers-box">' +
          '<b>התשובות הנכונות עבור ' + currentTotalTime + ' דקות:</b><br>' +
          'כושר סך הכל (20%): ' + expectedGymTotal + ' דקות.<br>' +
          'אימון נטו (-20): ' + expectedGymNet + ' דקות.<br>' +
          'זמן מסך (35%): ' + expectedScreen + ' דקות.' +
        '</div>';
      feedbackBox.className = 'tmw-feedback tmw-error';
    }

    feedbackBox.style.display = 'block';

    if (attempts >= MAX_ATTEMPTS) {
      isFinished = true;
      checkBtn.style.display   = 'none';
      restartBtn.style.display = 'block';

      feedbackBox.innerHTML +=
        '<br><br><span style="font-size:22px;">סיימתם את המשימה!</span>' +
        '<br>הצלחתם ' + successes + ' פעמים מתוך 5.';
      feedbackBox.className = 'tmw-feedback tmw-finished';
    } else {
      checkBtn.disabled  = true;
      checkBtn.innerText = 'הזיזו את הסליידר לבחירת זמן חדש ->';
    }
  }

  function showChart() {
    chartSection.style.display = 'block';
    setTimeout(function () {
      chartGym.style.width    = '20%';
      chartScreen.style.width = '35%';
      chartOther.style.width  = '45%';
    }, 50);
  }

  function restartGame() {
    attempts = 0;
    successes = 0;
    isFinished = false;
    hasAnsweredCurrentTime = false;

    attemptsDisplay.innerText  = '0';
    successesDisplay.innerText = '0';

    restartBtn.style.display = 'none';
    checkBtn.style.display   = 'block';

    sliderEl.value = 300;
    sliderEl.dispatchEvent(new Event('input'));
  }

  window.initTimeManagementWidget = init;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
