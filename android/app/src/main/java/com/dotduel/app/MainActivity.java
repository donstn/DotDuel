package com.dotduel.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FontScalePlugin.class);
        registerPlugin(StreakReminderPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
