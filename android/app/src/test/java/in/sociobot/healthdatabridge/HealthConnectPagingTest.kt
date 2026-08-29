package `in`.sociobot.healthdatabridge

import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.fail
import org.junit.Test

class HealthConnectPagingTest {
    @Test
    fun readsEveryPageInOrderPastTheSdkDefaultOfOneThousand() = runBlocking {
        val requestedTokens = mutableListOf<String?>()
        val records = collectHealthConnectPages<Int> { token ->
            requestedTokens += token
            when (token) {
                null -> HealthConnectPage((1..1000).toList(), "page-2")
                "page-2" -> HealthConnectPage((1001..2000).toList(), "page-3")
                "page-3" -> HealthConnectPage(listOf(2001), null)
                else -> error("Unexpected page token: $token")
            }
        }

        assertEquals(listOf(null, "page-2", "page-3"), requestedTokens)
        assertEquals(2001, records.size)
        assertEquals(1, records.first())
        assertEquals(2001, records.last())
    }

    @Test
    fun refusesARepeatedProviderTokenInsteadOfLoopingForever() = runBlocking {
        try {
            collectHealthConnectPages<Int> { HealthConnectPage(emptyList(), "same-token") }
            fail("A repeated Health Connect token must fail the read.")
        } catch (error: IllegalStateException) {
            assertEquals("Health Connect returned a repeated page token.", error.message)
        }
    }
}
