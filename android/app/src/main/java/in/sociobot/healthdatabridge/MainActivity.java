package in.sociobot.healthdatabridge;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HealthConnectBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
