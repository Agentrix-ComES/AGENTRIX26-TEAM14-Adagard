// GovPath logo widget — government building + navigation route seal. Owner: Person B.
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Renders the GovPath logo SVG at the requested [size].
/// Pass [color] to tint the whole mark to a single colour
/// (e.g. [Colors.white] for use on dark backgrounds).
/// Leave [color] null to show the full navy + gold + white logo.
class GovPathLion extends StatelessWidget {
  final double size;
  final Color? color;

  const GovPathLion({super.key, this.size = 32, this.color});

  @override
  Widget build(BuildContext context) {
    return SvgPicture.asset(
      'assets/logo.svg',
      width: size,
      height: size,
      colorFilter: color != null
          ? ColorFilter.mode(color!, BlendMode.srcIn)
          : null,
    );
  }
}
