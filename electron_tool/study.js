// study.js - Logic for separate distraction-free study window

const params = new URLSearchParams(window.location.search);
const itemId = params.get('id');
const vaultType = params.get('type'); // 'ielts' or 'general'

let currentItem = null;
let currentFontSize = 15;
const detailContent = document.getElementById('detailContentScroll');

// Font size control listeners
document.getElementById('btnFontInc').addEventListener('click', () => {
  currentFontSize += 2;
  if (currentFontSize > 28) currentFontSize = 28;
  detailContent.style.fontSize = `${currentFontSize}px`;
});

document.getElementById('btnFontDec').addEventListener('click', () => {
  currentFontSize -= 2;
  if (currentFontSize < 11) currentFontSize = 11;
  detailContent.style.fontSize = `${currentFontSize}px`;
});

document.getElementById('btnFontNormal').addEventListener('click', () => {
  currentFontSize = 15;
  detailContent.style.fontSize = `${currentFontSize}px`;
});

// Navigation control listeners
document.getElementById('btnPrevItem').addEventListener('click', () => {
  navigateItem(-1);
});
document.getElementById('btnNextItem').addEventListener('click', () => {
  navigateItem(1);
});

// Scroll page control listeners
const studyContainer = document.querySelector('.study-container');
document.getElementById('btnScrollUp').addEventListener('click', () => {
  studyContainer.scrollBy({ top: -350, behavior: 'smooth' });
});
document.getElementById('btnScrollDown').addEventListener('click', () => {
  studyContainer.scrollBy({ top: 350, behavior: 'smooth' });
});

// Window controls
document.getElementById('btnMinimize').addEventListener('click', () => {
  if (window.taskAPI && window.taskAPI.minimize) window.taskAPI.minimize();
});
document.getElementById('btnMaximize').addEventListener('click', () => {
  if (window.taskAPI && window.taskAPI.maximize) window.taskAPI.maximize();
});
document.getElementById('btnClose').addEventListener('click', () => {
  if (window.taskAPI && window.taskAPI.close) window.taskAPI.close();
});

// Floating view image listener & Lightbox modal controls
const imageModal = document.getElementById('imageModal');
const imageModalContent = document.getElementById('imageModalContent');
const btnFloatingViewImage = document.getElementById('btnFloatingViewImage');
const btnImageModalClose = document.getElementById('btnImageModalClose');
const btnImageModalPrev = document.getElementById('btnImageModalPrev');
const btnImageModalNext = document.getElementById('btnImageModalNext');

let modalImages = [];
let currentModalImageIndex = 0;

if (btnFloatingViewImage) {
  btnFloatingViewImage.addEventListener('click', () => {
    if (!currentItem) return;
    const f = currentItem.fields;
    modalImages = f.images || (f.image ? [f.image] : []);
    if (modalImages.length > 0) {
      currentModalImageIndex = 0;
      openImageModal();
    }
  });
}

if (btnImageModalClose) {
  btnImageModalClose.addEventListener('click', closeImageModal);
}

if (imageModal) {
  imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal || e.target.classList.contains('image-modal-content-container')) {
      closeImageModal();
    }
  });
}

if (btnImageModalPrev) {
  btnImageModalPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateModalImage(-1);
  });
}

if (btnImageModalNext) {
  btnImageModalNext.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateModalImage(1);
  });
}

function openImageModal() {
  if (imageModal) {
    imageModal.style.display = 'flex';
    renderModalImage();
  }
}

function closeImageModal() {
  if (imageModal) {
    imageModal.style.display = 'none';
  }
}

function renderModalImage() {
  if (!imageModalContent || modalImages.length === 0) return;
  
  imageModalContent.innerHTML = '';
  const imgBase64 = modalImages[currentModalImageIndex];
  
  const img = document.createElement('img');
  img.src = imgBase64;
  img.alt = `Ảnh đính kèm ${currentModalImageIndex + 1}`;
  imageModalContent.appendChild(img);
  
  if (modalImages.length > 1) {
    if (btnImageModalPrev) btnImageModalPrev.style.display = 'block';
    if (btnImageModalNext) btnImageModalNext.style.display = 'block';
  } else {
    if (btnImageModalPrev) btnImageModalPrev.style.display = 'none';
    if (btnImageModalNext) btnImageModalNext.style.display = 'none';
  }
}

function navigateModalImage(direction) {
  if (modalImages.length === 0) return;
  currentModalImageIndex += direction;
  if (currentModalImageIndex < 0) {
    currentModalImageIndex = modalImages.length - 1;
  } else if (currentModalImageIndex >= modalImages.length) {
    currentModalImageIndex = 0;
  }
  renderModalImage();
}

// Close on Escape key, Left/Right arrow keys & Image modal controls
document.addEventListener('keydown', (e) => {
  const isModalOpen = imageModal && imageModal.style.display === 'flex';
  
  if (isModalOpen) {
    if (e.key === 'Escape') {
      closeImageModal();
      e.stopPropagation();
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      navigateModalImage(-1);
      e.stopPropagation();
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      navigateModalImage(1);
      e.stopPropagation();
      e.preventDefault();
    }
    return;
  }

  // Hotkey I/i to view images
  if (e.key === 'i' || e.key === 'I') {
    const f = currentItem ? currentItem.fields : null;
    if (f) {
      const imgs = f.images || (f.image ? [f.image] : []);
      if (imgs.length > 0) {
        modalImages = imgs;
        currentModalImageIndex = 0;
        openImageModal();
        e.stopPropagation();
        e.preventDefault();
      }
    }
    return;
  }

  if (e.key === 'Escape') {
    if (window.taskAPI && window.taskAPI.close) window.taskAPI.close();
  } else if (e.key === 'ArrowLeft') {
    navigateItem(-1);
  } else if (e.key === 'ArrowRight') {
    navigateItem(1);
  }
});

let allVaultItems = [];
let currentItemIndex = -1;
let filteredVaultItems = [];
let filteredItemIndex = -1;

function applyStudyFilter(initialLoad = false) {
  const filterEl = document.getElementById('studyMasteryFilter');
  const filterVal = filterEl ? filterEl.value : 'all';
  
  let tempFiltered = [];
  if (filterVal === 'all') {
    tempFiltered = allVaultItems;
  } else {
    const level = parseInt(filterVal);
    tempFiltered = allVaultItems.filter(item => {
      const m = item.mastery || 0;
      if (level === 3) {
        return m >= 3;
      }
      return m === level;
    });
  }
  
  if (tempFiltered.length === 0) {
    alert("Không có tài liệu nào ở trạng thái này!");
    if (filterEl) filterEl.value = 'all';
    filteredVaultItems = allVaultItems;
  } else {
    filteredVaultItems = tempFiltered;
  }
  
  if (currentItem) {
    filteredItemIndex = filteredVaultItems.findIndex(item => item.id == currentItem.id);
    if (filteredItemIndex === -1 && filteredVaultItems.length > 0) {
      filteredItemIndex = 0;
      currentItem = filteredVaultItems[0];
      currentItemIndex = allVaultItems.findIndex(item => item.id == currentItem.id);
      renderItem();
    }
  } else {
    filteredItemIndex = -1;
  }
}

function navigateItem(direction) {
  // Stop TTS if currently speaking
  if (typeof stopTts === 'function') stopTts(false);

  const newIndex = filteredItemIndex + direction;
  if (newIndex >= 0 && newIndex < filteredVaultItems.length) {
    filteredItemIndex = newIndex;
    currentItem = filteredVaultItems[filteredItemIndex];
    currentItemIndex = allVaultItems.findIndex(item => item.id == currentItem.id);
    
    // Update URL search query
    history.replaceState({}, '', `?id=${currentItem.id}&type=${vaultType}`);
    
    // Smooth scroll study container back to top
    const container = document.querySelector('.study-container');
    if (container) {
      container.scrollTop = 0;
    }
    
    renderItem();
  }
}

// Initialize window
async function init() {
  if (!itemId || !vaultType) return;
  
  if (vaultType === 'ielts') {
    const data = await window.taskAPI.loadIeltsVault();
    if (data && data.items) {
      allVaultItems = data.items;
      currentItemIndex = allVaultItems.findIndex(item => item.id == itemId);
      if (currentItemIndex !== -1) {
        currentItem = allVaultItems[currentItemIndex];
      }
    }
  } else if (vaultType === 'general') {
    const data = await window.taskAPI.loadGeneralVault();
    if (data && data.items) {
      allVaultItems = data.items;
      currentItemIndex = allVaultItems.findIndex(item => item.id == itemId);
      if (currentItemIndex !== -1) {
        currentItem = allVaultItems[currentItemIndex];
      }
    }
  }
  
  if (!currentItem) {
    alert('Không tìm thấy tài liệu học tập!');
    if (window.taskAPI && window.taskAPI.close) window.taskAPI.close();
    return;
  }
  
  applyStudyFilter(true);
  renderItem();

  const filterEl = document.getElementById('studyMasteryFilter');
  if (filterEl) {
    filterEl.addEventListener('change', () => {
      applyStudyFilter(false);
    });
  }

  if (window.taskAPI && window.taskAPI.onVaultUpdated) {
    window.taskAPI.onVaultUpdated((info) => {
      if (info.type === vaultType) {
        allVaultItems = info.data.items || [];
        currentItemIndex = allVaultItems.findIndex(i => i.id == (currentItem ? currentItem.id : itemId));
        if (currentItemIndex !== -1) {
          currentItem = allVaultItems[currentItemIndex];
        }
        applyStudyFilter(false);
        renderItem();
      }
    });
  }
}

let studyScrollClickHandler = null;

function renderItem() {
  // Build currentVocabMap
  const f = currentItem.fields;
  let vocabText = '';
  if (f.vocab) vocabText += '\n' + f.vocab;
  if (f.keywords) vocabText += '\n' + f.keywords;
  if (f.colloc) vocabText += '\n' + f.colloc;
  if (f.spelling) vocabText += '\n' + f.spelling;
  if (f.grammar) vocabText += '\n' + f.grammar;
  if (f.koreanVocab) vocabText += '\n' + f.koreanVocab;
  if (f.japaneseVocab) vocabText += '\n' + f.japaneseVocab;
  currentVocabMap = buildVocabMap(vocabText);

  // Update titles
  document.getElementById('winTitle').textContent = `Học tập: ${currentItem.title}`;
  document.getElementById('detailTitle').textContent = currentItem.title;
  
  // Format date
  const parts = currentItem.date.split('-');
  const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : currentItem.date;
  document.getElementById('detailDate').textContent = `📅 Ngày lưu: ${formattedDate}`;
  document.getElementById('detailFolder').textContent = `📁 Thư mục: ${currentItem.folder || 'Mặc định'}`;
  
  // Set up link
  const linkContainer = document.getElementById('studyLinkContainer');
  const studyLinkBtn = document.getElementById('btnStudyLink');
  if (currentItem.link) {
    linkContainer.style.display = 'block';
    studyLinkBtn.onclick = () => {
      if (window.taskAPI && window.taskAPI.openExternal) {
        window.taskAPI.openExternal(currentItem.link);
      } else {
        window.open(currentItem.link, '_blank');
      }
    };
  } else {
    linkContainer.style.display = 'none';
  }
  
  // Set up skill/subject badge
  const badge = document.getElementById('detailSkill');
  const skillIcons = {
    writing: '✍️ Writing',
    speaking: '🗣️ Speaking',
    reading: '📖 Reading',
    listening: '🎧 Listening',
    math: '📐 Toán Học',
    korean: '🇰🇷 Tiếng Hàn',
    japanese: '🇯🇵 Tiếng Nhật',
    coding: '💻 Lập Trình',
    other: '📚 Môn học khác'
  };
  
  if (vaultType === 'ielts') {
    badge.className = `skill-badge ${currentItem.skill}`;
    badge.textContent = skillIcons[currentItem.skill] || currentItem.skill;
  } else {
    badge.className = `skill-badge ${currentItem.subject}`;
    badge.textContent = skillIcons[currentItem.subject] || currentItem.subject;
  }
  
  // Render details based on category
  const scroll = document.getElementById('detailContentScroll');
  scroll.innerHTML = '';
  
  const detailImages = f.images || (f.image ? [f.image] : []);
  if (detailImages && detailImages.length > 0) {
    detailImages.forEach(imgBase64 => {
      scroll.appendChild(createDetailSectionImage(imgBase64));
    });
    if (btnFloatingViewImage) btnFloatingViewImage.style.display = 'flex';
  } else {
    if (btnFloatingViewImage) btnFloatingViewImage.style.display = 'none';
  }

  if (vaultType === 'ielts') {
    if (currentItem.skill === 'writing') {
      if (f.prompt) scroll.appendChild(createDetailSection('Đề bài / Prompt', f.prompt));
      if (f.grammar) scroll.appendChild(createDetailSection('Cấu trúc ngữ pháp hay dùng', f.grammar));
      if (f.vocab) scroll.appendChild(createDetailSection('Từ vựng chủ đề (Band 8.0 - 9.0)', f.vocab));
      if (f.analysis) scroll.appendChild(createDetailSection('Cách phân tích biểu đồ / Đề bài', f.analysis));
      if (f.ideas) scroll.appendChild(createDetailSection('Các ý cần triển khai (Brainstorming)', f.ideas));
      if (f.sample) scroll.appendChild(createDetailSection('Bài mẫu Sample Band 9.0', f.sample));
      if (f.solution) scroll.appendChild(createDetailSection('Phân tích hướng giải & Nhận xét', f.solution));
    } else if (currentItem.skill === 'speaking') {
      if (f.question) scroll.appendChild(createDetailSection('Câu hỏi / Đề tài Speaking (Part 1/2/3)', f.question));
      if (f.vocab) scroll.appendChild(createDetailSection('Từ vựng hay dùng (B2 - C2)', f.vocab));
      if (f.colloc) scroll.appendChild(createDetailSection('Collocations & Idioms nổi bật', f.colloc));
      if (f.outline) scroll.appendChild(createDetailSection('Ý tưởng & Dàn bài nói', f.outline));
      if (f.sample) scroll.appendChild(createDetailSection('Bài nói mẫu (Sample Answer)', f.sample));
      if (f.pron) scroll.appendChild(createDetailSection('Ghi chú phát âm & Ngữ điệu', f.pron));
    } else if (currentItem.skill === 'reading') {
      if (f.passage) scroll.appendChild(createDetailSection('Đoạn văn đọc / Tiêu đề bài đọc', f.passage));
      if (f.keywords) scroll.appendChild(createDetailSection('Bảng Từ khóa & Paraphrase (Keyword Table)', f.keywords));
      if (f.sentence) scroll.appendChild(createDetailSection('Phân tích câu phức tạp / Dịch nghĩa', f.sentence));
      if (f.tips) scroll.appendChild(createDetailSection('Mẹo làm bài & Bẫy đề cần tránh', f.tips));
      if (f.explanation) scroll.appendChild(createDetailSection('Giải đề chi tiết (Đáp án & Câu chứa đáp án)', f.explanation));
    } else if (currentItem.skill === 'listening') {
      if (f.context) scroll.appendChild(createDetailSection('Nội dung câu hỏi nghe / Bối cảnh', f.context));
      if (f.spelling) scroll.appendChild(createDetailSection('Từ vựng & Cạm bẫy phát âm (Luyện phát âm/Chính tả)', f.spelling));
      if (f.vocab) scroll.appendChild(createDetailSection('Từ vựng trọng tâm bài nghe', f.vocab));
      if (f.transcript) scroll.appendChild(createDetailSection('Phân tích Transcript / Lỗi sai của bản thân', f.transcript));
      if (f.explanation) scroll.appendChild(createDetailSection('Giải đề chi tiết (Đáp án & Lời thoại chứa đáp án)', f.explanation));
    } else if (currentItem.skill === 'math') {
      if (f.mathProblem) scroll.appendChild(createDetailSection('Đề bài / Bài toán mẫu', f.mathProblem));
      if (f.mathTheory) scroll.appendChild(createDetailSection('Công thức & Lý thuyết liên quan', f.mathTheory));
      if (f.mathSteps) scroll.appendChild(createDetailSection('Phương pháp & Các bước giải quyết', f.mathSteps));
      if (f.mathSolution) scroll.appendChild(createDetailSection('Lời giải chi tiết & Lưu ý quan trọng', f.mathSolution));
    } else if (currentItem.skill === 'korean') {
      if (f.koreanVocab) scroll.appendChild(createDetailSection('Từ vựng & Ngữ pháp mới', f.koreanVocab));
      if (f.koreanDialogue) scroll.appendChild(createDetailSection('Hội thoại mẫu & Ví dụ', f.koreanDialogue));
      if (f.koreanPron) scroll.appendChild(createDetailSection('Ghi chú phát âm & Ngữ điệu', f.koreanPron));
      if (f.koreanTranslation) scroll.appendChild(createDetailSection('Bản dịch nghĩa tiếng Việt & Văn hóa', f.koreanTranslation));
    } else if (currentItem.skill === 'japanese') {
      if (f.japaneseVocab) scroll.appendChild(createDetailSection('Kanji, Từ vựng & Ngữ pháp (N5 - N1)', f.japaneseVocab));
      if (f.japaneseDialogue) scroll.appendChild(createDetailSection('Hội thoại / Câu ví dụ thực tế', f.japaneseDialogue));
      if (f.japaneseTranslation) scroll.appendChild(createDetailSection('Dịch nghĩa & Giải thích chi tiết', f.japaneseTranslation));
    } else if (currentItem.skill === 'coding') {
      if (f.codingProblem) scroll.appendChild(createDetailSection('Yêu cầu thuật toán / Bài toán code', f.codingProblem));
      if (f.codingConcept) scroll.appendChild(createDetailSection('Khái niệm cốt lõi & Cấu trúc dữ liệu', f.codingConcept));
      if (f.codingSolution) {
        const codeSec = createDetailSection('Mã nguồn mẫu / Snippet Code', f.codingSolution);
        const valDiv = codeSec.querySelector('.detail-section-val');
        if (valDiv) {
          valDiv.style.fontFamily = 'monospace';
          valDiv.style.whiteSpace = 'pre-wrap';
          valDiv.style.background = 'rgba(0,0,0,0.2)';
          valDiv.style.padding = '10px';
          valDiv.style.borderRadius = '6px';
          valDiv.style.border = '1px solid rgba(255,255,255,0.05)';
        }
        scroll.appendChild(codeSec);
      }
      if (f.codingAnalysis) scroll.appendChild(createDetailSection('Giải thích thuật toán & Độ phức tạp (Big O)', f.codingAnalysis));
    } else {
      if (f.genTheory) scroll.appendChild(createDetailSection('Lý thuyết trọng tâm & Nội dung bài học', f.genTheory));
      if (f.genExercise) scroll.appendChild(createDetailSection('Bài tập tự luyện & Câu hỏi', f.genExercise));
      if (f.genSolution) scroll.appendChild(createDetailSection('Đáp án & Giải thích chi tiết', f.genSolution));
    }
  } else {
    // General subject (legacy)
    if (currentItem.subject === 'math') {
      if (f.problem) scroll.appendChild(createDetailSection('Đề bài / Bài toán mẫu', f.problem));
      if (f.theory) scroll.appendChild(createDetailSection('Công thức & Lý thuyết liên quan', f.theory));
      if (f.steps) scroll.appendChild(createDetailSection('Phương pháp & Các bước giải quyết', f.steps));
      if (f.solution) scroll.appendChild(createDetailSection('Lời giải chi tiết & Lưu ý quan trọng', f.solution));
    } else if (currentItem.subject === 'korean') {
      if (f.vocab) scroll.appendChild(createDetailSection('Từ vựng & Ngữ pháp mới', f.vocab));
      if (f.dialogue) scroll.appendChild(createDetailSection('Hội thoại mẫu & Ví dụ', f.dialogue));
      if (f.pron) scroll.appendChild(createDetailSection('Ghi chú phát âm & Ngữ điệu', f.pron));
      if (f.translation) scroll.appendChild(createDetailSection('Bản dịch nghĩa tiếng Việt & Văn hóa', f.translation));
    } else if (currentItem.subject === 'japanese') {
      if (f.vocab) scroll.appendChild(createDetailSection('Kanji, Từ vựng & Ngữ pháp (N5 - N1)', f.vocab));
      if (f.dialogue) scroll.appendChild(createDetailSection('Hội thoại / Câu ví dụ thực tế', f.dialogue));
      if (f.translation) scroll.appendChild(createDetailSection('Dịch nghĩa & Giải thích chi tiết', f.translation));
    } else if (currentItem.subject === 'coding') {
      if (f.problem) scroll.appendChild(createDetailSection('Yêu cầu thuật toán / Bài toán code', f.problem));
      if (f.concept) scroll.appendChild(createDetailSection('Khái niệm cốt lõi & Cấu trúc dữ liệu', f.concept));
      if (f.solution) {
        const codeSec = createDetailSection('Mã nguồn mẫu / Snippet Code', f.solution);
        const valDiv = codeSec.querySelector('.detail-section-val');
        if (valDiv) {
          valDiv.style.fontFamily = 'monospace';
          valDiv.style.whiteSpace = 'pre-wrap';
          valDiv.style.background = 'rgba(0,0,0,0.2)';
          valDiv.style.padding = '10px';
          valDiv.style.borderRadius = '6px';
          valDiv.style.border = '1px solid rgba(255,255,255,0.05)';
        }
        scroll.appendChild(codeSec);
      }
      if (f.analysis) scroll.appendChild(createDetailSection('Giải thích thuật toán & Độ phức tạp (Big O)', f.analysis));
    } else if (currentItem.subject === 'other') {
      if (f.theory) scroll.appendChild(createDetailSection('Lý thuyết trọng tâm & Nội dung bài học', f.theory));
      if (f.exercise) scroll.appendChild(createDetailSection('Bài tập tự luyện & Câu hỏi', f.exercise));
      if (f.solution) scroll.appendChild(createDetailSection('Đáp án & Giải thích chi tiết', f.solution));
    }
  }

  // Setup search delegation and text selection for study details
  if (studyScrollClickHandler) {
    scroll.removeEventListener('click', studyScrollClickHandler);
  }
  studyScrollClickHandler = (e) => {
    const btn = e.target.closest('.vocab-search-btn');
    if (btn) {
      const word = btn.dataset.search;
      performSearch(word, scroll);
      return;
    }

    const sectionEl = e.target.closest('.detail-section');
    if (sectionEl) {
      // Only allow click-to-speak if TTS has been started (is playing or is paused)
      if (!ttsIsPlaying && !ttsIsPaused) {
        return;
      }
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        return;
      }
      if (typeof speakFromSectionElement === 'function') {
        speakFromSectionElement(sectionEl);
      }
    }
  };
  scroll.addEventListener('click', studyScrollClickHandler);
  
  setupTextSelectionSearch(scroll, vaultType);
  setupVocabHoverTooltips(scroll);

  // Update navigation controls state
  const prevBtn = document.getElementById('btnPrevItem');
  const nextBtn = document.getElementById('btnNextItem');
  const positionIndicator = document.getElementById('navPositionIndicator');
  
  if (positionIndicator && filteredVaultItems.length > 0) {
    positionIndicator.textContent = `${filteredItemIndex + 1} / ${filteredVaultItems.length}`;
  } else if (positionIndicator) {
    positionIndicator.textContent = `0 / 0`;
  }
  if (prevBtn) prevBtn.disabled = (filteredItemIndex <= 0);
  if (nextBtn) nextBtn.disabled = (filteredItemIndex >= filteredVaultItems.length - 1);

  // Update visual read count state
  const lblReadCount = document.getElementById('lblReadCount');
  if (lblReadCount) {
    lblReadCount.textContent = currentItem.mastery || 0;
  }

  // Re-apply or reset bilingual translate state
  if (isBilingualActive) {
    setTimeout(() => {
      applyBilingualTranslate(true);
    }, 50);
  } else {
    const transBtn = document.getElementById('btnBilingualTranslate');
    if (transBtn) {
      transBtn.textContent = '🌐 Dịch song ngữ';
      transBtn.style.background = 'rgba(236, 72, 153, 0.15)';
      transBtn.style.color = '#f472b6';
    }
  }
}

function escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let currentVocabMap = {};

function buildVocabMap(vocabText) {
  const map = {};
  if (!vocabText) return map;
  
  const lines = vocabText.split('\n');
  lines.forEach(line => {
    if (line.trim() === '') return;
    const term = extractSearchTerm(line);
    if (term && term.length > 1) {
      let definition = line.trim();
      const clean = line.trim();
      if (clean.startsWith('|') && clean.endsWith('|')) {
        const parts = clean.split('|').map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          definition = `${parts[0]} ➔ ${parts[1]}`;
        }
      }
      map[term.toLowerCase()] = definition;
    }
  });
  
  return map;
}

function shouldEnrichSection(label) {
  const lbl = label.toLowerCase();
  return lbl.includes('bài mẫu') || 
         lbl.includes('bài nói mẫu') || 
         lbl.includes('đoạn văn đọc') || 
         lbl.includes('transcript') || 
         lbl.includes('hội thoại') || 
         lbl.includes('lý thuyết');
}

function enrichScriptWithVocab(scriptText, vocabMap) {
  const keys = Object.keys(vocabMap).sort((a, b) => b.length - a.length);
  if (keys.length === 0) return escHtml(scriptText);
  
  let text = scriptText;
  const placeholders = [];
  
  keys.forEach((key, index) => {
    const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b(${escapedKey})\\b`, 'gi');
    
    text = text.replace(regex, (match) => {
      const placeholder = `___VOCAB_${index}_${placeholders.length}___`;
      placeholders.push({
        placeholder: placeholder,
        word: match,
        vocabKey: key,
        definition: vocabMap[key]
      });
      return placeholder;
    });
  });
  
  let escapedHtml = escHtml(text);
  
  placeholders.forEach(p => {
    const spanHtml = `<span class="vocab-inline-hover" data-vocab="${escHtml(p.vocabKey)}" data-definition="${escHtml(p.definition)}">${escHtml(p.word)}</span>`;
    escapedHtml = escapedHtml.replace(p.placeholder, spanHtml);
  });
  
  return escapedHtml;
}

let hoverTooltip = null;
let currentMouseEnterHandler = null;
let currentMouseLeaveHandler = null;

function setupVocabHoverTooltips(containerEl) {
  if (currentMouseEnterHandler) {
    containerEl.removeEventListener('mouseenter', currentMouseEnterHandler, { capture: true });
  }
  if (currentMouseLeaveHandler) {
    containerEl.removeEventListener('mouseleave', currentMouseLeaveHandler, { capture: true });
  }

  const handleMouseEnter = (e) => {
    const el = e.target.closest('.vocab-inline-hover');
    if (!el) return;
    
    const def = el.dataset.definition;
    if (!def) return;
    
    showHoverTooltip(el, def);
  };
  
  const handleMouseLeave = (e) => {
    const el = e.target.closest('.vocab-inline-hover');
    if (!el) return;
    
    hideHoverTooltip();
  };
  
  currentMouseEnterHandler = handleMouseEnter;
  currentMouseLeaveHandler = handleMouseLeave;
  
  containerEl.addEventListener('mouseenter', handleMouseEnter, { capture: true });
  containerEl.addEventListener('mouseleave', handleMouseLeave, { capture: true });
  
  function showHoverTooltip(targetEl, text) {
    if (!hoverTooltip) {
      hoverTooltip = document.createElement('div');
      hoverTooltip.className = 'vocab-hover-tooltip';
      Object.assign(hoverTooltip.style, {
        position: 'fixed',
        zIndex: '10000',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(8px)',
        color: '#f8fafc',
        padding: '8px 14px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '500',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.08)',
        pointerEvents: 'none',
        maxWidth: '300px',
        whiteSpace: 'pre-wrap',
        fontFamily: 'inherit',
        opacity: '0',
        transition: 'opacity 0.15s, transform 0.15s',
        transform: 'translateY(5px)'
      });
      document.body.appendChild(hoverTooltip);
    }
    
    hoverTooltip.textContent = text;
    
    const rect = targetEl.getBoundingClientRect();
    
    const tooltipHeight = hoverTooltip.offsetHeight || 42;
    const tooltipWidth = hoverTooltip.offsetWidth || 220;
    
    let top = rect.top - tooltipHeight - 8;
    let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    
    if (top < 8) {
      top = rect.bottom + 8;
    }
    if (left < 8) left = 8;
    if (left + tooltipWidth > window.innerWidth) left = window.innerWidth - tooltipWidth - 8;
    
    hoverTooltip.style.top = `${top}px`;
    hoverTooltip.style.left = `${left}px`;
    hoverTooltip.style.opacity = '1';
    hoverTooltip.style.transform = 'translateY(0)';
  }
  
  function hideHoverTooltip() {
    if (hoverTooltip) {
      hoverTooltip.style.opacity = '0';
      hoverTooltip.style.transform = 'translateY(5px)';
    }
  }
}

function createDetailSection(label, val) {
  const div = document.createElement('div');
  div.className = 'detail-section';
  
  const isVocab = label.toLowerCase().includes('từ vựng') || label.toLowerCase().includes('vocab');
  
  if (isVocab && val) {
    const lines = val.split('\n');
    let htmlContent = '';
    lines.forEach(line => {
      if (line.trim() === '') {
        htmlContent += '<div style="height: 10px;"></div>';
        return;
      }
      const searchTerm = extractSearchTerm(line);
      if (searchTerm && searchTerm.length > 1) {
        htmlContent += `
          <div class="vocab-line">
            <span class="vocab-text">${escHtml(line)}</span>
            <button class="vocab-search-btn" data-search="${escHtml(searchTerm)}" title="Tìm trong bài mẫu">🔍</button>
          </div>
        `;
      } else {
        htmlContent += `<div style="padding: 4px 8px; margin-bottom: 2px;">${escHtml(line)}</div>`;
      }
    });
    
    div.innerHTML = `
      <div class="detail-section-lbl">${escHtml(label)}</div>
      <div class="detail-section-val" style="white-space: normal;">${htmlContent}</div>
    `;
  } else {
    let contentHtml;
    if (currentVocabMap && shouldEnrichSection(label)) {
      contentHtml = enrichScriptWithVocab(val, currentVocabMap);
    } else {
      contentHtml = escHtml(val);
    }
    
    div.innerHTML = `
      <div class="detail-section-lbl">${escHtml(label)}</div>
      <div class="detail-section-val">${contentHtml}</div>
    `;
  }
  
  return div;
}

function extractSearchTerm(line) {
  let clean = line.trim();
  
  if (clean.startsWith('|') && clean.endsWith('|')) {
    const parts = clean.split('|').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      if (parts[0].includes('Từ khóa') || parts[0].includes('---')) {
        return '';
      }
      return parts[0];
    }
  }
  
  clean = clean.replace(/^[\d\s.\-*•+]+/g, '');
  const parts = clean.split(/[:\-–—(（]/);
  if (parts.length > 0) {
    return parts[0].trim();
  }
  return clean;
}

function highlightWordInDetailSection(sectionEl, word) {
  if (!word || word.trim() === "") return false;
  
  const valDiv = sectionEl.querySelector('.detail-section-val');
  if (!valDiv) return false;
  
  if (!valDiv.dataset.originalText) {
    valDiv.dataset.originalText = valDiv.innerText;
  }
  
  const originalText = valDiv.dataset.originalText;
  const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedWord})`, 'gi');
  
  if (!regex.test(originalText)) {
    return false;
  }
  
  const highlightedHtml = escHtml(originalText).replace(
    new RegExp(`(${escHtml(word)})`, 'gi'), 
    '<mark class="search-highlight" style="background: #f59e0b; color: #000; font-weight: bold; border-radius: 4px; padding: 2px 4px; box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);">$1</mark>'
  );
  
  valDiv.innerHTML = highlightedHtml;
  
  const mark = valDiv.querySelector('.search-highlight');
  if (mark) {
    mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    mark.style.animation = 'pulse-highlight 1.5s infinite';
    
    if (!document.getElementById('pulse-highlight-style')) {
      const style = document.createElement('style');
      style.id = 'pulse-highlight-style';
      style.innerHTML = `
        @keyframes pulse-highlight {
          0% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.6); }
          50% { box-shadow: 0 0 16px rgba(245, 158, 11, 1); transform: scale(1.05); }
          100% { box-shadow: 0 0 8px rgba(245, 158, 11, 0.6); }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  return true;
}

function clearHighlights(containerEl) {
  containerEl.querySelectorAll('.detail-section').forEach(sectionEl => {
    const valDiv = sectionEl.querySelector('.detail-section-val');
    if (valDiv && valDiv.dataset.originalText) {
      valDiv.textContent = valDiv.dataset.originalText;
      delete valDiv.dataset.originalText;
    }
  });
}

function performSearch(word, containerEl) {
  if (!word || word.trim() === "") return;
  
  clearHighlights(containerEl);
  
  const sections = containerEl.querySelectorAll('.detail-section');
  const targetKeywords = [
    "bài mẫu", "sample", "transcript", "đoạn văn đọc", "passage", 
    "hội thoại", "dialogue", "đề bài", "problem", "mã nguồn", 
    "solution", "lý thuyết", "theory"
  ];
  
  let targetSection = null;
  
  for (const keyword of targetKeywords) {
    for (const section of sections) {
      const lblEl = section.querySelector('.detail-section-lbl');
      if (lblEl) {
        const label = lblEl.textContent.toLowerCase();
        if (label.includes(keyword)) {
          const valDiv = section.querySelector('.detail-section-val');
          if (valDiv) {
            const txt = valDiv.textContent;
            const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(escapedWord, 'i');
            if (regex.test(txt)) {
              targetSection = section;
              break;
            }
          }
        }
      }
    }
    if (targetSection) break;
  }
  
  if (!targetSection) {
    for (const section of sections) {
      const valDiv = section.querySelector('.detail-section-val');
      if (valDiv) {
        const txt = valDiv.textContent;
        const escapedWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(escapedWord, 'i');
        if (regex.test(txt)) {
          targetSection = section;
          break;
        }
      }
    }
  }
  
  if (targetSection) {
    highlightWordInDetailSection(targetSection, word);
  } else {
    alert(`Không tìm thấy cụm từ "${word}" trong các phần tài liệu học ở trên.`);
  }
}

let selectionTooltip = null;

async function addWordToVocabularyDirect(word, translation, type) {
  if (!currentItem) return;
  
  const isReading = type === 'ielts' && currentItem.skill === 'reading';
  
  if (isReading) {
    const newRow = `| ${word} | ${translation} |`;
    if (!currentItem.fields.keywords || !currentItem.fields.keywords.trim()) {
      currentItem.fields.keywords = `| Từ khóa trong Câu hỏi | Từ đồng nghĩa / Cụm từ trong Bài đọc |\n|---|---|\n${newRow}`;
    } else {
      const lines = currentItem.fields.keywords.split('\n');
      const exists = lines.some(line => {
        const term = extractSearchTerm(line);
        return term.toLowerCase() === word.toLowerCase();
      });
      if (exists) {
        alert(`Từ "${word}" đã có trong bảng từ khóa.`);
        return;
      }
      currentItem.fields.keywords = currentItem.fields.keywords.trim() + '\n' + newRow;
    }
  } else {
    const newVocabLine = `${word}: ${translation}`;
    if (!currentItem.fields.vocab) {
      currentItem.fields.vocab = newVocabLine;
    } else {
      const lines = currentItem.fields.vocab.split('\n');
      const exists = lines.some(line => {
        const term = extractSearchTerm(line);
        return term.toLowerCase() === word.toLowerCase();
      });
      if (exists) {
        alert(`Từ "${word}" đã có trong danh sách từ vựng.`);
        return;
      }
      currentItem.fields.vocab = currentItem.fields.vocab.trim() + '\n' + newVocabLine;
    }
  }
  
  if (type === 'ielts') {
    const data = await window.taskAPI.loadIeltsVault();
    const idx = data.items.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      data.items[idx] = currentItem;
      await window.taskAPI.saveIeltsVault(data);
    }
  } else {
    const data = await window.taskAPI.loadGeneralVault();
    const idx = data.items.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      data.items[idx] = currentItem;
      await window.taskAPI.saveGeneralVault(data);
    }
  }
  
  renderItem();
  
  playTone(800, 0.1, 'sine', 0.2);
  alert(`Đã thêm thành công "${word}" vào ${isReading ? 'bảng từ khóa' : 'danh sách từ vựng'}!`);
}

function showTkToast(msg) {
  let toast = document.getElementById('tkCustomFloatingToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'tkCustomFloatingToast';
    toast.style.cssText = 'position: fixed; bottom: 25px; right: 25px; background: linear-gradient(135deg, #1e1b2e 0%, #2d1b4e 100%); border: 1.5px solid #00f2fe; color: #fff; padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 700; box-shadow: 0 10px 25px rgba(0,0,0,0.6); z-index: 9999999; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform: translateY(20px); opacity: 0; pointer-events: none; display: flex; align-items: center; gap: 8px;';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span style="font-size: 16px;">✨</span> <span>${msg}</span>`;
  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
  }, 3500);
}

async function saveWordToTiktokFlashcardDirect(word, translation) {
  if (!word || !word.trim()) return;
  const cleanWord = word.trim();
  let cleanTrans = (translation || '').trim();

  // 1. Fallback translation if not provided
  if (!cleanTrans || cleanTrans === 'Đang cập nhật' || cleanTrans.includes('Không tìm thấy')) {
    if (window.taskAPI && window.taskAPI.translateText) {
      try {
        const rawRes = await window.taskAPI.translateText(cleanWord, 'vi');
        if (typeof rawRes === 'string') {
          cleanTrans = rawRes;
        } else if (Array.isArray(rawRes) && Array.isArray(rawRes[0])) {
          cleanTrans = rawRes[0].map(item => item && item[0] ? item[0] : '').filter(Boolean).join(' ');
        }
      } catch (e) {}
    }
  }
  if (!cleanTrans || cleanTrans.includes('Không tìm thấy')) cleanTrans = 'Đang cập nhật';

  // 2. Generate 5 speaking & writing examples
  let notes = [
    `🗣️ Speaking 1: "In daily life, I often encounter the need to ${cleanWord} to reach my goals."`,
    `🗣️ Speaking 2: "From my perspective, using the word '${cleanWord}' makes answers sound natural."`,
    `✍️ Writing 1: "In academic discussions, the concept of '${cleanWord}' is frequently highlighted."`,
    `✍️ Writing 2: "Numerous studies demonstrate how '${cleanWord}' can significantly influence results."`,
    `✍️ Writing 3: "Therefore, gaining a deep understanding of '${cleanWord}' is essential."`
  ].join('\n');

  // Try fetching Gemini if available
  const apiKey = localStorage.getItem('gemini_api_key') || localStorage.getItem('GEMINI_API_KEY') || localStorage.getItem('ielts_gemini_api_key') || '';
  if (apiKey) {
    try {
      const promptText = `Bạn là chuyên gia IELTS. Hãy phân tích từ/câu: "${cleanWord}".
Trả về duy nhất 1 JSON object:
{
  "translation": "Nghĩa tiếng Việt ngắn gọn",
  "examples": [
    "🗣️ Speaking 1: [Câu ví dụ giao tiếp thực tế] - [Dịch tiếng Việt]",
    "🗣️ Speaking 2: [Câu ví dụ giao tiếp thực tế] - [Dịch tiếng Việt]",
    "✍️ Writing 1: [Câu ví dụ học thuật/văn viết] - [Dịch tiếng Việt]",
    "✍️ Writing 2: [Câu ví dụ học thuật/văn viết] - [Dịch tiếng Việt]",
    "✍️ Writing 3: [Câu ví dụ học thuật/văn viết] - [Dịch tiếng Việt]"
  ]
}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        const rawText = json.candidates[0].content.parts[0].text.trim();
        let parsed = null;
        try {
          let clean = rawText;
          if (clean.startsWith('```json')) clean = clean.substring(7);
          if (clean.startsWith('```')) clean = clean.substring(3);
          if (clean.endsWith('```')) clean = clean.substring(0, clean.length - 3);
          parsed = JSON.parse(clean.trim());
        } catch (e) {
          const m = rawText.match(/\{[\s\S]*\}/);
          if (m) parsed = JSON.parse(m[0]);
        }
        if (parsed) {
          if (parsed.translation) cleanTrans = parsed.translation;
          if (Array.isArray(parsed.examples) && parsed.examples.length > 0) {
            notes = parsed.examples.join('\n');
          }
        }
      }
    } catch (e) {}
  }

  // 3. Load Memorize Vault
  let vaultData = { items: [] };
  if (window.taskAPI && window.taskAPI.loadMemorizeVault) {
    try {
      const loaded = await window.taskAPI.loadMemorizeVault();
      if (loaded && Array.isArray(loaded.items)) vaultData = loaded;
    } catch (e) {}
  }

  // 4. Extract TikTok video from selected/last chosen music
  let tiktokUrl = '';
  let chosenMusicUrl = localStorage.getItem('tk_last_chosen_music_url') || '';
  if (window.taskAPI && window.taskAPI.loadTiktokMusic) {
    try {
      const musicData = await window.taskAPI.loadTiktokMusic();
      if (musicData) {
        if (musicData.lastChosenUrl) {
          chosenMusicUrl = musicData.lastChosenUrl;
        } else if (Array.isArray(musicData.items) && musicData.items.length > 0) {
          chosenMusicUrl = musicData.items[0].url;
        }
      }
    } catch (e) {}
  }
  if (!chosenMusicUrl) {
    chosenMusicUrl = 'https://www.tiktok.com/music/Perfect-6655492047723563778';
  }
  if (window.taskAPI && window.taskAPI.extractTiktokMusicVideos) {
    try {
      const res = await window.taskAPI.extractTiktokMusicVideos(chosenMusicUrl);
      if (res && res.success && Array.isArray(res.videos) && res.videos.length > 0) {
        const randomIndex = Math.floor(Math.random() * res.videos.length);
        tiktokUrl = res.videos[randomIndex];
      }
    } catch (e) {}
  }
  if (!tiktokUrl) {
    tiktokUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(cleanWord)}`;
  }

  // 5. Check if card already exists or create new
  let existing = vaultData.items.find(x => x.word && x.word.toLowerCase().trim() === cleanWord.toLowerCase());
  if (existing) {
    existing.translation = cleanTrans;
    existing.notes = notes;
    existing.tiktokUrl = tiktokUrl;
    existing.linkType = 'direct';
  } else {
    const newItem = {
      id: 'tk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      word: cleanWord,
      translation: cleanTrans,
      notes: notes,
      tiktokUrl: tiktokUrl,
      linkType: 'direct',
      level: 1,
      interval: 1,
      nextReviewDate: new Date().toISOString().split('T')[0]
    };
    vaultData.items.unshift(newItem);
  }

  // 6. Save back to Vault
  if (window.taskAPI && window.taskAPI.saveMemorizeVault) {
    await window.taskAPI.saveMemorizeVault(vaultData);
  }

  // Visual & Audio confirmation
  if (typeof playTone === 'function') {
    playTone(523, 0.08, 'sine', 0.1);
    setTimeout(() => playTone(784, 0.12, 'sine', 0.15), 100);
  }

  showTkToast(`Đã tự động lưu từ "${cleanWord}" vào Flashcard TikTok!`);
}

let currentSelectionHandler = null;
let currentMouseDownHandler = null;
let currentDblClickHandler = null;
let anchorWordRange = null;
let ttsPronounceTimeout = null;

function findFirstTextNode(el) {
  if (!el) return null;
  if (el.nodeType === Node.TEXT_NODE) return el;
  for (let i = 0; i < el.childNodes.length; i++) {
    const res = findFirstTextNode(el.childNodes[i]);
    if (res) return res;
  }
  return null;
}

function getWordRangeAtPoint(x, y) {
  let range = null;
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  } else if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(x, y);
    if (pos && pos.offsetNode) {
      range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.setEnd(pos.offsetNode, pos.offset);
    }
  }

  if (!range) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      range = sel.getRangeAt(0);
    }
  }

  if (!range) return null;

  let node = range.startContainer;
  let offset = range.startOffset;

  if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.childNodes.length > 0) {
      const idx = Math.max(0, Math.min(offset, node.childNodes.length - 1));
      const child = node.childNodes[idx];
      if (child.nodeType === Node.TEXT_NODE) {
        node = child;
        offset = 0;
      } else {
        const textChild = findFirstTextNode(child);
        if (textChild) {
          node = textChild;
          offset = 0;
        }
      }
    }
  }

  if (node.nodeType !== Node.TEXT_NODE) {
    return range;
  }

  const text = node.nodeValue || '';
  if (!text) return range;

  const isWordChar = (c) => Boolean(c && /[\p{L}\p{N}_'\-]/u.test(c));

  let pos = Math.min(offset, text.length);
  if (pos > 0 && !isWordChar(text[pos]) && isWordChar(text[pos - 1])) {
    pos--;
  } else if (!isWordChar(text[pos])) {
    if (pos + 1 < text.length && isWordChar(text[pos + 1])) {
      pos++;
    } else if (pos > 0 && isWordChar(text[pos - 1])) {
      pos--;
    }
  }

  let start = pos;
  while (start > 0 && isWordChar(text[start - 1])) {
    start--;
  }

  let end = pos;
  while (end < text.length && isWordChar(text[end])) {
    end++;
  }

  if (start === end) {
    start = Math.max(0, pos);
    end = Math.min(text.length, pos + 1);
  }

  const wordRange = document.createRange();
  wordRange.setStart(node, start);
  wordRange.setEnd(node, end);
  return wordRange;
}

function mergeRanges(rangeA, rangeB) {
  if (!rangeA) return rangeB;
  if (!rangeB) return rangeA;

  const newRange = document.createRange();
  try {
    const startComp = rangeA.compareBoundaryPoints(Range.START_TO_START, rangeB);
    if (startComp <= 0) {
      newRange.setStart(rangeA.startContainer, rangeA.startOffset);
    } else {
      newRange.setStart(rangeB.startContainer, rangeB.startOffset);
    }

    const endComp = rangeA.compareBoundaryPoints(Range.END_TO_END, rangeB);
    if (endComp >= 0) {
      newRange.setEnd(rangeA.endContainer, rangeA.endOffset);
    } else {
      newRange.setEnd(rangeB.endContainer, rangeB.endOffset);
    }
    return newRange;
  } catch (e) {
    console.warn('mergeRanges error:', e);
    return rangeB || rangeA;
  }
}

function setupTextSelectionSearch(containerEl, type) {
  if (currentSelectionHandler) {
    document.removeEventListener('selectionchange', currentSelectionHandler);
  }
  if (currentMouseDownHandler) {
    document.removeEventListener('mousedown', currentMouseDownHandler);
  }
  if (currentDblClickHandler) {
    document.removeEventListener('dblclick', currentDblClickHandler);
  }

  const handleSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      if (ttsPronounceTimeout) {
        clearTimeout(ttsPronounceTimeout);
        ttsPronounceTimeout = null;
      }
      hideTooltip();
      return;
    }
    const selectedText = selection.toString().trim();
    
    if (!selectedText || selectedText.length < 1) {
      if (ttsPronounceTimeout) {
        clearTimeout(ttsPronounceTimeout);
        ttsPronounceTimeout = null;
      }
      hideTooltip();
      return;
    }
    
    let node = selection.anchorNode;
    let isInsideValue = false;
    while (node) {
      if (node.classList && node.classList.contains('detail-section-val')) {
        isInsideValue = true;
        break;
      }
      node = node.parentNode;
    }
    
    if (!isInsideValue) {
      if (ttsPronounceTimeout) {
        clearTimeout(ttsPronounceTimeout);
        ttsPronounceTimeout = null;
      }
      hideTooltip();
      return;
    }
    
    // Trigger pronunciation after a 350ms debounce
    if (typeof speakPronunciation === 'function') {
      if (ttsPronounceTimeout) {
        clearTimeout(ttsPronounceTimeout);
      }
      ttsPronounceTimeout = setTimeout(() => {
        speakPronunciation(selectedText);
      }, 350);
    }

    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      showTooltip(rect, selectedText, containerEl);
    }
  };
  
  let hideSelectionTimeout = null;

  const handleMouseDown = (e) => {
    if (selectionTooltip && !selectionTooltip.contains(e.target)) {
      if (hideSelectionTimeout) clearTimeout(hideSelectionTimeout);
      hideSelectionTimeout = setTimeout(hideTooltip, 150);
    }
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
      anchorWordRange = null;
    }
  };

  const handleDblClick = (e) => {
    const targetVal = e.target.closest ? e.target.closest('.detail-section-val') : null;
    if (!targetVal) return;

    const clickedWordRange = getWordRangeAtPoint(e.clientX, e.clientY);
    if (!clickedWordRange) return;

    const isModifierPressed = Boolean(e.ctrlKey || e.metaKey || e.shiftKey);
    const existingSel = window.getSelection();
    const existingRange = (existingSel && existingSel.rangeCount > 0 && !existingSel.isCollapsed) 
      ? existingSel.getRangeAt(0) 
      : null;

    const activeAnchor = anchorWordRange || existingRange;

    if (isModifierPressed && activeAnchor) {
      try {
        const combinedRange = mergeRanges(activeAnchor, clickedWordRange);
        anchorWordRange = activeAnchor; // keep origin anchor
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(combinedRange);
        handleSelection();
        e.preventDefault();
        return;
      } catch (err) {
        console.warn('Error expanding range on Ctrl+dblclick:', err);
      }
    }

    // Single word double-click sets the anchor
    anchorWordRange = clickedWordRange.cloneRange();
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(clickedWordRange);
    handleSelection();
    e.preventDefault();
  };
  
  currentSelectionHandler = handleSelection;
  currentMouseDownHandler = handleMouseDown;
  currentDblClickHandler = handleDblClick;
  
  document.addEventListener('selectionchange', handleSelection);
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('dblclick', handleDblClick);
  
  async function showTooltip(rect, text, containerEl) {
    if (hideSelectionTimeout) {
      clearTimeout(hideSelectionTimeout);
      hideSelectionTimeout = null;
    }

    if (!selectionTooltip) {
      selectionTooltip = document.createElement('div');
      selectionTooltip.className = 'selection-search-tooltip';
      Object.assign(selectionTooltip.style, {
        position: 'fixed',
        zIndex: '10000',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(8px)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        cursor: 'default',
        padding: '10px 14px',
        display: 'none',
        flexDirection: 'column',
        gap: '6px',
        maxWidth: '260px',
        fontFamily: 'inherit'
      });
      document.body.appendChild(selectionTooltip);
    }
    
    const tooltipHeight = 85;
    const tooltipWidth = 240;
    
    let top = rect.top + window.scrollY - tooltipHeight - 10;
    let left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
    
    if (top < window.scrollY) top = rect.bottom + window.scrollY + 10;
    if (left < 8) left = 8;
    if (left + tooltipWidth > window.innerWidth) left = window.innerWidth - tooltipWidth - 8;
    
    selectionTooltip.style.top = `${top}px`;
    selectionTooltip.style.left = `${left}px`;
    selectionTooltip.style.display = 'flex';
    
    selectionTooltip.innerHTML = `
      <div style="font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Dịch nghĩa</div>
      <div class="translation-text" style="font-size: 13px; font-weight: 500; color: #f8fafc; line-height: 1.4;">⏳ Đang dịch...</div>
      <div style="display: flex; gap: 5px; margin-top: 4px;">
        <button class="tooltip-search-btn" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 5px 6px; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; flex: 1; outline: none; transition: background 0.2s;">🔍 Tìm</button>
        <button class="tooltip-add-btn" style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); border: none; color: #fff; padding: 5px 6px; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; flex: 1; display: none; outline: none; transition: transform 0.2s;">➕ Thêm từ</button>
        <button class="tooltip-tk-btn" style="background: linear-gradient(135deg, #ff0050 0%, #00f2fe 100%); border: none; color: #fff; padding: 5px 6px; border-radius: 6px; font-size: 10px; font-weight: 700; cursor: pointer; flex: 1.2; display: none; outline: none; transition: transform 0.2s; white-space: nowrap;">🎵 Flashcard</button>
      </div>
    `;
    
    const searchBtn = selectionTooltip.querySelector('.tooltip-search-btn');
    searchBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      performSearch(text, containerEl);
      hideTooltip();
    };
    
    try {
      let resJson;
      if (window.taskAPI && window.taskAPI.translateText) {
        resJson = await window.taskAPI.translateText(text, 'vi');
      } else {
        // Fallback in browser
        let success = false;
        try {
          const url = `https://translate.googleapis.com/translate_a/single?client=at&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
          const res = await fetch(url);
          if (res.ok) {
            resJson = await res.json();
            success = true;
          }
        } catch (e) {
          console.warn('[STUDY] Browser translation fetch failed:', e);
        }

        if (!success) {
          // Fallback to MyMemory API (which supports CORS)
          try {
            const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`;
            const res = await fetch(myMemoryUrl);
            if (res.ok) {
              const data = await res.json();
              if (data && data.responseData && data.responseData.translatedText) {
                resJson = [ [ [ data.responseData.translatedText, text ] ], null, 'en' ];
                success = true;
              }
            }
          } catch (e) {
            console.error('[STUDY] Browser fallback MyMemory API failed:', e);
          }
        }

        if (!success) {
          throw new Error('All browser-side translation fallbacks failed');
        }
      }
      
      const translation = resJson && resJson[0] && resJson[0][0] && resJson[0][0][0];
      if (translation && translation.toLowerCase().trim() !== text.toLowerCase().trim()) {
        const transEl = selectionTooltip.querySelector('.translation-text');
        if (transEl) transEl.textContent = translation;
        
        const addBtn = selectionTooltip.querySelector('.tooltip-add-btn');
        if (addBtn) {
          addBtn.style.display = 'block';
          addBtn.onclick = async (e) => {
            e.stopPropagation();
            e.preventDefault();
            hideTooltip();
            await addWordToVocabularyDirect(text, translation, type);
          };
        }

        const tkBtn = selectionTooltip.querySelector('.tooltip-tk-btn');
        if (tkBtn) {
          tkBtn.style.display = 'block';
          tkBtn.onclick = async (e) => {
            e.stopPropagation();
            e.preventDefault();
            hideTooltip();
            await saveWordToTiktokFlashcardDirect(text, translation);
          };
        }
      } else {
        const transEl = selectionTooltip.querySelector('.translation-text');
        if (transEl) transEl.textContent = 'Không tìm thấy bản dịch.';
      }
    } catch (err) {
      console.error('Translation error:', err);
      const transEl = selectionTooltip.querySelector('.translation-text');
      if (transEl) transEl.textContent = 'Lỗi kết nối dịch thuật.';
    }
  }
  
  function hideTooltip() {
    if (selectionTooltip) {
      selectionTooltip.style.display = 'none';
    }
  }
}

function speakPronunciation(text) {
  if (!text) return;
  text = text.trim();
  if (text.length === 0) return;

  // Clean up leading/trailing punctuation marks
  text = text.replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()?"']+|[.,\/#!$%\^&\*;:{}=\-_`~()?"']+$/g, "");
  if (text.length === 0) return;

  // Detect language
  const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  const lang = viRegex.test(text) ? 'vi-VN' : 'en-US';

  // Stop any active background speech readouts to read the clicked word immediately
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const bestVoice = getBestVoiceForLang(lang);
  if (bestVoice) {
    utterance.voice = bestVoice;
  }
  utterance.lang = lang;
  
  const rateVal = parseFloat(document.getElementById('ttsSpeedSelect')?.value) || 1.0;
  // Cap pronunciation speed at a max of 1.2x for better comprehension and clarity
  utterance.rate = Math.min(rateVal, 1.2);

  window.speechSynthesis.speak(utterance);
}

function createDetailSectionImage(base64) {
  const div = document.createElement('div');
  div.className = 'detail-image-box';
  div.style.position = 'relative';
  
  const img = document.createElement('img');
  img.src = base64;
  img.alt = 'Biểu đồ đính kèm';
  
  img.addEventListener('click', () => {
    if (!currentItem) return;
    const f = currentItem.fields;
    modalImages = f.images || (f.image ? [f.image] : []);
    const imgIndex = modalImages.indexOf(base64);
    currentModalImageIndex = imgIndex >= 0 ? imgIndex : 0;
    openImageModal();
  });

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'copy-img-btn';
  copyBtn.innerHTML = '📋 Sao chép ảnh';
  Object.assign(copyBtn.style, {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#f1f5f9',
    padding: '5px 9px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    zIndex: '101',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    outline: 'none'
  });

  copyBtn.addEventListener('mouseenter', () => {
    copyBtn.style.background = 'rgba(30, 41, 59, 0.9)';
    copyBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
  });
  copyBtn.addEventListener('mouseleave', () => {
    copyBtn.style.background = 'rgba(15, 23, 42, 0.75)';
    copyBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
  });

  copyBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      if (window.taskAPI && window.taskAPI.copyImage) {
        window.taskAPI.copyImage(base64);
      } else {
        const response = await fetch(base64);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
      }
      if (typeof playTone === 'function') playTone(660, 0.08, 'sine', 0.15);
      if (typeof SFX !== 'undefined' && SFX.complete) SFX.complete();
      alert('Đã sao chép ảnh vào Clipboard!');
    } catch (err) {
      console.error('Failed to copy image:', err);
      alert('Không thể sao chép ảnh: ' + err.message);
    }
  });
  
  div.appendChild(img);
  div.appendChild(copyBtn);
  return div;
}

// -------------------------------------------------------
// Text-To-Speech (TTS) Implementation
// -------------------------------------------------------
let ttsSections = [];
let ttsCurrentIndex = -1;
let ttsUtterance = null;
let ttsIsPlaying = false;
let ttsIsPaused = false;

function cleanTextForLanguage(text, lang) {
  if (!text) return '';
  if (!lang.toLowerCase().startsWith('en')) {
    return text;
  }
  
  const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  
  const lines = text.split('\n');
  const cleanedLines = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Process text inside parenthesis/brackets
    // If they contain Vietnamese accents, they are translations and should be stripped in English mode
    const tokens = line.split(/(\([^)]+\)|\[[^\]]+\])/g);
    const lineParts = [];
    
    for (let token of tokens) {
      if (!token) continue;
      
      const isParenthesis = token.startsWith('(') || token.startsWith('[');
      if (isParenthesis) {
        const cleanToken = token.slice(1, -1).trim();
        if (!viRegex.test(cleanToken)) {
          lineParts.push(cleanToken);
        }
      } else {
        // Non-parenthesis text: split by common delimiters like /, :, - to isolate English words/headings
        const subTokens = token.split(/\s*[\/|:-]\s*/);
        for (let sub of subTokens) {
          const cleanSub = sub.trim();
          if (cleanSub && !viRegex.test(cleanSub)) {
            lineParts.push(cleanSub);
          }
        }
      }
    }
    
    const cleanedLine = lineParts.join(' ').replace(/\s+/g, ' ').trim();
    if (cleanedLine) {
      cleanedLines.push(cleanedLine);
    }
  }
  
  return cleanedLines.join('\n');
}

function splitBilingualText(text) {
  if (!text) return [];
  
  const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  const lines = text.split('\n');
  const segments = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Split line by parenthesis/bracket blocks
    const tokens = line.split(/(\([^)]+\)|\[[^\]]+\])/g);
    
    for (let token of tokens) {
      if (!token) continue;
      
      const isParenthesis = token.startsWith('(') || token.startsWith('[');
      const cleanToken = isParenthesis ? token.slice(1, -1).trim() : token.trim();
      if (!cleanToken) continue;
      
      let lang = 'en-US';
      if (viRegex.test(cleanToken)) {
        lang = 'vi-VN';
      }
      
      const lastSeg = segments[segments.length - 1];
      if (lastSeg && lastSeg.lang === lang) {
        lastSeg.text += '. ' + cleanToken;
      } else {
        segments.push({
          text: cleanToken,
          lang: lang
        });
      }
    }
  }
  
  return segments;
}

function getBestVoiceForLang(langCode) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  let match = voices.find(v => v.lang.toLowerCase().startsWith(langCode.substring(0, 2).toLowerCase()));
  if (!match) {
    match = voices.find(v => v.lang.toLowerCase() === langCode.toLowerCase());
  }
  return match;
}

function speakFromSectionElement(sectionEl) {
  const secElements = document.querySelectorAll('#detailContentScroll .detail-section');
  ttsSections = Array.from(secElements).map(el => {
    const lblEl = el.querySelector('.detail-section-lbl');
    const valEl = el.querySelector('.detail-section-val');
    return {
      element: el,
      label: lblEl ? lblEl.textContent.trim() : '',
      value: valEl ? valEl.textContent.trim() : ''
    };
  }).filter(sec => sec.value.length > 0);

  const targetIndex = ttsSections.findIndex(s => s.element === sectionEl);
  if (targetIndex !== -1) {
    stopTts(false);
    
    ttsCurrentIndex = targetIndex;
    ttsIsPlaying = true;
    ttsIsPaused = false;
    updateTtsButtons();
    speakCurrentSection();
  }
}

function playTts() {
  if (ttsIsPaused) {
    window.speechSynthesis.resume();
    ttsIsPlaying = true;
    ttsIsPaused = false;
    updateTtsButtons();
    return;
  }

  stopTts(false);

  const secElements = document.querySelectorAll('#detailContentScroll .detail-section');
  ttsSections = Array.from(secElements).map(el => {
    const lblEl = el.querySelector('.detail-section-lbl');
    const valEl = el.querySelector('.detail-section-val');
    return {
      element: el,
      label: lblEl ? lblEl.textContent.trim() : '',
      value: valEl ? valEl.textContent.trim() : ''
    };
  }).filter(sec => sec.value.length > 0);

  if (ttsSections.length === 0) {
    alert('Không tìm thấy nội dung văn bản nào để đọc!');
    return;
  }

  ttsCurrentIndex = 0;
  ttsIsPlaying = true;
  ttsIsPaused = false;
  updateTtsButtons();
  speakCurrentSection();
}

function speakCurrentSection() {
  if (!ttsIsPlaying || ttsCurrentIndex < 0 || ttsCurrentIndex >= ttsSections.length) {
    stopTts(true);
    return;
  }

  const section = ttsSections[ttsCurrentIndex];
  const langMode = document.getElementById('ttsVoiceSelect').value;
  const segments = [];
  
  if (langMode === 'bilingual') {
    const labelSegs = splitBilingualText(section.label);
    const valueSegs = splitBilingualText(section.value);
    segments.push(...labelSegs, ...valueSegs);
  } else {
    const cleanLabel = cleanTextForLanguage(section.label, langMode);
    const cleanValue = cleanTextForLanguage(section.value, langMode);
    if (cleanLabel.trim()) segments.push({ text: cleanLabel.trim(), lang: langMode });
    if (cleanValue.trim()) segments.push({ text: cleanValue.trim(), lang: langMode });
  }

  // Skip section if it's completely empty in target language
  if (segments.length === 0) {
    ttsCurrentIndex++;
    speakCurrentSection();
    return;
  }

  ttsSections.forEach(s => s.element.classList.remove('reading-active'));
  section.element.classList.add('reading-active');
  section.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Speak each segment in order
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const utterance = new SpeechSynthesisUtterance(seg.text);
    
    const bestVoice = getBestVoiceForLang(seg.lang);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }
    utterance.lang = seg.lang;
    
    const rateVal = parseFloat(document.getElementById('ttsSpeedSelect').value) || 1.0;
    utterance.rate = rateVal;

    // Track first utterance reference
    if (i === 0) {
      ttsUtterance = utterance;
    }

    if (i === segments.length - 1) {
      // Transition to next section after the last segment ends
      utterance.onend = () => {
        ttsCurrentIndex++;
        speakCurrentSection();
      };
      
      utterance.onerror = (e) => {
        console.error('TTS Segment Error:', e);
        if (ttsIsPlaying) {
          ttsCurrentIndex++;
          speakCurrentSection();
        }
      };
    }
    
    window.speechSynthesis.speak(utterance);
  }
}



function pauseTts() {
  if (ttsIsPlaying) {
    window.speechSynthesis.pause();
    ttsIsPlaying = false;
    ttsIsPaused = true;
    updateTtsButtons();
  }
}

function stopTts(reachedEnd = true) {
  ttsIsPlaying = false;
  ttsIsPaused = false;
  
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  
  if (ttsUtterance) {
    ttsUtterance.onend = null;
    ttsUtterance.onerror = null;
  }
  ttsUtterance = null;

  if (ttsSections) {
    ttsSections.forEach(s => s.element.classList.remove('reading-active'));
  }
  
  updateTtsButtons();
}

function updateTtsButtons() {
  const playBtn = document.getElementById('btnTtsPlay');
  const pauseBtn = document.getElementById('btnTtsPause');
  const stopBtn = document.getElementById('btnTtsStop');
  if (!playBtn || !pauseBtn || !stopBtn) return;

  if (ttsIsPlaying) {
    playBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';
    stopBtn.style.display = 'inline-block';
  } else if (ttsIsPaused) {
    playBtn.style.display = 'inline-block';
    playBtn.textContent = '▶ Tiếp tục';
    pauseBtn.style.display = 'none';
    stopBtn.style.display = 'inline-block';
  } else {
    playBtn.style.display = 'inline-block';
    playBtn.textContent = '▶ Phát';
    pauseBtn.style.display = 'none';
    stopBtn.style.display = 'none';
  }
}

// Bind TTS listeners
document.getElementById('btnTtsPlay').addEventListener('click', playTts);
document.getElementById('btnTtsPause').addEventListener('click', pauseTts);
document.getElementById('btnTtsStop').addEventListener('click', () => stopTts(false));

// Ensure voices are loaded
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {};
}

// Clean up speech on close
window.addEventListener('beforeunload', () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
});

// -------------------------------------------------------
// Custom Additions: Audio, Mastery & Bilingual Translation
// -------------------------------------------------------
let isBilingualActive = false;
let translationSessionId = 0;
const translationCache = new Map();

function playTone(freq, duration, type = 'sine', volume = 0.3) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error(e);
  }
}

// Bind click listeners for read count adjustments
const btnDecReadCount = document.getElementById('btnDecReadCount');
const btnIncReadCount = document.getElementById('btnIncReadCount');

if (btnDecReadCount && btnIncReadCount) {
  btnDecReadCount.addEventListener('click', async () => {
    if (!currentItem) return;
    let count = currentItem.mastery || 0;
    if (count > 0) {
      count--;
      currentItem.mastery = count;
      document.getElementById('lblReadCount').textContent = count;
      playTone(400, 0.1, 'sine', 0.15);
      await saveReadCount(count);
    }
  });

  btnIncReadCount.addEventListener('click', async () => {
    if (!currentItem) return;
    let count = currentItem.mastery || 0;
    count++;
    currentItem.mastery = count;
    document.getElementById('lblReadCount').textContent = count;
    playTone(600, 0.1, 'sine', 0.15);
    await saveReadCount(count);
  });
}

async function saveReadCount(count) {
  try {
    if (vaultType === 'ielts') {
      const data = await window.taskAPI.loadIeltsVault();
      if (data && Array.isArray(data.items)) {
        const idx = data.items.findIndex(i => i.id == currentItem.id);
        if (idx !== -1) {
          data.items[idx].mastery = count;
          await window.taskAPI.saveIeltsVault(data);
          console.log(`[STUDY] Saved read count ${count} for IELTS item ${currentItem.id}`);
        }
      }
    } else if (vaultType === 'general') {
      const data = await window.taskAPI.loadGeneralVault();
      if (data && Array.isArray(data.items)) {
        const idx = data.items.findIndex(i => i.id == currentItem.id);
        if (idx !== -1) {
          data.items[idx].mastery = count;
          await window.taskAPI.saveGeneralVault(data);
          console.log(`[STUDY] Saved read count ${count} for General item ${currentItem.id}`);
        }
      }
    }
  } catch (err) {
    console.error('[STUDY] Error saving read count:', err);
  }
}

// Bind click listener for Bilingual Translation
const btnBilingualTranslate = document.getElementById('btnBilingualTranslate');
if (btnBilingualTranslate) {
  btnBilingualTranslate.addEventListener('click', () => applyBilingualTranslate(false));
}

async function applyBilingualTranslate(forceOn = false) {
  const transBtn = document.getElementById('btnBilingualTranslate');
  if (!transBtn || !currentItem) return;

  const sections = document.querySelectorAll('#detailContentScroll .detail-section');

  if (isBilingualActive && !forceOn) {
    translationSessionId++; // Cancel current translation session
    // Restore original HTML
    sections.forEach(section => {
      const valEl = section.querySelector('.detail-section-val');
      if (valEl && valEl.dataset.originalHtml) {
        valEl.innerHTML = valEl.dataset.originalHtml;
      }
    });
    isBilingualActive = false;
    transBtn.textContent = '🌐 Dịch song ngữ';
    transBtn.style.background = 'rgba(236, 72, 153, 0.15)';
    transBtn.style.color = '#f472b6';
    playTone(400, 0.1, 'sine', 0.1);
  } else {
    const sessionId = ++translationSessionId; // Create new session ID
    
    // Check if we have any uncached section to determine showing loading state and playing sound feedback
    let anyUncached = false;
    for (const section of sections) {
      const lblEl = section.querySelector('.detail-section-lbl');
      const valEl = section.querySelector('.detail-section-val');
      if (!lblEl || !valEl) continue;

      const label = lblEl.textContent.trim().toLowerCase();
      const skipKeywords = ["mã nguồn", "snippet code", "snippet"];
      const shouldSkip = skipKeywords.some(kw => label.includes(kw));
      if (shouldSkip) continue;

      const text = valEl.innerText.trim();
      if (!text || text.length < 2) continue;

      // Determine target language
      const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
      let viCharCount = 0;
      for (let char of text) {
        if (viRegex.test(char)) viCharCount++;
      }
      const isVietnamese = text.length > 0 && (viCharCount / text.length) > 0.04;

      let targetLang = 'vi';
      if (isVietnamese) {
        const skill = vaultType === 'ielts' ? currentItem.skill : currentItem.subject;
        if (skill === 'japanese') {
          targetLang = 'ja';
        } else if (skill === 'korean') {
          targetLang = 'ko';
        } else {
          targetLang = 'en';
        }
      }

      const cacheKey = text + '_' + targetLang;
      if (!translationCache.has(cacheKey)) {
        anyUncached = true;
        break;
      }
    }

    if (anyUncached) {
      transBtn.textContent = '⏳ Đang dịch...';
      transBtn.style.background = 'rgba(245, 158, 11, 0.15)';
      transBtn.style.color = '#fbbf24';
    }

    for (const section of sections) {
      if (sessionId !== translationSessionId) break;

      const lblEl = section.querySelector('.detail-section-lbl');
      const valEl = section.querySelector('.detail-section-val');
      if (!lblEl || !valEl) continue;

      const label = lblEl.textContent.trim().toLowerCase();
      // Only skip actual code blocks/snippets to avoid breaking coding layouts
      const skipKeywords = ["mã nguồn", "snippet code", "snippet"];
      const shouldSkip = skipKeywords.some(kw => label.includes(kw));
      
      if (shouldSkip) continue;

      const text = valEl.innerText.trim();
      if (!text || text.length < 2) continue;

      // Detect if text is predominantly Vietnamese
      const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
      let viCharCount = 0;
      for (let char of text) {
        if (viRegex.test(char)) viCharCount++;
      }
      const isVietnamese = text.length > 0 && (viCharCount / text.length) > 0.04;

      // Determine target language and visual flag
      let targetLang = 'vi';
      let targetFlag = '🇻🇳';
      let translationColor = '#a7f3d0'; // Mint green for Vietnamese translation

      if (isVietnamese) {
        translationColor = '#93c5fd'; // Soft sky blue for English/other translation
        const skill = vaultType === 'ielts' ? currentItem.skill : currentItem.subject;
        if (skill === 'japanese') {
          targetLang = 'ja';
          targetFlag = '🇯🇵';
        } else if (skill === 'korean') {
          targetLang = 'ko';
          targetFlag = '🇰🇷';
        } else {
          targetLang = 'en';
          targetFlag = '🇬🇧';
        }
      }

      // Backup original HTML if not already backed up
      if (!valEl.dataset.originalHtml) {
        valEl.dataset.originalHtml = valEl.innerHTML;
      }

      // Check cache first
      const cacheKey = text + '_' + targetLang;
      if (translationCache.has(cacheKey)) {
        valEl.innerHTML = translationCache.get(cacheKey);
        continue;
      }

      try {
        let resJson;
        if (window.taskAPI && window.taskAPI.translateText) {
          resJson = await window.taskAPI.translateText(text, targetLang);
        } else {
          // Perform robust chunked translation directly in renderer
          const maxChunkSize = 2000;
          const lines = text.split('\n');
          const chunks = [];
          let currentChunk = '';

          for (const line of lines) {
            if ((currentChunk + '\n' + line).length > maxChunkSize) {
              if (currentChunk) {
                chunks.push(currentChunk);
                currentChunk = line;
              } else {
                let sentences = line.split(/(?<=[.?!])\s+/);
                for (const sentence of sentences) {
                  if ((currentChunk + ' ' + sentence).length > maxChunkSize) {
                    if (currentChunk) {
                      chunks.push(currentChunk);
                      currentChunk = sentence;
                    } else {
                      let pos = 0;
                      while (pos < sentence.length) {
                        chunks.push(sentence.substring(pos, pos + maxChunkSize));
                        pos += maxChunkSize;
                      }
                    }
                  } else {
                    currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
                  }
                }
              }
            } else {
              currentChunk = currentChunk ? currentChunk + '\n' + line : line;
            }
          }
          if (currentChunk) {
            chunks.push(currentChunk);
          }

          const combinedData = [ [], null, '' ];
          for (const chunk of chunks) {
            let chunkData;
            let success = false;
            
            // Strategy 1: googleapis
            try {
              const url = `https://translate.googleapis.com/translate_a/single?client=at&sl=auto&tl=${targetLang}&dt=t`;
              const res = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'q=' + encodeURIComponent(chunk)
              });
              if (res.ok) {
                chunkData = await res.json();
                success = true;
              }
            } catch (e) {
              console.warn('[STUDY] Bilingual translation fetch failed:', e);
            }

            // Strategy 2: MyMemory API (supports CORS)
            if (!success) {
              try {
                const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|${targetLang}`;
                const res = await fetch(myMemoryUrl);
                if (res.ok) {
                  const data = await res.json();
                  if (data && data.responseData && data.responseData.translatedText) {
                    const trans = data.responseData.translatedText;
                    chunkData = [ [ [ trans, chunk ] ], null, 'en' ];
                    success = true;
                  }
                }
              } catch (e) {
                console.error('[STUDY] Bilingual translation fallback MyMemory failed:', e);
              }
            }

            if (!success || !chunkData) {
              throw new Error('All browser-side bilingual translation strategies failed');
            }

            if (chunkData && chunkData[0]) {
              combinedData[0].push(...chunkData[0]);
            }
            if (chunks.length > 1) {
              await new Promise(r => setTimeout(r, 150));
            }
          }
          resJson = combinedData;
        }
        
        if (sessionId !== translationSessionId) break;

        if (resJson && resJson[0]) {
          let alternatingHtml = '';
          resJson[0].forEach(seg => {
            if (seg && seg[0] && seg[1]) {
              const orig = seg[1].trim();
              const trans = seg[0].trim();
              if (orig) {
                if (orig.includes('\n')) {
                  const origLines = orig.split('\n').map(l => l.trim());
                  const transLines = trans.split('\n').map(l => l.trim());
                  
                  const origContent = origLines.filter(l => l.length > 0);
                  const transContent = transLines.filter(l => l.length > 0);
                  
                  if (origContent.length === transContent.length) {
                    for (let i = 0; i < origContent.length; i++) {
                      alternatingHtml += `<span class="sentence-original">${escHtml(origContent[i])}</span><br>` +
                                         `<span class="sentence-translated" style="color: ${translationColor}; font-style: italic; display: block; margin-bottom: 8px; font-size: 0.95em;">${targetFlag} ${escHtml(transContent[i])}</span>`;
                    }
                  } else {
                    // Fallback to displaying block-by-block with HTML linebreaks if counts mismatch
                    alternatingHtml += `<span class="sentence-original">${escHtml(orig).replace(/\n/g, '<br>')}</span><br>` +
                                       `<span class="sentence-translated" style="color: ${translationColor}; font-style: italic; display: block; margin-bottom: 8px; font-size: 0.95em;">${targetFlag} ${escHtml(trans).replace(/\n/g, '<br>')}</span>`;
                  }
                } else {
                  // Single line
                  alternatingHtml += `<span class="sentence-original">${escHtml(orig)}</span><br>` +
                                     `<span class="sentence-translated" style="color: ${translationColor}; font-style: italic; display: block; margin-bottom: 8px; font-size: 0.95em;">${targetFlag} ${escHtml(trans)}</span>`;
                }
              }
            }
          });
          if (alternatingHtml) {
            valEl.innerHTML = alternatingHtml;
            // Cache it!
            translationCache.set(cacheKey, alternatingHtml);
          }
        }
        
        // Stagger requests to prevent Google API rate limits (429)
        if (anyUncached) {
          await new Promise(r => setTimeout(r, 200));
        }
      } catch (err) {
        console.error('Bilingual translation fetch failed for section:', err);
        // Clean up: Restore original HTML for sections to prevent corrupt layout
        sections.forEach(sec => {
          const vEl = sec.querySelector('.detail-section-val');
          if (vEl && vEl.dataset.originalHtml) {
            vEl.innerHTML = vEl.dataset.originalHtml;
          }
        });
        isBilingualActive = false;
        transBtn.textContent = '🌐 Dịch song ngữ';
        transBtn.style.background = 'rgba(236, 72, 153, 0.15)';
        transBtn.style.color = '#f472b6';
        alert('Không thể kết nối dịch thuật. Vui lòng kiểm tra kết nối mạng!');
        return;
      }
    }
    
    if (sessionId === translationSessionId) {
      isBilingualActive = true;
      transBtn.textContent = '👁️ Ẩn song ngữ';
      transBtn.style.background = 'rgba(16, 185, 129, 0.15)';
      transBtn.style.color = '#34d399';
      if (!forceOn && anyUncached) {
        playTone(660, 0.1, 'sine', 0.15);
      }
    }
  }
}

init();
