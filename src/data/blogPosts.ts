export interface BlogBlock {
  type: 'paragraph' | 'heading' | 'list';
  text?: string;
  items?: string[];
}

export interface BlogFaq {
  q: string;
  a: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  keywords: string[];
  readingMinutes: number;
  heroEmoji: string;
  blocks: BlogBlock[];
  faqs?: BlogFaq[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'cach-lam-lyric-video-mien-phi',
    title: 'Cách làm Lyric Video Miễn Phí Bằng AI Trong 10 Phút (2026)',
    description:
      'Hướng dẫn từng bước tạo lyric video chuyên nghiệp miễn phí bằng LyricStudio AI: tải nhạc, tách lời tự động, căn khớp sóng âm và xuất video 9:16 cho TikTok, YouTube Shorts.',
    date: '2026-01-12',
    author: 'LyricStudio Team',
    category: 'Hướng dẫn cơ bản',
    keywords: [
      'cách làm lyric video',
      'tạo lyric video miễn phí',
      'lyric video bằng AI',
      'video lời bài hát',
      'video karaoke',
    ],
    readingMinutes: 10,
    heroEmoji: '🎬',
    blocks: [
      {
        type: 'paragraph',
        text: 'Trước khi trí tuệ nhân tạo bước vào quy trình, một bài hát dài ba phút tốn của người mới khoảng ba đến bốn giờ: nghe đi nghe lại để đánh dấu từng câu, gõ thủ công mốc thời gian cho từng từ, rồi mới nghĩ tới font chữ và hiệu ứng. LyricStudio AI gộp hai việc nặng nhất — nhận diện lời và gắn mốc thời gian — vào một lần bấm, nên phần thời gian còn lại dành cho phong cách và kiểm tra. Bài này viết lại đúng quy trình đó theo thứ tự thời gian thực tế: hai phút chuẩn bị, ba phút căn lời, ba phút chọn font, hai phút xuất.',
      },
      {
        type: 'paragraph',
        text: 'Con số mười phút chỉ đúng khi bạn đã có sẵn tệp âm thanh sạch và không phải sửa nhiều. Người mới thường mất thêm 10–15 phút chỉ để tìm lại bản nhạc, tải thêm font hoặc ngồi chờ trình duyệt dựng khung hình. Đọc trước phần xử lý khi AI căn sai ở cuối bài để biết lỗi nào chỉ mất vài giây sửa, và lưu ý rằng bạn phải có quyền sử dụng tệp âm thanh trước khi làm bất cứ điều gì.',
      },
      { type: 'heading', text: 'Chuẩn bị tệp nhạc: nơi phần lớn lỗi bắt đầu' },
      {
        type: 'paragraph',
        text: 'Chất lượng tệp âm thanh quyết định chất lượng mốc thời gian. Một bản thu sạch, không cắt ghép, không có tiếng nói đè lên nhạc sẽ cho kết quả căn gần như tuyệt đối. Ngược lại, bản thu lấy từ livestream hoặc tải về qua một trình nghe nhạc thường có độ nén nặng, tiếng bass cộng hưởng và dư âm kéo dài ở cuối mỗi câu; mô hình nghe nhầm phần dư âm thành âm tiết tiếp theo và tạo ra mốc thời gian lệch.',
      },
      {
        type: 'list',
        items: [
          'WAV 44,1 kHz stereo là định dạng an toàn nhất; MP3 128 kbps trở lên và M4A vẫn dùng được miễn tệp không bị cắt.',
          'Cắt bỏ 1–3 giây im lặng thừa ở đầu và cuối, nhưng giữ nguyên phần nhạc dạo đầu vì nó giúp bạn xác định câu hát đầu tiên bắt đầu ở đâu.',
          'Không đẩy gain quá mức để làm to tiếng. Khi tín hiệu bị cắt ở đỉnh, dốc sóng khởi đầu mất và ranh giới giữa hai từ trở nên mờ.',
          'Chuẩn bị lời bài hát dạng văn bản nếu có. Có lời sẵn giúp hệ thống căn theo văn bản thay vì đoán, và sai sót giảm rõ rệt ở các từ tiếng Việt có thanh điệu giống nhau.',
          'Đặt tên dự án có dấu, ví dụ Ten Bai Hat - Hoa Si, để sau này tìm lại dễ hơn khi kênh của bạn đã có hàng chục video.',
          'Lưu ý hạn mức: gói miễn phí có 3 lượt xử lý mỗi ngày và tính lại lúc 00:00 giờ Việt Nam. Rút gọn bằng cách chuẩn bị tệp trước thay vì thử nhiều bản cùng lúc.',
        ],
      },
      { type: 'heading', text: 'Căn lời theo từ: bước quyết định chất lượng' },
      {
        type: 'paragraph',
        text: 'Sau khi tệp âm thanh tải lên xong, việc quan trọng nhất là căn lời theo từ chứ không phải chọn font. Nếu chữ chạy đúng nhịp, video ở mức chấp nhận được dù font đẹp; nếu chữ lệch nửa giây, người xem cảm thấy sai ngay và lướt đi trước khi hiệu ứng kịp xuất hiện. Vì vậy luôn hoàn tất căn lời trước, xuất thử một bản, rồi mới tinh chỉnh giao diện.',
      },
      {
        type: 'list',
        items: [
          'Bước 1 — Chạy tách lời: AI nghe giọng hát và xuất danh sách câu, mỗi câu kèm một mốc bắt đầu và kết thúc. Mất khoảng 20–60 giây tùy độ dài bài.',
          'Bước 2 — Dán lời nếu có: đưa lời vào ô văn bản rồi căn lại, hệ thống sẽ bám theo lời của bạn thay vì tự nhận diện.',
          'Bước 3 — Mở Căn Khớp Sóng Âm: cửa sổ này hiển thị dạng sóng âm, danh sách câu và dải thời gian phóng to được tới 15 lần để kéo từng ranh giới từ.',
          'Bước 4 — Nghe kiểm tra ba chỗ: câu đầu tiên, đoạn chuyển từ verse sang điệp khúc, và câu cuối. Ba chỗ này chiếm phần lớn lỗi.',
          'Bước 5 — Bật hiệu ứng karaoke: chọn Karaoke Spotify Flow để lớp màu vuốt theo từ, vì màu sẽ lệch khỏi giọng hát ngay nếu mốc thời gian sai.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Sau khi căn xong, hãy bật Lặp Câu Đang Chọn và tua tốc độ 0,75 lần ở những đoạn mới. Nghe chậm giúp bạn nhận ra lỗi mà nghe bình thường không thấy: chữ sáng lên sớm hơn giọng ca sĩ một nhịp, hoặc hai từ bị gộp thành một và nghe như bị nuốt chữ.',
      },
      { type: 'heading', text: 'Chọn font và hiệu ứng chữ' },
      {
        type: 'paragraph',
        text: 'Studio có 12 font chia theo phong cách: Syne và Space Grotesk cho dòng hiện đại, Bebas Neue và Orbitron cho dòng mạnh mẽ, Playfair Display và Cinzel cho ballad trữ tình, Caveat và Dancing Script cho giọng thủ tay, Righteous và Lobster cho dòng hoài niệm, Bangers cho nội dung vui nhộn. Ô cỡ chữ trong bảng điều khiển dùng thang tương đối và được nhân theo chiều rộng khung hình, nên cùng một con số cho ra kích thước chữ gần như giống nhau giữa bản dọc và bản ngang.',
      },
      {
        type: 'list',
        items: [
          'Chỉ dùng một họ font cho toàn bộ bài. Trộn hai kiểu đậm với hai kiểu chữ thường khiến cả video trông như bản nháp.',
          'Trên nền ảnh hãy chọn font đậm vừa phải: Bebas Neue, Montserrat và Syne đọc tốt ở cỡ nhỏ, còn font thủ tự như Caveat cần lớn hơn khoảng 20% để không bị mờ.',
          'Luôn bật viền hoặc bóng chữ khi nền là ảnh. Với nền tối giản có vignette, chữ trắng đậm là đủ.',
          'Chọn hiệu ứng chuyển động theo thể loại chứ không theo thói quen: Beat Bounce cho nhạc dance, Typewriter cho lofi, Cinematic Fade cho ballad, Wave Float cho nhạc nhẹ.',
          'Bật tối đa hai hiệu ứng nền cùng lúc. Ken Burns kết hợp Hạt đom đóm thường đủ cho hầu hết bài hát nhạc nhẹ.',
          'Bộ lọc Teal & Orange và Hoàng hôn giữ chữ trắng dễ đọc hơn bộ lọc Vintage trên nền sáng.',
        ],
      },
      { type: 'heading', text: 'Xuất đúng tỷ lệ khung hình' },
      {
        type: 'paragraph',
        text: 'Hãy chọn tỷ lệ ở thanh công cụ trên cùng trước khi chỉnh giao diện, vì bộ chữ sẽ co lại hoặc giãn ra theo chiều rộng khung hình. Xuất 9:16 nhận 1080 × 1920 cho TikTok, Reels và Shorts; 16:9 nhận 1920 × 1080 cho YouTube; 1:1 và 4:5 nhận 1080 × 1080 và 1080 × 1350 cho bài đăng dạng ô vuông. Nếu xuất bản ngang rồi ép sang dọc, chữ sẽ nhỏ đi và bị cắt ở hai bên.',
      },
      {
        type: 'list',
        items: [
          'MP4 với codec H.264 kèm AAC là lựa chọn an toàn nhất. Một số trình duyệt xuất ra WebM, nên hãy đổi sang MP4 trước khi tải tệp về.',
          'Đặt tên tệp có tên bài hát và tỷ lệ, ví dụ Nguoi-Toi-Tro-Lai-9x16.mp4, để phân biệt các phiên bản cùng một bài.',
          'Ba phút video 9:16 ở chất lượng chuẩn thường ra tệp khoảng 150 MB. Nếu tệp nặng hơn 250 MB, hãy kiểm tra lại thiết lập xuất thay vì nén tay.',
        ],
      },
      { type: 'heading', text: 'Xử lý khi AI căn sai' },
      {
        type: 'paragraph',
        text: 'Không có mô hình nào căn đúng trên mọi bản thu. Lỗi phổ biến nhất là đoạn dạo đầu dài khiến hệ thống đoán câu đầu tiên sớm vài giây, phần hát trùng lặp ở đoạn điệp khúc khiến hai giọng chồng lên nhau, và các câu hát nhanh kiểu rap với hơn sáu âm tiết mỗi giây. May là cả ba đều sửa được bằng tay ngay trong cửa sổ Căn Khớp Sóng Âm.',
      },
      {
        type: 'list',
        items: [
          'Chữ sáng lên trước giọng hát: kéo ranh giới bắt đầu của từ đó sang phải, hoặc thu nhỏ phần đầu từ nếu từ đó bị kéo dài quá lâu.',
          'Cả câu lệch đều về sau một đến hai giây: chọn câu rồi dịch cả câu thay vì kéo từng từ một, việc này nhanh hơn nhiều.',
          'Câu bị nuốt mất trong đoạn hát trùng lặp: xoá câu thừa, giữ lại một câu và chỉnh lại thời điểm bắt đầu.',
          'Từ bị dính liền nhau: rút ngắn từ trước xuống còn 0,2–0,3 giây để lời kế tiếp có khoảng nghỉ đọc được.',
          'Câu cuối bị cắt mất: kéo điểm kết thúc về đúng lúc ngừng giọng, đừng để chữ chạy tới cuối tệp nhạc.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Nếu sửa tay trong giao diện vẫn chậm, hãy dùng nút Xuất LRC trong cửa sổ căn khớp. Tệp .lrc có mốc thời gian cho từng từ, bạn có thể mở bằng trình soạn lời khác để chỉnh trong khi nghe rồi dán lại vào dự án.',
      },
      { type: 'heading', text: 'Mẹo kiểm tra trước khi đăng' },
      {
        type: 'paragraph',
        text: 'Bước kiểm tra cuối chiếm chưa đầy một phút nhưng tránh được phần lớn lỗi bị chê. Hãy xem lại video trên chính điện thoại của bạn ở kích thước nhỏ và giảm độ sáng xuống khoảng một nửa, vì nhiều người xem lướt video trong điều kiện sáng mạnh hoặc ban đêm, và chữ tương phản thấp sẽ chết ngay ở điều kiện đó.',
      },
      {
        type: 'list',
        items: [
          'Kiểm tra dòng lời đầu tiên và dòng lời cuối: hai dòng này thường rơi vào vùng bị giao diện che nhiều nhất trên màn hình dọc.',
          'Đeo tai nghe nghe lại một lần. Ở mức tiếng vừa đủ để nghe lời, bạn sẽ nghe ra nhịp nhanh bị lệch mà mắt thường bỏ qua.',
          'Mở bản xem trước trên chính ứng dụng để thấy nút bấm và thanh tiến trình phủ lên vị trí chữ của bạn ra sao.',
          'Nhớ dấu watermark ở góc dưới bên phải nếu bạn đang dùng gói miễn phí, và đảm bảo nó không đè lên dòng lời thấp nhất.',
          'Ghi lại cùng lúc các thiết lập phiên bản: font, hiệu ứng, tỷ lệ, nguồn nhạc. Khi làm bài tương tự sau đó, bạn chỉ cần đổi từng thành phần trong ghi chú đó.',
        ],
      },
    ],
    faqs: [
      {
        q: 'AI có căn đúng với bài hát rap tốc độ cao không?',
        a: 'Ở mức đủ dùng: âm tiết thường bám đúng trong khoảng 0,1–0,2 giây. Với đoạn hát nhanh hơn sáu âm tiết mỗi giây, hoặc kỹ thuật nhấn giọng rõ, bạn vẫn cần mở Căn Khớp Sóng Âm để chỉnh tay các ranh giới từ.',
      },
      {
        q: 'Bài hát tiếng Anh có căn lời được không?',
        a: 'Được, hệ thống xử lý cả tiếng Anh. Với bài tiếng Anh, lợi thế lớn nhất là bạn tải được lời chính xác từ trang chính thức của nhạc sĩ rồi dán vào, nhờ đó mọi tên riêng và cách viết đều chuẩn hơn hẳn bản tự nhận diện.',
      },
      {
        q: 'Không có file lời bài hát thì có làm được không?',
        a: 'Làm được. Bạn vẫn chạy tách lời tự động rồi nghe sửa lại chính tả trong khung căn khớp. Điều kiện là những từ khó nghe sẽ phải kiểm tra thủ công nhiều hơn, đặc biệt ở tiếng Việt địa phương.',
      },
      {
        q: 'Video xuất ra có bị mất tiếng không?',
        a: 'Không, miễn bạn chọn MP4 vì tiếng được đóng gói cùng video bằng codec AAC. Nếu bản xuất ra WebM, một số nền tảng sẽ không nhận, nên hãy đổi định dạng trước khi tải tệp.',
      },
    ],
  },
  {
    slug: 'lyric-video-tiktok-youtube-kiem-tien',
    title: 'Lyric Video TikTok & YouTube: Quy Trình Làm Nhanh Cho Creator',
    description:
      'Quy trình sản xuất lyric video hàng loạt cho TikTok và YouTube: chọn bài nào đáng làm, dựng xong một video trong 15 phút, chọn khung giờ đăng và đọc số liệu từ YouTube Studio để biết video nào thực sự giữ chân người xem.',
    date: '2026-01-20',
    author: 'LyricStudio Team',
    category: 'Kiếm tiền',
    keywords: [
      'lyric video tiktok',
      'xây kênh nhạc youtube',
      'sản xuất video hàng loạt',
      'tăng thời gian xem',
      'chiến lược kênh nhạc',
    ],
    readingMinutes: 9,
    heroEmoji: '💰',
    blocks: [
      {
        type: 'paragraph',
        text: 'Làm được một video lyric video đẹp là chuyện kỹ thuật. Làm hàng chục video mà vẫn giữ được chất lượng đó mới là chuyện vận hành. Bài này tập trung vào phần vận hành: chọn bài nào, dựng theo quy trình nào, đăng lúc nào và đọc chỉ số nào để biết mình đang làm đúng hay sai.',
      },
      {
        type: 'paragraph',
        text: 'Định dạng này khác mọi dạng video khác ở hai điểm. Thứ nhất, thời lượng bị người xem quyết định chứ không bị thuật toán quyết định: họ tự bật và tự tắt. Thứ hai, cùng một bài hát có thể được nghe lại hàng chục lần bởi cùng một người, nên một video tốt có giá trị nhiều hơn con số lượt xem mà nó hiện ra. Đó là lý do chất lượng căn lời và phong cách nhất quán lại quan trọng hơn tốc độ đăng.',
      },
      { type: 'heading', text: 'Chọn bài nào để làm video' },
      {
        type: 'paragraph',
        text: 'Không phải bài nào cũng đáng làm. Bài ngắn dưới hai phút rất khó giữ chân vì người xem đã quen nghe trọn bài ở nơi khác. Bài dài trên bốn phút thì đa số người xem lướt đi trong khoảng 40 giây đầu. Bài lý tưởng là bài có giai điệu xuất hiện ngay trong 2–3 giây đầu và một đoạn điệp khúc nhớ được, vì đó là hai điểm người xem dùng để quyết định ở lại hay lướt tiếp.',
      },
      {
        type: 'list',
        items: [
          'Ưu tiên bài bạn đã nghe quen, hoặc bài đang có nhiều người tìm trong 30 ngày qua. Nhu cầu có sẵn giúp video của bạn không phải tự đi tìm lượt xem.',
          'Chọn bài mà lời rõ và ít la hát không nghe nổi, vì lời mờ khiến mọi lỗi căn đều bị phơi bày.',
          'Tránh bài có đoạn độc thoại dài ở đầu: người xem không biết mình đang xem gì trong 10 giây đầu và sẽ lướt.',
          'Kiểm tra quyền sử dụng trước khi làm. Đây là bước tiết kiệm thời gian nhất, vì một video bị gỡ thì toàn bộ công sức đã mất.',
          'Với nhạc điện tử, cân nhắc bản remix instrumental: thương hiệu nhạc cục bộ thường có độ trùng lặp thấp hơn bản gốc có lời.',
          'Sắp xếp một danh sách 30 bài trước khi ngồi dựng, vì thời gian chọn bài thường vượt quá thời gian dựng video.',
        ],
      },
      { type: 'heading', text: 'Quy trình sáu bước cho một video' },
      {
        type: 'paragraph',
        text: 'Sáu bước dưới đây được sắp theo thứ tự tiết kiệm thời gian nhất, kèm thời lượng ước tính để bạn dự phòng tổng thời gian cho một bài.',
      },
      {
        type: 'list',
        items: [
          'Bước 1 — Chuẩn bị tệp (2 phút): lấy bản thu sạch, kèm lời dạng văn bản nếu tìm được.',
          'Bước 2 — Tách lời và căn từ (3–5 phút): chạy AI, sau đó dành riêng hai phút kiểm tra câu đầu và câu cuối.',
          'Bước 3 — Chọn khung nền và bảng màu (2 phút): Teal & Orange cho nhạc nhẹ, Cyberpunk cho nhạc điện tử, Đen Trắng cho bolero.',
          'Bước 4 — Chọn font và hiệu ứng chữ (3 phút): một họ font, một hiệu ứng chuyển động, tối đa hai hiệu ứng nền.',
          'Bước 5 — Cân âm lượng và xuất (3–5 phút): hạ mức nhạc nền xuống khoảng 15–20% nếu giọng hát dày, rồi xuất MP4.',
          'Bước 6 — Viết mô tả và gắn thẻ (2 phút): một câu mô tả trung tính, tối đa năm thẻ, không nhồi từ khóa.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Khi đã làm bài đầu tiên và mọi thứ đã thuộc, sáu bước này thường xong trong 15 phút. Nguyên nhân khiến người mới mất 40 phút là không chuẩn bị lời trước, và chỉnh lại từng chữ ở tốc độ 1 lần thay vì 0,75 lần.',
      },
      { type: 'heading', text: 'Giữ chân người xem trong ba giây đầu' },
      {
        type: 'paragraph',
        text: 'Ba giây đầu quyết định phần còn lại của video. Trên TikTok, người xem đang dùng ngón tay lướt nên mọi thứ dừng lại phải có lý do rất rõ. Trên YouTube Shorts, cùng ba giây đó quyết định tỷ lệ xem tiếp, và tỷ lệ này lại được tính vào phần lớn chỉ số khác của video.',
      },
      {
        type: 'list',
        items: [
          'Cắt ngay vào khoảnh có giọng hát hoặc giai điệu chính. Không mở đầu bằng logo, bằng lời nhắn theo dõi, hay bằng hai giây màn hình đen.',
          'Hiện tên bài hát và tên ca sĩ ngay từ giây thứ nhất, ở phần trên của vùng an toàn.',
          'Với bài có chorus rất nổi tiếng, cân nhắc mở đầu bằng đoạn hook 15–20 giây rồi mới quay về phần mở bài.',
          'Không đặt hiệu ứng chuyển cảnh dài ở đầu video: hiệu ứng đẹp nhất cũng trông như độ trễ nếu nó xuất hiện ở ba giây đầu.',
          'Giữ khung hình động nhẹ. Video đứng yên trong lúc chờ lời hát thứ hai thường bị lướt.',
        ],
      },
      { type: 'heading', text: 'Đăng thời điểm nào' },
      {
        type: 'paragraph',
        text: 'Với khán giả Việt Nam, hai khung giờ hiệu quả nhất là 11h30–13h và 19h–22h theo giờ địa phương. TikTok đánh giá chỉ số ban đầu trong 1–2 giờ đầu rồi mới quyết định mức đẩy, nên đăng lúc 7 giờ sáng cho bài nhiều người nghe lúc đi làm thường bị đánh giá thấp dù chất lượng tốt.',
      },
      {
        type: 'list',
        items: [
          'Hẹn giờ đăng trước 30 phút để còn cơ hội hủy nếu bản xem trước có vấn đề.',
          'Trên YouTube, nhịp phân phối chậm hơn: video vẫn tăng lượt xem sau 48 giờ, nên đừng kết luận thất bại sau một giờ.',
          'Không đăng hai video cùng lúc trên cùng một kênh, vì lượt xem đầu tiên của chúng sẽ chia nhau.',
          'Đăng 3–5 video mỗi tuần ổn định hơn việc dồn mười video rồi im lặng cả tháng.',
          'Với bài nhiều lượt xem dài, cân nhắc làm thêm một phiên bản 20–30 giây chỉ gồm chorus và đăng sang kênh khác.',
        ],
      },
      { type: 'heading', text: 'Đo hiệu quả bằng chỉ số nào' },
      {
        type: 'paragraph',
        text: 'Đừng đánh giá bằng cảm giác. YouTube Studio cho bạn đường cong giữ chân theo từng phần trăm của video, còn TikTok cho bạn thời lượng xem trung bình và tỷ lệ xem hết. Hai bộ số này nói cho bạn biết vấn đề nằm ở đầu video hay ở giữa video, để bạn sửa đúng chỗ thay vì làm lại từ đầu.',
      },
      {
        type: 'list',
        items: [
          'Thời lượng xem trung bình thấp hơn 35% chiều dài video: vấn đề nằm ở ba giây đầu hoặc ở tốc độ lời hát.',
          'Tỷ lệ xem hết trên 50% với bài ba phút là kết quả tốt; dưới 25% nghĩa là cấu trúc video chưa giữ được người xem.',
          'Số lần hiển thị trên YouTube mà không ai bấm vào thường là do tiêu đề và ảnh xem trước, không phải do video. Sửa hai thứ đó hiệu quả hơn sửa lại video.',
          'Nếu đường cong giữ chân tụt mạnh ở một thời điểm cụ thể, hãy xem lại từ hát tại giây đó; đó gần như luôn là chỗ căn sai.',
          'So sánh mỗi video với chính video trước đó của bạn, không so với kênh khác, vì mỗi thể loại cần một chuẩn riêng.',
          'Ghi bốn con số này vào một bảng tính sau mỗi lần đăng; sau 20 video bạn sẽ thấy quy luật riêng của kênh mình.',
        ],
      },
      { type: 'heading', text: 'Mở rộng kênh mà không thành nội dung lặp' },
      {
        type: 'paragraph',
        text: 'Nguy cơ lớn nhất khi làm hàng loạt là bị xếp vào nhóm nội dung trùng lặp, khiến video không đạt điều kiện kiếm tiền dù lượt xem vẫn tăng đều. Năm 2025 YouTube siết lại tiêu chuẩn này: những video chỉ khác nhau ở vài giây đầu hoặc chỉ đổi nền được coi là nội dung lặp lại. Cách an toàn là để mỗi video có phần mở đầu và phần kết do bạn tự làm.',
      },
      {
        type: 'list',
        items: [
          'Mỗi video có hai đến ba giây intro riêng: tên bài hát, ca sĩ và tên kênh hiện bằng đồ họa của bạn.',
          'Đổi nhịp thị giác theo thể loại: bài bolero dùng nền tối giản với chữ Playfair, bài dance dùng Beat Bounce với bộ lọc Cyberpunk.',
          'Tạo playlist theo chủ đề và ghi chú chính xác từng bài để kéo dài thời gian xem của cả nhóm.',
          'Không cắt ghép video của kênh khác rồi thêm chữ của bạn, vì đó là cách mất quyền kiếm tiền nhanh nhất.',
          'Giữ riêng từng nhóm tỷ lệ xuất: một bản cho Shorts và TikTok, một bản 16:9 cho YouTube, xuất từ dự án chứ không crop bản đã xuất.',
          'Ghi nguồn nhạc trong phần mô tả. Ngoài chuyện pháp lý, đây cũng là cách duy nhất để bạn biết video nào đang dùng nguồn nào khi cần thay nhạc.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Một ngày nên đăng mấy video lyric video?',
        a: 'Với người mới bắt đầu, ba video mỗi tuần vào ba ngày cố định tạo nhịp đều cho thuật toán. Tần suất quan trọng hơn số lượng: đăng dồn mười video rồi nghỉ cả tháng thường cho kết quả kém hơn đăng đều hàng tuần.',
      },
      {
        q: 'Có nên đăng cùng một nội dung ở cả TikTok và YouTube không?',
        a: 'Có, và đây là cách tận dụng một công sức làm thành hai nơi. Nhưng nên xuất riêng hai tỷ lệ từ dự án thay vì crop bản đã xuất, vì chữ sẽ bị cắt hoặc nhỏ đi ở tỷ lệ không gốc.',
      },
      {
        q: 'Video lyric video có bị tính là nội dung lặp lại không?',
        a: 'Có thể, nếu các video của bạn chỉ khác nhau ở vài giây đầu hoặc chỉ đổi màu nền. Hãy cho mỗi video một phần mở đầu và phần kết riêng, đồng thời thay đổi phong cách theo thể loại để nội dung thực sự khác nhau.',
      },
      {
        q: 'Bao lâu thì một video bắt đầu có lượt xem ổn định?',
        a: 'Với nhạc không nổi tiếng, đa số video cần 3–6 tháng để bắt đầu có lượt xem đều từ phần tìm kiếm và phần gợi ý. Trong hai tuần đầu, hãy đánh giá bằng tỷ lệ xem hết thay vì đếm lượt xem.',
      },
    ],
  },
  {
    slug: 'can-khop-song-am-cho-lyric-video',
    title: 'Căn Khớp Sóng Âm (Forced Alignment): Bí Quyết Chữ Chạy Đúng Nhịp',
    description:
      'Tìm hiểu kỹ thuật căn khớp sóng âm (forced alignment) giúp chữ trong lyric video chạy khớp chính xác từng từ theo giọng hát, kèm mẹo xử lý các đoạn nhạc dạo, ngắt hơi và rap nhanh.',
    date: '2026-02-02',
    author: 'LyricStudio Team',
    category: 'Kỹ thuật nâng cao',
    keywords: [
      'căn khớp sóng âm',
      'forced alignment lyric video',
      'đồng bộ lời bài hát',
      'karaoke chạy chữ',
      'word level timing',
    ],
    readingMinutes: 9,
    heroEmoji: '🌊',
    blocks: [
      {
        type: 'paragraph',
        text: 'Chữ chạy lệch nửa giây nghe rõ hơn thì bị cắt, hát sai nốt. Với nhạc có lời, cảm giác sai luôn dễ nhận ra hơn cảm giác đúng, và người xem không cần biết nguyên nhân để khẳng định rằng video của bạn làm hỏng bài hát. Vì vậy phần lớn thời gian chỉnh sửa nên dồn vào giai đoạn căn lời, trước khi nghĩ tới màu sắc và bố cục.',
      },
      {
        type: 'paragraph',
        text: 'Căn khớp sóng âm — trong tài liệu kỹ thuật gọi là forced alignment — là bước gắn mốc thời gian bắt đầu và kết thúc cho từng từ trong lời, dựa trên chính tín hiệu âm thanh. Nó khác hẳn tách lời: tách lời trả lời câu hát gì, còn căn khớp trả lời từ này bắt đầu lúc nào và kéo dài bao lâu. Chỉ khi có điểm bắt đầu và kết thúc cho từng từ thì hiệu ứng karaoke vuốt màu mới chạy đúng.',
      },
      { type: 'heading', text: 'Vì sao chia đều theo giây luôn bị lệch' },
      {
        type: 'paragraph',
        text: 'Cách nhanh nhất để thấy vấn đề là làm một phép tính. Giả sử lời bài hát dài 90 giây với khoảng 60 từ, thì chia đều cho mỗi từ 1,5 giây. Nhưng ca sĩ không hát đều: đoạn verse thường có nhịp ba đến bốn từ mỗi giây, còn đoạn dạo đầu chỉ khoảng một đến hai từ mỗi giây. Chênh lệch tích luỹ theo từng từ, và đến đoạn điệp khúc thì chữ đã trễ tám đến mười hai giây so với giọng hát.',
      },
      {
        type: 'paragraph',
        text: 'Sai lệch của phép chia đều không tự triệt tiêu. Phần trễ ở đoạn hát nhanh không bù được phần sớm ở đoạn hát chậm, và người xem không đợi được mười hai giây đó. Ngưỡng nhận biết nằm quanh 40 mili giây, tức khoảng một khung hình ở 25 fps, nhưng khi bạn xem ở tốc độ 1,5 lần thì sai lệch dưới 100 mili giây vẫn tạo cảm giác lệch.',
      },
      {
        type: 'list',
        items: [
          'Sai 50–100 ms: người xem không nhận ra khi xem bình thường, nhưng thấy chưa khớp khi tua chậm.',
          'Sai 150–300 ms: sai rõ nếu bật hiệu ứng karaoke, vì lớp màu sáng chạy trước giọng hát.',
          'Sai trên 500 ms: lộ liễu, người xem đọc lời trước rồi mới nghe giọng, cảm giác như video bị tua lệch.',
          'Sai trên một giây ở đoạn chuyển câu: thường do mốc của cả câu bị đặt lệch, không phải do từng từ bên trong.',
        ],
      },
      { type: 'heading', text: 'AI nghe được gì trong một bản thu' },
      {
        type: 'paragraph',
        text: 'Mô hình căn không nghe như người nghe. Nó dựa vào ba loại tín hiệu: bao hình năng lượng để biết lúc nào có tiếng, đường bao phủ tần số để phân biệt nguyên âm với phụ âm, và độ dốc của sóng để xác định vị trí bắt đầu âm tiết. Nhờ vậy nó căn được cả những bài lời không rõ, nhưng vẫn có những điểm yếu cố hữu mà bạn nên biết trước.',
      },
      {
        type: 'list',
        items: [
          'Hát trùng lặp ở đoạn điệp khúc: hai giọng chồng lên nhau làm vị trí bắt đầu âm tiết bị mờ; hãy làm mờ một lớp trước khi căn.',
          'Dư âm do bản thu lấy từ loa diện: tiếng vọng kéo dài 150–200 ms sau mỗi câu khiến mô hình tưởng lời còn tiếp diễn.',
          'Kỹ thuật nhấn giọng vào chữ t, p, s: đỉnh năng lượng xuất hiện trước âm tiết thật, nên chữ thường sáng sớm hơn 100–150 ms.',
          'Đoạn rap bảy âm tiết mỗi giây hoặc nhanh hơn: hai âm tiết có thể chồng lên nhau và mô hình thường gộp thành một từ.',
          'Bản thu có dư âm do kéo dài: kéo dài vocal thêm 1–2 giây ở cuối sẽ làm mốc của câu cuối chính xác hơn hẳn việc sửa tay.',
        ],
      },
      { type: 'heading', text: 'Quy trình căn chuẩn từng câu' },
      {
        type: 'paragraph',
        text: 'Trình tự dưới đây được sắp để giảm số lần phải nghe lại, vì mỗi lần nghe toàn bài bài tốn thời gian hơn nhiều so với việc sửa đúng một đoạn.',
      },
      {
        type: 'list',
        items: [
          'Bước 1 — Dán lời chính xác. Lời đúng là điều kiện tiên quyết: một lỗi chính tả sẽ được mô hình sửa thành một mốc thời gian sai và kéo theo cả các từ phía sau.',
          'Bước 2 — Chạy căn tự động rồi đừng vội nghe. Chuyển sang cửa sổ Căn Khớp Sóng Âm và thu nhỏ dải thời gian về mức 1x để nhìn toàn cả bài.',
          'Bước 3 — Đánh dấu ba vị trí nghi vấn: đầu bài, chỗ chuyển từ verse sang điệp khúc, và câu cuối. Đây là ba nơi chiếm phần lớn lỗi trong thực tế.',
          'Bước 4 — Phóng to tới 15x ở các câu nghi vấn để kéo từng ranh giới từ. Ở mức phóng này, một mili giây trên dải thời gian đã là một bước nhảy nhỏ.',
          'Bước 5 — Dùng Lặp Câu Đang Chọn để nghe riêng một câu, lặp liên tục cho tới khi bạn nghe đúng khoảng năm lần thì đầu óc mới nhớ được nhịp.',
          'Bước 6 — Bật hiệu ứng karaoke và nghe lại một lượt mà không nhìn màn hình. Nếu bạn đoán trước được câu hát, mốc thời gian của bạn đã đúng.',
        ],
      },
      { type: 'heading', text: 'Sửa khi lời bị trễ hoặc sớm' },
      {
        type: 'paragraph',
        text: 'Sai lệch luôn có một hướng, và bạn chỉ cần nhớ hướng đó. Nếu lớp màu karaoke chạy sau giọng hát, chữ đang bị trễ và bạn kéo ranh giới sang bên trái. Nếu màu chạy trước giọng hát, chữ đang bị sớm và bạn kéo sang phải. Kéo từng từ riêng lẻ thay vì kéo cả câu, vì kéo cả câu dễ làm lệch những từ vốn đang đúng.',
      },
      {
        type: 'list',
        items: [
          'Từ bị trễ: kéo điểm bắt đầu sang trái, giữ nguyên điểm kết thúc trừ khi từ đó bị kéo dài quá 0,8 giây.',
          'Từ bị sớm: kéo cả điểm bắt đầu lẫn điểm kết thúc sang phải, nếu không từ sẽ bị cắt mất phần đuôi âm.',
          'Hai từ dính liền nhau: rút ngắn từ trước xuống còn 0,15–0,25 giây để tạo khoảng nghỉ giữa hai từ.',
          'Một từ bị kéo dài quá: đó thường là từ nối bị mô hình nuốt vào từ trước, hãy tách từ ra và đặt lại riêng.',
          'Nghe sai một từ nhưng thời gian vẫn đúng: đây là lỗi chính tả, sửa ở ô lời thay vì sửa thời gian.',
        ],
      },
      { type: 'heading', text: 'Xử lý đoạn dạo đầu và đoạn nghỉ giữa bài' },
      {
        type: 'paragraph',
        text: 'Đoạn dạo đầu là nơi hệ thống hay sai nhất, vì không có giọng hát nào để bám vào. Thay vì để mô hình đoán, hãy tự xác định: đếm số nhịp trống của câu đầu tiên bằng cách gõ đầu ngón tay vào bàn theo tiếng trống, rồi đặt mốc bắt đầu của từ đầu tiên ngay sau nhịp trống đó. Cách làm thủ công này chính xác hơn nhiều so với việc nghe đoán.',
      },
      {
        type: 'paragraph',
        text: 'Ở đoạn nghỉ dài giữa bài, hãy giữ lại đuôi của từ cuối cùng đang hát thay vì cắt tức thời, vì dư âm của nguyên âm dài khoảng 200–300 ms và chữ biến mất sớm sẽ thấy rõ. Ngược lại, ở đoạn kết có tiếng fade dài, hãy kết thúc từ cuối đúng lúc giọng hát dừng thay vì để chữ chạy hết cả đoạn outro nhạc.',
      },
      {
        type: 'list',
        items: [
          'Dạo đầu dưới 5 giây: thường an toàn, hệ thống nhận diện được vào đúng chỗ.',
          'Dạo đầu 10–30 giây: hãy tự đặt mốc bắt đầu cho từ đầu tiên thay vì tin kết quả tự động.',
          'Dạo đầu có tiếng gió, tiếng đàn hoặc giọng nói nền: lớp tiếng này dễ bị nhận thành lời hát; hãy căn trên bản đã lọc bớt nhạc nền rồi ghép tiếng sau.',
          'Nghỉ giữa bài 2–5 giây: không cần xoá dòng lời, chỉ cần kéo điểm kết thúc của từ cuối cho hết đuôi âm.',
          'Kết bài bằng tiếng vỗ tay: dừng chữ ngay sau từ cuối, kéo dài thêm sẽ tạo cảm giác chữ bị kẹt.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Tôi có cần chuẩn bị lời bài hát không?',
        a: 'Nên có. Khi có lời dạng văn bản, hệ thống căn theo văn bản thay vì tự nhận diện, nên chính tả và mốc thời gian đều chuẩn hơn rõ rệt. Nếu không có, bạn vẫn chạy được, nhưng nên nghe sửa lại toàn bộ lời ngay sau khi căn.',
      },
      {
        q: 'Sai bao nhiêu mili giây thì chấp nhận được?',
        a: 'Dưới khoảng 40 mili giây thì người xem không nhận ra. Mốc tiêu chuẩn mà chúng tôi dùng khi kiểm tra là không quá 100 mili giây với kiểu chữ có hiệu ứng karaoke, và không quá 200 mili giây với kiểu chỉ sáng cả câu.',
      },
      {
        q: 'Có cách nào lấy mốc thời gian ra bên ngoài không?',
        a: 'Có. Nút Xuất LRC trong cửa sổ Căn Khớp Sóng Âm tạo tệp .lrc có mốc thời gian cho từng từ, bạn dùng để kiểm tra bằng phần mềm khác hoặc nhập lại dự án sau này.',
      },
      {
        q: 'Bài hát có tiếng đàn và giọng hát chồng lên nhau thì căn được không?',
        a: 'Được, nhưng cần xử lý trước. Hãy làm mờ hoặc cắt phần nhạc nền, căn trên phần giọng hát cho đến khi mốc thời gian ổn định, rồi mới ghép nhạc nền trở lại. Căn trực tiếp trên bản hòa trộn cho kết quả kém hơn rõ rệt.',
      },
    ],
  },
  {
    slug: 'toi-uu-video-9-16-cho-shorts-tiktok',
    title: 'Tối Ưu Video 9:16 Cho TikTok & YouTube Shorts: Kích Thước, Font, An Toàn',
    description:
      'Hướng dẫn tối ưu video dọc 9:16 cho TikTok, Reels và YouTube Shorts: độ phân giải, vùng an toàn (safe zone), lựa chọn font chữ và cách đặt lời bài hát để không bị UI che.',
    date: '2026-02-10',
    author: 'LyricStudio Team',
    category: 'Kỹ thuật nâng cao',
    keywords: [
      'video 9:16',
      'tối ưu tiktok shorts',
      'kích thước video dọc',
      'safe zone tiktok',
      'font chữ lyric video',
    ],
    readingMinutes: 8,
    heroEmoji: '📱',
    blocks: [
      {
        type: 'paragraph',
        text: 'Một video dọc có thể đúng tỷ lệ 9:16, đúng độ phân giải và vẫn bị xem là video dở, vì phần chữ quan trọng nhất bị nút bấm, dòng tên tài khoản và phụ đề tự động che mất. Mất thông tin như vậy, người xem không hiểu mình đang xem gì và lướt tiếp trong vài giây. Phần lớn việc tối ưu 9:16 thực chất là dành chỗ an toàn cho giao diện của từng nền tảng.',
      },
      {
        type: 'paragraph',
        text: 'Bài này đưa ra con số cụ thể cho khung hình 1080 × 1920. Khi bạn biết chính xác vùng nào bị chiếm, bạn sẽ đặt chữ một lần và không phải xuất lại nhiều lần chỉ để sửa một dòng bị che.',
      },
      { type: 'heading', text: 'Vùng an toàn chữ trên từng nền tảng' },
      {
        type: 'paragraph',
        text: 'Khung hình 1080 × 1920 của bạn bị khá nhiều lớp giao diện phủ lên. Tính từ mép trên xuống, hãy dành khoảng 190 pixel cho thanh tìm kiếm và các nút ngang, khoảng 100 pixel cho ở chốt nội dung hoặc thanh tiến trình ở đáy, và khoảng 90 pixel mỗi bên cho cột tương tác dọc bên phải. Tính ra, vùng thoáng để đặt lời nằm trong khoảng 300 pixel đến 1560 pixel tính từ trên xuống.',
      },
      {
        type: 'list',
        items: [
          'TikTok: cột nút bấm bên phải chiếm khoảng 6–8% chiều rộng, còn tên tài khoản và mô tả chiếm khoảng 15–20% chiều cao phía dưới.',
          'YouTube Shorts: thanh tiêu đề chiếm khoảng 12–15% chiều cao dưới cùng và có thể mở rộng thành hai dòng trên điện thoại.',
          'Instagram Reels: phần caption và hàng nút tương tác chiếm khoảng 20% chiều cao phía dưới, cao hơn TikTok một chút.',
          'Bản xem trước trong ứng dụng có thêm nút toàn màn hình ở góc phải, nên đừng đặt chữ quan trọng sát mép phải.',
          'Với chữ chạy dạng karaoke, hãy tính thêm chiều cao của chính dòng chữ, vì dòng thứ ba trong khung hình thường rơi vào vùng bị che nhiều nhất.',
          'Dành riêng góc dưới bên trái cho logo kênh, vì góc dưới bên phải là nơi thường xuất hiện nút chia sẻ và dấu watermark.',
        ],
      },
      { type: 'heading', text: 'Kích thước và tỷ lệ khung hình' },
      {
        type: 'paragraph',
        text: 'Studio hỗ trợ bốn tỷ lệ: 9:16 nhận 1080 × 1920, 16:9 nhận 1920 × 1080, 1:1 nhận 1080 × 1080 và 4:5 nhận 1080 × 1350. Chọn 9:16 khi đăng TikTok, Reels và Shorts; chọn 4:5 khi đăng bài lên bảng tin Instagram, nơi khung 1:1 sẽ bị cắt mất ở hai bên; chọn 16:9 khi làm bản chính cho YouTube.',
      },
      {
        type: 'paragraph',
        text: 'Đừng nâng kích thước một video đã xuất. Nếu bạn đang có bản 720p và muốn đăng bản 1080p, hãy xuất lại từ dự án với khung hình 1080 × 1920 ngay từ đầu. Nội dung phóng to từ 720p lên 1080p sẽ mờ đúng phần chữ quan trọng nhất, và người xem nhận ra chuyện đó trước khi đọc hết câu.',
      },
      {
        type: 'list',
        items: [
          'Định dạng MP4 với H.264 và AAC là lựa chọn phổ quát nhất cho cả bốn nền tảng.',
          'Ba mươi khung hình mỗi giây là đủ cho chữ chạy theo giọng hát; sáu mươi khung hình chỉ đáng dùng khi có hiệu ứng chuyển động chậm, và nó làm dung lượng tăng gần gấp đôi.',
          'Một video ba phút ở 1080p thường nặng khoảng 140–180 MB. Nếu cần gửi qua Zalo hoặc email, hãy xuất bản chất lượng thấp hơn thay vì nén tay.',
          'Giữ nguyên tỷ lệ khi cắt video bằng phần mềm khác. Cắt đi một hay hai pixel cũng đủ để nền tảng nén lại và làm chữ méo.',
          'Khi đăng cùng nội dung lên nhiều nơi, hãy xuất riêng từng tỷ lệ từ dự án thay vì cắt từ một bản đã xuất.',
        ],
      },
      { type: 'heading', text: 'Cỡ chữ theo thiết bị' },
      {
        type: 'paragraph',
        text: 'Cách ổn định nhất là đo chữ theo chiều cao khung hình chứ không theo pixel cụ thể. Với khung cao 1920 pixel, dòng lời chính nên cao khoảng 4,5–5% chiều cao, tức 86–96 pixel; tiêu đề bài hát nên ở khoảng 6–7%, tức 115–134 pixel; dòng chữ phụ như tên ca sĩ nên ở khoảng 3%, tức 56–60 pixel. Ba mức này cho phép ba đến bốn từ trên một dòng mà vẫn đọc được trên màn hình nhỏ.',
      },
      {
        type: 'paragraph',
        text: 'Khi xem trên điện thoại, khoảng cách mắt tới màn hình thường là 30–35 centimet và người xem không tinh ý lắm khi phải đọc chữ nhỏ. Đó là lý do chữ thuôn hay chữ mảnh trông sang trên màn hình máy tính lại thành một vệt mờ trên điện thoại. Với tiếng Việt có nhiều dấu, hãy chọn font đậm và bật viền 2–3 pixel.',
      },
      {
        type: 'list',
        items: [
          'Bật viền hoặc bóng khi nền là ảnh; nếu nền là gradient tối thì bóng đen mờ khoảng 30% là đủ.',
          'Giới hạn hai dòng chữ mỗi lần, vì dòng thứ ba trở đi thường bị đẩy xuống vùng bị che.',
          'Không đặt chữ trắng trên nền trắng hoặc vàng nhạt; chuyển sang chữ đen hoặc thêm một lớp tối phía sau.',
          'Khi chạy karaoke, hãy đặt cả dòng ở giữa theo chiều ngang và đặt khoảng cách dòng bằng 1,4 đến 1,6 lần cỡ chữ để dấu tiếng Việt không dính vào dòng trên.',
          'Kiểm tra trên một chiếc điện thoại có màn hình nhỏ, giảm độ sáng còn khoảng một nửa, trước khi kết luận cỡ chữ của bạn đã đủ lớn.',
        ],
      },
      { type: 'heading', text: 'Giữ chữ không bị caption và giao diện che' },
      {
        type: 'paragraph',
        text: 'Vị trí an toàn nhất cho dòng lời chính là khoảng 48–58% chiều cao khung hình, tức vùng từ 920 đến 1110 pixel tính từ trên xuống trên khung 1920 pixel. Nếu bạn đặt lời ở khoảng 70% chiều cao như nhiều video dọng, nó sẽ nằm ngay vùng phụ đề tự động của TikTok và phần caption của Reels.',
      },
      {
        type: 'list',
        items: [
          'Bật lưới phân vùng trong trình soạn thảo, hoặc tạm đặt một khung hình màu trong suốt làm mốc trước khi xuất.',
          'Đặt tiêu đề bài hát ở khoảng 12–18% chiều cao, cách mép trên tối thiểu 200 pixel.',
          'Nếu có logo kênh, đặt ở góc dưới bên trái và thu nhỏ dưới 5% chiều rộng để nó không tranh chỗ với lời hát.',
          'Dùng đệm nền tối mờ phía sau dòng chữ khi nền là ảnh chuyển động có vùng sáng bất ngờ.',
          'Giữ dòng chữ ở cùng một độ cao qua các đoạn chuyển câu, để mắt người xem không phải tìm lại mỗi lần nhịp đổi.',
        ],
      },
      { type: 'heading', text: 'Kiểm tra trước khi đăng' },
      {
        type: 'paragraph',
        text: 'Bước kiểm tra cuối nên diễn ra trên chính thiết bị sẽ xem video, không phải trong trình soạn thảo, vì màn hình máy tính lớn hơn nhiều và làm mọi lỗi an toàn biến mất. Hãy tải bản xuất lại điện thoại, mở bằng trình phát thông thường và xem ở chế độ toàn màn hình.',
      },
      {
        type: 'list',
        items: [
          'Bật chú thích phụ đề tự động trong ứng dụng để thấy lớp chữ đó chồng lên vị trí nào của dòng lời của bạn.',
          'Xem khung hình đầu tiên có đủ thông tin chưa: chữ và hình nền phải xuất hiện ngay, không có khoảng đen ở đầu video.',
          'Kiểm tra mức âm lượng nhạc, vì mức bạn nghe trong trình soạn thảo thường lớn hơn thực tế trên điện thoại và người xem sẽ không nghe rõ lời.',
          'Xem lại dòng đầu và dòng cuối bằng mắt thường, vì hai dòng này thường rơi vào vùng bị che nặng nhất trên khung dọc.',
          'Chỉ nên đăng bản không watermark lên kênh đã đủ điều kiện kiếm tiền; trên kênh mới thì bản có dấu vẫn dùng để thử định dạng.',
          'Kiểm tra tỷ lệ xem sau 24 giờ thay vì sau 15 phút, vì nền tảng đang phân phối thử video trong hai giờ đầu.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Shorts hiện nay còn giới hạn 60 giây không?',
        a: 'Không còn giới hạn 60 giây từ năm 2024, Shorts chấp nhận video dài tới khoảng ba phút. Nhưng độ dài không phải yếu tố quyết định: tỷ lệ xem hết vẫn giảm dần theo thời lượng, nên điểm nhấn phải nằm ở ba giây đầu.',
      },
      {
        q: 'Nên xuất 30 hay 60 khung hình mỗi giây?',
        a: 'Với lyric video chữ chạy theo giọng hát, ba mươi khung hình mỗi giây là đủ và nhẹ hơn nhiều. Chỉ chọn sáu mươi khi bạn dùng hiệu ứng chuyển động chậm như Ken Burns kết hợp hiệu ứng làm mờ, vì khi đó tệp lớn gần gấp đôi.',
      },
      {
        q: 'Có thể xuất một bản rồi cắt cho nhiều nền tảng không?',
        a: 'Không nên cắt tay. Tỷ lệ gốc quyết định cỡ chữ tương đối và vị trí an toàn, nên bản cắt từ 16:9 sang 9:16 sẽ mất chữ ở hai bên và rơi sai vùng an toàn. Hãy xuất riêng từng tỷ lệ ngay trong dự án.',
      },
      {
        q: 'Watermark trong video có ảnh hưởng tới thuật toán không?',
        a: 'Watermark không làm giảm lượt xem, nhưng nó chiếm chỗ ở góc dưới bên phải, đúng vị trí dễ bị đẩy xuống vùng bị che khi bạn căn chữ thấp. Với kênh đã đủ điều kiện, hãy dùng bản không watermark để dành toàn bộ khung hình cho lời hát.',
      },
    ],
  },
  {
    slug: 'ban-quyen-nhac-khi-lam-video',
    title: 'Bản Quyền Nhạc Khi Làm Video Lyric: Những Điều Cần Biết',
    description:
      'Hiểu đúng về bản quyền âm nhạc khi làm lyric video: nhạc royalty-free, giấy phép sử dụng, gậy bản quyền trên YouTube và cách chọn nguồn nhạc an toàn để kiếm tiền hợp pháp.',
    date: '2026-02-18',
    author: 'LyricStudio Team',
    category: 'Kiếm tiền',
    keywords: [
      'bản quyền nhạc',
      'nhạc royalty free',
      'gậy bản quyền youtube',
      'giấy phép âm nhạc',
      'làm video hợp pháp',
    ],
    readingMinutes: 10,
    heroEmoji: '⚖️',
    blocks: [
      {
        type: 'paragraph',
        text: 'Bản quyền âm nhạc là lý do phổ biến nhất khiến một kênh làm lyric video biến mất. Video dùng nguyên bản gốc nên chứa toàn bộ bản thu âm, và hệ thống nhận dạng nội dung của các hãng đĩa sẽ khớp ngay cả khi bạn chỉ dùng hai mươi giây. Hậu quả cũng khác nhau tùy nền tảng: ở một nơi chỉ mất doanh thu trên video đó, ở nơi khác là mất tài khoản.',
      },
      {
        type: 'paragraph',
        text: 'Điều khiến nhiều người hiểu sai là chỉ cần trả tiền một lần là xong. Thực tế mỗi bản ghi có hai quyền tách biệt: quyền đối với bản thu âm, thuộc về hãng đĩa hoặc nghệ sĩ biểu diễn, và quyền đối với tác phẩm, thuộc về tác giả lời và nhạc. Để đăng một video có nhạc nền kèm lời hiển thị, bạn thường cần cả hai quyền, và mỗi quyền có thời hạn lại khác nhau.',
      },
      { type: 'heading', text: 'Ba loại nguồn nhạc và rủi ro pháp lý' },
      {
        type: 'paragraph',
        text: 'Khoảng cách rủi ro giữa ba loại nguồn rất lớn, nên đáng dành mười phút kiểm tra xem mình đang đứng ở đâu trước khi bắt đầu dựng.',
      },
      {
        type: 'list',
        items: [
          'Bản thu phát hành thương mại từ dịch vụ nghe nhạc, nhạc tải về từ trang phát nhạc, hoặc bản thu có trong kho YouTube: rủi ro cao nhất, vì hệ thống nhận dạng khớp gần như tuyệt đối và đối tác phát hành thường đăng ký bảo hộ cả nội dung lẫn bản ghi.',
          'Thư viện nhạc kèm giấy phép thương mại: rủi ro thấp nếu giấy phép nói rõ cho phép dùng trong video có doanh thu và trên mạng xã hội. Rủi ro nằm ở chỗ người dùng hay bỏ qua điều khoản riêng cho nền tảng.',
          'Bản thu bạn tự quay, nguồn nhạc công cộng và tác phẩm thuộc phạm vi công cộng: rủi ro thấp nhất, với điều kiện bạn giữ được bằng chứng về nguồn gốc tệp âm thanh.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Có một hiểu lầm phổ biến là làm karaoke thì không phải sao chép. Thực tế, dùng nguyên bản ghi rồi cộng thêm lớp lời hiển thị vẫn là sử dụng bản thu âm của người khác, và đó là hành vi được các hãng đĩa đăng ký bảo hộ. Ranh giới thực tế nằm ở chỗ bạn có được phép công khai về quyền sử dụng hay không, chứ không nằm ở việc bạn có thêm lớp hình ảnh hay không.',
      },
      { type: 'heading', text: 'Nhạc công cộng và các giấy phép thực sự mở' },
      {
        type: 'paragraph',
        text: 'Nhãn nhạc công cộng không phải một loại giấy phép duy nhất, và sự khác biệt giữa các loại quyết định video của bạn có được gắn quảng cáo hay không. Loại phổ biến nhất là CC0: ai cũng dùng được, thương mại, không cần ghi nguồn. CC-BY yêu cầu ghi tên tác giả trong phần mô tả. CC-BY-NC cấm mọi mục đích thương mại, và ở đây mục đích thương mại bao gồm cả việc video mang về tiền cho bạn.',
      },
      {
        type: 'paragraph',
        text: 'Khi dùng bất kỳ nguồn nào, hãy lưu bằng chứng ngay tại thời điểm tải về: ảnh chụp trang điều khoản, tên kho, tên tác giả, số ghi tệp và ngày tải. Khi có khiếu nại, tài liệu này thường là thứ quyết định kết quả, và việc tìm lại sau sáu tháng là việc rất dễ thất.',
      },
      {
        type: 'list',
        items: [
          'Đọc mục giấy phép, đừng chỉ đọc mô tả sản phẩm. Nhiều kho dùng cùng một nhãn nhưng thêm điều khoản riêng cho từng bản thu.',
          'Kiểm tra giới hạn về nền tảng: một số giấy phép cho phép dùng trên YouTube nhưng không cho phép trên TikTok.',
          'Kiểm tra giới hạn số lần tải hoặc số kênh được dùng; mua thêm một kho riêng cho kênh thứ hai là cách đơn giản để tránh vi phạm.',
          'Với thư viện nhạc của chính nền tảng, hãy dùng bộ lọc cho phép dùng thương mại và không yêu cầu ghi nguồn, rồi đọc lại điều khoản của từng bản thu.',
          'Ghi nguồn ngay cả khi giấy phép không yêu cầu: tên tác giả và nguồn trong phần mô tả vừa là thói quen tốt, vừa giúp bạn tránh tranh chấp về tính gốc của nội dung.',
        ],
      },
      { type: 'heading', text: 'Bản thu âm của chính bạn' },
      {
        type: 'paragraph',
        text: 'Nếu bạn tự thu âm bài hát của chính mình, bạn sở hữu bản thu, nhưng chưa chắc sở hữu tác phẩm. Viết cả lời lẫn giai điệu thì bạn đang giữ cả hai quyền và không cần xin phép ai. Hát bài của người khác thì vẫn cần quyền của tác giả đối với tác phẩm, và bản thu mới tạo ra chỉ thuộc về bạn chứ không thay thế được quyền đó.',
      },
      {
        type: 'paragraph',
        text: 'Sau khi thu, hãy giữ lại hóa đơn thuê phòng thu, hợp đồng với nhạc công và bản ghi thô trước khi xử lý. Một tài liệu cho thấy bạn đã chi trả và có bản ghi gốc là câu trả lời rất mạnh khi ai đó khiếu nại về video của bạn.',
      },
      {
        type: 'list',
        items: [
          'Bạn thuê nhạc công: hãy ghi rõ trong hợp đồng quyền sử dụng, vì tác phẩm âm nhạc có tối đa 25 tác giả và trường hợp phức tạp phải có xác nhận của toàn bộ.',
          'Bạn thu tại nhà: chú ý chất lượng thu, vì tiếng ù và đỉnh bị cắt ảnh hưởng trực tiếp tới chất lượng căn lời sau này.',
          'Bạn dùng bản thu có đánh dấu của hãng đĩa: đây vẫn là bản của hãng, và họ có quyền đăng ký bảo hộ nội dung trên chính bản thu đó.',
          'Bạn hợp tác với nghệ sĩ khác: hãy viết thỏa thuận bằng văn bản ghi rõ tên tác phẩm, thời gian và phạm vi sử dụng.',
        ],
      },
      { type: 'heading', text: 'Đăng ký bảo hộ tác phẩm để tự chứng minh' },
      {
        type: 'paragraph',
        text: 'Video lyric video là một tác phẩm phái sinh của bạn: bạn đã chọn hình ảnh, bố trí chữ, đồng bộ thời gian và tạo ra diện mạo riêng. Tuy vậy, khi có tranh chấp, bạn thường phải chứng minh mình sớm hơn đối thủ. Lưu giữ bằng chứng tạo vật dễ hơn nhiều so với tranh luận.',
      },
      {
        type: 'list',
        items: [
          'Gửi tệp lưu trữ hoặc đăng ký lưu dự trữ theo quy định để có dấu thời gian xác nhận độc lập cho tác phẩm.',
          'Đăng ký bảo hộ tại Cục Bản quyền tác giả khi bạn định dùng tác phẩm trong thương mại hoặc khi giá trị của nó lớn.',
          'Lưu tệp dự án cùng tệp video đã xuất và ghi lại ngày xuất. Hai tệp cùng tên đặt cạnh nhau là bằng chứng về quy trình tạo tác phẩm.',
          'Giữ hợp đồng và hóa đơn trong một thư mục riêng theo từng dự án, không lưu lẫn lộn trong thư mục tải về.',
        ],
      },
      { type: 'heading', text: 'Khi nào nên mua giấy phép nhạc' },
      {
        type: 'paragraph',
        text: 'Mua giấy phép là hợp lý khi giá trị của kênh lớn hơn chi phí giấy phép, hoặc khi bạn đang nhắm vào một thương hiệu có rủi ro cao. Với kênh nhỏ, thường có lợi hơn nếu chuyển sang nhạc công cộng hoặc nhạc tự thu trong giai đoạn đầu, rồi dồn ngân sách vào sản xuất và chất lượng nội dung.',
      },
      {
        type: 'list',
        items: [
          'Cân nhắc chi phí theo từng video: giá một giấy phép phát hành có thể cao hơn nhiều lần giá thuê nhạc công cộng cho cả đời dự án.',
          'Nếu chỉ cần giải quyết một bài, hãy tìm giấy phép cho bản thu âm đó thay vì mua cả thư viện.',
          'Với nhạc điện tử không lời, bản instrumental thường dễ cấp phép hơn và an toàn hơn với hệ thống nhận dạng nội dung.',
          'Với nội dung hợp tác thương mại, hãy ghi rõ quyền sử dụng trong hợp đồng, vì khách hàng thường yêu cầu bằng chứng quyền từ nhà cung cấp.',
          'Đừng dùng giấy phép có điều khoản cấm dùng cho nội dung do AI tạo ra nếu giấy phép ghi rõ điều kiện đó.',
        ],
      },
      { type: 'heading', text: 'Xử lý khi nhận thông báo vi phạm' },
      {
        type: 'paragraph',
        text: 'Việc đầu tiên là phân biệt khiếu nại với cảnh cáo. Khiếu nại chỉ chuyển hướng doanh thu sang chủ sở hữu bản quyền, tài khoản của bạn vẫn an toàn. Cảnh cáo là một lần vi phạm có ghi vào hồ sơ, và ba lần vi phạm trong 90 ngày thì kênh bị đóng. Hãy đọc kỹ loại thông báo trước khi hành động.',
      },
      {
        type: 'paragraph',
        text: 'Nếu video của bạn dùng nhạc hợp pháp và nền tảng nhận nhầm, hãy khiếu nại kèm bằng chứng: bản thu âm của bạn, giấy phép, hóa đơn, hoặc ảnh chụp trang xác nhận quyền. Khiếu nại có bằng chứng cụ thể thường được chấp thuận với tỷ lệ cao hơn nhiều so với lời khẳng định chung chung.',
      },
      {
        type: 'list',
        items: [
          'Không xóa video ngay khi nhận khiếu nại, vì video đã xóa sẽ không được khôi phục và mất luôn lượt xem đã tích lũy.',
          'Ghi lại thông tin từng lần: tên nội dung khớp, thời điểm nhận, số tiền bị chuyển hướng và kết quả khiếu nại.',
          'Nếu khiếu nại là do chính bạn dùng nhạc sai quyền, hãy thay toàn bộ âm thanh rồi xuất lại thay vì cố khiếu nại.',
          'Nếu bạn nghi ngờ nhận nhầm do nền tảng, hãy gửi khiếu nại ở kênh chính thức của hệ thống nhận dạng nội dung tương ứng và lưu lại mã khiếu nại.',
          'Sau mỗi lần xử lý, hãy rà lại toàn bộ video cũ của kênh, vì một bài sai có thể kéo theo nhiều video khác cùng nguồn nhạc.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Nhạc royalty-free có dùng để kiếm tiền trên video được không?',
        a: 'Phụ thuộc vào điều khoản của từng nguồn. Nhãn miễn phí không có nghĩa là không giới hạn: nhiều giấy phép cấm mục đích thương mại, và mục đích thương mại bao gồm cả việc video có gắn quảng cáo. Hãy tìm câu nói về mục đích thương mại trước khi tải về.',
      },
      {
        q: 'Làm karaoke bài hát có cần xin phép không?',
        a: 'Có. Sử dụng nguyên bản thu âm và hiển thị lời vẫn là dùng lại bản ghi của người khác, và đó là hành vi thường bị đăng ký bảo hộ. Nếu là nhạc của chính bạn thì không cần, nhưng bạn vẫn phải giữ bản gốc và chứng từ thuê nhạc công.',
      },
      {
        q: 'Công cụ có phát hiện bản quyền giúp tôi không?',
        a: 'Không. LyricStudio AI xử lý hình ảnh và thời gian chạy chữ, không có bước kiểm tra bản quyền nội dung âm nhạc. Bạn chịu trách nhiệm về tệp âm thanh tải lên và nên tự giữ bằng chứng quyền sử dụng cho từng tệp.',
      },
      {
        q: 'Tôi nên làm gì khi không tìm được bằng chứng quyền?',
        a: 'Đừng đăng video đó. Chi phí thay bằng một bản thu hoặc một kho nhạc công cộng luôn thấp hơn chi phí mất kênh, và thấp hơn nhiều so với bỏ tiền thuê tư vấn pháp lý để xử lý một việc có thể tránh.',
      },
    ],
  },
];