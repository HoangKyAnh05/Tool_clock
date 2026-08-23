// electron_tool/scratch/enrich_all_flashcards_context.js
// Script to enrich all existing vocabulary flashcards with rich Usage Contexts & Sentence Starter frames (...)
const fs = require('fs');
const path = require('path');

function generateContextFrames(wordRaw, translation, existingNotes) {
  const cleanWord = (wordRaw || '').replace(/\s*\([^)]*\)/g, '').trim();
  if (!cleanWord || cleanWord.startsWith('🖼️') || cleanWord === '---') {
    return null;
  }

  const trans = (translation || '').trim();
  const lowerWord = cleanWord.toLowerCase();

  // Determine thematic nuance based on word & translation
  let frames = [];

  // Theme 1: Health, Disease, Suffering, Medical (e.g. disease, illness, symptom, mental health, diet, obesity, stress)
  if (/disease|illness|pain|suffer|health|virus|fever|diet|obesity|stress|medical|mental|injury|epidemic|hospital|doctor|patient|bệnh|đau|sức khỏe|dịch|thuốc|y tế/i.test(lowerWord) || /bệnh|đau|ốm|sức khỏe|y tế|dịch bệnh/i.test(trans)) {
    frames = [
      {
        en: `When it comes to ..., there are several critical factors we should consider.`,
        vi: `Khi đề cập đến ..., có một số yếu tố then chốt mà chúng ta nên cân nhắc kỹ lưỡng.`
      },
      {
        en: `In contemporary society, many people suffer from various issues related to ... because of unhealthy lifestyles.`,
        vi: `Trong xã hội hiện đại, nhiều người phải gánh chịu các vấn đề liên quan đến ... do lối sống thiếu lành mạnh.`
      },
      {
        en: `One major aspect of ... that concerns me the most is its long-term impact on public well-being.`,
        vi: `Một khía cạnh lớn về ... khiến tôi lo ngại nhất chính là tác động lâu dài của nó đối với sức khỏe cộng đồng.`
      },
      {
        en: `Medical experts strongly emphasize that preventing ... is far more effective than treating it later.`,
        vi: `Các chuyên gia y tế nhấn mạnh mạnh mẽ rằng phòng ngừa ... hiệu quả hơn rất nhiều so với việc điều trị sau này.`
      },
      {
        en: `To effectively mitigate the risks of ..., proactive community education and early diagnosis are indispensable.`,
        vi: `Để giảm thiểu hiệu quả các rủi ro do ..., giáo dục cộng đồng chủ động và chẩn đoán sớm là điều không thể thiếu.`
      }
    ];
  }
  // Theme 2: Environment, Nature, Pollution, Ecology, Climate, Conservation
  else if (/environment|nature|pollution|climate|ecology|conservation|emission|recycle|carbon|planet|species|waste|môi trường|thiên nhiên|ô nhiễm|khí hậu|sinh thái/i.test(lowerWord) || /môi trường|thiên nhiên|ô nhiễm|khí hậu|rác thải/i.test(trans)) {
    frames = [
      {
        en: `When it comes to ..., there are several alarming consequences that demand immediate attention.`,
        vi: `Khi đề cập đến ..., có một số hệ quả đáng báo động đòi hỏi sự chú ý ngay lập tức.`
      },
      {
        en: `Around the globe, numerous ecosystems suffer from severe damage due to ..., primarily driven by human activities.`,
        vi: `Trên toàn cầu, nhiều hệ sinh thái phải gánh chịu thiệt hại nặng nề vì ..., chủ yếu do các hoạt động của con người gây ra.`
      },
      {
        en: `One pressing challenge regarding ... that concerns environmentalists the most is its irreversible nature.`,
        vi: `Một thách thức cấp bách liên quan đến ... khiến các nhà môi trường lo ngại nhất là tính chất không thể đảo ngược của nó.`
      },
      {
        en: `In public discourse, adopting sustainable practices to tackle ... has become an urgent priority.`,
        vi: `Trong các cuộc thảo luận công cộng, việc áp dụng các biện pháp bền vững để giải quyết ... đã trở thành ưu tiên khẩn cấp.`
      },
      {
        en: `From a policymaking perspective, combating ... requires global collaboration and stringent regulations.`,
        vi: `Từ góc độ hoạch định chính sách, việc chống lại ... đòi hỏi sự hợp tác toàn cầu và các quy định nghiêm ngặt.`
      }
    ];
  }
  // Theme 3: Education, Study, School, Academic, Research, Exam, Learning
  else if (/education|school|study|academic|research|assignment|curriculum|deadline|degree|graduate|homework|lecture|qualification|revise|scholarship|tuition|student|teacher|learn|giáo dục|học|nghiên cứu|bằng cấp/i.test(lowerWord) || /học|giáo dục|trường|bài tập|nghiên cứu|thi cử/i.test(trans)) {
    frames = [
      {
        en: `When it comes to ..., educators and students often face distinct challenges in modern curricula.`,
        vi: `Khi nói đến ..., các nhà giáo dục và học sinh thường đối mặt với những thách thức khác nhau trong chương trình giảng dạy hiện đại.`
      },
      {
        en: `Many learners struggle significantly with ... because of excessive academic pressure and lack of proper guidance.`,
        vi: `Nhiều người học gặp khó khăn đáng kể với ... do áp lực học tập quá lớn và thiếu sự định hướng đúng đắn.`
      },
      {
        en: `One fundamental element of ... that concerns me the most is how it shapes students' critical thinking abilities.`,
        vi: `Một yếu tố nền tảng về ... khiến tôi quan tâm nhất là cách nó định hình khả năng tư duy phản biện của học sinh.`
      },
      {
        en: `In modern education, cultivating a solid foundation in ... empowers individuals to achieve greater career success.`,
        vi: `Trong nền giáo dục hiện đại, việc trau dồi nền tảng vững chắc về ... giúp các cá nhân đạt được thành công lớn hơn trong sự nghiệp.`
      },
      {
        en: `To optimize the learning process, integrating technology into ... has proven to be highly advantageous.`,
        vi: `Để tối ưu hóa quá trình học tập, việc tích hợp công nghệ vào ... đã được chứng minh là mang lại nhiều lợi ích.`
      }
    ];
  }
  // Theme 4: Work, Business, Economy, Career, Finance, Management
  else if (/work|business|career|job|salary|promotion|employ|resign|colleague|finance|money|economy|market|company|management|công việc|nghề|kinh tế|tiền lương|thăng chức/i.test(lowerWord) || /công việc|lương|kinh doanh|đồng nghiệp|thăng chức|doanh nghiệp/i.test(trans)) {
    frames = [
      {
        en: `When it comes to ..., professionals must adapt quickly to the rapidly evolving corporate landscape.`,
        vi: `Khi bàn về ..., các chuyên gia phải thích ứng nhanh chóng với bối cảnh doanh nghiệp đang phát triển không ngừng.`
      },
      {
        en: `A substantial proportion of employees experience intense pressure regarding ... due to high market competition.`,
        vi: `Một tỷ lệ đáng kể nhân viên phải trải qua áp lực lớn liên quan đến ... do sự cạnh tranh khốc liệt trên thị trường.`
      },
      {
        en: `One crucial factor in ... that concerns modern organizations the most is maintaining employee satisfaction and retention.`,
        vi: `Một yếu tố cốt lõi trong ... khiến các tổ chức hiện nay quan tâm nhất là duy trì sự hài lòng và giữ chân nhân tài.`
      },
      {
        en: `From a managerial standpoint, strategic alignment with ... creates a lasting competitive advantage.`,
        vi: `Từ góc độ quản trị, việc điều chỉnh chiến lược phù hợp với ... tạo ra lợi thế cạnh tranh lâu dài.`
      },
      {
        en: `In order to achieve sustainable economic growth, investing resources into ... is undeniably essential.`,
        vi: `Để đạt được tăng trưởng kinh tế bền vững, việc đầu tư nguồn lực vào ... là điều không thể phủ nhận.`
      }
    ];
  }
  // Theme 5: Technology, AI, Digital, Innovation, Media
  else if (/technology|ai|digital|media|internet|device|computer|software|data|cyber|innovation|công nghệ|mạng|kỹ thuật số|dữ liệu/i.test(lowerWord) || /công nghệ|máy tính|phần mềm|internet|kỹ thuật số/i.test(trans)) {
    frames = [
      {
        en: `When it comes to ..., technological advancements are fundamentally reshaping our daily routines.`,
        vi: `Khi nói đến ..., những tiến bộ công nghệ đang định hình lại một cách căn bản thói quen hàng ngày của chúng ta.`
      },
      {
        en: `Many modern users encounter profound ethical dilemmas surrounding ... because of data privacy issues.`,
        vi: `Nhiều người dùng hiện đại gặp phải những bài toán đạo đức sâu sắc xung quanh ... do các vấn đề về quyền riêng tư dữ liệu.`
      },
      {
        en: `One aspect of ... that concerns tech analysts the most is its potential to disrupt traditional industries.`,
        vi: `Một khía cạnh của ... khiến các nhà phân tích công nghệ lo ngại nhất là khả năng gây xáo trộn các ngành công nghiệp truyền thống.`
      },
      {
        en: `In contemporary society, leveraging the power of ... allows people to communicate and work with unprecedented efficiency.`,
        vi: `Trong xã hội đương đại, việc tận dụng sức mạnh của ... cho phép mọi người giao tiếp và làm việc với hiệu suất chưa từng có.`
      },
      {
        en: `To fully harness the benefits of ..., establishing comprehensive safety guidelines is paramount.`,
        vi: `Để khai thác triệt để những lợi ích từ ..., việc thiết lập các nguyên tắc an toàn toàn diện là tối quan trọng.`
      }
    ];
  }
  // Theme 6: General Vocabulary / Adjectives / Verbs / Expressions
  else {
    frames = [
      {
        en: `When it comes to ..., there are several key factors we should carefully evaluate.`,
        vi: `Khi đề cập đến ..., có một số yếu tố then chốt mà chúng ta nên đánh giá một cách cẩn trọng.`
      },
      {
        en: `In real-life communication, many people encounter confusion regarding ... because of different cultural contexts.`,
        vi: `Trong giao tiếp thực tế, nhiều người gặp phải sự nhầm lẫn liên quan đến ... do các bối cảnh văn hóa khác nhau.`
      },
      {
        en: `One important dimension of ... that concerns me the most is how it influences personal decision-making.`,
        vi: `Một khía cạnh quan trọng của ... khiến tôi suy ngẫm nhiều nhất là cách nó tác động đến việc ra quyết định của cá nhân.`
      },
      {
        en: `In academic discussions, effectively utilizing ... demonstrates a high level of language proficiency.`,
        vi: `Trong các cuộc thảo luận học thuật, việc sử dụng hiệu quả ... thể hiện trình độ ngôn ngữ ở band điểm cao.`
      },
      {
        en: `From my perspective, developing a comprehensive grasp of ... enables clearer and more persuasive expression.`,
        vi: `Theo quan điểm của tôi, việc nắm vững toàn diện ... giúp diễn đạt ý tưởng mạch lạc và thuyết phục hơn nhiều.`
      }
    ];
  }

  return frames;
}

function enrichCardNotes(card) {
  const word = card.word || '';
  const translation = card.translation || '';
  let currentNotes = (card.notes || '').trim();

  // If already contains sentence starter frames, check if they need formatting
  const frames = generateContextFrames(word, translation, currentNotes);
  if (!frames || frames.length === 0) return currentNotes;

  // Build the sentence starters section
  const contextLines = [
    `🧩 KHUNG CÂU DẪN & NGỮ CẢNH SỬ DỤNG (SENTENCE STARTERS):`
  ];

  frames.forEach((f, idx) => {
    contextLines.push(`🧩 Câu dẫn ${idx + 1}: "${f.en}"`);
    contextLines.push(`   👉 Dịch: ${f.vi}`);
  });

  // Extract existing Speaking / Writing or other notes
  const lines = currentNotes.split('\n').map(l => l.trim()).filter(Boolean);
  const speakingLines = [];
  const writingLines = [];

  let currentSection = '';
  lines.forEach(l => {
    if (l.includes('Speaking') || l.startsWith('🗣️')) {
      currentSection = 'speaking';
      speakingLines.push(l);
    } else if (l.includes('Writing') || l.startsWith('✍️')) {
      currentSection = 'writing';
      writingLines.push(l);
    } else if (l.includes('Câu dẫn') || l.startsWith('🧩') || l.includes('KHUNG CÂU DẪN')) {
      // Ignore old context lines so we can cleanly replace
    } else if (l.startsWith('👉 Dịch:')) {
      if (currentSection === 'speaking') speakingLines.push(l);
      else if (currentSection === 'writing') writingLines.push(l);
    } else {
      if (currentSection === 'speaking') speakingLines.push(l);
      else if (currentSection === 'writing') writingLines.push(l);
      else if (speakingLines.length < 4) speakingLines.push(`🗣️ Speaking: "${l}"`);
    }
  });

  // If no speaking/writing lines existed, create natural default ones
  const cleanWord = word.replace(/\s*\([^)]*\)/g, '').trim();
  if (speakingLines.length === 0) {
    speakingLines.push(`🗣️ Speaking 1: "In daily conversations, using '${cleanWord}' helps me express complex ideas fluently."`);
    speakingLines.push(`   👉 Dịch: Trong giao tiếp hàng ngày, việc dùng '${cleanWord}' giúp tôi diễn đạt các ý tưởng phức tạp một cách trôi chảy.`);
    speakingLines.push(`🗣️ Speaking 2: "From my personal experience, mastering '${cleanWord}' is essential for IELTS Speaking Part 3."`);
    speakingLines.push(`   👉 Dịch: Từ trải nghiệm cá nhân của tôi, việc làm chủ '${cleanWord}' là rất cần thiết cho phần thi IELTS Speaking Part 3.`);
    speakingLines.push(`🗣️ Speaking 3: "Whenever asked about this topic, I usually incorporate '${cleanWord}' into my explanation."`);
    speakingLines.push(`   👉 Dịch: Bất cứ khi nào được hỏi về chủ đề này, tôi thường đưa '${cleanWord}' vào lời giải thích của mình.`);
  }

  if (writingLines.length === 0) {
    writingLines.push(`✍️ Writing 1: "Empirical studies highlight that '${cleanWord}' serves as a critical determining factor."`);
    writingLines.push(`   👉 Dịch: Các nghiên cứu thực nghiệm nhấn mạnh rằng '${cleanWord}' đóng vai trò như một yếu tố quyết định quan trọng.`);
    writingLines.push(`✍️ Writing 2: "In academic discourse, the significance of '${cleanWord}' cannot be overstated."`);
    writingLines.push(`   👉 Dịch: Trong văn cảnh học thuật, tầm quan trọng của '${cleanWord}' là không thể bàn cãi.`);
    writingLines.push(`✍️ Writing 3: "Consequently, policymakers must prioritize issues related to '${cleanWord}'."`);
    writingLines.push(`   👉 Dịch: Do đó, các nhà hoạch định chính sách phải ưu tiên các vấn đề liên quan đến '${cleanWord}'.`);
  }

  return [...contextLines, '', ...speakingLines, '', ...writingLines].join('\n');
}

// 1. Process electron_tool/data/memorize_vault.json
const rootDir = path.join(__dirname, '..', '..');
const vaultPaths = [
  path.join(rootDir, 'electron_tool', 'data', 'memorize_vault.json'),
  path.join(rootDir, 'electron_tool', 'dist', 'win-unpacked', 'data', 'memorize_vault.json')
];

let primaryItems = [];

vaultPaths.forEach(vPath => {
  if (fs.existsSync(vPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(vPath, 'utf8'));
      if (Array.isArray(data.items)) {
        data.items.forEach(card => {
          if (card.word && !card.word.startsWith('🖼️')) {
            card.notes = enrichCardNotes(card);
          }
        });
        fs.writeFileSync(vPath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`[ENRICH] Successfully updated: ${vPath} (${data.items.length} items)`);
        if (primaryItems.length === 0) {
          primaryItems = data.items;
        }
      }
    } catch (e) {
      console.warn(`[ENRICH] Error processing ${vPath}:`, e.message);
    }
  }
});

// 2. Process all slot files (data/slot_0..9.json & docs/data/slot_0..9.json)
const dataDirs = [
  path.join(rootDir, 'data'),
  path.join(rootDir, 'docs', 'data')
];

dataDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i <= 9; i++) {
    const slotPath = path.join(dir, `slot_${i}.json`);
    let slotData = {
      slot: `${i}`,
      updatedAt: new Date().toISOString(),
      count: primaryItems.length,
      items: primaryItems,
      masteredIds: [],
      dueIds: []
    };

    if (fs.existsSync(slotPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(slotPath, 'utf8'));
        if (Array.isArray(existing.items) && existing.items.length > 0) {
          existing.items.forEach(card => {
            if (card.word && !card.word.startsWith('🖼️')) {
              card.notes = enrichCardNotes(card);
            }
          });
          slotData = existing;
          slotData.updatedAt = new Date().toISOString();
        }
      } catch (e) {}
    }

    fs.writeFileSync(slotPath, JSON.stringify(slotData, null, 2), 'utf8');
  }
  console.log(`[ENRICH] Successfully updated 10 slot files in: ${dir}`);
});

// 3. Regenerate mobile web & GitHub Pages
const syncWebGen = require(path.join(rootDir, 'electron_tool', 'sync_web_generator.js'));
syncWebGen.writeWebFiles({ items: primaryItems }, rootDir);
console.log(`[ENRICH] Regenerated index.html & docs/index.html with enriched flashcards!`);
