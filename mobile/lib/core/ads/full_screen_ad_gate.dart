/// Prevents interstitial and app-open ads from stacking.
class FullScreenAdGate {
  FullScreenAdGate._();
  static final instance = FullScreenAdGate._();

  bool _showing = false;

  bool get isShowing => _showing;

  bool tryAcquire() {
    if (_showing) return false;
    _showing = true;
    return true;
  }

  void release() {
    _showing = false;
  }
}
