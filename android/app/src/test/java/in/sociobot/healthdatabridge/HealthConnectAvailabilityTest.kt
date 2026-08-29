package `in`.sociobot.healthdatabridge

import androidx.health.connect.client.HealthConnectClient
import org.junit.Assert.assertEquals
import org.junit.Test

class HealthConnectAvailabilityTest {
    @Test
    fun mapsEveryProviderStateToAnActionableResult() {
        assertEquals(BridgeAvailability(true), describeHealthConnectStatus(HealthConnectClient.SDK_AVAILABLE))
        assertEquals(
            BridgeAvailability(false, "Health Connect needs an update."),
            describeHealthConnectStatus(HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED)
        )
        assertEquals(
            BridgeAvailability(false, "Health Connect is not installed."),
            describeHealthConnectStatus(HealthConnectClient.SDK_UNAVAILABLE)
        )
    }
}
