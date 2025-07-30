let words = [];
let currentIndex = -1;
let savedWords = [];
let voices = [];
let wordOrder = [];
let lastSpeakSuccess = true;
let warnedLanguages = new Set(); // ✅ globalda
let voicesLoaded = false;
let readTranslationInstead = localStorage.getItem('readTranslationInstead') === 'true';






function getReadableLanguageName(code) {
  const map = {
    'en': 'English',
    'ru': 'Russian',
    'uz': 'Uzbek',
    'ko': 'Korean',
    'ja': 'Japanese',
    'zh': 'Chinese',
    'tr': 'Turkish',
    'ar': 'Arabic',
    'fr': 'French',
    'de': 'German',
    'es': 'Spanish',
    'it': 'Italian',
    'pt': 'Portuguese',
    'hi': 'Hindi',
    'id': 'Indonesian'
  };

  return map[code] || `🌐 ${code.toUpperCase()}`;
}







let wakeLock = null;

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('✅ Wake Lock faollashtirildi');

      wakeLock.addEventListener('release', () => {
        console.log('⚠️ Wake Lock o‘chirildi');
      });
    } else {
      console.log('❌ Wake Lock API brauzeringizda ishlamaydi');
    }
  } catch (err) {
    console.error('Wake Lock xatosi:', err);
  }
}


function shuffleWords() {
  wordOrder = [...Array(words.length).keys()];
  for (let i = wordOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wordOrder[i], wordOrder[j]] = [wordOrder[j], wordOrder[i]];
  }
  currentIndex = -1;
}

function showNextWord() {
  if (words.length === 0) {
    showPopupRelativeTo('edit', 'popupMessage');
    return;
  }

  currentIndex++;
  if (currentIndex >= wordOrder.length) {
    showCustomAlert("✔️ Barcha so‘zlar o‘qildi va boshidan boshlandi!");
    shuffleWords();
    currentIndex = 0;
  }

  displayWord();
  if (!readTranslationInstead) {
    speakWord();
  }
  updateProgress();
}


function displayWord() {
  const word = words[wordOrder[currentIndex]];

  const engEl = document.getElementById('englishWord');
  const trEl = document.getElementById('translation');

  if (readTranslationInstead) {
    engEl.textContent = word.translation;
    trEl.textContent = word.english;
  } else {
    engEl.textContent = word.english;
    trEl.textContent = word.translation;
  }
}



// Sahifa yuklanganda localStorage dan sozlamani olish
let autoLangDetect = localStorage.getItem('autoLangDetect') !== 'false'; // default true

// checkbox ni bosganda til aniqlashni yoqib/o‘chirish
function setupLangDetectionToggle() {
  const toggle = document.getElementById('langDetectToggle');
  if (!toggle) return;

  // localStorage'dagi qiymat asosida checkbox holatini sozlaymiz
  toggle.checked = autoLangDetect;

  toggle.addEventListener('change', () => {
    autoLangDetect = toggle.checked;
    localStorage.setItem('autoLangDetect', autoLangDetect);
  });
}

document.addEventListener('DOMContentLoaded', setupLangDetectionToggle);





function speakWord(text = null) {
  if (!voicesLoaded || voices.length === 0) return;

  const wordObj = words[wordOrder[currentIndex]];
  if (!wordObj) return;

  if (!text) {
    text = readTranslationInstead ? wordObj.translation : wordObj.english;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const rate = parseFloat(document.getElementById('rateRange').value);
  utterance.rate = rate;

  const voiceSelect = document.getElementById('voiceSelect');
  const selectedIndex = voiceSelect.value;

  const langCode = autoLangDetect ? detectLanguage(text) : voices[selectedIndex]?.lang?.slice(0, 2) || 'en';

  if (voices[selectedIndex]) {
    const selectedVoice = voices[selectedIndex];

    if (selectedVoice.lang.startsWith(langCode)) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      const matchedVoices = voices.filter(v => v.lang.startsWith(langCode));
      if (matchedVoices.length > 0) {
        utterance.voice = matchedVoices[0];
        utterance.lang = matchedVoices[0].lang;
        voiceSelect.value = voices.indexOf(matchedVoices[0]);
        localStorage.setItem('selectedVoiceIndex', voiceSelect.value);
      } else {
        utterance.lang = langCode;
        if (!warnedLanguages.has(langCode)) {
          showCustomAlert("⛔ Qurilmada ushbu til uchun maxsus ovoz topilmadi. Tuzatish uchun pastdagi yo'riqnomani o'qing!");
          warnedLanguages.add(langCode);
        }
        lastSpeakSuccess = false;
        return;
      }
    }
  } else {
    const matchedVoices = voices.filter(v => v.lang.startsWith(langCode));
    if (matchedVoices.length > 0) {
      utterance.voice = matchedVoices[0];
      utterance.lang = matchedVoices[0].lang;
      voiceSelect.value = voices.indexOf(matchedVoices[0]);
      localStorage.setItem('selectedVoiceIndex', voiceSelect.value);
    } else {
      utterance.lang = langCode;
      if (!warnedLanguages.has(langCode)) {
        showCustomAlert("⛔ Qurilmada ushbu til uchun maxsus ovoz topilmadi. Tuzatish uchun pastdagi yo'riqnomani o'qing!");
        warnedLanguages.add(langCode);
      }
      lastSpeakSuccess = false;
      return;
    }
  }

  window.speechSynthesis.speak(utterance);
  lastSpeakSuccess = true;
}








// Strelkali error belgi uchun
function showPopupRelativeTo(targetId, popupId) {
  const target = document.getElementById(targetId);
  const popup = document.getElementById(popupId);

  if (!target || !popup) return;

  popup.style.display = 'block';
  popup.style.visibility = 'hidden';

  const rect = target.getBoundingClientRect();
  const popupWidth = popup.offsetWidth;
  const popupHeight = popup.offsetHeight;

  const left = rect.left + window.scrollX + (rect.width / 2) - (popupWidth / 2);
  const top = rect.top + window.scrollY - popupHeight - 30; // elementdan yuqoriga 10px

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
  popup.style.visibility = 'visible';

  setTimeout(() => {
    popup.style.display = 'none';
  }, 8000); // 2.5 soniyadan keyin avtomatik yo‘q bo‘ladi
}













// tugadi



document.getElementById('nextButton').addEventListener('click', showNextWord);
document.getElementById('prevButton').addEventListener('click', () => {
  if (words.length === 0) {
    showPopupRelativeTo('edit', 'popupMessage');
    return;
  }

  if (!readTranslationInstead) {
    speakWord();
  }
});

document.addEventListener('contextmenu', function (e) {
  if (e.target.id === 'prevButton' || e.target.id === 'nextButton') {

    e.preventDefault();
    if (!readTranslationInstead) {
      speakWord();
    }
  }
});



function toggleBlur() {
  const text = document.getElementById("translation");
  const icon = document.getElementById("eye-icon");

  const isBlurred = text.classList.toggle("blurred");

  if (isBlurred) {
    icon.classList.remove("bi-eye-fill");
    icon.classList.add("bi-eye-slash-fill");
  } else {
    icon.classList.remove("bi-eye-slash-fill");
    icon.classList.add("bi-eye-fill");
  }
}


function populateVoiceList() {
  voices = speechSynthesis.getVoices();
  const voiceSelect = document.getElementById('voiceSelect');
  voiceSelect.innerHTML = '';

  const langCount = {};
  const sortedVoices = voices.slice().sort((a, b) => {
    return a.lang.localeCompare(b.lang); // tartiblash
  });

  sortedVoices.forEach((voice) => {
    const langCode = voice.lang.slice(0, 2).toLowerCase();
    const readable = getReadableLanguageName(langCode);
    langCount[readable] = (langCount[readable] || 0) + 1;

    const label = `${readable} ${langCount[readable]} [${voice.lang}]`;
    const option = document.createElement('option');
    option.value = voices.indexOf(voice); // 👈 MUHIM: asl `voices[]` dagi index
    option.textContent = label;
    voiceSelect.appendChild(option);
  });

  const savedIndex = localStorage.getItem('selectedVoiceIndex');
  if (savedIndex !== null && voices[savedIndex]) {
    voiceSelect.value = savedIndex;
  }

  voicesLoaded = true;
}




document.getElementById('voiceSelect').addEventListener('change', (e) => {
  localStorage.setItem('selectedVoiceIndex', e.target.value);

  // 🔊 Hozirgi so‘zni ovoz bilan qayta eshittirish
  if (words.length > 0 && currentIndex >= 0) {
    if (!readTranslationInstead) {
      speakWord();
    }
  }
});


document.getElementById('rateRange').addEventListener('input', function () {
  document.getElementById('rateValue').textContent = this.value;
  localStorage.setItem('voiceRate', this.value);
});

window.addEventListener('load', () => {
  populateVoiceList();

  const storedWords = localStorage.getItem('wordList');
  if (storedWords) {
    try {
      words = JSON.parse(storedWords);
      shuffleWords();
      currentIndex = -1;
      showNextWord();
    } catch (e) {
      alert('❗ So‘zlar tiklanmadi. Saqlangan ma’lumotda xatolik bor.');
    }
  }

  const savedRate = localStorage.getItem('voiceRate');
  if (savedRate) {
    document.getElementById('rateRange').value = savedRate;
    document.getElementById('rateValue').textContent = savedRate;
  }

  const savedDelay = localStorage.getItem('autoDelay');
  if (savedDelay) {
    document.getElementById('autoDelayRange').value = savedDelay;
    document.getElementById('autoDelayValue').textContent = savedDelay;
    autoDelay = parseInt(savedDelay) * 1000;
  }



  // 👉 Wake Lock chaqiruvi shu yerda:
  requestWakeLock();
});

let autoDelay = 5000; // Foydalanuvchi tanlagan sekund * 1000
let autoNextEnabled = false;
let autoNextInterval = null;

function toggleAutoNext() {
  autoNextEnabled = !autoNextEnabled;

  const button = document.getElementById('autoToggleButton');
  if (autoNextEnabled) {

    if (words.length === 0) {
      showPopupRelativeTo('edit', 'popupMessage');
      return;
    }
    /*
    if (words.length === 0) {
      showCustomAlert('⛔ So‘zlar mavjud emas! Excel faylni yuklang');
      document.getElementById('excel1')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    */

    button.textContent = '⏸️';
    autoNextInterval = setInterval(() => {
      showNextWord();
    }, autoDelay);

    requestWakeLock(); // <<< 👈 bu yerga joylashtiring
    showCustomAlert(`So'zlar har ${autoDelay / 1000} sekundda avtomatik o'qiladi`);
  } else {
    button.textContent = '▶️';
    clearInterval(autoNextInterval);
  }
}

document.getElementById('autoToggleButton').addEventListener('click', toggleAutoNext);


speechSynthesis.onvoiceschanged = populateVoiceList;


document.getElementById('autoDelayRange').addEventListener('input', function () {
  const value = parseInt(this.value);
  document.getElementById('autoDelayValue').textContent = value;
  autoDelay = value * 1000;

  if (autoNextEnabled) {
    clearInterval(autoNextInterval);
    autoNextInterval = setInterval(() => {
      showNextWord();
    }, autoDelay);
  }

  localStorage.setItem('autoDelay', value);
});


function updateProgress() {
  const progress = document.getElementById('wordProgress');
  const display = document.getElementById('wordCountDisplay');
  const total = wordOrder.length;
  const current = currentIndex + 1;

  progress.max = total;
  progress.value = current;
  display.textContent = `${current} / ${total}`;
}


function showPreviousWord() {
  if (words.length === 0) {
    showPopupRelativeTo('edit', 'popupMessage');
    return;
  }

  if (currentIndex > 0) {
    currentIndex--;
    displayWord();
    if (!readTranslationInstead) {
      speakWord();
    }
    updateProgress();
  } else {
    showCustomAlert("⛔ Siz birinchi so‘zdasiz.");
  }
}

document.getElementById('backButton').addEventListener('click', showPreviousWord);


function showCustomAlert(message) {
  const alertBox = document.getElementById('customAlert');
  alertBox.textContent = message;
  alertBox.style.display = 'block';

  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 2000); // 2.5 soniyadan keyin avtomatik yo‘q bo‘ladi
}




// Sahifa yuklanganda saqlangan so‘zlarni localStorage'dan tiklash
const storedSaved = localStorage.getItem('savedWords');
if (storedSaved) {
  try {
    savedWords = JSON.parse(storedSaved);
  } catch (e) {
    savedWords = [];
  }
}

function clearSavedWords() {
  if (confirm("Barcha saqlangan so‘zlar o‘chib ketadi. Rozimisiz?")) {
    savedWords = [];
    localStorage.removeItem('savedWords');
    renderSavedList();
    showCustomAlert("🗑️ Saqlanganlar tozalandi");
  }
}




//saqlab borish uchun


// ✅ 2. Save tugmasi bosilganda so'z saqlanadi va ro'yxat yangilanadi
document.getElementById('saveButton').addEventListener('click', () => {
  if (words.length === 0) {
    showPopupRelativeTo('edit', 'popupMessage');
    return;
  }
  const savedWord = words[wordOrder[currentIndex]];

  // 🔍 So‘z allaqachon saqlanganmi – tekshiramiz:
  const alreadySaved = savedWords.some(word =>
    word.english === savedWord.english && word.translation === savedWord.translation
  );

  if (alreadySaved) {
    showCustomAlert(`ℹ️ ${savedWord.english} allaqachon saqlangan.`);
    return;
  }


  savedWords.push(savedWord);
  localStorage.setItem('savedWords', JSON.stringify(savedWords));
  showCustomAlert(`✔️ ${savedWord.english} saqlandi!`);
  renderSavedList();
});

function renderSavedList() {
  const list = document.getElementById('savedWordList');
  const container = document.getElementById('savedItems');

  // Agar saqlanganlar yo'q bo‘lsa – yashiramiz
  if (savedWords.length === 0) {
    list.style.display = 'none';
    return;
  }

  list.style.display = 'block';
  container.innerHTML = '';

  savedWords.slice().reverse().forEach(word => {
    const card = document.createElement('div');
    card.className = 'saved-word-card';

    const eng = document.createElement('div');
    eng.className = 'word-english';
    eng.textContent = word.english;

    const tr = document.createElement('div');
    tr.className = 'word-translation';
    tr.textContent = word.translation;

    card.appendChild(eng);
    card.appendChild(tr);
    container.appendChild(card);
  });
}



// ✅ 4. Excel faylga saqlash
function downloadSavedWords() {
  if (savedWords.length === 0) {
    showCustomAlert("❗ Saqlangan so‘zlar yo‘q!");
    return;
  }
  const sheetData = savedWords.map(word => [word.english, word.translation]);
  const sheet = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Saved Words');
  XLSX.writeFile(wb, 'SavedVocabulary.xlsx');
}

// ✅ 5. Asosiy wordList ni saqlanganlarga almashtirish
function replaceAllWithSaved() {
  if (savedWords.length === 0) {
    showCustomAlert("❗ Saqlangan so‘zlar yo‘q!");
    return;
  }
  if (!confirm("Barcha so‘zlar o‘chib, faqat saqlangan so‘zlar qoladi. Rozimisiz?")) return;

  words = [...savedWords];
  savedWords = [];
  localStorage.setItem('wordList', JSON.stringify(words));
  shuffleWords();
  currentIndex = -1;
  showNextWord();
  renderSavedList();
}

// ✅ 6. Sahifa yuklanganda saqlanganlar qismi mavjud bo‘lsa ko‘rsatish
window.addEventListener('load', () => {
  renderSavedList();
});


document.getElementById('toggleLanguageButton').addEventListener('click', () => {
  readTranslationInstead = !readTranslationInstead;


  const btn = document.getElementById('toggleLanguageButton');
  btn.classList.toggle('change-class');

  if (readTranslationInstead) {
    showCustomAlert("Bu holatda ovoz chiqmaydi. Bu faqat yodlash uchun!");
  }

  // Sahifadagi matnni yangilaymiz
  if (words.length > 0 && currentIndex >= 0) {
    displayWord();

    // ✅ faqat inglizcha rejimda ovoz ishlaydi
    if (!readTranslationInstead) {
      speakWord();
    }
  }
});
















// ✅ Detect language of the word
function detectLanguage(text) {
  if (/[А-Яа-яЁёЀ-ӿ]/.test(text)) return 'ru';          // Rus
  if (/[가-힣]/.test(text)) return 'ko';                 // Koreys
  if (/[\u0600-\u06FF\u0750-\u077F]/.test(text)) return 'ar'; // Arab
  if (/[ぁ-んァ-ンーｱ-ﾝﾞﾟ]/.test(text)) return 'ja';     // Yapon (kana)
  if (/[一-龯]/.test(text)) return 'zh';                 // Xitoy (kanji)
  if (/^[A-Za-z\s.,!?"'’‘\-]+$/.test(text)) return 'en'; // Ingliz
  if (/[éèêëàâäîïôöùûüçœ]/i.test(text)) return 'fr';     // Fransuz
  if (/[äöüß]/i.test(text)) return 'de';                 // Nemis
  if (/[ñáéíóúü¿¡]/i.test(text)) return 'es';            // Ispan
  if (/[çğıİşöüâ]/i.test(text)) return 'tr';             // Turk
  return 'en'; // Default
}