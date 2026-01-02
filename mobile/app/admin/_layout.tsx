import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout() {
  const { user } = useAuth();

  // Only administrators can access admin screens
  if (user?.role !== 'administrator') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="select-school"
        options={{
          title: 'Select School',
          headerStyle: {
            backgroundColor: '#1a56db',
          },
          headerTintColor: '#ffffff',
        }}
      />
    </Stack>
  );
}
