export function stopEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
}
