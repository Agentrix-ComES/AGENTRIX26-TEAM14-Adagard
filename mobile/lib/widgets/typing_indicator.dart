// Animated "thinking…" bubble shown while awaiting /chat. Owner: Person B.
import 'package:flutter/material.dart';
import 'gov_lion.dart';

class TypingIndicator extends StatefulWidget {
  final String label;
  const TypingIndicator({super.key, required this.label});

  @override
  State<TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<TypingIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))
        ..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 64, 4),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        // GovPath avatar
        Container(
          width: 26,
          height: 26,
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF173A5A), Color(0xFF1F4E79)],
            ),
            borderRadius: BorderRadius.circular(7),
          ),
          child: const GovPathLion(size: 20, color: Colors.white),
        ),
        const SizedBox(width: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(4),
              topRight: Radius.circular(18),
              bottomLeft: Radius.circular(18),
              bottomRight: Radius.circular(18),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.07),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            for (var i = 0; i < 3; i++) _Dot(controller: _c, index: i),
            const SizedBox(width: 8),
            Text(widget.label,
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
          ]),
        ),
      ]),
    );
  }
}

class _Dot extends StatelessWidget {
  final AnimationController controller;
  final int index;
  const _Dot({required this.controller, required this.index});

  static const _colors = [Color(0xFF1F4E79), Color(0xFF2C6AA0), Color(0xFFC8A04F)];

  @override
  Widget build(BuildContext context) {
    final color = _colors[index];
    return AnimatedBuilder(
      animation: controller,
      builder: (_, __) {
        final t = (controller.value + index * 0.22) % 1.0;
        final bounce = (t < 0.5) ? 2 * t * t : 1 - (2 * t - 2) * (2 * t - 2) / 2;
        final ty = -6.0 * bounce;
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 2.5),
          child: Transform.translate(
            offset: Offset(0, ty),
            child: CircleAvatar(radius: 4, backgroundColor: color),
          ),
        );
      },
    );
  }
}
