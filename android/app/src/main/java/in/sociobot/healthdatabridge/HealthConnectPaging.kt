package `in`.sociobot.healthdatabridge

/** A page shape kept independent of the Android SDK so pagination is unit-testable. */
internal data class HealthConnectPage<T>(val records: List<T>, val nextPageToken: String?)

/**
 * Collect every Health Connect page and fail rather than silently looping if a
 * provider returns a token it already gave us. The caller supplies the SDK
 * request so this function can be exercised without a device or provider.
 */
internal suspend fun <T> collectHealthConnectPages(
    fetchPage: suspend (pageToken: String?) -> HealthConnectPage<T>
): List<T> {
    val records = mutableListOf<T>()
    val seenTokens = mutableSetOf<String>()
    var pageToken: String? = null
    do {
        val page = fetchPage(pageToken)
        records += page.records
        pageToken = page.nextPageToken
        if (pageToken != null && !seenTokens.add(pageToken)) {
            throw IllegalStateException("Health Connect returned a repeated page token.")
        }
    } while (pageToken != null)
    return records
}
