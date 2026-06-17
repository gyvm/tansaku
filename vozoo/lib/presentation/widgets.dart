import 'package:flutter/material.dart';

/// Shared kid-friendly UI building blocks (modern, rounded, large touch
/// targets). Keeps every screen visually consistent.

/// App-wide accent used for primary actions (record / play / OK).
const Color kAccent = Color(0xFFFF7043); // warm orange, matches the playful theme

/// A large, rounded, full-width primary button with an icon and label.
class BigButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final Color foreground;
  final VoidCallback? onPressed;

  const BigButton({
    super.key,
    required this.icon,
    required this.label,
    this.color = kAccent,
    this.foreground = Colors.white,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 64,
      child: FilledButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, size: 28),
        label: Text(
          label,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        style: FilledButton.styleFrom(
          backgroundColor: color,
          foregroundColor: foreground,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(32),
          ),
        ),
      ),
    );
  }
}

/// A big circular tappable button (record / stop / play). The single, obvious
/// primary control on a screen.
class CircleButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final double size;
  final VoidCallback? onPressed;

  const CircleButton({
    super.key,
    required this.icon,
    required this.color,
    this.size = 140,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      shape: const CircleBorder(),
      elevation: 6,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onPressed,
        child: SizedBox(
          width: size,
          height: size,
          child: Icon(icon, size: size * 0.42, color: Colors.white),
        ),
      ),
    );
  }
}

/// A small rounded secondary action (used for the result screen's
/// save / share row).
class PillButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onPressed;

  const PillButton({
    super.key,
    required this.icon,
    required this.label,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 22),
      label: Text(
        label,
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ),
      ),
    );
  }
}
