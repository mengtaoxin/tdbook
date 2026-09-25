import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { BookListItem } from '@/lib/bookTypes'
import { useBooksStore } from '@/stores/booksStore'

const COVER_ASPECT_RATIO = '5 / 7'

export function BooksPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const books = useBooksStore((s) => s.books)
  const duplicateIds = useBooksStore((s) => s.duplicateIds)
  const loading = useBooksStore((s) => s.loading)
  const error = useBooksStore((s) => s.error)
  const load = useBooksStore((s) => s.load)

  useEffect(() => {
    void load()
  }, [load])

  function goToBook(book: BookListItem) {
    void navigate({
      to: '/book/$id',
      params: { id: book.id },
      search: { page: 1 },
    })
  }

  return (
    <Box
      sx={{
        minHeight: '100%',
        background: (theme) =>
          `radial-gradient(ellipse 80% 50% at 50% -10%, ${theme.palette.primary.main}0F, transparent 55%), ${theme.palette.background.default}`,
      }}
    >
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            component="h1"
            sx={{ fontWeight: 500, letterSpacing: '-0.01em', mb: 0.5 }}
          >
            {t('books.title')}
          </Typography>
          {!loading && books.length > 0 ? (
            <Typography variant="body1" color="text.secondary">
              {t('books.count', { n: books.length })}
            </Typography>
          ) : null}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <>
            {error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {t('books.loadFailed')}
              </Alert>
            ) : null}
            {duplicateIds.map((id) => (
              <Alert key={id} severity="error" sx={{ mb: 2 }}>
                {t('books.duplicateId', { id })}
              </Alert>
            ))}

            {books.length === 0 ? (
              <Typography
                variant="body1"
                color="text.secondary"
                align="center"
                sx={{ py: 8 }}
              >
                {t('books.empty')}
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {books.map((book) => (
                  <Grid key={book.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                    <Box
                      component="article"
                      role="button"
                      tabIndex={0}
                      onClick={() => goToBook(book)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') goToBook(book)
                      }}
                      sx={{
                        width: '100%',
                        cursor: 'pointer',
                        borderRadius: 1.5,
                        outline: 'none',
                        transition: 'transform 180ms cubic-bezier(0.2, 0, 0, 1)',
                        '&:hover': { transform: 'translateY(-2px)' },
                        '&:focus-visible .book-cover': {
                          boxShadow: (theme) =>
                            `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${theme.palette.primary.main}`,
                        },
                      }}
                    >
                      <Box
                        className="book-cover"
                        sx={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: COVER_ASPECT_RATIO,
                          borderRadius: 1.5,
                          overflow: 'hidden',
                          bgcolor: 'action.hover',
                          boxShadow: (theme) =>
                            `0 1px 2px ${theme.palette.common.black}0F, 0 4px 12px ${theme.palette.common.black}0F`,
                          transition:
                            'box-shadow 180ms cubic-bezier(0.2, 0, 0, 1)',
                          '.MuiBox-root:hover > &': {
                            boxShadow: (theme) =>
                              `0 2px 4px ${theme.palette.common.black}14, 0 8px 24px ${theme.palette.common.black}1A`,
                          },
                        }}
                      >
                        {book.coverUrl ? (
                          <Box
                            component="img"
                            src={book.coverUrl}
                            alt={book.title}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: (theme) =>
                                `linear-gradient(160deg, ${theme.palette.primary.main}14 0%, ${theme.palette.action.hover} 100%)`,
                            }}
                          >
                            <MenuBookOutlinedIcon
                              sx={{ fontSize: 36, color: 'text.disabled' }}
                            />
                          </Box>
                        )}
                      </Box>

                      <Box
                        sx={{
                          pt: 1.5,
                          pb: 0.5,
                          px: 0.5,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          component="h2"
                          sx={{
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 2,
                            overflow: 'hidden',
                            lineHeight: 1.4,
                            height: '2.8em',
                            overflowWrap: 'anywhere',
                            fontWeight: 500,
                            m: 0,
                          }}
                        >
                          {book.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          sx={{ height: '1.25em', lineHeight: '1.25em' }}
                        >
                          {book.author || '\u00A0'}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          <Chip
                            size="small"
                            label={
                              book.cached
                                ? t('books.cached')
                                : t('books.notDownloaded')
                            }
                            color={book.cached ? 'primary' : 'default'}
                            variant="outlined"
                          />
                          <Chip
                            size="small"
                            label={book.type.toUpperCase()}
                            variant="outlined"
                            sx={{ opacity: 0.7 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </Container>
    </Box>
  )
}
