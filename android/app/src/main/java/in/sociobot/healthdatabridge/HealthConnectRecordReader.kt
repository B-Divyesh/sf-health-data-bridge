package `in`.sociobot.healthdatabridge

import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant
import kotlin.reflect.KClass

/** The production paging path, separated from the Capacitor call for device tests. */
internal class HealthConnectRecordReader(private val client: HealthConnectClient) {
    suspend fun readType(type: String, start: Instant, end: Instant): List<Record> = when (type) {
        "steps" -> read(StepsRecord::class, start, end)
        "activeEnergy" -> read(ActiveCaloriesBurnedRecord::class, start, end)
        "exercise" -> read(ExerciseSessionRecord::class, start, end)
        "weight" -> read(WeightRecord::class, start, end)
        else -> emptyList()
    }

    private suspend fun <T : Record> read(recordType: KClass<T>, start: Instant, end: Instant): List<T> {
        return collectHealthConnectPages { pageToken ->
            val page = client.readRecords(
                ReadRecordsRequest(
                    recordType = recordType,
                    timeRangeFilter = TimeRangeFilter.between(start, end),
                    pageSize = 1_000,
                    pageToken = pageToken
                )
            )
            HealthConnectPage(page.records, page.pageToken)
        }
    }
}

internal data class BridgeAvailability(val available: Boolean, val reason: String? = null)

internal fun describeHealthConnectStatus(status: Int): BridgeAvailability = when (status) {
    HealthConnectClient.SDK_AVAILABLE -> BridgeAvailability(true)
    HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> BridgeAvailability(false, "Health Connect needs an update.")
    else -> BridgeAvailability(false, "Health Connect is not installed.")
}
