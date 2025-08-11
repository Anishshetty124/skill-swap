import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';

const AuthSuccessPage = () => {
  const { setTokenAndUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      setTokenAndUser(token);
      navigate('/');
    } else {
      navigate('/login');
    }
  }, [location, navigate, setTokenAndUser]);

  return <Spinner text="Finalizing your login..." />;
};

export default AuthSuccessPage;