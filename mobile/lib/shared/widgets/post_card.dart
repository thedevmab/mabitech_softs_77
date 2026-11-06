import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../models/models.dart';
import 'post_action_button.dart';

class PostCard extends StatelessWidget {
  const PostCard({
    super.key,
    required this.item,
    this.compact = false,
    this.featured = false,
  });

  final PostSummary item;
  final bool compact;
  final bool featured;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final meta = [
      if (item.readingTimeMinutes != null) '${item.readingTimeMinutes} min read',
      if (item.isSponsored) 'Sponsored',
    ].join(' · ');

    if (compact) {
      return InkWell(
        onTap: () => context.push('/posts/${item.slug}'),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _BadgeRow(item: item, meta: meta),
              const SizedBox(height: 6),
              Text(
                item.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  height: 1.25,
                ),
              ),
              if (item.excerpt != null) ...[
                const SizedBox(height: 4),
                Text(
                  item.excerpt!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.65),
                  ),
                ),
              ],
              if (item.actionLabel != null) ...[
                const SizedBox(height: 10),
                PostActionButton(post: item, compact: true),
              ],
            ],
          ),
        ),
      );
    }

    return InkWell(
      onTap: () => context.push('/posts/${item.slug}'),
      child: Padding(
        padding: EdgeInsets.only(bottom: featured ? 8 : 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: featured ? 16 / 9 : 16 / 10,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (item.featuredImage != null)
                    CachedNetworkImage(
                      imageUrl: item.featuredImage!,
                      fit: BoxFit.cover,
                    )
                  else
                    DecoratedBox(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppColors.heroFrom,
                            AppColors.heroVia,
                            AppColors.heroTo,
                          ],
                        ),
                      ),
                      child: Align(
                        alignment: Alignment.bottomLeft,
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Text(
                            'DAILY TIPS',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: Colors.white70,
                              letterSpacing: 2,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    ),
                  Positioned(
                    left: 0,
                    top: 0,
                    bottom: 0,
                    child: Container(width: 3, color: AppColors.gold),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            _BadgeRow(item: item, meta: meta),
            const SizedBox(height: 6),
            Text(
              item.title,
              maxLines: featured ? 3 : 2,
              overflow: TextOverflow.ellipsis,
              style: (featured
                      ? theme.textTheme.headlineSmall
                      : theme.textTheme.titleLarge)
                  ?.copyWith(height: 1.2),
            ),
            if (item.excerpt != null) ...[
              const SizedBox(height: 6),
              Text(
                item.excerpt!,
                maxLines: featured ? 3 : 2,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.65),
                ),
              ),
            ],
            if (item.actionLabel != null) ...[
              const SizedBox(height: 12),
              PostActionButton(post: item),
            ],
          ],
        ),
      ),
    );
  }
}

class _BadgeRow extends StatelessWidget {
  const _BadgeRow({required this.item, required this.meta});

  final PostSummary item;
  final String meta;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        if (item.categoryName != null)
          _Chip(
            label: item.categoryName!,
            color: theme.colorScheme.primary,
          ),
        if (item.file != null)
          _Chip(
            label: item.file!.extension.toUpperCase(),
            color: AppColors.gold,
          ),
        if (item.file != null)
          Text(
            item.file!.sizeLabel,
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.55),
              fontWeight: FontWeight.w600,
            ),
          ),
        if (item.deliveryType == DeliveryType.link)
          _Chip(label: 'LINK', color: AppColors.warning),
        if (meta.isNotEmpty)
          Text(
            meta.toUpperCase(),
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.primary,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.9,
            ),
          ),
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.6,
            ),
      ),
    );
  }
}
