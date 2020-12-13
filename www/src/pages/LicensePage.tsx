import { h, Fragment, VNode } from 'preact';
import { DeepCoreNode } from '../../script/docs/core/nodes';
import { CodeSpanNode } from '../../script/docs/core/nodes/CodeSpan';
import { HeadingNode } from '../../script/docs/core/nodes/Heading';
import { ListNode, ListType } from '../../script/docs/core/nodes/List';
import { PageNode } from '../../script/docs/core/nodes/Page';
import { ParagraphNode } from '../../script/docs/core/nodes/Paragraph';
import { PlainTextNode } from '../../script/docs/core/nodes/PlainText';
import { SubheadingNode } from '../../script/docs/core/nodes/Subheading';
import { DocumentTitle, WebsiteNamePositionEnd } from '../Head';
import { AppPathBaseProps } from './base';
import { DocPageContent } from './DocPage';

export interface LicensePageProps extends AppPathBaseProps {}

export function LicensePage({ mainRef }: LicensePageProps): VNode {
    return (
        <Fragment>
            <DocumentTitle
                title="LICENSE (MIT)"
                websiteNamePosition={WebsiteNamePositionEnd}
            />
            <DocPageContent
                mainRef={mainRef}
                page={licensePageNode}
                pagePath={'/license'}
                title={'The MIT License (MIT)'}
                nextPageId="core--introduction"
            />
        </Fragment>
    );
}

const licensePageNode = PageNode<DeepCoreNode>({
    pageId: 'license',
    children: [
        ParagraphNode({
            children: [
                PlainTextNode({
                    text: 'Copyright (c) ',
                }),
                CodeSpanNode({
                    children: [
                        PlainTextNode({
                            text: '2020',
                        }),
                    ],
                }),
                PlainTextNode({
                    text: ' Anthony Rota',
                }),
            ],
        }),
        ParagraphNode({
            children: [
                PlainTextNode({
                    text:
                        'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:',
                }),
            ],
        }),
        ParagraphNode({
            children: [
                PlainTextNode({
                    text:
                        'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.',
                }),
            ],
        }),
        ParagraphNode({
            children: [
                PlainTextNode({
                    text:
                        'THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
                }),
            ],
        }),
        HeadingNode({
            children: [
                PlainTextNode({
                    text: 'Summary',
                }),
            ],
        }),
        SubheadingNode({
            children: [
                PlainTextNode({
                    text: 'Permissions',
                }),
            ],
        }),
        ListNode({
            listType: {
                type: ListType.Unordered,
            },
            children: [
                'Commercial use - you may use this commercially.',
                'Modification - you may make changes to the source code.',
                'Distribution - you are free to distribute the source code.',
                'Private use - you can use the code for private use.',
            ].map((text) =>
                ParagraphNode({
                    children: [
                        PlainTextNode({
                            text,
                        }),
                    ],
                }),
            ),
        }),
        SubheadingNode({
            children: [
                PlainTextNode({
                    text: 'Limitations',
                }),
            ],
        }),
        ListNode({
            listType: {
                type: ListType.Unordered,
            },
            children: [
                'No liability - the code is provided "as is".',
                'No warranty.',
            ].map((text) =>
                ParagraphNode({
                    children: [
                        PlainTextNode({
                            text,
                        }),
                    ],
                }),
            ),
        }),
        SubheadingNode({
            children: [
                PlainTextNode({
                    text: 'Conditions',
                }),
            ],
        }),
        ListNode({
            listType: {
                type: ListType.Unordered,
            },
            children: [
                'Copyright notice - it would be appreciated if you include the copyright notice in all copies or substantial uses of this project.',
                'License notice - it would be appreciated if you include the license notice in all copies or substantial uses of this project.',
            ].map((text) =>
                ParagraphNode({
                    children: [
                        PlainTextNode({
                            text,
                        }),
                    ],
                }),
            ),
        }),
        SubheadingNode({
            children: [
                PlainTextNode({
                    text: 'TL;DR',
                }),
            ],
        }),
        ParagraphNode({
            children: [
                PlainTextNode({
                    text:
                        'This is one of the most permissive free software licenses. You can basically do whatever you want with the source code - but it would be appreciated if you add a copy of the original MIT license and copyright notice to it.',
                }),
            ],
        }),
    ],
});
