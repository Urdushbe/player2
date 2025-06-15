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

    alert('Excel file uploaded!');
    showNextWord();
  };
  reader.readAsArrayBuffer(file);
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
    alert('No words available. Upload Excel file!');
    return;
  }

  currentIndex++;
  if (currentIndex >= wordOrder.length) {
    alert("✅ Barcha so‘zlar ko‘rsatildi. Yana boshlanmoqda!");
    shuffleWords();
    currentIndex = 0;
  }

  displayWord();
  speakWord(words[wordOrder[currentIndex]].english);
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

document.getElementById('saveButton').addEventListener('click', () => {
  const savedWord = words[wordOrder[currentIndex]];
  savedWords.push(savedWord);
  alert(`${savedWord.english} saved!`);
});

document.getElementById('downloadButton').addEventListener('click', () => {
  if (savedWords.length === 0) {
    alert('No words were spared!');
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
      alert(`${savedWord.english} saved!`);
      break;
    case 'ArrowUp':
      if (savedWords.length > 0) {
        const newWorkbook = XLSX.utils.book_new();
        const newSheetData = savedWords.map((word, index) => [index + 1, word.english, word.translation]);
        const newSheet = XLSX.utils.aoa_to_sheet(newSheetData);
        XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Saved Words');
        XLSX.writeFile(newWorkbook, 'SavedVocabulary.xlsx');
      } else {
        alert('No words were spared!');
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
      genderLabel = '🔊 Nomaʼlum';
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
});

speechSynthesis.onvoiceschanged = populateVoiceList;
