export type BookmarkNoticeType = 'success' | 'error';

export type ReaderBookmarksProps = {
  bookId: string;
  /** Close the surrounding menu / drawer after a save or jump. */
  onDone: () => void;
  onNotice: (type: BookmarkNoticeType, message: string) => void;
};
