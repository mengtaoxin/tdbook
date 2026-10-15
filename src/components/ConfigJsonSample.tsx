import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

/** Dark code surface palette: text colors keep WCAG AA on `surface`; line numbers are decorative. */
const CODE = {
  surface: '#1C2533',
  header: '#161E2A',
  divider: 'rgba(255, 255, 255, 0.08)',
  rowHover: 'rgba(255, 255, 255, 0.04)',
  text: '#D8E0EC',
  punct: '#93A1B6',
  key: '#9CC4FF',
  string: '#F0C987',
  elided: '#8291A8',
  lineNumber: '#5E6C82',
  note: '#B9C5D6',
};

type TokenKind = 'punct' | 'key' | 'string' | 'fold';
type Token = { kind: TokenKind; text: string };
type FieldTag = 'required' | 'optional';
type SampleLineSpec = { depth: number; tokens: Token[]; noteKey?: string; tag?: FieldTag };
type SampleLine = SampleLineSpec & { number: number };

const punct = (text: string): Token => ({ kind: 'punct', text });

function field(
  name: string,
  value: string,
  tag: FieldTag,
  options: { last?: boolean } = {},
): SampleLineSpec {
  return {
    depth: 3,
    tokens: [
      { kind: 'key', text: `"${name}"` },
      punct(': '),
      { kind: 'string', text: `"${value}"` },
      ...(options.last ? [] : [punct(',')]),
    ],
    noteKey: `home.sample.notes.${name}`,
    tag,
  };
}

const SAMPLE_LINE_SPECS: SampleLineSpec[] = [
  { depth: 0, tokens: [punct('{')] },
  {
    depth: 1,
    tokens: [{ kind: 'key', text: '"books"' }, punct(': [')],
    noteKey: 'home.sample.notes.books',
    tag: 'required',
  },
  { depth: 2, tokens: [punct('{')] },
  field('id', 'alice-in-wonderland', 'required'),
  field('title', 'Alice in Wonderland', 'required'),
  field('author', 'Lewis Carroll', 'optional'),
  field('type', 'epub', 'optional'),
  field('path', 'https://…/alice.epub', 'required'),
  field('hover', 'https://…/alice.jpg', 'optional', { last: true }),
  { depth: 2, tokens: [punct('},')] },
  { depth: 2, tokens: [{ kind: 'fold', text: '{ … }' }], noteKey: 'home.sample.notes.more' },
  { depth: 1, tokens: [punct(']')] },
  { depth: 0, tokens: [punct('}')] },
];

const SAMPLE_LINES: SampleLine[] = SAMPLE_LINE_SPECS.map((spec, index) => ({
  ...spec,
  number: index + 1,
}));

const INDENT = '  ';

/** Renders at most one `…` elision as a muted pill. */
function StringToken({ text }: { text: string }) {
  const [before, after] = text.split('…');
  return (
    <Box component="span" sx={{ color: CODE.string }}>
      {before}
      {after !== undefined && (
        <>
          <Box
            component="span"
            sx={{
              color: CODE.elided,
              mx: 0.25,
              px: 0.5,
              borderRadius: 0.5,
              bgcolor: CODE.divider,
            }}
          >
            …
          </Box>
          {after}
        </>
      )}
    </Box>
  );
}

function CodeToken({ token }: { token: Token }) {
  switch (token.kind) {
    case 'key':
      return (
        <Box component="span" className="json-key" sx={{ color: CODE.key }}>
          {token.text}
        </Box>
      );
    case 'string':
      return <StringToken text={token.text} />;
    case 'fold':
      return (
        <Box
          component="span"
          sx={{
            color: CODE.elided,
            px: 0.75,
            border: `1px dashed ${CODE.elided}`,
            borderRadius: 1,
          }}
        >
          {token.text}
        </Box>
      );
    default:
      return (
        <Box component="span" sx={{ color: CODE.punct }}>
          {token.text}
        </Box>
      );
  }
}

function TagLabel({ tag }: { tag: FieldTag }) {
  const { t } = useTranslation();
  const required = tag === 'required';
  return (
    <Box
      component="span"
      sx={{
        flexShrink: 0,
        px: 0.75,
        borderRadius: 0.75,
        fontSize: '0.6875rem',
        fontWeight: 600,
        lineHeight: '1.125rem',
        letterSpacing: '0.02em',
        color: required ? CODE.surface : CODE.note,
        bgcolor: required ? CODE.key : 'transparent',
        border: `1px ${required ? 'solid' : 'dashed'} ${required ? CODE.key : CODE.elided}`,
      }}
    >
      {t(`home.sample.${tag}`)}
    </Box>
  );
}

function SampleRow({ line }: { line: SampleLine }) {
  const { t } = useTranslation();
  const annotated = Boolean(line.noteKey);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'minmax(0, 1fr)',
          sm: '2.5rem minmax(0, 1fr)',
          md: '2.5rem 44ch minmax(0, 1fr)',
        },
        alignItems: 'center',
        columnGap: 1.5,
        px: 1,
        py: { xs: annotated ? 0.5 : 0, md: 0 },
        borderRadius: 1,
        ...(annotated && {
          '&:hover': { bgcolor: CODE.rowHover },
          '&:hover .json-key': { textDecoration: 'underline', textUnderlineOffset: '3px' },
        }),
      }}
    >
      <Box
        component="span"
        aria-hidden
        sx={{
          display: { xs: 'none', sm: 'block' },
          color: CODE.lineNumber,
          textAlign: 'right',
          userSelect: 'none',
        }}
      >
        {line.number}
      </Box>
      <Box
        component="code"
        sx={{
          fontFamily: 'inherit',
          whiteSpace: 'pre',
          overflowX: 'auto',
          ...(annotated && {
            display: { md: 'flex' },
            alignItems: 'center',
            '&::after': {
              content: '""',
              display: { xs: 'none', md: 'block' },
              flex: 1,
              minWidth: 16,
              ml: 1.5,
              borderBottom: `1px dotted ${CODE.lineNumber}`,
            },
          }),
        }}
      >
        <span>{INDENT.repeat(line.depth)}</span>
        {line.tokens.map((token) => (
          <CodeToken key={`${token.kind}:${token.text}`} token={token} />
        ))}
      </Box>
      {line.noteKey && (
        <Box
          sx={{
            gridColumn: { xs: 1, sm: 2, md: 3 },
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            py: 0.25,
            pl: { xs: `${line.depth * 2}ch`, md: 0 },
            fontFamily: (theme) => theme.typography.fontFamily,
            fontSize: '0.8125rem',
            lineHeight: 1.5,
            color: CODE.note,
          }}
        >
          {line.tag && <TagLabel tag={line.tag} />}
          <span>{t(line.noteKey)}</span>
        </Box>
      )}
    </Box>
  );
}

/** Annotated `configs.json` sample: the catalog shape at a glance. */
export function ConfigJsonSample() {
  const { t } = useTranslation();

  return (
    <Box
      component="figure"
      data-testid="home-json-sample"
      sx={{
        m: 0,
        overflow: 'hidden',
        borderRadius: 2,
        bgcolor: CODE.surface,
        color: CODE.text,
        boxShadow: 3,
      }}
    >
      <Box
        component="figcaption"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.25,
          bgcolor: CODE.header,
          borderBottom: `1px solid ${CODE.divider}`,
        }}
      >
        <DataObjectOutlinedIcon sx={{ fontSize: 18, color: CODE.key }} />
        <Typography component="span" sx={{ fontFamily: MONO_FONT, fontSize: '0.875rem' }}>
          configs.json
        </Typography>
        <Typography
          component="span"
          sx={{ ml: 'auto', fontSize: '0.75rem', color: CODE.elided, letterSpacing: '0.04em' }}
        >
          {t('home.sample.badge')}
        </Typography>
      </Box>
      <Box
        sx={{
          py: 1.5,
          px: { xs: 0.5, sm: 1 },
          fontFamily: MONO_FONT,
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          lineHeight: 1.75,
        }}
      >
        {SAMPLE_LINES.map((line) => (
          <SampleRow key={line.number} line={line} />
        ))}
      </Box>
    </Box>
  );
}
