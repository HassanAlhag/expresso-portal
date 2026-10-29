function getMediaUrl(media) {
  return media?.url || media?.fileUrl || media?.thumbnailUrl || "";
}

export function mapWebsiteReels(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: item._id,
      title: item.title || "Untitled",
      platform: item.platform || "",
      category: item.type || "",
      client:
        item.customerId?.companyName ||
        item.customerId?.contactName ||
        "",
      duration: item.duration || "",
      poster:
        getMediaUrl(item.posterMediaId) ||
        getMediaUrl(item.coverMedia) ||
        "",
      src:
        getMediaUrl(item.finalMediaId) ||
        item.externalPostUrl ||
        "",
    }))
    .filter((item) => item.src);
}
