export function getScrollTop(): number {
    return (
        (window.pageYOffset || document.documentElement.scrollTop) -
        (document.documentElement.clientTop || 0)
    );
}
