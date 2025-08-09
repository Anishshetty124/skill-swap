import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subscribeUserToPush } from '../../push-notifications';

const PushNotificationManager = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      subscribeUserToPush();
    }
  }, [isAuthenticated]);

  return null; 
};

export default PushNotificationManager;