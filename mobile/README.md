# GovPath Mobile (Flutter) — Owner: Person B
Citizen chat app for Sri Lankan civic services. Multilingual: English, Tanglish, Singlish.
Talks to the backend per [/API_CONTRACT.md](../API_CONTRACT.md).

## Features (per DEVELOPMENT_PLAN.md)
- Chat UI with a language selector (English / Tanglish / Singlish).
- Live `POST /chat` integration with a stateful `session_id`.
- `needs_input` clarifying-question loop — the agent's follow-up questions render
  inline and the next reply continues the same session.
- **Plan card** rendering `office`, `officer`, `checklist`, `forms`, `citations`
  (forms + citation sources open as external links).
- Loading ("thinking…") indicator, error bubbles with **Retry**, empty welcome state.
- Localised static labels for en / tanglish / singlish (free text is understood
  server-side by the LLM; the app passes `lang`).

## Setup
```
flutter pub get
flutter run
```
The platform folders (android/ios/web) are already generated via
`flutter create . --org lk.govpath`.

## Configuring the API URL
Default base URL is `http://10.0.2.2:8000` (Android emulator → host machine).
Override without editing code:
```
flutter run --dart-define=API_BASE_URL=http://localhost:8000      # web / iOS sim / desktop
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:8000   # physical device on LAN
```

## Project layout
```
lib/
  main.dart                  app entry, theme, localization delegates
  models/
    chat_message.dart        a chat bubble (user/bot, plan, service, error)
    chat_response.dart       parsed /chat response
    plan.dart                Plan / FormDoc / Citation
  services/
    api.dart                 typed GovPathApi client + ApiException
  l10n/
    app_strings.dart         static UI labels per language
  screens/
    chat_screen.dart         chat loop + composer + states
  widgets/
    message_bubble.dart      chat bubble + service chip
    plan_card.dart           the action-plan card
    language_selector.dart   language dropdown
    typing_indicator.dart    animated "thinking…" bubble
```

## Verify
```
flutter analyze   # static analysis — clean
flutter test      # widget smoke test
```
