import { createMemoryHistory } from 'history';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { App } from '../../src/App';
import { setCustomHistory } from '../../src/hooks/useHistory';

export function renderAppAtPath(pathname: string): string {
    setCustomHistory(
        createMemoryHistory({
            initialEntries: [pathname],
        }),
    );
    return render(<App path={{ pathname }} />);
}
