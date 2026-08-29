package `in`.sociobot.healthdatabridge

import android.content.Context
import android.os.Build
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.metadata.Metadata
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.time.Duration
import java.time.Instant
import java.time.ZoneOffset
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

/** Exercises the production reader against Android's real Health Connect provider. */
@RunWith(AndroidJUnit4::class)
class HealthConnectProviderInstrumentedTest {
    @Test
    fun deniedThenGrantedPermissionReadsEveryPageFromOneMonth() = runBlocking {
        assumeTrue("Health Connect is part of Android 14 and newer", Build.VERSION.SDK_INT >= 34)
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val appContext: Context = instrumentation.targetContext
        val testContext: Context = instrumentation.context
        assumeTrue(
            "This test requires a Health Connect-capable device",
            HealthConnectClient.getSdkStatus(appContext) == HealthConnectClient.SDK_AVAILABLE
        )

        val readPermission = HealthPermission.getReadPermission(StepsRecord::class)
        val writePermission = HealthPermission.getWritePermission(StepsRecord::class)
        val automation = instrumentation.uiAutomation
        val appClient = HealthConnectClient.getOrCreate(appContext)
        val seedClient = HealthConnectClient.getOrCreate(testContext)

        automation.revokeRuntimePermission(appContext.packageName, readPermission)
        assertFalse(appClient.permissionController.getGrantedPermissions().contains(readPermission))
        var denied = false
        try {
            HealthConnectRecordReader(appClient).readType(
                "steps",
                Instant.now().minus(Duration.ofDays(2)),
                Instant.now()
            )
        } catch (_: SecurityException) {
            denied = true
        }
        assertTrue("The production reader must honor a denied Health Connect permission", denied)

        automation.grantRuntimePermission(appContext.packageName, readPermission)
        automation.grantRuntimePermission(testContext.packageName, writePermission)
        assertTrue(appClient.permissionController.getGrantedPermissions().contains(readPermission))

        val end = Instant.now().minus(Duration.ofDays(1))
        val start = end.minus(Duration.ofDays(29))
        val prefix = "hdb-device-${System.nanoTime()}"
        val records = (0..2_000).map { index ->
            val recordStart = start.plus(Duration.ofMinutes(index.toLong() * 10))
            StepsRecord(
                startTime = recordStart,
                startZoneOffset = ZoneOffset.UTC,
                endTime = recordStart.plusSeconds(60),
                endZoneOffset = ZoneOffset.UTC,
                count = (index + 1).toLong(),
                metadata = Metadata.manualEntry(clientRecordId = "$prefix-$index", clientRecordVersion = 1)
            )
        }
        val insertedIds = mutableListOf<String>()
        try {
            records.chunked(500).forEach { chunk ->
                insertedIds += seedClient.insertRecords(chunk).recordIdsList
            }
            val imported = HealthConnectRecordReader(appClient).readType("steps", start, end.plusSeconds(120))
                .filter { it.metadata.clientRecordId?.startsWith(prefix) == true }
            assertEquals("The production 1,000-row paging path must return the full month", 2_001, imported.size)
            assertEquals(2_001, imported.map { it.metadata.id }.distinct().size)
        } finally {
            if (insertedIds.isNotEmpty()) {
                seedClient.deleteRecords(StepsRecord::class, insertedIds, emptyList())
            }
            automation.revokeRuntimePermission(appContext.packageName, readPermission)
            automation.revokeRuntimePermission(testContext.packageName, writePermission)
        }
    }
}
