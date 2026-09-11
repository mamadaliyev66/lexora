export function toggleBookmark(bookmarks, item) {
  return bookmarks.some((bookmark) => bookmark.id === item.id && bookmark.type === item.type)
    ? bookmarks.filter((bookmark) => !(bookmark.id === item.id && bookmark.type === item.type))
    : [{ ...item, savedAt: new Date().toISOString() }, ...bookmarks]
}
