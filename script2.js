let words = [];



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
    alert("⚠️ Iltimos, so‘z va tarjimasini kiriting.");
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

// === Style qo‘shish ===
const style = document.createElement('style');
style.textContent = `
.word-item {
  display: flex;
  align-items: center;
  flex-wrap: nowrap; /* ❗ Hech qachon pastga tushmasin */
  gap: 10px;
  margin-bottom: 10px;
  width: 100%;
  overflow-x: auto;
}

.edit-input {
  flex: 1 1 auto;
  min-width: 0; /* ✅ Sozlangan! input siqilsa ham */
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 16px;
  box-sizing: border-box;
}

.edit-button {
  width: 36px;
  height: 36px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.edit-button:hover {
  background-color: #218838;
}

.edit-button svg {
  width: 18px;
  height: 18px;
  pointer-events: none;
}

`;
document.head.appendChild(style);