const fs = require('fs');
const path = require('path');

const vaultPath = path.join(__dirname, '..', 'data', 'memorize_vault.json');
const rawVault = fs.readFileSync(vaultPath, 'utf8');
const vault = JSON.parse(rawVault);

// Extract existing tiktok URLs to distribute nicely
let tiktokUrls = [];
vault.items.forEach(x => {
  if (x.tiktokUrl && x.tiktokUrl.startsWith('http')) tiktokUrls.push(x.tiktokUrl);
});
tiktokUrls = [...new Set(tiktokUrls)];
if (tiktokUrls.length === 0) {
  tiktokUrls = ['https://www.tiktok.com/@k.10th9/video/7519480746717908242'];
}

let urlIndex = 0;
function getNextUrl(word) {
  const url = tiktokUrls[urlIndex % tiktokUrls.length];
  urlIndex++;
  return url;
}

const todayStr = new Date().toISOString().split('T')[0];
let baseTimestamp = Date.now();

const rawItems = [
  // 1. MÔI TRƯỜNG & NĂNG LƯỢNG
  {
    word: "portable",
    pos: "adj",
    trans: "di động, xách tay",
    exampleEn: "The Desolenator is a portable device.",
    exampleVi: "Desolenator là một thiết bị di động, có thể mang theo."
  },
  {
    word: "desalination",
    pos: "n",
    trans: "sự khử muối",
    exampleEn: "Desalination is used to turn seawater into drinking water.",
    exampleVi: "Khử muối được sử dụng để biến nước biển thành nước uống."
  },
  {
    word: "natural groundwater reserves",
    pos: "n phr",
    trans: "nguồn nước ngầm tự nhiên",
    exampleEn: "Pollution threatens natural groundwater reserves.",
    exampleVi: "Ô nhiễm đe dọa các nguồn nước ngầm tự nhiên."
  },
  {
    word: "severe water scarcity",
    pos: "n phr",
    trans: "khan hiếm nước trầm trọng",
    exampleEn: "Many regions face severe water scarcity.",
    exampleVi: "Nhiều khu vực đối mặt với tình trạng khan hiếm nước trầm trọng."
  },
  {
    word: "the demand exceeds the supply",
    pos: "n phr",
    trans: "cầu vượt cung",
    exampleEn: "The demand exceeds the supply of clean water.",
    exampleVi: "Nhu cầu vượt quá nguồn cung cấp nước sạch."
  },
  {
    word: "carbon footprint",
    pos: "n phr",
    trans: "lượng khí thải carbon",
    exampleEn: "We need to reduce our carbon footprint.",
    exampleVi: "Chúng ta cần giảm lượng khí thải carbon của mình."
  },
  {
    word: "sustainable",
    pos: "adj",
    trans: "bền vững",
    exampleEn: "Sustainable energy is essential for the future.",
    exampleVi: "Năng lượng bền vững là rất cần thiết cho tương lai."
  },
  {
    word: "maintenance",
    pos: "n",
    trans: "sự bảo trì, bảo dưỡng",
    exampleEn: "The machine requires regular maintenance.",
    exampleVi: "Máy móc đòi hỏi phải bảo trì thường xuyên."
  },
  {
    word: "environmentally aware",
    pos: "adj phr",
    trans: "có nhận thức về môi trường",
    exampleEn: "Consumers are becoming more environmentally aware.",
    exampleVi: "Người tiêu dùng ngày càng có nhận thức về môi trường hơn."
  },
  {
    word: "out-compete",
    pos: "v",
    trans: "cạnh tranh tốt hơn, vượt trội hơn",
    exampleEn: "Green companies can out-compete polluting ones.",
    exampleVi: "Các công ty xanh có thể cạnh tranh vượt trội các công ty gây ô nhiễm."
  },
  {
    word: "corrupt officials",
    pos: "n phr",
    trans: "quan chức tham nhũng",
    exampleEn: "Corrupt officials often ignore environmental regulations.",
    exampleVi: "Các quan chức tham nhũng thường phớt lờ các quy định về môi trường."
  },
  {
    word: "short-term leases",
    pos: "n phr",
    trans: "hợp đồng thuê ngắn hạn",
    exampleEn: "Companies often acquire land through short-term leases.",
    exampleVi: "Các công ty thường sở hữu đất đai thông qua hợp đồng thuê ngắn hạn."
  },
  {
    word: "pass / enforce laws",
    pos: "v phr",
    trans: "ban hành / thực thi luật",
    exampleEn: "Governments must pass and enforce environmental laws.",
    exampleVi: "Các chính phủ phải ban hành và thực thi luật bảo vệ môi trường."
  },
  {
    word: "in accordance with",
    pos: "prep phr",
    trans: "phù hợp với, theo đúng",
    exampleEn: "Businesses should act in accordance with moral principles.",
    exampleVi: "Doanh nghiệp nên hành động phù hợp với các nguyên tắc đạo đức."
  },
  {
    word: "explicit",
    pos: "adj",
    trans: "rõ ràng, minh bạch",
    exampleEn: "The rules need to be made explicit.",
    exampleVi: "Các quy định cần phải được làm rõ ràng, minh bạch."
  },
  {
    word: "cover costs",
    pos: "v phr",
    trans: "chi trả chi phí, bù đắp chi phí",
    exampleEn: "Higher prices may cover the costs of environmental protection.",
    exampleVi: "Giá cao hơn có thể bù đắp chi phí bảo vệ môi trường."
  },
  {
    word: "severe water stress",
    pos: "n phr",
    trans: "áp lực khan hiếm nước trầm trọng",
    exampleEn: "Climate change causes severe water stress in many areas.",
    exampleVi: "Biến đổi khí hậu gây ra áp lực khan hiếm nước ở nhiều khu vực."
  },

  // 2. CHỦ ĐỀ LỊCH SỬ & GIA ĐÌNH KINH DOANH
  {
    word: "conceived of",
    pos: "v phr",
    trans: "nghĩ ra ý tưởng, hình thành ý tưởng",
    exampleEn: "Imhotep conceived of building the Step Pyramid.",
    exampleVi: "Imhotep đã nghĩ ra ý tưởng xây dựng Kim tự tháp bậc thang."
  },
  {
    word: "reigned",
    pos: "v",
    trans: "cai trị, trị vì",
    exampleEn: "Djoser reigned for approximately 19 years.",
    exampleVi: "Djoser đã trị vì trong khoảng 19 năm."
  },
  {
    word: "ringed by",
    pos: "v phr",
    trans: "được bao quanh bởi",
    exampleEn: "The wall was ringed by a trench.",
    exampleVi: "Bức tường được bao quanh bởi một con hào."
  },
  {
    word: "intricate",
    pos: "adj",
    trans: "phức tạp, tỉ mỉ, tinh xảo",
    exampleEn: "The underground tunnels had an intricate design.",
    exampleVi: "Các đường hầm dưới lòng đất có thiết kế rất phức tạp và tinh xảo."
  },
  {
    word: "archetype",
    pos: "n",
    trans: "khuôn mẫu, nguyên mẫu",
    exampleEn: "The Step Pyramid became the archetype for later pyramids.",
    exampleVi: "Kim tự tháp bậc thang đã trở thành hình mẫu cho các kim tự tháp sau này."
  },
  {
    word: "took over",
    pos: "v phr",
    trans: "tiếp quản, chiếm đoạt",
    exampleEn: "The Dutch took over the Banda Islands.",
    exampleVi: "Người Hà Lan đã tiếp quản quần đảo Banda."
  },
  {
    word: "smuggle",
    pos: "v",
    trans: "buôn lậu",
    exampleEn: "The French smuggled nutmeg plants out of the islands.",
    exampleVi: "Người Pháp đã buôn lậu cây nhục đậu khấu ra khỏi đảo."
  },
  {
    word: "seize",
    pos: "v",
    trans: "chiếm đoạt, tịch thu",
    exampleEn: "The British seized the islands by force.",
    exampleVi: "Người Anh đã dùng vũ lực chiếm đoạt các hòn đảo."
  },
  {
    word: "transplant",
    pos: "v",
    trans: "cấy ghép, di dời (cây)",
    exampleEn: "They transplanted nutmeg seedlings to other regions.",
    exampleVi: "Họ đã di dời cây giống nhục đậu khấu sang các vùng khác."
  },
  {
    word: "uproot",
    pos: "v",
    trans: "nhổ bật rễ, tiêu diệt",
    exampleEn: "The Dutch uprooted any trees outside their plantations.",
    exampleVi: "Người Hà Lan đã nhổ bật rễ bất kỳ cây nào ngoài đồn điền của họ."
  },
  {
    word: "monopoly",
    pos: "n",
    trans: "độc quyền",
    exampleEn: "The Dutch had a monopoly over the nutmeg trade.",
    exampleVi: "Người Hà Lan đã độc quyền buôn bán nhục đậu khấu."
  },
  {
    word: "compromise settlement",
    pos: "n phr",
    trans: "thỏa hiệp, giải pháp dung hòa",
    exampleEn: "The Dutch and British reached a compromise settlement.",
    exampleVi: "Người Hà Lan và người Anh đã đạt được một giải pháp thỏa hiệp."
  },
  {
    word: "commodity",
    pos: "n",
    trans: "hàng hóa, sản phẩm thương mại",
    exampleEn: "Nutmeg was an extremely valuable commodity.",
    exampleVi: "Nhục đậu khấu từng là một mặt hàng cực kỳ có giá trị."
  },
  {
    word: "contagious",
    pos: "adj",
    trans: "dễ lây lan, truyền nhiễm",
    exampleEn: "The plague was a highly contagious disease.",
    exampleVi: "Bệnh dịch hạch là một căn bệnh có tính lây lan rất cao."
  },
  {
    word: "soar",
    pos: "v",
    trans: "tăng vọt",
    exampleEn: "Prices soared across Europe.",
    exampleVi: "Giá cả đã tăng vọt trên khắp châu Âu."
  },
  {
    word: "prized",
    pos: "adj",
    trans: "được đánh giá cao, quý giá",
    exampleEn: "Nutmeg was a prized ingredient in European cuisine.",
    exampleVi: "Nhục đậu khấu là một nguyên liệu quý giá trong ẩm thực châu Âu."
  },
  {
    word: "seedling",
    pos: "n",
    trans: "cây con, cây giống",
    exampleEn: "Nutmeg seedlings were transplanted to other locations.",
    exampleVi: "Cây con nhục đậu khấu đã được cấy ghép sang các địa điểm khác."
  },

  // 3. CHỦ ĐỀ CÔNG NGHỆ & ĐIỆN TỬ (Speaking)
  {
    word: "versatile",
    pos: "adj",
    trans: "đa năng, đa dụng, linh hoạt",
    exampleEn: "Smartphones are incredibly versatile.",
    exampleVi: "Điện thoại thông minh cực kỳ đa năng."
  },
  {
    word: "tech-savvy",
    pos: "adj",
    trans: "thành thạo công nghệ, sành sỏi công nghệ",
    exampleEn: "Young people are usually tech-savvy.",
    exampleVi: "Giới trẻ ngày nay thường rất thành thạo công nghệ."
  },
  {
    word: "indispensable",
    pos: "adj",
    trans: "không thể thiếu, thiết yếu",
    exampleEn: "Technology has become indispensable in modern daily life.",
    exampleVi: "Công nghệ đã trở nên không thể thiếu trong đời sống hiện đại."
  },
  {
    word: "digital divide",
    pos: "n phr",
    trans: "khoảng cách công nghệ, chênh lệch kỹ thuật số",
    exampleEn: "The digital divide between generations is narrowing.",
    exampleVi: "Khoảng cách công nghệ giữa các thế hệ đang dần thu hẹp."
  },
  {
    word: "asynchronous",
    pos: "adj",
    trans: "không đồng bộ",
    exampleEn: "Messaging allows asynchronous communication across time zones.",
    exampleVi: "Nhắn tin cho phép giao tiếp không đồng bộ qua các múi giờ."
  },
  {
    word: "etiquette",
    pos: "n",
    trans: "phép lịch sự, quy tắc ứng xử",
    exampleEn: "Mobile phone etiquette is important in public places.",
    exampleVi: "Quy tắc lịch sự khi dùng điện thoại là rất quan trọng ở nơi công cộng."
  },
  {
    word: "multitasking",
    pos: "n",
    trans: "làm nhiều việc cùng lúc, đa nhiệm",
    exampleEn: "Young people are good at multitasking with different devices.",
    exampleVi: "Người trẻ rất giỏi đa nhiệm với nhiều thiết bị khác nhau."
  },
  {
    word: "access",
    pos: "v",
    trans: "truy cập, tiếp cận",
    exampleEn: "People can access information instantly via the internet.",
    exampleVi: "Mọi người có thể tiếp cận thông tin ngay lập tức qua internet."
  },
  {
    word: "streaming",
    pos: "n",
    trans: "xem / nghe trực tuyến",
    exampleEn: "Streaming services are very popular nowadays.",
    exampleVi: "Các dịch vụ phát trực tuyến hiện nay vô cùng phổ biến."
  },
  {
    word: "banking",
    pos: "n",
    trans: "giao dịch ngân hàng",
    exampleEn: "Mobile banking has become increasingly popular and secure.",
    exampleVi: "Ngân hàng di động ngày càng trở nên phổ biến và bảo mật."
  },
  {
    word: "ride-hailing",
    pos: "n",
    trans: "đặt xe trực tuyến (như Grab, Be)",
    exampleEn: "Ride-hailing apps have transformed urban transportation.",
    exampleVi: "Các ứng dụng gọi xe công nghệ đã thay đổi giao thông đô thị."
  },
  {
    word: "online shopping",
    pos: "n phr",
    trans: "mua sắm trực tuyến",
    exampleEn: "Online shopping is convenient and time-saving.",
    exampleVi: "Mua sắm trực tuyến rất tiện lợi và tiết kiệm thời gian."
  },

  // 4. CHỦ ĐỀ THỜI TIẾT & KHÍ HẬU (Speaking)
  {
    word: "tropical monsoon climate",
    pos: "n phr",
    trans: "khí hậu nhiệt đới gió mùa",
    exampleEn: "Vietnam has a tropical monsoon climate.",
    exampleVi: "Việt Nam có khí hậu nhiệt đới gió mùa."
  },
  {
    word: "humid",
    pos: "adj",
    trans: "ẩm ướt, nồm ẩm",
    exampleEn: "The weather is often humid in summer.",
    exampleVi: "Thời tiết thường rất ẩm ướt vào mùa hè."
  },
  {
    word: "scorching",
    pos: "adj",
    trans: "rất nóng, thiêu đốt, gay gắt",
    exampleEn: "The sun was scorching in the afternoon.",
    exampleVi: "Mặt trời thiêu đốt gay gắt vào buổi chiều."
  },
  {
    word: "sluggish",
    pos: "adj",
    trans: "uể oải, chậm chạp, lờ đờ",
    exampleEn: "Hot weather makes me feel sluggish.",
    exampleVi: "Thời tiết nóng bức khiến tôi cảm thấy uể oải, chậm chạp."
  },
  {
    word: "lethargic",
    pos: "adj",
    trans: "mệt mỏi, uể oải, thiếu năng lượng",
    exampleEn: "I feel lethargic during the summer months.",
    exampleVi: "Tôi cảm thấy mệt mỏi, thiếu sức sống trong những tháng hè."
  },
  {
    word: "breathtaking",
    pos: "adj",
    trans: "đẹp ngoạn mục, ngỡ ngàng",
    exampleEn: "The autumn scenery was breathtaking.",
    exampleVi: "Khung cảnh mùa thu đẹp đến mức ngỡ ngàng."
  },
  {
    word: "nostalgic",
    pos: "adj",
    trans: "hoài niệm, bồi hồi nhớ về quá khứ",
    exampleEn: "Autumn brings back nostalgic memories.",
    exampleVi: "Mùa thu mang lại những ký ức đầy hoài niệm."
  },
  {
    word: "profound impact",
    pos: "n phr",
    trans: "ảnh hưởng sâu sắc",
    exampleEn: "Weather has a profound impact on our daily lives.",
    exampleVi: "Thời tiết có tác động sâu sắc đến đời sống thường ngày của chúng ta."
  },
  {
    word: "devastate",
    pos: "v",
    trans: "tàn phá, hủy hoại",
    exampleEn: "Typhoons can devastate entire communities.",
    exampleVi: "Bão lớn có thể tàn phá toàn bộ các cộng đồng dân cư."
  },
  {
    word: "sceptical",
    pos: "adj",
    trans: "hoài nghi, nghi ngờ",
    exampleEn: "Some people are sceptical about weather forecasts.",
    exampleVi: "Một số người tỏ ra hoài nghi về các bản tin dự báo thời tiết."
  },
  {
    word: "seasonal affective disorder",
    pos: "n phr",
    trans: "rối loạn cảm xúc theo mùa (SAD)",
    exampleEn: "Some people suffer from seasonal affective disorder in winter.",
    exampleVi: "Một số người mắc hội chứng trầm cảm/rối loạn cảm xúc vào mùa đông."
  },
  {
    word: "crisp",
    pos: "adj",
    trans: "trong lành, se lạnh, khô ráo",
    exampleEn: "I love the crisp autumn air in the early morning.",
    exampleVi: "Tôi rất yêu bầu không khí se lạnh, trong lành của buổi sớm mùa thu."
  },
  {
    word: "oppressive heat",
    pos: "n phr",
    trans: "sức nóng ngột ngạt, bức bối",
    exampleEn: "Summer's oppressive heat finally subsides.",
    exampleVi: "Cái nóng bức bối, ngột ngạt của mùa hè cuối cùng cũng dịu đi."
  },

  // 5. CHỦ ĐỀ SỨC KHỎE & DINH DƯỠNG (Listening)
  {
    word: "obesity",
    pos: "n",
    trans: "bệnh béo phì",
    exampleEn: "Obesity is a growing problem worldwide.",
    exampleVi: "Béo phì là một vấn đề đang gia tăng trên toàn cầu."
  },
  {
    word: "artificial sweeteners",
    pos: "n phr",
    trans: "chất tạo ngọt nhân tạo",
    exampleEn: "Artificial sweeteners are used as a sugar substitute.",
    exampleVi: "Chất làm ngọt nhân tạo được sử dụng để thay thế đường."
  },
  {
    word: "nutritional information",
    pos: "n phr",
    trans: "thông tin dinh dưỡng",
    exampleEn: "The package provides detailed nutritional information.",
    exampleVi: "Bao bì cung cấp thông tin dinh dưỡng chi tiết."
  },
  {
    word: "fat content",
    pos: "n phr",
    trans: "hàm lượng chất béo",
    exampleEn: "We measured the fat content of different nuts.",
    exampleVi: "Chúng tôi đã đo hàm lượng chất béo trong các loại hạt khác nhau."
  },
  {
    word: "brisk walking",
    pos: "n phr",
    trans: "đi bộ nhanh",
    exampleEn: "Brisk walking is recommended for good health.",
    exampleVi: "Đi bộ nhanh được khuyến khích để có một sức khỏe tốt."
  },
  {
    word: "guidelines",
    pos: "n",
    trans: "hướng dẫn, chỉ dẫn",
    exampleEn: "The government issued guidelines for healthy eating.",
    exampleVi: "Chính phủ đã ban hành các hướng dẫn về ăn uống lành mạnh."
  },
  {
    word: "calorie counts",
    pos: "n phr",
    trans: "lượng calo, thông số calo",
    exampleEn: "Food labels show accurate calorie counts.",
    exampleVi: "Nhãn thực phẩm thể hiện chính xác lượng calo."
  },
  {
    word: "low-calorie",
    pos: "adj",
    trans: "ít calo, hàm lượng calo thấp",
    exampleEn: "Some restaurants offer healthy low-calorie options.",
    exampleVi: "Một số nhà hàng phục vụ các lựa chọn ít calo tốt cho sức khỏe."
  },
  {
    word: "diet",
    pos: "n",
    trans: "chế độ ăn, khẩu phần ăn",
    exampleEn: "A balanced diet is important for physical and mental health.",
    exampleVi: "Chế độ ăn cân bằng là rất quan trọng cho sức khỏe thể chất và tinh thần."
  },
  {
    word: "overestimate",
    pos: "v",
    trans: "đánh giá quá cao",
    exampleEn: "Most people overestimate how much exercise they do.",
    exampleVi: "Hầu hết mọi người đều đánh giá quá cao mức độ tập luyện thể dục của mình."
  },
  {
    word: "recommended amount",
    pos: "n phr",
    trans: "lượng khuyến nghị, định mức khuyên dùng",
    exampleEn: "Only 6% of men do the recommended amount of exercise.",
    exampleVi: "Chỉ có 6% nam giới thực hiện đủ lượng vận động được khuyến nghị."
  },
  {
    word: "legislation",
    pos: "n",
    trans: "luật pháp, đạo luật",
    exampleEn: "Governments should introduce legislation to promote healthy eating.",
    exampleVi: "Chính phủ nên đưa ra đạo luật để thúc đẩy thói quen ăn uống lành mạnh."
  },

  // 6. CHỦ ĐỀ HÀI HƯỚC & TÂM LÝ HỌC (Reading)
  {
    word: "stimuli",
    pos: "n (số nhiều)",
    trans: "tác nhân kích thích (số ít: stimulus)",
    exampleEn: "Babies respond to various external stimuli.",
    exampleVi: "Trẻ sơ sinh phản ứng với nhiều tác nhân kích thích bên ngoài."
  },
  {
    word: "universal",
    pos: "adj",
    trans: "phổ quát, toàn cầu, mang tính quốc tế",
    exampleEn: "Laughter is universal across all human cultures.",
    exampleVi: "Tiếng cười là điều phổ quát ở mọi nền văn hóa loài người."
  },
  {
    word: "communicates",
    pos: "v",
    trans: "truyền đạt, thể hiện, bộc lộ",
    exampleEn: "Laughter communicates a remarkable amount of social information.",
    exampleVi: "Tiếng cười truyền tải một lượng thông tin xã hội đáng kinh ngạc."
  },
  {
    word: "perceived",
    pos: "v (past participle)",
    trans: "được nhận thức, được nhìn nhận, đánh giá",
    exampleEn: "The laughter was perceived as dominant or submissive.",
    exampleVi: "Tiếng cười được cảm nhận là mang tính lấn át hay nhún nhường."
  },
  {
    word: "submissive",
    pos: "adj",
    trans: "phục tùng, nhún nhường, quy phục",
    exampleEn: "Submissive laughter differs markedly from dominant laughter.",
    exampleVi: "Tiếng cười nhún nhường khác biệt rõ rệt so với tiếng cười lấn át."
  },
  {
    word: "tedious",
    pos: "adj",
    trans: "tẻ nhạt, buồn tẻ, nhàm chán",
    exampleEn: "Humour provides a welcome respite from tedious situations.",
    exampleVi: "Sự hài hước mang lại sự giải tỏa đáng quý khỏi những tình huống tẻ nhạt."
  },
  {
    word: "respite from",
    pos: "n phr",
    trans: "sự tạm nghỉ, giải lao, lối thoát khỏi",
    exampleEn: "Humour offers a brief respite from everyday stress.",
    exampleVi: "Hài hước mang lại sự nghỉ ngơi ngắn ngủi khỏi những căng thẳng thường ngày."
  },
  {
    word: "facilitate",
    pos: "v",
    trans: "tạo điều kiện thuận lợi, thúc đẩy",
    exampleEn: "Humour facilitates social relationships and teamwork.",
    exampleVi: "Hài hước giúp thúc đẩy các mối quan hệ xã hội và làm việc nhóm."
  },
  {
    word: "replenishment",
    pos: "n",
    trans: "sự bổ sung, làm đầy lại, tái tạo",
    exampleEn: "The break allows the replenishment of mental resources.",
    exampleVi: "Thời gian nghỉ ngơi cho phép tái tạo lại các nguồn năng lượng tinh thần."
  },
  {
    word: "elicit",
    pos: "v",
    trans: "khơi gợi, gợi ra (cảm xúc/phản ứng)",
    exampleEn: "The video clip elicited humour, contentment, or neutral feelings.",
    exampleVi: "Đoạn video đã khơi gợi tiếng cười, sự hài lòng hoặc cảm xúc trung tính."
  },
  {
    word: "consecutive",
    pos: "adj",
    trans: "liên tiếp, liên tục không ngắt quãng",
    exampleEn: "Participants needed 10 consecutive correct answers.",
    exampleVi: "Những người tham gia cần 10 câu trả lời đúng liên tiếp."
  },
  {
    word: "distraction",
    pos: "n",
    trans: "sự mất tập trung, điều gây xao nhãng",
    exampleEn: "Humour may occasionally distract people from their tasks.",
    exampleVi: "Sự hài hước đôi khi có thể làm mọi người phân tâm khỏi công việc."
  },
  {
    word: "energising",
    pos: "adj",
    trans: "tiếp thêm năng lượng, tràn đầy sinh lực",
    exampleEn: "Humour is not only enjoyable but also deeply energising.",
    exampleVi: "Sự hài hước không chỉ thú vị mà còn tiếp thêm rất nhiều năng lượng."
  },

  // 7. CHỦ ĐỀ VI SINH VẬT & KHOẢNG KHẮC (Reading)
  {
    word: "ubiquitous",
    pos: "adj",
    trans: "có mặt khắp nơi, phổ biến rộng rãi",
    exampleEn: "Microbes are ubiquitous in our environment.",
    exampleVi: "Vi sinh vật hiện diện ở khắp mọi nơi trong môi trường xung quanh ta."
  },
  {
    word: "populated",
    pos: "v (past participle)",
    trans: "định cư, sinh sống, cư ngụ",
    exampleEn: "Microbes have populated the planet since long before humans.",
    exampleVi: "Vi sinh vật đã cư ngụ trên hành tinh này từ rất lâu trước con người."
  },
  {
    word: "outlive",
    pos: "v",
    trans: "sống lâu hơn, tồn tại lâu hơn",
    exampleEn: "Microbes will likely outlive human civilization.",
    exampleVi: "Vi sinh vật có khả năng sẽ tồn tại lâu hơn cả nền văn minh nhân loại."
  },
  {
    word: "adept",
    pos: "adj",
    trans: "thành thạo, tinh thông, tài giỏi",
    exampleEn: "Yong is an extraordinarily adept guide through the micro-world.",
    exampleVi: "Yong là một người hướng dẫn cực kỳ tinh thông thế giới vi mô."
  },
  {
    word: "have a knack of",
    pos: "v phr",
    trans: "có năng khiếu / sở trường làm gì",
    exampleEn: "He has a knack of explaining complex science simply.",
    exampleVi: "Anh ấy có khiếu giải thích những vấn đề khoa học phức tạp một cách đơn giản."
  },
  {
    word: "enthralling",
    pos: "adj",
    trans: "lôi cuốn, say mê, hấp dẫn tuyệt vời",
    exampleEn: "The book is utterly enthralling and informative.",
    exampleVi: "Cuốn sách hoàn toàn cuốn hút và chứa đựng nhiều thông tin bổ ích."
  },
  {
    word: "in a bid to",
    pos: "prep phr",
    trans: "nhằm mục đích, nỗ lực để",
    exampleEn: "He writes in a bid to persuade us to appreciate microbes.",
    exampleVi: "Tác giả viết với nỗ lực thuyết phục chúng ta trân trọng vi sinh vật hơn."
  },
  {
    word: "pose",
    pos: "v",
    trans: "gây ra, đặt ra (mối đe dọa / thách thức)",
    exampleEn: "Only a small fraction of bacteria pose a threat to health.",
    exampleVi: "Chỉ một tỷ lệ nhỏ vi khuẩn gây ra mối đe dọa cho sức khỏe."
  },
  {
    word: "unravelling",
    pos: "v (gerund)",
    trans: "làm sáng tỏ, giải mã, khám phá",
    exampleEn: "Scientists are unravelling the ways bacteria affect our mood.",
    exampleVi: "Các nhà khoa học đang giải mã cách thức vi khuẩn ảnh hưởng đến tâm trạng."
  },
  {
    word: "aid digestion",
    pos: "v phr",
    trans: "hỗ trợ tiêu hóa",
    exampleEn: "Gut bacteria aid digestion and nutrient absorption.",
    exampleVi: "Vi khuẩn đường ruột hỗ trợ tiêu hóa và hấp thụ chất dinh dưỡng."
  },
  {
    word: "regulate",
    pos: "v",
    trans: "điều hòa, điều chỉnh, kiểm soát",
    exampleEn: "Bacteria help regulate our immune systems.",
    exampleVi: "Vi khuẩn giúp điều hòa và củng cố hệ thống miễn dịch của chúng ta."
  },
  {
    word: "eliminate toxins",
    pos: "v phr",
    trans: "loại bỏ độc tố, thanh lọc cơ thể",
    exampleEn: "Beneficial bacteria help eliminate toxins from the body.",
    exampleVi: "Các vi khuẩn có lợi giúp đào thải độc tố ra khỏi cơ thể."
  },
  {
    word: "exposure to",
    pos: "n phr",
    trans: "sự tiếp xúc với, phơi nhiễm với",
    exampleEn: "Children need early exposure to harmless bacteria.",
    exampleVi: "Trẻ em cần được tiếp xúc sớm với các loại vi khuẩn vô hại."
  },
  {
    word: "symbiotic relationship",
    pos: "n phr",
    trans: "mối quan hệ cộng sinh",
    exampleEn: "Humans maintain a symbiotic relationship with billions of microbes.",
    exampleVi: "Con người duy trì mối quan hệ cộng sinh với hàng tỷ vi sinh vật."
  },
  {
    word: "mutually beneficial",
    pos: "adj phr",
    trans: "đôi bên cùng có lợi, tương hỗ",
    exampleEn: "The relationship is mutually beneficial to both host and microbe.",
    exampleVi: "Mối quan hệ này mang lại lợi ích chung cho cả vật chủ và vi khuẩn."
  },
  {
    word: "diverse range",
    pos: "adj phr",
    trans: "đa dạng, phong phú",
    exampleEn: "Pets give children exposure to a diverse range of bacteria.",
    exampleVi: "Thú cưng giúp trẻ tiếp xúc với một hệ vi khuẩn phong phú, đa dạng."
  },

  // 8. CHỦ ĐỀ CÔNG VIỆC & MÔI TRƯỜNG LÀM VIỆC (Listening)
  {
    word: "agriculture",
    pos: "n",
    trans: "ngành nông nghiệp",
    exampleEn: "Agriculture provides many employment opportunities.",
    exampleVi: "Nông nghiệp tạo ra nhiều cơ hội việc làm phong phú."
  },
  {
    word: "horticulture",
    pos: "n",
    trans: "nghề làm vườn, trồng trọt cây cảnh",
    exampleEn: "Horticulture involves garden cultivation and plant breeding.",
    exampleVi: "Nghề làm vườn bao gồm việc chăm sóc cây cảnh và nhân giống cây trồng."
  },
  {
    word: "recruitment consultant",
    pos: "n phr",
    trans: "chuyên viên tư vấn tuyển dụng",
    exampleEn: "She works successfully as a recruitment consultant.",
    exampleVi: "Cô ấy làm việc thành công trong vai trò chuyên viên tuyển dụng."
  },
  {
    word: "juggle",
    pos: "v",
    trans: "xoay xở, gánh vác nhiều việc cùng lúc",
    exampleEn: "Many working parents have to juggle career and childcare.",
    exampleVi: "Nhiều bậc cha mẹ đi làm phải xoay xở giữa công việc và chăm sóc con cái."
  },
  {
    word: "rural setting",
    pos: "n phr",
    trans: "khung cảnh / môi trường nông thôn",
    exampleEn: "Some employees thrive more in a calm rural setting.",
    exampleVi: "Một số nhân viên phát triển tốt hơn trong môi trường thanh bình ở thôn quê."
  },
  {
    word: "guarantee",
    pos: "v",
    trans: "đảm bảo, cam kết",
    exampleEn: "We cannot always guarantee a stress-free working environment.",
    exampleVi: "Chúng tôi không thể luôn đảm bảo một môi trường làm việc không căng thẳng."
  },
  {
    word: "work-related",
    pos: "adj",
    trans: "liên quan đến công việc",
    exampleEn: "Work-related accidents have dropped significantly due to safety rules.",
    exampleVi: "Tai nạn liên quan đến công việc đã giảm đáng kể nhờ quy tắc an toàn."
  },
  {
    word: "flexible",
    pos: "adj",
    trans: "linh hoạt, mềm dẻo",
    exampleEn: "Flexible working hours are important for job satisfaction.",
    exampleVi: "Giờ làm việc linh hoạt rất quan trọng đối với sự hài lòng trong công việc."
  },
  {
    word: "health and safety",
    pos: "n phr",
    trans: "sức khỏe và an toàn lao động",
    exampleEn: "Modern standards of workplace health and safety are much higher now.",
    exampleVi: "Các tiêu chuẩn an toàn và sức khỏe tại nơi làm việc ngày nay cao hơn nhiều."
  },
  {
    word: "physical fitness",
    pos: "n phr",
    trans: "thể lực, sức khỏe thể chất",
    exampleEn: "Some outdoor jobs require a high level of physical fitness.",
    exampleVi: "Một số công việc ngoài trời đòi hỏi nền tảng thể lực rất tốt."
  },
  {
    word: "substantial",
    pos: "adj",
    trans: "đáng kể, lớn, quan trọng",
    exampleEn: "Senior executive salaries can sometimes be substantial.",
    exampleVi: "Mức lương dành cho cấp quản lý cấp cao đôi khi rất đáng kể."
  },
  {
    word: "maintenance intensive",
    pos: "adj phr",
    trans: "tốn nhiều công bảo trì, đòi hỏi chăm sóc liên tục",
    exampleEn: "These heavy industrial machines are maintenance intensive.",
    exampleVi: "Các máy công nghiệp hạng nặng này đòi hỏi rất nhiều công bảo trì."
  },
  {
    word: "overlook",
    pos: "v",
    trans: "bỏ qua, xem nhẹ, không để ý",
    exampleEn: "Companies may accidentally overlook talented internal candidates.",
    exampleVi: "Các công ty đôi khi vô tình bỏ qua những ứng viên tài năng nội bộ."
  },
  {
    word: "nip in the bud",
    pos: "idiom",
    trans: "diệt từ trong trứng nước, ngăn chặn từ sớm",
    exampleEn: "Management should nip potential team conflicts in the bud.",
    exampleVi: "Ban quản lý nên dập tắt các mâu thuẫn nội bộ tiềm ẩn ngay từ trong trứng nước."
  },

  // 9. CHỦ ĐỀ GIA ĐÌNH & KINH DOANH GIA ĐÌNH (Writing)
  {
    word: "cornerstone",
    pos: "n",
    trans: "nền tảng, hòn đá tảng, cốt lõi",
    exampleEn: "Family businesses are a cornerstone of many national economies.",
    exampleVi: "Doanh nghiệp gia đình là nền tảng của nhiều nền kinh tế quốc gia."
  },
  {
    word: "conglomerate",
    pos: "n",
    trans: "tập đoàn kinh tế lớn đa ngành",
    exampleEn: "They expanded from local shops to multinational conglomerates.",
    exampleVi: "Họ đã phát triển từ các cửa hàng nhỏ thành các tập đoàn đa quốc gia."
  },
  {
    word: "unwavering loyalty",
    pos: "n phr",
    trans: "lòng trung thành kiên định, không lay chuyển",
    exampleEn: "Family members show unwavering loyalty to the company.",
    exampleVi: "Các thành viên trong gia đình thể hiện lòng trung thành sắt son với công ty."
  },
  {
    word: "personal stake",
    pos: "n phr",
    trans: "lợi ích cá nhân gắn liền",
    exampleEn: "Owners have a personal stake in the company's long-term success.",
    exampleVi: "Chủ sở hữu có lợi ích cá nhân gắn liền mật thiết với thành công của công ty."
  },
  {
    word: "employee turnover",
    pos: "n phr",
    trans: "tỷ lệ nhân viên nghỉ việc",
    exampleEn: "Family businesses often maintain low employee turnover rates.",
    exampleVi: "Các doanh nghiệp gia đình thường duy trì tỷ lệ nhảy việc thấp."
  },
  {
    word: "bureaucratic layers",
    pos: "n phr",
    trans: "các tầng lớp hành chính rườm rà",
    exampleEn: "Smaller family firms have fewer bureaucratic layers.",
    exampleVi: "Các công ty gia đình tinh gọn thường có ít tầng nấc hành chính rườm rà."
  },
  {
    word: "agility",
    pos: "n",
    trans: "sự nhanh nhạy, linh hoạt ứng biến",
    exampleEn: "Strategic agility is crucial in fast-changing modern markets.",
    exampleVi: "Sự nhanh nhẹn chiến lược là yếu tố sống còn trong các thị trường thay đổi nhanh."
  },
  {
    word: "resonate with",
    pos: "v phr",
    trans: "gây tiếng vang với, chạm đến cảm xúc của",
    exampleEn: "Authentic corporate values resonate deeply with loyal customers.",
    exampleVi: "Các giá trị doanh nghiệp chân chính chạm đến trái tim của khách hàng trung thành."
  },
  {
    word: "spill over",
    pos: "v phr",
    trans: "tràn sang, ảnh hưởng tiêu cực sang",
    exampleEn: "Personal domestic conflicts must not spill over into the workplace.",
    exampleVi: "Xung đột cá nhân trong gia đình không được phép lan sang môi trường làm việc."
  },
  {
    word: "cloud judgment",
    pos: "v phr",
    trans: "làm mờ phán đoán, thiếu tỉnh táo",
    exampleEn: "Excessive emotions can cloud professional business judgment.",
    exampleVi: "Cảm xúc cá nhân thái quá có thể làm lu mờ phán đoán kinh doanh chuyên nghiệp."
  },
  {
    word: "nepotism",
    pos: "n",
    trans: "chủ nghĩa gia đình trị, nâng đỡ người nhà",
    exampleEn: "Nepotism can lead to hiring unqualified leadership staff.",
    exampleVi: "Chủ nghĩa con ông cháu cha có thể dẫn đến việc tuyển dụng nhân sự thiếu năng lực."
  },
  {
    word: "stifle creativity",
    pos: "v phr",
    trans: "kìm hãm / bóp nghẹt sự sáng tạo",
    exampleEn: "Rigid traditional hierarchy can stifle workplace creativity.",
    exampleVi: "Hệ thống cấp bậc quá cứng nhắc có thể kìm hãm khả năng sáng tạo của nhân viên."
  },
  {
    word: "take over the reins",
    pos: "v phr",
    trans: "tiếp quản quyền lực, nắm quyền lãnh đạo",
    exampleEn: "The younger generation is ready to take over the reins.",
    exampleVi: "Thế hệ trẻ đã sẵn sàng nắm quyền lãnh đạo và chèo lái doanh nghiệp."
  },
  {
    word: "strike a balance",
    pos: "v phr",
    trans: "tạo sự cân bằng, dung hòa",
    exampleEn: "Firms must strike a balance between tradition and innovation.",
    exampleVi: "Doanh nghiệp phải tạo ra sự cân bằng hài hòa giữa truyền thống và đổi mới."
  },
  {
    word: "succession",
    pos: "n",
    trans: "sự kế vị, chuyển giao quyền kế nhiệm",
    exampleEn: "Succession planning is crucial for long-term organizational stability.",
    exampleVi: "Kế hoạch chuyển giao thế hệ kế nhiệm là rất quan trọng cho sự ổn định lâu dài."
  },
  {
    word: "vision",
    pos: "n",
    trans: "tầm nhìn chiến lược",
    exampleEn: "The founder had a clear long-term vision for corporate expansion.",
    exampleVi: "Người sáng lập đã có một tầm nhìn dài hạn rõ ràng cho sự phát triển của công ty."
  },
  {
    word: "legacy",
    pos: "n",
    trans: "di sản, tài sản kế thừa",
    exampleEn: "The enterprise represents the family's proud intergenerational legacy.",
    exampleVi: "Doanh nghiệp đại diện cho di sản đáng tự hào qua nhiều thế hệ của gia đình."
  },

  // B. PHRASAL VERBS & IDIOMS
  {
    word: "get into sth",
    pos: "phr v",
    trans: "bắt đầu thích, bắt đầu hứng thú với cái gì",
    exampleEn: "I'm starting to get into contemporary art and design.",
    exampleVi: "Tôi đang bắt đầu thấy hứng thú với nghệ thuật và thiết kế đương đại."
  },
  {
    word: "put off",
    pos: "phr v",
    trans: "làm nản lòng, làm mất hứng, trì hoãn",
    exampleEn: "I was really put off by the overwhelming amount of work.",
    exampleVi: "Tôi thực sự bị nản lòng bởi khối lượng công việc quá lớn."
  },
  {
    word: "amend",
    pos: "v",
    trans: "sửa đổi, điều chỉnh, bổ sung",
    exampleEn: "I need to amend some crucial parts of my research proposal.",
    exampleVi: "Tôi cần chỉnh sửa một số phần quan trọng trong đề cương nghiên cứu của mình."
  },
  {
    word: "work out",
    pos: "phr v",
    trans: "tính toán, vạch ra, tìm ra giải pháp",
    exampleEn: "I worked out what I wanted my research outcome to be.",
    exampleVi: "Tôi đã vạch ra rõ ràng kết quả mà mình mong muốn đạt được."
  },
  {
    word: "turn out",
    pos: "phr v",
    trans: "hóa ra là, diễn ra thành",
    exampleEn: "Everything turned out fine and successful in the end.",
    exampleVi: "Mọi chuyện cuối cùng đã diễn ra suôn sẻ và tốt đẹp."
  },
  {
    word: "grind up",
    pos: "phr v",
    trans: "xay nhuyễn, nghiền nhỏ",
    exampleEn: "I should have ground up the roasted nuts more thoroughly.",
    exampleVi: "Đáng lẽ tôi nên xay nhuyễn các loại hạt đã rang kỹ càng hơn."
  },
  {
    word: "do something on purpose",
    pos: "idiom",
    trans: "cố ý làm việc gì đó",
    exampleEn: "Some manufacturers do it on purpose to mislead consumers.",
    exampleVi: "Một số nhà sản xuất cố ý làm vậy để gây nhầm lẫn cho người tiêu dùng."
  },
  {
    word: "put up with",
    pos: "phr v",
    trans: "chịu đựng, nhẫn nhịn",
    exampleEn: "We had to put up with challenging working conditions initially.",
    exampleVi: "Ban đầu chúng tôi đã phải chịu đựng những điều kiện làm việc đầy thử thách."
  },
  {
    word: "pick yourself up",
    pos: "idiom",
    trans: "vực dậy sau thất bại / khó khăn",
    exampleEn: "She picked herself up resiliently and found another career path.",
    exampleVi: "Cô ấy đã kiên cường đứng dậy sau thất bại và tìm ra một hướng đi sự nghiệp mới."
  },
  {
    word: "fall apart",
    pos: "phr v",
    trans: "hỏng hóc, tan vỡ, sụp đổ",
    exampleEn: "Poorly made garments fell apart after only a few washes.",
    exampleVi: "Quần áo may kém chất lượng đã bị rách hỏng chỉ sau vài lần giặt."
  },
  {
    word: "take into consideration",
    pos: "idiom",
    trans: "tính đến, cân nhắc, xem xét kỹ",
    exampleEn: "Many scientific studies did not take family size into consideration.",
    exampleVi: "Nhiều nghiên cứu khoa học đã không cân nhắc đến quy mô gia đình."
  },
  {
    word: "look forward to",
    pos: "phr v",
    trans: "mong đợi, háo hức chờ đón",
    exampleEn: "I was looking forward to the educational field trip.",
    exampleVi: "Tôi đã rất hào hứng mong chờ chuyến đi dã ngoại học tập thực tế."
  },
  {
    word: "co-exist",
    pos: "v",
    trans: "cùng chung sống hòa bình, song hành",
    exampleEn: "Humans and wildlife co-existed amicably in protected areas.",
    exampleVi: "Con người và động vật hoang dã cùng chung sống hòa thuận trong khu bảo tồn."
  },

  // C. CẤU TRÚC NGỮ PHÁP NÂNG CAO (B1+)
  {
    word: "If + S + V (hiện tại), S + will + V",
    pos: "Grammar - Câu điều kiện loại 1",
    trans: "Điều kiện có thể xảy ra ở hiện tại hoặc tương lai",
    exampleEn: "If you put low-calorie items at the beginning, people will choose them.",
    exampleVi: "Nếu bạn đặt các món ít calo ở đầu thực đơn, thực khách sẽ lựa chọn chúng."
  },
  {
    word: "If + S + V (quá khứ đơn), S + would + V",
    pos: "Grammar - Câu điều kiện loại 2",
    trans: "Điều kiện không có thật / giả định trái ngược với hiện tại",
    exampleEn: "If I had more leisure time, I would travel around the world.",
    exampleVi: "Nếu tôi có nhiều thời gian rảnh hơn, tôi sẽ đi du lịch vòng quanh thế giới."
  },
  {
    word: "If + S + had + V3/ed, S + would have + V3/ed",
    pos: "Grammar - Câu điều kiện loại 3",
    trans: "Điều kiện không có thật trong quá khứ / tiếc nuối về quá khứ",
    exampleEn: "If the British had given up Run earlier, the Dutch would have had a monopoly sooner.",
    exampleVi: "Nếu người Anh từ bỏ đảo Run sớm hơn, người Hà Lan đã độc quyền nhanh hơn."
  },
  {
    word: "It is / was + [Thành phần nhấn mạnh] + that / who + ...",
    pos: "Grammar - Cleft Sentence (Câu chẻ)",
    trans: "Chính là ... người / vật / nơi mà làm điều gì đó",
    exampleEn: "It is the oldest children who benefit the most from teaching younger siblings.",
    exampleVi: "Chính những đứa con cả mới là đối tượng hưởng lợi nhiều nhất khi dạy em."
  },
  {
    word: "What + S + V + is / was + ...",
    pos: "Grammar - Wh- Cleft Sentence (Câu chẻ nhấn mạnh)",
    trans: "Điều mà ... chính là ...",
    exampleEn: "What makes the device truly innovative is its sustainable use of solar energy.",
    exampleVi: "Điều làm cho thiết bị thực sự đột phá chính là việc sử dụng năng lượng mặt trời."
  },
  {
    word: "Not only + Trợ động từ + S + V, but + S + also + V",
    pos: "Grammar - Đảo ngữ Not only",
    trans: "Không những ... mà còn ...",
    exampleEn: "Not only do they benefit intellectually, but they also gain substantial confidence.",
    exampleVi: "Không những họ hưởng lợi về mặt trí tuệ, mà họ còn có thêm sự tự tin đáng kể."
  },
  {
    word: "Only when + S + V + Trợ động từ + S + V",
    pos: "Grammar - Đảo ngữ Only when",
    trans: "Chỉ khi ... thì ... mới ...",
    exampleEn: "Only when we change our attitudes will modern businesses adapt to sustainability.",
    exampleVi: "Chỉ khi chúng ta thay đổi thái độ thì các doanh nghiệp mới thích nghi với sự bền vững."
  },
  {
    word: "So + Adj + Be + S + that + Clause",
    pos: "Grammar - Đảo ngữ với So",
    trans: "Quá ... đến nỗi mà ...",
    exampleEn: "So valuable was nutmeg that people were willing to risk their lives across the oceans.",
    exampleVi: "Nhục đậu khấu quý giá đến mức người ta sẵn sàng mạo hiểm tính mạng vượt đại dương."
  },
  {
    word: "Seldom / Rarely + Trợ động từ + S + V",
    pos: "Grammar - Đảo ngữ phủ định",
    trans: "Hiếm khi mà ai đó làm gì",
    exampleEn: "Rarely do we consider the indispensable ecological role of microscopic bacteria.",
    exampleVi: "Hiếm khi chúng ta suy ngẫm về vai trò sinh thái không thể thiếu của vi khuẩn."
  },
  {
    word: "..., which + V (Non-defining Relative Clause)",
    pos: "Grammar - Mệnh đề quan hệ bổ trợ",
    trans: "... điều này / thứ mà ... (bổ nghĩa cho cả vế trước)",
    exampleEn: "The Desolenator runs entirely on solar power, which makes it remarkably sustainable.",
    exampleVi: "Desolenator hoạt động hoàn toàn bằng năng lượng mặt trời, điều này khiến nó vô cùng bền vững."
  },
  {
    word: "who / that + V (Relative Clause)",
    pos: "Grammar - Mệnh đề quan hệ chỉ người",
    trans: "Người mà thực hiện hành động ...",
    exampleEn: "The legendary architect who conceived and designed the Step Pyramid was Imhotep.",
    exampleVi: "Kiến trúc sư huyền thoại, người đã nghĩ ra và thiết kế Kim tự tháp bậc thang là Imhotep."
  },
  {
    word: "whose + N (Possessive Relative Clause)",
    pos: "Grammar - Mệnh đề sở hữu quan hệ",
    trans: "Có ... của họ / nó là ...",
    exampleEn: "The innovative tech startup, whose CEO is based in Dubai, raised over £340,000.",
    exampleVi: "Công ty khởi nghiệp công nghệ, có CEO làm việc tại Dubai, đã huy động hơn 340.000 bảng."
  },
  {
    word: "where + S + V (Relative Clause)",
    pos: "Grammar - Mệnh đề quan hệ chỉ nơi chốn",
    trans: "Nơi mà sự việc diễn ra ...",
    exampleEn: "The remote Banda Islands, where nutmeg grew natively, were seized by colonial powers.",
    exampleVi: "Quần đảo Banda xa xôi, nơi nhục đậu khấu mọc tự nhiên, đã bị các cường quốc chiếm đoạt."
  },
  {
    word: "The + Comparative, the + Comparative",
    pos: "Grammar - Cấu trúc so sánh kép",
    trans: "Càng ... thì càng ...",
    exampleEn: "The more scientific literature we read, the more fascinated we became.",
    exampleVi: "Càng đọc nhiều tài liệu khoa học, chúng tôi lại càng cảm thấy say mê."
  },
  {
    word: "as + Adj / Adv + as",
    pos: "Grammar - Cấu trúc so sánh bằng",
    trans: "Bằng, như là ...",
    exampleEn: "The laboratory testing results were exactly as predicted by the research team.",
    exampleVi: "Các kết quả thử nghiệm trong phòng lab hoàn toàn khớp như dự đoán của nhóm."
  },
  {
    word: "not as + Adj + as",
    pos: "Grammar - Cấu trúc so sánh không bằng",
    trans: "Không ... bằng ...",
    exampleEn: "The educational visit to the park was not as informative as the national museum.",
    exampleVi: "Chuyến tham quan công viên không mang lại nhiều thông tin bổ ích bằng bảo tàng."
  },
  {
    word: "far / much + Comparative Adj",
    pos: "Grammar - Nhấn mạnh mức độ so sánh hơn",
    trans: "Hơn rất nhiều",
    exampleEn: "The new water purification system is far more efficient than traditional models.",
    exampleVi: "Hệ thống lọc nước mới hiệu quả hơn rất nhiều so với các mô hình truyền thống."
  },
  {
    word: "significantly + Comparative",
    pos: "Grammar - So sánh hơn một cách đáng kể",
    trans: "Vượt trội / hơn một cách đáng kể",
    exampleEn: "Dominant laughter was perceived as significantly higher in social status.",
    exampleVi: "Tiếng cười lấn át được nhìn nhận là có địa vị xã hội cao hơn một cách đáng kể."
  },
  {
    word: "in order to + V / so as to + V",
    pos: "Grammar - Cấu trúc chỉ mục đích",
    trans: "Để làm gì đó",
    exampleEn: "They concentrated spice production in order to safeguard their commercial investment.",
    exampleVi: "Họ tập trung sản xuất gia vị nhằm mục đích bảo vệ khoản đầu tư thương mại của mình."
  },
  {
    word: "so that + S + Modal Verb + V",
    pos: "Grammar - Mệnh đề chỉ mục đích",
    trans: "Để mà / nhằm mục đích cho ai đó có thể làm gì",
    exampleEn: "Engineers added an advanced filtration unit so that the output water would be pure.",
    exampleVi: "Các kỹ sư đã bổ sung bộ lọc tiên tiến để nước đầu ra đạt độ tinh khiết tối đa."
  },
  {
    word: "with the aim of + V-ing",
    pos: "Grammar - Cụm từ chỉ mục đích",
    trans: "Với mục tiêu, mục đích làm gì",
    exampleEn: "The psychological study was conducted with the aim of analyzing workplace humour.",
    exampleVi: "Nghiên cứu tâm lý được tiến hành với mục đích phân tích sự hài hước nơi công sở."
  },
  {
    word: "in a bid to + V",
    pos: "Grammar - Cụm chỉ nỗ lực / mục đích",
    trans: "Trong nỗ lực nhằm làm gì",
    exampleEn: "He authored the publication in a bid to revolutionize how society views microbes.",
    exampleVi: "Ông đã viết ấn phẩm này trong nỗ lực thay đổi cách xã hội nhìn nhận vi sinh vật."
  },
  {
    word: "Although / Though / Even though + S + V, S + V",
    pos: "Grammar - Mệnh đề nhượng bộ",
    trans: "Mặc dù ... nhưng ...",
    exampleEn: "Although humour is enjoyable, it can also become a potential workplace distraction.",
    exampleVi: "Mặc dù sự hài hước mang lại niềm vui, nó cũng có thể trở thành yếu tố gây phân tâm."
  },
  {
    word: "Despite / In spite of + N / V-ing, S + V",
    pos: "Grammar - Cụm nhượng bộ",
    trans: "Bất chấp, mặc dù ...",
    exampleEn: "Despite the exorbitant pricing, aristocratic buyers eagerly sought exotic spices.",
    exampleVi: "Bất chấp mức giá đắt đỏ, giới quý tộc vẫn ráo riết săn lùng các loại gia vị ngoại lai."
  },
  {
    word: "Adj + as + S + V, S + V",
    pos: "Grammar - Đảo ngữ tính từ nhượng bộ",
    trans: "Dẫu cho có ... đến đâu chăng nữa",
    exampleEn: "Expensive as it was, rare nutmeg remained in exceptionally high demand worldwide.",
    exampleVi: "Dẫu đắt đỏ đến thế nào, nhục đậu khấu quý hiếm vẫn có nhu cầu tiêu thụ cực lớn."
  },
  {
    word: "It is essential / crucial + that + S + (should) + V_infinitive",
    pos: "Grammar - Thể giả định (Subjunctive)",
    trans: "Điều tối quan trọng là ai đó phải làm gì",
    exampleEn: "It is essential that multinational enterprises act responsibly towards nature.",
    exampleVi: "Điều tối quan trọng là các tập đoàn đa quốc gia phải hành động có trách nhiệm với tự nhiên."
  },
  {
    word: "S + recommend / suggest + that + S + (should) + V_infinitive",
    pos: "Grammar - Thể giả định với động từ gợi ý",
    trans: "Ai đó đề nghị / gợi ý rằng việc gì nên được làm",
    exampleEn: "The career advisor suggested that every student acquire practical retail experience.",
    exampleVi: "Cố vấn nghề nghiệp đề xuất rằng mọi sinh viên nên tích lũy kinh nghiệm bán lẻ thực tế."
  },
  {
    word: "S + wish + S + V (quá khứ / Past Perfect)",
    pos: "Grammar - Cấu trúc điều ước",
    trans: "Ước gì / giá như ...",
    exampleEn: "I genuinely wish we had visited the cutting-edge architectural projects in person.",
    exampleVi: "Tôi thực sự ước gì chúng tôi đã có cơ hội tận mắt chiêm ngưỡng các công trình đó."
  },
  {
    word: "so + Adj / Adv + that + Clause",
    pos: "Grammar - Cấu trúc chỉ kết quả",
    trans: "Quá ... đến mức mà xảy ra kết quả gì",
    exampleEn: "Nutmeg was so lucrative that seafaring nations fought brutal wars over its islands.",
    exampleVi: "Nhục đậu khấu béo bở đến mức các quốc gia hàng hải đã gây chiến đẫm máu vì các đảo này."
  },
  {
    word: "such + (a/an) + Adj + N + that + Clause",
    pos: "Grammar - Cấu trúc chỉ kết quả với danh từ",
    trans: "Quả là một ... đến nỗi mà ...",
    exampleEn: "It was such a valuable commodity that whole merchant fleets were dispatched for it.",
    exampleVi: "Đó là một mặt hàng giá trị đến nỗi cả hạm đội thương thuyền được phái đi vì nó."
  },
  {
    word: "too + Adj + to + V",
    pos: "Grammar - Quá ... đến nỗi không thể làm gì",
    trans: "Quá ... để có thể làm gì",
    exampleEn: "The initial investment costs were too prohibitive for developing nations to adopt.",
    exampleVi: "Chi phí đầu tư ban đầu quá đắt đỏ khiến các nước đang phát triển không thể áp dụng."
  },
  {
    word: "Adj + enough + to + V",
    pos: "Grammar - Đủ ... để có thể làm gì",
    trans: "Đủ điều kiện để làm việc gì",
    exampleEn: "The portable device is efficient enough to purify over 15 litres of water daily.",
    exampleVi: "Thiết bị di động đủ hiệu quả để lọc hơn 15 lít nước mỗi ngày."
  },
  {
    word: "S + be + V3/ed (by + O)",
    pos: "Grammar - Thể bị động (Passive Voice)",
    trans: "Cái gì được / bị tác động bởi ai",
    exampleEn: "All maritime trade routes were strictly controlled by the Dutch East India Company.",
    exampleVi: "Mọi tuyến hàng hải đều bị kiểm soát nghiêm ngặt bởi Công ty Đông Ấn Hà Lan."
  },
  {
    word: "S + is / was + thought / believed + to + V",
    pos: "Grammar - Bị động với động từ nhận thức",
    trans: "Ai đó được cho là / được tin là ...",
    exampleEn: "Pharaoh Djoser is thought to have reigned successfully for nearly two decades.",
    exampleVi: "Pharaoh Djoser được cho là đã cai trị thành công trong gần hai thập kỷ."
  },
  {
    word: "It is widely believed that + Clause",
    pos: "Grammar - Bị động khách quan",
    trans: "Mọi người đều tin rằng / Người ta tin rằng ...",
    exampleEn: "It is widely believed that positive workplace humour alleviates psychological tension.",
    exampleVi: "Người ta tin rằng sự hài hước tích cực tại nơi làm việc giúp xoa dịu căng thẳng tâm lý."
  },
  {
    word: "S + said / reported + that + S + V (Lùi thì)",
    pos: "Grammar - Câu tường thuật (Reported Speech)",
    trans: "Ai đó đã nói / thông báo rằng ...",
    exampleEn: "The chief executive stated that sustainable development was the ultimate goal.",
    exampleVi: "Vị giám đốc điều hành đã tuyên bố rằng phát triển bền vững là mục tiêu tối hậu."
  },
  {
    word: "either ... or ...",
    pos: "Grammar - Cấu trúc tương quan lựa chọn",
    trans: "Hoặc là ... hoặc là ...",
    exampleEn: "Consumers can either purchase the unit outright or choose a monthly lease.",
    exampleVi: "Người tiêu dùng có thể chọn mua đứt thiết bị hoặc chọn thuê theo từng tháng."
  },
  {
    word: "neither ... nor ...",
    pos: "Grammar - Cấu trúc phủ định song song",
    trans: "Cả ... lẫn ... đều không",
    exampleEn: "Neither the Portuguese nor the Spanish succeeded in monopolizing the remote island.",
    exampleVi: "Cả người Bồ Đào Nha lẫn người Tây Ban Nha đều không thành công trong việc độc quyền hòn đảo."
  },

  // D. CÁC CỤM TỪ HỌC THUẬT HỮU ÍCH (Academic Collocations)
  {
    word: "It is worth noting that...",
    pos: "Academic phrase",
    trans: "Đáng chú ý là... (dùng mở đầu một luận điểm quan trọng)",
    exampleEn: "It is worth noting that environmental policies must be accompanied by strict enforcement.",
    exampleVi: "Đáng chú ý là các chính sách môi trường phải đi kèm với việc thực thi nghiêm ngặt."
  },
  {
    word: "This can be attributed to...",
    pos: "Academic phrase",
    trans: "Điều này có thể quy cho / bắt nguồn từ nguyên nhân...",
    exampleEn: "This rapid economic growth can be largely attributed to technological innovation.",
    exampleVi: "Sự tăng trưởng kinh tế nhanh chóng này có thể quy phần lớn cho đổi mới công nghệ."
  },
  {
    word: "There is a growing body of evidence that...",
    pos: "Academic phrase",
    trans: "Ngày càng nhiều bằng chứng cho thấy rằng...",
    exampleEn: "There is a growing body of evidence that regular physical exercise improves cognitive function.",
    exampleVi: "Ngày càng nhiều bằng chứng khoa học cho thấy tập thể dục đều đặn giúp tăng cường trí tuệ."
  },
  {
    word: "It goes without saying that...",
    pos: "Academic phrase",
    trans: "Không cần phải bàn cãi rằng / Hiển nhiên là...",
    exampleEn: "It goes without saying that clean drinking water is a fundamental human necessity.",
    exampleVi: "Không cần phải bàn cãi rằng nước uống sạch là nhu cầu cơ bản thiết yếu của con người."
  },
  {
    word: "From a broader perspective...",
    pos: "Academic phrase",
    trans: "Từ một góc nhìn rộng lớn hơn...",
    exampleEn: "From a broader perspective, investing in green technology safeguards future prosperity.",
    exampleVi: "Từ góc nhìn rộng hơn, việc đầu tư vào công nghệ xanh sẽ bảo vệ sự thịnh vượng tương lai."
  },
  {
    word: "This raises the question of...",
    pos: "Academic phrase",
    trans: "Điều này đặt ra câu hỏi về...",
    exampleEn: "This raises the critical question of how ethical leadership influences company culture.",
    exampleVi: "Điều này đặt ra câu hỏi quan trọng về việc lãnh đạo đạo đức ảnh hưởng thế nào đến văn hóa công ty."
  },
  {
    word: "It is widely acknowledged that...",
    pos: "Academic phrase",
    trans: "Ai cũng công nhận rằng / Được thừa nhận rộng rãi rằng...",
    exampleEn: "It is widely acknowledged that continuous learning is crucial in today's workforce.",
    exampleVi: "Mọi người đều công nhận rằng học tập không ngừng là điều cốt yếu trong lực lượng lao động."
  },
  {
    word: "There is no doubt that...",
    pos: "Academic phrase",
    trans: "Không còn nghi ngờ gì nữa rằng...",
    exampleEn: "There is no doubt that artificial intelligence will transform numerous industries.",
    exampleVi: "Không còn nghi ngờ gì nữa rằng trí tuệ nhân tạo sẽ biến đổi vô số ngành công nghiệp."
  },
  {
    word: "The evidence suggests that...",
    pos: "Academic phrase",
    trans: "Các bằng chứng / nghiên cứu chỉ ra rằng...",
    exampleEn: "The empirical evidence suggests that balanced lifestyles foster sustained creativity.",
    exampleVi: "Bằng chứng thực nghiệm cho thấy lối sống cân bằng nuôi dưỡng sự sáng tạo bền vững."
  },
  {
    word: "What is more significant is...",
    pos: "Academic phrase",
    trans: "Điều quan trọng hơn cả là...",
    exampleEn: "What is more significant is the long-term societal value created by the organization.",
    exampleVi: "Điều quan trọng hơn cả là giá trị xã hội lâu dài mà tổ chức đó tạo ra."
  },

  // E. TỪ VỰNG NỐI (LINKING WORDS) B1+
  {
    word: "Furthermore / Moreover / In addition",
    pos: "Linking words (Addition - Thêm ý)",
    trans: "Hơn nữa, ngoài ra, thêm vào đó",
    exampleEn: "Furthermore, family-owned enterprises offer unparalleled commitment and loyalty.",
    exampleVi: "Hơn nữa, các doanh nghiệp thuộc sở hữu gia đình mang lại sự cam kết và lòng trung thành vượt bậc."
  },
  {
    word: "However / Nevertheless / On the other hand",
    pos: "Linking words (Contrast - Tương phản)",
    trans: "Tuy nhiên, dẫu vậy, mặt khác",
    exampleEn: "However, unresolved internal conflicts can represent a significant operational drawback.",
    exampleVi: "Tuy nhiên, những mâu thuẫn nội bộ chưa được giải quyết có thể là nhược điểm lớn trong vận hành."
  },
  {
    word: "Because / Due to / Owing to",
    pos: "Linking words (Reason - Nguyên nhân)",
    trans: "Bởi vì, do, bắt nguồn từ",
    exampleEn: "Due to its extraordinary rarity, nutmeg was regarded as an utmost luxury symbol.",
    exampleVi: "Do độ quý hiếm phi thường của nó, nhục đậu khấu từng được coi là biểu tượng xa xỉ tột cùng."
  },
  {
    word: "Therefore / Consequently / As a result / Hence",
    pos: "Linking words (Result - Kết quả)",
    trans: "Vì vậy, do đó, kết quả là",
    exampleEn: "Consequently, the merchant monopoly yielded massive financial profits for centuries.",
    exampleVi: "Kết quả là, việc độc quyền buôn bán đã mang lại lợi nhuận tài chính khổng lồ suốt nhiều thế kỷ."
  },
  {
    word: "For example / For instance / Such as",
    pos: "Linking words (Example - Ví dụ)",
    trans: "Ví dụ như, chẳng hạn như",
    exampleEn: "For instance, the fascinating case study demonstrates how microbiome diversity thrives.",
    exampleVi: "Chẳng hạn, nghiên cứu tình huống hấp dẫn này chứng minh sự đa dạng vi sinh phát triển ra sao."
  },
  {
    word: "In conclusion / To sum up / Overall",
    pos: "Linking words (Conclusion - Kết luận)",
    trans: "Tóm lại, kết luận lại, nhìn chung",
    exampleEn: "In conclusion, maintaining a balanced mindset is both enjoyable and deeply energising.",
    exampleVi: "Tóm lại, việc duy trì một tư duy cân bằng vừa mang lại niềm vui vừa tiếp thêm năng lượng dồi dào."
  },
  {
    word: "Subsequently / Previously / Meanwhile / Eventually",
    pos: "Linking words (Time - Trình tự thời gian)",
    trans: "Sau đó, trước đó, trong khi đó, cuối cùng thì",
    exampleEn: "Eventually, the international diplomatic treaty restored territorial sovereignty.",
    exampleVi: "Cuối cùng, hiệp ước ngoại giao quốc tế đã khôi phục chủ quyền lãnh thổ."
  },
  {
    word: "Provided that / As long as / Unless",
    pos: "Linking words (Condition - Điều kiện)",
    trans: "Miễn là, với điều kiện là, trừ khi",
    exampleEn: "Unless societies actively embrace green habits, environmental degradation will intensify.",
    exampleVi: "Trừ khi các xã hội chủ động sống xanh, sự suy thoái môi trường sẽ ngày càng trầm trọng hơn."
  }
];

console.log('Total items to add:', rawItems.length);

// Generate formatted card items
const newCards = rawItems.map((item, index) => {
  const cardId = `tk_${baseTimestamp + index}_${Math.random().toString(36).substring(2, 7)}`;
  const title = item.pos ? `${item.word} (${item.pos})` : item.word;
  const translation = item.trans;

  // Formatted Speaking & Writing examples in notes
  const notes = [
    `🗣️ Speaking 1: "${item.exampleEn}"`,
    `   👉 Dịch: ${item.exampleVi}`,
    `🗣️ Speaking 2: "Understanding '${item.word}' is especially useful in IELTS discussions."`,
    `   👉 Dịch: Hiểu rõ '${item.word}' đặc biệt hữu ích trong các bài thảo luận IELTS.`,
    `✍️ Writing 1: "${item.exampleEn}"`,
    `   👉 Dịch: ${item.exampleVi}`,
    `✍️ Writing 2: "Academic research frequently highlights the significance of '${item.word}'."`,
    `   👉 Dịch: Nghiên cứu học thuật thường xuyên nhấn mạnh tầm quan trọng của '${item.word}'.`
  ].join('\n');

  return {
    id: cardId,
    word: title,
    translation: translation,
    notes: notes,
    linkType: 'direct',
    tiktokUrl: getNextUrl(item.word),
    level: 1,
    interval: 1,
    nextReviewDate: todayStr,
    createdAt: new Date().toISOString()
  };
});

// Prepend new cards to memorize_vault
if (!vault.items) vault.items = [];
// Unshift new cards so user sees them right away at the top
vault.items.unshift(...newCards);

fs.writeFileSync(vaultPath, JSON.stringify(vault, null, 2), 'utf8');
console.log('SUCCESS! Added', newCards.length, 'cards to memorize_vault.json');
console.log('New total count in vault:', vault.items.length);
