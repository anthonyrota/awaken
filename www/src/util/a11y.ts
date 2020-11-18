const a11yIdNamespaceCounts: Record<string, number> = {};

export function generateUniqueA11yId(namespace: string) {
    return `a11y-${namespace}-${
        namespace in a11yIdNamespaceCounts
            ? ++a11yIdNamespaceCounts[namespace]
            : (a11yIdNamespaceCounts[namespace] = 0)
    }`;
}
