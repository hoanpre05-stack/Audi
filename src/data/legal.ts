export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export interface LegalPage {
  slug: string;
  title: string;
  description: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

/** `{contactEmail}` is replaced with CONTACT_EMAIL at render time. */
export const LEGAL_PAGES: LegalPage[] = [
  {
    slug: 'privacy',
    title: 'Chính sách bảo mật',
    description: 'Chính sách bảo mật của LyricStudio AI: dữ liệu chúng tôi thu thập, cookie quảng cáo Google AdSense và quyền của bạn.',
    updated: '18/02/2026',
    intro:
      'LyricStudio AI là công cụ tạo lyric video. Chúng tôi thu thập lượng thông tin tối thiểu cần thiết để vận hành công cụ.',
    sections: [
      {
        heading: '1. Thông tin chúng tôi thu thập',
        paragraphs: [
          'Tệp âm thanh bạn tải lên chỉ được xử lý để phân tích lời và căn khớp thời gian, không được lưu trữ lâu dài cho mục đích khác.',
        ],
        list: [
          'Dữ liệu kỹ thuật: loại trình duyệt, thiết bị và địa chỉ IP đã ẩn danh hóa bằng mã băm.',
          'Tài khoản: nếu bạn đăng nhập bằng Google, chúng tôi lưu email, tên và ảnh đại diện của tài khoản Google đó.',
          'Nội dung bạn chủ động gửi: tin nhắn qua trang Liên hệ.',
        ],
      },
      {
        heading: '2. Cách chúng tôi sử dụng thông tin',
        list: [
          'Vận hành và cải thiện công cụ tạo video.',
          'Hiển thị quảng cáo để duy trì dịch vụ miễn phí.',
          'Phản hồi yêu cầu hỗ trợ bạn gửi tới chúng tôi.',
        ],
      },
      {
        heading: '3. Cookie quảng cáo Google AdSense và DoubleClick',
        paragraphs: [
          'Trang web này hiển thị quảng cáo của Google AdSense. Google và các đối tác quảng cáo có thể dùng cookie để phục vụ quảng cáo dựa trên lần truy cập trước đó của bạn vào trang này hoặc các trang khác.',
          'Chúng tôi áp dụng Google Consent Mode v2: cookie quảng cáo chỉ được dùng sau khi bạn bấm "Đồng ý tất cả" trong thông báo cookie.',
        ],
      },
      {
        heading: '4. Cookie của bên thứ ba',
        list: [
          'Google AdSense / DoubleClick: đo lường và cá nhân hóa quảng cáo.',
          'Google Analytics (nếu được bật): thống kê lưu lượng truy cập ẩn danh.',
          'Supabase: lưu trữ tài khoản và trạng thái gói thành viên.',
        ],
      },
      {
        heading: '5. Quyền của bạn',
        list: [
          'Từ chối hoặc rút lại sự đồng ý cookie bất kỳ lúc nào.',
          'Yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân đã cung cấp.',
          'Gửi yêu cầu liên quan quyền riêng tư tới email bên dưới.',
        ],
      },
      {
        heading: '6. Trẻ em',
        paragraphs: [
          'Dịch vụ không hướng tới trẻ em dưới 13 tuổi và chúng tôi không cố ý thu thập dữ liệu cá nhân của trẻ em.',
        ],
      },
      {
        heading: '7. Liên hệ',
        paragraphs: [
          'Mọi yêu cầu về quyền riêng tư, gửi về {contactEmail}.',
        ],
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Điều khoản sử dụng',
    description: 'Điều khoản sử dụng LyricStudio AI, gồm quyền về nội dung, bản quyền âm thanh và gói thành viên Pro.',
    updated: '18/02/2026',
    intro:
      'Bằng việc sử dụng LyricStudio AI, bạn đồng ý với các điều khoản dưới đây.',
    sections: [
      {
        heading: '1. Trách nhiệm về nội dung',
        list: [
          'Bạn chỉ được tải lên tệp âm thanh mà bạn có quyền sử dụng.',
          'Bạn chịu trách nhiệm hoàn toàn về bản quyền lời bài hát, bản thu âm và hình ảnh bạn sử dụng.',
          'Chúng tôi có quyền gỡ bỏ nội dung vi phạm hoặc bị khiếu nại bản quyền.',
        ],
      },
      {
        heading: '2. Gói miễn phí và gói Pro',
        list: [
          'Gói miễn phí: 3 lượt xử lý AI mỗi ngày, xuất 720p kèm watermark.',
          'Gói Pro: 50 lượt AI mỗi ngày, xuất 1080p không watermark, không quảng cáo.',
          'Gói Pro không tự động gia hạn. Mỗi lần thanh toán cộng thêm 30 ngày (gói tháng) hoặc 365 ngày (gói năm) kể từ ngày đang còn hiệu lực.',
          'Thanh toán qua PayOS. Thời điểm kích hoạt là khi hệ thống xác nhận giao dịch thành công.',
        ],
      },
      {
        heading: '3. Giới hạn sử dụng',
        paragraphs: [
          'Chúng tôi có thể tạm thời giới hạn số lượt xử lý AI khi hệ thống quá tải để bảo vệ chất lượng dịch vụ chung.',
        ],
      },
      {
        heading: '4. Liên hệ',
        paragraphs: ['Gửi câu hỏi về điều khoản tới {contactEmail}.'],
      },
    ],
  },
  {
    slug: 'about',
    title: 'Giới thiệu về LyricStudio AI',
    description: 'LyricStudio AI là công cụ tạo lyric video bằng trí tuệ nhân tạng dành cho nhà sáng tạo nội dung Việt Nam.',
    updated: '18/02/2026',
    intro:
      'LyricStudio AI biến quy trình làm lyric video — vốn tốn nhiều thời gian và công cụ phức tạp — thành một trải nghiệm nhanh chóng và dễ dùng.',
    sections: [
      {
        heading: 'Chúng tôi giải quyết vấn đề gì',
        paragraphs: [
          'Trước đây, căn lời hát theo từng từ đòi hỏi người làm video gõ mốc thời gian thủ công, mỗi bài mất hàng giờ. LyricStudio AI dùng trí tuệ nhân tạng để nhận diện giọng hát và sinh mốc thời gian ở cấp độ từ trong vài phút.',
        ],
      },
      {
        heading: 'Dành cho ai',
        list: [
          'Nhạc sĩ độc lập cần video lyric nhanh cho bản phát hành.',
          'Kênh nhạc chill, karaoke và nội dung thư giãn.',
          'Người làm nội dung TikTok, Reels và YouTube Shorts cần video dọc 9:16.',
        ],
      },
      {
        heading: 'Cách chúng tôi kiếm tiền',
        paragraphs: [
          'Công cụ có gói miễn phí. Doanh thu đến từ quảng cáo Google AdSense trên trang nội dung và từ gói Pro dành cho người dùng cần chất lượng xuất cao hơn.',
        ],
      },
      {
        heading: 'Liên hệ',
        paragraphs: ['Bạn có thể liên hệ chúng tôi tại {contactEmail}.'],
      },
    ],
  },
  {
    slug: 'contact',
    title: 'Liên hệ',
    description: 'Liên hệ với đội ngũ LyricStudio AI để được hỗ trợ, báo lỗi hoặc hợp tác.',
    updated: '18/02/2026',
    intro: 'Bạn có câu hỏi, góp ý hoặc muốn báo lỗi? Gửi cho chúng tôi, chúng tôi phản hồi trong 2 ngày làm việc.',
    sections: [
      {
        heading: 'Email',
        paragraphs: [
          'Gửi mọi yêu cầu tới {contactEmail}. Khi liên hệ, vui lòng cho biết bạn đang dùng gói miễn phí hay Pro và gặp lỗi ở bước nào.',
        ],
      },
      {
        heading: 'Khiếu nại bản quyền',
        paragraphs: [
          'Nếu bạn là chủ sở hữu nội dung và thấy nội dung của mình bị sử dụng trái phép, gửi thông báo tới {contactEmail} kèm bằng chứng sở hữu. Chúng tôi sẽ phản hồi trong 5 ngày làm việc.',
        ],
      },
    ],
  },
];