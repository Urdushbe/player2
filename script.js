let words = [];
let currentIndex = -1;
let savedWords = [];
let voices = [];
let wordOrder = [];
let lastSpeakSuccess = true;
let warnedLanguages = new Set(); // ✅ globalda
let voicesLoaded = false;

document.getElementById('fileInput').addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    document.getElementById('fileName').textContent = file.name;
  } else {
    document.getElementById('fileName').textContent = 'tanlanmagan';
  }
});


document.getElementById('fileInput').addEventListener('change', handleFile);

function handleFile(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const newWords = jsonData.filter(row => row[1] && row[2]).map(row => ({ english: row[1], translation: row[2] }));

    if (newWords.length > 3000) {
      alert("⛔ Juda ko‘p so‘z yuklanyapti! Iltimos, 3000 tagacha yuklang.");
      return;
    }

    words = newWords;
    shuffleWords();
    try {
      localStorage.setItem('wordList', JSON.stringify(words));
    } catch (e) {
      alert("❗ localStorage haddan oshdi! Saqlab bo‘lmadi.");
    }

    showCustomAlert('✔️ So‘zlar yuklandi. Sozlamadan ovoz tilini tanlashingiz mumkin!');



    if (!localStorage.getItem('selectedVoiceIndex') && words.length > 0) {
      const firstLang = detectLanguage(words[0].english);
      const matchedVoice = voices.find(v => v.lang.toLowerCase().includes(firstLang));
      if (matchedVoice) {
        const index = voices.indexOf(matchedVoice);
        document.getElementById('voiceSelect').value = index;
        localStorage.setItem('selectedVoiceIndex', index);
        showCustomAlert(`🔊 Ovoz avtomatik tanlandi: ${matchedVoice.name} - buni o'zgartirishingiz ham mumkin`);
      }
    }

    showNextWord();


  };
  reader.readAsArrayBuffer(file);
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
    showCustomAlert('⛔ So‘zlar mavjud emas! Excel faylni yuklang');
    document.getElementById('excel1')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }



  currentIndex++;
  if (currentIndex >= wordOrder.length) {
    showCustomAlert("✔️ Barcha so‘zlar o‘qildi va boshidan boshlandi!");
    shuffleWords();
    currentIndex = 0;
  }

  displayWord();
  speakWord(words[wordOrder[currentIndex]].english);
  updateProgress(); // 👈 YANGI QATOR – bu yerga qo‘shing!
}

function displayWord() {
  const word = words[wordOrder[currentIndex]];
  document.getElementById('englishWord').textContent = word.english;
  document.getElementById('translation').textContent = word.translation;
}





function speakWord(text) {
  if (!voicesLoaded || voices.length === 0) {
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  const rate = parseFloat(document.getElementById('rateRange').value);
  utterance.rate = rate;

  const voiceSelect = document.getElementById('voiceSelect');
  const selectedIndex = voiceSelect.value;

  const langCode = detectLanguage(text);

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

        // ✅ Tanlangan ovozni select oynasida ham yangilaymiz:
        voiceSelect.value = voices.indexOf(matchedVoices[0]);
        localStorage.setItem('selectedVoiceIndex', voiceSelect.value); // 👈 qo‘shing
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

      // ✅ Foydalanuvchi hech nima tanlamagan bo‘lsa ham tanlangan ovoz selectda ko‘rsatiladi:
      voiceSelect.value = voices.indexOf(matchedVoices[0]);
      localStorage.setItem('selectedVoiceIndex', voiceSelect.value); // 👈 qo‘shing

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











document.getElementById('nextButton').addEventListener('click', showNextWord);
document.getElementById('prevButton').addEventListener('click', () => speakWord(words[wordOrder[currentIndex]].english));
document.addEventListener('contextmenu', function (e) {
  if (e.target.id === 'prevButton' || e.target.id === 'nextButton') {

    e.preventDefault();
    speakWord(words[wordOrder[currentIndex]].english);
  }
});




document.getElementById('saveButton').addEventListener('click', () => {
  const savedWord = words[wordOrder[currentIndex]];
  savedWords.push(savedWord);
  showCustomAlert(`✔️ ${savedWord.english} saqlandi!`);
});

document.getElementById('downloadButton').addEventListener('click', () => {
  if (savedWords.length === 0) {
    showCustomAlert("Hech qanday so'z saqlanmagan!");
    return;
  }
  const newWorkbook = XLSX.utils.book_new();
  const newSheetData = savedWords.map((word, index) => [index + 1, word.english, word.translation]);
  const newSheet = XLSX.utils.aoa_to_sheet(newSheetData);
  XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Saved Words');
  XLSX.writeFile(newWorkbook, 'SavedVocabulary.xlsx');
});

document.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'ArrowRight':
      showNextWord();
      break;
    case 'ArrowLeft':
      speakWord(words[wordOrder[currentIndex]].english);
      break;
    case 'ArrowDown':
      const savedWord = words[wordOrder[currentIndex]];
      savedWords.push(savedWord);
      showCustomAlert(`✔️ ${savedWord.english} saqlandi!`);
      break;
    case 'ArrowUp':
      if (savedWords.length > 0) {
        const newWorkbook = XLSX.utils.book_new();
        const newSheetData = savedWords.map((word, index) => [index + 1, word.english, word.translation]);
        const newSheet = XLSX.utils.aoa_to_sheet(newSheetData);
        XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Saved Words');
        XLSX.writeFile(newWorkbook, 'SavedVocabulary.xlsx');
      } else {
        showCustomAlert("⛔ Hech qanday so'z saqlanmagan!");
      }
      break;
  }
});

function toggleBlur() {
  const text = document.getElementById("translation");
  const icon = document.getElementById("eye-icon");

  if (text.classList.contains("blurred")) {
    text.classList.remove("blurred");
    icon.classList.remove("bi-eye-slash-fill");
    icon.classList.add("bi-eye-fill");
  } else {
    text.classList.add("blurred");
    icon.classList.remove("bi-eye-fill");
    icon.classList.add("bi-eye-slash-fill");
  }
}

function populateVoiceList() {
  voices = speechSynthesis.getVoices();
  const voiceSelect = document.getElementById('voiceSelect');
  voiceSelect.innerHTML = '';

  voices.forEach((voice, i) => {
    const option = document.createElement('option');
    let genderLabel = '';

    if (/female|woman|yuna|seoyeon|susan|jina|zira|catherine/i.test(voice.name)) {
      genderLabel = '👩‍🦰 Ayol';
    } else if (/male|man|minho|jinho|david|sangho|paul|daniel/i.test(voice.name)) {
      genderLabel = '👨 Erkak';
    } else {
      genderLabel = '🔊';
    }

    option.value = i;
    option.textContent = `${voice.name} [${voice.lang}] - ${genderLabel}`;
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
      showCustomAlert('⛔ So‘zlar mavjud emas! Excel faylni yuklang');
      document.getElementById('excel1')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

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
    document.getElementById('excel1')?.scrollIntoView({ behavior: 'smooth' });
    showCustomAlert("⛔ So'zlar mavjud emas! Excel faylni yuklang");
    return;
  }

  if (currentIndex > 0) {
    currentIndex--;
    displayWord();
    speakWord(words[wordOrder[currentIndex]].english);
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
  }, 4000); // 2.5 soniyadan keyin avtomatik yo‘q bo‘ladi
}

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
