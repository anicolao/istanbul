The game symbol font is a subset of [Noto Sans Math](https://github.com/google/fonts/tree/main/ofl/notosansmath), licensed under the adjacent SIL Open Font License. It provides arrows, comparison signs, and dice that are absent from our Atkinson Hyperlegible font.

Regenerate from `NotoSansMath-Regular.ttf` using FontTools with Brotli support:

```sh
pyftsubset NotoSansMath-Regular.ttf --unicodes=U+2190-21FF,U+2264-2265,U+2680-2685 --flavor=woff2 --output-file=noto-sans-math-game-symbols.woff2
```
