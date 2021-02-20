import React, {createContext, useCallback, useContext, useState} from 'react';
import api from '../services/api'

interface User {
  id: string;
  name: string;
  avatar_url: string;
  email: string;
}

interface AuthState {
  token: string;
  user: User;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthContextData {
  user: User;
  signIn(credentials: SignInCredentials): Promise<void>;
  signOut(): void;
  updateUser(user: User): void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const AuthProvider: React.FC = ({children}) => {
  const [data, setData] = useState<AuthState>(() => {
    const token = localStorage.getItem('@LigPop:token')
    const user = localStorage.getItem('@LigPop:user')

    if (token && user) {
      api.defaults.headers.authorization = `Bearer ${token}`;
      return {token, user: JSON.parse(user)}
    }
    return { } as AuthState
  })

  const signIn = useCallback(async ({email, password}: SignInCredentials) => {
    const response = await api.post<{token: string, user: User}>('sessions', {
      email,
      password
    })
    const { token, user } = response.data;
    localStorage.setItem('@LigPop:token', token)
    localStorage.setItem('@LigPop:user', JSON.stringify(user))

    api.defaults.headers.authorization = `Bearer ${token}`;

    setData({token, user});
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem('@LigPop:token');
    localStorage.removeItem('@LigPop:user');

    setData({} as AuthState);
  }, [])

  const updateUser = useCallback((user: User) => {
    localStorage.setItem('@LigPop:user', JSON.stringify(user))
    setData({
      token: data.token,
      user
    })
  }, [setData, data.token]);

  return (
    <AuthContext.Provider value={{user: data.user, signIn, signOut, updateUser}}>
      {children}
    </AuthContext.Provider>
  )
}

function useAuth(): AuthContextData {
  const context = useContext(AuthContext)
  if(!context) throw new Error('useAuth must be used within a AuthProvider');
  return context
}

export { AuthProvider, useAuth };
