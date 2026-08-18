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
function getNextUrl() {
  const url = tiktokUrls[urlIndex % tiktokUrls.length];
  urlIndex++;
  return url;
}

const todayStr = new Date().toISOString().split('T')[0];
let baseTimestamp = Date.now();

const allItems = [];

function addCard(word, pos, trans, exampleEn, exampleVi, category = '') {
  allItems.push({
    word: pos ? `${word} (${pos})` : word,
    trans: trans,
    exampleEn: exampleEn || `Studying '${word}' improves English proficiency.`,
    exampleVi: exampleVi || `Học '${word}' giúp nâng cao trình độ tiếng Anh.`,
    category: category
  });
}

// 1. CHỦ ĐỀ GIÁO DỤC (Education)
addCard("assignment", "n", "bài tập lớn, nhiệm vụ học tập", "I have to submit my assignment by Friday.", "Tôi phải nộp bài tập lớn trước thứ Sáu.");
addCard("curriculum", "n", "chương trình học, khung giáo trình", "The school curriculum includes science and maths.", "Chương trình giảng dạy của trường bao gồm khoa học và toán học.");
addCard("deadline", "n", "hạn chót, thời hạn hoàn thành", "We must meet the deadline for our project.", "Chúng ta phải kịp hạn chót cho dự án của mình.");
addCard("degree", "n", "bằng cấp đại học", "She has a degree in economics.", "Cô ấy có bằng cử nhân ngành kinh tế học.");
addCard("elementary", "adj", "sơ cấp, tiểu học", "He teaches at an elementary school.", "Anh ấy giảng dạy tại một trường tiểu học.");
addCard("graduate", "v/n", "tốt nghiệp / cử nhân", "He will graduate from university next year.", "Anh ấy sẽ tốt nghiệp đại học vào năm tới.");
addCard("homework", "n", "bài tập về nhà", "The teacher assigned a lot of homework for the weekend.", "Giáo viên đã giao rất nhiều bài tập về nhà cho dịp cuối tuần.");
addCard("lecture", "n", "bài giảng học thuật", "The professor gave an interesting lecture on economics.", "Giáo sư đã thuyết giảng một bài rất thú vị về kinh tế.");
addCard("qualification", "n", "trình độ chuyên môn, bằng cấp", "This job requires a relevant professional qualification.", "Công việc này đòi hỏi phải có trình độ chuyên môn phù hợp.");
addCard("revise", "v", "ôn tập, ôn luyện kiến thức", "I need to revise thoroughly for the upcoming exam.", "Tôi cần ôn tập kỹ lưỡng cho kỳ thi sắp tới.");
addCard("scholarship", "n", "học bổng", "She won a prestigious scholarship to study abroad.", "Cô ấy đã giành được một suất học bổng danh giá để đi du học.");
addCard("tuition", "n", "học phí", "Tuition fees have increased noticeably this year.", "Học phí đã gia tăng đáng kể trong năm nay.");

// 2. CHỦ ĐỀ CÔNG VIỆC (Work)
addCard("ambition", "n", "tham vọng, hoài bão", "His ambition is to become a senior project manager.", "Hoài bão của anh ấy là trở thành quản lý dự án cấp cao.");
addCard("colleague", "n", "đồng nghiệp", "I get along very well with all my colleagues.", "Tôi hòa thuận rất tốt với tất cả các đồng nghiệp của mình.");
addCard("employer", "n", "người sử dụng lao động, nhà tuyển dụng", "My employer offers excellent healthcare benefits.", "Nhà tuyển dụng của tôi cung cấp các chế độ phúc lợi y tế tuyệt vời.");
addCard("salary", "n", "tiền lương định kỳ", "The starting salary is quite competitive in this industry.", "Mức lương khởi điểm khá cạnh tranh trong ngành này.");
addCard("resign", "v", "từ chức, xin thôi việc", "She decided to resign from her managerial position.", "Cô ấy đã quyết định từ chức khỏi vị trí quản lý.");
addCard("promotion", "n", "sự thăng chức, đề bạt", "He received a well-deserved promotion after working hard.", "Anh ấy đã được thăng chức xứng đáng sau những nỗ lực làm việc chăm chỉ.");
addCard("occupation", "n", "nghề nghiệp, công việc chính", "Please state your occupation and educational background.", "Vui lòng nêu rõ nghề nghiệp và trình độ học vấn của bạn.");
addCard("overtime", "n/adv", "làm thêm giờ, tăng ca", "Employees often work overtime during busy quarters.", "Nhân viên thường phải làm thêm giờ trong các quý bận rộn.");
addCard("pension", "n", "lương hưu, tiền trợ cấp hưu trí", "He will receive a decent pension when he retires.", "Ông ấy sẽ nhận được một khoản lương hưu tốt khi về hưu.");
addCard("staff", "n", "đội ngũ nhân viên", "The hotel staff are extremely friendly and helpful.", "Đội ngũ nhân viên khách sạn cực kỳ thân thiện và nhiệt tình.");
addCard("trainee", "n", "thực tập sinh, người đang học việc", "She is a promising trainee at the international firm.", "Cô ấy là một thực tập sinh đầy triển vọng tại công ty quốc tế.");

// 3. CHỦ ĐỀ SỨC KHỎE (Health)
addCard("allergy", "n", "dị ứng", "I have a severe allergy to peanuts.", "Tôi bị dị ứng nghiêm trọng với đậu phộng.");
addCard("appetite", "n", "sự thèm ăn, cảm giác ngon miệng", "Physical exercise helps improve your appetite.", "Tập thể dục giúp cải thiện cảm giác ngon miệng.");
addCard("cure", "n/v", "phương thuốc, cách chữa trị / chữa khỏi", "Scientists are striving to find a cure for the disease.", "Các nhà khoa học đang nỗ lực tìm kiếm phương thuốc chữa căn bệnh này.");
addCard("disease", "n", "bệnh tật", "Heart disease is a major global health concern.", "Bệnh tim mạch là một mối lo ngại lớn về sức khỏe trên toàn cầu.");
addCard("dose", "n", "liều lượng thuốc", "Take one prescribed dose of the medicine daily.", "Hãy uống một liều thuốc đã được chỉ định mỗi ngày.");
addCard("immune", "adj", "miễn dịch, đề kháng", "A healthy lifestyle keeps your body immune to infections.", "Lối sống lành mạnh giúp cơ thể bạn miễn dịch với các bệnh nhiễm trùng.");
addCard("nutrition", "n", "dinh dưỡng", "Balanced nutrition is essential for cognitive development.", "Dinh dưỡng cân bằng là rất cần thiết cho sự phát triển trí não.");
addCard("obesity", "n", "bệnh béo phì", "Childhood obesity has become a growing epidemic.", "Béo phì ở trẻ em đã trở thành một đại dịch ngày càng gia tăng.");
addCard("prescription", "n", "đơn thuốc, toa thuốc", "You need a doctor's prescription for this antibiotic.", "Bạn cần có đơn thuốc của bác sĩ cho loại kháng sinh này.");
addCard("recover", "v", "hồi phục, bình phục", "It takes several weeks to fully recover from surgery.", "Mất vài tuần để bình phục hoàn toàn sau ca phẫu thuật.");
addCard("symptom", "n", "triệu chứng bệnh", "A high fever is a common symptom of seasonal flu.", "Sốt cao là triệu chứng điển hình của bệnh cúm mùa.");
addCard("treat", "v", "điều trị, chữa trị", "Specialists treated the infection with targeted therapy.", "Các chuyên gia đã điều trị ổ nhiễm trùng bằng liệu pháp đặc hiệu.");

// 4. CHỦ ĐỀ DU LỊCH (Travel)
addCard("accommodation", "n", "chỗ ở, nơi lưu trú", "We need to book accommodation well in advance.", "Chúng tôi cần đặt trước chỗ lưu trú từ sớm.");
addCard("departure", "n", "sự khởi hành, giờ xuất phát", "The scheduled flight departure time is 9 a.m.", "Thời gian khởi hành chuyến bay dự kiến là 9 giờ sáng.");
addCard("destination", "n", "điểm đến, đích đến", "Paris remains a favorite holiday destination.", "Paris vẫn là điểm đến kỳ nghỉ được yêu thích hàng đầu.");
addCard("itinerary", "n", "lịch trình chuyến đi", "The travel agency sent us a comprehensive itinerary.", "Công ty lữ hành đã gửi cho chúng tôi một lịch trình chi tiết.");
addCard("luggage", "n", "hành lý", "Please check your luggage securely at the counter.", "Vui lòng ký gửi hành lý cẩn thận tại quầy thủ tục.");
addCard("passport", "n", "hộ chiếu", "Make sure your passport is valid for international travel.", "Hãy đảm bảo rằng hộ chiếu của bạn còn hạn cho các chuyến đi quốc tế.");
addCard("souvenir", "n", "quà lưu niệm", "I bought a traditional handmade souvenir for my family.", "Tôi đã mua một món quà lưu niệm thủ công truyền thống cho gia đình.");
addCard("tourist", "n", "khách du lịch", "The historical district is always crowded with tourists.", "Khu phố cổ lịch sử luôn tấp nập khách du lịch.");
addCard("sightseeing", "n", "hoạt động tham quan, ngắm cảnh", "We spent the whole afternoon sightseeing around the capital.", "Chúng tôi đã dành cả buổi chiều để đi ngắm cảnh quanh thủ đô.");
addCard("booking", "n", "sự đặt chỗ, giữ phòng", "I received a confirmation email for my hotel booking.", "Tôi đã nhận được email xác nhận cho việc đặt phòng khách sạn.");

// 5. CHỦ ĐỀ CÔNG NGHỆ (Technology)
addCard("access", "v/n", "truy cập, tiếp cận", "You need authorized credentials to access the secure network.", "Bạn cần có thông tin ủy quyền để truy cập vào mạng an toàn.");
addCard("advanced", "adj", "trình độ cao, tiên tiến", "This device integrates advanced artificial intelligence algorithms.", "Thiết bị này tích hợp các thuật toán trí tuệ nhân tạo tiên tiến.");
addCard("blogger", "n", "người viết blog", "She is an influential lifestyle and fashion blogger.", "Cô ấy là một blogger có tầm ảnh hưởng về phong cách sống và thời trang.");
addCard("download", "v", "tải xuống dữ liệu", "Users can download the application directly from the app store.", "Người dùng có thể tải ứng dụng trực tiếp từ kho ứng dụng.");
addCard("hardware", "n", "phần cứng máy tính", "Upgrading hardware components enhances processing speed.", "Nâng cấp các linh kiện phần cứng giúp tăng tốc độ xử lý.");
addCard("online", "adj/adv", "trực tuyến", "More consumers prefer doing their daily grocery shopping online.", "Nhiều người tiêu dùng thích mua sắm hàng tạp hóa trực tuyến hơn.");
addCard("server", "n", "máy chủ hệ thống", "The central cloud server handles millions of queries daily.", "Máy chủ đám mây trung tâm xử lý hàng triệu truy vấn mỗi ngày.");
addCard("social media", "n", "mạng xã hội", "Social media platforms have transformed modern marketing.", "Các nền tảng mạng xã hội đã chuyển đổi cách thức tiếp thị hiện đại.");
addCard("software", "n", "phần mềm máy tính", "The design software allows seamless collaboration among teams.", "Phần mềm thiết kế cho phép sự cộng tác mượt mà giữa các nhóm.");
addCard("update", "v/n", "cập nhật phiên bản mới", "You should regularly update your security software.", "Bạn nên cập nhật thường xuyên phần mềm bảo mật của mình.");

// 6. CHỦ ĐỀ MÔI TRƯỜNG (Environment)
addCard("climate", "n", "khí hậu", "Global climate patterns are shifting at an alarming rate.", "Các hình thái khí hậu toàn cầu đang biến đổi ở mức báo động.");
addCard("conservation", "n", "sự bảo tồn thiên nhiên", "Wildlife conservation requires sustained international cooperation.", "Bảo tồn động vật hoang dã đòi hỏi sự hợp tác quốc tế lâu dài.");
addCard("endangered", "adj", "có nguy cơ tuyệt chủng", "The giant panda was once on the list of critically endangered species.", "Gấu trúc khổng lồ từng nằm trong danh sách các loài cực kỳ nguy cấp.");
addCard("pollution", "n", "sự ô nhiễm môi trường", "Air and marine pollution threaten countless living species.", "Ô nhiễm không khí và biển đe dọa vô số loài sinh vật.");
addCard("recycle", "v", "tái chế vật liệu", "Citizens are strongly encouraged to recycle plastic and paper.", "Người dân được khuyến khích mạnh mẽ tái chế đồ nhựa và giấy.");
addCard("renewable", "adj", "có thể tái tạo (năng lượng)", "Solar and wind power are viable forms of renewable energy.", "Năng lượng mặt trời và gió là những nguồn năng lượng tái tạo khả thi.");
addCard("shortage", "n", "sự thiếu hụt, khan hiếm", "Many arid regions suffer from an acute shortage of potable water.", "Nhiều vùng khô hạn chịu cảnh thiếu hụt nghiêm trọng nước uống sạch.");
addCard("waste", "n/v", "chất thải / lãng phí", "Do not waste valuable resources on non-essential consumption.", "Đừng lãng phí những nguồn tài nguyên quý giá vào việc tiêu dùng không thiết yếu.");
addCard("emission", "n", "khí thải gây ô nhiễm", "Strict regulations aim to cut industrial carbon emissions.", "Các quy định nghiêm ngặt nhằm mục đích cắt giảm lượng khí thải carbon công nghiệp.");
addCard("global warming", "n", "sự nóng lên toàn cầu", "Global warming contributes to melting ice caps and rising sea levels.", "Sự nóng lên toàn cầu làm băng tan ở hai cực và dâng cao mực nước biển.");

// 7. CHỦ ĐỀ GIA ĐÌNH VÀ QUAN HỆ (Family & Relationships)
addCard("ancestor", "n", "tổ tiên, cội nguồn", "Our ancestors established traditions that are celebrated today.", "Tổ tiên của chúng ta đã tạo dựng những truyền thống vẫn được tôn vinh ngày nay.");
addCard("cousin", "n", "anh / chị / em họ", "I frequently visit my cousins during summer holidays.", "Tôi thường xuyên đến thăm các anh chị em họ trong kỳ nghỉ hè.");
addCard("divorce", "n/v", "ly hôn, cuộc ly dị", "Counseling can sometimes help couples avoid an acrimonious divorce.", "Tư vấn tâm lý đôi khi có thể giúp các cặp đôi tránh một vụ ly hôn cay đắng.");
addCard("household", "n", "hộ gia đình, gia quyến", "The average household spends a substantial proportion of income on housing.", "Hộ gia đình trung bình chi trả một tỷ lệ thu nhập đáng kể cho nhà ở.");
addCard("nephew", "n", "cháu trai (gọi bạn bằng cô/dì/chú/bác)", "My nephew just celebrated his fifth birthday with family.", "Cháu trai của tôi vừa tổ chức sinh nhật lần thứ 5 cùng gia đình.");
addCard("niece", "n", "cháu gái (gọi bạn bằng cô/dì/chú/bác)", "She bought an educational puzzle gift for her young niece.", "Cô ấy đã mua một bộ xếp hình giáo dục làm quà cho cháu gái nhỏ.");
addCard("relative", "n", "bà con, người thân thích", "We gathered with all distant relatives for the traditional reunion.", "Chúng tôi đã tụ họp cùng tất cả người thân họ hàng cho dịp sum họp truyền thống.");
addCard("spouse", "n", "vợ hoặc chồng", "Partners should maintain open communication with their spouse.", "Mỗi người nên duy trì sự giao tiếp cởi mở với người bạn đời của mình.");
addCard("generation", "n", "thế hệ", "A generation gap often exists regarding technological adoption.", "Khoảng cách thế hệ thường tồn tại đối với việc tiếp nhận công nghệ mới.");

// 8. CHỦ ĐỀ THỜI TIẾT (Weather)
addCard("breeze", "n", "ngọn gió mát nhẹ", "A gentle sea breeze cooled the afternoon heat.", "Làn gió biển nhẹ nhàng làm dịu đi cái nóng buổi ban chiều.");
addCard("drought", "n", "nạn hạn hán", "The prolonged severe drought damaged agricultural harvests.", "Đợt hạn hán kéo dài nghiêm trọng đã làm thiệt hại mùa màng nông nghiệp.");
addCard("forecast", "n/v", "dự báo thời tiết", "The meteorological forecast predicts heavy thunderstorms tomorrow.", "Dự báo khí tượng cho biết sẽ có mưa dông lớn vào ngày mai.");
addCard("frost", "n", "sương giá, lớp băng mỏng", "Morning frost covered the green grass in early winter.", "Lớp sương giá buổi sớm phủ trắng các ngọn cỏ vào đầu đông.");
addCard("humid", "adj", "ẩm ướt, oi bức nồm", "Tropical coastal climates are characteristically warm and humid.", "Khí hậu ven biển nhiệt đới có đặc trưng là ấm và nồm ẩm.");
addCard("scorching", "adj", "rất nóng, thiêu đốt gay gắt", "The scorching midday sun forced people indoors.", "Cái nắng thiêu đốt giữa trưa buộc mọi người phải ở trong nhà.");
addCard("storm", "n", "cơn bão, dông tố", "A fierce tropical storm is heading directly toward the coast.", "Một cơn bão nhiệt đới dữ dội đang hướng thẳng vào đất liền.");
addCard("temperature", "n", "nhiệt độ", "The ambient temperature dropped rapidly after sunset.", "Nhiệt độ môi trường giảm nhanh chóng sau khi mặt trời lặn.");
addCard("windy", "adj", "có nhiều gió lộng", "The coastal cliff was too windy for drone photography.", "Vách đá ven biển quá lộng gió để có thể chụp ảnh bằng flycam.");

// 9. TỪ VỰNG KHÁC THÔNG DỤNG
addCard("actually", "adv", "thực ra, trên thực tế", "Actually, the project completed well ahead of the deadline.", "Trên thực tế, dự án đã hoàn thành sớm hơn rất nhiều so với hạn chót.");
addCard("address", "n/v", "địa chỉ / giải quyết (vấn đề)", "Governments must promptly address environmental concerns.", "Chính phủ phải nhanh chóng giải quyết các mối lo ngại về môi trường.");
addCard("art", "n", "nghệ thuật, hội họa", "Appreciating fine art enhances emotional well-being.", "Thưởng thức nghệ thuật giúp nâng cao đời sống tinh thần.");
addCard("computer", "n", "máy vi tính", "The modern computer is an indispensable productivity tool.", "Máy tính hiện đại là một công cụ tăng năng suất không thể thiếu.");
addCard("government", "n", "chính phủ, chính quyền", "The central government introduced progressive tax reforms.", "Chính phủ trung ương đã đưa ra những cải cách thuế tiến bộ.");
addCard("history", "n", "lịch sử học", "Studying past history offers invaluable lessons for the future.", "Nghiên cứu lịch sử mang lại những bài học vô giá cho tương lai.");
addCard("information", "n", "thông tin, dữ liệu", "Access to reliable information is a vital human right.", "Tiếp cận thông tin đáng tin cậy là một quyền cơ bản thiết yếu.");
addCard("skill", "n", "kỹ năng chuyên môn", "Critical thinking is a crucial skill for modern careers.", "Tư duy phản biện là một kỹ năng then chốt trong sự nghiệp hiện đại.");
addCard("system", "n", "hệ thống, cơ chế", "The automated transport system operates with high efficiency.", "Hệ thống giao thông tự động vận hành với hiệu suất cao.");
addCard("world", "n", "thế giới, toàn cầu", "Innovations are interconnecting societies across the world.", "Những đổi mới sáng tạo đang kết nối các xã hội trên toàn thế giới.");

// B. CỤM TỪ KẾT HỢP (COLLOCATIONS) TRÌNH ĐỘ B1
addCard("make a decision", "Collocation", "đưa ra quyết định", "Leadership requires the ability to make a decisive decision under pressure.", "Khả năng lãnh đạo đòi hỏi việc đưa ra quyết định dứt khoát dưới áp lực.");
addCard("take responsibility", "Collocation", "chịu trách nhiệm, gánh vác", "He willingly took full responsibility for the project's shortfall.", "Anh ấy đã tự nguyện nhận toàn bộ trách nhiệm về thiếu sót của dự án.");
addCard("do research", "Collocation", "tiến hành nghiên cứu", "Scholars must do extensive scientific research before publishing conclusions.", "Các học giả phải làm nghiên cứu sâu rộng trước khi công bố kết luận.");
addCard("pay attention", "Collocation", "chú ý, tập trung lắng nghe", "Students should pay close attention during the academic lecture.", "Sinh viên nên tập trung chú ý lắng nghe trong suốt bài giảng.");
addCard("have fun", "Collocation", "vui vẻ, tận hưởng niềm vui", "Children should be encouraged to have fun through creative play.", "Trẻ em nên được khuyến khích vui chơi thỏa thích thông qua các hoạt động sáng tạo.");
addCard("get a job", "Collocation", "tìm được việc làm, có việc", "Graduates with practical internships get a job much faster.", "Sinh viên tốt nghiệp có kinh nghiệm thực tập sẽ tìm được việc làm nhanh hơn nhiều.");
addCard("spend time", "Collocation", "dành thời gian cho ai/việc gì", "Families should spend quality time together to strengthen bonding.", "Các gia đình nên dành thời gian chất lượng bên nhau để thắt chặt tình cảm.");
addCard("save money", "Collocation", "tiết kiệm tiền bạc", "Setting a monthly budget helps young professionals save money systematically.", "Lập ngân sách hàng tháng giúp người trẻ tiết kiệm tiền một cách có hệ thống.");
addCard("catch a cold", "Collocation", "bị cảm lạnh", "Wearing warm layers prevents you from catching a cold in winter.", "Mặc nhiều lớp áo ấm giúp bạn tránh bị cảm lạnh vào mùa đông.");
addCard("keep in touch", "Collocation", "giữ liên lạc thường xuyên", "Modern social media apps make it effortless to keep in touch with friends.", "Ứng dụng mạng xã hội hiện đại giúp việc giữ liên lạc với bạn bè trở nên dễ dàng.");
addCard("break the record", "Collocation", "phá vỡ kỷ lục", "The dedicated athlete trained relentlessly to break the world record.", "Vận động viên tận tụy đã tập luyện không ngừng nghỉ để phá kỷ lục thế giới.");
addCard("raise children", "Collocation", "nuôi dạy con cái", "Parents face complex modern challenges when trying to raise children well.", "Cha mẹ đối mặt nhiều thử thách hiện đại phức tạp khi nuôi dạy con cái nên người.");

// C. CẤU TRÚC NGỮ PHÁP B1 TRỌNG TÂM CHO IELTS
// 1. TENSES
addCard("Hiện tại đơn (Present Simple): S + V(s/es)", "Grammar - Tense", "Diễn tả thói quen, chân lý, sự thật hiển nhiên (Dấu hiệu: always, usually, every day)", "Water boils at 100 degrees Celsius under normal pressure.", "Nước sôi ở 100 độ C trong điều kiện áp suất tiêu chuẩn.");
addCard("Hiện tại tiếp diễn (Present Continuous): S + am/is/are + V-ing", "Grammar - Tense", "Diễn tả hành động đang xảy ra tại thời điểm nói (Dấu hiệu: now, at the moment, currently)", "The global economy is currently undergoing rapid technological transformation.", "Nền kinh tế toàn cầu hiện đang trải qua sự chuyển đổi công nghệ nhanh chóng.");
addCard("Quá khứ đơn (Past Simple): S + V2/ed", "Grammar - Tense", "Diễn tả hành động đã xảy ra và chấm dứt trong quá khứ (Dấu hiệu: yesterday, last year, in 2010)", "The industrial sector expanded significantly during the previous decade.", "Khu vực công nghiệp đã mở rộng đáng kể trong thập kỷ trước.");
addCard("Quá khứ tiếp diễn (Past Continuous): S + was/were + V-ing", "Grammar - Tense", "Diễn tả hành động đang diễn ra tại một thời điểm xác định trong quá khứ", "While researchers were conducting the trial, unexpected variables emerged.", "Trong khi các nhà nghiên cứu đang thực hiện thử nghiệm, các biến số bất ngờ đã xuất hiện.");
addCard("Hiện tại hoàn thành (Present Perfect): S + have/has + V3/ed", "Grammar - Tense", "Diễn tả trải nghiệm, kết quả kéo dài từ quá khứ đến hiện tại (Dấu hiệu: ever, never, recently, since, for)", "Renewable energy adoption has grown remarkably over the past five years.", "Việc áp dụng năng lượng tái tạo đã phát triển vượt bậc trong 5 năm qua.");
addCard("Tương lai đơn (Future Simple): S + will + V", "Grammar - Tense", "Dự đoán, quyết định tức thời về tương lai (Dấu hiệu: tomorrow, next year, in the future)", "Advanced automation will redefine workplace productivity in upcoming decades.", "Tự động hóa tiên tiến sẽ định nghĩa lại năng suất làm việc trong những thập kỷ tới.");

// 2. CONDITIONALS
addCard("Conditional Type 0: If + S + V(s/es), S + V(s/es)", "Grammar - Câu điều kiện Loại 0", "Diễn tả chân lý khoa học, quy luật tự nhiên bất biến", "If you heat ice, it naturally melts into liquid water.", "Nếu bạn đun nóng đá tuyết, nó sẽ tự nhiên tan chảy thành nước lỏng.");
addCard("Conditional Type 1: If + S + V(s/es), S + will + V", "Grammar - Câu điều kiện Loại 1", "Diễn tả điều kiện có thật, có thể xảy ra ở hiện tại hoặc tương lai", "If governments enforce environmental regulations, pollution will decline.", "Nếu các chính phủ thực thi nghiêm ngặt luật môi trường, mức ô nhiễm sẽ giảm.");
addCard("Conditional Type 2: If + S + V2/ed, S + would + V", "Grammar - Câu điều kiện Loại 2", "Diễn tả điều kiện giả định không có thật ở hiện tại", "If public transit were completely free, more commuters would leave cars at home.", "Nếu phương tiện công cộng hoàn toàn miễn phí, nhiều người đi làm sẽ để xe ở nhà.");

// 3. PASSIVE VOICE
addCard("Passive Present Simple: S + am/is/are + V3/ed", "Grammar - Thể bị động", "Bị động ở thì hiện tại đơn", "Valuable research data is collected and analyzed by automated systems.", "Dữ liệu nghiên cứu giá trị được thu thập và phân tích bởi hệ thống tự động.");
addCard("Passive Past Simple: S + was/were + V3/ed", "Grammar - Thể bị động", "Bị động ở thì quá khứ đơn", "The new industrial facility was constructed in less than twelve months.", "Cơ sở công nghiệp mới đã được xây dựng trong chưa đầy mười hai tháng.");
addCard("Passive Future Simple: S + will be + V3/ed", "Grammar - Thể bị động", "Bị động ở thì tương lai đơn", "The nationwide infrastructure project will be finalized by next autumn.", "Dự án cơ sở hạ tầng toàn quốc sẽ được hoàn thiện trước mùa thu tới.");
addCard("Passive Present Perfect: S + have/has been + V3/ed", "Grammar - Thể bị động", "Bị động ở thì hiện tại hoàn thành", "Strict emission guidelines have been implemented across all production plants.", "Các hướng dẫn khí thải nghiêm ngặt đã được áp dụng ở tất cả các nhà máy sản xuất.");

// 4. RELATIVE CLAUSES
addCard("who (Chủ ngữ chỉ người)", "Grammar - Mệnh đề quan hệ", "Đại từ quan hệ thay thế cho danh từ chỉ người làm chủ ngữ", "Students who actively participate in discussions achieve deeper comprehension.", "Những sinh viên chủ động tham gia thảo luận sẽ đạt được hiểu biết sâu sắc hơn.");
addCard("whom (Tân ngữ chỉ người)", "Grammar - Mệnh đề quan hệ", "Đại từ quan hệ thay thế cho danh từ chỉ người làm tân ngữ", "The keynote speaker whom the university invited is an internationally acclaimed scientist.", "Diễn giả chính mà trường đại học mời là một nhà khoa học nổi tiếng quốc tế.");
addCard("which (Chỉ vật / Sự việc)", "Grammar - Mệnh đề quan hệ", "Đại từ quan hệ thay thế cho đồ vật, hiện tượng hoặc cả mệnh đề trước", "The experimental technique, which was developed in 2020, proved highly reliable.", "Kỹ thuật thực nghiệm, vốn được phát triển năm 2020, đã chứng minh độ tin cậy cao.");
addCard("that (Chỉ người hoặc vật trong mệnh đề xác định)", "Grammar - Mệnh đề quan hệ", "Đại từ thay thế cho người/vật trong mệnh đề quan hệ xác định", "We adopted modern methodologies that significantly reduced overhead expenses.", "Chúng tôi đã áp dụng các phương pháp hiện đại giúp giảm đáng kể chi phí vận hành.");
addCard("whose (Chỉ quan hệ sở hữu)", "Grammar - Mệnh đề quan hệ", "Đại từ chỉ sở hữu cho người hoặc vật", "The enterprise whose innovation captured market share expanded internationally.", "Doanh nghiệp có phát minh chiếm lĩnh thị phần đã vươn mình ra quốc tế.");
addCard("where (Chỉ nơi chốn)", "Grammar - Mệnh đề quan hệ", "Trạng từ quan hệ chỉ địa điểm nơi hành động diễn ra", "This is the research facility where clinical trials are rigorously monitored.", "Đây là cơ sở nghiên cứu nơi các thử nghiệm lâm sàng được giám sát chặt chẽ.");

// 5. MODAL VERBS
addCard("can (Khả năng / Năng lực)", "Grammar - Động từ khuyết thiếu", "Diễn tả khả năng làm việc gì ở hiện tại", "Renewable energy can substantially alleviate reliance on fossil fuels.", "Năng lượng tái tạo có thể làm giảm đáng kể sự phụ thuộc vào nhiên liệu hóa thạch.");
addCard("could (Khả năng quá khứ / Lời đề nghị lịch sự)", "Grammar - Động từ khuyết thiếu", "Diễn tả khả năng trong quá khứ hoặc lời đề nghị trang trọng", "Could you provide additional empirical evidence regarding this hypothesis?", "Bạn có thể cung cấp thêm bằng chứng thực nghiệm về giả thuyết này không?");
addCard("should (Lời khuyên / Trách nhiệm)", "Grammar - Động từ khuyết thiếu", "Đưa ra lời khuyên hoặc nghĩa vụ đạo đức", "Governments should invest heavily in primary educational facilities.", "Các chính phủ nên đầu tư mạnh mẽ vào các cơ sở giáo dục tiểu học.");
addCard("must (Bắt buộc / Suy luận chắc chắn)", "Grammar - Động từ khuyết thiếu", "Thể hiện quy định bắt buộc tuyệt đối hoặc suy luận logic chắc chắn", "Motorists must wear safety seatbelts at all times according to traffic law.", "Người điều khiển phương tiện bắt buộc phải thắt dây an toàn theo luật giao thông.");
addCard("have to (Bắt buộc mang tính khách quan)", "Grammar - Động từ khuyết thiếu", "Thể hiện sự cần thiết bắt buộc do hoàn cảnh bên ngoài", "Employees have to comply strictly with workplace health and safety standards.", "Nhân viên phải tuân thủ nghiêm ngặt các tiêu chuẩn an toàn lao động.");
addCard("may / might (Khả năng có thể xảy ra)", "Grammar - Động từ khuyết thiếu", "Diễn tả khả năng phỏng đoán ở mức độ vừa phải", "Unchecked urbanization may exacerbate municipal air pollution levels.", "Đô thị hóa không kiểm soát có thể làm trầm trọng thêm mức độ ô nhiễm đô thị.");

// 6. COMPARATIVES & SUPERLATIVES
addCard("So sánh hơn: S1 + V + adj-er / more adj + than + S2", "Grammar - So sánh hơn", "So sánh mức độ vượt trội giữa hai đối tượng", "Online education is frequently more flexible than traditional classroom learning.", "Giáo dục trực tuyến thường linh hoạt hơn so với học tập truyền thống trên lớp.");
addCard("So sánh nhất: S + V + the + adj-est / most adj", "Grammar - So sánh nhất", "So sánh đối tượng nổi bật nhất trong một tập thể", "Solar power represents the most rapidly expanding renewable energy source.", "Năng lượng mặt trời đại diện cho nguồn năng lượng tái tạo phát triển nhanh nhất.");
addCard("So sánh bằng: S1 + V + as + adj + as + S2", "Grammar - So sánh bằng", "So sánh tương đương giữa hai đối tượng", "Practical vocational skills are just as valuable as academic credentials.", "Kỹ năng nghề nghiệp thực tế cũng có giá trị không kém gì bằng cấp học thuật.");

// 7. REPORTED SPEECH
addCard("Reported Speech: Hiện tại đơn → Quá khứ đơn", "Grammar - Câu gián tiếp", "Lùi thì từ Present Simple sang Past Simple khi tường thuật", "\"I prefer remote work\" → He stated that he preferred remote work.", "\"Tôi thích làm việc từ xa\" → Anh ấy tuyên bố rằng anh ấy thích làm việc từ xa.");
addCard("Reported Speech: Hiện tại tiếp diễn → Quá khứ tiếp diễn", "Grammar - Câu gián tiếp", "Lùi thì từ Present Continuous sang Past Continuous", "\"The company is expanding\" → The CEO announced that the company was expanding.", "\"Công ty đang mở rộng\" → Vị CEO thông báo rằng công ty đang mở rộng.");
addCard("Reported Speech: will → would", "Grammar - Câu gián tiếp", "Chuyển will thành would trong lời tường thuật gián tiếp", "\"We will complete the audit\" → They confirmed that they would complete the audit.", "\"Chúng tôi sẽ hoàn thành kiểm toán\" → Họ xác nhận rằng họ sẽ hoàn thành kiểm toán.");

// 8. ENOUGH / TOO
addCard("too + adj + to + V", "Grammar - Cấu trúc Too", "Quá ... đến nỗi không thể làm gì được", "The administrative fees were too exorbitant for early-stage startups to afford.", "Các khoản phí hành chính quá đắt đỏ khiến các công ty khởi nghiệp không thể chi trả.");
addCard("adj + enough + to + V", "Grammar - Cấu trúc Enough", "Đủ ... để có thể thực hiện một hành động", "The applicant was experienced enough to manage the entire regional team.", "Ứng viên có đủ kinh nghiệm để quản lý toàn bộ đội ngũ khu vực.");

// 9. ARTICLES
addCard("a / an (Mạo từ không xác định)", "Grammar - Mạo từ", "Dùng cho danh từ đếm được số ít khi nhắc đến lần đầu tiên / chung chung", "An innovative solution was proposed during the strategy summit.", "Một giải pháp đổi mới đã được đề xuất trong hội nghị thượng đỉnh chiến lược.");
addCard("the (Mạo từ xác định)", "Grammar - Mạo từ", "Dùng khi đối tượng đã được biết rõ, xác định cụ thể hoặc là duy nhất", "The government announced strict environmental measures to preserve natural reserves.", "Chính phủ đã công bố các biện pháp môi trường nghiêm ngặt để bảo tồn các khu bảo tồn.");

// 10. PREPOSITIONS
addCard("at (Giới từ thời gian / địa điểm cụ thể)", "Grammar - Giới từ", "Dùng cho giờ giấc chính xác, thời điểm cụ thể hoặc địa điểm xác định", "The plenary session commences at 9:00 a.m. at the university convention hall.", "Phiên họp toàn thể bắt đầu lúc 9 giờ sáng tại hội trường hội nghị của trường đại học.");
addCard("on (Giới từ ngày / bề mặt)", "Grammar - Giới từ", "Dùng cho các thứ trong tuần, ngày cụ thể trong tháng, hoặc tiếp xúc bề mặt", "The comprehensive final assessment will take place on Monday morning.", "Bài đánh giá cuối kỳ toàn diện sẽ diễn ra vào sáng thứ Hai.");
addCard("in (Giới từ tháng, năm, mùa / không gian)", "Grammar - Giới từ", "Dùng cho tháng, năm, thập kỷ, mùa, hoặc bên trong một không gian", "The landmark environmental treaty was ratified in 2015 in Paris.", "Hiệp ước môi trường mang tính bước ngoặt đã được phê chuẩn vào năm 2015 tại Paris.");
addCard("for (Giới từ chỉ khoảng thời gian)", "Grammar - Giới từ", "Dùng để diễn tả một hành động kéo dài suốt một khoảng thời gian", "The economic researchers tracked market fluctuations continuously for five years.", "Các nhà nghiên cứu kinh tế đã theo dõi biến động thị trường liên tục trong 5 năm.");
addCard("since (Giới từ mốc thời gian)", "Grammar - Giới từ", "Dùng với mốc thời gian bắt đầu một hành động kéo dài tới hiện tại", "Global temperatures have risen steadily since the dawn of the Industrial Revolution.", "Nhiệt độ toàn cầu đã tăng đều đặn kể từ buổi bình minh của Cách mạng Công nghiệp.");

// PHẦN 1: IELTS WRITING TASK 1 – CÁCH PHÂN TÍCH BIỂU ĐỒ
// A. CÁCH MỞ BÀI (INTRODUCTION)
addCard("The graph / chart / figure illustrates...", "Task 1 - Mở bài", "Biểu đồ / hình vẽ minh họa cho...", "The line graph illustrates the changes in average global temperature over a century.", "Biểu đồ đường minh họa sự thay đổi nhiệt độ trung bình toàn cầu qua một thế kỷ.");
addCard("The given diagram / pie chart presents data on...", "Task 1 - Mở bài", "Sơ đồ / biểu đồ tròn được đưa ra thể hiện số liệu về...", "The given pie chart presents data on household expenditure in four countries.", "Biểu đồ tròn đã cho cung cấp dữ liệu về chi tiêu hộ gia đình ở 4 quốc gia.");
addCard("The table provides information about...", "Task 1 - Mở bài", "Bảng biểu cung cấp thông tin chi tiết về...", "The table provides information about population growth across six continents.", "Bảng biểu cung cấp thông tin về sự gia tăng dân số trên khắp 6 châu lục.");
addCard("According to the chart, ...", "Task 1 - Mở bài / Dẫn chứng", "Theo như số liệu biểu đồ cho thấy...", "According to the chart, consumer spending increased significantly after 2010.", "Theo biểu đồ, mức chi tiêu tiêu dùng đã gia tăng đáng kể sau năm 2010.");
addCard("It can be seen from the graph that...", "Task 1 - Mở bài / Dẫn chứng", "Có thể quan sát thấy từ biểu đồ rằng...", "It can be seen from the graph that the rate of unemployment fluctuated wildly.", "Từ biểu đồ có thể thấy tỷ lệ thất nghiệp đã dao động rất mạnh.");
addCard("The bar chart compares the figures for...", "Task 1 - Mở bài", "Biểu đồ cột so sánh các số liệu về...", "The bar chart compares the figures for inbound tourism across five European nations.", "Biểu đồ cột so sánh số liệu du lịch quốc tế đến 5 quốc gia châu Âu.");
addCard("The two maps illustrate the development of...", "Task 1 - Mở bài", "Hai bản đồ minh họa sự phát triển / chuyển đổi của...", "The two maps illustrate the development of the city center over a 50-year period.", "Hai bản đồ minh họa sự phát triển của trung tâm thành phố qua giai đoạn 50 năm.");
addCard("The diagram outlines the process of...", "Task 1 - Mở bài", "Sơ đồ phác thảo quy trình sản xuất / chế tạo...", "The diagram outlines the sequential process of manufacturing recycled paper.", "Sơ đồ phác thảo quy trình tuần tự của việc sản xuất giấy tái chế.");
addCard("A glance at the chart reveals that...", "Task 1 - Mở bài / Dẫn dắt", "Một cái nhìn lướt qua biểu đồ cho thấy rằng...", "A glance at the chart reveals that the number of internet users rose steadily.", "Nhìn lướt qua biểu đồ thấy rõ số lượng người dùng internet đã tăng đều đặn.");
addCard("The data presented in the graph indicates that...", "Task 1 - Mở bài", "Dữ liệu được trình bày trong đồ thị chỉ ra rằng...", "The data presented in the graph indicates a clear upward trend in renewable energy usage.", "Dữ liệu trình bày trong đồ thị chỉ ra xu hướng tăng rõ rệt trong việc dùng năng lượng tái tạo.");

// B. CÁCH VIẾT TỔNG QUAN (OVERVIEW)
addCard("Overall, it is clear that...", "Task 1 - Overview", "Nhìn chung, rõ ràng thấy rằng...", "Overall, it is clear that there was a dramatic increase in international exports.", "Nhìn chung, rõ ràng là đã có một sự gia tăng ngoạn mục trong xuất khẩu quốc tế.");
addCard("What stands out from the data is...", "Task 1 - Overview", "Điểm nổi bật nhất từ dữ liệu là...", "What stands out from the data is that figures for China overtook those of the US.", "Điều nổi bật nhất từ dữ liệu là số liệu của Trung Quốc đã vượt qua Hoa Kỳ.");
addCard("It is evident that...", "Task 1 - Overview", "Rõ ràng là, hiển nhiên là...", "It is evident that the percentage of elderly people rose substantially over time.", "Rõ ràng là tỷ lệ người cao tuổi đã tăng lên đáng kể theo thời gian.");
addCard("The most striking feature is...", "Task 1 - Overview", "Đặc điểm ấn tượng / nổi bật nhất là...", "The most striking feature is the rapid growth in mobile commerce adoption.", "Đặc điểm ấn tượng nhất là sự phát triển nhanh chóng của thương mại di động.");
addCard("In general, the figures show...", "Task 1 - Overview", "Nhìn chung, các con số cho thấy...", "In general, the figures show a remarkably consistent upward trajectory.", "Nhìn chung, các số liệu cho thấy một quỹ đạo tăng trưởng cực kỳ nhất quán.");
addCard("It is noticeable that...", "Task 1 - Overview", "Có thể nhận thấy rõ ràng là...", "It is noticeable that the highest proportion was recorded in the under-30 demographic.", "Đáng chú ý là tỷ lệ cao nhất được ghi nhận ở nhóm nhân khẩu học dưới 30 tuổi.");
addCard("As can be clearly seen, ...", "Task 1 - Overview", "Như có thể nhìn thấy rõ ràng,...", "As can be clearly seen, the number of vehicles increased dramatically over the span.", "Như có thể thấy rõ, số lượng phương tiện giao thông đã tăng đột biến trong giai đoạn này.");
addCard("The overarching trend is ...", "Task 1 - Overview", "Xu hướng bao trùm toàn bộ là...", "The overarching trend is a steady decline in traditional manufacturing jobs.", "Xu hướng bao trùm là sự sụt giảm đều đặn các công việc sản xuất truyền thống.");
addCard("A cursory glance reveals that...", "Task 1 - Overview", "Cái nhìn tổng quát cho thấy...", "A cursory glance reveals that the UK consistently maintained the highest figures.", "Một cái nhìn tổng quát cho thấy Vương quốc Anh liên tục duy trì những con số cao nhất.");
addCard("Evidently, the period witnessed...", "Task 1 - Overview", "Hiển nhiên là giai đoạn này đã chứng kiến...", "Evidently, the period witnessed significant fluctuations in oil commodity prices.", "Hiển nhiên là thời kỳ này đã chứng kiến sự biến động đáng kể của giá dầu thương phẩm.");
addCard("Looking at the bigger picture, ...", "Task 1 - Overview", "Nhìn vào bức tranh tổng thể lớn hơn,...", "Looking at the bigger picture, the data suggests a global transition towards clean energy.", "Nhìn vào bức tranh toàn cảnh, dữ liệu chỉ ra sự chuyển dịch toàn cầu sang năng lượng sạch.");
addCard("The most noteworthy aspect is...", "Task 1 - Overview", "Khía cạnh đáng chú ý nhất là...", "The most noteworthy aspect is the stark disparity between urban and rural regions.", "Khía cạnh đáng chú ý nhất là sự chênh lệch rõ rệt giữa khu vực thành thị và nông thôn.");
addCard("On a general level, ...", "Task 1 - Overview", "Ở mức độ khái quát chung,...", "On a general level, both nations experienced comparable economic recovery rates.", "Ở mức độ khái quát, cả hai quốc gia đều trải qua tốc độ phục hồi kinh tế tương đương.");
addCard("Perhaps the most significant point is...", "Task 1 - Overview", "Có lẽ điểm quan trọng nhất là...", "Perhaps the most significant point is that production volumes peaked in 2018.", "Có lẽ điểm quan trọng nhất là sản lượng sản xuất đã đạt đỉnh vào năm 2018.");
addCard("Taken as a whole, ...", "Task 1 - Overview", "Đánh giá một cách tổng thể,...", "Taken as a whole, the statistics point to a highly favorable market outlook.", "Đánh giá một cách tổng thể, các số liệu thống kê chỉ ra một triển vọng thị trường rất khả quan.");

// C. TỪ VỰNG DIỄN TẢ SỰ THAY ĐỔI (TRENDS)
// 1. TĂNG
addCard("soar", "v - Trend Tăng", "tăng vọt lên rất mạnh", "The price of crude oil soared significantly last year.", "Giá dầu thô đã tăng vọt rất mạnh vào năm ngoái.");
addCard("surge", "v/n - Trend Tăng", "tăng đột biến, dâng trào", "There was an unexpected surge in demand for medical equipment.", "Đã có sự tăng đột biến bất ngờ trong nhu cầu về thiết bị y tế.");
addCard("rocket", "v - Trend Tăng", "tăng nhanh như tên lửa", "The metropolitan population rocketed to 10 million residents.", "Dân số vùng đô thị đã tăng vọt lên tới 10 triệu cư dân.");
addCard("shoot up", "phr v - Trend Tăng", "tăng vụt lên nhanh chóng", "The subscription rate shot up to over 80% within six months.", "Tỷ lệ đăng ký dịch vụ đã tăng vụt lên hơn 80% chỉ trong 6 tháng.");
addCard("climb", "v - Trend Tăng", "leo lên, tăng trưởng từ từ bền bỉ", "Sales numbers climbed steadily throughout the fiscal year.", "Doanh số bán hàng đã tăng đều đặn trong suốt năm tài chính.");
addCard("rise", "v/n - Trend Tăng", "sự gia tăng, tăng lên", "There was a consistent rise in consumer expenditures.", "Đã có sự gia tăng đều đặn trong các khoản chi tiêu của người tiêu dùng.");
addCard("grow", "v - Trend Tăng", "tăng trưởng, phát triển", "The tech economy grew significantly across developing nations.", "Nền kinh tế công nghệ đã tăng trưởng mạnh mẽ ở các quốc gia đang phát triển.");
addCard("jump", "v/n - Trend Tăng", "nhảy vọt lên mức cao", "The inflation rate jumped from 5% to nearly 15%.", "Tỷ lệ lạm phát đã nhảy vọt từ 5% lên tới gần 15%.");
addCard("leap", "v/n - Trend Tăng", "bật tăng mạnh, bước nhảy vọt", "The market valuation leapt dramatically over the trading week.", "Định giá thị trường đã bật tăng ngoạn mục trong tuần giao dịch.");
addCard("double", "v - Trend Tăng", "tăng gấp đôi (200%)", "Total revenue doubled in less than five years of operation.", "Tổng doanh thu đã tăng gấp đôi chỉ trong chưa đầy 5 năm hoạt động.");
addCard("treble / triple", "v - Trend Tăng", "tăng gấp ba (300%)", "Corporate profits trebled over the past decade due to automation.", "Lợi nhuận doanh nghiệp đã tăng gấp 3 trong thập kỷ qua nhờ tự động hóa.");
addCard("escalate", "v - Trend Tăng", "leo thang (thường dùng cho chi phí, căng thẳng)", "Operational overhead costs escalated rapidly during the crisis.", "Chi phí vận hành đã leo thang nhanh chóng trong thời kỳ khủng hoảng.");
addCard("mount", "v - Trend Tăng", "tích lũy tăng dần lên", "Public pressure mounted on the municipal council to improve roads.", "Áp lực từ công chúng đã gia tăng dần lên hội đồng thành phố về việc cải thiện đường sá.");
addCard("multiply", "v - Trend Tăng", "tăng lên gấp bội", "The reported case numbers multiplied exponentially within weeks.", "Số ca được báo cáo đã tăng lên gấp bội theo cấp số nhân trong vài tuần.");
addCard("an upward trend", "n phr - Trend Tăng", "xu hướng gia tăng đi lên", "The demographic data displays a distinct upward trend.", "Dữ liệu nhân khẩu học thể hiện một xu hướng đi lên rõ rệt.");

// 2. GIẢM
addCard("plummet", "v - Trend Giảm", "giảm mạnh, rớt tự do", "Average temperatures plummeted to -10 degrees Celsius overnight.", "Nhiệt độ trung bình đã rớt tự do xuống -10 độ C chỉ sau một đêm.");
addCard("plunge", "v/n - Trend Giảm", "lao dốc mạnh mẽ", "The benchmark stock index plunged sharply following the announcement.", "Chỉ số chứng khoán chuẩn đã lao dốc mạnh sau thông báo.");
addCard("slump", "v/n - Trend Giảm", "sụt giảm đột ngột và nặng nề", "Automobile sales slumped drastically during the economic recession.", "Doanh số ô tô đã sụt giảm nghiêm trọng trong thời kỳ suy thoái kinh tế.");
addCard("drop", "v/n - Trend Giảm", "giảm xuống, mức giảm", "A slight drop in commodity prices was observed in early spring.", "Một sự giảm nhẹ trong giá hàng hóa đã được ghi nhận vào đầu mùa xuân.");
addCard("fall", "v/n - Trend Giảm", "sự sụt giảm, rơi xuống", "The crime rate fell dramatically following rigorous police patrolling.", "Tỷ lệ tội phạm đã giảm mạnh nhờ hoạt động tuần tra nghiêm ngặt của cảnh sát.");
addCard("decline", "v/n - Trend Giảm", "suy thoái, suy giảm từ từ", "There was a gradual decline in the percentage of tobacco smokers.", "Đã có sự suy giảm dần dần trong tỷ lệ người hút thuốc lá.");
addCard("dip", "v/n - Trend Giảm", "giảm nhẹ tạm thời rồi phục hồi", "Quarterly earnings dipped slightly in 2018 before rebounding strongly.", "Lợi nhuận hàng quý giảm nhẹ trong năm 2018 trước khi phục hồi mạnh mẽ.");
addCard("slide", "v - Trend Giảm", "trượt dốc dần dần", "The currency slid steadily to an all-time record low.", "Đồng tiền đã trượt dốc đều đặn xuống mức thấp kỷ lục mọi thời đại.");
addCard("collapse", "v - Trend Giảm", "sụp đổ thảm hại", "The speculative real estate market collapsed virtually overnight.", "Thị trường bất động sản đầu cơ đã sụp đổ gần như chỉ sau một đêm.");
addCard("dive", "v - Trend Giảm", "lao dốc, bổ nhào xuống", "The asset valuation dived by nearly 40% in consecutive quarters.", "Định giá tài sản đã lao dốc gần 40% trong các quý liên tiếp.");
addCard("contract", "v - Trend Giảm", "thu hẹp lại (quy mô kinh tế)", "The national economy contracted by 2.5% during the shutdown.", "Nền kinh tế quốc gia đã thu hẹp 2,5% trong thời gian phong tỏa.");
addCard("shrink", "v - Trend Giảm", "co lại, thu nhỏ kích thước", "The rural manufacturing workforce shrank considerably over the period.", "Lực lượng lao động sản xuất nông thôn đã thu hẹp đáng kể trong giai đoạn này.");
addCard("cut", "n/v - Trend Giảm", "sự cắt giảm", "A sharp cut in public expenditure was mandated by authorities.", "Một sự cắt giảm mạnh trong chi tiêu công đã được giới chức yêu cầu.");
addCard("a downward trend", "n phr - Trend Giảm", "xu hướng đi xuống, suy thoái", "The trade balance illustrates a continuous downward trend.", "Cán cân thương mại minh họa một xu hướng đi xuống liên tục.");
addCard("halve", "v - Trend Giảm", "giảm xuống một nửa (50%)", "The rate of unemployment halved within a ten-year timeframe.", "Tỷ lệ thất nghiệp đã giảm một nửa trong khoảng thời gian mười năm.");

// 3. ỔN ĐỊNH & DAO ĐỘNG
addCard("remain stable / constant", "v phr - Trend Ổn định", "giữ nguyên mức ổn định", "The interest rate remained stable throughout the four-year study.", "Lãi suất vẫn duy trì ổn định trong suốt 4 năm nghiên cứu.");
addCard("level off", "phr v - Trend Ổn định", "chững lại, ổn định sau biến động", "Population expansion levelled off noticeably after reaching 5 million.", "Sự gia tăng dân số đã chững lại rõ rệt sau khi đạt 5 triệu người.");
addCard("plateau", "v/n - Trend Ổn định", "ổn định ở mức cao, đạt ngưỡng bão hòa", "Subscription metrics plateaued at approximately 60% saturation.", "Các chỉ số đăng ký đã chững lại ở mức bão hòa khoảng 60%.");
addCard("stabilize", "v - Trend Ổn định", "trở nên ổn định, bình ổn", "Commodity prices finally stabilized after months of volatility.", "Giá cả hàng hóa cuối cùng đã bình ổn sau nhiều tháng biến động.");
addCard("stand at", "v phr - Trend Ổn định", "đứng ở mức, dừng ở mốc", "Urban unemployment stood at 5.2% in the final recorded year.", "Thất nghiệp đô thị đứng ở mức 5,2% trong năm ghi nhận cuối cùng.");
addCard("remain unchanged", "v phr - Trend Ổn định", "không đổi, giữ nguyên", "The statistical figures for expenditure remained completely unchanged.", "Các số liệu thống kê về chi tiêu vẫn hoàn toàn không thay đổi.");
addCard("fluctuate", "v - Trend Dao động", "dao động lên xuống thất thường", "Daily market prices fluctuated wildly between seasons.", "Giá cả thị trường hàng ngày đã dao động dữ dội giữa các mùa.");
addCard("oscillate", "v - Trend Dao động", "dao động qua lại giữa 2 biên độ", "The metric oscillated consistently between 20% and 30%.", "Chỉ số này liên tục dao động qua lại giữa mức 20% và 30%.");
addCard("reach a peak", "v phr - Trend Điểm mốc", "đạt đến đỉnh điểm cao nhất", "Renewable energy production reached a peak in mid-July.", "Sản lượng năng lượng tái tạo đã đạt đỉnh vào giữa tháng Bảy.");
addCard("hit a trough", "v phr - Trend Điểm mốc", "chạm đáy thấp nhất", "Commercial shipping volumes hit a trough during winter months.", "Khối lượng vận chuyển thương mại đã chạm đáy trong những tháng mùa đông.");

// 4. TRẠNG TỪ MỨC ĐỘ
addCard("dramatically", "adv - Mức độ thay đổi", "một cách mạnh mẽ, ngoạn mục", "Exports increased dramatically during the economic revival.", "Xuất khẩu đã tăng lên một cách ngoạn mục trong thời kỳ phục hưng kinh tế.");
addCard("sharply", "adv - Mức độ thay đổi", "một cách sắc nét, đột ngột dốc", "Energy consumption dropped sharply following conservation policies.", "Tiêu thụ năng lượng đã giảm mạnh sau các chính sách tiết kiệm.");
addCard("significantly", "adv - Mức độ thay đổi", "một cách đáng kể, có ý nghĩa", "The proportion grew significantly across all sampled age brackets.", "Tỷ lệ này đã tăng đáng kể ở tất cả các nhóm tuổi được lấy mẫu.");
addCard("considerably", "adv - Mức độ thay đổi", "ở mức độ rất lớn, đáng kể", "Production costs were considerably reduced through technical optimization.", "Chi phí sản xuất đã được cắt giảm đáng kể nhờ tối ưu hóa kỹ thuật.");
addCard("moderately", "adv - Mức độ thay đổi", "một cách vừa phải, chừng mực", "Salaries rose moderately in line with annual baseline inflation.", "Mức lương tăng vừa phải theo tỷ lệ lạm phát cơ bản hàng năm.");
addCard("slightly", "adv - Mức độ thay đổi", "một cách nhẹ, không nhiều", "Customer satisfaction dipped slightly during system maintenance.", "Sự hài lòng của khách hàng giảm nhẹ trong thời gian bảo trì hệ thống.");
addCard("gradually", "adv - Mức độ thay đổi", "một cách từ từ, dần dần từng bước", "The demographic shifted gradually towards metropolitan living.", "Cơ cấu dân số đã dịch chuyển dần dần sang lối sống thành thị.");
addCard("steadily", "adv - Mức độ thay đổi", "một cách đều đặn, ổn định qua thời gian", "The user base expanded steadily year after year.", "Lượng người dùng đã mở rộng đều đặn qua từng năm.");
addCard("rapidly", "adv - Mức độ thay đổi", "một cách nhanh chóng, thần tốc", "Solar infrastructure expanded rapidly across sunny regional areas.", "Cơ sở hạ tầng điện mặt trời đã mở rộng nhanh chóng tại các vùng nhiều nắng.");
addCard("marginally", "adv - Mức độ thay đổi", "một cách không đáng kể, rất nhỏ ở rìa", "The updated model outperformed its predecessor only marginally.", "Mẫu sản phẩm mới chỉ vượt trội hơn mẫu tiền nhiệm ở mức rất nhỏ.");

// D. CÁCH SO SÁNH & ĐỐI CHIẾU (TASK 1)
addCard("X is significantly higher than Y", "Task 1 - So sánh", "X cao hơn Y một cách đáng kể", "The UK spent significantly more on research than Germany.", "Vương quốc Anh đã chi nhiều hơn đáng kể cho nghiên cứu so với Đức.");
addCard("X is twice / three times as high as Y", "Task 1 - So sánh", "X cao gấp 2 / gấp 3 lần so với Y", "The rate in the US is three times as high as that recorded in Japan.", "Tỷ lệ ở Mỹ cao gấp 3 lần so với tỷ lệ ghi nhận ở Nhật Bản.");
addCard("X is slightly lower than Y", "Task 1 - So sánh", "X thấp hơn Y một chút", "The male population was slightly lower than the female demographic.", "Dân số nam thấp hơn một chút so với nhân khẩu học nữ.");
addCard("Compared with X, Y ...", "Task 1 - So sánh", "So với X thì Y...", "Compared with the UK, the US exhibited a lower overall percentage.", "So với Anh, Mỹ thể hiện một tỷ lệ phần trăm tổng thể thấp hơn.");
addCard("In contrast to X, Y ...", "Task 1 - So sánh", "Trái ngược hoàn toàn với X thì Y...", "In contrast to the rise in Europe, Asia experienced a pronounced decline.", "Trái ngược với sự gia tăng ở châu Âu, châu Á đã trải qua một sự sụt giảm rõ rệt.");
addCard("X and Y exhibit a similar pattern", "Task 1 - So sánh", "X và Y cùng thể hiện một xu hướng tương tự nhau", "Both northern nations exhibit a remarkably similar growth pattern.", "Cả hai quốc gia phía bắc đều thể hiện một mô hình tăng trưởng tương tự nhau.");
addCard("X follows a similar trend to Y", "Task 1 - So sánh", "X có chiều hướng diễn biến tương tự Y", "Australia follows a very similar trend to New Zealand over the timeframe.", "Úc có xu hướng diễn biến rất giống New Zealand trong khoảng thời gian này.");
addCard("The figure for X is relatively comparable to that of Y", "Task 1 - So sánh", "Số liệu của X tương đương với Y", "The figure for France is relatively comparable to that of Italy.", "Con số của Pháp tương đối tương đương với con số của Ý.");
addCard("X outstrips / surpasses Y", "Task 1 - So sánh", "X vượt trội, bỏ xa Y", "Demand for green vehicles far outstripped conventional car production.", "Nhu cầu về xe xanh đã vượt trội xa so với sản xuất ô tô truyền thống.");
addCard("X lags behind Y", "Task 1 - So sánh", "X tụt hậu, xếp sau Y", "The domestic sector still lags behind its foreign counterparts.", "Khu vực trong nước vẫn tụt hậu so với các đối tác nước ngoài.");
addCard("X is in stark contrast to Y", "Task 1 - So sánh", "X đối lập hoàn toàn với Y", "Recent economic prosperity is in stark contrast to the prior recession.", "Sự thịnh vượng kinh tế gần đây đối lập hoàn toàn với thời kỳ suy thoái trước đó.");
addCard("Whereas / While X..., Y...", "Task 1 - So sánh", "Trong khi X thế này... thì Y lại thế kia...", "Whereas solar adoption soared, fossil fuel consumption shrank.", "Trong khi việc áp dụng năng lượng mặt trời tăng vọt, tiêu thụ nhiên liệu hóa thạch lại co cụm.");
addCard("There is a substantial gap between X and Y", "Task 1 - So sánh", "Có một khoảng cách lớn giữa X và Y", "There is a substantial gap between urban and rural literacy rates.", "Có một khoảng cách đáng kể giữa tỷ lệ biết chữ ở thành thị và nông thôn.");
addCard("X accounts for a larger share than Y", "Task 1 - So sánh", "X chiếm thị phần / tỷ trọng lớn hơn Y", "The tertiary service sector accounts for a larger share than manufacturing.", "Khu vực dịch vụ bậc ba chiếm tỷ trọng lớn hơn so với ngành sản xuất.");
addCard("X is predicted to overtake Y", "Task 1 - So sánh", "X được dự báo sẽ vượt mặt Y", "Renewables are predicted to overtake coal by the end of this decade.", "Năng lượng tái tạo được dự báo sẽ vượt qua than đá vào cuối thập kỷ này.");
addCard("The figures for X and Y converge", "Task 1 - So sánh", "Số liệu của X và Y hội tụ về một điểm", "The statistics for both trading partners converged by the year 2020.", "Số liệu thống kê của cả hai đối tác thương mại đã hội tụ vào năm 2020.");
addCard("X and Y diverge", "Task 1 - So sánh", "X và Y phân kỳ, rẽ sang hai hướng", "The performance trends of the two companies diverged sharply after 2015.", "Xu hướng hiệu suất của hai công ty đã phân kỳ rõ rệt sau năm 2015.");
addCard("Likewise / Similarly, ...", "Task 1 - So sánh", "Tương tự như vậy,...", "Similarly, consumer interest in organic produce increased across all regions.", "Tương tự, sự quan tâm của người tiêu dùng đối với nông sản hữu cơ đã tăng ở mọi vùng.");
addCard("In contrast, ...", "Task 1 - So sánh", "Ngược lại,...", "In contrast, traditional retail outlets recorded diminishing foot traffic.", "Ngược lại, các cửa hàng bán lẻ truyền thống ghi nhận lượng khách ghé thăm giảm dần.");
addCard("By contrast, ...", "Task 1 - So sánh", "Ngược lại hoàn toàn (nhấn mạnh),...", "By contrast, Sweden recorded a much lower emission figure per capita.", "Ngược lại hoàn toàn, Thụy Điển ghi nhận con số phát thải bình quân đầu người thấp hơn nhiều.");

// E. CÁCH DIỄN TẢ TỶ LỆ & PHẦN TRĂM (TASK 1)
addCard("account for + %", "Task 1 - Tỷ lệ", "chiếm bao nhiêu phần trăm", "The tertiary service sector accounts for exactly 60% of total national GDP.", "Khu vực dịch vụ chiếm chính xác 60% tổng GDP quốc gia.");
addCard("constitute + %", "Task 1 - Tỷ lệ", "tạo thành, cấu thành bao nhiêu phần trăm", "Female professionals constitute 48% of the corporate management workforce.", "Các chuyên gia nữ chiếm 48% lực lượng quản lý doanh nghiệp.");
addCard("represent + %", "Task 1 - Tỷ lệ", "đại diện cho / chiếm mức phần trăm", "This metric represents a 15% increase compared to historical baselines.", "Chỉ số này đại diện cho mức tăng 15% so với mức cơ sở lịch sử.");
addCard("make up + %", "Task 1 - Tỷ lệ", "chiếm tỷ lệ bao nhiêu", "Young demographics make up over one-quarter of the active population.", "Nhóm nhân khẩu học trẻ chiếm hơn một phần tư dân số đang hoạt động.");
addCard("the lion's share of + N", "Task 1 - Tỷ lệ", "phần lớn nhất, tỷ trọng áp đảo", "The healthcare infrastructure receives the lion's share of the national budget.", "Cơ sở hạ tầng y tế nhận được phần lớn nhất của ngân sách quốc gia.");
addCard("a quarter / one quarter (25%)", "Task 1 - Tỷ lệ", "chiếm một phần tư (25%)", "Approximately a quarter of respondents favored renewable energy solutions.", "Khoảng một phần tư số người được hỏi ủng hộ các giải pháp năng lượng tái tạo.");
addCard("a third / one third (33.3%)", "Task 1 - Tỷ lệ", "chiếm một phần ba (33.3%)", "One third of municipal funding was allocated to public educational projects.", "Một phần ba kinh phí thành phố được phân bổ cho các dự án giáo dục công cộng.");
addCard("half / exactly half (50%)", "Task 1 - Tỷ lệ", "một nửa (50%)", "Exactly half of the regional population currently resides in metropolitan areas.", "Chính xác một nửa dân số khu vực hiện đang cư trú tại các vùng đô thị.");
addCard("a / the majority of + N", "Task 1 - Tỷ lệ", "phần lớn, đại đa số", "The overwhelming majority of participants preferred modern remote working setups.", "Đại đa số những người tham gia thích hình thức làm việc từ xa hiện đại hơn.");
addCard("a / the minority of + N", "Task 1 - Tỷ lệ", "thiểu số, phần nhỏ", "Only a small minority of students chose classical linguistic studies.", "Chỉ một bộ phận thiểu số nhỏ sinh viên lựa chọn ngành nghiên cứu ngôn ngữ cổ điển.");
addCard("roughly / approximately", "Task 1 - Tỷ lệ", "xấp xỉ, khoảng chừng", "Roughly 40% of suburban commuters travel primarily by electric train.", "Khoảng 40% người đi làm ngoại ô di chuyển chủ yếu bằng tàu điện.");
addCard("just over / just under", "Task 1 - Tỷ lệ", "nhỉnh hơn một chút / thấp hơn một chút", "Just over 70% of households own at least one personal computer.", "Hơn 70% hộ gia đình một chút sở hữu ít nhất một máy tính cá nhân.");
addCard("amount to", "Task 1 - Tỷ lệ", "lên tới, tổng cộng đạt mức", "Total annual export revenue amounted to approximately 50 million dollars.", "Tổng doanh thu xuất khẩu hàng năm lên tới khoảng 50 triệu đô la.");
addCard("be divided into + categories", "Task 1 - Tỷ lệ", "được phân chia thành các danh mục", "The annual municipal expenditure is divided into four primary sectors.", "Chi tiêu hàng năm của thành phố được chia thành bốn lĩnh vực chính.");
addCard("a fraction of", "Task 1 - Tỷ lệ", "chỉ một phần rất nhỏ", "Only a negligible fraction of the global energy supply originated from coal.", "Chỉ một phần không đáng kể nguồn cung cấp năng lượng toàn cầu bắt nguồn từ than đá.");

// F. CHIẾN LƯỢC CHO TỪNG LOẠI BIỂU ĐỒ (TASK 1)
addCard("Line Graph Analysis Strategy", "Task 1 - Dạng bài", "Chiến lược phân tích biểu đồ đường (Theo dõi xu hướng, điểm đỉnh, đáy và độ dốc)", "The line graph tracks the dynamic changes in resource consumption over three decades.", "Biểu đồ đường theo dõi những biến đổi trong tiêu thụ tài nguyên qua ba thập kỷ.");
addCard("Bar Chart Analysis Strategy", "Task 1 - Dạng bài", "Chiến lược phân tích biểu đồ cột (So sánh danh mục, nhấn mạnh điểm cao nhất và thấp nhất)", "The bar chart compares figures across multiple demographic groups comprehensively.", "Biểu đồ cột so sánh số liệu giữa nhiều nhóm nhân khẩu học một cách toàn diện.");
addCard("Pie Chart Analysis Strategy", "Task 1 - Dạng bài", "Chiến lược phân tích biểu đồ tròn (So sánh cơ cấu tỷ lệ %, phần áp đảo và phần nhỏ nhất)", "The pie chart shows the detailed percentage breakdown of energy sector investments.", "Biểu đồ tròn thể hiện chi tiết cơ cấu phần trăm các khoản đầu tư vào ngành năng lượng.");
addCard("Table Analysis Strategy", "Task 1 - Dạng bài", "Chiến lược phân tích bảng số liệu (So sánh chéo hàng và cột, tìm sự chênh lệch lớn nhất)", "The table provides a detailed statistical breakdown across multiple developmental metrics.", "Bảng số liệu cung cấp sự phân tích thống kê chi tiết trên nhiều chỉ số phát triển.");
addCard("Map Analysis Strategy", "Task 1 - Dạng bài", "Chiến lược phân tích bản đồ (Mô tả sự thay đổi hạ tầng: xây mới, phá bỏ, mở rộng qua thời gian)", "The two maps depict the architectural transformation of the coastal port from 1990 to 2020.", "Hai bản đồ mô tả sự chuyển đổi kiến trúc của cảng ven biển từ năm 1990 đến năm 2020.");
addCard("Process Diagram Strategy", "Task 1 - Dạng bài", "Chiến lược phân tích sơ đồ quy trình (Mô tả các bước tuần tự theo thể bị động)", "The flowchart diagram illustrates the sequential stages of the industrial recycling process.", "Sơ đồ luồng minh họa các giai đoạn tuần tự của quy trình tái chế công nghiệp.");

// G. CẤU TRÚC NGỮ PHÁP "CỨU CÁNH" CHO TASK 1
addCard("Bị động trong Task 1: S + was/were + recorded/projected", "Task 1 - Ngữ pháp", "Dùng thể bị động để trình bày số liệu khách quan", "The highest emission rate was recorded at the industrial manufacturing hub.", "Tỷ lệ phát thải cao nhất đã được ghi nhận tại trung tâm sản xuất công nghiệp.");
addCard("Mệnh đề quan hệ thời gian: The year X, which saw..., marked...", "Task 1 - Ngữ pháp", "Kết nối năm và sự kiện biến động lớn", "The year 2008, which saw a global recession, marked a turning point in trade.", "Năm 2008, năm chứng kiến cuộc suy thoái toàn cầu, đã đánh dấu một bước ngoặt trong thương mại.");
addCard("Mệnh đề so sánh thời gian: While X rose, Y fell...", "Task 1 - Ngữ pháp", "Diễn đạt sự tương phản đồng thời giữa hai chủ thể", "While automotive manufacturing rose in Asia, it contracted sharply in the West.", "Trong khi sản xuất ô tô tăng ở châu Á, nó lại sụt giảm mạnh ở phương Tây.");
addCard("So sánh kép trong Task 1: The higher..., the more...", "Task 1 - Ngữ pháp", "Tương quan tỷ lệ thuận/nghịch giữa hai yếu tố", "The higher the national disposable income, the more households spend on leisure.", "Thu nhập khả dụng quốc gia càng cao, các hộ gia đình càng chi nhiều cho giải trí.");
addCard("V-ing làm chủ ngữ trong Task 1: Spending on X accounted for...", "Task 1 - Ngữ pháp", "Sử dụng danh động từ làm chủ ngữ trang trọng", "Investing in renewable technology accounted for the fastest growing expenditure.", "Việc đầu tư vào công nghệ tái tạo chiếm khoản chi tiêu tăng trưởng nhanh nhất.");
addCard("Cấu trúc với With: The country experienced a rise, with figures reaching...", "Task 1 - Ngữ pháp", "Bổ sung số liệu kèm theo một cách tinh tế", "The nation experienced steady growth, with renewable metrics reaching 75%.", "Quốc gia này đã trải qua sự tăng trưởng đều đặn, với các chỉ số tái tạo đạt 75%.");
addCard("Thì tương lai trong quá khứ: Was to / Would + V", "Task 1 - Ngữ pháp", "Dự kiến xảy ra trong quá khứ nhưng bị hoãn", "The transit expansion was to commence in 2010, but faced unexpected delays.", "Việc mở rộng giao thông công cộng dự kiến bắt đầu vào năm 2010 nhưng đã bị trì hoãn.");
addCard("Câu chẻ Task 1: What is most striking is the sudden...", "Task 1 - Ngữ pháp", "Nhấn mạnh số liệu nổi bật nhất trong đồ thị", "What is most striking is the sudden upward surge in digital communication tools.", "Điều nổi bật nhất chính là sự tăng vọt đột ngột của các công cụ liên lạc kỹ thuật số.");
addCard("Đảo ngữ Task 1: Not only did X increase, but Y also rose", "Task 1 - Ngữ pháp", "Nhấn mạnh sự đồng thuận tăng/giảm giữa hai yếu tố", "Not only did exports expand, but international foreign investment also rose sharply.", "Không những xuất khẩu mở rộng, mà đầu tư nước ngoài quốc tế cũng tăng mạnh.");
addCard("There + be trong Task 1: There was a sharp decline in...", "Task 1 - Ngữ pháp", "Trình bày sự biến thiên một cách khách quan", "There was a sharp decline in overall fossil fuel consumption over the period.", "Đã có một sự sụt giảm mạnh trong tổng mức tiêu thụ nhiên liệu hóa thạch qua thời kỳ.");
addCard("Quá khứ hoàn thành Task 1: By [Year], S + had already reached...", "Task 1 - Ngữ pháp", "Số liệu đạt được trước một mốc thời gian trong quá khứ", "By 2015, the urban population had already reached an unprecedented milestone.", "Đến năm 2015, dân số đô thị đã đạt đến một cột mốc chưa từng có.");
addCard("Bị động nhận thức Task 1: S + is said / projected to + V", "Task 1 - Ngữ pháp", "Dự báo cho tương lai dựa trên số liệu", "Renewable energy usage is widely projected to double over the next fifteen years.", "Việc sử dụng năng lượng tái tạo được dự báo rộng rãi sẽ tăng gấp đôi trong 15 năm tới.");
addCard("A rather than B: A steady increase rather than a dramatic one", "Task 1 - Ngữ pháp", "Chỉ rõ bản chất thay đổi thay vì một xu hướng khác", "The market witnessed a steady expansion rather than a sudden volatile jump.", "Thị trường đã chứng kiến sự mở rộng đều đặn thay vì một cú nhảy vọt biến động đột ngột.");
addCard("In terms of + N (Xét về mặt...)", "Task 1 - Ngữ pháp", "Giới hạn phạm vi phân tích số liệu", "In terms of total export revenue, Germany outperformed all European peers.", "Xét về tổng doanh thu xuất khẩu, Đức vượt trội hơn tất cả các đối tác châu Âu.");
addCard("As far as + S + be concerned (Xét về phương diện...)", "Task 1 - Ngữ pháp", "Chuyển ý sang phân tích danh mục mới", "As far as heavy manufacturing is concerned, the recorded statistics were modest.", "Xét về phương diện sản xuất công nghiệp nặng, các số liệu ghi nhận khá khiêm tốn.");

// PHẦN 2: IELTS WRITING TASK 2
// B. CÁCH MỞ BÀI ẤN TƯỢNG (TASK 2)
addCard("It is often argued that...", "Task 2 - Mở bài", "Người ta thường lập luận / cho rằng rằng...", "It is often argued that digital distance learning is superior to traditional schooling.", "Người ta thường lập luận rằng việc học từ xa qua mạng vượt trội hơn giáo dục truyền thống.");
addCard("There is a growing trend of...", "Task 2 - Mở bài", "Ngày càng có xu hướng...", "There is a growing trend of modern professionals relocating to suburban regions.", "Ngày càng có xu hướng các chuyên gia hiện đại chuyển đến sinh sống tại các vùng ngoại ô.");
addCard("In recent years, ... has become a hot topic.", "Task 2 - Mở bài", "Trong những năm gần đây, ... đã trở thành một chủ đề nóng bỏng.", "In recent years, artificial intelligence ethics has become a fiercely debated topic.", "Trong những năm gần đây, đạo đức trí tuệ nhân tạo đã trở thành một chủ đề tranh luận sôi nổi.");
addCard("The question of whether... has sparked considerable debate.", "Task 2 - Mở bài", "Câu hỏi về việc liệu... đã châm ngòi cho các cuộc tranh luận sâu rộng.", "The question of whether university education should be free has sparked widespread debate.", "Câu hỏi liệu giáo dục đại học có nên miễn phí hay không đã làm dấy lên cuộc tranh luận sâu rộng.");
addCard("Many people are of the opinion that...", "Task 2 - Mở bài", "Nhiều người giữ quan điểm rằng...", "Many people are of the opinion that environmental conservation supersedes economic growth.", "Nhiều người có quan điểm rằng việc bảo tồn môi trường phải được ưu tiên hơn tăng trưởng kinh tế.");
addCard("In modern society, ... is a matter of great concern.", "Task 2 - Mở bài", "Trong xã hội hiện đại, ... là một vấn đề đáng quan ngại sâu sắc.", "In modern society, psychological burnout in the workplace is a matter of great concern.", "Trong xã hội hiện đại, kiệt sức tâm lý nơi làm việc là một vấn đề đáng quan ngại sâu sắc.");
addCard("It is widely acknowledged that...", "Task 2 - Mở bài", "Được thừa nhận rộng rãi rằng...", "It is widely acknowledged that early childhood education lays the foundation for success.", "Mọi người đều thừa nhận rằng giáo dục mầm non đặt nền móng vững chắc cho thành công.");
addCard("While some believe ..., others contend that ...", "Task 2 - Mở bài", "Trong khi một số người tin rằng... thì những người khác lại khẳng định rằng...", "While some believe taxation should decrease, others contend public services require funding.", "Trong khi một số tin thuế nên giảm, những người khác lại cho rằng dịch vụ công cần được cấp vốn.");
addCard("There is a school of thought that...", "Task 2 - Mở bài", "Có một trường phái tư tưởng / luồng ý kiến cho rằng...", "There is a school of thought that artistic disciplines are as crucial as STEM subjects.", "Có một luồng quan điểm cho rằng các môn nghệ thuật cũng quan trọng ngang với các môn STEM.");
addCard("One of the most pressing issues facing ... is ...", "Task 2 - Mở bài", "Một trong những vấn đề cấp bách nhất mà ... đang đối mặt là...", "One of the most pressing issues facing urban administrations is affordable housing.", "Một trong những vấn đề cấp bách nhất mà các chính quyền đô thị đối mặt là nhà ở giá rẻ.");

// C. CÁCH VIẾT THÂN BÀI (TASK 2)
addCard("One of the primary advantages is...", "Task 2 - Thân bài", "Một trong những lợi thế / ưu điểm hàng đầu là...", "One of the primary advantages is the profound operational flexibility it offers.", "Một trong những lợi thế hàng đầu là tính linh hoạt sâu sắc trong vận hành mà nó mang lại.");
addCard("A major drawback of this is...", "Task 2 - Thân bài", "Một nhược điểm / hạn chế lớn của điều này là...", "A major drawback of this strategy is the substantial financial overhead involved.", "Một nhược điểm lớn của chiến lược này là chi phí tài chính phát sinh đáng kể.");
addCard("This is due to the fact that...", "Task 2 - Thân bài", "Điều này bắt nguồn từ thực tế là...", "This is due to the fact that modern healthcare enables populations to live longer.", "Điều này bắt nguồn từ thực tế là y tế hiện đại giúp con người sống thọ hơn.");
addCard("Consequently / As a result, ...", "Task 2 - Thân bài", "Hệ quả là / Kết quả là,...", "Consequently, public demand for specialized elderly care infrastructure escalates.", "Hệ quả là nhu cầu công cộng đối với cơ sở chăm sóc người cao tuổi chuyên biệt gia tăng.");
addCard("In order to tackle this issue, ...", "Task 2 - Thân bài", "Nhằm giải quyết triệt để vấn đề này,...", "In order to tackle this issue, civic authorities must subsidize public transport.", "Để giải quyết vấn đề này, các nhà chức trách đô thị phải trợ giá phương tiện công cộng.");
addCard("It stands to reason that...", "Task 2 - Thân bài", "Là điều hoàn toàn hợp lý logic khi cho rằng...", "It stands to reason that superior education fosters enhanced socioeconomic mobility.", "Hoàn toàn hợp lý khi cho rằng giáo dục ưu việt sẽ thúc đẩy sự thăng tiến kinh tế xã hội.");
addCard("There is no denying that...", "Task 2 - Thân bài", "Không thể phủ nhận sự thật rằng...", "There is no denying that cutting-edge technology has revolutionized communication.", "Không thể phủ nhận rằng công nghệ tiên tiến đã cách mạng hóa phương thức giao tiếp.");
addCard("Opponents of this view argue that...", "Task 2 - Thân bài", "Những người phản đối quan điểm này lập luận rằng...", "Opponents of this view argue that state subsidies might disincentivize private innovation.", "Những người phản đối cho rằng trợ cấp nhà nước có thể làm giảm động lực đổi mới tư nhân.");
addCard("Proponents claim that...", "Task 2 - Thân bài", "Những người ủng hộ khẳng định rằng...", "Proponents claim that universal renewable adoption will secure ecological balance.", "Những người ủng hộ tuyên bố việc áp dụng năng lượng tái tạo sẽ bảo đảm cân bằng sinh thái.");
addCard("This, in turn, contributes to...", "Task 2 - Thân bài", "Điều này, đổi lại, sẽ đóng góp vào hiệu ứng dây chuyền...", "This, in turn, contributes meaningfully to long-term national economic resilience.", "Điều này, đổi lại, sẽ đóng góp đáng kể vào sức chống chịu kinh tế quốc gia lâu dài.");
addCard("This can be illustrated by the case of...", "Task 2 - Thân bài", "Điều này có thể được minh họa cụ thể qua trường hợp của...", "This can be illustrated by the sustainable municipal development of Singapore.", "Điều này có thể được minh chứng qua sự phát triển đô thị bền vững của Singapore.");
addCard("From my perspective / In my opinion", "Task 2 - Thân bài", "Theo góc nhìn / quan điểm cá nhân của tôi", "From my perspective, the multifaceted benefits far outweigh the initial drawbacks.", "Theo góc nhìn của tôi, những lợi ích đa diện vượt trội hơn hẳn những hạn chế ban đầu.");
addCard("I am of the view that...", "Task 2 - Thân bài", "Tôi giữ vững quan điểm rằng...", "I am of the view that balanced regulatory policies satisfy both economic and social needs.", "Tôi cho rằng các chính sách điều tiết cân bằng sẽ thỏa mãn cả nhu cầu kinh tế lẫn xã hội.");
addCard("This is not to say that...", "Task 2 - Thân bài", "Nói như vậy không có nghĩa là...", "This is not to say that all technological implementations are devoid of risk.", "Nói vậy không có nghĩa là mọi ứng dụng công nghệ đều hoàn toàn không có rủi ro.");

// D. CÁCH KẾT BÀI (TASK 2)
addCard("In conclusion, ...", "Task 2 - Kết bài", "Tóm lại, kết luận lại,...", "In conclusion, the societal advantages of investing in green infrastructure are undeniable.", "Tóm lại, những lợi ích xã hội của việc đầu tư vào hạ tầng xanh là không thể chối cãi.");
addCard("To sum up, ...", "Task 2 - Kết bài", "Tóm tắt lại toàn bộ luận điểm,...", "To sum up, while short-term hurdles exist, long-term educational gains are profound.", "Tóm lại, dù tồn tại những rào cản ngắn hạn, lợi ích giáo dục lâu dài là rất sâu sắc.");
addCard("All in all, ...", "Task 2 - Kết bài", "Xét trên mọi phương diện,...", "All in all, the constructive influence of digital tools outweighs temporary challenges.", "Xét trên mọi phương diện, ảnh hưởng mang tính xây dựng của công nghệ số vượt trội thách thức.");
addCard("In a nutshell, ...", "Task 2 - Kết bài", "Nói một cách ngắn gọn, súc tích,...", "In a nutshell, sustainable leadership is essential for enduring corporate survival.", "Nói tóm lại, sự lãnh đạo bền vững là điều thiết yếu cho sự tồn vong lâu dài của doanh nghiệp.");
addCard("On balance, ...", "Task 2 - Kết bài", "Cân nhắc kỹ lưỡng đôi bên,...", "On balance, the distinct benefits of remote collaboration surpass its minor drawbacks.", "Cân nhắc kỹ lưỡng, lợi ích của làm việc từ xa vượt trội hơn hẳn các khuyết điểm nhỏ.");
addCard("Taking everything into consideration, ...", "Task 2 - Kết bài", "Sau khi xem xét mọi yếu tố liên quan,...", "Taking everything into consideration, proactive legislative intervention is urgently required.", "Sau khi xem xét mọi yếu tố, sự can thiệp lập pháp chủ động là điều cấp thiết.");
addCard("In light of the evidence, ...", "Task 2 - Kết bài", "Dưới ánh sáng của các bằng chứng thực tiễn,...", "In light of the evidence, transitioning to clean alternatives is the only viable path.", "Dưới ánh sáng của bằng chứng, chuyển đổi sang các giải pháp sạch là con đường khả thi duy nhất.");
addCard("Given these points, ...", "Task 2 - Kết bài", "Dựa trên những luận cứ đã nêu,...", "Given these points, I firmly believe that community-driven initiatives yield greatest impact.", "Dựa trên những điểm này, tôi tin chắc các sáng kiến cộng đồng mang lại tác động lớn nhất.");
addCard("It is therefore clear that...", "Task 2 - Kết bài", "Do đó thấy rõ một điều là...", "It is therefore clear that continuous vocational upskilling will remain mandatory.", "Do đó thấy rõ rằng việc nâng cao kỹ năng nghề nghiệp liên tục sẽ vẫn là bắt buộc.");
addCard("I would argue that...", "Task 2 - Kết bài", "Tôi muốn khẳng định lại quan điểm rằng...", "I would argue that the enduring societal benefits more than justify the upfront capital.", "Tôi khẳng định rằng lợi ích xã hội bền lâu hoàn toàn xứng đáng với vốn đầu tư ban đầu.");

// F. 20 CỤM TỪ HỌC THUẬT "CỨU CÁNH" CHO CẢ 2 TASK
addCard("It is noteworthy that...", "Academic phrase", "Đáng chú ý là / Đáng lưu tâm là...", "It is noteworthy that investment in vocational training yielded higher retention rates.", "Đáng chú ý là việc đầu tư vào đào tạo nghề mang lại tỷ lệ giữ chân nhân viên cao hơn.");
addCard("A significant proportion", "Academic phrase", "Một tỷ lệ đáng kể", "A significant proportion of municipal revenue is allocated to public healthcare.", "Một tỷ lệ đáng kể của doanh thu thành phố được phân bổ cho y tế công cộng.");
addCard("Over the period shown", "Academic phrase", "Trong suốt giai đoạn được thể hiện", "Over the period shown, renewable energy adoption maintained an upward trajectory.", "Trong suốt giai đoạn được thể hiện, năng lượng tái tạo duy trì một quỹ đạo đi lên.");
addCard("In stark contrast", "Academic phrase", "Trái ngược hoàn toàn, đối lập gay gắt", "In stark contrast, developing nations experienced severe technological bottlenecks.", "Trái ngược hoàn toàn, các nước đang phát triển phải chịu những nút thắt công nghệ nghiêm trọng.");
addCard("Exert a profound impact", "Academic phrase", "Gây ra / tạo ra một tác động sâu sắc", "Automated systems exert a profound impact on workforce dynamics and job roles.", "Hệ thống tự động hóa tạo ra tác động sâu sắc lên động lực và vị trí việc làm.");
addCard("Pave the way for", "Academic phrase", "Mở đường cho, đặt nền móng cho", "Groundbreaking biochemical research paved the way for innovative therapeutics.", "Nghiên cứu hóa sinh đột phá đã mở đường cho các liệu pháp điều trị mang tính đổi mới.");
addCard("Give rise to", "Academic phrase", "Gây ra, làm phát sinh", "Uncontrolled industrialization often gives rise to acute environmental degradation.", "Công nghiệp hóa không kiểm soát thường làm phát sinh sự suy thoái môi trường nghiêm trọng.");
addCard("Take precedence over", "Academic phrase", "Được ưu tiên hàng đầu hơn so với", "Public safety and well-being must take precedence over corporate profit margins.", "Sự an toàn và phúc lợi công cộng phải được ưu tiên hơn biên lợi nhuận doanh nghiệp.");
addCard("Alleviate the problem", "Academic phrase", "Làm giảm bớt / xoa dịu vấn đề", "Targeted subsidies can effectively alleviate the acute problem of fuel poverty.", "Các khoản trợ cấp đúng đối tượng có thể xoa dịu hiệu quả vấn đề nghèo năng lượng.");
addCard("Address the issue", "Academic phrase", "Giải quyết / xử lý triệt để vấn đề", "Governments must courageously address the pressing issue of income inequality.", "Chính phủ phải dũng cảm giải quyết vấn đề cấp bách về bất bình đẳng thu nhập.");
addCard("Ultimately", "Academic phrase", "Xét cho cùng, vào phút cuối", "Ultimately, individual behavioral shifts drive enduring ecological conservation.", "Xét cho cùng, sự thay đổi hành vi cá nhân mới thúc đẩy việc bảo tồn sinh thái lâu dài.");
addCard("Catalyze change", "Academic phrase", "Đóng vai trò chất xúc tác cho sự thay đổi", "Technological breakthroughs catalyze change across modern educational paradigms.", "Những đột phá công nghệ đóng vai trò chất xúc tác cho sự thay đổi giáo dục.");
addCard("Detrimental effects", "Academic phrase", "Những tác động / hệ quả tiêu cực gây hại", "Excessive carbon emissions inflict severe detrimental effects on marine ecosystems.", "Lượng khí thải carbon quá mức gây ra những tác động cực kỳ bất lợi cho hệ sinh thái biển.");
addCard("Anecdotal evidence", "Academic phrase", "Bằng chứng truyền miệng / trải nghiệm cá nhân", "While anecdotal evidence is compelling, empirical scientific validation is required.", "Dù bằng chứng giai thoại rất thuyết phục, vẫn cần sự kiểm chứng khoa học thực nghiệm.");
addCard("Beneficial implications", "Academic phrase", "Những hệ quả / tác động có lợi", "The educational reform holds profound beneficial implications for future generations.", "Cải cách giáo dục mang lại những hàm ý vô cùng có lợi cho các thế hệ tương lai.");
addCard("Overwhelming majority", "Academic phrase", "Đại đa số áp đảo", "The overwhelming majority of citizens endorsed proactive environmental legislation.", "Đại đa số áp đảo người dân đã tán thành đạo luật môi trường chủ động.");
addCard("A double-edged sword", "Academic phrase", "Con dao hai lưỡi (vừa có lợi vừa có hại)", "Rapid social media expansion represents a classic double-edged sword for teenagers.", "Sự bùng nổ của mạng xã hội là con dao hai lưỡi đối với thanh thiếu niên.");
addCard("Shift the focus", "Academic phrase", "Chuyển trọng tâm / hướng chú ý sang", "Policy makers must shift the focus toward preventative health and nutrition.", "Các nhà hoạch định chính sách phải chuyển trọng tâm sang y tế và dinh dưỡng phòng ngừa.");
addCard("Synonymous with", "Academic phrase", "Đồng nghĩa với / gắn liền với", "In the modern economy, relentless innovation has become synonymous with survival.", "Trong nền kinh tế hiện đại, đổi mới không ngừng đã trở nên đồng nghĩa với sự sinh tồn.");
addCard("This begs the question", "Academic phrase", "Điều này đặt ra câu hỏi cần trả lời", "This begs the question of how educational institutions should adapt curricula.", "Điều này đặt ra câu hỏi làm thế nào các cơ sở giáo dục nên điều chỉnh chương trình học.");

console.log('Total newly prepared items:', allItems.length);

const newCards = allItems.map((item, index) => {
  const cardId = `tk_${baseTimestamp + index}_${Math.random().toString(36).substring(2, 7)}`;
  const title = item.word;
  const translation = item.trans;

  const notes = [
    `🗣️ Speaking 1: "${item.exampleEn}"`,
    `   👉 Dịch: ${item.exampleVi}`,
    `🗣️ Speaking 2: "In academic discussions, mastering '${item.word.split(' (')[0]}' is essential for high bands."`,
    `   👉 Dịch: Trong thảo luận học thuật, làm chủ '${item.word.split(' (')[0]}' là cần thiết để đạt band điểm cao.`,
    `✍️ Writing 1: "${item.exampleEn}"`,
    `   👉 Dịch: ${item.exampleVi}`,
    `✍️ Writing 2: "Scholarly research repeatedly highlights the importance of '${item.word.split(' (')[0]}' in practice."`,
    `   👉 Dịch: Nghiên cứu học thuật liên tục nhấn mạnh tầm quan trọng của '${item.word.split(' (')[0]}' trong thực tiễn.`
  ].join('\n');

  return {
    id: cardId,
    word: title,
    translation: translation,
    notes: notes,
    linkType: 'direct',
    tiktokUrl: getNextUrl(),
    level: 1,
    interval: 1,
    nextReviewDate: todayStr,
    createdAt: new Date().toISOString()
  };
});

if (!vault.items) vault.items = [];
vault.items.unshift(...newCards);

fs.writeFileSync(vaultPath, JSON.stringify(vault, null, 2), 'utf8');
console.log('SUCCESS! Added', newCards.length, 'cards to memorize_vault.json');
console.log('Total items now in vault:', vault.items.length);
