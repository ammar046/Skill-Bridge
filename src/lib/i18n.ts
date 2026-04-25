/**
 * Minimal translation system for UNMAPPED.
 * Supports English and Urdu (for Pakistan locale).
 * ISCO codes, F-O percentages, and data source citations remain in English
 * as they are internationally standardised.
 */

export type UILocale = "en" | "ur";

export type TranslationKey =
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
  | "profile.your_skills"
  | "profile.bridge_pass"
  | "profile.automation_risk"
  | "profile.validated_skills"
  | "profile.source_narrative"
  | "profile.durable"
  | "profile.at_risk"
  | "profile.avg_confidence"
  | "profile.skills_mapped"
  | "common.source"
  | "common.live"
  | "common.published"
  | "common.processing"
  | "common.woman"
  | "common.man"
  | "common.non_binary"
  | "common.continue";

const translations: Record<UILocale, Record<TranslationKey, string>> = {
  en: {
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
    "profile.your_skills": "Your skills",
    "profile.bridge_pass": "Bridge Pass",
    "profile.automation_risk": "Automation risk",
    "profile.validated_skills": "Validated skills",
    "profile.source_narrative": "Source narrative",
    "profile.durable": "Durable",
    "profile.at_risk": "At risk",
    "profile.avg_confidence": "Avg confidence",
    "profile.skills_mapped": "Skills mapped",
    "common.source": "Source",
    "common.live": "Live",
    "common.published": "Published",
    "common.processing": "Processing…",
    "common.woman": "Woman",
    "common.man": "Man",
    "common.non_binary": "Non-binary / prefer not to say",
    "common.continue": "Continue",
  },
  ur: {
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
    "profile.your_skills": "آپ کی مہارتیں",
    "profile.bridge_pass": "برج پاس",
    "profile.automation_risk": "مشینی خطرہ",
    "profile.validated_skills": "تصدیق شدہ مہارتیں",
    "profile.source_narrative": "آپ کی اپنی بات",
    "profile.durable": "محفوظ",
    "profile.at_risk": "خطرے میں",
    "profile.avg_confidence": "اوسط درجہ",
    "profile.skills_mapped": "مہارتیں",
    "common.source": "ماخذ",
    "common.live": "لائیو",
    "common.published": "شائع شدہ",
    "common.processing": "ہو رہا ہے…",
    "common.woman": "خاتون",
    "common.man": "مرد",
    "common.non_binary": "بتانا نہیں چاہتے",
    "common.continue": "آگے",
  },
};

export function t(key: TranslationKey, locale: UILocale = "en"): string {
  return translations[locale]?.[key] ?? translations.en[key] ?? key;
}
