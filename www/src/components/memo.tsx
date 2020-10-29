import { h, Component, FunctionalComponent } from 'preact';

export function memo<Props>(
    Comp: FunctionalComponent<Props>,
    shouldComponentUpdate: (previousProps: Props, nextProps: Props) => boolean,
) {
    return class extends Component<Props> {
        static displayName = `Memo(${
            typeof Comp == 'string' ? Comp : Comp.displayName || Comp.name
        })`;
        shouldComponentUpdate(nextProps) {
            return shouldComponentUpdate(this.props, nextProps);
        }
        render(props: Props) {
            return <Comp {...props}></Comp>;
        }
    };
}
