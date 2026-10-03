export interface FaqItem {
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  {
    q: 'LyricStudio AI có miễn phí không?',
    a: 'Có. Gói miễn phí cho phép bạn tạo lyric video mỗi ngày với 3 lượt xử lý bằng AI, xuất video 720p kèm watermark nhỏ ở góc khung hình. Bản Pro bỏ watermark, nâng lên 1080p và tắt quảng cáo.',
  },
  {
    q: 'Tôi cần biết dựng phim không?',
    a: 'Không. Bạn tải tệp âm thanh lên, AI tự nhận diện lời hát và sinh mốc thời gian theo từng câu. Sau đó bạn chọn font chữ, hiệu ứng chuyển động và xuất video.',
  },
  {
    q: 'AI hỗ trợ những định dạng âm thanh nào?',
    a: 'MP3, WAV và M4A đều được hỗ trợ. Nếu bạn đã có sẵn lời bài hát dạng văn bản, hãy dán vào để AI căn lời chính xác hơn.',
  },
  {
    q: 'Video xuất ra được dùng ở đâu?',
    a: 'Bạn chọn tỷ lệ 9:16 cho TikTok, Reels và Shorts, 16:9 cho YouTube, hoặc 1:1 cho Instagram. Video xuất ở dạng MP4 (H.264 + AAC) để đăng trực tiếp lên các nền tảng này.',
  },
  {
    q: 'Tôi có được xuất video không có watermark không?',
    a: 'Bản Pro xuất 1080p không watermark. Gói miễn phí luôn có watermark LyricStudio AI ở góc dưới bên phải của khung hình.',
  },
  {
    q: 'Tệp âm thanh của tôi có được lưu lại không?',
    a: 'Không lưu lâu dài. Tệp chỉ được xử lý tạm để phân tích lời và căn thời gian rồi bị xóa khỏi bộ nhớ xử lý. Bạn nên xóa bản gốc sau khi tạo xong video.',
  },
  {
    q: 'Tôi được dùng nhạc của người khác không?',
    a: 'Chỉ dùng tệp âm thanh mà bạn có quyền sử dụng: bản thu âm của chính bạn, nhạc công cộng, hoặc nhạc có giấy phép. Bạn chịu trách nhiệm về nội dung tải lên, xem Điều khoản sử dụng.',
  },
  {
    q: 'Mỗi ngày được dùng AI bao nhiêu lần?',
    a: 'Gói miễn phí có 3 lượt mỗi ngày, tính lại lúc 00:00 giờ Việt Nam. Gói Pro có 50 lượt mỗi ngày để dùng công cụ AI và xuất video không giới hạn watermark.',
  },
];

export function faqJsonLd(items: FaqItem[] = FAQS): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}