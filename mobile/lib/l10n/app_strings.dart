// Static UI labels for en / tanglish / singlish. Owner: Person B.
//
// Per lib/l10n/strings.md: free-text language understanding is handled
// server-side (the LLM reads tanglish/singlish). The app only localises these
// static chrome labels and passes `lang` to the API.
//
// Tanglish = Tamil written in Latin script. Singlish = Sinhala in Latin script.

class AppLang {
  static const en = 'en';
  static const tanglish = 'tanglish';
  static const singlish = 'singlish';

  static const all = [en, tanglish, singlish];

  static const labels = {
    en: 'English',
    tanglish: 'Tanglish',
    singlish: 'Singlish',
  };
}

class AppStrings {
  final String appTitle;
  final String inputHint;
  final String send;
  final String welcome;
  final String thinking;
  final String serviceLabel;
  final String planTitle;
  final String office;
  final String officer;
  final String checklist;
  final String forms;
  final String citations;
  final String openForm;
  final String linkError;
  final String retry;

  const AppStrings({
    required this.appTitle,
    required this.inputHint,
    required this.send,
    required this.welcome,
    required this.thinking,
    required this.serviceLabel,
    required this.planTitle,
    required this.office,
    required this.officer,
    required this.checklist,
    required this.forms,
    required this.citations,
    required this.openForm,
    required this.linkError,
    required this.retry,
  });

  static AppStrings of(String lang) => _map[lang] ?? _map[AppLang.en]!;

  static const _map = <String, AppStrings>{
    AppLang.en: AppStrings(
      appTitle: 'GovPath',
      inputHint: 'Describe what you need…',
      send: 'Send',
      welcome:
          'Hi! I can help you navigate Sri Lankan government services. What do you need?',
      thinking: 'Thinking…',
      serviceLabel: 'Service',
      planTitle: 'Your Action Plan',
      office: 'Office',
      officer: 'Officer',
      checklist: 'Checklist',
      forms: 'Forms',
      citations: 'Sources',
      openForm: 'Open form',
      linkError: 'Could not open the link.',
      retry: 'Retry',
    ),
    AppLang.tanglish: AppStrings(
      appTitle: 'GovPath',
      inputHint: 'Ungalukku enna venum endru sollunga…',
      send: 'Anuppu',
      welcome:
          'Vanakkam! Sri Lanka arasanga sevaikku naan udhavuven. Ungalukku enna venum?',
      thinking: 'Yosikkiren…',
      serviceLabel: 'Sevai',
      planTitle: 'Ungal Seyal Thittam',
      office: 'Aluvalagam',
      officer: 'Adhikari',
      checklist: 'Sari paarkkum pattiyal',
      forms: 'Padivangal',
      citations: 'Aadharangal',
      openForm: 'Padivathai thira',
      linkError: 'Inaippai thira mudiyavillai.',
      retry: 'Meendum muyalavum',
    ),
    AppLang.singlish: AppStrings(
      appTitle: 'GovPath',
      inputHint: 'Obata kumakda avashya kiyala kiyanna…',
      send: 'Yawanna',
      welcome:
          'Aayuboovan! Sri Lankawe rajaye sewa labaa ganna mama udaw karannam. Obata mokakda avashya?',
      thinking: 'Hithanawa…',
      serviceLabel: 'Sewawa',
      planTitle: 'Obage Kriyaakaarii Salasma',
      office: 'Kaaryaalaya',
      officer: 'Niladhaariya',
      checklist: 'Piriksum lehisthuwa',
      forms: 'Forms',
      citations: 'Moolashra',
      openForm: 'Form eka arinna',
      linkError: 'Link eka arinna bari una.',
      retry: 'Aayemath uthsaaha karanna',
    ),
  };
}
