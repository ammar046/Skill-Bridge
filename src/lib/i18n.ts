/**
 * Translation system — English and Urdu.
 * Covers: AppShell, Home, Onboarding, Profile, Readiness, Opportunities, Skills Card.
 * Admin/policymaker dashboard stays in English (institutional audience).
 * ISCO codes, F-O percentages, and data source citations stay in English always.
 */

export type UILocale = "en" | "ur";

export type TranslationKey =
  // Navigation
  | "nav.home"
  | "nav.profile"
  | "nav.start"
  | "nav.ai_lens"
  | "nav.opportunities"
  | "nav.skills_card"
  | "nav.open_infra"
  // AppShell footer
  | "shell.footer_about"
  | "shell.footer_sources"
  // Mobile nav tab labels
  | "nav.tab_home"
  | "nav.tab_profile"
  | "nav.tab_ai"
  | "nav.tab_jobs"
  | "nav.tab_card"
  // Home page
  | "home.hero_eyebrow"
  | "home.hero_title_1"
  | "home.hero_title_em"
  | "home.hero_title_2"
  | "home.hero_sub"
  | "home.start_btn"
  | "home.open_profile_btn"
  | "home.policymaker_btn"
  | "home.metric_workers"
  | "home.metric_africa"
  | "home.metric_ids"
  | "home.live_signals"
  | "home.quote_text"
  | "home.quote_attr"
  | "home.pillar1_title"
  | "home.pillar1_body"
  | "home.pillar2_title"
  | "home.pillar2_body"
  | "home.pillar3_title"
  | "home.pillar3_body"
  | "home.cta_sub"
  | "home.cta_title"
  | "home.begin_btn"
  // Onboarding
  | "onboarding.tell_us_your_name"
  | "onboarding.how_old_are_you"
  | "onboarding.which_city"
  | "onboarding.describe_your_work"
  | "onboarding.your_gender"
  | "onboarding.gender_hint"
  | "onboarding.next"
  | "onboarding.skip"
  | "onboarding.back"
  | "onboarding.start_speaking"
  | "onboarding.build_profile"
  | "onboarding.welcome"
  | "onboarding.name_hint"
  | "onboarding.narrative_hint"
  | "onboarding.step_label"
  | "onboarding.skills_intake"
  | "onboarding.processing"
  | "onboarding.error_retry"
  // Profile
  | "profile.your_skills"
  | "profile.bridge_pass"
  | "profile.automation_risk"
  | "profile.validated_skills"
  | "profile.source_narrative"
  | "profile.durable"
  | "profile.at_risk"
  | "profile.avg_confidence"
  | "profile.skills_mapped"
  | "profile.page_label"
  | "profile.ai_lens_btn"
  | "profile.mapped_to"
  | "profile.region_future"
  | "profile.enrollment_proj"
  | "profile.witt_implication"
  | "profile.disclaimer"
  // Readiness
  | "readiness.page_label"
  | "readiness.title"
  | "readiness.sub"
  | "readiness.risk_score_label"
  | "readiness.demand_trend_label"
  | "readiness.resilience_label"
  | "readiness.next_steps_label"
  | "readiness.view_opps_btn"
  | "readiness.get_card_btn"
  | "readiness.calibrating"
  | "readiness.fo_source"
  | "readiness.low"
  | "readiness.medium"
  | "readiness.high"
  | "readiness.index_today"
  | "readiness.demand_note"
  | "readiness.resilience_engine"
  | "readiness.learn_prefix"
  | "readiness.lift_resilience"
  // Opportunities
  | "opp.page_label"
  | "opp.title"
  | "opp.sub"
  | "opp.get_card_btn"
  | "opp.top_matches"
  | "opp.match_score"
  | "opp.wage_floor"
  | "opp.sector_growth"
  | "opp.training_label"
  | "opp.search_placeholder"
  | "opp.search_btn"
  | "opp.earning_potential"
  | "opp.view_btn"
  | "opp.growing"
  | "opp.declining"
  | "opp.no_matches"
  | "opp.matches_empty"
  | "opp.no_providers"
  // Skills card
  | "card.page_label"
  | "card.title"
  | "card.sub"
  | "card.download_pdf"
  | "card.share_qr"
  | "card.send_sms"
  | "card.holder"
  | "card.issued"
  | "card.credential_id"
  | "card.standard"
  | "card.validated_skills"
  | "card.verified_label"
  | "card.qr_hint"
  | "card.sms_title"
  | "card.sms_phone_label"
  | "card.sms_preview_label"
  | "card.sms_send_btn"
  | "card.qr_title"
  | "card.qr_verify_hint"
  // Common
  | "common.source"
  | "common.live"
  | "common.published"
  | "common.processing"
  | "common.woman"
  | "common.man"
  | "common.non_binary"
  | "common.continue"
  | "common.back"
  | "common.error_label"
  | "common.close";

const translations: Record<UILocale, Record<TranslationKey, string>> = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.profile": "Profile",
    "nav.start": "Start",
    "nav.ai_lens": "AI lens",
    "nav.opportunities": "Opportunities",
    "nav.skills_card": "Skills card",
    "nav.open_infra": "Open infra · v0.1",
    // Footer
    "shell.footer_about": "Open infrastructure for the informal economy.",
    "shell.footer_sources": "Sources: ILO · World Bank · UNESCO · Wittgenstein Centre · Frey-Osborne (2013)",
    // Mobile tabs
    "nav.tab_home": "Home",
    "nav.tab_profile": "Profile",
    "nav.tab_ai": "AI Lens",
    "nav.tab_jobs": "Jobs",
    "nav.tab_card": "Card",
    // Home
    "home.hero_eyebrow": "Vol. 01 · Issue 01",
    "home.hero_title_1": "Make informal skills",
    "home.hero_title_em": "economically",
    "home.hero_title_2": "legible.",
    "home.hero_sub": "UNMAPPED turns lived work history into a portable, ESCO-aligned skills profile — with honest opportunity matching and AI-readiness signals calibrated for your country.",
    "home.start_btn": "Start mapping — 2 minutes",
    "home.open_profile_btn": "Open my profile",
    "home.policymaker_btn": "Policymaker view",
    "home.metric_workers": "Informal workers globally",
    "home.metric_africa": "Of African employment",
    "home.metric_ids": "Globally portable IDs",
    "home.live_signals": "Live econometric signals",
    "home.quote_text": "I've run a phone repair business since I was 17. No certificate. No bank knows my skill. No employer can see my track record.",
    "home.quote_attr": "— Amara, 22 · Madina market, Accra",
    "home.pillar1_title": "Built for 2G",
    "home.pillar1_body": "System fonts, no hero images, offline-first PWA logic. Works on a shared phone in a market or bazaar.",
    "home.pillar2_title": "Honest matching",
    "home.pillar2_body": "Every opportunity surfaces ILO wage floors and sector growth — no inflated promises, no extractive funnels.",
    "home.pillar3_title": "Policy-grade data",
    "home.pillar3_body": "Skill-gap heatmaps powered by ILO, World Bank, UNESCO, and Wittgenstein 2025–2035 projections.",
    "home.cta_sub": "For Amara, for Hassan, for 1.6 billion others",
    "home.cta_title": "Your work is real. Now make it readable.",
    "home.begin_btn": "Begin onboarding",
    // Onboarding
    "onboarding.tell_us_your_name": "Hello! What should we call you?",
    "onboarding.how_old_are_you": "Nice to meet you. How old are you?",
    "onboarding.which_city": "Where do you live or work?",
    "onboarding.describe_your_work": "Tell us about your work — in your own words.",
    "onboarding.your_gender": "What is your gender? (optional)",
    "onboarding.gender_hint": "This helps us apply ILO wage data more accurately. You can skip this.",
    "onboarding.next": "Continue",
    "onboarding.skip": "Skip",
    "onboarding.back": "Back",
    "onboarding.start_speaking": "Tap to speak",
    "onboarding.build_profile": "Build my profile",
    "onboarding.welcome": "Welcome to UNMAPPED. I'll ask a few short questions, then build your portable skills profile.",
    "onboarding.name_hint": "We'll put this on your skills card.",
    "onboarding.narrative_hint": "Tap the mic to speak. Voice runs on-device, nothing uploaded.",
    "onboarding.step_label": "Step",
    "onboarding.skills_intake": "Skills intake",
    "onboarding.processing": "Processing…",
    "onboarding.error_retry": "Your narrative has been saved. Fix the issue above and try again.",
    // Profile
    "profile.page_label": "Portable skills profile · ESCO-aligned",
    "profile.ai_lens_btn": "AI readiness lens",
    "profile.mapped_to": "Mapped to",
    "profile.your_skills": "Your skills",
    "profile.bridge_pass": "Bridge Pass",
    "profile.automation_risk": "Automation risk",
    "profile.validated_skills": "Validated skills",
    "profile.source_narrative": "Source narrative",
    "profile.durable": "Durable",
    "profile.at_risk": "At risk",
    "profile.avg_confidence": "Avg confidence",
    "profile.skills_mapped": "Skills mapped",
    "profile.region_future": "Your region's future",
    "profile.enrollment_proj": "Secondary education enrollment projections",
    "profile.witt_implication": "More workers with credentials means your undocumented skills matter more now. A Bridge Pass helps you stand out.",
    "profile.disclaimer": "Skills classifications use ILO ISCO-08. Automation scores are derived from Frey & Osborne (2013), calibrated for low- and middle-income economies per ILO (2019). Wage data is from ILO Global Wage Report 2024 and ILOSTAT. All scores are indicative.",
    // Readiness
    "readiness.page_label": "AI readiness & displacement lens",
    "readiness.title": "How automation will touch your work.",
    "readiness.sub": "Frey-Osborne (2013) probabilities adjusted for LMIC informal-sector weighting, plotted against Wittgenstein Centre projections.",
    "readiness.risk_score_label": "Automation risk score",
    "readiness.demand_trend_label": "Wittgenstein demand trend · 2025–2035",
    "readiness.resilience_label": "Most resilient skill",
    "readiness.next_steps_label": "Next steps",
    "readiness.view_opps_btn": "View opportunities",
    "readiness.get_card_btn": "Get skills card",
    "readiness.calibrating": "Calibrating Frey-Osborne…",
    "readiness.fo_source": "Source: Frey & Osborne (2013) · Oxford Martin · ILO LMIC calibration 2019",
    "readiness.low": "LOW",
    "readiness.medium": "MEDIUM",
    "readiness.high": "HIGH",
    "readiness.index_today": "index 100 = today",
    "readiness.demand_note": "Region-specific projection of demand for your skill mix.",
    "readiness.resilience_engine": "Resilience suggestion · UNMAPPED engine",
    "readiness.learn_prefix": "Learn",
    "readiness.lift_resilience": "to lift resilience by",
    // Opportunities
    "opp.page_label": "Honest opportunity matching",
    "opp.title": "Real roles. Real wages. No spin.",
    "opp.sub": "Every card surfaces the ILO wage floor and sector growth — so you can compare on what matters.",
    "opp.get_card_btn": "Get my skills card",
    "opp.top_matches": "Top matches · sorted by fit",
    "opp.match_score": "Match",
    "opp.wage_floor": "Wage floor",
    "opp.sector_growth": "Sector growth",
    "opp.training_label": "Live training providers",
    "opp.search_placeholder": "Search by skill…",
    "opp.search_btn": "Search",
    "opp.earning_potential": "Earning potential",
    "opp.view_btn": "View",
    "opp.growing": "growing",
    "opp.declining": "declining",
    "opp.no_matches": "Loading opportunities…",
    "opp.matches_empty":
      "No role matches are saved on this device yet. Use Start from the home page to build your profile — matches appear here without calling the AI again.",
    "opp.no_providers": "No providers found for that skill.",
    // Skills card
    "card.page_label": "Exportable skills card",
    "card.title": "Carry your work with you.",
    "card.sub": "A digital ID for the informal economy. Share via PDF, QR, or SMS — works even on a feature phone.",
    "card.download_pdf": "Download PDF",
    "card.share_qr": "Share via QR",
    "card.send_sms": "Send SMS summary",
    "card.holder": "Holder",
    "card.issued": "Issued",
    "card.credential_id": "Credential ID",
    "card.standard": "Standard",
    "card.validated_skills": "Validated skills",
    "card.verified_label": "Verified · ESCO-aligned",
    "card.qr_hint": "Tap \"Share via QR\" for verifiable code",
    "card.qr_title": "Share via QR",
    "card.qr_verify_hint": "Anyone can scan this to verify validated skills.",
    "card.sms_title": "Send SMS summary",
    "card.sms_phone_label": "Phone number",
    "card.sms_preview_label": "Preview",
    "card.sms_send_btn": "Send",
    // Common
    "common.source": "Source",
    "common.live": "Live",
    "common.published": "Published",
    "common.processing": "Processing…",
    "common.woman": "Woman",
    "common.man": "Man",
    "common.non_binary": "Non-binary / prefer not to say",
    "common.continue": "Continue",
    "common.back": "Back",
    "common.error_label": "Error",
    "common.close": "Close",
  },

  ur: {
    // Navigation
    "nav.home": "ہوم",
    "nav.profile": "پروفائل",
    "nav.start": "شروع",
    "nav.ai_lens": "AI تجزیہ",
    "nav.opportunities": "مواقع",
    "nav.skills_card": "مہارت کارڈ",
    "nav.open_infra": "کھلا نظام · v0.1",
    // Footer
    "shell.footer_about": "غیر رسمی معیشت کے لیے کھلا ڈھانچہ۔",
    "shell.footer_sources": "ذرائع: ILO · ورلڈ بینک · UNESCO · Wittgenstein · Frey-Osborne (2013)",
    // Mobile tabs
    "nav.tab_home": "ہوم",
    "nav.tab_profile": "پروفائل",
    "nav.tab_ai": "AI",
    "nav.tab_jobs": "مواقع",
    "nav.tab_card": "کارڈ",
    // Home
    "home.hero_eyebrow": "جلد 01 · شمارہ 01",
    "home.hero_title_1": "غیر رسمی مہارتوں کو",
    "home.hero_title_em": "اقتصادی",
    "home.hero_title_2": "پہچان دیں۔",
    "home.hero_sub": "UNMAPPED آپ کے کام کی تاریخ کو ایک قابل اعتماد، ESCO سے منسلک مہارت پروفائل میں بدل دیتا ہے — آپ کے ملک کے حساب سے۔",
    "home.start_btn": "شروع کریں — 2 منٹ",
    "home.open_profile_btn": "میری پروفائل کھولیں",
    "home.policymaker_btn": "پالیسی ڈیشبورڈ",
    "home.metric_workers": "دنیا بھر میں غیر رسمی مزدور",
    "home.metric_africa": "افریقی ملازمت",
    "home.metric_ids": "قابل منتقلی سرکاری اسناد",
    "home.live_signals": "معاشی اعداد — براہ راست",
    "home.quote_text": "میں 17 سال سے موبائل ٹھیک کر رہا ہوں۔ کوئی سرٹیفکیٹ نہیں، کوئی بینک میری مہارت نہیں جانتا، کوئی نوکری دینے والا میرا ریکارڈ نہیں دیکھ سکتا۔",
    "home.quote_attr": "— حسن، 24 · انارکلی بازار، لاہور",
    "home.pillar1_title": "2G پر چلتا ہے",
    "home.pillar1_body": "ہلکا پھلکا، آف لائن بھی کام کرتا ہے۔ بازار میں مشترکہ فون پر بھی چلتا ہے۔",
    "home.pillar2_title": "سچی معلومات",
    "home.pillar2_body": "ہر موقع ILO اجرت کی حد اور شعبے کی ترقی دکھاتا ہے — کوئی جھوٹے وعدے نہیں۔",
    "home.pillar3_title": "سرکاری درجے کا ڈیٹا",
    "home.pillar3_body": "ILO، ورلڈ بینک، UNESCO اور Wittgenstein 2025–2035 کے اعداد پر مبنی مہارت خلا کا نقشہ۔",
    "home.cta_sub": "حسن، امارا اور 1.6 ارب دوسروں کے لیے",
    "home.cta_title": "آپ کا کام حقیقی ہے۔ اب اسے پہچانی بنائیں۔",
    "home.begin_btn": "شروع کریں",
    // Onboarding
    "onboarding.tell_us_your_name": "آپ کا کیا نام ہے؟",
    "onboarding.how_old_are_you": "آپ کی عمر کتنی ہے؟",
    "onboarding.which_city": "آپ کہاں رہتے ہیں؟",
    "onboarding.describe_your_work": "اپنے کام کے بارے میں بتائیں — جو بھی کرتے ہیں۔",
    "onboarding.your_gender": "آپ کی جنس؟ (ضروری نہیں)",
    "onboarding.gender_hint": "اس سے اجرت کا حساب زیادہ درست ہوتا ہے۔ چاہیں تو چھوڑ دیں۔",
    "onboarding.next": "آگے",
    "onboarding.skip": "چھوڑیں",
    "onboarding.back": "واپس",
    "onboarding.start_speaking": "بولنے کے لیے دبائیں",
    "onboarding.build_profile": "پروفائل بنائیں",
    "onboarding.welcome": "UNMAPPED میں خوش آمدید — آپ کی مہارتوں کو سرکاری سند میں بدلنے کا نظام۔ بس چند سوالات کے جواب دیں۔",
    "onboarding.name_hint": "یہ نام آپ کے مہارت کارڈ پر آئے گا۔",
    "onboarding.narrative_hint": "مائیک دبائیں اور بولیں۔ آواز صرف آپ کے فون پر پروسیس ہوتی ہے۔",
    "onboarding.step_label": "مرحلہ",
    "onboarding.skills_intake": "مہارت درج کریں",
    "onboarding.processing": "ہو رہا ہے…",
    "onboarding.error_retry": "آپ کا بیان محفوظ ہو گیا ہے۔ مسئلہ ٹھیک کر کے دوبارہ کوشش کریں۔",
    // Profile
    "profile.page_label": "قابل منتقلی مہارت پروفائل · ESCO سے منسلک",
    "profile.ai_lens_btn": "AI تیاری کا تجزیہ",
    "profile.mapped_to": "منسلک ادارہ",
    "profile.your_skills": "آپ کی مہارتیں",
    "profile.bridge_pass": "برج پاس",
    "profile.automation_risk": "مشینی خطرہ",
    "profile.validated_skills": "تصدیق شدہ مہارتیں",
    "profile.source_narrative": "آپ کی اپنی بات",
    "profile.durable": "محفوظ",
    "profile.at_risk": "خطرے میں",
    "profile.avg_confidence": "اوسط درجہ",
    "profile.skills_mapped": "مہارتیں",
    "profile.region_future": "آپ کے علاقے کا مستقبل",
    "profile.enrollment_proj": "ثانوی تعلیم میں داخلے کا رجحان",
    "profile.witt_implication": "جتنے زیادہ لوگ ڈگری لیں گے، اتنا زیادہ آپ کی بغیر دستاویز مہارت کی قدر ہوگی۔ برج پاس آپ کو نمایاں کرتا ہے۔",
    "profile.disclaimer": "مہارت کی درجہ بندی ILO ISCO-08 کے مطابق ہے۔ آٹومیشن سکور Frey & Osborne (2013) سے لیے گئے ہیں، ILO (2019) کے مطابق کم آمدنی والے ممالک کے لیے ترتیب دیے گئے ہیں۔ اجرت کا ڈیٹا ILO Global Wage Report 2024 اور ILOSTAT سے ہے۔ تمام سکور ہدایتی ہیں۔",
    // Readiness
    "readiness.page_label": "AI تیاری اور خطرے کا تجزیہ",
    "readiness.title": "آٹومیشن آپ کے کام پر کیا اثر ڈالے گی۔",
    "readiness.sub": "Frey-Osborne (2013) امکانات، LMIC غیر رسمی شعبے کے لیے ترتیب دیے گئے، Wittgenstein کے 2025–2035 تخمینوں کے ساتھ۔",
    "readiness.risk_score_label": "آٹومیشن خطرہ سکور",
    "readiness.demand_trend_label": "Wittgenstein طلب کا رجحان · 2025–2035",
    "readiness.resilience_label": "سب سے محفوظ مہارت",
    "readiness.next_steps_label": "آگے کیا کریں",
    "readiness.view_opps_btn": "مواقع دیکھیں",
    "readiness.get_card_btn": "مہارت کارڈ حاصل کریں",
    "readiness.calibrating": "حساب ہو رہا ہے…",
    "readiness.fo_source": "ماخذ: Frey & Osborne (2013) · Oxford Martin · ILO 2019",
    "readiness.low": "کم",
    "readiness.medium": "درمیانہ",
    "readiness.high": "زیادہ",
    "readiness.index_today": "انڈیکس 100 = آج",
    "readiness.demand_note": "آپ کی مہارتوں کی طلب کا علاقائی تخمینہ۔",
    "readiness.resilience_engine": "لچک کی تجویز · UNMAPPED",
    "readiness.learn_prefix": "سیکھیں",
    "readiness.lift_resilience": "تاکہ لچک بڑھے",
    // Opportunities
    "opp.page_label": "سچے مواقع",
    "opp.title": "حقیقی کام۔ حقیقی اجرت۔ کوئی جھوٹ نہیں۔",
    "opp.sub": "ہر کارڈ ILO اجرت کی حد اور شعبے کی ترقی دکھاتا ہے — اہم باتوں پر موازنہ کریں۔",
    "opp.get_card_btn": "مہارت کارڈ حاصل کریں",
    "opp.top_matches": "بہترین میچز · مناسب ترین سے شروع",
    "opp.match_score": "مناسبت",
    "opp.wage_floor": "اجرت کی حد",
    "opp.sector_growth": "شعبہ ترقی",
    "opp.training_label": "تربیتی ادارے",
    "opp.search_placeholder": "مہارت سے تلاش کریں…",
    "opp.search_btn": "تلاش",
    "opp.earning_potential": "کمائی کی صلاحیت",
    "opp.view_btn": "دیکھیں",
    "opp.growing": "بڑھ رہا",
    "opp.declining": "کم ہو رہا",
    "opp.no_matches": "مواقع لوڈ ہو رہے ہیں…",
    "opp.matches_empty":
      "ابھی کوئی کردار کے میچز محفوظ نہیں۔ ہوم سے شروع کریں تاکہ پروفائل بنے — پھر یہاں میچز بغیر دوبارہ AI کے دکھائی دیں گے۔",
    "opp.no_providers": "اس مہارت کے لیے کوئی ادارہ نہیں ملا۔",
    // Skills card
    "card.page_label": "قابل برآمد مہارت کارڈ",
    "card.title": "اپنا کام ساتھ لے جائیں۔",
    "card.sub": "غیر رسمی معیشت کے لیے ڈیجیٹل شناخت۔ PDF، QR یا SMS سے شیئر کریں — سادہ فون پر بھی کام کرتا ہے۔",
    "card.download_pdf": "PDF ڈاؤنلوڈ کریں",
    "card.share_qr": "QR سے شیئر کریں",
    "card.send_sms": "SMS بھیجیں",
    "card.holder": "حامل",
    "card.issued": "تاریخ اجراء",
    "card.credential_id": "سند نمبر",
    "card.standard": "معیار",
    "card.validated_skills": "تصدیق شدہ مہارتیں",
    "card.verified_label": "تصدیق شدہ · ESCO",
    "card.qr_hint": "QR کوڈ کے لیے نیچے دبائیں",
    "card.qr_title": "QR سے شیئر کریں",
    "card.qr_verify_hint": "اسکین کر کے مہارتیں تصدیق کریں۔",
    "card.sms_title": "SMS بھیجیں",
    "card.sms_phone_label": "موبائل نمبر",
    "card.sms_preview_label": "پیش نظارہ",
    "card.sms_send_btn": "بھیجیں",
    // Common
    "common.source": "ماخذ",
    "common.live": "لائیو",
    "common.published": "شائع شدہ",
    "common.processing": "ہو رہا ہے…",
    "common.woman": "خاتون",
    "common.man": "مرد",
    "common.non_binary": "بتانا نہیں چاہتے",
    "common.continue": "آگے",
    "common.back": "واپس",
    "common.error_label": "خرابی",
    "common.close": "بند کریں",
  },
};

export function t(key: TranslationKey, locale: UILocale = "en"): string {
  return translations[locale]?.[key] ?? translations.en[key] ?? key;
}
