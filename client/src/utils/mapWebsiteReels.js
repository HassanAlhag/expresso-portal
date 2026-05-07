export function getMediaUrl(media) {
  return media?.url || media?.fileUrl || media?.thumbnailUrl || "";
}

export function mapWebsiteReels(items = []) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => item.websiteVisible && item.status === "published")
    .filter((item) => item.type === "reel" || item.type === "video")
    .map((item) => ({
      id: item._id,
      title: item.title || "Untitled reel",
      platform: item.platform || "Reel",
      category: item.type || "reel",
      client:
        item.customerId?.companyName ||
        item.customerId?.contactName ||
        "Client",
      duration: item.duration || "",
      poster: getMediaUrl(item.posterMediaId) || "/placeholder-reel.jpg",
      src: getMediaUrl(item.finalMediaId) || item.externalPostUrl || "",
    }))
    .filter((item) => item.src);
}
