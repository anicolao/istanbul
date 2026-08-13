import { expect, type Page, type TestInfo } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface Verification {
  spec: string;
  check: () => Promise<void>;
}

interface DocStep {
  title: string;
  image: string;
  specs: string[];
  actor: string;
}

export class ScenarioJournal {
  steps: DocStep[] = [];
  title = '';
  description = '';
}

export async function expectInterfaceToFit(page: Page) {
  const problems = await page.evaluate(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    const tolerance = 1;
    const root = document.querySelector<HTMLElement>('[data-e2e-layout]');
    if (!root) return ['missing [data-e2e-layout] root'];
    const failures: string[] = [];
    const label = (element: HTMLElement) => {
      const identity = element.getAttribute('data-testid')
        || element.getAttribute('aria-label')
        || element.id
        || element.className?.toString().split(/\s+/).filter(Boolean).slice(0, 2).join('.')
        || '';
      return `${element.tagName.toLowerCase()}${identity ? `[${identity}]` : ''}`;
    };
    const visible = (element: HTMLElement) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const clippedByAncestor = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      let ancestor = element.parentElement;
      while (ancestor && ancestor !== root.parentElement) {
        const style = getComputedStyle(ancestor);
        if ([style.overflow, style.overflowX, style.overflowY].some((value) => value === 'hidden' || value === 'clip')) {
          const bounds = ancestor.getBoundingClientRect();
          if (
            rect.left < bounds.left - tolerance || rect.top < bounds.top - tolerance
            || rect.right > bounds.right + tolerance || rect.bottom > bounds.bottom + tolerance
          ) return label(ancestor);
        }
        ancestor = ancestor.parentElement;
      }
      return '';
    };

    const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    if (documentWidth > innerWidth + tolerance || documentHeight > innerHeight + tolerance) {
      failures.push(`document scrolls: ${documentWidth}×${documentHeight} inside ${innerWidth}×${innerHeight}`);
    }
    if (scrollX !== 0 || scrollY !== 0) failures.push(`window is scrolled to ${scrollX},${scrollY}`);

    for (const element of [root, ...root.querySelectorAll<HTMLElement>('[data-e2e-fit]')]) {
      if (!visible(element)) continue;
      const rect = element.getBoundingClientRect();
      if (
        rect.left < -tolerance || rect.top < -tolerance
        || rect.right > innerWidth + tolerance || rect.bottom > innerHeight + tolerance
      ) {
        failures.push(`${label(element)} leaves viewport: ${rect.left.toFixed(1)},${rect.top.toFixed(1)}–${rect.right.toFixed(1)},${rect.bottom.toFixed(1)}`);
      }
      const clippingAncestor = clippedByAncestor(element);
      if (clippingAncestor) failures.push(`${label(element)} is clipped by ${clippingAncestor}`);
    }

    for (const element of root.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href]')) {
      if (!visible(element)) continue;
      const rect = element.getBoundingClientRect();
      if (
        rect.left < -tolerance || rect.top < -tolerance
        || rect.right > innerWidth + tolerance || rect.bottom > innerHeight + tolerance
      ) failures.push(`${label(element)} control leaves viewport`);
      const clippingAncestor = clippedByAncestor(element);
      if (clippingAncestor) failures.push(`${label(element)} control is clipped by ${clippingAncestor}`);
    }

    for (const element of root.querySelectorAll<HTMLElement>('[data-e2e-no-scroll]')) {
      if (!visible(element)) continue;
      if (
        element.scrollWidth > element.clientWidth + tolerance
        || element.scrollHeight > element.clientHeight + tolerance
      ) {
        failures.push(`${label(element)} clips or scrolls: ${element.scrollWidth}×${element.scrollHeight} inside ${element.clientWidth}×${element.clientHeight}`);
      }
      if (element.scrollLeft !== 0 || element.scrollTop !== 0) {
        failures.push(`${label(element)} is internally scrolled to ${element.scrollLeft},${element.scrollTop}`);
      }
    }

    for (const statusArea of root.querySelectorAll<HTMLElement>('[data-e2e-status-area]')) {
      if (!visible(statusArea)) continue;
      const statusBounds = statusArea.getBoundingClientRect();
      const clippingAncestor = clippedByAncestor(statusArea);
      if (clippingAncestor) failures.push(`${label(statusArea)} status area is clipped by ${clippingAncestor}`);
      for (const content of statusArea.querySelectorAll<HTMLElement>('*')) {
        if (!visible(content)) continue;
        const bounds = content.getBoundingClientRect();
        if (
          bounds.left < statusBounds.left - tolerance || bounds.top < statusBounds.top - tolerance
          || bounds.right > statusBounds.right + tolerance || bounds.bottom > statusBounds.bottom + tolerance
        ) failures.push(`${label(content)} leaves ${label(statusArea)} status area`);
        const contentClippingAncestor = clippedByAncestor(content);
        if (contentClippingAncestor) failures.push(`${label(content)} status content is clipped by ${contentClippingAncestor}`);
      }
    }

    if (root.dataset.tabletopRoute === 'true') {
      const privateControls = root.querySelectorAll('.hand, [aria-label^="Inspect Bonus card:"]');
      if (privateControls.length) failures.push(`tabletop exposes ${privateControls.length} private hand element(s)`);
    }

    return failures;
  });
  expect(problems, problems.join('\n')).toEqual([]);
}

export class TestStepHelper {
  private count = 0;
  private journal: ScenarioJournal;

  constructor(
    private page: Page,
    private testInfo: TestInfo,
    journal?: ScenarioJournal,
    private actor = 'Player'
  ) {
    this.journal = journal ?? new ScenarioJournal();
  }

  setMetadata(title: string, description: string) {
    this.journal.title = title;
    this.journal.description = description;
  }

  async step(
    id: string,
    options: { description: string; verifications: Verification[]; status?: string }
  ) {
    for (const verification of options.verifications) await verification.check();
    await expect(this.page.locator('[role="status"][data-status]')).toHaveAttribute(
      'data-status',
      options.status ?? 'synced'
    );
    await this.page.bringToFront();
    await this.page.mouse.move(0, 0);
    await expectInterfaceToFit(this.page);

    const index = String(this.count++).padStart(3, '0');
    const platform = process.platform === 'linux' ? '-linux' : '';
    const filename = `${index}-${id}-${this.testInfo.project.name}${platform}.png`;
    await expect(this.page).toHaveScreenshot(filename);
    this.journal.steps.push({
      title: options.description,
      image: `./screenshots/${filename}`,
      specs: options.verifications.map(({ spec }) => spec),
      actor: this.actor
    });
  }

  generateDocs() {
    if (this.testInfo.project.name !== 'desktop' || process.platform === 'linux') return;
    let content = `# ${this.journal.title}\n\n${this.journal.description}\n\n`;
    for (const [index, step] of this.journal.steps.entries()) {
      content += `## ${index + 1}. ${step.title}\n\n`;
      content += `**${step.actor}** — ${step.title}\n\n`;
      content += `![${step.title}](${step.image})\n\n`;
      content += `**Verifications:**\n\n${this.stepsForDocs(step)}\n\n`;
    }
    fs.writeFileSync(
      path.join(path.dirname(this.testInfo.file), 'README.md'),
      `${content.trimEnd()}\n`
    );
  }

  private stepsForDocs(step: DocStep) {
    return step.specs.map((spec) => `- [x] ${spec}`).join('\n');
  }
}
