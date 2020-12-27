import { distance } from 'fastest-levenshtein';
import FlexSearch from 'flexsearch';
import {
    h,
    Fragment,
    VNode,
    JSX,
    ComponentChildren,
    ComponentChild,
} from 'preact';
import {
    useState,
    useRef,
    useLayoutEffect,
    useMemo,
    useEffect,
} from 'preact/hooks';
import { CoreNodeType, DeepCoreNode } from '../../script/docs/core/nodes';
import { extractTextNodes } from '../../script/docs/core/nodes/util/extractTextNodes';
import { isBlock } from '../../script/docs/core/nodes/util/isBlock';
import { Pages } from '../../script/docs/types';
import {
    getGithubUrl,
    getPagesMetadata,
    ResponseDoneType,
} from '../data/docPages';
import { isBrowser, isMobile, isStandalone } from '../env';
import { useDocPagesResponseState } from '../hooks/useDocPagesResponseState';
import {
    useFullScreenOverlayState,
    FullScreenOverlayOpenTransitionType,
    FullScreenOverlayCloseWithSettingFocusTransitionType,
    FullScreenOverlayCloseWithoutSettingFocusTransitionType,
} from '../hooks/useFullScreenOverlayState';
import {
    customHistory,
    whileIgnoringChange,
    useDidPathChange,
} from '../hooks/useHistory';
import {
    BindKeysNoRequireFocus,
    NoBindKeys,
} from '../hooks/useNavigationListKeyBindings';
import { useOverlayEscapeKeyBinding } from '../hooks/useOverlayEscapeKeyBinding';
import { usePrevious } from '../hooks/usePrevious';
import { useSizeShowMenuChange } from '../hooks/useSizeShowMenu';
import { useSticky, UseStickyJsStickyActive } from '../hooks/useSticky';
import { useTrapFocus } from '../hooks/useTrapFocus';
import { ThemeDark, ThemeLight, getTheme, setTheme } from '../theme';
import { Cancelable, CancelToken } from '../util/Cancelable';
import { findIndex } from '../util/findIndex';
import { getScrollTop } from '../util/getScrollTop';
import { ScheduleQueue } from '../util/ScheduleQueue';
import { stopEvent } from '../util/stopEvent';
import { DocPageLink } from './DocPageLink';
import { FullSiteNavigationContents } from './FullSiteNavigationContents';
import {
    Link,
    isStringActivePath,
    isDocPageIdActivePath,
    navigateTo,
} from './Link';

const { pageIdToPageTitle, pageIdToWebsitePath } = getPagesMetadata();
const githubUrl = getGithubUrl();
const maxSnippetLength = 150;
const padWords = 5;
const maxPadLength = 50;
const maxResults = 15;

interface ExtractedTextRegion {
    heading: {
        hash: string;
        text: string;
    } | null;
    contentText: string;
}

function getCurrentTextRegion(
    textRegions: ExtractedTextRegion[] = [],
): ExtractedTextRegion {
    if (textRegions.length === 0) {
        const currentTextRegion: ExtractedTextRegion = {
            heading: null,
            contentText: '',
        };
        textRegions[0] = currentTextRegion;
        return currentTextRegion;
    }
    return textRegions[textRegions.length - 1];
}

function extractTextRegions(
    node: DeepCoreNode,
    textRegions: ExtractedTextRegion[] = [],
    documentTitle: string,
): ExtractedTextRegion[] {
    if (
        (node.type === CoreNodeType.Heading123456 ||
            node.type === CoreNodeType.Heading ||
            node.type === CoreNodeType.Subheading ||
            node.type === CoreNodeType.Title) &&
        node.alternateId !== undefined
    ) {
        const text = extractTextNodes(node, [], {
            includeCodeBlocks: false,
        })
            .map((textNode) => textNode.text)
            .join('');
        if (text.trim() !== documentTitle.trim()) {
            textRegions.push({
                heading: {
                    hash: node.alternateId,
                    text,
                },
                contentText: '',
            });
        }
    } else if ('children' in node) {
        for (let i = 0; i < node.children.length; i++) {
            const childNode = node.children[i];
            if (
                childNode.type === CoreNodeType.Title &&
                childNode.children.length === 1 &&
                !childNode.alternateId
            ) {
                const onlyChild = childNode.children[0];
                if (onlyChild.type === CoreNodeType.PlainText) {
                    if (
                        onlyChild.text === 'Signature' ||
                        onlyChild.text === 'Parameters' ||
                        onlyChild.text === 'Returns' ||
                        onlyChild.text === 'Example Usage'
                    ) {
                        continue;
                    }
                    if (onlyChild.text === 'See Also') {
                        i++;
                        continue;
                    }
                }
            }
            extractTextRegions(childNode, textRegions, documentTitle);
        }
    }

    switch (node.type) {
        case CoreNodeType.CollapsibleSection: {
            if (node.summaryNode) {
                extractTextRegions(
                    node.summaryNode,
                    textRegions,
                    documentTitle,
                );
                getCurrentTextRegion(textRegions).contentText += '\n';
            }
            break;
        }
        case CoreNodeType.Table: {
            node.header.children.forEach((cellNode) => {
                if (
                    cellNode.type === CoreNodeType.PlainText &&
                    ['Parameter', 'Type', 'Description'].indexOf(
                        cellNode.text,
                    ) !== -1
                ) {
                    return;
                }
                extractTextRegions(cellNode, textRegions, documentTitle);
                getCurrentTextRegion(textRegions).contentText += '\n';
            });
            node.rows.forEach((row) => {
                row.children.forEach((cellNode) => {
                    extractTextRegions(cellNode, textRegions, documentTitle);
                    getCurrentTextRegion(textRegions).contentText += '\n';
                });
            });
            break;
        }
        case CoreNodeType.PlainText: {
            if (
                node.text.startsWith('Source Location') ||
                node.text.includes('#L')
            ) {
                break;
            }
            getCurrentTextRegion(textRegions).contentText += node.text;
            break;
        }
    }

    if (isBlock(node)) {
        getCurrentTextRegion(textRegions).contentText += '\n';
    }

    return textRegions;
}

interface IndexablePageContent {
    id: string;
    title: string;
    content: string;
    textRegions: ExtractedTextRegion[];
}

function buildIndexableContent(pages: Pages): IndexablePageContent[] {
    return pages.map((page) => {
        const textRegions = extractTextRegions(
            page,
            [],
            pageIdToPageTitle[page.pageId],
        );
        let content = '';
        textRegions.forEach((textRegion) => {
            if (textRegion.heading) {
                content += textRegion.heading.text + '\n';
            }
            textRegion.contentText = textRegion.contentText
                .trim()
                .replace(/\n+/g, '\n');
            content += textRegion.contentText;
        });
        return {
            id: page.pageId,
            title: pageIdToPageTitle[page.pageId],
            content: content,
            textRegions,
        };
    });
}

function buildIndex(indexableContent: IndexablePageContent[]) {
    const flexSearch = FlexSearch.create<IndexablePageContent>({
        async: false,
        doc: {
            id: 'id',
            field: {
                title: {
                    // cspell:disable-next-line
                    encode: 'icase',
                    tokenize: 'full',
                    resolution: 9,
                },
                content: {
                    // cspell:disable-next-line
                    encode: 'icase',
                    tokenize: 'full',
                    threshold: 1,
                    resolution: 3,
                },
            },
        },
    });
    indexableContent.forEach((item) => {
        flexSearch.add(item);
    });
    return flexSearch;
}

const stopWords = [
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'but',
    'by',
    'for',
    'if',
    'in',
    'into',
    'is',
    'it',
    'no',
    'not',
    'of',
    'on',
    'or',
    'such',
    'that',
    'the',
    'their',
    'then',
    'there',
    'these',
    'they',
    'this',
    'to',
    'was',
    'will',
    'with',
];

// TODO: cleanup.
interface MatchTextRange {
    startIndex: number;
    endIndex: number;
    originalWord: string;
    matchedSubstr: string;
    keepIfFullWordMatch: boolean;
    score: number;
}

interface MatchTextResult {
    matchRanges: MatchTextRange[];
}

interface CachedWordMatchResult {
    startIndex: number;
    originalWord: string;
    matchedSubstr: string;
    keepIfFullWordMatch: boolean;
    score: number;
}

type WordMatchCache = Record<string, CachedWordMatchResult | null>;

function findRoughMatchRangesInText(
    cancelToken: CancelToken,
    text: string,
    queryTokens: string[],
    wordCache: WordMatchCache,
    callback: (result: MatchTextResult) => void,
) {
    const tokenBoundaryRegexp = /\w+/g;
    const matchRanges: (MatchTextRange & {
        keepIfFullWordMatch: boolean;
    })[] = [];
    let hasFullWordMatch = false;
    const queue = new ScheduleQueue(cancelToken);
    function queueNext(): void {
        match = tokenBoundaryRegexp.exec(text);
        while (match && stopWords.indexOf(match[0].toLowerCase()) !== -1) {
            match = tokenBoundaryRegexp.exec(text);
        }
        if (match) {
            queue.queueTask(task);
        } else if (!cancelToken.canceled) {
            callback({
                matchRanges: hasFullWordMatch
                    ? matchRanges.filter(
                          (matchRange) => matchRange.keepIfFullWordMatch,
                      )
                    : matchRanges,
            });
        }
    }
    let match: RegExpExecArray | null;
    function task(): void {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const word = match![0].toLowerCase();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { index } = match!;
        const cached = wordCache[word];
        if (cached !== undefined) {
            if (cached === null) {
                queueNext();
                return;
            }
            const isFullWordMatch = cached.matchedSubstr.length === word.length;
            matchRanges.push({
                startIndex: index + cached.startIndex,
                endIndex:
                    index + cached.startIndex + cached.matchedSubstr.length,
                originalWord: word,
                matchedSubstr: cached.matchedSubstr,
                keepIfFullWordMatch: cached.keepIfFullWordMatch,
                score: cached.score,
            });
            if (isFullWordMatch) {
                hasFullWordMatch = true;
            }
            queueNext();
            return;
        }
        if (queryTokens.indexOf(word) !== -1) {
            const matchScore = word.length * 2;
            wordCache[word] = {
                startIndex: 0,
                originalWord: word,
                matchedSubstr: word,
                keepIfFullWordMatch: true,
                score: matchScore,
            };
            matchRanges.push({
                startIndex: index,
                endIndex: index + word.length,
                originalWord: word,
                matchedSubstr: word,
                keepIfFullWordMatch: true,
                score: matchScore,
            });
            hasFullWordMatch = true;
            queueNext();
            return;
        }
        let bestSubstrScore: number | undefined;
        let bestSubstr: string | undefined;
        let bestSubstrStartIndex: number | undefined;
        // eslint-disable-next-line no-inner-declarations
        function onSubstr(substr: string, startIndex: number): boolean {
            for (let i = 0; i < queryTokens.length; i++) {
                const queryToken = queryTokens[i];
                const substrScore =
                    distance(queryToken, substr) / substr.length;
                if (
                    bestSubstrScore === undefined ||
                    substrScore < bestSubstrScore
                ) {
                    bestSubstrScore = substrScore;
                    bestSubstr = substr;
                    bestSubstrStartIndex = startIndex;
                    if (bestSubstrScore === 0) {
                        return true;
                    }
                }
            }
            return false;
        }
        const substrScoreCutoff = 0.2;
        const wordFirstChar = word[0];
        for (let i = 0; i < queryTokens.length; i++) {
            const token = queryTokens[i];
            if (wordFirstChar === token) {
                bestSubstrScore = substrScoreCutoff;
                bestSubstr = wordFirstChar;
                bestSubstrStartIndex = 0;
                break;
            }
        }
        let didBreak = false;
        for (let j = 2; j <= word.length; j++) {
            if (onSubstr(word.slice(0, j), 0)) {
                didBreak = true;
                break;
            }
        }
        if (!didBreak) {
            outer: for (let i = 1; i < word.length; i++) {
                for (let j = i + 3; j <= word.length; j++) {
                    if (onSubstr(word.slice(i, j), i)) {
                        didBreak = true;
                        break outer;
                    }
                }
            }
            if (bestSubstrScore === undefined) {
                onSubstr(word, 0);
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (bestSubstrScore! <= substrScoreCutoff) {
            const matchScore =
                bestSubstrScore === 0
                    ? // eslint-disable-next-line max-len
                      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                      bestSubstr!.length / 2
                    : // eslint-disable-next-line max-len
                      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                      0.5 / bestSubstrScore!;
            const keepIfFullWordMatch = // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                (bestSubstrStartIndex! === 0 && bestSubstr!.length > 2) ||
                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                (bestSubstrStartIndex! === 1 && bestSubstr!.length > 4);
            wordCache[word] = {
                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                startIndex: bestSubstrStartIndex!,
                originalWord: word,
                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                matchedSubstr: bestSubstr!,
                keepIfFullWordMatch,
                score: matchScore,
            };
            matchRanges.push({
                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                startIndex: index + bestSubstrStartIndex!,
                endIndex:
                    // eslint-disable-next-line max-len
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    index + bestSubstrStartIndex! + bestSubstr!.length,
                originalWord: word,
                // eslint-disable-next-line max-len
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                matchedSubstr: bestSubstr!,
                keepIfFullWordMatch,
                score: matchScore,
            });
        } else {
            wordCache[word] = null;
        }
        queueNext();
    }
    queueNext();
}

interface DocumentMatch {
    region: ExtractedTextRegion;
    regionHeadingMatches: MatchTextRange[] | null;
    textRanges: MatchTextRange[];
}

function findDocumentMatch(
    cancelToken: CancelToken,
    textRegions: ExtractedTextRegion[],
    queryTokens: string[],
    wordCache: WordMatchCache,
    callback: (documentMatch: DocumentMatch) => void,
): void {
    if (textRegions.length === 0) {
        return;
    }

    const results: {
        result: MatchTextResult;
        headingResult?: MatchTextResult;
    }[] = [];
    let finished = 0;

    textRegions.forEach((textRegion, i) => {
        function cb(result: MatchTextResult): void {
            if (textRegion.heading) {
                findRoughMatchRangesInText(
                    cancelToken,
                    textRegion.heading.text,
                    queryTokens,
                    wordCache,
                    (headingResult) => {
                        results[i] = {
                            result,
                            headingResult,
                        };
                        onResult();
                    },
                );
            } else {
                results[i] = {
                    result,
                };
                onResult();
            }
        }
        findRoughMatchRangesInText(
            cancelToken,
            textRegion.contentText,
            queryTokens,
            wordCache,
            cb,
        );
    });

    function onResult(): void {
        if (++finished !== textRegions.length) {
            return;
        }

        const doesMatchTextResultHasFullWordMatch = (
            matchTextResult: MatchTextResult,
        ) =>
            matchTextResult.matchRanges.some(
                (matchRange) =>
                    matchRange.endIndex - matchRange.startIndex ===
                    matchRange.originalWord.length,
            );

        const hasFullWordMatch = results.some(
            (result) =>
                doesMatchTextResultHasFullWordMatch(result.result) ||
                (result.headingResult &&
                    doesMatchTextResultHasFullWordMatch(result.headingResult)),
        );

        let bestTextRegion: ExtractedTextRegion;
        let bestRegionHeadingMatches: MatchTextRange[] | null = null;
        let bestMatchRanges: MatchTextRange[];
        let bestScore = -1;

        function getMatchedMultiplier(
            key: string,
            matchedWords: Record<string, number>,
        ): number {
            if (key[key.length - 1] === 's') {
                key = key.slice(0, -1);
            }
            if (key in matchedWords) {
                matchedWords[key] *= 4;
                return 1 / matchedWords[key];
            }
            matchedWords[key] = 1;
            return 1;
        }

        function calculateScoreFromMatchRanges(
            ranges: MatchTextRange[],
        ): number {
            const matchedWords: Record<string, number> = {};
            let score = 0;
            for (let i = 0; i < ranges.length; i++) {
                const range = ranges[i];
                if (hasFullWordMatch && !range.keepIfFullWordMatch) {
                    continue;
                }
                score +=
                    range.score *
                    getMatchedMultiplier(
                        range.originalWord + ':' + range.matchedSubstr,
                        matchedWords,
                    );
            }
            return score;
        }

        results.forEach((result, i) => {
            let score = calculateScoreFromMatchRanges(
                result.result.matchRanges,
            );
            if (result.headingResult) {
                score +=
                    2 *
                    calculateScoreFromMatchRanges(
                        result.headingResult.matchRanges,
                    );
            }
            if (score > bestScore) {
                bestTextRegion = textRegions[i];
                bestMatchRanges = result.result.matchRanges;
                bestRegionHeadingMatches = result.headingResult
                    ? result.headingResult.matchRanges
                    : null;
                bestScore = score;
            }
        });

        callback({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            region: bestTextRegion!,
            regionHeadingMatches: bestRegionHeadingMatches,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            textRanges: bestMatchRanges!,
        });
    }
}

interface SearchMatch {
    document: IndexablePageContent;
    titleMatchRanges: MatchTextRange[];
    heading: {
        text: string;
        hash: string;
        matchRanges: MatchTextRange[];
    } | null;
    contentSnippetStartIndex: number;
    contentSnippet: string;
    contentSnippetMatchRanges: MatchTextRange[];
}

function getContentSnippet(
    content: string,
    matchRanges: MatchTextRange[],
): {
    contentSnippet: string;
    contentSnippetStartIndex: number;
    contentSnippetMatchRanges: MatchTextRange[];
} {
    if (matchRanges.length === 0) {
        return {
            contentSnippetStartIndex: 0,
            contentSnippet: content.slice(0, maxSnippetLength),
            contentSnippetMatchRanges: [],
        };
    }
    let maximumMatchScore = 0;
    let bestStartMatchRange: MatchTextRange;
    let bestStartMatchRangeIndex: number;
    let bestEndMatchRange: MatchTextRange;
    let bestEndMatchRangeIndex: number;
    for (let i = 0; i < matchRanges.length; i++) {
        const startMatchRange = matchRanges[i];
        let endMatchRange: MatchTextRange;
        let endMatchRangeIndex: number;
        let matchScore = 0;
        for (let j = i; j < matchRanges.length; j++) {
            endMatchRange = matchRanges[j];
            endMatchRangeIndex = j;
            matchScore += endMatchRange.score;
            if (j !== i) {
                const distance =
                    endMatchRange.startIndex - matchRanges[j - 1].endIndex;
                if (distance < 6) {
                    matchScore += endMatchRange.score * 2;
                }
            }
            if (
                endMatchRange.endIndex - startMatchRange.startIndex >=
                maxSnippetLength
            ) {
                if (j !== i) {
                    endMatchRange = matchRanges[j - 1];
                    endMatchRangeIndex--;
                }
                break;
            }
        }
        if (matchScore > maximumMatchScore) {
            maximumMatchScore = matchScore;
            bestStartMatchRange = startMatchRange;
            bestStartMatchRangeIndex = i;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            bestEndMatchRange = endMatchRange!;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            bestEndMatchRangeIndex = endMatchRangeIndex!;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const startIndex = bestStartMatchRange!.startIndex;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const endIndex = bestEndMatchRange!.endIndex;
    const lastNWordsRegexp = RegExp(`\\S+(?:\\s+\\S+){0,${padWords - 1}}\\s*$`);
    const firstNWordsRegexp = /^\s*(?:\S+\s+\n?){0,3}[^\s]*/;
    const padStartTextMatch = lastNWordsRegexp.exec(
        content.substring(startIndex - maxPadLength, startIndex),
    );
    const padStartText = padStartTextMatch ? padStartTextMatch[0] : '';
    const startIndexIncludingPadStartText = startIndex - padStartText.length;
    const padEndTextMatch = firstNWordsRegexp.exec(
        content.slice(endIndex, endIndex + maxPadLength),
    );
    const padEndText = padEndTextMatch ? padEndTextMatch[0] : '';
    return {
        contentSnippetStartIndex: startIndexIncludingPadStartText,
        contentSnippet:
            padStartText + content.slice(startIndex, endIndex) + padEndText,
        contentSnippetMatchRanges: matchRanges
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .slice(bestStartMatchRangeIndex!, bestEndMatchRangeIndex! + 1)
            .map((matchRange) => ({
                startIndex:
                    matchRange.startIndex - startIndexIncludingPadStartText,
                endIndex: matchRange.endIndex - startIndexIncludingPadStartText,
                keepIfFullWordMatch: matchRange.keepIfFullWordMatch,
                matchedSubstr: matchRange.matchedSubstr,
                originalWord: matchRange.originalWord,
                score: matchRange.score,
            })),
    };
}

function useSearch():
    | ((
          query: string,
          cancelToken: CancelToken,
          callback: (matches: SearchMatch[]) => void,
      ) => void)
    | null {
    if (!isBrowser) {
        return null;
    }
    const responseState = useDocPagesResponseState();
    const index = useMemo(
        () =>
            responseState.type === ResponseDoneType
                ? buildIndex(buildIndexableContent(responseState.pages))
                : null,
        [responseState.type],
    );
    if (index === null) {
        return null;
    }
    return (query: string, cancelToken, callback) => {
        function indexCallback(content: IndexablePageContent[]): void {
            if (content.length === 0) {
                callback([]);
            }
            const queryTokensSet = new Set<string>();
            query.split(/\W+/).map((token) => {
                queryTokensSet.add(token.toLowerCase());
            });
            const queryTokens: string[] = [];
            queryTokensSet.forEach((queryToken) => {
                queryTokens.push(queryToken);
            });
            if (cancelToken.canceled) {
                return;
            }
            const searchMatches: SearchMatch[] = [];
            const titleMatchRangesList: MatchTextRange[][] = [];
            const contentMatchList: DocumentMatch[] = [];
            let completed = 0;
            function checkHasAllMatchRanges(): void {
                if (completed === content.length * 2) {
                    onHasAllMatchRanges();
                }
            }
            function onTitleMatch(
                documentMatch: DocumentMatch,
                i: number,
            ): void {
                completed++;
                titleMatchRangesList[i] = documentMatch.textRanges;
                checkHasAllMatchRanges();
            }
            function onContentMatch(
                documentMatch: DocumentMatch,
                i: number,
            ): void {
                completed++;
                contentMatchList[i] = documentMatch;
                checkHasAllMatchRanges();
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const wordCache: WordMatchCache = Object.create(null);
            for (let i = 0; i < content.length; i++) {
                const document = content[i];
                findDocumentMatch(
                    cancelToken,
                    [
                        {
                            heading: null,
                            contentText: document.title,
                        },
                    ],
                    queryTokens,
                    wordCache,
                    (documentMatch) => onTitleMatch(documentMatch, i),
                );
                findDocumentMatch(
                    cancelToken,
                    document.textRegions,
                    queryTokens,
                    wordCache,
                    (documentMatch) => onContentMatch(documentMatch, i),
                );
            }
            function onHasAllMatchRanges(): void {
                for (let i = 0; i < content.length; i++) {
                    const document = content[i];
                    const titleMatchRanges = titleMatchRangesList[i];
                    const contentDocumentMatch = contentMatchList[i];
                    const contentMatchRanges = contentDocumentMatch.textRanges;
                    const {
                        contentSnippetStartIndex,
                        contentSnippet,
                        contentSnippetMatchRanges,
                    } = getContentSnippet(
                        contentDocumentMatch.region.contentText,
                        contentMatchRanges,
                    );
                    searchMatches.push({
                        document,
                        titleMatchRanges,
                        heading: contentDocumentMatch.region.heading && {
                            hash: contentDocumentMatch.region.heading.hash,
                            text: contentDocumentMatch.region.heading.text,
                            // eslint-disable-next-line max-len
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, max-len
                            matchRanges: contentDocumentMatch.regionHeadingMatches!,
                        },
                        contentSnippetStartIndex,
                        contentSnippet,
                        contentSnippetMatchRanges,
                    });
                    if (cancelToken.canceled) {
                        return;
                    }
                }
                callback(searchMatches);
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        index.search(
            query,
            {
                limit: maxResults,
            },
            indexCallback,
        );
    };
}

export interface HeaderProps {
    enableMenu: boolean;
}

const githubLinkLabel = 'Open GitHub Repository';
const themeSwitchLabel = 'Toggle Dark Mode';
const toggleButtonLabel = 'Toggle Navigation Menu';

export function Header({ enableMenu }: HeaderProps): VNode {
    const searchInputRef = useRef<HTMLInputElement>();
    const headerRef = useRef<HTMLElement>();
    const menuRef = useRef<HTMLElement>();
    const toggleButtonRef = useRef<HTMLButtonElement>();
    const menuLinkRefs: { current: HTMLAnchorElement }[] = [];
    const firstFocusableElementRef = useRef<HTMLAnchorElement>();
    const startFocusPlaceholderRef = useRef<HTMLDivElement>();
    const endFocusPlaceholderRef = useRef<HTMLDivElement>();
    const previousScrollTopRef = useRef(0);

    const { 0: searchValue, 1: setSearchValue } = useState('');
    const { 0: searchMatches, 1: setSearchMatches } = useState<SearchMatch[]>(
        [],
    );
    const {
        0: selectedSearchResultIndex,
        1: setSelectedSearchResultIndex,
    } = useState(-1);
    const { 0: isSearchFocused, 1: setIsSearchFocused } = useState(false);
    const search = useSearch();
    const searchQueryCancelableRef = useRef<Cancelable | undefined>();
    const searchListItemRefsRef = useRef<(HTMLLIElement | null)[]>([]);

    const {
        stickyState: menuStickyToggleState,
        elRefCb: menuStickyMeasureRef,
    } = useSticky({
        useNativeSticky: false,
        calculateHeight: false,
    });

    const isMovingFocusManuallyRef = useRef(false);
    function manuallySetFocus(element: HTMLElement): void {
        isMovingFocusManuallyRef.current = true;
        element.focus();
        isMovingFocusManuallyRef.current = false;
    }

    const {
        isOpen: isMenuOpen,
        getIsOpen: getIsMenuOpen,
        transitionState: transitionMenuState,
        getTransitionType: getMenuTransitionType,
    } = useFullScreenOverlayState({
        setFocusOnOpen: () => manuallySetFocus(menuLinkRefs[0].current),
        setFocusOnClose: () => manuallySetFocus(toggleButtonRef.current),
    });

    if (useDidPathChange()) {
        transitionMenuState(
            FullScreenOverlayCloseWithoutSettingFocusTransitionType,
        );
        setIsSearchFocused(false);
    }

    useOverlayEscapeKeyBinding({
        getIsOpen: () => !!isMenuOpen,
        close: () =>
            transitionMenuState(
                FullScreenOverlayCloseWithSettingFocusTransitionType,
            ),
    });

    const isNodePartOfComponent = (node: Node) => {
        return (
            headerRef.current.contains(node) ||
            menuRef.current.contains(node) ||
            // In case the sticky one is being shown.
            node === toggleButtonRef.current
        );
    };

    useTrapFocus({
        getShouldTrapFocus: getIsMenuOpen,
        shouldIgnoreChangedFocus: isNodePartOfComponent,
        getStartFocusPlaceholder: () => startFocusPlaceholderRef.current,
        getEndFocusPlaceholder: () => endFocusPlaceholderRef.current,
        setFocusStart: () => {
            manuallySetFocus(firstFocusableElementRef.current);
        },
        setFocusEnd: () => {
            manuallySetFocus(menuLinkRefs[menuLinkRefs.length - 1].current);
        },
        onFocusOutside: () => {
            transitionMenuState(
                FullScreenOverlayCloseWithoutSettingFocusTransitionType,
            );
        },
    });

    const previousIsSearchFocused = usePrevious(isSearchFocused);
    if (!previousIsSearchFocused?.value && isSearchFocused) {
        setSelectedSearchResultIndex(0);
    }

    useEffect(() => {
        if (isSearchFocused) {
            return;
        }
        const listener = (event: KeyboardEvent): void => {
            if (
                event.ctrlKey ||
                event.metaKey ||
                event.altKey ||
                event.shiftKey
            ) {
                return;
            }

            switch (event.key) {
                case '/': {
                    focusSearch();
                    searchInputRef.current.setSelectionRange(
                        0,
                        searchValue.length,
                    );
                    stopEvent(event);
                    break;
                }
            }
        };
        document.addEventListener('keydown', listener);
        return () => {
            document.removeEventListener('keydown', listener);
        };
    }, [isSearchFocused]);

    useEffect(() => {
        if (!isSearchFocused || searchMatches.length === 0) {
            return;
        }
        const listener = (event: KeyboardEvent): void => {
            if (
                event.ctrlKey ||
                event.metaKey ||
                event.altKey ||
                event.shiftKey
            ) {
                return;
            }

            switch (event.key) {
                case 'ArrowUp':
                case 'Up': {
                    setSelectedSearchResultIndex(
                        selectedSearchResultIndex === 0 ||
                            selectedSearchResultIndex === -1
                            ? searchMatches.length - 1
                            : selectedSearchResultIndex - 1,
                    );
                    stopEvent(event);
                    break;
                }
                case 'ArrowDown':
                case 'Down': {
                    setSelectedSearchResultIndex(
                        selectedSearchResultIndex ===
                            searchMatches.length - 1 ||
                            selectedSearchResultIndex === -1
                            ? 0
                            : selectedSearchResultIndex + 1,
                    );
                    stopEvent(event);
                    break;
                }
                case 'Enter': {
                    if (selectedSearchResultIndex !== -1) {
                        const match = searchMatches[selectedSearchResultIndex];
                        navigateTo({
                            pathname: `/${
                                pageIdToWebsitePath[match.document.id]
                            }`,
                            hash: match.heading ? `#${match.heading.hash}` : '',
                            search: '',
                        });
                        stopEvent(event);
                    }
                    break;
                }
            }
        };
        document.addEventListener('keydown', listener);
        return () => {
            document.removeEventListener('keydown', listener);
        };
    }, [isSearchFocused, searchMatches, selectedSearchResultIndex]);

    useLayoutEffect(() => {
        if (isSearchFocused) {
            window.scrollTo(0, 0);
        }
    }, [isSearchFocused]);

    function searchQuery(
        search: (
            query: string,
            cancelToken: CancelToken,
            callback: (matches: SearchMatch[]) => void,
        ) => void,
        query: string,
    ): void {
        if (searchQueryCancelableRef.current) {
            searchQueryCancelableRef.current.cancel();
        }
        searchQueryCancelableRef.current = new Cancelable();
        search(query, searchQueryCancelableRef.current.token, (matches) => {
            setSearchMatches(matches);
            setSelectedSearchResultIndex(0);
        });
    }

    const previousSearch = usePrevious(search);
    if (!previousSearch && search && isSearchFocused) {
        searchQuery(search, searchValue);
    }

    const onSearchInput: JSX.GenericEventHandler<HTMLInputElement> = (e) => {
        const { value } = e.currentTarget;
        if (search) {
            searchQuery(search, value);
        }
        setSearchValue(value);
    };

    const focusSearch = () => {
        searchInputRef.current.focus();
    };

    const closeSearch = () => {
        searchInputRef.current.blur();
    };

    useOverlayEscapeKeyBinding({
        getIsOpen: () => {
            return (
                isBrowser && document.activeElement === searchInputRef.current
            );
        },
        close: closeSearch,
    });

    const onToggleButtonClick = () => {
        const isMenuOpen = getIsMenuOpen();
        const isMenuOpenAfterClick = !isMenuOpen;
        if (isMenuOpenAfterClick) {
            previousScrollTopRef.current = getScrollTop();
            whileIgnoringChange(() => {
                customHistory.replace(customHistory.location, {
                    beforeMenuOpenScrollTop: previousScrollTopRef.current,
                });
            });
        }
        transitionMenuState(
            isMenuOpenAfterClick
                ? FullScreenOverlayOpenTransitionType
                : FullScreenOverlayCloseWithSettingFocusTransitionType,
        );
    };

    const isDocumentationPage = Object.keys(pageIdToWebsitePath).some(
        isDocPageIdActivePath,
    );

    const goBack = (e: Event) => {
        e.preventDefault();
        customHistory.back();
    };

    const showBackButton =
        (isMobile || isStandalone) &&
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        window.history.state.idx !== 0;

    const showMenuStickyToggle =
        menuStickyToggleState === UseStickyJsStickyActive && !isMenuOpen;

    const previousShowMenuStickyToggle = usePrevious(showMenuStickyToggle);
    const toggleButtonOnSwitchShouldFocusRef = useRef(false);
    if (
        previousShowMenuStickyToggle &&
        previousShowMenuStickyToggle.value !== showMenuStickyToggle &&
        document.activeElement === toggleButtonRef.current
    ) {
        toggleButtonOnSwitchShouldFocusRef.current = true;
    }
    useLayoutEffect(() => {
        if (toggleButtonOnSwitchShouldFocusRef.current) {
            requestAnimationFrame(() => {
                toggleButtonOnSwitchShouldFocusRef.current = false;
                toggleButtonRef.current.focus();
            });
        }
    });

    useLayoutEffect((): (() => void) | void => {
        if (isMenuOpen) {
            window.scrollTo(0, 0);
        }
        if (
            getMenuTransitionType() ===
            FullScreenOverlayCloseWithSettingFocusTransitionType
        ) {
            window.scrollTo(0, previousScrollTopRef.current);
        }
        whileIgnoringChange(() => {
            customHistory.replace(customHistory.location, null);
        });
    }, [isMenuOpen]);

    useSizeShowMenuChange((isSizeShowMenu) => {
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (!isSizeShowMenu && !enableMenu) {
            transitionMenuState(
                FullScreenOverlayCloseWithSettingFocusTransitionType,
            );
        }
    }, isMenuOpen);

    const { 0: theme, 1: setThemeState } = useState(getTheme());

    const onThemeSwitchButtonClick = () => {
        const newTheme = theme === ThemeLight ? ThemeDark : ThemeLight;
        setTheme(newTheme);
        setThemeState(newTheme);
    };

    return (
        <Fragment>
            <div
                tabIndex={isMenuOpen ? 0 : -1}
                ref={startFocusPlaceholderRef}
            />
            <div
                class={
                    'cls-header__search__results-overlay' +
                    (isSearchFocused
                        ? ''
                        : ' cls-header__search__results-overlay--hidden')
                }
            ></div>
            <header
                role="banner"
                class={
                    'cls-header' +
                    (isSearchFocused ? ' cls-header--search-focused' : '')
                }
                ref={headerRef}
            >
                <div class="cls-header__contents">
                    <div class="cls-header__contents__container">
                        <div
                            class={
                                'cls-header__nav cls-header__nav__list' +
                                (showBackButton
                                    ? ' cls-header__nav--left-with-back-button'
                                    : '')
                            }
                        >
                            {showBackButton && (
                                <a
                                    class="cls-header__nav__link cls-header__back-button"
                                    role="img"
                                    aria-label="Go to Previous Page"
                                    title="Go to Previous Page"
                                    onClick={goBack}
                                    href=""
                                    ref={
                                        showBackButton
                                            ? firstFocusableElementRef
                                            : undefined
                                    }
                                >
                                    <svg
                                        class="cls-header__nav__icon"
                                        viewBox="0 0 16 24"
                                    >
                                        <title>Go to Previous Page</title>
                                        <path d="M11.67 3.87L9.9 2.1 0 12l9.9 9.9 1.77-1.77L3.54 12z" />
                                    </svg>
                                </a>
                            )}
                            <Link
                                innerRef={
                                    showBackButton
                                        ? undefined
                                        : firstFocusableElementRef
                                }
                                href="/"
                                class={
                                    'cls-header__nav__link' +
                                    (showBackButton
                                        ? ' cls-header__logo--next-to-back-button'
                                        : '')
                                }
                            >
                                <svg
                                    class="cls-header__logo-img cls-header__logo-img--with-text"
                                    role="img"
                                    aria-label="Tailwind CSS"
                                    viewBox="0 0 273 64"
                                >
                                    <title>Click to Go Home</title>
                                    <path
                                        fill="#14B4C6"
                                        d="M32 16c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C35.744 29.09 38.808 32.2 45.5 32.2c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C41.756 19.11 38.692 16 32 16zM18.5 32.2C11.3 32.2 6.8 35.8 5 43c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C22.244 45.29 25.308 48.4 32 48.4c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C28.256 35.31 25.192 32.2 18.5 32.2z"
                                    ></path>
                                    <path
                                        class="cls-header__logo-img__text-path"
                                        d="M85.996 29.652h-4.712v9.12c0 2.432 1.596 2.394 4.712 2.242V44.7c-6.308.76-8.816-.988-8.816-5.928v-9.12h-3.496V25.7h3.496v-5.104l4.104-1.216v6.32h4.712v3.952zm17.962-3.952h4.104v19h-4.104v-2.736c-1.444 2.014-3.686 3.23-6.65 3.23-5.168 0-9.462-4.37-9.462-9.994 0-5.662 4.294-9.994 9.462-9.994 2.964 0 5.206 1.216 6.65 3.192V25.7zm-6.004 15.58c3.42 0 6.004-2.546 6.004-6.08 0-3.534-2.584-6.08-6.004-6.08-3.42 0-6.004 2.546-6.004 6.08 0 3.534 2.584 6.08 6.004 6.08zm16.948-18.43c-1.444 0-2.622-1.216-2.622-2.622a2.627 2.627 0 012.622-2.622 2.627 2.627 0 012.622 2.622c0 1.406-1.178 2.622-2.622 2.622zM112.85 44.7v-19h4.104v19h-4.104zm8.854 0V16.96h4.104V44.7h-4.104zm30.742-19h4.332l-5.966 19h-4.028l-3.952-12.806-3.99 12.806h-4.028l-5.966-19h4.332l3.686 13.11 3.99-13.11h3.914l3.952 13.11 3.724-13.11zm9.424-2.85c-1.444 0-2.622-1.216-2.622-2.622a2.627 2.627 0 012.622-2.622 2.627 2.627 0 012.622 2.622c0 1.406-1.178 2.622-2.622 2.622zm-2.052 21.85v-19h4.104v19h-4.104zm18.848-19.494c4.256 0 7.296 2.888 7.296 7.828V44.7h-4.104V33.452c0-2.888-1.672-4.408-4.256-4.408-2.698 0-4.826 1.596-4.826 5.472V44.7h-4.104v-19h4.104v2.432c1.254-1.976 3.306-2.926 5.89-2.926zm26.752-7.106h4.104v26.6h-4.104v-2.736c-1.444 2.014-3.686 3.23-6.65 3.23-5.168 0-9.462-4.37-9.462-9.994 0-5.662 4.294-9.994 9.462-9.994 2.964 0 5.206 1.216 6.65 3.192V18.1zm-6.004 23.18c3.42 0 6.004-2.546 6.004-6.08 0-3.534-2.584-6.08-6.004-6.08-3.42 0-6.004 2.546-6.004 6.08 0 3.534 2.584 6.08 6.004 6.08zm23.864 3.914c-5.738 0-10.032-4.37-10.032-9.994 0-5.662 4.294-9.994 10.032-9.994 3.724 0 6.954 1.938 8.474 4.902l-3.534 2.052c-.836-1.786-2.698-2.926-4.978-2.926-3.344 0-5.89 2.546-5.89 5.966 0 3.42 2.546 5.966 5.89 5.966 2.28 0 4.142-1.178 5.054-2.926l3.534 2.014c-1.596 3.002-4.826 4.94-8.55 4.94zm15.314-14.25c0 3.458 10.222 1.368 10.222 8.398 0 3.8-3.306 5.852-7.41 5.852-3.8 0-6.536-1.71-7.752-4.446l3.534-2.052c.608 1.71 2.128 2.736 4.218 2.736 1.824 0 3.23-.608 3.23-2.128 0-3.382-10.222-1.482-10.222-8.284 0-3.572 3.078-5.814 6.954-5.814 3.116 0 5.7 1.444 7.03 3.952l-3.458 1.938c-.684-1.482-2.014-2.166-3.572-2.166-1.482 0-2.774.646-2.774 2.014zm17.518 0c0 3.458 10.222 1.368 10.222 8.398 0 3.8-3.306 5.852-7.41 5.852-3.8 0-6.536-1.71-7.752-4.446l3.534-2.052c.608 1.71 2.128 2.736 4.218 2.736 1.824 0 3.23-.608 3.23-2.128 0-3.382-10.222-1.482-10.222-8.284 0-3.572 3.078-5.814 6.954-5.814 3.116 0 5.7 1.444 7.03 3.952l-3.458 1.938c-.684-1.482-2.014-2.166-3.572-2.166-1.482 0-2.774.646-2.774 2.014z"
                                    ></path>
                                </svg>
                                <svg
                                    class="cls-header__logo-img cls-header__logo-img--without-text"
                                    role="img"
                                    aria-label="Click to Go Home"
                                    viewBox="0 0 64 64"
                                >
                                    <title>Tailwind CSS</title>
                                    <path
                                        fill="#14B4C6"
                                        d="M32 16.3c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C35.744 29.39 38.808 32.5 45.5 32.5c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C41.756 19.41 38.692 16.3 32 16.3zM18.5 32.5c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C22.244 45.59 25.308 48.7 32 48.7c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C28.256 35.61 25.192 32.5 18.5 32.5z"
                                    ></path>
                                </svg>
                            </Link>
                        </div>
                    </div>
                    <div
                        class="cls-header__search"
                        role="search"
                        aria-label="Site wide"
                    >
                        <input
                            type="search"
                            placeholder="Search..."
                            maxLength={100}
                            aria-label="Search Website"
                            class="cls-header__search__input"
                            value={searchValue}
                            onInput={onSearchInput}
                            onFocus={() => {
                                setIsSearchFocused(true);
                            }}
                            onBlur={() => {
                                requestAnimationFrame(() => {
                                    if (
                                        findIndex(
                                            searchListItemRefsRef.current,
                                            // TODO.
                                            (listItem) =>
                                                document.activeElement ===
                                                listItem?.querySelector('a'),
                                        ) === -1
                                    ) {
                                        setIsSearchFocused(false);
                                    }
                                });
                            }}
                            ref={searchInputRef}
                        />
                        <div class="cls-header__search__icon">
                            <svg
                                class="cls-header__search__icon__svg"
                                viewBox="0 0 20 20"
                            >
                                <path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"></path>
                            </svg>
                        </div>
                        {isSearchFocused &&
                            searchMatches &&
                            searchMatches.length !== 0 && (
                                <SearchResults
                                    searchMatches={searchMatches}
                                    selectedIndex={selectedSearchResultIndex}
                                    resetSelectedIndex={() => {
                                        setSelectedSearchResultIndex(-1);
                                    }}
                                    listItemRefsRef={searchListItemRefsRef}
                                ></SearchResults>
                            )}
                    </div>
                    <div class="cls-header__contents__container cls-header__contents__container--right-nav">
                        <nav
                            class="cls-header__nav"
                            aria-label="Quick Site Navigation Links"
                        >
                            <ul class="cls-header__nav__list cls-header__nav--pages">
                                <li
                                    class={
                                        'cls-header__nav__link-container' +
                                        (isDocumentationPage
                                            ? ' cls-header__nav__link-container--active'
                                            : '')
                                    }
                                >
                                    <DocPageLink
                                        class="cls-header__nav__link"
                                        pageId={'core--introduction'}
                                    >
                                        Documentation
                                    </DocPageLink>
                                </li>
                                <li
                                    class={
                                        'cls-header__nav__link-container' +
                                        (isStringActivePath('/license')
                                            ? ' cls-header__nav__link-container--active'
                                            : '')
                                    }
                                >
                                    <Link
                                        class="cls-header__nav__link"
                                        href="/license"
                                    >
                                        License
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                        <div class="cls-header__version">v0.0.1</div>
                        <div class="cls-header__nav cls-header__nav__list">
                            <label
                                class="cls-header__nav__link"
                                aria-label={themeSwitchLabel}
                                title={themeSwitchLabel}
                            >
                                <input
                                    class="cls-header__theme-checkbox-input"
                                    type="checkbox"
                                    checked={theme === ThemeDark}
                                    onInput={onThemeSwitchButtonClick}
                                />
                                <span class="cls-header__theme-checkbox-input-label-text">
                                    {theme === ThemeLight ? 'Light' : 'Dark'}
                                </span>
                            </label>
                            <a
                                class="cls-header__nav__link"
                                aria-label={githubLinkLabel}
                                title={githubLinkLabel}
                                href={githubUrl}
                            >
                                <svg
                                    class="cls-header__nav__icon"
                                    viewBox="0 0 20 20"
                                >
                                    <title>{githubLinkLabel}</title>
                                    <path d="M10 0a10 10 0 0 0-3.16 19.49c.5.1.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69a3.6 3.6 0 0 1 .1-2.64s.84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.4.1 2.64.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85l-.01 2.75c0 .26.18.58.69.48A10 10 0 0 0 10 0"></path>
                                </svg>
                            </a>
                            <button
                                class={
                                    'cls-header__nav__link cls-header__menu-toggle-button' +
                                    (enableMenu
                                        ? ' cls-header__menu-toggle-button--enabled'
                                        : '')
                                }
                                type="button"
                                tabIndex={showMenuStickyToggle ? -1 : 0}
                                disabled={showMenuStickyToggle}
                                aria-hidden={showMenuStickyToggle}
                                aria-expanded={isMenuOpen}
                                aria-label={toggleButtonLabel}
                                title={toggleButtonLabel}
                                onClick={onToggleButtonClick}
                                ref={
                                    showMenuStickyToggle
                                        ? undefined
                                        : toggleButtonRef
                                }
                            >
                                <ToggleButtonSvg
                                    class="cls-header__nav__icon cls-header__nav__icon--menu"
                                    isMenuOpen={isMenuOpen}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <span ref={menuStickyMeasureRef} />
            <button
                class={
                    'cls-header__menu-toggle-button cls-header__sticky-menu-toggle-button' +
                    (showMenuStickyToggle
                        ? ' cls-header__sticky-menu-toggle-button--show'
                        : '') +
                    (enableMenu
                        ? ' cls-header__menu-toggle-button--enabled'
                        : '')
                }
                type="button"
                tabIndex={showMenuStickyToggle ? 0 : -1}
                disabled={!showMenuStickyToggle}
                aria-hidden={!showMenuStickyToggle}
                aria-expanded={isMenuOpen}
                aria-label={toggleButtonLabel}
                title={toggleButtonLabel}
                onClick={onToggleButtonClick}
                ref={showMenuStickyToggle ? toggleButtonRef : undefined}
            >
                <ToggleButtonSvg
                    class="cls-header__sticky-menu-toggle-button__icon"
                    isMenuOpen={isMenuOpen}
                />
            </button>
            {isMenuOpen && (
                <aside
                    ref={menuRef}
                    class={
                        'cls-menu' + (enableMenu ? ' cls-menu--enabled' : '')
                    }
                    role="dialog"
                    aria-modal="true"
                    aria-label="Site Navigation"
                >
                    <div class="cls-menu__contents">
                        <FullSiteNavigationContents
                            bindKeys={
                                isMenuOpen ? BindKeysNoRequireFocus : NoBindKeys
                            }
                            getAllowSingleLetterKeyLinkJumpShortcut={() => {
                                return (
                                    document.activeElement !==
                                    searchInputRef.current
                                );
                            }}
                            isMovingFocusManuallyRef={isMovingFocusManuallyRef}
                            linkRefs={menuLinkRefs}
                        />
                    </div>
                </aside>
            )}
            <div ref={endFocusPlaceholderRef} tabIndex={isMenuOpen ? 0 : -1} />
        </Fragment>
    );
}

interface SearchResultsProps {
    searchMatches: SearchMatch[];
    selectedIndex: number;
    resetSelectedIndex: () => void;
    listItemRefsRef: { current: (HTMLLIElement | null)[] };
}

function SearchResults({
    searchMatches,
    selectedIndex,
    resetSelectedIndex,
    listItemRefsRef,
}: SearchResultsProps): VNode {
    const scrollingContainerRef = useRef<HTMLUListElement>();
    const isOnMouseOverDisabled = useRef(false);

    const setScrollTop = (scrollTop: number) => {
        isOnMouseOverDisabled.current = true;
        scrollingContainerRef.current.scrollTop = scrollTop;
        requestAnimationFrame(() => {
            isOnMouseOverDisabled.current = false;
        });
    };

    useEffect(() => {
        if (listItemRefsRef.current.length !== searchMatches.length) {
            listItemRefsRef.current = listItemRefsRef.current.slice(
                0,
                searchMatches.length,
            );
        }
        const selectedListItem = listItemRefsRef.current[selectedIndex];
        if (selectedListItem) {
            const { offsetTop, offsetHeight } = selectedListItem;
            const containerScrollTop = scrollingContainerRef.current.scrollTop;
            const containerOffsetHeight =
                scrollingContainerRef.current.offsetHeight;
            if (
                offsetTop + offsetHeight >
                containerScrollTop + containerOffsetHeight
            ) {
                setScrollTop(offsetTop);
            } else if (offsetTop < containerScrollTop) {
                setScrollTop(
                    offsetTop - (containerOffsetHeight - offsetHeight),
                );
            }
        }
    }, [searchMatches.length, selectedIndex]);

    const onMouseOver = () => {
        if (!isOnMouseOverDisabled.current) {
            resetSelectedIndex();
        }
    };

    return (
        <ul class="cls-header__search__results" ref={scrollingContainerRef}>
            {searchMatches.map((match, i) => (
                <li
                    class={
                        'cls-header__search__results__result' +
                        (selectedIndex === i
                            ? ' cls-header__search__results__result--selected'
                            : '')
                    }
                    onMouseOver={onMouseOver}
                    ref={(el) => (listItemRefsRef.current[i] = el)}
                    key={match.document.id}
                >
                    <DocPageLink
                        pageId={match.document.id}
                        hash={match.heading ? match.heading.hash : undefined}
                        tabIndex={-1}
                        class="cls-header__search__results__result__anchor-wrapper"
                    >
                        <h2 class="cls-header__search__results__result__title">
                            {highlightSnippet(
                                match.document.title,
                                0,
                                match.document.title.length,
                                match.titleMatchRanges,
                            )}
                        </h2>
                        {match.heading && (
                            <h3 class="cls-header__search__results__result__heading">
                                {highlightSnippet(
                                    match.heading.text,
                                    0,
                                    match.heading.text.length,
                                    match.heading.matchRanges,
                                )}
                            </h3>
                        )}
                        <p class="cls-header__search__results__result__content-snippet">
                            {highlightSnippet(
                                match.contentSnippet,
                                match.contentSnippetStartIndex,
                                match.document.content.length,
                                match.contentSnippetMatchRanges,
                            )}
                        </p>
                    </DocPageLink>
                </li>
            ))}
        </ul>
    );
}

function highlightSnippet(
    snippet: string,
    snippetStartIndex: number,
    originalTextLength: number,
    matchRanges: MatchTextRange[],
): ComponentChildren {
    if (matchRanges.length === 0) {
        return (
            (snippetStartIndex !== 0 ? '...' : '') +
            snippet +
            (snippetStartIndex + snippet.length !== originalTextLength &&
            snippet.length > 0
                ? '...'
                : '')
        );
    }
    const nodes: ComponentChild[] = [];
    if (snippetStartIndex !== 0) {
        nodes.push('...');
    }
    if (matchRanges[0].startIndex !== 0) {
        nodes.push(snippet.slice(0, matchRanges[0].startIndex));
    }
    matchRanges.forEach((matchRange, i) => {
        nodes.push(
            <strong class="cls-header__search__results__result__match-text">
                {snippet.slice(matchRange.startIndex, matchRange.endIndex)}
            </strong>,
        );
        const nextMatch = matchRanges[i + 1];
        const text = snippet.slice(
            matchRange.endIndex,
            nextMatch && nextMatch.startIndex,
        );
        if (text) {
            nodes.push(text);
        }
    });
    if (
        snippetStartIndex + snippet.length !== originalTextLength &&
        snippet.length > 0
    ) {
        nodes.push('...');
    }
    return nodes;
}

interface ToggleButtonSvgProps {
    class: string;
    isMenuOpen: boolean;
}

function ToggleButtonSvg({
    class: className,
    isMenuOpen,
}: ToggleButtonSvgProps): VNode {
    return (
        <svg class={className} viewBox="0 0 24 24">
            <title>{toggleButtonLabel}</title>
            {isMenuOpen ? (
                <path d="M4,18h11c0.55,0,1-0.45,1-1v0c0-0.55-0.45-1-1-1H4c-0.55,0-1,0.45-1,1v0C3,17.55,3.45,18,4,18z M4,13h8c0.55,0,1-0.45,1-1v0 c0-0.55-0.45-1-1-1H4c-0.55,0-1,0.45-1,1v0C3,12.55,3.45,13,4,13z M3,7L3,7c0,0.55,0.45,1,1,1h11c0.55,0,1-0.45,1-1v0 c0-0.55-0.45-1-1-1H4C3.45,6,3,6.45,3,7z M20.3,14.88L17.42,12l2.88-2.88c0.39-0.39,0.39-1.02,0-1.41l0,0 c-0.39-0.39-1.02-0.39-1.41,0l-3.59,3.59c-0.39,0.39-0.39,1.02,0,1.41l3.59,3.59c0.39,0.39,1.02,0.39,1.41,0l0,0 C20.68,15.91,20.69,15.27,20.3,14.88z" />
            ) : (
                <path d="M4 18h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zm0-5h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1zM3 7c0 .55.45 1 1 1h16c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1z" />
            )}
        </svg>
    );
}
