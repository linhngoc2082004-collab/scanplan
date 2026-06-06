import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import BackArrow from '../components/BackArrow';
import ToggleSwitch from '../components/ToggleSwitch';
import OrangeButton from '../components/OrangeButton';
import Toast from '../components/Toast';
import { getReminderSettings, updateReminderSettings } from '../lib/backendApi';
import type { ReminderSettings as ReminderSettingsType } from '../types';

export default function ReminderSettings() {
  const [settings, setSettings] = useState<ReminderSettingsType>({
    remind5Days: true,
    remind3Days: true,
    remind1Day: true,
    notifications: true,
  });
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load settings from backend on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await getReminderSettings();
        setSettings({
          remind5Days: data.remind_5_days ?? true,
          remind3Days: data.remind_3_days ?? true,
          remind1Day: data.remind_1_day ?? true,
          notifications: data.notifications_enabled ?? true,
        });
      } catch (err) {
        console.error('Failed to load reminder settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggle = (key: keyof ReminderSettingsType) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      await updateReminderSettings({
        remind_5_days: settings.remind5Days,
        remind_3_days: settings.remind3Days,
        remind_1_day: settings.remind1Day,
        notifications_enabled: settings.notifications,
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Failed to save reminder settings:', err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <BackArrow to="/dashboard" />
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Reminder Settings</h1>
        <div className="text-center text-gray-500 py-8">Loading settings...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <BackArrow to="/dashboard" />

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reminder Settings</h1>

      <div className="divide-y divide-gray-100 mb-8">
        <ToggleSwitch
          label="Remind me 5 days before deadlines"
          checked={settings.remind5Days}
          onChange={() => handleToggle('remind5Days')}
        />
        <ToggleSwitch
          label="Remind me 3 days before deadlines"
          checked={settings.remind3Days}
          onChange={() => handleToggle('remind3Days')}
        />
        <ToggleSwitch
          label="Remind me 1 day before deadlines"
          checked={settings.remind1Day}
          onChange={() => handleToggle('remind1Day')}
        />
        <ToggleSwitch
          label="Notifications"
          checked={settings.notifications}
          onChange={() => handleToggle('notifications')}
        />
      </div>

      <OrangeButton onClick={handleSave}>
        Save Reminder Settings
      </OrangeButton>

      <Toast message="Settings saved!" visible={showToast} />
    </Layout>
  );
}