/* ============================================================
   STEM Math Lomdah — main.js
   ============================================================ */

'use strict';

/* ─── Globals ───────────────────────────────────────────── */
const TOTAL_SCREENS = 19;
let currentScreen = 0;

const CORRECT_ANSWERS = { timer1: 60, timer2: 40, timer3: 105 };
let attemptCount = 0;
const MAX_ATTEMPTS = 2;

/* QA r1 (item 5): parse a numeric answer field.
   Empty/blank/non-numeric → NaN (treated as "not filled" → shake, no attempt).
   A real number such as 42.2 / 42.5 is returned as-is so the strict === check
   below routes it through the normal "incorrect" path instead of being
   truncated by parseInt() and wrongly accepted as the integer answer. */
function parseAnswer(value) {
  const s = String(value).trim();
  if (s === '') return NaN;
  const n = Number(s);
  return Number.isNaN(n) ? NaN : n;
}

/* ─── Scale canvas to viewport ─────────────────────────── */
function scaleApp() {
  const app = document.getElementById('app');
  const scaleX = window.innerWidth  / 1920;
  const scaleY = window.innerHeight / 1080;
  const scale  = Math.min(scaleX, scaleY);

  app.style.transform = `scale(${scale})`;
  app.style.left = `${(window.innerWidth  - 1920 * scale) / 2}px`;
  app.style.top  = `${(window.innerHeight - 1080 * scale) / 2}px`;
}

window.addEventListener('resize', scaleApp);
scaleApp();

/* ─── Navigation ────────────────────────────────────────── */
function goTo(n) {
  if (n < 0 || n >= TOTAL_SCREENS) return;

  // עצור את כל הוידאו לפני מעבר מסך — אין ניגון ברקע
  document.querySelectorAll('video').forEach(v => v.pause());

  const screens = document.querySelectorAll('.screen');
  screens[currentScreen].classList.remove('active');
  currentScreen = n;
  screens[currentScreen].classList.add('active');

  resetScreenState();
  if (n === 5)  enterFrame6();
  if (n === 8)  enterFrame9();
  if (n === 13) initS13MultiSelect();
}

/** Reset transient UI state when changing screen */
function resetScreenState() {
  // סגור את כל הפופ-אפים ואפס כל כפתורי העזרה
  closeAllPopups();

  // ── מסך 3 (Q1) — אפס רק אם השאלה טרם הושלמה ──────────
  if (!screen3Done) {
    attemptCount = 0;

    const submitBtn   = document.getElementById('submit-btn');
    const tryAgainMsg = document.getElementById('try-again-msg');
    const feedbackOk  = document.getElementById('feedback-correct');
    const feedbackFail= document.getElementById('feedback-incorrect');
    const nextS3      = document.getElementById('next-s3');

    if (submitBtn)    { submitBtn.disabled = false; submitBtn.classList.add('hidden'); }
    if (tryAgainMsg)  tryAgainMsg.classList.add('hidden');
    if (feedbackOk)   feedbackOk.classList.add('hidden');
    if (feedbackFail) feedbackFail.classList.add('hidden');
    if (nextS3)       nextS3.classList.add('hidden');

    ['timer1', 'timer2', 'timer3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.value = ''; el.classList.remove('correct', 'incorrect'); }
    });
  }

  // ── מסך 4 (Q2, Frame 5) — אפס רק אם השאלה טרם הושלמה ─
  if (!screen4Done) {
    attemptCountS4 = 0;

    const submitBtnS4   = document.getElementById('submit-btn-s4');
    const tryAgainS4    = document.getElementById('try-again-msg-s4');
    const feedbackS4Ok  = document.getElementById('feedback-s4-correct');
    const feedbackS4Err = document.getElementById('feedback-s4-incorrect');
    const nextS4        = document.getElementById('next-s4');
    const timerS4el     = document.getElementById('timer-s4');

    if (submitBtnS4)   { submitBtnS4.disabled = false; submitBtnS4.classList.add('hidden'); }
    if (tryAgainS4)    tryAgainS4.classList.add('hidden');
    if (feedbackS4Ok)  feedbackS4Ok.classList.add('hidden');
    if (feedbackS4Err) feedbackS4Err.classList.add('hidden');
    if (nextS4)        nextS4.classList.add('hidden');
    if (timerS4el)     { timerS4el.value = ''; timerS4el.classList.remove('correct', 'incorrect'); }
  }

  // כשחוזרים למסך 0 — מאפסים טלפון, הודעות, חץ וידאו
  const phoneDiv = document.getElementById('frame1-phone');
  const notif2   = document.getElementById('notif-2');
  const nextBtn0 = document.getElementById('next-s0');
  const playBtn0 = document.getElementById('play-btn-s0');
  const noaVid   = document.getElementById('noa-video');

  if (noaVideoWatched) {
    // כבר צפתה — מציג מצב סופי: טלפון + הודעה 2 + חץ, ללא Play
    if (phoneDiv) phoneDiv.classList.remove('hidden');
    if (notif2)   notif2.classList.remove('hidden');
    if (nextBtn0) nextBtn0.classList.remove('hidden');
    if (playBtn0) playBtn0.style.display = 'none';
  } else {
    // טרם צפתה — מאפס הכל למצב התחלתי
    if (phoneDiv) phoneDiv.classList.add('hidden');
    if (notif2)   notif2.classList.add('hidden');
    if (nextBtn0) nextBtn0.classList.add('hidden');
    if (playBtn0) playBtn0.style.display = '';
  }
  if (noaVid) { noaVid.pause(); noaVid.currentTime = 0; }

  // ── מסך 6 (Q3A) — אפס רק אם השאלה טרם הושלמה ────────────
  if (!screen6Done) {
    attemptCountS6 = 0;
    s6Selection = null;
    ['yes', 'no', 'dontknow'].forEach(opt => setRadioVisual('s6', opt, 'normal'));
    ['s6-radio-yes', 's6-radio-no', 's6-radio-dontknow'].forEach(id =>
      document.getElementById(id)?.classList.remove('disabled'));
    document.getElementById('submit-btn-s6')?.classList.add('hidden');
    document.getElementById('try-again-msg-s6')?.classList.add('hidden');
    document.getElementById('feedback-s6-correct')?.classList.add('hidden');
    document.getElementById('feedback-s6-incorrect')?.classList.add('hidden');
    document.getElementById('next-s6')?.classList.add('hidden');
  }

  // ── מסך 7 (Q3B) — אפס רק אם השאלה טרם הושלמה ────────────
  if (!screen7Done) {
    attemptCountS7 = 0;
    s7Selection = null;
    ['yes', 'no', 'dontknow'].forEach(opt => setRadioVisual('s7', opt, 'normal'));
    ['s7-radio-yes', 's7-radio-no', 's7-radio-dontknow'].forEach(id =>
      document.getElementById(id)?.classList.remove('disabled'));
    document.getElementById('submit-btn-s7')?.classList.add('hidden');
    document.getElementById('try-again-msg-s7')?.classList.add('hidden');
    document.getElementById('feedback-s7-correct')?.classList.add('hidden');
    document.getElementById('feedback-s7-incorrect')?.classList.add('hidden');
    document.getElementById('next-s7')?.classList.add('hidden');
  }

  // ── מסך 9 (Q4) — אפס רק אם השאלה טרם הושלמה ────────────
  if (!screen9Done) {
    attemptCountS9 = 0;
    s9Selection = null;
    RADIO_OPTIONS['s9'].forEach(opt => setRadioVisual('s9', opt, 'normal'));
    ['s9-radio-a', 's9-radio-b', 's9-radio-c', 's9-radio-d'].forEach(id =>
      document.getElementById(id)?.classList.remove('disabled'));
    document.getElementById('submit-btn-s9')?.classList.add('hidden');
    document.getElementById('try-again-msg-s9')?.classList.add('hidden');
    document.getElementById('feedback-s9-correct')?.classList.add('hidden');
    document.getElementById('feedback-s9-incorrect')?.classList.add('hidden');
    document.getElementById('next-s9')?.classList.add('hidden');
  }

  // ── מסך 11 (Q5A) — אפס רק אם השאלה טרם הושלמה ──────────
  if (!screen11Done) {
    attemptCountS11 = 0;
    const inp = document.getElementById('s11-input');
    if (inp) { inp.value = ''; inp.disabled = false; inp.className = 's11-input-field'; }
    document.getElementById('submit-btn-s11')?.classList.add('hidden');
    document.getElementById('try-again-msg-s11')?.classList.add('hidden');
    document.getElementById('next-s11')?.classList.add('hidden');
    document.getElementById('feedback-s11-correct')?.classList.add('hidden');
    document.getElementById('feedback-s11-incorrect')?.classList.add('hidden');
    // החזר dot + טקסט הסבר לתצוגה
    document.querySelector('[data-screen="11"] .s11-dot-bullet')?.classList.remove('hidden');
    document.querySelector('[data-screen="11"] .s11-graph-note')?.classList.remove('hidden');
    // אפס מצב נקודות גרף Q5A בלבד
    document.querySelectorAll('#graph-card .gp').forEach(gp =>
      gp.classList.remove('is-selected', 'is-correct', 'is-incorrect'));
    hideProjection();
  }

  // ── מסך 12 (Q5B) — אפס רק אם השאלה טרם הושלמה ──────────
  if (!screen12Done) {
    attemptCountS12 = 0;
    const inpS12 = document.getElementById('s12-input');
    if (inpS12) { inpS12.value = ''; inpS12.disabled = false; inpS12.className = 's11-input-field'; }
    document.getElementById('submit-btn-s12')?.classList.add('hidden');
    document.getElementById('try-again-msg-s12')?.classList.add('hidden');
    document.getElementById('next-s12')?.classList.add('hidden');
    document.getElementById('feedback-s12-correct')?.classList.add('hidden');
    document.getElementById('feedback-s12-incorrect')?.classList.add('hidden');
    // החזר dot + טקסט הסבר לתצוגה
    document.querySelector('[data-screen="12"] .s11-dot-bullet')?.classList.remove('hidden');
    document.querySelector('[data-screen="12"] .s11-graph-note')?.classList.remove('hidden');
    // אפס מצב נקודות גרף Q5B בלבד
    document.querySelectorAll('#graph-card-s12 .gp').forEach(gp =>
      gp.classList.remove('is-selected', 'is-correct', 'is-incorrect'));
  }

  // ── מסך 13 (Q5C) — אפס רק אם השאלה טרם הושלמה ──────────
  if (!screen13Done) {
    attemptCountS13 = 0;
    document.querySelectorAll('#graph-card-s13 .s13-gp').forEach(gp =>
      gp.classList.remove('is-selected', 'is-correct', 'is-incorrect'));
    document.getElementById('submit-btn-s13')?.classList.add('hidden');
    document.getElementById('try-again-msg-s13')?.classList.add('hidden');
    document.getElementById('next-s13')?.classList.add('hidden');
    document.getElementById('feedback-s13-correct')?.classList.add('hidden');
    document.getElementById('feedback-s13-incorrect')?.classList.add('hidden');
    // החזר wrapper (dot + note-text) לתצוגה (הוסתר ב-disableSubmitS13)
    document.querySelector('.s13-note-wrapper')?.classList.remove('hidden');
  }

  // ── מסך 15 (Q6) — אפס רק אם השאלה טרם הושלמה ──────────
  if (!screen15Done) {
    attemptCountS15 = 0;
    s15Selection = null;
    RADIO_OPTIONS['s15'].forEach(opt => setRadioVisual('s15', opt, 'normal'));
    ['s15-radio-a', 's15-radio-b', 's15-radio-c', 's15-radio-d'].forEach(id =>
      document.getElementById(id)?.classList.remove('disabled'));
    document.getElementById('submit-btn-s15')?.classList.add('hidden');
    document.getElementById('try-again-msg-s15')?.classList.add('hidden');
    document.getElementById('feedback-s15-correct')?.classList.add('hidden');
    document.getElementById('feedback-s15-incorrect')?.classList.add('hidden');
    document.getElementById('next-s15')?.classList.add('hidden');
  }

  // ── מסך 17 (Q8) — אפס רק אם השאלה טרם הושלמה ──────────
  if (!screen17Done) {
    attemptCountS17  = 0;
    s17dd1Selection  = null;
    s17dd2Selection  = null;
    // אפס dropdown 1
    const dd1Value = document.getElementById('dd1-value');
    const dd1Btn   = document.getElementById('dd1-btn');
    const dd1List  = document.getElementById('dd1-list');
    if (dd1Value) dd1Value.textContent = 'בחרו תשובה';
    if (dd1Btn)   { dd1Btn.classList.remove('correct', 'incorrect'); dd1Btn.disabled = false; }
    if (dd1List)  dd1List.classList.add('hidden');
    // אפס dropdown 2
    const dd2Value = document.getElementById('dd2-value');
    const dd2Btn   = document.getElementById('dd2-btn');
    const dd2List  = document.getElementById('dd2-list');
    if (dd2Value) dd2Value.textContent = 'בחרו תשובה';
    if (dd2Btn)   { dd2Btn.classList.remove('correct', 'incorrect'); dd2Btn.disabled = false; }
    if (dd2List)  dd2List.classList.add('hidden');
    document.getElementById('submit-btn-s17')?.classList.add('hidden');
    document.getElementById('try-again-msg-s17')?.classList.add('hidden');
    document.getElementById('feedback-s17-correct')?.classList.add('hidden');
    document.getElementById('feedback-s17-incorrect')?.classList.add('hidden');
    document.getElementById('next-s17')?.classList.add('hidden');
  }

  // ודא שה-modal זום סגור וקווי ההטלה מוסתרים בכל מעבר מסך
  closeGraphZoom();
  hideProjection(); // נקה קווי hover שנשארו ממעבר מהיר (ללא mouseleave)

  // ── Screen 8 (Frame 9): notification ─────────────────────
  if (!frame9Seen) {
    document.getElementById('f9-m1')?.classList.add('hidden');
  }

  // ── Screen 5 (Frame 6): WhatsApp messages ─────────────────
  // אם עדיין לא נצפה — ודא שכל ההודעות מוסתרות
  if (!frame6Seen) {
    ['ofri-m1', 'ofri-m2', 'ofri-m3', 'ofri-m4'].forEach(id =>
      document.getElementById(id)?.classList.add('hidden'));
  }

  // עצור גם את וידאו אלכס ואפס כפתור Play שלו + כיתוב Sub
  const alexVid  = document.getElementById('alex-video');
  const playBtn1 = document.getElementById('play-btn');
  const nextS1   = document.getElementById('next-s1');
  if (alexVid)  { alexVid.pause(); alexVid.currentTime = 0; }
  if (playBtn1) playBtn1.style.display = '';
  // אם כבר צפתה בסרטון — החץ נשאר גלוי; אחרת נסתר עד סיום
  if (nextS1) {
    if (alexVideoWatched) {
      nextS1.classList.remove('hidden');
    } else {
      nextS1.classList.add('hidden');
    }
  }
}

/* ─── Init ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNoaVideo();        // Screen 0: Frame 1 fullscreen background video
  initAlexVideo();       // Screen 1: Alex influencer video
  initHelpButtons();     // כל המסכים: help popup toggle (data-popup attribute)
  initSubmitButton();    // Screen 3: show submit only when all fields filled
  initSubmitButtonS4();  // Screen 4: show submit only when field filled
  initKeyboard();
});

/* ─── Screen 0: Noa fullscreen video ───────────────────── */
/*
   מצב א: Play overlay מלא-מסך → לחיצה → וידאו מתנגן.
   מצב ב: וידאו נגמר → טלפון מופיע + הודעה 2 + חץ מיד.
   (Message 1 הוסרה — אין עיכוב)
   אין replay לוידאו זה.
*/
function initNoaVideo() {
  const noaVideo = document.getElementById('noa-video');
  const playBtn  = document.getElementById('play-btn-s0');

  if (!noaVideo) return;

  function revealPhone() {
    const phoneDiv = document.getElementById('frame1-phone');
    const notif2   = document.getElementById('notif-2');
    const nextBtn  = document.getElementById('next-s0');

    // טלפון + הודעה 2 + חץ — מיד (Message 1 הוסרה)
    if (phoneDiv) phoneDiv.classList.remove('hidden');
    if (notif2)   notif2.classList.remove('hidden');
    if (nextBtn)  nextBtn.classList.remove('hidden');
    noaVideoWatched = true;
  }

  // לחיצה על Play overlay → מתחיל את הוידאו
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      noaVideo.play()
        .then(() => {
          playBtn.style.display = 'none';
        })
        .catch(err => {
          console.warn('noa-video play failed:', err);
          playBtn.style.display = 'none';
          revealPhone();
        });
    });
  }

  // סיום הוידאו → הצגת טלפון + הודעות
  noaVideo.addEventListener('ended', revealPhone);

  // קובץ חסר → מדלג ישירות לטלפון
  noaVideo.addEventListener('error', () => {
    console.warn('noa-video could not load — skipping to phone state');
    if (playBtn) playBtn.style.display = 'none';
    revealPhone();
  });
}

/* ─── Screen 1: Alex video ───────────────────────────────── */
/*
   פעם ראשונה: חץ "הבא" מופיע רק אחרי שהסרטון נגמר.
   פעמים הבאות: חץ "הבא" מופיע מיד (alexVideoWatched = true).
*/
let alexVideoWatched = false;
let noaVideoWatched  = false;
let frame6Seen       = false;
let frame9Seen       = false;

/* Resume-state flags for question screens.
   Once true, resetScreenState() skips resetting that screen
   so the learner cannot re-answer after navigating forward. */
let screen3Done = false;  // Screen 3 (Q1 — timer inputs)
let screen4Done = false;  // Screen 4 (Q2 — single timer input)
let screen6Done = false;  // Screen 6 (Q3A — radio button)
let screen7Done = false;  // Screen 7 (Q3B — radio button)

/* Radio button selections for Q3 screens */
let s6Selection = null;   // 'yes' | 'no'
let s7Selection = null;

/* Attempt counters for Q3 screens */
let attemptCountS6 = 0;
let attemptCountS7 = 0;

/* Correct answers for Q3 */
const CORRECT_ANSWER_S6 = 'yes';  // Q3A: נכון
const CORRECT_ANSWER_S7 = 'no';   // Q3B: לא נכון

/* ─── Radio options map — used by radioClick() ──────────── */
const RADIO_OPTIONS = {
  's6':  ['yes', 'no', 'dontknow'],
  's7':  ['yes', 'no', 'dontknow'],
  's9':  ['a', 'b', 'c', 'd'],
  's15': ['a', 'b', 'c', 'd'],
};

/* ─── Score flags — set to true when the user answers correctly (any attempt)
   Q7 (screen 16) is not scored per the scoring rules.
   ──────────────────────────────────────────────────────────────── */
let scoreCorrect_q1b = false;  // Screen  3 — Q1 section B
let scoreCorrect_q2  = false;  // Screen  4 — Q2
let scoreCorrect_q3a = false;  // Screen  6 — Q3A
let scoreCorrect_q3b = false;  // Screen  7 — Q3B
let scoreCorrect_q4  = false;  // Screen  9 — Q4
let scoreCorrect_q5a = false;  // Screen 11 — Q5A
let scoreCorrect_q5b = false;  // Screen 12 — Q5B
let scoreCorrect_q5c = false;  // Screen 13 — Q5C
let scoreCorrect_q6  = false;  // Screen 15 — Q6
let scoreCorrect_q8  = false;  // Screen 17 — Q8

/* ─── Screen 13 (Q5C) — multi-select state ──────────────── */
let screen13Done    = false;
let attemptCountS13 = 0;
let s13MultiSelectInited = false;  // prevents re-binding click handlers

/* ─── Screen 15 (Q6) — radio state ─────────────────────── */
let screen15Done    = false;
let attemptCountS15 = 0;
let s15Selection    = null;
const CORRECT_ANSWER_S15 = 'c';  // 126 דקות

/* ─── Screen 17 (Q8) — dropdown state ───────────────────── */
let screen17Done     = false;
let attemptCountS17  = 0;
let s17dd1Selection  = null;  // dropdown 1
let s17dd2Selection  = null;  // dropdown 2
const CORRECT_DD1    = '35%';
const CORRECT_DD2    = 'לא משתנה';

/* Resume-state flag / selection / attempts for Q4 (Screen 9) */
let screen9Done = false;
let s9Selection = null;
let attemptCountS9 = 0;
const CORRECT_ANSWER_S9 = 'c';  // Q4: כ-28.5%

function initAlexVideo() {
  const playBtn   = document.getElementById('play-btn');
  const alexVideo = document.getElementById('alex-video');
  const nextBtn   = document.getElementById('next-s1');

  if (!playBtn || !alexVideo) return;

  // לחיצה על Play overlay → מתחיל את הוידאו (overlay נעלם; controls נגישים)
  playBtn.addEventListener('click', () => {
    alexVideo.play()
      .then(() => {
        playBtn.style.display = 'none';
      })
      .catch(err => {
        console.warn('Alex video play failed:', err);
        playBtn.style.display = 'none';
        if (nextBtn) nextBtn.classList.remove('hidden');
      });
  });

  // סיום הוידאו → חץ הבא מופיע
  alexVideo.addEventListener('ended', () => {
    alexVideoWatched = true;
    setTimeout(() => {
      if (nextBtn) nextBtn.classList.remove('hidden');
      playBtn.style.display = '';  // כפתור Play חוזר לצפייה חוזרת
    }, 400);
  });

  // שגיאת טעינה → דלג לחץ הבא
  alexVideo.addEventListener('error', () => {
    console.warn('alex-video could not load — showing next button');
    playBtn.style.display = 'none';
    if (nextBtn) nextBtn.classList.remove('hidden');
  });

  // ── Fullscreen: כאשר הוידאו עצמו עובר למסך-מלא (דרך כפתור הנגן),
  //    מפנים מיד ל-wrapper כדי שה-Sub יישאר גלוי.
  //    כאשר ה-wrapper עצמו במסך-מלא — מחשבים scale כמו scaleApp.
  function onAlexFullscreenChange() {
    const wrap = document.getElementById('alex-video-wrap');
    if (!wrap) return;

    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    const exit = (document.exitFullscreen || document.webkitExitFullscreen).bind(document);
    const enterWrap = (wrap.requestFullscreen || wrap.webkitRequestFullscreen).bind(wrap);

    if (fsEl === alexVideo) {
      // הוידאו עצמו הלך למסך-מלא → מפנים ל-wrapper
      exit().then(() => enterWrap().catch(console.error)).catch(console.error);
      return;
    }

    if (fsEl === wrap) {
      // ה-wrapper במסך-מלא → scale כדי לשמור 1920×1080
      const sw = window.screen.width;
      const sh = window.screen.height;
      const scale = Math.min(sw / 1920, sh / 1080);
      const ox = (sw - 1920 * scale) / 2;
      const oy = (sh - 1080 * scale) / 2;
      wrap.style.width          = '1920px';
      wrap.style.height         = '1080px';
      wrap.style.transformOrigin = 'top left';
      wrap.style.transform      = `translate(${ox}px, ${oy}px) scale(${scale})`;
    } else {
      // יצאנו ממסך-מלא → איפוס
      wrap.style.width = wrap.style.height = '';
      wrap.style.transform = wrap.style.transformOrigin = '';
    }
  }

  document.addEventListener('fullscreenchange',       onAlexFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onAlexFullscreenChange);
}

/* ─── Help Popup — כל המסכים ───────────────────────────────
   כל כפתור עזרה מכיל data-popup="<popup-id>" שמצביע על
   אלמנט הפופ-אפ שלו. פופ-אפ יחיד פעיל בכל רגע.
─────────────────────────────────────────────────────── */
function initHelpButtons() {
  document.querySelectorAll('.help-btn[data-popup]').forEach(btn => {
    btn.addEventListener('click', () => toggleHelpPopup(btn));
  });
}

function toggleHelpPopup(btn) {
  const popupId = btn.dataset.popup;
  const popup = document.getElementById(popupId);
  if (!popup) return;
  const isOpen = !popup.classList.contains('hidden');

  // סגור את כל הפופ-אפים ואפס כל כפתורי עזרה
  closeAllPopups();

  if (!isOpen) {
    popup.classList.remove('hidden');
    btn.classList.add('is-open');
  }
}

function closeAllPopups() {
  document.querySelectorAll('.help-popup').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.help-btn').forEach(b => b.classList.remove('is-open'));
}

/* ─── Screen 3: Submit button — גלוי רק כשכל השדות מלאים ── */
function initSubmitButton() {
  ['timer1', 'timer2', 'timer3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateSubmitVisibility);
  });
}

function updateSubmitVisibility() {
  const btn = document.getElementById('submit-btn');
  if (!btn || btn.disabled) return;
  const allFilled = ['timer1', 'timer2', 'timer3'].every(id => {
    const el = document.getElementById(id);
    return el && el.value.trim() !== '' && !isNaN(parseInt(el.value, 10));
  });
  btn.classList.toggle('hidden', !allFilled);
}

/* ─── Screen 3: Answer Validation — 2 ניסיונות ────────────
   ניסיון 1 + שגוי  → הודעת "נסו שוב" inline בלבד
   ניסיון 2 + שגוי  → feedback-incorrect + מילוי תשובות נכונות
   נכון (כל ניסיון) → feedback-correct
   אחרי feedback: כפתור מושבת
─────────────────────────────────────────────────────── */
function checkAnswers() {
  if (attemptCount >= MAX_ATTEMPTS) return;

  const t1 = parseAnswer(document.getElementById('timer1').value);
  const t2 = parseAnswer(document.getElementById('timer2').value);
  const t3 = parseAnswer(document.getElementById('timer3').value);

  if (isNaN(t1) || isNaN(t2) || isNaN(t3)) {
    highlightEmptyFields(t1, t2, t3);
    return;
  }

  attemptCount++;

  const isCorrect =
    t1 === CORRECT_ANSWERS.timer1 &&
    t2 === CORRECT_ANSWERS.timer2 &&
    t3 === CORRECT_ANSWERS.timer3;

  if (isCorrect) {
    colorInput('timer1', true);
    colorInput('timer2', true);
    colorInput('timer3', true);
    // מסתיר "נסו שוב" אם הופיע בניסיון קודם
    const msgOk = document.getElementById('try-again-msg');
    if (msgOk) msgOk.classList.add('hidden');
    showFeedback('correct');
    scoreCorrect_q1b = true;
    disableSubmit();
    return;
  }

  // תשובה שגויה
  if (attemptCount >= MAX_ATTEMPTS) {
    // ניסיון 2 שגוי — feedback מלא + מילוי תשובות נכונות
    // מסתיר את הודעת "נסו שוב" שהופיעה בניסיון 1
    const tryAgainMsg = document.getElementById('try-again-msg');
    if (tryAgainMsg) tryAgainMsg.classList.add('hidden');
    colorInput('timer1', t1 === CORRECT_ANSWERS.timer1);
    colorInput('timer2', t2 === CORRECT_ANSWERS.timer2);
    colorInput('timer3', t3 === CORRECT_ANSWERS.timer3);
    prefillAnswers();
    showFeedback('incorrect');
    disableSubmit();
  } else {
    // ניסיון 1 שגוי — הודעה inline בלבד, השדות נאפסים לניסיון חוזר
    const msg = document.getElementById('try-again-msg');
    if (msg) msg.classList.remove('hidden');
    // איפוס צבעי השדות לכניסה מחדש
    ['timer1', 'timer2', 'timer3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('correct', 'incorrect');
    });
  }
}

function disableSubmit() {
  screen3Done = true;  // נועל את מסך 3 — לא יאופס בחזרה
  const btn = document.getElementById('submit-btn');
  if (btn) {
    btn.disabled = true;
    btn.classList.add('hidden');
  }
  // נועל את שדות הקלט — לא ניתן לערוך אחרי חשיפת התשובה
  ['timer1', 'timer2', 'timer3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });
  const nextBtn = document.getElementById('next-s3');
  if (nextBtn) nextBtn.classList.remove('hidden');
}

function colorInput(id, isCorrect) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('correct', 'incorrect');
  el.classList.add(isCorrect ? 'correct' : 'incorrect');
}

function highlightEmptyFields(t1, t2, t3) {
  if (isNaN(t1)) shakeInput('timer1');
  if (isNaN(t2)) shakeInput('timer2');
  if (isNaN(t3)) shakeInput('timer3');
}

function shakeInput(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'shake 0.4s ease';
}

function showFeedback(type) {
  const correct   = document.getElementById('feedback-correct');
  const incorrect = document.getElementById('feedback-incorrect');
  correct.classList.add('hidden');
  incorrect.classList.add('hidden');
  const panel = type === 'correct' ? correct : incorrect;
  panel.classList.remove('hidden');
}

function prefillAnswers() {
  for (const [id, val] of Object.entries(CORRECT_ANSWERS)) {
    const el = document.getElementById(id);
    if (el) {
      el.value = val;
      el.classList.remove('correct', 'incorrect');
      el.classList.add('correct');
    }
  }
}

/* ─── (Time Management Widget zoom modal removed —
       the widget is now a local in-page widget; no iframe to zoom.) ─── */

/* ─── Keyboard Navigation ───────────────────────────────── */
function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    // אל תנווט בזמן שהמשתמש מקליד בשדה קלט
    const tag = e.target.tagName;
    const isEditable = (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable);

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        if (isEditable) break;
        // Presentation convention: right/up = next slide (regardless of RTL)
        goTo(currentScreen + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        if (isEditable) break;
        goTo(currentScreen - 1);
        break;
      case 'Escape':
        closeAllPopups();
        break;
    }
  });
}

/* ─── Screen 4 (Frame 5): Answer Validation ────────────────
   שאלה יחידה: פרק בסדרה = 40% × 105 = 42 דקות.
   מנגנון זהה לScreen 3 אך עם שדה יחיד ופידבק בפאנל שמאל.
─────────────────────────────────────────────────────── */
const CORRECT_ANSWER_S4 = 42;
let attemptCountS4 = 0;

function initSubmitButtonS4() {
  const el = document.getElementById('timer-s4');
  if (el) el.addEventListener('input', updateSubmitVisibilityS4);
}

function updateSubmitVisibilityS4() {
  const btn = document.getElementById('submit-btn-s4');
  if (!btn || btn.disabled) return;
  const el = document.getElementById('timer-s4');
  const filled = el && el.value.trim() !== '' && !isNaN(parseInt(el.value, 10));
  btn.classList.toggle('hidden', !filled);
}

function checkAnswersS4() {
  if (attemptCountS4 >= MAX_ATTEMPTS) return;

  const t = parseAnswer(document.getElementById('timer-s4').value);
  if (isNaN(t)) { shakeInput('timer-s4'); return; }

  attemptCountS4++;
  const isCorrect = (t === CORRECT_ANSWER_S4);

  if (isCorrect) {
    colorInput('timer-s4', true);
    document.getElementById('try-again-msg-s4')?.classList.add('hidden');
    showFeedbackS4('correct');
    scoreCorrect_q2 = true;
    disableSubmitS4();
    return;
  }

  if (attemptCountS4 >= MAX_ATTEMPTS) {
    // ניסיון 2 שגוי — פידבק מלא + מילוי תשובה נכונה
    document.getElementById('try-again-msg-s4')?.classList.add('hidden');
    colorInput('timer-s4', false);
    // prefill תשובה נכונה
    const el = document.getElementById('timer-s4');
    if (el) { el.value = CORRECT_ANSWER_S4; el.classList.remove('correct', 'incorrect'); el.classList.add('correct'); }
    showFeedbackS4('incorrect');
    disableSubmitS4();
  } else {
    // ניסיון 1 שגוי — הודעה inline בלבד
    document.getElementById('try-again-msg-s4')?.classList.remove('hidden');
    document.getElementById('timer-s4')?.classList.remove('correct', 'incorrect');
  }
}

function showFeedbackS4(type) {
  document.getElementById('feedback-s4-correct').classList.add('hidden');
  document.getElementById('feedback-s4-incorrect').classList.add('hidden');
  const panel = type === 'correct'
    ? document.getElementById('feedback-s4-correct')
    : document.getElementById('feedback-s4-incorrect');
  panel.classList.remove('hidden');
}

function disableSubmitS4() {
  screen4Done = true;  // נועל את מסך 4 — לא יאופס בחזרה
  const btn = document.getElementById('submit-btn-s4');
  if (btn) { btn.disabled = true; btn.classList.add('hidden'); }
  // נועל את שדה הקלט — לא ניתן לערוך אחרי חשיפת התשובה
  const timerEl = document.getElementById('timer-s4');
  if (timerEl) timerEl.disabled = true;
  const nextBtn = document.getElementById('next-s4');
  if (nextBtn) nextBtn.classList.remove('hidden');
}

/* ─── Screen 5 (Frame 6): Ofri WhatsApp animation ───────────
   ביקור ראשון: כל הודעה מופיעה בתורה עם float-in + צליל.
   ביקור חוזר:  כל ההודעות מופיעות מיד, ללא אנימציה.
─────────────────────────────────────────────────────── */
function enterFrame6() {
  const msgIds = ['ofri-m1', 'ofri-m2', 'ofri-m3', 'ofri-m4'];

  if (frame6Seen) {
    // ביקור חוזר — הצג הכל מיד
    msgIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.style.animation = 'none'; el.classList.remove('hidden'); }
    });
    return;
  }

  // ביקור ראשון — אנימציית float-in בתורה
  msgIds.forEach(id => document.getElementById(id)?.classList.add('hidden'));

  const delays = [600, 2100, 3600, 5100]; // ms per message

  msgIds.forEach((id, i) => {
    setTimeout(() => {
      if (currentScreen !== 5) return; // המשתמש עזב את המסך
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('hidden');
      // reset ← play animation
      el.style.animation = 'none';
      el.offsetHeight;   // force reflow
      el.style.animation = 'floatIn 0.6s ease forwards';
      // צליל WhatsApp
      new Audio('assets/audio/whatsapp_message_3.mp3').play().catch(() => {});
    }, delays[i]);
  });

  frame6Seen = true;
}

/* ─── Screen 8 (Frame 9): Calendar notification ─────────── */
function enterFrame9() {
  const el = document.getElementById('f9-m1');

  if (frame9Seen) {
    // ביקור חוזר — הצג מיד ללא אנימציה
    if (el) { el.style.animation = 'none'; el.classList.remove('hidden'); }
    return;
  }

  // ביקור ראשון — אנימציית float-in אחרי 1 שנייה
  if (el) el.classList.add('hidden');

  setTimeout(() => {
    if (currentScreen !== 8) return;
    if (!el) return;
    el.classList.remove('hidden');
    el.style.animation = 'none';
    el.offsetHeight;   // force reflow
    el.style.animation = 'floatIn 0.6s ease forwards';
    new Audio('assets/audio/whatsapp_message_3.mp3').play().catch(() => {});
  }, 1000);

  frame9Seen = true;
}

/* ─── Radio buttons — Screens 6 & 7 (Q3A / Q3B) ─────────── */

/** Update radio button icon and label color */
function setRadioVisual(screen, optId, state) {
  const icon  = document.getElementById(`${screen}-icon-${optId}`);
  const label = document.getElementById(`${screen}-label-${optId}`);
  const wrap  = icon?.parentElement;  // .radio-icon-wrap
  if (!icon || !label) return;

  icon.src = `assets/images/radio-${state}.svg`;

  /* toggle size classes per state (Figma: normal=20×20, selected/incorrect=20×21, correct=20×15) */
  if (wrap) {
    wrap.classList.toggle('is-correct',   state === 'correct');
    wrap.classList.toggle('is-selected',  state === 'selected');
    wrap.classList.toggle('is-incorrect', state === 'incorrect');
  }

  label.className = 'radio-label';
  if (state === 'correct')   label.classList.add('radio-correct-text');
  if (state === 'incorrect') label.classList.add('radio-incorrect-text');
}

/** User clicks a radio option */
function radioClick(screen, value) {
  if (screen === 's6'  && screen6Done)  return;
  if (screen === 's7'  && screen7Done)  return;
  if (screen === 's9'  && screen9Done)  return;
  if (screen === 's15' && screen15Done) return;

  // Reset all options for this screen then highlight selected
  const options = RADIO_OPTIONS[screen] || [];
  options.forEach(opt =>
    setRadioVisual(screen, opt, opt === value ? 'selected' : 'normal'));

  if      (screen === 's6')  s6Selection  = value;
  else if (screen === 's7')  s7Selection  = value;
  else if (screen === 's9')  s9Selection  = value;
  else if (screen === 's15') s15Selection = value;

  // Show submit button once something is selected
  const btn = document.getElementById(`submit-btn-${screen}`);
  if (btn && !btn.disabled) btn.classList.remove('hidden');
}

/** Check Q3A answer */
function checkAnswersS6() {
  if (attemptCountS6 >= MAX_ATTEMPTS) return;
  if (!s6Selection) return;

  attemptCountS6++;
  const isCorrect = (s6Selection === CORRECT_ANSWER_S6);

  if (isCorrect) {
    setRadioVisual('s6', s6Selection, 'correct');
    document.getElementById('try-again-msg-s6')?.classList.add('hidden');
    _showFeedbackRadio('s6', 'correct');
    scoreCorrect_q3a = true;
    disableSubmitS6();
  } else if (attemptCountS6 >= MAX_ATTEMPTS) {
    // Second wrong attempt — mark selected wrong, reveal correct, leave 3rd neutral
    const wrongId = s6Selection;
    ['yes', 'no', 'dontknow'].forEach(opt => {
      if (opt === CORRECT_ANSWER_S6) setRadioVisual('s6', opt, 'correct');
      else if (opt === wrongId)      setRadioVisual('s6', opt, 'incorrect');
      // else: leave normal (not selected, not correct)
    });
    document.getElementById('try-again-msg-s6')?.classList.add('hidden');
    _showFeedbackRadio('s6', 'incorrect');
    disableSubmitS6();
  } else {
    // First wrong attempt — show message, keep selection highlighted + submit visible
    document.getElementById('try-again-msg-s6')?.classList.remove('hidden');
    // Selection stays (s6Selection unchanged), submit button stays visible
    // so the learner can choose again and re-submit
  }
}

/** Check Q3B answer */
function checkAnswersS7() {
  if (attemptCountS7 >= MAX_ATTEMPTS) return;
  if (!s7Selection) return;

  attemptCountS7++;
  const isCorrect = (s7Selection === CORRECT_ANSWER_S7);

  if (isCorrect) {
    setRadioVisual('s7', s7Selection, 'correct');
    document.getElementById('try-again-msg-s7')?.classList.add('hidden');
    _showFeedbackRadio('s7', 'correct');
    scoreCorrect_q3b = true;
    disableSubmitS7();
  } else if (attemptCountS7 >= MAX_ATTEMPTS) {
    // Second wrong attempt — mark selected wrong, reveal correct, leave 3rd neutral
    const wrongId = s7Selection;
    ['yes', 'no', 'dontknow'].forEach(opt => {
      if (opt === CORRECT_ANSWER_S7) setRadioVisual('s7', opt, 'correct');
      else if (opt === wrongId)      setRadioVisual('s7', opt, 'incorrect');
    });
    document.getElementById('try-again-msg-s7')?.classList.add('hidden');
    _showFeedbackRadio('s7', 'incorrect');
    disableSubmitS7();
  } else {
    // First wrong attempt — show message, keep selection highlighted + submit visible
    document.getElementById('try-again-msg-s7')?.classList.remove('hidden');
    // Selection stays, submit stays visible so learner can choose again
  }
}

function _showFeedbackRadio(screen, type) {
  document.getElementById(`feedback-${screen}-correct`)?.classList.add('hidden');
  document.getElementById(`feedback-${screen}-incorrect`)?.classList.add('hidden');
  document.getElementById(`feedback-${screen}-${type}`)?.classList.remove('hidden');
}

function disableSubmitS6() {
  screen6Done = true;
  const btn = document.getElementById('submit-btn-s6');
  if (btn) { btn.disabled = true; btn.classList.add('hidden'); }
  ['s6-radio-yes', 's6-radio-no', 's6-radio-dontknow'].forEach(id =>
    document.getElementById(id)?.classList.add('disabled'));
  document.getElementById('next-s6')?.classList.remove('hidden');
}

function disableSubmitS7() {
  screen7Done = true;
  const btn = document.getElementById('submit-btn-s7');
  if (btn) { btn.disabled = true; btn.classList.add('hidden'); }
  ['s7-radio-yes', 's7-radio-no', 's7-radio-dontknow'].forEach(id =>
    document.getElementById(id)?.classList.add('disabled'));
  document.getElementById('next-s7')?.classList.remove('hidden');
}

/* ─── Screen 9 (Frame 10): Q4 — full-width radio ────────── */

function checkAnswersS9() {
  if (attemptCountS9 >= MAX_ATTEMPTS) return;
  if (!s9Selection) return;

  attemptCountS9++;
  const isCorrect = (s9Selection === CORRECT_ANSWER_S9);

  if (isCorrect) {
    setRadioVisual('s9', s9Selection, 'correct');
    document.getElementById('try-again-msg-s9')?.classList.add('hidden');
    _showFeedbackRadio('s9', 'correct');
    scoreCorrect_q4 = true;
    disableSubmitS9();
  } else if (attemptCountS9 >= MAX_ATTEMPTS) {
    // 2nd wrong attempt — mark selected wrong, reveal correct, leave others normal
    const wrongId = s9Selection;
    RADIO_OPTIONS['s9'].forEach(opt => {
      if (opt === CORRECT_ANSWER_S9) setRadioVisual('s9', opt, 'correct');
      else if (opt === wrongId)      setRadioVisual('s9', opt, 'incorrect');
      // else: leave normal
    });
    document.getElementById('try-again-msg-s9')?.classList.add('hidden');
    _showFeedbackRadio('s9', 'incorrect');
    disableSubmitS9();
  } else {
    // 1st wrong attempt — show message, keep selection highlighted + submit visible
    document.getElementById('try-again-msg-s9')?.classList.remove('hidden');
    // Selection stays (s9Selection unchanged), submit stays visible so learner can try again
    // NOT hiding submit → try-again text position stays fixed when learner changes selection
  }
}

function disableSubmitS9() {
  screen9Done = true;
  const btn = document.getElementById('submit-btn-s9');
  if (btn) { btn.disabled = true; btn.classList.add('hidden'); }
  ['s9-radio-a', 's9-radio-b', 's9-radio-c', 's9-radio-d'].forEach(id =>
    document.getElementById(id)?.classList.add('disabled'));
  document.getElementById('next-s9')?.classList.remove('hidden');
}

/* ─── Dev mode: postMessage bridge ─────────────────────── */
// מאפשר ל-index_dev.html לשלוט בניווט דרך postMessage
// (עובד גם כש-Chrome חוסם גישה ישירה ל-contentWindow בפרוטוקול file://)
window.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'DEV_GOTO') return;
  const n = parseInt(e.data.screen, 10);
  if (!isNaN(n)) goTo(n);
});

// מודיע לחלון ההורה כמה מסכים יש (לעדכון ה-dev bar)
if (window.parent !== window) {
  const screenCount = document.querySelectorAll('.screen').length;
  window.parent.postMessage({ type: 'DEV_READY', total: screenCount }, '*');
}

/* ─── CSS animation for shake ───────────────────────────── */
(function injectShakeCSS() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%       { transform: translateX(-6px); }
      40%       { transform: translateX(6px); }
      60%       { transform: translateX(-4px); }
      80%       { transform: translateX(4px); }
    }
  `;
  document.head.appendChild(style);
})();

/* ═══════════════════════════════════════════════════════════
   SCREEN 11 (Frame 12): Q5A — input + graph
   תשובה נכונה: 400 (60 נטו + 20 הליכה = 80 ברוטו = 20% × 400)
   ═══════════════════════════════════════════════════════════ */

let screen11Done    = false;
let attemptCountS11 = 0;
const CORRECT_S11   = 400;

/* מציג כפתור Submit ברגע שיש ערך בשדה */
document.getElementById('s11-input')?.addEventListener('input', () => {
  const btn = document.getElementById('submit-btn-s11');
  if (!btn || btn.disabled) return;
  const val = document.getElementById('s11-input').value.trim();
  btn.classList.toggle('hidden', val === '' || isNaN(parseInt(val, 10)));
});

function checkAnswersS11() {
  if (screen11Done) return;
  if (attemptCountS11 >= MAX_ATTEMPTS) return;

  const inp = document.getElementById('s11-input');
  const val = parseInt(inp?.value, 10);
  if (isNaN(val)) return;

  attemptCountS11++;
  const isCorrect = (val === CORRECT_S11);

  if (isCorrect) {
    inp.classList.add('correct');
    document.getElementById('try-again-msg-s11')?.classList.add('hidden');
    scoreCorrect_q5a = true;
    disableSubmitS11('correct');
  } else if (attemptCountS11 >= MAX_ATTEMPTS) {
    // ניסיון שני שגוי — ממלא תשובה נכונה + מציג CORRECT (ירוק), לא INCORRECT
    inp.value = CORRECT_S11;
    inp.classList.remove('incorrect');
    inp.classList.add('correct');
    document.getElementById('try-again-msg-s11')?.classList.add('hidden');
    disableSubmitS11('incorrect');  // פאנל הפידבק עדיין "incorrect", רק השדה מציג ירוק
  } else {
    // ניסיון ראשון שגוי — הודעת try-again, כפתור נשאר גלוי
    document.getElementById('try-again-msg-s11')?.classList.remove('hidden');
    // הכפתור נשאר גלוי והשדה פתוח לניסיון נוסף
  }
}

function disableSubmitS11(feedbackType) {
  screen11Done = true;
  const btn = document.getElementById('submit-btn-s11');
  if (btn) { btn.disabled = true; btn.classList.add('hidden'); }
  const inp = document.getElementById('s11-input');
  if (inp) inp.disabled = true;
  document.getElementById('next-s11')?.classList.remove('hidden');

  // מסמן את נקודת התשובה (80,400) על גרף Q5A (ממוקדת ב-#graph-card)
  const answerDot = document.querySelector('#graph-card .gp[data-answer="true"]');
  if (answerDot) {
    answerDot.classList.add(feedbackType === 'correct' ? 'is-correct' : 'is-incorrect');
  }

  // הסתר dot (Ellipse 3) + טקסט הסבר כשמופיע פידבק
  document.querySelector('[data-screen="11"] .s11-dot-bullet')?.classList.add('hidden');
  document.querySelector('[data-screen="11"] .s11-graph-note')?.classList.add('hidden');

  // מציג פאנל פידבק מתאים
  const panelCorrect   = document.getElementById('feedback-s11-correct');
  const panelIncorrect = document.getElementById('feedback-s11-incorrect');
  if (feedbackType === 'correct') {
    panelCorrect?.classList.remove('hidden');
  } else {
    panelIncorrect?.classList.remove('hidden');
  }
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 12 (Frame 13): Q5B — input + graph
   תשובה נכונה: 50 דקות נטו (70 ברוטו − 20 הליכה)
   ═══════════════════════════════════════════════════════════ */

let screen12Done    = false;
let attemptCountS12 = 0;
const CORRECT_S12   = 50;

/* מציג כפתור Submit ברגע שיש ערך בשדה */
document.getElementById('s12-input')?.addEventListener('input', () => {
  const btn = document.getElementById('submit-btn-s12');
  if (!btn || btn.disabled) return;
  const val = document.getElementById('s12-input').value.trim();
  btn.classList.toggle('hidden', val === '' || isNaN(parseInt(val, 10)));
});

function checkAnswersS12() {
  if (screen12Done) return;
  if (attemptCountS12 >= MAX_ATTEMPTS) return;

  const inp = document.getElementById('s12-input');
  const val = parseInt(inp?.value, 10);
  if (isNaN(val)) return;

  attemptCountS12++;
  const isCorrect = (val === CORRECT_S12);

  if (isCorrect) {
    inp.classList.add('correct');
    document.getElementById('try-again-msg-s12')?.classList.add('hidden');
    scoreCorrect_q5b = true;
    disableSubmitS12('correct');
  } else if (attemptCountS12 >= MAX_ATTEMPTS) {
    // ניסיון שני שגוי — ממלא תשובה נכונה + מציג CORRECT (ירוק), לא INCORRECT
    inp.value = CORRECT_S12;
    inp.classList.remove('incorrect');
    inp.classList.add('correct');
    document.getElementById('try-again-msg-s12')?.classList.add('hidden');
    disableSubmitS12('incorrect');  // פאנל הפידבק עדיין "incorrect", רק השדה מציג ירוק
  } else {
    // ניסיון ראשון שגוי — הודעת try-again בלבד
    document.getElementById('try-again-msg-s12')?.classList.remove('hidden');
  }
}

function disableSubmitS12(feedbackType) {
  screen12Done = true;
  const btn = document.getElementById('submit-btn-s12');
  if (btn) { btn.disabled = true; btn.classList.add('hidden'); }
  const inp = document.getElementById('s12-input');
  if (inp) inp.disabled = true;
  document.getElementById('next-s12')?.classList.remove('hidden');

  // מסמן את נקודת התשובה (70,350) על גרף Q5B
  const answerDot = document.querySelector('#graph-card-s12 .gp[data-answer="true"]');
  if (answerDot) {
    answerDot.classList.add(feedbackType === 'correct' ? 'is-correct' : 'is-incorrect');
  }

  // הסתר dot (Ellipse 3) + טקסט הסבר כשמופיע פידבק
  document.querySelector('[data-screen="12"] .s11-dot-bullet')?.classList.add('hidden');
  document.querySelector('[data-screen="12"] .s11-graph-note')?.classList.add('hidden');

  // מציג פאנל פידבק מתאים
  document.getElementById(`feedback-s12-${feedbackType}`)?.classList.remove('hidden');
}

/* ═══ Graph: interactive data points + projection lines ══════
   axis constants (pixel coords within 589×513 card):
     Y-axis (x=0): cx at x=10 is 137, step per 10 units ≈ 45.3px → x=0 ≈ 92
     X-axis (y=0): cy at y=50 is 419, step per 50 units ≈ 48.9px → y=0 ≈ 468
   ══════════════════════════════════════════════════════════ */
const GP_YAXIS_X = 92;
const GP_XAXIS_Y = 468;

function initGraphPoints() {
  document.querySelectorAll('.gp').forEach(gp => {
    gp.addEventListener('mouseenter', () => {
      // מוצא את קווי ההטלה של הגרף הספציפי שמכיל את הנקודה
      const card = gp.closest('.graph-card');
      const projH = card?.querySelector('.gp-proj-h');
      const projV = card?.querySelector('.gp-proj-v');
      showProjection(parseInt(gp.dataset.cx), parseInt(gp.dataset.cy), projH, projV);
    });
    gp.addEventListener('mouseleave', () => {
      const card = gp.closest('.graph-card');
      const projH = card?.querySelector('.gp-proj-h');
      const projV = card?.querySelector('.gp-proj-v');
      hideProjection(projH, projV);
    });
  });
}

function showProjection(cx, cy, projH, projV) {
  if (!projH || !projV) return;
  // קו אופקי: מציר Y עד מרכז הנקודה
  projH.style.left  = GP_YAXIS_X + 'px';
  projH.style.top   = cy + 'px';
  projH.style.width = (cx - GP_YAXIS_X) + 'px';
  projH.classList.remove('hidden');
  // קו אנכי: ממרכז הנקודה עד ציר X
  projV.style.left   = cx + 'px';
  projV.style.top    = cy + 'px';
  projV.style.height = (GP_XAXIS_Y - cy) + 'px';
  projV.classList.remove('hidden');
}

/* ללא ארגומנטים — מסתיר את כל קווי ההטלה בכל הגרפים */
function hideProjection(projH, projV) {
  if (projH && projV) {
    projH.classList.add('hidden');
    projV.classList.add('hidden');
  } else {
    document.querySelectorAll('.gp-proj-h, .gp-proj-v').forEach(el => el.classList.add('hidden'));
  }
}

/* ─── Graph Zoom: in-place approach (כמו TMW widget) ────────
   הכרטיסייה נשארת במיקומה ב-DOM — רק class is-zoomed מתווסף/מוסר.
   CSS zoom:1.7 מגדיל את הגרף בלי overlay, בלי חשיכת רקע,
   ובלי כיסוי השאלה שמשמאל.
   חל על שלוש כרטיסיות: graph-card / graph-card-s12 / graph-card-s13
   ──────────────────────────────────────────────────────── */
let zoomedCardId = null;

function openGraphZoom(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;
  zoomedCardId = cardId;
  card.classList.add('is-zoomed');
  const zoomImg = card.querySelector('.graph-zoom-btn img');
  if (zoomImg) zoomImg.src = 'assets/images/btn-zoom-out.png';
}

function closeGraphZoom() {
  if (!zoomedCardId) return;
  const card = document.getElementById(zoomedCardId);
  if (!card) return;
  card.classList.remove('is-zoomed');
  hideProjection();
  const zoomImg = card.querySelector('.graph-zoom-btn img');
  if (zoomImg) zoomImg.src = 'assets/images/btn-zoom-in.png';
  zoomedCardId = null;
}

function toggleGraphZoom(cardId = 'graph-card') {
  const card = document.getElementById(cardId);
  if (!card) return;
  card.classList.contains('is-zoomed')
    ? closeGraphZoom()
    : openGraphZoom(cardId);
}

/* סגור graph zoom עם Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeGraphZoom();
});

/* הפעל נקודות גרף לאחר טעינת ה-DOM */
initGraphPoints();

/* ═══════════════════════════════════════════════════════════
   SCREEN 13 (Q5C) — multi-select: select exactly (20,100) and (10,50)
   ═══════════════════════════════════════════════════════════ */

function initS13MultiSelect() {
  if (s13MultiSelectInited) return;
  s13MultiSelectInited = true;

  document.querySelectorAll('#graph-card-s13 .s13-gp').forEach(gp => {
    gp.addEventListener('click', () => {
      if (screen13Done) return;
      gp.classList.toggle('is-selected');
      const selected = document.querySelectorAll('#graph-card-s13 .s13-gp.is-selected');
      const btn = document.getElementById('submit-btn-s13');
      if (btn && !btn.disabled) {
        btn.classList.toggle('hidden', selected.length === 0);
      }
    });
  });
}

function checkAnswersS13() {
  if (screen13Done) return;
  if (attemptCountS13 >= MAX_ATTEMPTS) return;

  const selected = Array.from(
    document.querySelectorAll('#graph-card-s13 .s13-gp.is-selected'));
  if (selected.length === 0) return;

  attemptCountS13++;

  // תשובה נכונה: בדיוק שתי הנקודות עם data-answer="true"
  const answerDots = Array.from(
    document.querySelectorAll('#graph-card-s13 .s13-gp[data-answer="true"]'));
  const selectedSet = new Set(selected);
  const answerSet   = new Set(answerDots);
  const isCorrect   =
    selectedSet.size === answerSet.size &&
    [...answerSet].every(d => selectedSet.has(d));

  if (isCorrect) {
    answerDots.forEach(d => d.classList.add('is-correct'));
    document.getElementById('try-again-msg-s13')?.classList.add('hidden');
    scoreCorrect_q5c = true;
    disableSubmitS13('correct');
  } else if (attemptCountS13 >= MAX_ATTEMPTS) {
    // ניסיון 2 שגוי — מסמן נכון/שגוי + ממלא תשובות נכונות
    document.getElementById('try-again-msg-s13')?.classList.add('hidden');
    document.querySelectorAll('#graph-card-s13 .s13-gp').forEach(d => {
      const isAnswer = d.dataset.answer === 'true';
      const wasSelected = selectedSet.has(d);
      d.classList.remove('is-selected');
      if (isAnswer) {
        d.classList.add('is-correct');
      } else if (wasSelected) {
        d.classList.add('is-incorrect');
      }
    });
    disableSubmitS13('incorrect');
  } else {
    // ניסיון 1 שגוי — הודעת try-again, נקודות נאפסות לבחירה מחדש
    document.getElementById('try-again-msg-s13')?.classList.remove('hidden');
    document.querySelectorAll('#graph-card-s13 .s13-gp').forEach(d =>
      d.classList.remove('is-selected'));
  }
}

function disableSubmitS13(feedbackType) {
  screen13Done = true;
  const btn = document.getElementById('submit-btn-s13');
  if (btn) { btn.disabled = true; btn.classList.add('hidden'); }
  document.getElementById('next-s13')?.classList.remove('hidden');

  // הסתר wrapper שכולל dot (Ellipse 3) + טקסט הסבר כשמופיע פידבק
  document.querySelector('.s13-note-wrapper')?.classList.add('hidden');

  if (feedbackType === 'correct') {
    document.getElementById('feedback-s13-correct')?.classList.remove('hidden');
  } else {
    document.getElementById('feedback-s13-incorrect')?.classList.remove('hidden');
  }
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 15 (Q6) — radio: correct = 'c' (126 דקות)
   ═══════════════════════════════════════════════════════════ */

function checkAnswersS15() {
  if (screen15Done) return;
  if (attemptCountS15 >= MAX_ATTEMPTS) return;
  if (!s15Selection) return;

  attemptCountS15++;
  const isCorrect = (s15Selection === CORRECT_ANSWER_S15);

  if (isCorrect) {
    setRadioVisual('s15', s15Selection, 'correct');
    document.getElementById('try-again-msg-s15')?.classList.add('hidden');
    _showFeedbackRadio('s15', 'correct');
    scoreCorrect_q6 = true;
    disableSubmitS15();
  } else if (attemptCountS15 >= MAX_ATTEMPTS) {
    // ניסיון 2 שגוי — מסמן שגוי + חושף נכון
    const wrongId = s15Selection;
    RADIO_OPTIONS['s15'].forEach(opt => {
      if (opt === CORRECT_ANSWER_S15) setRadioVisual('s15', opt, 'correct');
      else if (opt === wrongId)       setRadioVisual('s15', opt, 'incorrect');
    });
    document.getElementById('try-again-msg-s15')?.classList.add('hidden');
    _showFeedbackRadio('s15', 'incorrect');
    disableSubmitS15();
  } else {
    // ניסיון 1 שגוי — הודעה inline, בחירה נשארת
    document.getElementById('try-again-msg-s15')?.classList.remove('hidden');
  }
}

function disableSubmitS15() {
  screen15Done = true;
  const btn = document.getElementById('submit-btn-s15');
  if (btn) { btn.disabled = true; btn.classList.add('hidden'); }
  ['s15-radio-a', 's15-radio-b', 's15-radio-c', 's15-radio-d'].forEach(id =>
    document.getElementById(id)?.classList.add('disabled'));
  document.getElementById('next-s15')?.classList.remove('hidden');
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 17 (Q8) — custom dropdowns
   dropdown1: correct = '35%'
   dropdown2: correct = 'לא משתנה'
   ═══════════════════════════════════════════════════════════ */

function toggleDropdownMenu(screenNum, ddNum) {
  const listEl = document.getElementById(`dd${ddNum}-list`);
  const btnEl  = document.getElementById(`dd${ddNum}-btn`);
  if (!listEl) return;
  const isOpen = !listEl.classList.contains('hidden');
  // סגור את כל הרשימות תחילה
  ['dd1-list', 'dd2-list'].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
  });
  document.querySelectorAll('.s17-dropdown-btn').forEach(b =>
    b.setAttribute('aria-expanded', 'false'));
  if (!isOpen) {
    listEl.classList.remove('hidden');
    btnEl?.setAttribute('aria-expanded', 'true');
  }
}

function selectDropdown(screenNum, ddNum, value) {
  const valueEl = document.getElementById(`dd${ddNum}-value`);
  const listEl  = document.getElementById(`dd${ddNum}-list`);
  const btnEl   = document.getElementById(`dd${ddNum}-btn`);
  if (valueEl) valueEl.textContent = value;
  if (listEl)  listEl.classList.add('hidden');
  if (btnEl)   btnEl.setAttribute('aria-expanded', 'false');

  if (ddNum === 1) s17dd1Selection = value;
  if (ddNum === 2) s17dd2Selection = value;

  // הצג כפתור submit אם שני ה-dropdowns מלאים
  const btn = document.getElementById('submit-btn-s17');
  if (btn && !btn.disabled) {
    btn.classList.toggle('hidden', !s17dd1Selection || !s17dd2Selection);
  }
}

// סגור dropdown בלחיצה מחוץ לו
document.addEventListener('click', (e) => {
  if (!e.target.closest('.s17-dropdown-wrap')) {
    ['dd1-list', 'dd2-list'].forEach(id =>
      document.getElementById(id)?.classList.add('hidden'));
    document.querySelectorAll('.s17-dropdown-btn').forEach(b =>
      b.setAttribute('aria-expanded', 'false'));
  }
});

function checkAnswersS17() {
  if (screen17Done) return;
  if (attemptCountS17 >= MAX_ATTEMPTS) return;
  if (!s17dd1Selection || !s17dd2Selection) return;

  attemptCountS17++;
  const isCorrect = (s17dd1Selection === CORRECT_DD1) && (s17dd2Selection === CORRECT_DD2);

  if (isCorrect) {
    _colorDropdown(1, true);
    _colorDropdown(2, true);
    document.getElementById('try-again-msg-s17')?.classList.add('hidden');
    document.getElementById('feedback-s17-correct')?.classList.remove('hidden');
    scoreCorrect_q8 = true;
    disableSubmitS17();
  } else if (attemptCountS17 >= MAX_ATTEMPTS) {
    // ניסיון 2 שגוי — מסמן + ממלא תשובות נכונות
    document.getElementById('try-again-msg-s17')?.classList.add('hidden');
    _colorDropdown(1, s17dd1Selection === CORRECT_DD1);
    _colorDropdown(2, s17dd2Selection === CORRECT_DD2);
    // מלא תשובות נכונות
    const dd1Val = document.getElementById('dd1-value');
    const dd2Val = document.getElementById('dd2-value');
    if (dd1Val) dd1Val.textContent = CORRECT_DD1;
    if (dd2Val) dd2Val.textContent = CORRECT_DD2;
    document.getElementById('feedback-s17-incorrect')?.classList.remove('hidden');
    disableSubmitS17();
  } else {
    // ניסיון 1 שגוי — הודעה inline בלבד
    document.getElementById('try-again-msg-s17')?.classList.remove('hidden');
  }
}

function _colorDropdown(ddNum, isCorrect) {
  const btn = document.getElementById(`dd${ddNum}-btn`);
  if (!btn) return;
  btn.classList.remove('correct', 'incorrect');
  btn.classList.add(isCorrect ? 'correct' : 'incorrect');
}

function disableSubmitS17() {
  screen17Done = true;
  const btn = document.getElementById('submit-btn-s17');
  if (btn) { btn.disabled = true; btn.classList.add('hidden'); }
  // נועל את ה-dropdowns
  ['dd1-btn', 'dd2-btn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });
  document.getElementById('next-s17')?.classList.remove('hidden');
}

/* ═══════════════════════════════════════════════════════════
   SCORING — חישוב ציון סופי
   7 שאלות × 100/7 נקודות כל אחת.
   שאלות עם כמה סעיפים: הניקוד מתחלק שווה בשווה.
     Q1  (1 סעיף):  100/7
     Q2  (1 סעיף):  100/7
     Q3  (2 סעיפים): 100/7/2 כ"א
     Q4  (1 סעיף):  100/7
     Q5  (3 סעיפים): 100/7/3 כ"א
     Q6  (1 סעיף):  100/7
     Q8  (1 סעיף):  100/7
   ═══════════════════════════════════════════════════════════ */

function calculateScore() {
  const PER_Q  = 100 / 7;        // 14.285714...
  const PER_Q3 = PER_Q / 2;      //  7.142857...
  const PER_Q5 = PER_Q / 3;      //  4.761905...

  let score = 0;
  if (scoreCorrect_q1b) score += PER_Q;
  if (scoreCorrect_q2)  score += PER_Q;
  if (scoreCorrect_q3a) score += PER_Q3;
  if (scoreCorrect_q3b) score += PER_Q3;
  if (scoreCorrect_q4)  score += PER_Q;
  if (scoreCorrect_q5a) score += PER_Q5;
  if (scoreCorrect_q5b) score += PER_Q5;
  if (scoreCorrect_q5c) score += PER_Q5;
  if (scoreCorrect_q6)  score += PER_Q;
  if (scoreCorrect_q8)  score += PER_Q;

  return Math.round(score);  // מספר שלם ללא נקודה עשרונית
}

function displayGrade() {
  const grade = calculateScore();
  const el = document.getElementById('user-grade-display');
  if (el) el.textContent = grade;
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 18 — completion modal
   ═══════════════════════════════════════════════════════════ */

function completeMission() {
  displayGrade();
  const overlay = document.getElementById('s18-completion-overlay');
  if (overlay) overlay.classList.remove('hidden');
}

/* QA r1 (item 12): close the completion dialog via the X button. */
function closeMission() {
  const overlay = document.getElementById('s18-completion-overlay');
  if (overlay) overlay.classList.add('hidden');
}
