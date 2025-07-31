let words = [];

function showNavbar() {
  document.getElementById('searchNavbar').style.display = 'block';
  document.getElementById('searchWord').focus();
}

function hideNavbar() {
  document.getElementById('searchNavbar').style.display = 'none';
  document.getElementById('searchWord').value = '';
  searchAndScroll(); // Qidiruvni tozalash
}




document.getElementById('manualEnglish').addEventListener('keydown', handleEnterKey);
document.getElementById('manualTranslation').addEventListener('keydown', handleEnterKey);

function handleEnterKey(event) {
  if (event.key === 'Enter') {
    addManualWord();
  }
}


function downloadAllWords() {
  if (words.length === 0) {
    alert("❗ So‘zlar mavjud emas.");
    return;
  }

  const sheetData = words.map(word => [word.english, word.translation]);
  const sheet = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'All Words');
  XLSX.writeFile(wb, 'AllWords.xlsx');
}


function clearAllWords() {
  if (!confirm("🚨 Barcha so‘zlarni o‘chirmoqchimisiz? Bu amalni qaytarib bo‘lmaydi!")) return;

  words = [];
  saveAllWords();
  renderWordList();
  showCustomAlert("❌ Barcha so‘zlar o‘chirildi");
}



function showCustomAlert(message) {
  const alertBox = document.getElementById('customAlert');
  alertBox.textContent = message;
  alertBox.style.display = 'block';

  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 2000); // 2.5 soniyadan keyin avtomatik yo‘q bo‘ladi
}

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

    const newWords = jsonData
      .filter(row => row[0] && row[1])
      .map(row => ({
        english: row[0].toString().trim(),
        translation: row[1].toString().trim()
      }));

    if (newWords.length === 0) {
      alert("⚠️ Excel faylda so‘zlar topilmadi.");
      return;
    }

    words = newWords;
    saveAllWords();
    renderWordList();
    alert(`✔️ ${words.length} ta so‘z yuklandi`);
  };

  reader.readAsArrayBuffer(file);

}





window.addEventListener('load', () => {
  const stored = localStorage.getItem('wordList');
  if (stored) {
    try {
      words = JSON.parse(stored);
      renderWordList();
    } catch (e) {
      alert("❗ Saqlangan so‘zlar o‘qilmadi.");
    }
  }
});

function addManualWord() {
  const eng = document.getElementById('manualEnglish').value.trim();
  const trans = document.getElementById('manualTranslation').value.trim();
  if (!eng || !trans) {
    showCustomAlert("Iltimos! Barcha maydonlarni to'ldiring!");
    return;
  }
  words.push({ english: eng, translation: trans });
  renderWordList();
  saveAllWords();
  clearManualInputs();
}

function clearManualInputs() {
  document.getElementById('manualEnglish').value = '';
  document.getElementById('manualTranslation').value = '';
  document.getElementById('manualEnglish').focus();
}

function renderWordList() {
  const container = document.getElementById('wordListContainer');
  container.innerHTML = '';

  // ✅ Bu yerda so‘zlar sonini yangilaymiz
  document.getElementById('wordCount').textContent = words.length;

  [...words].reverse().forEach((word, i) => {
    const index = words.length - 1 - i;
    const div = document.createElement('div');
    div.className = 'word-item';

    const inputEng = document.createElement('input');
    inputEng.value = word.english;
    inputEng.className = 'edit-input';


    const inputTrans = document.createElement('input');
    inputTrans.value = word.translation;
    inputTrans.className = 'edit-input';

    inputEng.addEventListener('focus', () => {
      inputEng.focus(); // kursor ishlashi uchun kerak
      setTimeout(() => {
        inputEng.setSelectionRange(inputEng.value.length, inputEng.value.length);
        inputEng.scrollLeft = inputEng.scrollWidth;
      }, 0);
    });

    inputTrans.addEventListener('focus', () => {
      inputTrans.focus(); // kursor ishlashi uchun kerak
      setTimeout(() => {
        inputTrans.setSelectionRange(inputTrans.value.length, inputTrans.value.length);
        inputTrans.scrollLeft = inputTrans.scrollWidth;
      }, 0);
    });




    const saveBtn = document.createElement('button');
    saveBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 2048 2048">
          <path fill="currentColor" d="M1792 128q27 0 50 10t40 27t28 41t10 50v1664H357l-229-230V256q0-27 10-50t27-40t41-28t50-10h1536zM512 896h1024V256H512v640zm768 512H640v384h128v-256h128v256h384v-384zm512-1152h-128v768H384V256H256v1381l154 155h102v-512h896v512h384V256z"/>
           </svg>`;
    saveBtn.className = 'edit-button';
    saveBtn.onclick = () => {
      words[index].english = inputEng.value.trim();
      words[index].translation = inputTrans.value.trim();
      saveAllWords();
      showCustomAlert("Saqlandi");
    };

    const delBtn = document.createElement('button');
    delBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14">
        <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
          d="M1 3.5h12m-10.5 0h9v9a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1zm2 0V3a2.5 2.5 0 1 1 5 0v.5m-4 3.001v4.002m3-4.002v4.002" />
      </svg>
    `;

    delBtn.className = 'edit-button';
    delBtn.onclick = () => {
      if (confirm('So‘zni o‘chirmoqchimisiz?')) {
        words.splice(index, 1);
        renderWordList();
        saveAllWords();
      }
    };

    div.appendChild(inputEng);
    div.appendChild(inputTrans);
    div.appendChild(saveBtn);
    div.appendChild(delBtn);

    container.appendChild(div);
  });

}

function saveAllWords() {
  try {
    localStorage.setItem('wordList', JSON.stringify(words));
  } catch (e) {
    alert('❗ So‘zlar saqlanmadi: localStorage to‘lib ketgan bo‘lishi mumkin.');
  }
}




/* search funksiyasi uchun */
let matchedIndexes = [];
let currentMatchIndex = 0;

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '') // bo‘sh joylarni olib tashlash
    .replace(/['‘’`ʻʿ]/g, '') // apostroflarni olib tashlash
    .replace(/sh/g, 's')
    .replace(/ch/g, 'c')
    .replace(/g‘/g, 'g').replace(/ғ/g, 'g') // gʻ ni oddiy g ga
    .replace(/o‘/g, 'o').replace(/ў/g, 'o') // oʻ ni oddiy o ga
    .replace(/ə/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o');
}


function searchAndScroll(goToNext = false) {
  const query = document.getElementById('searchWord').value.trim().toLowerCase();

  const items = document.querySelectorAll('.word-item');

  // Tozalash
  items.forEach(item => item.classList.remove('highlight-word'));
  matchedIndexes = [];

  if (!query) return;

  // Mos keladiganlarni topish
  items.forEach((item, i) => {
    const inputs = item.querySelectorAll('input.edit-input');
    const eng = inputs[0]?.value || '';
    const tr = inputs[1]?.value || '';

    if (normalize(eng).includes(normalize(query)) || normalize(tr).includes(normalize(query))) {
      item.classList.add('highlight-word');
      item.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }


    if (eng.includes(query) || tr.includes(query)) {
      matchedIndexes.push(i);
    }
  });

  if (matchedIndexes.length === 0) return;

  // Keyingisiga o'tish
  if (goToNext) {
    currentMatchIndex = (currentMatchIndex + 1) % matchedIndexes.length;
  } else {
    currentMatchIndex = 0;
  }

  const target = items[matchedIndexes[currentMatchIndex]];
  target.classList.add('highlight-word');
  const scrollOffset = 80; // Navbar balandligiga qarab sozlang
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });

  setTimeout(() => {
    window.scrollBy(0, -scrollOffset);
  }, 300);
}

document.getElementById('searchWord').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    searchAndScroll(true); // keyingi topilmani ko‘rsat
  }
});

/* tugashi */


function moveCursorToEnd(input) {
  const value = input.value;
  input.focus();
  input.setSelectionRange(value.length, value.length);
}
