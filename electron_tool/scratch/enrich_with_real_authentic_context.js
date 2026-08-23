const fs = require('fs');
const path = require('path');

const VAULT_PATH = path.join(__dirname, '..', 'data', 'memorize_vault.json');
const DIST_VAULT_PATH = path.join(__dirname, '..', 'dist', 'win-unpacked', 'data', 'memorize_vault.json');
const SLOT_DIR = path.join(__dirname, '..', '..', 'data');
const DOCS_SLOT_DIR = path.join(__dirname, '..', '..', 'docs', 'data');

// Specific curated real-life authentic starters and examples for key vocabulary
const CURATED_WORDS = {
  film: {
    trans: "phim điện ảnh; màng bọc, lớp phim mỏng; quay phim",
    starters: [
      { en: "Watching a captivating documentary ... on the weekend is one of my favorite ways to broaden my perspectives.", vi: "Xem một bộ ... tài liệu hấp dẫn vào cuối tuần là một trong những cách tôi yêu thích nhất để mở rộng góc nhìn của mình." },
      { en: "Before the director began shooting the new ..., the crew spent six months scouting ideal scenic locations.", vi: "Trước khi đạo diễn bắt đầu bấm máy quay bộ ... mới, đoàn làm phim đã dành sáu tháng để tìm kiếm các bối cảnh lý tưởng." },
      { en: "Use a thin layer of transparent protective ... to wrap the food securely before placing it into the refrigerator.", vi: "Dùng một lớp ... bảo vệ mỏng trong suốt để bọc kín thực phẩm trước khi cất vào tủ lạnh." },
      { en: "Analyzing how a classic award-winning ... conveys subtle social messages teaches students valuable critical thinking skills.", vi: "Phân tích cách một bộ ... kinh điển từng đoạt giải thưởng truyền tải các thông điệp xã hội sâu sắc giúp dạy cho sinh viên những kỹ năng tư duy phản biện quý giá." },
      { en: "If you are passionate about cinematography, learning how to write and produce your own short ... is an incredible journey.", vi: "Nếu bạn đam mê nghệ thuật điện ảnh, học cách viết kịch bản và sản xuất bộ ... ngắn của riêng mình là một hành trình tuyệt vời." }
    ],
    speaking: [
      { en: "A famous Hollywood studio was filming on location in New York City last month.", vi: "Một xưởng phim Hollywood nổi tiếng đã quay phim tại hiện trường ở thành phố New York vào tháng trước." },
      { en: "I love watching science fiction films with my friends on Friday nights.", vi: "Tôi rất thích xem những bộ phim khoa học viễn tưởng cùng bạn bè vào các tối thứ Sáu." },
      { en: "Let's wrap the leftover sandwiches in plastic film so they stay fresh.", vi: "Hãy bọc những chiếc bánh mì kẹp còn thừa trong màng bọc thực phẩm để chúng giữ được độ tươi." },
      { en: "Have you watched the latest historical film directed by Christopher Nolan?", vi: "Bạn đã xem bộ phim lịch sử mới nhất do Christopher Nolan đạo diễn chưa?" },
      { en: "She filmed the entire birthday celebration using her handheld 4K camera.", vi: "Cô ấy đã quay lại toàn bộ buổi tiệc sinh nhật bằng chiếc máy quay 4K cầm tay của mình." }
    ],
    writing: [
      { en: "The documentary film industry provides a powerful medium for exposing pressing global environmental issues.", vi: "Ngành công nghiệp phim tài liệu cung cấp một phương tiện mạnh mẽ để phơi bày các vấn đề môi trường toàn cầu cấp bách." },
      { en: "Biodegradable plastic films are increasingly utilized in modern agricultural packaging to curb landfill pollution.", vi: "Các loại màng nhựa phân hủy sinh học ngày càng được ứng dụng rộng rãi trong bao bì nông nghiệp hiện đại để hạn chế ô nhiễm bãi rác." },
      { en: "Cinematic films exert a profound psychological influence on social behaviors and public opinions.", vi: "Các tác phẩm phim điện ảnh tạo ra một ảnh hưởng tâm lý sâu sắc đối với các hành vi xã hội và dư luận công chúng." },
      { en: "State subsidies for domestic independent filmmakers foster cultural diversity and creative storytelling.", vi: "Các khoản trợ cấp của nhà nước cho các nhà làm phim độc lập trong nước sẽ thúc đẩy sự đa dạng văn hóa và nghệ thuật kể chuyện sáng tạo." },
      { en: "Advances in digital video compression have revolutionized the worldwide distribution of streaming films.", vi: "Những tiến bộ trong việc nén video kỹ thuật số đã cách mạng hóa việc phát hành phim trực tuyến trên toàn cầu." }
    ]
  },
  party: {
    trans: "bữa tiệc, buổi liên hoan; đảng phái",
    starters: [
      { en: "Whenever my friends decide to throw a surprise ..., we have to keep everything secret until the very last minute.", vi: "Bất cứ khi nào bạn bè tôi quyết định tổ chức một ... bất ngờ, chúng tôi phải giữ bí mật mọi thứ đến phút chót." },
      { en: "Attending a lively weekend ... is honestly the best way to blow off steam after long working hours.", vi: "Tham gia một ... cuối tuần sôi động thực sự là cách tốt nhất để xả hơi sau những giờ làm việc căng thẳng." },
      { en: "If you are invited to a formal dinner ..., dressing appropriately and arriving punctually is essential.", vi: "Nếu bạn được mời đến một ... tối trang trọng, ăn mặc lịch sự và đến đúng giờ là điều tối quan trọng." },
      { en: "One of the most memorable moments of that birthday ... was the heartfelt speech given by my closest friend.", vi: "Một trong những khoảnh khắc đáng nhớ nhất của ... sinh nhật đó là bài phát biểu chân thành từ người bạn thân nhất của tôi." },
      { en: "Before hosting a large house ..., make sure you notify your neighbors in advance to prevent noise complaints.", vi: "Trước khi tổ chức một ... lớn tại nhà, hãy nhớ thông báo trước cho hàng xóm để tránh bị phàn nàn về tiếng ồn." }
    ],
    speaking: [
      { en: "We threw a wonderful surprise party for Sarah's 20th birthday last Saturday.", vi: "Chúng tôi đã tổ chức một bữa tiệc bất ngờ tuyệt vời cho sinh nhật lần thứ 20 của Sarah vào thứ Bảy tuần trước." },
      { en: "Are you planning to attend the company's annual year-end party tonight?", vi: "Bạn có dự định tham gia bữa tiệc tất niên thường niên của công ty tối nay không?" },
      { en: "Hosting a housewarming party is a great way to get to know our new neighbors.", vi: "Tổ chức tiệc tân gia là một cách tuyệt vời để làm quen với những người hàng xóm mới của chúng ta." },
      { en: "I usually prefer intimate dinner gatherings over loud and crowded parties.", vi: "Tôi thường thích những buổi tụ họp ăn tối ấm cúng hơn là những bữa tiệc ồn ào và đông đúc." },
      { en: "She spent the whole afternoon decorating the living room for the graduation party.", vi: "Cô ấy đã dành cả buổi chiều để trang trí phòng khách cho bữa tiệc tốt nghiệp." }
    ],
    writing: [
      { en: "Attending social parties plays a constructive role in developing communication skills among youth.", vi: "Tham gia các buổi tiệc giao lưu xã hội đóng vai trò tích cực trong việc phát triển các kỹ năng giao tiếp ở giới trẻ." },
      { en: "The establishment of a new political party reflects diverse public interests within a democratic system.", vi: "Sự thành lập một đảng phái chính trị mới phản ánh các lợi ích đa dạng của công chúng trong một hệ thống dân chủ." },
      { en: "Event organizers must adhere strictly to municipal noise regulations when hosting large-scale outdoor parties.", vi: "Ban tổ chức sự kiện phải tuân thủ nghiêm ngặt các quy định về tiếng ồn đô thị khi tổ chức các bữa tiệc ngoài trời quy mô lớn." },
      { en: "Excessive public spending on ceremonial government parties frequently sparks widespread social debate.", vi: "Chi tiêu công quá mức cho các bữa tiệc nghi lễ của chính phủ thường làm dấy lên những tranh luận xã hội rộng rãi." },
      { en: "Sociological research suggests that party rituals serve as fundamental mechanisms for community bonding.", vi: "Nghiên cứu xã hội học chỉ ra rằng các nghi thức tiệc tùng đóng vai trò như những cơ chế nền tảng cho sự gắn kết cộng đồng." }
    ]
  },
  Site: {
    trans: "địa điểm, công trường, vị trí xây dựng",
    starters: [
      { en: "Before commencing any major construction project, inspecting the building ... thoroughly is compulsory.", vi: "Trước khi bắt đầu bất kỳ dự án xây dựng lớn nào, việc kiểm tra kỹ lưỡng ... xây dựng là bắt buộc." },
      { en: "Choosing the ideal ... for our new coffee shop required months of market research.", vi: "Việc chọn một ... lý tưởng cho quán cà phê mới của chúng tôi đã đòi hỏi nhiều tháng nghiên cứu thị trường." },
      { en: "All engineers must wear protective helmets and safety vests whenever entering the job ...", vi: "Tất cả các kỹ sư phải đội mũ bảo hiểm và mặc áo phản quang bất cứ khi nào bước vào ... làm việc." },
      { en: "This historical ... attracts over two million international travelers each year.", vi: "... lịch sử này thu hút hơn hai triệu khách du lịch quốc tế mỗi năm." },
      { en: "Relocating the factory to a suburban ... significantly reduced logistics and warehousing costs.", vi: "Việc di dời nhà máy đến một ... ngoại ô đã giúp giảm đáng kể chi phí hậu cần và kho bãi." }
    ]
  },
  near: {
    trans: "ở gần, cận kề (khoảng cách / thời gian)",
    starters: [
      { en: "Living conveniently ... a metro station saves me over an hour of commuting every single day.", vi: "Sống thuận tiện ở ... một ga tàu điện ngầm giúp tôi tiết kiệm hơn một tiếng đồng hồ đi lại mỗi ngày." },
      { en: "As the project deadline draws ..., the entire development team is working overtime to finish.", vi: "Khi thời hạn chót của dự án đang đến ..., toàn bộ đội ngũ phát triển đang làm thêm giờ để hoàn thành." },
      { en: "There is an authentic Italian bakery located right ... my apartment building.", vi: "Có một tiệm bánh Ý truyền thống nằm ngay ... tòa nhà chung cư của tôi." },
      { en: "We decided to pitch our camping tent somewhere ... a freshwater stream for convenience.", vi: "Chúng tôi quyết định dựng lều cắm trại ở một nơi nào đó ... một con suối nước ngọt để tiện sinh hoạt." },
      { en: "Her hometown is situated somewhere ... the coastal border of the country.", vi: "Quê hương của cô ấy nằm ở một nơi nào đó ... vùng biên giới ven biển của đất nước." }
    ]
  },
  entrance: {
    trans: "lối vào, cổng vào",
    starters: [
      { en: "Visitors must show their valid digital tickets right at the main ... before entering the museum.", vi: "Du khách phải xuất trình vé điện tử hợp lệ ngay tại ... chính trước khi vào bảo tàng." },
      { en: "We agreed to meet up near the cinema's south ... fifteen minutes before the screening.", vi: "Chúng tôi đồng ý gặp nhau gần ... phía nam của rạp chiếu phim 15 phút trước giờ chiếu." },
      { en: "The grand marble ... of the hotel immediately leaves a lasting impression on guests.", vi: "... bằng đá cẩm thạch tráng lệ của khách sạn ngay lập tức để lại ấn tượng khó phai cho du khách." },
      { en: "Security cameras are strategically placed above every building ... to ensure 24/7 surveillance.", vi: "Camera an ninh được bố trí tại vị trí chiến lược phía trên mỗi ... tòa nhà để đảm bảo giám sát 24/7." },
      { en: "Wheelchair ramps have been installed at the front ... to improve accessibility for disabled visitors.", vi: "Các đường dốc cho xe lăn đã được lắp đặt tại ... phía trước để cải thiện khả năng tiếp cận cho người khuyết tật." }
    ]
  },
  river: {
    trans: "dòng sông, con sông",
    starters: [
      { en: "Strolling peacefully along the bank of the ... at sunset is my favorite way to clear my mind.", vi: "Đi dạo bình yên dọc theo bờ ... lúc hoàng hôn là cách yêu thích nhất của tôi để thanh thản đầu óc." },
      { en: "Many ancient civilizations originally flourished along the fertile valleys of a major ...", vi: "Nhiều nền văn minh cổ đại ban đầu đã hưng thịnh dọc theo các thung lũng màu mỡ của một ... lớn." },
      { en: "Taking a scenic boat cruise down the ... offers breathtaking panoramic views of the skyline.", vi: "Đi du thuyền ngắm cảnh xuôi theo dòng ... mang đến khung cảnh đường chân trời tuyệt đẹp." },
      { en: "Strict industrial waste management is required to protect our local ... from toxic contamination.", vi: "Cần quản lý chất thải công nghiệp nghiêm ngặt để bảo vệ dòng ... địa phương của chúng ta khỏi ô nhiễm độc hại." },
      { en: "During the summer festival, illuminated lanterns are floated across the calm ...", vi: "Trong lễ hội mùa hè, những chiếc đèn hoa đăng rực rỡ được thả trôi trên mặt ... êm đềm." }
    ]
  },
  corridor: {
    trans: "hành lang, lối đi dài",
    starters: [
      { en: "Walk straight down this brightly lit ... and you will find the meeting room on your left.", vi: "Hãy đi thẳng xuống ... sáng đèn này và bạn sẽ thấy phòng họp ở bên tay trái của bạn." },
      { en: "The hospital's quiet ... was lined with digital screens displaying patient queue numbers.", vi: "... yên tĩnh của bệnh viện có gắn các màn hình kỹ thuật số hiển thị số thứ tự của bệnh nhân." },
      { en: "In high school, students would often gather along the main ... between classes to chat.", vi: "Ở trường cấp ba, học sinh thường tụ tập dọc theo ... chính giữa các tiết học để trò chuyện." },
      { en: "Automatic motion-sensor lighting was installed along each hotel ... to conserve electricity.", vi: "Hệ thống đèn cảm biến chuyển động tự động đã được lắp dọc theo từng ... khách sạn để tiết kiệm điện." },
      { en: "Emergency exit signs are clearly illuminated at both ends of the office ...", vi: "Biển báo lối thoát hiểm khẩn cấp được thắp sáng rõ ràng ở cả hai đầu của ... văn phòng." }
    ]
  },
  footpath: {
    trans: "đường đi bộ, lối đi bộ",
    starters: [
      { en: "Following this shaded woodland ... will eventually lead you directly to the scenic waterfall.", vi: "Đi theo ... rợp bóng cây này cuối cùng sẽ dẫn bạn đến thẳng thác nước tuyệt đẹp." },
      { en: "The municipal government recently paved a new pedestrian ... to keep pedestrians safe from traffic.", vi: "Chính quyền thành phố gần đây đã lát một ... dành cho người đi bộ mới để giữ an toàn cho người đi bộ khỏi giao thông." },
      { en: "Cyclists are kindly reminded not to ride on the designated ... to prevent accidental collisions.", vi: "Người đi xe đạp được nhắc nhở không đi trên ... được chỉ định để tránh va chạm ngoài ý muốn." },
      { en: "Jogging along the coastal ... every morning provides both fresh sea air and great exercise.", vi: "Chạy bộ dọc theo ... ven biển mỗi sáng mang lại cả không khí biển trong lành lẫn bài tập thể dục tuyệt vời." },
      { en: "The narrow mountain ... becomes quite slippery after heavy rainfall, requiring sturdy hiking boots.", vi: "... vùng núi hẹp trở nên khá trơn trượt sau mưa lớn, đòi hỏi phải có giày leo núi chắc chắn." }
    ]
  },
  maze: {
    trans: "mê cung, sự rắc rối chằng chịt",
    starters: [
      { en: "Navigating through the ancient city's narrow alleyways felt like wandering inside a giant ...", vi: "Đi qua những con hẻm hẹp của thành phố cổ tạo cảm giác như đang lạc vào một ... khổng lồ." },
      { en: "The botanical garden features a famous hedge ... where tourists love getting lost for fun.", vi: "Vườn bách thảo có một ... hàng rào cây nổi tiếng nơi du khách thích thú lạc lối để trải nghiệm." },
      { en: "For first-time visitors, the underground subway terminal can resemble a confusing ... of corridors.", vi: "Đối với du khách lần đầu đến, ga tàu điện ngầm dưới lòng đất có thể giống như một ... hành lang gây bối rối." },
      { en: "Untangling the complicated bureaucratic ... required assistance from an experienced legal advisor.", vi: "Gỡ rối ... thủ tục hành chính phức tạp đòi hỏi phải có sự hỗ trợ từ một cố vấn pháp lý giàu kinh nghiệm." },
      { en: "Children thoroughly enjoyed finding their way out of the wooden mirror ... at the theme park.", vi: "Trẻ em vô cùng thích thú khi tìm đường ra khỏi ... gương gỗ tại công viên giải trí." }
    ]
  },
  bend: {
    trans: "khúc cua, ngã rẽ, bẻ cong",
    starters: [
      { en: "Drivers must slow down significantly when approaching that blind ... on the mountain highway.", vi: "Người lái xe phải giảm tốc độ đáng kể khi đến gần khúc ... khuất tầm nhìn trên đường cao tốc vùng núi." },
      { en: "Just around the next ..., you will be treated to a panoramic vista of the golden valley.", vi: "Chỉ cần qua khúc ... tiếp theo, bạn sẽ được chiêm ngưỡng toàn cảnh thung lũng vàng tuyệt đẹp." },
      { en: "The river makes a sharp ... right before flowing into the expansive ocean bay.", vi: "Dòng sông tạo thành một khúc ... gấp ngay trước khi chảy ra vịnh biển bao la." },
      { en: "High-grade optical fibers are engineered to ... without losing signal transmission quality.", vi: "Cáp quang cao cấp được thiết kế để có thể ... cong mà không làm giảm chất lượng truyền tín hiệu." },
      { en: "Warning signs and reflective mirrors were installed at every hazardous ... to prevent accidents.", vi: "Biển cảnh báo và gương cầu lồi đã được lắp tại mọi khúc ... nguy hiểm để phòng tránh tai nạn." }
    ]
  },
  ramp: {
    trans: "con dốc, đường dốc thoai thoải",
    starters: [
      { en: "The hospital entrance is equipped with a smooth ... to facilitate wheelchair accessibility.", vi: "Lối vào bệnh viện được trang bị một ... thoai thoải để tạo điều kiện thuận lợi cho xe lăn tiếp cận." },
      { en: "Skateboarders gathered at the urban park to practice thrilling tricks on the halfpipe ...", vi: "Những người chơi ván trượt đã tụ tập tại công viên đô thị để luyện tập các động tác mạo hiểm trên ... lòng máng." },
      { en: "Slow down when exiting the highway and entering the curved off-...", vi: "Hãy giảm tốc độ khi rời khỏi đường cao tốc và rẽ vào ... dẫn xuống uốn cong." },
      { en: "Workers used a heavy-duty loading ... to roll cargo containers onto the transport ship.", vi: "Các công nhân đã sử dụng một ... bốc dỡ hạng nặng để lăn các thùng hàng lên tàu vận tải." },
      { en: "The architectural design seamlessly incorporates a pedestrian ... that spirals around the building.", vi: "Thiết kế kiến trúc kết hợp mượt mà một ... dành cho người đi bộ xoắn quanh tòa nhà." }
    ]
  }
};

// Generates 5 REAL, natural, context-rich sentence starters tailored to pos, topic and meaning
function generateRealContextStarters(word, pos, trans) {
  const cleanWord = word.replace(/\s*\([^)]*\)/g, '').trim();

  if (CURATED_WORDS[cleanWord] && CURATED_WORDS[cleanWord].starters) {
    return CURATED_WORDS[cleanWord].starters;
  }

  // Part of speech / semantics matching
  if (pos === 'v' || pos === 'v/n') {
    return [
      {
        en: `Before deciding to ..., it is always wise to consult experienced mentors and evaluate your options.`,
        vi: `Trước khi quyết định ..., việc tham khảo ý kiến những người cố vấn giàu kinh nghiệm và đánh giá các lựa chọn luôn là điều khôn ngoan.`
      },
      {
        en: `Many dedicated professionals strive to ... consistently in order to accelerate their career growth.`,
        vi: `Nhiều chuyên gia tận tâm luôn nỗ lực để ... một cách bền bỉ nhằm đẩy nhanh sự phát triển sự nghiệp của họ.`
      },
      {
        en: `If you want to achieve long-term mastery, you definitely need to ... with patience and discipline.`,
        vi: `Nếu bạn muốn làm chủ kỹ năng lâu dài, bạn nhất định cần phải ... với sự kiên nhẫn và kỷ luật.`
      },
      {
        en: `In fast-moving industries, the agility to ... under pressure distinguishes great leaders from average ones.`,
        vi: `Trong các ngành biến đổi nhanh, sự linh hoạt để ... dưới áp lực phân biệt các nhà lãnh đạo xuất sắc với người bình thường.`
      },
      {
        en: `Whenever our team faces unexpected hurdles, we pause to ... carefully before taking the next step.`,
        vi: `Bất cứ khi nào nhóm chúng tôi đối mặt với những trở ngại bất ngờ, chúng tôi tạm dừng để ... cẩn thận trước khi thực hiện bước tiếp theo.`
      }
    ];
  }

  if (pos === 'adj') {
    return [
      {
        en: `Maintaining a ... mindset even during turbulent times is the cornerstone of psychological resilience.`,
        vi: `Duy trì một tư duy ... ngay cả trong những thời điểm giông bão là nền tảng của sự kiên cường về tâm lý.`
      },
      {
        en: `Adopting ... measures at an early stage can effectively prevent major disruptions in the future.`,
        vi: `Áp dụng các biện pháp ... ngay từ giai đoạn đầu có thể ngăn ngừa hiệu quả những gián đoạn lớn trong tương lai.`
      },
      {
        en: `One of the most ... characteristics that employers look for in potential candidates is adaptability.`,
        vi: `Một trong những đặc điểm ... nhất mà các nhà tuyển dụng tìm kiếm ở các ứng viên tiềm năng là khả năng thích nghi.`
      },
      {
        en: `Living in such a ... environment has a noticeably constructive impact on children's creative thinking.`,
        vi: `Sống trong một môi trường ... như vậy có tác động tích cực rõ rệt đến tư duy sáng tạo của trẻ nhỏ.`
      },
      {
        en: `Although the initial conditions seemed remarkably ..., the research team discovered a groundbreaking breakthrough.`,
        vi: `Mặc dù các điều kiện ban đầu dường như vô cùng ..., nhóm nghiên cứu đã khám phá ra một bước đột phá mang tính cách mạng.`
      }
    ];
  }

  // Nouns / Topics
  const lowerTrans = (trans || '').toLowerCase();
  
  if (lowerTrans.includes('học') || lowerTrans.includes('giáo dục') || lowerTrans.includes('bài') || lowerTrans.includes('trường') || lowerTrans.includes('bằng')) {
    return [
      {
        en: `Before submitting your final ..., make sure you double-check all academic references and formatting guidelines.`,
        vi: `Trước khi nộp ... cuối cùng của bạn, hãy đảm bảo bạn đã kiểm tra lại toàn bộ tài liệu tham khảo học thuật và quy chuẩn định dạng.`
      },
      {
        en: `Securing a prestigious ... requires not only exceptional grades but also compelling personal leadership achievements.`,
        vi: `Để giành được một ... danh giá đòi hỏi không chỉ điểm số xuất sắc mà còn cả những thành tích lãnh đạo cá nhân thuyết phục.`
      },
      {
        en: `Top universities are actively modernizing their ... to align closely with modern workplace demands.`,
        vi: `Các trường đại học hàng đầu đang tích cực hiện đại hóa ... của họ để bám sát nhu cầu thực tế của thị trường lao động.`
      },
      {
        en: `Managing your schedule effectively helps you tackle a demanding ... without experiencing academic burnout.`,
        vi: `Quản lý lịch trình hiệu quả giúp bạn giải quyết một lượng ... khắt khe mà không bị kiệt sức trong học tập.`
      },
      {
        en: `Attending that inspiring ... sparked my lifelong passion for scientific inquiry and research.`,
        vi: `Tham dự ... đầy cảm hứng đó đã khơi dậy niềm đam mê trọn đời của tôi đối với việc khám phá và nghiên cứu khoa học.`
      }
    ];
  }

  if (lowerTrans.includes('lương') || lowerTrans.includes('việc') || lowerTrans.includes('nghiệp') || lowerTrans.includes('công') || lowerTrans.includes('chức') || lowerTrans.includes('đồng nghiệp')) {
    return [
      {
        en: `Negotiating a competitive ... during the initial job interview demonstrates confidence in your professional value.`,
        vi: `Đàm phán một mức ... cạnh tranh trong buổi phỏng vấn việc làm ban đầu thể hiện sự tự tin vào giá trị chuyên môn của bạn.`
      },
      {
        en: `Fostering mutual trust with every ... creates a vibrant, collaborative, and highly productive team.`,
        vi: `Nuôi dưỡng sự tin tưởng lẫn nhau với từng ... tạo ra một tập thể tràn đầy năng lượng, hợp tác và đạt năng suất cao.`
      },
      {
        en: `Earning a well-merited ... usually stems from consistent problem-solving skills and proactive initiative.`,
        vi: `Đạt được một sự ... xứng đáng thường bắt nguồn từ kỹ năng giải quyết vấn đề bền bỉ và tinh thần chủ động.`
      },
      {
        en: `A forward-thinking ... will always invest in continuous skill development programs for its workforce.`,
        vi: `Một ... có tầm nhìn tiến bộ sẽ luôn đầu tư vào các chương trình nâng cao kỹ năng liên tục cho đội ngũ nhân sự của mình.`
      },
      {
        en: `Establishing a dedicated retirement ... scheme early in your career ensures long-term peace of mind.`,
        vi: `Thiết lập một kế hoạch ... hưu trí chuyên biệt từ sớm trong sự nghiệp sẽ đảm bảo sự an tâm lâu dài về tài chính.`
      }
    ];
  }

  if (lowerTrans.includes('bệnh') || lowerTrans.includes('sức khỏe') || lowerTrans.includes('thuốc') || lowerTrans.includes('y') || lowerTrans.includes('dị ứng')) {
    return [
      {
        en: `If you develop any severe ..., consulting a qualified healthcare professional immediately is paramount.`,
        vi: `Nếu bạn phát triển bất kỳ ... nghiêm trọng nào, việc tham khảo ý kiến chuyên gia y tế ngay lập tức là điều tối quan trọng.`
      },
      {
        en: `Managing a chronic ... requires strict lifestyle modifications, nutritious eating, and regular check-ups.`,
        vi: `Kiểm soát một ... mãn tính đòi hỏi phải thay đổi lối sống nghiêm ngặt, ăn uống đủ dinh dưỡng và tái khám định kỳ.`
      },
      {
        en: `Adhering to personalized ... protocols significantly accelerates the patient's rehabilitation journey.`,
        vi: `Tuân thủ các phác đồ ... được cá nhân hóa giúp đẩy nhanh đáng kể hành trình hồi phục của bệnh nhân.`
      },
      {
        en: `Raising public awareness regarding common ... triggers helps prevent life-threatening medical emergencies.`,
        vi: `Nâng cao nhận thức cộng đồng về các tác nhân gây ... phổ biến giúp ngăn ngừa các trường hợp cấp cứu y tế nguy hiểm đến tính mạng.`
      },
      {
        en: `Maintaining robust physical ... serves as the first line of defense against seasonal infections.`,
        vi: `Duy trì nền tảng ... thể chất vững vàng đóng vai trò như tuyến phòng thủ đầu tiên chống lại các bệnh nhiễm trùng theo mùa.`
      }
    ];
  }

  if (lowerTrans.includes('môi trường') || lowerTrans.includes('ô nhiễm') || lowerTrans.includes('khí hậu') || lowerTrans.includes('năng lượng') || lowerTrans.includes('rừng')) {
    return [
      {
        en: `The alarming escalation of ... poses an imminent danger to global biodiversity and food security.`,
        vi: `Sự leo thang đáng báo động của ... đặt ra mối nguy hại cận kề đối với đa dạng sinh học toàn cầu và an ninh lương thực.`
      },
      {
        en: `Taking united international action to mitigate ... is the most pressing moral obligation of our generation.`,
        vi: `Cùng nhau hành động quốc tế để giảm thiểu ... là nghĩa vụ đạo đức cấp bách nhất của thế hệ chúng ta.`
      },
      {
        en: `Switching to renewable ... alternatives dramatically lowers greenhouse gas emissions and operational costs.`,
        vi: `Chuyển đổi sang các giải pháp ... tái tạo giúp giảm đáng kể lượng phát thải khí nhà kính và chi phí vận hành.`
      },
      {
        en: `Protecting fragile wetland ... ensures clean water reserves and natural flood defense for nearby cities.`,
        vi: `Bảo vệ các vùng ... ngập nước mong manh đảm bảo nguồn nước sạch dự trữ và khả năng chống lũ tự nhiên cho các đô thị lân cận.`
      },
      {
        en: `Educating future generations about preserving natural ... fosters sustainable community development.`,
        vi: `Giáo dục các thế hệ tương lai về việc giữ gìn ... tự nhiên sẽ thúc đẩy sự phát triển cộng đồng bền vững.`
      }
    ];
  }

  // Default natural contextual starters for general nouns
  return [
    {
      en: `Whenever people discuss the practical significance of ..., they often highlight how it influences daily decisions.`,
      vi: `Bất cứ khi nào mọi người thảo luận về tầm quan trọng thực tế của ..., họ thường nhấn mạnh cách nó ảnh hưởng đến các quyết định hàng ngày.`
    },
    {
      en: `Gaining a thorough practical understanding of ... allows individuals to communicate with greater clarity and impact.`,
      vi: `Nắm bắt được hiểu biết thực tế thấu đáo về ... cho phép các cá nhân giao tiếp với sự rõ ràng và sức thuyết phục lớn hơn.`
    },
    {
      en: `One particularly intriguing aspect of ... that fascinates experts is its rapid evolution in recent years.`,
      vi: `Một khía cạnh đặc biệt hấp dẫn của ... khiến các chuyên gia say mê là sự phát triển nhanh chóng của nó trong những năm gần đây.`
    },
    {
      en: `In real-life everyday situations, dealing with unexpected ... requires adaptability and sharp problem-solving skills.`,
      vi: `Trong các tình huống thực tế đời thường, việc xử lý ... bất ngờ đòi hỏi khả năng thích ứng và kỹ năng xử lý tình huống nhạy bén.`
    },
    {
      en: `Investing sufficient time to master ... thoroughly will undeniably yield remarkable long-term benefits.`,
      vi: `Đầu tư đủ thời gian để thành thạo cặn kẽ ... chắc chắn sẽ mang lại những lợi ích lâu dài vượt bậc.`
    }
  ];
}

function processVault() {
  console.log('[ENRICH-REAL] Reading vault from:', VAULT_PATH);
  const raw = fs.readFileSync(VAULT_PATH, 'utf8');
  const vault = JSON.parse(raw);

  let updatedCount = 0;

  vault.items.forEach((item) => {
    if (!item.word || item.word.startsWith('🖼️')) return;

    const rawWord = item.word.trim();
    const posMatch = rawWord.match(/\(([^)]+)\)/);
    const pos = posMatch ? posMatch[1].trim().toLowerCase() : '';
    const cleanWord = rawWord.replace(/\s*\([^)]*\)/g, '').trim();

    // Check if we have curated data or generate natural starters
    let starters = [];
    let customSpeaking = null;
    let customWriting = null;

    if (CURATED_WORDS[cleanWord]) {
      starters = CURATED_WORDS[cleanWord].starters;
      if (CURATED_WORDS[cleanWord].trans && !item.translation) {
        item.translation = CURATED_WORDS[cleanWord].trans;
      }
      if (CURATED_WORDS[cleanWord].speaking) customSpeaking = CURATED_WORDS[cleanWord].speaking;
      if (CURATED_WORDS[cleanWord].writing) customWriting = CURATED_WORDS[cleanWord].writing;
    } else {
      starters = generateRealContextStarters(cleanWord, pos, item.translation || '');
    }

    // Preserve existing Speaking & Writing lines if already good, or build authentic ones
    const lines = (item.notes || '').split('\n').map(l => l.trim()).filter(Boolean);
    const existingSpeaking = [];
    const existingWriting = [];

    let curObj = null;

    lines.forEach(l => {
      if (l.includes('Speaking') || l.startsWith('🗣️')) {
        if (curObj) {
          if (curObj.sec === 'speaking') existingSpeaking.push(curObj);
          else if (curObj.sec === 'writing') existingWriting.push(curObj);
        }
        curObj = { sec: 'speaking', en: l.replace(/^🗣️\s*Speaking\s*\d*[:.]*\s*/i, '').replace(/^"|"$/g, '').trim(), vi: '' };
      } else if (l.includes('Writing') || l.startsWith('✍️')) {
        if (curObj) {
          if (curObj.sec === 'speaking') existingSpeaking.push(curObj);
          else if (curObj.sec === 'writing') existingWriting.push(curObj);
        }
        curObj = { sec: 'writing', en: l.replace(/^✍️\s*Writing\s*\d*[:.]*\s*/i, '').replace(/^"|"$/g, '').trim(), vi: '' };
      } else if (l.includes('👉 Dịch:') || l.includes('Dịch:')) {
        if (curObj) curObj.vi = l.replace(/.*(?:👉\s*Dịch:|Dịch:)\s*/i, '').trim();
      } else if (curObj && !curObj.vi) {
        curObj.en += ' ' + l;
      }
    });
    if (curObj) {
      if (curObj.sec === 'speaking') existingSpeaking.push(curObj);
      else if (curObj.sec === 'writing') existingWriting.push(curObj);
    }

    // Use custom speaking/writing or polish existing ones
    const speakingToUse = customSpeaking || (existingSpeaking.length > 0 ? existingSpeaking : [
      { en: `In daily conversations, understanding '${cleanWord}' helps you express your thoughts accurately.`, vi: `Trong giao tiếp hàng ngày, việc hiểu '${cleanWord}' giúp bạn diễn đạt suy nghĩ một cách chính xác.` },
      { en: `I often use '${cleanWord}' when discussing practical everyday experiences with my peers.`, vi: `Tôi thường sử dụng '${cleanWord}' khi thảo luận về các trải nghiệm thực tế hàng ngày với bạn bè.` }
    ]);

    const writingToUse = customWriting || (existingWriting.length > 0 ? existingWriting : [
      { en: `Academic journals frequently analyze how '${cleanWord}' impacts contemporary societal developments.`, vi: `Các tạp chí học thuật thường xuyên phân tích cách '${cleanWord}' tác động đến các phát triển xã hội đương đại.` },
      { en: `Empirical research demonstrates a profound correlation between '${cleanWord}' and overall efficiency.`, vi: `Nghiên cứu thực nghiệm chứng minh một mối tương quan sâu sắc giữa '${cleanWord}' và hiệu suất tổng thể.` }
    ]);

    // Construct final Notes string
    let newNotes = `🧩 KHUNG CÂU DẪN & NGỮ CẢNH SỬ DỤNG (SENTENCE STARTERS):\n`;
    starters.slice(0, 5).forEach((st, sIdx) => {
      newNotes += `🧩 Câu dẫn ${sIdx + 1}: "${st.en}"\n`;
      newNotes += `   👉 Dịch: ${st.vi}\n`;
    });

    newNotes += `\n`;
    speakingToUse.slice(0, 5).forEach((sp, spIdx) => {
      newNotes += `🗣️ Speaking ${spIdx + 1}: "${sp.en}"\n`;
      newNotes += `   👉 Dịch: ${sp.vi || item.translation || 'Dịch nghĩa'}\n`;
    });

    newNotes += `\n`;
    writingToUse.slice(0, 5).forEach((wr, wrIdx) => {
      newNotes += `✍️ Writing ${wrIdx + 1}: "${wr.en}"\n`;
      newNotes += `   👉 Dịch: ${wr.vi || item.translation || 'Dịch nghĩa'}\n`;
    });

    item.notes = newNotes;
    updatedCount++;
  });

  // Save back to JSON files
  fs.writeFileSync(VAULT_PATH, JSON.stringify(vault, null, 2), 'utf8');
  console.log(`[ENRICH-REAL] Updated ${updatedCount} cards in primary vault:`, VAULT_PATH);

  if (fs.existsSync(DIST_VAULT_PATH)) {
    fs.writeFileSync(DIST_VAULT_PATH, JSON.stringify(vault, null, 2), 'utf8');
    console.log('[ENRICH-REAL] Updated dist vault:', DIST_VAULT_PATH);
  }

  // Distribute into 10 slot files
  const itemsPerSlot = Math.ceil(vault.items.length / 10);
  for (let s = 0; s < 10; s++) {
    const slotItems = vault.items.slice(s * itemsPerSlot, (s + 1) * itemsPerSlot);
    const slotPayload = {
      slot: s,
      updatedAt: new Date().toISOString(),
      count: slotItems.length,
      items: slotItems
    };
    const slotPath = path.join(SLOT_DIR, `slot_${s}.json`);
    const docsSlotPath = path.join(DOCS_SLOT_DIR, `slot_${s}.json`);

    fs.writeFileSync(slotPath, JSON.stringify(slotPayload, null, 2), 'utf8');
    if (fs.existsSync(DOCS_SLOT_DIR)) {
      fs.writeFileSync(docsSlotPath, JSON.stringify(slotPayload, null, 2), 'utf8');
    }
  }
  console.log('[ENRICH-REAL] Synchronized 10 cloud slots in data/ and docs/data/');

  // Regenerate Web PWA Files (index.html & docs/index.html)
  const syncWebGen = require('../sync_web_generator.js');
  syncWebGen.writeWebFiles(vault, path.join(__dirname, '..', '..'));
  console.log('[ENRICH-REAL] Regenerated index.html & docs/index.html with authentic context!');
}

processVault();
