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
    readingMinutes: 7,
    heroEmoji: '🎬',
    blocks: [
      {
        type: 'paragraph',
        text: 'Lyric video — video chạy chữ theo lời bài hát — là một trong những định dạng nội dung giữ chân người xem tốt nhất hiện nay. Người xem thường nghe hết bài, thậm chí phát lại nhiều lần, giúp thời lượng xem (watch time) tăng cao. Đó là lý do các kênh nhạc, kênh chill và kênh karaoke tận dụng định dạng này để kiếm tiền từ Google AdSense và YouTube.',
      },
      {
        type: 'paragraph',
        text: 'Trước đây để làm một lyric video, bạn cần phần mềm dựng phim phức tạp và hàng giờ gõ mốc thời gian thủ công. Với LyricStudio AI, toàn bộ quy trình được rút gọn còn vài cú nhấp chuột nhờ trí tuệ nhân tạo Gemini phân tích giọng hát và tự động căn khớp từng từ.',
      },
      { type: 'heading', text: 'Yêu cầu chuẩn bị' },
      {
        type: 'list',
        items: [
          'Một tệp âm thanh (MP3, WAV, M4A) của bài hát bạn có quyền sử dụng.',
          'Lời bài hát dạng văn bản (không bắt buộc, nhưng giúp AI căn khớp chính xác hơn).',
          'Một tài khoản Google và trình duyệt Chrome/Edge mới nhất.',
        ],
      },
      { type: 'heading', text: '5 bước tạo lyric video bằng AI' },
      {
        type: 'list',
        items: [
          'Bước 1 — Tải nhạc: Mở Studio, bấm nút "Tải Nhạc" và chọn tệp âm thanh của bạn.',
          'Bước 2 — Tách lời tự động: AI phân tích giọng ca sĩ, nhận diện văn bản tiếng Việt và tạo mốc thời gian cho từng câu.',
          'Bước 3 — Căn khớp sóng âm: Mở công cụ "Căn Khớp Sóng Âm" để vi chỉnh từng từ khớp với dốc sóng cao độ.',
          'Bước 4 — Thiết kế: Chọn font chữ nghệ thuật, hiệu ứng kinetic typography, màu nền và tỷ lệ khung hình.',
          'Bước 5 — Xuất video: Chọn 9:16 cho TikTok/Reels hoặc 16:9 cho YouTube rồi tải về dưới dạng MP4.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Mẹo: hãy để dư khoảng 1–2 giây ở đầu video khi nhạc chưa vào để tạo nhịp thở, và luôn kiểm tra mốc thời gian của câu hát đầu tiên vì nhiều bài có đoạn nhạc dạo dài khiến AI dễ đoán sai điểm bắt đầu.',
      },
    ],
    faqs: [
      {
        q: 'Tôi có cần biết dựng phim không?',
        a: 'Không. LyricStudio AI xử lý toàn bộ khâu tách lời và căn khớp, bạn chỉ cần chọn phong cách và xuất video.',
      },
      {
        q: 'Video xuất ra ở định dạng nào?',
        a: 'Video được xuất dưới dạng MP4 chuẩn H.264/AAC, tương thích với YouTube, TikTok, Facebook và Instagram.',
      },
    ],
  },
  {
    slug: 'lyric-video-tiktok-youtube-kiem-tien',
    title: 'Lyric Video TikTok & YouTube: Cách Kiếm Tiền Bền Vững Với AdSense',
    description:
      'Chiến lược xây kênh nhạc bằng lyric video để tăng watch time, đạt ngưỡng kiếm tiền YouTube và tối ưu doanh thu quảng cáo Google AdSense một cách bền vững.',
    date: '2026-01-20',
    author: 'LyricStudio Team',
    category: 'Kiếm tiền',
    keywords: [
      'kiếm tiền youtube lyric video',
      'google adsense kênh nhạc',
      'tối ưu rpm adsense',
      'tăng watch time',
      'xây kênh nhạc',
    ],
    readingMinutes: 8,
    heroEmoji: '💰',
    blocks: [
      {
        type: 'paragraph',
        text: 'Lyric video có một lợi thế kinh tế đặc biệt: chi phí sản xuất gần như bằng không nhưng thời lượng xem lại rất cao. Trong mô hình quảng cáo, doanh thu tỷ lệ thuận với số lượt hiển thị quảng cáo và thời lượng xem, nên định dạng này có RPM (doanh thu trên 1.000 lượt xem) khá tốt nếu bạn tối ưu đúng cách.',
      },
      { type: 'heading', text: 'Vì sao lyric video hợp với kiếm tiền quảng cáo?' },
      {
        type: 'list',
        items: [
          'Người xem có xu hướng xem hết bài hát nên tỷ lệ hoàn thành cao.',
          'Nhiều người bật nhạc nền khi học tập hoặc làm việc, tạo lượt xem dài.',
          'Nội dung dễ sản xuất hàng loạt theo playlist, chủ đề, mùa lễ hội.',
        ],
      },
      { type: 'heading', text: '3 cách tối ưu doanh thu' },
      {
        type: 'list',
        items: [
          'Chọn chủ đề có nhu cầu cao như nhạc chill, lofi, karaoke bolero, nhạc thiếu nhi — nhóm khán giả xem lặp lại nhiều.',
          'Tối ưu tiêu đề, mô tả và thẻ (tag) theo từ khóa tìm kiếm để tăng lưu lượng organic thay vì chỉ phụ thuộc đề xuất.',
          'Xuất bản đều đặn để thuật toán đề xuất phân phối nội dung ổn định, tránh dồn quá nhiều video một lúc.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Với website công cụ như LyricStudio AI, bạn còn có thêm một nguồn thu: đặt quảng cáo AdSense ngay trên trang công cụ. Người dùng ở lại lâu để chỉnh sửa, tạo nhiều lượt hiển thị quảng cáo hơn so với một trang blog thông thường.',
      },
      { type: 'heading', text: 'Lưu ý quan trọng về bản quyền' },
      {
        type: 'paragraph',
        text: 'Chỉ đăng tải bài hát mà bạn sở hữu hoặc có giấy phép sử dụng. Sử dụng nhạc không bản quyền (royalty-free) hoặc nhạc bạn tự sáng tác để tránh bị gậy bản quyền, mất doanh thu và nguy cơ khóa kênh.',
      },
    ],
    faqs: [
      {
        q: 'Bao lâu thì kênh nhạc của tôi kiếm được tiền?',
        a: 'Thời gian phụ thuộc vào tần suất đăng và mức độ phù hợp của nội dung. Điều quan trọng là duy trì nội dung gốc, chất lượng và tuân thủ chính sách nền tảng.',
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
    readingMinutes: 6,
    heroEmoji: '🌊',
    blocks: [
      {
        type: 'paragraph',
        text: 'Căn khớp sóng âm (forced alignment) là kỹ thuật gán mốc thời gian chính xác cho từng từ trong lời bài hát dựa trên tín hiệu âm thanh. Nếu mốc thời gian lệch dù chỉ nửa giây, người xem sẽ cảm thấy chữ "trật nhịp" và trải nghiệm giảm mạnh.',
      },
      { type: 'heading', text: 'Vì sao cần căn khớp ở cấp độ từ?' },
      {
        type: 'list',
        items: [
          'Hiệu ứng karaoke sáng từng chữ cần biết chính xác thời điểm bắt đầu và kết thúc của mỗi từ.',
          'Chữ phóng to/đổi màu theo nhịp (beat) chỉ đẹp khi khớp với điểm nhấn giọng hát.',
          'Rap và nhạc nhanh có mật độ từ cao, sai lệch nhỏ sẽ dồn thành lệch lớn.',
        ],
      },
      { type: 'heading', text: 'Quy trình căn khớp chuẩn' },
      {
        type: 'list',
        items: [
          'Đưa lời bài hát dạng văn bản vào Studio để AI có văn bản tham chiếu, giảm sai sót nhận diện.',
          'Xác định đúng thời điểm giọng hát bắt đầu, bỏ qua đoạn nhạc dạo dài.',
          'Dùng công cụ Căn Khớp Sóng Âm kéo biên từng từ vào dốc sóng cao độ (đỉnh sóng là lúc ca sĩ lên giọng).',
          'Nghe thử vài lần ở các đoạn chuyển tiếp giữa verse và chorus — đây là nơi lỗi tập trung nhiều nhất.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Nhờ LyricStudio AI tự động sinh mốc thời gian ở cấp độ từ, bạn chỉ cần vi chỉnh những chỗ khó thay vì gõ tay toàn bộ bài. Công cụ này đặc biệt hiệu quả với nhạc có lời rõ ràng và nhịp phách đều.',
      },
    ],
    faqs: [
      {
        q: 'Forced alignment khác gì với tách lời thông thường?',
        a: 'Tách lời chỉ cho bạn văn bản, còn forced alignment cho bạn mốc thời gian của từng từ gắn với tín hiệu âm thanh.',
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
    readingMinutes: 6,
    heroEmoji: '📱',
    blocks: [
      {
        type: 'paragraph',
        text: 'Video dọc 9:16 là chuẩn mực cho TikTok, Instagram Reels và YouTube Shorts. Tuy nhiên mỗi nền tảng đều phủ các nút bấm, tên tài khoản và mô tả lên video, tạo thành các "vùng cấm" (safe zone) mà nội dung của bạn không nên chạm vào.',
      },
      { type: 'heading', text: 'Thông số khuyến nghị' },
      {
        type: 'list',
        items: [
          'Độ phân giải: 1080 x 1920 pixel (tỷ lệ 9:16), khung hình 30fps là đủ cho lyric video.',
          'Định dạng: MP4 (H.264 + AAC) để tương thích mọi nền tảng.',
          'Vùng an toàn: chừa khoảng 12% chiều cao ở cạnh trên và 20% ở cạnh dưới cho UI.',
          'Lời bài hát: đặt ở khoảng 55–70% chiều cao để vừa tầm mắt, tránh bị che.',
        ],
      },
      { type: 'heading', text: 'Chọn font chữ dễ đọc trên mobile' },
      {
        type: 'list',
        items: [
          'Ưu tiên font có độ tương phản cao, nét đậm vừa phải như Montserrat, Bebas Neue hoặc Space Grotesk.',
          'Tránh font quá mảnh hoặc quá cầu kỳ khi chữ chạy nhanh trên màn hình nhỏ.',
          'Thêm viền hoặc bóng chữ (text stroke/shadow) để chữ nổi trên nền ảnh phức tạp.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Trong LyricStudio AI bạn có thể chọn tỷ lệ 9:16 ngay trên thanh công cụ, xem trước chính xác vùng hiển thị và xuất file MP4 đúng chuẩn. Việc kiểm tra trước bằng trình xem trước giúp bạn tiết kiệm nhiều lần đăng lại.',
      },
    ],
    faqs: [
      {
        q: 'Có nên làm video dài hơn 60 giây cho Shorts không?',
        a: 'Shorts hiện hỗ trợ video dài, nhưng nên đặt điểm nhấn cao trào trong 3 giây đầu để giữ chân người xem.',
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
    readingMinutes: 7,
    heroEmoji: '⚖️',
    blocks: [
      {
        type: 'paragraph',
        text: 'Bản quyền là rào cản lớn nhất khi kiếm tiền từ kênh nhạc. Nhiều nhà sáng tạo làm lyric video bằng nhạc của người khác và đối mặt với gậy bản quyền (copyright claim), mất toàn bộ doanh thu hoặc bị chặn video.',
      },
      { type: 'heading', text: 'Các loại quyền cần lưu ý' },
      {
        type: 'list',
        items: [
          'Quyền ghi âm (master): thuộc về hãng đĩa hoặc nghệ sĩ biểu diễn bản thu đó.',
          'Quyền tác phẩm (composition): thuộc về nhạc sĩ viết bài hát.',
          'Để đăng video hợp pháp, bạn thường cần cả hai loại quyền.',
        ],
      },
      { type: 'heading', text: 'Nguồn nhạc an toàn để kiếm tiền' },
      {
        type: 'list',
        items: [
          'Nhạc royalty-free có giấy phép thương mại rõ ràng (đọc kỹ điều khoản cho phép kiếm tiền).',
          'Nhạc do bạn tự sáng tác và tự thu âm — bạn sở hữu toàn bộ quyền.',
          'Nhạc trong thư viện âm thanh chính thức của nền tảng (có kèm điều kiện sử dụng).',
        ],
      },
      {
        type: 'paragraph',
        text: 'Nguyên tắc vàng: chỉ đăng tải nội dung bạn có quyền sử dụng. LyricStudio AI là công cụ hỗ trợ sản xuất video, không cung cấp hoặc cấp phép nội dung âm nhạc. Người dùng chịu trách nhiệm về quyền đối với tệp âm thanh mình tải lên.',
      },
    ],
    faqs: [
      {
        q: 'Nhạc royalty-free có được kiếm tiền không?',
        a: 'Phần lớn giấy phép royalty-free cho phép dùng thương mại, nhưng mỗi nguồn có điều khoản khác nhau — hãy đọc kỹ trước khi dùng.',
      },
      {
        q: 'LyricStudio AI có cấp quyền cho bài hát tôi tải lên không?',
        a: 'Không. Công cụ chỉ xử lý video; bạn phải tự đảm bảo quyền sử dụng tệp âm thanh của mình.',
      },
    ],
  },
];