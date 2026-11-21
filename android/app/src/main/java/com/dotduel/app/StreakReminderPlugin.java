package com.dotduel.app;

import androidx.work.Data;
import androidx.work.ExistingWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.concurrent.TimeUnit;

// The one pending streak reminder (src/reminders.ts). WorkManager runs
// StreakReminderWorker at the chosen time; it shows the notification only if
// the server says the player hasn't played that UTC day yet (web or another
// phone counts too). WorkManager keeps the job across reboots.
@CapacitorPlugin(name = "StreakReminder")
public class StreakReminderPlugin extends Plugin {
    static final String WORK_NAME = "dotduel-streak-reminder";

    @PluginMethod
    public void schedule(PluginCall call) {
        Long at = call.getLong("at");
        String day = call.getString("day");
        if (at == null || day == null) {
            call.reject("at and day are required");
            return;
        }
        Data data = new Data.Builder()
            .putString("day", day)
            .putLong("deadline", call.getLong("deadline", at + 86_400_000L))
            .putString("title", call.getString("title", "DotDuel"))
            .putString("body", call.getString("body", ""))
            .putString("key", call.getString("key", ""))
            .putString("url", call.getString("url", ""))
            .putString("apikey", call.getString("apikey", ""))
            .build();
        long delay = Math.max(0L, at - System.currentTimeMillis());
        OneTimeWorkRequest req = new OneTimeWorkRequest.Builder(StreakReminderWorker.class)
            .setInitialDelay(delay, TimeUnit.MILLISECONDS)
            .setInputData(data)
            .build();
        WorkManager.getInstance(getContext()).enqueueUniqueWork(WORK_NAME, ExistingWorkPolicy.REPLACE, req);
        call.resolve();
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        WorkManager.getInstance(getContext()).cancelUniqueWork(WORK_NAME);
        call.resolve();
    }
}
