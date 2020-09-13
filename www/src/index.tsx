import { h, render } from 'preact';

const App = () => <h1>Hello from Preact and Typescript!</h1>;

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
render(<App />, document.getElementById('root')!);
