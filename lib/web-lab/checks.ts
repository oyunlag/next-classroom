import type { CardExercise, Check } from "./lessons";
import { games, type GameId, type GameResult } from "./games";
export type CheckResult = { label: string; passed: boolean; detail?: string };

const borderWidth = /^border-(top|right|bottom|left)-width$/;
const pixels = /^-?\d+(?:\.\d+)?px$/;

function checkStyle(
  document: Document,
  element: Element,
  property: string,
  expected: string,
) {
  const view = document.defaultView;
  const computed = view?.getComputedStyle(element);
  const actual = computed?.getPropertyValue(property).trim() ?? "";
  if (!view || !computed) return { actual, passed: false };

  if (
    borderWidth.test(property) &&
    expected !== "0px" &&
    element instanceof view.HTMLElement &&
    "zoom" in element.style
  ) {
    // CSS borders are snapped to device pixels. Measure at a higher effective
    // zoom to distinguish nearby declarations that paint the same border.
    const originalStyle = element.getAttribute("style");
    const ownZoom = Number.parseFloat(computed.getPropertyValue("zoom")) || 1;
    const effectiveZoom = element.currentCSSZoom || ownZoom;
    element.style.setProperty(
      "zoom",
      String((8 * ownZoom) / effectiveZoom),
      "important",
    );
    try {
      const normalized = view
        .getComputedStyle(element)
        .getPropertyValue(property);
      return {
        actual: normalized,
        passed:
          pixels.test(normalized) &&
          Math.abs(
            Number.parseFloat(normalized) - Number.parseFloat(expected),
          ) < 0.25,
      };
    } finally {
      if (originalStyle === null) element.removeAttribute("style");
      else element.setAttribute("style", originalStyle);
    }
  }

  if (actual === expected) return { actual, passed: true };
  if (!pixels.test(actual) || !pixels.test(expected))
    return { actual, passed: false };
  const declared = element.computedStyleMap?.().get(property)?.toString();
  return {
    actual,
    passed:
      declared === expected ||
      Math.abs(Number.parseFloat(actual) - Number.parseFloat(expected)) < 0.05,
  };
}

export function checkGame(game: GameId, result: GameResult): CheckResult[] {
  if ("error" in result) return [{ label: result.error, passed: false }];
  const { rolls, expected } = games[game];
  return expected.flatMap((row, choice) =>
    row.map((answer, roll) => ({
      label: rolls.length
        ? `${rolls[choice]} / ${rolls[roll]} → ${answer}`
        : `roll = ${roll + 1} → ${answer}`,
      passed: result.answers[choice]?.[roll] === answer,
    })),
  );
}

export function checkExercise(
  exercise: CardExercise,
  document: Document,
): CheckResult[] {
  return exercise.checks.map((check: Check) => {
    if (check.kind === "count") {
      return {
        label: check.label,
        passed:
          document.querySelectorAll(check.selector).length === check.value,
      };
    }
    const element = document.querySelector(check.selector);
    if (!element)
      return {
        label: check.label,
        passed: false,
        detail: `${check.selector} элемент олдсонгүй.`,
      };
    let passed = false;
    switch (check.kind) {
      case "element":
        passed = true;
        break;
      case "text":
        passed =
          element.textContent?.trim().replace(/\s+/g, " ") === check.value;
        break;
      case "content":
        passed = Boolean(element.textContent?.trim());
        break;
      case "image": {
        const ImageElement = document.defaultView?.HTMLImageElement;
        passed = Boolean(
          ImageElement &&
          element instanceof ImageElement &&
          element.complete &&
          element.naturalWidth > 0 &&
          element.alt.trim(),
        );
        break;
      }
      case "style": {
        const result = checkStyle(
          document,
          element,
          check.property,
          check.value,
        );
        return {
          label: check.label,
          passed: result.passed,
          ...(result.passed
            ? {}
            : {
                detail: `${check.property}: ${result.actual || "утга алга"} → ${check.value}`,
              }),
        };
      }
      case "style-not": {
        const value = document.defaultView
          ?.getComputedStyle(element)
          .getPropertyValue(check.property);
        passed = Boolean(value && value !== check.value);
        break;
      }
      default: {
        const exhaustive: never = check;
        throw new Error(`Unknown check ${exhaustive}`);
      }
    }
    return { label: check.label, passed };
  });
}
