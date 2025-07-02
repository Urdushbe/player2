let words = [];
let currentIndex = -1;
let savedWords = [];
let voices = [];
let wordOrder = [];

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
      alert("⚠️ Juda ko‘p so‘z yuklanyapti! Iltimos, 3000 tagacha yuklang.");
      return;
    }

    words = newWords;
    shuffleWords();
    try {
      localStorage.setItem('wordList', JSON.stringify(words));
    } catch (e) {
      alert("❗ localStorage haddan oshdi! Saqlab bo‘lmadi.");
    }

    showCustomAlert('✔️ Excel fayldagi so‘zlar yuklandi');
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
    showCustomAlert('⚠️ So‘zlar mavjud emas! Excel faylni yuklang');
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
  const utterance = new SpeechSynthesisUtterance(text);
  const voiceSelect = document.getElementById('voiceSelect');
  const selectedIndex = voiceSelect.value;
  if (voices[selectedIndex]) {
    utterance.voice = voices[selectedIndex];
    utterance.lang = voices[selectedIndex].lang; // Ovozga mos til
  } else {
    utterance.lang = 'en-US';
  }

  const rate = parseFloat(document.getElementById('rateRange').value);
  utterance.rate = rate;

  window.speechSynthesis.speak(utterance);
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
        showCustomAlert("Hech qanday so'z saqlanmagan!");
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

  // 👉 Wake Lock chaqiruvi shu yerda:
  requestWakeLock();
});


let autoNextEnabled = false;
let autoNextInterval = null;

function toggleAutoNext() {
  autoNextEnabled = !autoNextEnabled;

  const button = document.getElementById('autoToggleButton');
  if (autoNextEnabled) {

    if (words.length === 0) {
      showCustomAlert('⚠️ So‘zlar mavjud emas! Excel faylni yuklang');
      document.getElementById('excel1')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    button.textContent = '⏸️';
    autoNextInterval = setInterval(() => {
      showNextWord();
    }, 5000); // 5 sekundda avtomatik o'tadi
    requestWakeLock(); // <<< 👈 bu yerga joylashtiring
    showCustomAlert("So'zlar har 5 sekuntda avtomatik o'qiladi");
  } else {
    button.textContent = '▶️';
    clearInterval(autoNextInterval);
  }
}

document.getElementById('autoToggleButton').addEventListener('click', toggleAutoNext);


speechSynthesis.onvoiceschanged = populateVoiceList;


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
  }, 2500); // 2.5 soniyadan keyin avtomatik yo‘q bo‘ladi
}

