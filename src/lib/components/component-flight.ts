/** Shared viewport geometry for component flights, including rotated player mats. */
export function flyComponent(
  token: HTMLElement,
  source: HTMLElement,
  target: HTMLElement,
  surface: HTMLElement,
  options: {
    duration: number;
    delay?: number;
    fade?: boolean;
    emerge?: boolean;
    aspectRatio?: number;
  }
) {
  const a = source.getBoundingClientRect(),
    b = target.getBoundingClientRect(),
    bounds = surface.getBoundingClientRect();
  const size = Math.max(24, Math.min(a.width, a.height));
  const height = size / (options.aspectRatio ?? 1);
  const x = a.left + a.width / 2 - bounds.left - size / 2;
  const y = a.top + a.height / 2 - bounds.top - height / 2;
  const tx = b.left + b.width / 2 - bounds.left - size / 2;
  const ty = b.top + b.height / 2 - bounds.top - height / 2;
  const scale = (Math.min(b.width, b.height) * 0.85) / size;
  const mat = target.closest<HTMLElement>('[data-player-uid]');
  const angle = mat
    ? parseFloat(getComputedStyle(mat).getPropertyValue('--rotation')) || 0
    : 0;
  token.style.width = `${size}px`;
  token.style.height = `${height}px`;
  return token.animate(
    [
      {
        transform: `translate(${x}px,${y + (options.emerge ? 15 : 0)}px) scale(${options.emerge ? 0.7 : 1}) rotate(0deg)`,
        opacity: options.emerge ? 0 : 1
      },
      ...(options.emerge
        ? [
            {
              transform: `translate(${x}px,${y}px) scale(1) rotate(0deg)`,
              opacity: 1,
              offset: 0.15
            }
          ]
        : []),
      {
        transform: `translate(${x + (tx - x) * 0.45}px,${y + (ty - y) * 0.45 - 45}px) scale(1.25) rotate(${angle * 0.45}deg)`,
        opacity: 1,
        offset: 0.45
      },
      {
        transform: `translate(${tx}px,${ty}px) scale(${scale}) rotate(${angle}deg)`,
        opacity: options.fade ? 0 : 1
      }
    ],
    {
      duration: options.duration,
      delay: options.delay ?? 0,
      easing: 'cubic-bezier(.35,0,.3,1)',
      fill: 'none'
    }
  );
}
