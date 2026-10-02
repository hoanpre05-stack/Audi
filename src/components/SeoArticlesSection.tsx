import React, { useEffect } from 'react';
import { BookOpen, HelpCircle, CheckCircle, Flame, Sparkles } from 'lucide-react';

export const SeoArticlesSection: React.FC = () => {
  // Inject structured JSON-LD data into head for advanced Google SEO snippet rendering
  useEffect(() => {
    const existingScript = document.getElementById('seo-structured-data');
    if (existingScript) return;

    const script = document.createElement('script');
    script.id = 'seo-structured-data';
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      'name': 'LyricStudio AI',
      'applicationCategory': 'MultimediaApplication',
      'operatingSystem': 'All',
      'browserRequirements': 'Requires JavaScript and HTML5 Canvas',
      'description': 'Phần mềm tự động tạo video lyric, tách nhạc beat bằng trí tuệ nhân tạo Gemini 3.5 Flash Lite và căn khớp sóng âm tự động cực chuẩn.',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'VND',
      },
      'featureList': [
        'Tách lời bài hát bằng AI chuyên nghiệp',
        'Căn khớp sóng âm forced alignment tự động',
        'Xuất video chất lượng cao MP4',
        'Thiết kế kinetic typography chuyển động nghệ thuật',
      ],
    });
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('seo-structured-data');
      if (scriptToRemove) {
        document.head.removeChild(scriptToRemove);
      }
    };
  }, []);

  return (
    <section className="w-full mt-10 p-6 sm:p-8 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl backdrop-blur-md">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header section with rich keywords */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cổng Thông Tin Kiến Thức & Hướng Dẫn SEO</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Cách Làm Video Lyric Triệu View Trên TikTok Với Trí Tuệ Nhân Tạo AI
          </h2>
          <p className="text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Khám phá quy trình tự động hóa sản xuất video âm nhạc kinetic typography chuyên nghiệp,
            giúp bạn xây dựng kênh YouTube và TikTok hiệu quả, gia tăng doanh thu thụ động từ Google AdSense.
          </p>
        </div>

        {/* Informational article cards with clear keyword density */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-zinc-950/60 rounded-2xl border border-zinc-800/60 space-y-3 hover:border-zinc-700/60 transition">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-zinc-200">
              1. Tại sao Video Lyric là mỏ vàng kiếm tiền thụ động?
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Video lyric luôn có thời lượng giữ chân người dùng cực cao vì họ thường xem hết bài hát,
              thậm chí phát đi phát lại nhiều lần. Thời lượng xem (Watch Time) cao chính là yếu tố vàng
              giúp thuật toán đề xuất ưu ái, đẩy kênh lên xu hướng nhanh chóng và mang lại dòng tiền quảng cáo khổng lồ.
            </p>
          </div>

          <div className="p-5 bg-zinc-950/60 rounded-2xl border border-zinc-800/60 space-y-3 hover:border-zinc-700/60 transition">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-zinc-200">
              2. Forced Alignment là gì?
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Là công nghệ so khớp sóng âm giữa văn bản lời bài hát và giọng hát thực tế.
              Thay vì mất hàng giờ ngồi cắt ghép, căn chỉnh từng giây, thuật toán thông minh sẽ tự động phân tích
              biên độ, tần số âm thanh để định vị chính xác thời điểm phát ra âm tiết, đem lại sự ăn khớp mượt mà hoàn hảo.
            </p>
          </div>
        </div>

        {/* Step-by-step HowTo guide card */}
        <div className="p-6 bg-gradient-to-r from-purple-950/35 via-rose-950/35 to-zinc-950/80 rounded-3xl border border-rose-500/20 space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-rose-400" />
            <span>Quy Trình 3 Bước Xuất Bản Lyric Video Chuẩn SEO</span>
          </h3>

          <ol className="space-y-4 text-xs text-zinc-300">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 font-bold">1</span>
              <div>
                <p className="font-semibold text-zinc-100">Phân Tích & Tách Lời Bằng Gemini 3.5 Flash Lite</p>
                <p className="text-zinc-400 mt-1">
                  Tải lên tệp âm thanh (MP3, WAV) của bài hát. AI thông minh sẽ phân tích giọng ca sỹ,
                  tự động nhận diện văn bản tiếng Việt và phân vùng các mốc thời gian cơ bản của câu hát.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 font-bold">2</span>
              <div>
                <p className="font-semibold text-zinc-100">Vi Chỉnh Khớp Chữ Với Sóng Âm Trực Quan</p>
                <p className="text-zinc-400 mt-1">
                  Mở công cụ <strong>Căn Khớp Sóng Âm (Forced Alignment)</strong>. Kéo thả các đường biên của từ
                  vào đúng các dốc sóng cao độ hiển thị trên biểu đồ để chữ chạy sáng mượt mà, hòa quyện theo từng nhịp lấy hơi.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 font-bold">3</span>
              <div>
                <p className="font-semibold text-zinc-100">Thiết Kế Độc Bản & Xuất Bản Video Đa Nền Tảng</p>
                <p className="text-zinc-400 mt-1">
                  Chọn phông chữ nghệ thuật nghệ thuật, thêm các hạt bụi bụi lung linh, xuất video tỷ lệ 9:16
                  dành cho Shorts, TikTok hoặc 16:9 cho YouTube để tiếp cận tệp khán giả không giới hạn.
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* FAQs section to increase keyword optimization for AdSense crawler */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            <span>Các Câu Hỏi Thường Gặp (FAQs)</span>
          </h4>

          <div className="space-y-3">
            {[
              {
                q: 'Làm thế nào để được duyệt kiếm tiền Google AdSense cho website này?',
                a: 'Google AdSense yêu cầu trang web phải có lưu lượng truy cập tốt và chứa nội dung văn bản hữu ích (như phần bài viết SEO này). Bạn chỉ cần gắn mã AdSense vào cài đặt của trang, duy trì chia sẻ các bài viết chia sẻ nhạc hoặc hướng dẫn làm video để vượt qua vòng duyệt kiểm duyệt của Google dễ dàng.',
              },
              {
                q: 'Làm sao để chèn quảng cáo tự động (Auto Ads)?',
                a: 'Chỉ cần kích hoạt tính năng Auto Ads trong tài khoản Google AdSense của bạn, sau đó sao chép mã Ad Client dán vào cài đặt AdSense của LyricStudio AI. Hệ thống sẽ tự động phân bổ quảng cáo ở các khe trống một cách tự nhiên nhất.',
              },
            ].map((faq, index) => (
              <div key={index} className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800/50 space-y-1">
                <p className="font-bold text-xs text-zinc-200">Q: {faq.q}</p>
                <p className="text-xs text-zinc-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
