package in.sociobot.healthdatabridge;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.content.Intent;

import androidx.health.connect.client.HealthConnectClient;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.junit.Test;
import org.junit.runner.RunWith;

/** Runs on an Android device or emulator as a smoke check for the native route. */
@RunWith(AndroidJUnit4.class)
public class NativeBridgeInstrumentedTest {
    @Test
    public void appRegistersTheConfiguredPackageAndCanCheckHealthConnect() {
        Context context = ApplicationProvider.getApplicationContext();
        assertEquals(
            "The test must exercise the Health Data Bridge package, not Capacitor's template package",
            "in.sociobot.healthdatabridge",
            context.getPackageName()
        );
        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        assertNotNull("The Capacitor activity must be installed", launch);

        int status = HealthConnectClient.getSdkStatus(context);
        assertTrue(
            "Health Connect must report a defined provider state",
            status == HealthConnectClient.SDK_AVAILABLE
                || status == HealthConnectClient.SDK_UNAVAILABLE
                || status == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
        );
    }
}
