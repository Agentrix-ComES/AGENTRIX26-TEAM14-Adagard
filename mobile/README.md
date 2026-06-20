# GovPath Mobile (Flutter) — Owner: Person B
Citizen chat app. Multilingual: English, Tanglish, Singlish.
Talks to backend per /API_CONTRACT.md.

Setup:
  flutter create . --org lk.govpath   # generates android/ios platform folders
  flutter pub get
  flutter run
Set API base in lib/services/api.dart (default http://10.0.2.2:8000 for Android emulator).
