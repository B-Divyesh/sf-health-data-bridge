package `in`.sociobot.healthdatabridge

import android.content.Context
import androidx.activity.result.ActivityResultLauncher
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.lifecycle.lifecycleScope
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.launch
import java.time.Duration
import java.time.Instant
import kotlin.reflect.KClass

@CapacitorPlugin(name = "HealthConnectBridge")
class HealthConnectBridgePlugin : Plugin() {
    private lateinit var permissionLauncher: ActivityResultLauncher<Set<String>>
    private var permissionCall: PluginCall? = null
    private var requestedTypes: List<String> = emptyList()

    override fun load() {
        permissionLauncher = activity.registerForActivityResult(
            PermissionController.createRequestPermissionResultContract()
        ) { granted ->
            val call = permissionCall ?: return@registerForActivityResult
            val accepted = requestedTypes.filter { type -> permissionFor(type) in granted }
            call.resolve(JSObject().put("granted", JSArray(accepted)))
            permissionCall = null
        }
    }

    private fun client(): HealthConnectClient = HealthConnectClient.getOrCreate(context)

    @PluginMethod
    fun availability(call: PluginCall) {
        val status = HealthConnectClient.getSdkStatus(context)
        val result = JSObject().put("available", status == HealthConnectClient.SDK_AVAILABLE)
        if (status != HealthConnectClient.SDK_AVAILABLE) {
            result.put("reason", if (status == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) "Health Connect needs an update." else "Health Connect is not installed.")
        }
        call.resolve(result)
    }

    @PluginMethod
    override fun requestPermissions(call: PluginCall) {
        requestedTypes = call.getArray("recordTypes")?.toList<String>() ?: emptyList()
        val permissions = requestedTypes.mapNotNull(::permissionFor).toSet()
        if (permissions.isEmpty()) {
            call.reject("Choose at least one record type.")
            return
        }
        permissionCall = call
        permissionLauncher.launch(permissions)
    }

    @PluginMethod
    fun readRecords(call: PluginCall) {
        val types = call.getArray("recordTypes")?.toList<String>() ?: emptyList()
        val start = call.getString("startTime")?.let(Instant::parse)
        val end = call.getString("endTime")?.let(Instant::parse)
        if (start == null || end == null || !start.isBefore(end)) {
            call.reject("Choose a valid date range.")
            return
        }
        activity.lifecycleScope.launch {
            try {
                val records = JSArray()
                for (type in types) readType(type, start, end).forEach { records.put(toJson(it)) }
                call.resolve(JSObject().put("records", records))
            } catch (error: Exception) {
                call.reject("Health Connect could not read these records.", error)
            }
        }
    }

    private fun permissionFor(type: String): String? = when (type) {
        "steps" -> HealthPermission.getReadPermission(StepsRecord::class)
        "activeEnergy" -> HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class)
        "exercise" -> HealthPermission.getReadPermission(ExerciseSessionRecord::class)
        "weight" -> HealthPermission.getReadPermission(WeightRecord::class)
        else -> null
    }

    private suspend fun readType(type: String, start: Instant, end: Instant): List<Record> = when (type) {
        "steps" -> read(StepsRecord::class, start, end)
        "activeEnergy" -> read(ActiveCaloriesBurnedRecord::class, start, end)
        "exercise" -> read(ExerciseSessionRecord::class, start, end)
        "weight" -> read(WeightRecord::class, start, end)
        else -> emptyList()
    }

    private suspend fun <T : Record> read(recordType: KClass<T>, start: Instant, end: Instant): List<T> {
        val records = mutableListOf<T>()
        var pageToken: String? = null
        do {
            val page = client().readRecords(
                ReadRecordsRequest(
                    recordType = recordType,
                    timeRangeFilter = TimeRangeFilter.between(start, end),
                    pageSize = 1_000,
                    pageToken = pageToken
                )
            )
            records += page.records
            pageToken = page.pageToken
        } while (pageToken != null)
        return records
    }

    private fun toJson(record: Record): JSObject {
        val json = JSObject().put("id", record.metadata.id).put("source", record.metadata.dataOrigin.packageName)
        when (record) {
            is StepsRecord -> json.put("type", "steps").put("startTime", record.startTime.toString()).put("endTime", record.endTime.toString()).put("value", record.count).put("unit", "count")
            is ActiveCaloriesBurnedRecord -> json.put("type", "activeEnergy").put("startTime", record.startTime.toString()).put("endTime", record.endTime.toString()).put("value", record.energy.inKilocalories).put("unit", "kcal")
            is ExerciseSessionRecord -> json.put("type", "exercise").put("startTime", record.startTime.toString()).put("endTime", record.endTime.toString()).put("value", Duration.between(record.startTime, record.endTime).toMinutes()).put("unit", "min")
            is WeightRecord -> json.put("type", "weight").put("startTime", record.time.toString()).put("endTime", record.time.toString()).put("value", record.weight.inKilograms).put("unit", "kg")
        }
        return json
    }
}
