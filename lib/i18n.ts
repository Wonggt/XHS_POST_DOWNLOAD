export type Lang = "en" | "ms" | "zh";

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "ms", label: "Bahasa Melayu", short: "BM" },
  { code: "zh", label: "中文", short: "中" },
];

export const CONTACT = {
  telegram: "https://t.me/grabit0101",
  feedbackUrl: "/feedback",
  email: "grabit0101@gmail.com",
};

export type FeedbackCategory = "collaboration" | "feature" | "bug" | "other";

export interface Dict {
  brand: string;
  nav_how: string;
  nav_contact: string;
  hero_badge: string;
  hero_title_a: string;
  hero_title_highlight: string;
  hero_title_b: string;
  hero_subtitle: string;
  paste: string;
  clear: string;
  grab: string;
  grabbing: string;
  hint_xhs: string;
  hint_ig: string;
  hint_tt: string;
  hint_fb: string;
  results_videos: (n: number) => string;
  results_images: (n: number) => string;
  video_label: (i: number) => string;
  save_mp4: string;
  save: string;
  bulk_zip: string;
  bulk_pdf: string;
  bulk_long: string;
  preparing: string;
  how_title: string;
  how_subtitle: string;
  step1_title: string;
  step1_body: string;
  step2_title: string;
  step2_body: string;
  step3_title: string;
  step3_body: string;
  feat_fast_t: string;
  feat_fast_b: string;
  feat_login_t: string;
  feat_login_b: string;
  feat_hd_t: string;
  feat_hd_b: string;
  feat_bulk_t: string;
  feat_bulk_b: string;
  contact_title: string;
  contact_subtitle: string;
  contact_tg_title: string;
  contact_tg_body: string;
  contact_fb_title: string;
  contact_fb_body: string;
  contact_fb_cta: string;
  contact_email_title: string;
  contact_email_body: string;
  footer: string;
  lang_label: string;
  select_all: string;
  select_none: string;
  selected_count: (n: number, total: number) => string;
  select_hint: string;
  download_all: string;
  // Feedback page
  fb_back: string;
  fb_page_title: string;
  fb_page_subtitle: string;
  fb_name: string;
  fb_name_ph: string;
  fb_email: string;
  fb_email_ph: string;
  fb_category: string;
  fb_cat_collab: string;
  fb_cat_feature: string;
  fb_cat_bug: string;
  fb_cat_other: string;
  fb_subject: string;
  fb_subject_ph: string;
  fb_message: string;
  fb_message_ph: string;
  fb_submit: string;
  fb_sending: string;
  fb_success_title: string;
  fb_success_body: string;
  fb_success_again: string;
  fb_error: string;
  fb_required: string;
}

export const DICTS: Record<Lang, Dict> = {
  en: {
    brand: "GrabIt",
    nav_how: "How it works",
    nav_contact: "Contact",
    hero_badge: "No login · No watermark · Free",
    hero_title_a: "Save any post as ",
    hero_title_highlight: "photos or video",
    hero_title_b: " in one click.",
    hero_subtitle:
      "Paste a Xiaohongshu or TikTok link — preview, then download as ZIP, PDF, long image, or MP4.",
    paste: "Paste",
    clear: "Clear",
    grab: "Grab it →",
    grabbing: "Extracting…",
    hint_xhs: "Save photos and videos from any public Xiaohongshu post.",
    hint_ig: "Grab photos, Reels, and carousel posts in original quality.",
    hint_tt: "Download TikTok videos without watermark, plus the cover image.",
    hint_fb: "Save photos and videos from public Facebook posts and Reels.",
    results_videos: (n) => `${n} video${n === 1 ? "" : "s"}`,
    results_images: (n) => `${n} image${n === 1 ? "" : "s"}`,
    video_label: (i) => `Video ${i}`,
    save_mp4: "↓ MP4",
    save: "↓ Save",
    bulk_zip: "ZIP",
    bulk_pdf: "PDF",
    bulk_long: "Long Image",
    preparing: "Preparing…",
    how_title: "Three steps. That's it.",
    how_subtitle: "Every platform, same simple flow.",
    step1_title: "Copy the link",
    step1_body: "Tap Share on any post and copy its link.",
    step2_title: "Paste & parse",
    step2_body: "Pick the platform, paste the URL, hit Grab it.",
    step3_title: "Download",
    step3_body: "Save individual media, ZIP, PDF, or a long image.",
    feat_fast_t: "Fast",
    feat_fast_b: "Direct CDN streaming, no queue.",
    feat_login_t: "No login",
    feat_login_b: "Works out-of-the-box for public posts.",
    feat_hd_t: "HD quality",
    feat_hd_b: "Original files, not screenshots.",
    feat_bulk_t: "Bulk export",
    feat_bulk_b: "ZIP, PDF, or one long image.",
    contact_title: "Contact us",
    contact_subtitle: "Questions or suggestions? Reach us any of these ways.",
    contact_tg_title: "Telegram",
    contact_tg_body: "One-to-one chat and real-time support.",
    contact_fb_title: "Feedback form",
    contact_fb_body: "Submit questions or ideas through our form.",
    contact_fb_cta: "Open feedback form →",
    contact_email_title: "Email",
    contact_email_body: "Send us an email — we'll get back to you soon.",
    footer:
      "Please respect each platform's Terms of Service. Only download content you have the right to save.",
    lang_label: "Language",
    select_all: "Select all",
    select_none: "Clear",
    selected_count: (n, total) => `${n} of ${total} selected`,
    select_hint: "Tap an image to include or exclude it from bulk export.",
    download_all: "Download all",
    fb_back: "← Back to home",
    fb_page_title: "Feedback",
    fb_page_subtitle:
      "Tell us about a bug, a feature you'd like, or a collaboration idea. We read every submission.",
    fb_name: "Your name",
    fb_name_ph: "Jane Doe",
    fb_email: "Email",
    fb_email_ph: "you@example.com",
    fb_category: "Category",
    fb_cat_collab: "Collaboration",
    fb_cat_feature: "Feature request",
    fb_cat_bug: "Bug report",
    fb_cat_other: "Other",
    fb_subject: "Subject",
    fb_subject_ph: "Short summary",
    fb_message: "Message",
    fb_message_ph: "Share the details here…",
    fb_submit: "Send feedback",
    fb_sending: "Sending…",
    fb_success_title: "Thanks — we got it!",
    fb_success_body:
      "Your feedback is on its way. We'll follow up by email if a reply is needed.",
    fb_success_again: "Send another",
    fb_error: "Something went wrong. Please try again.",
    fb_required: "This field is required.",
  },
  ms: {
    brand: "GrabIt",
    nav_how: "Cara guna",
    nav_contact: "Hubungi",
    hero_badge: "Tanpa log masuk · Tanpa tanda air · Percuma",
    hero_title_a: "Simpan mana-mana kiriman sebagai ",
    hero_title_highlight: "foto atau video",
    hero_title_b: " dengan satu klik.",
    hero_subtitle:
      "Tampal pautan Xiaohongshu atau TikTok — pratonton, kemudian muat turun sebagai ZIP, PDF, gambar panjang atau MP4.",
    paste: "Tampal",
    clear: "Padam",
    grab: "Ambil →",
    grabbing: "Sedang proses…",
    hint_xhs: "Simpan foto dan video daripada mana-mana kiriman Xiaohongshu awam.",
    hint_ig: "Ambil foto, Reels dan kiriman carousel dalam kualiti asal.",
    hint_tt: "Muat turun video TikTok tanpa tanda air, termasuk gambar kulit.",
    hint_fb: "Simpan foto dan video daripada kiriman Facebook dan Reels awam.",
    results_videos: (n) => `${n} video`,
    results_images: (n) => `${n} gambar`,
    video_label: (i) => `Video ${i}`,
    save_mp4: "↓ MP4",
    save: "↓ Simpan",
    bulk_zip: "ZIP",
    bulk_pdf: "PDF",
    bulk_long: "Gambar Panjang",
    preparing: "Menyediakan…",
    how_title: "Tiga langkah sahaja.",
    how_subtitle: "Semua platform, aliran yang sama mudah.",
    step1_title: "Salin pautan",
    step1_body: "Tekan Kongsi pada mana-mana kiriman dan salin pautannya.",
    step2_title: "Tampal & proses",
    step2_body: "Pilih platform, tampal URL, tekan Ambil.",
    step3_title: "Muat turun",
    step3_body: "Simpan media individu, ZIP, PDF, atau gambar panjang.",
    feat_fast_t: "Pantas",
    feat_fast_b: "Penstriman terus dari CDN, tanpa beratur.",
    feat_login_t: "Tanpa log masuk",
    feat_login_b: "Terus berfungsi untuk kiriman awam.",
    feat_hd_t: "Kualiti HD",
    feat_hd_b: "Fail asal, bukan tangkap skrin.",
    feat_bulk_t: "Eksport pukal",
    feat_bulk_b: "ZIP, PDF, atau satu gambar panjang.",
    contact_title: "Hubungi kami",
    contact_subtitle: "Ada soalan atau cadangan? Hubungi kami melalui saluran berikut.",
    contact_tg_title: "Telegram",
    contact_tg_body: "Sembang satu-dengan-satu untuk sokongan segera.",
    contact_fb_title: "Borang maklum balas",
    contact_fb_body: "Hantar soalan atau idea anda melalui borang kami.",
    contact_fb_cta: "Buka borang maklum balas →",
    contact_email_title: "E-mel",
    contact_email_body: "Hantar e-mel kepada kami — kami akan balas segera.",
    footer:
      "Sila hormati Terma Perkhidmatan setiap platform. Muat turun hanya kandungan yang anda berhak simpan.",
    lang_label: "Bahasa",
    select_all: "Pilih semua",
    select_none: "Kosongkan",
    selected_count: (n, total) => `${n} daripada ${total} dipilih`,
    select_hint: "Ketuk gambar untuk sertakan atau keluarkan daripada eksport pukal.",
    download_all: "Muat turun semua",
    fb_back: "← Kembali ke laman utama",
    fb_page_title: "Maklum balas",
    fb_page_subtitle:
      "Beritahu kami tentang pepijat, ciri yang anda inginkan, atau idea kerjasama. Kami baca semua kiriman.",
    fb_name: "Nama anda",
    fb_name_ph: "Ali bin Ahmad",
    fb_email: "E-mel",
    fb_email_ph: "anda@contoh.com",
    fb_category: "Kategori",
    fb_cat_collab: "Kerjasama",
    fb_cat_feature: "Permintaan ciri",
    fb_cat_bug: "Laporan pepijat",
    fb_cat_other: "Lain-lain",
    fb_subject: "Tajuk",
    fb_subject_ph: "Ringkasan pendek",
    fb_message: "Mesej",
    fb_message_ph: "Kongsikan butiran di sini…",
    fb_submit: "Hantar maklum balas",
    fb_sending: "Menghantar…",
    fb_success_title: "Terima kasih — kami dah terima!",
    fb_success_body:
      "Maklum balas anda telah dihantar. Kami akan hubungi anda melalui e-mel jika perlu balas.",
    fb_success_again: "Hantar lagi",
    fb_error: "Sesuatu tak kena. Sila cuba lagi.",
    fb_required: "Medan ini diperlukan.",
  },
  zh: {
    brand: "一键存",
    nav_how: "使用方法",
    nav_contact: "联系我们",
    hero_badge: "免登录 · 无水印 · 免费",
    hero_title_a: "一键把任意帖子保存为 ",
    hero_title_highlight: "图片或视频",
    hero_title_b: "。",
    hero_subtitle:
      "粘贴小红书或 TikTok 链接 —— 预览后可下载为 ZIP、PDF、长图或 MP4。",
    paste: "粘贴",
    clear: "清除",
    grab: "立即解析 →",
    grabbing: "解析中…",
    hint_xhs: "保存任何公开小红书帖子的图片和视频。",
    hint_ig: "以原图质量保存图片、Reels 和多图帖子。",
    hint_tt: "下载无水印的 TikTok 视频,同时保留封面图。",
    hint_fb: "保存公开 Facebook 帖子和 Reels 的图片与视频。",
    results_videos: (n) => `${n} 个视频`,
    results_images: (n) => `${n} 张图片`,
    video_label: (i) => `视频 ${i}`,
    save_mp4: "↓ MP4",
    save: "↓ 保存",
    bulk_zip: "ZIP",
    bulk_pdf: "PDF",
    bulk_long: "长图",
    preparing: "准备中…",
    how_title: "只需三步。",
    how_subtitle: "所有平台,同样简单。",
    step1_title: "复制链接",
    step1_body: "在任意帖子点击分享,复制链接。",
    step2_title: "粘贴解析",
    step2_body: "选择平台,粘贴链接,点击解析。",
    step3_title: "下载",
    step3_body: "保存单个媒体、ZIP、PDF 或长图。",
    feat_fast_t: "极速",
    feat_fast_b: "直连 CDN,无需排队。",
    feat_login_t: "免登录",
    feat_login_b: "公开帖子开箱即用。",
    feat_hd_t: "高清质量",
    feat_hd_b: "原始文件,非截图。",
    feat_bulk_t: "批量导出",
    feat_bulk_b: "ZIP、PDF 或一张长图。",
    contact_title: "联系我们",
    contact_subtitle: "有任何问题或建议?欢迎通过以下方式联系我们。",
    contact_tg_title: "Telegram",
    contact_tg_body: "一对一聊天,获取实时支持。",
    contact_fb_title: "在线反馈",
    contact_fb_body: "通过在线表单提交您的问题或建议。",
    contact_fb_cta: "打开反馈表单 →",
    contact_email_title: "电子邮件",
    contact_email_body: "发送邮件给我们,我们会尽快回复。",
    footer: "请遵守各平台的服务条款,只下载您有权保存的内容。",
    lang_label: "语言",
    select_all: "全选",
    select_none: "取消全选",
    selected_count: (n, total) => `已选 ${n} / ${total}`,
    select_hint: "点击图片可加入或移出批量导出。",
    download_all: "全部下载",
    fb_back: "← 返回首页",
    fb_page_title: "反馈",
    fb_page_subtitle: "告诉我们发现的问题、想要的功能,或合作想法。每一条我们都会阅读。",
    fb_name: "您的姓名",
    fb_name_ph: "张三",
    fb_email: "电子邮箱",
    fb_email_ph: "you@example.com",
    fb_category: "类别",
    fb_cat_collab: "商务合作",
    fb_cat_feature: "功能建议",
    fb_cat_bug: "问题反馈",
    fb_cat_other: "其他",
    fb_subject: "主题",
    fb_subject_ph: "简短标题",
    fb_message: "详细内容",
    fb_message_ph: "请在这里描述详情…",
    fb_submit: "发送反馈",
    fb_sending: "发送中…",
    fb_success_title: "已收到,感谢!",
    fb_success_body: "您的反馈已提交,如有需要我们会通过邮件回复您。",
    fb_success_again: "再发一条",
    fb_error: "出错了,请重试。",
    fb_required: "此项为必填。",
  },
};
