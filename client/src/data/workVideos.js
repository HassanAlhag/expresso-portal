// Videos of a Portfolio work item. Items saved before the `videos` list
// existed carry one legacy `video`; it is read as the first video until the
// item is saved again (the editor then stores the list and clears it).
export function workVideos(item) {
  const list = (Array.isArray(item?.videos) ? item.videos : []).filter((v) => v?.src);
  const legacy = item?.video?.src ? item.video : null;
  if (legacy && !list.some((v) => v.src === legacy.src)) return [{ title: "", ...legacy }, ...list];
  return list;
}
